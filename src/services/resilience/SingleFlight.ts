/**
 * Sentinel SingleFlight utility.
 * Coalesces concurrent calls to the same key into a single in-flight promise.
 * Prevents identical requests from firing simultaneously.
 */

export class SingleFlight {
  private inFlight = new Map<string, Promise<any>>();

  /**
   * Execute an async action, or return the currently running promise if one is already in flight.
   */
  public async do<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Check if a request for the given key is currently active.
   */
  public isInFlight(key: string): boolean {
    return this.inFlight.has(key);
  }

  /**
   * Number of distinct requests currently in flight.
   */
  public get activeCount(): number {
    return this.inFlight.size;
  }

  /**
   * Clear all in-flight tracking.
   */
  public clear(): void {
    this.inFlight.clear();
  }
}

// Global singleton instance for common operations
export const globalSingleFlight = new SingleFlight();
