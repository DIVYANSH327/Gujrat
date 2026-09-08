/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ChallanCaseReviewQueue: High-Density Searchable Enforcement Review Queue
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileText, 
  Car,
  ChevronRight,
  EyeOff,
  Video
} from 'lucide-react';
import { 
  ViolationCase, 
  ViolationCaseStatus, 
  ViolationType 
} from '../../types/v22ChallanTypes';

interface Props {
  cases: ViolationCase[];
  selectedCaseId?: string;
  onSelectCase: (caseId: string) => void;
  statusFilter: ViolationCaseStatus | 'ALL';
  onStatusFilterChange: (status: ViolationCaseStatus | 'ALL') => void;
  violationTypeFilter: ViolationType | 'ALL';
  onViolationTypeFilterChange: (type: ViolationType | 'ALL') => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const ChallanCaseReviewQueue: React.FC<Props> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  statusFilter,
  onStatusFilterChange,
  violationTypeFilter,
  onViolationTypeFilterChange,
  searchQuery,
  onSearchQueryChange
}) => {
  const getStatusBadge = (status: ViolationCaseStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">PENDING REVIEW</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold animate-pulse">UNDER REVIEW</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold">APPROVED</span>;
      case 'E_CHALLAN_ISSUED':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">ISSUED</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">REJECTED</span>;
      case 'INSUFFICIENT_EVIDENCE':
        return <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">INSUFFICIENT</span>;
      case 'DISPATCH_FAILED':
        return <span className="px-2 py-0.5 rounded bg-rose-600/20 text-rose-400 border border-rose-600/30 text-[10px] font-semibold">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">{status}</span>;
    }
  };

  const getSourceBadge = (source: string) => {
    if (source === 'YOUTUBE_DEMO') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-600/50 text-amber-300 text-[9px] font-mono">
          YOUTUBE DEMO (NON-ENFORCEABLE)
        </span>
      );
    }
    if (source === 'AUTHORIZED_CCTV' || source === 'LAW_ENFORCEMENT_CCTV') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 text-[9px] font-mono">
          AUTHORIZED CCTV
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-cyan-300 text-[9px] font-mono">
        SIMULATED EVIDENCE
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border-r border-slate-800">
      {/* Search & Header */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/50">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search plate, case ID, camera..."
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-medium scrollbar-thin">
          {(['ALL', 'PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'E_CHALLAN_ISSUED', 'REJECTED'] as const).map(st => (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              className={`px-2 py-1 rounded whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'ALL' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Violation Type Dropdown */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Violation Type:</span>
          <select
            value={violationTypeFilter}
            onChange={e => onViolationTypeFilterChange(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Violation Types</option>
            <option value="OVERSPEEDING">Overspeeding</option>
            <option value="RED_LIGHT_VIOLATION">Red Light Violation</option>
            <option value="HELMETLESS_RIDING">Helmetless Riding</option>
            <option value="TRIPLE_RIDING">Triple Riding</option>
            <option value="WRONG_LANE">Wrong Lane / BRTS</option>
            <option value="WRONG_SIDE_DRIVING">Wrong Side Driving</option>
          </select>
        </div>
      </div>

      {/* Case List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {cases.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <AlertTriangle size={24} className="mx-auto text-slate-600" />
            <p>No violation cases match current filters.</p>
          </div>
        ) : (
          cases.map(caseItem => {
            const isSelected = caseItem.caseId === selectedCaseId;
            return (
              <div
                key={caseItem.caseId}
                onClick={() => onSelectCase(caseItem.caseId)}
                className={`p-3.5 cursor-pointer transition relative hover:bg-slate-800/40 ${
                  isSelected 
                    ? 'bg-slate-800/80 border-l-4 border-l-amber-500' 
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-cyan-400">
                      {caseItem.caseId}
                    </span>
                    {getSourceBadge(caseItem.sourceType)}
                  </div>
                  {getStatusBadge(caseItem.status)}
                </div>

                {/* Plate & Vehicle Line */}
                <div className="flex items-center justify-between my-1">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-amber-400 text-slate-950 font-mono font-black text-xs rounded border border-amber-500 tracking-wider">
                      {caseItem.vehiclePlate}
                    </div>
                    <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
                      {caseItem.vehicleMakeModel || caseItem.vehicleType}
                    </span>
                  </div>
                  {caseItem.observedValue !== undefined && (
                    <span className="text-xs font-mono font-semibold text-amber-300">
                      {caseItem.observedValue} {caseItem.unit || ''}
                    </span>
                  )}
                </div>

                {/* Violation Description */}
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between mt-1">
                  <span className="text-slate-300">
                    {caseItem.violationType.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {caseItem.cameraId}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-800/50">
                  <span className="truncate max-w-[160px]">{caseItem.location}</span>
                  <span>{new Date(caseItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
