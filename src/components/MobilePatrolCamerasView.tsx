/**
 * MobilePatrolCamerasView Component
 * Gujarat Police AI CCTV Intelligence Platform — Sentinel Grid
 * 
 * Full-screen, mobile-responsive Patrol Mode Dashboard in the new White Officer-First UI theme.
 * Displays active Mobile Vision Unit status, live patrol feeds, AI detections,
 * and captured event summaries.
 */

import React, { useState } from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  MapPin, 
  Radio, 
  Activity, 
  Sparkles, 
  Scale, 
  Compass, 
  Cpu, 
  Layers, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { ViewMode } from '../types';
import { MobilePatrolCamerasSection } from './vision/MobilePatrolCamerasSection';

interface MobilePatrolCamerasViewProps {
  onNavigate?: (view: ViewMode) => void;
}

export const MobilePatrolCamerasView: React.FC<MobilePatrolCamerasViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* 1. VIEW TOP BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.('real_ai_test_lab')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to AI Vision Lab"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-slate-900">
                Mobile Patrol Operations & Dashcam Intelligence
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-lg uppercase">
                PATROL MODE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live mobile video stream, automated edge AI perception, and Section 63 BSA 2023 forensic evidence capture
            </p>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => onNavigate?.('real_ai_test_lab')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            AI Vision Lab
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('alerts')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Evidence Vault
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('geospatial_map')}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <MapPin size={13} />
            <span>GIS Map</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY MOBILE PATROL COMPONENT */}
      <MobilePatrolCamerasSection onNavigate={onNavigate} />
    </div>
  );
};
