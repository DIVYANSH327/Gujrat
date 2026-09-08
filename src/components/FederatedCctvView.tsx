/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * FederatedCctvView: Federated Department View, Video Retention Engine
 * and Edge AI Enabled Smart Camera Architecture
 * 
 * Gujarat Unified CCTV Intelligence Grid V1.1
 */

import React, { useState } from 'react';
import { 
  Globe, 
  Shield, 
  Server, 
  Database, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Cpu, 
  Activity, 
  Play, 
  FileCheck, 
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  Car
} from 'lucide-react';
import { 
  federatedCctvService, 
  SMART_CAMERA_INTELLIGENCE_STEPS 
} from '../services/FederatedCctvService';
import { aiOrchestrator } from '../ai-agents/orchestrator/AIAgentOrchestrator';
import { ViewMode } from '../types';

interface FederatedCctvViewProps {
  onNavigate?: (view: ViewMode) => void;
}

export function FederatedCctvView({ onNavigate }: FederatedCctvViewProps) {
  const [sources] = useState(() => federatedCctvService.getAllSources());
  const [targetPlate, setTargetPlate] = useState('GJ05AB1234');
  const [isExecutingScenario, setIsExecutingScenario] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<any | null>(null);

  const targetCapacitySum = federatedCctvService.getTargetCapacitySum();
  const actualConnectedSum = federatedCctvService.getActualConnectedCameras();

  const handleTriggerScenario = async () => {
    setIsExecutingScenario(true);
    setScenarioResult(null);

    try {
      const res = await aiOrchestrator.triggerWantedVehicleScenario(targetPlate);
      setScenarioResult(res);
    } catch (err: any) {
      setScenarioResult({
        error: err.message || 'SCENARIO_EXECUTION_FAILED'
      });
    } finally {
      setIsExecutingScenario(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-[#05070c] text-zinc-100 font-sans h-full overflow-y-auto custom-scrollbar">
      {/* Top Banner */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded font-bold tracking-wider">
                UNIFIED INTELLIGENCE GRID V1.1
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                STATEWIDE FEDERATED CCTV ARCHITECTURE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-zinc-100 mt-1">
              FEDERATED CCTV INTELLIGENCE GRID
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
              One coordinated intelligence layer connecting fragmented municipal traffic, state highway, and city police CCTV environments without centralizing raw video or disrupting autonomous departmental workflows.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#090d16] border border-cyan-950/80 px-3 py-2 rounded">
              <div className="text-[9px] font-mono text-zinc-500 uppercase">Actual Connected</div>
              <div className="text-sm font-mono font-bold text-cyan-400">
                {actualConnectedSum} PHYSICAL CAMERAS
              </div>
            </div>
            <div className="bg-[#090d16] border border-cyan-950/80 px-3 py-2 rounded">
              <div className="text-[9px] font-mono text-zinc-500 uppercase">Target Grid Capacity</div>
              <div className="text-sm font-mono font-bold text-zinc-200">
                {targetCapacitySum.toLocaleString()} (SIMULATED)
              </div>
            </div>
          </div>
        </div>

        {/* Operational Problem & Guiding Directive */}
        <div className="mt-4 p-3.5 bg-cyan-950/20 border border-cyan-900/40 rounded-lg flex items-start gap-3">
          <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 leading-relaxed">
            <strong className="text-cyan-300 font-mono">CORE ARCHITECTURAL DIRECTIVE:</strong>{' '}
            "ONE PLATFORM. MANY EXISTING CCTV SYSTEMS. MANY EDGE NODES. MANY SPECIALIZED AI AGENTS. ONE COORDINATED INTELLIGENCE LAYER."
            <span className="text-zinc-500 block mt-1">
              Camera feeds remain governed by their native VMS and physical retention arrays. Edge Agents capture structured visual events, normalize optical metadata, and dispatch forensic events to the Central Intelligence Mesh.
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Demonstration Scenario Trigger Card */}
        <div className="bg-[#080d1a] border border-cyan-500/40 rounded-lg p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-950/80 border border-rose-700/60 rounded flex items-center justify-center text-rose-400">
                <Car size={20} />
              </div>
              <div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-rose-950 text-rose-300 border border-rose-800/60 rounded font-bold tracking-wider">
                  DETERMINISTIC DEMONSTRATION SCENARIO
                </span>
                <h2 className="text-base font-bold font-mono text-zinc-100 mt-0.5">
                  WANTED VEHICLE DETECTION & CORRIDOR TRACKING
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={targetPlate}
                  onChange={(e) => setTargetPlate(e.target.value.toUpperCase())}
                  placeholder="PLATE (e.g. GJ05AB1234)"
                  className="bg-[#05080f] border border-cyan-800/60 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 w-36 uppercase"
                />
              </div>

              <button
                onClick={handleTriggerScenario}
                disabled={isExecutingScenario}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-lg"
              >
                {isExecutingScenario ? (
                  <>
                    <Activity size={13} className="animate-spin" />
                    <span>ORCHESTRATING...</span>
                  </>
                ) : (
                  <>
                    <Play size={13} />
                    <span>EXECUTE SCENARIO</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 text-[11px] font-mono text-zinc-400 flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500">Pipeline Flow:</span>
            <span className="text-cyan-400 font-bold">CAM-007</span>
            <span>→</span>
            <span className="text-zinc-300">LICENSE PLATE DETECTED</span>
            <span>→</span>
            <span className="text-amber-400 font-bold">WATCHLIST MATCH</span>
            <span>→</span>
            <span className="text-emerald-400">EVIDENCE CAPTURE</span>
            <span>→</span>
            <span className="text-rose-400 font-bold">HIGH PRIORITY ALERT</span>
            <span>→</span>
            <span className="text-cyan-400">CAM-014 → CAM-023 → CAM-031</span>
            <span>→</span>
            <span className="text-purple-400 font-bold">VEHICLE JOURNEY (GOD'S EYE)</span>
          </div>

          {/* Scenario Execution Result */}
          {scenarioResult && (
            <div className="mt-4 p-3.5 bg-[#05080f] border border-cyan-900/60 rounded-lg">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>SCENARIO COMPLETED — {scenarioResult.disclaimer}</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  CORRELATION: {scenarioResult.correlationId?.slice(-12)}
                </span>
              </div>

              <div className="mt-2 text-xs font-mono text-zinc-300">
                {scenarioResult.summary}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                <span className="text-zinc-500">STAGES EXECUTED:</span>
                {scenarioResult.stagesExecuted?.map((st: string, idx: number) => (
                  <span key={idx} className="px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800/40 rounded">
                    {st}
                  </span>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">
                  Target: <strong className="text-cyan-300">{scenarioResult.targetPlate}</strong> • {scenarioResult.sightingsCount} Corridor Sightings Logged
                </span>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('challenge')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline cursor-pointer"
                  >
                    <span>View in God's Eye</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Federated Department Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Layers size={15} className="text-cyan-400" />
              <span>Departmental CCTV Sources & Multi-Cloud Infrastructure</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-500">
              Vendor-Agnostic Edge Normalization
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((src) => (
              <div 
                key={src.id}
                className="bg-[#080d16] border border-cyan-950/80 hover:border-cyan-800/60 rounded-lg p-4 transition-colors relative"
              >
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-cyan-950/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 rounded font-bold">
                        {src.departmentType}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        src.integrationStatus === 'CONFIGURED' 
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-800/40'
                          : src.integrationStatus === 'INTEGRATION_READY'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        STATUS: {src.integrationStatus}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold font-mono text-zinc-100 mt-1">
                      {src.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {src.jurisdiction}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                  <div className="p-2 bg-[#060912] rounded border border-cyan-950/40">
                    <div className="text-[9px] text-zinc-500 uppercase">Deployment Model</div>
                    <div className="text-zinc-200 font-bold truncate">{src.infrastructureModel}</div>
                  </div>
                  <div className="p-2 bg-[#060912] rounded border border-cyan-950/40">
                    <div className="text-[9px] text-zinc-500 uppercase">VMS Platform</div>
                    <div className="text-zinc-200 font-bold truncate">{src.vmsType}</div>
                  </div>
                  <div className="p-2 bg-[#060912] rounded border border-cyan-950/40">
                    <div className="text-[9px] text-zinc-500 uppercase">Target Camera Allocation</div>
                    <div className="text-cyan-400 font-bold">{src.targetCameraCapacity.toLocaleString()} (Simulated)</div>
                  </div>
                  <div className="p-2 bg-[#060912] rounded border border-cyan-950/40">
                    <div className="text-[9px] text-zinc-500 uppercase">Physical Connected</div>
                    <div className="text-emerald-400 font-bold">{src.actualConnectedCameras} Physical</div>
                  </div>
                </div>

                {/* Retention Policy Box */}
                <div className="mt-3 p-2.5 bg-[#05080f] border border-zinc-800/80 rounded text-[11px] font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Clock size={11} className="text-amber-400" />
                      <span>Video Retention Mandate:</span>
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      src.retentionPolicy.isRawVideoExpired 
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/40' 
                        : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                    }`}>
                      RAW VIDEO: {src.retentionPolicy.rawVideoRetentionDays} DAYS {src.retentionPolicy.isRawVideoExpired && '(EXPIRED)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    {src.retentionPolicy.policyNotes}
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Metadata Retention: <strong className="text-zinc-200">{src.retentionPolicy.eventMetadataRetentionYears} Years</strong></span>
                    <span>Evidence Seal: <strong className="text-emerald-400">{src.retentionPolicy.evidenceRetentionYears} Years (SHA-256)</strong></span>
                  </div>
                </div>

                <div className="mt-2 text-[9px] font-mono text-zinc-600">
                  {src.disclaimer}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Camera Intelligence Architecture ("Edge AI Enabled") */}
        <div className="bg-[#080d16] border border-cyan-950/80 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-950/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.2 bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded font-bold">
                  EDGE AI ENABLED ARCHITECTURE
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  ZERO REQUIRED HARDWARE REPLACEMENT
                </span>
              </div>
              <h2 className="text-base font-bold font-mono text-zinc-100 mt-1">
                SMART CAMERA CONCEPT — FROM LEGACY RTSP TO INTELLIGENCE
              </h2>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Existing cameras deployed across Gujarat do not require specialized onboard AI hardware. Standard RTSP/ONVIF streams are processed by co-located Edge Nodes. Edge Agents extract structured event metadata, while raw video retention follows local storage mandates.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
            {SMART_CAMERA_INTELLIGENCE_STEPS.map((step) => (
              <div 
                key={step.stepNumber}
                className="p-3 bg-[#060a12] border border-cyan-900/40 rounded flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded font-bold">
                      STEP {step.stepNumber}
                    </span>
                    {step.isEdgeAiEnabled && (
                      <span className="text-[8px] font-mono text-emerald-400 uppercase">
                        EDGE AI
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold font-mono text-zinc-200">
                    {step.label}
                  </h4>
                  <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                    {step.subLabel}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1.5 leading-snug">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-cyan-950/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
            <span>PIPELINE: CAMERA → EDGE AGENT → AI DETECTION → ANPR/SAFETY → UNIFIED EVENT → CENTRAL INTELLIGENCE → ALERT</span>
            <span className="text-cyan-400">EDGE AGENT PROTOCOL: V1.1 NORMALIZED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
