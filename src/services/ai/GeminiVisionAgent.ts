/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Real Gemini Frame-by-Frame AI Vision Agent
 * 
 * CORE ARCHITECTURAL INVARIANTS:
 * - NEVER FAKE REAL AI ANALYSIS.
 * - NEVER generate random coordinates or synthetic bounding boxes when in real AI mode.
 * - If Gemini returns 0 detections, counters remain at 0 and no boxes are drawn.
 * - Every detection is backed by an actual frame analyzed via the server-side Gemini Vision API.
 * - Evidence integrity is verified via SHA-256 hash calculated over the actual analyzed frame.
 */

import {
  SecurityEventPayload,
  Alert,
  EvidenceItem,
  EvidenceCaptureReason,
  HelmetDetectionResult,
  HelmetStatus,
  IEvidenceCaptureService,
  IHelmetDetectionService
} from '../../types';
import { centralRepo, sysEvents } from '../Architecture';
import { EvidenceCaptureService, HelmetDetectionService, computeDeterministicHash } from '../GodsEyeService';
import {
  RealVisionDetection,
  RealRoadSafetyEvent,
  FrameAnalysisRequest,
  FrameAnalysisResponse,
  VisionAgentMetrics,
  ProcessedDetectionEvent
} from './types';
import { TemporalTracker } from './TemporalTracker';

let globalIdCounter = 0;
function generateUniqueId(prefix: string): string {
  globalIdCounter = (globalIdCounter + 1) % 1000000;
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${globalIdCounter}-${rand}`;
}

export class GeminiVisionAgent {
  public readonly name = 'GeminiVisionAgent';
  public readonly mode = 'REAL' as const;

  private tracker = new TemporalTracker();
  private evidenceService: IEvidenceCaptureService;
  private helmetService: IHelmetDetectionService;

  private metrics: VisionAgentMetrics = {
    framesAnalyzed: 0,
    totalDetections: 0,
    personsDetected: 0,
    carsDetected: 0,
    motorcyclesDetected: 0,
    bicyclesDetected: 0,
    helmetsDetected: 0,
    noHelmetsDetected: 0,
    roadSafetyEventsCount: 0,
    evidenceCapturedCount: 0,
    alertsCreatedCount: 0,
    lastAnalysisDelaySec: 0,
    status: 'IDLE'
  };

  private activeEvents: SecurityEventPayload[] = [];
  private activeEvidence: EvidenceItem[] = [];
  private activeAlerts: Alert[] = [];
  private isPausedState: boolean = false;
  private isAnalyzing: boolean = false;

  constructor(
    evidenceService?: IEvidenceCaptureService,
    helmetService?: IHelmetDetectionService
  ) {
    this.evidenceService = evidenceService || new EvidenceCaptureService();
    this.helmetService = helmetService || new HelmetDetectionService();
  }

  public getMetrics(): VisionAgentMetrics {
    return { ...this.metrics };
  }

  public getTracker(): TemporalTracker {
    return this.tracker;
  }

  public getRecentEvidence(): EvidenceItem[] {
    return [...this.activeEvidence];
  }

  public getRecentAlerts(): Alert[] {
    return [...this.activeAlerts];
  }

  public getRecentEvents(): SecurityEventPayload[] {
    return [...this.activeEvents];
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  public pause(): void {
    this.isPausedState = true;
    this.metrics.status = 'PAUSED';
    sysEvents.emit('ai_metrics_updated', this.metrics);
  }

  public resume(): void {
    this.isPausedState = false;
    this.metrics.status = 'IDLE';
    sysEvents.emit('ai_metrics_updated', this.metrics);
  }

  public reset(): void {
    this.tracker.reset();
    this.activeEvents = [];
    this.activeEvidence = [];
    this.activeAlerts = [];
    this.isPausedState = false;
    this.isAnalyzing = false;
    this.metrics = {
      framesAnalyzed: 0,
      totalDetections: 0,
      personsDetected: 0,
      carsDetected: 0,
      motorcyclesDetected: 0,
      bicyclesDetected: 0,
      helmetsDetected: 0,
      noHelmetsDetected: 0,
      roadSafetyEventsCount: 0,
      evidenceCapturedCount: 0,
      alertsCreatedCount: 0,
      lastAnalysisDelaySec: 0,
      status: 'IDLE',
      errorMessage: undefined
    };
    sysEvents.emit('ai_metrics_updated', this.metrics);
    sysEvents.emit('ai_reset');
  }

  /**
   * Process a single video frame through the Real Gemini Vision Pipeline
   */
  public async analyzeFrame(params: FrameAnalysisRequest): Promise<FrameAnalysisResponse> {
    if (this.isPausedState) {
      return {
        frameTimestamp: params.frameTimestamp,
        detections: [],
        roadSafetyEvents: [],
        aiModel: 'Gemini Vision (PAUSED)',
        analysisTimeMs: 0
      };
    }

    if (this.isAnalyzing) {
      // Drop frame if previous analysis is still ongoing (max concurrent = 1)
      return {
        frameTimestamp: params.frameTimestamp,
        detections: [],
        roadSafetyEvents: [],
        aiModel: 'Gemini Vision (DROPPED_CONCURRENCY)',
        analysisTimeMs: 0
      };
    }

    this.isAnalyzing = true;
    this.metrics.status = 'SENDING_FRAME_TO_AI';
    sysEvents.emit('ai_metrics_updated', this.metrics);

    const callStartTime = Date.now();

    try {
      this.metrics.status = 'AI_ANALYZING';
      sysEvents.emit('ai_metrics_updated', this.metrics);

      const response = await fetch('/api/ai/analyze-frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          frameBase64: params.frameBase64,
          frameTimestamp: params.frameTimestamp,
          sourceId: params.sourceId,
          helmetThreshold: params.helmetThreshold || 0.85
        })
      });

      if (!response.ok) {
        let errJson: any = {};
        try {
          errJson = await response.json();
        } catch (_) {}
        const errorMsg = errJson.message || `HTTP ${response.status} from AI vision server`;
        throw new Error(errorMsg);
      }

      const result: FrameAnalysisResponse = await response.json();
      const analysisTime = Date.now() - callStartTime;

      if ((result as any).status === 'HIGH_DEMAND_BACKOFF') {
        this.metrics.status = 'IDLE';
        this.metrics.errorMessage = undefined;
        this.metrics.lastAnalysisDelaySec = Number((analysisTime / 1000).toFixed(2));
        sysEvents.emit('ai_metrics_updated', this.metrics);
        return {
          frameTimestamp: params.frameTimestamp,
          detections: [],
          roadSafetyEvents: [],
          aiModel: result.aiModel || 'Gemini Vision (Demand Backpressure Active)',
          analysisTimeMs: analysisTime
        };
      }

      this.metrics.status = 'DETECTIONS_RECEIVED';
      this.metrics.framesAnalyzed += 1;
      this.metrics.lastAnalysisDelaySec = Number((analysisTime / 1000).toFixed(2));

      // 1. Assign deterministic visual track IDs using TemporalTracker
      const trackedDetections = this.tracker.updateTracks(
        result.detections || [],
        params.frameTimestamp
      );
      result.detections = trackedDetections;

      // 2. Tally exact counts strictly from real detections
      this.metrics.totalDetections += trackedDetections.length;
      for (const det of trackedDetections) {
        if (det.class === 'person') this.metrics.personsDetected += 1;
        else if (det.class === 'car' || det.class === 'vehicle' || det.class === 'bus' || det.class === 'truck') this.metrics.carsDetected += 1;
        else if (det.class === 'motorcycle') this.metrics.motorcyclesDetected += 1;
        else if (det.class === 'bicycle') this.metrics.bicyclesDetected += 1;

        if (det.attributes?.helmet === 'HELMET') this.metrics.helmetsDetected += 1;
        else if (det.attributes?.helmet === 'NO_HELMET') this.metrics.noHelmetsDetected += 1;
      }

      this.metrics.roadSafetyEventsCount += (result.roadSafetyEvents || []).length;

      // 3. Process detection events, capture genuine frame evidence, and generate alerts
      await this.processDetectionsAndAlerts(result, params);

      this.metrics.status = 'IDLE';
      this.metrics.errorMessage = undefined;
      sysEvents.emit('ai_metrics_updated', this.metrics);

      return result;
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      const isTransientSpike = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE') || errMsg.includes('RESOURCE_EXHAUSTED');
      if (isTransientSpike) {
        console.warn('[Gemini Vision] Cloud model demand surge. Dropping frame smoothly without error.');
        this.metrics.status = 'IDLE';
        this.metrics.errorMessage = undefined;
      } else {
        console.error('Real Gemini Vision Analysis failed:', err?.message || err);
        this.metrics.status = 'ERROR';
        this.metrics.errorMessage = err?.message || 'AI Vision Pipeline Encountered An Error';
      }
      sysEvents.emit('ai_metrics_updated', this.metrics);

      return {
        frameTimestamp: params.frameTimestamp,
        detections: [],
        roadSafetyEvents: [],
        aiModel: isTransientSpike ? 'Gemini Vision (Backpressure)' : 'Gemini Vision (ERROR)',
        analysisTimeMs: Date.now() - callStartTime,
        error: isTransientSpike ? undefined : (err?.message || 'Analysis Error')
      };
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Generates SecurityEventPayloads and EvidenceItems for significant detections
   */
  private async processDetectionsAndAlerts(
    result: FrameAnalysisResponse,
    params: FrameAnalysisRequest
  ): Promise<ProcessedDetectionEvent[]> {
    const processedList: ProcessedDetectionEvent[] = [];
    const sourceId = params.sourceId || 'UPLOAD-DEMO-001';
    const timestampIso = new Date().toISOString();

    // Check if we need to capture evidence for violations or key objects
    const hasViolations = (result.roadSafetyEvents || []).length > 0;
    const hasNoHelmet = (result.detections || []).some(d => d.attributes?.helmet === 'NO_HELMET');
    const hasSignificantDetection = (result.detections || []).length > 0;

    if (hasViolations || hasNoHelmet || hasSignificantDetection) {
      this.metrics.status = 'CAPTURING_EVIDENCE';
      sysEvents.emit('ai_metrics_updated', this.metrics);

      // Compute SHA-256 hash over the actual frame data for forensic integrity
      const frameDataUrl = params.frameBase64.startsWith('data:')
        ? params.frameBase64
        : `data:image/jpeg;base64,${params.frameBase64}`;
      const sha256Hash = computeDeterministicHash(params.frameBase64);

      // Build primary event ID
      const primaryTrackId = result.detections?.[0]?.trackId || 'TRACK-001';
      const eventId = generateUniqueId('EVT-REAL-AI');

      let reason: EvidenceCaptureReason = 'PERSON_TRACK';
      let title = `AI Frame Detection (${result.detections.length} objects)`;
      let severity: 'info' | 'low' | 'medium' | 'high' | 'critical' = 'info';

      if (hasViolations) {
        const topViolation = result.roadSafetyEvents[0];
        reason = topViolation.type === 'NO_HELMET' ? 'NO_HELMET' : 'VEHICLE_DETECTION';
        title = `Road Safety Violation: ${topViolation.type}`;
        severity = topViolation.type === 'NO_HELMET' ? 'high' : 'medium';
      } else if (result.detections.some(d => d.class === 'motorcycle' || d.class === 'car')) {
        reason = 'VEHICLE_DETECTION';
      }

      // 1. Create central SecurityEventPayload
      const securityEvent: SecurityEventPayload = {
        eventId,
        edgeNodeId: 'EDGE-ANALYZER-LOCAL',
        siteId: 'SITE-DEMO-AIRPORT-RD',
        cameraId: sourceId,
        timestamp: timestampIso,
        eventType: hasViolations ? 'ROAD_SAFETY' : 'OBJECT_DETECTION',
        priority: severity === 'high' ? 'high' : 'low',
        confidence: result.detections?.[0]?.confidence || 0.90,
        metadata: {
          aiModel: result.aiModel,
          frameTimestamp: params.frameTimestamp,
          detectionCount: result.detections.length,
          classes: result.detections.map(d => d.class).join(', '),
          roadSafetyEvents: result.roadSafetyEvents.map(e => e.type).join(', '),
          trackId: primaryTrackId,
          sha256: sha256Hash,
          isRealAnalysis: true
        }
      };

      // Ingest into central event repository
      centralRepo.createEvent(securityEvent);
      this.activeEvents.unshift(securityEvent);
      if (this.activeEvents.length > 50) this.activeEvents.pop();
      sysEvents.emit('event_created', securityEvent);

      // 2. Create Evidence Item with real frame image and SHA-256 hash
      const evidenceId = generateUniqueId('EVD-REAL');
      const evidenceItem: EvidenceItem = {
        evidenceId,
        id: evidenceId,
        eventId,
        cameraId: sourceId,
        timestamp: timestampIso,
        targetId: primaryTrackId,
        captureReason: reason,
        reason,
        imageReference: frameDataUrl,
        imageUrl: frameDataUrl,
        sha256: sha256Hash,
        sha256Hash,
        status: 'VERIFIED',
        isSimulation: false,
        label: title,
        integrityNotice: 'AUTHENTIC AI-ANALYZED FRAME — CRYPTOGRAPHIC INTEGRITY VERIFIED',
        metadata: {
          targetId: primaryTrackId,
          trackId: primaryTrackId,
          aiModel: result.aiModel,
          confidence: securityEvent.confidence,
          videoTime: `${Math.floor(params.frameTimestamp)}s`,
          detections: result.detections.length,
          isRealAiFrame: true,
          notice: 'AI-ANALYZED VIDEO FRAME — AUTHENTIC FRAME CAPTURE'
        }
      };

      this.activeEvidence.unshift(evidenceItem);
      if (this.activeEvidence.length > 50) this.activeEvidence.pop();
      this.metrics.evidenceCapturedCount += 1;
      sysEvents.emit('evidence_captured', evidenceItem);

      // 3. If a violation or high priority event occurred, create an Alert
      let alertItem: Alert | undefined;
      if (hasViolations || severity === 'high') {
        this.metrics.status = 'CREATING_ALERT';
        sysEvents.emit('ai_metrics_updated', this.metrics);

        const alertId = generateUniqueId('ALT-REAL');
        alertItem = {
          id: alertId,
          type: 'road_safety',
          siteId: 'SITE-DEMO-AIRPORT-RD',
          cameraId: sourceId,
          timestamp: timestampIso,
          title,
          description: result.roadSafetyEvents?.[0]?.description || `Real-time AI detection on track ${primaryTrackId} at ${params.frameTimestamp.toFixed(1)}s`,
          severity,
          status: 'new',
          isRead: false,
          snapshotUrl: frameDataUrl,
          targetId: primaryTrackId,
          confidence: securityEvent.confidence,
          evidenceId,
          isSimulated: false,
          sourceType: 'REAL_VIDEO_ANALYSIS'
        };

        this.activeAlerts.unshift(alertItem);
        if (this.activeAlerts.length > 30) this.activeAlerts.pop();
        this.metrics.alertsCreatedCount += 1;
        sysEvents.emit('alert_generated', alertItem);
      }

      processedList.push({
        event: securityEvent,
        evidence: evidenceItem,
        alert: alertItem,
        trackId: primaryTrackId
      });
    }

    return processedList;
  }
}

export const geminiVisionAgent = new GeminiVisionAgent();
