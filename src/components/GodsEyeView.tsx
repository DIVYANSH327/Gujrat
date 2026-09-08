import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Eye,
  Shield,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  MapPin,
  Camera as CameraIcon,
  Activity,
  Layers,
  ChevronRight,
  User,
  Car,
  HardHat,
  ExternalLink,
  ShieldAlert,
  Hash,
  Clock,
  Navigation,
  Radio,
  Info
} from 'lucide-react';
import {
  Camera,
  Alert,
  GodsEyeTargetRecord,
  GodsEyeTargetSighting,
  GodsEyeFilterOptions,
  HelmetStatus,
  EvidenceItem
} from '../types';
import { GodsEyeV2IntelligenceView } from './GodsEyeV2IntelligenceView';

interface GodsEyeViewProps {
  cameras: Camera[];
  alerts: Alert[];
  onOpenEvidenceModal?: (evidence: any) => void;
  onSelectCameraId?: (camId: string) => void;
  resetKey?: number;
}

export function GodsEyeView({
  cameras,
  alerts,
  onOpenEvidenceModal,
  onSelectCameraId,
  resetKey
}: GodsEyeViewProps) {
  // Mode: V2 (Vehicle Corridor & Forensic Chain) vs V1 (Multi-Modal Trajectory)
  const [intelligenceMode, setIntelligenceMode] = useState<'v2' | 'v1'>('v2');

  // Query & Target Selection
  const [selectedTarget, setSelectedTarget] = useState<string>('GJ01AB1234');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'vehicle' | 'person'>('all');
  const [targetRecord, setTargetRecord] = useState<GodsEyeTargetRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('GJ01AB1234');

  // Filters
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [helmetFilter, setHelmetFilter] = useState<string>('all');
  const [alertsOnlyFilter, setAlertsOnlyFilter] = useState<boolean>(false);
  const [minConfidenceFilter, setMinConfidenceFilter] = useState<number>(0.0);

  // Playback & Active Inspection
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedSighting, setSelectedSighting] = useState<GodsEyeTargetSighting | null>(null);
  const [inspectEvidence, setInspectEvidence] = useState<any | null>(null);
  const [dossierExportModal, setDossierExportModal] = useState<any | null>(null);

  // Auto-play timer
  const playbackTimerRef = useRef<any>(null);

  // Fetch God's Eye Target Intelligence from backend API
  const fetchGodsEyeTarget = async (targetId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/central/investigation/godseye?target=${encodeURIComponent(targetId)}&targetType=${targetTypeFilter}`);
      if (res.ok) {
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const data: GodsEyeTargetRecord = await res.json();
          if (data && Array.isArray(data.sightings)) {
            setTargetRecord(data);
            if (data.sightings.length > 0) {
              setSelectedSighting(data.sightings[0]);
              setPlaybackIndex(0);
            } else {
              setSelectedSighting(null);
            }
          }
        }
      }
    } catch {
      // Handled gracefully during network transition
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGodsEyeTarget(selectedTarget);
  }, [selectedTarget, targetTypeFilter]);

  // Handle client-side reset signal from demo controls
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      setIsPlaying(false);
      setSelectedTarget('GJ01AB1234');
      setSearchQuery('GJ01AB1234');
      setTargetTypeFilter('all');
      setDistrictFilter('all');
      setHelmetFilter('all');
      setAlertsOnlyFilter(false);
      setMinConfidenceFilter(0.0);
      setPlaybackIndex(0);
      setSelectedSighting(null);
      setInspectEvidence(null);
      setDossierExportModal(null);
      fetchGodsEyeTarget('GJ01AB1234');
    }
  }, [resetKey]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedTarget(searchQuery.trim().toUpperCase());
    }
  };

  // Quick Preset Scenarios
  const handleSelectScenario = (scenarioId: 'A' | 'B' | 'C') => {
    setIsPlaying(false);
    if (scenarioId === 'A') {
      setSearchQuery('GJ01AB1234');
      setSelectedTarget('GJ01AB1234');
    } else if (scenarioId === 'B') {
      setSearchQuery('GJ05XY6789');
      setSelectedTarget('GJ05XY6789');
    } else if (scenarioId === 'C') {
      setSearchQuery('P-DEMO-003');
      setSelectedTarget('P-DEMO-003');
    }
  };

  // Filtered sightings based on current user filters
  const filteredSightings = useMemo(() => {
    if (!targetRecord || !Array.isArray(targetRecord.sightings)) return [];
    return (targetRecord.sightings || []).filter(s => {
      const cam = (cameras || []).find(c => c.id === s.cameraId);
      if (districtFilter !== 'all' && cam && cam.district !== districtFilter) {
        return false;
      }
      if (helmetFilter !== 'all' && s.helmetStatus !== helmetFilter) {
        return false;
      }
      if (alertsOnlyFilter && !s.alertTriggered) {
        return false;
      }
      if (minConfidenceFilter > 0 && (s.confidence || 0) < minConfidenceFilter) {
        return false;
      }
      return true;
    });
  }, [targetRecord, districtFilter, helmetFilter, alertsOnlyFilter, minConfidenceFilter, cameras]);

  // Playback Loop
  useEffect(() => {
    if (isPlaying && filteredSightings.length > 0) {
      const intervalMs = Math.max(800, 2400 / playbackSpeed);
      playbackTimerRef.current = setInterval(() => {
        setPlaybackIndex(prev => {
          const next = prev + 1;
          if (next >= filteredSightings.length) {
            setIsPlaying(false);
            return 0;
          }
          setSelectedSighting(filteredSightings[next]);
          return next;
        });
      }, intervalMs);
    } else {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, filteredSightings, playbackSpeed]);

  // Playback Controls
  const togglePlay = () => {
    if (filteredSightings.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    if (filteredSightings.length === 0) return;
    setIsPlaying(false);
    const next = (playbackIndex + 1) % filteredSightings.length;
    setPlaybackIndex(next);
    setSelectedSighting(filteredSightings[next]);
  };

  const handleStepBackward = () => {
    if (filteredSightings.length === 0) return;
    setIsPlaying(false);
    const prev = (playbackIndex - 1 + filteredSightings.length) % filteredSightings.length;
    setPlaybackIndex(prev);
    setSelectedSighting(filteredSightings[prev]);
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setPlaybackIndex(0);
    if (filteredSightings.length > 0) {
      setSelectedSighting(filteredSightings[0]);
    }
  };

  // Trigger Immediate Forensic Evidence Capture
  const handleTriggerEvidenceCapture = async (sighting: GodsEyeTargetSighting) => {
    try {
      const res = await fetch('/api/central/evidence/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: sighting.eventId,
          cameraId: sighting.cameraId,
          targetId: targetRecord?.targetId || 'UNKNOWN',
          reason: sighting.alertTriggered ? 'WATCHLIST_MATCH' : (sighting.helmetStatus === 'NO_HELMET' ? 'HELMET_VIOLATION' : 'MANUAL_INVESTIGATION'),
          correlationId: sighting.correlationId,
          metadata: {
            timestamp: sighting.timestamp,
            latitude: sighting.latitude,
            longitude: sighting.longitude,
            edgeNodeId: sighting.edgeNodeId
          }
        })
      });
      if (res.ok) {
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const evidence = await res.json();
          setInspectEvidence(evidence);
        }
      }
    } catch {
      // Evidence capture handled gracefully
    }
  };

  // Compile and Export Full Target Dossier
  const handleExportTargetDossier = () => {
    if (!targetRecord) return;
    const dossier = {
      dossierId: `DOSSIER-GODSEYE-${Date.now()}`,
      agency: 'Gujarat Police State Surveillance Command & Control Network',
      classification: 'RESTRICTED / LAW ENFORCEMENT DEMO',
      primaryTarget: targetRecord.targetId,
      targetType: targetRecord.targetType,
      correlatedEntity: targetRecord.associatedTargetId || 'None',
      correlationConfidence: targetRecord.correlationConfidence ? `${Math.round(targetRecord.correlationConfidence * 100)}%` : 'N/A',
      watchlistStatus: targetRecord.watchlistStatus,
      totalSightings: targetRecord.totalSightings,
      camerasVisited: targetRecord.camerasVisited,
      edgeNodesVisited: targetRecord.edgeNodesVisited,
      districtsVisited: targetRecord.districtsVisited,
      durationMinutes: targetRecord.durationMinutes,
      helmetComplianceSummary: targetRecord.helmetSummary,
      cryptographicHashNotice: 'Evidence Integrity Hash — DEMO (Calculated via SHA-256 over canonical metadata)',
      sightings: targetRecord.sightings.map(s => ({
        eventId: s.eventId,
        timestamp: s.timestamp,
        cameraId: s.cameraId,
        cameraName: s.cameraName,
        edgeNodeId: s.edgeNodeId,
        helmetStatus: s.helmetStatus,
        alertTriggered: s.alertTriggered,
        evidenceDigest: `SHA256:${s.evidenceId}`
      }))
    };
    setDossierExportModal(dossier);
  };

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-zinc-100 overflow-hidden font-sans select-none">
      
      {/* 0. INTELLIGENCE PIPELINE ARCHITECTURE SWITCHER */}
      <div className="flex-none px-4 py-1.5 bg-zinc-950 border-b border-white/10 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 uppercase font-bold text-[10px]">God's Eye Engine:</span>
          <button
            onClick={() => setIntelligenceMode('v2')}
            id="btn-switch-godseye-v2"
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 border ${
              intelligenceMode === 'v2'
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white'
            }`}
          >
            <Radio size={13} className="text-blue-300" />
            <span>God's Eye V2 (Corridor Intelligence & Forensic Chain)</span>
          </button>
          <button
            onClick={() => setIntelligenceMode('v1')}
            id="btn-switch-godseye-v1"
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 border ${
              intelligenceMode === 'v1'
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white'
            }`}
          >
            <Layers size={13} className="text-purple-300" />
            <span>God's Eye V1 (Multi-Modal Trajectory)</span>
          </button>
        </div>
        <span className="text-[10px] text-zinc-400 hidden md:inline font-mono">
          GUJARAT POLICE STATE SURVEILLANCE COMMAND
        </span>
      </div>

      {intelligenceMode === 'v2' ? (
        <div className="flex-1 overflow-hidden">
          <GodsEyeV2IntelligenceView
            cameras={cameras}
            onOpenEvidenceModal={onOpenEvidenceModal}
            onSelectCameraId={onSelectCameraId}
          />
        </div>
      ) : (
        <>
          {/* 1. TOP HEADER & SCENARIO SELECTOR */}
          <div className="flex-none p-3.5 border-b border-white/10 bg-zinc-900/90 backdrop-blur-md flex flex-wrap justify-between items-center gap-3 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-lg text-blue-400 shadow-inner">
            <Eye size={20} className="animate-pulse text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-tight text-white uppercase font-mono">
                God's Eye View
              </h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-400/20 uppercase font-mono">
                V0.6 INTELLIGENCE
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-1.5 py-0.2 rounded border border-emerald-500/20">
                CROSS-CAMERA CORRELATION
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
              Unified Vehicle + Person Multi-Modal Trajectory Reconstruction
            </p>
          </div>
        </div>

        {/* Preset Scenarios Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-zinc-400 font-mono uppercase font-bold mr-1">
            Demo Scenarios:
          </span>
          <button
            onClick={() => handleSelectScenario('A')}
            id="btn-scenario-a"
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
              selectedTarget === 'GJ01AB1234'
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                : 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700'
            }`}
          >
            <Car size={13} className="text-blue-300" />
            <User size={13} className="text-purple-300" />
            <span>Scenario A (GJ01AB1234 + P-DEMO-001)</span>
          </button>

          <button
            onClick={() => handleSelectScenario('B')}
            id="btn-scenario-b"
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
              selectedTarget === 'GJ05XY6789'
                ? 'bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                : 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700'
            }`}
          >
            <ShieldAlert size={13} className="text-red-300" />
            <span>Scenario B (Watchlist GJ05XY6789)</span>
          </button>

          <button
            onClick={() => handleSelectScenario('C')}
            id="btn-scenario-c"
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
              selectedTarget === 'P-DEMO-003'
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700'
            }`}
          >
            <User size={13} className="text-purple-300" />
            <span>Scenario C (Pedestrian P-DEMO-003)</span>
          </button>
        </div>

        {/* Custom Target Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={13} />
            <input
              type="text"
              id="input-godseye-target"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Target Plate or Person ID..."
              className="pl-8 pr-3 py-1 bg-black/60 border border-white/10 rounded text-xs text-white font-mono uppercase focus:outline-none focus:border-blue-500 w-48"
            />
          </div>
          <button
            type="submit"
            id="btn-submit-godseye-search"
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded border border-blue-400/30 transition-colors"
          >
            Locate
          </button>
        </form>
      </div>

      {/* 2. FILTERS & STATUS STRIP */}
      <div className="flex-none bg-black/70 border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-500 uppercase flex items-center gap-1 font-bold">
            <Filter size={12} className="text-blue-400" /> Filters:
          </span>

          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            id="select-godseye-district"
            className="bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-zinc-300 text-[11px] focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Districts (50 Nodes)</option>
            <option value="Ahmedabad Central">Ahmedabad Central</option>
            <option value="SG Highway Corridor">SG Highway Corridor</option>
            <option value="Gandhinagar Capital">Gandhinagar Capital</option>
            <option value="Sabarmati Riverfront">Sabarmati Riverfront</option>
            <option value="Sanand Industrial">Sanand Industrial</option>
          </select>

          {/* Helmet Compliance Filter */}
          <select
            value={helmetFilter}
            onChange={e => setHelmetFilter(e.target.value)}
            id="select-godseye-helmet"
            className="bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-zinc-300 text-[11px] focus:outline-none focus:border-blue-500"
          >
            <option value="all">Helmet: All Statuses</option>
            <option value="HELMET">Helmet: Compliant (HELMET)</option>
            <option value="NO_HELMET">Helmet: Violation (NO_HELMET)</option>
            <option value="UNKNOWN">Helmet: Unknown / Non-Rider</option>
          </select>

          {/* Alerts Only Toggle */}
          <button
            onClick={() => setAlertsOnlyFilter(!alertsOnlyFilter)}
            id="btn-filter-alerts-only"
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
              alertsOnlyFilter
                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
            }`}
          >
            {alertsOnlyFilter ? '⚠️ Alerts Only: ACTIVE' : 'Alerts Only'}
          </button>

          {/* Confidence Slider/Selector */}
          <select
            value={minConfidenceFilter.toString()}
            onChange={e => setMinConfidenceFilter(parseFloat(e.target.value))}
            id="select-godseye-confidence"
            className="bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-zinc-300 text-[11px] focus:outline-none focus:border-blue-500"
          >
            <option value="0">Min Confidence: Any</option>
            <option value="0.80">Min Confidence: ≥ 80%</option>
            <option value="0.90">Min Confidence: ≥ 90%</option>
            <option value="0.95">Min Confidence: ≥ 95%</option>
          </select>
        </div>

        {/* Active Target Quick Summary Badge */}
        {targetRecord && (
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-[11px]">
              Active Target: <strong className="text-blue-400">{targetRecord.targetId}</strong>
            </span>
            {targetRecord.associatedTargetId && (
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 text-[10px]">
                Correlated: {targetRecord.associatedTargetId} ({Math.round((targetRecord.correlationConfidence || 0.87) * 100)}%)
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${
              targetRecord.watchlistStatus.includes('WATCHLIST')
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {targetRecord.watchlistStatus}
            </span>
          </div>
        )}
      </div>

      {/* 3. MAIN WORKSPACE: MAP + DOSSIER + TIMELINE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT / CENTER: UNIFIED GOD'S EYE MAP CANVAS */}
        <div className="flex-1 relative overflow-hidden bg-[#04060a] flex flex-col">
          
          {/* Background Geo-grid Pattern */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)', 
              backgroundSize: '36px 36px' 
            }} 
          />

          {/* SVG Map Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <svg className="w-full h-full absolute inset-0 cursor-crosshair" id="svg-godseye-canvas">
              <defs>
                <linearGradient id="godseyeRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>

                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
                </marker>
              </defs>

              {/* District Boundary Guide Boxes */}
              <g opacity="0.08" stroke="#ffffff" strokeDasharray="4 4" fill="none">
                <rect x="50" y="50" width="400" height="280" />
                <rect x="500" y="50" width="380" height="280" />
                <rect x="50" y="360" width="400" height="280" />
                <rect x="500" y="360" width="380" height="280" />
              </g>

              {/* Trajectory Polyline Vector with Direction Arrows */}
              {filteredSightings.length > 1 && (
                <g>
                  <path 
                    d={`M ${filteredSightings.map((s) => `${s.mapX || 100} ${s.mapY || 100}`).join(' L ')}`}
                    fill="none"
                    stroke="url(#godseyeRouteGrad)"
                    strokeWidth="4"
                    strokeDasharray="8 6"
                    className="animate-[dash_12s_linear_infinite]"
                  />
                  {/* Arrowhead markers along vector segments */}
                  {filteredSightings.slice(1).map((s, idx) => {
                    const prev = filteredSightings[idx];
                    const midX = ((prev.mapX || 100) + (s.mapX || 100)) / 2;
                    const midY = ((prev.mapY || 100) + (s.mapY || 100)) / 2;
                    return (
                      <g key={`arrow-${idx}`} transform={`translate(${midX}, ${midY})`}>
                        <circle r="4" fill="#38bdf8" opacity="0.7" />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Inactive Camera Fleet Nodes (dim background nodes) */}
              {cameras.map((cam) => {
                const isSighted = filteredSightings.some(s => s.cameraId === cam.id);
                if (isSighted) return null; // Rendered separately with full styling
                return (
                  <g 
                    key={cam.id} 
                    transform={`translate(${cam.mapX || 0}, ${cam.mapY || 0})`}
                    opacity="0.3"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => onSelectCameraId && onSelectCameraId(cam.id)}
                  >
                    <circle r="3.5" fill="#475569" />
                  </g>
                );
              })}

              {/* Active Target Sightings along Trajectory */}
              {filteredSightings.map((sighting, idx) => {
                const isSelected = selectedSighting?.sightingId === sighting.sightingId;
                const isCurrentPlayback = playbackIndex === idx;
                const isVehicle = sighting.plate !== undefined;
                const isPerson = sighting.personTrackId !== undefined;
                const isCorrelated = isVehicle && isPerson;
                const hasAlert = sighting.alertTriggered;
                const isNoHelmet = sighting.helmetStatus === 'NO_HELMET';

                const markerColor = hasAlert 
                  ? '#ef4444' 
                  : (isNoHelmet ? '#f59e0b' : (isCorrelated ? '#3b82f6' : (isPerson ? '#a855f7' : '#06b6d4')));

                return (
                  <g
                    key={sighting.sightingId}
                    transform={`translate(${sighting.mapX || 100}, ${sighting.mapY || 100})`}
                    onClick={() => {
                      setSelectedSighting(sighting);
                      setPlaybackIndex(idx);
                      setIsPlaying(false);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring for alerts or active playback */}
                    {(hasAlert || isCurrentPlayback || isSelected) && (
                      <circle
                        r="20"
                        fill={markerColor}
                        opacity="0.25"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer Target Node Ring */}
                    <circle
                      r={isSelected ? "14" : "11"}
                      fill="#0f172a"
                      stroke={markerColor}
                      strokeWidth={isSelected ? "3" : "2"}
                      className="transition-all"
                    />

                    {/* Inner Node Color Fill */}
                    <circle
                      r="6"
                      fill={markerColor}
                    />

                    {/* Sequence Badge Label (1, 2, 3...) */}
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {idx + 1}
                    </text>

                    {/* Camera Name & Time Tag Hover Pill */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <rect
                        x="-60"
                        y="-42"
                        width="120"
                        height="24"
                        rx="4"
                        fill="#090d16"
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-26"
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {sighting.cameraId} • {new Date(sighting.timestamp).toLocaleTimeString()}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Map Overlay HUD Overlay Information */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-white/10 p-2.5 rounded-lg text-[11px] font-mono pointer-events-none space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                <span className="text-zinc-300">Vehicle Sightings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                <span className="text-zinc-300">Person Tracks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                <span className="text-zinc-300">Helmet Violations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                <span className="text-zinc-300">High-Priority Alerts</span>
              </div>
            </div>

            {/* Playback Progress Indicator */}
            {filteredSightings.length > 0 && (
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
                <span className="text-zinc-400">Sightings Traversed:</span>
                <span className="text-blue-400 font-bold">
                  {playbackIndex + 1} / {filteredSightings.length}
                </span>
              </div>
            )}
          </div>

          {/* TIMELINE & PLAYBACK CONTROLS STRIP */}
          <div className="flex-none bg-zinc-900/90 border-t border-white/10 p-3 flex flex-col gap-2 z-10">
            <div className="flex items-center justify-between gap-4">
              
              {/* Play / Step Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  id="btn-godseye-play"
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold font-mono uppercase transition-colors ${
                    isPlaying 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isPlaying ? 'Pause' : 'Play Trajectory'}</span>
                </button>

                <button
                  onClick={handleStepBackward}
                  id="btn-godseye-step-back"
                  className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-mono uppercase border border-white/10"
                  title="Previous Sighting"
                >
                  ◀ Prev
                </button>

                <button
                  onClick={handleStepForward}
                  id="btn-godseye-step-fwd"
                  className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-mono uppercase border border-white/10"
                  title="Next Sighting"
                >
                  Next ▶
                </button>

                <button
                  onClick={handleResetPlayback}
                  id="btn-godseye-reset"
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded border border-white/10"
                  title="Rewind to start"
                >
                  <RotateCcw size={14} />
                </button>

                {/* Speed Controls */}
                <div className="flex items-center ml-2 border border-white/10 rounded overflow-hidden">
                  {[1, 2, 5].map(spd => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrubber Info */}
              <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-3">
                {selectedSighting && (
                  <>
                    <span>Node: <strong className="text-white">{selectedSighting.cameraId}</strong></span>
                    <span>Time: <strong className="text-zinc-200">{new Date(selectedSighting.timestamp).toLocaleTimeString()}</strong></span>
                    <span>Helmet: <strong className={selectedSighting.helmetStatus === 'HELMET' ? 'text-emerald-400' : (selectedSighting.helmetStatus === 'NO_HELMET' ? 'text-amber-400' : 'text-zinc-400')}>{selectedSighting.helmetStatus}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Horizontal Sightings Scrubber Cards */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs font-mono scrollbar-thin">
              {filteredSightings.map((s, idx) => {
                const isSelected = selectedSighting?.sightingId === s.sightingId;
                const isPlayback = playbackIndex === idx;

                return (
                  <div
                    key={s.sightingId}
                    onClick={() => {
                      setSelectedSighting(s);
                      setPlaybackIndex(idx);
                      setIsPlaying(false);
                    }}
                    className={`flex-none p-2 rounded-lg border cursor-pointer transition-all w-48 ${
                      isSelected || isPlayback
                        ? 'bg-blue-950/40 border-blue-400/80 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                        : 'bg-black/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                      <span className="font-bold text-white">#{idx + 1} {s.cameraId}</span>
                      <span className="text-[9px]">{new Date(s.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[11px] text-zinc-200 truncate flex items-center gap-1">
                      {s.plate ? <Car size={11} className="text-blue-400" /> : <User size={11} className="text-purple-400" />}
                      <span>{s.plate || s.personTrackId}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[9px]">
                      <span className={`px-1 py-0.2 rounded font-bold ${
                        s.helmetStatus === 'HELMET' ? 'bg-emerald-500/20 text-emerald-400' :
                        (s.helmetStatus === 'NO_HELMET' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500')
                      }`}>
                        {s.helmetStatus}
                      </span>
                      {s.alertTriggered && (
                        <span className="text-red-400 font-bold flex items-center gap-0.5">
                          <AlertTriangle size={9} /> ALERT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: TARGET DOSSIER & FORENSIC EVIDENCE INSPECTOR */}
        <div className="w-96 flex-none bg-zinc-950 border-l border-white/10 flex flex-col overflow-hidden">
          
          {/* Dossier Header */}
          <div className="p-3.5 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                Target Dossier
              </h3>
            </div>
            <button
              onClick={handleExportTargetDossier}
              id="btn-export-godseye-dossier"
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[10px] font-mono font-bold uppercase border border-white/10 flex items-center gap-1 transition-colors"
            >
              <Download size={11} /> Export
            </button>
          </div>

          {/* Dossier Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
            
            {targetRecord ? (
              <>
                {/* Target Identity Summary Box */}
                <div className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase">Primary Target</div>
                      <div className="text-lg font-bold text-white tracking-wide">
                        {targetRecord.targetId}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      targetRecord.watchlistStatus.includes('WATCHLIST')
                        ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {targetRecord.watchlistStatus}
                    </span>
                  </div>

                  {/* Correlated Associated Entity */}
                  {targetRecord.associatedTargetId && (
                    <div className="bg-purple-950/30 border border-purple-500/30 p-2.5 rounded-lg">
                      <div className="text-[10px] text-purple-300 font-bold uppercase flex items-center gap-1">
                        <User size={12} /> Cross-Modal Association
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {targetRecord.associatedTargetId}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Correlation Confidence: <strong className="text-purple-300">{Math.round((targetRecord.correlationConfidence || 0.87) * 100)}%</strong>
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-1 italic">
                        Synthetic spatiotemporal correlation (no facial recognition).
                      </div>
                    </div>
                  )}

                  {/* Traversal Summary Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-zinc-500 text-[9px] uppercase">Sightings</div>
                      <div className="text-white font-bold">{targetRecord.totalSightings} Verified</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-zinc-500 text-[9px] uppercase">Cameras Visited</div>
                      <div className="text-white font-bold">{targetRecord.camerasVisited} Nodes</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-zinc-500 text-[9px] uppercase">Duration</div>
                      <div className="text-white font-bold">{targetRecord.durationMinutes} mins</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-zinc-500 text-[9px] uppercase">Districts</div>
                      <div className="text-white font-bold">{targetRecord.districtsVisited} Corridors</div>
                    </div>
                  </div>
                </div>

                {/* Helmet Compliance Breakdown Box */}
                <div className="bg-zinc-900/60 border border-white/10 p-3.5 rounded-xl space-y-2">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                    <HardHat size={13} className="text-amber-400" /> Helmet Compliance Evaluation
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 bg-emerald-950/30 border border-emerald-500/20 p-2 rounded text-center">
                      <div className="text-[9px] text-emerald-400 font-bold uppercase">Compliant</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {targetRecord.helmetSummary.helmetCount}
                      </div>
                    </div>
                    <div className="flex-1 bg-red-950/30 border border-red-500/20 p-2 rounded text-center">
                      <div className="text-[9px] text-red-400 font-bold uppercase">Violations</div>
                      <div className="text-base font-bold text-red-400 mt-0.5">
                        {targetRecord.helmetSummary.noHelmetCount}
                      </div>
                    </div>
                    <div className="flex-1 bg-zinc-900 border border-white/5 p-2 rounded text-center">
                      <div className="text-[9px] text-zinc-500 font-bold uppercase">Unknown</div>
                      <div className="text-base font-bold text-zinc-400 mt-0.5">
                        {targetRecord.helmetSummary.unknownCount}
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] text-zinc-500 italic mt-1">
                    Simulated edge neural inference model (94% accuracy).
                  </div>
                </div>

                {/* Selected Sighting Forensic Inspector */}
                {selectedSighting ? (
                  <div className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1">
                        <MapPin size={12} /> Sighting #{playbackIndex + 1}
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(selectedSighting.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Camera Node:</span>
                        <span className="text-white font-bold">{selectedSighting.cameraId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Edge Gateway:</span>
                        <span className="text-zinc-300">{selectedSighting.edgeNodeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Heading:</span>
                        <span className="text-zinc-300">{selectedSighting.direction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Helmet Status:</span>
                        <span className={`font-bold ${
                          selectedSighting.helmetStatus === 'HELMET' ? 'text-emerald-400' :
                          (selectedSighting.helmetStatus === 'NO_HELMET' ? 'text-amber-400' : 'text-zinc-400')
                        }`}>
                          {selectedSighting.helmetStatus} ({Math.round(selectedSighting.helmetConfidence * 100)}%)
                        </span>
                      </div>
                      {selectedSighting.alertTriggered && (
                        <div className="bg-red-950/40 border border-red-500/30 p-2 rounded text-[10px] text-red-300 mt-2">
                          <AlertTriangle size={11} className="inline mr-1 text-red-400" />
                          {selectedSighting.alertDescription || 'Security Rule Violation Alert Dispatched'}
                        </div>
                      )}
                    </div>

                    {/* Snapshot Frame Thumbnail */}
                    <div className="relative rounded-lg overflow-hidden border border-white/10 mt-2 group">
                      <img 
                        src={selectedSighting.snapshotUrl} 
                        alt="Surveillance Snapshot" 
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-2 flex flex-col justify-between">
                        <div className="flex justify-between items-center text-[9px] text-zinc-300">
                          <span className="bg-black/60 px-1 rounded">{selectedSighting.cameraId}</span>
                          <span className="bg-blue-600/80 text-white px-1.5 py-0.2 rounded font-bold">
                            CONF: {Math.round(selectedSighting.confidence * 100)}%
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-300 font-bold">
                          {selectedSighting.plate || selectedSighting.personTrackId}
                        </div>
                      </div>
                    </div>

                    {/* Trigger Forensic Evidence Capture Button */}
                    <button
                      onClick={() => handleTriggerEvidenceCapture(selectedSighting)}
                      id="btn-capture-evidence-now"
                      className="w-full py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Hash size={12} /> Inspect Forensic SHA-256 Digest
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-xs italic">
                    Select a sighting node on the map to inspect forensic metadata.
                  </div>
                )}

                {/* Cryptographic Integrity Notice Card */}
                <div className="bg-black/50 border border-white/10 p-3 rounded-xl space-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase">
                    <Shield size={12} className="text-blue-400" /> Forensic Integrity Standard
                  </div>
                  <div className="text-zinc-500 leading-relaxed">
                    All records certified under <strong>SIMULATED DEMO EVIDENCE</strong>. SHA-256 digests computed canonically over event payloads.
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No target selected. Use the presets above or search a plate or track ID.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. MODAL: FORENSIC EVIDENCE RECORD INSPECTOR */}
      {inspectEvidence && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase">
                  Forensic Evidence Item
                </h3>
              </div>
              <button
                onClick={() => setInspectEvidence(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold uppercase"
              >
                ✕ Close
              </button>
            </div>

            {/* Simulated Demo Notice Banner */}
            <div className="p-2.5 bg-blue-950/40 border border-blue-500/40 rounded-lg text-xs text-blue-300">
              <strong className="block font-bold uppercase">{inspectEvidence.label}</strong>
              <span className="text-[11px] text-zinc-400">{inspectEvidence.integrityNotice}</span>
            </div>

            {/* Evidence Image Preview */}
            <div className="relative rounded-lg overflow-hidden border border-white/10">
              <img
                src={inspectEvidence.imageReference}
                alt="Evidence Snapshot"
                className="w-full h-44 object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white">
                {inspectEvidence.cameraId} • {inspectEvidence.captureReason}
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Evidence ID:</span>
                <span className="text-white font-bold">{inspectEvidence.evidenceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Target ID:</span>
                <span className="text-blue-400 font-bold">{inspectEvidence.targetId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Timestamp:</span>
                <span className="text-zinc-200">{inspectEvidence.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Reason:</span>
                <span className="text-amber-400 font-bold">{inspectEvidence.captureReason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Verification Status:</span>
                <span className="text-emerald-400 font-bold">{inspectEvidence.status}</span>
              </div>

              {/* SHA-256 Digest */}
              <div className="pt-2">
                <span className="text-[10px] text-zinc-400 uppercase block mb-1">
                  Deterministic SHA-256 Digest:
                </span>
                <div className="p-2 bg-black/60 rounded border border-white/10 text-[10px] text-emerald-400 break-all select-all">
                  {inspectEvidence.sha256}
                </div>
              </div>
            </div>

            <button
              onClick={() => setInspectEvidence(null)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold uppercase transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL: FULL INVESTIGATION DOSSIER EXPORT PREVIEW */}
      {dossierExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 font-mono max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-none">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase">
                  Investigation Dossier Export
                </h3>
              </div>
              <button
                onClick={() => setDossierExportModal(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold uppercase"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 bg-black/60 border border-white/10 rounded-lg text-xs text-zinc-300">
              <pre className="whitespace-pre-wrap select-all font-mono text-[11px] leading-relaxed">
                {JSON.stringify(dossierExportModal, null, 2)}
              </pre>
            </div>

            <div className="flex-none flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(dossierExportModal, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${dossierExportModal.dossierId}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
              >
                <Download size={13} /> Download JSON
              </button>
              <button
                onClick={() => setDossierExportModal(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold uppercase transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
}
