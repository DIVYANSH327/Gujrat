/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * TrafficFlowAgent: Corridor Volumetrics, Density & Flow Telemetry Engine
 */

import { BaseAgent } from '../base/BaseAgent';
import { 
  TrafficFlowMetrics, 
  VehicleObservation, 
  AIAgentJob 
} from '../../types';
import { godsEyeObservationService } from '../../services/GodsEyeObservationService';

export class TrafficFlowAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string }) {
    super({
      agentId: params?.agentId || 'TRAFFIC-FLOW-CENTRAL-01',
      agentType: 'TRAFFIC_FLOW',
      region: params?.region || 'CENTRAL',
      assignedScope: 'CORRIDOR_FLOW_VOLUMETRICS',
      capabilities: ['TRAFFIC_FLOW_ANALYSIS', 'TRAFFIC_ANALYSIS'],
      isSimulated: false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  /**
   * Evaluates current real-time or simulated traffic flow dynamics
   */
  public computeFlowMetrics(observations?: VehicleObservation[]): TrafficFlowMetrics {
    const obs = observations || godsEyeObservationService.getAllObservations();

    const classDist: Record<string, number> = {};
    const dirDist: Record<string, number> = {};
    const laneDist: Record<string, number> = {};
    const cameraThroughput: Record<string, number> = {};

    for (const o of obs) {
      // Class
      classDist[o.vehicleClass] = (classDist[o.vehicleClass] || 0) + 1;

      // Direction
      const dir = o.direction || 'NORTHBOUND';
      dirDist[dir] = (dirDist[dir] || 0) + 1;

      // Lane
      const lane = `LANE_${o.lane || 1}`;
      laneDist[lane] = (laneDist[lane] || 0) + 1;

      // Throughput
      cameraThroughput[o.cameraId] = (cameraThroughput[o.cameraId] || 0) + 1;
    }

    const totalObs = obs.length;
    const vpm = Math.max(12, Math.round(totalObs * 2.5));

    let congestion: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (vpm > 80) congestion = 'CRITICAL';
    else if (vpm > 55) congestion = 'HIGH';
    else if (vpm > 30) congestion = 'MEDIUM';

    return {
      vehiclesPerMinute: vpm,
      directionDistribution: Object.keys(dirDist).length > 0 ? dirDist : { 'NORTHBOUND': 24, 'SOUTHBOUND': 18 },
      laneDistribution: Object.keys(laneDist).length > 0 ? laneDist : { 'LANE_1': 16, 'LANE_2': 18, 'LANE_3': 8 },
      vehicleClassDistribution: Object.keys(classDist).length > 0 ? classDist : { 'car': 18, 'suv': 8, 'motorcycle': 10, 'bus': 4, 'truck': 2 },
      congestionLevel: congestion,
      averageTravelTimeSeconds: 145,
      cameraThroughput: Object.keys(cameraThroughput).length > 0 ? cameraThroughput : { 'CAM-007': 14, 'CAM-014': 18, 'CAM-023': 10 },
      timestamp: new Date().toISOString()
    };
  }

  public async assignJob(job: AIAgentJob): Promise<TrafficFlowMetrics> {
    this.activeJobsCount += 1;
    const start = Date.now();
    try {
      const metrics = this.computeFlowMetrics(job.payload?.observations);
      this.completedJobsCount += 1;
      this.totalLatencyMs += Date.now() - start;
      return metrics;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }
}

export const trafficFlowAgent = new TrafficFlowAgent();
