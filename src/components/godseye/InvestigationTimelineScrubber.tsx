/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * InvestigationTimelineScrubber: Bottom Forensic Scrubber
 * Interactive Chronological Scrubber, Playback Controls (1x, 2x, 4x), and Map Sync.
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
  RotateCcw,
  FastForward
} from 'lucide-react';
import { VerifiedVehicleSighting } from './types';

interface InvestigationTimelineScrubberProps {
  sightings: VerifiedVehicleSighting[];
  selectedSightingId?: string;
  onSelectSighting: (sighting: VerifiedVehicleSighting) => void;
}

export function InvestigationTimelineScrubber({
  sightings,
  selectedSightingId,
  onSelectSighting
}: InvestigationTimelineScrubberProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
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
    <div className="w-full bg-slate-900 border-t border-slate-800 p-2.5 flex flex-col gap-2 z-10 select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Playback Transport Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleStepPrev}
            disabled={activeIndex <= 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 transition-colors"
            title="Previous Sighting"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
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
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 transition-colors"
            title="Next Sighting"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={handleCycleSpeed}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-mono transition-colors"
            title="Playback Speed"
          >
            {playbackSpeed}x
          </button>
        </div>

        {/* Current Active Step Sighting Telemetry */}
        {currentSighting && (
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-sky-400" />
              <span>Step {activeIndex + 1} of {sightings.length}</span>
            </span>

            <span className="text-slate-400">
              Camera: <strong className="text-slate-200 font-mono">{currentSighting.cameraId}</strong> ({currentSighting.cameraName})
            </span>

            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {new Date(currentSighting.timestamp).toLocaleTimeString('en-IN', { hour12: false })} IST
            </span>
          </div>
        )}

        <div className="text-[11px] font-mono text-slate-400">
          Spatiotemporal Timeline
        </div>
      </div>

      {/* Discrete Timeline Scrubber Bar */}
      <div className="relative w-full h-4 flex items-center">
        {/* Track Line */}
        <div className="absolute inset-x-0 h-1 bg-slate-800 rounded-full" />
        {/* Active Progress Fill */}
        <div 
          className="absolute left-0 h-1 bg-sky-500 rounded-full transition-all duration-300"
          style={{ width: `${(activeIndex / Math.max(1, sightings.length - 1)) * 100}%` }}
        />

        {/* Sighting Nodes along Track */}
        <div className="relative w-full flex justify-between items-center z-10 px-1">
          {sightings.map((sighting, index) => {
            const isSelected = index === activeIndex;
            const isPassed = index <= activeIndex;

            return (
              <button
                key={sighting.observationId}
                onClick={() => onSelectSighting(sighting)}
                className="group relative focus:outline-none flex flex-col items-center"
                title={`#${index + 1}: ${sighting.cameraName} (${new Date(sighting.timestamp).toLocaleTimeString('en-IN', { hour12: false })})`}
              >
                <div 
                  className={`w-3.5 h-3.5 rounded-full transition-all flex items-center justify-center ${
                    isSelected 
                      ? 'bg-sky-400 ring-4 ring-sky-500/40 scale-125' 
                      : isPassed 
                      ? 'bg-sky-600 hover:bg-sky-400' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                />

                {/* Sighting Label below node on larger screens */}
                <span className="hidden md:block absolute top-4 text-[9px] font-mono text-slate-400 whitespace-nowrap">
                  #{index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
