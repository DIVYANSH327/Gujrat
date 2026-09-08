/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIJobSchedulerService: Edge-First, Multi-Factor Priority Job Scheduler
 * Enforces P0 (Watchlist / Threat) to P5 (Background Indexing) prioritization.
 */

import { 
  IAIJobScheduler, 
  AIAgentJob, 
  IAIAgent, 
  PriorityLevel, 
  AgentPriority 
} from '../ai-agents/types';
import { AIAgentRegistry } from '../ai-agents/registry/AIAgentRegistry';
import { AIJobQueue } from '../ai-agents/jobs/AIJobQueue';
import { sysEvents } from './Architecture';

export class AIJobSchedulerService implements IAIJobScheduler {
  private static instance: AIJobSchedulerService | null = null;
  private registry: AIAgentRegistry;
  private queue: AIJobQueue;

  private constructor() {
    this.registry = AIAgentRegistry.getInstance();
    this.queue = AIJobQueue.getInstance();
  }

  public static getInstance(): AIJobSchedulerService {
    if (!AIJobSchedulerService.instance) {
      AIJobSchedulerService.instance = new AIJobSchedulerService();
    }
    return AIJobSchedulerService.instance;
  }

  /**
   * Submit a new AI job with explicit P0-P5 priority mapping
   */
  public submitJob(job: AIAgentJob): AIAgentJob | null {
    return this.queue.enqueue(job);
  }

  /**
   * Multi-factor scoring algorithm:
   * Edge Proximity (30%) + Agent Health (25%) + Available Capacity (20%) + Priority Urgency (15%) + Latency Track Record (10%)
   */
  public calculatePriorityScore(job: AIAgentJob, candidateAgent: IAIAgent): number {
    const info = candidateAgent.getInfo();
    const metrics = candidateAgent.getMetrics();

    // 1. Capability match is prerequisite
    const hasCapabilities = job.requiredCapabilities.every(c => info.capabilities.includes(c));
    if (!hasCapabilities) return -1;

    // 2. Health factor (0 to 25)
    let healthScore = 25;
    if (info.health === 'DEGRADED') healthScore = 12;
    if (info.health === 'UNHEALTHY' || info.status === 'OFFLINE') return -1;

    // 3. Edge Proximity / Camera Locality (0 to 30)
    // Edge-first principle: if agent is at same edge node as camera, give maximum bonus!
    let localityScore = 10;
    if (job.edgeNodeId && info.edgeNodeId && job.edgeNodeId === info.edgeNodeId) {
      localityScore = 30; // Max score for local edge inference (Zero WAN bandwidth)
    } else if (job.cameraId && info.assignedScope.includes('EDGE')) {
      localityScore = 20;
    } else if (info.region === 'CENTRAL') {
      localityScore = 5; // Central penalty: only use central if edge unavailable
    }

    // 4. Capacity & Utilization Score (0 to 20)
    const cpuAvail = Math.max(0, 100 - metrics.cpuUsagePercent);
    const capacityScore = (cpuAvail / 100) * 20;

    // 5. Priority Weight (0 to 15)
    const priorityMultipliers: Record<string, number> = {
      P0: 15,
      CRITICAL: 15,
      P1: 12,
      HIGH: 12,
      P2: 9,
      NORMAL: 6,
      P3: 6,
      P4: 3,
      LOW: 3,
      P5: 1
    };
    const priorityScore = priorityMultipliers[job.priority] || 6;

    // 6. Latency track record (0 to 10)
    const latencyScore = Math.max(0, 10 - (metrics.averageLatencyMs / 50));

    return healthScore + localityScore + capacityScore + priorityScore + latencyScore;
  }

  /**
   * Dispatch the highest priority queued job to the optimal candidate agent
   */
  public async dispatchNextJob(): Promise<AIAgentJob | null> {
    const job = this.queue.dequeue();
    if (!job) return null;

    const agents = this.registry.getAllAgents().filter(
      a => a.getStatus() === 'IDLE' || a.getStatus() === 'BUSY'
    );

    let bestAgent: IAIAgent | null = null;
    let highestScore = -1;

    for (const agent of agents) {
      const score = this.calculatePriorityScore(job, agent);
      if (score > highestScore) {
        highestScore = score;
        bestAgent = agent;
      }
    }

    if (bestAgent) {
      this.queue.assign(job.jobId, bestAgent.agentId);
      await bestAgent.assignJob(job);
      return job;
    } else {
      // Re-queue with incremented wait
      job.status = 'QUEUED';
      return null;
    }
  }

  /**
   * Rebalance workload across available agents
   */
  public async rebalanceWorkload(): Promise<number> {
    let rebalanced = 0;
    const allAgents = this.registry.getAllAgents();
    const busyAgents = allAgents.filter(a => a.getInfo().workloadPercent > 80);
    const idleAgents = allAgents.filter(a => a.getInfo().workloadPercent < 30 && a.getStatus() === 'IDLE');

    for (const busy of busyAgents) {
      const busyJobs = this.queue.getAllJobs().filter(
        j => j.assignedAgentId === busy.agentId && j.status === 'QUEUED'
      );

      for (const job of busyJobs) {
        const matchingIdle = idleAgents.find(idle => 
          job.requiredCapabilities.every(c => idle.getCapabilities().includes(c))
        );
        if (matchingIdle) {
          job.assignedAgentId = matchingIdle.agentId;
          matchingIdle.assignJob(job);
          rebalanced++;
          sysEvents.emit('ai_job_rebalanced', {
            jobId: job.jobId,
            from: busy.agentId,
            to: matchingIdle.agentId
          });
        }
      }
    }

    return rebalanced;
  }
}

export const aiJobScheduler = AIJobSchedulerService.getInstance();
