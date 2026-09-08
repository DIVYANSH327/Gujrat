/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * CentralEventBus: Statewide Asynchronous Event Pipeline, Idempotency & Backpressure Controller
 * Architecture: In-memory broker with modular plug-in design for Apache Kafka / NATS / Redpanda.
 */

export type GridEventType =
  | 'VEHICLE_DETECTED'
  | 'PLATE_READ'
  | 'VEHICLE_TRACK_UPDATED'
  | 'EVIDENCE_CAPTURED'
  | 'WATCHLIST_MATCH'
  | 'CAMERA_HANDOFF_REQUESTED'
  | 'CAMERA_HANDOFF_COMPLETED'
  | 'CROSS_CAMERA_MATCH'
  | 'TRAJECTORY_UPDATED'
  | 'INCIDENT_CREATED'
  | 'INVESTIGATION_REQUESTED'
  | 'INVESTIGATION_COMPLETED'
  | 'EDGE_OFFLINE'
  | 'AGENT_OFFLINE'
  | 'JOB_REASSIGNED'
  | 'GOVERNMENT_LOOKUP_REQUESTED'
  | 'GOVERNMENT_LOOKUP_COMPLETED'
  | 'SCALE_BURST_EVENT'
  | 'VIOLATION_CANDIDATE_DETECTED'
  | 'VIOLATION_EVIDENCE_CAPTURED'
  | 'VIOLATION_CASE_CREATED'
  | 'VIOLATION_CASE_SUBMITTED_FOR_REVIEW'
  | 'VIOLATION_CASE_CLAIMED'
  | 'VIOLATION_CASE_APPROVED'
  | 'VIOLATION_CASE_REJECTED'
  | 'VIOLATION_CASE_INSUFFICIENT_EVIDENCE'
  | 'CHALLAN_DISPATCH_REQUESTED'
  | 'CHALLAN_DISPATCHED'
  | 'CHALLAN_DISPATCH_FAILED'
  | 'CHALLAN_STATUS_UPDATED'
  | 'MOBILE_CAMERA_FRAME_SAMPLED'
  | 'MOBILE_CAMERA_STATE_CHANGED'
  | 'MISSION_CREATED'
  | 'MISSION_STEP_COMPLETED'
  | 'MISSION_FAILED'
  | 'MISSION_APPROVAL_REQUESTED'
  | 'MISSION_APPROVAL_RESOLVED'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'HUMAN_REVIEW_COMPLETED'
  | 'INCIDENT_STATUS_UPDATED'
  | 'PREDICTIVE_HANDOFF_UPDATED'
  | 'FAULT_INJECTION_TRIGGERED'
  | 'FAULT_INJECTION_RECOVERED'
  | 'FACE_DETECTED'
  | 'FACE_WATCHLIST_CANDIDATE'
  | 'FACE_CANDIDATE_VERIFIED';

export type EventPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface GridEvent<T = any> {
  eventId: string;
  eventType: GridEventType;
  sourceId: string;
  correlationId: string;
  idempotencyKey: string;
  timestamp: string;
  priority: EventPriority;
  payload: T;
}

export type EventSubscriptionCallback<T = any> = (event: GridEvent<T>) => void | Promise<void>;

export interface IEventBus {
  publish<T = any>(event: Omit<GridEvent<T>, 'eventId' | 'timestamp'> & { eventId?: string; timestamp?: string }): boolean;
  subscribe<T = any>(eventType: GridEventType | '*', callback: EventSubscriptionCallback<T>): string;
  unsubscribe(subscriptionId: string): boolean;
  getProcessedCount(): number;
  getDroppedCount(): number;
  getBackpressureState(): 'NORMAL' | 'HIGH_LOAD' | 'BACKPRESSURE_ACTIVE';
}

export class BackpressureController {
  private normalThreshold = 1000; // events/sec
  private highLoadThreshold = 3500; // events/sec
  private currentEventRate = 0;
  private recentTimestamps: number[] = [];

  public recordEvent(): 'NORMAL' | 'HIGH_LOAD' | 'BACKPRESSURE_ACTIVE' {
    const now = Date.now();
    this.recentTimestamps.push(now);
    // Prune events older than 1 second
    const oneSecAgo = now - 1000;
    while (this.recentTimestamps.length > 0 && this.recentTimestamps[0] < oneSecAgo) {
      this.recentTimestamps.shift();
    }
    this.currentEventRate = this.recentTimestamps.length;

    if (this.currentEventRate > this.highLoadThreshold) {
      return 'BACKPRESSURE_ACTIVE';
    } else if (this.currentEventRate > this.normalThreshold) {
      return 'HIGH_LOAD';
    }
    return 'NORMAL';
  }

  public getState(): 'NORMAL' | 'HIGH_LOAD' | 'BACKPRESSURE_ACTIVE' {
    return this.recordEvent();
  }

  public getRate(): number {
    return this.currentEventRate;
  }
}

export class CentralEventBus implements IEventBus {
  private static instance: CentralEventBus | null = null;
  private subscriptions: Map<string, { eventType: string; callback: EventSubscriptionCallback }> = new Map();
  private idempotencyCache: Map<string, number> = new Map(); // key -> expire timestamp
  private subCounter = 0;
  private processedCount = 0;
  private droppedCount = 0;
  private backpressure = new BackpressureController();

  private constructor() {
    // Purge stale idempotency keys every 30 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [k, exp] of this.idempotencyCache.entries()) {
        if (exp < now) {
          this.idempotencyCache.delete(k);
        }
      }
    }, 30000);
  }

  public static getInstance(): CentralEventBus {
    if (!CentralEventBus.instance) {
      CentralEventBus.instance = new CentralEventBus();
    }
    return CentralEventBus.instance;
  }

  public publish<T = any>(eventData: Omit<GridEvent<T>, 'eventId' | 'timestamp'> & { eventId?: string; timestamp?: string }): boolean {
    const now = Date.now();
    const idempotencyKey = eventData.idempotencyKey || `${eventData.sourceId}-${eventData.eventType}-${eventData.correlationId}`;

    // 1. Idempotency Check: suppress duplicates within 10-second sliding window
    if (this.idempotencyCache.has(idempotencyKey)) {
      this.droppedCount++;
      return false; // Suppressed as duplicate
    }
    this.idempotencyCache.set(idempotencyKey, now + 10000);

    // 2. Backpressure evaluation
    const bpState = this.backpressure.recordEvent();
    // In BACKPRESSURE_ACTIVE mode, defer or drop lower-priority non-critical events (P4/P5)
    if (bpState === 'BACKPRESSURE_ACTIVE' && (eventData.priority === 'P4' || eventData.priority === 'P5')) {
      this.droppedCount++;
      return false; // Shed low-priority background telemetry under surge
    }

    const event: GridEvent<T> = {
      ...eventData,
      eventId: eventData.eventId || `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: eventData.timestamp || new Date().toISOString()
    };

    this.processedCount++;

    // 3. Dispatch to subscribers
    for (const [, sub] of this.subscriptions.entries()) {
      if (sub.eventType === '*' || sub.eventType === event.eventType) {
        try {
          sub.callback(event);
        } catch (err) {
          console.error(`[CentralEventBus] Error in subscriber for ${event.eventType}:`, err);
        }
      }
    }

    return true;
  }

  public subscribe<T = any>(eventType: GridEventType | '*', callback: EventSubscriptionCallback<T>): string {
    const subId = `SUB-${++this.subCounter}`;
    this.subscriptions.set(subId, { eventType, callback });
    return subId;
  }

  public unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  public getProcessedCount(): number {
    return this.processedCount;
  }

  public getDroppedCount(): number {
    return this.droppedCount;
  }

  public getBackpressureState(): 'NORMAL' | 'HIGH_LOAD' | 'BACKPRESSURE_ACTIVE' {
    return this.backpressure.getState();
  }

  public clearHistory(): void {
    this.idempotencyCache.clear();
    this.processedCount = 0;
    this.droppedCount = 0;
  }
}

export const centralEventBus = CentralEventBus.getInstance();
