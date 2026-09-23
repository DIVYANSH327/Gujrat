/**
 * SentinelEvidenceDossierModal.tsx
 * Comprehensive Forensic Evidence Dossier & BSA Section 63 Electronic Certificate Modal.
 * Part of Path B: Forensic vehicle & plate evidence capture independent of browser degradation.
 */

import React, { useState } from 'react';
import {
  Shield, CheckCircle2, AlertTriangle, Sparkles, Eye, FileText,
  Hash, Clock, MapPin, X, ArrowRight, Camera, Check, Copy, Download,
  Radio, Gauge, Cpu, Activity, AlertCircle, Film
} from 'lucide-react';
import type { SentinelEvidenceCaptureResult, DemoRecordingResult } from '../types.js';

interface SentinelEvidenceDossierModalProps {
  evidence: SentinelEvidenceCaptureResult | null;
  demoResult?: DemoRecordingResult | null;
  onClose: () => void;
}

export const SentinelEvidenceDossierModal: React.FC<SentinelEvidenceDossierModalProps> = ({
  evidence,
  demoResult,
  onClose
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'EVIDENCE' | 'CERTIFICATE' | 'CROPS'>('EVIDENCE');
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);

  if (!evidence && !demoResult) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const candidate = evidence?.vehicleCandidates?.[selectedCandidateIndex];
  const cert = evidence?.bsaSection63Certificate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {demoResult ? 'Demo Recording Post-Processing Dossier' : 'Forensic Evidence Dossier (Server-Side Path B)'}
                </h3>
                <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-black bg-blue-600 text-white uppercase shadow-xs">
                  {evidence?.cameraId.toUpperCase() || demoResult?.cameraId.toUpperCase()}
                </span>
                {evidence?.nativeAnprStatus === 'ANPR_EVENT_UNAVAILABLE' && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    NATIVE ANPR: UNAVAILABLE (SENTINEL AI ACTIVE)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {evidence?.cameraName} • {evidence?.location} • {evidence?.district}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Demo Recording Banner */}
        {demoResult && (
          <div className="px-5 py-2.5 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2 font-bold">
              <Film className="w-4 h-4 text-amber-400" />
              <span>{demoResult.label}</span>
            </div>
            <span className="font-mono text-[11px] text-amber-200/80">
              Sampled {demoResult.sampledFramesCount} frames • {demoResult.summary.totalVehiclesDetected} vehicles detected • Not Live Inference
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-800 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('EVIDENCE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'EVIDENCE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Forensic Frame & Crops</span>
          </button>
          <button
            onClick={() => setActiveTab('CROPS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CROPS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vehicle & Plate Crops ({evidence?.vehicleCandidates?.length || demoResult?.candidates?.length || 0})</span>
          </button>
          {cert && (
            <button
              onClick={() => setActiveTab('CERTIFICATE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'CERTIFICATE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>BSA 2023 Sec 63 Legal Certificate</span>
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Top Telemetry Strip */}
          {evidence && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stream Source</span>
                <p className="text-xs font-mono font-bold text-slate-200 mt-1 truncate">{evidence.sourceType}</p>
                <p className="text-[10px] text-slate-500">{evidence.codec}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Probed Resolution & FPS</span>
                <p className="text-xs font-mono font-bold text-blue-400 mt-1">{evidence.resolution}</p>
                <p className="text-[10px] text-slate-500">Native {evidence.probedFps} FPS</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Laplacian Sharpness</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {evidence.qualityMetrics.sharpnessScore}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    {evidence.qualityMetrics.blurCategory}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Exposure: {evidence.qualityMetrics.exposureCategory}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Intelligence Routing</span>
                <p className="text-xs font-mono font-bold text-purple-400 mt-1">{evidence.intelligenceSource}</p>
                <p className="text-[10px] text-slate-500">ANPR: {evidence.plateRecognitionSource}</p>
              </div>
            </div>
          )}

          {/* TAB 1: Evidence Frame & Overview */}
          {activeTab === 'EVIDENCE' && (
            <div className="space-y-4">
              {/* Full Resolution Raw Frame */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-400" />
                    <span>Raw Uncompressed Forensic Frame (Direct from RTSP)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(evidence?.frameSha256 || '', 'frameSha')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedField === 'frameSha' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>SHA-256</span>
                    </button>
                    {evidence?.frameUrl && (
                      <a
                        href={evidence.frameUrl}
                        download={`evidence_${evidence.cameraId}_${Date.now()}.jpg`}
                        className="px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-[11px] text-blue-300 flex items-center gap-1 transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="relative aspect-video max-h-[420px] bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src={evidence?.frameUrl || demoResult?.candidates?.[0]?.frameUrl}
                    alt="Forensic Frame"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                  <span className="truncate max-w-md">SHA-256: {evidence?.frameSha256 || demoResult?.candidates?.[0]?.frameSha256}</span>
                  <span>Captured: {evidence?.timestamp || demoResult?.candidates?.[0]?.frameTimestampMs}</span>
                </div>
              </div>

              {/* Detected Vehicle Summary Card */}
              {candidate ? (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Primary Vehicle Evidence Analysis</span>
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      candidate.ocrReadabilityStatus === 'READABLE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : candidate.ocrReadabilityStatus === 'UNCERTAIN'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {candidate.ocrReadabilityStatus === 'READABLE'
                        ? 'READABLE PLATE'
                        : candidate.ocrReadabilityStatus === 'UNCERTAIN'
                        ? 'UNCERTAIN OCR'
                        : 'PLATE NOT READABLE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Plate OCR Result</span>
                      <p className={`text-base font-mono font-black mt-1 ${
                        candidate.ocrResult === 'NOT_READABLE' ? 'text-slate-400' : 'text-emerald-400'
                      }`}>
                        {candidate.ocrResult}
                      </p>
                      <p className="text-[10px] text-slate-500">Confidence: {(candidate.ocrConfidence * 100).toFixed(0)}%</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">HSRP Security Standard</span>
                      <p className="text-xs font-bold text-slate-200 mt-1">
                        {candidate.isHsrpCompliant ? 'HSRP COMPLIANT' : (candidate.hsrpStatus || 'STANDARD')}
                      </p>
                      <p className="text-[10px] text-slate-500">Security Inscription Verified</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Vehicle Classification</span>
                      <p className="text-xs font-bold text-indigo-300 mt-1 uppercase">
                        {candidate.vehicleType}
                      </p>
                      <p className="text-[10px] text-slate-500">Model Conf: {(candidate.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center text-xs text-slate-400">
                  No vehicle candidate in this frame. Authentic high-resolution full-frame preserved with legal cryptographic seal.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Crops & Optical Enhancement */}
          {activeTab === 'CROPS' && (
            <div className="space-y-4">
              {candidate ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Vehicle Crop */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">1. Vehicle Bounding Crop</span>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={candidate.vehicleCropUrl} alt="Vehicle Crop" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      SHA: {candidate.vehicleCropSha256?.slice(0, 16)}...
                    </div>
                  </div>

                  {/* Raw Plate Crop */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">2. Raw Optical Plate Crop</span>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      {candidate.plateCropUrl ? (
                        <img src={candidate.plateCropUrl} alt="Plate Crop" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-slate-500">No plate crop isolated</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      SHA: {candidate.plateCropSha256?.slice(0, 16) || 'N/A'}...
                    </div>
                  </div>

                  {/* Enhanced Plate Crop */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>3. Lanczos 2x Optical Enhancement</span>
                    </span>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      {candidate.enhancedPlateCropUrl ? (
                        <img src={candidate.enhancedPlateCropUrl} alt="Enhanced Plate" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-slate-500">No enhanced plate crop</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-indigo-400 truncate">
                      SHA: {candidate.enhancedPlateCropSha256?.slice(0, 16) || 'N/A'}...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No vehicle candidate crops available for this capture.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BSA 2023 Section 63 Legal Certificate */}
          {activeTab === 'CERTIFICATE' && cert && (
            <div className="p-6 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Bharatiya Sakshya Adhiniyam, 2023 (Section 63)
                    </h4>
                    <p className="text-xs text-emerald-400 font-medium">
                      Statutory Certificate of Admissibility for Electronic Evidence
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(JSON.stringify(cert, null, 2), 'certJson')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedField === 'certJson' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Statutory JSON</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Certificate ID</span>
                  <p className="text-emerald-400 font-bold">{cert.certificateId}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Custody Chain Status</span>
                  <p className="text-emerald-400 font-bold">{cert.custodyChainStatus}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Original Frame SHA-256 Digest</span>
                  <p className="text-slate-200 break-all">{cert.originalFrameHash}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">HMAC-SHA256 Digital Verification Signature</span>
                  <p className="text-emerald-300 break-all">{cert.verificationSignature}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Statutory Attestation:</p>
                <p>
                  This record certifies that the electronic video frame was captured by autonomous server-side RTSP ingest from device {cert.sourceDeviceUid} on {cert.captureTimestampUtc}, without in-transit browser recompression. The cryptographic SHA-256 seal ensures non-repudiation under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Gujarat Police CCTV & AI Intelligence Platform • Sentinel Evidence Vault</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
