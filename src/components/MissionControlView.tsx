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
  ArrowRight
} from 'lucide-react';
import { missionControlService } from '../services/MissionControlService';
import { confidencePolicyService } from '../services/ConfidencePolicyService';
import { sysEvents } from '../services/Architecture';
import { Mission, MissionType, MissionPriority, MissionStep, MissionApproval } from '../types';
import { ExplainabilityModal } from './ExplainabilityModal';

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

  // New Mission Form State
  const [newMissionType, setNewMissionType] = useState<MissionType>('TRACK_VEHICLE');
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

  const handleResolveApproval = (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    missionControlService.resolveApproval(
      approvalId, 
      decision, 
      'OFFICER-741', 
      'Inspector D. Shrivastava', 
      decision === 'APPROVED' ? 'Physical verification completed; confirmed vehicle profile.' : 'Disputed by officer on visual inspection.'
    );
    refreshMissions();
  };

  const handleCreateMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjective.trim()) return;

    const created = missionControlService.createMission({
      missionType: newMissionType,
      objective: newObjective.trim(),
      requestedBy: 'Command Center Lead',
      priority: newPriority,
      targetPlate: newPlate.trim().toUpperCase()
    });

    setShowCreateModal(false);
    refreshMissions();
    setSelectedMissionId(created.missionId);
  };

  const explainabilityRecord = selectedExplainabilityId 
    ? confidencePolicyService.getExplainabilityByTarget(selectedExplainabilityId) || confidencePolicyService.getExplainability(selectedExplainabilityId)
    : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AI MISSION CONTROL & WORKFLOW ORCHESTRATOR</h1>
              <p className="text-xs text-slate-400">Deterministic job decomposition, live step execution tree, and supervised action approvals</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New AI Mission</span>
        </button>
      </div>

      {/* Main Layout: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mission List Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Statewide Missions ({missions.length})</span>
            <span className="text-[11px] text-indigo-400 font-mono">AUTONOMOUS MESH</span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {missions.map(m => {
              const isSelected = m.missionId === selectedMission?.missionId;
              const completedCount = m.steps.filter(s => s.status === 'COMPLETED').length;

              return (
                <div
                  key={m.missionId}
                  onClick={() => setSelectedMissionId(m.missionId)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected 
                      ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/30' 
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-indigo-400">{m.missionId}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      m.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' :
                      m.status === 'WAITING_FOR_APPROVAL' ? 'bg-amber-500/20 text-amber-400' :
                      m.status === 'COMPLETED' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">{m.objective}</h3>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="font-mono text-[11px]">{m.targetPlate || 'BROAD_CORRIDOR'}</span>
                    <span>{completedCount} / {m.steps.length} Steps</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mission Detail View (8 cols) */}
        {selectedMission && (
          <div className="lg:col-span-8 space-y-6">
            {/* Mission Hero Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {selectedMission.missionId}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedMission.missionType.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      selectedMission.priority === 'P0_CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {selectedMission.priority.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedMission.objective}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Requested by: <span className="text-slate-300">{selectedMission.requestedBy}</span> | Starting Node: <span className="font-mono text-slate-300">{selectedMission.startingCameraId}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    selectedMission.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    selectedMission.status === 'WAITING_FOR_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedMission.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Mission Summary / Result if completed */}
              {selectedMission.result && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mission Execution Concluded</span>
                  </div>
                  <p className="text-slate-300">{selectedMission.result.summary}</p>
                </div>
              )}
            </div>

            {/* Approval Gate Banner if waiting */}
            {selectedMission.approvals.some(a => a.status === 'PENDING') && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-5 shadow">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                      Supervisory Human Approval Gate Mandated
                    </h3>
                    <p className="text-xs text-amber-200/80 mt-1">
                      In compliance with Bharatiya Sakshya Adhiniyam, 2023 and Gujarat Police SOPs, high-impact action requires authorized officer sign-off.
                    </p>

                    <div className="mt-4 space-y-3">
                      {selectedMission.approvals.filter(a => a.status === 'PENDING').map(app => (
                        <div key={app.approvalId} className="p-3 bg-slate-900/80 rounded-lg border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-white block">{app.actionTitle}</span>
                            <span className="text-slate-400">{app.reason}</span>
                            <div className="mt-1 flex items-center space-x-2">
                              <span className="text-indigo-400 font-mono">Confidence: {Math.round(app.confidence * 100)}%</span>
                              <button
                                onClick={() => setSelectedExplainabilityId(selectedMission.targetPlate || 'GJ01AB1234')}
                                className="text-cyan-400 underline hover:text-cyan-300 flex items-center space-x-1"
                              >
                                <HelpCircle className="w-3 h-3" />
                                <span>Why did AI recommend this?</span>
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleResolveApproval(app.approvalId, 'APPROVED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition"
                            >
                              Authorize
                            </button>
                            <button
                              onClick={() => handleResolveApproval(app.approvalId, 'REJECTED')}
                              className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 font-semibold rounded text-xs transition"
                            >
                              Dispute
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow Steps Execution Tree */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Deterministic Step Execution Tree</span>
              </h3>

              <div className="space-y-3">
                {selectedMission.steps.map(step => {
                  const isPending = step.status === 'PENDING';
                  const isRunning = step.status === 'RUNNING';
                  const isCompleted = step.status === 'COMPLETED';
                  const isWaitingApproval = step.status === 'WAITING_APPROVAL';

                  return (
                    <div 
                      key={step.stepId}
                      className={`p-4 rounded-lg border transition ${
                        isRunning ? 'bg-indigo-950/20 border-indigo-500/50' :
                        isCompleted ? 'bg-slate-800/40 border-slate-700/60' :
                        isWaitingApproval ? 'bg-amber-950/20 border-amber-500/40' :
                        'bg-slate-800/20 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : isRunning ? (
                              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            ) : isWaitingApproval ? (
                              <ShieldAlert className="w-5 h-5 text-amber-400" />
                            ) : (
                              <Clock className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono font-bold text-slate-400">Step {step.stepNumber}:</span>
                              <h4 className="text-sm font-semibold text-white">{step.name}</h4>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                                {step.assignedAgentType}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                            {step.outputSummary && (
                              <p className="text-xs text-emerald-400/90 font-mono mt-1">
                                ↳ {step.outputSummary}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isPending && (
                            <button
                              disabled={isExecutingStep}
                              onClick={() => handleExecuteNextStep(step.stepId)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center space-x-1.5 transition"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Execute Step</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evidence Gallery */}
            {selectedMission.evidence.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Mission Evidence Gallery (Bharatiya Sakshya Adhiniyam, 2023)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedMission.evidence.map((ev, idx) => (
                    <div key={`${ev.evidenceId}-${idx}`} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden text-xs">
                      <img 
                        src={ev.thumbnailUrl} 
                        alt="Evidence Frame" 
                        referrerPolicy="no-referrer"
                        className="w-full h-36 object-cover bg-slate-950" 
                      />
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-white">{ev.evidenceId}</span>
                          <span className="text-cyan-400">{ev.sourceCameraId}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono break-all">
                          SHA-256: {ev.sha256}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Source of Truth: <span className="text-slate-200 font-semibold">{ev.sourceOfTruth}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Audit Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-3">Agent Collaboration Log</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs text-slate-400">
                {selectedMission.executionLog.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2 py-0.5">
                    <span className="text-slate-500 whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-indigo-400 font-bold whitespace-nowrap">&lt;{log.agentId}&gt;</span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Mission Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Launch New Operational Mission</h3>
            <form onSubmit={handleCreateMissionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Mission Type</label>
                <select
                  value={newMissionType}
                  onChange={(e) => setNewMissionType(e.target.value as MissionType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="TRACK_VEHICLE">TRACK VEHICLE</option>
                  <option value="FIND_LAST_SEEN">FIND LAST SEEN</option>
                  <option value="LOCATE_WATCHLIST_CANDIDATE">LOCATE WATCHLIST CANDIDATE</option>
                  <option value="SEARCH_CORRIDOR">SEARCH CORRIDOR</option>
                  <option value="FOLLOW_MOBILE_CAMERA">FOLLOW MOBILE CAMERA</option>
                  <option value="CAMERA_HEALTH_SWEEP">CAMERA HEALTH SWEEP</option>
                  <option value="RECONSTRUCT_JOURNEY">RECONSTRUCT JOURNEY</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Objective Description</label>
                <input
                  type="text"
                  required
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="e.g. Track white SUV along SG Highway corridor to Thaltej"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target Vehicle Plate (if applicable)</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as MissionPriority)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="P0_CRITICAL">P0 CRITICAL (Immediate Intercept)</option>
                  <option value="P1_HIGH">P1 HIGH (Active Investigation)</option>
                  <option value="P2_OPERATIONAL">P2 OPERATIONAL (Standard Patrol)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 shadow"
                >
                  Plan & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explainability Modal */}
      {selectedExplainabilityId && explainabilityRecord && (
        <ExplainabilityModal
          record={explainabilityRecord}
          onClose={() => setSelectedExplainabilityId(null)}
        />
      )}
    </div>
  );
};
