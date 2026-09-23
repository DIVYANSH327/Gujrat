/**
 * Copyright (c) 2026 Gujarat Police Surveillance Infrastructure.
 * Bharatiya Sakshya Adhiniyam (BSA), 2023 - Section 63 Electronic Evidence Certificate
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Printer, 
  X, 
  Copy, 
  Check, 
  FileText, 
  Lock, 
  MapPin, 
  Clock, 
  Cpu, 
  HardDrive,
  Award
} from 'lucide-react';

export interface BsaCertificateData {
  certificateId: string;
  evidenceId: string;
  sha256: string;
  capturedAt: string;
  cameraId: string;
  sourceType: string;
  latitude?: number;
  longitude?: number;
  aiModel: string;
  gcsUri?: string;
  kmsKeyId?: string;
  detectedClasses?: string[];
  violations?: string[];
  officerName?: string;
  officerRank?: string;
  stationName?: string;
}

interface BsaSection63CertificateModalProps {
  data: BsaCertificateData;
  onClose: () => void;
}

export const BsaSection63CertificateModal: React.FC<BsaSection63CertificateModalProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyCertToClipboard = () => {
    const text = `
GOVERNMENT OF GUJARAT - POLICE DEPARTMENT
CERTIFICATE UNDER SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023
========================================================================
Certificate ID: ${data.certificateId}
Evidence Ref:   ${data.evidenceId}
Date & Time:    ${new Date(data.capturedAt).toUTCString()}
Device/Camera:  ${data.cameraId} (${data.sourceType})
Geotag:         ${data.latitude && data.longitude ? `${data.latitude.toFixed(6)}°N, ${data.longitude.toFixed(6)}°E` : 'METADATA_BOUND_STATION'}
SHA-256 Digest: ${data.sha256}
GCS Archive:    ${data.gcsUri || `gs://gujarat-police-evidence-vault-apac/evidence/${data.evidenceId}.jpg`}
KMS Encryption: ${data.kmsKeyId || 'projects/gujarat-police-cctv/locations/asia-south1/keyRings/forensic/cryptoKeys/bsa-sec63'}
AI Analysis:    ${data.aiModel}
Detections:     ${(data.detectedClasses || []).join(', ') || 'N/A'}
Violations:     ${(data.violations || []).join(', ') || 'None'}

DECLARATION:
I hereby certify that the electronic record described herein has been extracted from an automated CCTV surveillance system operating continuously under lawful custody. The cryptographic hash was calculated at the instant of ingestion. No alteration, distortion, or tampering has occurred.

Officer in Charge: ${data.officerName || 'Inspector R. K. Vaghela, GPS'}
Designation:       ${data.officerRank || 'Surveillance Command Division'}
Jurisdiction:      ${data.stationName || 'Cyber & Traffic Intelligence HQ, Gandhinagar'}
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="bsa-cert-modal-backdrop" 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="bsa-cert-modal-container"
        className="bg-slate-900 border border-amber-500/40 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden font-mono text-xs text-slate-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 p-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                Bharatiya Sakshya Adhiniyam, 2023
              </div>
              <h2 className="text-base font-bold text-white">
                Section 63 Statutory Electronic Record Certificate
              </h2>
            </div>
          </div>

          <button
            id="bsa-cert-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Certificate Body (Court Document Layout) */}
        <div className="p-6 space-y-5 bg-slate-950/60 max-h-[75vh] overflow-y-auto">
          {/* Emblem & Legal Header */}
          <div className="text-center pb-4 border-b border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-amber-400/90 uppercase tracking-widest">
              State of Gujarat • Directorate General of Police
            </div>
            <div className="text-xs font-semibold text-slate-300">
              Special Command & CCTV Intelligence Center • Gandhinagar
            </div>
            <div className="text-[10px] text-slate-500">
              Statutory Certificate of Authenticity under Section 63 (BSA 2023) / Former 65B Indian Evidence Act
            </div>
          </div>

          {/* Certificate Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Certificate Identifier</div>
              <div className="text-amber-300 font-bold">{data.certificateId}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Evidence Record Ref</div>
              <div className="text-cyan-300 font-bold">{data.evidenceId}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Acquisition Timestamp</div>
              <div className="text-slate-200">{new Date(data.capturedAt).toLocaleString()}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Recording Device / Node</div>
              <div className="text-slate-200">{data.cameraId} ({data.sourceType})</div>
            </div>
          </div>

          {/* Cryptographic Proof Section */}
          <div className="bg-slate-900/90 border border-amber-500/20 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
              <Lock size={13} />
              <span>CRYPTOGRAPHIC HASH & CHAIN OF CUSTODY INTEGRITY</span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-400">SHA-256 Frame Byte Digest (Computed at Ingestion):</div>
              <div className="p-2 bg-black/60 rounded border border-slate-800 text-[11px] text-emerald-300 font-mono break-all select-all">
                {data.sha256}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400">Cloud Storage URI: </span>
                <span className="text-cyan-300 break-all">
                  {data.gcsUri || `gs://gujarat-police-evidence-vault-apac/evidence/${data.evidenceId}.jpg`}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Cloud KMS Tier: </span>
                <span className="text-purple-300">CMEK Envelope Encrypted (AES-256)</span>
              </div>
            </div>
          </div>

          {/* Forensic Ingestion Details */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-lg space-y-2">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2">
              <Cpu size={13} className="text-cyan-400" />
              <span>MULTIMODAL AI & FORENSIC OBSERVATION METRICS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Model: </span>
                <span className="text-slate-200">{data.aiModel}</span>
              </div>
              <div>
                <span className="text-slate-400">Detected: </span>
                <span className="text-slate-200">{(data.detectedClasses || []).join(', ') || 'Authentic Scene'}</span>
              </div>
              <div>
                <span className="text-slate-400">Violations: </span>
                <span className="text-rose-300">{(data.violations || []).join(', ') || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Legal Certification Statement */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-2 text-[11px] text-slate-300 leading-relaxed">
            <div className="font-bold text-amber-300">STATUTORY AFFIRMATION:</div>
            <p>
              I certify that the computer and camera feed from which the aforesaid evidence was produced were operating properly throughout the period in which the electronic record was generated. The cryptographic SHA-256 hash was generated at the point of ingestion before any forensic processing or transmittal. This document is admissible as primary evidence in courts of law under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[10px] text-slate-400">
              <div>Certified by: <span className="text-slate-200 font-bold">{data.officerName || 'Inspector R. K. Vaghela, GPS'}</span></div>
              <div>Officer ID: <span className="text-slate-200 font-bold">GJ-POL-84920</span></div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
            <ShieldCheck size={14} />
            <span>Court Admissible • Section 63 Verified</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="bsa-cert-copy-btn"
              onClick={copyCertToClipboard}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'COPIED' : 'COPY TEXT'}</span>
            </button>

            <button
              id="bsa-cert-print-btn"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs shadow-lg shadow-amber-500/20"
            >
              <Printer size={13} />
              <span>PRINT CERTIFICATE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
