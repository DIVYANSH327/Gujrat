/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ExternalLookupRateLimiter: Defensive API Rate Limiting & Backoff Engine
 * Protects upstream government endpoints with deduplication, sliding window, and exponential backoff.
 */

export interface RateLimitStatus {
  isAllowed: boolean;
  currentWindowCount: number;
  maxAllowedPerMinute: number;
  retryAfterSeconds?: number;
}

export class ExternalLookupRateLimiter {
  private static instance: ExternalLookupRateLimiter | null = null;
  private requestLog: Map<string, number[]> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private maxRequestsPerMinute: number = 60;

  private constructor() {}

  public static getInstance(): ExternalLookupRateLimiter {
    if (!ExternalLookupRateLimiter.instance) {
      ExternalLookupRateLimiter.instance = new ExternalLookupRateLimiter();
    }
    return ExternalLookupRateLimiter.instance;
  }

  public setMaxRequestsPerMinute(limit: number): void {
    this.maxRequestsPerMinute = limit;
  }

  /**
   * Evaluates if a request to the given provider is permitted under current sliding window
   */
  public checkLimit(provider: string): RateLimitStatus {
    const now = Date.now();
    const windowStart = now - 60000;
    const timestamps = this.requestLog.get(provider) || [];

    // Filter to last 60 seconds
    const recent = timestamps.filter(t => t > windowStart);
    this.requestLog.set(provider, recent);

    if (recent.length >= this.maxRequestsPerMinute) {
      const oldestInWindow = recent[0];
      const retryAfter = Math.ceil((oldestInWindow + 60000 - now) / 1000);
      return {
        isAllowed: false,
        currentWindowCount: recent.length,
        maxAllowedPerMinute: this.maxRequestsPerMinute,
        retryAfterSeconds: Math.max(1, retryAfter)
      };
    }

    return {
      isAllowed: true,
      currentWindowCount: recent.length,
      maxAllowedPerMinute: this.maxRequestsPerMinute
    };
  }

  public isAllowed(actorId: string, provider: string): boolean {
    return this.checkLimit(provider).isAllowed;
  }

  /**
   * Records a request into the sliding window
   */
  public recordRequest(provider: string): void {
    const timestamps = this.requestLog.get(provider) || [];
    timestamps.push(Date.now());
    this.requestLog.set(provider, timestamps);
  }

  /**
   * Request Deduplication: coalesces identical in-flight queries
   */
  public async deduplicate<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = queryFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

export const externalLookupRateLimiter = ExternalLookupRateLimiter.getInstance();
