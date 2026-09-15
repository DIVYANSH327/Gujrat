/**
 * Task Orchestration Agent
 * Gujarat Police CCTV & AI Intelligence Platform (SENTINEL GRID)
 *
 * Implements ethical, explainable Human-in-the-Loop decision gates:
 * - NO autonomous punitive/enforcement actions performed solely by AI
 * - Tasks generated for officer review:
 *   - REVIEW_EVIDENCE
 *   - START_TRACKING
 *   - INVESTIGATE_VEHICLE
 *   - WATCHLIST_REVIEW
 *   - REQUEST_ADDITIONAL_FRAMES
 *   - ESCALATE_ALERT
 *   - MARK_UNCERTAIN
 * - Every task references source event, camera, timestamp, evidence, reason, confidence.
 */

import { OfficerTaskType, SentinelOfficerTask } from './MeshTypes.js';

export class TaskOrchestrationAgent {
  private static instance: TaskOrchestrationAgent;
  private tasks: Map<string, SentinelOfficerTask> = new Map();
  private readonly maxTasks = 200;

  public static getInstance(): TaskOrchestrationAgent {
    if (!TaskOrchestrationAgent.instance) {
      TaskOrchestrationAgent.instance = new TaskOrchestrationAgent();
    }
    return TaskOrchestrationAgent.instance;
  }

  public createTask(params: {
    taskType: OfficerTaskType;
    priority: SentinelOfficerTask['priority'];
    cameraId: string;
    trackId: string;
    plateText: string | null;
    reason: string;
    sourceEventId: string;
    evidenceId?: string;
    confidence: number;
  }): SentinelOfficerTask {
    const taskId = `TSK-${params.cameraId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const task: SentinelOfficerTask = {
      taskId,
      taskType: params.taskType,
      priority: params.priority,
      status: 'PENDING_OFFICER_REVIEW',
      cameraId: params.cameraId,
      trackId: params.trackId,
      plateText: params.plateText,
      reason: params.reason,
      sourceEventId: params.sourceEventId,
      evidenceId: params.evidenceId,
      confidence: params.confidence,
      createdAt: new Date().toISOString(),
      truthState: 'OBSERVED'
    };

    this.tasks.set(taskId, task);

    // Limit memory
    if (this.tasks.size > this.maxTasks) {
      const oldestKey = this.tasks.keys().next().value;
      if (oldestKey) this.tasks.delete(oldestKey);
    }

    return task;
  }

  public reviewTask(taskId: string, officerName: string, approved: boolean): SentinelOfficerTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = approved ? 'APPROVED' : 'DISMISSED';
    task.reviewedBy = officerName;
    task.reviewedAt = new Date().toISOString();
    return task;
  }

  public getPendingTasks(): SentinelOfficerTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'PENDING_OFFICER_REVIEW')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllTasks(): SentinelOfficerTask[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTask(taskId: string): SentinelOfficerTask | undefined {
    return this.tasks.get(taskId);
  }
}

export const taskOrchestrationAgent = TaskOrchestrationAgent.getInstance();
