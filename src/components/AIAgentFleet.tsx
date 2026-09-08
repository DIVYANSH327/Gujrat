/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIAgentFleet: Agent Fleet Table, Health Telemetry & Capability Inspector
 */

import React, { useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Clock, 
  Layers, 
  RefreshCw,
  Power,
  ChevronRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { AIAgentInfo, AgentStatus } from '../ai-agents/types';

interface AIAgentFleetProps {
  agents: AIAgentInfo[];
  onSelectAgent: (agent: AIAgentInfo) => void;
  onToggleStatus: (agentId: string) => void;
  onRefresh: () => void;
}

export const AIAgentFleet: React.FC<AIAgentFleetProps> = ({
  agents,
  onSelectAgent,
  onToggleStatus,
  onRefresh
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAgents = (agents || []).filter(agent => {
    const matchesStatus = statusFilter === 'ALL' || agent?.status === statusFilter;
    const matchesSearch = 
      agent?.agentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent?.agentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent?.region?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'IDLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> IDLE
          </span>
        );
      case 'BUSY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> BUSY
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
            <AlertTriangle size={10} className="text-amber-400" /> DEGRADED
          </span>
        );
      case 'OFFLINE':
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/60 text-rose-400 border border-rose-500/40">
            <XCircle size={10} className="text-rose-400" /> OFFLINE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#080d1a] border border-cyan-950/80 rounded-xl overflow-hidden shadow-2xl space-y-4 p-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="text-cyan-400" size={18} />
            <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
              SPECIALIZED AI AGENT FLEET ({(agents || []).length})
            </h3>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
            Distributed multi-agent mesh running vision, safety, evidence, and correlation workloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search agent ID, type, region..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-black/40 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center bg-black/50 border border-zinc-800 rounded-lg p-0.5">
            {['ALL', 'IDLE', 'BUSY', 'OFFLINE'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors ${
                  statusFilter === status 
                    ? 'bg-cyan-500 text-black shadow' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg cursor-pointer transition-colors"
            title="Refresh Fleet Telemetry"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Agents Table - Responsive Horizontal Scroll */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500 bg-black/30">
              <th className="py-2.5 px-3">AGENT ID</th>
              <th className="py-2.5 px-3">TYPE</th>
              <th className="py-2.5 px-3">REGION</th>
              <th className="py-2.5 px-3">STATUS</th>
              <th className="py-2.5 px-3">WORKLOAD</th>
              <th className="py-2.5 px-3">ACTIVE JOBS</th>
              <th className="py-2.5 px-3">CAPABILITIES</th>
              <th className="py-2.5 px-3">LATENCY</th>
              <th className="py-2.5 px-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {filteredAgents.map(agent => (
              <tr
                key={agent.agentId}
                className="hover:bg-cyan-950/20 transition-colors group cursor-pointer"
                onClick={() => onSelectAgent(agent)}
              >
                <td className="py-2.5 px-3 font-bold text-cyan-300 group-hover:text-cyan-200 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    agent.status === 'OFFLINE' ? 'bg-rose-500' : 'bg-emerald-400'
                  }`} />
                  {agent.agentId}
                </td>
                <td className="py-2.5 px-3 text-zinc-300 font-semibold">
                  {agent.agentType.replace('_', ' ')}
                </td>
                <td className="py-2.5 px-3 text-zinc-400">
                  {agent.region}
                </td>
                <td className="py-2.5 px-3">
                  {getStatusBadge(agent.status)}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          agent.workloadPercent > 80 
                            ? 'bg-rose-500' 
                            : agent.workloadPercent > 50 
                            ? 'bg-amber-400' 
                            : 'bg-cyan-400'
                        }`}
                        style={{ width: `${agent.workloadPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">{agent.workloadPercent}%</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-zinc-200 font-bold">
                  {agent.metrics.activeJobs}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(agent.capabilities || []).slice(0, 2).map(cap => (
                      <span 
                        key={cap}
                        className="px-1.5 py-0.5 bg-black/40 border border-zinc-800 rounded text-[9px] text-zinc-400"
                      >
                        {cap.replace('_', ' ')}
                      </span>
                    ))}
                    {(agent.capabilities || []).length > 2 && (
                      <span className="text-[9px] text-zinc-500 self-center">
                        +{(agent.capabilities || []).length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-zinc-400 tabular-nums">
                  {agent.metrics.averageLatencyMs}ms
                </td>
                <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onToggleStatus(agent.agentId)}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        agent.status === 'OFFLINE'
                          ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-500/40'
                      }`}
                      title={agent.status === 'OFFLINE' ? 'Restore Agent' : 'Simulate Failure (Offline)'}
                    >
                      <Power size={12} />
                    </button>
                    <button
                      onClick={() => onSelectAgent(agent)}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 rounded cursor-pointer"
                      title="Inspect Agent Details"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
