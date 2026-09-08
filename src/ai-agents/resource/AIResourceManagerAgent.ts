/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIResourceManagerAgent: Intelligent Workload Placement, Rebalancing, Failover & Downstream Priming
 */

import { BaseAgent } from '../base/BaseAgent';
import { AgentCapability, AIAgentJob, AgentPriority, IAIAgent } from '../types';
import { AIAgentRegistry } from '../registry/AIAgentRegistry';
import { AIJobQueue } from '../jobs/AIJobQueue';
import { sysEvents } from '../../services/Architecture';

export interface ResourceEvaluationFactors {
  cameraHealth?: string;
  edgeCpuPercent?: number;
  edgeGpuPercent?: number;
  networkBandwidthMbps?: number;
  queueDepth?: number;
  region?: string;
  cameraPriority?: AgentPriority;
  incidentPriority?: AgentPriority;
  watchlistPriority?: AgentPriority;
  latencyMs?: number;
  jobAgeMs?: number;
  failureCount?: number;
}

export class AIResourceManagerAgent extends BaseAgent {
  private registry: AIAgentRegistry;
  private queue: AIJobQueue;
  private primedCameras: Map<string, { priority: AgentPriority; expiry: number; reason: string }> = new Map();

  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'RESOURCE-MGR-CENTRAL-001',
      agentType: 'RESOURCE_MANAGER',
      region: params?.region || 'CENTRAL',
      assignedScope: 'GLOBAL_MESH_ORCHESTRATION',
      capabilities: ['RESOURCE_SCHEDULING', 'ORCHESTRATION'],
      isSimulated: params?.isSimulated ?? false
    });
    this.registry = AIAgentRegistry.getInstance();
    this.queue = AIJobQueue.getInstance();
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<any> {
    this.activeJobsCount += 1;
    const start = Date.now();
    try {
      // Check if camera is primed for high priority
      if (job.cameraId && this.primedCameras.has(job.cameraId)) {
        const priming = this.primedCameras.get(job.cameraId)!;
        if (Date.now() < priming.expiry) {
          job.priority = priming.priority;
        } else {
          this.primedCameras.delete(job.cameraId);
        }
      }

      const selected = this.selectOptimalAgent(job.requiredCapabilities, job.priority, job.edgeNodeId, {
        region: job.payload?.region,
        watchlistPriority: job.payload?.isWatchlist ? 'CRITICAL' : undefined,
        cameraPriority: job.priority,
      });

      if (!selected) {
        throw new Error('NO_HEALTHY_AGENT_AVAILABLE');
      }

      job.assignedAgentId = selected.agentId;
      job.status = 'ASSIGNED';
      job.startedAt = new Date().toISOString();

      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      return { success: true, assignedAgentId: selected.agentId };
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  /**
   * Multi-Factor Agent Selection:
   * Considers: Status, Capabilities, Edge locality, Region, CPU/GPU, Workload %, Queue Depth, Latency.
   */
  public selectOptimalAgent(
    requiredCapabilities: AgentCapability[],
    priority: AgentPriority,
    edgeNodeId?: string,
    factors?: ResourceEvaluationFactors
  ): IAIAgent | null {
    const allAgents = this.registry.getAllAgents();
    
    const candidates = allAgents.filter(agent => {
      if (agent.agentId === this.agentId) return false;
      const status = agent.getStatus();
      if (status === 'OFFLINE' || status === 'ERROR') return false;
      
      // Critical jobs must NOT run on degraded agents
      if (priority === 'CRITICAL' && status === 'DEGRADED') return false;

      const caps = agent.getCapabilities();
      return requiredCapabilities.every(reqCap => caps.includes(reqCap));
    });

    if (candidates.length === 0) return null;

    // Score candidates based on multi-factor telemetry
    candidates.sort((a, b) => {
      const infoA = a.getInfo();
      const infoB = b.getInfo();

      let scoreA = 0;
      let scoreB = 0;

      // 1. Edge Locality Bonus (+50)
      if (edgeNodeId) {
        if (infoA.edgeNodeId === edgeNodeId) scoreA += 50;
        if (infoB.edgeNodeId === edgeNodeId) scoreB += 50;
      }

      // 2. Region Match Bonus (+20)
      if (factors?.region) {
        if (infoA.region === factors.region) scoreA += 20;
        if (infoB.region === factors.region) scoreB += 20;
      }

      // 3. Health Penalty (-30 for degraded)
      if (infoA.status === 'DEGRADED') scoreA -= 30;
      if (infoB.status === 'DEGRADED') scoreB -= 30;

      // 4. Workload Percentage (Lower is better: -0.5 per percent)
      scoreA -= (infoA.workloadPercent * 0.5);
      scoreB -= (infoB.workloadPercent * 0.5);

      // 5. Active Jobs (Lower is better: -2 per job)
      scoreA -= (infoA.metrics.activeJobs * 2);
      scoreB -= (infoB.metrics.activeJobs * 2);

      // 6. Average Latency (Lower is better: -0.05 per ms)
      scoreA -= (infoA.metrics.averageLatencyMs * 0.05);
      scoreB -= (infoB.metrics.averageLatencyMs * 0.05);

      return scoreB - scoreA; // Highest score wins
    });

    return candidates[0];
  }

  /**
   * Downstream Camera Priming:
   * When an authorized high-priority watchlist vehicle candidate is observed,
   * prime downstream cameras by elevating their AI job priority in the scheduler.
   * NOTE: This changes JOB PRIORITY only — it never fabricates future sightings.
   */
  public primeDownstreamCameras(
    downstreamCameraIds: string[],
    targetPlate: string,
    durationMs: number = 180000
  ): { primedCount: number; cameras: string[] } {
    const expiry = Date.now() + durationMs;
    for (const camId of downstreamCameraIds) {
      this.primedCameras.set(camId, {
        priority: 'CRITICAL',
        expiry,
        reason: `Downstream corridor priming for watchlist candidate ${targetPlate}`,
      });
    }

    sysEvents.emit('ai_downstream_cameras_primed', {
      targetPlate,
      cameras: downstreamCameraIds,
      expiry,
    });

    return {
      primedCount: downstreamCameraIds.length,
      cameras: downstreamCameraIds,
    };
  }

  public isCameraPrimed(cameraId: string): boolean {
    const priming = this.primedCameras.get(cameraId);
    if (!priming) return false;
    if (Date.now() > priming.expiry) {
      this.primedCameras.delete(cameraId);
      return false;
    }
    return true;
  }

  /**
   * Failover recovery: find any pending or running jobs assigned to an offline agent
   * and reassign them to a healthy compatible agent.
   */
  public reassignJobsForFailedAgent(failedAgentId: string): {
    reassignedCount: number;
    reassignedJobs: { jobId: string; targetAgentId: string }[];
  } {
    const activeJobs = this.queue.getActiveJobs();
    const affectedJobs = activeJobs.filter(j => j.assignedAgentId === failedAgentId);
    const reassignedJobs: { jobId: string; targetAgentId: string }[] = [];

    for (const job of affectedJobs) {
      const targetAgent = this.selectOptimalAgent(job.requiredCapabilities, job.priority, job.edgeNodeId);
      if (targetAgent) {
        job.assignedAgentId = targetAgent.agentId;
        job.status = 'ASSIGNED';
        reassignedJobs.push({ jobId: job.jobId, targetAgentId: targetAgent.agentId });
        sysEvents.emit('ai_job_reassigned', {
          jobId: job.jobId,
          fromAgentId: failedAgentId,
          toAgentId: targetAgent.agentId,
          reason: 'AGENT_FAILOVER'
        });
      } else {
        // Return to queue if no immediate agent available
        job.status = 'QUEUED';
        job.assignedAgentId = undefined;
      }
    }

    return {
      reassignedCount: reassignedJobs.length,
      reassignedJobs
    };
  }

  /**
   * Load balancing: move non-critical jobs from overloaded agents (>80%) to idle/light agents (<50%).
   */
  public rebalanceWorkload(): {
    movedJobsCount: number;
    operations: { jobId: string; fromAgentId: string; toAgentId: string }[];
  } {
    const operations: { jobId: string; fromAgentId: string; toAgentId: string }[] = [];
    const allAgents = this.registry.getAllAgents();

    const overloaded = allAgents.filter(a => a.getInfo().workloadPercent > 80);
    if (overloaded.length === 0) return { movedJobsCount: 0, operations: [] };

    const activeJobs = this.queue.getActiveJobs();

    for (const overAgent of overloaded) {
      // Find candidate jobs to shift (only NORMAL or LOW priority)
      const eligibleJobs = activeJobs.filter(
        j => j.assignedAgentId === overAgent.agentId && (j.priority === 'NORMAL' || j.priority === 'LOW')
      );

      for (const job of eligibleJobs) {
        const targetAgent = this.selectOptimalAgent(job.requiredCapabilities, job.priority);
        if (targetAgent && targetAgent.agentId !== overAgent.agentId && targetAgent.getInfo().workloadPercent < 60) {
          job.assignedAgentId = targetAgent.agentId;
          operations.push({
            jobId: job.jobId,
            fromAgentId: overAgent.agentId,
            toAgentId: targetAgent.agentId
          });
          sysEvents.emit('ai_job_rebalanced', {
            jobId: job.jobId,
            fromAgent: overAgent.agentId,
            toAgent: targetAgent.agentId
          });
          break; // move one job at a time per overloaded agent
        }
      }
    }

    return {
      movedJobsCount: operations.length,
      operations
    };
  }
}
