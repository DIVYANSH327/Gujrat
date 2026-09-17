import React, { useState } from 'react';
import { 
  Sparkles, 
  Car, 
  User, 
  CreditCard, 
  AlertTriangle, 
  ShieldCheck, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  FileText,
  Activity,
  Layers,
  ExternalLink
} from 'lucide-react';
import { SecurityEventPayload, Alert } from '../../types';

export interface DetectionCounts {
  vehicles: number;
  people: number;
  plates: number;
  violations: number;
  hsrpCandidates: number;
  watchlistMatches: number;
}

export interface LatestEventInfo {
  id: string;
  title: string;
  camera: string;
  time: string;
  status: 'REVIEW REQUIRED' | 'VERIFIED' | 'INVESTIGATING' | 'DISMISSED';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  thumbnailUrl?: string;
  rawPayload?: any;
}

interface AIDetectionAnalysisPanelProps {
  counts: DetectionCounts;
  latestEvent: LatestEventInfo | null;
  eventsList: SecurityEventPayload[];
  logsList: string[];
  onViewEventDetails: (event: LatestEventInfo | SecurityEventPayload) => void;
  onNavigateToIncidents?: () => void;
}

export const AIDetectionAnalysisPanel: React.FC<AIDetectionAnalysisPanelProps> = ({
  counts,
  latestEvent,
  eventsList,
  logsList,
  onViewEventDetails,
  onNavigateToIncidents
}) => {
  const [activeTab, setActiveTab] = useState<'DETECTIONS' | 'EVENTS' | 'LOGS'>('DETECTIONS');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col space-y-4">
      {/* 1. Panel Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Sparkles size={16} />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Detection & Analysis
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('DETECTIONS')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'DETECTIONS'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Detections
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EVENTS')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'EVENTS'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Events
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LOGS')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'LOGS'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Logs
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT */}
      {activeTab === 'DETECTIONS' && (
        <div className="space-y-4">
          {/* Finding Metrics Rows */}
          <div className="space-y-2">
            {/* Vehicles Detected */}
            <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
                  <Car size={16} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Vehicles Detected
                </span>
              </div>
              <span className="text-sm sm:text-base font-bold text-blue-700 font-mono">
                {counts.vehicles}
              </span>
            </div>

            {/* People Detected */}
            <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                  <User size={16} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  People Detected
                </span>
              </div>
              <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono">
                {counts.people}
              </span>
            </div>

            {/* License Plates Detected */}
            <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-100/80 text-cyan-700 flex items-center justify-center">
                  <CreditCard size={16} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  License Plates Detected
                </span>
              </div>
              <span className="text-sm sm:text-base font-bold text-cyan-700 font-mono">
                {counts.plates}
              </span>
            </div>

            {/* Violations Detected */}
            <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center">
                  <AlertTriangle size={16} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Violations Detected
                </span>
              </div>
              <span className="text-sm sm:text-base font-bold text-rose-700 font-mono">
                {counts.violations}
              </span>
            </div>

            {/* HSRP Candidates */}
            <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  HSRP Candidates
                </span>
              </div>
              <span className="text-sm sm:text-base font-bold text-purple-700 font-mono">
                {counts.hsrpCandidates}
              </span>
            </div>

            {/* Watchlist Matches */}
            <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center">
                  <AlertOctagon size={16} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Watchlist Matches
                </span>
              </div>
              <span className="text-sm sm:text-base font-bold text-amber-700 font-mono">
                {counts.watchlistMatches}
              </span>
            </div>
          </div>

          {/* Latest Event Card */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Latest Event
              </span>
            </div>

            {latestEvent ? (
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-rose-900">
                      {latestEvent.title}
                    </div>
                    <div className="text-[11px] text-rose-700 mt-0.5">
                      Camera: <span className="font-semibold">{latestEvent.camera}</span> • Time: <span className="font-semibold">{latestEvent.time}</span>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200/80 text-rose-900 border border-rose-300 uppercase">
                        {latestEvent.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onViewEventDetails(latestEvent)}
                  className="px-3 py-1.5 bg-white hover:bg-rose-100/60 border border-rose-300 text-rose-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 self-end sm:self-center shadow-2xs"
                >
                  View Details
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                No active violation events registered in current frame window.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. EVENTS TAB */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar">
          {eventsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent traffic or security events logged.
            </div>
          ) : (
            eventsList.map((evt, idx) => (
              <div
                key={evt.eventId || idx}
                onClick={() => onViewEventDetails(evt)}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {((evt as any).eventType || (evt as any).type || 'Traffic Event').replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {evt.cameraId || 'CAM-014'} • {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600">
                  <span className="text-[10px] font-semibold">Inspect</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. LOGS TAB */}
      {activeTab === 'LOGS' && (
        <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar font-mono text-[11px]">
          {logsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-sans">
              System logging stream ready. Start analysis to observe real-time inference telemetry.
            </div>
          ) : (
            logsList.map((log, idx) => (
              <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 leading-relaxed">
                {log}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
