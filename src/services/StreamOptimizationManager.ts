import {
  CameraOptimizationTelemetry,
  GopSyncState,
  StreamOptimizationConfig
} from '../types.js';

export type StreamOptimizationListener = (
  cameraId: string,
  telemetry: CameraOptimizationTelemetry
) => void;

/**
 * StreamOptimizationManager
 *
 * Centralized runtime management for GOP / Keyframe synchronization and Live AI Priority.
 * In accordance with Section 1-18 of Sentinel Grid specifications:
 * - Default: GOP SYNC = OFF (High-contention live AI priority)
 * - Decouples AI processing from GOP/keyframe boundaries
 * - Implements bounded timeout (3000ms) with explicit TIMEOUT_FALLBACK when GOP is ON
 * - Maintains independent state per camera without global locks
 */
export class StreamOptimizationManager {
  private static instance: StreamOptimizationManager;

  // Global default configuration (GOP OFF by default for hackathon/high-contention)
  private globalConfig: StreamOptimizationConfig = {
    gopSyncEnabled: false,
    gopSyncTimeoutMs: 3000
  };

  private liveAiPriorityMode = true;

  // Per-camera configuration overrides
  private cameraConfigs = new Map<string, StreamOptimizationConfig>();

  // Per-camera telemetry tracking
  private cameraTelemetry = new Map<string, CameraOptimizationTelemetry>();

  // Active keyframe sync timeout timers
  private syncTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // Waiting start timestamps
  private waitingStartedAt = new Map<string, number>();

  // Change listeners
  private listeners = new Set<StreamOptimizationListener>();

  public static getInstance(): StreamOptimizationManager {
    if (!StreamOptimizationManager.instance) {
      StreamOptimizationManager.instance = new StreamOptimizationManager();
    }
    return StreamOptimizationManager.instance;
  }

  private constructor() {
    // Initialized with default GOP SYNC = OFF
  }

  /**
   * Subscribe to camera optimization state changes
   */
  public subscribe(listener: StreamOptimizationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(cameraId: string): void {
    const telem = this.getTelemetry(cameraId);
    for (const listener of this.listeners) {
      try {
        listener(cameraId, telem);
      } catch {
        // Safe dispatch
      }
    }
  }

  /**
   * Returns current optimization configuration for a camera
   */
  public getConfig(cameraId?: string): StreamOptimizationConfig {
    if (cameraId) {
      const normalized = cameraId.toLowerCase();
      const override = this.cameraConfigs.get(normalized);
      if (override) return { ...override };
    }
    return { ...this.globalConfig };
  }

  /**
   * Sets configuration globally or for a specific camera
   */
  public setConfig(
    cameraIdOrScope: string | 'GLOBAL',
    config: Partial<StreamOptimizationConfig>
  ): StreamOptimizationConfig {
    if (cameraIdOrScope === 'GLOBAL') {
      this.globalConfig = {
        ...this.globalConfig,
        ...config
      };
      if (config.gopSyncEnabled === false) {
        this.liveAiPriorityMode = true;
      }
      // Re-evaluate all cameras currently tracked
      for (const camId of this.cameraTelemetry.keys()) {
        if (!this.cameraConfigs.has(camId)) {
          this.applyConfigToCamera(camId, this.globalConfig);
        }
      }
      return { ...this.globalConfig };
    }

    const normalized = cameraIdOrScope.toLowerCase();
    const existing = this.getConfig(normalized);
    const updated: StreamOptimizationConfig = {
      ...existing,
      ...config
    };
    this.cameraConfigs.set(normalized, updated);
    this.applyConfigToCamera(normalized, updated);
    return { ...updated };
  }

  /**
   * Toggle global High-Contention Mode / LIVE AI PRIORITY
   */
  public setLiveAiPriorityMode(enabled: boolean): void {
    this.liveAiPriorityMode = enabled;
    this.setConfig('GLOBAL', {
      gopSyncEnabled: !enabled
    });
  }

  public isLiveAiPriorityMode(): boolean {
    return this.liveAiPriorityMode;
  }

  public setGlobalGopSync(enabled: boolean): void {
    this.setConfig('GLOBAL', {
      gopSyncEnabled: enabled
    });
    this.liveAiPriorityMode = !enabled;
  }

  public getGlobalConfig(): StreamOptimizationConfig {
    return { ...this.globalConfig };
  }

  /**
   * Retrieves full telemetry for a camera
   */
  public getTelemetry(cameraId: string): CameraOptimizationTelemetry {
    const normalized = cameraId.toLowerCase();
    let telem = this.cameraTelemetry.get(normalized);
    if (!telem) {
      const config = this.getConfig(normalized);
      telem = {
        cameraId: normalized,
        gopSyncEnabled: config.gopSyncEnabled,
        gopSyncState: config.gopSyncEnabled ? 'WAITING' : 'DISABLED',
        gopSyncWaitMs: 0,
        gopSyncTimeoutCount: 0,
        gopSyncFallbackCount: 0,
        cameraConnectedAt: null,
        firstValidFrameTimestamp: null,
        aiStartedTimestamp: null,
        aiStartLatencyMs: null,
        gopSynchronizedTimestamp: null,
        gopWaitLatencyMs: null,
        operationalMode: config.gopSyncEnabled ? 'STANDARD_KEYFRAME' : 'LIVE_AI_PRIORITY'
      };
      this.cameraTelemetry.set(normalized, telem);
    }
    return { ...telem };
  }

  /**
   * Retrieves all telemetry across all active cameras
   */
  public getAllTelemetry(): Record<string, CameraOptimizationTelemetry> {
    const out: Record<string, CameraOptimizationTelemetry> = {};
    for (const [id, t] of this.cameraTelemetry.entries()) {
      out[id] = { ...t };
    }
    return out;
  }

  /**
   * Internal apply config to camera telemetry state machine
   */
  private applyConfigToCamera(camId: string, config: StreamOptimizationConfig): void {
    const telem = this.getTelemetry(camId);
    telem.gopSyncEnabled = config.gopSyncEnabled;
    telem.operationalMode = config.gopSyncEnabled ? 'STANDARD_KEYFRAME' : 'LIVE_AI_PRIORITY';

    if (!config.gopSyncEnabled) {
      // Clear any waiting timer
      const existingTimer = this.syncTimers.get(camId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.syncTimers.delete(camId);
      }
      this.waitingStartedAt.delete(camId);
      telem.gopSyncState = 'DISABLED';
      telem.gopSyncWaitMs = 0;

      // If camera already has a valid frame and AI was waiting on GOP, start AI immediately!
      if (telem.firstValidFrameTimestamp && !telem.aiStartedTimestamp) {
        this.recordAiStarted(camId);
      }
    } else {
      // GOP enabled: if already synchronized or timed out, keep state; otherwise set to WAITING
      if (telem.gopSyncState === 'DISABLED') {
        telem.gopSyncState = 'WAITING';
        this.startSyncTimerIfNeeded(camId, config.gopSyncTimeoutMs);
      }
    }

    this.cameraTelemetry.set(camId, telem);
    this.notify(camId);
  }

  /**
   * Called when camera stream connects (SOURCE = CONNECTED)
   */
  public recordCameraConnected(cameraId: string): CameraOptimizationTelemetry {
    const normalized = cameraId.toLowerCase();
    const config = this.getConfig(normalized);
    const telem = this.getTelemetry(normalized);
    const now = Date.now();

    telem.cameraConnectedAt = now;
    telem.gopSyncEnabled = config.gopSyncEnabled;
    telem.operationalMode = config.gopSyncEnabled ? 'STANDARD_KEYFRAME' : 'LIVE_AI_PRIORITY';

    if (config.gopSyncEnabled) {
      telem.gopSyncState = 'WAITING';
      this.waitingStartedAt.set(normalized, now);
      this.startSyncTimerIfNeeded(normalized, config.gopSyncTimeoutMs);
    } else {
      telem.gopSyncState = 'DISABLED';
      telem.gopSyncWaitMs = 0;
    }

    this.cameraTelemetry.set(normalized, telem);
    this.notify(normalized);
    return { ...telem };
  }

  /**
   * Called when the first valid decoded frame arrives from the camera/decoder.
   * In MODE A (GOP OFF): Immediately triggers AI start without waiting!
   * In MODE B (GOP ON): Records frame arrival; starts AI if already synchronized or timed out.
   */
  public recordValidDecodedFrame(cameraId: string, _pts?: number): CameraOptimizationTelemetry {
    const normalized = cameraId.toLowerCase();
    const config = this.getConfig(normalized);
    const telem = this.getTelemetry(normalized);
    const now = Date.now();

    if (!telem.firstValidFrameTimestamp) {
      telem.firstValidFrameTimestamp = now;
    }

    if (!config.gopSyncEnabled) {
      // MODE A — GOP OFF:
      // Zero waiting for GOP keyframe. AI starts immediately on first valid frame!
      telem.gopSyncState = 'DISABLED';
      telem.gopSyncWaitMs = 0;
      if (!telem.aiStartedTimestamp) {
        telem.aiStartedTimestamp = now;
        telem.aiStartLatencyMs = Math.max(0, now - (telem.firstValidFrameTimestamp || now));
      }
    } else {
      // MODE B — GOP ON:
      if (telem.gopSyncState === 'SYNCHRONIZED' || telem.gopSyncState === 'TIMEOUT_FALLBACK') {
        if (!telem.aiStartedTimestamp) {
          telem.aiStartedTimestamp = now;
          telem.aiStartLatencyMs = Math.max(0, now - (telem.firstValidFrameTimestamp || now));
        }
      }
    }

    this.cameraTelemetry.set(normalized, telem);
    this.notify(normalized);
    return { ...telem };
  }

  /**
   * Called when an IDR/Keyframe is observed in GOP ON mode
   */
  public recordKeyframeArrival(cameraId: string): CameraOptimizationTelemetry {
    const normalized = cameraId.toLowerCase();
    const config = this.getConfig(normalized);
    const telem = this.getTelemetry(normalized);
    const now = Date.now();

    // Clear sync timer
    const timer = this.syncTimers.get(normalized);
    if (timer) {
      clearTimeout(timer);
      this.syncTimers.delete(normalized);
    }

    const waitStart = this.waitingStartedAt.get(normalized) || telem.firstValidFrameTimestamp || now;
    telem.gopSyncWaitMs = Math.max(0, now - waitStart);
    telem.gopSynchronizedTimestamp = now;
    if (telem.firstValidFrameTimestamp) {
      telem.gopWaitLatencyMs = Math.max(0, now - telem.firstValidFrameTimestamp);
    }

    if (config.gopSyncEnabled) {
      telem.gopSyncState = 'SYNCHRONIZED';
      // Satisfied keyframe condition: start AI if valid frame is ready
      if (telem.firstValidFrameTimestamp && !telem.aiStartedTimestamp) {
        telem.aiStartedTimestamp = now;
        telem.aiStartLatencyMs = Math.max(0, now - telem.firstValidFrameTimestamp);
      }
    }

    this.cameraTelemetry.set(normalized, telem);
    this.notify(normalized);
    return { ...telem };
  }

  /**
   * Explicitly records that AI processing has started for a camera
   */
  public recordAiStarted(cameraId: string): CameraOptimizationTelemetry {
    const normalized = cameraId.toLowerCase();
    const telem = this.getTelemetry(normalized);
    const now = Date.now();

    telem.aiStartedTimestamp = now;
    if (telem.firstValidFrameTimestamp) {
      telem.aiStartLatencyMs = Math.max(0, now - telem.firstValidFrameTimestamp);
    } else {
      telem.aiStartLatencyMs = 0;
    }

    this.cameraTelemetry.set(normalized, telem);
    this.notify(normalized);
    return { ...telem };
  }

  /**
   * Starts bounded timeout timer for GOP ON mode (default: 3000ms)
   */
  private startSyncTimerIfNeeded(camId: string, timeoutMs: number): void {
    const existing = this.syncTimers.get(camId);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.handleGopSyncTimeout(camId);
    }, timeoutMs);

    this.syncTimers.set(camId, timer);
  }

  /**
   * Handles bounded GOP synchronization timeout:
   * Falls back to first valid decoded frame so live AI is NEVER indefinitely blocked!
   */
  private handleGopSyncTimeout(camId: string): void {
    this.syncTimers.delete(camId);
    const telem = this.getTelemetry(camId);
    const now = Date.now();

    if (telem.gopSyncEnabled && telem.gopSyncState === 'WAITING') {
      const waitStart = this.waitingStartedAt.get(camId) || telem.firstValidFrameTimestamp || now;
      telem.gopSyncWaitMs = Math.max(0, now - waitStart);
      telem.gopSyncState = 'TIMEOUT_FALLBACK';
      telem.gopSyncTimeoutCount += 1;
      telem.gopSyncFallbackCount += 1;

      // Fallback: start AI immediately on available valid frame
      if (!telem.aiStartedTimestamp) {
        telem.aiStartedTimestamp = now;
        telem.aiStartLatencyMs = telem.firstValidFrameTimestamp
          ? Math.max(0, now - telem.firstValidFrameTimestamp)
          : 0;
      }

      this.cameraTelemetry.set(camId, telem);
      this.notify(camId);
    }
  }

  /**
   * Resets camera tracking upon disconnect / reconnect
   */
  public resetCamera(cameraId: string): void {
    const normalized = cameraId.toLowerCase();
    const timer = this.syncTimers.get(normalized);
    if (timer) {
      clearTimeout(timer);
      this.syncTimers.delete(normalized);
    }
    this.waitingStartedAt.delete(normalized);

    const config = this.getConfig(normalized);
    this.cameraTelemetry.set(normalized, {
      cameraId: normalized,
      gopSyncEnabled: config.gopSyncEnabled,
      gopSyncState: config.gopSyncEnabled ? 'WAITING' : 'DISABLED',
      gopSyncWaitMs: 0,
      gopSyncTimeoutCount: 0,
      gopSyncFallbackCount: 0,
      cameraConnectedAt: null,
      firstValidFrameTimestamp: null,
      aiStartedTimestamp: null,
      aiStartLatencyMs: null,
      gopSynchronizedTimestamp: null,
      gopWaitLatencyMs: null,
      operationalMode: config.gopSyncEnabled ? 'STANDARD_KEYFRAME' : 'LIVE_AI_PRIORITY'
    });
    this.notify(normalized);
  }
}

export const streamOptimizationManager = StreamOptimizationManager.getInstance();
