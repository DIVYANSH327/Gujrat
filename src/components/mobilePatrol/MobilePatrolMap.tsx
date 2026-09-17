/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Mobile Evidence Map & Fleet Tracker
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Car, 
  AlertTriangle, 
  ShieldCheck, 
  Eye, 
  Filter, 
  Compass, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { PatrolEventEvidence, PatrolEventCategory, MobileVisionUnit } from '../../types/mobilePatrolTypes';
import { mobileVisionUnitRegistry } from '../../services/mobilePatrol/MobileVisionUnitRegistry';

interface MobilePatrolMapProps {
  events: PatrolEventEvidence[];
  onSelectEvent: (event: PatrolEventEvidence) => void;
  selectedEventId?: string;
}

export const MobilePatrolMap: React.FC<MobilePatrolMapProps> = ({
  events,
  onSelectEvent,
  selectedEventId
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NO_PLATE' | 'HSRP' | 'NO_HELMET' | 'TRIPLE_RIDING' | 'TRAFFIC' | 'WATCHLIST' | 'VERIFIED'>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<MobileVisionUnit | null>(null);
  const units = mobileVisionUnitRegistry.getAllUnits();

  // Filter events
  const filteredEvents = events.filter(evt => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'NO_PLATE') return evt.category === 'NO_PLATE' || evt.category === 'NO_PLATE_CANDIDATE';
    if (activeFilter === 'HSRP') return evt.hsrpStatus === 'HSRP_VERIFIED' || evt.category === 'HSRP_VERIFIED' || evt.category === 'HSRP_CANDIDATE';
    if (activeFilter === 'NO_HELMET') return evt.category === 'NO_HELMET';
    if (activeFilter === 'TRIPLE_RIDING') return evt.category === 'TRIPLE_RIDING' || evt.category === 'MULTIPLE_RIDERS';
    if (activeFilter === 'TRAFFIC') return evt.category.includes('VIOLATION') || evt.category === 'WRONG_WAY' || evt.category === 'OVERSPEED_CANDIDATE';
    if (activeFilter === 'WATCHLIST') return evt.category === 'WATCHLIST_MATCH' || evt.category === 'STOLEN_VEHICLE_MATCH';
    if (activeFilter === 'VERIFIED') return evt.reviewStatus === 'OFFICER_VERIFIED' || evt.meshConfidence > 0.88;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top Filter Bar */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="text-blue-400" size={18} />
          <span className="font-mono font-bold text-xs text-white uppercase tracking-wider">
            MOBILE EVIDENCE & PATROL FLEET MAP
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
            {filteredEvents.length} OBSERVATIONS
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'NO_PLATE', label: 'No Plate' },
            { id: 'HSRP', label: 'HSRP' },
            { id: 'NO_HELMET', label: 'No Helmet' },
            { id: 'TRIPLE_RIDING', label: 'Triple Riding' },
            { id: 'TRAFFIC', label: 'Traffic' },
            { id: 'WATCHLIST', label: 'Watchlist' },
            { id: 'VERIFIED', label: 'Verified Evidence' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Canvas Area with Gujarat Coordinates Overlay */}
      <div className="relative flex-1 min-h-[420px] bg-slate-950 overflow-hidden flex flex-col md:flex-row">
        
        {/* Visual Map Render (Simulated Vector Map Layer for High-Tech Command View) */}
        <div className="relative flex-1 bg-[#0a1120] p-4 flex items-center justify-center overflow-hidden">
          {/* Grid Background Pattern */}
          <div 
            className="absolute inset-0 opacity-15" 
            style={{
              backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #0a1120 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px'
            }}
          />

          {/* Road Corridors Vector SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
            {/* S.G. Highway Corridor */}
            <path d="M 120 380 Q 260 220 480 180 T 800 120" fill="none" stroke="#0284c7" strokeWidth="4" strokeDasharray="6 3" />
            <path d="M 80 150 Q 320 280 650 350" fill="none" stroke="#0369a1" strokeWidth="3" />
            <path d="M 380 60 L 420 440" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 4" />
          </svg>

          {/* Active Fleet Patrol Markers */}
          {units.map((unit, idx) => {
            const posX = 20 + idx * 30 + (unit.gps.longitude ? (unit.gps.longitude - 72.4) * 400 : 0);
            const posY = 30 + idx * 25 + (unit.gps.latitude ? (23.2 - unit.gps.latitude) * 400 : 0);
            const clampedX = Math.max(10, Math.min(85, posX));
            const clampedY = Math.max(15, Math.min(80, posY));

            return (
              <div 
                key={unit.unitId}
                onClick={() => setSelectedUnit(unit)}
                style={{ left: `${clampedX}%`, top: `${clampedY}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                {/* Radar Ping */}
                <div className="absolute -inset-2 rounded-full bg-cyan-500/20 animate-ping" />
                <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500 text-cyan-300 font-mono text-[11px] shadow-lg group-hover:scale-110 transition-transform">
                  <Car size={13} className="text-cyan-400" />
                  <span className="font-bold">{unit.unitId}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Tooltip on Hover */}
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-8 w-48 p-2 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl z-30 text-[10px] font-mono text-slate-300">
                  <div className="font-bold text-white mb-0.5">{unit.callSign}</div>
                  <div className="text-cyan-400">{unit.assignedSector}</div>
                  <div className="mt-1 flex justify-between">
                    <span>Speed:</span>
                    <span className="text-white font-bold">{unit.speed} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heading:</span>
                    <span className="text-white">{unit.heading}° NW</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Evidence Event Markers */}
          {filteredEvents.map((evt, idx) => {
            const isSelected = selectedEventId === evt.eventId;
            const offsetX = 15 + ((idx * 17) % 70);
            const offsetY = 20 + ((idx * 23) % 65);

            let markerColor = 'bg-blue-600 border-blue-400 text-white';
            if (evt.category === 'NO_PLATE' || evt.category === 'NO_PLATE_CANDIDATE') markerColor = 'bg-rose-600 border-rose-400 text-white animate-bounce';
            else if (evt.category === 'NO_HELMET' || evt.category === 'TRIPLE_RIDING') markerColor = 'bg-amber-600 border-amber-300 text-white';
            else if (evt.hsrpStatus === 'HSRP_VERIFIED') markerColor = 'bg-emerald-600 border-emerald-300 text-white';

            return (
              <div
                key={evt.eventId}
                onClick={() => onSelectEvent(evt)}
                style={{ left: `${offsetX}%`, top: `${offsetY}%` }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-all ${
                  isSelected ? 'scale-125 z-30 ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'hover:scale-110'
                }`}
              >
                <div className={`p-1.5 rounded-full border shadow-xl flex items-center justify-center ${markerColor}`}>
                  <MapPin size={14} />
                </div>
                {isSelected && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white text-[10px] font-mono font-bold shadow-xl">
                    {evt.category.replace('_', ' ')} • {evt.plateText || 'NO PLATE'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Map Compass & Coordinates HUD */}
          <div className="absolute bottom-3 left-3 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-300">
              <Compass size={14} className="text-cyan-400" />
              <span>AHMEDABAD CRIME GRID</span>
            </div>
            <span>LAT 23.0225° N</span>
            <span>LNG 72.5714° E</span>
          </div>
        </div>

        {/* Right Event Sidepanel */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900 p-3 overflow-y-auto max-h-[460px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300">GEO-LOCATED EVENTS</span>
            <span className="text-[10px] font-mono text-slate-400">{filteredEvents.length} pinned</span>
          </div>

          <div className="space-y-2">
            {filteredEvents.map(evt => {
              const isSelected = selectedEventId === evt.eventId;
              return (
                <div
                  key={evt.eventId}
                  onClick={() => onSelectEvent(evt)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white truncate">{evt.category.replace('_', ' ')}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{evt.vehicleClass} • {evt.plateText || 'UNREADABLE'}</span>
                    <span className="text-cyan-400 font-bold">{Math.round(evt.vehicleConfidence * 100)}%</span>
                  </div>

                  {evt.gps.status === 'AVAILABLE' && (
                    <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      <span>{evt.gps.latitude?.toFixed(4)}, {evt.gps.longitude?.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
