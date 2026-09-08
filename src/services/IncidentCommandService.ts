/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * IncidentCommandService: Statewide Operational Incident Triaging, Lifecycle & Timeline Manager.
 */

import { 
  IncidentRecord, 
  IncidentType, 
  IncidentSeverity, 
  IncidentStatus 
} from '../types';
import { centralEventBus } from './CentralEventBus';
import { sysEvents } from './Architecture';

export class IncidentCommandService {
  private static instance: IncidentCommandService | null = null;
  private incidents: Map<string, IncidentRecord> = new Map();

  private constructor() {
    this.seedDefaultIncidents();
  }

  public static getInstance(): IncidentCommandService {
    if (!IncidentCommandService.instance) {
      IncidentCommandService.instance = new IncidentCommandService();
    }
    return IncidentCommandService.instance;
  }

  private seedDefaultIncidents(): void {
    const now = Date.now();
    const defaultIncidents: IncidentRecord[] = [
      {
        incidentId: 'INC-2026-0841',
        title: 'Priority Watchlist Target Sighting - SG Highway Corridor',
        type: 'WATCHLIST_CANDIDATE',
        severity: 'CRITICAL',
        status: 'INVESTIGATING',
        location: 'SG Highway - Pakwan Cross Junction (CAM-007)',
        district: 'Ahmedabad',
        cameraIds: ['CAM-007', 'CAM-014'],
        vehiclePlates: ['GJ01AB1234'],
        assignedAgentIds: ['WatchlistAgent', 'InvestigationAgent', 'CorrelationAgent'],
        assignedOfficer: 'Inspector V. Jadeja (Control Room Alpha)',
        detectedAt: new Date(now - 15 * 60000).toISOString(),
        updatedAt: new Date(now - 3 * 60000).toISOString(),
        timeline: [
          {
            timestamp: new Date(now - 15 * 60000).toISOString(),
            actor: 'WatchlistAgent',
            action: 'Automated match candidate flagged against Section 302 Wanted target database (Confidence: 0.94)',
          },
          {
            timestamp: new Date(now - 12 * 60000).toISOString(),
            actor: 'CorrelationAgent',
            action: 'Trajectory corridor established across CAM-007 and CAM-014 (Heading: Northbound)',
          },
          {
            timestamp: new Date(now - 8 * 60000).toISOString(),
            actor: 'Inspector V. Jadeja',
            action: 'Incident claimed for high-priority operational interception protocol',
            notes: 'Dispatching PCR Van-04 towards Thaltej Underpass.'
          }
        ],
        evidenceIds: ['EVD-0841-A', 'EVD-0841-B'],
        decisions: [
          {
            timestamp: new Date(now - 7 * 60000).toISOString(),
            officer: 'Inspector V. Jadeja',
            decision: 'INTERCEPT_COORDINATION_ORDERED',
            justification: 'High visual and HSRP plate match verified on live video feed with clear frontal angle.'
          }
        ]
      },
      {
        incidentId: 'INC-2026-0842',
        title: 'Multi-Vehicle Dangerous Wrong-Way Ingress',
        type: 'DANGEROUS_DRIVING',
        severity: 'HIGH',
        status: 'AWAITING_HUMAN_REVIEW',
        location: 'Surat Ring Road Corridor - Junction 4 (CAM-019)',
        district: 'Surat',
        cameraIds: ['CAM-019'],
        vehiclePlates: ['GJ05XY9988'],
        assignedAgentIds: ['RoadSafetyAgent', 'ChallanReviewAgent'],
        detectedAt: new Date(now - 25 * 60000).toISOString(),
        updatedAt: new Date(now - 10 * 60000).toISOString(),
        timeline: [
          {
            timestamp: new Date(now - 25 * 60000).toISOString(),
            actor: 'RoadSafetyAgent',
            action: 'Opposing vector flow detected on one-way arterial lane (Confidence: 0.91)',
          },
          {
            timestamp: new Date(now - 20 * 60000).toISOString(),
            actor: 'EvidenceAgent',
            action: 'Packaged 3-frame sequence with optical vector trajectory overlay',
          }
        ],
        evidenceIds: ['EVD-0842-A'],
        decisions: []
      },
      {
        incidentId: 'INC-2026-0843',
        title: 'Edge Gateway Telemetry Dropout & Camera Outage',
        type: 'CAMERA_OUTAGE',
        severity: 'MEDIUM',
        status: 'ASSIGNED',
        location: 'Vadodara Central Expressway Gate 2 (CAM-033)',
        district: 'Vadodara',
        cameraIds: ['CAM-033', 'CAM-034'],
        vehiclePlates: [],
        assignedAgentIds: ['CameraHealthAgent'],
        assignedOfficer: 'Field Tech Team 2',
        detectedAt: new Date(now - 60 * 60000).toISOString(),
        updatedAt: new Date(now - 35 * 60000).toISOString(),
        timeline: [
          {
            timestamp: new Date(now - 60 * 60000).toISOString(),
            actor: 'CameraHealthAgent',
            action: 'RTSP keepalive packet timeout; feed degraded to OFFLINE state',
          },
          {
            timestamp: new Date(now - 45 * 60000).toISOString(),
            actor: 'AgentSupervisorService',
            action: 'Camera stream workload drained and isolated to prevent edge backpressure',
          }
        ],
        evidenceIds: [],
        decisions: []
      }
    ];

    defaultIncidents.forEach(inc => this.incidents.set(inc.incidentId, inc));
  }

  public createIncident(params: {
    title: string;
    type: IncidentType;
    severity: IncidentSeverity;
    location: string;
    district?: string;
    cameraIds?: string[];
    vehiclePlates?: string[];
    assignedAgentIds?: string[];
    initialActor?: string;
    initialNotes?: string;
    evidenceIds?: string[];
  }): IncidentRecord {
    const incidentId = `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const record: IncidentRecord = {
      incidentId,
      title: params.title,
      type: params.type,
      severity: params.severity,
      status: 'DETECTED',
      location: params.location,
      district: params.district || 'Ahmedabad',
      cameraIds: params.cameraIds || [],
      vehiclePlates: params.vehiclePlates || [],
      assignedAgentIds: params.assignedAgentIds || ['InvestigationAgent'],
      detectedAt: now,
      updatedAt: now,
      timeline: [
        {
          timestamp: now,
          actor: params.initialActor || 'IncidentCommandService',
          action: 'Incident created and queued for automated triaging',
          notes: params.initialNotes
        }
      ],
      evidenceIds: params.evidenceIds || [],
      decisions: []
    };

    this.incidents.set(incidentId, record);

    centralEventBus.publish({
      eventType: 'INCIDENT_CREATED',
      sourceId: 'IncidentCommandService',
      correlationId: incidentId,
      idempotencyKey: `INC-PUB-${incidentId}`,
      priority: params.severity === 'CRITICAL' ? 'P0' : params.severity === 'HIGH' ? 'P1' : 'P2',
      payload: record
    });

    sysEvents.emit('INCIDENT_CREATED', record);
    return record;
  }

  public updateIncidentStatus(incidentId: string, status: IncidentStatus, actor: string, notes?: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    incident.status = status;
    incident.updatedAt = new Date().toISOString();
    if (status === 'RESOLVED' || status === 'CLOSED') {
      incident.resolvedAt = incident.updatedAt;
    }

    incident.timeline.push({
      timestamp: incident.updatedAt,
      actor,
      action: `Status transitioned to ${status}`,
      notes
    });

    centralEventBus.publish({
      eventType: 'INCIDENT_STATUS_UPDATED',
      sourceId: 'IncidentCommandService',
      correlationId: incidentId,
      idempotencyKey: `INC-STATUS-${incidentId}-${Date.now()}`,
      priority: 'P1',
      payload: { incidentId, status, actor, notes }
    });

    sysEvents.emit('INCIDENT_UPDATED', incident);
    return true;
  }

  public addDecision(incidentId: string, officer: string, decision: string, justification: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    const timestamp = new Date().toISOString();
    incident.decisions.push({
      timestamp,
      officer,
      decision,
      justification
    });

    incident.timeline.push({
      timestamp,
      actor: officer,
      action: `Officer Decision: ${decision}`,
      notes: justification
    });

    incident.updatedAt = timestamp;
    sysEvents.emit('INCIDENT_UPDATED', incident);
    return true;
  }

  public getIncident(incidentId: string): IncidentRecord | undefined {
    return this.incidents.get(incidentId);
  }

  public listIncidents(filter?: { status?: IncidentStatus; severity?: IncidentSeverity; type?: IncidentType }): IncidentRecord[] {
    let list = Array.from(this.incidents.values());
    if (filter) {
      if (filter.status) list = list.filter(i => i.status === filter.status);
      if (filter.severity) list = list.filter(i => i.severity === filter.severity);
      if (filter.type) list = list.filter(i => i.type === filter.type);
    }
    return list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  public getActiveCount(): number {
    return Array.from(this.incidents.values()).filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  }
}

export const incidentCommandService = IncidentCommandService.getInstance();
