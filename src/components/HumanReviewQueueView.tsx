import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Shield, 
  Camera, 
  Search, 
  Filter,
  Check,
  X,
  FileCheck,
  Cpu
} from 'lucide-react';
import { humanReviewQueueService } from '../services/HumanReviewQueueService';
import { confidencePolicyService } from '../services/ConfidencePolicyService';
import { sysEvents } from '../services/Architecture';
import { HumanReviewItem, ReviewType, ReviewStatus } from '../types';
import { ExplainabilityModal } from './ExplainabilityModal';

export const HumanReviewQueueView: React.FC = () => {
  const [items, setItems] = useState<HumanReviewItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');

  // Decision Form
  const [reviewerName, setReviewerName] = useState('Inspector V. Jadeja');
  const [reviewerComment, setReviewerComment] = useState('');
  const [showExplainModal, setShowExplainModal] = useState(false);

  const refreshItems = () => {
    const list = humanReviewQueueService.listReviewItems();
    setItems(list);
    if (!selectedItemId && list.length > 0) {
      setSelectedItemId(list[0].reviewId);
    }
  };

  useEffect(() => {
    refreshItems();
    const unsub1 = sysEvents.on('REVIEW_ENQUEUED', refreshItems);
    const unsub2 = sysEvents.on('REVIEW_RESOLVED', refreshItems);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const filteredItems = items.filter(item => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterType !== 'ALL' && item.reviewType !== filterType) return false;
    return true;
  });

  const selectedItem = items.find(i => i.reviewId === selectedItemId) || filteredItems[0];

  const handleDecision = (decision: 'APPROVED' | 'REJECTED' | 'DISPUTED') => {
    if (!selectedItem) return;
    humanReviewQueueService.submitDecision({
      reviewId: selectedItem.reviewId,
      decision,
      reviewerId: 'OFFICER-741',
      reviewerName,
      comment: reviewerComment.trim() || (decision === 'APPROVED' ? 'Verified and approved by officer.' : 'Disputed by officer.')
    });

    setReviewerComment('');
    refreshItems();
  };

  const explainabilityRecord = selectedItem
    ? confidencePolicyService.createExplainabilityRecord({
        targetType: selectedItem.reviewType.includes('WATCHLIST') ? 'WATCHLIST' : selectedItem.reviewType.includes('VIOLATION') ? 'VIOLATION' : 'ANPR',
        targetId: selectedItem.subjectPlate || selectedItem.reviewId,
        signals: selectedItem.contributingSignals.map(s => ({
          label: s.signal,
          value: s.value,
          match: s.status === 'MATCH',
          partial: s.status === 'PARTIAL',
          weight: s.weight
        })),
        conflictingSignals: selectedItem.conflictingSignals,
        missingSignals: selectedItem.missingSignals
      })
    : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">HUMAN REVIEW & VERIFICATION QUEUE</h1>
              <p className="text-xs text-slate-400">Constitutional supervision gate for autonomous ANPR, watchlist candidates, and traffic enforcement</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700">
            Pending Reviews: <span className="text-amber-400 font-bold">{items.filter(i => i.status === 'PENDING').length}</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'DISPUTED', 'ALL'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterStatus === st ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs"
        >
          <option value="ALL">All Review Types</option>
          <option value="WATCHLIST_MATCH">WATCHLIST MATCH</option>
          <option value="PLATE_VERIFICATION">PLATE VERIFICATION</option>
          <option value="VIOLATION_REVIEW">VIOLATION REVIEW</option>
          <option value="CROSS_CAMERA_MATCH">CROSS CAMERA MATCH</option>
        </select>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {filteredItems.map(item => {
            const isSelected = item.reviewId === selectedItem?.reviewId;
            return (
              <div
                key={item.reviewId}
                onClick={() => setSelectedItemId(item.reviewId)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected 
                    ? 'bg-slate-800 border-amber-500 shadow-md ring-1 ring-amber-500/30' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-slate-300">{item.reviewId}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    item.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white font-mono">{item.subjectPlate || 'UNKNOWN'}</span>
                  <span className="text-[11px] text-slate-400">{item.reviewType.replace(/_/g, ' ')}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>Confidence: <strong className="text-indigo-400">{Math.round(item.originalConfidence * 100)}%</strong></span>
                  <span>{item.cameraId}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail (8 cols) */}
        {selectedItem && (
          <div className="lg:col-span-8 space-y-6">
            {/* Main Review Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {selectedItem.reviewId}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedItem.reviewType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Camera: {selectedItem.cameraId}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Verification Subject: <span className="font-mono text-indigo-400">{selectedItem.subjectPlate || 'Target Frame'}</span>
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block mb-0.5">Raw AI Confidence</span>
                  <span className="text-lg font-bold text-white">{Math.round(selectedItem.originalConfidence * 100)}%</span>
                </div>
              </div>

              {/* Evidence Frame Preview */}
              {selectedItem.evidenceThumbnail && (
                <div className="mb-5 rounded-lg overflow-hidden border border-slate-700 bg-black">
                  <img 
                    src={selectedItem.evidenceThumbnail} 
                    alt="Review Target" 
                    referrerPolicy="no-referrer"
                    className="w-full h-56 object-cover" 
                  />
                  <div className="p-2.5 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                    <span>CCTV SIGHTING SNAPSHOT (REAL-TIME FRAME SAMPLER)</span>
                    <span className="text-emerald-400">UNALTERED EVIDENCE</span>
                  </div>
                </div>
              )}

              {/* Raw AI Inference Details */}
              <div className="mb-5 p-3.5 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs">
                <span className="text-slate-400 uppercase font-semibold block mb-1.5">Raw AI Inference Output:</span>
                <pre className="text-slate-200 font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedItem.originalInference, null, 2)}
                </pre>
              </div>

              {/* Contributing Signal Breakdown */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Contributing Telemetry Signals
                  </h4>
                  <button
                    onClick={() => setShowExplainModal(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Explain AI Reasoning</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {selectedItem.contributingSignals.map((sig, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded border border-slate-700/40">
                      <div>
                        <span className="font-semibold text-slate-200 block">{sig.signal}</span>
                        <span className="text-slate-400">{sig.value}</span>
                      </div>
                      <span className="text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Weight: {sig.weight}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conflicting / Missing Signals Notice */}
              {((selectedItem.conflictingSignals && selectedItem.conflictingSignals.length > 0) ||
                (selectedItem.missingSignals && selectedItem.missingSignals.length > 0)) && (
                <div className="mb-5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-2">
                  {selectedItem.conflictingSignals.length > 0 && (
                    <div>
                      <span className="font-bold text-amber-400 block mb-0.5">Conflicting Signals Detected:</span>
                      <ul className="list-disc list-inside text-amber-200">
                        {selectedItem.conflictingSignals.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  {selectedItem.missingSignals.length > 0 && (
                    <div>
                      <span className="font-bold text-amber-400 block mb-0.5">Missing Telemetry Signals:</span>
                      <ul className="list-disc list-inside text-amber-200">
                        {selectedItem.missingSignals.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Form if Pending */}
              {selectedItem.status === 'PENDING' ? (
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Record Authoritative Human Review</h4>
                  <p className="text-[11px] text-slate-400">
                    Important: Submitting review records authoritative officer decision without modifying original AI telemetry.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Reviewing Officer</label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Review Justification</label>
                      <input
                        type="text"
                        value={reviewerComment}
                        onChange={(e) => setReviewerComment(e.target.value)}
                        placeholder="Enter formal justification..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleDecision('APPROVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Authorize</span>
                    </button>
                    <button
                      onClick={() => handleDecision('REJECTED')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject Candidate</span>
                    </button>
                    <button
                      onClick={() => handleDecision('DISPUTED')}
                      className="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Flag for Investigation</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Already Resolved Card */
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700 text-xs space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-white">
                    <FileCheck className="w-4 h-4 text-indigo-400" />
                    <span>Decision Recorded: {selectedItem.humanDecision}</span>
                  </div>
                  <p className="text-slate-300">Reviewed by: {selectedItem.reviewerName} at {new Date(selectedItem.decidedAt || '').toLocaleString()}</p>
                  <p className="text-slate-400 italic">Notes: {selectedItem.humanComment}</p>
                  <p className="text-slate-400 pt-1 font-mono text-[10px]">Source of Truth: {selectedItem.sourceOfTruth}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explainability Modal */}
      {showExplainModal && explainabilityRecord && (
        <ExplainabilityModal
          record={explainabilityRecord}
          onClose={() => setShowExplainModal(false)}
        />
      )}
    </div>
  );
};
