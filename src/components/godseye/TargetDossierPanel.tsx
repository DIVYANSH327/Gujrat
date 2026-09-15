/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * TargetDossierPanel: Clean White Police Investigation Right Panel
 * Target Dossier, Truth Status, Real-Time Sightings, CCTV Intercept Preview,
 * and Downstream Predicted Checkpoint.
 */

import React, { useState } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Car, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Camera as CameraIcon, 
  FileText, 
  Radio, 
  Eye, 
  Navigation, 
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { 
  TargetDossierSummary, 
  VerifiedVehicleSighting, 
  SentinelCameraLocation, 
  DownstreamPrediction 
} from './types';

interface TargetDossierPanelProps {
  searchQuery: string;
  targetSummary: TargetDossierSummary | null;
  sightings: VerifiedVehicleSighting[];
  selectedCamera: SentinelCameraLocation | null;
  downstreamPrediction: DownstreamPrediction | null;
  onOpenEvidenceDossier: () => void;
  onTrackTarget: (plate: string) => void;
  onOpenLiveStream?: (cameraId: string) => void;
  onSelectCameraById?: (cameraId: string) => void;
  onCreateInvestigation?: (plate: string) => void;
  isLoading: boolean;
}

export function TargetDossierPanel({
  searchQuery,
  targetSummary,
  sightings,
  selectedCamera,
  downstreamPrediction,
  onOpenEvidenceDossier,
  onTrackTarget,
  onOpenLiveStream,
  onSelectCameraById,
  onCreateInvestigation,
  isLoading
}: TargetDossierPanelProps) {
  const [streamError, setStreamError] = useState<boolean>(false);

  // Latest verified sighting
  const latestSighting = sightings.length > 0 ? sightings[sightings.length - 1] : null;

  // Truth status helper
  const getTruthStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OBSERVED':
      case 'VERIFIED':
      case 'AUTHORITATIVE':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            OBSERVED
          </span>
        );
      case 'INFERRED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            INFERRED
          </span>
        );
      case 'PREDICTED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            PREDICTED
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            UNCERTAIN
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {status || 'NOT_AVAILABLE'}
          </span>
        );
    }
  };

  // Active preview camera
  const previewCamera = selectedCamera;

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-slate-200 select-none overflow-y-auto">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              TARGET DOSSIER
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Cross-Camera Intelligence
            </p>
          </div>
        </div>

        {targetSummary && (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
            {targetSummary.targetId}
          </span>
        )}
      </div>

      <div className="p-3.5 space-y-3.5 flex-1 bg-[#F6F8FB]/60">
        {/* Target Overview Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
          {/* Plate & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs font-mono border border-slate-800 shadow-xs">
                GJ
              </div>
              <div>
                <h3 className="text-sm font-black font-mono tracking-wide text-slate-900">
                  {targetSummary?.targetId || searchQuery || 'TARGET UNSELECTED'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {targetSummary?.vehicleType || 'Motor Vehicle'} • {targetSummary?.color || 'White / Silver'}
                </p>
              </div>
            </div>

            {getTruthStatusBadge(targetSummary?.truthStatus || (sightings.length > 0 ? 'OBSERVED' : 'NOT_AVAILABLE'))}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                Last Seen
              </span>
              <span className="font-bold text-slate-800 font-mono text-xs">
                {targetSummary?.lastSeenTime || (latestSighting ? new Date(latestSighting.timestamp).toLocaleTimeString('en-IN', { hour12: false }) : 'N/A')}
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                Last Camera
              </span>
              <span className="font-bold text-blue-700 font-mono text-xs truncate block">
                {targetSummary?.lastCameraId || (latestSighting ? latestSighting.cameraId.toUpperCase() : 'N/A')}
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                Sightings
              </span>
              <span className="font-bold text-slate-800 font-mono text-xs">
                {targetSummary?.sightingCount || sightings.length} Verified
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                Confidence
              </span>
              <span className="font-bold text-emerald-700 font-mono text-xs">
                {targetSummary ? `${Math.round(targetSummary.confidence * 100)}%` : latestSighting ? `${Math.round(latestSighting.confidence * 100)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Current / Last Verified Location Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-600" />
              CURRENT LOCATION
            </span>
            {latestSighting && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                VERIFIED
              </span>
            )}
          </div>

          {latestSighting ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500 font-medium">Camera:</span>
                <button
                  onClick={() => onSelectCameraById && onSelectCameraById(latestSighting.cameraId)}
                  className="font-bold font-mono text-blue-600 hover:underline"
                >
                  {latestSighting.cameraId.toUpperCase()} ({latestSighting.cameraName || 'Junction Sensor'})
                </button>
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500 font-medium">Location:</span>
                <span className="font-medium text-slate-800 text-right truncate max-w-[160px]">
                  {latestSighting.location || latestSighting.district || 'Gujarat Urban Corridor'}
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500 font-medium">Time:</span>
                <span className="font-mono text-slate-700">
                  {new Date(latestSighting.timestamp).toLocaleString('en-IN', { hour12: false })}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
              TARGET LOCATION UNKNOWN
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onTrackTarget(targetSummary?.targetId || searchQuery)}
            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Track Target</span>
          </button>

          <button
            onClick={onOpenEvidenceDossier}
            className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>View Evidence</span>
          </button>

          <button
            onClick={() => {
              if (previewCamera && onOpenLiveStream) {
                onOpenLiveStream(previewCamera.cameraId);
              } else if (latestSighting && onOpenLiveStream) {
                onOpenLiveStream(latestSighting.cameraId);
              }
            }}
            className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <CameraIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Open Camera</span>
          </button>

          <button
            onClick={() => {
              if (onCreateInvestigation) {
                onCreateInvestigation(targetSummary?.targetId || searchQuery);
              }
            }}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Investigate</span>
          </button>
        </div>

        {/* Camera Intercept Panel Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <CameraIcon className="w-3 h-3 text-slate-700" />
              CAMERA INTERCEPT PREVIEW
            </span>

            {previewCamera ? (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  previewCamera.status === 'LIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                ● {previewCamera.status}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">
                No Camera Selected
              </span>
            )}
          </div>

          {previewCamera ? (
            <div className="space-y-2">
              <div className="relative aspect-video w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
                <img
                  src={previewCamera.thumbnailUrl || `/api/sentinel/stream/${previewCamera.cameraId}/snapshot.jpg`}
                  alt={previewCamera.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    setStreamError(true);
                  }}
                />

                {/* Overlaid Timestamp / Name Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{previewCamera.cameraId.toUpperCase()}</span>
                </div>

                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-slate-300">
                  {previewCamera.protocol || 'HLS / RTSP'}
                </div>
              </div>

              <div className="text-xs space-y-0.5">
                <h4 className="font-bold text-slate-900 line-clamp-1">
                  {previewCamera.name}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {previewCamera.location} ({previewCamera.district})
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onOpenLiveStream && onOpenLiveStream(previewCamera.cameraId)}
                  className="flex-1 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Open Live View</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Select a camera from the map or left list to activate real-time intercept.
            </div>
          )}
        </div>

        {/* Downstream Predicted Next Checkpoint (Dashed border, distinctly PREDICTED) */}
        {downstreamPrediction && (
          <div className="bg-amber-50/40 rounded-xl border-2 border-dashed border-amber-300 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                NEXT PREDICTED CHECKPOINT
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200/60 text-amber-900 rounded border border-amber-300">
                PREDICTED
              </span>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-bold text-slate-900">
                {downstreamPrediction.predictedCameraId?.toUpperCase()} • {downstreamPrediction.predictedJunction || 'Paldi Circle Crossroad'}
              </div>
              <p className="text-[11px] text-slate-600">
                Estimated Transit Window: <span className="font-mono font-semibold">{downstreamPrediction.estimatedArrivalWindow || '3-5 min'}</span> (Confidence: {Math.round((downstreamPrediction.confidence || 0.85) * 100)}%)
              </p>
            </div>

            <div className="text-[10px] text-amber-800 bg-amber-100/60 p-2 rounded border border-amber-200/80">
              ⚠️ Inferred trajectory based on historical network corridor vector. Not an observed fact.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
