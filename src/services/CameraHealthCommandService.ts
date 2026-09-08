/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * CameraHealthCommandService
 * Statewide Automated CCTV Quality Assurance, RTSP/ONVIF Diagnostics,
 * and Degraded-Mode Isolation Controller.
 */

import { Camera } from '../types';
import { centralEventBus } from './CentralEventBus';
import { incidentCommandService } from './IncidentCommandService';
import { sysEvents } from './Architecture';

export interface CameraHealthReport {
  scannedCount: number;
  healthyCount: number;
  degradedCount: number;
  offlineCount: number;
  averageLatencyMs: number;
  averageFps: number;
  quarantinedCameras: {
    cameraId: string;
    reason: string;
    latencyMs: number;
    fps: number;
  }[];
  timestamp: string;
}

export class CameraHealthCommandService {
  private static instance: CameraHealthCommandService | null = null;
  private lastReport: CameraHealthReport | null = null;

  private constructor() {}

  public static getInstance(): CameraHealthCommandService {
    if (!CameraHealthCommandService.instance) {
      CameraHealthCommandService.instance = new CameraHealthCommandService();
    }
    return CameraHealthCommandService.instance;
  }

  /**
   * Executes a full diagnostic sweep of configured cameras
   */
  public executeSweep(cameras: Camera[]): CameraHealthReport {
    const now = new Date().toISOString();
    let healthyCount = 0;
    let degradedCount = 0;
    let offlineCount = 0;
    let totalLatency = 0;
    let totalFps = 0;
    const quarantined: CameraHealthReport['quarantinedCameras'] = [];

    cameras.forEach(cam => {
      const isOffline = cam.status === 'offline' || cam.streamState === 'DISCONNECTED';
      const latency = cam.feedHealth?.latencyMs || (isOffline ? 0 : 38);
      const fps = cam.fps || (isOffline ? 0 : 25);

      totalLatency += latency;
      totalFps += fps;

      if (isOffline) {
        offlineCount++;
        quarantined.push({
          cameraId: cam.id,
          reason: 'Stream Disconnected / Keepalive Timeout',
          latencyMs: 0,
          fps: 0
        });
      } else if (latency > 150 || fps < 15) {
        degradedCount++;
        quarantined.push({
          cameraId: cam.id,
          reason: latency > 150 ? 'High WAN Ingestion Latency (>150ms)' : 'Low Frame Rate (<15 FPS)',
          latencyMs: latency,
          fps
        });
      } else {
        healthyCount++;
      }
    });

    const report: CameraHealthReport = {
      scannedCount: cameras.length,
      healthyCount,
      degradedCount,
      offlineCount,
      averageLatencyMs: cameras.length > 0 ? Math.round(totalLatency / cameras.length) : 0,
      averageFps: cameras.length > 0 ? Math.round((totalFps / cameras.length) * 10) / 10 : 0,
      quarantinedCameras: quarantined,
      timestamp: now
    };

    this.lastReport = report;

    // If offline cameras detected, trigger automated incident creation
    if (offlineCount > 0) {
      incidentCommandService.createIncident({
        title: `Camera Outage Detected: ${offlineCount} Node(s) Offline`,
        type: 'CAMERA_OUTAGE',
        severity: offlineCount >= 3 ? 'HIGH' : 'MEDIUM',
        location: 'Gujarat Statewide CCTV Grid',
        cameraIds: quarantined.map(q => q.cameraId),
        initialActor: 'CameraHealthCommandService',
        initialNotes: `Automated health sweep identified ${offlineCount} offline node(s): ${quarantined.map(q => q.cameraId).join(', ')}`
      });
    }

    sysEvents.emit('HEALTH_SWEEP_COMPLETED', report);
    return report;
  }

  public getLastReport(): CameraHealthReport | null {
    return this.lastReport;
  }
}

export const cameraHealthCommandService = CameraHealthCommandService.getInstance();
