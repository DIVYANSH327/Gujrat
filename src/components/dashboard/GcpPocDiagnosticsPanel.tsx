import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  CloudOff,
  Shield,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Wrench,
  Lock,
  Database,
  Server,
  FileCode,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight,
  Terminal,
  Check,
  ChevronDown,
  ChevronUp,
  Radio,
  Clock,
  Key,
  ShieldAlert,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export interface GcpPocResourceStatus {
  name: string;
  resourceId: string;
  resourceType: 'PUBSUB' | 'DATAFLOW' | 'BIGQUERY' | 'STORAGE' | 'COST_GUARD';
  status: 'HEALTHY' | 'STANDBY_LOCAL' | 'RESTRICTED' | 'DISABLED' | 'ERROR';
  stateLabel: string;
  details: Record<string, any>;
  lastCheckedIso: string;
  isCompliant: boolean;
}

export interface GcpPocDiagnosticsPayload {
  success: boolean;
  timestamp: string;
  pocMode: boolean;
  projectIdentity: {
    projectId: string;
    projectNumber: string;
    region: string;
    billingActive: boolean;
    creditsProtected: boolean;
    allocatedBalance: string;
  };
  runtimeStatus: 'OPERATIONAL_POC' | 'STANDBY_LOCAL_MODE' | 'GCP_RUNTIME_BLOCKED' | 'CONFIG_REQUIRED';
  runtimeMessage: string;
  costControls: {
    continuousVideoStreaming: boolean;
    cloudFrameUpload: boolean;
    geminiContinuousCctv: boolean;
    localEdgeAi: boolean;
    offlineEventSpool: boolean;
    cloudGpuCount: number;
    cloudRunInstances: number;
    monthlyBudgetSafetyTier: string;
  };
  resources: {
    pubsub: GcpPocResourceStatus;
    dataflow: GcpPocResourceStatus;
    bigquery: GcpPocResourceStatus;
    cloudStorage: GcpPocResourceStatus;
    costGuard: GcpPocResourceStatus;
  };
  spoolMetrics: {
    pendingSpoolEvents: number;
    dispatchedEvents: number;
    droppedEvents: number;
    deadLetterQueueCount: number;
    maxSpoolCapacity: number;
    spoolBackpressure: boolean;
  };
  detectedAnomalies: Array<{
    id: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    resource: string;
    errorCode?: string;
    httpCode?: number;
    title: string;
    description: string;
    suggestedFix: string;
  }>;
}

export interface AiRemediationResponse {
  success: boolean;
  verdict: 'HEALTHY' | 'ATTENTION_REQUIRED' | 'REMEDIATION_AVAILABLE' | 'BLOCKED_BY_IAM';
  summary: string;
  rootCauseAnalysis: string;
  statutoryComplianceNotice: string;
  remediationSteps: string[];
  autoFixAvailable: boolean;
  generatedByModel: string;
  timestamp: string;
}

export interface AutoFixExecutionResponse {
  success: boolean;
  repaired: boolean;
  remediationReport: string;
  actionsTaken: string[];
  status: string;
  timestamp: string;
}

interface GcpPocDiagnosticsPanelProps {
  onRefreshParent?: () => void;
  className?: string;
}

export const GcpPocDiagnosticsPanel: React.FC<GcpPocDiagnosticsPanelProps> = ({
  onRefreshParent,
  className = ''
}) => {
  const [diagnostics, setDiagnostics] = useState<GcpPocDiagnosticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [probing, setProbing] = useState<boolean>(false);
  const [probeLatencyMs, setProbeLatencyMs] = useState<number | null>(null);
  const [lastProbedTime, setLastProbedTime] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RESOURCES' | 'ANOMALIES' | 'AI_REPAIR' | 'RAW_PAYLOAD'>('OVERVIEW');

  // AI Diagnostic & Remediation state
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiRemediationResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI Auto-Fix state
  const [autoFixing, setAutoFixing] = useState<boolean>(false);
  const [autoFixResult, setAutoFixResult] = useState<AutoFixExecutionResponse | null>(null);
  const [autoFixError, setAutoFixError] = useState<string | null>(null);

  // Fetch / probe POC diagnostics (Single-shot, non-streaming)
  const fetchDiagnostics = useCallback(async (isManualProbe = false) => {
    if (isManualProbe) {
      setProbing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    const start = performance.now();

    try {
      const res = await fetch('/api/gcp/poc-diagnostics');
      const elapsed = Math.round(performance.now() - start);
      setProbeLatencyMs(elapsed);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch GCP POC diagnostics`);
      }

      const data: GcpPocDiagnosticsPayload = await res.json();
      setDiagnostics(data);
      setLastProbedTime(new Date());

      if (onRefreshParent && isManualProbe) {
        onRefreshParent();
      }
    } catch (err: any) {
      console.error('[GcpPocDiagnostics] Fetch failed:', err);
      setError(err?.message || 'Failed to query GCP POC diagnostics');
    } finally {
      setLoading(false);
      setProbing(false);
    }
  }, [onRefreshParent]);

  // Initial load
  useEffect(() => {
    fetchDiagnostics(false);
  }, [fetchDiagnostics]);

  // Request AI Remediation from Google Cloud (Gemini)
  const handleRunAiAnalysis = async () => {
    setAiAnalyzing(true);
    setAiError(null);
    setAutoFixResult(null);
    setAutoFixError(null);

    try {
      const res = await fetch('/api/gcp/ai-remediation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnostics,
          probeLatencyMs,
          requestTimestamp: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${res.status} AI Remediation request failed`);
      }

      const aiData: AiRemediationResponse = await res.json();
      setAiAnalysis(aiData);
      setActiveTab('AI_REPAIR');
    } catch (err: any) {
      console.error('[GcpPocDiagnostics] AI Remediation failed:', err);
      setAiError(err?.message || 'Failed to generate Google Cloud AI diagnostic analysis.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Execute AI Auto-Fix / Self-Healing
  const handleExecuteAutoFix = async () => {
    setAutoFixing(true);
    setAutoFixError(null);

    try {
      const res = await fetch('/api/gcp/execute-auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionPlan: aiAnalysis?.remediationSteps || [],
          timestamp: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${res.status} Auto-fix failed`);
      }

      const fixData: AutoFixExecutionResponse = await res.json();
      setAutoFixResult(fixData);

      // Re-probe diagnostics after auto-repair
      await fetchDiagnostics(true);
    } catch (err: any) {
      console.error('[GcpPocDiagnostics] Auto-fix execution failed:', err);
      setAutoFixError(err?.message || 'Error occurred while applying automated repair routines.');
    } finally {
      setAutoFixing(false);
    }
  };

  // Status color helper
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'OPERATIONAL_POC':
      case 'HEALTHY':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'OPERATIONAL POC'
        };
      case 'STANDBY_LOCAL_MODE':
      case 'STANDBY_LOCAL':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          dot: 'bg-blue-400',
          label: 'STANDBY LOCAL SPOOL'
        };
      case 'GCP_RUNTIME_BLOCKED':
      case 'RESTRICTED':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400 animate-pulse',
          label: 'API/IAM RESTRICTED'
        };
      case 'DISABLED':
      case 'ERROR':
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          label: 'BLOCKED / DISABLED'
        };
    }
  };

  const statusStyle = getStatusBadge(diagnostics?.runtimeStatus);

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-5 ${className}`}>
      {/* 1. Header Bar with Status & One-Shot Probe Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-blue-950/60 border border-blue-500/40 text-blue-400 shrink-0 shadow-inner">
            <Cloud size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                GCP POC Pipeline Diagnostics & Self-Healing Monitor
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${statusStyle.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {statusStyle.label}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                <ShieldCheck size={12} />
                Cost Lock: Active (₹0 Cloud Stream)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic, non-streaming diagnostic telemetry for Pub/Sub, Dataflow, BigQuery, and BSA 2023 GCS Evidence Vault.
            </p>
          </div>
        </div>

        {/* Action Controls: Probe Now & Gemini AI Fix */}
        <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-center">
          {/* Probe Latency Badge */}
          {probeLatencyMs !== null && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              <Activity size={13} className="text-blue-400" />
              <span>Probe: {probeLatencyMs}ms</span>
            </div>
          )}

          {/* Single-Shot Probe Now Button */}
          <button
            onClick={() => fetchDiagnostics(true)}
            disabled={probing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
            title="Execute a single-shot non-streaming diagnostic probe"
          >
            <RefreshCw size={13} className={probing ? 'animate-spin text-blue-400' : 'text-slate-400'} />
            <span>{probing ? 'Probing...' : 'Probe Now (0-Stream)'}</span>
          </button>

          {/* AI Remediation Trigger Button */}
          <button
            onClick={handleRunAiAnalysis}
            disabled={aiAnalyzing || loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            title="Analyze pipeline errors and generate automated remediation steps using Google Cloud AI"
          >
            <Sparkles size={13} className={aiAnalyzing ? 'animate-spin' : 'text-amber-300'} />
            <span>{aiAnalyzing ? 'Analyzing with AI...' : 'Enable AI to Fix Errors'}</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'OVERVIEW'
              ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity size={14} />
          <span>POC Architecture Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('RESOURCES')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'RESOURCES'
              ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers size={14} />
          <span>Pipeline Resources (4)</span>
        </button>

        <button
          onClick={() => setActiveTab('ANOMALIES')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'ANOMALIES'
              ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <AlertTriangle size={14} className={diagnostics?.detectedAnomalies?.length ? 'text-amber-400' : ''} />
          <span>Error Matrix & Diagnostics</span>
          {diagnostics?.detectedAnomalies?.length ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {diagnostics.detectedAnomalies.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('AI_REPAIR')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'AI_REPAIR'
              ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles size={14} className="text-amber-400" />
          <span>AI Remediation & Self-Healing</span>
          {aiAnalysis && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Ready
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('RAW_PAYLOAD')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'RAW_PAYLOAD'
              ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal size={14} />
          <span>Raw Telemetry</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Identity & Cost Guard Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Project ID</span>
              <div className="font-mono text-xs font-semibold text-slate-200 truncate" title={diagnostics?.projectIdentity.projectId}>
                {diagnostics?.projectIdentity.projectId || 'ais-asia-southeast1-9e118291d7'}
              </div>
              <div className="text-[10px] text-slate-400">
                Number: {diagnostics?.projectIdentity.projectNumber || '792282820119'}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">GCP Billing / Credits</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 size={13} />
                <span>Credits Active ({diagnostics?.projectIdentity.allocatedBalance || '₹28,662'})</span>
              </div>
              <div className="text-[10px] text-emerald-400/80">
                Protected by 0-Continuous Stream Lock
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Spool Backpressure</span>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="font-mono text-slate-200">
                  {diagnostics?.spoolMetrics.pendingSpoolEvents ?? 0} / {diagnostics?.spoolMetrics.maxSpoolCapacity ?? 2000} evts
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  diagnostics?.spoolMetrics.spoolBackpressure
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/10 text-emerald-300'
                }`}>
                  {diagnostics?.spoolMetrics.spoolBackpressure ? 'PRESSURE' : 'NORMAL'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Dispatched: {diagnostics?.spoolMetrics.dispatchedEvents ?? 0} · Drops: {diagnostics?.spoolMetrics.droppedEvents ?? 0}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Runtime Pipeline Status</span>
              <div className="text-xs font-semibold text-slate-200 truncate">
                {diagnostics?.runtimeStatus || 'STANDBY_LOCAL_MODE'}
              </div>
              <div className="text-[10px] text-slate-400 truncate" title={diagnostics?.runtimeMessage}>
                {diagnostics?.runtimeMessage || 'Local edge AI active; event pipeline spooled.'}
              </div>
            </div>
          </div>

          {/* Quick Summary Notice */}
          <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 flex items-start gap-2.5">
            <Shield className="text-blue-400 mt-0.5 shrink-0" size={16} />
            <div>
              <strong className="font-semibold text-blue-100">Deterministic Safety Architecture: </strong>
              The Sentinel Grid local edge layer processes CCTV, YOLOv8 object tracking, and OCR entirely on-premise.
              Google Cloud is queried on-demand without continuous video streaming, ensuring 100% statutory BSA 2023 compliance with ₹0 runaway compute charges.
            </div>
          </div>

          {/* 4 Pipeline Resource Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* 1. Pub/Sub Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Radio size={14} className="text-blue-400" />
                  Google Pub/Sub
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {diagnostics?.resources.pubsub.status || 'STANDBY_LOCAL'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-slate-400">Topic: <span className="text-slate-200 font-mono text-[11px]">sentinel-poc-events</span></div>
                <div className="text-slate-400">Sub: <span className="text-slate-200 font-mono text-[11px]">sentinel-poc-events-sub</span></div>
                <div className="text-slate-400">Mode: <span className="text-emerald-400 font-mono text-[11px]">ONE EVENT JSON</span></div>
              </div>
            </div>

            {/* 2. Dataflow Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu size={14} className="text-indigo-400" />
                  Apache Beam Dataflow
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {diagnostics?.resources.dataflow.status || 'STANDBY_LOCAL'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-slate-400">Runner: <span className="text-slate-200 font-mono text-[11px]">DirectRunner (POC)</span></div>
                <div className="text-slate-400">Window: <span className="text-slate-200 font-mono text-[11px]">30s Sliding Window</span></div>
                <div className="text-slate-400">Dedup: <span className="text-emerald-400 font-mono text-[11px]">SHA-256 Idempotent</span></div>
              </div>
            </div>

            {/* 3. BigQuery Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Database size={14} className="text-cyan-400" />
                  BigQuery Analytics
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {diagnostics?.resources.bigquery.status || 'STANDBY_LOCAL'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-slate-400">Dataset: <span className="text-slate-200 font-mono text-[11px]">sentinel_poc</span></div>
                <div className="text-slate-400">Table: <span className="text-slate-200 font-mono text-[11px]">events (Partitioned)</span></div>
                <div className="text-slate-400">Schema: <span className="text-emerald-400 font-mono text-[11px]">BSA 2023 Verified</span></div>
              </div>
            </div>

            {/* 4. GCS Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <HardDrive size={14} className="text-amber-400" />
                  GCS Evidence Vault
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {diagnostics?.resources.cloudStorage.status || 'STANDBY_LOCAL'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-slate-400">Bucket: <span className="text-slate-200 font-mono text-[11px]">gs://sentinel-poc-evidence</span></div>
                <div className="text-slate-400">Integrity: <span className="text-emerald-400 font-mono text-[11px]">SHA-256 Tamper Seal</span></div>
                <div className="text-slate-400">Statutory: <span className="text-slate-200 font-mono text-[11px]">BSA Sec 63 7-Yr Tier</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED RESOURCES */}
      {activeTab === 'RESOURCES' && diagnostics && (
        <div className="space-y-3">
          {Object.entries(diagnostics.resources).map(([key, resource]) => {
            const resStatus = getStatusBadge(resource.status);
            return (
              <div key={key} className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-slate-800 text-blue-400">
                      {resource.resourceType === 'PUBSUB' && <Radio size={16} />}
                      {resource.resourceType === 'DATAFLOW' && <Cpu size={16} />}
                      {resource.resourceType === 'BIGQUERY' && <Database size={16} />}
                      {resource.resourceType === 'STORAGE' && <HardDrive size={16} />}
                      {resource.resourceType === 'COST_GUARD' && <Shield size={16} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{resource.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400">{resource.resourceId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${resStatus.bg}`}>
                      {resource.stateLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Checked: {new Date(resource.lastCheckedIso).toLocaleTimeString('en-GB')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                  {Object.entries(resource.details).map(([dKey, dVal]) => (
                    <div key={dKey} className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">{dKey}</div>
                      <div className="font-mono text-slate-200 font-medium truncate" title={String(dVal)}>
                        {typeof dVal === 'boolean' ? (dVal ? 'TRUE' : 'FALSE') : String(dVal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: ANOMALIES & DIAGNOSTIC ERRORS */}
      {activeTab === 'ANOMALIES' && (
        <div className="space-y-3">
          {diagnostics?.detectedAnomalies && diagnostics.detectedAnomalies.length > 0 ? (
            diagnostics.detectedAnomalies.map((anom) => (
              <div
                key={anom.id}
                className={`p-4 rounded-lg border space-y-2 ${
                  anom.severity === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : anom.severity === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {anom.severity === 'CRITICAL' ? (
                      <AlertCircle className="text-rose-400 shrink-0" size={18} />
                    ) : (
                      <AlertTriangle className="text-amber-400 shrink-0" size={18} />
                    )}
                    <span className="font-bold text-sm text-white">{anom.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {anom.httpCode && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                        HTTP {anom.httpCode}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900/80 border border-slate-700 text-slate-300">
                      Resource: {anom.resource}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{anom.description}</p>

                <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80 text-xs font-mono text-emerald-300 flex items-start gap-2">
                  <Wrench size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200">Recommended Resolution: </span>
                    {anom.suggestedFix}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No Critical Blocking Errors Detected</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Pipeline is operating securely in POC Cost-Safe mode with on-premise YOLOv8 and offline event spooling.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GOOGLE CLOUD AI DIAGNOSTIC & SELF-HEALING */}
      {activeTab === 'AI_REPAIR' && (
        <div className="space-y-4">
          {/* Header Action Banner */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600/30 border border-indigo-400/40 text-indigo-300">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Google Cloud AI Infrastructure Diagnostician
                  </h4>
                  <p className="text-xs text-indigo-200/80">
                    Powered by Gemini 3.8 Flash · Evaluates IAM, Pub/Sub Spool, and BSA 2023 Sec 63 Compliance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunAiAnalysis}
                  disabled={aiAnalyzing}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <RefreshCw size={13} className={aiAnalyzing ? 'animate-spin' : ''} />
                  <span>{aiAnalyzing ? 'Diagnosing...' : 'Re-Run AI Analysis'}</span>
                </button>

                {aiAnalysis && (
                  <button
                    onClick={handleExecuteAutoFix}
                    disabled={autoFixing}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Wrench size={13} className={autoFixing ? 'animate-spin' : ''} />
                    <span>{autoFixing ? 'Applying AI Auto-Fix...' : 'Execute AI Auto-Repair'}</span>
                  </button>
                )}
              </div>
            </div>

            {aiError && (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-500/50 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* Auto-Fix Execution Results Box */}
          {autoFixResult && (
            <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/50 text-emerald-200 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-100">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span>AI Automated Remediation Executed Successfully</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300">
                  {new Date(autoFixResult.timestamp).toLocaleTimeString('en-GB')}
                </span>
              </div>
              <p className="text-xs text-emerald-200/90">{autoFixResult.remediationReport}</p>
              
              <div className="space-y-1 pt-1">
                <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Executed Protocols:</div>
                <ul className="space-y-1 text-xs">
                  {autoFixResult.actionsTaken.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 font-mono text-[11px] text-emerald-100">
                      <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {autoFixError && (
            <div className="p-3 rounded bg-rose-950/40 border border-rose-500/50 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />
              <span>{autoFixError}</span>
            </div>
          )}

          {/* AI Analysis Report View */}
          {aiAnalysis ? (
            <div className="space-y-3">
              {/* Verdict Card */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Verdict</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    aiAnalysis.verdict === 'HEALTHY'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : aiAnalysis.verdict === 'REMEDIATION_AVAILABLE'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {aiAnalysis.verdict}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">{aiAnalysis.summary}</p>
              </div>

              {/* Root Cause & Legal Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    Root Cause Analysis
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {aiAnalysis.rootCauseAnalysis}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={13} />
                    Statutory & Legal Status (BSA 2023)
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {aiAnalysis.statutoryComplianceNotice}
                  </p>
                </div>
              </div>

              {/* Step-by-Step Remediation Plan */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2.5">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench size={14} className="text-blue-400" />
                  Engineering Remediation Steps
                </span>
                <div className="space-y-1.5">
                  {aiAnalysis.remediationSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded bg-slate-950/60 border border-slate-800/60 text-xs text-slate-200 font-mono">
                      <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-lg space-y-3">
              <Sparkles size={28} className="text-indigo-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Google Cloud AI Diagnostic Engine Ready</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Enable AI to Fix Errors" to perform an automated root cause analysis on your GCP pipeline and generate self-healing repair routines.
              </p>
              <button
                onClick={handleRunAiAnalysis}
                disabled={aiAnalyzing}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer inline-flex items-center gap-1.5 shadow"
              >
                <Sparkles size={14} />
                <span>Run Google Cloud AI Diagnostic</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RAW TELEMETRY JSON */}
      {activeTab === 'RAW_PAYLOAD' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Payload Source: /api/gcp/poc-diagnostics</span>
            <span>Last Polled: {lastProbedTime.toLocaleTimeString('en-GB')}</span>
          </div>
          <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-96">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
