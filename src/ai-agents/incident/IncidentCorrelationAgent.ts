/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * IncidentCorrelationAgent: Multi-Camera Spatiotemporal Incident Clustering Agent
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob, CorrelatedIncident, AgentPriority } from '../types';
import { sysEvents } from '../../services/Architecture';

export class IncidentCorrelationAgent extends BaseAgent {
  private incidents: Map<string, CorrelatedIncident> = new Map();

  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'INCIDENT-CORR-001',
      agentType: 'INCIDENT_CORRELATION',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'CENTRAL_METRO_INCIDENTS',
      capabilities: ['INCIDENT_CORRELATION'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<{
    incident: CorrelatedIncident;
    isNew: boolean;
    summary: string;
  }> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const {
        cameraId = 'CAM-AHM-014',
        nearbyCameras = ['CAM-AHM-007', 'CAM-AHM-023', 'CAM-AHM-031'],
        eventId,
        evidenceId,
        alertId,
        violationType = 'TRAFFIC_ANOMALY',
        severity = 'HIGH' as AgentPriority,
        title
      } = job.payload || {};

      // 1. Check if an active incident exists for this corridor/correlationId
      let incident = Array.from(this.incidents.values()).find(
        inc => inc.correlationId === job.correlationId || inc.affectedCameras.includes(cameraId)
      );

      let isNew = false;
      const nowIso = new Date().toISOString();

      if (!incident) {
        isNew = true;
        const incidentId = `INC-${Date.now().toString().slice(-6)}`;
        incident = {
          incidentId,
          title: title || `Correlated ${violationType} Incident`,
          severity,
          startTime: nowIso,
          lastUpdate: nowIso,
          affectedCameras: Array.from(new Set([cameraId, ...nearbyCameras])),
          relatedEvents: eventId ? [eventId] : [],
          relatedEvidence: evidenceId ? [evidenceId] : [],
          relatedAlerts: alertId ? [alertId] : [],
          status: 'INVESTIGATING',
          confidence: 0.94,
          correlationId: job.correlationId,
          summary: `Aggregated multi-camera incident detected across ${nearbyCameras.length + 1} spatial observation nodes.`,
          region: this.region,
          isSimulated: this.isSimulated
        };
        this.incidents.set(incidentId, incident);
        sysEvents.emit('incident_created', incident);
      } else {
        // Update existing incident
        incident.lastUpdate = nowIso;
        if (!incident.affectedCameras.includes(cameraId)) {
          incident.affectedCameras.push(cameraId);
        }
        if (eventId && !incident.relatedEvents.includes(eventId)) {
          incident.relatedEvents.push(eventId);
        }
        if (evidenceId && !incident.relatedEvidence.includes(evidenceId)) {
          incident.relatedEvidence.push(evidenceId);
        }
        if (alertId && !incident.relatedAlerts.includes(alertId)) {
          incident.relatedAlerts.push(alertId);
        }
        sysEvents.emit('incident_updated', incident);
      }

      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);

      return {
        incident,
        isNew,
        summary: `${incident.incidentId}: ${incident.affectedCameras.length} cameras, ${incident.relatedEvents.length} events, ${incident.relatedEvidence.length} evidence records.`
      };
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public getIncident(incidentId: string): CorrelatedIncident | undefined {
    return this.incidents.get(incidentId);
  }

  public getAllIncidents(): CorrelatedIncident[] {
    return Array.from(this.incidents.values()).sort(
      (a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
    );
  }
}
