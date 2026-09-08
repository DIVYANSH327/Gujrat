/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * BaseAgent: Common Foundation for All AI Mesh Agents
 */

import { 
  IAIAgent, 
  AgentType, 
  AgentStatus, 
  AgentCapability, 
  AIAgentMetrics, 
  AIAgentInfo, 
  AgentPriority, 
  AIAgentJob 
} from '../types';

export abstract class BaseAgent implements IAIAgent {
  public readonly agentId: string;
  public readonly agentType: AgentType;
  public readonly version: string = '1.0.0';
  public readonly region: string;
  public readonly assignedScope: string;
  public readonly edgeNodeId?: string;
  public readonly isSimulated: boolean;

  protected status: AgentStatus = 'STARTING';
  protected capabilities: AgentCapability[] = [];
  protected priority: AgentPriority = 'NORMAL';
  protected lastHeartbeat: string = new Date().toISOString();
  protected activeJobsCount: number = 0;
  protected queuedJobsCount: number = 0;
  protected completedJobsCount: number = 0;
  protected failedJobsCount: number = 0;
  protected totalLatencyMs: number = 0;
  protected eventsProcessedCount: number = 0;
  protected evidenceCapturedCount: number = 0;
  protected alertsGeneratedCount: number = 0;
  protected cpuUsage: number = 25;
  protected memoryUsage: number = 40;
  protected gpuUsage?: number = 30;

  constructor(params: {
    agentId: string;
    agentType: AgentType;
    region?: string;
    assignedScope?: string;
    edgeNodeId?: string;
    capabilities?: AgentCapability[];
    isSimulated?: boolean;
  }) {
    this.agentId = params.agentId;
    this.agentType = params.agentType;
    this.region = params.region || 'AHMEDABAD';
    this.assignedScope = params.assignedScope || 'REGIONAL_METRO';
    this.edgeNodeId = params.edgeNodeId;
    this.isSimulated = params.isSimulated ?? false;
    if (params.capabilities) {
      this.capabilities = [...params.capabilities];
    }
  }

  public async initialize(): Promise<void> {
    this.status = 'IDLE';
    this.recordHeartbeat();
  }

  public async start(): Promise<void> {
    this.status = 'IDLE';
    this.recordHeartbeat();
  }

  public async stop(): Promise<void> {
    this.status = 'OFFLINE';
  }

  public async pause(): Promise<void> {
    if (this.status !== 'OFFLINE') {
      this.status = 'DRAINING';
    }
  }

  public async resume(): Promise<void> {
    if (this.status === 'DRAINING' || this.status === 'DEGRADED' || this.status === 'OFFLINE' || this.status === 'ERROR') {
      this.status = 'IDLE';
    }
    this.recordHeartbeat();
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public setStatus(s: AgentStatus): void {
    this.status = s;
  }

  public getCapabilities(): AgentCapability[] {
    return [...this.capabilities];
  }

  public recordHeartbeat(): void {
    this.lastHeartbeat = new Date().toISOString();
  }

  public getMetrics(): AIAgentMetrics {
    const totalJobs = this.completedJobsCount + this.failedJobsCount;
    const avgLatency = totalJobs > 0 ? Math.round(this.totalLatencyMs / totalJobs) : 45;

    return {
      activeJobs: this.activeJobsCount,
      queuedJobs: this.queuedJobsCount,
      completedJobs: this.completedJobsCount,
      failedJobs: this.failedJobsCount,
      averageLatencyMs: avgLatency,
      lastHeartbeat: this.lastHeartbeat,
      cpuUsagePercent: this.cpuUsage,
      memoryUsagePercent: this.memoryUsage,
      gpuUsagePercent: this.gpuUsage,
      eventsProcessed: this.eventsProcessedCount,
      evidenceCaptured: this.evidenceCapturedCount,
      alertsGenerated: this.alertsGeneratedCount,
      isSimulatedHardwareTelemetry: this.isSimulated
    };
  }

  public getInfo(): AIAgentInfo {
    const metrics = this.getMetrics();
    const workload = Math.min(100, Math.round((this.activeJobsCount * 20) + (this.cpuUsage * 0.4)));
    
    let health: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
    if (this.status === 'OFFLINE' || this.status === 'ERROR') {
      health = 'UNHEALTHY';
    } else if (this.status === 'DEGRADED' || this.status === 'DRAINING' || workload > 85) {
      health = 'DEGRADED';
    }

    return {
      agentId: this.agentId,
      agentType: this.agentType,
      version: this.version,
      status: this.status,
      capabilities: this.getCapabilities(),
      assignedScope: this.assignedScope,
      region: this.region,
      edgeNodeId: this.edgeNodeId,
      workloadPercent: workload,
      priority: this.priority,
      lastHeartbeat: this.lastHeartbeat,
      health,
      metrics,
      isSimulated: this.isSimulated
    };
  }

  public async healthCheck(): Promise<'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'> {
    const now = Date.now();
    const lastHbTime = new Date(this.lastHeartbeat).getTime();
    const gapMs = now - lastHbTime;

    if (this.status === 'OFFLINE' || this.status === 'ERROR') {
      return 'UNHEALTHY';
    }
    // If no heartbeat for > 60 seconds, mark degraded/unhealthy
    if (gapMs > 60000) {
      this.status = 'DEGRADED';
      return 'DEGRADED';
    }
    return 'HEALTHY';
  }

  public abstract handleEvent(event: any): Promise<void>;
  public abstract assignJob(job: AIAgentJob): Promise<any>;

  public async handleCommand(command: string, params: any): Promise<any> {
    switch (command) {
      case 'HEARTBEAT':
        this.recordHeartbeat();
        return { status: 'OK', agentId: this.agentId };
      case 'SET_STATUS':
        if (params?.status) {
          this.status = params.status;
        }
        return { status: 'OK', currentStatus: this.status };
      case 'GET_METRICS':
        return this.getMetrics();
      default:
        return { status: 'UNKNOWN_COMMAND', command };
    }
  }
}
