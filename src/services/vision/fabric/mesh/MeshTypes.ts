/**
 * Sentinel Agent Mesh Type Definitions
 * Gujarat Police CCTV & AI Intelligence Platform (SENTINEL GRID)
 */

import { BoundingBox } from '../../visionTypes.js';
import { CandidateFrame } from '../IntelligentFrameSelector.js';
import { AIPlateVerificationResult } from '../SentinelAIFrameDispatcher.js';
import { PipelineProcessingState, TrackLifecycleState, TruthStatus } from '../VisionTypes.js';

export type HSRPVerificationStatus = 
  | 'PLATE_VERIFIED' 
  | 'PLATE_UNCERTAIN' 
  | 'PLATE_NOT_READABLE' 
  | 'AI_UNAVAILABLE' 
  | 'NEEDS_ADDITIONAL_FRAMES';

export interface MultiFrameObservation {
  frameId: string;
  frameTimestamp: number;
  captureIso: string;
  frameSha256: string;
  cameraId: string;
  trackId: string;
  rawPlateText: string | null;
  normalizedPlateText: string | null;
  confidence: number;
  sharpnessScore: number;
  readability: 'READABLE' | 'UNCERTAIN' | 'NOT_READABLE';
}

export interface MultiFrameAgreementResult {
  trackId: string;
  cameraId: string;
  framesAnalyzed: number;
  framesAgreeing: number;
  unanimousAgreement: boolean;
  consensusPlateText: string | null;
  agreementStatus: HSRPVerificationStatus;
  confidence: number;
  observations: MultiFrameObservation[];
  discrepancies: string[];
  truthState: TruthStatus;
}

export interface EvidenceRecordMetadata {
  evidenceId: string;
  cameraId: string;
  cameraName: string;
  district: string;
  frameTimestamp: number;
  captureIso: string;
  frameSha256: string;
  plateCropSha256?: string;
  vehicleClass: string;
  vehicleTrackId: string;
  verifiedPlateText: string | null;
  bsaSection63IntegrityStatus: 'INTEGRITY_PRESERVED' | 'EVIDENCE_READY_RECORD' | 'UNVERIFIED';
  electronicHashSignature: string;
  storedAt: string;
  chainOfCustodyRecord: string;
  truthState: TruthStatus;
}

export type OfficerTaskType =
  | 'REVIEW_EVIDENCE'
  | 'START_TRACKING'
  | 'INVESTIGATE_VEHICLE'
  | 'WATCHLIST_REVIEW'
  | 'REQUEST_ADDITIONAL_FRAMES'
  | 'ESCALATE_ALERT'
  | 'MARK_UNCERTAIN';

export interface SentinelOfficerTask {
  taskId: string;
  taskType: OfficerTaskType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING_OFFICER_REVIEW' | 'APPROVED' | 'DISMISSED' | 'COMPLETED';
  cameraId: string;
  trackId: string;
  plateText: string | null;
  reason: string;
  sourceEventId: string;
  evidenceId?: string;
  confidence: number;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  truthState: TruthStatus;
}

export interface SentinelMeshDossier {
  dossierId: string;
  cameraId: string;
  trackId: string;
  vehicleClass: string;
  vehicleConfidence: number;
  vehicleBbox: BoundingBox;
  trackState: TrackLifecycleState;
  pipelineStatus: PipelineProcessingState;
  truthState: TruthStatus;

  // Frame Selection
  selectedFrame: CandidateFrame;
  candidateFramesCount: number;

  // AI Verification & HSRP
  aiVerification: AIPlateVerificationResult;
  multiFrameAgreement: MultiFrameAgreementResult;
  hsrpCharacteristics: string[];
  hsrpSecurityElementsVerified: boolean;

  // Evidence
  evidenceRecord?: EvidenceRecordMetadata;

  // Watchlist & Alerts
  watchlistMatch: {
    matched: boolean;
    category?: string;
    alertLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE';
    notes?: string;
  };
  alertCreated: boolean;
  alertId?: string;

  // Task
  taskCreated?: SentinelOfficerTask;

  // Audit
  processedAt: string;
  totalLatencyMs: number;
}
