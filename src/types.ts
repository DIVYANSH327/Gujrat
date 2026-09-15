export type CameraStatus = 'online' | 'offline' | 'warning';

// V1.0 Strict Source Classification — Single Source of Truth
export type SourceClassification =
  | 'REAL_CONNECTED'
  | 'REAL_CONFIGURED_NOT_CONNECTED'
  | 'REAL_DISCOVERED'
  | 'AUTHORIZED_UPLOADED_VIDEO'
  | 'YOUTUBE_DEMO'
  | 'SYNTHETIC_SIMULATION';

// V0.7 Normalized Connector & Integration Types
export type VideoSourceType = 'SIMULATED' | 'ONVIF' | 'RTSP' | 'VMS' | 'YOUTUBE_DEMO' | 'YOUTUBE_LIVE' | 'OTHER' | 'MOBILE_CAMERA';
export type IntegrationStatus = 'SIMULATED' | 'INTEGRATION_READY' | 'CONNECTED';
export type FeedHealthState = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'AUTH_FAILED' | 'NO_STREAM' | 'STALE' | 'UNKNOWN';
export type DiscoveryMethod = 'MANUAL_CONFIG' | 'WS_DISCOVERY' | 'VMS_API' | 'RTSP_PROBE' | 'SYNTHETIC_REGISTRY' | 'YOUTUBE_REGISTRY';
export type SourceMode = 'DEMO' | 'INTEGRATION_READY' | 'LIVE';

// Truthful Camera Source Availability Types
export type CameraSourceAvailability =
  | 'AUTHORIZED_LIVE'
  | 'YOUTUBE_DEMO'
  | 'DEMO_AVAILABLE'
  | 'OFFLINE'
  | 'NOT_CONFIGURED';

export interface FeedHealthMetrics {
  state: FeedHealthState;
  lastSuccessfulConnection?: string;
  lastFrame?: string;
  reconnectCount: number;
  latencyMs: number;
  packetLossRate: number; // Placeholder rate e.g. 0.00
  fps: number;
  resolution: string;
  uptimeSeconds: number;
  isSimulated: boolean;
}

export interface StreamMetadata {
  codec: string;
  resolution: string;
  fps: number;
  transport: 'TCP' | 'UDP' | 'HTTP' | 'SIMULATED';
  bitrateKbps?: number;
  isLive: boolean;
}

export interface DiscoveredVideoDevice {
  deviceId: string;
  deviceName: string;
  vendor: string;
  model: string;
  ipAddress?: string;
  port?: number;
  protocol: 'ONVIF' | 'RTSP' | 'VMS' | 'SIMULATED';
  discoveryMethod: DiscoveryMethod;
  channelsCount: number;
  channelIds: string[];
  status: FeedHealthState;
  integrationStatus: IntegrationStatus;
  firmwareVersion?: string;
  lastDiscovered: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: CameraStatus;
  lastActive: string;
  streamUrl?: string; // Mocked
  mapX?: number;
  mapY?: number;
  // Challenge Mode Additions
  siteId?: string;
  department?: string;
  district?: string;
  vendor?: string;
  model?: string;
  vms?: string;
  protocol?: string;
  latitude?: number;
  longitude?: number;
  streamQuality?: string;
  resolution?: string;
  fps?: number;
  edgeNodeId?: string;
  lastHeartbeat?: string;
  direction?: string;
  locationDescription?: string;
  roadSegment?: string;
  lane?: number | string;
  installationLocation?: string;
  locationAccuracy?: number;
  locationSource?: LocationSource | string;
  locationStatus?: LocationStatus | string;
  alertCount?: number;
  // V0.7 Connector Additions
  sourceType?: VideoSourceType;
  adapterType?: string;
  channel?: number;
  channelNumber?: number;
  streamState?: FeedHealthState;
  protocolState?: string;
  feedHealth?: FeedHealthMetrics;
  integrationStatus?: IntegrationStatus;
  lastFrameTimestamp?: string;
  discoveryMethod?: DiscoveryMethod;
  sourceAvailability?: CameraSourceAvailability;
  sourceClassification?: SourceClassification;
}

// --- Camera Intelligence Profile Types (Section 3 & 5) ---
export type CameraClass = 'AI_SMART' | 'ANPR' | 'NORMAL' | 'UNKNOWN' | 'OFFLINE';
export type PreferredDetector = 'YOLO' | 'ANPR' | 'ADVANCED_VISION' | 'NONE';
export type ProcessingPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type FrameQualityRating = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';

export interface CameraIntelligenceProfile {
  cameraId: string;
  cameraName: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'BUFFERING' | 'STALE';
  cameraClass: CameraClass;
  resolution: string;
  fps: number;
  supportsANPR: boolean;
  supportsHSRP: boolean;
  supportsAdvancedVision: boolean;
  aiEnabled: boolean;
  preferredDetector: PreferredDetector;
  lastFrameTimestamp?: number | string;
  lastFrameAge?: number;
  frameQuality?: FrameQualityRating | number;
  processingPriority: ProcessingPriority;
  district?: string;
  location?: string;
  edgeNodeId?: string;
  activeDetector?: PreferredDetector;
  totalDetectionsToday?: number;
  lastReadablePlate?: string;
  lastViolationTimestamp?: string;
  notes?: string;
}

export interface WatchlistTarget {
  id: string;
  name: string;
  imageUrl: string;
  threatLevel: 'critical' | 'high' | 'medium';
  associatedPlate?: string;
  lastKnownAttire?: string;
  dateAdded: string;
  targetId?: string;
  syntheticPersonId?: string;
  vehiclePlate?: string;
  alias?: string;
  attire?: string;
  severity?: 'critical' | 'high' | 'medium';
  createdAt?: string;
  updatedAt?: string;
  syncStatus?: string;
}

export interface WatchlistEntry {
  id: string;
  vehicleNumber?: string;
  personId?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive';
}

export interface Alert {
  id: string;
  type: 'intrusion' | 'loitering' | 'tampering' | 'watchlist' | 'crowd' | string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  cameraId: string;
  cameraName?: string;
  location?: string;
  timestamp: string;
  description: string;
  isRead: boolean;
  snapshotUrl: string;
  siteId?: string;
  vehicleNumber?: string;
  targetId?: string;
  personTrackId?: string;
  syntheticMatch?: boolean;
  label?: string;
  confidence?: number;
  status?: 'new' | 'acknowledged' | 'investigating' | 'closed';
  acknowledgedBy?: string;
  evidenceReference?: string;
  title?: string;
  evidenceId?: string;
  isSimulated?: boolean;
  sourceType?: string;
  sourceClassification?: SourceClassification;
}

export interface VehicleSighting {
  sightingId: string;
  vehicleId?: string;
  vehicleNumber?: string; // backwards compatibility alias for normalized plate
  normalizedPlate?: string;
  rawPlate?: string;
  plateConfidence: number;
  vehicleType?: string;
  vehicleTypeConfidence?: number;
  vehicleConfidence?: number; // backwards compatibility
  makeEstimate?: string;
  modelEstimate?: string;
  colorEstimate?: string;
  vehicleBoundingBox?: { xmin: number; ymin: number; xmax: number; ymax: number };
  plateBoundingBox?: { xmin: number; ymin: number; xmax: number; ymax: number };
  cameraId: string;
  cameraName?: string;
  siteId?: string;
  edgeNodeId?: string;
  sourceEdgeNode?: string; // backwards compatibility
  timestamp: string;
  latitude?: number;
  longitude?: number;
  heading?: number | string;
  direction?: string;
  sourceType?: SourceClassification | string;
  evidenceId?: string;
  snapshotReference?: string;
  clipReference?: string;
  watchlistStatus?: 'CLEAR' | 'WATCHLIST_CANDIDATE' | 'MATCH' | 'NO_MATCH' | 'UNKNOWN' | string;
  policeDataStatus?: 'RECORD_FOUND' | 'NO_RECORD' | 'NOT_CONNECTED' | 'SIMULATED' | string;
  correlationId?: string;
  createdAt?: string;
  eventId?: string; // backwards compatibility
  dataClassification?: 'REAL_CONNECTED' | 'REAL_CONFIGURED_NOT_CONNECTED' | 'REAL_DISCOVERED' | 'AUTHORIZED_UPLOADED_VIDEO' | 'YOUTUBE_DEMO' | 'SYNTHETIC_SIMULATION' | string;
}

export interface VehicleIdentity {
  normalizedPlate: string;
  rawPlate: string;
  firstSeen: string;
  lastSeen: string;
  totalSightings: number;
  primaryVehicleType: string;
  primaryColor: string;
  watchlistStatus: 'CLEAR' | 'WATCHLIST_CANDIDATE' | 'MATCH' | 'NO_MATCH' | 'UNKNOWN';
  label: 'VEHICLE RECORD';
  disclaimer: string;
}

export interface VehicleJourneySegment {
  fromCamera: string;
  fromCameraName?: string;
  toCamera: string;
  toCameraName?: string;
  departureTime: string;
  arrivalTime: string;
  distance: number | 'UNKNOWN'; // meters
  estimatedTravelTime: number | 'UNKNOWN'; // seconds
  estimatedSpeed: number | 'UNKNOWN'; // km/h
  confidence: number;
  fromGps?: { lat: number; lng: number };
  toGps?: { lat: number; lng: number };
  direction?: string;
}

export interface LastKnownSightingInfo {
  vehicleNumber: string;
  normalizedPlate: string;
  lastCamera: string;
  lastCameraName: string;
  lastTimestamp: string;
  lastLocation: string;
  lastDirection: string;
  lastSnapshot: string;
  lastConfidence: number;
  latitude: number;
  longitude: number;
  vehicleType: string;
  color: string;
  evidenceId?: string;
  watchlistStatus: string;
  sourceType: string;
  dataClassification: string;
}

export interface VehicleJourney {
  vehicleNumber: string;
  normalizedPlate?: string;
  sightings: VehicleSighting[];
  totalSightings: number;
  segments?: VehicleJourneySegment[];
  lastKnownLocation?: LastKnownSightingInfo | null;
  totalDistanceMeters?: number;
  firstSeen: string;
  lastSeen: string;
  camerasVisited: number;
  districtsVisited: number;
  durationMinutes: number;
  dataClassification?: string;
}

export interface VehicleSearchFilter {
  query?: string;
  plate?: string;
  vehicleType?: string;
  cameraId?: string;
  district?: string;
  watchlistOnly?: boolean;
  timeRange?: {
    start?: string;
    end?: string;
  };
  limit?: number;
}

export interface VehicleWatchlistMatch {
  matchId: string;
  vehicleNumber: string;
  watchlistId: string;
  sightingId: string;
  cameraId: string;
  cameraName?: string;
  timestamp: string;
  confidence: number;
  category: 'WANTED' | 'STOLEN' | 'BOLO' | 'MISSING' | 'INVESTIGATION' | 'TRAFFIC_ALERT' | 'OTHER';
  reason: string;
  status: 'HUMAN_VERIFICATION_REQUIRED' | 'CONFIRMED' | 'REJECTED' | 'ESCALATED';
  alertLevel: 'CRITICAL' | 'WARN' | 'INFO';
  evidenceId?: string;
  snapshotReference?: string;
}

export interface VehicleEvidenceRecord {
  evidenceId: string;
  sightingId: string;
  cameraId: string;
  timestamp: string;
  snapshotReference: string;
  vehicleBoundingBox?: { xmin: number; ymin: number; xmax: number; ymax: number };
  plateBoundingBox?: { xmin: number; ymin: number; xmax: number; ymax: number };
  plateConfidence: number;
  vehicleConfidence: number;
  sha256: string;
  capturePolicy: 'ONE_BEST_FRAME' | 'BURST_MODE';
  status: 'VERIFIED' | 'PENDING';
  isSimulation: boolean;
  label: string;
  integrityNotice: string;
}

export interface IVehicleHistoryRepository {
  saveSighting(sighting: VehicleSighting): Promise<VehicleSighting>;
  getVehicleHistory(normalizedPlate: string): Promise<VehicleSighting[]>;
  getLastKnownSighting(normalizedPlate: string): Promise<VehicleSighting | null>;
  getSightingsByCamera(cameraId: string, limit?: number): Promise<VehicleSighting[]>;
  getSightingsByTimeRange(startTime: string, endTime: string): Promise<VehicleSighting[]>;
  getVehicleJourney(normalizedPlate: string): Promise<VehicleJourney>;
  searchVehicles(filter: VehicleSearchFilter): Promise<VehicleSighting[]>;
  deleteDemoData(): Promise<void>;
  clearDemoHistory(): Promise<void>;
}

// AI Training Lab Domain Models
export type TrainingLabel = 
  | 'CAR' 
  | 'SUV' 
  | 'SEDAN' 
  | 'HATCHBACK' 
  | 'MOTORCYCLE' 
  | 'SCOOTER' 
  | 'AUTO_RICKSHAW' 
  | 'BUS' 
  | 'TRUCK' 
  | 'VAN' 
  | 'AMBULANCE' 
  | 'POLICE_VEHICLE' 
  | 'PERSON' 
  | 'NUMBER_PLATE' 
  | 'HELMET' 
  | 'NO_HELMET' 
  | 'WRONG_WAY' 
  | 'RED_LIGHT' 
  | 'STOP_LINE' 
  | 'DANGEROUS_PARKING';

export type AnnotationReviewStatus = 
  | 'AUTO_DETECTED' 
  | 'HUMAN_CORRECTED' 
  | 'HUMAN_VERIFIED' 
  | 'REJECTED';

export type TrainingLabWorkflowStatus = 
  | 'VIDEO_UPLOADED' 
  | 'EXTRACTING_FRAMES' 
  | 'ANNOTATION_REQUIRED' 
  | 'DATASET_READY' 
  | 'TRAINING_READY' 
  | 'TRAINING_RUNNING' 
  | 'TRAINING_COMPLETE' 
  | 'EVALUATION_READY' 
  | 'DEPLOYMENT_READY';

export interface TrainingVideoMetadata {
  videoId: string;
  fileName: string;
  fileSizeBytes: number;
  durationSeconds: number;
  resolution: string;
  fps: number;
  bitrateKbps: number;
  sourceType: 'AUTHORIZED_UPLOAD' | 'TRAFFIC_CORRIDOR_CAPTURE' | 'SIMULATION';
  sha256: string;
  uploadedAt: string;
}

export interface SamplingConfig {
  sampleRateFps: 1 | 2 | 5 | 10;
  totalDurationSec: number;
  estimatedFrames: number;
  estimatedDatasetMb: number;
}

export interface AnnotationBoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface AnnotationItem {
  annotationId: string;
  frameId: string;
  label: TrainingLabel;
  boundingBox: AnnotationBoundingBox;
  confidence: number;
  reviewStatus: AnnotationReviewStatus;
  annotator: string;
  timestamp: string;
  notes?: string;
}

export interface VideoFrameSample {
  frameId: string;
  frameNumber: number;
  timestampOffsetSec: number;
  timestampFormatted: string;
  imageUrl: string;
  annotations: AnnotationItem[];
  hasHumanCorrection: boolean;
  isFlaggedForEvaluation: boolean;
}

export interface ClassEvaluationMetric {
  label: TrainingLabel;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  sampleCount: number;
}

export interface ModelEvaluationMetrics {
  evaluationId: string;
  modelIdentifier: string;
  evaluatedAt: string;
  totalEvaluationFrames: number;
  overallPrecision: number;
  overallRecall: number;
  overallAccuracy: number;
  totalFalsePositives: number;
  totalFalseNegatives: number;
  perClassBreakdown: ClassEvaluationMetric[];
  evaluatedOnActualDataset: boolean;
  disclaimer: string;
}

export interface AuditRecord {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  resource: string;
  result: string;
  correlationId: string;
}

export interface DetectionEvent {
  id: string;
  cameraId: string;
  timestamp: string;
  objectType: 'person' | 'vehicle' | 'plate' | 'unidentified';
  confidence: number;
  metadata: {
    plate?: string;
    clothingColor?: string;
    vehicleType?: string;
    vehicleColor?: string;
    direction?: string;
    movementMode?: string;
  };
  snapshotUrl: string;
}

export interface IOnvifDiscovery {
  discoverDevices(): Promise<any[]>;
  getDeviceInformation(ip: string): Promise<any>;
  getProfiles(ip: string): Promise<any[]>;
  getStreams(ip: string): Promise<any[]>;
}

export type EdgeHealthState = 'STARTING' | 'AUTHENTICATING' | 'CONNECTING' | 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'SYNCING' | 'ERROR';

export interface IPersistenceProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface EdgeNode {
  id: string;
  siteId: string;
  status: 'online' | 'offline' | 'provisioning' | 'syncing';
  ipAddress: string;
  dvrCount: number;
  camerasConnected: number;
  lastHeartbeat: string;
  version: string;
  deviceCertificateId: string;
  capabilities: string[];
  createdAt: string;
  lastSeenAt: string;
  queuedEvents: number;
  syncState: 'synchronized' | 'pending' | 'offline';
  lastConfigUpdate: string;
  policyVersion: string;
  securityState: 'secure' | 'warning' | 'compromised';
}

export interface SecurityRule {
  id: string;
  name: string;
  targetNode: string;
  condition: {
    object: string;
    zone: string;
    time: string;
  };
  action: {
    event: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export type ViewMode = 'dashboard' | 'command_center' | 'missions' | 'incidents' | 'review_queue' | 'digital_twin' | 'system_brain' | 'scale_lab' | 'cameras' | 'youtube_demo' | 'real_ai_test_lab' | 'ai_mesh' | 'police_intel' | 'ai_training_lab' | 'federated' | 'sites' | 'search' | 'alerts' | 'watchlist' | 'tracking' | 'nodes' | 'policies' | 'challenge' | 'system' | 'challan_mode' | 'mobile_camera' | 'gov_deployment' | 'geospatial_map' | 'sentinel_grid' | 'night_audit' | 'raw_video_audit' | 'cyber_security';

// ============================================================
// NIGHT AUDIT ENGINE TYPES (BSA 2023 & POLICE SURVEILLANCE SPEC)
// ============================================================

export type AuditSessionStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type CameraAuditStatus =
  | 'AUDITED'
  | 'PARTIALLY_AUDITED'
  | 'NOT_AUDITED'
  | 'CAMERA_OFFLINE'
  | 'CAMERA_BUFFERING'
  | 'AI_UNAVAILABLE'
  | 'NO_VALID_FRAME';

export type StreamHealthState =
  | 'ONLINE'
  | 'BUFFERING'
  | 'CONNECTING'
  | 'OFFLINE'
  | 'NO_FRAME'
  | 'STALE_FRAME'
  | 'RECOVERED';

export type HsrpAuditState =
  | 'HSRP_COMPLIANT'
  | 'HSRP_NON_COMPLIANT'
  | 'HSRP_UNVERIFIED'
  | 'PLATE_NOT_VISIBLE';

export interface CameraGapRecord {
  gapId: string;
  startIso: string;
  endIso?: string;
  startTimestamp: number;
  endTimestamp?: number;
  durationMs?: number;
  reason: string;
  lastValidFrameSha256?: string;
  recoveryFrameSha256?: string;
}

export interface CameraOutageRecord {
  outageId: string;
  cameraId: string;
  cameraName: string;
  startIso: string;
  endIso?: string;
  startTimestamp: number;
  endTimestamp?: number;
  durationMs?: number;
  reason: string;
  status: 'ACTIVE' | 'RESOLVED';
}

export interface NightAuditTimelineItem {
  id: string;
  cameraId: string;
  timestampUtc: string;
  timestampIst: string;
  timestampMs: number;
  eventType:
    | 'VALID_FRAMES'
    | 'PERSON_DETECTED'
    | 'VEHICLE_DETECTED'
    | 'PLATE_DETECTED'
    | 'PLATE_READ'
    | 'HSRP_VERIFIED'
    | 'HSRP_NON_COMPLIANT'
    | 'HSRP_UNVERIFIED'
    | 'MULTIPLE_PERSONS'
    | 'STREAM_GAP'
    | 'RECOVERED'
    | 'AI_UNAVAILABLE';
  label: string;
  description: string;
  evidenceId?: string;
  snapshotUrl?: string;
  plateText?: string | null;
  hsrpStatus?: HsrpAuditState;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
}

export interface NightAuditEvidenceItem {
  evidenceId: string;
  auditId: string;
  eventId: string;
  cameraId: string;
  cameraName: string;
  district: string;
  location: string;
  captureTimestampUtc: string;
  displayTimestampIst: string;
  frameTimestamp: number;
  originalFrameUrl: string;
  thumbnailCropUrl?: string;
  eventType: string;
  vehicleInfo?: {
    trackId?: string;
    class?: string;
    color?: string;
    confidence?: number;
  };
  personInfo?: {
    personId?: string;
    confidence?: number;
  };
  plateInfo?: {
    plateDetected: boolean;
    plateText: string | null;
    ocrConfidence?: number | null;
  };
  hsrpInfo?: {
    status: HsrpAuditState;
    reason: string;
    laserBrandVerified?: boolean;
    hologramVerified?: boolean;
  };
  aiProvider: string;
  aiModel: string;
  analysisLatencyMs: number;
  evidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNUSABLE';
  sha256: string;
  cropSha256?: string;
  byteSize: number;
  mimeType: string;
  storageRef: string;
}

export interface CameraAuditMetric {
  cameraId: string;
  cameraName: string;
  district: string;
  location: string;
  codec: string;
  sourceInfo: string;
  status: CameraAuditStatus;
  streamState: StreamHealthState;
  framesExpected: number;
  framesReceived: number;
  framesAnalyzed: number;
  framesRejected: number;
  coveragePercent: number;
  firstFrameTimestamp: number | null;
  lastFrameTimestamp: number | null;
  gapCount: number;
  totalGapDurationMs: number;
  gaps: CameraGapRecord[];
  eventsCount: number;
  evidenceCount: number;
  personsCount: number;
  vehiclesCount: number;
  platesDetectedCount: number;
  platesReadCount: number;
  hsrpVerifiedCount: number;
  hsrpNonCompliantCount: number;
  hsrpUnverifiedCount: number;
  lastFrameSha256?: string;
  lastFrameDimensions?: string;
  lastFrameByteSize?: number;
  lastAcquisitionLatencyMs?: number;
  lastError?: string | null;
  timeline: NightAuditTimelineItem[];
}

export interface NightAuditConfig {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  sampleRateFps: number;
  activeSceneFps: number;
  timezone: string;
  operator: string;
  autoStartOnSchedule: boolean;
}

export interface NightAuditReport {
  auditId: string;
  title: string;
  jurisdiction: string;
  status: AuditSessionStatus;
  startTimeUtc: string;
  endTimeUtc: string;
  timezone: string;
  operator: string;
  durationFormatted: string;
  totalCameras: number;
  auditedCameras: number;
  partiallyAuditedCameras: number;
  offlineCameras: number;
  bufferingCameras: number;
  averageCoveragePercent: number;
  totalFramesExpected: number;
  totalFramesReceived: number;
  totalFramesAnalyzed: number;
  totalFramesRejected: number;
  aiSummary: {
    preferredProvider: string;
    activeProvider: string;
    activeModel: string;
    successfulAnalyses: number;
    failedAnalyses: number;
    unavailablePeriods: number;
  };
  personSummary: {
    totalConfirmedPersons: number;
  };
  vehicleSummary: {
    totalConfirmedVehicles: number;
    classBreakdown: Record<string, number>;
  };
  plateSummary: {
    platesDetected: number;
    platesSuccessfullyRead: number;
    unreadablePlates: number;
  };
  hsrpSummary: {
    hsrpVerified: number;
    hsrpNonCompliant: number;
    hsrpUnverified: number;
    plateNotVisible: number;
  };
  evidenceSummary: {
    totalEvidenceSnapshots: number;
    storageStatus: string;
    sampleHashes: Array<{ evidenceId: string; sha256: string; cameraId: string }>;
  };
  cameraCoverageTable: Array<{
    cameraId: string;
    cameraName: string;
    district: string;
    expected: number;
    received: number;
    analyzed: number;
    coverage: string;
    gaps: number;
    status: CameraAuditStatus;
    streamState: StreamHealthState;
  }>;
  outagesLog: Array<{
    cameraId: string;
    cameraName: string;
    start: string;
    end: string;
    duration: string;
    reason: string;
  }>;
}

// ============================================================
// SENTINEL CAMERA GRID ARCHITECTURE TYPES (SCRB SANDBOX SPEC)
// ============================================================

export type SentinelCodec = 'H.264' | 'H.265';
export type SentinelStreamStatus = 'live' | 'offline' | 'reconnecting' | 'degraded';

export interface SentinelCameraCatalogueItem {
  id: string; // e.g. "1", "2", "cam-101"
  name: string; // e.g. "SG Highway - Pakwan Cross Road"
  location: string; // District / Junction description
  district: string; // Gandhinagar, Ahmedabad, Surat, Rajkot, etc.
  codec: SentinelCodec;
  status: SentinelStreamStatus;
  resolution: string; // e.g. "1920x1080", "2560x1440", "1280x720"
  fps: number; // Declared nominal FPS (e.g. 25, 30)
  bitrateKbps: number; // e.g. 4096
  rtspUrl: string; // rtsp://<host>:8554/stream/<id>
  whepUrl: string; // http://<host>:8889/stream/<id>/whep
  hlsUrl: string;  // http://<host>/live/stream/<id>/index.m3u8
  gopSize?: number; // GOP / Keyframe interval (e.g. 50 frames)
  sampleVideoUrl?: string; // Fallback video for in-browser visual playback preview
  lastSeenIso?: string;
  metadata?: {
    cameraType?: 'FIXED' | 'PTZ' | 'ANPR' | 'SPEED_DOME';
    latitude?: number;
    longitude?: number;
    sensorFormat?: string;
  };
}

export interface SentinelIngestCatalogueResponse {
  gateway: string;
  version: string;
  timestamp: string;
  cameraCount: number;
  cameras: SentinelCameraCatalogueItem[];
}

export interface SentinelComplianceCheckItem {
  id: string;
  category: 'TRANSPORT' | 'TIMING' | 'RESILIENCE' | 'DECODER' | 'CATALOGUE' | 'DISCONTINUITY';
  title: string;
  directive: string;
  passed: boolean;
  notes: string;
  timestamp?: string;
}

// ============================================================
// MOBILE CAMERA ARCHITECTURE TYPES (PHASE 1: REAL BROWSER SOURCE)
// ============================================================

export type MobileCameraConnectionState = 
  | 'DISCONNECTED' 
  | 'REQUESTING_PERMISSION' 
  | 'CONNECTED' 
  | 'PAUSED' 
  | 'ERROR';

export type MobileCameraAIState = 
  | 'NOT_STARTED' 
  | 'READY' 
  | 'ANALYZING' 
  | 'STOPPED' 
  | 'ERROR';

export type MobileCameraAnalysisMode = 
  | 'NONE' 
  | 'REAL_AI' 
  | 'SIMULATED_AI';

export interface MobileCameraProvenance {
  sourceType: 'MOBILE_CAMERA';
  sourceStatus: 'REAL_CAMERA';
  captureMethod: 'BROWSER_GET_USER_MEDIA';
  analysisMode: 'NONE';
}

export interface MobileCameraFrame {
  frameId: string;
  cameraId: string;
  capturedAt: string;
  width: number;
  height: number;
  sourceType: 'MOBILE_CAMERA';
  sourceStatus: 'REAL_CAMERA';
  captureMethod: 'BROWSER_GET_USER_MEDIA';
  analysisMode: 'NONE';
  frameReference: string; // Data URL or Blob URL of real frame
  sequenceNumber: number;
  // Optional real GPS telemetry if allowed/available by browser geolocation
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface MobileCameraMetrics {
  framesCaptured: number;
  framesSampled: number;
  lastFrameTimestamp?: string;
  cameraWidth: number;
  cameraHeight: number;
  samplingRate: number; // e.g. 1 FPS
  droppedFrames: number;
}

export interface MobileCameraSession {
  sessionId: string;
  cameraId: string;
  startedAt: string;
  stoppedAt?: string;
  frameCount: number;
  sampledFrameCount: number;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';
  analysisMode: 'NONE';
  sourceType: 'MOBILE_CAMERA';
}

export interface ICameraSource {
  readonly id: string;
  readonly name: string;
  readonly sourceType: VideoSourceType;
  readonly deviceType: string;
  getConnectionState(): MobileCameraConnectionState;
  getAnalysisMode(): MobileCameraAnalysisMode;
  attachVideoElement(video: HTMLVideoElement): void;
  start(constraints?: MediaStreamConstraints): Promise<MediaStream>;
  stop(): Promise<void>;
  pause(): void;
  resume(): void;
  captureFrame(): Promise<MobileCameraFrame | null>;
  getStream(): MediaStream | null;
  getMetrics(): MobileCameraMetrics;
}

// --- EDGE <-> CENTRAL MESSAGING PROTOCOLS ---

export interface HeartbeatPayload {
  edgeNodeId: string;
  timestamp: string;
  agentVersion: string;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  connectedDvrCount: number;
  connectedCameraCount: number;
}

export interface DVRDiscoveryPayload {
  edgeNodeId: string;
  dvrId: string;
  manufacturer: string;
  model: string;
  address: string;
  channels: number;
  status: 'online' | 'offline' | 'error';
}

export interface CameraDiscoveryPayload {
  edgeNodeId: string;
  dvrId: string;
  cameraId: string;
  channel: number;
  name: string;
  address: string;
  status: 'online' | 'offline' | 'error';
}

export interface SecurityEventPayload {
  eventId: string;
  edgeNodeId: string;
  siteId: string;
  cameraId: string;
  timestamp: string;
  eventType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  metadata: Record<string, any>;
  snapshotReference?: string;
  recordingReference?: string;
}

export interface PolicyDeploymentPayload {
  policyId: string;
  version: string;
  issuedAt: string;
  expiresAt: string;
  rules: SecurityRule[];
  signature: string;
  hash: string;
  status: 'active' | 'expired' | 'invalid';
}

export interface ConfigurationPayload {
  configVersion: string;
  serverEndpoint: string;
  heartbeatInterval: number;
  eventBatchSize: number;
  retentionSettings: Record<string, any>;
}

export interface CommandPayload {
  commandId: string;
  command: 'refreshDeviceDiscovery' | 'synchronize' | 'updatePolicy' | 'restartAgent' | 'requestStatus';
  parameters?: Record<string, any>;
  issuedBy: string;
  timestamp: string;
  signature: string;
}

// --- ARCHITECTURE ABSTRACTIONS ---

export interface IEdgeTransport {
  authenticate(certId: string): Promise<boolean>;
  sendHeartbeat(payload: any): Promise<any>;
  sendEvent(payload: SecurityEventPayload): Promise<void>;
  getCommands(): Promise<CommandPayload[]>;
}

export interface ICameraAdapter {
  discoverCameras(dvrId: string): Promise<CameraDiscoveryPayload[]>;
  captureSnapshot(cameraId: string): Promise<string>;
}

// V0.7 Vendor-Agnostic Connector Contracts
export interface IDVRAdapter {
  connect(dvrId?: string, config?: any): Promise<boolean>;
  disconnect?(): Promise<void>;
  getStatus?(): Promise<'online' | 'offline' | 'degraded'>;
  healthCheck(): Promise<FeedHealthState | string>;
  getDeviceInfo(): Promise<any>;
  discoverChannels(): Promise<any[]>;
  getChannelInfo?(channelId: string | number): Promise<any>;
  getStreamInfo?(channelId: string | number): Promise<any>;
  getSnapshot?(channelId: string | number): Promise<string>;
  getPlaybackCapabilities?(): Promise<any>;
  getRecordingAvailability?(): Promise<any>;
  playback?(streamId: string): Promise<any>;
  getStreamUrl?(channelId: string | number): Promise<any>;
  getRTSPUrl?(channelId: string | number): Promise<string>;
  queryRecordings?(channelId: string | number, timeRange?: any): Promise<any[]>;
  getConnectionState(): 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'CONNECTING';
}

export interface ICameraStreamAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<FeedHealthState | string>;
  getSnapshot(): Promise<string>;
  getStreamMetadata(): Promise<StreamMetadata>;
  getStreamURL(): Promise<string>;
  getStatus(): 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'NO_STREAM';
}

export interface IVideoSourceDiscovery {
  discover(): Promise<DiscoveredVideoDevice[]>;
  discoverByNetwork?(subnet?: string): Promise<DiscoveredVideoDevice[]>;
  discoverByConfiguration?(config: any): Promise<DiscoveredVideoDevice[]>;
  normalizeDevice(rawDevice: any): DiscoveredVideoDevice;
  normalizeChannel(rawChannel: any, parentDevice: DiscoveredVideoDevice): Camera;
}

export interface IVideoSourceRegistry {
  registerSource(source: DiscoveredVideoDevice): void;
  unregisterSource(sourceId: string): boolean;
  getSource(sourceId: string): DiscoveredVideoDevice | undefined;
  listSources(): DiscoveredVideoDevice[];
  updateHealth(sourceId: string, health: FeedHealthState): void;
}

export interface IVendorVMSAdapter {
  authenticate(): Promise<boolean>;
  listDevices(): Promise<any[]>;
  listChannels(deviceId: string): Promise<any[]>;
  getCameraStatus(cameraId: string): Promise<'online' | 'offline' | 'degraded'>;
  getSnapshot(cameraId: string): Promise<string>;
  getStream(cameraId: string): Promise<string>;
  queryRecordings(cameraId: string, timeRange?: any): Promise<any[]>;
}

// V0.7 Structured Inference Interfaces
export interface InferenceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ANPRResult {
  plate: string;
  confidence: number;
  boundingBox?: InferenceBoundingBox;
  timestamp: string;
  cameraId: string;
  isSimulated?: boolean;
}

export interface VehicleDetectionResult {
  vehicleType: string;
  vehicleColor: string;
  confidence: number;
  boundingBox?: InferenceBoundingBox;
  timestamp: string;
  cameraId: string;
  isSimulated?: boolean;
}

export interface PersonDetectionResult {
  syntheticPersonId: string;
  confidence: number;
  boundingBox?: InferenceBoundingBox;
  timestamp: string;
  cameraId: string;
  clothingColor?: string;
  isSimulated?: boolean;
}

export interface IAIInferenceProvider {
  name: string;
  type: 'LOCAL_CV' | 'TENSOR_RT' | 'OPENCV' | 'YOLO' | 'EDGE_GPU' | 'SYNTHETIC_SIMULATOR';
  status: 'IMPLEMENTED' | 'INTEGRATION_READY' | 'SIMULATED' | 'FUTURE_DEPLOYMENT';
  processFrame(input: { frameData: string; cameraId: string; timestamp?: string }): Promise<{
    plates: ANPRResult[];
    vehicles: VehicleDetectionResult[];
    persons: PersonDetectionResult[];
    helmets: HelmetDetectionResult[];
  }>;
}

export interface IPolicyEngine {
  verifySignature(policy: PolicyDeploymentPayload): boolean;
  applyPolicy(policy: PolicyDeploymentPayload): void;
  evaluateRules(event: SecurityEventPayload): void;
}

export interface IEventQueue {
  enqueue(event: SecurityEventPayload): void;
  dequeueBatch(size: number): SecurityEventPayload[];
  getPendingCount(): number;
  clearAcked(eventIds: string[]): void;
}

export interface ICentralAPI {
  registerNode(identity: any): Promise<boolean>;
  receiveHeartbeat(payload: HeartbeatPayload): Promise<void>;
  receiveEvent(payload: SecurityEventPayload): Promise<'ACK' | 'DUPLICATE'>;
  dispatchCommand(nodeId: string, cmd: CommandPayload): void;
}

export interface IEventRepository {
  createEvent(event: SecurityEventPayload): 'ACK' | 'DUPLICATE';
  getEvent(eventId: string): SecurityEventPayload | undefined;
  searchEvents(query: string): SecurityEventPayload[];
  acknowledgeEvent(eventId: string): void;
  getEventsByEdgeNode(nodeId: string): SecurityEventPayload[];
  getEventsByCamera(cameraId: string): SecurityEventPayload[];
  getEventsByPlate(plate: string): SecurityEventPayload[];
  getAllEvents(): SecurityEventPayload[];
}

export interface IVehicleInvestigationService {
  searchVehicle(query: string): Promise<VehicleSighting[]>;
}

export interface IVehicleTrackingService {
  correlateVehicleEvents(vehicleNumber: string): Promise<VehicleJourney>;
}

export interface IWatchlistService {
  checkWatchlist(vehicleNumber: string): Promise<WatchlistEntry | null>;
}

export interface IAuditService {
  log(user: string, action: string, resource: string, result: string, correlationId: string): Promise<void>;
  getLogs(): Promise<AuditRecord[]>;
}

export interface IANPRService {
  extractPlate(imageReference: string): Promise<{ plate: string; confidence: number }>;
}

export interface IVehicleDetectionService {
  detectVehicle(imageReference: string): Promise<{ vehicleType: string; color: string; confidence: number; boundingBox?: [number, number, number, number] }>;
}

export interface IPersonDetectionService {
  detectPerson(imageReference: string): Promise<{ personId?: string; clothingColor?: string; confidence: number }>;
}

export interface IPersonSearchService {
  searchPerson(query: { personId?: string; appearanceEmbeddingReference?: string; clothingColor?: string }): Promise<any[]>;
}

export interface IEventAnalyticsService {
  analyzeEvent(event: SecurityEventPayload): Promise<{ anomalyScore: number; riskLevel: 'low' | 'medium' | 'high' | 'critical' }>;
}

export interface ICrossCameraSearchService {
  searchAcrossCameras(query: { target: string; targetType: 'vehicle' | 'person'; startTime?: string; endTime?: string }): Promise<VehicleSighting[]>;
}

export interface IEventStream {
  subscribe(callback: (event: SecurityEventPayload) => void): () => void;
}

export interface ISimulationEventProducer {
  start(intervalMs: number): void;
  stop(): void;
  generateSingleEvent(): SecurityEventPayload;
}

export interface EvidenceRecord {
  evidenceId: string;
  eventId: string;
  cameraId: string;
  siteId: string;
  timestamp: string;
  sourceEdgeNode: string;
  detectionConfidence: number;
  snapshotUrl: string;
  clipUrl?: string;
  sha256Hash: string;
  createdAt: string;
  label: string;
  integrityNotice?: string;
  isSimulation?: boolean;
  correlationId?: string;
  latitude?: number;
  longitude?: number;
  sourceClassification?: SourceClassification;
}

export interface SystemReadinessItem {
  name: string;
  component?: string;
  tier?: string;
  category: string;
  status: 'IMPLEMENTED' | 'SIMULATED' | 'FUTURE_INTEGRATION' | 'FUTURE' | 'INTEGRATION_READY' | 'FUTURE_DEPLOYMENT';
  statusIcon: string;
  description: string;
  verificationMethod?: string;
}

export interface CommLogEntry {
  id: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  type: string;
  payloadSize: number; // in bytes
  status: 'success' | 'failed' | 'pending';
  requestId?: string;
}

// --- V0.6 GOD'S EYE & MULTI-MODAL INTELLIGENCE TYPES ---

export type HelmetStatus = 'HELMET' | 'NO_HELMET' | 'UNKNOWN';

export interface HelmetDetectionResult {
  status: HelmetStatus;
  confidence: number;
  simulated: boolean;
  cameraId: string;
  timestamp: string;
}

export interface IHelmetDetectionService {
  detectHelmet(imageReference: string, metadata?: any): Promise<HelmetDetectionResult>;
}

export type EvidenceCaptureReason = 
  | 'ANPR_MATCH' 
  | 'PERSON_TRACK' 
  | 'VEHICLE_DETECTION' 
  | 'NO_HELMET' 
  | 'HELMET_VIOLATION'
  | 'WATCHLIST_MATCH' 
  | 'MANUAL_CAPTURE'
  | 'MANUAL_INVESTIGATION';

export interface EvidenceItem {
  evidenceId: string;
  id?: string;
  eventId: string;
  cameraId: string;
  timestamp: string;
  targetId: string;
  captureReason: EvidenceCaptureReason;
  reason?: EvidenceCaptureReason;
  imageReference: string;
  imageUrl?: string;
  sha256: string;
  sha256Hash?: string;
  status: 'VERIFIED' | 'PENDING';
  isSimulation: boolean;
  label: string;
  integrityNotice?: string;
  correlationId?: string;
  latitude?: number;
  longitude?: number;
  sourceEdgeNode?: string;
  metadata?: any;
}

export interface IEvidenceCaptureService {
  captureEvidence(params: {
    eventId: string;
    cameraId: string;
    targetId: string;
    reason: EvidenceCaptureReason;
    correlationId?: string;
    metadata?: any;
  }): Promise<EvidenceItem>;
}

export interface PersonSighting {
  personTrackId: string;
  eventId: string;
  cameraId: string;
  edgeNodeId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  direction?: string;
  confidence: number;
  evidenceId: string;
  helmetStatus?: HelmetStatus;
  helmetConfidence?: number;
  associatedVehicle?: string;
  snapshotReference?: string;
}

export interface PersonTrajectory {
  personTrackId: string;
  sightings: PersonSighting[];
  totalSightings: number;
  firstSeen: string;
  lastSeen: string;
  camerasVisited: number;
  districtsVisited?: number;
  durationMinutes?: number;
  associatedVehicle?: string;
  correlationConfidence?: number;
}

export interface IPersonTrackingService {
  trackPerson(personTrackId: string): Promise<PersonTrajectory | null>;
  getPersonTrajectory(personTrackId: string): Promise<PersonTrajectory | null>;
  correlatePersonSightings(personTrackId: string, vehicleNumber?: string): Promise<{
    personTrackId: string;
    vehicleNumber: string;
    correlationConfidence: number;
    jointSightingsCount: number;
    sightings: any[];
  }>;
  searchPersonTrack(query: string): Promise<PersonSighting[]>;
}

export interface GodsEyeTargetSighting {
  sightingId: string;
  eventId: string;
  correlationId?: string;
  cameraId: string;
  cameraName?: string;
  edgeNodeId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  mapX?: number;
  mapY?: number;
  direction?: string;
  confidence: number;
  plate?: string;
  plateConfidence?: number;
  vehicleType?: string;
  vehicleColor?: string;
  personTrackId?: string;
  helmetStatus?: HelmetStatus;
  helmetConfidence?: number;
  evidenceId: string;
  snapshotUrl?: string;
  alertTriggered?: boolean;
  alertId?: string;
  alertDescription?: string;
}

export interface GodsEyeTargetRecord {
  targetId: string;
  targetType: 'vehicle' | 'person' | 'correlated';
  associatedTargetId?: string;
  correlationConfidence?: number;
  sightings: GodsEyeTargetSighting[];
  totalSightings: number;
  firstSeen: string;
  lastSeen: string;
  camerasVisited: number;
  edgeNodesVisited: number;
  districtsVisited: number;
  durationMinutes: number;
  alertsCount: number;
  evidenceCount: number;
  watchlistStatus?: string;
  helmetSummary?: {
    helmetCount: number;
    noHelmetCount: number;
    unknownCount: number;
    primaryState: HelmetStatus;
  };
}

export interface GodsEyeFilterOptions {
  targetType?: 'all' | 'vehicle' | 'person';
  district?: string;
  camera?: string;
  edgeNode?: string;
  alertStatus?: 'all' | 'alerts_only';
  confidenceThreshold?: number;
  helmetStatus?: 'all' | 'HELMET' | 'NO_HELMET';
  watchlistStatus?: 'all' | 'watchlist_only';
  timeRange?: {
    start?: string;
    end?: string;
  };
}

// ============================================================
// GUJARAT UNIFIED CCTV INTELLIGENCE GRID — V1.1 EXTENSIONS
// ============================================================

/**
 * Standardized License Plate Normalization Helper
 * Eliminates spacing, dashes, special punctuation, and ensures standard uppercase format.
 * Example: 'GJ-05-AB-1234' -> 'GJ05AB1234'
 */
export function normalizeLicensePlate(input: string): string {
  if (!input) return '';
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Standardized ANPR Event Model
 * Required fields: eventId, cameraId, edgeNodeId, timestamp, plate, plateConfidence,
 * vehicleClass, direction, location, imageReference, correlationId, sourceMode, status.
 */
export type AnprEventStatus = 
  | 'VERIFIED'
  | 'UNREADABLE'
  | 'PLATE_UNKNOWN'
  | 'WATCHLIST_MATCH'
  | 'SUSPECT'
  | 'NORMAL';

export type AnprEventType = 
  | 'LICENSE_PLATE_DETECTED'
  | 'VEHICLE_SIGHTING'
  | 'VEHICLE_WATCHLIST_MATCH';

export interface StandardAnprEvent {
  eventId: string;
  cameraId: string;
  edgeNodeId: string;
  timestamp: string;
  plate: string;
  plateConfidence: number;
  vehicleClass: string;
  direction?: string;
  location: string;
  imageReference?: string;
  correlationId: string;
  sourceMode: 'LIVE' | 'DEMO' | 'SIMULATED' | 'REAL_AI';
  status: AnprEventStatus;
  eventType: AnprEventType;
  metadata?: Record<string, any>;
}

/**
 * Authorized Vehicle Data Lookup Abstraction
 * Strict constraint: Never claim live integration with VAHAN or government database
 * unless an actual authorized API integration exists.
 */
export interface VehicleDataRecord {
  registrationNumber: string;
  makerModel?: string;
  vehicleClass?: string;
  fuelType?: string;
  registrationDate?: string;
  rtoLocation?: string;
  lookupStatus: 'NOT_CONNECTED' | 'AUTHORIZED_API' | 'FUTURE_INTEGRATION';
  disclaimer: string;
}

export interface IVehicleDataProvider {
  providerId: string;
  providerName: string;
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'FUTURE_INTEGRATION' | 'SIMULATED';
  lookupVehicle(registrationNumber: string): Promise<VehicleDataRecord>;
}

/**
 * Safe Mock Implementation for Vehicle Data Provider
 * Always truthfully states DATABASE LOOKUP: NOT CONNECTED
 */
export class SafeMockVehicleDataProvider implements IVehicleDataProvider {
  public providerId = 'VEHICLE-PROVIDER-MOCK';
  public providerName = 'Gujarat Transport VAHAN Integration Interface (Abstracted)';
  public status: 'NOT_CONNECTED' = 'NOT_CONNECTED';

  async lookupVehicle(registrationNumber: string): Promise<VehicleDataRecord> {
    const normalized = normalizeLicensePlate(registrationNumber);
    return {
      registrationNumber: normalized,
      lookupStatus: 'NOT_CONNECTED',
      disclaimer: 'DATABASE LOOKUP: NOT CONNECTED (Production integration requires authorized State Transport Department API credentials)'
    };
  }
}

/**
 * Biometric Watchlist Provider Abstraction
 * Strict constraint: Never claim real facial identification.
 * Uses synthetic investigation subjects only.
 */
export interface BiometricMatchResult {
  matchFound: boolean;
  subjectId?: string;
  subjectName?: string;
  correlationConfidence: number;
  providerStatus: 'NOT_CONNECTED' | 'SYNTHETIC_SIMULATION' | 'FUTURE_BIOMETRIC_INTEGRATION';
  disclaimer: string;
}

export interface IBiometricWatchlistProvider {
  providerId: string;
  providerName: string;
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'FUTURE_INTEGRATION' | 'SIMULATED';
  verifySubject(embeddingRef: string): Promise<BiometricMatchResult>;
}

export class SafeMockBiometricProvider implements IBiometricWatchlistProvider {
  public providerId = 'BIOMETRIC-PROVIDER-MOCK';
  public providerName = 'State Biometric Watchlist Abstraction Interface';
  public status: 'NOT_CONNECTED' = 'NOT_CONNECTED';

  async verifySubject(embeddingRef: string): Promise<BiometricMatchResult> {
    return {
      matchFound: false,
      correlationConfidence: 0.0,
      providerStatus: 'NOT_CONNECTED',
      disclaimer: 'SYNTHETIC INVESTIGATION SUBJECT / AI VISUAL CORRELATION — NOT BIOMETRIC IDENTITY (Production integration requires authorized biometric provider)'
    };
  }
}

/**
 * Federated CCTV Integration Models
 */
export type FederatedDepartmentType = 
  | 'TRAFFIC'
  | 'HIGHWAY'
  | 'CITY_POLICE'
  | 'OTHER_GOVERNMENT';

export type IntegrationInfrastructureModel = 
  | 'LOCAL_INFRASTRUCTURE'
  | 'CLOUD_INFRASTRUCTURE'
  | 'HYBRID_INFRASTRUCTURE';

export type FederatedIntegrationStatus = 
  | 'CONNECTED'
  | 'CONFIGURED'
  | 'INTEGRATION_READY'
  | 'FUTURE_INTEGRATION'
  | 'SIMULATED';

export interface DepartmentVideoRetentionPolicy {
  departmentType: FederatedDepartmentType;
  departmentName: string;
  rawVideoRetentionDays: number;
  isRawVideoExpired: boolean;
  eventMetadataRetentionYears: number;
  evidenceRetentionYears: number;
  policyNotes: string;
}

export interface FederatedDepartmentSource {
  id: string;
  name: string;
  departmentType: FederatedDepartmentType;
  jurisdiction: string;
  infrastructureModel: IntegrationInfrastructureModel;
  integrationStatus: FederatedIntegrationStatus;
  targetCameraCapacity: number;
  actualConnectedCameras: number;
  simulatedCameras: number;
  vmsType: string;
  retentionPolicy: DepartmentVideoRetentionPolicy;
  edgeAdaptersCount: number;
  normalizationProtocol: string;
  disclaimer: string;
}

// ============================================================
// GUJARAT UNIFIED CCTV INTELLIGENCE GRID DOMAIN MODEL & PHYSICAL SITE REGISTRY
// ============================================================

/**
 * Operational connectivity status for edge gateways and DVR/NVR stream adapters.
 */
export type GatewayStatus = 
  | 'CONNECTED' 
  | 'DEGRADED' 
  | 'OFFLINE' 
  | 'INITIALIZING' 
  | 'ERROR';

/**
 * Integration lifecycle state for CCTV sites and federated departments.
 */
export type CctvIntegrationStatus = 
  | 'CONNECTED'
  | 'INTEGRATION_READY'
  | 'CONFIGURED'
  | 'SIMULATED'
  | 'FUTURE';

/**
 * Formalized video and evidentiary retention policy configuration.
 */
export interface RetentionPolicy {
  rawVideoRetentionDays: number;
  eventRetentionYears: number;
  evidenceRetentionYears: number;
  isRawVideoExpired?: boolean;
  departmentType?: FederatedDepartmentType | string;
  departmentName?: string;
  policyNotes?: string;
}

/**
 * Edge gateway appliance or physical DVR/NVR hardware adapter mediating camera channels.
 */
export interface SiteGateway {
  gatewayId: string;
  gatewayName?: string;
  siteId: string;
  ipAddress: string;
  port?: number;
  status: GatewayStatus;
  connectionStatus?: GatewayStatus;
  version?: string;
  activeChannels?: number;
  lastHeartbeat?: string;
  lastHealthCheck?: string;
  protocol: 'ONVIF' | 'RTSP' | 'CP_PLUS' | 'HIKVISION' | 'DAHUA' | 'VMS' | 'SIMULATED' | string;
  adapterType?: string;
  vendor?: string;
  model?: string;
  channelCount?: number;
  discoveredDevicesCount?: number;
  connectedDevicesCount?: number;
  securityStatus: 'SECURE_MUTUAL_TLS' | 'STANDARD_ENCRYPTED' | 'LOCAL_ISOLATED' | 'SECURE' | 'AUDIT_REQUIRED' | 'NON_COMPLIANT';
  sourceClassification?: SourceClassification;
}

/**
 * Physical CCTV site installation (command junction, toll plaza, station, or outpost).
 */
export interface CctvSite {
  siteId: string;
  siteName: string;
  district: string;
  location: string;
  department: string;
  departmentId?: string;
  gatewayId: string;
  gateways?: SiteGateway[];
  gatewayStatus: GatewayStatus;
  status?: 'ACTIVE' | 'INACTIVE' | 'DEGRADED' | 'MAINTENANCE';
  dvrVendor: string;
  dvrModel: string;
  dvrAddress: string; // Internal local network IP (e.g. 192.168.x.x) — no passwords stored!
  protocol: string;
  channelCount: number;
  discoveredChannelCount?: number;
  connectedChannelCount: number;
  lastHeartbeat: string;
  integrationStatus: CctvIntegrationStatus;
  retentionPolicy: RetentionPolicy;
  networkStatus: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  securityStatus: 'SECURE' | 'AUDIT_REQUIRED' | 'NON_COMPLIANT';
  sourceClassification: SourceClassification;
  notes?: string;
}

/**
 * Statewide autonomous department integration registry entity.
 */
export interface DepartmentIntegration {
  departmentId: string;
  id?: string;
  departmentName: string;
  name?: string;
  sourceSystem: string;
  tech?: string;
  technology?: string;
  cameraCount: number;
  cameras?: number;
  rawDays?: number;
  deploymentType: 'LOCAL_EDGE' | 'HYBRID_SECURE' | 'CENTRAL_CLOUD';
  retentionPolicy: RetentionPolicy;
  integrationStatus: 'CONNECTED' | 'PARTIALLY_CONNECTED' | 'INTEGRATION_READY' | 'SIMULATED' | 'FUTURE';
  status?: 'CONNECTED' | 'PARTIALLY_CONNECTED' | 'INTEGRATION_READY' | 'SIMULATED' | 'FUTURE';
  lastSync: string;
  dataOwner: string;
}

// 9-Stage ONVIF / DVR Discovery State Machine
export type OnvifDiscoveryState = 
  | 'DISCOVERING'
  | 'AUTHENTICATING'
  | 'DEVICE_FOUND'
  | 'CHANNELS_DISCOVERED'
  | 'STREAM_TESTING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'OFFLINE'
  | 'ERROR';

// Vendor-Agnostic Adapter Lifecycle Contract
export interface ICctvAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  healthCheck(): Promise<{ isHealthy: boolean; status: string; latencyMs: number }>;
  getDeviceInfo(): Promise<{ vendor: string; model: string; serialNumber?: string; firmwareVersion?: string }>;
  discoverChannels(): Promise<Array<{ channelId: string; channelNumber: number; name: string; isLive: boolean }>>;
  getChannelInfo(channelId: string): Promise<any>;
  getStreamInfo(channelId: string): Promise<{ codec: string; resolution: string; fps: number; bitrateKbps: number }>;
  getSnapshot(channelId: string): Promise<{ snapshotUrl: string; timestamp: string } | null>;
  getStreamUrl(channelId: string): Promise<string>;
  getEvents?(): Promise<any[]>;
  getRecordingInfo?(channelId: string): Promise<{ retentionDays: number; earliestRecording?: string; latestRecording?: string }>;
}

// Directed Camera Topology Models
export interface CameraTopologyNode {
  cameraId: string;
  name: string;
  latitude: number;
  longitude: number;
  heading: number; // 0-360 degrees
  roadSegmentId: string;
  junctionId: string;
  junctionName: string;
  district: string;
  direction: string; // Northbound, Eastbound, etc.
  speedLimitKmh: number;
  roadType: 'NATIONAL_HIGHWAY' | 'STATE_HIGHWAY' | 'ARTERIAL_CITY' | 'JUNCTION_RING';
  incomingConnections: string[]; // Adjacent upstream camera IDs
  outgoingConnections: string[]; // Adjacent downstream camera IDs
}

export interface CameraTopologyEdge {
  sourceCameraId: string;
  targetCameraId: string;
  distanceMeters: number;
  expectedTransitTimeSec: number;
  averageSpeedKmh: number;
  historicalRouteShare: number; // 0.0 - 1.0 likelihood
  corridorName?: string;
}

export interface TrajectoryTransition {
  sourceCamera: string;
  destinationCamera: string;
  sourceTimestamp: string;
  destinationTimestamp: string;
  timeDeltaSec: number;
  distanceMeters: number;
  heading: string;
  estimatedSpeedKmh: number; // Always labeled ESTIMATED SPEED
  confidence: number;
}

export interface DownstreamPrediction {
  currentCameraId: string;
  candidateNextCameraId: string;
  candidateCameraName: string;
  likelihood: number; // 0.0 - 1.0 (e.g. 0.72)
  estimatedArrivalWindow: {
    earliest: string;
    latest: string;
    expectedTransitSec: number;
  };
  reason: string; // e.g. "Road topology corridor (SG Highway North) + Observed Eastbound heading"
  roadSegment: string;
}

// Human-in-the-loop Verification Package
export interface VerificationPackage {
  packageId: string;
  eventId: string;
  alertId?: string;
  targetId?: string;
  vehiclePlate?: string;
  normalizedPlate?: string;
  cameraId: string;
  cameraName: string;
  location: string;
  timestamp: string;
  candidateConfidence: number;
  matchType: 'WATCHLIST_VEHICLE' | 'PERSON_VISUAL_CORRELATION';
  sourceClassification: SourceClassification;
  requiresHumanVerification: true;
  status: 'PENDING_VERIFICATION' | 'CONFIRMED' | 'REJECTED' | 'ESCALATED';
  frames: {
    previousActualFrame?: string;
    candidateActualFrame: string;
    nextActualFrame?: string;
    burstAvailable: boolean;
  };
  referenceItem?: {
    referencePhoto?: string;
    targetAlias?: string;
    severity: string;
    notes?: string;
  };
  decision?: HumanVerificationDecision;
}

export interface HumanVerificationDecision {
  decisionId: string;
  packageId: string;
  verifiedBy: string; // Operator / Badge ID
  role: string;
  decision: 'CONFIRMED' | 'REJECTED' | 'ESCALATED';
  timestamp: string;
  notes?: string;
  auditCorrelationId: string;
}

// ============================================================
// GOD'S EYE V2 INTELLIGENCE LAYER — CORE DOMAIN MODELS
// ============================================================

export type VehicleClassType = 
  | 'car' 
  | 'motorcycle' 
  | 'scooter' 
  | 'bus' 
  | 'truck' 
  | 'auto_rickshaw' 
  | 'van' 
  | 'suv' 
  | 'other' 
  | 'unknown';

export type PlateReadStatus = 
  | 'PLATE_READ' 
  | 'PLATE_PARTIAL' 
  | 'PLATE_NOT_READ';

export type ObservationSourceType = 
  | 'REAL_CAMERA' 
  | 'REAL_RTSP' 
  | 'REAL_ONVIF' 
  | 'REAL_VMS' 
  | 'REAL_DVR' 
  | 'MOBILE_CAMERA' 
  | 'UPLOADED_VIDEO' 
  | 'SIMULATED_DEMO' 
  | 'YOUTUBE_DISPLAY_ONLY';

export type ObservationAnalysisMode = 
  | 'REAL_AI' 
  | 'SIMULATED_DEMO';

export type ObservationStatus = 
  | 'CAPTURED' 
  | 'CORRELATED' 
  | 'PENDING_ANALYSIS' 
  | 'UNRESOLVED';

export type LocationStatus = 
  | 'VERIFIED' 
  | 'LOW_ACCURACY' 
  | 'NOT_AVAILABLE' 
  | 'NOT_CONFIGURED';

export type LocationSource = 
  | 'CAMERA_REGISTERED_LOCATION' 
  | 'DEVICE_GPS' 
  | 'HUMAN_PROVIDED' 
  | 'HUMAN' 
  | 'PREDICTED';

export interface GeolocatedCoordinate {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  capturedAt?: string;
  source: LocationSource;
  locationSource?: LocationSource;
  locationStatus?: LocationStatus;
}

export interface VehicleObservation {
  observationId: string;
  vehicleId?: string; // e.g. VEH-GJ01AB1234
  plateRaw?: string;
  plateNormalized?: string; // Normalized standard plate (e.g. GJ01AB1234)
  timestamp: string; // ISO-8601
  cameraId: string;
  cameraType?: 'FIXED_CCTV' | 'MOBILE_CAMERA' | 'PTZ' | 'DRONE' | 'BODY_WORN' | 'HANDHELD' | string;
  location?: GeolocatedCoordinate;
  locationSource?: LocationSource;
  locationAccuracyMeters?: number;
  locationStatus?: LocationStatus;
  heading?: number | string;
  speed?: number; // In km/h
  frameReference?: string;
  evidenceReferences?: string[];
  sourceOfTruth?: SourceOfTruth | string;
  captureMethod?: 'FIXED_ANPR' | 'MOBILE_DASHCAM' | 'SMARTPHONE_SCAN' | 'MANUAL_OFFICER_ENTRY' | 'AUTOMATED_EDGE_INFERENCE' | string;
  missionId?: string;
  correlationId?: string;

  // Preserved fields for backward compatibility
  eventId: string;
  cameraName?: string;
  edgeNodeId: string;
  trackId: string; // Camera-local, e.g. TRACK-CAM014-00091
  vehicleClass: VehicleClassType;
  vehicleColor?: string;
  plateText?: string; // Raw recognized text or undefined
  plateCandidate?: {
    rawText: string;
    confidence: number;
    ambiguityLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  vehicleClassification?: {
    vehicleClass: VehicleClassType;
    confidence: number;
    color?: string;
  };
  qualityScore?: number;
  snapshotReference?: string;
  cropReference?: string;
  plateConfidence?: number; // 0.0 - 1.0 or undefined if unreadable
  plateStatus: PlateReadStatus;
  vehicleConfidence: number; // 0.0 - 1.0
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized (0-1)
  frameWidth: number;
  frameHeight: number;
  gps: {
    latitude: number;
    longitude: number;
  };
  speedEstimate?: number; // In km/h, explicitly designated ESTIMATED
  lane?: number | string;
  direction?: string;
  sourceType: ObservationSourceType;
  analysisMode: ObservationAnalysisMode;
  imageReference: string;
  thumbnailReference?: string;
  evidenceReference?: string;
  evidenceHash?: string;
  isBestFrame: boolean;
  bestFrameScore?: number;
  watchlistMatch: boolean;
  watchlistReason?: string;
  previousObservationId?: string;
  nextObservationId?: string;
  trajectoryId?: string;
  status: ObservationStatus;
  isMobileCamera?: boolean;
}

export interface BestFrameEvaluation {
  vehicleConfidence: number;
  plateConfidence: number;
  sharpnessScore: number;
  visibilityScore: number;
  bboxQualityScore: number;
  lowOcclusionScore: number;
  compositeScore: number; // vehicleConfidence * 0.30 + plateConfidence * 0.25 + sharpness * 0.15 + visibility * 0.15 + bbox * 0.10 + occlusion * 0.05
  isBestCandidate: boolean;
}

export interface VehicleSearchTask {
  taskId: string;
  correlationId: string;
  sourceObservationId: string;
  sourceCameraId: string;
  candidateCameraIds: string[];
  targetWindowStart: string;
  targetWindowEnd: string;
  plateHint?: string;
  vehicleClass: VehicleClassType;
  vehicleColor?: string;
  direction?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  expiration: string;
  requestedEvidence: 'METADATA_ONLY' | 'BEST_FRAME' | 'FULL_EVIDENCE';
  status: 'DISPATCHED' | 'MONITORING' | 'MATCHED' | 'EXPIRED' | 'CANCELLED';
  matchedObservationId?: string;
  matchedCameraId?: string;
}

export type CrossCameraMatchLevel = 
  | 'MATCHED'          // 0.95+
  | 'LIKELY_MATCH'     // 0.85 - 0.94
  | 'POSSIBLE_MATCH'   // 0.60 - 0.84
  | 'UNRESOLVED';      // < 0.60

export interface CrossCameraCorrelationResult {
  correlationId: string;
  sourceObservationId: string;
  targetObservationId: string;
  sourceCameraId: string;
  targetCameraId: string;
  confidence: number;
  matchLevel: CrossCameraMatchLevel;
  signals: {
    plateMatchScore: number;
    classMatchScore: number;
    colorMatchScore: number;
    directionMatchScore: number;
    temporalConsistencyScore: number;
    topologyConsistencyScore: number;
  };
  whyLinked: string[]; // Human-readable explanations
  distanceMeters: number;
  transitTimeSec: number;
  estimatedSpeedKmh: number;
}

export interface CompactTrajectoryPoint {
  observationId: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  lat: number;
  lng: number;
  heading?: number | string;
  speedKmh?: number;
  trackId: string;
  evidenceId?: string;
  thumbnailReference?: string;
  isKeyframe: boolean;
}

export interface CompactTrajectory {
  trajectoryId: string;
  plateNormalized?: string;
  vehicleClass: VehicleClassType;
  color?: string;
  firstSeen: string;
  lastSeen: string;
  totalPoints: number;
  camerasVisited: number;
  totalDistanceMeters: number;
  durationMinutes: number;
  points: CompactTrajectoryPoint[];
  encodedSummary: string; // Compact representation
  bandwidthSavingsPercent: number; // E.g. 99.98%
}

export type EvidenceLifecycleState = 
  | 'CAPTURED' 
  | 'HASHED' 
  | 'STORED' 
  | 'VERIFIED' 
  | 'RETAINED' 
  | 'EXPIRED' 
  | 'LEGAL_HOLD' 
  | 'ARCHIVED';

export interface EvidenceStorageConfig {
  storageProvider: string;
  storageRoot: string;
  evidenceRoot: string;
  thumbnailRoot: string;
  plateCropRoot: string;
  personCropRoot: string;
  videoReferenceRoot: string;
  auditRoot: string;
  retentionPolicy: {
    rawVideoDays: number;
    statutoryEvidenceYears: number;
    isTamperSealed: boolean;
    department?: string;
  };
  legalHoldPolicy: {
    enabled: boolean;
    allowedRoles: string[];
    statutoryBasis: string;
  };
}

export type SourceOfTruth = 
  | 'CAMERA_OBSERVED' 
  | 'AI_INFERRED' 
  | 'HUMAN_VERIFIED' 
  | 'HUMAN_DISPUTED' 
  | 'EXTERNAL_AUTHORIZED' 
  | 'SIMULATED' 
  | 'PREDICTED';

export interface ForensicEvidenceRecord {
  evidenceId: string;
  storageProvider?: string;
  storageReference?: string;
  sourceCamera?: string;
  sourceType?: ObservationSourceType | string;
  timestamp: string;
  GPS?: {
    latitude: number;
    longitude: number;
  };
  gps?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    source?: LocationSource | string;
    locationStatus?: LocationStatus | string;
  };
  frameReference?: string;
  cropReference?: string;
  captureMethod?: string;
  locationSource?: LocationSource | string;
  locationAccuracyMeters?: number;
  locationStatus?: LocationStatus | string;
  sha256: string;
  createdAt?: string;
  retentionUntil?: string;
  retentionPolicy?: {
    department?: string;
    rawVideoDays?: number;
    statutoryEvidenceYears?: number;
    isTamperSealed?: boolean;
  };
  legalHold?: boolean;
  sourceOfTruth?: SourceOfTruth | SourceClassification | string;
  missionId?: string;
  correlationId?: string;

  // Additional metadata & backward compatibility fields
  observationId?: string;
  eventId?: string;
  cameraId?: string;
  cameraName?: string;
  edgeNodeId?: string;
  location?: string;
  imageReference?: string;
  thumbnailReference?: string;
  captureSource?: ObservationSourceType;
  analysisMode?: ObservationAnalysisMode;
  vehicleTrackId?: string;
  plateText?: string;
  plateNormalized?: string;
  plateStatus?: PlateReadStatus;
  plateConfidence?: number;
  vehicleConfidence?: number;
  vehicleClass?: VehicleClassType;
  vehicleColor?: string;
  trajectoryId?: string;
  previousEvidenceId?: string;
  nextEvidenceId?: string;
  isFirstSeen?: boolean;
  isLastSeen?: boolean;
  sequenceIndex?: number;
  label?: string; // "SIMULATED DEMO EVIDENCE" | "AI-ANALYZED VIDEO FRAME" | "REAL CAMERA EVIDENCE"
  status: 'VERIFIED' | 'PENDING' | 'TAMPERED';
  lifecycleState?: EvidenceLifecycleState;
  integrityPackageNotice?: string;
}

export interface IEvidenceStorageProvider {
  readonly providerId: string;
  readonly providerType: 'LOCAL_FILESYSTEM' | 'GOVERNMENT_NAS' | 'OBJECT_STORAGE' | 'LOCAL_DEMO';
  readonly config: EvidenceStorageConfig;
  storeEvidence(record: ForensicEvidenceRecord): Promise<ForensicEvidenceRecord>;
  getEvidence(evidenceId: string): Promise<ForensicEvidenceRecord | null>;
  listEvidence(filter?: { plateNormalized?: string; cameraId?: string; legalHold?: boolean; lifecycleState?: EvidenceLifecycleState }): Promise<ForensicEvidenceRecord[]>;
  verifyIntegrity(evidenceId: string): Promise<{ valid: boolean; hash: string; algorithm: 'SHA-256'; isDigitalSignature: false; disclaimer: string }>;
  applyLegalHold?(evidenceId: string, holdReason: string, authorizedOfficer: string): Promise<ForensicEvidenceRecord | null>;
  releaseLegalHold?(evidenceId: string, releaseReason: string, authorizedOfficer: string): Promise<ForensicEvidenceRecord | null>;
  getStorageDiagnostics?(): {
    provider: string;
    providerType: string;
    storageRoot: string;
    isPathAccessible: boolean;
    operationalMode: 'ON_PREMISE_REAL' | 'INTEGRATION_READY' | 'LOCAL_SIMULATED';
    securityProtocol: string;
    complianceNotice: string;
  };
}

export interface VehicleCorrelationScoreBreakdown {
  plateScore?: number;
  classScore?: number;
  colorScore?: number;
  topologyScore?: number;
  totalScore?: number;
  plateConfidence?: number;
  visualEmbeddingCosine?: number;
  classAgreementScore?: number;
  colorAgreementScore?: number;
  temporalFeasibilityScore?: number;
  topologyConsistencyScore?: number;
  totalWeightedConfidence?: number;
}

export interface CorrelationResult {
  correlationId?: string;
  isMatch?: boolean;
  isDefinitiveMatch?: boolean;
  confidence?: number;
  matchConfidence: number;
  scoreBreakdown: VehicleCorrelationScoreBreakdown;
  matchedSignals: string[];
  unmatchedSignals: string[];
  warnings?: string[];
  explanation?: string | any;
  candidateA?: VehicleObservation;
  candidateB?: VehicleObservation;
  candidateObservationIds?: string[];
}

export * from './types/v21MeshTypes';
export * from './types/v22ChallanTypes';
export * from './types/operationalCommandTypes';
export * from './types/facePersonIntelligenceTypes';
export type { AIAgentJob } from './ai-agents/types';
export * from './services/ai/RealAIEvidencePipeline';



