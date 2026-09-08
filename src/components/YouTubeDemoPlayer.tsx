import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, ExternalLink, Cpu, Shield, Sparkles } from 'lucide-react';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl, isValidYouTubeVideoId } from '../services/YouTubeDemoService';
import { SyntheticDetectionBox } from '../services/AIVisionAgent';

export interface YouTubeDemoPlayerProps {
  videoId: string;
  cameraId: string;
  title: string;
  locationLabel?: string;
  district?: string;
  isLive?: boolean;
  aspectRatio?: string;
  showOverlay?: boolean;
  className?: string;
  onSelect?: () => void;
  interactive?: boolean;
  onRetry?: () => void;
  compact?: boolean;
}

export const YouTubeDemoPlayer: React.FC<YouTubeDemoPlayerProps> = ({
  videoId,
  cameraId,
  title,
  locationLabel,
  district: _district,
  isLive: _isLive = true,
  aspectRatio = '16/9',
  showOverlay = true,
  className = '',
  onSelect,
  interactive = false,
  onRetry,
  compact = false
}) => {
  const [istTime, setIstTime] = useState<string>('');
  const [isFailed, setIsFailed] = useState<boolean>(false);

  // IST Clock for tactical timestamp overlay
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setIstTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const validId = isValidYouTubeVideoId(videoId);
  const embedUrl = validId ? getYouTubeEmbedUrl(videoId) : '';

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFailed(false);
    if (onRetry) onRetry();
  };

  return (
    <div
      onClick={onSelect}
      className={`relative group bg-[#06080d] border border-cyan-950/60 rounded overflow-hidden flex flex-col ${
        interactive ? 'cursor-pointer hover:border-cyan-500/60 transition-all shadow-md hover:shadow-cyan-950/30' : ''
      } ${className}`}
      style={{ aspectRatio: compact ? undefined : aspectRatio }}
    >
      {/* Fallback / Error State */}
      {!validId || isFailed ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#07090f] p-4 text-center select-none">
          <div className="w-10 h-10 rounded-full bg-amber-950/40 border border-amber-800/50 flex items-center justify-center text-amber-400 mb-2">
            <AlertCircle size={20} />
          </div>
          <div className="text-xs font-mono font-bold text-amber-300 tracking-wider">
            YOUTUBE EMBED UNAVAILABLE
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">
            SOURCE ID: {cameraId} • STATUS: PUBLIC DISPLAY ONLY
          </div>
          <div className="text-[10px] font-mono text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
            {!validId
              ? `Configured ID "${videoId || 'EMPTY'}" is not a valid 11-character YouTube video ID.`
              : 'Playback may be restricted by the YouTube video owner. Open the source on YouTube to verify.'}
          </div>
          <div className="flex items-center gap-2 mt-3 pointer-events-auto">
            {validId && (
              <a
                href={getYouTubeWatchUrl(videoId)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[10px] font-mono flex items-center gap-1.5 transition-colors shadow"
              >
                <ExternalLink size={11} /> OPEN ON YOUTUBE
              </a>
            )}
            <button
              onClick={handleRetry}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={11} /> RETRY
            </button>
          </div>
        </div>
      ) : (
        /* Standard YouTube Embed Layer */
        <div className="relative w-full h-full bg-black overflow-hidden flex-1 pointer-events-auto">
          <iframe
            src={embedUrl}
            title={`${cameraId} - ${title}`}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setIsFailed(true)}
          />
        </div>
      )}

      {/* Honest Public Display Overlay Frame */}
      {showOverlay && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 select-none z-10">
          {/* Top Bar Overlay */}
          <div className="flex items-center justify-between gap-2 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-1.5 -m-2 mb-0">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-black/90 border border-cyan-500/40 rounded text-[10px] font-mono font-black text-cyan-300 tracking-wider">
                {cameraId}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
                  PUBLIC DISPLAY ONLY
                </span>
              </div>
              <span className="hidden sm:inline-flex text-[9px] font-mono font-bold text-rose-300/90 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-800/50 uppercase">
                NOT AI FRAME INPUT
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-right">
              <span className="text-[8px] font-mono font-bold text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-900/50 uppercase">
                NO FRAME ACCESS
              </span>
              <span className="text-[8px] font-mono font-bold text-zinc-400 bg-black/80 px-1.5 py-0.5 rounded border border-zinc-800 uppercase">
                POLICE CCTV: NO
              </span>
            </div>
          </div>

          {/* Tactical Crosshair / Corner Reticles */}
          <div className="flex-1 relative flex items-center justify-center opacity-20 pointer-events-none">
            <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-cyan-400/60"></div>
            <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-cyan-400/60"></div>
            <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-cyan-400/60"></div>
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-cyan-400/60"></div>
          </div>

          {/* Bottom Bar Overlay */}
          <div className="flex items-center justify-between gap-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-1.5 -m-2 mt-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-semibold text-zinc-400 tracking-wider bg-black/90 px-1.5 py-0.5 rounded border border-zinc-800">
                SOURCE: YOUTUBE DEMO
              </span>
              {locationLabel && (
                <span className="text-[9px] font-mono text-zinc-300 hidden sm:inline-block truncate max-w-[160px]">
                  {locationLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-right font-mono text-[9px] font-bold text-cyan-300 bg-black/90 px-1.5 py-0.5 rounded border border-cyan-900/50">
              <span>{istTime || '00:00:00'}</span>
              <span className="text-zinc-500 font-normal">IST</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


