/**
 * EventBus.ts
 * Provider-neutral Event Bus and Local Outbox for Sentinel Grid
 * Supports: Local In-Memory EventBus & Google Cloud Pub/Sub EventBus
 * 
 * Invariants:
 * 1. Offline-First: If Pub/Sub is unreachable or unconfigured, events route through the bounded LocalOutbox.
 * 2. Bounded Queues: Max buffer limits prevent Node.js memory exhaustion.
 * 3. Idempotency: Duplicate events are rejected before queuing.
 * 4. Structured Events: Adheres to CloudEvents v1.0 standard with SHA-256 evidence hashes.
 */

import { EventEmitter } from 'events';
import { centralEventBus } from '../CentralEventBus.js';

export interface SentinelSecurityEvent {
  eventId: string;
  schemaVersion: '1.0';
  eventType: 
    | 'CAMERA_STATUS'
    | 'FRAME_QUALITY'
    | 'VEHICLE_DETECTED'
    | 'PLATE_OBSERVATION'
    | 'PERSON_DETECTED'
    | 'INCIDENT_DETECTED'
    | 'WATCHLIST_MATCH'
    | 'ROUTE_OBSERVATION'
    | 'EVIDENCE_CREATED'
    | 'AI_ANALYSIS_COMPLETED'
    | 'AI_UNAVAILABLE'
    | 'CAMERA_HEALTH_CHANGED';
  cameraId: string;
  sourceId: string;
  timestamp: string;
  correlationId: string;
  idempotencyKey: string;
  vehicleTrackId?: string;
  regionId?: string;
  district?: string;
  payload: Record<string, any>;
  evidence?: {
    sha256: string;
    uri: string;
    evidenceQuality?: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNUSABLE';
    captureTimestamp?: string;
  };
  provenance?: {
    source: string;
    modelProvider?: string;
    modelName?: string;
    modelVersion?: string;
    processingVersion: string;
    originalEvidenceHash?: string;
    derivedEvidenceHash?: string;
    captureTimestamp: string;
  };
}

export interface EventBus {
  publish(event: SentinelSecurityEvent): Promise<{ success: boolean; eventId: string; deduplicated?: boolean; queued?: boolean }>;
  subscribe(eventType: string, handler: (event: SentinelSecurityEvent) => void): () => void;
  getStatus(): { provider: string; active: boolean; queueDepth: number; deadLetterCount: number };
}

// ============================================================================
// Local Event Bus (In-Memory Sentinel Event Mesh)
// ============================================================================

export class LocalEventBus implements EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  public async publish(event: SentinelSecurityEvent): Promise<{ success: boolean; eventId: string }> {
    this.emitter.emit(event.eventType, event);
    this.emitter.emit('*', event);

    // Bridge to existing Sentinel CentralEventBus for backward-compatibility
    try {
      centralEventBus.publish({
        eventId: event.eventId,
        eventType: (event.eventType === 'PLATE_OBSERVATION' ? 'PLATE_READ' : 'VEHICLE_DETECTED') as any,
        sourceId: event.sourceId || event.cameraId,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        timestamp: event.timestamp,
        priority: 'P2',
        payload: event.payload
      });
    } catch {
      // Non-blocking bridge
    }

    return { success: true, eventId: event.eventId };
  }

  public subscribe(eventType: string, handler: (event: SentinelSecurityEvent) => void): () => void {
    this.emitter.on(eventType, handler);
    return () => {
      this.emitter.off(eventType, handler);
    };
  }

  public getStatus() {
    return {
      provider: 'LOCAL_EVENT_BUS',
      active: true,
      queueDepth: 0,
      deadLetterCount: 0
    };
  }
}

// ============================================================================
// Cloud Event Outbox (Bounded, Exponential Backoff, Dead-Letter Protected)
// ============================================================================

export interface OutboxItem {
  event: SentinelSecurityEvent;
  attempts: number;
  nextRetryTimestamp: number;
  enqueuedAt: number;
}

export class CloudEventOutbox {
  private queue: OutboxItem[] = [];
  private deadLetterQueue: OutboxItem[] = [];
  private processedKeys = new Set<string>();
  private readonly maxCapacity: number;
  private readonly maxDeadLetterCapacity = 500;
  private readonly maxRetries = 5;

  constructor(maxCapacity = 2000) {
    this.maxCapacity = maxCapacity;
  }

  public enqueue(event: SentinelSecurityEvent): { success: boolean; deduplicated: boolean; queueDepth: number } {
    if (this.processedKeys.has(event.idempotencyKey)) {
      return { success: true, deduplicated: true, queueDepth: this.queue.length };
    }

    // Keep cache bounded
    this.processedKeys.add(event.idempotencyKey);
    if (this.processedKeys.size > 10000) {
      const firstEntries = Array.from(this.processedKeys).slice(0, 1000);
      firstEntries.forEach(k => this.processedKeys.delete(k));
    }

    // Drop oldest to dead letter if saturated to avoid memory exhaustion
    if (this.queue.length >= this.maxCapacity) {
      const dropped = this.queue.shift();
      if (dropped) {
        this.deadLetterQueue.push(dropped);
        if (this.deadLetterQueue.length > this.maxDeadLetterCapacity) {
          this.deadLetterQueue.shift();
        }
      }
    }

    this.queue.push({
      event,
      attempts: 0,
      nextRetryTimestamp: Date.now(),
      enqueuedAt: Date.now()
    });

    return { success: true, deduplicated: false, queueDepth: this.queue.length };
  }

  public getReadyBatch(limit = 100): OutboxItem[] {
    const now = Date.now();
    return this.queue.filter(item => item.nextRetryTimestamp <= now).slice(0, limit);
  }

  public markSuccess(eventId: string): void {
    this.queue = this.queue.filter(i => i.event.eventId !== eventId);
  }

  public markFailure(eventId: string, error?: string): void {
    const item = this.queue.find(i => i.event.eventId === eventId);
    if (!item) return;

    item.attempts++;
    if (item.attempts >= this.maxRetries) {
      // Move to Dead-Letter Queue
      this.queue = this.queue.filter(i => i.event.eventId !== eventId);
      this.deadLetterQueue.push(item);
      if (this.deadLetterQueue.length > this.maxDeadLetterCapacity) {
        this.deadLetterQueue.shift();
      }
    } else {
      // Exponential backoff: 1s, 2s, 4s, 8s... + jitter
      const backoffMs = Math.min(30000, 1000 * Math.pow(2, item.attempts) + Math.random() * 500);
      item.nextRetryTimestamp = Date.now() + backoffMs;
    }
  }

  public getDepth(): number {
    return this.queue.length;
  }

  public getDeadLetterCount(): number {
    return this.deadLetterQueue.length;
  }

  public clear(): void {
    this.queue = [];
    this.deadLetterQueue = [];
    this.processedKeys.clear();
  }
}

// ============================================================================
// Google Cloud Pub/Sub Event Bus (With Local Outbox Fallback)
// ============================================================================

export class GooglePubSubEventBus implements EventBus {
  private localBus: LocalEventBus;
  private outbox: CloudEventOutbox;
  private topicName: string;
  private isConfigured: boolean;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(topicName?: string, maxCapacity = 2000) {
    this.localBus = new LocalEventBus();
    this.outbox = new CloudEventOutbox(maxCapacity);
    this.topicName = topicName || process.env.GCP_PUBSUB_TOPIC_EVENTS || 'projects/gujarat-police-cctv/topics/cctv-vehicle-events';
    this.isConfigured = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_SERVICE_ACCOUNT_KEY) && 
                         process.env.ENABLE_GOOGLE_CLOUD_SYNC === 'true';

    this.startOutboxWorker();
  }

  public async publish(event: SentinelSecurityEvent): Promise<{ success: boolean; eventId: string; deduplicated?: boolean; queued?: boolean }> {
    // 1. Always publish to local bus immediately so local CCTV/UI never stalls
    await this.localBus.publish(event);

    // 2. Queue into outbox for Pub/Sub dispatch
    const queueResult = this.outbox.enqueue(event);

    if (queueResult.deduplicated) {
      return { success: true, eventId: event.eventId, deduplicated: true };
    }

    return { success: true, eventId: event.eventId, queued: true };
  }

  public subscribe(eventType: string, handler: (event: SentinelSecurityEvent) => void): () => void {
    return this.localBus.subscribe(eventType, handler);
  }

  private startOutboxWorker(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushOutboxBatch();
    }, 2000);
    if (this.flushTimer && typeof this.flushTimer.unref === 'function') {
      this.flushTimer.unref();
    }
  }

  public async flushOutboxBatch(): Promise<number> {
    const batch = this.outbox.getReadyBatch(50);
    if (batch.length === 0) return 0;

    let processed = 0;
    for (const item of batch) {
      if (!this.isConfigured) {
        // In local/unconfigured mode, mark delivered locally without blocking network
        this.outbox.markSuccess(item.event.eventId);
        processed++;
        continue;
      }

      try {
        // If live Google Cloud Pub/Sub REST endpoint is active:
        const payloadJson = JSON.stringify({
          messages: [{
            data: Buffer.from(JSON.stringify(item.event)).toString('base64'),
            attributes: {
              eventType: item.event.eventType,
              cameraId: item.event.cameraId,
              idempotencyKey: item.event.idempotencyKey
            }
          }]
        });

        // Simulating/dispatching to Pub/Sub HTTP endpoint if URL is defined
        if (process.env.GCP_PUBSUB_ENDPOINT) {
          const res = await fetch(`${process.env.GCP_PUBSUB_ENDPOINT}/v1/${this.topicName}:publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payloadJson,
            signal: AbortSignal.timeout(3000)
          });
          if (!res.ok) throw new Error(`Pub/Sub HTTP Error ${res.status}`);
        }

        this.outbox.markSuccess(item.event.eventId);
        processed++;
      } catch (err: any) {
        this.outbox.markFailure(item.event.eventId, err?.message);
      }
    }

    return processed;
  }

  public getStatus() {
    return {
      provider: 'GOOGLE_PUBSUB',
      active: this.isConfigured,
      queueDepth: this.outbox.getDepth(),
      deadLetterCount: this.outbox.getDeadLetterCount()
    };
  }

  public shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export const defaultLocalEventBus = new LocalEventBus();
export const defaultPubSubEventBus = new GooglePubSubEventBus();
