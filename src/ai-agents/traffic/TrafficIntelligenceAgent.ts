/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * TrafficIntelligenceAgent: Volume, Flow Congestion & Spatial Velocity Analytics
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';

export interface TrafficMetricPayload {
  junctionId: string;
  cameraId: string;
  timestamp: string;
  vehiclesPerMinute: number;
  averageEstimatedSpeedKmh?: number;
  congestionIndex: number; // 0 (free flow) to 100 (gridlock)
  laneOccupancyPercent: number;
  unusualCongestionDetected: boolean;
  classificationTag: 'AI-DERIVED TRAFFIC METRIC' | 'SIMULATED TRAFFIC TELEMETRY';
  isSimulated: boolean;
}

export class TrafficIntelligenceAgent extends BaseAgent {
  private trafficMetrics: Map<string, TrafficMetricPayload> = new Map();

  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'TRAFFIC-AHM-001',
      agentType: 'TRAFFIC_INTELLIGENCE',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'RING_ROAD_CORRIDOR',
      capabilities: ['TRAFFIC_ANALYSIS'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<TrafficMetricPayload> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const { cameraId = 'CAM-AHM-014', detectedVehiclesCount = 8, junctionId = 'JN-AIRPORT-RD' } = job.payload || {};

      const vpm = Math.max(0, detectedVehiclesCount * 6);
      const congestion = Math.min(100, Math.round((vpm / 120) * 100));

      const metric: TrafficMetricPayload = {
        junctionId,
        cameraId,
        timestamp: new Date().toISOString(),
        vehiclesPerMinute: vpm,
        averageEstimatedSpeedKmh: congestion > 75 ? 18 : 42,
        congestionIndex: congestion,
        laneOccupancyPercent: Math.min(95, Math.round(congestion * 0.9)),
        unusualCongestionDetected: congestion > 80,
        classificationTag: this.isSimulated ? 'SIMULATED TRAFFIC TELEMETRY' : 'AI-DERIVED TRAFFIC METRIC',
        isSimulated: this.isSimulated
      };

      this.trafficMetrics.set(cameraId, metric);
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);

      return metric;
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public getTrafficMetric(cameraId: string): TrafficMetricPayload | undefined {
    return this.trafficMetrics.get(cameraId);
  }

  public getAllTrafficMetrics(): TrafficMetricPayload[] {
    return Array.from(this.trafficMetrics.values());
  }
}
