export type CameraStatus = 'online' | 'offline' | 'warning';

// V0.7 Normalized Connector & Integration Types
export type VideoSourceType = 'SIMULATED' | 'ONVIF' | 'RTSP' | 'VMS' | 'OTHER';
export type IntegrationStatus = 'SIMULATED' | 'INTEGRATION_READY' | 'CONNECTED';
export type FeedHealthState = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'AUTH_FAILED' | 'NO_STREAM' | 'STALE' | 'UNKNOWN';
export type DiscoveryMethod = 'MANUAL_CONFIG' | 'WS_DISCOVERY' | 'VMS_API' | 'RTSP_PROBE' | 'SYNTHETIC_REGISTRY';
export type SourceMode = 'DEMO' | 'INTEGRATION_READY' | 'LIVE';

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
}

export interface WatchlistTarget {
  id: string;
  name: string;
  imageUrl: string;
  threatLevel: 'critical' | 'high' | 'medium';
  associatedPlate?: string;
  lastKnownAttire?: string;
  dateAdded: string;
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
  confidence?: number;
  status?: 'new' | 'acknowledged' | 'investigating' | 'closed';
  acknowledgedBy?: string;
  evidenceReference?: string;
}

export interface VehicleSighting {
  sightingId: string;
  vehicleNumber: string;
  cameraId: string;
  siteId: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  direction?: string;
  plateConfidence: number;
  vehicleConfidence: number;
  snapshotReference?: string;
  clipReference?: string;
  sourceEdgeNode: string;
  eventId: string;
}

export interface VehicleJourney {
  vehicleNumber: string;
  sightings: VehicleSighting[];
  totalSightings: number;
  firstSeen: string;
  lastSeen: string;
  camerasVisited: number;
  districtsVisited: number;
  durationMinutes: number;
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

export type ViewMode = 'dashboard' | 'cameras' | 'search' | 'alerts' | 'watchlist' | 'tracking' | 'nodes' | 'policies' | 'challenge' | 'system';

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
  eventId: string;
  cameraId: string;
  timestamp: string;
  targetId: string;
  captureReason: EvidenceCaptureReason;
  imageReference: string;
  sha256: string;
  status: 'VERIFIED' | 'PENDING';
  isSimulation: boolean;
  label: string;
  integrityNotice?: string;
  correlationId?: string;
  latitude?: number;
  longitude?: number;
  sourceEdgeNode?: string;
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
