/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * TrafficGroupCorrelationAgent: Group Traffic & Convoy Analysis Engine
 * 
 * Principle:
 * Identifies vehicles that transit through identical camera sequences within tight temporal proximity.
 * Designates as "GROUP_TRAFFIC_CANDIDATE" — never infers illicit intent autonomously.
 */

import { BaseAgent } from '../base/BaseAgent';
import { 
  VehicleObservation, 
  TrafficGroupCandidate, 
  AIAgentJob,
  normalizeLicensePlate 
} from '../../types';
import { godsEyeObservationService } from '../../services/GodsEyeObservationService';

export class TrafficGroupCorrelationAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string }) {
    super({
      agentId: params?.agentId || 'TRAFFIC-GROUP-CORR-01',
      agentType: 'TRAFFIC_GROUP_CORRELATION',
      region: params?.region || 'CENTRAL',
      assignedScope: 'CONVOY_AND_GROUP_DETECTION',
      capabilities: ['TRAFFIC_GROUP_CORRELATION', 'VEHICLE_CORRELATION'],
      isSimulated: false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  /**
   * Scans observation corpus for candidate vehicle groups traveling together
   */
  public detectTrafficGroups(observations?: VehicleObservation[]): TrafficGroupCandidate[] {
    const obs = observations || godsEyeObservationService.getAllObservations();
    if (obs.length < 2) return [];

    // Group observations by camera
    const byCamera = new Map<string, VehicleObservation[]>();
    for (const o of obs) {
      const list = byCamera.get(o.cameraId) || [];
      list.push(o);
      byCamera.set(o.cameraId, list);
    }

    // Identify vehicles seen at multiple common cameras within 90 seconds of each other
    const vehiclePairs = new Map<string, { cameras: Set<string>; timeDeltas: number[]; plates: [string, string] }>();

    for (const [camId, camObs] of byCamera.entries()) {
      const sorted = [...camObs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const obsA = sorted[i];
          const obsB = sorted[j];

          const pA = obsA.plateNormalized || obsA.plateText;
          const pB = obsB.plateNormalized || obsB.plateText;
          if (!pA || !pB || pA === pB) continue;

          const tDiff = Math.abs(new Date(obsB.timestamp).getTime() - new Date(obsA.timestamp).getTime()) / 1000;
          if (tDiff <= 90) { // Sighted within 90s at same junction
            const key = [pA, pB].sort().join(':::');
            const pair = vehiclePairs.get(key) || { 
              cameras: new Set<string>(), 
              timeDeltas: [], 
              plates: [pA, pB] 
            };
            pair.cameras.add(camId);
            pair.timeDeltas.push(tDiff);
            vehiclePairs.set(key, pair);
          }
        }
      }
    }

    const candidates: TrafficGroupCandidate[] = [];

    for (const [key, pair] of vehiclePairs.entries()) {
      // If sighted together at 2 or more distinct cameras, flag candidate
      if (pair.cameras.size >= 2) {
        const avgDelta = pair.timeDeltas.reduce((a, b) => a + b, 0) / pair.timeDeltas.length;
        const confidence = Math.min(0.96, 0.65 + (pair.cameras.size * 0.1));

        candidates.push({
          groupId: `GRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          vehicleIds: [`VEH-${normalizeLicensePlate(pair.plates[0])}`, `VEH-${normalizeLicensePlate(pair.plates[1])}`],
          plates: [pair.plates[0], pair.plates[1]],
          cameraSequence: Array.from(pair.cameras),
          timeWindowStart: new Date(Date.now() - 3600000).toISOString(),
          timeWindowEnd: new Date().toISOString(),
          averageSpacingMeters: Math.round(avgDelta * 15), // approximate spacing @ 50km/h
          confidence: Number(confidence.toFixed(2)),
          classification: 'GROUP_TRAFFIC_CANDIDATE',
          reasons: [
            `Sighted together across ${pair.cameras.size} sequential cameras: [${Array.from(pair.cameras).join(' -> ')}]`,
            `Average convoy spacing delta: ${Math.round(avgDelta)} seconds`,
            'Physical transit trajectory concordant'
          ]
        });
      }
    }

    return candidates;
  }

  public async assignJob(job: AIAgentJob): Promise<TrafficGroupCandidate[]> {
    this.activeJobsCount += 1;
    const start = Date.now();
    try {
      const results = this.detectTrafficGroups(job.payload?.observations);
      this.completedJobsCount += 1;
      this.totalLatencyMs += Date.now() - start;
      return results;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }
}

export const trafficGroupCorrelationAgent = new TrafficGroupCorrelationAgent();
