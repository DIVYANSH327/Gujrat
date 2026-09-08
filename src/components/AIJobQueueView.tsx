/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIJobQueueView: Priority-Based Distributed Workload Queue Viewer
 */

import React, { useState } from 'react';
import { 
  ListOrdered, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  AlertCircle,
  Filter,
  Eye,
  X
} from 'lucide-react';
import { AIAgentJob, AgentPriority, JobStatus } from '../ai-agents/types';

interface AIJobQueueViewProps {
  jobs: AIAgentJob[];
  onCancelJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
}

export const AIJobQueueView: React.FC<AIJobQueueViewProps> = ({
  jobs,
  onCancelJob,
  onRetryJob
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedJob, setSelectedJob] = useState<AIAgentJob | null>(null);

  const filteredJobs = (jobs || []).filter(job => {
    if (statusFilter === 'ALL') return true;
    return job?.status === statusFilter;
  });

  const getPriorityBadge = (priority: AgentPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/70 text-rose-400 border border-rose-500/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/70 text-amber-400 border border-amber-500/50">
            HIGH
          </span>
        );
      case 'NORMAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/70 text-cyan-400 border border-cyan-500/40">
            NORMAL
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-700">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400">
            <Clock size={11} className="text-zinc-500" /> QUEUED
          </span>
        );
      case 'ASSIGNED':
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> {status}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <CheckCircle2 size={11} /> COMPLETED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-rose-400">
            <XCircle size={11} /> FAILED
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
            <RotateCcw size={11} /> RETRYING
          </span>
        );
      default:
        return <span className="text-[10px] font-mono text-zinc-500">{status}</span>;
    }
  };

  return (
    <div className="bg-[#080d1a] border border-cyan-950/80 rounded-xl overflow-hidden shadow-2xl p-4 space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <ListOrdered className="text-cyan-400" size={18} />
          <div>
            <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
              DISTRIBUTED AI WORKLOAD QUEUE ({(jobs || []).length})
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              Priority-directed execution queue with deduplication and automated failover.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-black/50 border border-zinc-800 rounded-lg p-0.5">
          {['ALL', 'QUEUED', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors ${
                statusFilter === status 
                  ? 'bg-cyan-500 text-black shadow' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500 bg-black/30">
              <th className="py-2.5 px-3">JOB ID</th>
              <th className="py-2.5 px-3">TYPE</th>
              <th className="py-2.5 px-3">SOURCE / CAMERA</th>
              <th className="py-2.5 px-3">PRIORITY</th>
              <th className="py-2.5 px-3">ASSIGNED AGENT</th>
              <th className="py-2.5 px-3">STATUS</th>
              <th className="py-2.5 px-3">ATTEMPTS</th>
              <th className="py-2.5 px-3">LATENCY</th>
              <th className="py-2.5 px-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-zinc-500 font-mono text-xs">
                  No jobs found matching the selected filter.
                </td>
              </tr>
            ) : (
              filteredJobs.slice(0, 15).map(job => (
                <tr key={job.jobId} className="hover:bg-cyan-950/20 transition-colors group">
                  <td className="py-2 px-3 font-bold text-cyan-300">
                    {job.jobId}
                  </td>
                  <td className="py-2 px-3 text-zinc-300">
                    {job.jobType}
                  </td>
                  <td className="py-2 px-3 text-zinc-400">
                    {job.cameraId || job.sourceId}
                  </td>
                  <td className="py-2 px-3">
                    {getPriorityBadge(job.priority)}
                  </td>
                  <td className="py-2 px-3 text-zinc-300 font-mono text-[11px]">
                    {job.assignedAgentId || <span className="text-zinc-600">Pending Assignment</span>}
                  </td>
                  <td className="py-2 px-3">
                    {getStatusBadge(job.status)}
                  </td>
                  <td className="py-2 px-3 text-zinc-400">
                    {job.attempt} / {job.maxAttempts}
                  </td>
                  <td className="py-2 px-3 text-zinc-400 tabular-nums">
                    {job.latencyMs ? `${job.latencyMs}ms` : '—'}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="p-1 text-zinc-400 hover:text-cyan-300 rounded cursor-pointer"
                        title="Inspect Job Payload"
                      >
                        <Eye size={13} />
                      </button>
                      {job.status === 'FAILED' && (
                        <button
                          onClick={() => onRetryJob(job.jobId)}
                          className="p-1 text-amber-400 hover:text-amber-300 rounded cursor-pointer"
                          title="Retry Job"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                      {(job.status === 'QUEUED' || job.status === 'ASSIGNED') && (
                        <button
                          onClick={() => onCancelJob(job.jobId)}
                          className="p-1 text-rose-400 hover:text-rose-300 rounded cursor-pointer"
                          title="Cancel Job"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payload Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-cyan-500/50 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="text-cyan-400" size={16} />
                <h4 className="font-mono text-sm font-bold text-zinc-100 uppercase">
                  Job Inspector: {selectedJob.jobId}
                </h4>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-black/40 rounded-lg border border-zinc-800">
                <div><span className="text-zinc-500">TYPE:</span> <span className="text-zinc-200">{selectedJob.jobType}</span></div>
                <div><span className="text-zinc-500">PRIORITY:</span> <span className="text-zinc-200">{selectedJob.priority}</span></div>
                <div><span className="text-zinc-500">CORRELATION ID:</span> <span className="text-cyan-300">{selectedJob.correlationId}</span></div>
                <div><span className="text-zinc-500">CREATED:</span> <span className="text-zinc-300">{new Date(selectedJob.createdAt).toLocaleTimeString()}</span></div>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold">Payload Data:</span>
                <pre className="p-3 bg-black/60 rounded-lg border border-zinc-800 text-[11px] text-emerald-400 overflow-x-auto max-h-48 custom-scrollbar mt-1">
                  {JSON.stringify(selectedJob.payload, null, 2)}
                </pre>
              </div>

              {selectedJob.result && (
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold">Result:</span>
                  <pre className="p-3 bg-black/60 rounded-lg border border-zinc-800 text-[11px] text-cyan-300 overflow-x-auto max-h-36 custom-scrollbar mt-1">
                    {JSON.stringify(selectedJob.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
