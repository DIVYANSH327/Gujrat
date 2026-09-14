/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Mobile Patrol AI Mesh Judicial Tribunal Modal
 * Full multi-agent consensus deliberation and statutory judgment under CMVR Rule 50 & BSA 2023.
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  FileText, 
  CheckCircle2, 
  Scale, 
  Award, 
  Hash, 
  MapPin, 
  Gauge, 
  Cpu, 
  ExternalLink,
  ChevronRight,
  Printer
} from 'lucide-react';
import { AIMeshJudicialVerdict } from '../types/mobilePatrolHsrpTypes';

interface MobilePatrolJudicialModalProps {
  verdict: AIMeshJudicialVerdict | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMesh?: () => void;
}

export const MobilePatrolJudicialModal: React.FC<MobilePatrolJudicialModalProps> = ({
  verdict,
  isOpen,
  onClose,
  onNavigateToMesh
}) => {
  const [activeTab, setActiveTab] = useState<'ruling' | 'agents' | 'certificate'>('ruling');
  const [challanIssued, setChallanIssued] = useState(verdict?.actionsTaken?.challanIssued || false);
  const [challanId, setChallanId] = useState<string | null>(verdict?.actionsTaken?.challanId || null);
  const [isIssuingChallan, setIsIssuingChallan] = useState(false);

  if (!isOpen || !verdict) return null;

  const isVerified = verdict.decision === 'HSRP_VERIFIED';
  const isViolation = verdict.decision === 'HSRP_NOT_VERIFIED';

  const handleIssueChallan = async () => {
    setIsIssuingChallan(true);
    try {
      const res = await fetch('/api/ai-mesh/issue-challan-from-judgment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdictId: verdict.verdictId })
      });
      if (res.ok) {
        const data = await res.json();
        setChallanIssued(true);
        setChallanId(data.challanId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsIssuingChallan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isVerified 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
                : isViolation 
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' 
                : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
            }`}>
              <Scale size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  AI AGENT MESH JUDICIAL TRIBUNAL
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-500/30">
                  RULE 50 CMVR 1989
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Verdict ID: {verdict.verdictId} • Unit: {verdict.unitId}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('ruling')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
              activeTab === 'ruling'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            JUDICIAL RULING & EVIDENCE
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
              activeTab === 'agents'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            MULTI-AGENT DELIBERATIONS (5)
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
              activeTab === 'certificate'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            BSA 2023 EVIDENCE CERTIFICATE
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {activeTab === 'ruling' && (
            <div className="space-y-6">
              
              {/* Grand Verdict Banner */}
              <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isVerified
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : isViolation
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Statutory Ruling</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                      Consensus: {Math.round(verdict.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono tracking-tight">
                    {verdict.decision === 'HSRP_VERIFIED' && '✓ STATUTORY HSRP VERIFIED (COMPLIANT)'}
                    {verdict.decision === 'HSRP_NOT_VERIFIED' && '⚠ HSRP VIOLATION: NON-COMPLIANT PLATE'}
                    {verdict.decision === 'NEEDS_BETTER_CAPTURE' && '⟳ NEEDS BETTER CAPTURE'}
                    {verdict.decision === 'UNCERTAIN' && '? UNCERTAIN / INDETERMINATE'}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1">
                    {verdict.agentDeliberations.finalMeshArbiter.summary}
                  </p>
                </div>

                {isViolation && (
                  <div className="shrink-0 flex flex-col gap-2">
                    <button
                      onClick={handleIssueChallan}
                      disabled={challanIssued || isIssuingChallan}
                      className={`px-4 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-2 cursor-pointer transition-all ${
                        challanIssued
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                      }`}
                    >
                      <AlertTriangle size={16} />
                      {challanIssued ? `e-CHALLAN ISSUED (${challanId})` : isIssuingChallan ? 'ISSUING CHALLAN...' : 'ISSUE e-CHALLAN (₹5,000)'}
                    </button>
                  </div>
                )}
              </div>

              {/* Vehicle & Plate Snapshot Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full Vehicle Snapshot */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="font-bold text-slate-200">DASHCAM VEHICLE SNAPSHOT</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px]">PATROL UNIT CAPTURE</span>
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                    <img 
                      src={verdict.fullSnapshotUrl} 
                      alt="Vehicle Snapshot" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-emerald-400 border border-white/10">
                      {verdict.vehicleClass.toUpperCase()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                    <div>Speed: <span className="text-white">{verdict.speedKmH} km/h</span></div>
                    <div>Quality: <span className="text-emerald-400">{verdict.qualityScore}/100</span></div>
                    <div>GPS: <span className="text-white">{verdict.gps?.latitude.toFixed(4)}, {verdict.gps?.longitude.toFixed(4)}</span></div>
                    <div>Engine: <span className="text-blue-400">{verdict.aiEngineUsed}</span></div>
                  </div>
                </div>

                {/* Plate Crop & HSRP Security Audit */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="font-bold text-slate-200">HSRP SECURITY ATTRIBUTES (CMVR RULE 50)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isVerified ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {verdict.plateText}
                    </span>
                  </div>

                  {/* High Security Plate Breakdown */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-300">1. Blue "IND" Country Margin</span>
                      <span className={verdict.agentDeliberations.hsrpForensics.details.indBlueStrip ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {verdict.agentDeliberations.hsrpForensics.details.indBlueStrip ? '✓ PRESENT' : '✗ ABSENT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-300">2. Chromium Ashoka Chakra Hologram</span>
                      <span className={verdict.agentDeliberations.hsrpForensics.details.ashokaChakraHologram ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {verdict.agentDeliberations.hsrpForensics.details.ashokaChakraHologram ? '✓ PRESENT' : '✗ ABSENT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-300">3. 10-Digit Laser Etched PIN</span>
                      <span className={verdict.agentDeliberations.hsrpForensics.details.laserEtchedPin ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {verdict.agentDeliberations.hsrpForensics.details.laserEtchedPin ? '✓ PRESENT' : '✗ ABSENT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-300">4. 45° "INDIA" Inscription Foil</span>
                      <span className={verdict.agentDeliberations.hsrpForensics.details.indiaHotStampFoil ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {verdict.agentDeliberations.hsrpForensics.details.indiaHotStampFoil ? '✓ PRESENT' : '✗ ABSENT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-300">5. Tamper-Proof Snap-Locks</span>
                      <span className={verdict.agentDeliberations.hsrpForensics.details.snapLockRivets ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {verdict.agentDeliberations.hsrpForensics.details.snapLockRivets ? '✓ INTACT' : '✗ ABSENT'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Legal & Penalty Notice */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-slate-400 font-bold">STATUTORY LEGAL PROVISIONS:</div>
                <p className="text-slate-300">
                  {verdict.agentDeliberations.finalMeshArbiter.legalClause}
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap justify-between items-center text-slate-400">
                  <span>Prescribed Penalty: <span className="text-amber-400 font-bold">{verdict.agentDeliberations.finalMeshArbiter.suggestedPenalty}</span></span>
                  <span>Enforcement Action: <span className="text-white font-bold">{verdict.agentDeliberations.finalMeshArbiter.enforcementAction}</span></span>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-4">
              <div className="text-xs font-mono text-slate-400">
                Detailed reasoning and deliberation records from the 5 specialized AI Mesh agents:
              </div>

              {/* Agent 1: Vehicle Classification */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400">🚗 {verdict.agentDeliberations.vehicleClassification.agentName}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">
                    {Math.round(verdict.agentDeliberations.vehicleClassification.confidence * 100)}% CONFIDENCE
                  </span>
                </div>
                <div className="text-slate-200 font-bold">{verdict.agentDeliberations.vehicleClassification.verdict}</div>
                <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1">
                  {verdict.agentDeliberations.vehicleClassification.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              {/* Agent 2: Evidence Quality */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400">🔍 {verdict.agentDeliberations.evidenceQuality.agentName}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">
                    {Math.round(verdict.agentDeliberations.evidenceQuality.confidence * 100)}% CONFIDENCE
                  </span>
                </div>
                <div className="text-slate-200 font-bold">{verdict.agentDeliberations.evidenceQuality.verdict}</div>
                <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1">
                  {verdict.agentDeliberations.evidenceQuality.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              {/* Agent 3: Plate OCR */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">🔤 {verdict.agentDeliberations.plateOcr.agentName}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">
                    {Math.round(verdict.agentDeliberations.plateOcr.confidence * 100)}% CONFIDENCE
                  </span>
                </div>
                <div className="text-slate-200 font-bold">{verdict.agentDeliberations.plateOcr.verdict}</div>
                <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1">
                  {verdict.agentDeliberations.plateOcr.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              {/* Agent 4: HSRP Forensics */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">🛡️ {verdict.agentDeliberations.hsrpForensics.agentName}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">
                    {Math.round(verdict.agentDeliberations.hsrpForensics.confidence * 100)}% CONFIDENCE
                  </span>
                </div>
                <div className="text-slate-200 font-bold">{verdict.agentDeliberations.hsrpForensics.verdict}</div>
                <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1">
                  {verdict.agentDeliberations.hsrpForensics.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              {/* Agent 5: Vehicle-Plate Consistency */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">⚖️ {verdict.agentDeliberations.vehiclePlateConsistency.agentName}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">
                    {Math.round(verdict.agentDeliberations.vehiclePlateConsistency.confidence * 100)}% CONFIDENCE
                  </span>
                </div>
                <div className="text-slate-200 font-bold">{verdict.agentDeliberations.vehiclePlateConsistency.verdict}</div>
                <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1">
                  {verdict.agentDeliberations.vehiclePlateConsistency.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {activeTab === 'certificate' && (
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-5 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <Award size={28} className="text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase">
                      ELECTRONIC RECORD ADMISSIBILITY CERTIFICATE
                    </h3>
                    <p className="text-xs text-slate-400">
                      {verdict.bsaCertificate.statute} • {verdict.bsaCertificate.section}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold">
                  CRYPTOGRAPHICALLY SEALED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">EVIDENCE IDENTIFIER:</span>
                  <span className="text-slate-200 font-bold">{verdict.verdictId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SOURCE DEVICE:</span>
                  <span className="text-slate-200 font-bold">{verdict.unitId} ({verdict.officerCallSign})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">CAPTURE TIMESTAMP:</span>
                  <span className="text-slate-200 font-bold">{verdict.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">CERTIFYING AUTHORITY:</span>
                  <span className="text-slate-200 font-bold">{verdict.bsaCertificate.certifiedBy}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
                <span className="text-slate-500 block">EVIDENCE BITSTREAM SHA-256 DIGEST:</span>
                <div className="text-emerald-400 font-mono break-all text-[11px]">
                  {verdict.bsaCertificate.evidenceHash}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
                <span className="text-slate-500 block">CHAIN OF CUSTODY MANIFEST:</span>
                <p className="text-slate-300 text-[11px]">
                  {verdict.bsaCertificate.custodyChain}
                </p>
              </div>

              <p className="text-[11px] text-slate-400 italic pt-2">
                "This certificate is generated pursuant to Section 63 of the Bharatiya Sakshya Adhiniyam, 2023. The electronic record captured by the mobile unit has remained cryptographically sealed and unaltered in custody."
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Gujarat Police SCRB Statutory Evidence Gateway</span>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToMesh && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToMesh();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>OPEN IN AI MESH FLEET</span>
                <ExternalLink size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
