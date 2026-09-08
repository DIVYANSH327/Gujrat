/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * RegionalAgent: Municipal & District Cluster Coordination Agent
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';

export class RegionalAgent extends BaseAgent {
  public readonly districtName: string;
  private managedEdgeNodes: string[] = [];
  private managedCameraCount: number = 20000;

  constructor(params: {
    agentId: string;
    districtName: string;
    managedCameraCount?: number;
    managedEdgeNodes?: string[];
    isSimulated?: boolean;
  }) {
    super({
      agentId: params.agentId,
      agentType: 'REGIONAL_AGENT',
      region: params.districtName.toUpperCase(),
      assignedScope: `DISTRICT_METRO_${params.districtName.toUpperCase()}`,
      capabilities: ['REGIONAL_AGGREGATION', 'CAMERA_HEALTH', 'ORCHESTRATION'],
      isSimulated: params.isSimulated ?? true
    });
    this.districtName = params.districtName;
    this.managedCameraCount = params.managedCameraCount || 20000;
    this.managedEdgeNodes = params.managedEdgeNodes || [
      `EDGE-${params.districtName.slice(0, 3).toUpperCase()}-001`,
      `EDGE-${params.districtName.slice(0, 3).toUpperCase()}-002`
    ];
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<any> {
    this.activeJobsCount += 1;
    const start = Date.now();
    try {
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      return {
        district: this.districtName,
        managedCameras: this.managedCameraCount,
        edgeNodes: this.managedEdgeNodes,
        status: 'SYNCHRONIZED'
      };
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public getDistrictDetails() {
    return {
      district: this.districtName,
      managedCameras: this.managedCameraCount,
      edgeNodes: this.managedEdgeNodes,
      workload: this.getInfo().workloadPercent
    };
  }
}
