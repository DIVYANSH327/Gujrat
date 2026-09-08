/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIAgentDetailsModal: Comprehensive Agent Telemetry, Metrics & Command Terminal
 */

import React from 'react';
import { 
  X, 
  Cpu, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  ShieldCheck, 
  HardDrive,
  Power,
  RefreshCw
} from 'lucide-react';
import { AIAgentInfo } from '../ai-agents/types';

interface AIAgentDetailsModalProps {
  agent: AIAgentInfo | null;
  onClose: () => void;
  onToggleStatus: (agentId: string) => void;
}

export const AIAgentDetailsModal: React.FC<AIAgentDetailsModalProps> = ({
  agent,
  onClose,
  onToggleStatus
}) => {
  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#091124] border border-cyan-500/40 rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                {agent.agentType}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                agent.status === 'OFFLINE'
                  ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
              }`}>
                {agent.status}
              </span>
            </div>
            <h3 className="text-base font-mono font-bold text-zinc-100 mt-1">
              {agent.agentId}
            </h3>
            <p className="text-[11px] font-mono text-zinc-400">
              Scope: {agent.assignedScope} • Region: {agent.region}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Telemetry Notice */}
        <div className="p-2.5 bg-black/50 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 flex items-center justify-between">
          <span className="text-amber-400 font-bold">TELEMETRY TAG:</span>
          <span className="text-zinc-300">
            {agent.metrics.isSimulatedHardwareTelemetry 
              ? 'SIMULATED HARDWARE TELEMETRY (DEMO MESH)' 
              : 'LIVE CONTAINER TELEMETRY'}
          </span>
        </div>

        {/* Resource Telemetry */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-black/40 rounded-lg border border-zinc-800 text-center">
            <span className="text-[10px] font-mono text-zinc-500 block">CPU USAGE</span>
            <span className="text-sm font-mono font-bold text-cyan-300">
              {agent.metrics.cpuUsagePercent}%
            </span>
          </div>
          <div className="p-2.5 bg-black/40 rounded-lg border border-zinc-800 text-center">
            <span className="text-[10px] font-mono text-zinc-500 block">MEMORY</span>
            <span className="text-sm font-mono font-bold text-cyan-300">
              {agent.metrics.memoryUsagePercent}%
            </span>
          </div>
          <div className="p-2.5 bg-black/40 rounded-lg border border-zinc-800 text-center">
            <span className="text-[10px] font-mono text-zinc-500 block">AVG LATENCY</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {agent.metrics.averageLatencyMs}ms
            </span>
          </div>
        </div>

        {/* Job Metrics */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="p-2 bg-black/30 rounded border border-zinc-850">
            <span className="text-[9px] text-zinc-500 block">ACTIVE</span>
            <span className="text-zinc-200 font-bold">{agent.metrics.activeJobs}</span>
          </div>
          <div className="p-2 bg-black/30 rounded border border-zinc-850">
            <span className="text-[9px] text-zinc-500 block">COMPLETED</span>
            <span className="text-emerald-400 font-bold">{agent.metrics.completedJobs}</span>
          </div>
          <div className="p-2 bg-black/30 rounded border border-zinc-850">
            <span className="text-[9px] text-zinc-500 block">FAILED</span>
            <span className="text-rose-400 font-bold">{agent.metrics.failedJobs}</span>
          </div>
          <div className="p-2 bg-black/30 rounded border border-zinc-850">
            <span className="text-[9px] text-zinc-500 block">WORKLOAD</span>
            <span className="text-amber-300 font-bold">{agent.workloadPercent}%</span>
          </div>
        </div>

        {/* Capabilities */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">
            Registered Capabilities ({(agent.capabilities || []).length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(agent.capabilities || []).map(cap => (
              <span
                key={cap}
                className="px-2 py-0.5 bg-cyan-950/40 border border-cyan-800/40 rounded text-[10px] font-mono text-cyan-300"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            onClick={() => onToggleStatus(agent.agentId)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
              agent.status === 'OFFLINE'
                ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-500/40'
            }`}
          >
            <Power size={13} />
            {agent.status === 'OFFLINE' ? 'RESTORE AGENT TO MESH' : 'TRIGGER SIMULATED FAILOVER (OFFLINE)'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
