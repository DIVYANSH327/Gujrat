/**
 * Background Surveillance Intelligence & Unified Audit Engine
 * Gujarat Police CCTV & AI Intelligence Platform (SCRB)
 *
 * Implements 24/7 Continuous Autonomous Audit:
 * - Real-time HSRP Vehicle Inspection & ANPR (CMVR Rule 50)
 * - Real-time People & Pedestrian Detection & Safety Audit (Helmet / Density)
 * - Forensic snapshots and bounding box crops for all detections
 * - Multi-frame tracking & Best 3 Frames preservation
 * - SHA-256 Chain of Custody (BSA 2023 Section 63 Compliant)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Car,
  User,
  Users,
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
  Zap,
  Filter,
  Camera,
  Maximize2
} from 'lucide-react';
import type { 
  VehicleObservation, 
  VehicleTrackRecord, 
  PersonObservation,
  PersonTrackRecord,
  UnifiedAuditEntry,
  IntelligenceTelemetry 
} from '../types/intelligence';

export function BackgroundVehicleIntelligenceTab() {
  const [telemetry, setTelemetry] = useState<IntelligenceTelemetry | null>(null);
  const [observations, setObservations] = useState<VehicleObservation[]>([]);
  const [personObservations, setPersonObservations] = useState<PersonObservation[]>([]);
  const [auditTrail, setAuditTrail] = useState<UnifiedAuditEntry[]>([]);
  const [auditSummary, setAuditSummary] = useState<any>(null);
  const [tracks, setTracks] = useState<VehicleTrackRecord[]>([]);
  const [personTracks, setPersonTracks] = useState<PersonTrackRecord[]>([]);
  const [anprSuitability, setAnprSuitability] = useState<Record<string, { suitable: boolean; reason: string; isHealthy: boolean }>>({});
  
  // Selection states for drawer / modal
  const [selectedTrack, setSelectedTrack] = useState<VehicleTrackRecord | null>(null);
  const [selectedPersonTrack, setSelectedPersonTrack] = useState<PersonTrackRecord | null>(null);
  const [selectedObs, setSelectedObs] = useState<VehicleObservation | null>(null);
  const [selectedPersonObs, setSelectedPersonObs] = useState<PersonObservation | null>(null);
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<UnifiedAuditEntry | null>(null);
  
  const [isTriggeringCam12, setIsTriggeringCam12] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'hsrp' | 'people' | 'tracks' | 'suitability'>('audit');
  const [auditFilterCategory, setAuditFilterCategory] = useState<string>('ALL');
  const [auditFilterStatus, setAuditFilterStatus] = useState<string>('ALL');
  const [filterCamera, setFilterCamera] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchIntelligenceData = useCallback(async () => {
    try {
      const res = await fetch('/api/intelligence/bundle');
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.status) setTelemetry(data.status);
      if (data.observations) setObservations(data.observations);
      if (data.persons) setPersonObservations(data.persons);
      if (data.auditTrail) setAuditTrail(data.auditTrail);
      if (data.auditSummary) setAuditSummary(data.auditSummary);
      if (data.vehicleTracks) setTracks(data.vehicleTracks);
      if (data.personTracks) setPersonTracks(data.personTracks);
      if (data.anprSuitability) setAnprSuitability(data.anprSuitability);
    } catch (err) {
      console.warn('Error fetching intelligence bundle:', err);
    }
  }, []);

  useEffect(() => {
    fetchIntelligenceData();
    const interval = setInterval(fetchIntelligenceData, 30000);
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

  // Filtered Audit Trail
  const filteredAuditTrail = auditTrail.filter(entry => {
    if (auditFilterCategory === 'HSRP' && entry.category !== 'VEHICLE_HSRP') return false;
    if (auditFilterCategory === 'PERSON' && entry.category !== 'PERSON_PEDESTRIAN') return false;
    if (auditFilterStatus !== 'ALL' && entry.status !== auditFilterStatus) return false;
    if (filterCamera !== 'ALL' && entry.cameraId !== filterCamera) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.targetId.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        entry.cameraId.toLowerCase().includes(q) ||
        entry.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Vehicle Observations
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

  // Filtered Person Observations
  const filteredPersonObservations = personObservations.filter(p => {
    if (filterCamera !== 'ALL' && p.cameraId !== filterCamera) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.cameraId.toLowerCase().includes(q) ||
        p.classification.toLowerCase().includes(q) ||
        (p.helmetStatus && p.helmetStatus.toLowerCase().includes(q)) ||
        p.location.toLowerCase().includes(q)
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
            <span>24/7 Live Surveillance Engine</span>
            {telemetry?.engineState === 'ENGINE_RUNNING' || (telemetry?.isRunning && !telemetry?.engineState) ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE AUDIT
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                STANDBY
              </span>
            )}
          </div>
          <div className="text-xl font-mono font-bold text-white flex items-baseline justify-between">
            <span>{formatUptime(telemetry?.uptimeSeconds)}</span>
            <span className="text-xs text-slate-400 font-normal">
              Cycle: {formatCycleAgo(telemetry?.lastCycleAt)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {telemetry?.cyclesCompleted ?? 0} cycles • Non-blocking dual HSRP/Person pipeline
          </p>
        </div>

        {/* Card 2: HSRP Plate Audit Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>HSRP Vehicles Audited</span>
            <span className="text-emerald-400 font-bold font-mono text-xs">
              {auditSummary?.hsrpVerified ?? 0} VERIFIED
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {telemetry?.totalVehiclesObserved ?? 0} Observed
          </div>
          <p className="text-[11px] text-slate-400">
            {telemetry?.totalPlatesRead ?? 0} plates read • {auditSummary?.hsrpNonCompliant ?? 0} flagged non-HSRP
          </p>
        </div>

        {/* Card 3: People / Pedestrian Audit Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>People &amp; Pedestrians</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
              {auditSummary?.helmetViolations ?? 0} SAFETY ALERTS
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-cyan-400">
            {telemetry?.totalPersonsObserved ?? personObservations.length ?? 0} Detected
          </div>
          <p className="text-[11px] text-slate-400">
            {telemetry?.uniquePersonTracks ?? personTracks.length ?? 0} unique tracks • Forensic snapshots stored
          </p>
        </div>

        {/* Card 4: Evidence Storage & BSA 2023 Compliance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Statutory Evidence Vault</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              SEC 63 BSA
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            SHA-256 Sealed
          </div>
          <p className="text-[11px] text-slate-400">
            {(telemetry as any)?.totalSnapshotsStored ?? 0} snapshots stored • 30-day evidentiary retention
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
                  PRIORITY SURVEILLANCE NODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gandhinagar Highway Corridor • Autonomous HSRP Plate &amp; Pedestrian Forensic Extraction
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
            <span className="text-slate-500">Unreadable / Flagged:</span>{' '}
            <span className="font-mono text-amber-400 font-bold">{telemetry?.cam12Summary.unreadablePlates ?? 0}</span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Activity size={14} />
            <span>Unified Audit Trail ({auditTrail.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('hsrp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'hsrp'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Car size={14} />
            <span>HSRP Vehicles &amp; Plates ({observations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('people')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'people'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users size={14} />
            <span>People &amp; Pedestrians ({personObservations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tracks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'tracks'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers size={14} />
            <span>Multi-Frame Tracks ({tracks.length + personTracks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('suitability')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'suitability'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileCheck size={14} />
            <span>30-Camera Matrix</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchIntelligenceData}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          title="Refresh Live Data"
        >
          <RotateCw size={14} />
        </button>
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, person, camera..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {activeSubTab === 'audit' && (
            <>
              <select
                value={auditFilterCategory}
                onChange={(e) => setAuditFilterCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="HSRP">HSRP Vehicles Only</option>
                <option value="PERSON">People &amp; Pedestrians Only</option>
              </select>

              <select
                value={auditFilterStatus}
                onChange={(e) => setAuditFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLIANT">Compliant / Verified</option>
                <option value="NON_COMPLIANT">Non-Compliant / Alert</option>
                <option value="DETECTED">Detected</option>
              </select>
            </>
          )}

          <select
            value={filterCamera}
            onChange={(e) => setFilterCamera(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Cameras (30)</option>
            <option value="cam12">CAM12 (Toll Plaza)</option>
            <option value="cam01">CAM01 (Chiman bhai Bridge)</option>
            <option value="cam02">CAM02 (Iscon Crossroad)</option>
            <option value="cam03">CAM03 (Pakwan Junction)</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono self-end sm:self-center">
          {activeSubTab === 'audit' && `${filteredAuditTrail.length} Audited Events`}
          {activeSubTab === 'hsrp' && `${filteredObservations.length} Vehicle Detections`}
          {activeSubTab === 'people' && `${filteredPersonObservations.length} Person Detections`}
          {activeSubTab === 'tracks' && `${tracks.length + personTracks.length} Active Tracks`}
        </span>
      </div>

      {/* 5. Main Content by Active Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* TAB: UNIFIED AUDIT TRAIL */}
          {activeSubTab === 'audit' && (
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredAuditTrail.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                  No audit entries recorded yet. The background intelligence engine continuously monitors live cameras.
                </div>
              ) : (
                filteredAuditTrail.map((entry) => (
                  <div
                    key={entry.auditId}
                    onClick={() => setSelectedAuditEntry(entry)}
                    className={`bg-slate-900/90 border rounded-xl p-3 flex items-center justify-between gap-3 hover:border-blue-500/60 transition cursor-pointer ${
                      selectedAuditEntry?.auditId === entry.auditId ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Forensic Crop Thumbnail */}
                      <div className="w-16 h-14 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shrink-0 relative">
                        <img
                          src={entry.cropUrl || entry.frameUrl}
                          alt="Forensic Crop"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] font-mono text-center text-slate-400 py-0.5">
                          {entry.category === 'VEHICLE_HSRP' ? 'HSRP' : 'PERSON'}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 font-mono text-[10px] font-bold">
                            {entry.cameraId.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-white uppercase truncate font-mono">
                            {entry.targetId}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(entry.timestampMs).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {entry.details}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {entry.location}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {entry.status === 'COMPLIANT' || entry.status === 'VERIFIED' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">
                            COMPLIANT
                          </span>
                        ) : entry.status === 'NON_COMPLIANT' || entry.status === 'FLAGGED' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-bold">
                            VIOLATION
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono text-[11px] font-bold">
                            DETECTED
                          </span>
                        )}
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {(entry.confidence * 100).toFixed(0)}% conf
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: HSRP VEHICLES ONLY */}
          {activeSubTab === 'hsrp' && (
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredObservations.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                  No vehicle observations captured yet.
                </div>
              ) : (
                filteredObservations.map((obs) => (
                  <div
                    key={obs.observationId}
                    onClick={() => {
                      setSelectedObs(obs);
                      setSelectedPersonObs(null);
                      setSelectedAuditEntry(null);
                    }}
                    className={`bg-slate-900/90 border rounded-xl p-3 flex items-center justify-between gap-3 hover:border-blue-500/60 transition cursor-pointer ${
                      selectedObs?.observationId === obs.observationId ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
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
          )}

          {/* TAB: PEOPLE & PEDESTRIANS */}
          {activeSubTab === 'people' && (
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredPersonObservations.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                  No person observations captured yet. Continuous detection active on all live camera streams.
                </div>
              ) : (
                filteredPersonObservations.map((person) => (
                  <div
                    key={person.observationId}
                    onClick={() => {
                      setSelectedPersonObs(person);
                      setSelectedObs(null);
                      setSelectedAuditEntry(null);
                    }}
                    className={`bg-slate-900/90 border rounded-xl p-3 flex items-center justify-between gap-3 hover:border-blue-500/60 transition cursor-pointer ${
                      selectedPersonObs?.observationId === person.observationId ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-16 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shrink-0 relative">
                        <img
                          src={person.personCropUrl}
                          alt="Person Crop"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 font-mono text-[10px] font-bold">
                            {person.cameraId.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-white uppercase truncate">
                            {person.classification.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(person.frameTimestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {person.location}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Track: {person.personTrackId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {person.helmetStatus === 'HELMET_COMPLIANT' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">
                            HELMET OK
                          </span>
                        ) : person.helmetStatus === 'NO_HELMET' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-bold">
                            NO HELMET
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                            {person.posture || 'PEDESTRIAN'}
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {(person.personConfidence * 100).toFixed(0)}% confidence
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: MULTI-FRAME TRACKS */}
          {activeSubTab === 'tracks' && (
            <div className="space-y-4">
              {/* Vehicle Tracks */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Car size={14} className="text-blue-400" />
                  Vehicle Tracks ({tracks.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                  {tracks.map((t) => (
                    <div
                      key={t.vehicleTrackId}
                      onClick={() => {
                        setSelectedTrack(t);
                        setSelectedPersonTrack(null);
                      }}
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
                  ))}
                </div>
              </div>

              {/* Person Tracks */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Users size={14} className="text-purple-400" />
                  Person Tracks ({personTracks.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                  {personTracks.map((pt) => (
                    <div
                      key={pt.personTrackId}
                      onClick={() => {
                        setSelectedPersonTrack(pt);
                        setSelectedTrack(null);
                      }}
                      className={`p-2.5 rounded-xl border transition cursor-pointer ${
                        selectedPersonTrack?.personTrackId === pt.personTrackId
                          ? 'bg-purple-950/40 border-purple-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-purple-400">{pt.personTrackId}</span>
                        <span className="text-[10px] text-slate-400">{pt.frameCount} frames</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1">
                        <span className="capitalize">{pt.classification} • {pt.cameraId.toUpperCase()}</span>
                        <span className="text-[10px] text-slate-400">
                          {pt.bestFrames.length} keyframes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: 30-CAMERA SUITABILITY MATRIX */}
          {activeSubTab === 'suitability' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCheck size={14} className="text-emerald-400" />
                  30-Camera ANPR Suitability &amp; Optical Readiness Matrix
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">Real Optical Metrics</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
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
          )}
        </div>

        {/* Right Column: Forensic Inspector / Snapshot Modal */}
        <div className="space-y-4">
          {/* Detailed Inspector for Selected Entry */}
          {(selectedAuditEntry || selectedObs || selectedPersonObs || selectedTrack || selectedPersonTrack) ? (
            <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Fingerprint size={14} className="text-cyan-400" />
                  Forensic Chain of Custody &amp; Snapshot
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAuditEntry(null);
                    setSelectedObs(null);
                    setSelectedPersonObs(null);
                    setSelectedTrack(null);
                    setSelectedPersonTrack(null);
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={13} />
                </button>
              </div>

              {/* AUDIT ENTRY INSPECTOR */}
              {selectedAuditEntry && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">Forensic Snapshot:</span>
                    <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-1">
                      <img
                        src={selectedAuditEntry.frameUrl}
                        alt="Audit Snapshot"
                        className="w-full h-36 object-cover rounded-lg"
                      />
                    </div>
                  </div>

                  {selectedAuditEntry.cropUrl && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold">Target Crop:</span>
                      <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-1">
                        <img
                          src={selectedAuditEntry.cropUrl}
                          alt="Target Crop"
                          className="w-full h-20 object-contain rounded bg-black"
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950 p-3 rounded-xl space-y-1 font-mono text-[10px]">
                    <div className="text-slate-400">
                      Audit ID: <span className="text-white font-bold">{selectedAuditEntry.auditId}</span>
                    </div>
                    <div className="text-slate-400 truncate">
                      SHA256: <span className="text-cyan-400">{selectedAuditEntry.sha256}</span>
                    </div>
                    <div className="text-slate-400">
                      Camera: <span className="text-blue-400">{selectedAuditEntry.cameraId.toUpperCase()}</span> ({selectedAuditEntry.cameraName})
                    </div>
                    <div className="text-slate-400">
                      Status: <span className="text-emerald-400 font-bold">{selectedAuditEntry.status}</span>
                    </div>
                    <div className="text-slate-400">
                      Details: <span className="text-slate-200">{selectedAuditEntry.details}</span>
                    </div>
                    <div className="text-slate-400">
                      Timestamp: <span className="text-slate-300">{selectedAuditEntry.timestamp}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* VEHICLE OBS INSPECTOR */}
              {selectedObs && !selectedAuditEntry && (
                <div className="space-y-3">
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

              {/* PERSON OBS INSPECTOR */}
              {selectedPersonObs && !selectedAuditEntry && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Person Target Crop:</span>
                    <img src={selectedPersonObs.personCropUrl} alt="Person" className="w-full h-28 object-contain rounded-lg border border-slate-800 bg-black" />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl space-y-1 font-mono text-[10px]">
                    <div className="text-slate-400">
                      Classification: <span className="text-white font-bold">{selectedPersonObs.classification}</span>
                    </div>
                    <div className="text-slate-400">
                      Helmet Status: <span className="text-emerald-400 font-bold">{selectedPersonObs.helmetStatus}</span>
                    </div>
                    <div className="text-slate-400">
                      Confidence: <span className="text-slate-300">{(selectedPersonObs.personConfidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="truncate text-slate-400">
                      SHA256: <span className="text-cyan-400">{selectedPersonObs.personCropSha256.slice(0, 24)}...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* VEHICLE TRACK BEST 3 FRAMES */}
              {selectedTrack && (
                <div className="space-y-2">
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

                  {selectedTrack.bestPlateFrames.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400 font-bold">Plate Frames:</span>
                      <div className="space-y-1.5">
                        {selectedTrack.bestPlateFrames.map((pf, idx) => (
                          <div key={idx} className="bg-slate-950 rounded-xl p-2 border border-slate-800 space-y-1">
                            <div className="grid grid-cols-2 gap-1.5">
                              <img src={pf.originalCropUrl} alt="Raw" className="w-full h-8 object-contain bg-black rounded" />
                              <img src={pf.enhancedCropUrl || pf.originalCropUrl} alt="Enhanced" className="w-full h-8 object-contain bg-black rounded border border-amber-500/30" />
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400">
                              <span>{pf.ocrResult}</span>
                              <span className="text-slate-400">{pf.enhancementType}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PERSON TRACK BEST FRAMES */}
              {selectedPersonTrack && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold">Best Person Keyframes:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {selectedPersonTrack.bestFrames.map((f, idx) => (
                      <div key={idx} className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-1 space-y-1">
                        <img src={f.cropUrl} alt="Person Keyframe" className="w-full h-16 object-contain bg-black rounded" />
                        <div className="text-[9px] font-mono text-slate-400 truncate text-center">
                          {(f.confidence * 100).toFixed(0)}% conf
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-2 text-xs text-slate-400">
              <Camera size={24} className="mx-auto text-slate-600 mb-1" />
              <p className="font-bold text-white">Forensic Snapshot Inspector</p>
              <p className="text-[11px]">Select any HSRP vehicle or person detection to view statutory snapshots, bounding boxes, and SHA-256 evidence verification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
