/**
 * Sentinel AI Frame Dispatcher
 * Gujarat Police CCTV & AI Intelligence Platform (SENTINEL GRID)
 *
 * Responsibilities:
 * - Centralized AI gatekeeper: YOLOv8 produces cheap continuous perception;
 *   ONLY selected high-value frames reach expensive Google AI verification.
 * - Prioritized bounded queue: P0 (Investigation) to P4 (Scene observation).
 * - Active backpressure: Drops stale, low-priority frames under load to prevent memory leaks.
 * - Concurrency bounded (max 2-3 concurrent calls).
 * - Request deduplication (trackId + frameSha256).
 * - Hard request timeout (6000ms) prevents pipeline stalling.
 * - Truthful failure reporting (AI_UNAVAILABLE, AI_TIMEOUT, PLATE_NOT_READABLE).
 * - Server-side only Google AI integration (@google/genai).
 * - Exposes cost-control and throughput telemetry.
 */

import crypto from 'node:crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { isGeminiApiKeyValid } from '../../geminiAuth.js';
import { CandidateFrame } from './IntelligentFrameSelector.js';
import { BoundingBox } from '../visionTypes.js';

export type DispatchPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface DispatchJob {
  id: string;
  priority: DispatchPriority;
  candidateFrame: CandidateFrame;
  cameraId: string;
  trackId: string;
  vehicleClass: string;
  frameTimestamp: number;
  frameSha256: string;
  plateCropBuffer?: Buffer;
  plateCropSha256?: string;
  enqueuedAt: number;
  retryCount: number;
  resolve: (result: AIPlateVerificationResult) => void;
  reject: (err: any) => void;
}

export interface AIPlateVerificationResult {
  jobId: string;
  cameraId: string;
  trackId: string;
  frameTimestamp: number;
  frameSha256: string;
  status: 
    | 'PLATE_READABLE' 
    | 'PLATE_NOT_READABLE' 
    | 'PLATE_UNCERTAIN' 
    | 'AI_UNAVAILABLE' 
    | 'AI_TIMEOUT'
    | 'AI_ERROR';
  plateText: string | null;
  normalizedPlateText: string | null;
  confidence: number | null;
  vehicleType: string;
  plateVisible: boolean;
  reason: string | null;
  provider: 'google_ai_gemini' | 'rule_fallback' | 'none';
  model: string;
  latencyMs: number;
  truthState: 'OBSERVED' | 'INFERRED' | 'PREDICTED' | 'UNCERTAIN' | 'NOT_AVAILABLE';
}

export interface DispatcherMetrics {
  framesCaptured: number;
  framesProcessedYolo: number;
  vehiclesDetected: number;
  candidateHsrpFrames: number;
  framesSelected: number;
  aiRequestsSubmitted: number;
  aiRequestsAvoided: number;
  aiVerificationSuccess: number;
  aiVerificationFailure: number;
  averageAiLatencyMs: number;
  maxAiLatencyMs: number;
  queueDepth: number;
  maxQueueCapacity: number;
  droppedStaleFrames: number;
  concurrencyLimit: number;
  activeRequests: number;
  providerStatus: 'ONLINE' | 'UNAVAILABLE' | 'RATE_LIMITED';
  activeModel: string;
}

export class SentinelAIFrameDispatcher {
  private static instance: SentinelAIFrameDispatcher;

  private queue: DispatchJob[] = [];
  private activeJobs = new Set<string>();
  private readonly maxConcurrency = 2;
  private readonly maxQueueCapacity = 25;
  private readonly requestTimeoutMs = 6000;
  private readonly maxRetries = 1;

  // Deduplication cache: trackId:frameSha256 -> { result, timestamp }
  private deduplicationCache = new Map<string, { result: AIPlateVerificationResult; timestamp: number }>();
  private readonly deduplicationTtlMs = 60000; // 60s cache

  // Telemetry & Cost Control Metrics
  private metrics: DispatcherMetrics = {
    framesCaptured: 0,
    framesProcessedYolo: 0,
    vehiclesDetected: 0,
    candidateHsrpFrames: 0,
    framesSelected: 0,
    aiRequestsSubmitted: 0,
    aiRequestsAvoided: 0,
    aiVerificationSuccess: 0,
    aiVerificationFailure: 0,
    averageAiLatencyMs: 0,
    maxAiLatencyMs: 0,
    queueDepth: 0,
    maxQueueCapacity: 25,
    droppedStaleFrames: 0,
    concurrencyLimit: 2,
    activeRequests: 0,
    providerStatus: 'ONLINE',
    activeModel: 'gemini-3.8-flash'
  };

  private totalLatencyAccumulator = 0;
  private latencySamplesCount = 0;

  public static getInstance(): SentinelAIFrameDispatcher {
    if (!SentinelAIFrameDispatcher.instance) {
      SentinelAIFrameDispatcher.instance = new SentinelAIFrameDispatcher();
    }
    return SentinelAIFrameDispatcher.instance;
  }

  private constructor() {
    // Periodic cleanup of deduplication cache
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of this.deduplicationCache.entries()) {
        if (now - val.timestamp > this.deduplicationTtlMs) {
          this.deduplicationCache.delete(key);
        }
      }
    }, 30000).unref();
  }

  /**
   * Records initial counts from YOLO perception layer for cost-control ratios.
   */
  public recordPerceptionMetrics(captured = 1, yoloProcessed = 1, vehicles = 0, candidates = 0): void {
    this.metrics.framesCaptured += captured;
    this.metrics.framesProcessedYolo += yoloProcessed;
    this.metrics.vehiclesDetected += vehicles;
    this.metrics.candidateHsrpFrames += candidates;
  }

  /**
   * Submits a high-value candidate frame for Google AI verification.
   */
  public async submitFrameForVerification(
    candidate: CandidateFrame,
    priority: DispatchPriority = 'P1'
  ): Promise<AIPlateVerificationResult> {
    this.metrics.framesSelected++;

    // Check deduplication key: prevent re-analyzing the same track/frame
    const dedupKey = `${candidate.trackId}:${candidate.frameSha256}`;
    const cached = this.deduplicationCache.get(dedupKey);
    if (cached) {
      this.metrics.aiRequestsAvoided++;
      return cached.result;
    }

    return new Promise<AIPlateVerificationResult>((resolve, reject) => {
      const jobId = `DISP-${candidate.cameraId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const job: DispatchJob = {
        id: jobId,
        priority,
        candidateFrame: candidate,
        cameraId: candidate.cameraId,
        trackId: candidate.trackId,
        vehicleClass: candidate.vehicleClass,
        frameTimestamp: candidate.frameTimestamp,
        frameSha256: candidate.frameSha256,
        plateCropBuffer: candidate.plateCropBuffer,
        plateCropSha256: candidate.plateCropSha256,
        enqueuedAt: Date.now(),
        retryCount: 0,
        resolve,
        reject
      };

      this.enqueueJob(job);
    });
  }

  /**
   * Enqueues job with priority sorting and backpressure dropping of stale low-priority frames.
   */
  private enqueueJob(job: DispatchJob): void {
    if (this.queue.length >= this.maxQueueCapacity) {
      // Active backpressure: Drop oldest P4 or P3 job to make room for P0/P1/P2
      const dropIndex = this.findDroppableJobIndex();
      if (dropIndex !== -1 && this.getPriorityRank(job.priority) < this.getPriorityRank(this.queue[dropIndex].priority)) {
        const dropped = this.queue.splice(dropIndex, 1)[0];
        this.metrics.droppedStaleFrames++;
        dropped.resolve({
          jobId: dropped.id,
          cameraId: dropped.cameraId,
          trackId: dropped.trackId,
          frameTimestamp: dropped.frameTimestamp,
          frameSha256: dropped.frameSha256,
          status: 'PLATE_NOT_READABLE',
          plateText: null,
          normalizedPlateText: null,
          confidence: null,
          vehicleType: dropped.vehicleClass,
          plateVisible: false,
          reason: 'Dropped by AI Dispatcher backpressure under heavy traffic load.',
          provider: 'none',
          model: 'none',
          latencyMs: 0,
          truthState: 'NOT_AVAILABLE'
        });
      } else {
        // Queue is strictly saturated with higher or equal priority
        this.metrics.droppedStaleFrames++;
        job.resolve({
          jobId: job.id,
          cameraId: job.cameraId,
          trackId: job.trackId,
          frameTimestamp: job.frameTimestamp,
          frameSha256: job.frameSha256,
          status: 'PLATE_NOT_READABLE',
          plateText: null,
          normalizedPlateText: null,
          confidence: null,
          vehicleType: job.vehicleClass,
          plateVisible: false,
          reason: 'Queue capacity reached; low-priority candidate shed.',
          provider: 'none',
          model: 'none',
          latencyMs: 0,
          truthState: 'NOT_AVAILABLE'
        });
        return;
      }
    }

    this.queue.push(job);
    // Sort queue by priority ascending rank (P0 highest, P4 lowest)
    this.queue.sort((a, b) => this.getPriorityRank(a.priority) - this.getPriorityRank(b.priority));
    this.metrics.queueDepth = this.queue.length;

    this.processNext();
  }

  private findDroppableJobIndex(): number {
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].priority === 'P4' || this.queue[i].priority === 'P3') {
        return i;
      }
    }
    return -1;
  }

  private getPriorityRank(p: DispatchPriority): number {
    switch (p) {
      case 'P0': return 0;
      case 'P1': return 1;
      case 'P2': return 2;
      case 'P3': return 3;
      case 'P4': return 4;
      default: return 5;
    }
  }

  private processNext(): void {
    if (this.activeJobs.size >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift()!;
    this.metrics.queueDepth = this.queue.length;
    this.activeJobs.add(job.id);
    this.metrics.activeRequests = this.activeJobs.size;

    this.executeJob(job)
      .then(result => {
        // Cache result for deduplication
        const dedupKey = `${job.trackId}:${job.frameSha256}`;
        this.deduplicationCache.set(dedupKey, { result, timestamp: Date.now() });

        if (result.status === 'PLATE_READABLE') {
          this.metrics.aiVerificationSuccess++;
        } else {
          this.metrics.aiVerificationFailure++;
        }

        job.resolve(result);
      })
      .catch(err => {
        this.metrics.aiVerificationFailure++;
        job.resolve({
          jobId: job.id,
          cameraId: job.cameraId,
          trackId: job.trackId,
          frameTimestamp: job.frameTimestamp,
          frameSha256: job.frameSha256,
          status: 'AI_ERROR',
          plateText: null,
          normalizedPlateText: null,
          confidence: null,
          vehicleType: job.vehicleClass,
          plateVisible: false,
          reason: err?.message || 'Unexpected dispatch error',
          provider: 'none',
          model: 'none',
          latencyMs: 0,
          truthState: 'NOT_AVAILABLE'
        });
      })
      .finally(() => {
        this.activeJobs.delete(job.id);
        this.metrics.activeRequests = this.activeJobs.size;
        this.processNext();
      });
  }

  /**
   * Executes the AI call using server-side Google GenAI (gemini-3.8-flash) with hard timeout.
   */
  private async executeJob(job: DispatchJob): Promise<AIPlateVerificationResult> {
    const startTime = Date.now();
    this.metrics.aiRequestsSubmitted++;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !isGeminiApiKeyValid(apiKey)) {
      this.metrics.providerStatus = 'UNAVAILABLE';
      return {
        jobId: job.id,
        cameraId: job.cameraId,
        trackId: job.trackId,
        frameTimestamp: job.frameTimestamp,
        frameSha256: job.frameSha256,
        status: 'AI_UNAVAILABLE',
        plateText: null,
        normalizedPlateText: null,
        confidence: null,
        vehicleType: job.vehicleClass,
        plateVisible: job.candidateFrame.plateRegionVisible,
        reason: 'Google AI API key is not configured or authenticated in server environment.',
        provider: 'none',
        model: 'none',
        latencyMs: 1,
        truthState: 'NOT_AVAILABLE'
      };
    }

    // Determine target image buffer: Prefer plate crop if available, otherwise full frame
    const imageBuffer = (job.plateCropBuffer && job.plateCropBuffer.length > 0)
      ? job.plateCropBuffer
      : job.candidateFrame.frameBuffer;

    if (!imageBuffer || imageBuffer.length === 0) {
      return {
        jobId: job.id,
        cameraId: job.cameraId,
        trackId: job.trackId,
        frameTimestamp: job.frameTimestamp,
        frameSha256: job.frameSha256,
        status: 'PLATE_NOT_READABLE',
        plateText: null,
        normalizedPlateText: null,
        confidence: null,
        vehicleType: job.vehicleClass,
        plateVisible: false,
        reason: 'Empty image buffer provided to dispatcher.',
        provider: 'none',
        model: 'none',
        latencyMs: 1,
        truthState: 'NOT_AVAILABLE'
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const imageBase64 = imageBuffer.toString('base64');
    const isCrop = (job.plateCropBuffer && job.plateCropBuffer.length > 0);

    const prompt = `You are a forensic Computer Vision and Optical Character Recognition (OCR) AI agent for Gujarat Police.
Analyze this ${isCrop ? 'cropped license plate image' : 'vehicle image frame'} from CCTV camera ${job.cameraId}.
Vehicle track: ${job.trackId}, detected class: ${job.vehicleClass}.

Mandatory Instructions:
1. Examine if an Indian registration plate (HSRP) is visible.
2. Read ONLY the characters visibly present on the registration plate.
3. Indian registration pattern: 2 State letters (e.g., GJ, MH, DL), 2 RTO digits, optional 1-3 series letters, and 4 registration digits (e.g., GJ01AB1234).
4. NEVER guess, hallucinate, extrapolate, or invent missing characters.
5. If characters are blurry, obscured, dark, or illegible, set plateReadable=false and plateText=null.
6. Return structured JSON matching the schema.`;

    const modelName = 'gemini-3.8-flash';

    // Race AI call against timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI_TIMEOUT')), this.requestTimeoutMs);
    });

    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                plateVisible: { type: Type.BOOLEAN },
                plateReadable: { type: Type.BOOLEAN },
                plateText: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                vehicleType: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ['plateVisible', 'plateReadable', 'confidence']
            }
          }
        }),
        timeoutPromise
      ]);

      const latencyMs = Date.now() - startTime;
      this.updateLatencyMetrics(latencyMs);

      const responseText = response.text?.trim();
      let parsed: any = null;
      try {
        parsed = responseText ? JSON.parse(responseText) : null;
      } catch {
        parsed = null;
      }

      if (!parsed) {
        return {
          jobId: job.id,
          cameraId: job.cameraId,
          trackId: job.trackId,
          frameTimestamp: job.frameTimestamp,
          frameSha256: job.frameSha256,
          status: 'PLATE_NOT_READABLE',
          plateText: null,
          normalizedPlateText: null,
          confidence: null,
          vehicleType: job.vehicleClass,
          plateVisible: false,
          reason: 'Model output could not be parsed as valid JSON.',
          provider: 'google_ai_gemini',
          model: modelName,
          latencyMs,
          truthState: 'NOT_AVAILABLE'
        };
      }

      const plateVisible = Boolean(parsed.plateVisible);
      const plateReadable = Boolean(parsed.plateReadable);
      const rawText = parsed.plateText ? String(parsed.plateText).trim().toUpperCase() : null;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;

      if (plateReadable && rawText && rawText.length >= 4) {
        const cleaned = rawText.replace(/[^A-Z0-9]/g, '');
        return {
          jobId: job.id,
          cameraId: job.cameraId,
          trackId: job.trackId,
          frameTimestamp: job.frameTimestamp,
          frameSha256: job.frameSha256,
          status: 'PLATE_READABLE',
          plateText: rawText,
          normalizedPlateText: cleaned,
          confidence: Number(confidence.toFixed(3)),
          vehicleType: parsed.vehicleType || job.vehicleClass,
          plateVisible: true,
          reason: null,
          provider: 'google_ai_gemini',
          model: modelName,
          latencyMs,
          truthState: 'OBSERVED'
        };
      } else {
        return {
          jobId: job.id,
          cameraId: job.cameraId,
          trackId: job.trackId,
          frameTimestamp: job.frameTimestamp,
          frameSha256: job.frameSha256,
          status: 'PLATE_NOT_READABLE',
          plateText: null,
          normalizedPlateText: null,
          confidence: Number(confidence.toFixed(3)) || null,
          vehicleType: parsed.vehicleType || job.vehicleClass,
          plateVisible,
          reason: parsed.reason || 'Plate characters obscured or illegible.',
          provider: 'google_ai_gemini',
          model: modelName,
          latencyMs,
          truthState: 'OBSERVED'
        };
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      if (error?.message === 'AI_TIMEOUT') {
        return {
          jobId: job.id,
          cameraId: job.cameraId,
          trackId: job.trackId,
          frameTimestamp: job.frameTimestamp,
          frameSha256: job.frameSha256,
          status: 'AI_TIMEOUT',
          plateText: null,
          normalizedPlateText: null,
          confidence: null,
          vehicleType: job.vehicleClass,
          plateVisible: job.candidateFrame.plateRegionVisible,
          reason: `AI model call timed out after ${this.requestTimeoutMs}ms.`,
          provider: 'google_ai_gemini',
          model: modelName,
          latencyMs,
          truthState: 'NOT_AVAILABLE'
        };
      }

      // Check for rate limiting / quota
      if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        this.metrics.providerStatus = 'RATE_LIMITED';
      }

      return {
        jobId: job.id,
        cameraId: job.cameraId,
        trackId: job.trackId,
        frameTimestamp: job.frameTimestamp,
        frameSha256: job.frameSha256,
        status: 'AI_ERROR',
        plateText: null,
        normalizedPlateText: null,
        confidence: null,
        vehicleType: job.vehicleClass,
        plateVisible: job.candidateFrame.plateRegionVisible,
        reason: error?.message || 'Unknown provider error',
        provider: 'google_ai_gemini',
        model: modelName,
        latencyMs,
        truthState: 'NOT_AVAILABLE'
      };
    }
  }

  private updateLatencyMetrics(latencyMs: number): void {
    this.totalLatencyAccumulator += latencyMs;
    this.latencySamplesCount++;
    this.metrics.averageAiLatencyMs = Math.round(this.totalLatencyAccumulator / this.latencySamplesCount);
    if (latencyMs > this.metrics.maxAiLatencyMs) {
      this.metrics.maxAiLatencyMs = latencyMs;
    }
  }

  public getMetrics(): DispatcherMetrics {
    return { ...this.metrics };
  }
}

export const sentinelAIFrameDispatcher = SentinelAIFrameDispatcher.getInstance();
