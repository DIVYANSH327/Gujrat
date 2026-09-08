/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleAttributeCorrelationService: Multi-Modal Spatiotemporal Attribute Matcher
 * 
 * Correlates:
 * - Plate alphanumeric & OCR ambiguity
 * - Vehicle category / classification
 * - Vehicle color / chroma signature
 * - Make & Model (if detected or registered)
 * - Direction & lane alignment
 * - Camera network topology & transit time windows
 * - GPS proximity
 * 
 * Strict Principle:
 * Never declare "identity proof". Designate as "CROSS-CAMERA VEHICLE CORRELATION".
 */

import { 
  VehicleObservation, 
  VehicleAttributeCorrelationResult 
} from '../types';
import { cameraTopologyService } from './CameraTopologyService';

export class VehicleAttributeCorrelationService {
  private static instance: VehicleAttributeCorrelationService | null = null;

  private constructor() {}

  public static getInstance(): VehicleAttributeCorrelationService {
    if (!VehicleAttributeCorrelationService.instance) {
      VehicleAttributeCorrelationService.instance = new VehicleAttributeCorrelationService();
    }
    return VehicleAttributeCorrelationService.instance;
  }

  /**
   * Correlates two physical camera observations across 7 multi-modal attribute dimensions
   */
  public correlateAttributes(
    obsA: VehicleObservation, 
    obsB: VehicleObservation
  ): VehicleAttributeCorrelationResult {
    const signals: string[] = [];
    const conflictingSignals: string[] = [];
    const whyLinked: string[] = [];

    // 1. Plate Consistency (Weight: 35)
    let plateConsistency = 0;
    if (obsA.plateNormalized && obsB.plateNormalized) {
      if (obsA.plateNormalized === obsB.plateNormalized) {
        plateConsistency = 1.0;
        signals.push(`Exact plate match: ${obsA.plateNormalized}`);
        whyLinked.push('Exact plate alphanumeric match');
      } else {
        // Check Levenshtein or single-character OCR confusion
        const dist = this.levenshtein(obsA.plateNormalized, obsB.plateNormalized);
        if (dist === 1) {
          plateConsistency = 0.75;
          signals.push(`Close plate variant (1-char distance): ${obsA.plateNormalized} vs ${obsB.plateNormalized}`);
          whyLinked.push('Near-identical plate string with possible single OCR character variance');
        } else {
          plateConsistency = 0.0;
          conflictingSignals.push(`Plate mismatch: ${obsA.plateNormalized} vs ${obsB.plateNormalized}`);
        }
      }
    } else {
      plateConsistency = 0.45; // Partial or occluded plate capture
      signals.push('Unresolved plate read in one or both observations');
      whyLinked.push('Unresolved plate optical read; relying on appearance and corridor kinematics');
    }

    // 2. Vehicle Class Consistency (Weight: 20)
    let typeConsistency = 0;
    if (obsA.vehicleClass === obsB.vehicleClass) {
      typeConsistency = 1.0;
      signals.push(`Vehicle type concordant: ${obsA.vehicleClass}`);
      whyLinked.push(`Compatible vehicle type: ${obsA.vehicleClass}`);
    } else {
      typeConsistency = 0.15;
      conflictingSignals.push(`Vehicle class discrepancy: ${obsA.vehicleClass} vs ${obsB.vehicleClass}`);
    }

    // 3. Color Profile Consistency (Weight: 15)
    let colorConsistency = 0;
    const colA = (obsA.vehicleColor || 'UNKNOWN').toLowerCase();
    const colB = (obsB.vehicleColor || 'UNKNOWN').toLowerCase();
    if (colA === colB && colA !== 'unknown') {
      colorConsistency = 1.0;
      signals.push(`Color signature consistent: ${obsA.vehicleColor}`);
      whyLinked.push(`Compatible vehicle color (${obsA.vehicleColor})`);
    } else if (colA === 'unknown' || colB === 'unknown') {
      colorConsistency = 0.6;
      signals.push('Color indeterminate under ambient sensor lighting');
    } else {
      colorConsistency = 0.25;
      conflictingSignals.push(`Color disparity (${obsA.vehicleColor} vs ${obsB.vehicleColor})`);
    }

    // 4. Direction & Heading Alignment (Weight: 10)
    let directionConsistency = 0.8;
    if (obsA.direction && obsB.direction) {
      if (obsA.direction.toLowerCase() === obsB.direction.toLowerCase()) {
        directionConsistency = 1.0;
        signals.push(`Congruent corridor heading: ${obsA.direction}`);
        whyLinked.push(`Compatible travel direction (${obsA.direction})`);
      } else {
        directionConsistency = 0.4;
        signals.push(`Direction variation (${obsA.direction} to ${obsB.direction}), directional curve or turn feasible`);
      }
    }

    // 5. Camera Network Topology (Weight: 10)
    let topologyConsistency = 0.5;
    const edges = cameraTopologyService.getOutgoingEdges(obsA.cameraId);
    const edge = edges.find(e => e.targetCameraId === obsB.cameraId);
    if (edge) {
      topologyConsistency = 1.0;
      signals.push(`Connected corridor segment: ${obsA.cameraId} -> ${obsB.cameraId}`);
      whyLinked.push(`Direct topological adjacency (${edge.corridorName || 'Highway corridor'})`);
    } else if (obsA.cameraId === obsB.cameraId) {
      topologyConsistency = 0.95;
      signals.push(`Consecutive sightings at same camera ${obsA.cameraId}`);
      whyLinked.push('Same camera observation frame sequence');
    } else {
      topologyConsistency = 0.4;
      conflictingSignals.push(`Non-adjacent cameras (${obsA.cameraId} and ${obsB.cameraId}) in direct topology graph`);
    }

    // 6. Temporal Feasibility (Weight: 10)
    let temporalConsistency = 0.85;
    let timeDeltaSec = 0;
    if (obsA.timestamp && obsB.timestamp) {
      const tA = new Date(obsA.timestamp).getTime();
      const tB = new Date(obsB.timestamp).getTime();
      timeDeltaSec = Math.abs(tB - tA) / 1000;
    }

    let distanceKm = 0;
    if (obsA.gps && obsB.gps) {
      const R = 6371;
      const dLat = (obsB.gps.latitude - obsA.gps.latitude) * Math.PI / 180;
      const dLon = (obsB.gps.longitude - obsA.gps.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(obsA.gps.latitude * Math.PI / 180) * Math.cos(obsB.gps.latitude * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = R * c;
    }

    if (distanceKm > 0.2 && timeDeltaSec > 0) {
      const speedKmh = distanceKm / (timeDeltaSec / 3600);
      if (speedKmh > 160) {
        temporalConsistency = 0.05;
        conflictingSignals.push(`Improbable transit speed: calculated velocity ${Math.round(speedKmh)} km/h exceeds physical corridor speed limit`);
      }
    }

    if (edge) {
      const minTransit = edge.expectedTransitTimeSec * 0.4;
      const maxTransit = edge.expectedTransitTimeSec * 3.5;
      if (timeDeltaSec >= minTransit && timeDeltaSec <= maxTransit) {
        temporalConsistency = 1.0;
        signals.push(`Transit duration (${Math.round(timeDeltaSec)}s) is physically plausible`);
        whyLinked.push(`Plausible transit window (${Math.round(timeDeltaSec)}s)`);
      } else if (timeDeltaSec < minTransit) {
        temporalConsistency = 0.1;
        conflictingSignals.push(`Superluminal speed anomaly: elapsed ${Math.round(timeDeltaSec)}s exceeds physical corridor speed limit`);
      } else {
        temporalConsistency = 0.6;
        signals.push(`Delayed transit (${Math.round(timeDeltaSec)}s), expected due to junction stopping or congestion`);
      }
    }

    // Weighted composite score (0 - 100)
    const compositeScore = 
      (plateConsistency * 35) +
      (typeConsistency * 20) +
      (colorConsistency * 15) +
      (directionConsistency * 10) +
      (topologyConsistency * 10) +
      (temporalConsistency * 10);

    const confidence = Math.min(0.99, Number((compositeScore / 100).toFixed(3)));
    const requiresReview = confidence < 0.85 || conflictingSignals.length > 0;

    let decision: string;
    if (confidence >= 0.88 && conflictingSignals.length === 0) {
      decision = 'HIGH_CONFIDENCE_CORRELATION';
    } else if (confidence >= 0.70) {
      decision = 'PROBABLE_CORRELATION';
    } else if (confidence >= 0.50) {
      decision = 'POSSIBLE_CORRELATION_REVIEW_RECOMMENDED';
    } else {
      decision = 'INCONCLUSIVE_CORRELATION';
    }

    return {
      correlationId: `CORR-ATTR-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      score: Number(compositeScore.toFixed(1)),
      confidence,
      signals,
      conflictingSignals,
      decision,
      requiresReview,
      breakdown: {
        plateConsistency: Number((plateConsistency * 100).toFixed(1)),
        typeConsistency: Number((typeConsistency * 100).toFixed(1)),
        colorConsistency: Number((colorConsistency * 100).toFixed(1)),
        directionConsistency: Number((directionConsistency * 100).toFixed(1)),
        topologyConsistency: Number((topologyConsistency * 100).toFixed(1)),
        temporalConsistency: Number((temporalConsistency * 100).toFixed(1))
      },
      whyLinked
    };
  }

  private levenshtein(a: string, b: string): number {
    const dp: number[][] = [];
    for (let i = 0; i <= a.length; i++) dp[i] = [i];
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  }
}

export const vehicleAttributeCorrelationService = VehicleAttributeCorrelationService.getInstance();
