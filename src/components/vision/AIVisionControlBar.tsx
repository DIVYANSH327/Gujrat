import React from 'react';
import { 
  Camera as CameraIcon, 
  Upload, 
  Film, 
  Play, 
  Pause, 
  Square, 
  ChevronDown, 
  Activity, 
  Sparkles,
  CheckCircle2,
  Video,
  Smartphone
} from 'lucide-react';
import { SentinelRawCamera } from '../../data/sentinelCatalogue';

export type VisionSourceType = 'LIVE_FEED' | 'MOBILE_PATROL' | 'UPLOAD_VIDEO' | 'SAMPLE_CLIP';

interface AIVisionControlBarProps {
  cameras: SentinelRawCamera[];
  selectedCameraId: string;
  onSelectCamera: (camId: string) => void;
  sourceType: VisionSourceType;
  onSelectSourceType: (type: VisionSourceType) => void;
  isAiEnabled: boolean;
  onToggleAi: (enabled: boolean) => void;
  isAnalyzing: boolean;
  isPaused: boolean;
  onStartAnalysis: () => void;
  onPauseAnalysis: () => void;
  onStopAnalysis: () => void;
  onOpenUploadDialog: () => void;
}

export const AIVisionControlBar: React.FC<AIVisionControlBarProps> = ({
  cameras,
  selectedCameraId,
  onSelectCamera,
  sourceType,
  onSelectSourceType,
  isAiEnabled,
  onToggleAi,
  isAnalyzing,
  isPaused,
  onStartAnalysis,
  onPauseAnalysis,
  onStopAnalysis,
  onOpenUploadDialog,
}) => {
  const selectedCamera = cameras.find(c => c.id === selectedCameraId) || cameras[0] || { id: 'cam14', name: '14 Delight RLVD (Ashram Road)' };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* 1. Camera Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-col">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Select Camera
          </label>
          <div className="relative">
            <select
              value={selectedCameraId}
              onChange={(e) => onSelectCamera(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 font-semibold text-xs sm:text-sm rounded-xl py-2 pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer min-w-[220px]"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.id.toUpperCase()} — {cam.name}
                </option>
              ))}
            </select>
            <div className="absolute left-2.5 top-2.5 text-slate-500 pointer-events-none">
              <CameraIcon size={16} />
            </div>
            <div className="absolute right-2.5 top-3 text-slate-400 pointer-events-none">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* Camera Live Status Badge */}
        <div className="hidden sm:flex items-center self-end mb-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* 2. Video Source Segmented Control */}
      <div className="flex flex-col">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Video Source
        </label>
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onSelectSourceType('LIVE_FEED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sourceType === 'LIVE_FEED'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Video size={14} />
            <span>Live Feed</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSourceType('MOBILE_PATROL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sourceType === 'MOBILE_PATROL'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Smartphone size={14} />
            <span>Patrol Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectSourceType('UPLOAD_VIDEO');
              onOpenUploadDialog();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sourceType === 'UPLOAD_VIDEO'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Upload size={14} />
            <span>Upload Video</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSourceType('SAMPLE_CLIP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sourceType === 'SAMPLE_CLIP'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Synthetic Demo Traffic Clip"
          >
            <Film size={14} />
            <span>Sample Clip</span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-200">
              DEMO
            </span>
          </button>
        </div>
      </div>

      {/* 3. AI Analysis Toggle & Start Button */}
      <div className="flex items-center gap-3 sm:gap-4 self-start lg:self-center">
        {/* AI Toggle */}
        <div className="flex flex-col">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            AI Analysis
          </label>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onToggleAi(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isAiEnabled
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ON
            </button>
            <button
              type="button"
              onClick={() => onToggleAi(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isAiEnabled
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OFF
            </button>
          </div>
        </div>

        {/* Primary Analysis Control Button */}
        <div className="flex flex-col">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 opacity-0 pointer-events-none">
            Action
          </label>
          {isAnalyzing ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={isPaused ? onStartAnalysis : onPauseAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                type="button"
                onClick={onStopAnalysis}
                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl transition-colors cursor-pointer"
                title="Stop Analysis"
              >
                <Square size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onStartAnalysis}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Play size={16} className="fill-white" />
              <span>Start Analysis</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
