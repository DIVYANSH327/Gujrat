/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ChallanModeDashboard: Master V2.2 Violation Enforcement & Evidence Review Command Center
 */

import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Shield, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Server, 
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Scale,
  Send,
  Zap
} from 'lucide-react';
import { 
  ViolationCase, 
  ViolationCaseStatus, 
  ViolationType,
  AuthorizedDispatchContext 
} from '../../types/v22ChallanTypes';
import { challanReviewService } from '../../services/ChallanReviewService';
import { sysEvents } from '../../services/Architecture';
import { centralEventBus } from '../../services/CentralEventBus';
import { ChallanCaseReviewQueue } from './ChallanCaseReviewQueue';
import { ChallanCaseDetailPanel } from './ChallanCaseDetailPanel';
import { ChallanViolationInjector } from './ChallanViolationInjector';

interface Props {
  onNavigate?: (view: string, payload?: any) => void;
}

export const ChallanModeDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [cases, setCases] = useState<ViolationCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('VC-000124');
  const [statusFilter, setStatusFilter] = useState<ViolationCaseStatus | 'ALL'>('ALL');
  const [violationTypeFilter, setViolationTypeFilter] = useState<ViolationType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [kpis, setKpis] = useState(challanReviewService.getKPIs());

  // Reviewer session context (Human-in-the-loop identity)
  const [currentReviewer, setCurrentReviewer] = useState<AuthorizedDispatchContext>({
    officerId: 'POLICE-OFFICER-742',
    officerName: 'Insp. Vikram Patel',
    badgeNumber: 'GJ-TRF-742',
    role: 'REVIEWER',
    department: 'Gujarat Traffic Police Enforcement Wing'
  });

  const refreshCases = () => {
    const result = challanReviewService.getPendingCases({
      status: statusFilter,
      violationType: violationTypeFilter,
      searchQuery: searchQuery,
      pageSize: 50
    });
    setCases(result.cases);
    setKpis(challanReviewService.getKPIs());
  };

  useEffect(() => {
    refreshCases();

    const subBus = centralEventBus.subscribe('VIOLATION_CASE_SUBMITTED_FOR_REVIEW', () => refreshCases());
    const subApprove = centralEventBus.subscribe('VIOLATION_CASE_APPROVED', () => refreshCases());
    const subDispatch = centralEventBus.subscribe('CHALLAN_DISPATCHED', () => refreshCases());

    const handleSysCreate = () => refreshCases();
    const unsubSys1 = sysEvents.on('CHALLAN_CASE_CREATED', handleSysCreate);
    const unsubSys2 = sysEvents.on('CHALLAN_CASE_APPROVED', handleSysCreate);
    const unsubSys3 = sysEvents.on('CHALLAN_ISSUED', handleSysCreate);

    return () => {
      centralEventBus.unsubscribe(subBus);
      centralEventBus.unsubscribe(subApprove);
      centralEventBus.unsubscribe(subDispatch);
      unsubSys1();
      unsubSys2();
      unsubSys3();
    };
  }, [statusFilter, violationTypeFilter, searchQuery]);

  const selectedCase = cases.find(c => c.caseId === selectedCaseId) || challanReviewService.getCase(selectedCaseId);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Command Bar */}
      <header className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 rounded-lg text-amber-400">
            <Scale size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-slate-100 flex items-center gap-2">
                CHALLAN MODE
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  V2.2 ENFORCEMENT
                </span>
              </h1>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium">
                AI Violation Detection → Evidence Capture → Human Review → e-Challan Dispatch
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
              <span>Jurisdiction: <strong className="text-slate-400">Gujarat Traffic Police Commissionerate</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Review Engine: ONLINE (Active Safeguards)
              </span>
            </div>
          </div>
        </div>

        {/* Right Header: Reviewer Profile & Ingestion Injector */}
        <div className="flex items-center gap-3">
          {/* Reviewer Role Badge */}
          <div className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <div>
              <span className="text-slate-400 text-[10px] block leading-tight">OFFICER ON DUTY</span>
              <span className="font-semibold text-slate-200 text-xs">{currentReviewer.officerName}</span>
              <span className="text-slate-500 text-[10px] font-mono ml-1">({currentReviewer.badgeNumber})</span>
            </div>
            <select
              value={currentReviewer.role}
              onChange={e => setCurrentReviewer({ ...currentReviewer, role: e.target.value as any })}
              className="ml-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-amber-300 font-mono focus:outline-none"
            >
              <option value="REVIEWER">REVIEWER</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="OPERATOR">OPERATOR</option>
            </select>
          </div>

          <ChallanViolationInjector
            onCaseCreated={(newId) => {
              refreshCases();
              setSelectedCaseId(newId);
            }}
          />

          <button
            onClick={refreshCases}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            title="Refresh Cases"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {/* Real-Time KPIs & Gateway Status Bar */}
      <div className="px-6 py-2 bg-slate-950 border-b border-slate-800/80 grid grid-cols-2 md:grid-cols-6 gap-3 shrink-0">
        <button
          onClick={() => setStatusFilter('PENDING_REVIEW')}
          className={`p-2.5 rounded-lg border text-left transition ${
            statusFilter === 'PENDING_REVIEW'
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Pending Review</div>
          <div className="text-xl font-black font-mono text-amber-400">{kpis.pendingReview}</div>
        </button>

        <button
          onClick={() => setStatusFilter('UNDER_REVIEW')}
          className={`p-2.5 rounded-lg border text-left transition ${
            statusFilter === 'UNDER_REVIEW'
              ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Under Review</div>
          <div className="text-xl font-black font-mono text-cyan-400">{kpis.underReview}</div>
        </button>

        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-2.5 rounded-lg border text-left transition ${
            statusFilter === 'APPROVED'
              ? 'bg-blue-500/10 border-blue-500/50 text-blue-300'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Approved / Unissued</div>
          <div className="text-xl font-black font-mono text-blue-400">{kpis.approved}</div>
        </button>

        <button
          onClick={() => setStatusFilter('E_CHALLAN_ISSUED')}
          className={`p-2.5 rounded-lg border text-left transition ${
            statusFilter === 'E_CHALLAN_ISSUED'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Challans Issued</div>
          <div className="text-xl font-black font-mono text-emerald-400">{kpis.issuedToday}</div>
        </button>

        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-2.5 rounded-lg border text-left transition ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-500/10 border-rose-500/50 text-rose-300'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Rejected / Non-Violations</div>
          <div className="text-xl font-black font-mono text-rose-400">{kpis.rejected}</div>
        </button>

        <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded-lg flex flex-col justify-between">
          <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Gateway Channel</div>
          <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Simulated Gateway
          </div>
        </div>
      </div>

      {/* Main Review Workspace Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Review Queue (380px) */}
        <div className="w-80 md:w-96 shrink-0 h-full flex flex-col">
          <ChallanCaseReviewQueue
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={(id) => setSelectedCaseId(id)}
            statusFilter={statusFilter}
            onStatusFilterChange={(s) => setStatusFilter(s)}
            violationTypeFilter={violationTypeFilter}
            onViolationTypeFilterChange={(t) => setViolationTypeFilter(t)}
            searchQuery={searchQuery}
            onSearchQueryChange={(q) => setSearchQuery(q)}
          />
        </div>

        {/* Right Side: Case Detail & Evidentiary Inspector */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {selectedCase ? (
            <ChallanCaseDetailPanel
              key={selectedCase.caseId}
              caseObj={selectedCase}
              reviewer={currentReviewer}
              onCaseUpdated={(updated) => {
                refreshCases();
              }}
              onNavigateToDossier={(plate) => {
                if (onNavigate) {
                  onNavigate('police_intel', { plate });
                }
              }}
              onNavigateToCamera={(cameraId) => {
                if (onNavigate) {
                  onNavigate('cameras', { cameraId });
                }
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Select a violation case from the queue to inspect evidence and perform review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
