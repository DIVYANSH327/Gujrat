/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ChallanCaseDetailPanel: Master Evidentiary Inspector, Multi-Frame Corroboration & Enforcement Actions
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Camera, 
  MapPin, 
  FileText, 
  Hash, 
  ExternalLink, 
  Send, 
  Check, 
  X, 
  Eye, 
  Calendar, 
  Cpu, 
  Layers,
  Scale,
  Car,
  AlertCircle
} from 'lucide-react';
import { 
  ViolationCase, 
  AuthorizedDispatchContext, 
  EvidenceSufficiencyResult 
} from '../../types/v22ChallanTypes';
import { evidenceSufficiencyService } from '../../services/EvidenceSufficiencyService';
import { challanReviewService } from '../../services/ChallanReviewService';
import { vehicleDossierService } from '../../services/VehicleDossierService';
import { ChallanAuditTrailModal } from './ChallanAuditTrailModal';
import { ChallanDispatchModal } from './ChallanDispatchModal';

interface Props {
  caseObj: ViolationCase;
  reviewer: AuthorizedDispatchContext;
  onCaseUpdated: (updated: ViolationCase) => void;
  onNavigateToDossier?: (plate: string) => void;
  onNavigateToCamera?: (cameraId: string) => void;
}

export const ChallanCaseDetailPanel: React.FC<Props> = ({
  caseObj,
  reviewer,
  onCaseUpdated,
  onNavigateToDossier,
  onNavigateToCamera
}) => {
  const [activeFrameTab, setActiveFrameTab] = useState<'CONTEXT' | 'PRE' | 'PEAK' | 'POST'>('CONTEXT');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [rejectReasonModal, setRejectReasonModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Insufficient visual corroboration');
  const [actionError, setActionError] = useState<string | null>(null);

  const sufficiency: EvidenceSufficiencyResult = evidenceSufficiencyService.evaluateSufficiency(caseObj);
  const dossier = vehicleDossierService.getDossier(caseObj.vehiclePlate) || vehicleDossierService.getOrCreateDossier(caseObj.vehiclePlate);

  const handleClaim = () => {
    try {
      setActionError(null);
      const updated = challanReviewService.claimCase(caseObj.caseId, reviewer);
      onCaseUpdated(updated);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleRelease = () => {
    try {
      setActionError(null);
      const updated = challanReviewService.releaseCase(caseObj.caseId, reviewer);
      onCaseUpdated(updated);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleApprove = () => {
    try {
      setActionError(null);
      const updated = challanReviewService.approveCase(
        caseObj.caseId, 
        reviewer, 
        'Officer confirmed violation based on multi-frame video corroboration and calibrated sensor metric.'
      );
      onCaseUpdated(updated);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleRejectConfirm = () => {
    try {
      setActionError(null);
      const updated = challanReviewService.rejectCase(caseObj.caseId, reviewer, rejectionReason);
      setRejectReasonModal(false);
      onCaseUpdated(updated);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleMarkInsufficient = () => {
    try {
      setActionError(null);
      const updated = challanReviewService.markInsufficientEvidence(
        caseObj.caseId, 
        reviewer, 
        'Evidence insufficient for enforcement under strict evidentiary standards.'
      );
      onCaseUpdated(updated);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  // Determine current image display based on tab
  const getActiveDisplayImage = () => {
    switch (activeFrameTab) {
      case 'PRE':
        return caseObj.additionalEvidenceIds?.[0] || caseObj.fullContextEvidenceId;
      case 'PEAK':
        return caseObj.additionalEvidenceIds?.[1] || caseObj.fullContextEvidenceId;
      case 'POST':
        return caseObj.additionalEvidenceIds?.[2] || caseObj.fullContextEvidenceId;
      case 'CONTEXT':
      default:
        return caseObj.fullContextEvidenceId;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Header Banner */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-100 font-mono tracking-wide">
              {caseObj.caseId}
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
              caseObj.violationSeverity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
              caseObj.violationSeverity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
              'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}>
              {caseObj.violationSeverity} SEVERITY
            </span>
            {caseObj.sourceType === 'YOUTUBE_DEMO' ? (
              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-mono font-bold">
                YOUTUBE DEMO (NON-ENFORCEABLE)
              </span>
            ) : caseObj.isSimulated ? (
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono">
                SIMULATED EVIDENCE (LOCAL SANDBOX)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold">
                AUTHORIZED CCTV EVIDENCE
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Camera size={13} className="text-cyan-400" />
              <button 
                onClick={() => onNavigateToCamera?.(caseObj.cameraId)}
                className="hover:text-cyan-300 underline underline-offset-2 font-mono"
              >
                {caseObj.cameraId} ({caseObj.edgeNodeId})
              </button>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-amber-400" />
              {caseObj.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" />
              {caseObj.timestamp}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            <ShieldCheck size={14} className="text-cyan-400" />
            BSA Sec 61 Certificate & Audit
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Issued e-Challan Notification Banner */}
      {caseObj.status === 'E_CHALLAN_ISSUED' && (
        <div className="mx-6 mt-4 p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400">
              <CheckCircle size={22} />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                e-Challan Dispatched Successfully
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 font-mono">
                  {caseObj.challanReference}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Authorized by Reviewer: <span className="font-mono text-white">{caseObj.reviewerId}</span> • Fine: <strong className="text-white">₹{caseObj.suggestedFineAmount || 1500}</strong> • Gateway: {caseObj.challanProvider}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAuditModal(true)}
            className="px-3 py-1.5 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-500/40 text-emerald-200 rounded-lg text-xs font-medium"
          >
            View Statutory Notice
          </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Visual Evidence Matrix (Exact match to layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Visual Context Display (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Camera size={14} className="text-amber-400" />
                Optical Observation Frame • {caseObj.cameraId}
              </span>
              {/* Timeline frame tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  onClick={() => setActiveFrameTab('PRE')}
                  className={`px-2 py-1 rounded transition ${activeFrameTab === 'PRE' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  T-2s (Approach)
                </button>
                <button
                  onClick={() => setActiveFrameTab('PEAK')}
                  className={`px-2 py-1 rounded transition ${activeFrameTab === 'PEAK' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  T (Peak Breach)
                </button>
                <button
                  onClick={() => setActiveFrameTab('POST')}
                  className={`px-2 py-1 rounded transition ${activeFrameTab === 'POST' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  T+1s (Departure)
                </button>
                <button
                  onClick={() => setActiveFrameTab('CONTEXT')}
                  className={`px-2 py-1 rounded transition ${activeFrameTab === 'CONTEXT' ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Full Context
                </button>
              </div>
            </div>

            {/* Video / Snapshot Stage with Overlays */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <img
                src={getActiveDisplayImage()}
                alt="Context Evidence Frame"
                className="w-full h-full object-cover"
              />

              {/* Watermark Overlay */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded border border-white/20 text-[10px] font-mono text-white/90 space-y-0.5">
                <div>CAMERA: {caseObj.cameraId} [{caseObj.edgeNodeId}]</div>
                <div>TIME: {caseObj.timestamp}</div>
                <div>CORRIDOR: {caseObj.location}</div>
              </div>

              {/* Simulated Vehicle Bounding Box Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-40 border-2 border-amber-400/90 rounded bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.3)] relative">
                  <div className="absolute -top-6 left-0 bg-amber-500 text-black font-mono font-black text-[10px] px-1.5 py-0.5 rounded-t">
                    {caseObj.violationType} • {(caseObj.aiConfidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Source Watermark Stamp */}
              <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded border border-white/15 text-[10px] font-mono text-cyan-300">
                FINGERPRINT: {caseObj.integrityHash.substring(0, 16)}...
              </div>
            </div>

            {/* Frame Metadata Footer */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Sensor: <strong>4K H.265 Edge Analytics Stream (30 FPS)</strong></span>
              <span>Optical Confidence: <strong className="text-emerald-400">{(caseObj.aiConfidence * 100).toFixed(1)}%</strong></span>
              <span>ANPR Quality Score: <strong className="text-cyan-400">{(caseObj.plateConfidence * 100).toFixed(1)}%</strong></span>
            </div>
          </div>

          {/* High-Resolution Crops & Optical Read (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Vehicle Crop Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <span className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Car size={14} className="text-cyan-400" />
                  Target Vehicle Crop
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  CONF: {(caseObj.vehicleConfidence * 100).toFixed(0)}%
                </span>
              </span>
              <div className="h-28 rounded-lg overflow-hidden bg-black border border-slate-800 relative">
                <img
                  src={caseObj.vehicleCropEvidenceId}
                  alt="Vehicle Crop"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">Class / Type</span>
                  <span className="font-semibold text-slate-200">{caseObj.vehicleType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Identified Model</span>
                  <span className="font-semibold text-slate-200">{caseObj.vehicleMakeModel || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* License Plate Crop & OCR Read Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <span className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-amber-400" />
                  License Plate Crop & ANPR Read
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  OCR: {(caseObj.plateConfidence * 100).toFixed(0)}%
                </span>
              </span>
              <div className="h-20 rounded-lg overflow-hidden bg-black border border-slate-800 relative flex items-center justify-center p-1">
                <img
                  src={caseObj.plateCropEvidenceId}
                  alt="Plate Crop"
                  className="max-h-full object-contain"
                />
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Recognized Plate Number</span>
                  <span className="text-base font-black font-mono text-amber-400 tracking-wider">
                    {caseObj.vehiclePlate}
                  </span>
                </div>
                {onNavigateToDossier && (
                  <button
                    onClick={() => onNavigateToDossier(caseObj.vehiclePlate)}
                    className="flex items-center gap-1 px-2 py-1 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900/60 text-cyan-300 rounded text-[11px] font-medium transition"
                  >
                    Dossier <ExternalLink size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry, Statutory Rules & Evidentiary Sufficiency Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Telemetry & Measurement */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers size={14} className="text-cyan-400" />
              Violation Measurement & Telemetry
            </h3>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Violation Classification</span>
                <span className="text-xs font-bold text-amber-400">{caseObj.violationType.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-900 pt-2">
                <span className="text-xs text-slate-400">Observed Value</span>
                <span className="text-base font-black font-mono text-rose-400">
                  {caseObj.observedValue ?? 'N/A'} {caseObj.unit || ''}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-900 pt-2">
                <span className="text-xs text-slate-400">Statutory Permitted Limit</span>
                <span className="text-xs font-mono text-slate-300">
                  {caseObj.allowedValue ?? 'N/A'} {caseObj.unit || ''}
                </span>
              </div>
              {caseObj.speedEvidence && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[11px]">
                  <span className="text-slate-500">Speed Sensor</span>
                  <span className="font-mono text-cyan-300">{caseObj.speedEvidence.speedSensorType} (Calibrated)</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              "{caseObj.violationDescription}"
            </p>
          </div>

          {/* Column 2: Evidentiary Sufficiency & Tamper Fingerprint */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                Evidentiary Sufficiency Standard
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                sufficiency.status === 'SUFFICIENT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                sufficiency.status === 'PARTIAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {sufficiency.status} ({(sufficiency.score * 100).toFixed(0)}%)
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-slate-400">Context Video/Image Frame</span>
                {sufficiency.checks.hasContextFrame ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-rose-400" />}
              </div>
              <div className="flex items-center justify-between py-0.5">
                <span className="text-slate-400">Target Vehicle Crop (Conf &ge; 70%)</span>
                {sufficiency.checks.hasTargetVehicle ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-rose-400" />}
              </div>
              <div className="flex items-center justify-between py-0.5">
                <span className="text-slate-400">License Plate Read (OCR &ge; 75%)</span>
                {sufficiency.checks.hasPlateEvidence ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-rose-400" />}
              </div>
              <div className="flex items-center justify-between py-0.5">
                <span className="text-slate-400">Violation Specific Corroboration</span>
                {sufficiency.checks.hasViolationSpecificEvidence ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-rose-400" />}
              </div>
              <div className="flex items-center justify-between py-0.5">
                <span className="text-slate-400">Evidence SHA-256 Integrity Seal</span>
                {sufficiency.checks.hasIntegrityHash ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-rose-400" />}
              </div>
            </div>

            {/* Missing elements alert if any */}
            {sufficiency.missingElements.length > 0 && (
              <div className="p-2 bg-rose-950/30 border border-rose-500/30 rounded text-[10px] text-rose-300">
                <strong>Missing required evidence:</strong> {sufficiency.missingElements.join(', ')}
              </div>
            )}
          </div>

          {/* Column 3: Statutory Penalty & Legal Basis */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Scale size={14} className="text-amber-400" />
              Statutory Basis & Legal Penalty
            </h3>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-[11px] text-slate-400">
                <span className="block font-semibold text-slate-300">Applicable Statutory Provision</span>
                <span className="text-slate-400">Motor Vehicles Act 1988 (Amended 2019) / Gujarat MV Rules</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-900 pt-2">
                <span className="text-xs text-slate-400">Suggested Fine</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  ₹{caseObj.suggestedFineAmount || 1500}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[11px]">
                <span className="text-slate-500">Statutory Department</span>
                <span className="text-slate-300">Gujarat Traffic Police</span>
              </div>
            </div>

            {/* Citizen VAHAN summary */}
            {dossier && (
              <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg text-[11px] space-y-1">
                <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">
                  Citizen VAHAN Record Link
                </span>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Owner: <strong>{(dossier as any).externalData?.vahan?.record?.ownerName || (dossier as any).externalData?.ownerName || 'Verified Citizen'}</strong></span>
                  <span className="font-mono text-slate-400">Reg: {(dossier as any).externalData?.vahan?.record?.registrationDate || '2021'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>Insurance: <strong className="text-emerald-400">{(dossier as any).externalData?.vahan?.record?.insuranceStatus || 'VALID'}</strong></span>
                  <span>Prior Violations: <strong className="text-amber-400">{(dossier as any).violations?.length || (dossier as any).roadSafetyEvents?.length || 0}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Human Officer Review & Enforcement Action Bar */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Human-in-the-Loop Enforcement Review Gate
              </h3>
              <p className="text-xs text-slate-400">
                Officer: <span className="font-mono text-cyan-300">{reviewer.officerName}</span> ({reviewer.badgeNumber}) • Role: <span className="font-mono text-amber-300">{reviewer.role}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Current Lifecycle:</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-cyan-300">
                {caseObj.status}
              </span>
            </div>
          </div>

          {/* Action buttons based on status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {caseObj.status === 'PENDING_REVIEW' && (
                <button
                  onClick={handleClaim}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
                >
                  Claim Case for Review
                </button>
              )}

              {caseObj.status === 'UNDER_REVIEW' && (
                <>
                  <button
                    onClick={handleRelease}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                  >
                    Release Claim
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={sufficiency.status === 'INSUFFICIENT'}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-md transition"
                  >
                    <Check size={14} />
                    Approve Violation
                  </button>
                  <button
                    onClick={() => setRejectReasonModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-semibold transition"
                  >
                    <X size={14} />
                    Reject Case
                  </button>
                  <button
                    onClick={handleMarkInsufficient}
                    className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-medium transition"
                  >
                    Mark Insufficient Evidence
                  </button>
                </>
              )}

              {caseObj.status === 'APPROVED' && (
                <button
                  onClick={() => setShowDispatchModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950/50 transition"
                >
                  <Send size={15} />
                  Authorize & Dispatch e-Challan
                </button>
              )}

              {caseObj.status === 'E_CHALLAN_ISSUED' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle size={15} />
                    Challan Issued & Notified
                  </span>
                </div>
              )}
            </div>

            {onNavigateToDossier && (
              <button
                onClick={() => onNavigateToDossier(caseObj.vehiclePlate)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition ml-auto"
              >
                <Car size={14} className="text-amber-400" />
                Inspect Full Vehicle Dossier
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <XCircle size={18} className="text-rose-400" />
              Rejection of Violation Candidate
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Statutory regulations require a mandatory reason when rejecting an AI-identified candidate.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Select Rejection Reason</label>
              <select
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Insufficient visual corroboration">Insufficient visual corroboration</option>
                <option value="License plate OCR ambiguous or obscured">License plate OCR ambiguous or obscured</option>
                <option value="Within sensor calibration tolerance">Within sensor calibration tolerance</option>
                <option value="Emergency vehicle or authorized exemption">Emergency vehicle or authorized exemption</option>
                <option value="False-positive detection by visual model">False-positive detection by visual model</option>
                <option value="Duplicate candidate already processed">Duplicate candidate already processed</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRejectReasonModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Electronic Evidence Sec 61 Audit Modal */}
      {showAuditModal && (
        <ChallanAuditTrailModal
          caseObj={caseObj}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {/* Authorized Dispatch Modal */}
      {showDispatchModal && (
        <ChallanDispatchModal
          caseObj={caseObj}
          reviewer={reviewer}
          onClose={() => setShowDispatchModal(false)}
          onDispatched={(result) => {
            setShowDispatchModal(false);
            const fresh = challanReviewService.getCase(caseObj.caseId);
            if (fresh) onCaseUpdated(fresh);
          }}
        />
      )}
    </div>
  );
};
