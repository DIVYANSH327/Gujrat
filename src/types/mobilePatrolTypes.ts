/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Mobile Patrol & Police Mobile Vision Unit Type Definitions
 * 4K / ANPR Police Vehicle + YOLOv8 + HSRP + Traffic Safety + Event-Based Evidence Capture
 */

export type PatrolCameraMode = 
  | 'PATROL_4K_CAMERA' 
  | 'PATROL_ANPR_CAMERA' 
  | 'PATROL_DUAL_CAMERA'
  | 'NORMAL_4K'
  | 'ANPR'
  | 'PTZ'
  | 'FRONT_TRAFFIC'
  | 'REAR_TRAFFIC'
  | 'SIDE_TRAFFIC'
  | 'THERMAL'
  | 'MULTI_CAMERA';

export type NetworkSyncStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING';
export type HardwareAccelerationMode = 'OFF' | 'CPU' | 'GPU' | 'AUTO';
export type AiAccelerationMode = HardwareAccelerationMode;
export type GpuResourceProfile = 'AUTO' | 'BALANCED' | 'PERFORMANCE' | 'MAXIMUM_AI';
export type CameraOperationalStatus = 'STREAMING' | 'BUFFERING' | 'CAMERA_OFFLINE' | 'DEGRADED';
export type AiEngineStatus = 'ONLINE' | 'PROCESSING' | 'AI_OFFLINE' | 'DEGRADED';
export type StorageStatus = 'OK' | 'BUFFERING' | 'LOCAL_ONLY' | 'FULL';

export type PatrolEventCategory =
  | 'NO_HELMET'
  | 'TRIPLE_RIDING'
  | 'MULTIPLE_RIDERS'
  | 'NO_PLATE'
  | 'NO_PLATE_CANDIDATE'
  | 'PLATE_PRESENT'
  | 'PLATE_VISIBLE'
  | 'PLATE_READABLE'
  | 'PLATE_UNREADABLE'
  | 'POSSIBLE_NON_HSRP'
  | 'HSRP_CANDIDATE'
  | 'HSRP_VERIFIED'
  | 'STANDARD_INDIAN_PLATE'
  | 'COMMERCIAL_PLATE'
  | 'RED_LIGHT_VIOLATION'
  | 'RED_LIGHT_CANDIDATE'
  | 'WRONG_WAY'
  | 'LANE_VIOLATION'
  | 'LANE_VIOLATION_CANDIDATE'
  | 'DANGEROUS_MANEUVER'
  | 'OVERSPEED_CANDIDATE'
  | 'WATCHLIST_CANDIDATE'
  | 'WATCHLIST_MATCH'
  | 'STOLEN_VEHICLE_MATCH'
  | 'UNUSUAL_VEHICLE'
  | 'HIGH_VALUE_INVESTIGATION_TARGET';

export type EventPriority = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TruthStatus = 
  | 'OBSERVED' 
  | 'VERIFIED' 
  | 'INFERRED' 
  | 'PREDICTED' 
  | 'UNCERTAIN' 
  | 'NOT_READABLE' 
  | 'NOT_AVAILABLE'
  | 'SOURCE_UNAVAILABLE';

export type HelmetState = 'HELMET_VISIBLE' | 'NO_HELMET_CANDIDATE' | 'UNCERTAIN';
export type RiderCountState = 'ONE_RIDER' | 'TWO_RIDERS' | 'THREE_OR_MORE_RIDERS' | 'UNCERTAIN';

export type PlateReadStatus = 
  | 'PLATE_VISIBLE'
  | 'PLATE_NOT_VISIBLE'
  | 'NO_PLATE_DETECTED'
  | 'NO_PLATE_CANDIDATE'
  | 'PLATE_DETECTED' 
  | 'PLATE_CAPTURED' 
  | 'PLATE_READABLE' 
  | 'PLATE_UNCERTAIN' 
  | 'PLATE_NOT_READABLE'
  | 'UNCERTAIN';

export type HsrpVerificationStatus = 
  | 'HSRP_VERIFIED' 
  | 'HSRP_SUSPECTED' 
  | 'HSRP_NOT_DETERMINED' 
  | 'NOT_READABLE'
  | 'UNCERTAIN';

export type OfficerReviewStatus = 
  | 'PENDING_REVIEW' 
  | 'OFFICER_VERIFIED' 
  | 'OFFICER_DISMISSED' 
  | 'CHALLAN_ISSUED' 
  | 'INVESTIGATION_OPENED';

export interface GpsData {
  status: 'AVAILABLE' | 'GPS_UNAVAILABLE';
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speedKmH: number | null;
  accuracyMeters: number | null;
  timestamp: string;
}

export interface CameraCapabilities {
  objectDetection: boolean;
  vehicleDetection: boolean;
  plateDetection: boolean;
  plateOCR: boolean;
  gps: boolean;
  '4k': boolean;
  anpr?: boolean;
  thermal?: boolean;
  ptz?: boolean;
}

export interface MobileVisionUnit {
  unitId: string;
  vehicleId: string;
  registrationNumber: string;
  cameraIds: string[];
  cameraType: PatrolCameraMode;
  cameraCapabilities: CameraCapabilities;
  resolution: string;
  fps: number;
  gps: GpsData;
  heading: number | null;
  speed: number | null;
  edgeDevice: string;
  gpu: string;
  cpu: string;
  memory: string;
  storage: string;
  connectivity: NetworkSyncStatus;
  status: 'ACTIVE_PATROL' | 'STANDBY' | 'MAINTENANCE' | 'OFFLINE';
  lastHeartbeat: string;
  assignedSector: string;
  district: string;
  driverOfficerName?: string;
  callSign: string;
}

export interface PatrolCameraMetadata {
  cameraId: string;
  vehicleId: string;
  callSign: string;
  cameraType: PatrolCameraMode;
  cameraCapabilities?: CameraCapabilities;
  resolution: string;
  fps: number;
  codec: string;
  gps: GpsData;
  networkStatus: NetworkSyncStatus;
  storageStatus: StorageStatus;
  aiStatus: AiEngineStatus;
  accelerationMode: HardwareAccelerationMode;
  assignedSector: string;
  district: string;
}

export interface BoundedFrameItem {
  frameId: string;
  timestampMs: number;
  isoTimestamp: string;
  dataUrl: string;
  qualityScore: number;
  yoloDetectionsCount: number;
  relativeTimeOffsetSec: number;
  isBestFrame?: boolean;
  sha256?: string;
}

export interface VehicleBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VehicleTrack {
  trackId: string;
  cameraId: string;
  unitId: string;
  class: 'car' | 'motorcycle' | 'bus' | 'truck' | 'bicycle' | 'person';
  boundingBox: VehicleBoundingBox;
  firstSeen: number;
  lastSeen: number;
  frameCount: number;
  trajectory: { x: number; y: number; t: number }[];
  confidence: number;
  bestFrame?: BoundedFrameItem;
  plateCandidate?: {
    text: string;
    confidence: number;
    box: VehicleBoundingBox;
    isHsrpCandidate: boolean;
  };
}

export interface YoloVehicleDetection {
  trackId: string;
  class: 'car' | 'motorcycle' | 'bus' | 'truck' | 'bicycle' | 'person';
  confidence: number;
  box: VehicleBoundingBox;
  speedEstimateKmH?: number;
  trajectoryAngle?: number;
  helmetState?: HelmetState;
  riderCountState?: RiderCountState;
  riderCount?: number;
  plateDetected?: boolean;
  plateBox?: VehicleBoundingBox;
  plateText?: string;
  ocrConfidence?: number;
  isHsrpCandidate?: boolean;
  eventsTriggered: PatrolEventCategory[];
}

export interface HsrpFeatureInspection {
  indBlueBand: 'VISIBLE' | 'ABSENT' | 'UNCERTAIN';
  ashokaChakraHologram: 'VISIBLE' | 'ABSENT' | 'UNCERTAIN';
  laserEtchedPin: 'VISIBLE' | 'NOT_ASSESSABLE' | 'UNCERTAIN';
  indiaFoilStamp: 'VISIBLE' | 'ABSENT' | 'UNCERTAIN';
  snapLockRivets: 'VISIBLE' | 'ABSENT' | 'UNCERTAIN';
  retroReflectiveSheeting: 'VISIBLE' | 'ABSENT' | 'UNCERTAIN';
}

export interface AgentDeliberationRecord {
  agentId: string;
  agentName: string;
  verdict: string;
  confidence: number;
  status: 'SUCCESS' | 'WARNING' | 'UNCERTAIN' | 'FAILED';
  deliberationNotes: string;
  timestamp: string;
}

export interface MultiFrameConsensusResult {
  totalSampledFrames: number;
  agreeingFrames: number;
  consensusRatio: string;
  consensusPassed: boolean;
  consensusOcrText: string;
  readabilityStatus: 'READ' | 'UNCERTAIN' | 'NOT_READABLE';
}

export interface AuthorizedVahanRecord {
  lookupStatus: 'VERIFIED_RECORD' | 'RECORD_NOT_FOUND' | 'SOURCE_UNAVAILABLE';
  sourceName: string;
  retrievalTimestamp: string;
  registrationNumber?: string;
  vehicleMakeModel?: string;
  registrationDate?: string;
  insuranceStatus?: 'ACTIVE' | 'EXPIRED' | 'NOT_AVAILABLE';
  insuranceExpiryDate?: string;
  puccStatus?: 'VALID' | 'EXPIRED' | 'NOT_AVAILABLE';
  taxStatus?: 'PAID' | 'DUE' | 'NOT_AVAILABLE';
  stolenReported?: boolean;
  crimeLinkedFir?: string | null;
}

export interface PatrolEventEvidence {
  eventId: string;
  vehicleId: string;
  cameraId: string;
  category: PatrolEventCategory;
  priority: EventPriority;
  timestamp: string;
  gps: GpsData;
  
  // Visual Evidence Assets
  bestFrameUrl: string;
  rawFrameHash: string;
  enhancedFrameUrl: string;
  enhancedFrameHash: string;
  plateCropUrl?: string;
  vehicleCropUrl?: string;
  supportingFrames: BoundedFrameItem[];
  
  // Detections & Measurements
  trackId: string;
  vehicleClass: string;
  vehicleConfidence: number;
  plateText: string;
  plateStatus: PlateReadStatus;
  plateType: 'HSRP' | 'STANDARD_INDIAN_PLATE' | 'COMMERCIAL_PLATE' | 'UNREADABLE';
  hsrpStatus: HsrpVerificationStatus;
  hsrpFeatures: HsrpFeatureInspection;
  
  // Safety Metrics
  helmetState?: HelmetState;
  riderCountState?: RiderCountState;
  detectedRiderCount?: number;
  speedKmH?: number;
  
  // Consensus & Integrity
  multiFrameAgreement: MultiFrameConsensusResult;
  integritySeal: 'INTEGRITY PRESERVED' | 'EVIDENCE-READY ELECTRONIC RECORD';
  bsaSection63Cert: {
    statute: string;
    certId: string;
    custodyChain: string;
    deviceFingerprint: string;
    officerBadge: string;
    generatedAt: string;
  };
  
  // Authorized External Lookup
  vahanRecord?: AuthorizedVahanRecord;
  watchlistResult?: {
    matchFound: boolean;
    watchlistCategory?: string;
    caseReference?: string;
    riskScore?: number;
  };
  
  // AI Agent Mesh
  agentDeliberations: AgentDeliberationRecord[];
  meshFinalVerdict: string;
  meshConfidence: number;
  
  // Officer Review
  reviewStatus: OfficerReviewStatus;
  officerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  
  // Cloud Sync
  syncedToCloud: boolean;
  pubSubMessageId?: string;
  bigQueryRowId?: string;
  cloudStorageUri?: string;
}

export interface StorageEfficiencyMetrics {
  videoInputResolution: string;
  videoInputFps: number;
  aiAnalysisFps: number;
  rawVideoBandwidthMbps: number;
  actualEventBandwidthKbps: number;
  totalEventsCaptured: number;
  totalEvidenceFramesStored: number;
  continuousHoursSimulated: number;
  rawVideoStorageSavedGb: number;
  actualCloudStorageUsedMb: number;
  bandwidthReductionRatio: string;
  // Extended telemetry
  gpuUtilizationPercent: number;
  cpuUtilizationPercent: number;
  ramUsageMb: number;
  vramUsageMb: number;
  queueDepth: number;
  droppedFramesCount: number;
  eventsPerMinute: number;
  aiInferenceLatencyMs: number;
}

export interface PatrolNodeConfiguration {
  rollingBufferSeconds: number; // 5 - 15 seconds
  preEventFramesCount: number;  // 2 frames (-2s, -1s)
  postEventFramesCount: number; // 2 frames (+1s, +2s)
  eventRetentionDays: number;
  rawVideoRetentionHours: number; // 0 = event-only mode (default)
  accelerationMode: HardwareAccelerationMode;
  resourceProfile: GpuResourceProfile;
  cameraMode: PatrolCameraMode;
  autoCloudSync: boolean;
  strictHdrDeblur: boolean;
  maxEvidencePerEvent: number;
  maxEventsPerMinute: number;
  edgeInferenceFps: number;
  aiDispatchFps: number;
  uploadBandwidthLimitMbps: number;
}

export type VisionLabTab = 
  | 'LIVE_PATROL'
  | 'PATROL_MODE'
  | 'CAMERA'
  | 'EVENTS'
  | 'HSRP'
  | 'EVIDENCE'
  | 'MAP'
  | 'PERFORMANCE'
  | 'AUDIT'
  | 'ENGINEERING';
