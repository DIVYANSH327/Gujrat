/**
 * Request Telemetry Service for API and Analytics endpoints.
 * Tracks live metrics, rate-limits (HTTP 429), errors, and latency.
 */

export interface EndpointTelemetry {
  endpoint: string;
  status: 'READY' | 'DEGRADED' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'ERROR';
  requestCount: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitCount: number;
  activeRequests: number;
  lastSuccessAt: Date | null;
  last429At: Date | null;
  lastErrorAt: Date | null;
  lastErrorDetails: string | null;
}

export class RequestTelemetryTracker {
  private metrics = new Map<string, EndpointTelemetry>();
  private listeners = new Set<(metrics: Map<string, EndpointTelemetry>) => void>();

  public getOrCreate(endpoint: string): EndpointTelemetry {
    let entry = this.metrics.get(endpoint);
    if (!entry) {
      entry = {
        endpoint,
        status: 'READY',
        requestCount: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitCount: 0,
        activeRequests: 0,
        lastSuccessAt: null,
        last429At: null,
        lastErrorAt: null,
        lastErrorDetails: null
      };
      this.metrics.set(endpoint, entry);
    }
    return entry;
  }

  public recordStart(endpoint: string): void {
    const entry = this.getOrCreate(endpoint);
    entry.requestCount++;
    entry.activeRequests++;
    this.notify();
  }

  public recordSuccess(endpoint: string): void {
    const entry = this.getOrCreate(endpoint);
    entry.activeRequests = Math.max(0, entry.activeRequests - 1);
    entry.successfulRequests++;
    entry.lastSuccessAt = new Date();
    entry.status = 'READY';
    this.notify();
  }

  public recordError(endpoint: string, status?: number, message?: string): void {
    const entry = this.getOrCreate(endpoint);
    entry.activeRequests = Math.max(0, entry.activeRequests - 1);
    entry.failedRequests++;
    entry.lastErrorAt = new Date();
    entry.lastErrorDetails = message || `HTTP ${status || 'Network Error'}`;

    if (status === 429) {
      entry.rateLimitCount++;
      entry.last429At = new Date();
      entry.status = 'RATE_LIMITED';
    } else if (status === 403) {
      entry.status = 'UNAVAILABLE';
    } else {
      entry.status = 'ERROR';
    }
    this.notify();
  }

  public getAll(): EndpointTelemetry[] {
    return Array.from(this.metrics.values());
  }

  public get(endpoint: string): EndpointTelemetry | undefined {
    return this.metrics.get(endpoint);
  }

  public subscribe(cb: (metrics: Map<string, EndpointTelemetry>) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try { cb(new Map(this.metrics)); } catch {}
    });
  }
}

export const globalTelemetryTracker = new RequestTelemetryTracker();
