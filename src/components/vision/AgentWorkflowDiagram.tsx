/**
 * AgentWorkflowDiagram.tsx
 * Live Agent Workflow Diagram for Police Command Operations
 * Gujarat Police AI CCTV Intelligence Platform — Sentinel Grid
 */

import React from 'react';
import { 
  Camera, 
  Car, 
  Scan, 
  Sparkles, 
  FileCheck, 
  Layers, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  agent: string;
  desc: string;
  status: 'ACTIVE' | 'IDLE' | 'STANDBY';
  latencyMs: number;
  icon: React.ReactNode;
}

interface AgentWorkflowDiagramProps {
  onSelectAgent?: (agentName: string) => void;
  selectedAgentName?: string | null;
  activeJobsCount?: number;
}

export const AgentWorkflowDiagram: React.FC<AgentWorkflowDiagramProps> = ({
  onSelectAgent,
  selectedAgentName,
  activeJobsCount = 2
}) => {
  const steps: WorkflowStep[] = [
    {
      id: 'step-1',
      title: 'CAMERA INPUT',
      agent: 'SentinelEdgeIngestion',
      desc: '30 Live Nodes / 80k Target',
      status: 'ACTIVE',
      latencyMs: 12,
      icon: <Camera size={16} />
    },
    {
      id: 'step-2',
      title: 'VEHICLE VISION',
      agent: 'VehicleVisionAgent',
      desc: 'YOLOv8 Class & Trajectory',
      status: 'ACTIVE',
      latencyMs: 145,
      icon: <Car size={16} />
    },
    {
      id: 'step-3',
      title: 'PLATE DETECTION',
      agent: 'PlateDetectionAgent',
      desc: 'Universal Indian Plate Crops',
      status: 'ACTIVE',
      latencyMs: 160,
      icon: <Scan size={16} />
    },
    {
      id: 'step-4',
      title: 'IMAGE ENHANCEMENT',
      agent: 'PlateEnhancementAgent',
      desc: 'Super-Res, De-Glare, Rectify',
      status: 'ACTIVE',
      latencyMs: 210,
      icon: <Sparkles size={16} />
    },
    {
      id: 'step-5',
      title: 'HSRP / OCR',
      agent: 'HSRPOcrAgent',
      desc: 'Anti-Hallucination OCR',
      status: 'ACTIVE',
      latencyMs: 240,
      icon: <FileCheck size={16} />
    },
    {
      id: 'step-6',
      title: 'MULTI-FRAME VERIF',
      agent: 'MultiFrameAgreementAgent',
      desc: 'Temporal Agreement Consensus',
      status: 'ACTIVE',
      latencyMs: 120,
      icon: <Layers size={16} />
    },
    {
      id: 'step-7',
      title: 'EVIDENCE',
      agent: 'EvidenceIntegrityAgent',
      desc: 'SHA-256 Dual Cryptographic Record',
      status: 'ACTIVE',
      latencyMs: 95,
      icon: <ShieldCheck size={16} />
    },
    {
      id: 'step-8',
      title: 'ALERT & INVESTIGATION',
      agent: 'AlertDecisionAgent',
      desc: 'Rule Triage & Case Linking',
      status: 'ACTIVE',
      latencyMs: 65,
      icon: <AlertTriangle size={16} />
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Cpu size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">LIVE AGENT WORKFLOW</h3>
            <p className="text-xs text-slate-500">End-to-End Decoupled Pipeline Architecture</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
            {activeJobsCount} Active Pipeline Jobs
          </span>
        </div>
      </div>

      {/* Responsive Workflow Chain */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const isSelected = selectedAgentName === step.agent;
          return (
            <div
              key={step.id}
              onClick={() => onSelectAgent && onSelectAgent(step.agent)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">0{idx + 1}</span>
                    <div className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                    }`}>
                      {step.icon}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    LIVE
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight">{step.title}</h4>
                <div className="text-[11px] font-medium text-blue-700 mt-0.5">{step.agent}</div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{step.desc}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>Latency</span>
                <span className="font-mono font-semibold text-slate-800">{step.latencyMs} ms</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Universal plate capture active across all video sources: HSRP, Standard, Motorcycle & Commercial.</span>
        </div>
        <span className="font-semibold text-slate-900 font-mono text-[11px]">BSA 2023 SEC-63 COMPLIANT</span>
      </div>
    </div>
  );
};
