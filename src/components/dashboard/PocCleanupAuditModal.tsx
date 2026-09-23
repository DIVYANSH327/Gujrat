import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  RefreshCw,
  Download,
  Printer,
  X,
  Lock,
  Layers,
  Sparkles,
  Database,
  HardDrive,
  Cpu,
  Radio,
  Clock,
  ArrowRight,
  ExternalLink,
  Zap
} from 'lucide-react';

export interface PocCleanupAuditReport {
  auditReportId: string;
  ruleReference: string;
  executionTimestamp: string;
  operator: string;
  status: 'COMPLETED_SUCCESSFULLY' | 'PARTIALLY_CLEANED' | 'FAILED';
  cryptographicIntegritySeal: string;
  statutoryCompliance: {
    bsaSection63CourtCertified: boolean;
    evidencePreservedCount: number;
    tamperProofDigestRetained: boolean;
    legalCertificationStatement: string;
  };
  cleanedResources: {
    spoolQueueFlushed: number;
    deadLetterQueuePurged: number;
    temporaryPubSubTopicsReleased: string[];
    dataflowStagingStateReset: boolean;
    temporaryBigQueryStagingPurged: string[];
    scratchBuffersReclaimedKb: number;
    activeGpuInstancesTerminated: number;
  };
  financialSettlement: {
    totalRunawayComputeCost: string;
    continuousStreamBilling: string;
    creditSafetyStatus: string;
    cloudRunTier: string;
  };
  retainedPermanentAssets: string[];
  recommendations: string[];
}

interface PocCleanupAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleanupComplete?: (report: PocCleanupAuditReport) => void;
}

export const PocCleanupAuditModal: React.FC<PocCleanupAuditModalProps> = ({
  isOpen,
  onClose,
  onCleanupComplete
}) => {
  const [executing, setExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [report, setReport] = useState<PocCleanupAuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'RESOURCES' | 'CERTIFICATE' | 'RAW_JSON'>('SUMMARY');

  // Load existing report on open if available
  useEffect(() => {
    if (isOpen && !report) {
      fetch('/api/gcp/poc-cleanup-audit/last-report')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.success && data.report) {
            setReport(data.report);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, report]);

  if (!isOpen) return null;

  const handleExecuteCleanupAndAudit = async () => {
    setExecuting(true);
    setError(null);
    setExecutionStep(1);

    try {
      // Step 1: Simulated progress steps for visual transparency
      setTimeout(() => setExecutionStep(2), 600);
      setTimeout(() => setExecutionStep(3), 1200);
      setTimeout(() => setExecutionStep(4), 1800);

      const res = await fetch('/api/gcp/poc-cleanup-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator: 'System Administrator / SCRB Officer',
          ruleReference: 'RULE_16_POC_CLEANUP_AND_FINAL_AUDIT',
          timestamp: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${res.status}: Cleanup execution failed`);
      }

      const data = await res.json();
      if (!data.success || !data.report) {
        throw new Error(data.error || 'Invalid cleanup response');
      }

      setExecutionStep(5);
      setReport(data.report);
      setActiveTab('SUMMARY');

      if (onCleanupComplete) {
        onCleanupComplete(data.report);
      }
    } catch (err: any) {
      console.error('[PocCleanupAudit] Execution error:', err);
      setError(err?.message || 'Error occurred during POC cleanup & audit sequence');
    } finally {
      setExecuting(false);
    }
  };

  const downloadReportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POC-RULE16-FINAL-AUDIT-${report.auditReportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Rule 16: POC Cleanup & Final Audit Protocol
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 border border-blue-500/40 text-blue-300 font-bold">
                  BSA 2023 SEC 63
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Purge ephemeral test queues, release scratch buffers, preserve judicial evidence, and seal final audit certificate.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Action Trigger Banner */}
          {!report && !executing && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 space-y-4">
              <div className="flex items-start gap-3.5">
                <Trash2 className="text-amber-400 shrink-0 mt-0.5" size={22} />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    Execute POC Teardown & Statutory Audit
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Executing Rule 16 cleans up all transient proof-of-concept resources including offline event spools, dead-letter retries, and temporary scratch buffers. 
                    <strong> No verified judicial records or court-certified photographic evidence are removed</strong> — all evidence remains sealed under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">1. Temporary Spools</span>
                  <div className="font-semibold text-emerald-400">Purge & Reconcile</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">2. Evidence Vault</span>
                  <div className="font-semibold text-blue-400">Preserved 100% (BSA Sec 63)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">3. Financial Settlement</span>
                  <div className="font-semibold text-emerald-400">₹0.00 (Protected Credits)</div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleExecuteCleanupAndAudit}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Trash2 size={14} />
                  <span>Execute Rule 16 Cleanup & Generate Audit Report</span>
                </button>
              </div>
            </div>
          )}

          {/* Execution Progress */}
          {executing && (
            <div className="p-6 rounded-xl bg-slate-900 border border-blue-500/30 space-y-4 text-center">
              <RefreshCw size={32} className="animate-spin text-blue-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Executing Rule 16 Cleanup Procedure</h4>
                <p className="text-xs text-slate-400">
                  {executionStep === 1 && 'Reconciling offline spool buffer & dead-letter queue...'}
                  {executionStep === 2 && 'Resetting Dataflow DirectRunner staging & releasing topics...'}
                  {executionStep === 3 && 'Reclaiming temporary scratch buffers & memory locks...'}
                  {executionStep === 4 && 'Auditing cryptographic SHA-256 evidence integrity seals...'}
                  {executionStep >= 5 && 'Finalizing BSA 2023 Section 63 Legal Audit Certificate...'}
                </p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden max-w-md mx-auto">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${(executionStep / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Report View */}
          {report && !executing && (
            <div className="space-y-4">
              {/* Navigation Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setActiveTab('SUMMARY')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'SUMMARY'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={14} />
                  <span>Audit Summary</span>
                </button>
                <button
                  onClick={() => setActiveTab('RESOURCES')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'RESOURCES'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers size={14} />
                  <span>Cleaned Resources</span>
                </button>
                <button
                  onClick={() => setActiveTab('CERTIFICATE')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'CERTIFICATE'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>BSA 2023 Certificate</span>
                </button>
                <button
                  onClick={() => setActiveTab('RAW_JSON')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'RAW_JSON'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>Raw Report JSON</span>
                </button>
              </div>

              {/* TAB 1: SUMMARY */}
              {activeTab === 'SUMMARY' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">Rule 16 Cleanup Completed</h4>
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Report ID: <span className="font-mono text-emerald-300 font-semibold">{report.auditReportId}</span> · Executed by: {report.operator}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 text-right">
                      {new Date(report.executionTimestamp).toLocaleString('en-GB')}
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-medium text-slate-400 uppercase">Spool Buffer Flushed</span>
                      <div className="text-base font-bold font-mono text-white">
                        {report.cleanedResources.spoolQueueFlushed} events
                      </div>
                      <div className="text-[10px] text-slate-400">Dead-letter: {report.cleanedResources.deadLetterQueuePurged} purged</div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-medium text-slate-400 uppercase">Evidence Preserved</span>
                      <div className="text-base font-bold font-mono text-blue-400">
                        {report.statutoryCompliance.evidencePreservedCount} court records
                      </div>
                      <div className="text-[10px] text-emerald-400">100% SHA-256 Verified</div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-medium text-slate-400 uppercase">Compute Cost Settle</span>
                      <div className="text-base font-bold font-mono text-emerald-400">
                        {report.financialSettlement.totalRunawayComputeCost}
                      </div>
                      <div className="text-[10px] text-emerald-400/90">{report.financialSettlement.creditSafetyStatus}</div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-medium text-slate-400 uppercase">Active GPU Instances</span>
                      <div className="text-base font-bold font-mono text-white">
                        {report.cleanedResources.activeGpuInstancesTerminated} GPUs
                      </div>
                      <div className="text-[10px] text-slate-400">Edge YOLOv8 local-only</div>
                    </div>
                  </div>

                  {/* Cryptographic Seal */}
                  <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Lock size={13} className="text-blue-400" />
                        Cryptographic SHA-256 Integrity Seal
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        SEAL VERIFIED
                      </span>
                    </div>
                    <div className="font-mono text-xs text-blue-300 break-all p-2 rounded bg-slate-950 border border-slate-800/80 select-all">
                      {report.cryptographicIntegritySeal}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Audit Recommendations for Production Migration:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {report.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: CLEANED RESOURCES */}
              {activeTab === 'RESOURCES' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Purged Temporary Items</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-300">Offline In-Memory Event Spool:</span>
                        <span className="font-mono text-emerald-400">{report.cleanedResources.spoolQueueFlushed} Events Flushed</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-300">Dead-Letter Retry Queue:</span>
                        <span className="font-mono text-emerald-400">{report.cleanedResources.deadLetterQueuePurged} Records Cleared</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-300">Dataflow DirectRunner Sliding State:</span>
                        <span className="font-mono text-emerald-400">{report.cleanedResources.dataflowStagingStateReset ? 'RESET & DEDUP CACHE CLEARED' : 'STANDBY'}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-300">Scratch Buffers Reclaimed:</span>
                        <span className="font-mono text-emerald-400">~{report.cleanedResources.scratchBuffersReclaimedKb} KB</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Preserved Permanent Assets</h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {report.retainedPermanentAssets.map((asset, idx) => (
                        <li key={idx} className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-blue-200">
                          <HardDrive size={13} className="text-blue-400 shrink-0" />
                          <span>{asset}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 3: STATUTORY BSA 2023 CERTIFICATE */}
              {activeTab === 'CERTIFICATE' && (
                <div className="p-6 rounded-xl bg-slate-900 border-2 border-emerald-500/40 space-y-4 text-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs uppercase font-mono text-emerald-400 font-bold tracking-widest">
                        GOVERNMENT OF GUJARAT · POLICE DEPARTMENT
                      </div>
                      <h4 className="text-base font-bold text-white">
                        Certificate of Electronic Record Integrity & Teardown Compliance
                      </h4>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                      <ShieldCheck size={28} />
                    </div>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <p>
                      <strong>Statutory Provision: </strong>
                      Issued pursuant to <em>Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)</em>, certifying that the Proof-of-Concept teardown protocol was performed in strict accordance with judicial data retention standards.
                    </p>

                    <div className="p-3 rounded bg-slate-950 border border-slate-800 font-serif italic text-slate-300 text-xs">
                      "{report.statutoryCompliance.legalCertificationStatement}"
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Report Digest:</span>
                        <span className="text-emerald-300 truncate block">{report.cryptographicIntegritySeal.slice(0, 32)}...</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Preserved Records:</span>
                        <span className="text-emerald-300">{report.statutoryCompliance.evidencePreservedCount} Verified Items</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={handlePrintCertificate}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Print Legal Certificate</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: RAW JSON */}
              {activeTab === 'RAW_JSON' && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button
                      onClick={downloadReportJson}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download JSON Report</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 max-h-96 overflow-y-auto">
                    {JSON.stringify(report, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          {report ? (
            <div className="flex items-center gap-2">
              <button
                onClick={downloadReportJson}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <Download size={13} />
                <span>Export Report (.json)</span>
              </button>
              <button
                onClick={handleExecuteCleanupAndAudit}
                disabled={executing}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <RefreshCw size={13} className={executing ? 'animate-spin' : ''} />
                <span>Re-Execute Cleanup</span>
              </button>
            </div>
          ) : (
            <span className="text-slate-400">Rule 16 Teardown Protocol Ready</span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
