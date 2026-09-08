/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIIncidentCorrelationView: Multi-Camera Correlated Incident Aggregator
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Camera, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { CorrelatedIncident } from '../ai-agents/types';

interface AIIncidentCorrelationViewProps {
  incidents: CorrelatedIncident[];
  onInspectIncident: (incident: CorrelatedIncident) => void;
  onNavigateToTracking?: () => void;
}

export const AIIncidentCorrelationView: React.FC<AIIncidentCorrelationViewProps> = ({
  incidents,
  onInspectIncident,
  onNavigateToTracking
}) => {
  const incidentList = Array.isArray(incidents) ? incidents : [];
  const [selectedIncident, setSelectedIncident] = useState<CorrelatedIncident | null>(() => (
    incidentList.length > 0 ? incidentList[0] : null
  ));

  React.useEffect(() => {
    if (!selectedIncident && incidentList.length > 0) {
      setSelectedIncident(incidentList[0]);
    }
  }, [incidentList, selectedIncident]);

  return (
    <div className="bg-[#080d1a] border border-cyan-950/80 rounded-xl overflow-hidden shadow-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="text-cyan-400" size={18} />
            <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
              CORRELATED MULTI-CAMERA INCIDENTS ({incidentList.length})
            </h3>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
            Spatiotemporally aggregated events across adjacent camera zones to prevent operator alert flooding.
          </p>
        </div>

        {onNavigateToTracking && (
          <button
            onClick={onNavigateToTracking}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors"
          >
            <Sparkles size={13} />
            OPEN IN GOD'S EYE
          </button>
        )}
      </div>

      {incidentList.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 font-mono text-xs">
          No active correlated incidents. Trigger the Road Safety Scenario above to cluster multi-camera events.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Incident List */}
          <div className="lg:col-span-1 space-y-2 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
            {incidentList.map((inc, idx) => (
              <div
                key={`${inc.incidentId}-${idx}`}
                onClick={() => setSelectedIncident(inc)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedIncident?.incidentId === inc.incidentId
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-black/30 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {inc.incidentId}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950/80 text-rose-400 border border-rose-500/40">
                    {inc.severity}
                  </span>
                </div>

                <h4 className="text-xs font-mono font-bold text-zinc-200 mt-1">
                  {inc.title}
                </h4>

                <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Camera size={11} className="text-zinc-500" />
                    {(inc.affectedCameras || []).length} Cameras
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-zinc-500" />
                    {new Date(inc.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Incident Detail / Multi-Camera Corridor Inspector */}
          {selectedIncident && (
            <div className="lg:col-span-2 bg-black/40 border border-zinc-800/80 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-cyan-300">
                      {selectedIncident.incidentId}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                      STATUS: {selectedIncident.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-mono font-bold text-zinc-100 mt-1">
                    {selectedIncident.title}
                  </h3>
                </div>

                <div className="text-right text-[11px] font-mono text-zinc-400">
                  <span>Confidence: </span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round(selectedIncident.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs font-mono text-zinc-300 bg-[#0c1427] p-2.5 rounded border border-cyan-950/60">
                {selectedIncident.summary}
              </p>

              {/* Affected Corridor Cameras */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 tracking-wider">
                  Aggregated CCTV Corridor Sightings ({(selectedIncident.affectedCameras || []).length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(selectedIncident.affectedCameras || []).map((cam, idx) => (
                    <div key={cam} className="p-2 bg-black/60 rounded border border-zinc-800 text-center">
                      <Camera size={14} className="mx-auto text-cyan-400 mb-1" />
                      <span className="text-[11px] font-mono font-bold text-zinc-200 block">{cam}</span>
                      <span className="text-[9px] font-mono text-zinc-500 block">Sighting #{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Entity IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-2 border-t border-zinc-800">
                <div className="p-2 bg-black/40 rounded border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">SECURITY EVENTS</span>
                  <span className="text-zinc-200 font-bold">{selectedIncident.relatedEvents.join(', ') || 'EVT-SAFETY'}</span>
                </div>
                <div className="p-2 bg-black/40 rounded border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">FORENSIC EVIDENCE</span>
                  <span className="text-zinc-200 font-bold">{selectedIncident.relatedEvidence.join(', ') || 'EVD-VERIFIED'}</span>
                </div>
                <div className="p-2 bg-black/40 rounded border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">DISPATCH ALERTS</span>
                  <span className="text-zinc-200 font-bold">{selectedIncident.relatedAlerts.join(', ') || 'ALT-HIGH'}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onInspectIncident(selectedIncident)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold rounded-lg cursor-pointer"
                >
                  Inspect Audit Trail <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
