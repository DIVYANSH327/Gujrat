/**
 * Centralized GCP & System Health Monitoring Service.
 * Single source of truth for cloud and edge health states.
 * Guarantees exactly ONE unified health probe across all UI components.
 * Halts repeated cloud probes when running in LOCAL_ONLY mode or when rate-limited.
 */

import { CircuitBreaker } from './CircuitBreaker';
import { SingleFlight } from './SingleFlight';
import { GcpHealthCheckData } from '../../hooks/useGcpHealthMonitoring';

class CentralHealthMonitorService {
  private healthData: GcpHealthCheckData | null = null;
  private isProbing = false;
  private lastProbeAt: Date | null = null;
  private circuitBreaker = new CircuitBreaker({
    name: 'gcp-health-probe',
    failureThreshold: 2,
    cooldownMs: 30000
  });
  private singleFlight = new SingleFlight();
  private subscribers = new Set<(data: GcpHealthCheckData | null) => void>();
  private intervalTimer: NodeJS.Timeout | null = null;
  private isAutoProbeEnabled = false; // Default false to prevent rate limits
  private pollIntervalMs = 30000;      // Conservative 30s interval

  constructor() {
    // Initial probe triggered on demand
  }

  public getHealthData(): GcpHealthCheckData | null {
    return this.healthData;
  }

  public getLastProbeAt(): Date | null {
    return this.lastProbeAt;
  }

  public getCircuitState() {
    return this.circuitBreaker.getState();
  }

  public async probeNow(force = false): Promise<GcpHealthCheckData | null> {
    if (!force && !this.circuitBreaker.canExecute()) {
      return this.healthData; // Return existing data without firing a blocked request
    }

    return this.singleFlight.do('gcp-health-check', async () => {
      this.isProbing = true;
      try {
        const res = await fetch('/api/cloud-scale/gcp-health-check', {
          headers: { 'Accept': 'application/json' }
        });

        if (res.status === 429) {
          this.circuitBreaker.recordFailure(true);
          return this.healthData;
        }

        if (!res.ok) {
          this.circuitBreaker.recordFailure(false);
          return this.healthData;
        }

        const data: GcpHealthCheckData = await res.json();
        this.healthData = data;
        this.lastProbeAt = new Date();
        this.circuitBreaker.recordSuccess();

        // If in LOCAL_ONLY / disabled mode, auto-pause background interval to save quota
        if (!data.gcpConnectivity?.enabled) {
          this.stopAutoProbe();
        }

        this.notifySubscribers();
        return data;
      } catch (err) {
        this.circuitBreaker.recordFailure(false);
        return this.healthData;
      } finally {
        this.isProbing = false;
      }
    });
  }

  public startAutoProbe(intervalMs: number = 30000): void {
    this.pollIntervalMs = Math.max(15000, intervalMs);
    this.isAutoProbeEnabled = true;

    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }

    // Only one single timer across the entire application
    this.intervalTimer = setInterval(() => {
      // If GCP is disabled (LOCAL_ONLY), skip cloud probes
      if (this.healthData && !this.healthData.gcpConnectivity?.enabled) {
        return;
      }
      this.probeNow(false);
    }, this.pollIntervalMs);
  }

  public stopAutoProbe(): void {
    this.isAutoProbeEnabled = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public subscribe(callback: (data: GcpHealthCheckData | null) => void): () => void {
    this.subscribers.add(callback);
    // Immediately deliver cached state
    if (this.healthData) {
      try { callback(this.healthData); } catch {}
    } else {
      // Trigger initial probe on first subscriber
      this.probeNow(false);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => {
      try { cb(this.healthData); } catch {}
    });
  }
}

export const centralHealthMonitor = new CentralHealthMonitorService();
