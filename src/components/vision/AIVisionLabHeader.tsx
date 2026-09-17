import React from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  Layers, 
  Cpu, 
  FileCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Cloud, 
  Radio
} from 'lucide-react';
import { ViewMode } from '../../types';

interface AIVisionLabHeaderProps {
  onNavigate?: (view: ViewMode) => void;
  aiStatus?: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  isCloudConnected?: boolean;
}

export const AIVisionLabHeader: React.FC<AIVisionLabHeaderProps> = ({
  onNavigate,
  aiStatus = 'ONLINE',
  isCloudConnected = true
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Left: Lab Identity */}
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
          <FlaskConical size={24} className="stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Real AI Vision Test Lab
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles size={12} />
              AI LAB
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI System Online
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Analyze real camera feeds, detect vehicles and plates, verify HSRP, and preserve verified electronic evidence.
          </p>
        </div>
      </div>

      {/* Right: Small Capability Badges & Mesh Link */}
      <div className="flex items-center gap-2 flex-wrap lg:justify-end">
        {/* Capability Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200" title="Edge Object Detection & Tracking">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            YOLOv8
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200" title="Laser PIN & Hologram Verification">
            <ShieldCheck size={12} className="text-indigo-600" />
            HSRP
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200" title="Universal Plate Character Extraction">
            <FileCheck size={12} className="text-cyan-600" />
            PLATE OCR
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200" title="Multi-frame temporal voting & quality engine">
            <Layers size={12} className="text-purple-600" />
            MULTI-FRAME
          </span>
        </div>

        {/* AI Agent Mesh Link Button */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('ai_mesh')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer shadow-2xs"
            title="Open AI Agent Mesh Dashboard"
          >
            <Cpu size={13} />
            <span>AI AGENTS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
          </button>
        )}
      </div>
    </div>
  );
};
