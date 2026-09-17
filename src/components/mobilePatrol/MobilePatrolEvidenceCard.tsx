/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Mobile Patrol Evidence Photo Card Component
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  MapPin, 
  FileText, 
  Scale, 
  Eye, 
  Layers, 
  Sparkles, 
  ExternalLink,
  Cpu,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  PatrolEventEvidence, 
  BoundedFrameItem 
} from '../../types/mobilePatrolTypes';

interface MobilePatrolEvidenceCardProps {
  event: PatrolEventEvidence | null;
  onOpenReviewModal: (event: PatrolEventEvidence) => void;
  onNavigateToMap?: (lat: number, lng: number) => void;
}

export const MobilePatrolEvidenceCard: React.FC<MobilePatrolEvidenceCardProps> = ({
  event,
  onOpenReviewModal,
  onNavigateToMap
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'RAW' | 'ENHANCED'>('RAW');
  const [selectedFilmstripFrame, setSelectedFilmstripFrame] = useState<BoundedFrameItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!event) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center text-slate-400">
        <Layers size={32} className="mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-medium">Select an event to inspect cryptographic evidence</p>
      </div>
    );
  }

  const handleCopyHash = (hash: string, label: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const currentDisplayUrl = selectedFilmstripFrame
    ? selectedFilmstripFrame.dataUrl
    : activeViewMode === 'ENHANCED'
      ? event.enhancedFrameUrl
      : event.bestFrameUrl;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      
      {/* Evidence Card Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm tracking-tight uppercase">
              {event.category.replace(/_/g, ' ')} EVIDENCE RECORD
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              {event.eventId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Captured by {event.cameraId} ({event.vehicleId}) · {new Date(event.timestamp).toLocaleString()}
          </p>
        </div>

        {/* RAW vs ENHANCED Switcher */}
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 text-xs">
          <button
            onClick={() => {
              setSelectedFilmstripFrame(null);
              setActiveViewMode('RAW');
            }}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeViewMode === 'RAW' && !selectedFilmstripFrame
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            RAW SOURCE
          </button>
          <button
            onClick={() => {
              setSelectedFilmstripFrame(null);
              setActiveViewMode('ENHANCED');
            }}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              activeViewMode === 'ENHANCED' && !selectedFilmstripFrame
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={12} />
            DERIVED ENHANCEMENT
          </button>
        </div>
      </div>

      {/* Primary Evidence Visualizer */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Main Image Frame (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
            <img
              src={currentDisplayUrl}
              alt="Evidence Frame"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/api/sentinel/snapshot/CAM-001';
              }}
            />

            {/* Mode Watermark */}
            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs border border-white/20 text-white px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider">
              {selectedFilmstripFrame
                ? `FILMSTRIP FRAME (${selectedFilmstripFrame.relativeTimeOffsetSec}s)`
                : activeViewMode === 'RAW'
                  ? 'RAW EVIDENCE (PRESERVED UNMODIFIED)'
                  : 'OPTICAL SUPER-RES (DERIVED)'}
            </div>

            {/* Integrity Badge */}
            <div className="absolute top-2 right-2 bg-emerald-950/80 backdrop-blur-xs border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-400" />
              <span>INTEGRITY PRESERVED</span>
            </div>

            {/* Indian Plate Overlay Badge */}
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-md border border-slate-300 shadow-md flex items-center gap-2">
              <div className="w-2.5 h-6 bg-blue-700 rounded-xs flex items-center justify-center text-white text-[7px] font-bold">
                IND
              </div>
              <span className="font-mono font-bold text-sm tracking-wider">
                {event.plateText}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                ({event.plateType})
              </span>
            </div>
          </div>

          {/* 5-Frame Rolling Candidate Filmstrip */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-semibold text-slate-700">5-Frame Bounded Sequence (Quality Graded):</span>
              <span className="font-mono text-[11px]">Consensus: {event.multiFrameAgreement.consensusRatio} Frames</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {event.supportingFrames.length > 0 ? (
                event.supportingFrames.map((frm, idx) => {
                  const isSelected = selectedFilmstripFrame?.frameId === frm.frameId;
                  return (
                    <div
                      key={frm.frameId || idx}
                      onClick={() => setSelectedFilmstripFrame(frm)}
                      className={`relative aspect-video rounded-md overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-blue-500 border-transparent shadow-xs'
                          : frm.isBestFrame
                            ? 'border-emerald-500 ring-1 ring-emerald-500/50'
                            : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={frm.dataUrl || event.bestFrameUrl}
                        alt={`Frame ${idx}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/sentinel/snapshot/CAM-001';
                        }}
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] font-mono px-1 py-0.2 flex items-center justify-between">
                        <span>{frm.relativeTimeOffsetSec > 0 ? `+${frm.relativeTimeOffsetSec}s` : `${frm.relativeTimeOffsetSec}s`}</span>
                        <span className={frm.qualityScore >= 85 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {frm.qualityScore}
                        </span>
                      </div>
                      {frm.isBestFrame && (
                        <div className="absolute top-0.5 right-0.5 bg-emerald-600 text-white text-[8px] font-bold px-1 rounded-xs">
                          BEST
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-5 text-center text-xs text-slate-400 py-2">
                  1-Frame Standard Capture
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evidence Analysis & Cryptographic Hashes (Right col) */}
        <div className="space-y-3 flex flex-col justify-between">
          
          {/* Saliency Crops */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 block mb-1">PLATE CROP</span>
              <div className="aspect-2/1 bg-white rounded border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                <img
                  src={event.plateCropUrl || event.bestFrameUrl}
                  alt="Plate Crop"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/sentinel/snapshot/CAM-001';
                  }}
                />
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 block mb-1">VEHICLE PROFILE</span>
              <div className="aspect-2/1 bg-white rounded border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                <img
                  src={event.vehicleCropUrl || event.bestFrameUrl}
                  alt="Vehicle Profile"
                  className="max-h-full max-w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/sentinel/snapshot/CAM-001';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dual Cryptographic SHA-256 Hashes */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" />
                Dual SHA-256 Digests
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                EVIDENCE READY
              </span>
            </div>

            {/* Raw Frame Hash */}
            <div>
              <span className="text-[10px] font-mono text-slate-500 block">RAW SOURCE DIGEST:</span>
              <div className="flex items-center justify-between gap-1 bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[10px] text-slate-800">
                <span className="truncate">{event.rawFrameHash}</span>
                <button
                  onClick={() => handleCopyHash(event.rawFrameHash, 'raw')}
                  className="text-slate-400 hover:text-slate-700"
                  title="Copy Raw Hash"
                >
                  {copiedHash === 'raw' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Enhanced Frame Hash */}
            <div>
              <span className="text-[10px] font-mono text-slate-500 block">DERIVED ENHANCEMENT DIGEST:</span>
              <div className="flex items-center justify-between gap-1 bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[10px] text-slate-800">
                <span className="truncate">{event.enhancedFrameHash}</span>
                <button
                  onClick={() => handleCopyHash(event.enhancedFrameHash, 'enh')}
                  className="text-slate-400 hover:text-slate-700"
                  title="Copy Enhanced Hash"
                >
                  {copiedHash === 'enh' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* AI Mesh Deliberation Summary */}
          <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-900 flex items-center gap-1">
                <Cpu size={13} className="text-purple-600" />
                13-Agent AI Mesh Verdict
              </span>
              <span className="font-mono text-purple-700 text-[11px] font-bold">
                {(event.meshConfidence * 100).toFixed(0)}% Conf.
              </span>
            </div>
            <p className="text-[11px] text-purple-950 font-mono leading-relaxed">
              {event.meshFinalVerdict}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onOpenReviewModal(event)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Scale size={14} />
              <span>Officer Review & Judicial Adjudication</span>
            </button>

            {event.gps.status === 'AVAILABLE' && event.gps.latitude && event.gps.longitude && onNavigateToMap && (
              <button
                onClick={() => onNavigateToMap(event.gps.latitude!, event.gps.longitude!)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 transition-colors"
              >
                <MapPin size={13} className="text-blue-600" />
                <span>View Coordinates on Evidence Map</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
