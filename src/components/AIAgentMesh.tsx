/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIAgentMesh: Master Command View for Distributed AI Intelligence (80,000+ Cameras)
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  ListOrdered, 
  ShieldAlert, 
  FileText, 
  Activity, 
  RefreshCw, 
  Play, 
  Power, 
  RotateCcw, 
  Sliders, 
  CheckCircle2, 
  Server, 
  HardDrive,
  Info,
  Scale,
  Sparkles,
  Car
} from 'lucide-react';
import { 
  aiOrchestrator, 
  agentRegistry, 
  jobQueue, 
  AIAgentInfo, 
  AIAgentJob, 
  CorrelatedIncident, 
  MeshMetrics, 
  ScaleSimulationState,
  AIAgentAuditRecord
} from '../ai-agents';
import { AIAgentFleet } from './AIAgentFleet';
import { AIJobQueueView } from './AIJobQueueView';
import { AIWorkflow } from './AIWorkflow';
import { AIIncidentCorrelationView } from './AIIncidentCorrelationView';
import { AIAgentDetailsModal } from './AIAgentDetailsModal';
import { sysEvents } from '../services/Architecture';
import { AIAuditAgent } from '../ai-agents/audit/AIAuditAgent';
import { IncidentCorrelationAgent } from '../ai-agents/incident/IncidentCorrelationAgent';

interface AIAgentMeshProps {
  onNavigateToTracking?: () => void;
  onNavigateToCameras?: () => void;
}

export const AIAgentMesh: React.FC<AIAgentMeshProps> = ({
  onNavigateToTracking,
  onNavigateToCameras
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'workflow' | 'queue' | 'incidents' | 'audit'>('fleet');
  const [agents, setAgents] = useState<AIAgentInfo[]>(agentRegistry.getAllAgentInfos());
  const [jobs, setJobs] = useState<AIAgentJob[]>(jobQueue.getAllJobs());
  const [incidents, setIncidents] = useState<CorrelatedIncident[]>([]);
  const [auditRecords, setAuditRecords] = useState<AIAgentAuditRecord[]>([]);
  const [scaleState, setScaleState] = useState<ScaleSimulationState>(aiOrchestrator.getScaleState());
  const [meshMetrics, setMeshMetrics] = useState<MeshMetrics>(aiOrchestrator.getMeshMetrics());
  const [selectedAgent, setSelectedAgent] = useState<AIAgentInfo | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const refreshData = () => {
    setAgents(agentRegistry.getAllAgentInfos());
    setJobs(jobQueue.getAllJobs());
    
    const incAgent = agentRegistry.getAgent('INCIDENT-CORR-001') as IncidentCorrelationAgent;
    if (incAgent) {
      setIncidents(incAgent.getAllIncidents());
    }

    const auditAgent = agentRegistry.getAgent('AUDIT-CENTRAL-001') as AIAuditAgent;
    if (auditAgent) {
      setAuditRecords(auditAgent.getAuditRecords());
    }

    setMeshMetrics(aiOrchestrator.getMeshMetrics());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleScaleChange = (cameraCount: number) => {
    const updated = aiOrchestrator.setScaleSimulation(cameraCount);
    setScaleState(updated);
    refreshData();
    setActionNotice(`Architectural target updated to ${cameraCount.toLocaleString()} CCTV cameras.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSimulateFailover = (agentId: string = 'VISION-AHM-001') => {
    try {
      const res = aiOrchestrator.simulateFailureAndReassign(agentId);
      refreshData();
      setActionNotice(`Simulated failure on ${agentId}. Reassigned ${res.reassignedJobsCount} jobs to healthy mesh agents.`);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice(`Failover error: ${err.message}`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleRestoreAgent = (agentId: string = 'VISION-AHM-001') => {
    aiOrchestrator.restoreAgent(agentId);
    refreshData();
    setActionNotice(`Agent ${agentId} restored to active service.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRunLoadBalancing = () => {
    const result = aiOrchestrator.rebalanceAllWorkloads();
    refreshData();
    setActionNotice(`Load balancer evaluated mesh. Rebalanced ${result.movedJobsCount} jobs.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRunWantedVehicleScenario = async () => {
    try {
      const res = await aiOrchestrator.triggerWantedVehicleScenario('GJ05AB1234');
      refreshData();
      setActionNotice(`Executed Wanted Vehicle Pipeline (GJ05AB1234) across 4 corridor cameras. Alert ID: ${res.alertId || 'DISPATCHED'}`);
      setTimeout(() => setActionNotice(null), 6000);
    } catch (err: any) {
      setActionNotice(`Wanted Vehicle Scenario error: ${err.message}`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleToggleAgentStatus = (agentId: string) => {
    const agent = agentRegistry.getAgent(agentId);
    if (agent) {
      if (agent.getStatus() === 'OFFLINE') {
        handleRestoreAgent(agentId);
      } else {
        handleSimulateFailover(agentId);
      }
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header & Architecture Scope Banner */}
      <div className="bg-[#080d1a] border border-cyan-950/80 rounded-xl p-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-cyan-950/30 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                AI AGENT MESH V1.0
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                DISTRIBUTED INTELLIGENCE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-mono font-black text-zinc-100 uppercase tracking-tight">
              STATEWIDE AI AGENT MESH & WORKLOAD ORCHESTRATION
            </h1>
            <p className="text-xs font-mono text-zinc-400 max-w-3xl">
              Event-driven distributed AI fabric coordinating vision detection, road safety, forensic SHA-256 evidence, and cross-camera incident correlation across 80,000+ CCTV camera capacity.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunWantedVehicleScenario}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors shadow-lg shadow-rose-900/40"
              title="Demonstrate deterministic Wanted Vehicle Detection scenario (GJ05AB1234)"
            >
              <Car size={13} />
              WANTED VEHICLE (GJ05AB1234)
            </button>
            <button
              onClick={handleRunLoadBalancing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors"
            >
              <RotateCcw size={13} className="text-cyan-400" />
              BALANCE LOAD
            </button>
            <button
              onClick={() => handleSimulateFailover('VISION-AHM-001')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors"
              title="Test agent offline & automated job failover reassignment"
            >
              <Power size={13} />
              TEST FAILOVER
            </button>
            <button
              onClick={() => handleRestoreAgent('VISION-AHM-001')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors"
            >
              <CheckCircle2 size={13} />
              RESTORE AGENT
            </button>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="mt-3 p-2 bg-cyan-950/50 border border-cyan-500/40 rounded-lg text-xs font-mono text-cyan-300 flex items-center justify-between animate-fadeIn">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-zinc-100 text-xs font-bold">✕</button>
          </div>
        )}

        {/* Gujarat Unified CCTV Intelligence Grid Architecture Panel */}
        <div className="mt-4 pt-3 border-t border-cyan-950/80 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-cyan-400 font-bold uppercase tracking-wider">
              GUJARAT UNIFIED CCTV INTELLIGENCE GRID — ARCHITECTURAL FABRIC
            </span>
            <span className="text-zinc-500">
              V1.1 UNIFIED EVENT NORMALIZATION
            </span>
          </div>

          {/* System Flow Diagram */}
          <div className="p-2.5 bg-[#050811] rounded border border-cyan-950/60 flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-300">
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-300 rounded border border-zinc-700">CAMERAS (DVR/NVR/VMS)</span>
              <span className="text-cyan-500">→</span>
              <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-300 rounded border border-cyan-700">EDGE AGENTS</span>
              <span className="text-cyan-500">→</span>
              <span className="px-1.5 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-700">REGIONAL AGENTS</span>
              <span className="text-cyan-500">→</span>
              <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 rounded border border-purple-700">AI AGENT MESH</span>
              <span className="text-cyan-500">→</span>
              <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-700">CENTRAL ORCHESTRATOR</span>
              <span className="text-cyan-500">→</span>
              <span className="px-1.5 py-0.5 bg-zinc-900 text-amber-300 rounded border border-amber-800/60">AUTHORIZED SOURCES</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 flex items-center justify-between px-1">
            <span>PIPELINE: DETECTION → VEHICLE INTELLIGENCE → WATCHLIST → EVIDENCE → ALERT → INCIDENT → INVESTIGATION</span>
            <span className="text-emerald-400">EDGE AI ENABLED</span>
          </div>
        </div>
      </div>

      {/* Truthful Infrastructure Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <div className="p-3 bg-[#080d1a] border border-cyan-950/80 rounded-xl text-center">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block">TARGET CAPACITY</span>
          <span className="text-base font-mono font-bold text-cyan-300 block">
            {scaleState.targetCameraCount.toLocaleString()}+
          </span>
          <span className="text-[9px] font-mono text-zinc-500">Architectural Model</span>
        </div>

        <div className="p-3 bg-[#080d1a] border border-zinc-800 rounded-xl text-center">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block">CONNECTED PHYSICAL</span>
          <span className="text-base font-mono font-bold text-zinc-400 block">0</span>
          <span className="text-[9px] font-mono text-emerald-400">Truthful Connected</span>
        </div>

        <div className="p-3 bg-[#080d1a] border border-zinc-800 rounded-xl text-center">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block">ACTIVE AGENTS</span>
          <span className="text-base font-mono font-bold text-zinc-100 block">
            {meshMetrics.onlineAgentCount} / {meshMetrics.agentCount}
          </span>
          <span className="text-[9px] font-mono text-cyan-400">Online Mesh</span>
        </div>

        <div className="p-3 bg-[#080d1a] border border-zinc-800 rounded-xl text-center">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block">SIMULATED EDGES</span>
          <span className="text-base font-mono font-bold text-zinc-200 block">
            {scaleState.simulatedEdgeNodesCount.toLocaleString()}
          </span>
          <span className="text-[9px] font-mono text-zinc-500">Fleet Nodes</span>
        </div>

        <div className="p-3 bg-[#080d1a] border border-zinc-800 rounded-xl text-center">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block">ACTIVE JOBS</span>
          <span className="text-base font-mono font-bold text-amber-300 block">
            {meshMetrics.activeJobs}
          </span>
          <span className="text-[9px] font-mono text-zinc-500">In-Flight</span>
        </div>

        <div className="p-3 bg-[#080d1a] border border-zinc-800 rounded-xl text-center">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block">EVENTS / MIN</span>
          <span className="text-base font-mono font-bold text-cyan-300 block">
            {scaleState.simulatedEventsPerMin.toLocaleString()}
          </span>
          <span className="text-[9px] font-mono text-zinc-500">Simulated Telemetry</span>
        </div>

        <div className="p-3 bg-[#080d1a] border border-zinc-800 rounded-xl text-center">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block">EVIDENCE DIGESTS</span>
          <span className="text-base font-mono font-bold text-emerald-300 block">
            {meshMetrics.evidenceCaptured}
          </span>
          <span className="text-[9px] font-mono text-emerald-400">SHA-256 Sealed</span>
        </div>

        <div className="p-3 bg-[#080d1a] border border-zinc-800 rounded-xl text-center">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block">AVG LATENCY</span>
          <span className="text-base font-mono font-bold text-zinc-200 block">
            {meshMetrics.averageLatencyMs}ms
          </span>
          <span className="text-[9px] font-mono text-zinc-500">Pipeline Execution</span>
        </div>
      </div>

      {/* Scale Simulation Model Bar (Acceptance Test 5) */}
      <div className="bg-[#080d1a] border border-cyan-950/80 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="text-cyan-400" size={17} />
            <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
              ARCHITECTURAL SCALE SIMULATION SELECTOR
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-zinc-400 mr-1">Select Target:</span>
            {[1000, 10000, 50000, 80000, 100000].map(count => (
              <button
                key={count}
                onClick={() => handleScaleChange(count)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded cursor-pointer transition-all ${
                  scaleState.targetCameraCount === count
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'bg-black/50 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                }`}
              >
                {count >= 1000 ? `${count / 1000}k` : count} CAMERAS
              </button>
            ))}
          </div>
        </div>

        {/* Regional District Distribution Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {scaleState.regions.map(reg => (
            <div key={reg.regionName} className="p-3 bg-black/40 border border-zinc-850 rounded-lg space-y-1 text-xs font-mono">
              <div className="flex justify-between font-bold">
                <span className="text-zinc-200">{reg.regionName}</span>
                <span className="text-cyan-400">{reg.cameras.toLocaleString()} Cams</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                <span>Edge Nodes: {reg.edgeNodes}</span>
                <span>Agents: {reg.activeAgents}</span>
              </div>
              <div className="text-[10px] text-zinc-500 text-right">
                {reg.eventsPerMin} events/min
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'fleet'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Cpu size={14} />
          AGENT FLEET ({(agents || []).length})
        </button>

        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'workflow'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Layers size={14} />
          LIVE WORKFLOW PIPELINE
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'queue'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <ListOrdered size={14} />
          JOB QUEUE ({(jobs || []).length})
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'incidents'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <ShieldAlert size={14} />
          CORRELATED INCIDENTS ({(incidents || []).length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <FileText size={14} />
          STATUTORY AUDIT TRAIL ({(auditRecords || []).length})
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'fleet' && (
        <AIAgentFleet
          agents={agents}
          onSelectAgent={setSelectedAgent}
          onToggleStatus={handleToggleAgentStatus}
          onRefresh={refreshData}
        />
      )}

      {activeTab === 'workflow' && (
        <AIWorkflow />
      )}

      {activeTab === 'queue' && (
        <AIJobQueueView
          jobs={jobs}
          onCancelJob={jobId => {
            jobQueue.cancel(jobId);
            refreshData();
          }}
          onRetryJob={jobId => {
            jobQueue.retry(jobId);
            refreshData();
          }}
        />
      )}

      {activeTab === 'incidents' && (
        <AIIncidentCorrelationView
          incidents={incidents}
          onInspectIncident={inc => {
            setActiveTab('audit');
          }}
          onNavigateToTracking={onNavigateToTracking}
        />
      )}

      {activeTab === 'audit' && (
        <div className="bg-[#080d1a] border border-cyan-950/80 rounded-xl p-4 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="text-cyan-400" size={18} />
              <div>
                <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
                  STATUTORY AI AUDIT TRAIL & LOGS
                </h3>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  Tamper-evident logs of every orchestration dispatch, evidence hashing, and failover operation.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/40">
              LEGAL INTEGRITY ASSURED
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500 bg-black/30">
                  <th className="py-2 px-3">TIMESTAMP</th>
                  <th className="py-2 px-3">ACTION</th>
                  <th className="py-2 px-3">AGENT ID</th>
                  <th className="py-2 px-3">CORRELATION</th>
                  <th className="py-2 px-3">RESULT</th>
                  <th className="py-2 px-3">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {auditRecords.map(record => (
                  <tr key={record.auditId} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-cyan-300 font-bold whitespace-nowrap">
                      {record.action}
                    </td>
                    <td className="py-2 px-3 text-zinc-300 whitespace-nowrap">
                      {record.agentId}
                    </td>
                    <td className="py-2 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                      {record.correlationId}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        record.result === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : record.result === 'REASSIGNED'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                          : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                      }`}>
                        {record.result}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-zinc-400 max-w-xs truncate">
                      {record.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agent Telemetry Modal */}
      {selectedAgent && (
        <AIAgentDetailsModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onToggleStatus={handleToggleAgentStatus}
        />
      )}
    </div>
  );
};
