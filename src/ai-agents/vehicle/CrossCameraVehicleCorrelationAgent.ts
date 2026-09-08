/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * CrossCameraVehicleCorrelationAgent: Multi-Signal Spatiotemporal Matcher & Explainability Engine
 * Evaluates plate text, vehicle class, color, topological feasibility, and transit time windows.
 */

import { BaseAgent } from '../base/BaseAgent';
import { 
  VehicleObservation, 
  CorrelationResult, 
  VehicleCorrelationScoreBreakdown 
} from '../../types';
import { cameraTopologyService } from '../../services/CameraTopologyService';
import { DecisionExplanation } from '../types';

export class CrossCameraVehicleCorrelationAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string }) {
    super({
      agentId: params?.agentId || 'CROSS-CORR-CENTRAL-001',
      agentType: 'CROSS_CAMERA_CORRELATION',
      region: params?.region || 'CENTRAL',
      assignedScope: 'STATEWIDE_CORRELATION_FABRIC',
      capabilities: ['VEHICLE_CORRELATION', 'TEMPORAL_CORRIDOR_MAPPING'],
      isSimulated: false
    });
  }

  /**
   * Correlate two vehicle observations across different cameras with explainability
   */
  public correlateObservations(obsA: VehicleObservation, obsB: VehicleObservation): CorrelationResult {
    const matchedSignals: string[] = [];
    const unmatchedSignals: string[] = [];
    const warnings: string[] = [];

    // 1. Plate match (Weight: 40)
    let plateScore = 0;
    if (obsA.plateNormalized && obsB.plateNormalized) {
      if (obsA.plateNormalized === obsB.plateNormalized) {
        plateScore = 40;
        matchedSignals.push(`Exact alphanumeric plate match: ${obsA.plateNormalized}`);
      } else {
        unmatchedSignals.push(`Plate text discrepancy: ${obsA.plateNormalized} vs ${obsB.plateNormalized}`);
      }
    } else {
      plateScore = 15; // Unread or occluded plate
      warnings.push('One or both observations lack full optical character recognition');
    }

    // 2. Vehicle Class Match (Weight: 15)
    let classScore = 0;
    if (obsA.vehicleClass === obsB.vehicleClass) {
      classScore = 15;
      matchedSignals.push(`Vehicle classification congruent (${obsA.vehicleClass})`);
    } else {
      unmatchedSignals.push(`Class mismatch: ${obsA.vehicleClass} vs ${obsB.vehicleClass}`);
    }

    // 3. Color congruence (Weight: 15)
    let colorScore = 0;
    if (obsA.vehicleColor.toLowerCase() === obsB.vehicleColor.toLowerCase()) {
      colorScore = 15;
      matchedSignals.push(`Chroma profile consistent (${obsA.vehicleColor})`);
    } else {
      colorScore = 5;
      unmatchedSignals.push(`Color variation (${obsA.vehicleColor} vs ${obsB.vehicleColor}), possible lighting/shadow variance`);
    }

    // 4. Temporal Feasibility & Camera Topology (Weight: 30)
    let topologyScore = 0;
    let timeDeltaSec = 0;
    if (obsA.timestamp && obsB.timestamp) {
      const tA = new Date(obsA.timestamp).getTime();
      const tB = new Date(obsB.timestamp).getTime();
      timeDeltaSec = Math.abs(tB - tA) / 1000;
    }

    // Check if cameras are connected in topology graph
    const edges = cameraTopologyService.getOutgoingEdges(obsA.cameraId);
    const edge = edges.find(e => e.targetCameraId === obsB.cameraId);
    if (edge) {
      const minAllowed = edge.expectedTransitTimeSec * 0.4;
      const maxAllowed = edge.expectedTransitTimeSec * 3.0;

      if (timeDeltaSec >= minAllowed && timeDeltaSec <= maxAllowed) {
        topologyScore = 30;
        matchedSignals.push(
          `Physically realistic transit time (${Math.round(timeDeltaSec)}s) across corridor ${obsA.cameraId} -> ${obsB.cameraId}`
        );
      } else if (timeDeltaSec < minAllowed) {
        topologyScore = 5;
        unmatchedSignals.push(
          `Physically impossible transit speed: elapsed ${Math.round(timeDeltaSec)}s exceeds speed limits between ${obsA.cameraId} and ${obsB.cameraId}`
        );
      } else {
        topologyScore = 15;
        matchedSignals.push(`Delayed transit across connected corridor (stopover or congestion feasible)`);
      }
    } else if (obsA.cameraId === obsB.cameraId) {
      topologyScore = 25;
      matchedSignals.push(`Same camera field-of-view tracking`);
    } else {
      // Unconnected nodes
      topologyScore = 10;
      warnings.push(`Cameras ${obsA.cameraId} and ${obsB.cameraId} are not direct topological neighbors`);
    }

    const totalScore = plateScore + classScore + colorScore + topologyScore;
    const confidence = Math.min(0.99, totalScore / 100);

    const breakdown: VehicleCorrelationScoreBreakdown = {
      plateConfidence: plateScore / 40,
      visualEmbeddingCosine: colorScore / 15,
      classAgreementScore: classScore / 15,
      colorAgreementScore: colorScore / 15,
      temporalFeasibilityScore: topologyScore / 30,
      topologyConsistencyScore: edge ? 1.0 : 0.4,
      totalWeightedConfidence: confidence
    };

    // Explainable decision summary
    const explanation = totalScore >= 70
      ? `High-confidence multi-signal correlation: ${matchedSignals.join('; ')}.`
      : `Inconclusive correlation (${totalScore}% confidence): ${unmatchedSignals.concat(warnings).join('; ')}.`;

    return {
      matchConfidence: confidence,
      matchedSignals,
      unmatchedSignals,
      scoreBreakdown: breakdown,
      candidateObservationIds: [obsA.observationId, obsB.observationId],
      explanation,
      isDefinitiveMatch: totalScore >= 75
    };
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount++;
    this.recordHeartbeat();
  }

  public async assignJob(job: any): Promise<any> {
    this.activeJobsCount++;
    try {
      if (job?.payload?.obsA && job?.payload?.obsB) {
        return this.correlateObservations(job.payload.obsA, job.payload.obsB);
      }
      return { status: 'COMPLETED', agentId: this.agentId };
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.completedJobsCount++;
    }
  }

  /**
   * Generates formal DecisionExplanation for compliance and audit
   */
  public explainDecision(corrResult: CorrelationResult): DecisionExplanation {
    return {
      decisionId: `DEC-${Date.now()}`,
      decisionType: 'CROSS_CAMERA_VEHICLE_CORRELATION',
      confidence: corrResult.matchConfidence,
      signals: corrResult.matchedSignals,
      negativeSignals: corrResult.unmatchedSignals,
      dataSources: ['CCTV_EDGE_OBSERVATION', 'ROAD_NETWORK_TOPOLOGY'],
      agent: this.agentId,
      model: 'MultiSignal-Ensemble-v2.0',
      timestamp: new Date().toISOString(),
      policy: 'GUJARAT_POLICE_INTELLIGENCE_GRID_SOP_V2',
      humanReviewRequired: corrResult.matchConfidence < 0.85
    };
  }
}

export const crossCameraCorrelationAgent = new CrossCameraVehicleCorrelationAgent();
