/**
 * VisionWorkerPool: High-Performance Bounded YOLOv8 Worker Pool
 * Gujarat Police CCTV & AI Intelligence Platform (SCRB)
 *
 * Invariants:
 * 1. Centralized bounded priority scheduler across all available Sentinel cameras.
 * 2. Never creates uncontrolled per-camera loops or per-frame model instantiations.
 * 3. Enforces bounded queues: stale frames are dropped when queue is saturated, prioritizing newest frames.
 * 4. Reuses loaded ONNX Runtime session; zero memory leaks.
 * 5. Strict worker timeouts (5000ms) prevent stalls; non-blocking AI never halts CCTV video playback.
 */

import { EventEmitter } from 'node:events';
import { yoloVisionEngine } from './engines/YoloVisionEngine.js';
import { VisionObservation } from './VisionTypes.js';

export type JobPriority = 'CRITICAL' | 'INVESTIGATION_TARGET' | 'HSRP_CANDIDATE' | 'HIGH_ACTIVITY' | 'NORMAL';

const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  CRITICAL: 4,
  INVESTIGATION_TARGET: 3,
  HSRP_CANDIDATE: 2,
  HIGH_ACTIVITY: 1,
  NORMAL: 0
};

export interface VisionJob {
  jobId: string;
  cameraId: string;
  frameBuffer: Buffer;
  mimeType: string;
  sha256: string;
  timestamp: number;
  priority: JobPriority;
  enqueuedAt: number;
  resolve: (obs: VisionObservation) => void;
  reject: (err: any) => void;
}

export interface WorkerPoolMetrics {
  totalWorkers: number;
  activeWorkers: number;
  queueDepth: number;
  maxQueueDepthEncountered: number;
  maxQueueCapacity: number;
  processedJobs: number;
  droppedJobs: number;
  averageLatencyMs: number;
  maxLatencyMs: number;
  latestLatencyMs: number;
  device: 'CPU' | 'CUDA';
  model: string;
  runtime: string;
}

export class VisionWorkerPool extends EventEmitter {
  private static instance: VisionWorkerPool;

  private totalWorkers: number;
  private maxQueueCapacity: number;
  private activeWorkers = 0;
  private queue: VisionJob[] = [];
  private isShuttingDown = false;

  // Runtime telemetry
  private processedJobs = 0;
  private droppedJobs = 0;
  private maxQueueDepthEncountered = 0;
  private latencySamples: number[] = [];
  private maxLatencyMs = 0;
  private latestLatencyMs = 0;

  private constructor() {
    super();
    const envWorkers = process.env.VISION_WORKERS ? parseInt(process.env.VISION_WORKERS, 10) : 2;
    this.totalWorkers = Math.max(1, Math.min(8, isNaN(envWorkers) ? 2 : envWorkers));

    const envMaxQueue = process.env.VISION_MAX_QUEUE ? parseInt(process.env.VISION_MAX_QUEUE, 10) : 10;
    this.maxQueueCapacity = Math.max(3, Math.min(50, isNaN(envMaxQueue) ? 10 : envMaxQueue));

    console.info(`[VisionWorkerPool] Initialized with ${this.totalWorkers} workers, max queue depth: ${this.maxQueueCapacity}`);
  }

  public static getInstance(): VisionWorkerPool {
    if (!VisionWorkerPool.instance) {
      VisionWorkerPool.instance = new VisionWorkerPool();
    }
    return VisionWorkerPool.instance;
  }

  public getCapacity(): { workers: number; maxQueue: number } {
    return {
      workers: this.totalWorkers,
      maxQueue: this.maxQueueCapacity
    };
  }

  public setConfig(config: { workers?: number; maxQueue?: number }): void {
    if (config.workers && config.workers > 0) {
      this.totalWorkers = Math.max(1, Math.min(8, config.workers));
    }
    if (config.maxQueue && config.maxQueue > 0) {
      this.maxQueueCapacity = Math.max(3, Math.min(50, config.maxQueue));
    }
    this.processNextJobs();
  }

  /**
   * Enqueues a frame analysis job into the bounded priority queue.
   * If queue is full, drops the oldest/lowest priority stale frame.
   */
  public enqueue(
    cameraId: string,
    frameBuffer: Buffer,
    mimeType: string,
    sha256: string,
    priority: JobPriority = 'NORMAL',
    timestamp: number = Date.now()
  ): Promise<VisionObservation> {
    if (this.isShuttingDown) {
      return Promise.reject(new Error('VisionWorkerPool is shutting down'));
    }

    return new Promise<VisionObservation>((resolve, reject) => {
      const job: VisionJob = {
        jobId: `JOB-${cameraId}-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
        cameraId,
        frameBuffer,
        mimeType,
        sha256,
        timestamp,
        priority,
        enqueuedAt: Date.now(),
        resolve,
        reject
      };

      // Check if queue has reached maximum capacity: enforce stale frame dropping
      if (this.queue.length >= this.maxQueueCapacity) {
        // Find the lowest priority job with the oldest timestamp to drop
        let dropIndex = -1;
        let lowestWeight = Infinity;
        let oldestTime = Infinity;

        for (let i = 0; i < this.queue.length; i++) {
          const item = this.queue[i];
          const weight = PRIORITY_WEIGHTS[item.priority];
          if (weight < lowestWeight || (weight === lowestWeight && item.enqueuedAt < oldestTime)) {
            lowestWeight = weight;
            oldestTime = item.enqueuedAt;
            dropIndex = i;
          }
        }

        // If the new incoming job has lower priority than everything in the queue, drop new job
        if (dropIndex !== -1 && PRIORITY_WEIGHTS[job.priority] < lowestWeight) {
          this.droppedJobs++;
          reject(new Error(`Queue saturated (${this.maxQueueCapacity} jobs). Stale frame dropped for ${cameraId}`));
          return;
        }

        if (dropIndex !== -1) {
          const [dropped] = this.queue.splice(dropIndex, 1);
          this.droppedJobs++;
          dropped.reject(new Error(`Dropped stale frame for camera ${dropped.cameraId} to prioritize newer frame`));
        }
      }

      // Insert according to priority (highest weight first)
      const jobWeight = PRIORITY_WEIGHTS[job.priority];
      let insertIdx = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        if (jobWeight > PRIORITY_WEIGHTS[this.queue[i].priority]) {
          insertIdx = i;
          break;
        }
      }
      this.queue.splice(insertIdx, 0, job);

      if (this.queue.length > this.maxQueueDepthEncountered) {
        this.maxQueueDepthEncountered = this.queue.length;
      }

      this.processNextJobs();
    });
  }

  /**
   * Dispatches pending jobs to available workers up to concurrency limit.
   */
  private processNextJobs(): void {
    if (this.isShuttingDown) return;

    while (this.activeWorkers < this.totalWorkers && this.queue.length > 0) {
      const nextJob = this.queue.shift();
      if (!nextJob) break;

      this.activeWorkers++;
      this.executeJob(nextJob)
        .catch(() => {})
        .finally(() => {
          this.activeWorkers = Math.max(0, this.activeWorkers - 1);
          this.processNextJobs();
        });
    }
  }

  private async executeJob(job: VisionJob): Promise<void> {
    const jobStart = Date.now();
    const WORKER_TIMEOUT_MS = 5000;

    try {
      const timeoutPromise = new Promise<VisionObservation>((_, reject) => {
        setTimeout(() => reject(new Error(`Inference timed out after ${WORKER_TIMEOUT_MS}ms`)), WORKER_TIMEOUT_MS);
      });

      const inferencePromise = yoloVisionEngine.analyzeFrame({
        cameraId: job.cameraId,
        timestamp: job.timestamp,
        captureIso: new Date(job.timestamp).toISOString(),
        frameBuffer: job.frameBuffer,
        mimeType: job.mimeType,
        sha256: job.sha256
      });

      const observation = await Promise.race([inferencePromise, timeoutPromise]);
      const durationMs = Date.now() - jobStart;

      this.processedJobs++;
      this.latestLatencyMs = durationMs;
      if (durationMs > this.maxLatencyMs) {
        this.maxLatencyMs = durationMs;
      }
      this.latencySamples.push(durationMs);
      if (this.latencySamples.length > 50) this.latencySamples.shift();

      job.resolve(observation);
      this.emit('jobCompleted', { jobId: job.jobId, cameraId: job.cameraId, durationMs });
    } catch (err: any) {
      job.reject(err);
      this.emit('jobFailed', { jobId: job.jobId, cameraId: job.cameraId, error: err?.message || err });
    }
  }

  public getMetrics(): WorkerPoolMetrics {
    const avgLatency = this.latencySamples.length > 0
      ? Math.round(this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length)
      : (this.latestLatencyMs || 0);

    const engineStatus = yoloVisionEngine.getStatus();

    return {
      totalWorkers: this.totalWorkers,
      activeWorkers: this.activeWorkers,
      queueDepth: this.queue.length,
      maxQueueDepthEncountered: this.maxQueueDepthEncountered,
      maxQueueCapacity: this.maxQueueCapacity,
      processedJobs: this.processedJobs,
      droppedJobs: this.droppedJobs,
      averageLatencyMs: avgLatency,
      maxLatencyMs: this.maxLatencyMs,
      latestLatencyMs: this.latestLatencyMs,
      device: engineStatus.device,
      model: 'YOLOv8n',
      runtime: 'ONNX Runtime'
    };
  }

  public shutdown(): void {
    this.isShuttingDown = true;
    for (const pending of this.queue) {
      pending.reject(new Error('VisionWorkerPool shutting down'));
    }
    this.queue = [];
  }
}

export const visionWorkerPool = VisionWorkerPool.getInstance();
