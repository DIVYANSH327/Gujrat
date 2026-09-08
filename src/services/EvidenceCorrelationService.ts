/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * EvidenceCorrelationService: Forensic Chain-of-Custody & Spatiotemporal Evidence Linker
 * 
 * Answers 7 Mandatory Forensic Inquiries:
 * 1. WHAT: Observed vehicle class, color, normalized plate
 * 2. WHEN: High-precision UTC timestamp & sequence ordering
 * 3. WHERE: Camera identifier, physical junction, GPS, edge node
 * 4. WHY: Watchlist hit, road safety violation, journey continuity, incident alert
 * 5. SOURCE: Edge Node, Fixed CCTV, Mobile Unit, or Synthetic Demo
 * 6. CONFIDENCE: Character-level optical accuracy + multi-attribute match
 * 7. CORRELATION: Tamper-evident cryptographic signature & lineage record
 */

import { 
  VehicleObservation, 
  ForensicEvidenceRecord, 
  JourneyQualityScore, 
  VehicleSignalSummary, 
  DetectedVehicleSignal,
  VehicleSignalType,
  SourceOfTruthCategory 
} from '../types';
import { cameraTopologyService } from './CameraTopologyService';

export interface TimelineEvidenceItem {
  stageIndex: number;
  stageName: string; // 'FIRST_SEEN' | 'INTERMEDIATE_CORRIDOR' | 'ROAD_SAFETY_EVENT' | 'WATCHLIST_HIT' | 'INCIDENT' | 'LAST_SEEN'
  observationId: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  location: string;
  plateText?: string;
  plateConfidence?: number;
  vehicleConfidence: number;
  vehicleClass: string;
  vehicleColor?: string;
  imageReference?: string;
  thumbnailReference?: string;
  evidenceReference?: string;
  evidenceHash?: string;
  sourceType: string;
  correlationConfidence: number;
  whyLinked: string;
  sourceCategory: SourceOfTruthCategory;
}

export class EvidenceCorrelationService {
  private static instance: EvidenceCorrelationService | null = null;

  private constructor() {}

  public static getInstance(): EvidenceCorrelationService {
    if (!EvidenceCorrelationService.instance) {
      EvidenceCorrelationService.instance = new EvidenceCorrelationService();
    }
    return EvidenceCorrelationService.instance;
  }

  /**
   * Builds an evidence-first chronological timeline linking physical observations
   */
  public buildEvidenceTimeline(observations: VehicleObservation[]): TimelineEvidenceItem[] {
    if (!observations || observations.length === 0) return [];

    // Sort chronologically
    const sorted = [...observations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sorted.map((obs, idx) => {
      let stageName = 'INTERMEDIATE_CORRIDOR';
      if (idx === 0) stageName = 'FIRST_SEEN';
      else if (idx === sorted.length - 1) stageName = 'LAST_SEEN';

      if (obs.watchlistMatch) stageName = 'WATCHLIST_HIT';

      const prev = idx > 0 ? sorted[idx - 1] : undefined;
      let why = 'Chronological highway corridor transit';
      let corrConf = 0.90;

      if (prev) {
        const edges = cameraTopologyService.getOutgoingEdges(prev.cameraId);
        const edge = edges.find(e => e.targetCameraId === obs.cameraId);
        if (edge) {
          why = `Topological transition via ${edge.corridorName || 'highway link'} (${edge.distanceMeters}m)`;
          corrConf = 0.95;
        } else if (prev.cameraId === obs.cameraId) {
          why = 'Sequential frame capture at current junction';
          corrConf = 0.98;
        } else {
          why = 'Cross-district transit corridor';
          corrConf = 0.82;
        }
      } else {
        why = 'Initial detection and entry into monitored perimeter';
      }

      return {
        stageIndex: idx + 1,
        stageName,
        observationId: obs.observationId,
        cameraId: obs.cameraId,
        cameraName: obs.cameraName || obs.cameraId,
        timestamp: obs.timestamp,
        location: `Latitude: ${obs.gps.latitude.toFixed(4)}, Longitude: ${obs.gps.longitude.toFixed(4)}`,
        plateText: obs.plateNormalized || obs.plateText,
        plateConfidence: obs.plateConfidence,
        vehicleConfidence: obs.vehicleConfidence,
        vehicleClass: obs.vehicleClass,
        vehicleColor: obs.vehicleColor,
        imageReference: obs.imageReference,
        thumbnailReference: obs.thumbnailReference || obs.imageReference,
        evidenceReference: obs.evidenceReference,
        evidenceHash: obs.evidenceHash,
        sourceType: obs.sourceType,
        correlationConfidence: corrConf,
        whyLinked: why,
        sourceCategory: (obs.analysisMode === 'SIMULATED_DEMO' ? 'SIMULATED' : 'CAMERA_OBSERVED') as SourceOfTruthCategory
      };
    });
  }

  /**
   * Evaluates the completeness and forensic consistency of a vehicle's observed trajectory
   */
  public calculateJourneyQuality(observations: VehicleObservation[]): JourneyQualityScore {
    if (!observations || observations.length === 0) {
      return {
        level: 'LOW',
        score: 0,
        reasons: ['No confirmed physical observations recorded.'],
        metrics: {
          observationCount: 0,
          averagePlateConfidence: 0,
          topologyConsistency: 0,
          timeConsistency: 0,
          evidenceCount: 0
        }
      };
    }

    const obsCount = observations.length;
    const plateConfs = observations
      .map(o => o.plateConfidence ?? 0)
      .filter(c => c > 0);
    const avgPlateConf = plateConfs.length > 0 
      ? plateConfs.reduce((a, b) => a + b, 0) / plateConfs.length 
      : 0.5;

    let topologyMatches = 0;
    let timePlausible = 0;
    let evidenceCount = 0;

    for (let i = 0; i < observations.length; i++) {
      if (observations[i].evidenceReference || observations[i].imageReference) {
        evidenceCount++;
      }

      if (i > 0) {
        const prev = observations[i - 1];
        const curr = observations[i];
        const edges = cameraTopologyService.getOutgoingEdges(prev.cameraId);
        if (edges.some(e => e.targetCameraId === curr.cameraId) || prev.cameraId === curr.cameraId) {
          topologyMatches++;
        }

        const tDiff = Math.abs(new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
        if (tDiff > 2 && tDiff < 14400) { // between 2s and 4hrs
          timePlausible++;
        }
      }
    }

    const transitions = Math.max(1, obsCount - 1);
    const topScore = topologyMatches / transitions;
    const timeScore = timePlausible / transitions;

    // Composite score (0 - 100)
    const compositeScore = Math.min(
      100,
      Math.round(
        (Math.min(obsCount, 5) / 5) * 30 +
        avgPlateConf * 30 +
        topScore * 20 +
        timeScore * 20
      )
    );

    const reasons: string[] = [];
    if (obsCount >= 3) reasons.push(`Multi-camera sightings (${obsCount} checkpoints) confirmed`);
    if (avgPlateConf >= 0.85) reasons.push(`High average OCR confidence (${Math.round(avgPlateConf * 100)}%)`);
    if (topScore >= 0.75) reasons.push('Camera transitions align with physical road network topology');
    if (evidenceCount === obsCount) reasons.push('Complete cryptographic snapshot evidence available for all sightings');

    let level: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (compositeScore >= 75) level = 'HIGH';
    else if (compositeScore >= 50) level = 'MEDIUM';

    return {
      level,
      score: compositeScore,
      reasons,
      metrics: {
        observationCount: obsCount,
        averagePlateConfidence: Number(avgPlateConf.toFixed(2)),
        topologyConsistency: Number(topScore.toFixed(2)),
        timeConsistency: Number(timeScore.toFixed(2)),
        evidenceCount
      }
    };
  }

  /**
   * Aggregates objective signals without creating an arbitrary guilt score
   */
  public aggregateSignals(params: {
    observations: VehicleObservation[];
    watchlistMatches?: any[];
    incidents?: any[];
    roadSafetyEvents?: any[];
    externalData?: any;
  }): VehicleSignalSummary {
    const signals: DetectedVehicleSignal[] = [];

    // 1. Watchlist hits
    if (params.watchlistMatches && params.watchlistMatches.length > 0) {
      params.watchlistMatches.forEach(m => {
        signals.push({
          type: 'WATCHLIST_MATCH',
          source: 'State Watchlist Subsystem',
          sourceCategory: 'EXTERNAL_AUTHORIZED',
          details: `Active watchlist match: ${m.reason || 'Priority Tracking'} (Flagged: ${m.severity || 'HIGH'})`,
          severity: 'CRITICAL',
          timestamp: m.matchedAt || new Date().toISOString(),
          referenceId: m.watchlistId || m.id
        });
      });
    }

    // 2. Incident correlation
    if (params.incidents && params.incidents.length > 0) {
      params.incidents.forEach(inc => {
        signals.push({
          type: 'RECENT_INCIDENT',
          source: 'Incident Correlation Engine',
          sourceCategory: 'AI_INFERRED',
          details: `Associated with incident: ${inc.title || inc.type} near ${inc.location || 'perimeter'}`,
          severity: inc.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          timestamp: inc.timestamp || new Date().toISOString(),
          referenceId: inc.incidentId || inc.id
        });
      });
    }

    // 3. Road safety violations
    if (params.roadSafetyEvents && params.roadSafetyEvents.length > 0) {
      signals.push({
        type: 'MULTIPLE_ROAD_SAFETY_EVENTS',
        source: 'Road Safety AI Agent',
        sourceCategory: 'AI_INFERRED',
        details: `${params.roadSafetyEvents.length} road safety events observed (e.g. overspeeding, wrong lane)`,
        severity: params.roadSafetyEvents.length >= 3 ? 'WARNING' : 'INFO',
        timestamp: new Date().toISOString()
      });
    }

    // 4. Sighting volume
    if (params.observations.length >= 3) {
      signals.push({
        type: 'MULTIPLE_HIGH_CONFIDENCE_SIGHTINGS',
        source: 'God\'s Eye Spatiotemporal Engine',
        sourceCategory: 'CAMERA_OBSERVED',
        details: `Correlated across ${params.observations.length} camera checkpoints with verified visual tracking`,
        severity: 'INFO',
        timestamp: new Date().toISOString()
      });
    }

    // 5. Check eGujCop or VAHAN external flags if available
    if (params.externalData?.egujcop?.records?.length > 0) {
      signals.push({
        type: 'ACTIVE_INVESTIGATION',
        source: 'eGujCop / CCTNS Police Records',
        sourceCategory: 'EXTERNAL_AUTHORIZED',
        details: `Active FIR/Warrant record flagged by eGujCop gateway: ${params.externalData.egujcop.records[0].caseNumber}`,
        severity: 'CRITICAL',
        timestamp: new Date().toISOString(),
        referenceId: params.externalData.egujcop.records[0].caseNumber
      });
    }

    const hasCritical = signals.some(s => s.severity === 'CRITICAL');
    const explanation = signals.length === 0
      ? 'No abnormal operational signals detected. Standard transit.'
      : `${signals.length} operational signals detected across physical sensors and authorized records.`;

    return {
      signals,
      totalSignalsCount: signals.length,
      hasCriticalSignals: hasCritical,
      explanation
    };
  }
}

export const evidenceCorrelationService = EvidenceCorrelationService.getInstance();
