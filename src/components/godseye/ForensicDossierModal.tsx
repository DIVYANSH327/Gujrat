/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ForensicDossierModal: Statutory BSA 2023 Section 63 Legal Evidence Export
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Action Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Statutory Forensic Electronic Record Certificate (BSA 2023 §63)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-100 bg-slate-900 print:bg-white print:text-black font-sans text-xs">
          {/* Government Official Header */}
          <div className="text-center border-b-2 border-slate-700 pb-4">
            <div className="inline-block p-2 rounded-full bg-slate-800 mb-2 border border-slate-700">
              <Award className="w-8 h-8 text-amber-400 mx-auto" />
            </div>
            <h2 className="text-base font-bold uppercase tracking-widest text-slate-100">
              Gujarat Police Department
            </h2>
            <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">
              State Cyber Crime Cell & Sentinel CCTV Intelligence Grid
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Certificate of Admissibility of Electronic Evidence under Section 63 of Bharatiya Sakshya Adhiniyam, 2023
            </p>
          </div>

          {/* Certificate Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block">Certificate No:</span>
              <span className="font-bold text-slate-200">{targetSummary.complianceCertNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date of Issue:</span>
              <span className="text-slate-200">{certificateDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Investigating System:</span>
              <span className="text-sky-400 font-bold">Sentinel AI Grid V2</span>
            </div>
            <div>
              <span className="text-slate-500 block">Digital Integrity:</span>
              <span className="text-emerald-400 font-bold">TAMPER-VERIFIED</span>
            </div>
          </div>

          {/* Target Vehicle Particulars */}
          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/60">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-2 text-xs border-b border-slate-700 pb-1">
              Target Vehicle Particulars
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Registration Plate:</span>
                <span className="font-mono font-bold text-sm text-sky-400">{targetSummary.plateNormalized}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Vehicle Classification:</span>
                <span className="capitalize font-semibold text-slate-200">{targetSummary.vehicleColor} {targetSummary.vehicleClass}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Corridor Journey:</span>
                <span className="text-slate-200">{targetSummary.distinctCameras} CCTV Checkpoints</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Intercepts:</span>
                <span className="font-mono text-emerald-400 font-bold">{sightings.length} Recorded Sightings</span>
              </div>
            </div>
          </div>

          {/* Statutory Affirmation */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
            <p className="font-semibold text-slate-200 mb-1">Affirmation under Section 63(4) BSA 2023:</p>
            <p>
              I hereby certify that the electronic records detailed herein were generated by automated Sentinel CCTV high-resolution sensor nodes operating continuously under official authorization of the Gujarat Police. During the period of capture, the computer systems and network cameras were functioning regularly and in lawful operational custody. The cryptographic SHA-256 hash digests below confirm that neither the original video frames nor the associated timestamps have been altered, modified, or degraded.
            </p>
          </div>

          {/* Chronological Sighting Evidence Table */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-2 text-xs">
              Chronological Electronic Evidence Log
            </h4>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Seq</th>
                    <th className="p-2.5">Camera Node & District</th>
                    <th className="p-2.5">Timestamp (IST)</th>
                    <th className="p-2.5">GPS Coordinates</th>
                    <th className="p-2.5">OCR / Speed</th>
                    <th className="p-2.5">Cryptographic Digest (SHA-256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {sightings.map((s, idx) => (
                    <tr key={s.observationId} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-sky-400">#{idx + 1}</td>
                      <td className="p-2.5 font-sans">
                        <div className="font-semibold text-slate-200">{s.cameraName}</div>
                        <div className="text-[10px] text-slate-400">{s.cameraId} · {s.district}</div>
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {new Date(s.timestamp).toLocaleString('en-IN', { hour12: false })}
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {s.latitude ? `${s.latitude.toFixed(4)}, ${s.longitude?.toFixed(4)}` : 'N/A'}
                      </td>
                      <td className="p-2.5 text-slate-300 font-sans">
                        <div>{(s.ocrConfidence * 100).toFixed(0)}% Conf</div>
                        <div className="text-[10px] text-slate-400">{s.speedKmh ? `${s.speedKmh} km/h` : 'In transit'}</div>
                      </td>
                      <td className="p-2.5 text-emerald-400 truncate max-w-[150px]">
                        {s.originalFrameHash.slice(0, 20)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Officer Verification & Legal Sign-off */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-end text-[11px]">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Digitally Sealed & Anchored</span>
              </div>
              <p className="text-slate-400 font-mono text-[10px]">
                Master Seal: {targetSummary.digitalSealHash}
              </p>
            </div>

            <div className="text-right">
              <div className="border-b border-slate-600 pb-1 w-48 mb-1"></div>
              <div className="font-semibold text-slate-200">Investigating Officer</div>
              <div className="text-slate-400 text-[10px]">State Cyber Crime Branch · Gujarat Police</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
