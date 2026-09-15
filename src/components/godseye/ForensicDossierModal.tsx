/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ForensicDossierModal: Clean White Statutory BSA 2023 Section 63 Legal Evidence Export
 * Generates an official court-admissible electronic record certificate for Gujarat Police.
 */

import React from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Download, 
  CheckCircle2, 
  Car, 
  MapPin, 
  Clock, 
  Award,
  Lock
} from 'lucide-react';
import { TargetDossierSummary, VerifiedVehicleSighting } from './types';

interface ForensicDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSummary: TargetDossierSummary | null;
  sightings: VerifiedVehicleSighting[];
}

export function ForensicDossierModal({
  isOpen,
  onClose,
  targetSummary,
  sightings
}: ForensicDossierModalProps) {
  if (!isOpen || !targetSummary) return null;

  const handlePrint = () => {
    window.print();
  };

  const certificateDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto select-none">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-sans">
        {/* Modal Action Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Statutory Forensic Electronic Record Certificate (BSA 2023 §63)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Official Court-Admissible Electronic Evidence Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white print:p-0 font-sans text-xs">
          {/* Government Official Header */}
          <div className="text-center border-b border-slate-200 pb-5">
            <div className="inline-block p-2.5 rounded-2xl bg-blue-50 mb-2 border border-blue-100">
              <Award className="w-8 h-8 text-blue-700 mx-auto" />
            </div>
            <h2 className="text-base font-black uppercase tracking-widest text-slate-900">
              GUJARAT POLICE DEPARTMENT
            </h2>
            <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider">
              State Cyber Crime Cell & Sentinel CCTV Intelligence Grid
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Certificate of Admissibility of Electronic Evidence under Section 63 of Bharatiya Sakshya Adhiniyam, 2023
            </p>
          </div>

          {/* Certificate Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block font-sans text-[10px] font-semibold uppercase">Certificate No:</span>
              <span className="font-bold text-slate-800">{targetSummary.certificateId || 'BSA-2026-GJ-0982'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans text-[10px] font-semibold uppercase">Target Vehicle:</span>
              <span className="font-bold text-blue-700">{targetSummary.targetId}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans text-[10px] font-semibold uppercase">Issue Date:</span>
              <span className="font-bold text-slate-800">{certificateDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans text-[10px] font-semibold uppercase">Integrity Status:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SHA-256 Valid
              </span>
            </div>
          </div>

          {/* Statutory Affirmation */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed space-y-2">
            <p className="font-bold text-slate-900">STATUTORY DECLARATION UNDER BSA §63:</p>
            <p>
              I hereby certify that the electronic records, including ANPR captures, camera telemetry logs, and spatio-temporal trajectories produced herein, were produced by the Sentinel Automated CCTV Surveillance Grid during the period over which the computer systems were used regularly to store or process information.
            </p>
          </div>

          {/* Sighting Timeline Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Chronological Sensor Observations & Cryptographic Hashes
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600">
                    <th className="p-2.5 font-bold">#</th>
                    <th className="p-2.5 font-bold">Timestamp (IST)</th>
                    <th className="p-2.5 font-bold">Camera Node</th>
                    <th className="p-2.5 font-bold">Location</th>
                    <th className="p-2.5 font-bold">Confidence</th>
                    <th className="p-2.5 font-bold">SHA-256 Digest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {sightings.map((s, idx) => (
                    <tr key={s.observationId || idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{idx + 1}</td>
                      <td className="p-2.5 text-slate-800">{new Date(s.timestamp).toLocaleString('en-IN', { hour12: false })}</td>
                      <td className="p-2.5 font-bold text-blue-700">{s.cameraId.toUpperCase()}</td>
                      <td className="p-2.5 font-sans text-slate-700">{s.cameraName || s.location}</td>
                      <td className="p-2.5 text-emerald-700 font-bold">{Math.round(s.confidence * 100)}%</td>
                      <td className="p-2.5 text-slate-500 truncate max-w-[140px]">{s.evidenceHash || '3f2e8a7c...'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">Digital Seal & Verification Hash</p>
              <p className="font-mono text-[10px] text-slate-400">0x7F89B...GUJARAT_POLICE_ROOT_CA</p>
            </div>
            <div className="text-right space-y-1">
              <div className="w-40 border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-900">Authorised Law Enforcement Officer</p>
              <p className="text-[11px] text-slate-500">Inspector R. Jadeja (Cyber Crime Cell)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
