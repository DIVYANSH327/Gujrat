import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  Sliders, 
  ShieldAlert,
  BarChart2,
  Cpu,
  Radio
} from 'lucide-react';
import { operationalDigitalTwinService } from '../services/OperationalDigitalTwinService';
import { sysEvents } from '../services/Architecture';
import { DigitalTwinMetrics, DigitalTwinFleetScale } from '../types';

export const DigitalTwinScaleView: React.FC = () => {
  const [scale, setScale] = useState<DigitalTwinFleetScale>(80000);
  const [metrics, setMetrics] = useState<DigitalTwinMetrics>(operationalDigitalTwinService.getMetrics());

  const refreshMetrics = () => {
    setMetrics(operationalDigitalTwinService.getMetrics());
  };

  useEffect(() => {
    refreshMetrics();
    const timer = setInterval(refreshMetrics, 1500);
    const unsub1 = sysEvents.on('DIGITAL_TWIN_FAULT_INJECTED', refreshMetrics);
    const unsub2 = sysEvents.on('DIGITAL_TWIN_RESTORED', refreshMetrics);
    return () => {
      clearInterval(timer);
      unsub1();
      unsub2();
    };
  }, []);

  const handleScaleChange = (newScale: DigitalTwinFleetScale) => {
    setScale(newScale);
    operationalDigitalTwinService.setScale(newScale);
    refreshMetrics();
  };

  const handleTriggerFault = (type: 'CAMERA_FAILURE' | 'EDGE_FAILURE' | 'REGIONAL_FAILURE' | 'LATENCY_BURST' | 'AGENT_OVERLOAD') => {
    operationalDigitalTwinService.triggerFault(type);
    refreshMetrics();
  };

  const handleRestore = () => {
    operationalDigitalTwinService.restoreSystem();
    refreshMetrics();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">OPERATIONAL DIGITAL TWIN & SCALE LAB</h1>
              <p className="text-xs text-slate-400">Architectural stress-testing, fleet-scale event simulation, and autonomous failover validation</p>
            </div>
          </div>
        </div>

        {/* Disclaimer Pill */}
        <span className="px-3 py-1 text-[11px] font-bold rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
          ARCHITECTURAL SCALE SIMULATION (80K+ CAMERAS)
        </span>
      </div>

      {/* Scale Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Select Simulated Camera Fleet Scale:</span>
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {scale.toLocaleString()} Active Grid Nodes
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {([1000, 10000, 50000, 80000, 100000] as DigitalTwinFleetScale[]).map(s => (
            <button
              key={s}
              onClick={() => handleScaleChange(s)}
              className={`p-3 rounded-lg border text-xs font-bold font-mono transition text-center ${
                scale === s 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg ring-2 ring-indigo-500/30' 
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {s.toLocaleString()} CAMERAS
            </button>
          ))}
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Statewide Ingestion</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono">{metrics.eventsPerSec.toLocaleString()}</span>
            <span className="text-xs text-slate-400">events/s</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-xs text-slate-400 font-semibold block mb-1">P95 Pipeline Latency</span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-mono ${metrics.p95LatencyMs > 250 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {metrics.p95LatencyMs}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Agent Mesh Fleet</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-indigo-400 font-mono">{metrics.activeAgents}</span>
            <span className="text-xs text-slate-400">autonomous nodes</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Backpressure & Queue</span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-mono ${metrics.backpressureActive ? 'text-amber-400' : 'text-slate-200'}`}>
              {metrics.queuedJobs}
            </span>
            <span className="text-xs text-slate-400">{metrics.backpressureActive ? 'THROTTLED' : 'NOMINAL'}</span>
          </div>
        </div>
      </div>

      {/* Fault Injection & Rebalancing Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Dynamic Fault-Injection & Failover Testing</h3>
          </div>
          <button
            onClick={handleRestore}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore Nominal State</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => handleTriggerFault('CAMERA_FAILURE')}
            className={`p-3 rounded-lg border text-xs font-semibold transition text-left space-y-1 ${
              metrics.faultInjectionState.cameraFailureActive
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="block font-bold">1. Camera Failure</span>
            <span className="text-[11px] text-slate-400 block">Drop 12% cameras; verify degraded-mode isolation</span>
          </button>

          <button
            onClick={() => handleTriggerFault('EDGE_FAILURE')}
            className={`p-3 rounded-lg border text-xs font-semibold transition text-left space-y-1 ${
              metrics.faultInjectionState.edgeFailureActive
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="block font-bold">2. Edge Node Dropout</span>
            <span className="text-[11px] text-slate-400 block">Isolate edge gateway; trigger job re-queuing</span>
          </button>

          <button
            onClick={() => handleTriggerFault('REGIONAL_FAILURE')}
            className={`p-3 rounded-lg border text-xs font-semibold transition text-left space-y-1 ${
              metrics.faultInjectionState.regionalFailureActive
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="block font-bold">3. Regional Outage</span>
            <span className="text-[11px] text-slate-400 block">Sever metro link; trigger statewide rebalancing</span>
          </button>

          <button
            onClick={() => handleTriggerFault('LATENCY_BURST')}
            className={`p-3 rounded-lg border text-xs font-semibold transition text-left space-y-1 ${
              metrics.faultInjectionState.latencyBurstActive
                ? 'bg-amber-950/40 border-amber-500/80 text-amber-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="block font-bold">4. WAN Latency Spike</span>
            <span className="text-[11px] text-slate-400 block">Inject 3.2x latency; verify backpressure throttle</span>
          </button>

          <button
            onClick={() => handleTriggerFault('AGENT_OVERLOAD')}
            className={`p-3 rounded-lg border text-xs font-semibold transition text-left space-y-1 ${
              metrics.faultInjectionState.agentOverloadActive
                ? 'bg-amber-950/40 border-amber-500/80 text-amber-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="block font-bold">5. Agent Fleet Overload</span>
            <span className="text-[11px] text-slate-400 block">Simulate 25% agent drain; test workload failover</span>
          </button>
        </div>
      </div>

      {/* Regional Load Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span>Regional Processing Clusters & Load Balancing</span>
        </h3>

        <div className="space-y-4">
          {metrics.regionalLoads.map((reg, idx) => (
            <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-white text-sm">{reg.region}</span>
                  <span className="text-slate-400 ml-2">({reg.camerasCount.toLocaleString()} Cameras, {reg.activeAgents} Agents)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-mono">{reg.bandwidthMbps} Mbps</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    reg.status === 'OVERLOADED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    reg.status === 'ELEVATED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {reg.status} ({reg.loadPercent}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    reg.loadPercent > 90 ? 'bg-rose-500' :
                    reg.loadPercent > 75 ? 'bg-amber-500' :
                    'bg-indigo-500'
                  }`}
                  style={{ width: `${reg.loadPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
