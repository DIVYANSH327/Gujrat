/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AgentSupervisorService: Distributed Agent Mesh Supervisor, Failover Controller,
 * Graceful Drain Manager, Workload Reassignment, and Event Replay Coordinator.
 */

import { 
  IAIAgent, 
  IAIAgentSupervisor, 
  AgentStatus, 
  AIAgentJob, 
  AgentCapability 
} from '../ai-agents/types';
import { AIAgentRegistry } from '../ai-agents/registry/AIAgentRegistry';
import { AIJobQueue } from '../ai-agents/jobs/AIJobQueue';
import { centralEventBus } from './CentralEventBus';
import { sysEvents } from './Architecture';

export interface AgentFailureRecord {
  agentId: string;
  failedAt: string;
  reason: string;
  reassignedJobsCount: number;
  recoveredAt?: string;
  status: 'ACTIVE_FAILURE' | 'RECOVERED';
}

export class AgentSupervisorService implements IAIAgentSupervisor {
  private static instance: AgentSupervisorService | null = null;
  private registry: AIAgentRegistry;
  private queue: AIJobQueue;
  private pendingReplayEvents: Map<string, any[]> = new Map(); // agentId -> pendingEvents[]
  private failureLog: AgentFailureRecord[] = [];
  private heartbeatTimers: Map<string, number> = new Map(); // agentId -> lastTimestamp

  private constructor() {
    this.registry = AIAgentRegistry.getInstance();
    this.queue = AIJobQueue.getInstance();
    this.initHeartbeatWatcher();
  }

  public static getInstance(): AgentSupervisorService {
    if (!AgentSupervisorService.instance) {
      AgentSupervisorService.instance = new AgentSupervisorService();
    }
    return AgentSupervisorService.instance;
  }

  private initHeartbeatWatcher(): void {
    const hbTimer = setInterval(() => {
      const now = Date.now();
      for (const [agentId, lastHb] of this.heartbeatTimers.entries()) {
        const agent = this.registry.getAgent(agentId);
        if (agent && agent.getStatus() !== 'OFFLINE' && agent.getStatus() !== 'STOPPED') {
          // If no heartbeat in 45 seconds, trigger failure detection
          if (now - lastHb > 45000) {
            this.handleAgentFailure(agentId, 'HEARTBEAT_TIMEOUT_SUPERVISOR');
          }
        }
      }
    }, 10000);
    if (hbTimer && typeof hbTimer.unref === 'function') {
      hbTimer.unref();
    }
  }

  public registerAgent(agent: IAIAgent): void {
    this.registry.register(agent);
    this.heartbeatTimers.set(agent.agentId, Date.now());
  }

  public unregisterAgent(agentId: string): boolean {
    this.heartbeatTimers.delete(agentId);
    return this.registry.unregister(agentId);
  }

  public processHeartbeat(agentId: string): boolean {
    const success = this.registry.recordHeartbeat(agentId);
    if (success) {
      this.heartbeatTimers.set(agentId, Date.now());
      // Check if recovering from failure
      const activeFail = this.failureLog.find(f => f.agentId === agentId && f.status === 'ACTIVE_FAILURE');
      if (activeFail) {
        this.recoverAgent(agentId);
      }
    }
    return success;
  }

  public evaluateAgentHealth(agentId: string): 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return 'UNHEALTHY';
    const status = agent.getStatus();
    if (status === 'OFFLINE' || status === 'ERROR') return 'UNHEALTHY';
    if (status === 'DEGRADED' || status === 'DRAINING') return 'DEGRADED';
    return 'HEALTHY';
  }

  public async drainAgent(agentId: string): Promise<boolean> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return false;
    await agent.pause();
    sysEvents.emit('ai_agent_draining', { agentId });
    // Reassign queued/running jobs to other available agents with matching capabilities
    await this.reassignJobs(agentId);
    return true;
  }

  public async handleAgentFailure(agentId: string, reason: string = 'COMMUNICATION_LOST'): Promise<void> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return;

    // 1. Mark edge/agent OFFLINE
    await agent.stop();

    // 2. Stop assignment of new jobs to this agent
    // 3. Reassign eligible jobs to another edge/regional agent
    const reassignedCount = await this.reassignJobs(agentId);

    // 4. Log failure
    const record: AgentFailureRecord = {
      agentId,
      failedAt: new Date().toISOString(),
      reason,
      reassignedJobsCount: reassignedCount,
      status: 'ACTIVE_FAILURE'
    };
    this.failureLog.unshift(record);

    // 5. Raise system event with preserved correlation ID
    sysEvents.emit('agent_failure_detected', {
      agentId,
      region: agent.getInfo().region,
      edgeNodeId: agent.getInfo().edgeNodeId,
      reassignedCount,
      reason
    });

    centralEventBus.publish({
      eventType: 'AGENT_OFFLINE',
      sourceId: agentId,
      correlationId: `FAIL-${agentId}-${Date.now()}`,
      idempotencyKey: `FAIL-${agentId}-${Date.now()}`,
      priority: 'P1',
      payload: { agentId, reason, reassignedCount }
    });
  }

  public async recoverAgent(agentId: string): Promise<void> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return;

    await agent.resume();
    this.heartbeatTimers.set(agentId, Date.now());

    // Update failure record
    const record = this.failureLog.find(f => f.agentId === agentId && f.status === 'ACTIVE_FAILURE');
    if (record) {
      record.status = 'RECOVERED';
      record.recoveredAt = new Date().toISOString();
    }

    // Replay any pending events that were buffered during disconnection
    const pending = this.pendingReplayEvents.get(agentId) || [];
    if (pending.length > 0) {
      for (const evt of pending) {
        try {
          await agent.handleEvent(evt);
        } catch (e) {
          console.warn(`[Supervisor] Error replaying event to recovered agent ${agentId}`, e);
        }
      }
      this.pendingReplayEvents.delete(agentId);
    }

    sysEvents.emit('agent_recovered', { agentId });
    centralEventBus.publish({
      eventType: 'JOB_REASSIGNED',
      sourceId: agentId,
      correlationId: `RECOV-${agentId}-${Date.now()}`,
      idempotencyKey: `RECOV-${agentId}-${Date.now()}`,
      priority: 'P2',
      payload: { agentId, status: 'RESTORED' }
    });
  }

  public async reassignJobs(failedAgentId: string): Promise<number> {
    const failedAgent = this.registry.getAgent(failedAgentId);
    if (!failedAgent) return 0;

    const capabilities = failedAgent.getCapabilities();
    const allJobs = this.queue.getAllJobs();
    
    // Find active jobs assigned to the failed agent
    const orphanedJobs = allJobs.filter(
      j => j.assignedAgentId === failedAgentId && (j.status === 'RUNNING' || j.status === 'ASSIGNED')
    );

    let reassignedCount = 0;
    for (const job of orphanedJobs) {
      // Find eligible candidate agents matching job requirements
      const eligibleAgents = this.registry.getAllAgents().filter(a =>
        a.agentId !== failedAgentId &&
        a.getStatus() === 'IDLE' &&
        job.requiredCapabilities.every(c => a.getCapabilities().includes(c))
      );

      if (eligibleAgents.length > 0) {
        // Assign to least loaded candidate
        eligibleAgents.sort((a, b) => a.getInfo().workloadPercent - b.getInfo().workloadPercent);
        const targetAgent = eligibleAgents[0];
        
        job.assignedAgentId = targetAgent.agentId;
        job.status = 'ASSIGNED';
        job.attempt = (job.attempt || 1) + 1;
        
        targetAgent.assignJob(job);
        reassignedCount++;

        sysEvents.emit('ai_job_reassigned', {
          jobId: job.jobId,
          fromAgentId: failedAgentId,
          toAgentId: targetAgent.agentId,
          correlationId: job.correlationId
        });
      } else {
        // Re-queue for scheduler pickup
        job.status = 'QUEUED';
        job.assignedAgentId = undefined;
      }
    }

    return reassignedCount;
  }

  public bufferEventForReplay(agentId: string, event: any): void {
    const list = this.pendingReplayEvents.get(agentId) || [];
    list.push(event);
    this.pendingReplayEvents.set(agentId, list);
  }

  public getFailureLog(): AgentFailureRecord[] {
    return [...this.failureLog];
  }
}

export const agentSupervisor = AgentSupervisorService.getInstance();
