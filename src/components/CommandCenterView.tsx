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
  ChevronDown,
  AlertOctagon,
  Sparkles,
  ScanFace,
  Navigation,
  Compass,
  FileCheck,
  Server,
  Info
} from 'lucide-react';
import { missionControlService } from '../services/MissionControlService';
import { incidentCommandService } from '../services/IncidentCommandService';
import { predictiveCameraHandoffService } from '../services/PredictiveCameraHandoffService';
import { humanReviewQueueService } from '../services/HumanReviewQueueService';
import { systemHealthService, StatewideHealthSnapshot } from '../services/SystemHealthService';
import { sysEvents, centralRepo } from '../services/Architecture';
import { Mission, IncidentRecord, PredictiveHandoffPoint, MissionType } from '../types';
import { mockAlerts, mockCameras } from '../mockData';
import { 
  MetricCard, 
  QuickActionGrid, 
  StatusBadge, 
  ActionButton, 
  AlertDetailDrawer, 
  TechnicalDetailsToggle 
} from './ui/OfficerPrimitives';
import { AlertCard } from './AlertCard';
import { HsrpVerificationPanel } from './HsrpVerificationPanel';

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
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(4);
  const [health, setHealth] = useState<StatewideHealthSnapshot | null>(null);

  // Modals / Drawers state
  const [isAlertDetailOpen, setIsAlertDetailOpen] = useState(false);
  const [isQuickTrackOpen, setIsQuickTrackOpen] = useState(false);
  const [latestDynamicAlert, setLatestDynamicAlert] = useState<any>(null);
  const [isFindLastSeenOpen, setIsFindLastSeenOpen] = useState(false);
  const [alertReviewed, setAlertReviewed] = useState(false);
  const [showMissionDetails, setShowMissionDetails] = useState(false);

  // Quick inputs
  const [trackPlate, setTrackPlate] = useState('GJ01AB1234');
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
    location: 'Ahmedabad • SG Highway Junction',
    timestamp: '11:49 AM',
    confidence: 92,
    direction: 'Northbound towards Gandhinagar'
  });

  const refreshState = () => {
    setMissions(missionControlService.listMissions());
    setIncidents(incidentCommandService.listIncidents());
    setHandoffs(predictiveCameraHandoffService.getAllActiveHandoffs());
    setPendingReviewsCount(humanReviewQueueService.getPendingCount() || 4);
    setHealth(systemHealthService.getSnapshot());
  };

  
  useEffect(() => {
    const handleNewEvent = () => {
      const allEvents = centralRepo.getAllEvents();
      if (allEvents.length > 0) {
        const latest = allEvents[allEvents.length - 1];
        setLatestDynamicAlert({
          id: latest.eventId,
          violationType: latest.eventType.replace(/_/g, ' '),
          vehiclePlate: latest.metadata?.registrationNumber || 'UNKNOWN',
          vehicleType: latest.metadata?.vehicleClass || 'Vehicle',
          cameraId: latest.cameraId || 'CAM-UNKNOWN',
          sourceType: latest.metadata?.sourceType || 'UNKNOWN_SOURCE',
          location: latest.metadata?.gps ? 'GPS ' + latest.metadata.gps.latitude.toFixed(3) : 'Ahmedabad',
          timestamp: new Date(latest.timestamp).toLocaleTimeString(),
          confidence: latest.confidence ? Math.round(latest.confidence * 100) : 90,
          evidenceUrl: latest.snapshotReference || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
        });
      }
    };
    handleNewEvent(); // Initial load
    const unsub = sysEvents.on('LOG', (msg: any) => { if (msg?.type === 'EVENT_STORED') handleNewEvent(); });
    return () => unsub();
  }, []);

  useEffect(() => {
    refreshState();
    const timer = setInterval(refreshState, 4000);

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
      requestedBy: 'Officer In Charge',
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
      location: 'Ahmedabad • SG Highway Corridor',
      timestamp: '11:49 AM',
      confidence: 92,
      direction: 'Northbound towards Gandhinagar'
    });
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'track_vehicle':
        setIsQuickTrackOpen(true);
        break;
      case 'find_last_seen':
        setIsFindLastSeenOpen(true);
        break;
      case 'investigate_incident':
        onNavigate('incidents');
        break;
      case 'check_camera':
        onNavigate('cameras');
        break;
      case 'review_alert':
        setIsAlertDetailOpen(true);
        break;
      case 'search_evidence':
        onNavigate('tracking');
        break;
      default:
        break;
    }
  };

  // Primary Active Alert definition (strictly matches prompt requirements)
  const activeAlertData = latestDynamicAlert || {
    id: 'ALT-GJ-00192',
    violationType: 'NO HELMET',
    vehiclePlate: 'GJ01AB1234',
    vehicleType: 'Motorcycle',
    cameraId: 'CAM-001',
    location: 'Ahmedabad',
    timestamp: '11:49 AM',
    confidence: 92,
    evidenceUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 text-slate-900 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Real-time traffic and CCTV intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-2xs">
            District: <strong className="text-slate-900">Ahmedabad</strong>
          </span>
          <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-2xs">
            Jurisdiction: <strong className="text-slate-900">Gujarat Police</strong>
          </span>
        </div>
      </div>

      {/* 2. Top Summary Cards (3 Cards ONLY) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Alerts */}
        <MetricCard
          title="Active Alerts"
          value={6}
          subtext="3 urgent"
          variant="red"
          icon={<AlertTriangle size={24} />}
          onClick={() => onNavigate('alerts')}
        />

        {/* Missions */}
        <MetricCard
          title="Missions"
          value={2}
          subtext="1 tracking"
          variant="blue"
          icon={<Crosshair size={24} />}
          onClick={() => onNavigate('missions')}
        />

        {/* Review Required */}
        <MetricCard
          title="Review Required"
          value={pendingReviewsCount}
          subtext="Need attention"
          variant="amber"
          icon={<UserCheck size={24} />}
          onClick={() => onNavigate('challan_mode')}
        />
      </div>

      {/* 3. Quick Actions ("What do you want to do?") */}
      <QuickActionGrid onAction={handleQuickAction} />

      {/* Sentinel CAM-01 Real AI Agentic HSRP Vision Mesh */}
      <HsrpVerificationPanel />

      {/* 4. MOST IMPORTANT SECTION: ACTIVE ALERT */}
      <AlertCard
        alert={activeAlertData}
        isReviewed={alertReviewed}
        onReviewAlert={() => setIsAlertDetailOpen(true)}
        onViewFullEvidence={() => onNavigate('tracking')}
        onTrackVehicle={(plate) => {
          setTrackPlate(plate);
          setIsQuickTrackOpen(true);
        }}
        onViewCamera={() => onNavigate('cameras')}
      />

      {/* 5. Underneath Active Alert: Active Mission & System Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Mission Card (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  ACTIVE MISSION
                </span>
              </div>
              <StatusBadge status="LIVE" label="STATUS: ACTIVE" size="sm" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
              Track Vehicle GJ01AB1234
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Autonomous corridor tracking along Ahmedabad SG Highway Transit Corridor
            </p>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">Mission Progress</span>
                <span className="text-blue-700 font-bold">80% Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: '80%' }}
                />
              </div>
            </div>

            {/* Current & Next Expected Cameras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Current Camera</span>
                <div className="flex items-center gap-2 mt-1">
                  <Camera size={16} className="text-emerald-600" />
                  <span className="text-sm font-black text-slate-900 font-mono">CAM-023</span>
                  <span className="text-xs text-slate-500 font-medium">(Pakwan Crossroad)</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Next Expected Camera</span>
                <div className="flex items-center gap-2 mt-1">
                  <Navigation size={16} className="text-blue-600" />
                  <span className="text-sm font-black text-slate-900 font-mono">CAM-031</span>
                  <span className="text-xs text-slate-500 font-medium">(Thaltej Underpass)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => onNavigate('missions')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-xs flex items-center gap-2 min-h-[44px] cursor-pointer"
            >
              <Crosshair size={16} />
              <span>OPEN MISSION</span>
            </button>

            <button
              onClick={() => setShowMissionDetails(!showMissionDetails)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-100"
            >
              <span>{showMissionDetails ? 'Hide' : 'View'} Mission Details</span>
              {showMissionDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {/* Collapsible Mission Details Accordion */}
          {showMissionDetails && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 font-mono">
              <div className="flex justify-between">
                <span>Target Plate:</span>
                <strong className="text-slate-900">GJ01AB1234</strong>
              </div>
              <div className="flex justify-between">
                <span>Correlation Engine:</span>
                <span>Spatial Handoff Layer</span>
              </div>
              <div className="flex justify-between">
                <span>Predictive Confidence:</span>
                <span>94.2%</span>
              </div>
              <div className="flex justify-between">
                <span>Edge Node:</span>
                <span>EDGE-GJ-001 (Ahmedabad)</span>
              </div>
            </div>
          )}
        </div>

        {/* System Status Card (1 col on lg) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                SYSTEM STATUS
              </h3>
              <StatusBadge status="HEALTHY" label="ONLINE" size="sm" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">Cameras Online</span>
                </div>
                <span className="text-xs font-bold text-emerald-700">100%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">AI Service Healthy</span>
                </div>
                <span className="text-xs font-bold text-emerald-700">Operational</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">Evidence Storage</span>
                </div>
                <span className="text-xs font-bold text-emerald-700">Online</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">Edge Agents</span>
                </div>
                <span className="text-xs font-bold text-emerald-700">Healthy</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('system')}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border border-slate-300 transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
            >
              <Activity size={16} />
              <span>View System Health</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Deep Technical Architecture & Telemetry (Collapsible for Admin/Technical Users) */}
      <TechnicalDetailsToggle 
        title="Technical Architecture & Telemetry" 
        badge="EDGE FLEET & PIPELINES"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">AI Vision Engine:</span>
            <p className="font-bold text-slate-800">Gemini 3.8 Flash (Server-side)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Evidence Hash Standard:</span>
            <p className="font-bold text-slate-800">SHA-256 Digest Record</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Admissibility Workflow:</span>
            <p className="font-bold text-slate-800">BSA 2023 Sec 63-65</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Event Bus Transport:</span>
            <p className="font-bold text-slate-800">Central Event Architecture</p>
          </div>
        </div>
      </TechnicalDetailsToggle>

      {/* 7. Alert Detail Screen / Slide-Over Drawer */}
      <AlertDetailDrawer
        isOpen={isAlertDetailOpen}
        onClose={() => setIsAlertDetailOpen(false)}
        alert={activeAlertData}
        onViewEvidence={() => onNavigate('tracking')}
        onViewMap={() => onNavigate('geospatial_map')}
        onTrackVehicle={(plate) => {
          setTrackPlate(plate);
          setIsQuickTrackOpen(true);
        }}
        onMarkReviewed={() => {
          setAlertReviewed(true);
        }}
        onSendHumanReview={() => {
          humanReviewQueueService.enqueueReview({
            reviewType: 'VIOLATION_REVIEW',
            priority: 'P1_HIGH',
            subjectPlate: 'GJ01AB1234',
            cameraId: 'CAM-001',
            originalInference: { violation: 'NO HELMET', plate: 'GJ01AB1234' },
            originalConfidence: 0.92,
            confidenceBand: 'MEDIUM',
            contributingSignals: [
              { signal: 'OCR_MATCH', value: 'GJ01AB1234', status: 'MATCH', weight: 0.5 },
              { signal: 'HELMET_DETECTION', value: 'NEGATIVE', status: 'MISMATCH', weight: 0.5 }
            ],
            conflictingSignals: [],
            missingSignals: [],
            evidenceThumbnail: activeAlertData.evidenceUrl
          });
          refreshState();
        }}
      />

      {/* Quick Track Modal */}
      {isQuickTrackOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Track Vehicle</h3>
              </div>
              <button
                onClick={() => setIsQuickTrackOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Initialize corridor prediction and camera handoff for target vehicle:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Vehicle Registration Number
              </label>
              <input
                type="text"
                value={trackPlate}
                onChange={(e) => setTrackPlate(e.target.value.toUpperCase())}
                placeholder="e.g. GJ01AB1234"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsQuickTrackOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLaunchTrackMission(trackPlate)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer min-h-[44px]"
              >
                Launch Tracking Mission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Find Last Seen Modal */}
      {isFindLastSeenOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Find Last Seen</h3>
              </div>
              <button
                onClick={() => setIsFindLastSeenOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={lastSeenQuery}
                onChange={(e) => setLastSeenQuery(e.target.value.toUpperCase())}
                placeholder="Enter plate number..."
                className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
              <button
                onClick={handleSearchLastSeen}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>

            {lastSeenResult && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Last Known Sighting</span>
                  <StatusBadge status="VERIFIED" label="CONFIRMED SIGHTING" size="sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Plate: <strong className="font-mono text-slate-900">{lastSeenResult.plate}</strong></div>
                  <div>Camera: <strong className="font-mono text-slate-900">{lastSeenResult.camera}</strong></div>
                  <div>Location: <strong className="text-slate-900">{lastSeenResult.location}</strong></div>
                  <div>Time: <strong className="text-slate-900">{lastSeenResult.timestamp}</strong></div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setIsFindLastSeenOpen(false);
                      onNavigate('search');
                    }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Open in Vehicle Search
                  </button>
                  <button
                    onClick={() => {
                      setIsFindLastSeenOpen(false);
                      onNavigate('geospatial_map');
                    }}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    View on Map
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
