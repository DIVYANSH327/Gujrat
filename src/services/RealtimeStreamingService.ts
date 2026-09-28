/**
 * RealtimeStreamingService.ts
 * Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
 * 
 * Client-Side Real-Time Event Streaming via Server-Sent Events (SSE).
 * Bridges live backend events (Pub/Sub notifications, ANPR detections, 
 * Watchlist hits, and system health) directly into the UI state.
 */

import { sysEvents } from './Architecture';

export type StreamConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export interface StreamEventPayload {
  type: 'CONNECTED' | 'EVENT' | 'ALERT' | 'OBSERVATION' | 'HEARTBEAT' | 'GCP_PIPELINE';
  timestamp: string;
  data?: any;
  targetProject?: string;
  region?: string;
}

export type StreamEventListener = (event: StreamEventPayload) => void;

class RealtimeStreamingService {
  private eventSource: EventSource | null = null;
  private status: StreamConnectionStatus = 'DISCONNECTED';
  private listeners: Set<StreamEventListener> = new Set();
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 15000;
  private targetProject = 'gujrat-cctv';
  private region = 'asia-south1';

  constructor() {
    // Auto-connect in browser environment
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.eventSource && (this.eventSource.readyState === EventSource.OPEN || this.eventSource.readyState === EventSource.CONNECTING)) {
      return;
    }

    this.status = 'CONNECTING';
    this.notifyStatusChange();

    try {
      this.eventSource = new EventSource('/api/events/stream');

      this.eventSource.onopen = () => {
        this.status = 'CONNECTED';
        this.reconnectAttempts = 0;
        this.notifyStatusChange();
        console.info('[Sentinel SSE] Real-time event stream connected to Sentinel Cloud Gateway.');
      };

      this.eventSource.onmessage = (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data) as StreamEventPayload;
          if (payload.targetProject) this.targetProject = payload.targetProject;
          if (payload.region) this.region = payload.region;

          // Dispatch to internal sysEvents so existing UI components react instantly
          if (payload.type === 'EVENT' || payload.type === 'OBSERVATION') {
            sysEvents.emit('LOG', {
              type: 'EVENT_STORED',
              event: payload.data,
              timestamp: payload.timestamp
            });
          }

          // Notify subscribed listeners
          for (const listener of this.listeners) {
            try {
              listener(payload);
            } catch (err) {
              console.warn('[Sentinel SSE] Error in listener handler:', err);
            }
          }
        } catch (parseErr) {
          // Heartbeat or non-json message
        }
      };

      this.eventSource.onerror = () => {
        this.status = 'DISCONNECTED';
        this.notifyStatusChange();
        this.scheduleReconnect();
      };
    } catch (err) {
      this.status = 'ERROR';
      this.notifyStatusChange();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
    this.status = 'DISCONNECTED';
    this.notifyStatusChange();
  }

  public subscribe(listener: StreamEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getStatus(): {
    status: StreamConnectionStatus;
    targetProject: string;
    region: string;
    reconnectAttempts: number;
  } {
    return {
      status: this.status,
      targetProject: this.targetProject,
      region: this.region,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  private notifyStatusChange(): void {
    const payload: StreamEventPayload = {
      type: 'CONNECTED',
      timestamp: new Date().toISOString(),
      targetProject: this.targetProject,
      region: this.region,
      data: { status: this.status }
    };
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch {}
    }
  }
}

export const realtimeStreamingService = new RealtimeStreamingService();
