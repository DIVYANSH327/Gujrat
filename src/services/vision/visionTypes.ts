/**
 * Corp8 Sentinel Agentic HSRP Vision Mesh Type Definitions
 * Gujarat Police CCTV & AI Intelligence Platform
 */

export interface BoundingBox {
  x: number; // 0.0 - 1.0 (normalized)
  y: number; // 0.0 - 1.0 (normalized)
  width: number; // 0.0 - 1.0 (normalized)
  height: number; // 0.0 - 1.0 (normalized)
}

export type VehicleClass =
  | 'car'
  | 'motorcycle'
  | 'scooter'
  | 'bus'
  | 'truck'
  | 'auto_rickshaw'
  | 'van'
  | 'suv'
  | 'other_vehicle';

export interface VisionFrame {
  cameraId: string;
  timestamp: string;
  frameId: string;
  imageBuffer: Buffer;
  mimeType: 'image/jpeg';
  sha256: string;
  source: 'RTSP';
  width: number;
  height: number;
}

export interface VehicleDetection {
  id: string;
  class: VehicleClass;
  box: BoundingBox;
  confidence: number;
  frameId: string;
  plateBox?: BoundingBox;
  plateText?: string;
  attributes?: {
    helmet?: 'HELMET' | 'NO_HELMET' | 'UNKNOWN';
    color?: string;
    vehicleType?: string;
  };
}

export interface PlateCandidate {
  candidateId: string;
  vehicleTrackId: string;
  bbox: BoundingBox;
  confidence: number;
  cropBuffer: Buffer;
  cropUrl?: string;
  cropSha256: string;
  frameId: string;
  frameTimestamp: number;
  widthPx: number;
  heightPx: number;
  isAdequateSize: boolean;
}

export interface VehicleTrack {
  vehicleTrackId: string; // e.g. cam01-v-000182
  cameraId: string;
  vehicleClass: VehicleClass;
  firstSeen: string;
  lastSeen: string;
  frameCount: number;
  boxes: Array<{ frameId: string; timestamp: number; box: BoundingBox }>;
  bestFrameId: string | null;
  bestPlateCandidate: PlateCandidate | null;
  trackingConfidence: number;
  status: 'TRACKING' | 'ANALYZED' | 'COOLDOWN' | 'EXPIRED';
  lastAnalyzedTimestamp?: number;
  latestScore?: number;
}

export interface EvidenceQualityScore {
  totalScore: number; // 0 to 100
  plateVisibilityScore: number;
  sharpnessScore: number;
  OCRScore: number;
  vehicleVisibilityScore: number;
  framingScore: number;
  blurPenalty: number;
  occlusionPenalty: number;
  details: {
    sharpnessEst: number;
    pixelDimensions: { width: number; height: number };
    isAdequateForHSRP: boolean;
    reason?: string;
  };
}

export interface PlateOCRResult {
  text: string | null;
  normalizedText: string | null;
  confidence: number;
  readable: boolean;
  reason?: string;
  stateCode?: string;
  rtoCode?: string;
  series?: string;
  digits?: string;
}

export interface HSRPAnalysis {
  visible: boolean;
  characteristics: string[];
  inconsistencies: string[];
  confidence: number;
  result: 'CONSISTENT' | 'INCONSISTENT' | 'UNCERTAIN';
  reason?: string;
  laserPinDetected?: boolean;
  ashokChakraHologramDetected?: boolean;
  indCountryCodeDetected?: boolean;
  snapLockRivetsDetected?: boolean;
  retroReflectiveSheetingDetected?: boolean;
}

export interface AgentModelRecord {
  provider: 'gemini' | 'rule_engine' | 'optical' | 'system';
  model: string;
  latencyMs: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'KEY_REQUIRED';
  retryCount: number;
  failureReason?: string;
}

export interface AgentResult<T = any> {
  agentName: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'KEY_REQUIRED';
  data: T;
  confidence: number;
  execution: AgentModelRecord;
  disclaimer?: string;
}

export type HSRPVerificationDecision =
  | 'HSRP_VERIFIED'
  | 'HSRP_NOT_VERIFIED'
  | 'UNCERTAIN'
  | 'NEEDS_BETTER_CAPTURE';

export interface HSRPVerificationResult {
  decision: HSRPVerificationDecision;
  registrationNumber: string | null;
  confidence: number;
  evidenceQuality: number;
  reasons: string[];
  vehicleTrackId: string;
  vehicleClass: VehicleClass;
  cameraId: string;
  frameId: string;
  timestamp: string;
  fullFrameUrl: string;
  fullFrameSha256: string;
  plateCropUrl: string;
  plateCropSha256: string;
  agents: {
    plate: AgentResult<PlateCandidate | null>;
    ocr: AgentResult<PlateOCRResult>;
    hsrp: AgentResult<HSRPAnalysis>;
    quality: AgentResult<EvidenceQualityScore>;
    consistency: AgentResult<{ isConsistent: boolean; reason: string }>;
  };
  auditNotice: string;
}

export interface VisionMeshTelemetry {
  framesCaptured: number;
  vehiclesDetected: number;
  activeTracks: number;
  platesDetected: number;
  OCRAttempts: number;
  OCRSuccesses: number;
  HSRPChecks: number;
  HSRPVerified: number;
  HSRPNotVerified: number;
  uncertain: number;
  needsBetterCapture: number;
  AIRequests: number;
  AIFailures: number;
  averageLatency: number;
  lastSuccessfulAnalysis: string | null;
  currentBackpressure: 'NONE' | 'LOW' | 'HIGH' | 'THROTTLED';
  lastError: string | null;
  pipelineState:
    | 'LIVE'
    | 'AI_PROCESSING'
    | 'AI_DEGRADED'
    | 'AI_KEY_REQUIRED'
    | 'CAMERA_OFFLINE'
    | 'BACKPRESSURED'
    | 'IDLE';
  latestVerification: HSRPVerificationResult | null;
  recentVerifications: HSRPVerificationResult[];
}
