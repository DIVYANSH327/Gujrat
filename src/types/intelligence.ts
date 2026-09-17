import type { BoundingBox } from '../services/vision/visionTypes.js';

export interface VehicleObservation {
  observationId: string;
  cameraId: string;
  cameraName: string;
  district: string;
  location: string;
  frameTimestamp: number;
  captureTimestampUtc: string;
  frameSha256: string;
  frameUrl: string;

  // Independent Vehicle Extraction
  vehicleTrackId: string;
  vehicleType: string;
  vehicleConfidence: number;
  boundingBox: BoundingBox;
  vehicleCropUrl: string;
  vehicleCropSha256: string;
  vehicleCropWidth: number;
  vehicleCropHeight: number;

  // Plate Extraction
  plateDetected: boolean;
  plateBoundingBox?: BoundingBox;
  originalPlateCropUrl?: string;
  originalPlateCropSha256?: string;
  enhancedPlateCropUrl?: string;
  enhancedPlateCropSha256?: string;
  enhancementType?: 'OPTICAL_ENHANCEMENT' | 'AI_SUPER_RESOLUTION' | 'NONE';
  enhancementMethod?: string;
  plateQualityScore?: number; // 0-100

  // OCR & HSRP
  ocrResult: string; // Real plate alphanumeric OR 'NOT_READABLE'
  ocrConfidence: number;
  ocrReadabilityStatus: 'READABLE' | 'NOT_READABLE' | 'UNCERTAIN' | 'NO_PLATE';
  isHsrpCompliant?: boolean;
  hsrpStatus?: 'HSRP_COMPLIANT' | 'HSRP_NON_COMPLIANT' | 'HSRP_UNVERIFIED' | 'PLATE_NOT_VISIBLE';
  hsrpNotes?: string;

  // Forensic Chain & Evidence
  aiProvider: string;
  aiModel: string;
  processingTimeMs: number;
  evidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNUSABLE';
  evidenceId?: string;
}

export interface PersonObservation {
  observationId: string;
  cameraId: string;
  cameraName: string;
  district: string;
  location: string;
  frameTimestamp: number;
  captureTimestampUtc: string;
  frameSha256: string;
  frameUrl: string;

  // Person Extraction
  personTrackId: string;
  personConfidence: number;
  boundingBox: BoundingBox;
  personCropUrl: string;
  personCropSha256: string;
  personCropWidth: number;
  personCropHeight: number;

  // Attributes & Safety Classification
  classification: 'PEDESTRIAN' | 'MOTORCYCLE_RIDER' | 'BICYCLIST' | 'CROWD_MEMBER' | 'SECURITY_GUARD';
  helmetStatus?: 'HELMET_COMPLIANT' | 'NO_HELMET' | 'NOT_APPLICABLE' | 'UNCERTAIN';
  posture?: 'STANDING' | 'WALKING' | 'RUNNING' | 'RIDING' | 'UNKNOWN';
  densityZone?: 'LOW' | 'MEDIUM' | 'HIGH_CONGESTION';

  // Forensic Evidence
  aiProvider: string;
  aiModel: string;
  processingTimeMs: number;
  evidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceId?: string;
}

export interface PersonTrackRecord {
  personTrackId: string;
  cameraId: string;
  cameraName: string;
  district: string;
  location?: string;
  firstSeenMs: number;
  lastSeenMs: number;
  frameCount: number;
  classification: string;
  helmetStatus?: string;
  bestFrames: Array<{
    frameTimestamp: number;
    frameSha256: string;
    frameUrl: string;
    cropUrl: string;
    cropSha256: string;
    confidence: number;
    qualityScore: number;
  }>;
  bestPersonFrames?: Array<{
    frameTimestamp: number;
    frameSha256: string;
    frameUrl: string;
    cropUrl: string;
    cropSha256: string;
    confidence: number;
    qualityScore: number;
  }>;
  observations: PersonObservation[];
}

export interface UnifiedAuditEntry {
  auditId: string;
  timestamp: string;
  timestampMs: number;
  auditType: 'HSRP_INSPECTION' | 'PERSON_DETECTION' | 'VEHICLE_SIGHTING' | 'SAFETY_VIOLATION';
  cameraId: string;
  cameraName: string;
  location: string;
  district: string;
  targetId: string; // vehicle plate or person track ID
  category: 'VEHICLE_HSRP' | 'PERSON_PEDESTRIAN';
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'DETECTED' | 'VERIFIED' | 'FLAGGED';
  details: string;
  confidence: number;
  frameUrl: string;
  cropUrl?: string;
  enhancedCropUrl?: string;
  sha256: string;
  evidenceId?: string;
}

export interface VehicleTrackRecord {

  vehicleTrackId: string;
  cameraId: string;
  cameraName: string;
  district: string;
  vehicleType: string;
  firstSeenMs: number;
  lastSeenMs: number;
  frameCount: number;
  bestPlateText: string;
  bestPlateConfidence: number;
  isRead: boolean;
  hsrpStatus: string;
  
  // Best 3 vehicle frames
  bestVehicleFrames: Array<{
    frameTimestamp: number;
    frameSha256: string;
    frameUrl: string;
    cropUrl: string;
    cropSha256: string;
    confidence: number;
    qualityScore: number;
  }>;

  // Best 3 plate frames
  bestPlateFrames: Array<{
    frameTimestamp: number;
    originalCropUrl: string;
    originalCropSha256: string;
    enhancedCropUrl?: string;
    enhancedCropSha256?: string;
    enhancementType: string;
    ocrResult: string;
    ocrConfidence: number;
    plateQualityScore: number;
  }>;

  observations: VehicleObservation[];
}

export interface IntelligenceMetrics {
  cyclesCompleted: number;
  framesAcquired: number;
  framesRejected: number;
  framesProcessed: number;
  camerasSampled: number;
  cameraReconnects: number;
  vehiclesDetected: number;
  personsDetected: number;
  plateCandidates: number;
  ocrReadable: number;
  ocrNotReadable: number;
  aiInferenceSuccesses: number;
  aiInferenceFailures: number;
  evidenceStored: number;
  evidenceFailures: number;
}

export type EngineState = 'ENGINE_RUNNING' | 'ENGINE_STALLED' | 'ENGINE_STOPPED' | 'ENGINE_DEGRADED';

export interface IntelligenceTelemetry {
  isRunning: boolean;
  engineState: EngineState;
  startedAt: string;
  uptimeSeconds: number;
  camerasMonitored: number;
  totalFramesSampled: number;
  totalFramesRejectedQuality: number;
  totalVehiclesObserved: number;
  totalPersonsObserved: number;
  uniqueVehicleTracks: number;
  uniquePersonTracks: number;
  totalPlatesDetected: number;
  totalPlatesRead: number;
  totalPlatesUnreadable: number;
  totalOpticalEnhancements: number;
  totalAiSuperResolutions: number;
  activeTracksCount: number;
  activePersonTracksCount: number;
  totalAuditRecords: number;
  cyclesCompleted: number;
  lastCycleAt: string;
  lastSuccessfulCycle: number;
  activeWorkers: number;
  queueSize: number;
  stuckThresholdMs: number;
  sampleIntervalMs: number;

  metrics: {
    today: IntelligenceMetrics;
    lifetime: IntelligenceMetrics;
    currentDate: string;
  };
  cameraCounts: {
    total: number;
    live: number;
    stale: number;
    offline: number;
    reconnecting: number;
    authError: number;
    starting: number;
    degraded: number;
  };
  aiProviderState: string;
  circuitBreakerOpen?: boolean;
  evidenceStorageState?: string;
  cam12Summary?: {
    framesAnalyzed: number;
    vehiclesObserved: number;
    uniqueTracks: number;
    platesDetected: number;
    platesRead: number;
    unreadablePlates: number;
    recentObservations: VehicleObservation[];
  };
  lastError?: string | null;
}
