import React, { useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Camera as CameraIcon, 
  Crop, 
  RefreshCw,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { RealAIDetection } from '../../services/ai/RealAIEvidencePipeline';
import { RealVisionDetection } from '../../services/ai/IAIVisionAgent';

export interface RecentFrameItem {
  id: string;
  timestamp: string;
  timeLabel: string;
  thumbnailUrl: string;
  detectionsCount: number;
  qualityScore?: number;
  isViolation?: boolean;
}

interface AICameraFeedViewProps {
  cameraName: string;
  cameraLocation: string;
  isLive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  detections: (RealAIDetection | RealVisionDetection)[];
  recentFrames: RecentFrameItem[];
  selectedFrameId: string | null;
  onSelectFrame: (frame: RecentFrameItem) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onTakeSnapshot: () => void;
  resolutionLabel?: string;
  fpsLabel?: number | string;
  latencyMs?: number;
  isCameraActive: boolean;
  onStartCamera: () => void;
  error?: string | null;
  onInspectEvidence?: (frame: RecentFrameItem) => void;
}

export const AICameraFeedView: React.FC<AICameraFeedViewProps> = ({
  cameraName,
  cameraLocation,
  isLive,
  videoRef,
  canvasRef,
  detections,
  recentFrames,
  selectedFrameId,
  onSelectFrame,
  isPlaying,
  onTogglePlay,
  isMuted,
  onToggleMute,
  playbackSpeed,
  onChangeSpeed,
  onTakeSnapshot,
  resolutionLabel = '4K',
  fpsLabel = 12.5,
  latencyMs = 142,
  isCameraActive,
  onStartCamera,
  error,
  onInspectEvidence
}) => {
  const filmstripScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollFilmstrip = (direction: 'left' | 'right') => {
    if (filmstripScrollRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      filmstripScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (video) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col space-y-4">
      {/* 1. Card Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Camera Feed
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold text-[11px]">
            {resolutionLabel}
          </span>
          <span className="hidden sm:inline-block">
            {fpsLabel} FPS
          </span>
          <span className="hidden md:inline-block text-slate-400">•</span>
          <span className="hidden md:inline-block">
            {latencyMs}ms latency
          </span>
        </div>
      </div>

      {/* 2. Video Area with Overlays (16:9 Aspect Ratio) */}
      <div className="relative bg-slate-950 aspect-video rounded-xl overflow-hidden shadow-inner flex items-center justify-center group">
        {/* Top Info Bar inside Video */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-wide drop-shadow">
              {cameraName} | {cameraLocation}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-300 drop-shadow">
              {new Date().toISOString().replace('T', ' ').slice(0, 19)}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white">
              {resolutionLabel}
            </span>
          </div>
        </div>

        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-contain bg-black"
        />

        {/* Real Canvas Overlay for Bounding Boxes */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Offline / Connect Prompt if not active */}
        {!isCameraActive && (
          <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <CameraIcon size={24} />
            </div>
            <div className="text-sm font-bold text-white">
              CAMERA READY TO INITIALIZE
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Start live camera feed or load video source to activate real-time YOLOv8 object detection, plate OCR, and HSRP verification.
            </p>
            <button
              type="button"
              onClick={onStartCamera}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Play size={14} className="fill-white" />
              <span>Initialize Camera Feed</span>
            </button>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="absolute bottom-16 left-4 right-4 z-20 p-3 bg-rose-900/90 border border-rose-700 text-rose-100 rounded-xl text-xs flex items-center gap-2 shadow-lg backdrop-blur-xs">
            <AlertCircle size={16} className="shrink-0 text-rose-300" />
            <span>{error}</span>
          </div>
        )}

        {/* Video Bottom Floating Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Left Controls: Play/Pause, Mute, Speed */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="fill-white" />}
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* Playback Speed */}
            <div className="relative">
              <select
                value={playbackSpeed}
                onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
                className="appearance-none bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold rounded-lg px-2 py-1 pr-5 cursor-pointer focus:outline-none border-0"
              >
                <option value={0.5} className="bg-slate-900 text-white">0.5x</option>
                <option value={1.0} className="bg-slate-900 text-white">1.0x</option>
                <option value={2.0} className="bg-slate-900 text-white">2.0x</option>
              </select>
              <span className="absolute right-1.5 top-1.5 text-[9px] pointer-events-none text-slate-300">▾</span>
            </div>
          </div>

          {/* Right Controls: Snapshot & Fullscreen */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onTakeSnapshot}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Capture High-Res Evidence Snapshot"
            >
              <Crop size={15} />
            </button>

            <button
              type="button"
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Recent Frames Filmstrip */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Recent Frames
            </span>
            <span className="text-[11px] text-slate-400">
              ({recentFrames.length} captured)
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollFilmstrip('left')}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Previous Frames"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => scrollFilmstrip('right')}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Next Frames"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Horizontal Filmstrip Carousel */}
        <div
          ref={filmstripScrollRef}
          className="flex items-center gap-2.5 overflow-x-auto pb-1.5 custom-scrollbar scroll-smooth"
        >
          {recentFrames.length === 0 ? (
            <div className="w-full py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Start analysis to capture real-time analytical frames.
            </div>
          ) : (
            recentFrames.map((frame) => {
              const isSelected = selectedFrameId === frame.id;

              return (
                <div
                  key={frame.id}
                  onClick={() => onSelectFrame(frame)}
                  className={`relative shrink-0 w-24 sm:w-28 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="aspect-video bg-slate-900 relative">
                    <img
                      src={frame.thumbnailUrl}
                      alt={`Frame ${frame.timeLabel}`}
                      className="w-full h-full object-cover"
                    />
                    {frame.isViolation && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-white" />
                    )}
                  </div>
                  <div className={`p-1 text-center text-[10px] font-mono font-semibold transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 group-hover:bg-slate-100'
                  }`}>
                    {frame.timeLabel}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
