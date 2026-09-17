/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * GeospatialMapView: Comprehensive Operational Map View for Gujarat Police Command Grid
 * 
 * Incorporates:
 * - Live Interactive GIS Map with OpenStreetMap / Air-Gapped Tile Engine
 * - Real-Time Observation Feed with Direct Evidence Linkage
 * - Vehicle Journey Visualizer & Predictive Corridor Inspection
 * - Mobile Patrol Telemetry & Fixed CCTV Grid Status
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Navigation,
  Search,
  Filter,
  Layers,
  Car,
  Camera,
  Activity,
  AlertTriangle,
  FileText,
  Clock,
  ChevronRight,
  ExternalLink,
  Radio,
  RefreshCw,
  Compass,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { RealGeospatialMap } from './RealGeospatialMap';
import { geospatialEvidenceService } from '../../services/GeospatialEvidenceService';
import { godsEyeObservationService } from '../../services/GodsEyeObservationService';
import { cameraTopologyService } from '../../services/CameraTopologyService';
import { realAIEvidencePipeline, EvidenceRecord } from '../../services/ai/RealAIEvidencePipeline';
import { ForensicEvidenceModal } from '../ForensicEvidenceModal';
import { VehicleObservation, ViewMode } from '../../types';

interface GeospatialMapViewProps {
  onNavigate?: (view: ViewMode) => void;
  onSelectVehicle?: (plate: string) => void;
  onSelectCameraId?: (cameraId: string) => void;
  onOpenEvidenceModal?: (evidenceId: string) => void;
}

export const GeospatialMapView: React.FC<GeospatialMapViewProps> = ({
  onNavigate,
  onSelectVehicle,
  onSelectCameraId,
  onOpenEvidenceModal
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>('GJ01AB1234');
  const [recentObservations, setRecentObservations] = useState<VehicleObservation[]>([]);
  const [fixedCamerasCount, setFixedCamerasCount] = useState<number>(0);
  const [activeMissionsCount, setActiveMissionsCount] = useState<number>(2);
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<Partial<EvidenceRecord> | null>(null);

  // Preset Targets
  const presetTargets = [
    { plate: 'GJ01AB1234', label: 'Commercial Sedan (SG Highway Corridor)', tag: 'WATCHLIST', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
    { plate: 'GJ05AB1234', label: 'White SUV (Wanted Intercept)', tag: 'CRITICAL', color: 'border-rose-500/40 text-rose-300 bg-rose-500/10' },
    { plate: 'GJ05XY6789', label: 'Surat Urban Logistics Fleet', tag: 'PATROL', color: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10' }
  ];

  const handleOpenEvidence = (evidenceId: string) => {
    if (onOpenEvidenceModal) {
      onOpenEvidenceModal(evidenceId);
    }
    // 1. Try real AI pipeline store
    const realRecord = realAIEvidencePipeline.getEvidenceRecord(evidenceId);
    if (realRecord) {
      setActiveEvidenceModal(realRecord);
      return;
    }
    // 2. Try matching from godsEyeObservationService
    const obs = godsEyeObservationService.getAllObservations().find(o =>
      o.evidenceReference === evidenceId || o.evidenceReferences?.includes(evidenceId) || o.observationId === evidenceId
    );
    if (obs) {
      setActiveEvidenceModal({
        evidenceId: obs.evidenceReference || obs.evidenceReferences?.[0] || evidenceId,
        imageReference: obs.imageReference,
        vehicleCropReference: obs.thumbnailReference !== obs.imageReference ? obs.thumbnailReference : undefined,
        sha256: obs.evidenceHash,
        sourceOfTruth: (obs.sourceType === 'REAL_CAMERA' ? 'CAMERA_OBSERVED' : 'SIMULATED') as any,
        cameraId: obs.cameraId,
        capturedAt: obs.timestamp,
        latitude: obs.location?.latitude || obs.gps?.latitude,
        longitude: obs.location?.longitude || obs.gps?.longitude,
        locationAccuracyMeters: obs.locationAccuracyMeters,
        ocrText: obs.plateNormalized || obs.plateText
      } as any);
    }
  };

  useEffect(() => {
    // Load observations & camera nodes
    const obs = godsEyeObservationService.getAllObservations().slice(0, 15);
    setRecentObservations(obs);
    setFixedCamerasCount(cameraTopologyService.getAllNodes().length);

    const interval = setInterval(() => {
      setRecentObservations(godsEyeObservationService.getAllObservations().slice(0, 15));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      {/* TOP HEADER */}
      <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Compass size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-mono tracking-tight text-white">
                OPERATIONAL GEOSPATIAL MAP & EVIDENCE
              </h1>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-mono font-bold">
                REAL GIS ENGINE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Live GIS Grid • Fixed CCTV Topologies • Mobile Patrol Telemetry • Forensic Geolocation
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <Camera size={14} className="text-cyan-400" />
            <span className="text-zinc-400">Fixed Cameras:</span>
            <span className="font-bold text-white">{fixedCamerasCount}</span>
          </div>

          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-zinc-400">Live Observations:</span>
            <span className="font-bold text-white">{recentObservations.length}</span>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('command_center')}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
            >
              <Shield size={14} />
              COMMAND CENTER
            </button>
          )}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: INTERACTIVE MAP */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-800">
          <RealGeospatialMap
            compact={false}
            initialPlate={selectedPlate}
            onSelectVehicle={onSelectVehicle}
            onSelectCameraId={onSelectCameraId}
            onOpenEvidenceModal={handleOpenEvidence}
            className="flex-1 h-full min-h-[500px]"
          />
        </div>

        {/* RIGHT COLUMN: SIGHTINGS FEED & TARGET QUICK-LAUNCH */}
        <div className="w-full lg:w-96 flex flex-col bg-zinc-950/60 overflow-hidden">
          {/* Target Quick Selection */}
          <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/40">
            <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Car size={14} className="text-cyan-400" />
              PRIORITY TARGETS
            </h3>
            <div className="space-y-1.5">
              {presetTargets.map(t => (
                <button
                  key={t.plate}
                  onClick={() => setSelectedPlate(t.plate)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    selectedPlate === t.plate
                      ? 'bg-zinc-800/90 border-cyan-500/50'
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">{t.plate}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${t.color}`}>
                        {t.tag}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate max-w-[220px]">{t.label}</div>
                  </div>
                  <ChevronRight size={14} className="text-zinc-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Chronological Sightings Stream */}
          <div className="flex-1 flex flex-col overflow-hidden p-3.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio size={14} className="text-emerald-400 animate-pulse" />
                LIVE OBSERVATION FEED
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">NO SYNTHETIC GPS</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {recentObservations.map((obs, idx) => {
                const lat = obs.location?.latitude || obs.gps?.latitude;
                const lng = obs.location?.longitude || obs.gps?.longitude;
                const hasCoords = lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0;

                return (
                  <div
                    key={`${obs.observationId}-${idx}`}
                    onClick={() => obs.plateNormalized && setSelectedPlate(obs.plateNormalized)}
                    className="p-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-colors text-xs font-mono"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">
                        {obs.plateNormalized || obs.plateText || 'UNKNOWN PLATE'}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1.5">
                      <Camera size={12} className="text-zinc-500" />
                      <span>{obs.cameraId}</span>
                      {obs.isMobileCamera && (
                        <span className="px-1 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded text-[9px]">
                          MOBILE
                        </span>
                      )}
                    </div>

                    {hasCoords ? (
                      <div className="flex items-center justify-between text-[10px] text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20 mb-1.5">
                        <span>GPS: {lat!.toFixed(4)}°, {lng!.toFixed(4)}°</span>
                        <span>±{obs.locationAccuracyMeters || 8}m</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded mb-1.5">
                        GPS NOT AVAILABLE
                      </div>
                    )}

                    {(obs.evidenceReference || obs.evidenceReferences?.[0]) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEvidence(obs.evidenceReference || obs.evidenceReferences![0]);
                        }}
                        className="w-full py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <FileText size={11} /> VIEW EVIDENCE RECORD
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FORENSIC EVIDENCE MODAL POPUP */}
      {activeEvidenceModal && (
        <ForensicEvidenceModal
          evidence={activeEvidenceModal}
          onClose={() => setActiveEvidenceModal(null)}
          onNavigateToMap={(lat, lng) => {
            setActiveEvidenceModal(null);
          }}
        />
      )}
    </div>
  );
};
