import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  ExternalLink,
  PlusCircle,
  Check,
  Zap,
  Radio,
  AlertTriangle,
  RotateCw,
  Eye,
  Activity
} from 'lucide-react';
import { SentinelCameraCatalogueItem } from '../types';

interface SentinelThumbnailTileProps {
  camera: SentinelCameraCatalogueItem;
  isSelected?: boolean;
  isImported?: boolean;
  pollIntervalMs?: number;
  isPaused?: boolean;
  onSelect?: (camera: SentinelCameraCatalogueItem) => void;
  onOpenInCamerasView?: (camera: SentinelCameraCatalogueItem) => void;
  onImportToLive?: (camera: SentinelCameraCatalogueItem) => void;
  className?: string;
}

export const SentinelThumbnailTile: React.FC<SentinelThumbnailTileProps> = ({
  camera,
  isSelected = false,
  isImported = false,
  pollIntervalMs = 3500,
  isPaused = false,
  onSelect,
  onOpenInCamerasView,
  onImportToLive,
  className = ''
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(
    `/api/sentinel/thumbnail/${camera.id.toLowerCase()}`
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Compute a deterministic stagger offset (0-2500ms) based on camera id
  const staggerOffsetMs = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < camera.id.length; i++) {
      hash = (hash << 5) - hash + camera.id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 2500;
  }, [camera.id]);

  // Preload and swap thumbnail smoothly without flickering
  useEffect(() => {
    isMountedRef.current = true;
    if (isPaused) return;

    let pollTimeout: any = null;
    let intervalTimer: any = null;

    const fetchNextFrame = () => {
      if (!isMountedRef.current || isPaused) return;

      const nextUrl = `/api/sentinel/thumbnail/${camera.id.toLowerCase()}?t=${Date.now()}`;
      const img = new Image();

      img.onload = () => {
        if (!isMountedRef.current) return;
        setCurrentImageUrl(nextUrl);
        setIsLoading(false);
        setHasError(false);
        setLastRefreshedAt(Date.now());
      };

      img.onerror = () => {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        // Do not immediately flash error if previous frame was good
        setHasError(true);
      };

      img.src = nextUrl;
    };

    // Stagger first query to prevent 30 parallel socket requests
    pollTimeout = setTimeout(() => {
      fetchNextFrame();
      intervalTimer = setInterval(fetchNextFrame, pollIntervalMs);
    }, staggerOffsetMs);

    return () => {
      isMountedRef.current = false;
      if (pollTimeout) clearTimeout(pollTimeout);
      if (intervalTimer) clearInterval(intervalTimer);
    };
  }, [camera.id, pollIntervalMs, isPaused, staggerOffsetMs]);

  // Track seconds since last refresh
  useEffect(() => {
    const ticker = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastRefreshedAt) / 1000);
      setSecondsAgo(diffSec);
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastRefreshedAt]);

  return (
    <div
      id={`sentinel-tile-${camera.id}`}
      className={`relative flex flex-col bg-slate-950 rounded-2xl border transition-all duration-200 overflow-hidden group select-none shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-blue-500/20'
          : 'border-slate-800/80 hover:border-slate-700'
      } ${className}`}
    >
      {/* Aspect Ratio Video / Thumbnail Area */}
      <div
        className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer"
        onClick={() => onSelect?.(camera)}
      >
        {/* Render Image */}
        <img
          src={currentImageUrl}
          alt={camera.name || camera.id}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading && !hasError ? 'opacity-60' : 'opacity-100'
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%23090d16"/><text x="160" y="90" fill="%2364748b" font-size="12" font-family="sans-serif" text-anchor="middle">Feed Standby</text><text x="160" y="110" fill="%23475569" font-size="10" font-family="sans-serif" text-anchor="middle">Tier 1 Polling Active</text></svg>';
          }}
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur-xs text-white border border-slate-700/60 uppercase">
              {camera.id.toUpperCase()}
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-950/70 backdrop-blur-xs text-slate-300 border border-slate-800">
              {camera.district || 'Gujarat'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isSelected ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs border border-blue-400">
                <Radio size={10} className="animate-pulse" />
                TIER 2 ACTIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono bg-slate-950/80 backdrop-blur-xs text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>TIER 1 • {secondsAgo === 0 ? 'LIVE' : `${secondsAgo}s`}</span>
              </span>
            )}
          </div>
        </div>

        {/* Hover / Click CTA Overlay */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(camera);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer min-h-[38px]"
          >
            <Maximize2 size={14} />
            <span>Promote to Tier 2 (HLS)</span>
          </button>

          {onOpenInCamerasView && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInCamerasView(camera);
              }}
              className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye size={13} className="text-blue-400" />
              <span>Open in Cameras View</span>
            </button>
          )}
        </div>

        {/* Low-Bandwidth Watermark */}
        <div className="absolute bottom-2 right-2 pointer-events-none z-10">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-xs border border-slate-800/80">
            {camera.codec} • {camera.resolution}
          </span>
        </div>
      </div>

      {/* Card Footer: Metadata and Quick Actions */}
      <div className="px-3 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
            {camera.name || camera.id}
          </p>
          <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
            {camera.location}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onOpenInCamerasView && (
            <button
              type="button"
              title="Open in Cameras View"
              onClick={() => onOpenInCamerasView(camera)}
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <ExternalLink size={13} />
            </button>
          )}

          {onImportToLive && (
            <button
              type="button"
              title="Import into Command Center Live Feeds"
              onClick={() => onImportToLive(camera)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isImported
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                  : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30'
              }`}
            >
              {isImported ? <Check size={13} /> : <PlusCircle size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
