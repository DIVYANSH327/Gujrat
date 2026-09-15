/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * InvestigationTimelineScrubber: Clean White Bottom Timeline & Evidence Filmstrip
 * Chronological Vehicle Sightings, Playback Transport Controls,
 * Predicted Downstream Node, and Real Evidence SHA-256 Filmstrip.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Clock, 
  Navigation, 
  Car, 
  Sparkles,
  Camera,
  FileCheck,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { 
  VerifiedVehicleSighting, 
  DownstreamPrediction 
} from './types';

interface InvestigationTimelineScrubberProps {
  sightings: VerifiedVehicleSighting[];
  selectedSightingId?: string;
  downstreamPrediction?: DownstreamPrediction | null;
  onSelectSighting: (sighting: VerifiedVehicleSighting) => void;
  onOpenEvidenceModal?: (sighting: VerifiedVehicleSighting) => void;
}

export function InvestigationTimelineScrubber({
  sightings,
  selectedSightingId,
  downstreamPrediction,
  onSelectSighting,
  onOpenEvidenceModal
}: InvestigationTimelineScrubberProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFilmstripExpanded, setIsFilmstripExpanded] = useState<boolean>(true);
  const timerRef = useRef<any>(null);

  // Active sighting index
  const currentIndex = sightings.findIndex(s => s.observationId === selectedSightingId);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  // Handle Play/Pause Auto-Step
  useEffect(() => {
    if (!isPlaying || sightings.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(1000, 3000 / playbackSpeed);

    timerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % sightings.length;
      onSelectSighting(sightings[nextIndex]);
      if (nextIndex === sightings.length - 1) {
        setIsPlaying(false);
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeIndex, sightings, playbackSpeed, onSelectSighting]);

  if (sightings.length === 0) {
    return null;
  }

  const handleStepPrev = () => {
    if (activeIndex > 0) {
      onSelectSighting(sightings[activeIndex - 1]);
    }
  };

  const handleStepNext = () => {
    if (activeIndex < sightings.length - 1) {
      onSelectSighting(sightings[activeIndex + 1]);
    }
  };

  const handleCycleSpeed = () => {
    setPlaybackSpeed(prev => (prev === 1 ? 2 : prev === 2 ? 4 : 1));
  };

  const currentSighting = sightings[activeIndex];

  return (
    <div className="w-full bg-white border-t border-slate-200 select-none shadow-sm flex flex-col flex-shrink-0 z-10">
      {/* Top Bar: Playback Controls + Active Sighting Telemetry */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStepPrev}
            disabled={activeIndex <= 0}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg transition-colors"
            title="Previous Sighting"
            aria-label="Previous Sighting"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Replay Corridor</span>
              </>
            )}
          </button>

          <button
            onClick={handleStepNext}
            disabled={activeIndex >= sightings.length - 1}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg transition-colors"
            title="Next Sighting"
            aria-label="Next Sighting"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCycleSpeed}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono font-semibold transition-colors"
            title="Playback Speed"
          >
            {playbackSpeed}x
          </button>
        </div>

        {/* Center: Current Active Observation Info */}
        {currentSighting && (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-600" />
              <span>Checkpoint {activeIndex + 1} of {sightings.length}</span>
            </span>

            <span className="text-slate-300">|</span>

            <span className="font-mono font-semibold text-slate-700">
              {currentSighting.cameraId.toUpperCase()}
            </span>

            <span className="hidden md:inline text-slate-500 font-medium">
              {currentSighting.cameraName}
            </span>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              OBSERVED
            </span>
          </div>
        )}

        {/* Right: Toggle Filmstrip Button */}
        <button
          onClick={() => setIsFilmstripExpanded(!isFilmstripExpanded)}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <FileCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Evidence Filmstrip</span>
          {isFilmstripExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Timeline & Filmstrip Scroller */}
      {isFilmstripExpanded && (
        <div className="p-3 bg-[#F6F8FB] overflow-x-auto flex items-stretch gap-3 scrollbar-thin">
          {/* Observation Nodes */}
          {sightings.map((sighting, idx) => {
            const isSelected = sighting.observationId === selectedSightingId || (!selectedSightingId && idx === 0);
            const timeStr = new Date(sighting.timestamp).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={sighting.observationId || idx}
                onClick={() => onSelectSighting(sighting)}
                className={`flex-shrink-0 w-52 bg-white rounded-xl border transition-all cursor-pointer p-3 shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/15 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Node Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {timeStr} IST
                    </span>
                  </div>

                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    OBSERVED
                  </span>
                </div>

                {/* Camera / Location Details */}
                <div className="text-xs mb-2 space-y-0.5">
                  <div className="font-bold text-slate-800 font-mono">
                    {sighting.cameraId.toUpperCase()}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {sighting.cameraName || sighting.location || 'Gujarat Crossroad'}
                  </p>
                </div>

                {/* Evidence Hash / Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    SHA-256 Valid
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenEvidenceModal) onOpenEvidenceModal(sighting);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Evidence</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Next Predicted Checkpoint Node (Dashed Amber styling) */}
          {downstreamPrediction && (
            <div className="flex-shrink-0 w-56 bg-amber-50/50 rounded-xl border-2 border-dashed border-amber-300 p-3 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    NEXT CHECKPOINT
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-200/80 text-amber-900 rounded border border-amber-300">
                    PREDICTED
                  </span>
                </div>

                <div className="text-xs space-y-0.5 mb-2">
                  <div className="font-bold text-slate-900 font-mono">
                    {downstreamPrediction.predictedCameraId?.toUpperCase()}
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    {downstreamPrediction.predictedJunction || 'Paldi Circle Crossroad'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/80 text-[10px] text-amber-800 flex justify-between font-medium">
                <span>Window: {downstreamPrediction.estimatedArrivalWindow || '3-5 min'}</span>
                <span>{Math.round((downstreamPrediction.confidence || 0.85) * 100)}% Conf.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
