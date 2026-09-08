/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * InvestigationReviewPanel: Human-in-the-Loop Supervisory Review & Verification
 * 
 * Strict Principle:
 * "Human decision becomes HUMAN_VERIFIED. Do not overwrite the original AI inference."
 */

import React, { useState } from 'react';
import { VehicleDossier, HumanReviewDecision, UserRole } from '../../types';
import { vehicleDossierService } from '../../services/VehicleDossierService';
import { SourceOfTruthBadge } from './SourceOfTruthBadge';
import { CheckCircle2, XCircle, HelpCircle, ShieldCheck, Clock } from 'lucide-react';

interface Props {
  dossier: VehicleDossier;
  onDossierUpdated: (updated: VehicleDossier) => void;
}

export const InvestigationReviewPanel: React.FC<Props> = ({ dossier, onDossierUpdated }) => {
  const [decision, setDecision] = useState<'CONFIRM' | 'REJECT' | 'MARK_UNCERTAIN'>('CONFIRM');
  const [reviewerId, setReviewerId] = useState('OFFICER-PATEL-881');
  const [reviewerRole, setReviewerRole] = useState<UserRole>('INVESTIGATOR');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setStatusMessage('Please enter a substantive justification for the review decision.');
      return;
    }

    setIsSubmitting(true);
    const review: HumanReviewDecision = {
      reviewId: `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      decision,
      reviewerId,
      reviewerRole,
      timestamp: new Date().toISOString(),
      reason: reason.trim(),
      verifiedState: decision === 'CONFIRM' ? 'HUMAN_VERIFIED' : (decision === 'REJECT' ? 'REJECTED' : 'UNCERTAIN'),
      targetVehicleId: dossier.vehicleId
    };

    const updated = vehicleDossierService.addHumanReview(dossier.canonicalPlate, review);
    onDossierUpdated(updated);
    setReason('');
    setIsSubmitting(false);
    setStatusMessage('Review decision recorded into immutable verification log.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div id="investigation-review-panel" className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Human-in-the-Loop Supervisory Review
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Section 65B Admissibility Verification: Confirms or disputes automated AI attribute correlation.
          </p>
        </div>
        <SourceOfTruthBadge category="HUMAN_VERIFIED" size="md" />
      </div>

      {/* Review submission form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-950/60 p-4 rounded border border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Reviewing Officer ID</label>
            <input 
              id="input-reviewer-id"
              type="text" 
              value={reviewerId} 
              onChange={e => setReviewerId(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Officer Role / Rank</label>
            <select 
              id="select-reviewer-role"
              value={reviewerRole} 
              onChange={e => setReviewerRole(e.target.value as UserRole)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="INVESTIGATOR">Investigator (Police Sub-Inspector / PI)</option>
              <option value="SUPERVISOR">Supervisor (Deputy SP / ACP)</option>
              <option value="OPERATOR">Command Center Operator</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Forensic Verdict</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDecision('CONFIRM')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium border ${
                  decision === 'CONFIRM' 
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium border ${
                  decision === 'REJECT' 
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
              <button
                type="button"
                onClick={() => setDecision('MARK_UNCERTAIN')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium border ${
                  decision === 'MARK_UNCERTAIN' 
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Uncertain
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Officer Findings & Case Justification (Mandatory)
          </label>
          <textarea
            id="textarea-review-reason"
            rows={2}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Inspected high-res IR camera snapshot at CAM-014; confirmed vehicle make matches Mahindra Scorpio-N and characters match GJ05AB1234 without optical ambiguity."
            className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {statusMessage && (
          <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 p-2 rounded">
            {statusMessage}
          </div>
        )}

        <div className="flex justify-end">
          <button
            id="btn-submit-review"
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs rounded transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            Sign & Seal Review Decision
          </button>
        </div>
      </form>

      {/* Existing review logs */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Prior Supervisory Endorsements ({dossier.humanReviews.length})
        </h4>

        {dossier.humanReviews.length === 0 ? (
          <div className="text-xs text-slate-500 italic bg-slate-950/40 p-3 rounded border border-slate-800/40">
            No officer review recorded yet. Autonomous AI correlation stands subject to human confirmation.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {dossier.humanReviews.map((rev, idx) => (
              <div 
                key={`${rev.reviewId}-${idx}`} 
                className="bg-slate-950/80 border border-slate-800 p-3 rounded flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{rev.reviewerId}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {rev.reviewerRole}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(rev.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{rev.reason}</p>
                </div>
                <div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${
                    rev.decision === 'CONFIRM'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : rev.decision === 'REJECT'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                  }`}>
                    {rev.decision}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
