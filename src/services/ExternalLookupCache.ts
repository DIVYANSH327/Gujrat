/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ExternalLookupCache: Policy-Controlled Ephemeral Cache
 * Enforces strict TTL expiration (never indefinite) and stores authorization scope.
 */

export interface CachedExternalResult<T = any> {
  provider: string;
  normalizedPlate: string;
  scope: string;
  data: T;
  cachedAt: number; // epoch ms
  expiresAt: number; // epoch ms
  authorizationContext: {
    actorId: string;
    role: string;
    caseId?: string;
  };
}

export class ExternalLookupCache {
  private static instance: ExternalLookupCache | null = null;
  private cache: Map<string, CachedExternalResult> = new Map();
  private defaultTtlMs = 5 * 60 * 1000; // 5 minutes standard law enforcement TTL

  private constructor() {}

  public static getInstance(): ExternalLookupCache {
    if (!ExternalLookupCache.instance) {
      ExternalLookupCache.instance = new ExternalLookupCache();
    }
    return ExternalLookupCache.instance;
  }

  private buildKey(provider: string, normalizedPlate: string, scope = 'DEFAULT'): string {
    return `${provider.toUpperCase()}:${normalizedPlate.toUpperCase()}:${scope.toUpperCase()}`;
  }

  public get<T = any>(provider: string, normalizedPlate: string, scope = 'DEFAULT'): T | null {
    const key = this.buildKey(provider, normalizedPlate, scope);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public has(provider: string, normalizedPlate: string, scope = 'DEFAULT'): boolean {
    return this.get(provider, normalizedPlate, scope) !== null;
  }

  public set<T = any>(
    provider: string, 
    normalizedPlate: string, 
    data: T, 
    auth: { actorId: string; role: string; caseId?: string },
    scope = 'DEFAULT', 
    ttlMs?: number
  ): void {
    const key = this.buildKey(provider, normalizedPlate, scope);
    const cachedAt = Date.now();
    const expiresAt = cachedAt + (ttlMs ?? this.defaultTtlMs);

    this.cache.set(key, {
      provider,
      normalizedPlate,
      scope,
      data,
      cachedAt,
      expiresAt,
      authorizationContext: auth
    });
  }

  public invalidate(provider: string, normalizedPlate: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${provider.toUpperCase()}:${normalizedPlate.toUpperCase()}`)) {
        this.cache.delete(key);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats(): { totalEntries: number; validEntries: number } {
    const now = Date.now();
    let valid = 0;
    for (const [k, v] of this.cache.entries()) {
      if (now <= v.expiresAt) {
        valid++;
      } else {
        this.cache.delete(k);
      }
    }
    return {
      totalEntries: this.cache.size,
      validEntries: valid
    };
  }
}

export const externalLookupCache = ExternalLookupCache.getInstance();
