import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Crosshair, 
  UserCheck, 
  Search, 
  Eye, 
  Video, 
  Car, 
  Activity, 
  Play, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  X, 
  MapPin, 
  Clock, 
  Camera, 
  Cpu, 
  Layers, 
  Radio, 
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  Sparkles,
  ScanFace,
  Navigation
} from 'lucide-react';
import { missionControlService } from '../services/MissionControlService';
import { incidentCommandService } from '../services/IncidentCommandService';
import { predictiveCameraHandoffService } from '../services/PredictiveCameraHandoffService';
import { humanReviewQueueService } from '../services/HumanReviewQueueService';
import { systemHealthService, StatewideHealthSnapshot } from '../services/SystemHealthService';
import { sysEvents } from '../services/Architecture';
import { Mission, IncidentRecord, PredictiveHandoffPoint, MissionType } from '../types';
import { mockAlerts, mockCameras } from '../mockData';
import { RealGeospatialMap } from './geospatial/RealGeospatialMap';

interface CommandCenterViewProps {
  onNavigate: (viewId: string) => void;
  onSelectMission?: (missionId: string) => void;
  onSelectIncident?: (incidentId: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({ 
  onNavigate, 
  onSelectMission, 
  onSelectIncident 
}) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [handoffs, setHandoffs] = useState<PredictiveHandoffPoint[]>([]);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(3);
  const [health, setHealth] = useState<StatewideHealthSnapshot | null>(null);

  // Modals state
  const [isAlertDetailOpen, setIsAlertDetailOpen] = useState(false);
  const [isQuickTrackOpen, setIsQuickTrackOpen] = useState(false);
  const [isFindLastSeenOpen, setIsFindLastSeenOpen] = useState(false);
  const [isTechHealthOpen, setIsTechHealthOpen] = useState(false);

  // Quick inputs
  const [trackPlate, setTrackPlate] = useState('GJ01AB1234');
  const [trackCorridor, setTrackCorridor] = useState('SG Highway Corridor');
  const [lastSeenQuery, setLastSeenQuery] = useState('GJ01AB1234');
  const [lastSeenResult, setLastSeenResult] = useState<{
    plate: string;
    camera: string;
    location: string;
    timestamp: string;
    confidence: number;
    direction: string;
  } | null>({
    plate: 'GJ01AB1234',
    camera: 'CAM-014',
    location: 'Ashram Road Transit Hub / SG Highway Junction',
    timestamp: '2 min ago (10:05 IST)',
    confidence: 94.8,
    direction: 'Northbound towards Gandhinagar'
  });

  const refreshState = () => {
    setMissions(missionControlService.listMissions());
    setIncidents(incidentCommandService.listIncidents());
    setHandoffs(predictiveCameraHandoffService.getAllActiveHandoffs());
    setPendingReviewsCount(humanReviewQueueService.getPendingCount() || 3);
    setHealth(systemHealthService.getSnapshot());
  };

  useEffect(() => {
    refreshState();
    const timer = setInterval(refreshState, 3000);

    const unsub1 = sysEvents.on('MISSION_UPDATED', refreshState);
    const unsub2 = sysEvents.on('INCIDENT_UPDATED', refreshState);
    const unsub3 = sysEvents.on('HANDOFF_UPDATED', refreshState);
    const unsub4 = sysEvents.on('REVIEW_ENQUEUED', refreshState);
    const unsub5 = sysEvents.on('REVIEW_RESOLVED', refreshState);

    return () => {
      clearInterval(timer);
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, []);

  const handleLaunchTrackMission = (targetPlate: string) => {
    const mission = missionControlService.createMission({
      missionType: 'TRACK_VEHICLE',
      objective: `Autonomous corridor tracking for vehicle [${targetPlate.toUpperCase()}]`,
      requestedBy: 'Command Center Officer',
      priority: 'P0_CRITICAL',
      targetPlate: targetPlate.trim().toUpperCase()
    });
    refreshState();
    setIsQuickTrackOpen(false);
    if (onSelectMission) {
      onSelectMission(mission.missionId);
    } else {
      onNavigate('missions');
    }
  };

  const handleSearchLastSeen = () => {
    if (!lastSeenQuery.trim()) return;
    setLastSeenResult({
      plate: lastSeenQuery.trim().toUpperCase(),
      camera: 'CAM-014',
      location: 'Ashram Road Transit Hub / SG Highway Junction',
      timestamp: 'Just now (10:05 IST)',
      confidence: 94.8,
      direction: 'Northbound towards Gandhinagar'
    });
  };

  // Top Active Alert
  const primaryAlert = mockAlerts[0] || {
    id: 'alt-01',
    type: 'watchlist',
    severity: 'critical',
    cameraId: 'CAM-014',
    timestamp: '2 min ago',
    description: 'Watchlist Vehicle GJ01AB1234 matched on CAM-014 (SG Highway).'
  };

  // Top Active Mission
  const primaryMission = missions[0] || {
    missionId: 'MSN-9021',
    missionType: 'TRACK_VEHICLE',
    objective: 'Track target vehicle GJ01AB1234 along SG Highway Corridor',
    status: 'RUNNING',
    priority: 'P0_CRITICAL',
    targetPlate: 'GJ01AB1234',
    steps: [
      { stepId: 's1', description: 'Corridor camera lock', status: 'COMPLETED' },
      { stepId: 's2', description: 'License plate verification', status: 'COMPLETED' },
      { stepId: 's3', description: 'Predictive handoff calculation', status: 'COMPLETED' },
      { stepId: 's4', description: 'Camera correlation', status: 'IN_PROGRESS' },
      { stepId: 's5', description: 'Dispatch interception packet', status: 'PENDING' }
    ]
  };

  const missionCompletedSteps = primaryMission.steps.filter(s => s.status === 'COMPLETED').length;
  const missionProgressPct = 80; // Standard 80% as requested

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto w-full space-y-5 text-zinc-100">
      
      {/* 1. TOP HEADER / TITLE (Clean & Authoritative) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-950/40 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
              GUJARAT POLICE • STATE HEADQUARTERS
            </span>
            <span className="text-zinc-600 text-[10px]">•</span>
            <span className="text-[10px] font-mono text-zinc-400">AHMEDABAD COMMISSIONERATE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
            <span>OPERATIONAL AI COMMAND CENTER</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time autonomous sighting correlation, predictive tracking, and supervised police action gates.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d121f] border border-emerald-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold tracking-wider text-xs font-mono">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      {/* 2. TOP PRIORITY AREA (ONLY 3 SIMPLE CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: ACTIVE ALERTS */}
        <div 
          onClick={() => onNavigate('alerts')}
          className="bg-[#0b0f19] border border-rose-500/40 hover:border-rose-500 rounded-xl p-4 sm:p-5 cursor-pointer transition-all shadow-lg hover:shadow-rose-950/30 relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-rose-400 uppercase">
                  ACTIVE ALERTS
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-rose-400 tracking-tight my-1">
                1
              </div>
              <p className="text-xs text-zinc-400 font-medium">Immediate action needed</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-rose-950/60 flex items-center justify-between text-[11px] font-mono text-rose-300">
            <span>Watchlist Hit (GJ01AB1234)</span>
            <span className="flex items-center gap-1 text-rose-400 group-hover:translate-x-0.5 transition-transform">
              Review <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* Card 2: ACTIVE MISSIONS */}
        <div 
          onClick={() => onNavigate('missions')}
          className="bg-[#0b0f19] border border-cyan-500/40 hover:border-cyan-400 rounded-xl p-4 sm:p-5 cursor-pointer transition-all shadow-lg hover:shadow-cyan-950/30 relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                  ACTIVE MISSIONS
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-300 tracking-tight my-1">
                1
              </div>
              <p className="text-xs text-zinc-400 font-medium">Tracking in progress</p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 group-hover:scale-105 transition-transform">
              <Crosshair className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-cyan-950/60 flex items-center justify-between text-[11px] font-mono text-cyan-300">
            <span>Corridor handoff at 80%</span>
            <span className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-0.5 transition-transform">
              Open <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* Card 3: REVIEW REQUIRED */}
        <div 
          onClick={() => onNavigate('review_queue')}
          className="bg-[#0b0f19] border border-amber-500/40 hover:border-amber-400 rounded-xl p-4 sm:p-5 cursor-pointer transition-all shadow-lg hover:shadow-amber-950/30 relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-amber-300 uppercase">
                  REVIEW REQUIRED
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-tight my-1">
                {pendingReviewsCount}
              </div>
              <p className="text-xs text-zinc-400 font-medium">Officer action needed</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-950/60 flex items-center justify-between text-[11px] font-mono text-amber-300">
            <span>Human verification gate</span>
            <span className="flex items-center gap-1 text-amber-400 group-hover:translate-x-0.5 transition-transform">
              Verify <ChevronRight size={12} />
            </span>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY ACTIONS: "WHAT DO YOU WANT TO DO?" */}
      <div className="bg-[#090d16] border border-cyan-950/60 rounded-xl p-4 sm:p-5 shadow">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-200 font-mono">
            WHAT DO YOU WANT TO DO?
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* Action 1: TRACK VEHICLE */}
          <button
            onClick={() => setIsQuickTrackOpen(true)}
            className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-lg bg-[#0e1422] hover:bg-[#141e33] border border-cyan-900/40 hover:border-cyan-500/60 transition min-h-[58px] cursor-pointer group"
          >
            <div className="flex items-center space-x-2 mb-1 text-cyan-400 group-hover:scale-110 transition-transform">
              <Car size={18} />
              <span className="text-xs font-bold font-mono tracking-wider text-white">TRACK VEHICLE</span>
            </div>
            <span className="text-[10px] text-zinc-400">Launch autonomous pursuit</span>
          </button>

          {/* Action 2: FACE WATCHLIST (BSA 2023) */}
          <button
            onClick={() => onNavigate('watchlist')}
            id="btn-quick-action-face"
            className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-lg bg-[#0e1422] hover:bg-[#141e33] border border-amber-900/40 hover:border-amber-500/60 transition min-h-[58px] cursor-pointer group"
          >
            <div className="flex items-center space-x-2 mb-1 text-amber-400 group-hover:scale-110 transition-transform">
              <ScanFace size={18} />
              <span className="text-xs font-bold font-mono tracking-wider text-white">FACE WATCHLIST</span>
            </div>
            <span className="text-[10px] text-zinc-400">BSA 2023 Biometrics</span>
          </button>

          {/* Action 3: FIND LAST SEEN */}
          <button
            onClick={() => setIsFindLastSeenOpen(true)}
            className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-lg bg-[#0e1422] hover:bg-[#141e33] border border-cyan-900/40 hover:border-cyan-500/60 transition min-h-[58px] cursor-pointer group"
          >
            <div className="flex items-center space-x-2 mb-1 text-cyan-400 group-hover:scale-110 transition-transform">
              <Search size={18} />
              <span className="text-xs font-bold font-mono tracking-wider text-white">FIND LAST SEEN</span>
            </div>
            <span className="text-[10px] text-zinc-400">Locate camera sighting</span>
          </button>

          {/* Action 4: INVESTIGATE INCIDENT */}
          <button
            onClick={() => onNavigate('incidents')}
            className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-lg bg-[#0e1422] hover:bg-[#141e33] border border-cyan-900/40 hover:border-cyan-500/60 transition min-h-[58px] cursor-pointer group"
          >
            <div className="flex items-center space-x-2 mb-1 text-rose-400 group-hover:scale-110 transition-transform">
              <AlertOctagon size={18} />
              <span className="text-xs font-bold font-mono tracking-wider text-white">INVESTIGATE</span>
            </div>
            <span className="text-[10px] text-zinc-400">Open incident command</span>
          </button>

          {/* Action 5: CHECK CAMERA */}
          <button
            onClick={() => onNavigate('cameras')}
            className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-lg bg-[#0e1422] hover:bg-[#141e33] border border-cyan-900/40 hover:border-cyan-500/60 transition min-h-[58px] cursor-pointer group"
          >
            <div className="flex items-center space-x-2 mb-1 text-indigo-400 group-hover:scale-110 transition-transform">
              <Video size={18} />
              <span className="text-xs font-bold font-mono tracking-wider text-white">CHECK CAMERA</span>
            </div>
            <span className="text-[10px] text-zinc-400">Live 50-feed CCTV matrix</span>
          </button>

          {/* Action 6: REVIEW ALERT */}
          <button
            onClick={() => onNavigate('review_queue')}
            className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-lg bg-[#0e1422] hover:bg-[#141e33] border border-amber-900/40 hover:border-amber-500/60 transition min-h-[58px] cursor-pointer group"
          >
            <div className="flex items-center space-x-2 mb-1 text-amber-400 group-hover:scale-110 transition-transform">
              <UserCheck size={18} />
              <span className="text-xs font-bold font-mono tracking-wider text-white">REVIEW ALERT</span>
            </div>
            <span className="text-[10px] text-zinc-400">Items awaiting sign-off</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN OPERATIONAL CARDS (DESKTOP: BALANCED 2-COL; MOBILE: NATURAL STACKING) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN (lg:col-span-7) -> Alerts, Mission, Vehicle Journey */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* CARD A: ACTIVE ALERTS (Prominent & Clear) */}
          <div className="bg-[#0b0f19] border border-rose-900/40 rounded-xl p-4 sm:p-5 shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  ACTIVE ALERTS
                </h2>
              </div>
              <button 
                onClick={() => onNavigate('alerts')}
                className="text-xs text-rose-400 hover:text-rose-300 font-mono flex items-center space-x-1"
              >
                <span>All Alerts</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Alert Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-[#0f1422] border border-rose-500/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      🔴 HIGH PRIORITY
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      WATCHLIST VEHICLE DETECTED
                    </span>
                  </div>

                  {/* Prominent Vehicle Plate Box */}
                  <div className="inline-flex items-center space-x-2 my-2 px-3 py-1.5 bg-[#05070c] border-2 border-yellow-400/80 rounded-lg text-yellow-300 font-mono font-black text-lg tracking-widest shadow-inner">
                    <span>IND</span>
                    <span className="text-white">GJ01AB1234</span>
                  </div>

                  <p className="text-xs text-zinc-300 font-medium">
                    White SUV • SG Highway • CAM-014 • 2 min ago
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Flagged under Watchlist: Stolen Vehicle FIR #2024/GJ-0912
                  </p>
                </div>

                <div className="hidden sm:block shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=160&h=100" 
                    alt="Vehicle Snapshot"
                    className="w-24 h-16 rounded-lg object-cover border border-rose-500/30"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-rose-950/60 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAlertDetailOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg font-mono flex items-center space-x-1.5 transition cursor-pointer min-h-[44px]"
                >
                  <Eye size={15} />
                  <span>VIEW DETAILS</span>
                </button>
                <button
                  onClick={() => handleLaunchTrackMission('GJ01AB1234')}
                  className="px-4 py-2 bg-[#141b2d] hover:bg-[#1a233b] border border-cyan-500/50 text-cyan-300 hover:text-white text-xs font-bold rounded-lg font-mono flex items-center space-x-1.5 transition cursor-pointer min-h-[44px]"
                >
                  <Crosshair size={15} />
                  <span>TRACK NOW</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD B: ACTIVE MISSION */}
          <div className="bg-[#0b0f19] border border-cyan-950/60 rounded-xl p-4 sm:p-5 shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  ACTIVE MISSION
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                TRACKING IN PROGRESS
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#090d16] border border-cyan-900/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-zinc-400 uppercase font-mono">Mission: TRACKING VEHICLE</div>
                  <div className="text-base font-bold text-white font-mono flex items-center space-x-2">
                    <span className="text-cyan-300 font-mono">GJ01AB1234</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-zinc-300 font-sans font-normal">SG Highway Corridor</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black font-mono text-cyan-400">{missionProgressPct}%</span>
                  <span className="text-xs text-zinc-400 block -mt-1 font-mono">Step 4 of 5</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${missionProgressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono pt-1">
                  <span>Current Step: <strong className="text-white">Camera correlation</strong></span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Corridor Locked
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-cyan-950/60 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Autonomous predictive handoff active</span>
                <button
                  onClick={() => {
                    if (onSelectMission) onSelectMission(primaryMission.missionId);
                    else onNavigate('missions');
                  }}
                  className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-lg font-mono flex items-center space-x-1 transition cursor-pointer min-h-[36px]"
                >
                  <span>VIEW MISSION</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* CARD C: LIVE OPERATIONS MAP & CORRIDOR JOURNEY */}
          <div className="bg-[#0b0f19] border border-cyan-950/60 rounded-xl p-4 sm:p-5 shadow space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  LIVE OPERATIONS MAP
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] font-mono text-emerald-300 font-bold">
                  REAL MAP DATA
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white bg-[#0e1422] px-2.5 py-1 rounded border border-cyan-900/50">
                  PLATE: GJ01AB1234
                </span>
                <button
                  onClick={() => onNavigate('geospatial_map')}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 transition shadow"
                >
                  <span>OPEN FULL MAP</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Compact Real Map Engine */}
            <div className="h-64 rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
              <RealGeospatialMap
                compact={true}
                initialPlate="GJ01AB1234"
                onOpenFullMap={() => onNavigate('geospatial_map')}
                onSelectVehicle={() => onNavigate('tracking')}
                className="h-full w-full"
              />
            </div>

            {/* Stepping Journey Grid */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                
                {/* Step 1: CAM-007 */}
                <div className="p-3 rounded-lg bg-[#090d16] border border-emerald-500/40 relative">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 font-bold mb-1">
                    <span>CAM-007</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                      ✓ OBSERVED
                    </span>
                  </div>
                  <div className="text-xs text-white font-medium">SG Hwy Junction North</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-1">10:02 IST • 58 km/h</div>
                </div>

                {/* Step 2: CAM-014 */}
                <div className="p-3 rounded-lg bg-[#090d16] border border-emerald-500/40 relative">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 font-bold mb-1">
                    <span>CAM-014</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                      ✓ CONFIRMED
                    </span>
                  </div>
                  <div className="text-xs text-white font-medium">Ashram Road Hub</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-1">10:05 IST • 62 km/h</div>
                </div>

                {/* Step 3: CAM-023 */}
                <div className="p-3 rounded-lg bg-[#090d16] border border-blue-500/40 relative">
                  <div className="flex items-center justify-between text-[11px] font-mono text-blue-400 font-bold mb-1">
                    <span>CAM-023</span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                      ◌ PREDICTED
                    </span>
                  </div>
                  <div className="text-xs text-white font-medium">Sindhu Bhavan Toll</div>
                  <div className="text-[10px] text-blue-300 font-mono mt-1">10:08 IST • 82% Conf</div>
                </div>

                {/* Step 4: CAM-031 */}
                <div className="p-3 rounded-lg bg-[#090d16] border border-zinc-800 relative opacity-70">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 font-bold mb-1">
                    <span>CAM-031</span>
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                      ○ WAITING
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 font-medium">Ring Road Express</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-1">ETA: 10:12 IST</div>
                </div>
              </div>

              {/* Color Code Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cyan-950/40 text-[11px] font-mono">
                <div className="flex flex-wrap items-center gap-3 text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-zinc-300">Green = confirmed</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-zinc-300">Blue = predicted</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-zinc-300">Yellow = review</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-zinc-300">Red = alert</span>
                  </span>
                </div>

                <button
                  onClick={() => onNavigate('challenge')}
                  className="px-3 py-1.5 bg-[#121929] hover:bg-[#18233a] border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-lg font-mono flex items-center space-x-1.5 transition cursor-pointer min-h-[36px]"
                >
                  <Eye size={14} />
                  <span>VIEW GOD'S EYE</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (lg:col-span-5) -> Review, Cameras, System Health */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* CARD D: REVIEW REQUIRED */}
          <div className="bg-[#0b0f19] border border-amber-950/60 rounded-xl p-4 sm:p-5 shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  REVIEW REQUIRED
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                3 Pending
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-3">
              3 items need officer confirmation prior to formal challan or intercept dispatch:
            </p>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-[#090d16] border border-amber-900/30 flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="text-xs font-semibold text-white">Watchlist Target Match</div>
                  <div className="text-[11px] text-zinc-400">Plate GJ01AB1234 on SG Highway (CAM-014)</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090d16] border border-amber-900/30 flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="text-xs font-semibold text-white">Speed Limit Violation</div>
                  <div className="text-[11px] text-zinc-400">88 km/h in 60 km/h arterial zone (CAM-007)</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090d16] border border-amber-900/30 flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <div className="text-xs font-semibold text-white">Evidence Tamper-Seal Verification</div>
                  <div className="text-[11px] text-zinc-400">Statutory certificate under BSA, 2023 §63</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('review_queue')}
              className="mt-4 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg font-mono flex items-center justify-center space-x-2 transition cursor-pointer min-h-[44px]"
            >
              <UserCheck size={16} />
              <span>OPEN REVIEW QUEUE</span>
            </button>
          </div>

          {/* CARD E: CAMERA STATUS */}
          <div className="bg-[#0b0f19] border border-cyan-950/60 rounded-xl p-4 sm:p-5 shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  CAMERAS
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                50 STATEWIDE SENSORS
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center mb-3">
              <div className="p-2.5 rounded-lg bg-[#090d16] border border-emerald-500/30">
                <div className="text-lg font-black font-mono text-emerald-400">47</div>
                <div className="text-[10px] font-mono text-emerald-300 font-bold">● ONLINE</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090d16] border border-amber-500/30">
                <div className="text-lg font-black font-mono text-amber-400">2</div>
                <div className="text-[10px] font-mono text-amber-300 font-bold">⚠ DEGRADED</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090d16] border border-rose-500/30">
                <div className="text-lg font-black font-mono text-rose-400">1</div>
                <div className="text-[10px] font-mono text-rose-300 font-bold">✕ OFFLINE</div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('cameras')}
              className="w-full py-2 bg-[#0e1422] hover:bg-[#141d30] border border-cyan-900/50 text-cyan-300 text-xs font-semibold rounded-lg font-mono flex items-center justify-center space-x-1.5 transition cursor-pointer min-h-[44px]"
            >
              <Video size={14} />
              <span>VIEW CAMERA MATRIX</span>
            </button>
          </div>

          {/* CARD F: SYSTEM HEALTH */}
          <div className="bg-[#0b0f19] border border-cyan-950/60 rounded-xl p-4 sm:p-5 shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  SYSTEM HEALTH
                </h2>
              </div>
              <div className="flex items-center space-x-1 text-emerald-400 font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>NORMAL</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400 pb-1 border-b border-white/5">
                <span>Cameras:</span>
                <span className="text-zinc-200 font-bold">49 / 50 Healthy</span>
              </div>
              <div className="flex justify-between text-zinc-400 pb-1 border-b border-white/5">
                <span>Edge Agents:</span>
                <span className="text-emerald-400 font-bold">6 / 6 Online</span>
              </div>
              <div className="flex justify-between text-zinc-400 pb-1 border-b border-white/5">
                <span>AI Agents:</span>
                <span className="text-emerald-400 font-bold">12 / 12 Online</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Event Processing:</span>
                <span className="text-cyan-300 font-bold">Normal ({health?.eventIngestionRate || 342}/s)</span>
              </div>
            </div>

            <button
              onClick={() => setIsTechHealthOpen(true)}
              className="mt-4 w-full py-2 bg-[#0e1422] hover:bg-[#141d30] border border-cyan-900/50 text-cyan-300 text-xs font-semibold rounded-lg font-mono flex items-center justify-center space-x-1.5 transition cursor-pointer min-h-[44px]"
            >
              <Cpu size={14} />
              <span>VIEW TECHNICAL HEALTH</span>
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: ALERT DETAILS DRAWER / FORENSIC MODAL */}
      {/* ============================================================ */}
      {isAlertDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0b0f19] border border-rose-500/40 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsAlertDetailOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-2.5 mb-3">
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                🔴 HIGH PRIORITY WATCHLIST DISPATCH
              </span>
              <span className="text-xs text-zinc-400 font-mono">2 min ago</span>
            </div>

            <h3 className="text-xl font-bold text-white font-mono mb-4">
              Watchlist Vehicle Detected: GJ01AB1234
            </h3>

            {/* Vehicle Plate & Image Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#07090f] border border-zinc-800 mb-4">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-mono mb-1">Target Identification</div>
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#05070c] border-2 border-yellow-400/80 rounded-lg text-yellow-300 font-mono font-black text-xl tracking-widest shadow-inner mb-3">
                  <span>IND</span>
                  <span className="text-white">GJ01AB1234</span>
                </div>
                <div className="space-y-1 text-xs text-zinc-300">
                  <div><strong>Make & Model:</strong> Hyundai Creta (White SUV)</div>
                  <div><strong>Location:</strong> SG Highway Junction North (CAM-014)</div>
                  <div><strong>Matched FIR:</strong> #2024/GJ-0912 (Stolen Vehicle Alert)</div>
                  <div><strong>ANPR Read Confidence:</strong> <span className="text-emerald-400 font-mono font-bold">94.8%</span></div>
                </div>
              </div>

              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=400&h=250" 
                  alt="Snapshot"
                  className="w-full h-36 rounded-lg object-cover border border-cyan-500/30"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/40">
                  BSA §63 EVIDENCE SEAL
                </div>
              </div>
            </div>

            {/* Explainability Breakdown */}
            <div className="space-y-2 mb-5">
              <h4 className="text-xs font-bold text-zinc-300 uppercase font-mono">
                AI Detection & Correlation Explainability:
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">Plate OCR</div>
                  <div className="text-emerald-400 font-bold">95.4%</div>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">Color Match</div>
                  <div className="text-cyan-400 font-bold">92.1%</div>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">Corridor Topology</div>
                  <div className="text-indigo-400 font-bold">96.8%</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  setIsAlertDetailOpen(false);
                  onNavigate('challenge');
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg font-mono flex items-center justify-center space-x-2 transition min-h-[44px]"
              >
                <Eye size={16} />
                <span>OPEN IN GOD'S EYE</span>
              </button>
              <button
                onClick={() => {
                  setIsAlertDetailOpen(false);
                  handleLaunchTrackMission('GJ01AB1234');
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg font-mono flex items-center justify-center space-x-2 transition min-h-[44px]"
              >
                <Crosshair size={16} />
                <span>LAUNCH AUTONOMOUS MISSION</span>
              </button>
              <button
                onClick={() => setIsAlertDetailOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg font-mono flex items-center justify-center transition min-h-[44px]"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: QUICK TRACK VEHICLE MODAL */}
      {/* ============================================================ */}
      {isQuickTrackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setIsQuickTrackOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <Car className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white font-mono">
                TRACK VEHICLE
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Enter target license plate to deploy multi-camera autonomous tracking corridor.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                  License Plate:
                </label>
                <input
                  type="text"
                  value={trackPlate}
                  onChange={(e) => setTrackPlate(e.target.value)}
                  placeholder="e.g. GJ01AB1234"
                  className="w-full bg-[#07090f] border border-cyan-800/60 rounded-lg p-3 text-base font-mono font-bold text-yellow-300 focus:outline-none focus:border-cyan-400 uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                  Corridor Topology:
                </label>
                <select
                  value={trackCorridor}
                  onChange={(e) => setTrackCorridor(e.target.value)}
                  className="w-full bg-[#07090f] border border-cyan-800/60 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="SG Highway Corridor">SG Highway Corridor (Ahmedabad)</option>
                  <option value="Ashram Road Arterial">Ashram Road Arterial (Ahmedabad)</option>
                  <option value="Ring Road Express">Ring Road Express (Ahmedabad)</option>
                  <option value="Vadodara Central">Vadodara Central Corridor</option>
                  <option value="Surat Textile Ring">Surat Textile Ring</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-900/40 text-[11px] text-cyan-300 font-mono">
                ℹ Deploying mission will activate 4 downstream predictive cameras and continuous cross-correlation agents.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleLaunchTrackMission(trackPlate)}
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg font-mono text-xs flex items-center justify-center space-x-2 transition cursor-pointer min-h-[44px]"
                >
                  <Play size={16} className="fill-current" />
                  <span>DEPLOY TRACKING MISSION</span>
                </button>
                <button
                  onClick={() => setIsQuickTrackOpen(false)}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg font-mono text-xs transition cursor-pointer min-h-[44px]"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: FIND LAST SEEN MODAL */}
      {/* ============================================================ */}
      {isFindLastSeenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setIsFindLastSeenOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <Search className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white font-mono">
                FIND LAST SEEN SIGHTING
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Query the Central Event Store across all 50 CCTV nodes for latest detection.
            </p>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lastSeenQuery}
                  onChange={(e) => setLastSeenQuery(e.target.value)}
                  placeholder="Enter plate (e.g. GJ01AB1234)"
                  className="flex-1 bg-[#07090f] border border-cyan-800/60 rounded-lg p-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-400 uppercase"
                />
                <button
                  onClick={handleSearchLastSeen}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg font-mono text-xs transition cursor-pointer min-h-[44px]"
                >
                  SEARCH
                </button>
              </div>

              {lastSeenResult && (
                <div className="p-4 rounded-xl bg-[#07090f] border border-cyan-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-yellow-300 bg-black/60 px-2 py-0.5 rounded border border-yellow-500/40">
                      {lastSeenResult.plate}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {lastSeenResult.confidence}% MATCH
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-300 font-sans">
                    <div><strong>Camera:</strong> {lastSeenResult.camera}</div>
                    <div><strong>Location:</strong> {lastSeenResult.location}</div>
                    <div><strong>Timestamp:</strong> {lastSeenResult.timestamp}</div>
                    <div><strong>Direction:</strong> {lastSeenResult.direction}</div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex gap-2">
                    <button
                      onClick={() => {
                        setIsFindLastSeenOpen(false);
                        onNavigate('challenge');
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg font-mono text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer min-h-[44px]"
                    >
                      <Eye size={14} />
                      <span>OPEN ON MAP</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsFindLastSeenOpen(false);
                        handleLaunchTrackMission(lastSeenResult.plate);
                      }}
                      className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg font-mono text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer min-h-[44px]"
                    >
                      <Crosshair size={14} />
                      <span>TRACK NOW</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: TECHNICAL HEALTH & DIAGNOSTICS MODAL */}
      {/* ============================================================ */}
      {isTechHealthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsTechHealthOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white font-mono">
                ENGINEERING TELEMETRY & SYSTEM HEALTH
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Statewide AI Agent Mesh performance, queue latency, and edge infrastructure metrics.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#07090f] border border-zinc-800 text-center">
                <div className="text-[10px] text-zinc-400 font-mono uppercase">AI Ingestion</div>
                <div className="text-xl font-bold font-mono text-cyan-300">
                  {health?.eventIngestionRate || 342}/s
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#07090f] border border-zinc-800 text-center">
                <div className="text-[10px] text-zinc-400 font-mono uppercase">OCR Read Rate</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {health?.anprReadRate || 128}/s
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#07090f] border border-zinc-800 text-center">
                <div className="text-[10px] text-zinc-400 font-mono uppercase">P95 Latency</div>
                <div className="text-xl font-bold font-mono text-indigo-400">
                  {health?.jobLatencyP95Ms || 42} ms
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#07090f] border border-zinc-800 text-center">
                <div className="text-[10px] text-zinc-400 font-mono uppercase">Fleet Avail.</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {health?.agentAvailabilityPercent || 100}%
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#07090f] border border-zinc-800 space-y-2 text-xs font-mono mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Latency Profile:</span>
                <span className="text-zinc-200">P50: 18ms • P95: 42ms • P99: 98ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Event Backpressure:</span>
                <span className="text-emerald-400 font-bold">NOMINAL (Queue depth: 4 items)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Node Certificates:</span>
                <span className="text-cyan-400">SHA-256 Validated (6 Nodes)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Hardware Utilization:</span>
                <span className="text-zinc-200">GPU: 38% • CPU: 42% • RAM: 4.2 / 16 GB</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  setIsTechHealthOpen(false);
                  onNavigate('digital_twin');
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg font-mono text-xs flex items-center space-x-1.5 transition cursor-pointer min-h-[44px]"
              >
                <span>OPEN 80K DIGITAL TWIN LAB</span>
                <ExternalLink size={14} />
              </button>
              <button
                onClick={() => setIsTechHealthOpen(false)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg font-mono text-xs transition cursor-pointer min-h-[44px]"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
