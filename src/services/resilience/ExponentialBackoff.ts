/**
 * Exponential Backoff with Jitter for Rate Limit & Temporary Network Failures.
 * Attempt 1 → 2s
 * Attempt 2 → 5s
 * Attempt 3 → 15s
 * Attempt 4 → 30s
 * Max Retries: 3
 */

export interface BackoffConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitterFactor?: number; // 0 to 1
}

export class ExponentialBackoff {
  private static readonly DELAYS = [2000, 5000, 15000, 30000];

  /**
   * Calculates backoff delay for a given attempt index (0-indexed).
   */
  public static getDelayMs(attempt: number, config?: BackoffConfig): number {
    const maxRetries = config?.maxRetries ?? 3;
    if (attempt >= maxRetries) {
      return -1; // Exhausted retries
    }

    const baseDelay = ExponentialBackoff.DELAYS[Math.min(attempt, ExponentialBackoff.DELAYS.length - 1)];
    // Add 10-25% random jitter to avoid thundering herds
    const jitter = (Math.random() * 0.3 - 0.15) * baseDelay;
    return Math.max(500, Math.round(baseDelay + jitter));
  }

  /**
   * Helper sleep promise.
   */
  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute an async function with backoff on 429 / retryable errors.
   */
  public static async executeWithBackoff<T>(
    fn: (attempt: number) => Promise<T>,
    isRetryable: (err: any) => boolean = (err) => err?.status === 429 || err?.is429,
    maxRetries = 3
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await fn(attempt);
      } catch (err: any) {
        if (!isRetryable(err) || attempt >= maxRetries) {
          throw err;
        }

        const delay = ExponentialBackoff.getDelayMs(attempt, { maxRetries });
        if (delay < 0) {
          throw err;
        }

        attempt++;
        await ExponentialBackoff.sleep(delay);
      }
    }
  }
}
