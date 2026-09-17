/**
 * Sentinel Camera Recovery & Independent State Machine
 * Gujarat Police CCTV & AI Intelligence Platform
 * Author: DIVYANSH Shrivastava
 *
 * Implements:
 * - Independent camera states: STARTING, LIVE, DEGRADED, BUFFERING, STALE, OFFLINE, RECONNECTING, AUTH_ERROR
 * - Strict real-frame verification (never marks LIVE unless a fresh real JPEG was received)
 * - Exponential backoff with jitter to prevent thundering-herd on mass reconnection
 * - Stale frame detection & per-camera acquisition recovery worker isolation
 * - Telemetry reporting and structured recovery event emission
 */

import crypto from 'crypto';
import { applicationLifecycleManager } from './ApplicationLifecycleManager.js';

export type CameraLifecycleState = 
  | 'STARTING'
  | 'LIVE'
  | 'DEGRADED'
  | 'BUFFERING'
  | 'STALE'
  | 'OFFLINE'
  | 'RECONNECTING'
  | 'AUTH_ERROR';

export interface CameraNodeState {
  cameraId: string;
  name: string;
  district: string;
  location: string;
  state: CameraLifecycleState;
  lastFrameTimestamp: number | null;
  lastFrameSha256: string | null;
  lastFrameByteLength: number;
  consecutiveFailures: number;
  reconnectAttempts: number;
  nextAllowedReconnectTime: number;
  lastStateChange: string;
  lastErrorMessage: string | null;
  totalFramesReceived: number;
  totalReconnects: number;
}

export class SentinelCameraRecoveryManager {
  private static instance: SentinelCameraRecoveryManager | null = null;
  private cameraStates = new Map<string, CameraNodeState>();
  private reconnectTimers = new Map<string, NodeJS.Timeout>();
  private activeWorkers = new Set<string>();

  // Thresholds
  private readonly staleThresholdMs = 25000; // 25s without a fresh frame -> STALE
  private readonly offlineThresholdFailures = 4; // 4 consecutive failures -> OFFLINE
  private readonly backoffSteps = [1000, 2000, 4000, 8000, 15000, 30000, 60000]; // Max 60s

  private constructor() {
    this.initDefaultNodes();
  }

  public static getInstance(): SentinelCameraRecoveryManager {
    if (!SentinelCameraRecoveryManager.instance) {
      SentinelCameraRecoveryManager.instance = new SentinelCameraRecoveryManager();
    }
    return SentinelCameraRecoveryManager.instance;
  }

  private initDefaultNodes(): void {
    for (let i = 1; i <= 30; i++) {
      const camId = `cam${String(i).padStart(2, '0')}`;
      this.cameraStates.set(camId, {
        cameraId: camId,
        name: `Sentinel CCTV Node ${camId}`,
        district: 'Gujarat',
        location: `Corridor ${camId}`,
        state: 'STARTING',
        lastFrameTimestamp: null,
        lastFrameSha256: null,
        lastFrameByteLength: 0,
        consecutiveFailures: 0,
        reconnectAttempts: 0,
        nextAllowedReconnectTime: 0,
        lastStateChange: new Date().toISOString(),
        lastErrorMessage: null,
        totalFramesReceived: 0,
        totalReconnects: 0
      });
    }
  }

  public registerCamera(camId: string, name: string, district = 'Gujarat', location = ''): void {
    if (!this.cameraStates.has(camId)) {
      this.cameraStates.set(camId, {
        cameraId: camId,
        name,
        district,
        location: location || name,
        state: 'STARTING',
        lastFrameTimestamp: null,
        lastFrameSha256: null,
        lastFrameByteLength: 0,
        consecutiveFailures: 0,
        reconnectAttempts: 0,
        nextAllowedReconnectTime: 0,
        lastStateChange: new Date().toISOString(),
        lastErrorMessage: null,
        totalFramesReceived: 0,
        totalReconnects: 0
      });
    }
  }

  /**
   * Called whenever a genuine frame is verified from the Sentinel acquisition pipeline.
   * Only transitions to LIVE if the buffer is a valid JPEG.
   */
  public recordVerifiedFrame(camId: string, frameBuffer: Buffer): boolean {
    const isJpeg = frameBuffer.length > 2 && frameBuffer[0] === 0xff && frameBuffer[1] === 0xd8;
    if (!isJpeg) {
      this.recordAcquisitionFailure(camId, 'CORRUPTED_FRAME_HEADER');
      return false;
    }

    const sha256 = crypto.createHash('sha256').update(frameBuffer).digest('hex');
    const now = Date.now();
    const node = this.cameraStates.get(camId);

    if (node) {
      const wasNotLive = node.state !== 'LIVE';
      node.state = 'LIVE';
      node.lastFrameTimestamp = now;
      node.lastFrameSha256 = sha256;
      node.lastFrameByteLength = frameBuffer.length;
      node.consecutiveFailures = 0;
      node.reconnectAttempts = 0;
      node.nextAllowedReconnectTime = 0;
      node.totalFramesReceived++;
      node.lastErrorMessage = null;

      if (wasNotLive) {
        node.lastStateChange = new Date().toISOString();
        applicationLifecycleManager.emitRecoveryEvent(
          'SENTINEL_SERVICES',
          'CAMERA_RECOVERED',
          'INFO',
          `Camera ${camId} (${node.name}) verified fresh frame (${frameBuffer.length} bytes, SHA: ${sha256.slice(0, 8)}...) and returned to LIVE`,
          'LIVE',
          { cameraId: camId, byteLength: frameBuffer.length, sha256 }
        );
      }
    }

    applicationLifecycleManager.recordFrameSuccess();
    return true;
  }

  /**
   * Called when frame acquisition fails for a camera.
   */
  public recordAcquisitionFailure(camId: string, errorMessage: string): void {
    const node = this.cameraStates.get(camId);
    if (!node) return;

    const cleanMsg = errorMessage
      .replace(/rtsp:\/\/[^:@]+:[^@]+@/gi, 'rtsp://***:***@')
      .replace(/\[tcp @ 0x[0-9a-f]+\]\s*/i, '')
      .replace(/\?timeout=\d+/g, '')
      .trim();

    node.consecutiveFailures++;
    node.lastErrorMessage = cleanMsg;

    const backoffIndex = Math.min(node.consecutiveFailures - 1, this.backoffSteps.length - 1);
    const baseDelay = this.backoffSteps[backoffIndex];
    node.nextAllowedReconnectTime = Date.now() + baseDelay;

    const isAuth = cleanMsg.toLowerCase().includes('auth') || cleanMsg.toLowerCase().includes('401');
    const newState: CameraLifecycleState = isAuth 
      ? 'AUTH_ERROR' 
      : node.consecutiveFailures >= this.offlineThresholdFailures 
        ? 'OFFLINE' 
        : 'STALE';

    if (node.state !== newState) {
      node.state = newState;
      node.lastStateChange = new Date().toISOString();

      const eventType = newState === 'AUTH_ERROR' ? 'CAMERA_AUTH_ERROR' : newState === 'OFFLINE' ? 'CAMERA_OFFLINE' : 'CAMERA_STALE';
      const severity = newState === 'OFFLINE' ? 'ERROR' : newState === 'AUTH_ERROR' ? 'WARNING' : 'INFO';
      const logText = newState === 'STALE'
        ? `Camera ${camId} standby/reconnecting (consecutive checks: ${node.consecutiveFailures})`
        : `Camera ${camId} state shifted to ${newState}: ${cleanMsg}`;

      applicationLifecycleManager.emitRecoveryEvent(
        'SENTINEL_SERVICES',
        eventType,
        severity,
        logText,
        newState,
        { cameraId: camId, consecutiveFailures: node.consecutiveFailures, reason: cleanMsg }
      );
    }
  }

  /**
   * Schedule controlled exponential backoff reconnection with anti-thundering-herd jitter.
   */
  public scheduleCameraReconnect(
    camId: string, 
    reconnectWorker: (cameraId: string) => Promise<boolean>
  ): void {
    const node = this.cameraStates.get(camId);
    if (!node || this.activeWorkers.has(camId)) return;

    const existingTimer = this.reconnectTimers.get(camId);
    if (existingTimer) return;

    node.reconnectAttempts++;
    node.totalReconnects++;
    node.state = 'RECONNECTING';
    node.lastStateChange = new Date().toISOString();

    const backoffIndex = Math.min(node.reconnectAttempts - 1, this.backoffSteps.length - 1);
    const baseDelay = this.backoffSteps[backoffIndex];
    // Add +/- 25% random jitter to avoid thundering-herd
    const jitter = (Math.random() * 0.5 - 0.25) * baseDelay;
    const finalDelay = Math.max(500, Math.floor(baseDelay + jitter));

    node.nextAllowedReconnectTime = Date.now() + finalDelay;

    applicationLifecycleManager.incrementCameraReconnect();
    applicationLifecycleManager.emitRecoveryEvent(
      'SENTINEL_SERVICES',
      'CAMERA_RECONNECTING',
      'INFO',
      `Scheduling reconnect attempt #${node.reconnectAttempts} for ${camId} in ${finalDelay}ms (backoff: ${baseDelay}ms)`,
      'RECONNECTING',
      { cameraId: camId, attempt: node.reconnectAttempts, delayMs: finalDelay }
    );

    const timer = setTimeout(async () => {
      this.reconnectTimers.delete(camId);
      this.activeWorkers.add(camId);

      try {
        const success = await reconnectWorker(camId);
        if (!success) {
          this.recordAcquisitionFailure(camId, `Reconnect attempt #${node.reconnectAttempts} failed`);
        }
      } catch (err: any) {
        this.recordAcquisitionFailure(camId, err?.message || 'Reconnect worker threw error');
      } finally {
        this.activeWorkers.delete(camId);
      }
    }, finalDelay);

    this.reconnectTimers.set(camId, timer);
  }

  /**
   * Stale frame auditor: scans all nodes and marks stale feeds.
   */
  public auditStaleNodes(): void {
    const now = Date.now();
    for (const [camId, node] of this.cameraStates.entries()) {
      if (node.state === 'LIVE' && node.lastFrameTimestamp) {
        if (now - node.lastFrameTimestamp > this.staleThresholdMs) {
          this.recordAcquisitionFailure(camId, `No fresh frame for ${Math.floor((now - node.lastFrameTimestamp)/1000)}s`);
        }
      }
    }
  }

  public getCameraState(camId: string): CameraNodeState | undefined {
    return this.cameraStates.get(camId);
  }

  public getAllCameraStates(): CameraNodeState[] {
    return Array.from(this.cameraStates.values());
  }

  public getSummary() {
    let live = 0;
    let stale = 0;
    let offline = 0;
    let reconnecting = 0;
    let authError = 0;
    let starting = 0;
    let degraded = 0;

    for (const node of this.cameraStates.values()) {
      switch (node.state) {
        case 'LIVE': live++; break;
        case 'STALE': stale++; break;
        case 'OFFLINE': offline++; break;
        case 'RECONNECTING': reconnecting++; break;
        case 'AUTH_ERROR': authError++; break;
        case 'STARTING': starting++; break;
        case 'DEGRADED': degraded++; break;
      }
    }

    return {
      total: this.cameraStates.size,
      live,
      stale,
      offline,
      reconnecting,
      authError,
      starting,
      degraded,
      allHealthy: live === this.cameraStates.size
    };
  }

  public resetAllWorkers(): void {
    for (const [, timer] of this.reconnectTimers.entries()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
    this.activeWorkers.clear();
  }
}

export const sentinelCameraRecoveryManager = SentinelCameraRecoveryManager.getInstance();
