/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ScaleLab: 80,000-Camera & 1,000,000-Vehicle/Day Capacity & Stress Laboratory
 * Demonstrates Queuing Theory, Edge Bandwidth Compression, and Backpressure Shedding.
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  Cpu, 
  Activity, 
  HardDrive, 
  Wifi, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Flame, 
  ShieldCheck,
  TrendingDown,
  Layers,
  BarChart3
} from 'lucide-react';
import { scaleSimulation, ScaleConfig } from '../services/ScaleSimulationService';

export function ScaleLab() {
  const [config, setConfig] = useState<ScaleConfig>(scaleSimulation.getConfig());
  const telemetry = scaleSimulation.getTelemetry();

  const handleCameraScaleChange = (val: number) => {
    const updated = { ...config, cameraScale: val };
    setConfig(updated);
    scaleSimulation.setConfig(updated);
  };

  const handleVehicleScaleChange = (val: number) => {
    const updated = { ...config, vehicleScaleDaily: val };
    setConfig(updated);
    scaleSimulation.setConfig(updated);
  };

  const handleBurstMultiplierChange = (val: number) => {
    const updated = { ...config, burstMultiplier: val };
    setConfig(updated);
    scaleSimulation.setConfig(updated);
  };

  const handleToggle = (key: keyof ScaleConfig) => {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    scaleSimulation.setConfig(updated);
  };

  const handleResetToAuthoritative = () => {
    const authoritative: ScaleConfig = {
      cameraScale: 80000,
      vehicleScaleDaily: 1000000,
      burstMultiplier: 1.0,
      edgeFilterEnabled: true,
      prioritySchedulerEnabled: true,
      topologyAssistedEnabled: true
    };
    setConfig(authoritative);
    scaleSimulation.setConfig(authoritative);
  };

  const handleTriggerEmergencySurge = () => {
    const surge: ScaleConfig = {
      ...config,
      burstMultiplier: 15.0 // 15x statewide rush hour / emergency
    };
    setConfig(surge);
    scaleSimulation.setConfig(surge);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sliders size={12} className="text-amber-400" />
                ARCHITECTURAL SCALE SIMULATION
              </span>
              <span className="text-xs text-slate-400 font-mono">MATHEMATICAL CAPACITY MODEL</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              Scale Laboratory: 80,000 CCTV Cameras & 1,000,000 Vehicles/Day
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl mt-1">
              Stress-test the queuing theory, edge inference savings, and network bottlenecks of a statewide 
              surveillance grid. Compare raw video backhaul vs Edge-first metadata extraction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerEmergencySurge}
              className="px-3.5 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Flame size={14} />
              Simulate 15x Peak Burst
            </button>
            <button
              onClick={handleResetToAuthoritative}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>

        {/* Live Simulation Status Banner */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Active Backpressure Mode</div>
            <div className={`text-lg font-bold mt-1 font-mono ${telemetry.backpressureState === 'NORMAL' ? 'text-emerald-400' : telemetry.backpressureState === 'HIGH_LOAD' ? 'text-amber-400' : 'text-rose-400 animate-pulse'}`}>
              {telemetry.backpressureState}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {telemetry.backpressureState === 'BACKPRESSURE_ACTIVE' ? 'Shedding P4/P5 Background Telemetry' : 'Operating within safe queue limits'}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Vehicle Rate</div>
            <div className="text-lg font-bold text-cyan-400 mt-1 font-mono">
              {telemetry.currentPeakObsPerSec} obs/sec
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Avg: {telemetry.averageVehicleObsPerSec} obs/sec ({config.burstMultiplier}x burst)
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">P95 System Latency</div>
            <div className="text-lg font-bold text-purple-400 mt-1 font-mono">
              {telemetry.p95LatencyMs} ms
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Queue Depth: {telemetry.queueDepth} jobs
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">WAN Bandwidth Savings</div>
            <div className="text-lg font-bold text-green-400 mt-1 font-mono">
              {telemetry.bandwidthSavingsPercent}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {telemetry.actualNetworkBandwidthMbps} Mbps vs {telemetry.rawBandwidthWithoutEdgeFilterGbps} Gbps
            </div>
          </div>
        </div>
      </div>

      {/* Control Knobs & Interactive Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders size={16} className="text-cyan-400" />
            Scale & Capacity Controls
          </h3>

          {/* Camera Scale Slider */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">CCTV Camera Scale</span>
              <span className="text-cyan-400 font-bold font-mono">{config.cameraScale.toLocaleString()} cameras</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {[1000, 5000, 10000, 25000, 50000, 80000].map(val => (
                <button
                  key={val}
                  onClick={() => handleCameraScaleChange(val)}
                  className={`py-1.5 text-[10px] font-mono rounded border transition ${config.cameraScale === val ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                >
                  {val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Vehicles Slider */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Daily Vehicles Ingested</span>
              <span className="text-emerald-400 font-bold font-mono">{config.vehicleScaleDaily.toLocaleString()} / day</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[100000, 250000, 500000, 1000000].map(val => (
                <button
                  key={val}
                  onClick={() => handleVehicleScaleChange(val)}
                  className={`py-1.5 text-[10px] font-mono rounded border transition ${config.vehicleScaleDaily === val ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                >
                  {val >= 1000000 ? '1M' : `${val / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Burst Multiplier */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Surge / Burst Multiplier</span>
              <span className="text-amber-400 font-bold font-mono">{config.burstMultiplier}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={config.burstMultiplier}
              onChange={(e) => handleBurstMultiplierChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>1x (Nominal)</span>
              <span>5x (Peak Rush)</span>
              <span>15x (Emergency)</span>
              <span>25x (Mega-Event)</span>
            </div>
          </div>

          {/* Architectural Feature Toggles */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300">Architectural Protections</div>

            <div 
              onClick={() => handleToggle('edgeFilterEnabled')}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer hover:border-slate-600 transition"
            >
              <div>
                <div className="text-xs font-medium text-white">Edge Keyframe & ANPR Filtering</div>
                <div className="text-[10px] text-slate-400">Drops 85-99% raw video at the junction appliance</div>
              </div>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${config.edgeFilterEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${config.edgeFilterEnabled ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>

            <div 
              onClick={() => handleToggle('prioritySchedulerEnabled')}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer hover:border-slate-600 transition"
            >
              <div>
                <div className="text-xs font-medium text-white">P0-P5 Priority Scheduler</div>
                <div className="text-[10px] text-slate-400">Guarantees &lt;50ms response for active watchlist targets</div>
              </div>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${config.prioritySchedulerEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${config.prioritySchedulerEnabled ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>

            <div 
              onClick={() => handleToggle('topologyAssistedEnabled')}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer hover:border-slate-600 transition"
            >
              <div>
                <div className="text-xs font-medium text-white">Topology-Assisted Prediction</div>
                <div className="text-[10px] text-slate-400">Restricts corridor search space to connected cameras</div>
              </div>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${config.topologyAssistedEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${config.topologyAssistedEnabled ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Comparative Analysis: With vs Without Edge Architecture */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl lg:col-span-2 space-y-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-400" />
            Architectural Reality Check: Raw Video vs Edge-First Fabric
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Without Edge Architecture (Naive Centralized) */}
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle size={15} />
                Naive Centralized Approach
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-rose-900/40">
                  <span className="text-slate-400">WAN Bandwidth Required:</span>
                  <span className="text-rose-400 font-bold font-mono">{telemetry.rawBandwidthWithoutEdgeFilterGbps} Gbps</span>
                </div>
                <div className="flex justify-between py-1 border-b border-rose-900/40">
                  <span className="text-slate-400">Daily Central Storage:</span>
                  <span className="text-rose-400 font-bold font-mono">{telemetry.rawDailyStorageTb} TB / day</span>
                </div>
                <div className="flex justify-between py-1 border-b border-rose-900/40">
                  <span className="text-slate-400">Central Server Ingestion:</span>
                  <span className="text-rose-400 font-bold font-mono">Fatal Network Saturation</span>
                </div>
                <div className="flex justify-between py-1 border-b border-rose-900/40">
                  <span className="text-slate-400">Single Point of Failure:</span>
                  <span className="text-rose-400 font-bold font-mono">High Risk (Entire grid dark on WAN cut)</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-rose-900/20 text-[11px] text-rose-300">
                Streaming 80,000 raw 1080p RTSP feeds to a central data center requires 320+ Gbps dedicated fiber, which is cost-prohibitive and fragile under disaster conditions.
              </div>
            </div>

            {/* With V2.0 Distributed AI Fabric */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={15} />
                Gujarat Police V2.0 Fabric
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-emerald-900/40">
                  <span className="text-slate-400">Actual WAN Bandwidth:</span>
                  <span className="text-emerald-400 font-bold font-mono">{telemetry.actualNetworkBandwidthMbps} Mbps</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-900/40">
                  <span className="text-slate-400">Daily Central Storage:</span>
                  <span className="text-emerald-400 font-bold font-mono">{telemetry.actualDailyStorageGb} GB / day</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-900/40">
                  <span className="text-slate-400">Edge Bandwidth Savings:</span>
                  <span className="text-emerald-400 font-bold font-mono">99.98% Reduction</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-900/40">
                  <span className="text-slate-400">Offline Resilience:</span>
                  <span className="text-emerald-400 font-bold font-mono">Store-and-Forward on WAN severed</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-emerald-900/20 text-[11px] text-emerald-300">
                AI vision models run at the 1,600 edge nodes. Only compact observation metadata (1.4 KB) and cryptographic best-frame evidence (85 KB) are transmitted over police WAN.
              </div>
            </div>
          </div>

          {/* Load Telemetry Bars */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-300">Simulated Hardware Utilization at Scale</div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Statewide Edge GPU Utilization</span>
                  <span className="font-mono text-cyan-400">{telemetry.gpuUtilizationPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${telemetry.gpuUtilizationPercent > 85 ? 'bg-rose-500' : 'bg-cyan-500'}`} 
                    style={{ width: `${telemetry.gpuUtilizationPercent}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Edge Node CPU Load</span>
                  <span className="font-mono text-emerald-400">{telemetry.cpuUtilizationPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${telemetry.cpuUtilizationPercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${telemetry.cpuUtilizationPercent}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
