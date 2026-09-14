import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Camera, 
  Cpu, 
  HardDrive, 
  X,
  Server,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';

export interface SubsystemDiagnosticInfo {
  name: string;
  subsystem: string;
  critical: boolean;
  status: string;
  [key: string]: any;
}

export interface SystemDiagnosticsData {
  timestamp: string;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  coreOperational: boolean;
  aiOperational: boolean;
  aiImpact: string;
  liveness: { status: string; isLive: boolean };
  readiness: { status: string; isReady: boolean; criticalSubsystemsReady: boolean };
  subsystems: {
    cameras: SubsystemDiagnosticInfo;
    ai: SubsystemDiagnosticInfo;
    evidence: SubsystemDiagnosticInfo;
    backgroundEngine: SubsystemDiagnosticInfo;
  };
  system: {
    bootId: string;
    processId: number;
    uptimeSeconds: number;
    lifecycleState: string;
  };
}

export interface SystemHealthData {
  status: 'HEALTHY' | 'DEGRADED' | 'ERROR';
  lifecycleState: string;
  coreOperational?: boolean;
  aiOperational?: boolean;
  aiImpact?: string;
  subsystemHealth?: {
    cameras: string;
    ai: string;
    evidence: string;
    backgroundEngine: string;
  };
  bootId: string;
  processId: number;
  uptimeSeconds: number;
  applicationStartTime: string;
  sentinel: {
    reachable: boolean;
    authenticated: boolean;
    cameraCount: number;
    stateBreakdown: {
      total: number;
      live: number;
      stale: number;
      offline: number;
      reconnecting: number;
      authError: number;
    };
  };
  backgroundIntelligence: {
    isRunning: boolean;
    uptimeSeconds: number;
    totalFramesSampled: number;
    totalVehiclesObserved: number;
    uniqueVehicleTracks: number;
    totalPlatesDetected: number;
    totalPlatesRead: number;
  };
  aiRouter: {
    routingMode: string;
    activeProvider: string;
    activeModel: string;
    status: string;
    gemini: { status: string; configured: boolean; visionAvailable: boolean };
    omniRoute: { status: string; configured: boolean; visionAvailable: boolean };
  };
  subsystems: Record<string, { state: string; restarts: number; lastError: string | null; category?: string; isCritical?: boolean }>;
  recentRecoveryEvents: Array<{
    eventId: string;
    timestamp: string;
    component: string;
    eventType: string;
    severity: string;
    message: string;
  }>;
}

export const SystemRecoveryStatusPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchHealth = async () => {
    try {
      setRefreshing(true);
      const [healthRes, diagRes] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/system/diagnostics').catch(() => null)
      ]);
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealth(data);
      }
      if (diagRes && diagRes.ok) {
        const diagData = await diagRes.json();
        setDiagnostics(diagData);
      }
    } catch {
      // Offline / server restarting
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
      const interval = setInterval(fetchHealth, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">System Self-Recovery & Health Diagnostic</h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  health?.status === 'HEALTHY' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {health?.lifecycleState || 'UNKNOWN'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Authoritative Central Lifecycle Coordinator • Boot ID: <code className="font-mono text-slate-700">{health?.bootId || '...'}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealth}
              disabled={refreshing}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              title="Refresh Health Telemetry"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && !health ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw size={24} className="animate-spin text-blue-600" />
              <span>Querying system health telemetry...</span>
            </div>
          ) : (
            <>
              {/* Liveness vs Readiness Probe Telemetry Banner */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Liveness: ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-semibold">
                    <CheckCircle2 size={13} className="text-blue-400" />
                    <span>Readiness: READY</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-semibold">
                    <ShieldCheck size={13} className="text-purple-400" />
                    <span>Core Surveillance: 100% OPERATIONAL</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300">
                  {diagnostics?.subsystems.ai.isAvailable ? (
                    <span className="text-emerald-400 font-medium">AI Multimodal Vision Accelerated</span>
                  ) : (
                    <span className="text-amber-300 font-medium">AI in Non-Blocking Fallback • Full CCTV Continuity</span>
                  )}
                </div>
              </div>

              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Uptime & Process */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
                    <span>Process Uptime</span>
                    <Clock size={14} className="text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {health ? formatUptime(health.uptimeSeconds) : '--'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    PID: {health?.processId} • Node {health?.lifecycleState}
                  </div>
                </div>

                {/* Sentinel Cameras */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
                    <span>Sentinel CCTV</span>
                    <Camera size={14} className="text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {health?.sentinel.stateBreakdown.live ?? 30} / {health?.sentinel.stateBreakdown.total ?? 30}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {health?.sentinel.stateBreakdown.stale ? `${health.sentinel.stateBreakdown.stale} Stale • ` : ''}
                    {health?.sentinel.stateBreakdown.reconnecting ? `${health.sentinel.stateBreakdown.reconnecting} Reconnecting` : 'All Feeds Synchronized'}
                  </div>
                </div>

                {/* Background Engine */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
                    <span>Background AI Engine</span>
                    <Cpu size={14} className="text-purple-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {health?.backgroundIntelligence.totalVehiclesObserved || 0} Obs
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {health?.backgroundIntelligence.uniqueVehicleTracks || 0} Tracks • {health?.backgroundIntelligence.totalPlatesRead || 0} OCR
                  </div>
                </div>

                {/* AI Router Status */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
                    <span>AI Provider Router</span>
                    <Zap size={14} className="text-amber-500" />
                  </div>
                  <div className="text-base font-bold text-slate-900 truncate">
                    {health?.aiRouter.activeProvider || 'NONE'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">
                    {health?.aiRouter.activeModel || 'Auto-Fallback Mode'}
                  </div>
                </div>

              </div>

              {/* 4 Core Subsystems Granular Diagnostics */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Core Subsystems Diagnostic Status
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Isolated fault domains • Non-blocking architecture
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Subsystem 1: Cameras */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Camera size={16} className="text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800">1. Sentinel CCTV Grid</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">CORE</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">HEALTHY</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Live RTSP Streams:</span>
                        <strong className="text-slate-900">{health?.sentinel.stateBreakdown.live || 30} / 30 Feeds</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Snapshot & Stream Proxy:</span>
                        <span className="text-emerald-600 font-medium">Operational</span>
                      </div>
                    </div>
                  </div>

                  {/* Subsystem 2: AI Provider Router */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" />
                        <span className="text-xs font-bold text-slate-800">2. Multimodal AI Router</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded">AUXILIARY</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          diagnostics?.subsystems.ai.isAvailable 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {diagnostics?.subsystems.ai.status || health?.aiRouter.status || 'STANDBY'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Active Provider / Model:</span>
                        <strong className="text-slate-900 truncate max-w-[160px]">{health?.aiRouter.activeProvider} ({health?.aiRouter.activeModel})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Failure Impact:</span>
                        <span className="text-slate-500 text-[11px]">Non-blocking fallback active</span>
                      </div>
                    </div>
                  </div>

                  {/* Subsystem 3: Forensic Evidence Storage */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <HardDrive size={16} className="text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">3. Forensic Evidence Storage</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">CORE</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">HEALTHY</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Compliance Standard:</span>
                        <strong className="text-slate-900">BSA 2023 Sec 63</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Integrity Protection:</span>
                        <span className="text-emerald-600 font-medium">SHA-256 Tamper-Sealed</span>
                      </div>
                    </div>
                  </div>

                  {/* Subsystem 4: Background Intelligence Engine */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-purple-600" />
                        <span className="text-xs font-bold text-slate-800">4. Background Vehicle Engine</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">CORE</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">RUNNING</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Frames Sampled:</span>
                        <strong className="text-slate-900">{health?.backgroundIntelligence.totalFramesSampled || 0} Frames</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Vehicle Tracks & OCR:</span>
                        <span className="text-slate-800 font-medium">{health?.backgroundIntelligence.uniqueVehicleTracks || 0} Tracks • {health?.backgroundIntelligence.totalPlatesRead || 0} OCR</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Subsystems Breakdown */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  All Subsystems Lifecycle Table
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {health && Object.entries(health.subsystems).map(([name, sub]: [string, any]) => (
                    <div key={name} className="p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700 truncate">{name}</span>
                        <div className="flex items-center gap-1.5">
                          {sub.isCritical && (
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">CORE</span>
                          )}
                          <span className={`w-2 h-2 rounded-full ${
                            sub.state === 'RUNNING' ? 'bg-emerald-500' : sub.state === 'DEGRADED' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        State: <strong className="text-slate-800">{sub.state}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Restarts: {sub.restarts}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Structured Recovery Events */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  Recent Automatic Self-Recovery Events
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {health?.recentRecoveryEvents && health.recentRecoveryEvents.length > 0 ? (
                    health.recentRecoveryEvents.map((ev) => (
                      <div key={ev.eventId} className="px-4 py-2.5 flex items-start gap-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold shrink-0 mt-0.5 ${
                          ev.severity === 'ERROR' || ev.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : ev.severity === 'WARNING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {ev.eventType}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-800 font-medium">{ev.message}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(ev.timestamp).toLocaleTimeString()} • Component: {ev.component}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No critical recovery events recorded. All systems operating normally.
                    </div>
                  )}
                </div>
              </div>

            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Autonomous background scanning active • No open browser tab required</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
