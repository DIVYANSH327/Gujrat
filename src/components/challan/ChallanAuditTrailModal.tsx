/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ChallanAuditTrailModal: Section 65B / BSA Section 61 Electronic Evidence Audit Chain
 */

import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Clock, 
  User, 
  Hash, 
  Copy, 
  Check, 
  AlertCircle,
  Download
} from 'lucide-react';
import { ViolationCase, ChallanAuditRecord } from '../../types/v22ChallanTypes';
import { challanReviewService } from '../../services/ChallanReviewService';

interface Props {
  caseObj: ViolationCase;
  onClose: () => void;
}

export const ChallanAuditTrailModal: React.FC<Props> = ({ caseObj, onClose }) => {
  const auditRecords = challanReviewService.getCaseAuditTrail(caseObj.caseId);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDownloadCertificate = () => {
    const certText = `
================================================================================
GUJARAT POLICE TRAFFIC ENFORCEMENT & CCTV INTELLIGENCE GRID
CERTIFICATE OF ELECTRONIC EVIDENCE INTEGRITY
Under Section 61, Bharatiya Sakshya Adhiniyam, 2023 / Section 65B, Indian Evidence Act
================================================================================

CASE IDENTIFIER: ${caseObj.caseId}
CORRELATION ID: ${caseObj.correlationId}
TIMESTAMP (CAPTURE): ${caseObj.timestamp}
LOCATION: ${caseObj.location} (Lat: ${caseObj.latitude}, Lon: ${caseObj.longitude})
CAMERA ID: ${caseObj.cameraId} | EDGE NODE: ${caseObj.edgeNodeId}
VEHICLE REGISTRATION NUMBER: ${caseObj.vehiclePlate} (Normalized: ${caseObj.normalizedPlate})
VEHICLE CLASSIFICATION: ${caseObj.vehicleType} | ${caseObj.vehicleMakeModel || 'Unknown Model'}

VIOLATION TYPE: ${caseObj.violationType}
STATUTORY BASIS: Motor Vehicles Act 1988 (Amended 2019) / Gujarat Motor Vehicles Rules
EVALUATED METRIC: Observed ${caseObj.observedValue ?? 'N/A'} ${caseObj.unit ?? ''} (Allowed: ${caseObj.allowedValue ?? 'N/A'} ${caseObj.unit ?? ''})
AI DETECTION CONFIDENCE: ${(caseObj.aiConfidence * 100).toFixed(1)}% | ANPR CONFIDENCE: ${(caseObj.plateConfidence * 100).toFixed(1)}%

EVIDENTIARY HASH (SHA-256):
${caseObj.integrityHash}

INTEGRITY NOTICE:
Evidence Integrity Hash — SHA-256: Hash comparison can detect subsequent changes
to the hashed artifact. SHA-256 is provided as an integrity fingerprint.
Legal admissibility, certification, and evidentiary sufficiency depend on applicable
law, procedures, and competent-authority requirements.

REVIEWING OFFICER / ADMISSIBILITY DETAILS:
Status: ${caseObj.status}
Reviewing Officer: ${caseObj.reviewerId || 'Pending Human Review'}
Review Decision: ${caseObj.reviewDecision || 'PENDING'}
Review Decision Reason: ${caseObj.reviewReason || 'Under evidentiary evaluation'}
e-Challan Reference: ${caseObj.challanReference || 'NOT_DISPATCHED'}
e-Challan Gateway: ${caseObj.challanProvider || 'Simulated Gateway'}
Source of Record: ${caseObj.isSimulated ? 'SIMULATED DEMONSTRATION RECORD' : 'AUTHORIZED LAW ENFORCEMENT GRID'}

AUDIT TRAIL CHAIN OF CUSTODY (CHRONOLOGICAL):
${auditRecords.map((r, i) => `
[Step ${i + 1}] ${r.timestamp}
Action: ${r.action}
Actor: ${r.actorId} (${r.actorRole})
State Transition: ${r.beforeState || 'NEW'} -> ${r.afterState}
Reason: ${r.reason || 'N/A'}
Audit Checksum: ${r.integrityChecksum}
`).join('')}

================================================================================
Generated on: ${new Date().toISOString()}
Gujarat Police Command & Control Intelligence Grid
================================================================================
    `.trim();

    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CERTIFICATE_SEC61_${caseObj.caseId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Electronic Evidence Audit Certificate
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  BSA Sec 61 / 65B
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Case ID: <span className="font-mono text-cyan-400 font-semibold">{caseObj.caseId}</span> • Plate: <span className="font-mono text-amber-400 font-semibold">{caseObj.vehiclePlate}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCertificate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-medium transition"
            >
              <Download size={14} />
              Export Certificate
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Statutory Notice */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed space-y-1">
              <p className="font-semibold text-amber-300">Evidence Integrity Notice — SHA-256 Fingerprint</p>
              <p>
                Hash comparison can detect subsequent changes to the hashed artifact. SHA-256 is provided as an integrity fingerprint.
                Legal admissibility, evidentiary sufficiency, and Section 61 certificate depend on applicable statutory procedures and competent-authority authentication.
              </p>
            </div>
          </div>

          {/* Master Case Hash Fingerprint */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Hash size={14} className="text-cyan-400" />
                Evidence Package Cryptographic Hash (SHA-256)
              </span>
              <button
                onClick={() => copyToClipboard(caseObj.integrityHash, 'master')}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition font-mono"
              >
                {copiedHash === 'master' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copiedHash === 'master' ? 'Copied' : 'Copy Hash'}
              </button>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-cyan-300 break-all select-all">
              {caseObj.integrityHash}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Algorithm: <strong className="text-slate-300">SHA-256</strong></span>
              <span>Evidence Package ID: <strong className="text-slate-300">{caseObj.evidencePackageId}</strong></span>
              <span>Retention: <strong className="text-slate-300">3 Years Statutory</strong></span>
            </div>
          </div>

          {/* Case Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Capture Timestamp</span>
              <span className="text-xs font-mono font-medium text-slate-200">{caseObj.timestamp}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Camera ID / Edge</span>
              <span className="text-xs font-mono font-medium text-slate-200">{caseObj.cameraId} ({caseObj.edgeNodeId})</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Violation Type</span>
              <span className="text-xs font-medium text-amber-300">{caseObj.violationType.replace(/_/g, ' ')}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Current Status</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                {caseObj.status}
              </span>
            </div>
          </div>

          {/* Immutable Audit Trail Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock size={14} className="text-cyan-400" />
              Immutable Chain of Custody & Audit Trail ({auditRecords.length} Events)
            </h3>

            {auditRecords.length === 0 ? (
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-lg text-center text-xs text-slate-400">
                Initial ingestion logged. Awaiting subsequent human reviewer operations.
              </div>
            ) : (
              <div className="space-y-2">
                {auditRecords.map((rec, index) => (
                  <div 
                    key={rec.auditId} 
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                          {index + 1}
                        </span>
                        <strong className="text-slate-200 font-mono">{rec.action}</strong>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <User size={12} /> {rec.actorId} ({rec.actorRole})
                        </span>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px]">{rec.timestamp}</span>
                    </div>

                    {rec.reason && (
                      <p className="text-xs text-slate-300 pl-7 italic">
                        "{rec.reason}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pl-7 pt-1 border-t border-slate-900">
                      <span>Transition: <span className="font-mono text-slate-300">{rec.beforeState || 'INITIAL'}</span> → <span className="font-mono text-cyan-300">{rec.afterState}</span></span>
                      <span className="font-mono text-slate-500">Checksum: {rec.integrityChecksum.substring(0, 16)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Department: Gujarat Traffic Police Enforcement Wing</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
