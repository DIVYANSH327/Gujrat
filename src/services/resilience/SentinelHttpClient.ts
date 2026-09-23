/**
 * Sentinel Resilient HTTP Client
 * Gujarat Police CCTV & AI Intelligence Platform (SCRB)
 *
 * Implements:
 * 1. Unified Request Coalescing (SingleFlight) for concurrent GET requests
 * 2. Endpoint-level Circuit Breakers with exponential backoff on HTTP 429
 * 3. Structured [429 FORENSIC] diagnostics
 * 4. 429 Origin Classification (LOCAL API, UPSTREAM SERVICE, CLOUD API, CAMERA SOURCE, UNKNOWN)
 * 5. Safe fallbacks so UI components never crash into raw "Rate exceeded." screens
 */

import { globalSingleFlight } from './SingleFlight.js';
import { globalCircuitBreakers } from './CircuitBreaker.js';
import { globalTelemetryTracker } from './RequestTelemetry.js';
import { analyticsCache } from './AnalyticsCache.js';

export type RateLimitOrigin =
  | 'LOCAL API 429'
  | 'UPSTREAM SERVICE 429'
  | 'CLOUD API 429'
  | 'CAMERA SOURCE 429'
  | 'UNKNOWN 429';

export interface SentinelFetchOptions extends RequestInit {
  caller?: string;
  bypassCache?: boolean;
  timeoutMs?: number;
  fallbackData?: any;
}

export class SentinelHttpClient {
  private static instance: SentinelHttpClient | null = null;
  private forensicLogHistory: Array<{
    timestamp: string;
    method: string;
    url: string;
    caller: string;
    status: number;
    retryAfter: string;
    requestId: string;
    origin: RateLimitOrigin;
  }> = [];

  public static getInstance(): SentinelHttpClient {
    if (!SentinelHttpClient.instance) {
      SentinelHttpClient.instance = new SentinelHttpClient();
    }
    return SentinelHttpClient.instance;
  }

  /**
   * Classify the origin of a 429 response based on URL and response headers.
   */
  public classifyRateLimitOrigin(url: string, headers?: Headers): RateLimitOrigin {
    const lowerUrl = url.toLowerCase();
    
    // Upstream camera gateways
    if (lowerUrl.includes('cctv.corp8.cloud') || lowerUrl.includes('/stream/') || lowerUrl.includes('/hls/')) {
      return 'CAMERA SOURCE 429';
    }
    // Cloud AI / GCP services
    if (
      lowerUrl.includes('generativelanguage.googleapis.com') ||
      lowerUrl.includes('googleapis.com') ||
      lowerUrl.includes('/api/gcp/') ||
      lowerUrl.includes('/api/cloud-scale/')
    ) {
      return 'CLOUD API 429';
    }
    // Upstream third-party services
    if (lowerUrl.startsWith('http') && !lowerUrl.includes(window.location.host)) {
      return 'UPSTREAM SERVICE 429';
    }
    // Local Sentinel API
    if (lowerUrl.startsWith('/api/')) {
      return 'LOCAL API 429';
    }

    return 'UNKNOWN 429';
  }

  /**
   * Log structured [429 FORENSIC] event (Strictly sanitized, zero credentials/keys).
   */
  public log429Forensic(params: {
    method: string;
    url: string;
    caller: string;
    retryAfter?: string | null;
    requestId?: string | null;
    origin: RateLimitOrigin;
  }): void {
    const timestamp = new Date().toISOString();
    const requestId = params.requestId || `req-${Math.random().toString(36).slice(2, 9)}`;
    const retryAfter = params.retryAfter || 'N/A';

    const entry = {
      timestamp,
      method: params.method,
      url: params.url,
      caller: params.caller,
      status: 429,
      retryAfter,
      requestId,
      origin: params.origin
    };

    this.forensicLogHistory.push(entry);
    if (this.forensicLogHistory.length > 100) {
      this.forensicLogHistory.shift();
    }

    console.warn(
      `[429 FORENSIC]\n` +
      `timestamp=${timestamp}\n` +
      `method=${params.method}\n` +
      `url=${params.url}\n` +
      `caller=${params.caller}\n` +
      `status=429\n` +
      `origin=${params.origin}\n` +
      `retryAfter=${retryAfter}\n` +
      `requestId=${requestId}`
    );
  }

  /**
   * Primary resilient fetch wrapper.
   */
  public async fetch(url: string, options: SentinelFetchOptions = {}): Promise<Response> {
    const method = (options.method || 'GET').toUpperCase();
    const caller = options.caller || 'UNKNOWN_CALLER';
    const isGet = method === 'GET';
    const breaker = globalCircuitBreakers.get(url);

    // If circuit is open, return a synthetic 429 or fallback response without hitting network
    if (breaker.isOpen()) {
      const origin = this.classifyRateLimitOrigin(url);
      this.log429Forensic({
        method,
        url,
        caller,
        retryAfter: `${Math.ceil((breaker.getCooldownRemaining()) / 1000)}s`,
        origin
      });

      // Create a clean mock Response so callers don't throw uncaught network exceptions
      return new Response(JSON.stringify({
        rateLimited: true,
        circuitOpen: true,
        origin,
        message: 'Endpoint circuit open due to upstream rate limit. Serving fail-safe state.'
      }), {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'Content-Type': 'application/json', 'Retry-After': '30' }
      });
    }

    // Coalesce concurrent GET requests via SingleFlight
    if (isGet) {
      return globalSingleFlight.do(url, async () => {
        return this.executeFetch(url, options, method, caller);
      });
    }

    return this.executeFetch(url, options, method, caller);
  }

  /**
   * Helper to fetch and parse JSON safely with cached fallback on 429.
   */
  public async fetchJson<T>(url: string, options: SentinelFetchOptions = {}): Promise<T | null> {
    try {
      const res = await this.fetch(url, options);
      if (res.status === 429) {
        // Try serving from local Analytics/State Cache
        const cached = analyticsCache.get<T>(url);
        if (cached) return cached;
        return options.fallbackData ?? null;
      }
      if (!res.ok) {
        return options.fallbackData ?? null;
      }
      const data = await res.json();
      if (data && (options.method || 'GET').toUpperCase() === 'GET') {
        analyticsCache.set(url, data, 60000);
      }
      return data as T;
    } catch (err) {
      console.warn(`[SentinelHttpClient] Error fetching ${url}:`, err);
      const cached = analyticsCache.get<T>(url);
      if (cached) return cached;
      return options.fallbackData ?? null;
    }
  }

  private async executeFetch(
    url: string, 
    options: SentinelFetchOptions, 
    method: string, 
    caller: string
  ): Promise<Response> {
    const breaker = globalCircuitBreakers.get(url);
    const timeoutMs = options.timeoutMs || 8000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    globalTelemetryTracker.recordStart(url);

    try {
      const response = await window.fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timer);

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const origin = this.classifyRateLimitOrigin(url, response.headers);
        
        breaker.recordFailure(true);
        globalTelemetryTracker.recordError(url, 429, 'Rate exceeded');

        this.log429Forensic({
          method,
          url,
          caller,
          retryAfter: retryAfterHeader,
          origin
        });
      } else if (response.ok) {
        breaker.recordSuccess();
        globalTelemetryTracker.recordSuccess(url);
      } else {
        globalTelemetryTracker.recordError(url, response.status, response.statusText);
      }

      return response;
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err.name === 'AbortError';
      globalTelemetryTracker.recordError(url, isAbort ? 408 : 500, err?.message || 'Fetch failed');
      
      // Return safe degraded response instead of throwing unhandled error to UI root
      return new Response(JSON.stringify({
        error: true,
        message: err?.message || 'Network request failed',
        fallback: true
      }), {
        status: isAbort ? 408 : 503,
        statusText: isAbort ? 'Request Timeout' : 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  public getForensicLogs() {
    return [...this.forensicLogHistory];
  }

  public getForensicStats() {
    const total429s = this.forensicLogHistory.length;
    const byOrigin: Record<RateLimitOrigin, number> = {
      'LOCAL API 429': 0,
      'UPSTREAM SERVICE 429': 0,
      'CLOUD API 429': 0,
      'CAMERA SOURCE 429': 0,
      'UNKNOWN 429': 0
    };

    for (const log of this.forensicLogHistory) {
      byOrigin[log.origin] = (byOrigin[log.origin] || 0) + 1;
    }

    return {
      total429s,
      byOrigin,
      recentLogs: this.forensicLogHistory.slice(-10)
    };
  }
}

export const sentinelHttpClient = SentinelHttpClient.getInstance();
export const sentinelFetch = (url: string, options?: SentinelFetchOptions) => 
  sentinelHttpClient.fetch(url, options);
export const sentinelFetchJson = <T>(url: string, options?: SentinelFetchOptions) =>
  sentinelHttpClient.fetchJson<T>(url, options);
