/**
 * Analytics Cache implementation.
 * Ensures the UI always has access to the last successful analytics payload.
 * Prevents UI erasure on rate limits or offline modes.
 */

import { DetectionAnalyticsResponse } from '../../components/CommandCenterAnalytics';

const CACHE_STORAGE_KEY = 'sentinel_analytics_cache_v1';

export class AnalyticsCache {
  private inMemoryCache: DetectionAnalyticsResponse | null = null;
  private inMemoryCachedAt: Date | null = null;
  private genericCache = new Map<string, { data: any; expiresAt: number }>();

  constructor() {
    this.hydrate();
  }

  public set(data: DetectionAnalyticsResponse): void;
  public set<T>(key: string, data: T, ttlMs?: number): void;
  public set(keyOrData: any, maybeData?: any, ttlMs: number = 60000): void {
    if (typeof keyOrData === 'string') {
      this.genericCache.set(keyOrData, {
        data: maybeData,
        expiresAt: Date.now() + ttlMs
      });
      return;
    }

    this.inMemoryCache = keyOrData;
    this.inMemoryCachedAt = new Date();

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(
          CACHE_STORAGE_KEY,
          JSON.stringify({
            data: keyOrData,
            cachedAt: this.inMemoryCachedAt.toISOString()
          })
        );
      }
    } catch (err) {
      console.warn('[AnalyticsCache] Failed to persist to localStorage:', err);
    }
  }

  public get(): { data: DetectionAnalyticsResponse | null; cachedAt: Date | null };
  public get<T>(key: string): T | null;
  public get(key?: string): any {
    if (typeof key === 'string') {
      const entry = this.genericCache.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        this.genericCache.delete(key);
        return null;
      }
      return entry.data;
    }

    if (this.inMemoryCache) {
      return {
        data: this.inMemoryCache,
        cachedAt: this.inMemoryCachedAt
      };
    }
    this.hydrate();
    return {
      data: this.inMemoryCache,
      cachedAt: this.inMemoryCachedAt
    };
  }

  public clear(): void {
    this.inMemoryCache = null;
    this.inMemoryCachedAt = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(CACHE_STORAGE_KEY);
      }
    } catch {}
  }

  private hydrate(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(CACHE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) {
            this.inMemoryCache = parsed.data;
            this.inMemoryCachedAt = parsed.cachedAt ? new Date(parsed.cachedAt) : new Date();
          }
        }
      }
    } catch (err) {
      console.warn('[AnalyticsCache] Failed to hydrate cache:', err);
    }
  }
}

export const globalAnalyticsCache = new AnalyticsCache();
export const analyticsCache = globalAnalyticsCache;
