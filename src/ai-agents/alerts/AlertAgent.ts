/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AlertAgent: Incident Prioritization, Deduplication & Human Oversight Agent
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob, AgentPriority } from '../types';
import { Alert } from '../../types';
import { centralRepo, sysEvents } from '../../services/Architecture';

export class AlertAgent extends BaseAgent {
  private alerts: Map<string, Alert> = new Map();
  private recentAlertIndex: Map<string, number> = new Map(); // dedupKey -> timestamp

  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'ALERT-CENTRAL-001',
      agentType: 'ALERT',
      region: params?.region || 'CENTRAL',
      assignedScope: 'CENTRAL_DISPATCH_CONSOLE',
      capabilities: ['ALERT_DISPATCH'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<{
    alert?: Alert;
    deduplicated: boolean;
    reason?: string;
  }> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const {
        title = 'Road Safety Violation',
        description,
        severity = 'high' as 'high' | 'medium' | 'info',
        cameraId = 'CAM-AHM-014',
        targetId = 'BIKE-TRACK-001',
        evidenceId,
        confidence = 0.92,
        violationType = 'NO_HELMET'
      } = job.payload || {};

      // 1. Deduplication check: 5s window per camera:targetId:type
      const dedupKey = `${cameraId}:${targetId}:${violationType}`;
      const now = Date.now();
      const lastAlert = this.recentAlertIndex.get(dedupKey);

      if (lastAlert && (now - lastAlert) < 5000) {
        this.completedJobsCount += 1;
        return { deduplicated: true, reason: 'DUPLICATE_ALERT_SUPPRESSED' };
      }
      this.recentAlertIndex.set(dedupKey, now);

      const alertId = `ALT-${Date.now().toString().slice(-6)}`;
      const alert: Alert = {
        id: alertId,
        type: 'road_safety',
        siteId: 'SITE-AHM-METRO',
        cameraId,
        timestamp: new Date().toISOString(),
        title,
        description: description || `AI detected ${violationType} on track ${targetId}. Automated evidence attached.`,
        severity: severity as any,
        status: 'new',
        isRead: false,
        snapshotUrl: '/demo-traffic-frame.jpg',
        targetId,
        confidence,
        evidenceId,
        isSimulated: this.isSimulated,
        sourceType: this.isSimulated ? 'SIMULATED_DEMO_STREAM' : 'REAL_AI_VIDEO_ANALYSIS'
      };

      this.alerts.set(alertId, alert);
      this.alertsGeneratedCount += 1;

      // Emit to system events
      sysEvents.emit('alert_created', alert);

      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);

      return { alert, deduplicated: false };
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public updateAlertStatus(
    alertId: string, 
    status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed',
    operatorId: string = 'OPERATOR-DIVYANSH'
  ): Alert | undefined {
    const alert = this.alerts.get(alertId);
    if (!alert) return undefined;

    alert.status = status as any;
    sysEvents.emit('alert_updated', { alertId, status, operatorId, timestamp: new Date().toISOString() });
    return alert;
  }

  public getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  public getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}
