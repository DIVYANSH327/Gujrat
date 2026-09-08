import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle, X, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import { AIExplainabilityRecord, ConfidenceBand } from '../types';

interface ExplainabilityModalProps {
  record?: AIExplainabilityRecord | null;
  onClose: () => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const getBandBadge = (band: ConfidenceBand) => {
    switch (band) {
      case 'VERY_HIGH':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">VERY HIGH CONFIDENCE</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">HIGH CONFIDENCE</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">MEDIUM (OVERSIGHT RECOMMENDED)</span>;
      case 'LOW':
      case 'VERY_LOW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">LOW (INSUFFICIENT EVIDENCE)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">AI Reasoning & Explainability Breakdown</h3>
            <p className="text-xs text-slate-400">Decoupled signal decomposition and decision rationale</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Target Identifier</span>
            <span className="text-sm font-semibold text-white font-mono">{record.targetId}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Confidence Evaluation</span>
            <div>{getBandBadge(record.confidenceBand)}</div>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Model Engine</span>
            <span className="text-xs font-mono text-slate-300">{record.modelProvider} ({record.modelVersion})</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Raw Probability</span>
            <span className="text-sm font-bold text-white">{Math.round(record.confidence * 100)}%</span>
          </div>
        </div>

        {/* Contributing Signals */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Contributing Telemetry Signals</span>
          </h4>
          <div className="space-y-2">
            {record.contributingSignals.map((sig, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded border border-slate-700/40 text-sm">
                <div className="flex items-center space-x-2">
                  {sig.status === 'MATCH' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : sig.status === 'PARTIAL' ? (
                    <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-medium text-slate-200 block">{sig.signal}</span>
                    <span className="text-xs text-slate-400 font-mono">{sig.value}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Weight {sig.weight}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicting Signals */}
        {record.conflictingSignals && record.conflictingSignals.length > 0 && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1.5 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Conflicting Signals Detected</span>
            </h4>
            <ul className="list-disc list-inside text-xs text-rose-200 space-y-1">
              {record.conflictingSignals.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Decision Summary */}
        <div className="p-3.5 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-xs font-semibold text-slate-300 mb-1">Decision Summary</h4>
          <p className="text-xs text-slate-400 leading-relaxed">{record.decisionSummary}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-600 transition"
          >
            Close Decomposition
          </button>
        </div>
      </div>
    </div>
  );
};
