import React, { useState } from 'react';
import { 
  Sliders, 
  Upload, 
  Film, 
  Trash2, 
  FolderLock, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  ShieldCheck, 
  ScanFace,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

export interface AIToggleOptions {
  vehicleDetection: boolean;
  plateDetection: boolean;
  hsrpVerification: boolean;
  violationDetection: boolean;
  faceDetection: boolean; // Must be false by default
}

interface AIControlsQuickActionsProps {
  toggles: AIToggleOptions;
  onToggleChange: (key: keyof AIToggleOptions, value: boolean) => void;
  isAnalyzing: boolean;
  isPaused: boolean;
  onStartAnalysis: () => void;
  onPauseAnalysis: () => void;
  onOpenUploadDialog: () => void;
  onSelectSampleClip: () => void;
  onClearResults: () => void;
  onViewEvidenceVault: () => void;
  confidenceThreshold: number;
  onChangeConfidence: (val: number) => void;
  fps: number;
  onChangeFps: (val: number) => void;
  isAiAvailable?: boolean;
}

export const AIControlsQuickActions: React.FC<AIControlsQuickActionsProps> = ({
  toggles,
  onToggleChange,
  isAnalyzing,
  isPaused,
  onStartAnalysis,
  onPauseAnalysis,
  onOpenUploadDialog,
  onSelectSampleClip,
  onClearResults,
  onViewEvidenceVault,
  confidenceThreshold,
  onChangeConfidence,
  fps,
  onChangeFps,
  isAiAvailable = true
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      {/* 1. AI Analysis Controls Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sliders size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              AI Analysis Controls
            </h2>
          </div>

          {!isAiAvailable && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase">
              AI Unavailable
            </span>
          )}
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3">
          {/* Vehicle Detection */}
          <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer select-none">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800">
                  Vehicle Detection
                </div>
                <div className="text-[11px] text-slate-400">
                  YOLOv8 Edge Neural Model
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={toggles.vehicleDetection}
              onChange={(e) => onToggleChange('vehicleDetection', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
          </label>

          {/* Plate Detection & OCR */}
          <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer select-none">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800">
                  Plate Detection & OCR
                </div>
                <div className="text-[11px] text-slate-400">
                  Universal ANPR & Character Read
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={toggles.plateDetection}
              onChange={(e) => onToggleChange('plateDetection', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
          </label>

          {/* HSRP Verification */}
          <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer select-none">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800">
                  HSRP Verification
                </div>
                <div className="text-[11px] text-slate-400">
                  Laser PIN & Hologram Audit
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={toggles.hsrpVerification}
              onChange={(e) => onToggleChange('hsrpVerification', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
          </label>

          {/* Violation Detection */}
          <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer select-none">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800">
                  Traffic Violation Detection
                </div>
                <div className="text-[11px] text-slate-400">
                  No-Helmet, Triple Riding, Wrong-Way
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={toggles.violationDetection}
              onChange={(e) => onToggleChange('violationDetection', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
          </label>

          {/* Face Detection - OFF by default */}
          <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer select-none opacity-80 hover:opacity-100">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800">
                  Face Detection
                </div>
                <div className="text-[11px] text-slate-400">
                  Watchlist Match (BSA 2023 Consent)
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={toggles.faceDetection}
              onChange={(e) => onToggleChange('faceDetection', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
          </label>
        </div>

        {/* Expandable Advanced Settings */}
        <div className="border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-1.5 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Cpu size={14} className="text-slate-400" />
              Advanced Settings
            </span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-3 pb-1 text-xs">
              {/* Confidence Threshold */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Confidence Threshold</span>
                  <span className="font-bold text-slate-900">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => onChangeConfidence(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Sampling Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Sampling Rate</span>
                  <span className="font-bold text-slate-900">{fps} FPS</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[0.5, 1.0, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => onChangeFps(rate)}
                      className={`py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        fps === rate
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {rate} FPS
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Run / Pause Button */}
        <div className="pt-1">
          {isAnalyzing ? (
            <button
              type="button"
              onClick={onPauseAnalysis}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Pause size={15} />
              <span>{isPaused ? 'Resume Analysis' : 'Pause Analysis'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartAnalysis}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play size={15} className="fill-white" />
              <span>Run Analysis</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Quick Actions Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {/* Upload Video */}
          <button
            type="button"
            onClick={onOpenUploadDialog}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer group flex flex-col items-start gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Upload size={14} />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              Upload Video
            </span>
          </button>

          {/* Select Sample */}
          <button
            type="button"
            onClick={onSelectSampleClip}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer group flex flex-col items-start gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Film size={14} />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              Select Sample
            </span>
          </button>

          {/* Clear Results */}
          <button
            type="button"
            onClick={onClearResults}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer group flex flex-col items-start gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Trash2 size={14} />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              Clear Results
            </span>
          </button>

          {/* View Evidence */}
          <button
            type="button"
            onClick={onViewEvidenceVault}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer group flex flex-col items-start gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FolderLock size={14} />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              View Evidence
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
