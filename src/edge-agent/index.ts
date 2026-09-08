import {
  SecurityEventPayload,
  IEdgeTransport,
  ICameraAdapter,
  IDVRAdapter,
  PolicyDeploymentPayload,
  CommandPayload,
  HeartbeatPayload,
  EdgeHealthState,
  IPersistenceProvider,
  IOnvifDiscovery,
  CameraDiscoveryPayload
} from '../types';

export interface ILocalEventStore {
  enqueue(event: SecurityEventPayload): void;
  getPending(limit?: number): SecurityEventPayload[];
  markUploading(eventIds: string[]): void;
  markAcknowledged(eventIds: string[]): void;
  markFailed(eventIds: string[]): void;
  retry(): void;
  getQueueSize(): number;
}

export interface IDeviceDiscovery {
  discoverDVRs(): Promise<any[]>;
  discoverCameras(dvrId: string): Promise<any[]>;
  getDeviceStatus(id: string): string;
  getDeviceCapabilities(id: string): string[];
}

export class LocalStorage implements ILocalEventStore {
  private queue: SecurityEventPayload[] = [];
  
  constructor(private provider: IPersistenceProvider) {
    this.load();
  }

  private load() {
    const data = this.provider.getItem('edge_events_queue');
    if (data) {
      try {
        this.queue = JSON.parse(data);
      } catch (e) {
        this.queue = [];
      }
    }
  }

  private save() {
    this.provider.setItem('edge_events_queue', JSON.stringify(this.queue));
  }

  enqueue(event: SecurityEventPayload): void {
    this.queue.push(event);
    this.save();
  }

  getPending(limit: number = 50): SecurityEventPayload[] {
    // Return items not currently marked as uploading (for this simple prototype we just return the front of queue)
    return this.queue.slice(0, limit);
  }

  markUploading(eventIds: string[]): void {
    // In a real DB, we'd set status='uploading'. Here we keep it simple.
  }

  markAcknowledged(eventIds: string[]): void {
    this.queue = this.queue.filter(e => !eventIds.includes(e.eventId));
    this.save();
  }

  markFailed(eventIds: string[]): void {
    // Reset uploading status
  }

  retry(): void {
    // Called when backoff allows retry
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

export class HealthMonitor {
  private state: EdgeHealthState = 'STARTING';
  private listeners: ((state: EdgeHealthState) => void)[] = [];

  setState(newState: EdgeHealthState) {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach(l => l(this.state));
    }
  }

  getState(): EdgeHealthState { return this.state; }
  onChange(cb: (state: EdgeHealthState) => void) { this.listeners.push(cb); }
}

export class PolicyManager {
  private currentPolicy: PolicyDeploymentPayload | null = null;

  validatePolicy(policy: PolicyDeploymentPayload): boolean {
    // Prevent arbitrary executable code (XSS/RCE simulation check)
    // Check signature, expiry, etc.
    const now = new Date().toISOString();
    if (policy.expiresAt && policy.expiresAt < now) {
      return false; // Expired
    }
    if (policy.signature !== 'VALID_SIG') {
      return false; // Invalid signature
    }
    return true;
  }

  applyPolicy(policy: PolicyDeploymentPayload): boolean {
    if (this.validatePolicy(policy)) {
      this.currentPolicy = policy;
      return true;
    }
    return false;
  }

  getPolicyVersion(): string {
    return this.currentPolicy?.version || 'default-v1.0';
  }
}

export class DeviceManager implements IDeviceDiscovery {
  constructor(private dvr: IDVRAdapter, private cam: ICameraAdapter) {}

  async discoverDVRs(): Promise<any[]> {
    return [{ id: 'DVR-01', vendor: 'MockVendor', status: 'online' }];
  }

  async discoverCameras(dvrId: string): Promise<any[]> {
    return await this.cam.discoverCameras(dvrId);
  }

  getDeviceStatus(id: string): string { return 'online'; }
  getDeviceCapabilities(id: string): string[] { return ['anpr', 'motion']; }
}

export class EventManager {
  constructor(private storage: ILocalEventStore, private nodeId: string, private siteId: string) {}

  createEvent(plate: string, cameraId: string, emitLog: (msg: any) => void) {
    const payload: SecurityEventPayload = {
      eventId: `EVT-${Date.now()}-${Math.floor(Math.random()*10000)}`,
      edgeNodeId: this.nodeId,
      siteId: this.siteId,
      cameraId: cameraId,
      timestamp: new Date().toISOString(),
      eventType: 'vehicle_detected',
      priority: 'high',
      confidence: 0.94,
      metadata: { plate }
    };
    this.storage.enqueue(payload);
    emitLog({ dir: 'internal', type: 'EVENT_QUEUED', size: JSON.stringify(payload).length, status: 'success' });
  }

  createInferenceEvent(
    inferenceResult: { plate?: string; personTrackId?: string; helmetStatus?: string; vehicleType?: string; confidence?: number; eventType?: string; correlationConfidence?: number },
    cameraId: string,
    emitLog?: (msg: any) => void
  ): SecurityEventPayload {
    const payload: SecurityEventPayload = {
      eventId: `EVT-INF-${Date.now()}-${Math.floor(Math.random()*10000)}`,
      edgeNodeId: this.nodeId,
      siteId: this.siteId,
      cameraId: cameraId,
      timestamp: new Date().toISOString(),
      eventType: inferenceResult.eventType || (inferenceResult.plate ? 'ANPR' : 'PERSON_DETECTED'),
      priority: inferenceResult.helmetStatus === 'NO_HELMET' ? 'high' : 'medium',
      confidence: inferenceResult.confidence ?? 0.95,
      metadata: { ...inferenceResult }
    };
    this.storage.enqueue(payload);
    if (emitLog) {
      emitLog({ dir: 'internal', type: 'INFERENCE_EVENT_QUEUED', size: JSON.stringify(payload).length, status: 'success' });
    }
    return payload;
  }

  enqueueEvent(payload: SecurityEventPayload, emitLog?: (msg: any) => void): void {
    this.storage.enqueue(payload);
    if (emitLog) {
      emitLog({ dir: 'internal', type: 'EXTERNAL_EVENT_QUEUED', size: JSON.stringify(payload).length, status: 'success' });
    }
  }
}

export class SyncManager {
  private isSyncing = false;
  private lastSync = new Date(0).toISOString();

  constructor(
    private storage: ILocalEventStore, 
    private transport: IEdgeTransport,
    private health: HealthMonitor,
    private emitLog: (msg: any) => void
  ) {}

  async triggerSync() {
    if (this.isSyncing) return;
    const pending = this.storage.getPending();
    if (pending.length === 0) return;

    this.isSyncing = true;
    const previousState = this.health.getState();
    this.health.setState('SYNCING');

    let allSuccess = true;
    for (const ev of pending) {
      try {
        this.emitLog({ dir: 'outbound', type: 'EVENT_UPLOAD_STARTED', size: JSON.stringify(ev).length, status: 'pending' });
        await this.transport.sendEvent(ev);
        this.storage.markAcknowledged([ev.eventId]);
        this.emitLog({ dir: 'inbound', type: 'EVENT_ACKNOWLEDGED', size: 0, status: 'success' });
      } catch (e) {
        allSuccess = false;
        this.storage.markFailed([ev.eventId]);
        this.emitLog({ dir: 'outbound', type: 'EVENT_UPLOAD_FAILED', size: 0, status: 'failed' });
        break; // Stop on first error (backoff)
      }
    }

    if (allSuccess) {
      this.lastSync = new Date().toISOString();
      this.health.setState('ONLINE');
    } else {
      this.health.setState('OFFLINE');
    }
    
    this.isSyncing = false;
  }

  getLastSync(): string { return this.lastSync; }
}

export class EdgeRuntime {
  public localStorage: LocalStorage;
  public healthMonitor: HealthMonitor;
  public policyManager: PolicyManager;
  public deviceManager: DeviceManager;
  public eventManager: EventManager;
  public syncManager: SyncManager;

  private heartbeatTimer: any;
  public stats = { cpu: 12, mem: 256, storage: 45 };

  constructor(
    private nodeId: string,
    private siteId: string,
    private provider: IPersistenceProvider,
    private transport: IEdgeTransport,
    private dvrAdapter: IDVRAdapter,
    private cameraAdapter: ICameraAdapter,
    private onLog: (msg: any) => void
  ) {
    this.healthMonitor = new HealthMonitor();
    this.localStorage = new LocalStorage(provider);
    this.policyManager = new PolicyManager();
    this.deviceManager = new DeviceManager(dvrAdapter, cameraAdapter);
    this.eventManager = new EventManager(this.localStorage, nodeId, siteId);
    this.syncManager = new SyncManager(this.localStorage, transport, this.healthMonitor, onLog);
  }

  async start() {
    this.healthMonitor.setState('STARTING');
    await new Promise(r => setTimeout(r, 100)); // Simulating boot
    this.healthMonitor.setState('AUTHENTICATING');
    try {
      const authResponse: any = await this.transport.authenticate(this.nodeId);
      if (!authResponse) throw new Error("Auth Failed");
      
      // Load initial policy if provided by Central during registration
      if (typeof authResponse === 'object' && authResponse !== null && authResponse.policyVersion) {
         this.policyManager.applyPolicy({
           commandId: 'init',
           command: 'updatePolicy',
           version: authResponse.policyVersion,
           issuedBy: 'central',
           timestamp: new Date().toISOString(),
           signature: 'VALID_SIG',
           expiresAt: '2050-01-01T00:00:00Z',
           status: 'active',
           rules: [],
           hash: ''
         } as any);
      }
      
      this.healthMonitor.setState('CONNECTING');
      await this.deviceManager.discoverDVRs();
      this.healthMonitor.setState('ONLINE');
      
      this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), 10000);
      
      // Auto-sync if there are pending items
      if (this.localStorage.getQueueSize() > 0) {
        this.syncManager.triggerSync();
      }
    } catch (e) {
      this.healthMonitor.setState('ERROR');
    }
  }

  stop() {
    clearInterval(this.heartbeatTimer);
    this.healthMonitor.setState('OFFLINE');
  }

  async sendHeartbeat() {
    if (this.healthMonitor.getState() === 'ERROR' || this.healthMonitor.getState() === 'OFFLINE') return;
    const payload: HeartbeatPayload = {
      edgeNodeId: this.nodeId,
      timestamp: new Date().toISOString(),
      agentVersion: 'v4.3.0-runtime',
      cpuUsage: this.stats.cpu,
      memoryUsage: this.stats.mem,
      storageUsage: this.stats.storage,
      connectedDvrCount: 1,
      connectedCameraCount: 16
    };
    try {
      const result = await this.transport.sendHeartbeat(payload);
      if (result && result.commands && Array.isArray(result.commands)) {
        for (const cmd of result.commands) {
          this.handleCommand(cmd);
          
          // Ack command completion
          fetch(`/api/edge/commands/${cmd.commandId}/result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-request-id': `REQ-${Date.now()}` },
            body: JSON.stringify({ status: 'completed' })
          }).catch(() => {});
        }
      }
    } catch (e) {
      this.healthMonitor.setState('OFFLINE');
    }
  }

  handleCommand(cmd: CommandPayload) {
    this.onLog({ dir: 'inbound', type: `CMD_${cmd.command.toUpperCase()}`, size: JSON.stringify(cmd).length, status: 'success' });
    
    switch (cmd.command) {
      case 'synchronize':
        this.syncManager.triggerSync();
        break;
      case 'updatePolicy':
        const ok = this.policyManager.applyPolicy(cmd as any); // cast for simplicity in prototype
        if (!ok) this.onLog({ dir: 'internal', type: 'POLICY_REJECTED', size: 0, status: 'failed' });
        else this.onLog({ dir: 'internal', type: 'POLICY_APPLIED', size: 0, status: 'success' });
        break;
      case 'restartAgent':
        this.stop();
        setTimeout(() => this.start(), 500);
        break;
      case 'requestStatus':
      case 'refreshDeviceDiscovery':
        // No-op for now
        break;
      default:
        this.onLog({ dir: 'internal', type: 'CMD_UNKNOWN_REJECTED', size: 0, status: 'failed' });
    }
  }

  getDiagnostics() {
    return {
      version: 'v4.3.0-runtime',
      state: this.healthMonitor.getState(),
      cpu: this.stats.cpu,
      memory: this.stats.mem,
      storage: this.stats.storage,
      dvrCount: 1,
      cameraCount: 16,
      queueSize: this.localStorage.getQueueSize(),
      policyVersion: this.policyManager.getPolicyVersion(),
      lastSync: this.syncManager.getLastSync()
    };
  }
}

// Mock Hardware Adapters
export class NetworkEdgeTransport implements IEdgeTransport {
  constructor(private centralUrl: string = '') {}

  async authenticate(certId: string) {
    const res = await fetch(`${this.centralUrl}/api/edge/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-id': `REQ-${Date.now()}` },
      body: JSON.stringify({ edgeNodeId: certId, deviceIdentity: 'CERT-123', capabilities: ['anpr'] })
    });
    if (!res.ok) throw new Error('Registration failed');
    const ct = res.headers.get('content-type');
    if (ct && ct.includes('application/json')) {
      return await res.json();
    }
    return {};
  }

  async sendHeartbeat(payload: HeartbeatPayload) {
    const res = await fetch(`${this.centralUrl}/api/edge/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-id': `REQ-${Date.now()}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Heartbeat failed');
    const ct = res.headers.get('content-type');
    if (ct && ct.includes('application/json')) {
      return await res.json();
    }
    return {};
  }

  async sendEvent(payload: SecurityEventPayload) {
    const res = await fetch(`${this.centralUrl}/api/edge/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-id': `REQ-${Date.now()}` },
      body: JSON.stringify({ events: [payload] })
    });
    if (!res.ok) throw new Error('Event upload failed');
  }

  async getCommands(): Promise<CommandPayload[]> {
    return []; // Handled via heartbeat response for efficiency
  }
}

export class MockOnvifDiscovery implements IOnvifDiscovery {
  async discoverDevices() { return []; }
  async getDeviceInformation(ip: string) { return {}; }
  async getProfiles(ip: string) { return []; }
  async getStreams(ip: string) { return []; }
}

export class MockDVRAdapter implements IDVRAdapter {
  private connectionState: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'CONNECTING' = 'CONNECTED';

  async connect(dvrId?: string, config?: any): Promise<boolean> {
    this.connectionState = 'CONNECTED';
    return true;
  }
  async disconnect(): Promise<void> {
    this.connectionState = 'DISCONNECTED';
  }
  async healthCheck(): Promise<any> {
    return this.connectionState === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED';
  }
  getConnectionState(): 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'CONNECTING' {
    return this.connectionState;
  }
  async getStatus(): Promise<'online' | 'offline' | 'degraded'> { return 'online'; }
  async getDeviceInfo() { return { vendor: 'Mock', firmware: '1.0', model: 'MOCK-DVR-GENERIC' }; }
  async discoverChannels() { return [{ channelId: 'CH-1', name: 'Channel 1' }]; }
  async getChannelInfo(channelId: string | number) { return { channelId: String(channelId), name: `Channel ${channelId}` }; }
  async getStreamInfo(channelId: string | number) { return { channelId: String(channelId), fps: 25, resolution: '1920x1080' }; }
  async getSnapshot(channelId: string | number) { return 'snapshot.jpg'; }
  async getPlaybackCapabilities() { return { available: true }; }
  async getRecordingAvailability() { return { available: true }; }
  async playback(streamId: string) { return 'rtsp://mock/playback'; }
  async getStreamUrl(channelId: string | number) { return 'rtsp://mock/stream'; }
  async getRTSPUrl(channelId: string | number) { return 'rtsp://mock/stream'; }
  async queryRecordings(channelId: string | number, timeRange?: any) { return []; }
}

export class MockCameraAdapter implements ICameraAdapter {
  async discoverCameras(dvrId: string): Promise<CameraDiscoveryPayload[]> { 
    return [{ 
      edgeNodeId: 'EDGE-00042',
      dvrId: dvrId,
      cameraId: 'CAM-GATE-01',
      channel: 1,
      name: 'Main Gate',
      address: '192.168.1.51',
      status: 'online'
    }]; 
  }
  async captureSnapshot(cameraId: string) { return 'snapshot.jpg'; }
}

// Re-export V0.7 Connector Adapters & Services
export * from './adapters/OnvifDVRAdapter';
export * from './adapters/CpPlusDVRAdapter';
export * from './adapters/RtspStreamAdapter';
export * from './adapters/MockVendorVMSAdapter';
export * from './DiscoveryService';

