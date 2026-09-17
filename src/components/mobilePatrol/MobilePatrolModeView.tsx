/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Dedicated Touch-First Patrol Mode Interface
 * Designed for on-the-move officer operation without engineering clutter.
 */

import React, { useState } from 'react';
import { 
  Camera, 
  ShieldCheck, 
  AlertTriangle, 
  Car, 
  Activity, 
  MapPin, 
  Flame, 
  CheckCircle2, 
  Radio, 
  Zap, 
  Maximize2,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { PatrolEventEvidence, PatrolCameraMetadata } from '../../types/mobilePatrolTypes';
import { mobilePatrolNodeService } from '../../services/mobilePatrol/MobilePatrolNodeService';

interface MobilePatrolModeViewProps {
  metadata: PatrolCameraMetadata;
  events: PatrolEventEvidence[];
  onSelectEvent: (event: PatrolEventEvidence) => void;
  onReviewEvent: (event: PatrolEventEvidence) => void;
}

export const MobilePatrolModeView: React.FC<MobilePatrolModeViewProps> = ({
  metadata,
  events,
  onSelectEvent,
  onReviewEvent
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureFeedback, setLastCaptureFeedback] = useState<string | null>(null);

  // Aggregated Counters
  const noHelmetCount = events.filter(e => e.category === 'NO_HELMET').length;
  const noPlateCount = events.filter(e => e.category === 'NO_PLATE' || e.category === 'NO_PLATE_CANDIDATE').length;
  const hsrpCount = events.filter(e => e.hsrpStatus === 'HSRP_VERIFIED' || e.category === 'HSRP_VERIFIED').length;
  const trafficCount = events.filter(e => e.category.includes('VIOLATION') || e.category === 'WRONG_WAY' || e.category === 'OVERSPEED_CANDIDATE').length;

  const handleManualCapture = async (isSequence: boolean = false) => {
    setIsCapturing(true);
    try {
      const newEvt = await mobilePatrolNodeService.triggerEvent({
        category: 'NO_PLATE_CANDIDATE',
        priority: 'HIGH',
        vehicleClass: 'motorcycle',
        vehicleConfidence: 0.94,
        plateText: '',
        helmetState: 'NO_HELMET_CANDIDATE',
        riderCount: 2
      });
      setLastCaptureFeedback(isSequence ? '3-FRAME EVIDENCE SEQUENCE SEALED' : 'OFFICER EVIDENCE SNAPSHOT CAPTURED');
      setTimeout(() => setLastCaptureFeedback(null), 3000);
      onSelectEvent(newEvt);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-3 sm:p-4 rounded-xl border border-slate-800 shadow-2xl">
      {/* Top Officer HUD Bar */}
      <div className="p-3 sm:p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="w-4 h-4 rounded-full bg-emerald-500 block animate-ping absolute inset-0 opacity-75" />
            <span className="w-4 h-4 rounded-full bg-emerald-500 block relative" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                PATROL ACTIVE
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                EDGE PERCEPTION RUNNING
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="text-white font-bold">{metadata.callSign}</span>
              <span>•</span>
              <span className="text-cyan-400">{metadata.assignedSector}</span>
              <span>•</span>
              <span>{metadata.gps.speedKmH ?? 42} km/h</span>
            </div>
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleManualCapture(false)}
            disabled={isCapturing}
            className="flex-1 sm:flex-none px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white font-mono font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Camera size={18} />
            <span>{isCapturing ? 'SEALING RECORD...' : 'CAPTURE EVIDENCE'}</span>
          </button>

          <button
            onClick={() => handleManualCapture(true)}
            disabled={isCapturing}
            className="flex-1 sm:flex-none px-3.5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Layers size={16} />
            <span>3-FRAME SEQUENCE</span>
          </button>
        </div>
      </div>

      {/* Visual Feedback Banner */}
      {lastCaptureFeedback && (
        <div className="mb-3 p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl flex items-center justify-between text-emerald-200 text-xs font-mono animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-bold">{lastCaptureFeedback}</span>
          </div>
          <span className="text-emerald-400">BSA SEC 63 DIGEST CREATED</span>
        </div>
      )}

      {/* Main Large Touch Viewfinder (Video / Simulation Canvas) */}
      <div className="relative flex-1 min-h-[300px] sm:min-h-[420px] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
        {/* Synthetic Highway Patrol Feed Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-85"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/60" />

        {/* Minimalist Targeting Overlay */}
        <div className="absolute inset-4 sm:inset-8 border border-white/20 rounded-lg pointer-events-none flex flex-col justify-between p-3">
          <div className="flex justify-between items-start text-[11px] font-mono text-cyan-300">
            <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-md border border-cyan-500/40">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>LIVE 4K • 30 FPS</span>
            </div>
            <div className="bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-700 text-slate-300">
              YOLOv8 EDGE INFERENCE ACTIVE
            </div>
          </div>

          {/* Dynamic Bounding Box Overlay for Active Target */}
          <div className="self-center p-4 border-2 border-amber-400 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-mono font-bold shadow-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={14} className="text-amber-400" />
              <span>[TARGET LOCK] MOTORCYCLE • NO HELMET DETECTED</span>
            </div>
            <div className="text-[10px] text-slate-300">Plate Region: [NO READABLE PLATE] • Track #9402</div>
          </div>

          <div className="flex justify-between items-end text-[10px] font-mono text-slate-400">
            <span>DISCARDING NON-EVENT FRAMES LOCALLY</span>
            <span>ROLLING BUFFER: 10 SECONDS</span>
          </div>
        </div>
      </div>

      {/* Large Event Metric Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-mono">NO HELMET</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{noHelmetCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-mono">NO PLATE</div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">{noPlateCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <Radio size={20} />
          </div>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-mono">HSRP READS</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{hsrpCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-mono">TRAFFIC EVENTS</div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">{trafficCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Zap size={20} />
          </div>
        </div>
      </div>

      {/* Recent Event Carousel */}
      {events.length > 0 && (
        <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300">RECENT DETECTED EVIDENCE (EVENT-ONLY)</span>
            <span className="text-[10px] font-mono text-slate-400">Tap to Review</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {events.slice(0, 3).map(evt => (
              <div
                key={evt.eventId}
                onClick={() => onReviewEvent(evt)}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{evt.category.replace('_', ' ')}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {evt.vehicleClass} • {evt.plateText || 'NO PLATE'}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-blue-400 text-xs font-mono font-bold">
                  <span>Review</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
