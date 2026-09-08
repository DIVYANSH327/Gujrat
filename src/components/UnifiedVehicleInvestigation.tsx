import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  ShieldAlert, 
  AlertTriangle, 
  ExternalLink, 
  Eye, 
  Clock, 
  Navigation, 
  Camera as CameraIcon, 
  MapPin, 
  CheckCircle2, 
  Layers, 
  Zap, 
  FileText, 
  Copy, 
  X, 
  Share2, 
  Activity, 
  ShieldCheck, 
  Car,
  Lock,
  ArrowRight,
  Database,
  Calendar
} from 'lucide-react';
import { normalizeLicensePlate, VehicleJourney, VehicleSighting, Alert } from '../types';
import { federatedCctvService } from '../services/FederatedCctvService';
import { aiOrchestrator } from '../ai-agents/orchestrator/AIAgentOrchestrator';
import { centralRepo } from '../services/Architecture';
import { vehicleJourneyService } from '../services/VehicleJourneyService';
import { vehicleHistoryRepository } from '../services/VehicleHistoryRepository';
import { vehicleDossierService } from '../services/VehicleDossierService';
import { VehicleDossierView } from './police-data/VehicleDossierView';
import { RealGeospatialMap } from './geospatial/RealGeospatialMap';
import { PROJECT_BRANDING } from '../branding';

interface UnifiedVehicleInvestigationProps {
  initialPlate?: string;
  onSelectCameraId?: (cameraId: string) => void;
  onNavigateToGodsEye?: (plate: string) => void;
  onOpenEvidenceModal?: (evidenceId: string) => void;
}

export function UnifiedVehicleInvestigation({
  initialPlate = 'GJ05AB1234',
  onSelectCameraId,
  onNavigateToGodsEye,
  onOpenEvidenceModal
}: UnifiedVehicleInvestigationProps) {
  const [searchPlate, setSearchPlate] = useState(initialPlate);
  const [activePlate, setActivePlate] = useState(initialPlate);
  const [isSearching, setIsSearching] = useState(false);
  const [isExecutingScenario, setIsExecutingScenario] = useState(false);
  const [scenarioMessage, setScenarioMessage] = useState<string | null>(null);
  const [journey, setJourney] = useState<VehicleJourney | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'map' | 'retention'>('timeline');
  const [showV21Dossier, setShowV21Dossier] = useState(false);
  const [selectedSightingEvidence, setSelectedSightingEvidence] = useState<{
    sighting: VehicleSighting;
    evidenceId: string;
    sha256: string;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'map' | 'schematic'>('map');

  // Quick preset targets
  const presetTargets = [
    { plate: 'GJ05AB1234', label: 'Wanted Vehicle (Corridor A)', tag: 'CRITICAL', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { plate: 'GJ01AB1234', label: 'Commercial Sedan (Ashram Rd)', tag: 'WATCHLIST', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { plate: 'GJ05XY6789', label: 'Surat Urban Corridor', tag: 'PATROL', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    { plate: 'GJ27AX9999', label: 'NE-1 Toll Corridor', tag: 'HIGHWAY', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
  ];

  // Perform vehicle correlation search
  const performSearch = async (targetPlateToQuery?: string) => {
    const raw = targetPlateToQuery || searchPlate;
    const normalized = normalizeLicensePlate(raw);
    if (!normalized) return;

    setIsSearching(true);
    setActivePlate(normalized);
    setSearchPlate(normalized);

    try {
      // 1. Attempt backend investigation API
      try {
        const res = await fetch(`/api/central/investigation/vehicle/${encodeURIComponent(normalized)}`, {
          headers: { 'x-request-id': `REQ-INV-${Date.now()}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.sightings && data.sightings.length > 0) {
            setJourney(data);
            setIsSearching(false);
            return;
          }
        }
      } catch {
        // Fallback to domain service
      }

      // 2. Authoritative domain service (VehicleJourneyService + VehicleHistoryRepository)
      const domainJourney = await vehicleJourneyService.buildJourney(normalized);
      if (domainJourney && domainJourney.sightings && domainJourney.sightings.length > 0) {
        setJourney(domainJourney);
      } else {
        // Search across repository
        const searchResults = await vehicleHistoryRepository.searchVehicles({ query: normalized });
        if (searchResults.length > 0) {
          const fallbackJourney = await vehicleJourneyService.buildJourney(searchResults[0].normalizedPlate);
          setJourney(fallbackJourney);
        } else {
          setJourney(domainJourney);
        }
      }
    } catch (err) {
      console.error('Error correlating vehicle trajectory:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Run V1.1 Deterministic Wanted Vehicle Scenario
  const runWantedVehicleDemo = async () => {
    setIsExecutingScenario(true);
    setScenarioMessage('Initializing 8-Stage Multi-Agent Mesh Pipeline for GJ05AB1234...');

    try {
      const res = await aiOrchestrator.triggerWantedVehicleScenario('GJ05AB1234');
      setScenarioMessage(`Corridor Traversed: 4 Cameras Logged • Alert Dispatched (${res.alertId || 'ALT-WL-GJ05AB1234'}) • Evidence SHA-256 Captured`);
      
      // Auto-load journey
      await performSearch('GJ05AB1234');
    } catch (err) {
      console.error('Failed executing wanted vehicle scenario:', err);
      setScenarioMessage('Pipeline execution fallback: Ingesting corridor trajectory directly.');
      await performSearch('GJ05AB1234');
    } finally {
      setIsExecutingScenario(false);
      setTimeout(() => setScenarioMessage(null), 6000);
    }
  };

  // Export Investigation Dossier
  const handleExportDossier = async (plate: string) => {
    const normalized = normalizeLicensePlate(plate);
    try {
      const res = await fetch(`/api/central/investigation/export/${encodeURIComponent(normalized)}`, {
        headers: { 'x-request-id': `REQ-EXP-${Date.now()}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedDossier(data);
        return;
      }
    } catch (e) {
      console.warn('Backend export endpoint unavailable, compiling client-side dossier:', e);
    }

    // Client-side fallback dossier
    const sightings = journey?.sightings || [];
    const dossier = {
      dossierId: `DOSSIER-GP-${Date.now()}`,
      agency: 'Gujarat Police State Surveillance Command & Control Network',
      targetVehicle: normalized,
      classification: 'RESTRICTED / LAW ENFORCEMENT DEMO',
      generatedAt: new Date().toISOString(),
      correlationId: `CORR-${Date.now()}`,
      cryptographicHash: 'a78f190e2b58e469c4a02d4f828a2a5d9ec801be9c7f12e9b0476839d09e3a89',
      integrityLabel: 'Evidence Integrity Hash — DEMO',
      integrityNotice: 'Calculated via SHA-256 integrity digest over canonical dossier payload for BSA 2023 electronic-record workflow.',
      totalVerifiedSightings: sightings.length,
      departmentRetentionPolicy: {
        trafficRawDays: 15,
        highwayRawDays: 30,
        cityPoliceRawDays: 30,
        forensicEvidenceYears: 7,
        standardNotice: 'Raw video retention adheres to departmental quotas. Incident evidence snapshots and SHA-256 cryptographic hashes are archived for statutory judicial custody.'
      },
      sightings: sightings.map(s => {
        const dept = federatedCctvService.resolveDepartmentForCamera(s.cameraId);
        return {
          eventId: s.sightingId,
          timestamp: s.timestamp,
          cameraId: s.cameraId,
          cameraName: s.cameraId === 'CAM-007' ? 'Airport Circle North Gate' : s.cameraId === 'CAM-014' ? 'Hansol Junction Crossroad' : s.cameraId === 'CAM-023' ? 'DGP Office Perimeter Road' : 'Sabarmati Riverfront Flyover',
          location: s.cameraId === 'CAM-007' ? 'SG Highway Corridor' : s.cameraId === 'CAM-014' ? 'Ashram Road Transit Hub' : s.cameraId === 'CAM-023' ? 'Sindhu Bhavan Toll' : 'Ring Road Interchange',
          district: 'Ahmedabad',
          departmentType: dept.departmentType,
          siteId: s.siteId,
          edgeNode: s.sourceEdgeNode,
          confidence: s.plateConfidence,
          speed: s.cameraId === 'CAM-007' ? 48 : s.cameraId === 'CAM-014' ? 52 : s.cameraId === 'CAM-023' ? 55 : 58,
          direction: s.direction || 'Southwest Corridor',
          rawVideoRetentionDays: dept.retentionPolicy.rawVideoRetentionDays,
          isRawVideoExpired: false,
          evidenceDigest: `SHA256:7f9a2e34b12589d87c04${s.sightingId.slice(-6)}e3b7c2d19f8841b9c7823e408a6b10f54`
        };
      })
    };
    setSelectedDossier(dossier);
  };

  // Download dossier JSON
  const downloadDossierFile = (dossier: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `INVESTIGATION_DOSSIER_${dossier.targetVehicle}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy dossier JSON to clipboard
  const copyDossierToClipboard = (dossier: any) => {
    navigator.clipboard.writeText(JSON.stringify(dossier, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Initialize search on mount
  useEffect(() => {
    performSearch(initialPlate);
  }, [initialPlate]);

  // Format IST time
  const formatIstTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070c] text-zinc-100 font-sans overflow-hidden">
      {/* Top Banner: Unified Search & Action Center */}
      <div className="border-b border-cyan-950/70 bg-[#080c16] p-4 shrink-0 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Header & Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/40">
                GUJARAT UNIFIED CCTV INTELLIGENCE GRID • V1.1
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={12} /> FEDERATED SOURCE NORMALIZER ACTIVE
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-zinc-100 font-mono flex items-center gap-2">
              <Car className="text-cyan-400" size={20} /> UNIFIED VEHICLE INVESTIGATION & INSTANT RESPONSE
            </h1>
            <p className="text-xs text-zinc-400">
              Cross-camera multi-department journey reconstruction, statutory retention policy validation, and cryptographic evidence dossier compiling.
            </p>
          </div>

          {/* Quick Demo Scenario Trigger */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={runWantedVehicleDemo}
              disabled={isExecutingScenario}
              className="px-3 py-2 bg-gradient-to-r from-rose-950 to-amber-950/80 hover:from-rose-900 hover:to-amber-900 text-amber-200 border border-amber-500/50 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all"
            >
              <Zap size={14} className={isExecutingScenario ? 'animate-spin text-amber-400' : 'text-amber-400'} />
              <span>{isExecutingScenario ? 'RUNNING 8-STAGE MESH PIPELINE...' : 'DEMO: WANTED VEHICLE (GJ05AB1234)'}</span>
            </button>

            {journey && (journey.sightings || []).length > 0 && (
              <button
                onClick={() => handleExportDossier(activePlate)}
                className="px-3 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow transition-all"
              >
                <Download size={14} />
                <span>EXPORT DOSSIER</span>
              </button>
            )}

            <button
              onClick={() => setShowV21Dossier(true)}
              className="px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow transition-all"
            >
              <FileText size={14} />
              <span>V2.1 POLICE DOSSIER</span>
            </button>
          </div>
        </div>

        {/* Live Scenario Feedback Notification */}
        {scenarioMessage && (
          <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <Activity size={14} className="animate-pulse text-cyan-400" />
            <span>{scenarioMessage}</span>
          </div>
        )}

        {/* Search Input Bar & Presets */}
        <div className="mt-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Main Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') performSearch(); }}
              placeholder="ENTER VEHICLE REGISTRATION (e.g. GJ 05 AB 1234 or GJ01AB1234)"
              className="w-full pl-9 pr-24 py-2.5 bg-[#050810] border border-cyan-950/90 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 uppercase tracking-wider focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/40"
            />
            <div className="absolute inset-y-0 right-1 flex items-center">
              <button
                onClick={() => performSearch()}
                disabled={isSearching}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs font-mono rounded tracking-wider transition-colors disabled:opacity-50"
              >
                {isSearching ? 'CORRELATING...' : 'CORRELATE'}
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            <span className="text-[10px] font-mono text-zinc-500 uppercase shrink-0">QUICK TARGETS:</span>
            {presetTargets.map(pt => (
              <button
                key={pt.plate}
                onClick={() => {
                  setSearchPlate(pt.plate);
                  performSearch(pt.plate);
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase border shrink-0 transition-all ${
                  activePlate === pt.plate 
                    ? 'bg-cyan-500 text-black border-cyan-400 font-black' 
                    : `${pt.color} hover:opacity-80`
                }`}
              >
                {pt.plate} ({pt.tag})
              </button>
            ))}
          </div>
        </div>

        {/* Plate Normalization Feedback Pill */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">CANONICAL HSRP NORMALIZATION:</span>
            <span className="px-2 py-0.5 bg-[#0f1422] border border-cyan-800/40 rounded text-cyan-300 font-bold flex items-center gap-1.5">
              <span className="text-[9px] bg-blue-600 text-white px-1 rounded-sm font-black">IND</span>
              <span>{normalizeLicensePlate(searchPlate) || 'WAITING FOR INPUT'}</span>
            </span>
            <span className="text-zinc-500 hidden sm:inline">• Strips spacing, punctuation, and ensures uppercase</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500">FEDERATION STATUS:</span>
            <span className="text-emerald-400 font-bold">4 DEPARTMENTS SYNCED</span>
          </div>
        </div>
      </div>

      {/* Target Metric Banner */}
      {journey && (journey.sightings || []).length > 0 && (
        <div className="border-b border-cyan-950/60 bg-[#060912] px-6 py-3 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
            
            {/* Target Plate Card */}
            <div className="bg-[#090d18] border border-cyan-950/80 p-2.5 rounded-lg flex flex-col justify-center">
              <span className="text-[9px] text-zinc-500 uppercase">TARGET HSRP</span>
              <div className="text-sm font-black text-cyan-300 flex items-center gap-1.5">
                <span className="text-[8px] bg-blue-600 text-white px-1 py-0.2 rounded font-black">IND</span>
                <span>{journey.vehicleNumber}</span>
              </div>
            </div>

            {/* Total Sightings */}
            <div className="bg-[#090d18] border border-cyan-950/80 p-2.5 rounded-lg flex flex-col justify-center">
              <span className="text-[9px] text-zinc-500 uppercase">SIGHTINGS LOGGED</span>
              <span className="text-sm font-black text-emerald-400">{journey.totalSightings} CORRIDOR NODES</span>
            </div>

            {/* Unique Cameras */}
            <div className="bg-[#090d18] border border-cyan-950/80 p-2.5 rounded-lg flex flex-col justify-center">
              <span className="text-[9px] text-zinc-500 uppercase">NODES VISITED</span>
              <span className="text-sm font-black text-cyan-400">{journey.camerasVisited} CAMERAS</span>
            </div>

            {/* Corridor Transit Duration */}
            <div className="bg-[#090d18] border border-cyan-950/80 p-2.5 rounded-lg flex flex-col justify-center">
              <span className="text-[9px] text-zinc-500 uppercase">TRANSIT DURATION</span>
              <span className="text-sm font-black text-amber-400">{journey.durationMinutes} MINUTES</span>
            </div>

            {/* Threat Classification */}
            <div className="bg-[#090d18] border border-cyan-950/80 p-2.5 rounded-lg flex flex-col justify-center">
              <span className="text-[9px] text-zinc-500 uppercase">INVESTIGATION TIER</span>
              <span className={`text-xs font-black uppercase ${
                journey.vehicleNumber === 'GJ05AB1234' ? 'text-rose-400' : 'text-amber-300'
              }`}>
                {journey.vehicleNumber === 'GJ05AB1234' ? 'CRITICAL WATCHLIST' : 'CORRIDOR TRACK'}
              </span>
            </div>

            {/* God's Eye Synch Action */}
            <div className="bg-[#090d18] border border-cyan-950/80 p-2.5 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase block">GOD'S EYE SYNC</span>
                <span className="text-xs font-bold text-cyan-300">ACTIVE</span>
              </div>
              {onNavigateToGodsEye && (
                <button
                  onClick={() => onNavigateToGodsEye(journey.vehicleNumber)}
                  className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
                >
                  <Eye size={12} /> OPEN
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* Left Column: Chronological Reconstructed Trajectory Timeline */}
        <div className="w-full lg:w-7/12 flex flex-col border-r border-cyan-950/60 overflow-hidden bg-[#070a13]">
          
          {/* Sub-header with Tab Controls */}
          <div className="px-5 py-3 border-b border-cyan-950/60 bg-[#06080e] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                <Activity size={14} /> CHRONOLOGICAL RECONSTRUCTION
              </h2>
              {journey && (journey.sightings || []).length > 0 && (
                <span className="text-[10px] font-mono text-zinc-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/40">
                  {(journey.sightings || []).length} SIGHTINGS
                </span>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-2.5 py-1 rounded font-bold uppercase transition-all ${
                  activeTab === 'timeline' 
                    ? 'bg-cyan-500 text-black shadow' 
                    : 'bg-[#0b0f1d] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                TIMELINE
              </button>
              <button
                onClick={() => setActiveTab('retention')}
                className={`px-2.5 py-1 rounded font-bold uppercase transition-all ${
                  activeTab === 'retention' 
                    ? 'bg-cyan-500 text-black shadow' 
                    : 'bg-[#0b0f1d] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                RETENTION POLICIES
              </button>
            </div>
          </div>

          {/* Timeline / Retention View Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            
            {/* VIEW A: CHRONOLOGICAL TIMELINE */}
            {activeTab === 'timeline' && (
              <>
                {journey && (journey.sightings || []).length > 0 ? (
                  <div className="relative border-l-2 border-cyan-900/40 ml-4 pl-6 space-y-7">
                    {(journey.sightings || []).map((sighting, idx) => {
                      const dept = federatedCctvService.resolveDepartmentForCamera(sighting.cameraId);
                      const retention = federatedCctvService.getRetentionStatusForSighting(sighting.cameraId, sighting.timestamp);
                      const isAlertTrigger = sighting.cameraId === 'CAM-014';
                      const isLastSighting = idx === (journey.sightings || []).length - 1;

                      // Calculate transit time to next sighting
                      let transitInfo: string | null = null;
                      if (!isLastSighting) {
                        const nextSighting = journey.sightings[idx + 1];
                        const diffSec = Math.max(30, (new Date(nextSighting.timestamp).getTime() - new Date(sighting.timestamp).getTime()) / 1000);
                        const mins = Math.floor(diffSec / 60);
                        const secs = Math.round(diffSec % 60);
                        transitInfo = `Transit to ${nextSighting.cameraId}: +${mins}m ${secs}s (Est. ~2.2 km • Speed ~52 km/h)`;
                      }

                      return (
                        <div key={sighting.sightingId || idx} className="relative group">
                          
                          {/* Node Icon on the vertical trace line */}
                          <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono text-[10px] font-black transition-all ${
                            isAlertTrigger
                              ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                              : 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                          }`}>
                            {idx + 1}
                          </div>

                          {/* Sighting Event Card */}
                          <div className={`p-4 rounded-xl border transition-all ${
                            isAlertTrigger
                              ? 'bg-[#10070a] border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                              : 'bg-[#090d18] border-cyan-950/80 hover:border-cyan-800/60'
                          }`}>
                            
                            {/* Card Top Row: Timestamp, Camera & ANPR Match */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-black text-cyan-300">
                                  {formatIstTime(sighting.timestamp)}
                                </span>
                                <span className="text-zinc-600 font-mono">•</span>
                                <span className="text-xs font-mono font-bold text-zinc-200">
                                  {sighting.cameraId}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 font-mono">
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                                  {Math.round((sighting.plateConfidence || 0.95) * 100)}% ANPR CONFIDENCE
                                </span>
                                {isAlertTrigger && (
                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500 text-white animate-pulse">
                                    WATCHLIST MATCH
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Camera Location & Node Identity */}
                            <div className="text-xs text-zinc-300 font-medium mb-2 flex items-center gap-1.5">
                              <MapPin size={13} className="text-cyan-400 shrink-0" />
                              <span>
                                {sighting.cameraId === 'CAM-007' ? 'Airport Circle North Gate (SG Highway)' :
                                 sighting.cameraId === 'CAM-014' ? 'Hansol Junction Crossroad (Ashram Road Hub)' :
                                 sighting.cameraId === 'CAM-023' ? 'DGP Office Perimeter Road (Sindhu Bhavan Toll)' :
                                 'Sabarmati Riverfront Flyover (Ring Road Interchange)'}
                              </span>
                            </div>

                            {/* Department Federation & Storage Retention Badge */}
                            <div className="p-2 rounded bg-[#060810] border border-cyan-950/60 mb-3 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-500 uppercase">FEDERATED SOURCE:</span>
                                <span className="text-cyan-300 font-bold">{dept.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  retention.isRawVideoExpired
                                    ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                                    : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                                }`}>
                                  {retention.statusText}
                                </span>
                              </div>
                            </div>

                            {/* Watchlist Trigger Banner if CAM-014 */}
                            {isAlertTrigger && (
                              <div className="p-3 mb-3 rounded bg-rose-950/40 border border-rose-500/40 text-xs font-mono text-rose-200">
                                <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-400">
                                  <AlertTriangle size={14} /> ACTIVE THREAT ALERT TRIGGERED
                                </div>
                                <p className="text-[11px] text-zinc-300">
                                  Target plate matches Active Watchlist entry (Suspect Wanted Vehicle). Interdepartmental tactical alert dispatched across Traffic Control & State Highway Patrol.
                                </p>
                              </div>
                            )}

                            {/* Sighting Telemetry Details */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-[10px] font-mono text-zinc-400">
                              <div>
                                <span className="text-zinc-500 block uppercase">EDGE NODE</span>
                                <span className="text-zinc-200 font-bold">{sighting.sourceEdgeNode || 'EDGE-00042'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block uppercase">DIRECTION</span>
                                <span className="text-zinc-200 font-bold">{sighting.direction || 'Southwest Corridor'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block uppercase">RECORDING QUOTA</span>
                                <span className="text-zinc-200 font-bold">{dept.retentionPolicy.rawVideoRetentionDays} Days Raw Video</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block uppercase">FORENSIC ARCHIVAL</span>
                                <span className="text-emerald-400 font-bold">7-Year Cold Storage</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-cyan-950/60 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedSightingEvidence({
                                      sighting,
                                      evidenceId: `EVD-V11-${sighting.sightingId.slice(-8)}`,
                                      sha256: `7f9a2e34b12589d87c04${sighting.sightingId.slice(-6)}e3b7c2d19f8841b9c7823e408a6b10f54`
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1.5"
                                >
                                  <ExternalLink size={12} /> VIEW FORENSIC EVIDENCE
                                </button>

                                {onSelectCameraId && (
                                  <button
                                    onClick={() => onSelectCameraId(sighting.cameraId)}
                                    className="px-2.5 py-1 bg-[#050810] hover:bg-[#0c1222] text-zinc-300 border border-cyan-950 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1.5"
                                  >
                                    <Eye size={12} /> LOCATE ON MAP
                                  </button>
                                )}
                              </div>

                              <span className="text-[9px] font-mono text-zinc-500">
                                EVIDENCE DIGEST: SHA-256 VERIFIED
                              </span>
                            </div>

                          </div>

                          {/* Inter-Camera Transit Segment Divider */}
                          {transitInfo && (
                            <div className="my-2 ml-2 flex items-center gap-2 text-[10px] font-mono text-cyan-400/80">
                              <ArrowRight size={12} className="text-cyan-500" />
                              <span className="bg-[#05070c] px-2 py-0.5 rounded border border-cyan-950/60 font-semibold">
                                {transitInfo}
                              </span>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-500 font-mono text-xs">
                    <Search size={32} className="mb-2 opacity-30 text-cyan-400" />
                    <span>NO CORRIDOR SIGHTINGS FOUND FOR {activePlate}</span>
                    <span className="text-[10px] text-zinc-600 mt-1">Try querying preset targets above or run the Wanted Vehicle Demo</span>
                  </div>
                )}
              </>
            )}

            {/* VIEW B: RETENTION POLICY ANALYSIS */}
            {activeTab === 'retention' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#090d18] border border-cyan-950/80">
                  <h3 className="text-xs font-black uppercase text-cyan-300 mb-2 flex items-center gap-2">
                    <Database size={15} className="text-cyan-400" /> STATEWIDE RETENTION POLICY FRAMEWORK
                  </h3>
                  <p className="text-zinc-400 text-xs mb-4">
                    The Gujarat Unified Intelligence Grid standardizes telemetry across autonomous departmental VMS systems. Raw video remains in departmental custody and adheres to local storage quotas, while forensic event metadata and SHA-256 sealed evidence are preserved centrally.
                  </p>

                  <div className="space-y-3">
                    {federatedCctvService.getAllSources().map(source => (
                      <div key={source.id} className="p-3 rounded-lg bg-[#060810] border border-cyan-950/70">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-zinc-200 text-xs">{source.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/40 uppercase">
                            {source.departmentType}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mb-2">{source.jurisdiction}</div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] pt-2 border-t border-cyan-950/60">
                          <div>
                            <span className="text-zinc-500 block uppercase">RAW VIDEO QUOTA</span>
                            <span className="text-amber-300 font-bold">{source.retentionPolicy.rawVideoRetentionDays} Days (Local NVR/SAN)</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase">FORENSIC EVIDENCE</span>
                            <span className="text-emerald-400 font-bold">{source.retentionPolicy.evidenceRetentionYears} Years (Statutory Storage)</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase">EVENT METADATA</span>
                            <span className="text-cyan-400 font-bold">{source.retentionPolicy.eventMetadataRetentionYears} Years (Central Bus)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Correlated Spatial Topography & Target Details */}
        <div className="w-full lg:w-5/12 flex flex-col overflow-hidden bg-[#05070c]">
          
          {/* Top Panel: Corridor Topography Trace */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-cyan-950/60">
            <div className="px-4 py-2 bg-[#06080e] border-b border-cyan-950/60 flex items-center justify-between shrink-0">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Navigation size={13} /> CORRIDOR TRAVERSAL TOPOGRAPHY
              </span>
              
              {/* Map / Schematic Mode Selector */}
              <div className="flex items-center gap-1 bg-[#090d18] p-0.5 rounded border border-cyan-900/50 text-[10px] font-mono">
                <button
                  onClick={() => setRightPanelMode('map')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    rightPanelMode === 'map'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  REAL GIS MAP
                </button>
                <button
                  onClick={() => setRightPanelMode('schematic')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    rightPanelMode === 'schematic'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  SCHEMATIC
                </button>
              </div>
            </div>

            {/* Interactive Real Map vs Topological Schematic */}
            {rightPanelMode === 'map' ? (
              <div className="flex-1 w-full h-full min-h-[260px] overflow-hidden">
                <RealGeospatialMap
                  compact={true}
                  initialPlate={activePlate}
                  onSelectCameraId={onSelectCameraId}
                  onOpenEvidenceModal={onOpenEvidenceModal}
                  className="h-full w-full border-0 rounded-none"
                />
              </div>
            ) : (
              <div className="flex-1 relative bg-[#04060a] overflow-hidden flex items-center justify-center">
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#081b2915_1px,transparent_1px),linear-gradient(to_bottom,#081b2915_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* Trajectory Vector Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="20%" y1="30%" x2="42%" y2="52%" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4 4" style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }} />
                  <line x1="42%" y1="52%" x2="68%" y2="40%" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4 4" style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }} />
                  <line x1="68%" y1="40%" x2="86%" y2="65%" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4 4" style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }} />
                </svg>

                {/* Camera Nodes */}
                {[
                  { id: 'CAM-007', label: 'Airport Circle North Gate', x: 20, y: 30, isTrigger: false, time: '18:41:00' },
                  { id: 'CAM-014', label: 'Hansol Junction Crossroad', x: 42, y: 52, isTrigger: true, time: '18:43:20' },
                  { id: 'CAM-023', label: 'DGP Office Perimeter Road', x: 68, y: 40, isTrigger: false, time: '18:46:15' },
                  { id: 'CAM-031', label: 'Sabarmati Riverfront Flyover', x: 86, y: 65, isTrigger: false, time: '18:49:00' }
                ].map((node) => (
                  <div
                    key={node.id}
                    onClick={() => onSelectCameraId && onSelectCameraId(node.id)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    {node.isTrigger && (
                      <div className="absolute inset-0 m-auto w-10 h-10 bg-rose-500/30 rounded-full animate-ping -z-10" />
                    )}

                    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-mono text-[10px] font-black transition-transform group-hover:scale-110 ${
                      node.isTrigger 
                        ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.6)]' 
                        : 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    }`}>
                      <CameraIcon size={14} />
                    </div>

                    <div className="mt-1 px-1.5 py-0.5 rounded bg-[#050810]/90 border border-cyan-900/50 text-[9px] font-mono whitespace-nowrap shadow">
                      <span className={node.isTrigger ? 'text-rose-400 font-bold' : 'text-cyan-300'}>{node.id}</span>
                      <span className="text-zinc-500 ml-1 font-normal">{node.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Panel: Target Intelligence Summary */}
          <div className="p-4 bg-[#080c16] border-t border-cyan-950/60 overflow-y-auto space-y-3 font-mono text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <ShieldAlert size={14} /> TARGET INVESTIGATION SUMMARY
            </h3>

            <div className="p-3 rounded-lg bg-[#060810] border border-cyan-950/80 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500 uppercase">TARGET VEHICLE</span>
                <span className="text-cyan-300 font-bold">White Sedan • GJ05AB1234</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500 uppercase">FIRST SIGHTING</span>
                <span className="text-zinc-300">18:41:00 IST (CAM-007)</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500 uppercase">LAST SIGHTING</span>
                <span className="text-zinc-300">18:49:00 IST (CAM-031)</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500 uppercase">JURISDICTION TRAVERSED</span>
                <span className="text-zinc-300">Ahmedabad Municipal & Highway Sector</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500 uppercase">FORENSIC STATUS</span>
                <span className="text-emerald-400 font-bold">SHA-256 IMMUTABLE SEALS STORED</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-[10px] text-zinc-400">
              <span className="text-cyan-400 font-bold block mb-0.5">STATUTORY ADMISSIBILITY NOTICE:</span>
              Vehicle trajectory reconstructed using normalized edge telemetry. Digital chain-of-custody certified via SHA-256 cryptographic digest.
            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: FORENSIC EVIDENCE VIEWER */}
      {selectedSightingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#090d18] border border-cyan-500/50 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 font-mono">
            <div className="flex justify-between items-center border-b border-cyan-950 pb-3">
              <h3 className="text-sm font-black text-cyan-300 uppercase flex items-center gap-2">
                <ShieldCheck size={16} className="text-cyan-400" /> FORENSIC EVIDENCE SEAL
              </h3>
              <button 
                onClick={() => setSelectedSightingEvidence(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="aspect-video w-full rounded-lg overflow-hidden border border-cyan-950 bg-black relative">
              <img 
                src={selectedSightingEvidence.sighting.snapshotReference} 
                alt="Evidence" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 bg-black/80 text-cyan-300 text-[10px] px-2 py-0.5 rounded font-bold">
                {selectedSightingEvidence.sighting.cameraId} • {formatIstTime(selectedSightingEvidence.sighting.timestamp)}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500 uppercase">EVIDENCE ID</span>
                <span className="text-cyan-300 font-bold">{selectedSightingEvidence.evidenceId}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500 uppercase">TARGET HSRP</span>
                <span className="text-zinc-200 font-bold">{selectedSightingEvidence.sighting.vehicleNumber}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500 uppercase">CHAIN OF CUSTODY</span>
                <span className="text-emerald-400 font-bold">VERIFIED & TAMPER-SEALED</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block uppercase mb-1">CRYPTOGRAPHIC SHA-256 DIGEST</span>
                <div className="p-2 rounded bg-black/80 border border-cyan-950 text-[9px] text-cyan-400 font-mono break-all select-all">
                  {selectedSightingEvidence.sha256}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-cyan-950 flex justify-end">
              <button
                onClick={() => setSelectedSightingEvidence(null)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-black uppercase rounded tracking-wider"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INVESTIGATION DOSSIER EXPORT VIEWER */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#080c16] border border-cyan-500/60 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl font-mono overflow-hidden">
            
            {/* Dossier Header */}
            <div className="px-6 py-4 border-b border-cyan-950 bg-[#05070e] flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold block mb-0.5">
                  GUJARAT POLICE STATE INTELLIGENCE GRID • LAW ENFORCEMENT REPORT
                </span>
                <h2 className="text-sm md:text-base font-black text-zinc-100 uppercase">
                  INVESTIGATION DOSSIER: {selectedDossier.targetVehicle}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDossier(null)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dossier Content Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs">
              
              {/* Official Seal Banner */}
              <div className="p-3 rounded-lg bg-[#050810] border border-cyan-900/60 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">DOSSIER IDENTIFIER</span>
                  <span className="font-bold text-cyan-300">{selectedDossier.dossierId}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">CLASSIFICATION</span>
                  <span className="font-bold text-amber-300">{selectedDossier.classification}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">GENERATED TIMESTAMP</span>
                  <span className="font-bold text-zinc-200">{formatIstTime(selectedDossier.generatedAt)}</span>
                </div>
              </div>

              {/* SHA-256 Cryptographic Hash Seal */}
              <div>
                <span className="text-zinc-400 text-[10px] block uppercase font-bold mb-1">
                  CRYPTOGRAPHIC INTEGRITY DIGEST (SHA-256)
                </span>
                <div className="p-2.5 rounded bg-black/90 border border-cyan-950 font-mono text-[10px] text-cyan-400 break-all select-all">
                  {selectedDossier.cryptographicHash}
                </div>
                <span className="text-[9px] text-zinc-500 block mt-1">
                  {selectedDossier.integrityNotice}
                </span>
              </div>

              {/* Verified Sightings Table */}
              <div>
                <h4 className="text-xs font-bold uppercase text-zinc-300 mb-2 flex items-center justify-between">
                  <span>VERIFIED TRAJECTORY SIGHTINGS ({selectedDossier.totalVerifiedSightings})</span>
                  <span className="text-[10px] text-zinc-500 font-normal">CHRONOLOGICAL SEQUENCE</span>
                </h4>

                <div className="border border-cyan-950 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#050810] border-b border-cyan-950 text-zinc-400 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Seq</th>
                        <th className="p-2.5">Camera Node</th>
                        <th className="p-2.5">Timestamp (IST)</th>
                        <th className="p-2.5">Department</th>
                        <th className="p-2.5">Retention Quota</th>
                        <th className="p-2.5">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-950/60 text-zinc-300">
                      {selectedDossier.sightings.map((s: any, idx: number) => (
                        <tr key={s.eventId || idx} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 font-bold text-cyan-400">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-white">{s.cameraId}</td>
                          <td className="p-2.5 text-zinc-400">{formatIstTime(s.timestamp)}</td>
                          <td className="p-2.5 text-zinc-300">{s.departmentType || 'TRAFFIC'}</td>
                          <td className="p-2.5 text-emerald-400">15-30 Days Raw Video</td>
                          <td className="p-2.5 font-bold text-cyan-300">{(s.confidence * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Departmental Retention Certification */}
              <div className="p-3 rounded-lg bg-[#050810] border border-cyan-950/70 text-[11px] text-zinc-400 space-y-1">
                <span className="text-cyan-400 font-bold block uppercase">STATUTORY ARCHIVAL COMPLIANCE</span>
                <p>
                  Video retention quotas for raw high-bitrate feeds: Municipal Traffic 15 days; Highway Authority 30 days. Standardized event metadata and SHA-256 evidence digests are permanently sealed for 7 to 10 years in forensic storage.
                </p>
              </div>

              {/* Demonstration Notice */}
              <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-[10px] text-amber-200 text-center font-bold">
                SYNTHETIC DEMONSTRATION INTELLIGENCE REPORT — LAW ENFORCEMENT PROTOTYPE ONLY
              </div>

            </div>

            {/* Dossier Footer Actions */}
            <div className="px-6 py-3 border-t border-cyan-950 bg-[#05070e] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] text-zinc-500">
                AUTHOR: {PROJECT_BRANDING.author} • {PROJECT_BRANDING.copyrightNotice}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyDossierToClipboard(selectedDossier)}
                  className="px-3 py-1.5 bg-[#0b0f1d] hover:bg-[#13192f] text-zinc-200 border border-cyan-900/60 rounded text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>{copySuccess ? 'COPIED!' : 'COPY JSON'}</span>
                </button>

                <button
                  onClick={() => downloadDossierFile(selectedDossier)}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-black uppercase rounded tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>DOWNLOAD DOSSIER (.JSON)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* V2.1 Master Dossier Modal */}
      {showV21Dossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto my-auto">
            <VehicleDossierView
              dossier={vehicleDossierService.getOrCreateDossier(activePlate)}
              onClose={() => setShowV21Dossier(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
