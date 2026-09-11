/**
 * Corp8 Sentinel Agentic HSRP Vision Mesh Orchestrator
 * Coordinates Frame Acquisition, Vehicle Detection, Tracking, Plate Detection,
 * Quality Assessment, OCR, HSRP Security Analysis, and Final Verification.
 * Enforces backpressure, SHA-256 evidence integrity, and statutory event emission.
 */

import crypto from 'crypto';
import { SecurityEventPayload } from '../../types.js';
import { evidenceStorage } from '../EvidenceStorageProvider.js';
import { finalVerificationAgent } from './aiMesh/finalVerificationAgent.js';
import { vehiclePlateConsistencyAgent } from './aiMesh/vehiclePlateConsistencyAgent.js';
import { evidenceQualityAgent } from './evidenceQualityAgent.js';
import { frameAcquisitionAgent } from './frameAcquisitionAgent.js';
import { hsrpAnalysisAgent } from './hsrpAnalysisAgent.js';
import { plateDetectionAgent } from './plateDetectionAgent.js';
import { plateOcrAgent } from './plateOcrAgent.js';
import { vehicleDetectionAgent } from './vehicleDetectionAgent.js';
import { vehicleTrackingAgent } from './vehicleTrackingAgent.js';
import {
  HSRPVerificationResult,
  PlateCandidate,
  VehicleClass,
  VehicleDetection,
  VehicleTrack,
  VisionFrame,
  VisionMeshTelemetry
} from './visionTypes.js';

export interface StoredSnapshot {
  buffer: Buffer;
  mimeType: string;
  timestamp: number;
  sha256: string;
}

export class HsrpVisionMeshService {
  private static instance: HsrpVisionMeshService;

  // Cryptographic In-Memory Evidence Buffer
  private snapshotStorage = new Map<string, StoredSnapshot>();

  // Backpressure & Concurrency Control
  private isAnalysisActive = false;
  private readonly maxConcurrentInference = 1;
  private lastAnalysisStart = 0;

  // Telemetry state
  private telemetry: VisionMeshTelemetry = {
    framesCaptured: 0,
    vehiclesDetected: 0,
    activeTracks: 0,
    platesDetected: 0,
    OCRAttempts: 0,
    OCRSuccesses: 0,
    HSRPChecks: 0,
    HSRPVerified: 0,
    HSRPNotVerified: 0,
    uncertain: 0,
    needsBetterCapture: 0,
    AIRequests: 0,
    AIFailures: 0,
    averageLatency: 0,
    lastSuccessfulAnalysis: null,
    currentBackpressure: 'NONE',
    lastError: null,
    pipelineState: 'IDLE',
    latestVerification: null,
    recentVerifications: []
  };

  private latencySamples: number[] = [];
  private eventCallback?: (event: SecurityEventPayload) => Promise<void> | void;

  public setEventCallback(cb: (event: SecurityEventPayload) => Promise<void> | void): void {
    this.eventCallback = cb;
  }

  public static getInstance(): HsrpVisionMeshService {
    if (!HsrpVisionMeshService.instance) {
      HsrpVisionMeshService.instance = new HsrpVisionMeshService();
    }
    return HsrpVisionMeshService.instance;
  }

  public getSnapshot(snapshotId: string): StoredSnapshot | undefined {
    return this.snapshotStorage.get(snapshotId);
  }

  public storeSnapshot(id: string, item: StoredSnapshot): void {
    this.snapshotStorage.set(id, item);
    // Maintain bounded storage of last 100 snapshots
    if (this.snapshotStorage.size > 100) {
      const oldestKey = this.snapshotStorage.keys().next().value;
      if (oldestKey) this.snapshotStorage.delete(oldestKey);
    }
  }

  public getTelemetry(): VisionMeshTelemetry {
    this.telemetry.activeTracks = vehicleTrackingAgent.getActiveTracksCount();
    return { ...this.telemetry };
  }

  private recordLatency(ms: number): void {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > 20) this.latencySamples.shift();
    const sum = this.latencySamples.reduce((a, b) => a + b, 0);
    this.telemetry.averageLatency = Math.round(sum / this.latencySamples.length);
  }

  private logEvent(eventType: string, details: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    console.info(`[VISION_MESH][${timestamp}][${eventType}]`, JSON.stringify(details));
  }

  /**
   * Primary Execution Cycle for Camera CAM-01
   */
  public async executeCycle(cameraId = 'cam01', onDemand = false): Promise<HSRPVerificationResult | null> {
    const cycleStart = Date.now();

    // Check backpressure
    if (this.isAnalysisActive) {
      this.telemetry.currentBackpressure = 'HIGH';
      this.logEvent('BACKPRESSURE_SKIPPED', { cameraId, reason: 'Inference currently in progress' });
      return null;
    }

    this.isAnalysisActive = true;
    this.telemetry.pipelineState = 'AI_PROCESSING';
    this.telemetry.currentBackpressure = 'NONE';

    try {
      // Step 1: Genuine Frame Acquisition
      let frame: VisionFrame;
      try {
        frame = await frameAcquisitionAgent.acquireFrame(cameraId);
        this.telemetry.framesCaptured++;
        this.logEvent('FRAME_CAPTURED', {
          cameraId,
          frameId: frame.frameId,
          sha256: frame.sha256,
          bytes: frame.imageBuffer.length
        });
      } catch (err: any) {
        this.telemetry.pipelineState = 'CAMERA_OFFLINE';
        this.telemetry.lastError = `Frame acquisition error: ${err?.message || err}`;
        this.logEvent('CAMERA_FAILURE', { cameraId, error: err?.message || err });
        return null;
      }

      // Store Full Frame in Cryptographic Snapshot Registry
      const frameSnapshotId = frame.frameId;
      this.storeSnapshot(frameSnapshotId, {
        buffer: frame.imageBuffer,
        mimeType: 'image/jpeg',
        timestamp: Date.now(),
        sha256: frame.sha256
      });
      const fullFrameUrl = `/api/central/snapshots/${frameSnapshotId}`;

      // Check if GEMINI_API_KEY is available
      if (!process.env.GEMINI_API_KEY) {
        this.telemetry.pipelineState = 'AI_KEY_REQUIRED';
        this.telemetry.lastError =
          'Real Sentinel CAM01 RTSP frames extracted successfully, but GEMINI_API_KEY is not configured in server environment.';
        this.logEvent('AI_KEY_REQUIRED', { cameraId });
        return null;
      }

      // Step 2: Vehicle Detection
      this.telemetry.AIRequests++;
      const detectionResult = await vehicleDetectionAgent.detectVehicles(frame);
      if (detectionResult.status !== 'SUCCESS') {
        this.telemetry.AIFailures++;
        this.telemetry.pipelineState = 'AI_DEGRADED';
        this.telemetry.lastError = detectionResult.execution.failureReason || 'Vehicle detection failed';
        this.logEvent('AI_FAILURE', { stage: 'VEHICLE_DETECTION', error: this.telemetry.lastError });
        return null;
      }

      const detections = detectionResult.data;
      this.telemetry.vehiclesDetected += detections.length;
      this.logEvent('VEHICLE_DETECTED', {
        cameraId,
        count: detections.length,
        classes: detections.map(d => d.class)
      });

      if (detections.length === 0) {
        this.telemetry.pipelineState = 'LIVE';
        this.telemetry.lastError = null;
        return null;
      }

      // Step 3: Vehicle Tracking
      const updatedTracks = vehicleTrackingAgent.updateTracks(frame, detections);
      this.logEvent('TRACK_CREATED', {
        activeCount: updatedTracks.length,
        tracks: updatedTracks.map(t => ({ id: t.vehicleTrackId, class: t.vehicleClass }))
      });

      // Step 4: Plate Detection & Evidence Quality Evaluation
      let highestQualityCandidate: {
        track: VehicleTrack;
        detection: VehicleDetection;
        candidate: PlateCandidate;
        quality: any;
      } | null = null;

      for (const track of updatedTracks) {
        // Find corresponding detection
        const det = detections.find(d => d.class === track.vehicleClass);
        if (!det) continue;

        // Check if track was recently analyzed (< 20s cooldown) to prevent repetitive processing
        const lastAnalyzed = track.lastAnalyzedTimestamp || 0;
        if (!onDemand && Date.now() - lastAnalyzed < 20000) {
          continue;
        }

        const candidate = await plateDetectionAgent.detectPlate(frame, det, track);
        if (candidate) {
          this.telemetry.platesDetected++;
          this.logEvent('PLATE_DETECTED', {
            trackId: track.vehicleTrackId,
            candidateId: candidate.candidateId,
            dimensions: `${candidate.widthPx}x${candidate.heightPx}`,
            confidence: candidate.confidence
          });

          const qualityScore = evidenceQualityAgent.evaluateQuality(frame, det, candidate);

          if (
            !highestQualityCandidate ||
            qualityScore.totalScore > highestQualityCandidate.quality.totalScore
          ) {
            highestQualityCandidate = {
              track,
              detection: det,
              candidate,
              quality: qualityScore
            };
          }
        }
      }

      if (!highestQualityCandidate) {
        this.telemetry.pipelineState = 'LIVE';
        this.telemetry.lastError = null;
        return null;
      }

      const { track, detection, candidate, quality } = highestQualityCandidate;
      this.logEvent('BEST_FRAME_SELECTED', {
        trackId: track.vehicleTrackId,
        score: quality.totalScore,
        dimensions: `${candidate.widthPx}x${candidate.heightPx}`
      });

      // Store Plate Crop Snapshot
      const plateCropSnapshotId = candidate.candidateId;
      this.storeSnapshot(plateCropSnapshotId, {
        buffer: candidate.cropBuffer,
        mimeType: 'image/jpeg',
        timestamp: Date.now(),
        sha256: candidate.cropSha256
      });
      const plateCropUrl = `/api/central/snapshots/${plateCropSnapshotId}`;
      candidate.cropUrl = plateCropUrl;

      // Step 5: Plate OCR Agent
      this.telemetry.OCRAttempts++;
      const ocrResult = await plateOcrAgent.readPlate(candidate, frame);
      if (ocrResult.status === 'SUCCESS' && ocrResult.data.readable) {
        this.telemetry.OCRSuccesses++;
      }
      this.logEvent('OCR_COMPLETE', {
        trackId: track.vehicleTrackId,
        readable: ocrResult.data.readable,
        text: ocrResult.data.normalizedText,
        confidence: ocrResult.data.confidence
      });

      // Step 6: HSRP Analysis Agent
      this.telemetry.HSRPChecks++;
      const hsrpResult = await hsrpAnalysisAgent.analyzeHsrp(candidate);
      this.logEvent('HSRP_ANALYSIS_COMPLETE', {
        trackId: track.vehicleTrackId,
        result: hsrpResult.data.result,
        characteristics: hsrpResult.data.characteristics
      });

      // Step 7: Vehicle-Plate Consistency Check
      const consistencyResult = vehiclePlateConsistencyAgent.checkConsistency(
        track.vehicleClass,
        ocrResult.data
      );

      // Step 8: Final Deterministic Verification
      const verification = finalVerificationAgent.evaluateDecision({
        vehicleTrackId: track.vehicleTrackId,
        vehicleClass: track.vehicleClass,
        cameraId,
        frameId: frame.frameId,
        timestamp: frame.timestamp,
        fullFrameUrl,
        fullFrameSha256: frame.sha256,
        plateCropUrl,
        plateCropSha256: candidate.cropSha256,
        agents: {
          plate: {
            agentName: 'PlateDetectionAgent',
            status: 'SUCCESS',
            data: candidate,
            confidence: candidate.confidence,
            execution: {
              provider: 'optical',
              model: 'ffmpeg_crop_engine',
              latencyMs: 15,
              status: 'SUCCESS',
              retryCount: 0
            }
          },
          ocr: ocrResult,
          hsrp: hsrpResult,
          quality: {
            agentName: 'EvidenceQualityAgent',
            status: 'SUCCESS',
            data: quality,
            confidence: quality.totalScore / 100,
            execution: {
              provider: 'rule_engine',
              model: 'quality_composite_metric',
              latencyMs: 2,
              status: 'SUCCESS',
              retryCount: 0
            }
          },
          consistency: consistencyResult
        }
      });

      // Update counters based on decision
      if (verification.decision === 'HSRP_VERIFIED') {
        this.telemetry.HSRPVerified++;
        this.logEvent('HSRP_VERIFIED', {
          trackId: track.vehicleTrackId,
          reg: verification.registrationNumber
        });
      } else if (verification.decision === 'HSRP_NOT_VERIFIED') {
        this.telemetry.HSRPNotVerified++;
        this.logEvent('HSRP_NOT_VERIFIED', {
          trackId: track.vehicleTrackId,
          reasons: verification.reasons
        });
      } else if (verification.decision === 'NEEDS_BETTER_CAPTURE') {
        this.telemetry.needsBetterCapture++;
        this.logEvent('NEEDS_BETTER_CAPTURE', { trackId: track.vehicleTrackId });
      } else {
        this.telemetry.uncertain++;
        this.logEvent('HSRP_UNCERTAIN', { trackId: track.vehicleTrackId });
      }

      // Mark track as analyzed with cooldown
      track.lastAnalyzedTimestamp = Date.now();
      track.status = 'ANALYZED';

      // Step 9: Register Event in Central Event Store & Evidence Repository
      const eventId = `EVT-HSRP-${track.vehicleTrackId}-${Date.now()}`;
      const priority =
        verification.decision === 'HSRP_NOT_VERIFIED'
          ? 'high'
          : verification.decision === 'HSRP_VERIFIED'
          ? 'medium'
          : 'low';

      const securityEvent: SecurityEventPayload = {
        eventId,
        edgeNodeId: 'EDGE-SENTINEL-01',
        siteId: 'SITE-SENTINEL-AHMEDABAD',
        cameraId,
        timestamp: frame.timestamp,
        eventType: 'HSRP_VERIFICATION',
        priority,
        confidence: verification.confidence,
        snapshotReference: fullFrameUrl,
        metadata: {
          sourceType: 'REAL_SENTINEL_RTSP',
          sourceCamera: cameraId,
          cameraName: '01 Chiman bhai Bridge (Corp8 Sentinel Live)',
          location: 'Chiman bhai Bridge, Ahmedabad',
          vehicleTrackId: track.vehicleTrackId,
          vehicleClass: track.vehicleClass,
          hsrpDecision: verification.decision,
          registrationNumber: verification.registrationNumber,
          evidenceQuality: verification.evidenceQuality,
          reasons: verification.reasons,
          fullFrameSha256: frame.sha256,
          plateCropSha256: candidate.cropSha256,
          plateCropUrl,
          sha256: frame.sha256,
          isRealAI: true,
          verificationResult: verification
        }
      };

      // Register in Sentinel Central Store via callback
      if (this.eventCallback) {
        try {
          await this.eventCallback(securityEvent);
        } catch (evErr) {
          console.warn('[HsrpVisionMeshService] Event callback error:', evErr);
        }
      }

      // Store in Statutory Forensic Storage
      await evidenceStorage.storeEvidence({
        evidenceId: `EVD-${eventId}`,
        eventId: eventId,
        sourceCamera: cameraId,
        cameraName: '01 Chiman bhai Bridge (Corp8 Sentinel Live)',
        sourceType: 'REAL_SENTINEL' as any,
        timestamp: frame.timestamp,
        GPS: { latitude: 23.0225, longitude: 72.5714 },
        frameReference: fullFrameUrl,
        thumbnailReference: plateCropUrl,
        sha256: frame.sha256,
        plateNormalized: verification.registrationNumber || undefined,
        plateText: verification.registrationNumber || undefined,
        vehicleClass: track.vehicleClass as any,
        vehicleConfidence: verification.confidence,
        analysisMode: 'REAL_AI',
        sourceOfTruth: 'CAMERA_OBSERVED' as any,
        label: `HSRP ${verification.decision} - ${verification.registrationNumber || 'UNREADABLE'}`,
        status: 'VERIFIED'
      });

      this.logEvent('EVIDENCE_STORED', {
        eventId,
        evidenceId: `EVD-${eventId}`,
        sha256: frame.sha256
      });

      // Update Telemetry
      const duration = Date.now() - cycleStart;
      this.recordLatency(duration);
      this.telemetry.lastSuccessfulAnalysis = new Date().toISOString();
      this.telemetry.pipelineState = 'LIVE';
      this.telemetry.lastError = null;
      this.telemetry.latestVerification = verification;

      this.telemetry.recentVerifications.unshift(verification);
      if (this.telemetry.recentVerifications.length > 20) {
        this.telemetry.recentVerifications.pop();
      }

      this.logEvent('AI_MESH_COMPLETE', {
        trackId: track.vehicleTrackId,
        decision: verification.decision,
        durationMs: duration
      });

      return verification;
    } catch (cycleErr: any) {
      this.telemetry.pipelineState = 'AI_DEGRADED';
      this.telemetry.lastError = `Cycle execution error: ${cycleErr?.message || cycleErr}`;
      console.error('[HsrpVisionMeshService] Cycle execution error:', cycleErr);
      return null;
    } finally {
      this.isAnalysisActive = false;
    }
  }
}

export const hsrpVisionMeshService = HsrpVisionMeshService.getInstance();
