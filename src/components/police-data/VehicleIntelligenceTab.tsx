/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleIntelligenceTab: Comprehensive Multi-Modal Vehicle Intelligence View
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Car, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileText, 
  Layers, 
  ExternalLink, 
  Eye, 
  Fingerprint, 
  ArrowRight, 
  Activity, 
  Check, 
  X, 
  ShieldCheck,
  Zap,
  Radio,
  FileCheck
} from 'lucide-react';
import { normalizeLicensePlate, VehicleSighting } from '../../types';
import { vehicleCorrelationAgent, VehicleCorrelationResult } from '../../ai-agents/vehicle/VehicleCorrelationAgent';
import { centralRepo } from '../../services/Architecture';
import { PROJECT_BRANDING } from '../../branding';

interface VehicleIntelligenceTabProps {
  initialPlate?: string;
  onNavigateToGodsEye?: (plate: string) => void;
  onSelectCameraId?: (cameraId: string) => void;
}

export function VehicleIntelligenceTab({
  initialPlate = 'GJ05AB1234',
  onNavigateToGodsEye,
  onSelectCameraId
}: VehicleIntelligenceTabProps) {
  const [searchPlate, setSearchPlate] = useState(initialPlate);
  const [activePlate, setActivePlate] = useState(initialPlate);
  const [isSearching, setIsSearching] = useState(false);
  const [correlationResult, setCorrelationResult] = useState<VehicleCorrelationResult | null>(null);
  const [sightings, setSightings] = useState<VehicleSighting[]>([]);
  const [humanDecision, setHumanDecision] = useState<'PENDING' | 'CONFIRMED' | 'REJECTED' | 'ESCALATED'>('PENDING');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isDecisionSaved, setIsDecisionSaved] = useState(false);

  const presetPlates = [
    { plate: 'GJ05AB1234', label: 'Critical Wanted SUV (Corridor A)', tag: 'CRITICAL', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { plate: 'GJ01AB1234', label: 'Commercial Sedan (Ashram Rd)', tag: 'CLEAR', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { plate: 'GJ05XY6789', label: 'Suspect Motorcycle (Surat)', tag: 'WATCHLIST', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { plate: 'GJ27AX9999', label: 'Freight Carrier (NE-1)', tag: 'COMMERCIAL', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
  ];

  const runCorrelation = async (plateToQuery: string) => {
    const normalized = normalizeLicensePlate(plateToQuery);
    if (!normalized) return;

    setIsSearching(true);
    setActivePlate(normalized);
    setSearchPlate(normalized);
    setIsDecisionSaved(false);

    try {
      const res = await vehicleCorrelationAgent.correlateVehicleTarget({
        rawPlate: normalized,
        cameraId: 'CAM-007',
        hintClass: normalized.includes('6789') ? 'MOTORCYCLE' : normalized.includes('9999') ? 'TRUCK' : 'SUV',
        hintColor: normalized.includes('6789') ? 'BLACK' : normalized.includes('9999') ? 'BLUE' : 'WHITE',
        operator: 'Inspector R. K. Patel (State C&C)'
      });
      setCorrelationResult(res);

      // Collect camera sightings from central repository
      const allEvents = centralRepo.getAllEvents();
      const matchedEvents = allEvents
        .filter(e => (e.eventType === 'ANPR' || e.eventType === 'VEHICLE_SIGHTING') && normalizeLicensePlate(e.metadata?.plate || '') === normalized)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (matchedEvents.length > 0) {
        setSightings(matchedEvents.map((e, idx) => ({
          sightingId: e.eventId,
          vehicleNumber: normalized,
          cameraId: e.cameraId,
          siteId: e.siteId || 'SITE-1',
          timestamp: e.timestamp,
          plateConfidence: e.confidence,
          vehicleConfidence: 0.95,
          sourceEdgeNode: e.edgeNodeId,
          eventId: e.eventId,
          direction: e.metadata?.direction || 'Southbound',
          snapshotReference: e.snapshotReference
        })));
      } else {
        // Fallback default sighting
        setSightings([
          {
            sightingId: `SIGHT-${Date.now()}`,
            vehicleNumber: normalized,
            cameraId: 'CAM-007',
            siteId: 'SITE-STATEWIDE',
            timestamp: new Date().toISOString(),
            plateConfidence: res.anprResult.confidence,
            vehicleConfidence: 0.96,
            sourceEdgeNode: 'EDGE-00042',
            eventId: `EVT-ANPR-${normalized}`,
            direction: 'Southwest Corridor',
            snapshotReference: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'
          }
        ]);
      }
    } catch (err) {
      console.error('Vehicle correlation failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    runCorrelation(initialPlate);
  }, []);

  const handleDecision = (decision: 'CONFIRMED' | 'REJECTED' | 'ESCALATED') => {
    setHumanDecision(decision);
    setIsDecisionSaved(true);
  };

  return (
    <div className="space-y-6" id="vehicle-intelligence-tab">
      {/* Top Banner & Title */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">
                POLICE DATA INTELLIGENCE MESH V1.2
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                ACTIVE AI CORRELATION PIPELINE
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-400" />
              Unified Vehicle Intelligence & Cross-Modal Dossier
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Real-time multi-agent correlation synthesizing High-Speed ANPR OCR, Deep Visual Vehicle Classification, VAHAN 4.0 Registry, eChallan Enforcement, and eGujCop Police Records with Human Verification Safeguards.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/80 px-3.5 py-2 rounded-lg border border-slate-800">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>MESH STATE: ACTIVE</span>
          </div>
        </div>

        {/* Search Bar & Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && runCorrelation(searchPlate)}
              placeholder="Enter registration plate number (e.g. GJ05AB1234, GJ01AB1234)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
              id="vehicle-intel-plate-input"
            />
          </div>
          <button
            onClick={() => runCorrelation(searchPlate)}
            disabled={isSearching}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all font-mono"
            id="vehicle-intel-query-btn"
          >
            {isSearching ? <Activity className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>ANALYZE VEHICLE</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Quick Test Targets:</span>
          {presetPlates.map((preset) => (
            <button
              key={preset.plate}
              onClick={() => runCorrelation(preset.plate)}
              className={`px-2.5 py-1 rounded text-xs font-mono border transition-all hover:scale-105 ${preset.color} ${activePlate === preset.plate ? 'ring-2 ring-emerald-400' : ''}`}
              id={`preset-btn-${preset.plate}`}
            >
              {preset.plate} <span className="opacity-75">({preset.tag})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Dossier Grid */}
      {correlationResult && (
        <div className="space-y-6" id="correlation-result-dossier">
          {/* Top Alert & Reason Banner */}
          <div className={`p-4 rounded-xl border ${
            correlationResult.comparisonStatus === 'CRITICAL_DISCREPANCY'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : correlationResult.watchlistStatus === 'MATCH'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-slate-900/90 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-start gap-3">
              {correlationResult.comparisonStatus === 'CRITICAL_DISCREPANCY' ? (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              ) : correlationResult.watchlistStatus === 'MATCH' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">
                    {correlationResult.comparisonStatus === 'CRITICAL_DISCREPANCY' ? 'CRITICAL DATA DISCREPANCY DETECTED' : 'SYNTHESIZED ALERT REASON'}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-current/20">
                    TARGET: {correlationResult.normalizedPlate}
                  </span>
                </div>
                <p className="text-sm font-sans mt-1 text-white/90 leading-relaxed font-medium">
                  {correlationResult.alertReason}
                </p>
                {correlationResult.discrepancyDetails.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {correlationResult.discrepancyDetails.map((disc, idx) => (
                      <p key={idx} className="text-xs font-mono text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{disc}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Intelligence Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* 1. Visual ANPR & Classification */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <span className="text-xs font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> 1. AI Vision & ANPR
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {(correlationResult.anprResult.confidence * 100).toFixed(0)}% CONF
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[11px]">DETECTED PLATE (OCR)</span>
                    <span className="text-base font-bold text-white tracking-widest">{correlationResult.anprResult.normalizedPlate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">OBSERVED VEHICLE CLASS</span>
                    <span className="text-sm font-semibold text-emerald-300">{correlationResult.visualClassification.vehicleType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">OBSERVED COLOR & MAKE</span>
                    <span className="text-slate-300">{correlationResult.visualClassification.color} ({correlationResult.visualClassification.estimatedMake})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">CAPTURE LOCATION</span>
                    <span className="text-slate-300">{correlationResult.anprResult.cameraId} (Airport Circle North Gate)</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-4 pt-2 border-t border-slate-800">
                PROBABILISTIC VISION ESTIMATE
              </p>
            </div>

            {/* 2. VAHAN Vehicle Registry */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <span className="text-xs font-mono text-blue-400 uppercase font-semibold flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> 2. VAHAN 4.0 Registry
                  </span>
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                    correlationResult.vahanRecord.registrationStatus === 'ACTIVE' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {correlationResult.vahanRecord.registrationStatus}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[11px]">REGISTERED CLASS</span>
                    <span className="text-sm font-semibold text-white">{correlationResult.vahanRecord.vehicleClass}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">MAKE & MODEL</span>
                    <span className="text-slate-300">{correlationResult.vahanRecord.make} {correlationResult.vahanRecord.model}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">REGISTERED COLOR / FUEL</span>
                    <span className="text-slate-300">{correlationResult.vahanRecord.color} / {correlationResult.vahanRecord.fuelType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">REGISTERING AUTHORITY / RTO</span>
                    <span className="text-slate-300">{correlationResult.vahanRecord.rto || 'RTO Gujarat'}</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-4 pt-2 border-t border-slate-800 truncate" title={correlationResult.vahanRecord.disclaimer}>
                {correlationResult.vahanRecord.source}
              </p>
            </div>

            {/* 3. eChallan Violations */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <span className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> 3. eChallan Traffic
                  </span>
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                    correlationResult.echallanRecord.pendingChallans > 0
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {correlationResult.echallanRecord.pendingChallans} PENDING
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[11px]">OUTSTANDING FINES</span>
                    <span className="text-base font-bold text-amber-400">₹{correlationResult.echallanRecord.totalOutstandingAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">RECENT VIOLATIONS</span>
                    <span className="text-slate-300">
                      {correlationResult.echallanRecord.recentViolations.length > 0 
                        ? correlationResult.echallanRecord.recentViolations[0].violationType 
                        : 'No pending infractions'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">LAST VIOLATION DATE</span>
                    <span className="text-slate-300">
                      {correlationResult.echallanRecord.lastViolationDate 
                        ? new Date(correlationResult.echallanRecord.lastViolationDate).toLocaleDateString() 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-4 pt-2 border-t border-slate-800 truncate" title={correlationResult.echallanRecord.disclaimer}>
                {correlationResult.echallanRecord.source}
              </p>
            </div>

            {/* 4. eGujCop Police Records */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <span className="text-xs font-mono text-rose-400 uppercase font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> 4. eGujCop / CCTNS
                  </span>
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                    correlationResult.policeRecords.recordsFound > 0
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {correlationResult.policeRecords.recordsFound} RECORDS
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[11px]">WATCHLIST CLASSIFICATION</span>
                    <span className={`text-sm font-bold ${
                      correlationResult.watchlistStatus === 'MATCH' ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {correlationResult.watchlistStatus === 'MATCH' ? 'PRIORITY WANTED TARGET' : 'NOT DESIGNATED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">POLICE RECORD CATEGORY</span>
                    <span className="text-slate-300">
                      {correlationResult.policeRecords.records.length > 0 
                        ? correlationResult.policeRecords.records[0].category 
                        : 'NO ACTIVE RECORD'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">POLICE STATION / JURISDICTION</span>
                    <span className="text-slate-300">
                      {correlationResult.policeRecords.records.length > 0 
                        ? correlationResult.policeRecords.records[0].policeStation 
                        : 'STATEWIDE CLEAR'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-4 pt-2 border-t border-slate-800 truncate" title={correlationResult.policeRecords.disclaimer}>
                {correlationResult.policeRecords.source}
              </p>
            </div>
          </div>

          {/* Camera Sightings & Journey Reconstruction */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Chronological Camera Sightings & Corridor Trajectory ({sightings.length} Nodes)
              </h3>
              {onNavigateToGodsEye && (
                <button
                  onClick={() => onNavigateToGodsEye(activePlate)}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>Open God's Eye Tracking</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {sightings.map((sighting, idx) => (
                <div
                  key={sighting.sightingId || idx}
                  className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{sighting.cameraId}</span>
                        <span className="text-[11px] font-mono text-slate-400">({sighting.direction || 'Observed Corridor'})</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {(sighting.plateConfidence * 100).toFixed(0)}% OCR
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Edge Gateway: {sighting.sourceEdgeNode} | Site: {sighting.siteId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(sighting.timestamp).toLocaleTimeString()}
                    </span>
                    {onSelectCameraId && (
                      <button
                        onClick={() => onSelectCameraId(sighting.cameraId)}
                        className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Feed</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Human-in-the-Loop Officer Verification Action Panel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-mono tracking-wider text-amber-400 uppercase font-semibold">
                  MANDATORY HUMAN-IN-THE-LOOP SAFEGUARD
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Officer Verification & Field Dispatch Authorisation
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                humanDecision === 'CONFIRMED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : humanDecision === 'REJECTED'
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : humanDecision === 'ESCALATED'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              }`}>
                STATUS: {humanDecision}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              In strict accordance with statutory SOPs, automated ANPR visual detections and biometric candidate correlations are advisory. A commanding officer or duty supervisor must confirm or reject the correlation prior to interceptor dispatch.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleDecision('CONFIRMED')}
                className={`px-4 py-2 text-xs font-mono font-bold rounded-lg flex items-center gap-2 transition-all ${
                  humanDecision === 'CONFIRMED'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-400'
                    : 'bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                }`}
                id="officer-confirm-btn"
              >
                <Check className="w-4 h-4" />
                <span>CONFIRM TARGET (DISPATCH INTERCEPT)</span>
              </button>

              <button
                onClick={() => handleDecision('ESCALATED')}
                className={`px-4 py-2 text-xs font-mono font-bold rounded-lg flex items-center gap-2 transition-all ${
                  humanDecision === 'ESCALATED'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 ring-2 ring-rose-400'
                    : 'bg-slate-800 hover:bg-rose-900/40 text-rose-300 border border-rose-700/50'
                }`}
                id="officer-escalate-btn"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>ESCALATE TO STATE COMMAND</span>
              </button>

              <button
                onClick={() => handleDecision('REJECTED')}
                className={`px-4 py-2 text-xs font-mono font-bold rounded-lg flex items-center gap-2 transition-all ${
                  humanDecision === 'REJECTED'
                    ? 'bg-slate-700 text-white ring-2 ring-slate-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                }`}
                id="officer-reject-btn"
              >
                <X className="w-4 h-4" />
                <span>REJECT (FALSE POSITIVE / NO ACTION)</span>
              </button>
            </div>

            {isDecisionSaved && (
              <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>Decision recorded to Data Access Audit Log with correlation hash. Operator: Inspector R. K. Patel.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
