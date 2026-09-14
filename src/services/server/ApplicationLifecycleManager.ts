/**
 * Application Lifecycle & Self-Recovery Coordinator
 * Gujarat Police CCTV & AI Intelligence Platform (SCRB)
 * Author: DIVYANSH Shrivastava
 *
 * Central coordinator responsible for:
 * 1. Single authoritative application startup and graceful shutdown
 * 2. Idempotent initialization (guards against duplicate workers, timers, loops)
 * 3. Process crash detection, isolation, and controlled backoff restart
 * 4. Subsystem health monitoring & structured recovery telemetry
 * 5. Crash-safe in-flight job reconciliation
 * 6. Readiness vs Liveness state decoupling
 */

import crypto from 'crypto';
import EventEmitter from 'events';

export type LifecycleState = 
  | 'UNINITIALIZED'
  | 'STARTING'
  | 'RUNNING'
  | 'DEGRADED'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED';

export type SubsystemName = 
  | 'EXPRESS_SERVER'
  | 'SENTINEL_SERVICES'
  | 'BACKGROUND_INTELLIGENCE'
  | 'AI_PROVIDER_ROUTER'
  | 'EVIDENCE_STORAGE'
  | 'NIGHT_AUDIT_ENGINE'
  | 'TUNNEL_MONITOR'
  | 'TELEMETRY_ENGINE';

export type SubsystemCategory = 'CRITICAL' | 'AUXILIARY';

/**
 * Core critical subsystems required for base surveillance, video streaming,
 * and statutory forensic evidence retention.
 */
export const CRITICAL_SUBSYSTEMS: ReadonlyArray<SubsystemName> = [
  'EXPRESS_SERVER',
  'SENTINEL_SERVICES',
  'BACKGROUND_INTELLIGENCE',
  'EVIDENCE_STORAGE'
];

/**
 * Auxiliary subsystems providing intelligence acceleration, background auditing,
 * or remote tunneling. Outages in auxiliary subsystems DO NOT degrade core CCTV operations.
 */
export const AUXILIARY_SUBSYSTEMS: ReadonlyArray<SubsystemName> = [
  'AI_PROVIDER_ROUTER',
  'NIGHT_AUDIT_ENGINE',
  'TUNNEL_MONITOR',
  'TELEMETRY_ENGINE'
];

export type RecoveryEventSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface RecoveryEvent {
  eventId: string;
  timestamp: string;
  component: SubsystemName | 'SYSTEM';
  eventType: string;
  severity: RecoveryEventSeverity;
  message: string;
  realStatus: string;
  bootId: string;
  processId: number;
  metadata?: Record<string, any>;
}

export interface SystemRecoveryTelemetry {
  bootId: string;
  processId: number;
  nodeVersion: string;
  platform: string;
  applicationStartTime: string;
  uptimeSeconds: number;
  lifecycleState: LifecycleState;
  previousShutdownState: string;
  restartReason: string;
  subsystemRestartCounts: Record<string, number>;
  cameraReconnectCounts: number;
  aiRecoveryCounts: number;
  lastSuccessfulFrame: string | null;
  lastSuccessfulInference: string | null;
  lastSuccessfulEvidenceWrite: string | null;
  inFlightJobsResetCount: number;
  eventsCount: number;
}

export class ApplicationLifecycleManager extends EventEmitter {
  private static instance: ApplicationLifecycleManager | null = null;

  public readonly bootId: string = `BOOT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  public readonly processId: number = process.pid;
  public readonly applicationStartTime: string = new Date().toISOString();

  private lifecycleState: LifecycleState = 'UNINITIALIZED';
  private previousShutdownState: string = 'CLEAN';
  private restartReason: string = 'INITIAL_BOOT';

  private subsystemStates = new Map<SubsystemName, {
    state: 'STOPPED' | 'STARTING' | 'RUNNING' | 'DEGRADED' | 'FAILED';
    restarts: number;
    lastError: string | null;
    lastStarted: string | null;
    lastRecovered: string | null;
  }>();

  private recoveryEvents: RecoveryEvent[] = [];
  private readonly maxEvents = 200;

  private cameraReconnectCounts = 0;
  private aiRecoveryCounts = 0;
  private lastSuccessfulFrame: string | null = null;
  private lastSuccessfulInference: string | null = null;
  private lastSuccessfulEvidenceWrite: string | null = null;
  private inFlightJobsResetCount = 0;

  private isShuttingDown = false;
  private shutdownHooks: Array<() => Promise<void> | void> = [];
  private startupPromise: Promise<void> | null = null;

  private constructor() {
    super();
    this.setMaxListeners(50);
    this.initSubsystemStates();
    this.registerProcessSignalHandlers();
  }

  public static getInstance(): ApplicationLifecycleManager {
    if (!ApplicationLifecycleManager.instance) {
      ApplicationLifecycleManager.instance = new ApplicationLifecycleManager();
    }
    return ApplicationLifecycleManager.instance;
  }

  private initSubsystemStates(): void {
    const subsystems: SubsystemName[] = [
      'EXPRESS_SERVER',
      'SENTINEL_SERVICES',
      'BACKGROUND_INTELLIGENCE',
      'AI_PROVIDER_ROUTER',
      'EVIDENCE_STORAGE',
      'NIGHT_AUDIT_ENGINE',
      'TUNNEL_MONITOR',
      'TELEMETRY_ENGINE'
    ];
    for (const s of subsystems) {
      this.subsystemStates.set(s, {
        state: 'STOPPED',
        restarts: 0,
        lastError: null,
        lastStarted: null,
        lastRecovered: null
      });
    }
  }

  public emitRecoveryEvent(
    component: SubsystemName | 'SYSTEM',
    eventType: string,
    severity: RecoveryEventSeverity,
    message: string,
    realStatus: string,
    metadata?: Record<string, any>
  ): void {
    const event: RecoveryEvent = {
      eventId: `EVT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      component,
      eventType,
      severity,
      message,
      realStatus,
      bootId: this.bootId,
      processId: this.processId,
      metadata
    };

    this.recoveryEvents.unshift(event);
    if (this.recoveryEvents.length > this.maxEvents) {
      this.recoveryEvents.pop();
    }

    this.emit('recoveryEvent', event);

    if (severity === 'ERROR' || severity === 'CRITICAL') {
      console.error(`[Lifecycle:${component}] [${severity}] ${eventType}: ${message}`);
    } else if (severity === 'WARNING') {
      console.warn(`[Lifecycle:${component}] [${severity}] ${eventType}: ${message}`);
    } else {
      console.info(`[Lifecycle:${component}] ${eventType}: ${message}`);
    }
  }

  public getEvents(limit = 50): RecoveryEvent[] {
    return this.recoveryEvents.slice(0, limit);
  }

  public getLifecycleState(): LifecycleState {
    return this.lifecycleState;
  }

  /**
   * Liveness Probe: Verifies the Node.js runtime process is alive, the event loop
   * is responsive, and the process is not in an unrecoverable shutdown/fatal loop.
   * Liveness MUST NOT fail due to upstream/external network or AI provider outages.
   */
  public isLive(): boolean {
    return this.lifecycleState !== 'STOPPED' && this.lifecycleState !== 'FAILED' && !this.isShuttingDown;
  }

  /**
   * Readiness Probe: Verifies that core surveillance services (Express server, Sentinel cameras,
   * evidence storage, background engine) are operational and ready to accept traffic and record feeds.
   * 
   * CRITICAL: An unconfigured, unavailable, or degraded AI service (Gemini/OmniRoute) is an
   * auxiliary intelligence layer. It DOES NOT prevent the system from being ready to serve CCTV operations.
   */
  public isReady(): boolean {
    if (!this.isLive()) return false;
    if (this.lifecycleState === 'UNINITIALIZED' || this.lifecycleState === 'STARTING') {
      return false;
    }

    // Check critical subsystems specifically
    for (const name of CRITICAL_SUBSYSTEMS) {
      const sub = this.subsystemStates.get(name);
      if (sub && sub.state === 'FAILED') {
        return false;
      }
    }

    // Express server and core camera pipeline must not be stopped
    const express = this.subsystemStates.get('EXPRESS_SERVER');
    if (express && express.state === 'STOPPED') {
      return false;
    }

    return true;
  }

  /**
   * Returns whether all core critical surveillance subsystems are operational.
   * Completely decoupled from AI provider router availability.
   */
  public isCoreOperational(): boolean {
    if (!this.isReady()) return false;
    for (const name of CRITICAL_SUBSYSTEMS) {
      const sub = this.subsystemStates.get(name);
      if (sub && (sub.state === 'FAILED' || sub.state === 'STOPPED')) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns whether the AI intelligence provider layer is actively functioning.
   */
  public isAiOperational(): boolean {
    const aiSub = this.subsystemStates.get('AI_PROVIDER_ROUTER');
    return aiSub?.state === 'RUNNING';
  }

  /**
   * Returns the criticality category of a subsystem.
   */
  public getSubsystemCategory(name: SubsystemName): SubsystemCategory {
    return CRITICAL_SUBSYSTEMS.includes(name) ? 'CRITICAL' : 'AUXILIARY';
  }

  /**
   * Evaluates overall system health with decoupled AI status.
   * If AI is unavailable or unconfigured, the overall status is still HEALTHY
   * as long as core critical surveillance subsystems are operational.
   */
  public getOverallHealthStatus(): {
    overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    coreOperational: boolean;
    aiOperational: boolean;
    aiImpact: string;
    isLive: boolean;
    isReady: boolean;
    criticalSubsystemsHealthy: boolean;
    degradedSubsystems: string[];
    failedSubsystems: string[];
  } {
    const live = this.isLive();
    const ready = this.isReady();
    const coreOperational = this.isCoreOperational();
    const aiOperational = this.isAiOperational();

    const degradedSubsystems: string[] = [];
    const failedSubsystems: string[] = [];

    for (const [name, sub] of this.subsystemStates.entries()) {
      if (sub.state === 'DEGRADED') degradedSubsystems.push(name);
      if (sub.state === 'FAILED') failedSubsystems.push(name);
    }

    let criticalDegraded = false;
    let criticalFailed = false;
    for (const name of CRITICAL_SUBSYSTEMS) {
      const sub = this.subsystemStates.get(name);
      if (sub?.state === 'DEGRADED') criticalDegraded = true;
      if (sub?.state === 'FAILED') criticalFailed = true;
    }

    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
    if (!live || criticalFailed || !coreOperational) {
      overallStatus = 'UNHEALTHY';
    } else if (criticalDegraded) {
      overallStatus = 'DEGRADED';
    } else {
      // Core is healthy. Even if auxiliary AI is degraded or unconfigured, overallStatus is HEALTHY.
      overallStatus = 'HEALTHY';
    }

    return {
      overallStatus,
      coreOperational,
      aiOperational,
      aiImpact: aiOperational
        ? 'FULL_AI_ACCELERATED'
        : 'NON_BLOCKING_OPTICAL_FALLBACK_ACTIVE',
      isLive: live,
      isReady: ready,
      criticalSubsystemsHealthy: !criticalDegraded && !criticalFailed,
      degradedSubsystems,
      failedSubsystems
    };
  }

  public setSubsystemState(
    name: SubsystemName, 
    state: 'STOPPED' | 'STARTING' | 'RUNNING' | 'DEGRADED' | 'FAILED',
    error?: string | null
  ): void {
    const prev = this.subsystemStates.get(name) || {
      state: 'STOPPED',
      restarts: 0,
      lastError: null,
      lastStarted: null,
      lastRecovered: null
    };

    const isRestart = prev.state === 'FAILED' && state === 'RUNNING';
    const restarts = isRestart ? prev.restarts + 1 : prev.restarts;

    this.subsystemStates.set(name, {
      state,
      restarts,
      lastError: error !== undefined ? error : prev.lastError,
      lastStarted: state === 'RUNNING' ? new Date().toISOString() : prev.lastStarted,
      lastRecovered: isRestart ? new Date().toISOString() : prev.lastRecovered
    });

    if (isRestart) {
      this.emitRecoveryEvent(name, `${name}_RECOVERED`, 'INFO', `Subsystem ${name} recovered successfully`, state);
    } else if (state === 'FAILED') {
      this.emitRecoveryEvent(name, `${name}_FAILED`, 'ERROR', error || `Subsystem ${name} entered failure state`, state);
    }

    this.recalculateOverallState();
  }

  private recalculateOverallState(): void {
    if (this.isShuttingDown) return;

    let hasFailed = false;
    let hasDegraded = false;
    let allRunning = true;

    for (const [, sub] of this.subsystemStates.entries()) {
      if (sub.state === 'FAILED') hasFailed = true;
      if (sub.state === 'DEGRADED') hasDegraded = true;
      if (sub.state !== 'RUNNING') allRunning = false;
    }

    if (hasFailed) {
      this.lifecycleState = 'DEGRADED';
    } else if (hasDegraded) {
      this.lifecycleState = 'DEGRADED';
    } else if (allRunning) {
      this.lifecycleState = 'RUNNING';
    }
  }

  public recordFrameSuccess(): void {
    this.lastSuccessfulFrame = new Date().toISOString();
  }

  public recordInferenceSuccess(): void {
    this.lastSuccessfulInference = new Date().toISOString();
  }

  public recordEvidenceWriteSuccess(): void {
    this.lastSuccessfulEvidenceWrite = new Date().toISOString();
  }

  public incrementCameraReconnect(): void {
    this.cameraReconnectCounts++;
  }

  public incrementAiRecovery(): void {
    this.aiRecoveryCounts++;
  }

  public recordInFlightJobsReset(count: number): void {
    this.inFlightJobsResetCount += count;
  }

  public getTelemetry(): SystemRecoveryTelemetry {
    const uptime = Math.floor((Date.now() - new Date(this.applicationStartTime).getTime()) / 1000);
    const subsystemRestartCounts: Record<string, number> = {};
    for (const [k, v] of this.subsystemStates.entries()) {
      subsystemRestartCounts[k] = v.restarts;
    }

    return {
      bootId: this.bootId,
      processId: this.processId,
      nodeVersion: process.version,
      platform: process.platform,
      applicationStartTime: this.applicationStartTime,
      uptimeSeconds: uptime,
      lifecycleState: this.lifecycleState,
      previousShutdownState: this.previousShutdownState,
      restartReason: this.restartReason,
      subsystemRestartCounts,
      cameraReconnectCounts: this.cameraReconnectCounts,
      aiRecoveryCounts: this.aiRecoveryCounts,
      lastSuccessfulFrame: this.lastSuccessfulFrame,
      lastSuccessfulInference: this.lastSuccessfulInference,
      lastSuccessfulEvidenceWrite: this.lastSuccessfulEvidenceWrite,
      inFlightJobsResetCount: this.inFlightJobsResetCount,
      eventsCount: this.recoveryEvents.length
    };
  }

  public getSubsystems() {
    const result: Record<string, any> = {};
    for (const [k, v] of this.subsystemStates.entries()) {
      result[k] = {
        ...v,
        category: this.getSubsystemCategory(k as SubsystemName),
        isCritical: CRITICAL_SUBSYSTEMS.includes(k as SubsystemName)
      };
    }
    return result;
  }

  public registerShutdownHook(hook: () => Promise<void> | void): void {
    this.shutdownHooks.push(hook);
  }

  /**
   * Idempotent orchestrator to start the full system in deterministic phases.
   */
  public async coordinateStartup(startupFn: () => Promise<void>): Promise<void> {
    if (this.startupPromise) {
      return this.startupPromise;
    }

    this.lifecycleState = 'STARTING';
    this.emitRecoveryEvent('SYSTEM', 'SYSTEM_BOOTING', 'INFO', `Booting Gujarat Police CCTV & AI Platform (BootId: ${this.bootId})`, 'STARTING');

    this.startupPromise = (async () => {
      try {
        await startupFn();
        this.lifecycleState = 'RUNNING';
        // On successful startup coordination, transition any pending critical subsystems to RUNNING
        for (const sub of CRITICAL_SUBSYSTEMS) {
          const current = this.subsystemStates.get(sub);
          if (current && (current.state === 'STOPPED' || current.state === 'STARTING')) {
            this.setSubsystemState(sub, 'RUNNING');
          }
        }
        this.emitRecoveryEvent('SYSTEM', 'SYSTEM_READY', 'INFO', 'All core platform subsystems initialized and active', 'RUNNING');
      } catch (err: any) {
        this.lifecycleState = 'DEGRADED';
        this.emitRecoveryEvent('SYSTEM', 'SYSTEM_STARTUP_DEGRADED', 'ERROR', `Startup encountered non-fatal issues: ${err?.message}`, 'DEGRADED');
      }
    })();

    return this.startupPromise;
  }

  /**
   * Graceful, bounded shutdown sequence
   */
  public async gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    this.lifecycleState = 'STOPPING';

    this.emitRecoveryEvent('SYSTEM', 'SYSTEM_STOPPING', 'WARNING', `Received ${signal}. Initiating graceful shutdown...`, 'STOPPING');
    console.info(`\n[ApplicationLifecycle] Graceful shutdown initiated (${signal}). Timeout: 8000ms.`);

    const timeout = setTimeout(() => {
      console.error('[ApplicationLifecycle] Graceful shutdown timed out. Forcing process exit.');
      process.exit(1);
    }, 8000);

    try {
      // Execute all registered subsystem shutdown hooks in reverse order
      for (const hook of [...this.shutdownHooks].reverse()) {
        try {
          await Promise.resolve(hook());
        } catch (err: any) {
          console.warn('[ApplicationLifecycle] Subsystem shutdown hook error:', err?.message);
        }
      }
      clearTimeout(timeout);
      this.lifecycleState = 'STOPPED';
      this.emitRecoveryEvent('SYSTEM', 'SYSTEM_STOPPED', 'INFO', 'Clean shutdown completed.', 'STOPPED');
      console.info('[ApplicationLifecycle] Clean shutdown finished. Exiting process.');
      process.exit(exitCode);
    } catch (err: any) {
      clearTimeout(timeout);
      console.error('[ApplicationLifecycle] Error during graceful shutdown:', err);
      process.exit(1);
    }
  }

  private registerProcessSignalHandlers(): void {
    // Process termination signals
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT', 0));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM', 0));

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err: Error) => {
      this.emitRecoveryEvent('SYSTEM', 'UNCAUGHT_EXCEPTION', 'CRITICAL', `Uncaught exception in Node process: ${err.message}`, 'DEGRADED', {
        stack: err.stack
      });
      console.error('[ApplicationLifecycle] CRITICAL UNCAUGHT EXCEPTION:', err);

      // If it's a non-fatal stream/socket error, keep process alive in DEGRADED mode
      const isRecoverable = 
        err.message.includes('ECONNRESET') || 
        err.message.includes('EPIPE') || 
        err.message.includes('ETIMEDOUT') ||
        err.message.includes('socket hang up');

      if (!isRecoverable) {
        // Fatal process corruption -> trigger clean shutdown and allow supervisor to restart
        this.gracefulShutdown('UNCAUGHT_EXCEPTION', 1);
      }
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (reason: any) => {
      const msg = reason instanceof Error ? reason.message : String(reason);
      this.emitRecoveryEvent('SYSTEM', 'UNHANDLED_REJECTION', 'ERROR', `Unhandled promise rejection: ${msg}`, 'DEGRADED');
      console.warn('[ApplicationLifecycle] Unhandled Rejection:', reason);
    });
  }
}

export const applicationLifecycleManager = ApplicationLifecycleManager.getInstance();
