/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIJobQueue: Priority-Driven, Deduplicated Job Execution Engine
 */

import { AIAgentJob, AgentPriority, JobStatus } from '../types';
import { sysEvents } from '../../services/Architecture';

export class AIJobQueue {
  private static instance: AIJobQueue | null = null;
  private jobs: Map<string, AIAgentJob> = new Map();
  private deduplicationIndex: Map<string, number> = new Map(); // key -> timestamp
  private maxRetries: number = 3;
  private defaultTimeoutMs: number = 30000;

  private constructor() {}

  public static getInstance(): AIJobQueue {
    if (!AIJobQueue.instance) {
      AIJobQueue.instance = new AIJobQueue();
    }
    return AIJobQueue.instance;
  }

  /**
   * Enqueue a new job with priority ordering and deduplication.
   */
  public enqueue(jobData: Omit<AIAgentJob, 'status' | 'attempt' | 'createdAt'>): AIAgentJob | null {
    // Deduplication check: key = `${sourceId}:${jobType}:${correlationId}`
    const dedupKey = `${jobData.sourceId}:${jobData.jobType}:${jobData.correlationId}`;
    const now = Date.now();
    const lastSeen = this.deduplicationIndex.get(dedupKey);

    // 5-second deduplication window
    if (lastSeen && (now - lastSeen) < 5000) {
      return null;
    }
    this.deduplicationIndex.set(dedupKey, now);

    const job: AIAgentJob = {
      ...jobData,
      status: 'QUEUED',
      attempt: 1,
      maxAttempts: jobData.maxAttempts || this.maxRetries,
      createdAt: new Date().toISOString(),
      deadline: new Date(now + this.defaultTimeoutMs).toISOString()
    };

    this.jobs.set(job.jobId, job);
    sysEvents.emit('ai_job_enqueued', job);
    return job;
  }

  /**
   * Dequeue highest priority pending job.
   * Priority: CRITICAL (4) > HIGH (3) > NORMAL (2) > LOW (1)
   */
  public dequeue(): AIAgentJob | null {
    const priorityWeight: Record<AgentPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1
    };

    const queuedJobs = Array.from(this.jobs.values()).filter(j => j.status === 'QUEUED');
    if (queuedJobs.length === 0) return null;

    queuedJobs.sort((a, b) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return queuedJobs[0];
  }

  public assign(jobId: string, agentId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || (job.status !== 'QUEUED' && job.status !== 'RETRYING')) return false;

    job.status = 'ASSIGNED';
    job.assignedAgentId = agentId;
    job.startedAt = new Date().toISOString();
    sysEvents.emit('ai_job_assigned', { jobId, agentId });
    return true;
  }

  public markRunning(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    job.status = 'RUNNING';
    return true;
  }

  public complete(jobId: string, result?: any): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    const completedAt = new Date().toISOString();
    job.status = 'COMPLETED';
    job.result = result;
    job.completedAt = completedAt;
    if (job.startedAt) {
      job.latencyMs = new Date(completedAt).getTime() - new Date(job.startedAt).getTime();
    }

    sysEvents.emit('ai_job_completed', { jobId, result });
    return true;
  }

  public fail(jobId: string, error: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.error = error;
    if (job.attempt < job.maxAttempts) {
      job.attempt += 1;
      job.status = 'RETRYING';
      sysEvents.emit('ai_job_retrying', { jobId, attempt: job.attempt, error });
    } else {
      job.status = 'FAILED';
      sysEvents.emit('ai_job_failed', { jobId, error });
    }
    return true;
  }

  public retry(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    job.status = 'QUEUED';
    job.attempt += 1;
    job.startedAt = undefined;
    job.completedAt = undefined;
    job.error = undefined;
    return true;
  }

  public cancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'COMPLETED') return false;

    job.status = 'CANCELLED';
    sysEvents.emit('ai_job_cancelled', { jobId });
    return true;
  }

  public getJob(jobId: string): AIAgentJob | undefined {
    return this.jobs.get(jobId);
  }

  public getAllJobs(): AIAgentJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getPendingJobs(): AIAgentJob[] {
    return Array.from(this.jobs.values()).filter(j => j.status === 'QUEUED');
  }

  public getActiveJobs(): AIAgentJob[] {
    return Array.from(this.jobs.values()).filter(
      j => j.status === 'ASSIGNED' || j.status === 'RUNNING' || j.status === 'RETRYING'
    );
  }

  public getCompletedJobs(): AIAgentJob[] {
    return Array.from(this.jobs.values()).filter(j => j.status === 'COMPLETED');
  }

  public getMetrics(): {
    total: number;
    queued: number;
    active: number;
    completed: number;
    failed: number;
    averageLatencyMs: number;
  } {
    const all = Array.from(this.jobs.values());
    const completed = all.filter(j => j.status === 'COMPLETED');
    const totalLatency = completed.reduce((acc, j) => acc + (j.latencyMs || 0), 0);
    const avgLatency = completed.length > 0 ? Math.round(totalLatency / completed.length) : 0;

    return {
      total: all.length,
      queued: all.filter(j => j.status === 'QUEUED').length,
      active: all.filter(j => j.status === 'ASSIGNED' || j.status === 'RUNNING').length,
      completed: completed.length,
      failed: all.filter(j => j.status === 'FAILED').length,
      averageLatencyMs: avgLatency
    };
  }

  public clear(): void {
    this.jobs.clear();
    this.deduplicationIndex.clear();
  }
}

export const jobQueue = AIJobQueue.getInstance();
