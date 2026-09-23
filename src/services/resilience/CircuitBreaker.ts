/**
 * Sentinel Circuit Breaker implementation for Cloud, API, and Analytics services.
 * States:
 *   - CLOSED: Normal operation, requests flow freely.
 *   - OPEN: Tripped due to repeated 429s or consecutive failures; requests are blocked/coalesced.
 *   - HALF_OPEN: Cooldown period elapsed; exactly ONE canary probe request is permitted to test health.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // e.g., 3 failures trip the breaker
  cooldownMs?: number;       // e.g., 20000ms cooldown before HALF_OPEN
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private consecutive429s = 0;
  private lastFailureTime = 0;
  private halfOpenProbeInFlight = false;
  private failureThreshold: number;
  private cooldownMs: number;
  private name: string;
  private subscribers = new Set<(state: CircuitState) => void>();

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownMs = options.cooldownMs || 20000;
    this.name = options.name || 'default';
  }

  public getState(): CircuitState {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.cooldownMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
    return this.state;
  }

  public canExecute(): boolean {
    const currentState = this.getState();
    if (currentState === 'CLOSED') return true;
    if (currentState === 'HALF_OPEN') {
      if (!this.halfOpenProbeInFlight) {
        this.halfOpenProbeInFlight = true;
        return true; // Allow single canary probe
      }
      return false; // Only one canary probe allowed
    }
    return false; // OPEN: block execution
  }

  public recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.consecutive429s = 0;
    this.halfOpenProbeInFlight = false;
    if (this.state !== 'CLOSED') {
      this.transitionTo('CLOSED');
    }
  }

  public recordFailure(isRateLimit = false): void {
    this.lastFailureTime = Date.now();
    this.halfOpenProbeInFlight = false;
    this.consecutiveFailures++;
    if (isRateLimit) {
      this.consecutive429s++;
    }

    if (this.state === 'HALF_OPEN') {
      // Canary failed; immediately re-open
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      // Trip if threshold reached or 429 threshold reached
      if (this.consecutive429s >= 2 || this.consecutiveFailures >= this.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  public trip(): void {
    this.lastFailureTime = Date.now();
    this.transitionTo('OPEN');
  }

  public reset(): void {
    this.consecutiveFailures = 0;
    this.consecutive429s = 0;
    this.halfOpenProbeInFlight = false;
    this.transitionTo('CLOSED');
  }

  public getStats() {
    return {
      name: this.name,
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      consecutive429s: this.consecutive429s,
      lastFailureTime: this.lastFailureTime,
      cooldownRemainingMs: Math.max(0, this.cooldownMs - (Date.now() - this.lastFailureTime))
    };
  }

  public isOpen(): boolean {
    return this.getState() === 'OPEN';
  }

  public getCooldownRemaining(): number {
    return Math.max(0, this.cooldownMs - (Date.now() - this.lastFailureTime));
  }

  public subscribe(callback: (state: CircuitState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.subscribers.forEach(cb => {
        try { cb(newState); } catch {}
      });
    }
  }
}

export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  public get(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    let b = this.breakers.get(name);
    if (!b) {
      b = new CircuitBreaker({ name, ...options });
      this.breakers.set(name, b);
    }
    return b;
  }

  public resetAll(): void {
    this.breakers.forEach(b => b.reset());
  }
}

export const globalCircuitBreakers = new CircuitBreakerRegistry();
