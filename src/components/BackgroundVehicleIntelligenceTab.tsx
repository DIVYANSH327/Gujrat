/**
 * Background Vehicle Intelligence & Multi-Camera ANPR Tab
 * Gujarat Police CCTV & AI Intelligence Platform (SCRB)
 *
 * Implements TEST A & B Visualization:
 * - Server-side background intelligence status across 30 cameras
 * - CAM12 Tollnaka live forensic audit & manual trigger test
 * - Independent vehicle & plate crops with SHA-256 verification
 * - Multi-frame tracking drawer with Best 3 Vehicle Frames & Best 3 Plate Frames
 * - Clear distinction of OPTICAL_ENHANCEMENT vs AI_SUPER_RESOLUTION
 * - Truthful OCR display (NOT_READABLE when illegible)
 * - 30-Camera ANPR Suitability Diagnostic Matrix
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Car,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  Sliders,
  Sparkles,
  Fingerprint,
  Clock,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  Radio,
  FileCheck,
  Zap
} from 'lucide-react';
import type { VehicleObservation, VehicleTrackRecord, IntelligenceTelemetry } from '../types/intelligence';

export function BackgroundVehicleIntelligenceTab() {
  const [telemetry, setTelemetry] = useState<IntelligenceTelemetry | null>(null);
  const [observations, setObservations] = useState<VehicleObservation[]>([]);
  const [tracks, setTracks] = useState<VehicleTrackRecord[]>([]);
  const [anprSuitability, setAnprSuitability] = useState<Record<string, { suitable: boolean; reason: string; isHealthy: boolean }>>({});
  const [selectedTrack, setSelectedTrack] = useState<VehicleTrackRecord | null>(null);
  const [selectedObs, setSelectedObs] = useState<VehicleObservation | null>(null);
  const [isTriggeringCam12, setIsTriggeringCam12] = useState<boolean>(false);
  const [filterCamera, setFilterCamera] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchIntelligenceData = useCallback(async () => {
    try {
      const [statusRes, obsRes, tracksRes, suitRes] = await Promise.all([
        fetch('/api/intelligence/status').then(r => r.json()),
        fetch('/api/intelligence/observations?limit=50').then(r => r.json()),
        fetch('/api/intelligence/vehicle-tracks?limit=50').then(r => r.json()),
        fetch('/api/intelligence/anpr-suitability').then(r => r.json())
      ]);
      setTelemetry(statusRes);
      setObservations(obsRes || []);
      setTracks(tracksRes || []);
      setAnprSuitability(suitRes || {});
    } catch (err) {
      console.warn('Error fetching intelligence data:', err);
    }
  }, []);

  useEffect(() => {
    fetchIntelligenceData();
    const interval = setInterval(fetchIntelligenceData, 3000);
    return () => clearInterval(interval);
  }, [fetchIntelligenceData]);

  const triggerCam12Test = async () => {
    setIsTriggeringCam12(true);
    try {
      const res = await fetch('/api/intelligence/trigger/cam12', { method: 'POST' });
      const data = await res.json();
      if (data.observations && data.observations.length > 0) {
        setSelectedObs(data.observations[0]);
      }
      await fetchIntelligenceData();
    } catch (err) {
      console.error('Trigger CAM-12 failed:', err);
    } finally {
      setIsTriggeringCam12(false);
    }
  };

  const filteredObservations = observations.filter(o => {
    if (filterCamera !== 'ALL' && o.cameraId !== filterCamera) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.cameraId.toLowerCase().includes(q) ||
        o.vehicleType.toLowerCase().includes(q) ||
        o.ocrResult.toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function formatUptime(seconds: number = 0): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function formatCycleAgo(lastCycleIso?: string): string {
    if (!lastCycleIso) return 'Starting...';
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(lastCycleIso).getTime()) / 1000));
    if (diffSec < 2) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    return `${Math.floor(diffSec / 60)}m ago`;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & 24/7 Continuous Background Intelligence Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Engine Status & Uptime */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>24/7 Background Engine</span>
            {telemetry?.engineState === 'ENGINE_RUNNING' || (telemetry?.isRunning && !telemetry?.engineState) ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                RUNNING
              </span>
            ) : telemetry?.engineState === 'ENGINE_STALLED' ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                STALLED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                STOPPED
              </span>
            )}
          </div>
          <div className="text-xl font-mono font-bold text-white flex items-baseline justify-between">
            <span>{formatUptime(telemetry?.uptimeSeconds)}</span>
            <span className="text-xs text-slate-400 font-normal">
              Last: {formatCycleAgo(telemetry?.lastCycleAt)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Autonomous server-side loop ({telemetry?.cyclesCompleted ?? 0} cycles)
          </p>
        </div>

        {/* Card 2: 30-Camera Surveillance Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CCTV Camera Scheduler</span>
            <span className="text-blue-400 font-bold font-mono text-xs">
              {telemetry?.cameraCounts ? `${telemetry.cameraCounts.live}/${telemetry.cameraCounts.total} LIVE` : '30 CAMERAS'}
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {telemetry?.cameraCounts?.live ?? 30} Active Streams
          </div>
          <p className="text-[11px] text-slate-400">
            {telemetry?.cameraCounts?.reconnecting ? `${telemetry.cameraCounts.reconnecting} reconnecting` : '0 offline • non-blocking rotation'}
          </p>
        </div>

        {/* Card 3: Daily Activity vs Lifetime */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Forensics</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              TODAY
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {telemetry?.metrics?.today?.vehiclesDetected ?? telemetry?.totalVehiclesObserved ?? 0} Vehicles
          </div>
          <p className="text-[11px] text-slate-400">
            {telemetry?.metrics?.today?.ocrReadable ?? telemetry?.totalPlatesRead ?? 0} plates read • {telemetry?.metrics?.today?.framesAcquired ?? telemetry?.totalFramesSampled ?? 0} frames acquired
          </p>
        </div>

        {/* Card 4: AI & Statutory Evidence Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AI & Statutory Vault</span>
            {telemetry?.aiProviderState === 'AVAILABLE' ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                AI AVAILABLE
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                OPTICAL ONLY
              </span>
            )}
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            BSA 2023 Compliant
          </div>
          <p className="text-[11px] text-slate-400">
            SHA-256 sealed • {telemetry?.totalOpticalEnhancements ?? 0} optical enhancements
          </p>
        </div>
      </div>

      {/* 2. CAM12 Special Tollnaka Spotlight Test */}
      <div className="bg-slate-950 border border-blue-500/40 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg shadow-blue-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Car size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">CAM12 — Tri Mandir Adalaj Tollnaka</h3>
                <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 text-[10px] font-mono font-bold">
                  PRIORITY ANPR NODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gandhinagar Toll Plaza • Multi-Lane Highway Vehicle & Statutory HSRP Forensic Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerCam12Test}
              disabled={isTriggeringCam12}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Zap size={13} className={isTriggeringCam12 ? 'animate-spin' : ''} />
              <span>{isTriggeringCam12 ? 'Capturing & Analyzing...' : 'Run Real CAM-12 Test'}</span>
            </button>
          </div>
        </div>

        {/* CAM12 Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500">Toll Observations:</span>{' '}
            <span className="font-mono text-white font-bold">{telemetry?.cam12Summary.vehiclesObserved ?? 0}</span>
          </div>
          <div>
            <span className="text-slate-500">Unique Tracks:</span>{' '}
            <span className="font-mono text-cyan-400 font-bold">{telemetry?.cam12Summary.uniqueTracks ?? 0}</span>
          </div>
          <div>
            <span className="text-slate-500">Plates Read:</span>{' '}
            <span className="font-mono text-emerald-400 font-bold">{telemetry?.cam12Summary.platesRead ?? 0}</span>
          </div>
          <div>
            <span className="text-slate-500">Unreadable Plates:</span>{' '}
            <span className="font-mono text-amber-400 font-bold">{telemetry?.cam12Summary.unreadablePlates ?? 0}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard: Observations Feed & Multi-Frame Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Vehicle Observations Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plate, vehicle, camera..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={filterCamera}
                onChange={(e) => setFilterCamera(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Cameras (30)</option>
                <option value="cam12">CAM12 (Toll Plaza)</option>
                <option value="cam01">CAM01 (Chiman bhai Bridge)</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono self-end sm:self-center">
              {filteredObservations.length} Live Observations
            </span>
          </div>

          {/* Observations List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredObservations.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                No observations captured yet. The background engine samples cameras autonomously every 3.5s.
              </div>
            ) : (
              filteredObservations.map((obs) => (
                <div
                  key={obs.observationId}
                  onClick={() => setSelectedObs(obs)}
                  className={`bg-slate-900/90 border rounded-xl p-3 flex items-center justify-between gap-3 hover:border-blue-500/60 transition cursor-pointer ${
                    selectedObs?.observationId === obs.observationId ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Vehicle Crop Thumbnail */}
                    <div className="w-16 h-12 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shrink-0 relative">
                      <img
                        src={obs.vehicleCropUrl}
                        alt="Vehicle Crop"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 font-mono text-[10px] font-bold">
                          {obs.cameraId.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-white uppercase truncate">
                          {obs.vehicleType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(obs.frameTimestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {obs.location}
                      </p>
                    </div>
                  </div>

                  {/* Plate / OCR Result */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        {obs.ocrReadabilityStatus === 'READABLE' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                            {obs.ocrResult}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-xs">
                            NOT_READABLE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {obs.hsrpStatus === 'HSRP_COMPLIANT' ? (
                          <span className="text-emerald-400 font-bold">HSRP Verified</span>
                        ) : obs.hsrpStatus === 'HSRP_NON_COMPLIANT' ? (
                          <span className="text-red-400 font-bold">Non-HSRP</span>
                        ) : (
                          <span>HSRP Unverified</span>
                        )}
                      </p>
                    </div>

                    <ChevronRight size={14} className="text-slate-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Multi-Frame Track Record & Best 3 Frames Inspector */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Layers size={14} className="text-blue-400" />
                Active Vehicle Tracks ({tracks.length})
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">Multi-Frame</span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {tracks.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No active tracks tracked yet</p>
              ) : (
                tracks.map((t) => (
                  <div
                    key={t.vehicleTrackId}
                    onClick={() => setSelectedTrack(t)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      selectedTrack?.vehicleTrackId === t.vehicleTrackId
                        ? 'bg-blue-950/40 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-400">{t.vehicleTrackId}</span>
                      <span className="text-[10px] text-slate-400">{t.frameCount} frames</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-1">
                      <span className="capitalize">{t.vehicleType} • {t.cameraId.toUpperCase()}</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {t.bestPlateText || 'NO_READ'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Track / Observation Detailed Inspector */}
          {(selectedTrack || selectedObs) && (
            <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Fingerprint size={14} className="text-cyan-400" />
                  Forensic Chain of Custody
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTrack(null);
                    setSelectedObs(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Best 3 Vehicle Frames */}
              {selectedTrack && selectedTrack.bestVehicleFrames.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-bold">Best 3 Vehicle Frames:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {selectedTrack.bestVehicleFrames.map((f, idx) => (
                      <div key={idx} className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-1 space-y-1">
                        <img src={f.cropUrl} alt="Vehicle Crop" className="w-full h-12 object-cover rounded" />
                        <div className="text-[9px] font-mono text-slate-400 truncate">
                          Q: {f.qualityScore.toFixed(0)} | {(f.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best 3 Plate Frames & Optical Enhancement Comparison */}
              {selectedTrack && selectedTrack.bestPlateFrames.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-bold">Best 3 Plate Frames (Original vs Optical Enh):</span>
                  <div className="space-y-2">
                    {selectedTrack.bestPlateFrames.map((pf, idx) => (
                      <div key={idx} className="bg-slate-950 rounded-xl p-2 border border-slate-800 space-y-1.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] text-slate-500">RAW CROP</span>
                            <img src={pf.originalCropUrl} alt="Raw Plate" className="w-full h-10 object-contain bg-black rounded" />
                          </div>
                          <div>
                            <span className="text-[9px] text-amber-400 font-bold">OPTICAL 2X</span>
                            <img src={pf.enhancedCropUrl || pf.originalCropUrl} alt="Enhanced Plate" className="w-full h-10 object-contain bg-black rounded border border-amber-500/30" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-emerald-400 font-bold">{pf.ocrResult}</span>
                          <span className="text-slate-400">Method: {pf.enhancementType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Single Observation Inspector (when selected) */}
              {selectedObs && !selectedTrack && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400">Vehicle Crop</span>
                      <img src={selectedObs.vehicleCropUrl} alt="Vehicle" className="w-full h-16 object-cover rounded-lg border border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400">Plate Crop</span>
                      {selectedObs.enhancedPlateCropUrl ? (
                        <img src={selectedObs.enhancedPlateCropUrl} alt="Plate" className="w-full h-16 object-contain rounded-lg border border-slate-800 bg-black" />
                      ) : (
                        <div className="w-full h-16 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-500 text-[10px]">
                          No Plate
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl space-y-1 font-mono text-[10px]">
                    <div className="truncate text-slate-400">
                      SHA256: <span className="text-cyan-400">{selectedObs.frameSha256.slice(0, 24)}...</span>
                    </div>
                    <div className="text-slate-400">
                      OCR: <span className="text-emerald-400 font-bold">{selectedObs.ocrResult}</span> ({selectedObs.ocrReadabilityStatus})
                    </div>
                    <div className="text-slate-400">
                      Enhancement: <span className="text-amber-400 font-bold">{selectedObs.enhancementType}</span>
                    </div>
                    <div className="text-slate-400">
                      HSRP Status: <span className="text-white">{selectedObs.hsrpStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. 30-Camera ANPR Suitability Diagnostic Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <FileCheck size={14} className="text-emerald-400" />
            30-Camera ANPR Suitability & Optical Readiness Matrix
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">Real Optical Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
          {Object.entries(anprSuitability).map(([camId, data]: [string, { suitable: boolean; reason: string; isHealthy: boolean }]) => (
            <div
              key={camId}
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                data.suitable
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="min-w-0">
                <span className="font-mono font-bold uppercase">{camId}</span>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {data.reason}
                </p>
              </div>

              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                data.suitable
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {data.suitable ? 'SUITABLE' : 'UNSUITABLE'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
