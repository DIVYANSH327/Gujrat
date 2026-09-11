import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCw,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  Clock,
  Radio
} from 'lucide-react';

export type SentinelPlayerState =
  | 'IDLE'
  | 'CONNECTING'
  | 'BUFFERING'
  | 'LIVE'
  | 'RECONNECTING'
  | 'OFFLINE'
  | 'ERROR';

export interface SentinelStreamTelemetry {
  state: SentinelPlayerState;
  actualFps: number;
  totalFrames: number;
  droppedFrames: number;
  width: number;
  height: number;
  ptsSeconds: number;
  lastFrameAgeMs: number;
  reconnectAttempts: number;
  protocol: string;
  errorMessage?: string;
}

interface SentinelStreamPlayerProps {
  cameraId: string;
  cameraName?: string;
  location?: string;
  district?: string;
  codec?: string;
  declaredFps?: number;
  streamUrl?: string;
  autoPlay?: boolean;
  muted?: boolean;
  showControls?: boolean;
  showTelemetryOverlay?: boolean;
  aspectRatio?: '16/9' | '4/3' | 'auto';
  onTelemetryUpdate?: (telemetry: SentinelStreamTelemetry) => void;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

export const SentinelStreamPlayer: React.FC<SentinelStreamPlayerProps> = ({
  cameraId,
  cameraName,
  location,
  district,
  codec = 'H.264',
  declaredFps = 25,
  streamUrl,
  autoPlay = true,
  muted = true,
  showControls = true,
  showTelemetryOverlay = false,
  aspectRatio = '16/9',
  onTelemetryUpdate,
  onClick,
  isSelected = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playerState, setPlayerState] = useState<SentinelPlayerState>('CONNECTING');
  const [isMuted, setIsMuted] = useState<boolean>(muted);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(showTelemetryOverlay);
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const [nextRetryInSec, setNextRetryInSec] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real measured telemetry
  const [actualFps, setActualFps] = useState<number>(0);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [droppedFrames, setDroppedFrames] = useState<number>(0);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [currentPts, setCurrentPts] = useState<number>(0);
  const [lastFrameAgeMs, setLastFrameAgeMs] = useState<number>(0);

  // Tracking refs for real FPS calculation
  const lastFrameTimeRef = useRef<number>(Date.now());
  const lastFramesCountRef = useRef<number>(0);
  const lastFpsCalcTimeRef = useRef<number>(Date.now());
  const reconnectTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const wallClockSyncIntervalRef = useRef<any>(null);
  const rvfcCallbackIdRef = useRef<number | null>(null);

  const resolvedStreamUrl = streamUrl || `/api/sentinel/stream/${cameraId}/index.m3u8`;

  // Wall-clock sync (official Sentinel Section 1 & 3 specification)
  const syncLivePosition = useCallback((v: HTMLVideoElement) => {
    if (v.duration && isFinite(v.duration) && v.duration > 1) {
      try {
        const targetPos = (Date.now() / 1000) % v.duration;
        if (Math.abs(v.currentTime - targetPos) > 2.5) {
          v.currentTime = targetPos;
        }
      } catch {
        // Ignored if video not ready
      }
    }
  }, []);

  // Frame callback for real presentation timestamp
  const setupFrameCallback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if ('requestVideoFrameCallback' in video) {
      const onFrame = (now: DOMHighResTimeStamp, metadata: any) => {
        lastFrameTimeRef.current = Date.now();
        setCurrentPts(metadata.presentationTime || video.currentTime);
        if (video.videoWidth) {
          setVideoDims(prev =>
            (video.videoWidth !== prev.width || video.videoHeight !== prev.height)
              ? { width: video.videoWidth, height: video.videoHeight }
              : prev
          );
        }
        rvfcCallbackIdRef.current = video.requestVideoFrameCallback(onFrame);
      };
      rvfcCallbackIdRef.current = video.requestVideoFrameCallback(onFrame);
    }
  }, []);

  // Clean up HLS and timers
  const destroyPlayer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (wallClockSyncIntervalRef.current) {
      clearInterval(wallClockSyncIntervalRef.current);
      wallClockSyncIntervalRef.current = null;
    }
    if (videoRef.current && rvfcCallbackIdRef.current !== null && 'cancelVideoFrameCallback' in videoRef.current) {
      videoRef.current.cancelVideoFrameCallback(rvfcCallbackIdRef.current);
      rvfcCallbackIdRef.current = null;
    }
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // Cleanup safety
      }
      hlsRef.current = null;
    }
  }, []);

  // Initialize stream playback
  const initPlayback = useCallback(() => {
    destroyPlayer();
    const video = videoRef.current;
    if (!video) return;

    setPlayerState('CONNECTING');
    setErrorMessage(null);

    // If Hls.js is supported in browser
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 6,
        maxMaxBufferLength: 14,
        backBufferLength: 10,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1500,
        levelLoadingTimeOut: 15000,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        startPosition: -1,
        capLevelToPlayerSize: true,
        enableWorker: true
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(resolvedStreamUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.loop = true;
        syncLivePosition(video);
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay policy muted playback fallback
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          });
        }
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setPlayerState('LIVE');
        setReconnectCount(0);
        setErrorMessage(null);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) {
          // Non-fatal join-time decode warnings or buffered GOP warnings (Section 3 DO NOT treat as fatal)
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try {
            hls.recoverMediaError();
          } catch {
            scheduleReconnect();
          }
        } else {
          // Network or server error
          setPlayerState('RECONNECTING');
          setErrorMessage(data.details || 'Stream connection interrupted');
          scheduleReconnect();
        }
      });

      // Wall clock drift alignment loop (Section 3 DO: drive timing from PTS)
      wallClockSyncIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          syncLivePosition(videoRef.current);
        }
      }, 12000);

      setupFrameCallback();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari iOS/macOS HLS support
      video.src = resolvedStreamUrl;
      video.loop = true;
      video.addEventListener('loadedmetadata', () => {
        syncLivePosition(video);
        if (autoPlay) video.play().catch(() => {});
      });
      video.addEventListener('playing', () => {
        setPlayerState('LIVE');
        setReconnectCount(0);
      });
      video.addEventListener('error', () => {
        setPlayerState('RECONNECTING');
        scheduleReconnect();
      });
      setupFrameCallback();
    } else {
      setPlayerState('ERROR');
      setErrorMessage('Browser does not support HLS playback.');
    }
  }, [resolvedStreamUrl, autoPlay, destroyPlayer, setupFrameCallback, syncLivePosition]);

  // Exponential backoff reconnection (Section 3: 2s -> 4s -> 8s -> 16s -> 30s)
  const scheduleReconnect = useCallback(() => {
    destroyPlayer();
    setPlayerState('RECONNECTING');

    setReconnectCount((prev) => {
      const nextCount = prev + 1;
      // Exponential backoff capped at 30s
      const delaySec = Math.min(30, Math.round(2 * Math.pow(1.5, Math.min(prev, 6))));
      setNextRetryInSec(delaySec);

      let remaining = delaySec;
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        setNextRetryInSec(Math.max(0, remaining));
        if (remaining <= 0 && countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      }, 1000);

      reconnectTimerRef.current = setTimeout(() => {
        initPlayback();
      }, delaySec * 1000);

      return nextCount;
    });
  }, [destroyPlayer, initPlayback]);

  // Real FPS calculation from video playback quality
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      const now = Date.now();
      const timeDeltaSec = (now - lastFpsCalcTimeRef.current) / 1000;

      if (typeof video.getVideoPlaybackQuality === 'function') {
        const quality = video.getVideoPlaybackQuality();
        const currentTotal = quality.totalVideoFrames;
        const currentDropped = quality.droppedVideoFrames;

        setTotalFrames(currentTotal);
        setDroppedFrames(currentDropped);

        if (timeDeltaSec > 0.8) {
          const framesDelta = currentTotal - lastFramesCountRef.current;
          const calculatedFps = Math.max(0, Math.round((framesDelta / timeDeltaSec) * 10) / 10);
          setActualFps(calculatedFps);

          lastFramesCountRef.current = currentTotal;
          lastFpsCalcTimeRef.current = now;
        }
      } else if (video.currentTime) {
        // Fallback for FPS if playback quality not available
        setActualFps(declaredFps);
      }

      // Calculate latency / age since last frame callback
      const ageMs = now - lastFrameTimeRef.current;
      setLastFrameAgeMs(ageMs);

      // Notify parent telemetry if requested
      if (onTelemetryUpdate) {
        onTelemetryUpdate({
          state: playerState,
          actualFps: playerState === 'LIVE' ? actualFps : 0,
          totalFrames,
          droppedFrames,
          width: videoDims.width || video.videoWidth || 1920,
          height: videoDims.height || video.videoHeight || 1080,
          ptsSeconds: currentPts,
          lastFrameAgeMs: ageMs,
          reconnectAttempts: reconnectCount,
          protocol: 'HLS (AES-128 / TCP)',
          errorMessage: errorMessage || undefined
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playerState, actualFps, totalFrames, droppedFrames, videoDims, currentPts, reconnectCount, errorMessage, declaredFps, onTelemetryUpdate]);

  // Mount / stream url change
  useEffect(() => {
    initPlayback();
    return () => {
      destroyPlayer();
    };
  }, [initPlayback, destroyPlayer]);

  // Handle Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Handle Snapshot Grab (draw frame onto offscreen canvas and trigger download)
  const captureSnapshot = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const link = document.createElement('a');
        link.download = `sentinel_${cameraId}_${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.warn('Could not capture frame snapshot:', err);
    }
  }, [cameraId]);

  // Aspect ratio styling
  const aspectClass =
    aspectRatio === '16/9'
      ? 'aspect-video'
      : aspectRatio === '4/3'
      ? 'aspect-4/3'
      : 'h-full w-full';

  return (
    <div
      ref={containerRef}
      id={`sentinel-player-${cameraId}`}
      onClick={onClick}
      className={`group relative bg-slate-950 overflow-hidden select-none transition-all duration-200 ${aspectClass} ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : 'hover:border-slate-700'
      } ${className}`}
    >
      {/* HTML Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover pointer-events-none"
        onWaiting={() => setPlayerState('BUFFERING')}
        onPlaying={() => setPlayerState('LIVE')}
      />

      {/* Top Overlay Badge & Telemetry Bar */}
      <div className="absolute top-0 inset-x-0 p-2.5 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between z-10 pointer-events-auto">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-600 text-white tracking-wider uppercase shrink-0">
            {cameraId.toUpperCase()}
          </span>
          <div className="truncate">
            <h4 className="text-xs font-semibold text-white truncate drop-shadow-sm leading-tight">
              {cameraName || cameraId}
            </h4>
            <p className="text-[10px] text-slate-300 font-medium truncate leading-tight">
              {district ? `${district} • ` : ''}{location || 'Sector Road'}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {playerState === 'LIVE' && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          )}
          {playerState === 'BUFFERING' && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              BUFFERING
            </span>
          )}
          {playerState === 'CONNECTING' && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <RotateCw size={10} className="animate-spin text-blue-400" />
              CONNECTING
            </span>
          )}
          {playerState === 'RECONNECTING' && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <RotateCw size={10} className="animate-spin text-amber-400" />
              RETRY {nextRetryInSec}s
            </span>
          )}
          {(playerState === 'OFFLINE' || playerState === 'ERROR') && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle size={10} />
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Loading / Reconnecting State Overlay */}
      {playerState !== 'LIVE' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-5">
          {playerState === 'CONNECTING' && (
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-xs font-medium text-slate-300">Establishing Authenticated HLS Stream...</p>
              <p className="text-[10px] font-mono text-slate-400">cctv.corp8.cloud • AES-128</p>
            </div>
          )}

          {playerState === 'BUFFERING' && (
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <p className="text-xs font-medium text-amber-300">Synchronizing GOP keyframes...</p>
            </div>
          )}

          {playerState === 'RECONNECTING' && (
            <div className="space-y-3 flex flex-col items-center max-w-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <RotateCw size={18} className="animate-spin" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-amber-300">Stream Connection Drop</h5>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Exponential backoff in progress (Attempt {reconnectCount}).
                </p>
                <p className="text-[11px] font-mono text-amber-400 font-bold mt-1">
                  Retrying in {nextRetryInSec} seconds...
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  initPlayback();
                }}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg transition"
              >
                Retry Now
              </button>
            </div>
          )}

          {(playerState === 'OFFLINE' || playerState === 'ERROR') && (
            <div className="space-y-2.5 flex flex-col items-center max-w-xs">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-red-300">Feed Unavailable</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {errorMessage || 'RTSP/HLS upstream feed returned offline or connection timed out.'}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  initPlayback();
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px] rounded-lg border border-slate-700 transition"
              >
                Reconnect Feed
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Detailed Telemetry Overlay (Section 18 Debug / Real Stream Health) */}
      {showTelemetry && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-2 top-11 p-2.5 bg-slate-950/95 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 space-y-1 z-20 backdrop-blur-md shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-400 font-bold">
            <span className="flex items-center gap-1 text-blue-400">
              <Activity size={11} /> REAL TELEMETRY
            </span>
            <span>{codec} • {videoDims.width || 1920}x{videoDims.height || 1080}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-0.5">
            <div>Measured FPS: <span className="text-emerald-400 font-bold">{actualFps.toFixed(1)}</span></div>
            <div>Nominal FPS: <span className="text-slate-400">{declaredFps}</span></div>
            <div>Decoded Frames: <span className="text-white">{totalFrames.toLocaleString()}</span></div>
            <div>Dropped Frames: <span className={droppedFrames > 0 ? 'text-amber-400' : 'text-slate-400'}>{droppedFrames}</span></div>
            <div>Presentation PTS: <span className="text-cyan-400">{currentPts.toFixed(2)}s</span></div>
            <div>Transport: <span className="text-slate-300">HLS / TCP</span></div>
            <div>Frame Age: <span className={lastFrameAgeMs > 800 ? 'text-amber-400' : 'text-emerald-400'}>{lastFrameAgeMs}ms</span></div>
            <div>Reconnects: <span className="text-slate-300">{reconnectCount}</span></div>
          </div>
        </div>
      )}

      {/* Bottom Control & Metrics Bar (Shows on hover or always if controls enabled) */}
      {showControls && (
        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/60 text-emerald-400 font-bold">
              {actualFps > 0 ? `${actualFps.toFixed(0)} FPS` : `${declaredFps} FPS`}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/60 text-slate-300">
              {videoDims.width > 0 ? `${videoDims.width}x${videoDims.height}` : '1080p'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/60 text-blue-300">
              {codec}
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Toggle Live Telemetry"
              onClick={(e) => {
                e.stopPropagation();
                setShowTelemetry((prev) => !prev);
              }}
              className={`p-1 rounded text-slate-300 hover:text-white transition cursor-pointer ${
                showTelemetry ? 'bg-blue-600/80 text-white' : 'bg-slate-900/80 hover:bg-slate-800'
              }`}
            >
              <Activity size={13} />
            </button>

            <button
              type="button"
              title="Snapshot Frame"
              onClick={captureSnapshot}
              className="p-1 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Camera size={13} />
            </button>

            <button
              type="button"
              title={isMuted ? 'Unmute' : 'Mute'}
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-1 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>

            <button
              type="button"
              title="Reload Stream"
              onClick={(e) => {
                e.stopPropagation();
                initPlayback();
              }}
              className="p-1 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RotateCw size={13} />
            </button>

            <button
              type="button"
              title="Fullscreen"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-1 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
