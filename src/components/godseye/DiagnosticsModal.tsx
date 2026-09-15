/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * DiagnosticsModal: Command Center System & AI Diagnostic/Auto-Repair Agent
 * Real Telemetry, Gemini 3.8 Flash Root-Cause Diagnosis, and 1-Click Autonomous Self-Healing.
 */

import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  Cpu, 
  Sparkles, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Radio, 
  Terminal,
  Zap,
  Server
} from 'lucide-react';
import { SentinelCameraLocation } from './types';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: SentinelCameraLocation[];
  onRefreshCameras: () => void;
}

export function DiagnosticsModal({
  isOpen,
  onClose,
  cameras,
  onRefreshCameras
}: DiagnosticsModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [repairResult, setRepairResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const onlineCount = cameras.filter(c => c.status === 'LIVE').length;
  const mappedCount = cameras.filter(c => c.latitude && c.longitude && c.hasCoordinates).length;

  const handleRunAiDiagnostics = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/sentinel/diagnostics/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: {
            totalCameras: cameras.length,
            online: onlineCount,
            mapped: mappedCount,
            timestamp: new Date().toISOString()
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diagnostic request failed');
      setAiReport(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI Diagnostic analysis error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAutoRepair = async () => {
    setIsRepairing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/sentinel/diagnostics/ai-repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auto-repair execution failed');
      setRepairResult(data);
      onRefreshCameras();
    } catch (err: any) {
      setErrorMsg(err.message || 'Auto-repair error');
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                ENGINEER & AI SYSTEM DIAGNOSTICS
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Hardware Telemetry, ML Engine & Autonomous Self-Repair Agent
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-[#F6F8FB]/50">
          {/* Quick Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Active Streams</span>
              <span className="text-sm font-bold text-emerald-600 font-mono">
                {onlineCount} / {cameras.length} Nodes
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">GIS Coverage</span>
              <span className="text-sm font-bold text-blue-600 font-mono">
                {mappedCount} Verified
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">AI Inference</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                YOLOv8 + Gemini
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Edge Pipeline</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                25 FPS • 2.0 Mbps
              </span>
            </div>
          </div>

          {/* AI Diagnostic & Auto-Repair Agent Box */}
          <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  Gemini Diagnostic & Self-Healing Agent
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                models/gemini-3.8-flash
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Autonomous AI agent monitors RTSP/HLS stream health, gateway credentials, and GIS coordinate integrity to automatically diagnose bottlenecks and apply self-healing fixes.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleRunAiDiagnostics}
                disabled={isAnalyzing}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Telemetry...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Root-Cause Diagnostic</span>
                  </>
                )}
              </button>

              <button
                onClick={handleRunAutoRepair}
                disabled={isRepairing}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                {isRepairing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Self-Healing Protocols...</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Autonomous Auto-Repair & Re-Sync</span>
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* AI Diagnostic Output */}
            {aiReport && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-slate-800">
                    AI Diagnostic Verdict: {aiReport.overallHealth}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(aiReport.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-700 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {aiReport.analysis}
                </div>
              </div>
            )}

            {/* Auto-Repair Report */}
            {repairResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{repairResult.remediationReport}</span>
                </div>
                <ul className="list-disc list-inside text-emerald-900 text-[11px] space-y-1">
                  {repairResult.actionsTaken?.map((action: string, i: number) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Gujarat Police SCADA • Edge Node Watchdog Active</span>
          <button
            onClick={onClose}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
