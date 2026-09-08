/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * SystemBrainView: Unified AI Operations Fabric & Mesh Supervisor Dashboard
 * Visualizes the 5-tier architecture: Central -> Regional -> Edge -> Mobile -> Cameras
 */

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Cpu, 
  ShieldAlert, 
  Activity, 
  Layers, 
  Radio, 
  Car, 
  Camera, 
  Server, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  Zap, 
  Eye, 
  HardDrive,
  Database,
  Lock,
  Workflow
} from 'lucide-react';
import { aiOrchestrator } from '../ai-agents/orchestrator/AIAgentOrchestrator';
import { agentSupervisor } from '../services/AgentSupervisorService';
import { scaleSimulation } from '../services/ScaleSimulationService';
import { centralEventBus } from '../services/CentralEventBus';
import { mobilePatrolAlpha } from '../services/MobileCameraAgent';
import { IAIAgent } from '../ai-agents/types';

export function SystemBrainView() {
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'CENTRAL' | 'REGIONAL' | 'EDGE' | 'MOBILE'>('ALL');
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
  const [simulatedEdgeStatus, setSimulatedEdgeStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [failoverNotification, setFailoverNotification] = useState<string | null>(null);

  const orchestrator = aiOrchestrator;
  const registry = orchestrator.getRegistry();
  const allAgents = registry.getAllAgents();
  const metrics = orchestrator.getMeshMetrics();
  const telemetry = scaleSimulation.getTelemetry();
  const mobileTelemetry = mobilePatrolAlpha.getTelemetry();

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshTick(t => t + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateEdgeFailure = async () => {
    setIsSimulatingFailure(true);
    setSimulatedEdgeStatus('OFFLINE');
    setFailoverNotification('Simulating sudden network loss on Edge Node EDGE-AHM-001 (Pakwan Junction)...');

    // Trigger supervisor failure detection on VISION-AHM-001
    await agentSupervisor.handleAgentFailure('VISION-AHM-001', 'SIMULATED_FIBER_CUT');
    setFailoverNotification('SUPERVISOR ACTION: Marked VISION-AHM-001 OFFLINE. Reassigned active ANPR & Vision workloads to backup node VISION-AHM-002.');
    setIsSimulatingFailure(false);
  };

  const handleSimulateEdgeRecovery = async () => {
    setIsSimulatingFailure(true);
    setFailoverNotification('Restoring connection to EDGE-AHM-001...');
    await agentSupervisor.recoverAgent('VISION-AHM-001');
    setSimulatedEdgeStatus('ONLINE');
    setFailoverNotification('RECOVERY COMPLETED: EDGE-AHM-001 back online. Heartbeats restored. Offline replay queue drained with 0 dropped events.');
    setIsSimulatingFailure(false);
  };

  const filteredAgents = allAgents.filter(a => {
    if (selectedTier === 'ALL') return true;
    if (selectedTier === 'CENTRAL') return a.getInfo().region === 'CENTRAL';
    if (selectedTier === 'REGIONAL') return a.agentType === 'REGIONAL_AGENT';
    if (selectedTier === 'MOBILE') return a.agentType === 'MOBILE_CAMERA';
    if (selectedTier === 'EDGE') return a.getInfo().edgeNodeId !== undefined;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <Workflow size={12} className="text-cyan-400 animate-spin" />
                V2.0 DISTRIBUTED AI FABRIC
              </span>
              <span className="text-xs text-slate-400 font-mono">STATEWIDE COMMAND MESH</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              Gujarat Police Unified CCTV Intelligence Grid — System Brain
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl mt-1">
              One platform. Many cameras. Many edge nodes. Many specialized AI agents. One coordinated intelligence fabric.
              Capturing once, correlating intelligently, and transmitting only evidentiary metadata.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefreshTick(t => t + 1)}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 border border-slate-700 transition"
            >
              <RefreshCw size={14} className="text-slate-400" />
              Pulse Sync
            </button>
          </div>
        </div>

        {/* Live Topology KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Statewide Grid</div>
            <div className="text-xl font-bold text-cyan-400 mt-1 font-mono">80,000+</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Architected CCTV Grid</div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Edge Nodes</div>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">1,600</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Intersection Appliances</div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Regional Hubs</div>
            <div className="text-xl font-bold text-indigo-400 mt-1 font-mono">4 Metro</div>
            <div className="text-[10px] text-slate-500 mt-0.5">AHD, SUR, VAD, RAJ</div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Mobile Nodes</div>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">1 Patrol Car</div>
            <div className="text-[10px] text-slate-500 mt-0.5">On-Dash ANPR & GPS</div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Active Mesh Agents</div>
            <div className="text-xl font-bold text-purple-400 mt-1 font-mono">{allAgents.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Specialized Autonomous</div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Edge Bandwidth Saved</div>
            <div className="text-xl font-bold text-green-400 mt-1 font-mono">99.98%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">320 Gbps → 120 Mbps</div>
          </div>
        </div>
      </div>

      {/* Failover Demonstration Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${simulatedEdgeStatus === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Supervisor Failover & Graceful Workload Rebalancing</h3>
              <p className="text-xs text-slate-400">
                Demonstrates how the Agent Supervisor detects edge node severance, moves orphan jobs, and resyncs when restored.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {simulatedEdgeStatus === 'ONLINE' ? (
              <button
                disabled={isSimulatingFailure}
                onClick={handleSimulateEdgeFailure}
                className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Zap size={14} />
                Sever Edge Node (Simulate Failure)
              </button>
            ) : (
              <button
                disabled={isSimulatingFailure}
                onClick={handleSimulateEdgeRecovery}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <CheckCircle2 size={14} />
                Restore Edge Node Connection
              </button>
            )}
          </div>
        </div>

        {failoverNotification && (
          <div className="mt-4 p-3 rounded-lg bg-slate-800/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-start gap-2">
            <Activity size={15} className="mt-0.5 text-cyan-400 shrink-0" />
            <span>{failoverNotification}</span>
          </div>
        )}
      </div>

      {/* 5-Tier Architectural Topology Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Layers size={18} className="text-cyan-400" />
          5-Tier Hierarchical Topology & Real-Time Dataflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Tier 1: Central */}
          <div className="bg-slate-800/80 rounded-lg p-4 border border-cyan-500/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Tier 1: Central</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <h4 className="text-sm font-semibold text-white mt-1">State Command Gandhinagar</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Statewide policy, cross-corridor correlation, human verification, external adapters.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] font-mono text-cyan-300/80">
              <div>Agents: Orchestrator, Supervisor, Audit, Evidence</div>
              <div className="mt-1 text-slate-400">WAN Traffic: JSON metadata only</div>
            </div>
          </div>

          {/* Tier 2: Regional */}
          <div className="bg-slate-800/80 rounded-lg p-4 border border-indigo-500/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Tier 2: Regional</span>
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mt-1">4 Metro Hub Clusters</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Ahmedabad Metro, Surat Urban Corridor, Vadodara Central, Rajkot Junctions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] font-mono text-indigo-300/80">
              <div>Regional failover & load rebalancing</div>
              <div className="mt-1 text-slate-400">District Incident Dispatch</div>
            </div>
          </div>

          {/* Tier 3: Edge */}
          <div className="bg-slate-800/80 rounded-lg p-4 border border-emerald-500/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Tier 3: Edge</span>
                <span className={`w-2 h-2 rounded-full ${simulatedEdgeStatus === 'ONLINE' ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'}`} />
              </div>
              <h4 className="text-sm font-semibold text-white mt-1">1,600 Edge Appliances</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Local camera ingest, real-time ANPR inference, road-safety verification, best-frame filter.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] font-mono text-emerald-300/80">
              <div>Status: {simulatedEdgeStatus}</div>
              <div className="mt-1 text-slate-400">Filtering: 85% video shed at edge</div>
            </div>
          </div>

          {/* Tier 4: Mobile */}
          <div className="bg-slate-800/80 rounded-lg p-4 border border-amber-500/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Tier 4: Mobile Node</span>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mt-1">Patrol Interceptors</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Moving police cars with GPS, heading, on-dash ANPR, and offline store-and-forward.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] font-mono text-amber-300/80">
              <div>Vehicle: {mobileTelemetry.patrolVehicleId}</div>
              <div className="mt-1 text-slate-400">GPS: {mobileTelemetry.gps.latitude.toFixed(4)}, {mobileTelemetry.gps.longitude.toFixed(4)}</div>
            </div>
          </div>

          {/* Tier 5: Cameras */}
          <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tier 5: Sensors</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mt-1">80,000+ CCTV Cameras</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Fixed junction, PTZ, toll plaza, and highway corridor cameras normalized across protocols.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] font-mono text-slate-300">
              <div>Protocols: RTSP, ONVIF, VMS</div>
              <div className="mt-1 text-slate-400">Classified: REAL vs DEMO</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Agent Mesh Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Cpu size={18} className="text-cyan-400" />
              Statewide Agent Mesh Matrix ({allAgents.length} Agents Supervised)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Heartbeat monitoring every 10s. Automatic failover and event replay enabled.
            </p>
          </div>

          {/* Tier Filters */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
            {(['ALL', 'CENTRAL', 'REGIONAL', 'EDGE', 'MOBILE'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1 rounded-md font-medium transition ${selectedTier === tier ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAgents.map(agent => {
            const info = agent.getInfo();
            const metrics = agent.getMetrics();
            const statusColor = 
              info.status === 'IDLE' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
              info.status === 'BUSY' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' :
              info.status === 'DEGRADED' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
              info.status === 'DRAINING' ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' :
              'text-rose-400 border-rose-500/30 bg-rose-500/10';

            return (
              <div key={agent.agentId} className="bg-slate-800/70 border border-slate-700/70 rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-600 transition">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{info.agentType}</span>
                      <h4 className="text-sm font-semibold text-white font-mono">{agent.agentId}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                      {info.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 font-sans">
                    Scope: <span className="text-slate-200 font-medium">{info.assignedScope}</span>
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {info.capabilities.slice(0, 3).map(cap => (
                      <span key={cap} className="px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 text-[9px] font-mono">
                        {cap}
                      </span>
                    ))}
                    {info.capabilities.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 text-[9px] font-mono">
                        +{info.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-700/70 grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
                  <div>
                    CPU: <span className="text-slate-200">{metrics.cpuUsagePercent}%</span>
                  </div>
                  <div>
                    Events: <span className="text-slate-200">{metrics.eventsProcessed}</span>
                  </div>
                  <div>
                    Latency: <span className="text-slate-200">{Math.round(metrics.averageLatencyMs)}ms</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
