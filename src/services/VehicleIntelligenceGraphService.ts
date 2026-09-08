/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleIntelligenceGraphService: Multi-Relational Spatial-Temporal Graph
 * Principles: Capture Once, Correlate Intelligently, Link via Relationships (No Data Duplication).
 */

import { 
  VehicleObservation, 
  ForensicEvidenceRecord, 
  Alert, 
  DownstreamPrediction 
} from '../types';
import { godsEyeObservationService } from './GodsEyeObservationService';
import { cameraTopologyService } from './CameraTopologyService';
import { evidenceStorage } from './EvidenceStorageProvider';

export type GraphRelationType =
  | 'CAMERA_OBSERVED_VEHICLE'
  | 'VEHICLE_PRODUCED_EVIDENCE'
  | 'VEHICLE_TRAVELED_TO_CAMERA'
  | 'VEHICLE_TRIGGERED_ALERT'
  | 'ALERT_BELONGS_TO_INCIDENT'
  | 'EVIDENCE_SUPPORTS_INVESTIGATION'
  | 'CAMERA_CONNECTS_TO_CAMERA'
  | 'EDGE_SERVES_CAMERA'
  | 'AGENT_PROCESSED_OBSERVATION'
  | 'VEHICLE_HAS_TRAJECTORY';

export interface GraphEdge {
  edgeId: string;
  sourceType: 'CAMERA' | 'VEHICLE' | 'EVIDENCE' | 'ALERT' | 'INCIDENT' | 'EDGE' | 'AGENT';
  sourceId: string;
  targetType: 'CAMERA' | 'VEHICLE' | 'EVIDENCE' | 'ALERT' | 'INCIDENT' | 'EDGE' | 'AGENT';
  targetId: string;
  relation: GraphRelationType;
  weight?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface VehicleTimelineItem {
  timestamp: string;
  type: 'OBSERVATION' | 'EVIDENCE' | 'ALERT' | 'INCIDENT' | 'CORRIDOR_TRANSITION';
  title: string;
  cameraId: string;
  cameraName?: string;
  details: string;
  referenceId: string;
  evidenceRef?: string;
  confidence: number;
}

export interface VehicleGraphSummary {
  vehicleId: string;
  plateNormalized?: string;
  nodesCount: number;
  edgesCount: number;
  camerasVisited: string[];
  evidenceRecordsCount: number;
  alertsTriggeredCount: number;
  incidentsLinkedCount: number;
  edges: GraphEdge[];
}

export class VehicleIntelligenceGraphService {
  private static instance: VehicleIntelligenceGraphService | null = null;
  private edges: GraphEdge[] = [];

  private constructor() {
    this.bootstrapCorridorGraph();
  }

  public static getInstance(): VehicleIntelligenceGraphService {
    if (!VehicleIntelligenceGraphService.instance) {
      VehicleIntelligenceGraphService.instance = new VehicleIntelligenceGraphService();
    }
    return VehicleIntelligenceGraphService.instance;
  }

  private bootstrapCorridorGraph(): void {
    // Connect authoritative cameras from Gujarat road topology
    const corridorCameras = ['CAM-007', 'CAM-014', 'CAM-023', 'CAM-031'];
    for (let i = 0; i < corridorCameras.length - 1; i++) {
      this.edges.push({
        edgeId: `EDGE-TOPO-${corridorCameras[i]}-${corridorCameras[i + 1]}`,
        sourceType: 'CAMERA',
        sourceId: corridorCameras[i],
        targetType: 'CAMERA',
        targetId: corridorCameras[i + 1],
        relation: 'CAMERA_CONNECTS_TO_CAMERA',
        weight: 0.95,
        timestamp: new Date().toISOString(),
        metadata: { corridor: 'SG_HIGHWAY_CORRIDOR' }
      });
    }
  }

  /**
   * Ingest/Link an observation into the unified knowledge graph
   */
  public ingestObservation(obs: VehicleObservation): void {
    this.linkObservation(obs);
  }

  /**
   * Link an observation into the unified knowledge graph
   */
  public linkObservation(obs: VehicleObservation): void {
    const vehicleKey = obs.plateNormalized || obs.trackId;
    const now = obs.timestamp;

    // 1. CAMERA OBSERVED VEHICLE
    this.edges.push({
      edgeId: `REL-OBS-${obs.observationId}`,
      sourceType: 'CAMERA',
      sourceId: obs.cameraId,
      targetType: 'VEHICLE',
      targetId: vehicleKey,
      relation: 'CAMERA_OBSERVED_VEHICLE',
      weight: obs.vehicleConfidence,
      timestamp: now,
      metadata: { observationId: obs.observationId, speed: obs.speedEstimate }
    });

    // 2. EDGE SERVES CAMERA
    this.edges.push({
      edgeId: `REL-EDGE-${obs.edgeNodeId}-${obs.cameraId}`,
      sourceType: 'EDGE',
      sourceId: obs.edgeNodeId,
      targetType: 'CAMERA',
      targetId: obs.cameraId,
      relation: 'EDGE_SERVES_CAMERA',
      timestamp: now
    });

    // 3. VEHICLE PRODUCED EVIDENCE
    if (obs.evidenceReference) {
      this.edges.push({
        edgeId: `REL-EVD-${obs.evidenceReference}`,
        sourceType: 'VEHICLE',
        sourceId: vehicleKey,
        targetType: 'EVIDENCE',
        targetId: obs.evidenceReference,
        relation: 'VEHICLE_PRODUCED_EVIDENCE',
        weight: obs.bestFrameScore || 0.9,
        timestamp: now
      });
    }

    // 4. WATCHLIST ALERT TRIGGER
    if (obs.watchlistMatch) {
      this.edges.push({
        edgeId: `REL-ALERT-${obs.observationId}`,
        sourceType: 'VEHICLE',
        sourceId: vehicleKey,
        targetType: 'ALERT',
        targetId: `ALERT-${obs.observationId}`,
        relation: 'VEHICLE_TRIGGERED_ALERT',
        weight: 1.0,
        timestamp: now,
        metadata: { reason: obs.watchlistReason }
      });
    }
  }

  public getVehicleGraph(vehicleId: string): VehicleGraphSummary {
    const normalized = vehicleId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const vehicleEdges = this.edges.filter(
      e => e.sourceId === normalized || e.targetId === normalized || e.sourceId === vehicleId || e.targetId === vehicleId
    );

    const cameras = new Set<string>();
    let evidenceCount = 0;
    let alertsCount = 0;

    for (const e of vehicleEdges) {
      if (e.sourceType === 'CAMERA') cameras.add(e.sourceId);
      if (e.targetType === 'CAMERA') cameras.add(e.targetId);
      if (e.targetType === 'EVIDENCE') evidenceCount++;
      if (e.targetType === 'ALERT') alertsCount++;
    }

    return {
      vehicleId,
      plateNormalized: normalized,
      nodesCount: cameras.size + evidenceCount + alertsCount + 1,
      edgesCount: vehicleEdges.length,
      camerasVisited: Array.from(cameras),
      evidenceRecordsCount: evidenceCount,
      alertsTriggeredCount: alertsCount,
      incidentsLinkedCount: alertsCount > 0 ? 1 : 0,
      edges: vehicleEdges
    };
  }

  public getVehicleTimeline(vehicleId: string): VehicleTimelineItem[] {
    const observations = godsEyeObservationService.getObservationsForPlate(vehicleId);
    const timeline: VehicleTimelineItem[] = [];

    for (const obs of observations) {
      timeline.push({
        timestamp: obs.timestamp,
        type: 'OBSERVATION',
        title: `Observed at ${obs.cameraName || obs.cameraId}`,
        cameraId: obs.cameraId,
        cameraName: obs.cameraName,
        details: `Classification: ${obs.vehicleClass.toUpperCase()} | Plate Status: ${obs.plateStatus} | Est Speed: ${obs.speedEstimate || 45} km/h`,
        referenceId: obs.observationId,
        evidenceRef: obs.evidenceReference,
        confidence: obs.vehicleConfidence
      });

      if (obs.isBestFrame && obs.evidenceReference) {
        timeline.push({
          timestamp: obs.timestamp,
          type: 'EVIDENCE',
          title: `Forensic Keyframe Stored (${obs.evidenceReference})`,
          cameraId: obs.cameraId,
          details: `SHA-256 integrity digest computed and archived with Section 65B compliance`,
          referenceId: obs.evidenceReference,
          evidenceRef: obs.evidenceReference,
          confidence: obs.bestFrameScore || 0.95
        });
      }

      if (obs.watchlistMatch) {
        timeline.push({
          timestamp: obs.timestamp,
          type: 'ALERT',
          title: `CRITICAL WATCHLIST HIT: ${obs.watchlistReason || 'Flagged Target'}`,
          cameraId: obs.cameraId,
          details: `Automated dispatch notification broadcasted to regional control room`,
          referenceId: `ALERT-${obs.observationId}`,
          confidence: 0.99
        });
      }
    }

    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return timeline;
  }

  public async getVehicleEvidence(vehicleId: string): Promise<ForensicEvidenceRecord[]> {
    const normalized = vehicleId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return evidenceStorage.listEvidence({ plateNormalized: normalized });
  }

  public getVehicleCameraPath(vehicleId: string): string[] {
    const observations = godsEyeObservationService.getObservationsForPlate(vehicleId);
    return observations.map(o => o.cameraId);
  }

  public getVehicleIncidents(vehicleId: string): any[] {
    const obs = godsEyeObservationService.getObservationsForPlate(vehicleId);
    const hasWatchlist = obs.some(o => o.watchlistMatch);
    if (!hasWatchlist) return [];

    return [{
      incidentId: `INC-${vehicleId}-01`,
      title: `Statewide Intercept Order: ${vehicleId}`,
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      region: 'AHMEDABAD_METRO',
      cameras: obs.map(o => o.cameraId),
      observationsCount: obs.length
    }];
  }

  public getVehicleLastSeen(vehicleId: string): {
    lastObservedCamera: string;
    lastObservedTime: string;
    speed: number;
    direction: string;
    isMobileCamera: boolean;
  } | null {
    const obs = godsEyeObservationService.getObservationsForPlate(vehicleId);
    if (obs.length === 0) return null;
    const last = obs[obs.length - 1];
    return {
      lastObservedCamera: last.cameraId,
      lastObservedTime: last.timestamp,
      speed: last.speedEstimate || 50,
      direction: last.direction || 'Northbound',
      isMobileCamera: last.isMobileCamera || false
    };
  }

  public getVehiclePossibleNextCameras(vehicleId: string): DownstreamPrediction[] {
    const lastSeen = this.getVehicleLastSeen(vehicleId);
    if (!lastSeen) return [];
    return cameraTopologyService.predictDownstreamCameras(lastSeen.lastObservedCamera, lastSeen.direction, lastSeen.lastObservedTime);
  }
}

export const vehicleIntelligenceGraph = VehicleIntelligenceGraphService.getInstance();
export const vehicleIntelligenceGraphService = vehicleIntelligenceGraph;
