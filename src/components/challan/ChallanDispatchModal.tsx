/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ChallanDispatchModal: Authorized e-Challan Gateway Dispatch Verification
 */

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Server, 
  CreditCard,
  Building,
  Info
} from 'lucide-react';
import { ViolationCase, AuthorizedDispatchContext } from '../../types/v22ChallanTypes';
import { challanReviewService } from '../../services/ChallanReviewService';
import { simulatedChallanProvider, authorizedEChallanProvider } from '../../services/ChallanProviderService';

interface Props {
  caseObj: ViolationCase;
  reviewer: AuthorizedDispatchContext;
  onClose: () => void;
  onDispatched: (result: any) => void;
}

export const ChallanDispatchModal: React.FC<Props> = ({
  caseObj,
  reviewer,
  onClose,
  onDispatched
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'SIMULATED' | 'AUTHORIZED'>('SIMULATED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDispatch = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const provider = selectedProvider === 'SIMULATED' ? simulatedChallanProvider : authorizedEChallanProvider;
      const result = await challanReviewService.dispatchChallan(caseObj.caseId, reviewer, provider);
      onDispatched(result);
    } catch (err: any) {
      setError(err.message || 'Dispatch failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Send size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Authorized e-Challan Dispatch Verification
              </h2>
              <p className="text-xs text-slate-400">
                Case ID: <span className="font-mono text-cyan-400">{caseObj.caseId}</span> • Plate: <span className="font-mono text-amber-400 font-semibold">{caseObj.vehiclePlate}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Statutory Enforcement Warning */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3.5 flex gap-3">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-amber-200/90 leading-relaxed">
              <p className="font-semibold text-amber-300">Statutory Authorization Requirement</p>
              <p>
                A legal e-challan cannot be issued solely by automated AI classification. Dispatch requires this verified human approval checkpoint. 
                All dispatches are permanently recorded with your officer ID <span className="font-mono text-white">({reviewer.officerId})</span>.
              </p>
            </div>
          </div>

          {/* Case Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-slate-300">Violation Details</span>
              <span className="text-amber-400 font-mono font-semibold">Fine: ₹{caseObj.suggestedFineAmount || 1500}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-[11px] text-slate-500 block">Violation Type</span>
                <span className="font-medium text-slate-200">{caseObj.violationType.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Location</span>
                <span className="font-medium text-slate-200">{caseObj.location}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Vehicle Specification</span>
                <span className="font-medium text-slate-200">{caseObj.vehicleType} • {caseObj.vehicleMakeModel || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Reviewing Officer</span>
                <span className="font-mono text-cyan-300">{reviewer.officerName} ({reviewer.badgeNumber})</span>
              </div>
            </div>
          </div>

          {/* Gateway Provider Selection */}
          <div className="space-y-2.5">
            <label className="font-semibold text-slate-300 block">
              Select Dispatch Gateway & Environment
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Simulated Gateway */}
              <button
                type="button"
                onClick={() => setSelectedProvider('SIMULATED')}
                className={`p-3.5 rounded-lg border text-left transition relative ${
                  selectedProvider === 'SIMULATED'
                    ? 'bg-cyan-950/30 border-cyan-500 text-slate-200 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Server size={14} className="text-cyan-400" />
                    Simulated Gateway
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 text-[10px] font-mono">
                    DEMO / SANDBOX
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Generates verified synthetic e-Challan records labeled <code className="text-amber-300">DEMO-CHALLAN</code> for command-center workflow evaluation.
                </p>
              </button>

              {/* Authorized National / State Gateway */}
              <button
                type="button"
                onClick={() => setSelectedProvider('AUTHORIZED')}
                className={`p-3.5 rounded-lg border text-left transition relative ${
                  selectedProvider === 'AUTHORIZED'
                    ? 'bg-amber-950/30 border-amber-500 text-slate-200 shadow-lg shadow-amber-950/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Building size={14} className="text-amber-400" />
                    MoRTH / NIC Gateway
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 text-[10px] font-mono">
                    PRODUCTION
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Real government e-Challan API. Requires mutual TLS certificates & authorized NIC server credentials.
                </p>
              </button>
            </div>
          </div>

          {/* Provider Details / Warning */}
          {selectedProvider === 'AUTHORIZED' && (
            <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-lg text-rose-200 text-[11px] flex gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <div>
                <strong className="text-rose-300 block">Production Gateway Credential Guard</strong>
                The production NIC e-Challan gateway is locked in sandbox preview mode. To prevent accidental citizen notice dispatch, real dispatch requires server-side mutual TLS keys.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDispatch}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950/50 transition"
          >
            {isSubmitting ? (
              <>Processing Gateway Payload...</>
            ) : (
              <>
                <Send size={14} />
                Authorize & Dispatch e-Challan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
