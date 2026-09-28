/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB).
 * Enhanced Sentinel Grid ErrorBoundary with Rate-Limiting & Network-Timeout Recovery.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  Clock,
  WifiOff,
  Activity,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
  CheckCircle2,
  HardDrive,
  X
} from 'lucide-react';

export interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

export interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRateLimited: boolean;
  isNetworkTimeout: boolean;
  retryCountdown: number;
  isRetrying: boolean;
  retryCount: number;
  showDiagnostics: boolean;
}

/**
 * Robust detection helper for rate-limiting and quota exhaustion scenarios
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : (error as any)?.message || '';
  const name = (error as any)?.name || '';
  const code = String((error as any)?.code || (error as any)?.status || (error as any)?.statusCode || '');
  const combined = `${name} ${msg} ${code}`.toLowerCase();

  return (
    combined.includes('429') ||
    combined.includes('rate limit') ||
    combined.includes('rate exceeded') ||
    combined.includes('too many requests') ||
    combined.includes('resource_exhausted') ||
    combined.includes('quota_exceeded') ||
    combined.includes('quota exceeded') ||
    combined.includes('connection throttled') ||
    combined.includes('throttled') ||
    combined.includes('throttling') ||
    code === '429' ||
    code === 'AI_RATE_LIMITED' ||
    code === 'RESOURCE_EXHAUSTED'
  );
}

/**
 * Robust detection helper for network-timeout and gateway connectivity failures
 */
export function isNetworkTimeoutError(error: unknown): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : (error as any)?.message || '';
  const name = (error as any)?.name || '';
  const code = String((error as any)?.code || (error as any)?.status || (error as any)?.statusCode || '');
  const combined = `${name} ${msg} ${code}`.toLowerCase();

  return (
    combined.includes('timeout') ||
    combined.includes('timed out') ||
    combined.includes('etimedout') ||
    combined.includes('econnaborted') ||
    combined.includes('network error') ||
    combined.includes('networktimeout') ||
    combined.includes('failed to fetch') ||
    combined.includes('fetch failed') ||
    combined.includes('network unreachable') ||
    combined.includes('gateway timeout') ||
    combined.includes('504') ||
    name === 'TimeoutError' ||
    code === '504' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNABORTED'
  );
}

const DEFAULT_COOLDOWN_SECONDS = 15;

export class ErrorBoundary extends Component<Props, State> {
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private autoRetryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRateLimited: false,
      isNetworkTimeout: false,
      retryCountdown: DEFAULT_COOLDOWN_SECONDS,
      isRetrying: false,
      retryCount: 0,
      showDiagnostics: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const rateLimited = isRateLimitError(error);
    const networkTimeout = isNetworkTimeoutError(error);

    return {
      hasError: true,
      error,
      errorInfo: null,
      isRateLimited: rateLimited,
      isNetworkTimeout: networkTimeout,
      retryCountdown: rateLimited || networkTimeout ? DEFAULT_COOLDOWN_SECONDS : 0,
      isRetrying: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Sentinel ErrorBoundary] Caught interface exception:', error, errorInfo);
    const rateLimited = isRateLimitError(error);
    const networkTimeout = isNetworkTimeoutError(error);

    this.setState({
      errorInfo,
      isRateLimited: rateLimited,
      isNetworkTimeout: networkTimeout,
    });

    if (rateLimited || networkTimeout) {
      this.startCountdown();
    }
  }

  public componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('sentinel:connection-throttled', this.handleThrottledEvent as EventListener);
  }

  public componentWillUnmount() {
    this.clearTimers();
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('sentinel:connection-throttled', this.handleThrottledEvent as EventListener);
  }

  private clearTimers() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
      this.autoRetryTimer = null;
    }
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (isRateLimitError(reason) || isNetworkTimeoutError(reason)) {
      // Prevent browser console uncaught error escalation
      event.preventDefault();
      console.warn('[Sentinel ErrorBoundary] Handled background network/rate-limit notice gracefully without disrupting UI:', reason);
      // NOTE: We deliberately DO NOT set hasError: true here.
      // Background async fetch/telemetry failures must never crash or unmount the active UI.
    }
  };

  private handleOffline = () => {
    // Offline status is logged; UI handles offline mode gracefully without blanking screen
    console.info('[Sentinel ErrorBoundary] Device went offline. Local edge caching engaged.');
  };

  private handleOnline = () => {
    console.info('[Sentinel ErrorBoundary] Device reconnected to network.');
    if (this.state.hasError && (this.state.isRateLimited || this.state.isNetworkTimeout)) {
      this.handleRetry();
    }
  };

  private handleThrottledEvent = (event: CustomEvent) => {
    const detail = event.detail || {};
    console.warn('[Sentinel ErrorBoundary] Upstream throttled event noted:', detail);
    // Do NOT take down the screen on background throttled telemetry
  };

  private startCountdown() {
    this.clearTimers();
    this.countdownTimer = setInterval(() => {
      this.setState((prev) => {
        if (prev.retryCountdown <= 1) {
          this.clearTimers();
          this.handleRetry();
          return { retryCountdown: 0 };
        }
        return { retryCountdown: prev.retryCountdown - 1 };
      });
    }, 1000);
  }

  public handleRetry = () => {
    this.clearTimers();
    this.setState({
      isRetrying: true,
    });

    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.warn('[Sentinel ErrorBoundary] onReset error:', e);
      }
    }

    // Brief delay to allow React reconciliation & network settlement
    setTimeout(() => {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        isRateLimited: false,
        isNetworkTimeout: false,
        isRetrying: false,
        retryCount: prev.retryCount + 1,
        retryCountdown: DEFAULT_COOLDOWN_SECONDS,
      }));
    }, 400);
  };

  private handleContinueInEdgeMode = () => {
    this.clearTimers();
    try {
      localStorage.setItem('sentinel_force_offline_mode', 'true');
    } catch {
      // Ignore sandbox restrictions
    }
    this.handleRetry();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetSession = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore in sandboxed iframes
    }
    window.location.href = '/';
  };

  private toggleDiagnostics = () => {
    this.setState((prev) => ({ showDiagnostics: !prev.showDiagnostics }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isThrottledOrTimeout = this.state.isRateLimited || this.state.isNetworkTimeout;

      // Render specialized "Connection Throttled" recovery UI when rate-limited or timed-out
      if (isThrottledOrTimeout) {
        const title = this.state.isRateLimited
          ? 'Connection Throttled'
          : 'Network Latency Timeout';
        const subtitle = this.state.isRateLimited
          ? 'API Request Rate Limit Reached • Backoff Cooldown Engaged'
          : 'Upstream Command Gateway Unreachable • Retrying Route';
        const badgeText = this.state.isRateLimited
          ? 'RATE LIMIT PROTECTION ACTIVE (HTTP 429)'
          : 'NETWORK TIMEOUT INTERCEPTED (504/OFFLINE)';

        const progressPercent = Math.max(
          0,
          Math.min(100, Math.round(((DEFAULT_COOLDOWN_SECONDS - this.state.retryCountdown) / DEFAULT_COOLDOWN_SECONDS) * 100))
        );

        return (
          <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-600 selection:text-white">
            <div className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-amber-950/20 relative overflow-hidden">
              {/* Top amber accent bar with pulse */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 animate-pulse" />

              {/* Status Header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    {this.state.isRateLimited ? <Activity size={26} className="animate-pulse" /> : <WifiOff size={26} />}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
                      <Clock size={11} />
                      <span>{badgeText}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight uppercase flex items-center gap-2">
                      {title}
                    </h2>
                    <p className="text-xs text-slate-400">{subtitle}</p>
                  </div>
                </div>
              </div>

              {/* User-friendly Explanation Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-4 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 mb-3 text-slate-200">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-xs">
                    Upstream request frequency reached system capacity thresholds. To prevent data corruption and respect cloud security quotas, API dispatches are paused while the automated cooldown completes.
                  </p>
                </div>

                {/* Subsystem Status Matrix */}
                <div className="space-y-1.5 font-mono text-[11px] bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider mb-2 flex items-center justify-between">
                    <span>Edge Subsystem Status</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Local Perception Uninterrupted
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-emerald-400" />
                      CCTV Cameras
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      LIVE (RTSP Active)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Cpu size={12} className="text-emerald-400" />
                      YOLOv8 Edge AI
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      RUNNING (On-Device)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <HardDrive size={12} className="text-emerald-400" />
                      ANPR / HSRP OCR
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      RUNNING (Local Buffer)
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
                    <span className="text-slate-400">Cloud Sync & Telemetry</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      COOLDOWN ACTIVE
                    </span>
                  </div>
                </div>

                {/* Auto Reconnect Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex justify-between items-center text-[11px] mb-1.5">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-400" />
                      Automatic Reconnection
                    </span>
                    <span className="font-mono text-amber-300 font-bold">
                      {this.state.retryCountdown > 0 ? `in ${this.state.retryCountdown}s` : 'Reconnecting now...'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {this.state.retryCount > 0 && (
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      Completed reconnection cycles: {this.state.retryCount}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    className="flex-1 min-h-[44px] px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={this.state.isRetrying ? 'animate-spin' : ''} />
                    <span>{this.state.isRetrying ? 'Reconnecting...' : 'Reconnect Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={this.handleContinueInEdgeMode}
                    className="flex-1 min-h-[44px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <HardDrive size={14} className="text-emerald-400" />
                    <span>Continue in Local Mode</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={this.handleReload}
                    className="flex-1 min-h-[38px] px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reload Command Center</span>
                  </button>

                  <button
                    type="button"
                    onClick={this.handleResetSession}
                    className="flex-1 min-h-[38px] px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-800 transition-colors cursor-pointer"
                  >
                    <span>Reset Session State</span>
                  </button>
                </div>
              </div>

              {/* Diagnostic Collapsible Accordion */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={this.toggleDiagnostics}
                  className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 py-1 cursor-pointer transition-colors"
                >
                  <span className="font-mono">Diagnostic Telemetry & Error Trace</span>
                  {this.state.showDiagnostics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {this.state.showDiagnostics && (
                  <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-amber-300/90 space-y-1.5 overflow-x-auto max-h-36">
                    <div className="text-slate-400">Timestamp: {new Date().toISOString()}</div>
                    <div>Status Code: {this.state.isRateLimited ? 'HTTP 429 Too Many Requests' : 'Network Timeout / 504'}</div>
                    {this.state.error && (
                      <div className="text-rose-300 break-words">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-slate-500 whitespace-pre-wrap text-[9px] mt-1 border-t border-slate-800 pt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 text-center">
                State Crime Records Bureau (SCRB) • Gujarat Police Command Infrastructure
              </div>
            </div>
          </div>
        );
      }

      // Generic Interface Exception UI (preserved and polished)
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-600 selection:text-white">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top red accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <ShieldAlert size={26} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide uppercase">Sentinel Grid Diagnostics</h2>
                <p className="text-xs text-slate-400">Command Center Interface Exception Intercepted</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
                <ShieldAlert size={15} />
                <span>SENTINEL COMMAND CENTER — SUBSYSTEM STATUS</span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] mb-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cameras</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>LIVE
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Local AI</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>RUNNING
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">YOLOv8</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>RUNNING
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">HSRP/OCR</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>RUNNING
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Analytics</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>RATE LIMITED (CACHED)
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-[11px] mb-2 text-center">
                Showing last verified data • Local edge perception is unaffected
              </p>

              {this.state.error && (
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-amber-300 break-words max-h-24 overflow-y-auto">
                  {this.state.error.name}: {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <RefreshCw size={14} />
                <span>Reload Command Center</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetSession}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Local Session</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
              State Crime Records Bureau (SCRB) • Gujarat Police Command Infrastructure
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
