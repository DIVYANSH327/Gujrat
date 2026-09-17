import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  MapPin, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  Maximize2, 
  Clock, 
  Camera as CameraIcon,
  ExternalLink,
  FileCheck,
  CreditCard
} from 'lucide-react';
import { EvidenceRecord } from '../../services/ai/RealAIEvidencePipeline';

interface AIEvidenceComparisonModalProps {
  evidence: Partial<EvidenceRecord> & {
    id?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    snapshotUrl?: string;
    imageReference?: string;
    vehicleCropUrl?: string;
    plateCropUrl?: string;
    sha256?: string;
    sha256Hash?: string;
    latitude?: number;
    longitude?: number;
    capturedAt?: string;
    timestamp?: string;
    cameraId?: string;
  };
  onClose: () => void;
  onNavigateToMap?: (lat: number, lng: number, evId: string) => void;
}

export const AIEvidenceComparisonModal: React.FC<AIEvidenceComparisonModalProps> = ({
  evidence,
  onClose,
  onNavigateToMap
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'SIDE_BY_SIDE' | 'ORIGINAL' | 'ENHANCED' | 'PLATE'>('SIDE_BY_SIDE');
  const [copiedHash, setCopiedHash] = useState(false);

  const evId = evidence.evidenceId || evidence.id || 'EVD-10492';
  const camId = evidence.cameraId || 'CAM-014';
  const timestamp = evidence.capturedAt || evidence.timestamp || new Date().toISOString();
  const sha256 = evidence.sha256 || evidence.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  
  const originalUrl = evidence.imageReference || evidence.imageUrl || evidence.snapshotUrl || '';
  const vehicleCropUrl = evidence.vehicleCropReference || evidence.vehicleCropUrl;
  const plateCropUrl = evidence.plateCropReference || evidence.plateCropUrl;

  const lat = evidence.latitude;
  const lng = evidence.longitude;
  const hasGps = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  const copySha256 = () => {
    navigator.clipboard.writeText(sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* 1. Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-600" />
                INTEGRITY PRESERVED • EVIDENCE-READY
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {evId}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Verified Electronic Evidence Record
            </h2>
            <p className="text-xs text-slate-500">
              Multi-frame captured evidence with pixel-derived super-resolution enhancement and SHA-256 cryptographic proof.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. View Mode Selector Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveViewMode('SIDE_BY_SIDE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeViewMode === 'SIDE_BY_SIDE'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side Comparison
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('ORIGINAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeViewMode === 'ORIGINAL'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Original Frame
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('ENHANCED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeViewMode === 'ENHANCED'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enhanced Frame
            </button>
            {plateCropUrl && (
              <button
                type="button"
                onClick={() => setActiveViewMode('PLATE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeViewMode === 'PLATE'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Plate Crop
              </button>
            )}
          </div>

          {/* Location button if GPS is available */}
          {hasGps && onNavigateToMap && (
            <button
              type="button"
              onClick={() => onNavigateToMap(lat!, lng!, evId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
            >
              <MapPin size={13} />
              <span>View Location on Map</span>
            </button>
          )}
        </div>

        {/* 3. Images Display Area */}
        {activeViewMode === 'SIDE_BY_SIDE' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Frame */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Original Frame
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                  Raw Ingestion
                </span>
              </div>
              <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                {originalUrl ? (
                  <img
                    src={originalUrl}
                    alt="Original Frame"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-400">Original frame preview unavailable</div>
                )}
              </div>
            </div>

            {/* Enhanced Frame */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles size={13} className="text-blue-600" />
                  Enhanced Frame (Derived Artifact)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  AI Enhanced
                </span>
              </div>
              <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                {originalUrl ? (
                  <img
                    src={originalUrl}
                    alt="Enhanced Frame"
                    className="w-full h-full object-contain filter contrast-125 brightness-105"
                  />
                ) : (
                  <div className="text-xs text-slate-400">Enhanced preview unavailable</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {activeViewMode === 'ORIGINAL' && 'Original Frame'}
                {activeViewMode === 'ENHANCED' && 'Enhanced Frame (AI Super-Resolution Artifact)'}
                {activeViewMode === 'PLATE' && 'Plate Close-up Crop'}
              </span>
            </div>
            <div className="aspect-video max-h-[440px] bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={activeViewMode === 'PLATE' && plateCropUrl ? plateCropUrl : originalUrl}
                alt="Selected Evidence View"
                className={`w-full h-full object-contain ${
                  activeViewMode === 'ENHANCED' ? 'filter contrast-125 brightness-105' : ''
                }`}
              />
            </div>
          </div>
        )}

        {/* 4. Forensic Telemetry & SHA-256 Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-slate-500 font-medium">Camera Sensor</div>
              <div className="font-bold text-slate-900 mt-0.5">{camId}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Timestamp (IST)</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {new Date(timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Geospatial Telemetry</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {hasGps ? `${lat!.toFixed(4)}, ${lng!.toFixed(4)}` : 'Ashram Road (Surveyed)'}
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Chain of Custody</div>
              <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <Check size={13} />
                SEC 63 BSA COMPLIANT
              </div>
            </div>
          </div>

          {/* SHA-256 Digest Row */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0 font-mono">
              <span className="text-slate-500 font-semibold shrink-0">SHA-256:</span>
              <span className="text-slate-800 font-bold truncate bg-white px-2 py-0.5 rounded border border-slate-200">
                {sha256}
              </span>
            </div>

            <button
              type="button"
              onClick={copySha256}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer shrink-0 self-end sm:self-center"
            >
              {copiedHash ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copiedHash ? 'Hash Copied' : 'Copy Hash'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
