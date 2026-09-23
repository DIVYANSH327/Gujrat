/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Mobile Patrol Dashcam Judgments View in AI Agent Mesh
 */

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Camera, 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  Clock, 
  MapPin, 
  Hash, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { AIMeshJudicialVerdict } from '../types/mobilePatrolHsrpTypes';
import { MobilePatrolJudicialModal } from './MobilePatrolJudicialModal';

interface MobilePatrolMeshTabProps {
  onNavigateToMobileCamera?: () => void;
}

export const MobilePatrolMeshTab: React.FC<MobilePatrolMeshTabProps> = ({
  onNavigateToMobileCamera
}) => {
  const [judgments, setJudgments] = useState<AIMeshJudicialVerdict[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVerdict, setSelectedVerdict] = useState<AIMeshJudicialVerdict | null>(null);

  const fetchJudgments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-mesh/mobile-judgments');
      if (res.ok) {
        const data = await res.json();
        setJudgments(data || []);
      }
    } catch (e) {
      console.warn('Failed to fetch mobile judgments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudgments();
    const interval = setInterval(fetchJudgments, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Camera size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                MOBILE PATROL DASHCAM: AI MESH ARBITRATIONS
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Real-time High Security Registration Plate (HSRP) judgments from mobile patrol units
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchJudgments}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>

          {onNavigateToMobileCamera && (
            <button
              onClick={onNavigateToMobileCamera}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
            >
              <span>OPEN PATROL DASHCAM</span>
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Judgments Grid */}
      {judgments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Scale size={36} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300 font-mono uppercase tracking-wider">
            NO MOBILE PATROL ARBITRATIONS RECORDED YET
          </h3>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
            When patrol officers capture vehicle snapshots with HSRP and assign them to the AI Mesh, multi-agent judicial rulings will appear here in real time.
          </p>
          {onNavigateToMobileCamera && (
            <button
              onClick={onNavigateToMobileCamera}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              LAUNCH PATROL CAMERA TO CAPTURE HSRP
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {judgments.map((verdict) => {
            const isVerified = verdict.decision === 'HSRP_VERIFIED';
            return (
              <div 
                key={verdict.verdictId}
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col hover:border-slate-700 transition-all shadow-lg group"
              >
                {/* Snapshot preview */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img 
                    src={verdict.fullSnapshotUrl} 
                    alt="Vehicle Snapshot"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border shadow-md ${
                      isVerified
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                    }`}>
                      {isVerified ? '✓ HSRP VERIFIED' : '⚠ NON-HSRP VIOLATION'}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-white/10">
                    {verdict.speedKmH} km/h
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white text-sm tracking-wide">{verdict.plateText}</span>
                      <span className="text-slate-400">{verdict.vehicleClass.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-1 line-clamp-2">
                      {verdict.agentDeliberations.finalMeshArbiter.summary}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Source Unit:</span>
                      <span className="text-slate-200">{verdict.unitId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality Score:</span>
                      <span className="text-emerald-400 font-bold">{verdict.qualityScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consensus:</span>
                      <span className="text-white font-bold">{Math.round(verdict.confidence * 100)}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedVerdict(verdict)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <span>VIEW MESH RULING & EVIDENCE</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Judicial Modal */}
      <MobilePatrolJudicialModal
        isOpen={!!selectedVerdict}
        verdict={selectedVerdict}
        onClose={() => setSelectedVerdict(null)}
      />
    </div>
  );
};
