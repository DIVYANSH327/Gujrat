import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Play, 
  ShieldAlert, 
  FileCheck, 
  ChevronRight, 
  Search, 
  Plus, 
  HelpCircle,
  Hash,
  Camera, 
  Layers, 
  ArrowRight,
  MapPin,
  Navigation,
  Sparkles,
  StopCircle,
  Radio,
  X,
  Compass,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { missionControlService } from '../services/MissionControlService';
import { confidencePolicyService } from '../services/ConfidencePolicyService';
import { sysEvents } from '../services/Architecture';
import { Mission, MissionType, MissionPriority, MissionStep, MissionApproval } from '../types';
import { ExplainabilityModal } from './ExplainabilityModal';
import { StatusBadge } from './ui/OfficerPrimitives';

interface MissionControlViewProps {
  initialMissionId?: string;
  onNavigate?: (view: string) => void;
}

export const MissionControlView: React.FC<MissionControlViewProps> = ({ 
  initialMissionId,
  onNavigate 
}) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string>(initialMissionId || '');
  const [isExecutingStep, setIsExecutingStep] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedExplainabilityId, setSelectedExplainabilityId] = useState<string | null>(null);
  const [isInterceptModalOpen, setIsInterceptModalOpen] = useState<boolean>(false);
  const [interceptSuccessMsg, setInterceptSuccessMsg] = useState<string | null>(null);
  const [showAdvancedSteps, setShowAdvancedSteps] = useState<boolean>(false);

  // Form State
  const [newObjective, setNewObjective] = useState('');
  const [newPlate, setNewPlate] = useState('GJ01AB1234');
  const [newPriority, setNewPriority] = useState<MissionPriority>('P0_CRITICAL');

  const refreshMissions = () => {
    const list = missionControlService.listMissions();
    setMissions(list);
    if (!selectedMissionId && list.length > 0) {
      setSelectedMissionId(list[0].missionId);
    }
  };

  useEffect(() => {
    refreshMissions();
    const unsub = sysEvents.on('MISSION_UPDATED', refreshMissions);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialMissionId) {
      setSelectedMissionId(initialMissionId);
    }
  }, [initialMissionId]);

  const selectedMission = missions.find(m => m.missionId === selectedMissionId) || missions[0];

  const handleExecuteNextStep = async (stepId: string) => {
    if (!selectedMission || isExecutingStep) return;
    setIsExecutingStep(true);
    await missionControlService.executeStep(selectedMission.missionId, stepId);
    setIsExecutingStep(false);
    refreshMissions();
  };

  const handleIntercept = () => {
    setIsInterceptModalOpen(false);
    setInterceptSuccessMsg('Interception dispatch unit alerted for CAM-031 (Thaltej Underpass).');
    setTimeout(() => setInterceptSuccessMsg(null), 5000);
  };

  const handleStopTracking = (missionId: string) => {
    setMissions(prev => prev.map(m => m.missionId === missionId ? { ...m, status: 'COMPLETED' } : m));
  };

  const handleCreateMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjective.trim()) return;

    const created = missionControlService.createMission({
      missionType: 'TRACK_VEHICLE',
      objective: newObjective.trim(),
      requestedBy: 'Command Center Officer',
      priority: newPriority,
      targetPlate: newPlate.trim().toUpperCase()
    });

    setShowCreateModal(false);
    refreshMissions();
    setSelectedMissionId(created.missionId);
  };

  // Timeline entries required by prompt
  const corridorTimeline = [
    { time: '11:45 AM', camera: 'CAM-014', label: 'Ashram Road Transit Hub' },
    { time: '11:47 AM', camera: 'CAM-023', label: 'Pakwan Crossroad' },
    { time: '11:49 AM', camera: 'CAM-001', label: 'SG Highway Junction' }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 text-slate-900 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Active Missions & Live Tracking
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Real-time corridor tracking, predictive camera handoffs, and interception controls
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer min-h-[44px]"
          >
            <Plus size={16} />
            <span>New Mission</span>
          </button>
        </div>
      </div>

      {/* Intercept Success Toast */}
      {interceptSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs text-emerald-900 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{interceptSuccessMsg}</span>
          </div>
          <button onClick={() => setInterceptSuccessMsg(null)} className="text-xs font-bold px-2 py-1 hover:bg-emerald-100 rounded cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Active Mission Card (Strictly Matching Prompt Layout) */}
      <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Mission Core Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ACTIVE MISSION CARD
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono font-semibold text-slate-600">
                {selectedMission?.missionId || 'MSN-9021'}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase">Target:</span>
              <h2 className="text-2xl sm:text-3xl font-black font-mono text-blue-700 tracking-wider">
                {selectedMission?.targetPlate || 'GJ01AB1234'}
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Type: Vehicle Tracking
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status="LIVE" label="STATUS: ACTIVE" size="md" />
          </div>
        </div>

        {/* 3. Timeline & Next Predicted Camera Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sighting Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              <span>Corridor Timeline</span>
            </h3>

            <div className="space-y-2.5">
              {corridorTimeline.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-mono font-bold text-slate-900">{item.time}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono font-bold text-blue-700">{item.camera}</span>
                  </div>
                  <span className="text-slate-600 font-medium truncate max-w-[180px]">
                    ({item.label})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Predicted Camera Card */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Navigation size={14} className="text-blue-600" />
              <span>Next Predicted Camera</span>
            </h3>

            <div className="p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                  CAM-031
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100/80 px-3 py-1 rounded-full">
                  <Sparkles size={13} />
                  <span>Confidence: 89%</span>
                </div>
              </div>

              <div>
                <p className="text-base font-bold text-slate-900">
                  Thaltej Underpass Interchange
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Vehicle trajectory vector indicates northbound SG Highway transit towards Gandhinagar bypass.
                </p>
              </div>

              <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs text-slate-600">
                <span>Estimated Arrival Window:</span>
                <strong className="text-slate-900 font-mono">11:52 AM – 11:54 AM</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Action Buttons: [ Intercept Route ] [ Stop Tracking ] */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsInterceptModalOpen(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-xs flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Crosshair size={18} />
            <span>Intercept Route</span>
          </button>

          <button
            onClick={() => handleStopTracking(selectedMission?.missionId || 'MSN-9021')}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm border border-slate-300 transition-colors flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <StopCircle size={18} />
            <span>Stop Tracking</span>
          </button>

          <button
            onClick={() => setShowAdvancedSteps(!showAdvancedSteps)}
            className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <Sliders size={14} />
            <span>{showAdvancedSteps ? 'Hide' : 'View'} Execution Steps</span>
            {showAdvancedSteps ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Collapsible Advanced Step Orchestration */}
        {showAdvancedSteps && selectedMission && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-600">
              Orchestrator Execution Pipeline
            </h4>
            <div className="space-y-2">
              {selectedMission.steps.map((step, idx) => (
                <div key={step.stepId || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    {step.status === 'COMPLETED' ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : step.status === 'RUNNING' ? (
                      <Radio size={16} className="text-blue-600 animate-pulse" />
                    ) : (
                      <Clock size={16} className="text-slate-400" />
                    )}
                    <span className="font-semibold text-slate-800">{step.description}</span>
                  </div>
                  <span className={`font-mono font-bold text-[11px] ${
                    step.status === 'COMPLETED' ? 'text-emerald-700' :
                    step.status === 'RUNNING' ? 'text-blue-700' : 'text-slate-500'
                  }`}>
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Intercept Confirmation Modal */}
      {isInterceptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Crosshair size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Confirm Intercept Route</h3>
              </div>
              <button onClick={() => setIsInterceptModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Dispatch interception coordinate packet to Ahmedabad Traffic Intercept Squad for corridor interception:
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Plate:</span>
                <strong className="text-slate-900">{selectedMission?.targetPlate || 'GJ01AB1234'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Interception Point:</span>
                <strong className="text-slate-900">CAM-031 (Thaltej Underpass)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ETA Window:</span>
                <strong className="text-slate-900">11:52 AM – 11:54 AM</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsInterceptModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleIntercept}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer min-h-[44px]"
              >
                Confirm & Dispatch Squad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Mission Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create Tracking Mission</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMissionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Target License Plate</label>
                <input
                  type="text"
                  required
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. GJ01AB1234"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Mission Objective</label>
                <input
                  type="text"
                  required
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="e.g. Corridor tracking along SG Highway"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="P0_CRITICAL">P0 - CRITICAL</option>
                  <option value="P1_HIGH">P1 - HIGH</option>
                  <option value="P2_STANDARD">P2 - STANDARD</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer min-h-[44px]"
                >
                  Launch Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
