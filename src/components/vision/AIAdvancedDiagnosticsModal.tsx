import React from 'react';
import { 
  X, 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  ShieldCheck,
  Server,
  Layers,
  Database
} from 'lucide-react';
import { SystemHardwareTelemetry } from '../../services/server/HardwareTelemetryService';

export interface AuditStep {
  step: number;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  details?: string;
  durationMs?: number;
}

interface AIAdvancedDiagnosticsModalProps {
  onClose: () => void;
  telemetry: SystemHardwareTelemetry | null;
  auditSteps: AuditStep[];
  isAuditing: boolean;
  onRunAudit: () => void;
  auditSummary?: {
    passed: number;
    total: number;
    isClean: boolean;
  } | null;
}

export const AIAdvancedDiagnosticsModal: React.FC<AIAdvancedDiagnosticsModalProps> = ({
  onClose,
  telemetry,
  auditSteps,
  isAuditing,
  onRunAudit,
  auditSummary
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Advanced AI Diagnostics & Forensic Audit
              </h2>
              <p className="text-xs text-slate-500">
                Low-level engine diagnostics, worker telemetry, and 12-step zero-simulation chain-of-custody test.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Hardware & System Worker Telemetry */}
        {telemetry && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Server size={14} className="text-blue-600" />
                Live Node Telemetry
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {telemetry.healthStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">CPU Core Load</div>
                <div className="font-bold text-slate-900 mt-0.5">{telemetry.cpu.utilizationPercent}%</div>
                <div className="text-[10px] text-slate-400">{telemetry.cpu.cores} Cores</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Memory Used</div>
                <div className="font-bold text-slate-900 mt-0.5">{telemetry.memory.utilizationPercent}%</div>
                <div className="text-[10px] text-slate-400">{telemetry.memory.usedMb} / {telemetry.memory.totalMb} MB</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">GPU Acceleration</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {telemetry.gpu.available ? `${telemetry.gpu.model}` : 'N/A (CPU Mode)'}
                </div>
                <div className="text-[10px] text-slate-400">{telemetry.gpu.status}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Worker Threads</div>
                <div className="font-bold text-slate-900 mt-0.5">{telemetry.workerPool.activeWorkers} Active</div>
                <div className="text-[10px] text-slate-400">{telemetry.workerPool.queueDepth} in Queue</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. 12-Step Forensic Zero-Simulation Audit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                12-Step Zero-Simulation Forensic Verification Audit
              </h3>
              <p className="text-xs text-slate-500">
                End-to-end verification proving real pixel capture, SHA-256 hash generation, and legal evidence sealing.
              </p>
            </div>

            <button
              type="button"
              onClick={onRunAudit}
              disabled={isAuditing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isAuditing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>{isAuditing ? 'Running Audit...' : 'Run Audit Test'}</span>
            </button>
          </div>

          {/* Audit Results Summary */}
          {auditSummary && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              auditSummary.isClean 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Audit Passed: {auditSummary.passed} / {auditSummary.total} Checks Passed</span>
              </div>
              <span className="uppercase text-[10px] px-2 py-0.5 bg-white/80 rounded border">
                {auditSummary.isClean ? '100% REAL SOURCE OF TRUTH' : 'ATTENTION REQUIRED'}
              </span>
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto custom-scrollbar">
            {auditSteps.map((step) => {
              const isPassed = step.status === 'PASSED';
              const isRunning = step.status === 'RUNNING';
              const isFailed = step.status === 'FAILED';

              return (
                <div
                  key={step.step}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isPassed
                        ? 'bg-emerald-500 text-white'
                        : isRunning
                        ? 'bg-blue-600 text-white animate-spin'
                        : isFailed
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPassed ? '✓' : step.step}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {step.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {step.durationMs && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {step.durationMs}ms
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : isRunning
                        ? 'bg-blue-100 text-blue-800'
                        : isFailed
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
