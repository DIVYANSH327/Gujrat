/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Unified Vehicle & Mobile Patrol Search Modal
 */

import React, { useState } from 'react';
import { 
  Search, 
  X, 
  Car, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Navigation,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { mobileVisionUnitRegistry } from '../../services/mobilePatrol/MobileVisionUnitRegistry';
import { PatrolEventEvidence } from '../../types/mobilePatrolTypes';

interface MobilePatrolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: PatrolEventEvidence) => void;
}

export const MobilePatrolSearchModal: React.FC<MobilePatrolSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectEvent
}) => {
  const [searchTerm, setSearchTerm] = useState('GJ01AB1234');
  const [hsrpOnly, setHsrpOnly] = useState(false);
  const [noPlateOnly, setNoPlateOnly] = useState(false);

  if (!isOpen) return null;

  const searchResults = mobileVisionUnitRegistry.searchObservations({
    term: searchTerm,
    hsrpOnly,
    noPlateOnly
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Search className="text-blue-400" size={20} />
            <h2 className="text-base font-bold uppercase tracking-wider">
              UNIFIED SEARCH & VEHICLE JOURNEY CORRELATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter Registration No. (e.g. GJ01AB1234), Unit ID (MVU-001), Camera ID or Location..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <Search size={18} className="absolute left-3.5 top-3 text-slate-500" />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setHsrpOnly(!hsrpOnly)}
              className={`px-3 py-1 rounded-lg border transition-colors ${
                hsrpOnly
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              HSRP Verified Only
            </button>
            <button
              onClick={() => setNoPlateOnly(!noPlateOnly)}
              className={`px-3 py-1 rounded-lg border transition-colors ${
                noPlateOnly
                  ? 'bg-rose-950 border-rose-500 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              No-Plate Candidates Only
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Multi-Point Trajectory Corridor (Fixed CCTV + Mobile Unit) */}
          {searchResults.trajectoryMatches.length > 0 && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-blue-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation size={14} />
                  <span>GOD'S EYE MULTI-POINT CORRIDOR TRAJECTORY</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  3 Observation Nodes Linked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {searchResults.trajectoryMatches.map((node, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        node.nodeType === 'MOBILE_UNIT'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {node.nodeType === 'MOBILE_UNIT' ? '● MOBILE UNIT' : '■ FIXED CCTV'}
                      </span>
                      <span className="text-[10px] text-slate-500">{new Date(node.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="font-bold text-white text-[11px] truncate">{node.nodeId}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Status: <span className="text-emerald-400">{node.status}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Mobile Patrol Evidence Events */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                MATCHED MOBILE PATROL EVIDENCE RECORDS ({searchResults.events.length})
              </span>
            </div>

            {searchResults.events.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                No matching records found for "{searchTerm}".
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.events.map(evt => (
                  <div
                    key={evt.eventId}
                    onClick={() => {
                      onSelectEvent(evt);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{evt.category.replace('_', ' ')}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300">
                          {evt.plateText || 'NO PLATE'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">
                        Vehicle: {evt.vehicleClass} • Unit: {evt.vehicleId} • {new Date(evt.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-blue-400 font-mono text-xs font-bold">
                      <span>View Dossier</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
