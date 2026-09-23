/**
 * Copyright (c) 2026 Gujarat Police Surveillance Infrastructure.
 * Forensic Object Inspector Drawer / Modal
 */

import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Hash, 
  ExternalLink, 
  Award, 
  Car, 
  User, 
  Bike, 
  Check, 
  Copy, 
  AlertTriangle,
  ZoomIn,
  HardDrive
} from 'lucide-react';
import { RealAIDetection, EvidenceRecord } from '../../services/ai/RealAIEvidencePipeline';
import { BsaSection63CertificateModal, BsaCertificateData } from './BsaSection63CertificateModal';

interface ForensicObjectInspectorModalProps {
  detection: RealAIDetection | null;
  sourceFrameUrl?: string | null;
  evidenceRecord?: EvidenceRecord | null;
  onClose: () => void;
  onNavigateToMap?: () => void;
}

export const ForensicObjectInspectorModal: React.FC<ForensicObjectInspectorModalProps> = ({
  detection,
  sourceFrameUrl,
  evidenceRecord,
  onClose,
  onNavigateToMap
}) => {
  const [showCertificate, setShowCertificate] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!detection) return null;

  const sha256 = evidenceRecord?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const gcsUri = `gs://gujarat-police-evidence-vault-apac/evidence/${detection.detectionId}.jpg`;
  const isNoHelmet = detection.attributes?.helmet === 'NO_HELMET';

  const copyHash = () => {
    navigator.clipboard.writeText(sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const certificateData: BsaCertificateData = {
    certificateId: `BSA-63-${Date.now().toString().slice(-6)}`,
    evidenceId: evidenceRecord?.evidenceId || detection.detectionId,
    sha256: sha256,
    capturedAt: detection.capturedAt || new Date().toISOString(),
    cameraId: detection.sourceId,
    sourceType: detection.sourceType,
    latitude: evidenceRecord?.latitude || 23.0225,
    longitude: evidenceRecord?.longitude || 72.5714,
    aiModel: `${detection.modelId} (${detection.modelVersion})`,
    gcsUri: gcsUri,
    detectedClasses: [detection.class],
    violations: isNoHelmet ? ['NO_HELMET_VIOLATION (Section 129 Motor Vehicles Act)'] : []
  };

  return (
    <>
      <div 
        id="forensic-inspector-backdrop"
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          id="forensic-inspector-card"
          className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden font-mono text-xs text-slate-200"
        >
          {/* Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <ZoomIn size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Forensic Object Crop Inspector
                </h3>
                <span className="text-[10px] text-slate-400">
                  Target ID: {detection.detectionId}
                </span>
              </div>
            </div>

            <button
              id="inspector-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Visual Crop & Attributes */}
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Visual Viewport */}
            <div className="relative rounded-lg overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
              {sourceFrameUrl ? (
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                  <img
                    src={sourceFrameUrl}
                    alt="Analyzed Frame Crop"
                    className="w-full h-full object-contain"
                  />
                  {/* Highlight Box */}
                  <div
                    className={`absolute border-2 ${isNoHelmet ? 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'}`}
                    style={{
                      left: `${detection.boundingBox.x * 100}%`,
                      top: `${detection.boundingBox.y * 100}%`,
                      width: `${detection.boundingBox.width * 100}%`,
                      height: `${detection.boundingBox.height * 100}%`
                    }}
                  >
                    <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/90 text-white uppercase">
                      {detection.class} ({(detection.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-center p-4">
                  <Car size={32} className="mx-auto mb-2 opacity-50" />
                  <span>Pixel Crop Stream Available in Active Session</span>
                </div>
              )}
            </div>

            {/* Target Telemetry Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Class Classification</span>
                <div className="text-sm font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                  {detection.class === 'person' ? <User size={14} /> : detection.class === 'motorcycle' ? <Bike size={14} /> : <Car size={14} />}
                  <span>{detection.class}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Detection Confidence</span>
                <div className="text-sm font-bold text-emerald-400">
                  {(detection.confidence * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">License Plate (HSRP)</span>
                <div className="text-sm font-bold text-amber-300">
                  {detection.plate || 'NO_PLATE_DETECTED'}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Safety Compliance</span>
                <div className={`text-sm font-bold ${isNoHelmet ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isNoHelmet ? 'NO HELMET DETECTED' : (detection.attributes?.helmet || 'NORMAL')}
                </div>
              </div>
            </div>

            {/* Cloud & Cryptographic Proof */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  <Hash size={12} className="text-purple-400" />
                  SHA-256 Digest
                </span>
                <button
                  id="copy-inspector-hash-btn"
                  onClick={copyHash}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedHash ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedHash ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <div className="p-2 bg-black/60 rounded text-[10px] text-purple-300 font-mono break-all select-all">
                {sha256}
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <HardDrive size={11} className="text-cyan-400" />
                  Google Cloud Storage Bucket:
                </span>
                <span className="text-cyan-300">gs://gujarat-police-evidence-vault</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
            {onNavigateToMap ? (
              <button
                id="inspector-map-btn"
                onClick={() => {
                  onClose();
                  onNavigateToMap();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <MapPin size={13} className="text-emerald-400" />
                <span>TRACE ON MAP</span>
              </button>
            ) : <div />}

            <button
              id="inspector-bsa-btn"
              onClick={() => setShowCertificate(true)}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs shadow-lg shadow-amber-500/20"
            >
              <Award size={14} />
              <span>GENERATE SECTION 63 BSA CERTIFICATE</span>
            </button>
          </div>
        </div>
      </div>

      {showCertificate && (
        <BsaSection63CertificateModal
          data={certificateData}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </>
  );
};
