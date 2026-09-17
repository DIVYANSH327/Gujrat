/**
 * SystemPerformancePanel.tsx
 * Real Hardware Telemetry, Progress Bars & Workload Distribution
 * Gujarat Police AI CCTV Intelligence Platform — Sentinel Grid
 */

import React from 'react';
import { Cpu, HardDrive, Zap, Activity, Radio, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SystemHardwareTelemetry } from '../../services/server/HardwareTelemetryService';

interface SystemPerformancePanelProps {
  telemetry: SystemHardwareTelemetry | null;
  loading?: boolean;
}

export const SystemPerformancePanel: React.FC<SystemPerformancePanelProps> = ({ telemetry, loading = false }) => {
  if (loading || !telemetry) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-48 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
        </div>
      </div>
    );
  }

  const { gpu, cpu, memory, workerPool, architecturalScale } = telemetry;
  const isGpuActive = gpu.available && gpu.status === 'ACTIVE';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">SYSTEM PERFORMANCE</h3>
            <p className="text-xs text-slate-500">Live Hardware Telemetry & Bound Worker Allocation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            telemetry.healthStatus === 'HEALTHY' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              telemetry.healthStatus === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`} />
            {telemetry.healthStatus}
          </span>
        </div>
      </div>

      {/* Primary Hardware Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU Utilization Bar */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Cpu size={14} className="text-slate-500" />
              CPU Utilization ({cpu.cores} Cores)
            </span>
            <span className="font-mono font-bold text-slate-900">{cpu.utilizationPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                cpu.utilizationPercent > 80 ? 'bg-rose-500' : cpu.utilizationPercent > 60 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, cpu.utilizationPercent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="truncate max-w-[200px]">{cpu.model}</span>
            <span>Load: {cpu.loadAverage1m} (1m)</span>
          </div>
        </div>

        {/* GPU Utilization Bar */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Zap size={14} className={isGpuActive ? "text-purple-600" : "text-slate-400"} />
              GPU Utilization
            </span>
            <span className="font-mono font-bold text-slate-900">
              {isGpuActive && gpu.utilizationPercent !== null ? `${gpu.utilizationPercent}%` : 'N/A (CPU Mode)'}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isGpuActive ? 'bg-purple-600' : 'bg-slate-300'
              }`}
              style={{ width: `${isGpuActive && gpu.utilizationPercent !== null ? gpu.utilizationPercent : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>{isGpuActive ? `${gpu.vendor} ${gpu.model}` : 'Hardware: Cloud Run CPU Host'}</span>
            <span>{isGpuActive ? `${gpu.memoryUsedMb} / ${gpu.memoryTotalMb} MB` : 'GPU Inactive'}</span>
          </div>
        </div>

        {/* RAM Usage Bar */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <HardDrive size={14} className="text-slate-500" />
              RAM Memory ({memory.usedMb} / {memory.totalMb} MB)
            </span>
            <span className="font-mono font-bold text-slate-900">{memory.utilizationPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-cyan-600 transition-all duration-500"
              style={{ width: `${Math.min(100, memory.utilizationPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Process Heap: {memory.processHeapUsedMb} MB</span>
            <span>Free: {memory.freeMb} MB</span>
          </div>
        </div>

        {/* AI Queue Bar */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Radio size={14} className="text-slate-500" />
              AI Queue Depth
            </span>
            <span className="font-mono font-bold text-slate-900">
              {workerPool.queueDepth} / {workerPool.queueCapacity}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                workerPool.queueDepth > 50 ? 'bg-rose-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, (workerPool.queueDepth / workerPool.queueCapacity) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Active Workers: {workerPool.activeWorkers}</span>
            <span>Dropped Stale: {workerPool.droppedStaleJobsCount}</span>
          </div>
        </div>
      </div>

      {/* Throughput & Architectural Target Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">INFERENCE FPS</span>
          <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">{workerPool.inferenceFps} FPS</span>
          <span className="text-[10px] text-slate-400">Decoupled AI Tier</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AVG LATENCY</span>
          <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">{workerPool.averageLatencyMs} ms</span>
          <span className="text-[10px] text-slate-400">YOLOv8 + OCR</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">BANDWIDTH</span>
          <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">{workerPool.networkThroughputKbps} Kbps</span>
          <span className="text-[10px] text-slate-400">Event Stream Only</span>
        </div>
        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 text-center">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">ESTIMATED CAPACITY</span>
          <span className="text-base font-extrabold text-blue-900 font-mono mt-0.5 block">~{architecturalScale.estimatedCameraEquivalentCapacity} Cams</span>
          <span className="text-[10px] text-blue-600">Local Node (2.5s Samp.)</span>
        </div>
      </div>

      {/* Honest Architectural Scale Banner */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
        <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-900 mr-1.5">{architecturalScale.architecturalLabel}:</span>
          80,000+ represents the statewide distributed architecture target across regional NVR/edge gateways and Google Cloud event pipelines. AI inference uses adaptive frame sampling so live CCTV display video streams operate independently without FPS degradation.
        </div>
      </div>
    </div>
  );
};
