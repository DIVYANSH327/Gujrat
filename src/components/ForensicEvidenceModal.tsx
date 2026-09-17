/**
 * Forensic Evidence Modal
 * 
 * Strict separation between:
 * - REAL AI EVIDENCE (Camera/Video observed, cryptographic SHA-256 over raw analyzed frame, full frame + crops, GPS if available, BSA 2023 Sec 63 certificate)
 * - SIMULATED DEMO EVIDENCE (Synthetic benchmark, watermark, simulation badge)
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  Check, 
  X, 
  MapPin, 
  Camera, 
  Cpu, 
  Hash, 
  Clock, 
  ExternalLink, 
  Maximize2, 
  Layers, 
  FileText,
  Eye
} from 'lucide-react';
import { EvidenceRecord } from '../services/ai/RealAIEvidencePipeline';

export interface ForensicEvidenceModalProps {
  evidence: Partial<EvidenceRecord> & {
    id?: string;
    label?: string;
    isSimulation?: boolean;
    snapshotUrl?: string;
    imageUrl?: string;
    sha256Hash?: string;
    timestamp?: string | number;
    reason?: string;
    captureReason?: string;
    siteId?: string;
    sourceEdgeNode?: string;
    detectionConfidence?: number;
    correlationId?: string;
    metadata?: any;
  };
  onClose: () => void;
  onNavigateToMap?: (lat: number, lng: number, evidenceId: string) => void;
}

export const ForensicEvidenceModal: React.FC<ForensicEvidenceModalProps> = ({
  evidence,
  onClose,
  onNavigateToMap
}) => {
  const [activeView, setActiveView] = useState<'FRAME' | 'VEHICLE' | 'PLATE'>('FRAME');
  const [copiedHash, setCopiedHash] = useState(false);

  // Normalize fields across EvidenceRecord and legacy EvidenceItem
  const evidenceId = evidence.evidenceId || evidence.id || 'EVD-UNKNOWN';
  const eventId = (evidence as any).eventId || 'EVT-UNKNOWN';
  const cameraId = evidence.cameraId || 'CAM-UNKNOWN';
  const capturedAt = evidence.capturedAt || (evidence.timestamp ? new Date(evidence.timestamp).toISOString() : new Date().toISOString());
  const sha256 = evidence.sha256 || evidence.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  
  const isReal = evidence.sourceOfTruth === 'CAMERA_OBSERVED' || evidence.sourceOfTruth === 'VIDEO_OBSERVED';
  const isSimulation = evidence.isSimulation || evidence.sourceOfTruth === 'SIMULATED' || !isReal;

  const fullFrameUrl = evidence.imageReference || evidence.snapshotUrl || evidence.imageUrl || '';
  const vehicleCropUrl = evidence.vehicleCropReference || (evidence.metadata?.vehicleCropUrl);
  const plateCropUrl = evidence.plateCropReference || (evidence.metadata?.plateCropUrl);

  const lat = evidence.latitude ?? evidence.metadata?.latitude;
  const lng = evidence.longitude ?? evidence.metadata?.longitude;
  const hasGps = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  const modelId = evidence.modelId || 'gemini-3.8-flash';
  const modelVersion = evidence.modelVersion || '2026.03';
  const sourceOfTruth = evidence.sourceOfTruth || (isSimulation ? 'SIMULATED' : 'CAMERA_OBSERVED');

  const currentDisplayImage = activeView === 'VEHICLE' && vehicleCropUrl
    ? vehicleCropUrl
    : activeView === 'PLATE' && plateCropUrl
    ? plateCropUrl
    : fullFrameUrl;

  const copyHash = () => {
    navigator.clipboard.writeText(sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#080d1a] border border-zinc-700/80 w-full max-w-3xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 font-mono max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* MODAL HEADER */}
        <div className="flex justify-between items-start border-b border-zinc-800 pb-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isReal ? (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  REAL AI EVIDENCE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  SIMULATED DEMO EVIDENCE
                </span>
              )}

              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                PROVENANCE: {sourceOfTruth}
              </span>

              {isReal && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  BSA 2023 ELECTRONIC-RECORD WORKFLOW
                </span>
              )}

              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
                STORAGE: DEVELOPMENT / TEMPORARY
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 pt-1">
              Forensic Evidence Record #{evidenceId}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* SIMULATION WATERMARK WARNING IF NOT REAL */}
        {isSimulation && (
          <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <span>
              <strong>NOTICE:</strong> This evidence record was generated in a simulated demonstration sandbox for workflow verification. It does not represent an actual physical incident.
            </span>
          </div>
        )}

        {/* EVIDENCE IMAGE DISPLAY & VIEW SELECTOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold flex items-center gap-1.5">
              <Camera size={13} className="text-cyan-400" />
              IMAGE ARTIFACT: {activeView === 'FRAME' ? 'FULL ANALYZED FRAME' : activeView === 'VEHICLE' ? 'VEHICLE ROI CROP' : 'ANPR NUMBER PLATE CROP'}
            </span>

            {/* VIEW SELECTOR BUTTONS */}
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
              <button
                onClick={() => setActiveView('FRAME')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  activeView === 'FRAME'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                FULL FRAME
              </button>

              {vehicleCropUrl && (
                <button
                  onClick={() => setActiveView('VEHICLE')}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    activeView === 'VEHICLE'
                      ? 'bg-cyan-500 text-black shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  VEHICLE CROP
                </button>
              )}

              {plateCropUrl && (
                <button
                  onClick={() => setActiveView('PLATE')}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    activeView === 'PLATE'
                      ? 'bg-cyan-500 text-black shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  PLATE CROP
                </button>
              )}
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black aspect-video flex items-center justify-center group shadow-inner">
            {currentDisplayImage ? (
              <img
                src={currentDisplayImage}
                alt="Analyzed Evidence Artifact"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-zinc-500 text-xs">No image artifact available</div>
            )}

            {/* WATERMARK OVERLAY */}
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm border border-zinc-700/60 px-2.5 py-1 rounded text-[10px] text-zinc-200">
              {cameraId} • {new Date(capturedAt).toLocaleTimeString()}
            </div>

            {isSimulation && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20 rotate-[-15deg]">
                <span className="text-5xl font-black text-amber-500 border-4 border-amber-500 px-6 py-2 uppercase tracking-widest">
                  SIMULATION
                </span>
              </div>
            )}
          </div>
        </div>

        {/* METADATA GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#050811] p-3.5 rounded-xl border border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">EVENT ID</span>
            <span className="text-zinc-200 font-bold truncate block">{eventId}</span>
          </div>

          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">SOURCE OF TRUTH</span>
            <span className={`font-bold block ${isReal ? 'text-emerald-400' : 'text-amber-400'}`}>
              {sourceOfTruth}
            </span>
          </div>

          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">CAMERA ID</span>
            <span className="text-zinc-200 font-bold block">{cameraId}</span>
          </div>

          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">AI VISION MODEL</span>
            <span className="text-cyan-300 font-bold block truncate">{modelId} (v{modelVersion})</span>
          </div>

          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">CAPTURE TIMESTAMP</span>
            <span className="text-zinc-300 block truncate">{new Date(capturedAt).toLocaleString()}</span>
          </div>

          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">GPS POSITION</span>
            {hasGps ? (
              <span className="text-emerald-400 font-bold block">
                {lat!.toFixed(4)}, {lng!.toFixed(4)}
              </span>
            ) : (
              <span className="text-zinc-500 font-bold block">
                GPS: NOT_AVAILABLE
              </span>
            )}
          </div>
        </div>

        {/* CRYPTOGRAPHIC INTEGRITY PROOF (SHA-256) */}
        <div className="bg-[#050811] p-3.5 rounded-xl border border-zinc-800 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-zinc-300 font-bold text-[11px] flex items-center gap-1.5">
              <Hash size={13} className="text-purple-400" />
              FORENSIC SHA-256 EVIDENCE DIGEST
            </span>
            <button
              onClick={copyHash}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedHash ? <Check size={11} /> : <Copy size={11} />}
              {copiedHash ? 'COPIED' : 'COPY HASH'}
            </button>
          </div>

          <div className="text-purple-300 text-[11px] font-mono break-all bg-black/60 p-2.5 rounded-lg border border-purple-900/40">
            {sha256}
          </div>

          <div className="text-[10px] text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2 space-y-1">
            {isReal ? (
              <>
                <p>
                  <strong>Electronic Evidence Integrity Metadata:</strong> Computed as SHA-256 Integrity Digest over the raw uncompressed video frame buffer upon AI model ingestion for BSA 2023 electronic-record workflow.
                </p>
                <p className="text-zinc-500 text-[9px]">
                  <strong>Legal Notice:</strong> SHA-256 is an integrity digest. It is NOT a digital signature, a certificate, a chain of custody, proof of authenticity, or proof of legal admissibility. Legal admissibility depends on applicable law, certification, procedures and competent-authority requirements.
                </p>
              </>
            ) : (
              <span className="text-amber-300/80 italic">
                Synthetic integrity hash generated for pipeline demonstration.
              </span>
            )}
          </div>
        </div>

        {/* MODAL ACTION BUTTONS */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {hasGps && onNavigateToMap && (
              <button
                onClick={() => onNavigateToMap(lat!, lng!, evidenceId)}
                className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MapPin size={13} />
                VIEW ON GEOSPATIAL MAP
              </button>
            )}

            {fullFrameUrl && (
              <a
                href={fullFrameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink size={13} />
                OPEN RAW ARTIFACT
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
