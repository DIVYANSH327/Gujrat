/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * CameraHealthAgent: Stream Telemetry, DVR/NVR Reachability & Video Quality Monitor
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob, AIAgentMessage } from '../types';
import { sysEvents } from '../../services/Architecture';

export interface CameraStreamHealth {
  cameraId: string;
  sourceId: string;
  protocol: 'RTSP' | 'ONVIF' | 'DVR_CHANNEL' | 'WEB_RTC' | 'DEMO_STREAM';
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';
  fps: number;
  bitrateKbps: number;
  latencyMs: number;
  lastFrameTimestamp: string;
  freezeDetected: boolean;
  packetLossPercent: number;
  isSimulated: boolean;
}

export class CameraHealthAgent extends BaseAgent {
  private cameraHealthRecords: Map<string, CameraStreamHealth> = new Map();

  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'CAM-HEALTH-AHM-001',
      agentType: 'CAMERA_HEALTH',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'ZONE_METRO_CORRIDOR',
      capabilities: ['CAMERA_HEALTH'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();

    if (event.cameraId) {
      this.evaluateStream(event.cameraId, event.metadata || {});
    }
  }

  public async assignJob(job: AIAgentJob): Promise<any> {
    this.activeJobsCount += 1;
    const start = Date.now();
    try {
      const { cameraId, simulatedMetrics } = job.payload || {};
      if (!cameraId) throw new Error('MISSING_CAMERA_ID');

      const health = this.evaluateStream(cameraId, simulatedMetrics);
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      return health;
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public evaluateStream(cameraId: string, telemetry?: any): CameraStreamHealth {
    const isFreeze = telemetry?.freezeDetected ?? (telemetry?.fps !== undefined && telemetry.fps < 5);
    const isOffline = telemetry?.isOffline ?? false;
    
    let status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN' = 'ONLINE';
    if (isOffline) {
      status = 'OFFLINE';
    } else if (isFreeze || (telemetry?.packetLossPercent && telemetry.packetLossPercent > 15)) {
      status = 'DEGRADED';
    }

    const record: CameraStreamHealth = {
      cameraId,
      sourceId: telemetry?.sourceId || `DVR-AHM-${cameraId.split('-')[1] || '001'}`,
      protocol: telemetry?.protocol || 'RTSP',
      status,
      fps: telemetry?.fps ?? 25,
      bitrateKbps: telemetry?.bitrateKbps ?? 2048,
      latencyMs: telemetry?.latencyMs ?? 85,
      lastFrameTimestamp: new Date().toISOString(),
      freezeDetected: isFreeze,
      packetLossPercent: telemetry?.packetLossPercent ?? 0.2,
      isSimulated: this.isSimulated
    };

    this.cameraHealthRecords.set(cameraId, record);

    if (status === 'OFFLINE' || status === 'DEGRADED') {
      sysEvents.emit('camera_health_anomaly', {
        cameraId,
        status,
        reason: isOffline ? 'DVR_UNREACHABLE' : 'POSSIBLE_VIDEO_FREEZE',
        timestamp: record.lastFrameTimestamp
      });
    }

    return record;
  }

  public getCameraHealth(cameraId: string): CameraStreamHealth | undefined {
    return this.cameraHealthRecords.get(cameraId);
  }

  public getAllHealthRecords(): CameraStreamHealth[] {
    return Array.from(this.cameraHealthRecords.values());
  }
}
