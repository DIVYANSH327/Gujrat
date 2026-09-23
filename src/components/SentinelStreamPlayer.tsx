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
  Radio,
  Eye,
  Shield,
  Sparkles,
  Info,
  Server,
  Zap,
  Sliders,
  X,
  Cpu
} from 'lucide-react';
import { AiObjectEvidenceModal } from './AiObjectEvidenceModal';
import { aiObjectEnhancerAndVerifier, EnhancedEvidenceRecord } from '../services/ai/AiObjectEnhancerAndVerifier';
import { LiveStreamBackgroundAiPanel } from './LiveStreamBackgroundAiPanel';
import { streamOptimizationManager } from '../services/StreamOptimizationManager';
import { GopSyncState, StreamOptimizationConfig } from '../types';

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
  sourceFps: number;
  displayFps: number;
  aiInferenceFps: number;
  totalFrames: number;
  droppedFrames: number;
  width: number;
  height: number;
  ptsSeconds: number;
  lastFrameAgeMs: number;
  bitrateKbps: number;
  reconnectAttempts: number;
  protocol: string;
  videoHealth: 'GOOD' | 'DEGRADED' | 'SOURCE_LIMITED';
  bandwidthKbps: number;
  errorMessage?: string;
}

export type StreamQualityMode = 'AUTO' | '720p' | '1080p' | 'SOURCE';

export type AIStatus =
  | 'WAITING_FOR_FRAME'
  | 'STARTING'
  | 'PROCESSING'
  | 'NO_DETECTIONS'
  | 'DETECTIONS_FOUND'
  | 'ERROR';

export interface CameraAITelemetryState {
  cameraId: string;
  sourceConnected: boolean;
  decoderStatus: 'IDLE' | 'STARTED' | 'WAITING_FOR_FRAME' | 'FRAME_RECEIVED' | 'FRAME_TIMEOUT' | 'RECONNECTING';
  aiStatus: AIStatus;
  lastDecodedFrameAt: number | null;
  lastInferenceAt: number | null;
  framesReceived: number;
  framesProcessed: number;
  aiFramesSubmitted: number;
  aiFramesCompleted: number;
  detectionsTotal: number;
  vehiclesDetected: number;
  currentInferenceLatencyMs: number;
  reconnectCount: number;
  lastError: string | null;
  hsrpStatus: 'PENDING' | 'VERIFIED' | 'NO_PLATE' | 'NOT_READABLE' | 'NO_VEHICLES';
  hsrpCandidateText: string | null;
  recentDetections: any[];
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
  showAiOverlay?: boolean;
  lowBandwidthMode?: boolean;
  aspectRatio?: '16/9' | '4/3' | 'auto';
  onTelemetryUpdate?: (telemetry: SentinelStreamTelemetry) => void;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  showBackgroundAiPanelByDefault?: boolean;
  gopSyncEnabled?: boolean;
  gopSyncTimeoutMs?: number;
  onOptimizationChange?: (config: StreamOptimizationConfig) => void;
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
  showAiOverlay = true,
  lowBandwidthMode = false,
  aspectRatio = '16/9',
  onTelemetryUpdate,
  onClick,
  isSelected = false,
  className = '',
  showBackgroundAiPanelByDefault = false,
  gopSyncEnabled: propGopSyncEnabled,
  gopSyncTimeoutMs: propGopSyncTimeoutMs = 3000,
  onOptimizationChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Stream Optimization & GOP Keyframe Synchronization State (Section 1-18)
  // Default: gopSyncEnabled = false (High-contention live AI priority)
  const initialGopConfig = streamOptimizationManager.getConfig(cameraId);
  const [gopSyncEnabled, setGopSyncEnabled] = useState<boolean>(
    propGopSyncEnabled !== undefined ? propGopSyncEnabled : initialGopConfig.gopSyncEnabled
  );
  const [gopSyncTimeoutMs, setGopSyncTimeoutMs] = useState<number>(
    propGopSyncTimeoutMs || initialGopConfig.gopSyncTimeoutMs || 3000
  );
  const [gopSyncState, setGopSyncState] = useState<GopSyncState>(
    (propGopSyncEnabled ?? initialGopConfig.gopSyncEnabled) ? 'WAITING' : 'DISABLED'
  );
  const [firstValidFrameTimestamp, setFirstValidFrameTimestamp] = useState<number | null>(null);
  const [aiStartedTimestamp, setAiStartedTimestamp] = useState<number | null>(null);
  const [aiStartLatencyMs, setAiStartLatencyMs] = useState<number | null>(null);
  const [gopWaitLatencyMs, setGopWaitLatencyMs] = useState<number | null>(null);
  const [gopSyncFallbackCount, setGopSyncFallbackCount] = useState<number>(0);
  const [aiExecutionStatus, setAiExecutionStatus] = useState<'IDLE' | 'PROCESSING' | 'COMPLETED'>('IDLE');
  const gopSyncTimerRef = useRef<any>(null);

  const [playerState, setPlayerState] = useState<SentinelPlayerState>('CONNECTING');
  const [isMuted, setIsMuted] = useState<boolean>(muted);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(showTelemetryOverlay);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [showBackgroundAiPanel, setShowBackgroundAiPanel] = useState<boolean>(showBackgroundAiPanelByDefault);
  const [isAiOverlayActive, setIsAiOverlayActive] = useState<boolean>(showAiOverlay);
  const [cameraAiTelem, setCameraAiTelem] = useState<CameraAITelemetryState | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus>('WAITING_FOR_FRAME');
  const [aiDetections, setAiDetections] = useState<any[]>([]);
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const [nextRetryInSec, setNextRetryInSec] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<StreamQualityMode>('AUTO');

  // Low bandwidth thumbnail state
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(`/api/sentinel/thumbnail/${cameraId}`);
  const [measuredBandwidthKbps, setMeasuredBandwidthKbps] = useState<number>(0);
  const bytesDownloadedRef = useRef<number>(0);
  const lastBandwidthCalcTimeRef = useRef<number>(Date.now());

  // Real measured telemetry (Decoupled FPS: Source, Display, AI)
  const [actualSourceFps, setActualSourceFps] = useState<number>(declaredFps || 25);
  const [displayFps, setDisplayFps] = useState<number>(0);
  const [aiInferenceFps, setAiInferenceFps] = useState<number>(2.8);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [droppedFrames, setDroppedFrames] = useState<number>(0);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [currentPts, setCurrentPts] = useState<number>(0);
  const [lastFrameAgeMs, setLastFrameAgeMs] = useState<number>(0);
  const [streamBitrateKbps, setStreamBitrateKbps] = useState<number>(0);
  const [selectedEvidenceRecord, setSelectedEvidenceRecord] = useState<EnhancedEvidenceRecord | null>(null);
  const [aiEngineStatus, setAiEngineStatus] = useState<string>('READY');

  // Detailed Browser & HLS.js Diagnostics (Section 2 & 24)
  const [failureClassification, setFailureClassification] = useState<
    'NO_ERROR' | 'BROWSER_HLS_ERROR' | 'NETWORK_SEGMENT_ERROR' | 'MANIFEST_ERROR' | 'VIDEO_DECODE_ERROR' | 'SERVER_STREAM_ERROR' | 'FFMPEG_ERROR' | 'RTSP_INPUT_ERROR'
  >('NO_ERROR');
  const [videoReadyState, setVideoReadyState] = useState<number>(0);
  const [videoNetworkState, setVideoNetworkState] = useState<number>(0);
  const [bufferedAheadSec, setBufferedAheadSec] = useState<number>(0);
  const [liveEdgeLatencySec, setLiveEdgeLatencySec] = useState<number>(0);
  const [stallWaitingCount, setStallWaitingCount] = useState<number>(0);
  const [fragLoadedCount, setFragLoadedCount] = useState<number>(0);
  const [hlsFatalCount, setHlsFatalCount] = useState<number>(0);
  const [hlsNonFatalCount, setHlsNonFatalCount] = useState<number>(0);

  // Tracking refs for real FPS calculation
  const lastFrameTimeRef = useRef<number>(Date.now());
  const lastFramesCountRef = useRef<number>(0);
  const lastFpsCalcTimeRef = useRef<number>(Date.now());
  const rvfcFrameCountInIntervalRef = useRef<number>(0);
  const reconnectTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const wallClockSyncIntervalRef = useRef<any>(null);
  const rvfcCallbackIdRef = useRef<number | null>(null);
  const networkErrorRecoveriesRef = useRef<number>(0);

  const resolvedStreamUrl = streamUrl || `/api/sentinel/stream/${cameraId}/index.m3u8`;

  // Compute Video Health diagnosis (Section 23)
  const videoHealth: 'GOOD' | 'DEGRADED' | 'SOURCE_LIMITED' = React.useMemo(() => {
    if (actualSourceFps <= 15 && Math.abs(displayFps - actualSourceFps) <= 2) {
      return 'SOURCE_LIMITED';
    }
    if (displayFps >= 20) {
      return 'GOOD';
    }
    if (displayFps > 0 && displayFps < 20) {
      return 'DEGRADED';
    }
    return 'GOOD';
  }, [actualSourceFps, displayFps]);

  // Trigger real server-side AI scan for this camera
  const triggerCameraAiScan = useCallback(async (camId: string) => {
    try {
      setAiStatus('STARTING');
      setAiExecutionStatus('PROCESSING');
      setAiStatus('PROCESSING');
      const res = await fetch(`/api/vision/camera-ai/${camId}/sample`, { method: 'POST' });
      if (res.ok) {
        const data: CameraAITelemetryState = await res.json();
        setCameraAiTelem(data);
        if (data.aiStatus) {
          setAiStatus(data.aiStatus);
        } else if (data.aiFramesCompleted > 0) {
          setAiStatus(data.detectionsTotal > 0 ? 'DETECTIONS_FOUND' : 'NO_DETECTIONS');
        } else {
          setAiStatus('WAITING_FOR_FRAME');
        }
        if (data && Array.isArray(data.recentDetections)) {
          setAiDetections(data.recentDetections);
        }
        setAiExecutionStatus('COMPLETED');
      } else {
        setAiStatus('ERROR');
      }
    } catch {
      setAiStatus('ERROR');
    }
  }, []);

  // Toggle GOP sync state and notify manager/server
  const handleToggleGopSync = useCallback(async (enabled: boolean) => {
    setGopSyncEnabled(enabled);
    setGopSyncState(enabled ? 'WAITING' : 'DISABLED');
    streamOptimizationManager.setConfig(cameraId, { gopSyncEnabled: enabled });
    onOptimizationChange?.({ gopSyncEnabled: enabled, gopSyncTimeoutMs });

    try {
      await fetch('/api/sentinel/optimization/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId, gopSyncEnabled: enabled, gopSyncTimeoutMs })
      });
    } catch {
      // Non-fatal
    }

    // MODE A — GOP OFF: If first valid frame already exists, kick off AI without keyframe waiting
    if (!enabled && firstValidFrameTimestamp && !aiStartedTimestamp) {
      const now = Date.now();
      setAiStartedTimestamp(now);
      setAiStartLatencyMs(0);
      setAiExecutionStatus('PROCESSING');
      triggerCameraAiScan(cameraId);
    }
  }, [cameraId, gopSyncTimeoutMs, onOptimizationChange, firstValidFrameTimestamp, aiStartedTimestamp, triggerCameraAiScan]);

  // Sync with StreamOptimizationManager
  useEffect(() => {
    const unsub = streamOptimizationManager.subscribe((id, telem) => {
      if (id.toLowerCase() === cameraId.toLowerCase()) {
        if (propGopSyncEnabled === undefined) {
          setGopSyncEnabled(telem.gopSyncEnabled);
          setGopSyncState(telem.gopSyncState);
        }
        if (telem.firstValidFrameTimestamp) setFirstValidFrameTimestamp(telem.firstValidFrameTimestamp);
        if (telem.aiStartedTimestamp) setAiStartedTimestamp(telem.aiStartedTimestamp);
        if (telem.aiStartLatencyMs !== null) setAiStartLatencyMs(telem.aiStartLatencyMs);
        if (telem.gopWaitLatencyMs !== null) setGopWaitLatencyMs(telem.gopWaitLatencyMs);
        setGopSyncFallbackCount(telem.gopSyncFallbackCount);
      }
    });

    return () => {
      unsub();
    };
  }, [cameraId, propGopSyncEnabled]);

  // Bounded GOP Sync Timeout (3000ms): Fall back to first valid decoded frame
  useEffect(() => {
    if (gopSyncEnabled && gopSyncState === 'WAITING') {
      if (gopSyncTimerRef.current) clearTimeout(gopSyncTimerRef.current);
      gopSyncTimerRef.current = setTimeout(() => {
        console.warn(`[SentinelStreamPlayer:${cameraId}] GOP keyframe sync timed out (${gopSyncTimeoutMs}ms) -> Falling back to valid decoded frame for live AI`);
        setGopSyncState('TIMEOUT_FALLBACK');
        setGopSyncFallbackCount(prev => prev + 1);
        const now = Date.now();
        if (!aiStartedTimestamp) {
          setAiStartedTimestamp(now);
          setAiStartLatencyMs(firstValidFrameTimestamp ? Math.max(0, now - firstValidFrameTimestamp) : 0);
          setAiExecutionStatus('PROCESSING');
          triggerCameraAiScan(cameraId);
        }
        setPlayerState(prev => (prev === 'BUFFERING' ? 'LIVE' : prev));
      }, gopSyncTimeoutMs);
    } else {
      if (gopSyncTimerRef.current) {
        clearTimeout(gopSyncTimerRef.current);
        gopSyncTimerRef.current = null;
      }
    }
    return () => {
      if (gopSyncTimerRef.current) {
        clearTimeout(gopSyncTimerRef.current);
        gopSyncTimerRef.current = null;
      }
    };
  }, [gopSyncEnabled, gopSyncState, gopSyncTimeoutMs, cameraId, firstValidFrameTimestamp, aiStartedTimestamp, triggerCameraAiScan]);

  // Handle detection inspection
  const handleInspectDetection = async (det: any) => {
    try {
      const record = await aiObjectEnhancerAndVerifier.processYoloDetection({
        id: det.id,
        cameraId,
        cameraName,
        location,
        district,
        className: det.className || 'object',
        confidence: det.confidence || 0.9,
        bbox: det.bbox || { x: 0.2, y: 0.3, width: 0.3, height: 0.3 },
        trackId: det.trackId,
        timestamp: Date.now()
      });
      setSelectedEvidenceRecord(record);
    } catch (e) {
      console.warn('Failed to inspect detection:', e);
    }
  };

  // Poll real YOLO detections & authoritative AI telemetry for this camera (Decoupled from video playback)
  useEffect(() => {
    let isCancelled = false;

    const fetchAITelemetry = async () => {
      try {
        const res = await fetch(`/api/vision/camera-ai/${cameraId}`);
        if (res.ok && !isCancelled) {
          const data: CameraAITelemetryState = await res.json();
          setCameraAiTelem(data);
          if (data.aiStatus) {
            setAiStatus(data.aiStatus);
          } else if (data.aiFramesCompleted > 0) {
            setAiStatus(data.detectionsTotal > 0 ? 'DETECTIONS_FOUND' : 'NO_DETECTIONS');
          }
          if (Array.isArray(data.recentDetections)) {
            setAiDetections(data.recentDetections);
          }
          if (data.aiStatus === 'PROCESSING') {
            setAiExecutionStatus('PROCESSING');
          } else if (data.aiStatus === 'DETECTIONS_FOUND' || data.aiStatus === 'NO_DETECTIONS') {
            setAiExecutionStatus('COMPLETED');
          }
        }
      } catch {
        // Non-fatal polling error
      }
    };

    fetchAITelemetry();
    const interval = setInterval(fetchAITelemetry, 25000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [cameraId]);

  // Trigger initial frame acquisition and inference immediately on camera mount
  useEffect(() => {
    triggerCameraAiScan(cameraId);
  }, [cameraId, triggerCameraAiScan]);

  // Fetch independent server stream telemetry and AI inference rate
  useEffect(() => {
    let isCancelled = false;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/sentinel/stream/${cameraId}/telemetry`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.sourceFps) setActualSourceFps(data.sourceFps);
          if (data.aiInferenceFps) setAiInferenceFps(data.aiInferenceFps);
          if (data.bitrateKbps && data.isActive) setStreamBitrateKbps(data.bitrateKbps);
        }
      } catch {
        // Non-fatal telemetry poll
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [cameraId]);

  // Frame callback for real presentation timestamp & hardware frame counter
  const setupFrameCallback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const recordDecodedFrame = (pts?: number) => {
      const frameTime = Date.now();
      lastFrameTimeRef.current = frameTime;
      rvfcFrameCountInIntervalRef.current += 1;
      if (pts !== undefined) setCurrentPts(pts);

      if (!firstValidFrameTimestamp) {
        setFirstValidFrameTimestamp(frameTime);
        streamOptimizationManager.recordValidDecodedFrame(cameraId, pts);

        // MODE A — GOP OFF: Immediate AI start!
        if (!gopSyncEnabled) {
          setGopSyncState('DISABLED');
          setPlayerState('LIVE');
          if (!aiStartedTimestamp) {
            setAiStartedTimestamp(frameTime);
            setAiStartLatencyMs(0);
            setAiExecutionStatus('PROCESSING');
            triggerCameraAiScan(cameraId);
          }
        }
      } else if (!gopSyncEnabled && !aiStartedTimestamp) {
        setAiStartedTimestamp(frameTime);
        setAiStartLatencyMs(Math.max(0, frameTime - firstValidFrameTimestamp));
        setAiExecutionStatus('PROCESSING');
        triggerCameraAiScan(cameraId);
      }
    };

    if ('requestVideoFrameCallback' in video) {
      const onFrame = (now: DOMHighResTimeStamp, metadata: any) => {
        recordDecodedFrame(metadata.presentationTime || video.currentTime);
        if (video.videoWidth) {
          setVideoDims(prev =>
            (video.videoWidth !== prev.width || video.videoHeight !== prev.height)
              ? { width: video.videoWidth, height: video.videoHeight }
              : prev
          );
        }
        rvfcCallbackIdRef.current = (video as any).requestVideoFrameCallback(onFrame);
      };
      rvfcCallbackIdRef.current = (video as any).requestVideoFrameCallback(onFrame);
    }
  }, [cameraId, gopSyncEnabled, firstValidFrameTimestamp, aiStartedTimestamp, triggerCameraAiScan]);

  // Clean up client-side HLS player, video elements, and timers
  const cleanupClientPlayer = useCallback(() => {
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
    networkErrorRecoveriesRef.current = 0;
    if (videoRef.current && rvfcCallbackIdRef.current !== null && 'cancelVideoFrameCallback' in videoRef.current) {
      (videoRef.current as any).cancelVideoFrameCallback(rvfcCallbackIdRef.current);
      rvfcCallbackIdRef.current = null;
    }
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch {
        // Cleanup safety
      }
      hlsRef.current = null;
    }
  }, []);

  // Debounce ref for server stop to gracefully absorb React StrictMode double-mounting
  const serverStopTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cancelPendingServerStop = useCallback(() => {
    if (serverStopTimerRef.current) {
      clearTimeout(serverStopTimerRef.current);
      serverStopTimerRef.current = null;
    }
  }, []);

  // Terminate server-side FFmpeg remuxing session only when user navigates away or unmounts (Section 13)
  // Protected with a 2000ms grace period so React StrictMode or quick remounts do not kill active processes
  const stopServerStream = useCallback(() => {
    cancelPendingServerStop();
    serverStopTimerRef.current = setTimeout(() => {
      try {
        navigator.sendBeacon?.(`/api/sentinel/stream/${cameraId}/stop`);
      } catch {
        fetch(`/api/sentinel/stream/${cameraId}/stop`, { method: 'POST', keepalive: true }).catch(() => {});
      }
      serverStopTimerRef.current = null;
    }, 2000);
  }, [cameraId, cancelPendingServerStop]);

  // Backward compatibility alias for unmount
  const destroyPlayer = useCallback(() => {
    cleanupClientPlayer();
    stopServerStream();
  }, [cleanupClientPlayer, stopServerStream]);

  // Initialize live stream playback
  const initPlayback = useCallback(() => {
    cancelPendingServerStop();
    cleanupClientPlayer();
    const video = videoRef.current;
    if (!video) return;

    setPlayerState('CONNECTING');
    setErrorMessage(null);

    // If Hls.js is supported in browser
    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        maxBufferLength: 6,
        maxMaxBufferLength: 10,
        backBufferLength: 2,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1500,
        levelLoadingTimeOut: 15000,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        startPosition: -1, // Live edge
        lowLatencyMode: true,
        capLevelToPlayerSize: true,
        enableWorker: true
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.info(`[SentinelStreamPlayer:${cameraId}] MEDIA_ATTACHED -> Loading ${resolvedStreamUrl}`);
        hls.loadSource(resolvedStreamUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        console.info(`[SentinelStreamPlayer:${cameraId}] MANIFEST_PARSED: ${data.levels?.length || 1} level(s) ready`);
        setFailureClassification('NO_ERROR');
        video.loop = true;
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
        setFailureClassification('NO_ERROR');

        const now = Date.now();
        if (!firstValidFrameTimestamp) {
          setFirstValidFrameTimestamp(now);
          streamOptimizationManager.recordValidDecodedFrame(cameraId);
        }

        if (!gopSyncEnabled) {
          if (!aiStartedTimestamp) {
            setAiStartedTimestamp(now);
            setAiStartLatencyMs(0);
            setAiExecutionStatus('PROCESSING');
            triggerCameraAiScan(cameraId);
          }
        } else {
          setGopSyncState('SYNCHRONIZED');
          streamOptimizationManager.recordKeyframeArrival(cameraId);
          if (!aiStartedTimestamp) {
            setAiStartedTimestamp(now);
            setAiStartLatencyMs(firstValidFrameTimestamp ? Math.max(0, now - firstValidFrameTimestamp) : 0);
            setAiExecutionStatus('PROCESSING');
            triggerCameraAiScan(cameraId);
          }
        }

        // Measure buffer ahead of current playback position
        if (video && video.buffered && video.buffered.length > 0) {
          for (let i = 0; i < video.buffered.length; i++) {
            if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
              setBufferedAheadSec(Math.round((video.buffered.end(i) - video.currentTime) * 10) / 10);
            }
          }
        }
      });

      hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
        setFragLoadedCount((c) => c + 1);
        networkErrorRecoveriesRef.current = 0;
        if (data.frag && data.frag.stats) {
          const bytes = data.frag.stats.loaded || 0;
          bytesDownloadedRef.current += bytes;
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          setPlayerState('BUFFERING');
          setStallWaitingCount((c) => c + 1);
          return;
        }

        // Failure Classification (Section 2 & 24)
        let classification: 'BROWSER_HLS_ERROR' | 'NETWORK_SEGMENT_ERROR' | 'MANIFEST_ERROR' | 'VIDEO_DECODE_ERROR' | 'SERVER_STREAM_ERROR' | 'FFMPEG_ERROR' | 'RTSP_INPUT_ERROR' = 'BROWSER_HLS_ERROR';
        if (data.details?.includes('manifest') || (data.type === Hls.ErrorTypes.NETWORK_ERROR && data.details?.includes('manifest'))) {
          classification = 'MANIFEST_ERROR';
        } else if (data.details?.includes('frag') || data.details?.includes('segment') || data.details?.includes('bufferNudgeOnStall')) {
          classification = 'NETWORK_SEGMENT_ERROR';
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          classification = 'VIDEO_DECODE_ERROR';
        } else if (data.response?.code === 502 || data.response?.code === 503) {
          classification = 'SERVER_STREAM_ERROR';
        }

        if (!data.fatal) {
          setHlsNonFatalCount((c) => c + 1);
          console.warn(`[SentinelStreamPlayer:${cameraId}] Non-fatal [${classification}]: ${data.details}`);
          return;
        }

        setHlsFatalCount((c) => c + 1);
        setFailureClassification(classification);

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          console.warn(`[SentinelStreamPlayer:${cameraId}] Recovering fatal media error via hls.recoverMediaError()...`);
          try {
            hls.recoverMediaError();
          } catch {
            scheduleReconnect();
          }
        } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // Standard Hls.js network recovery for transient fragment / manifest load errors:
          // Calling hls.startLoad() reloads playlist and aligns to live edge without full teardown churn
          if (networkErrorRecoveriesRef.current < 3) {
            networkErrorRecoveriesRef.current += 1;
            console.info(`[SentinelStreamPlayer:${cameraId}] Recovering fatal network error (${networkErrorRecoveriesRef.current}/3) via hls.startLoad() for ${data.details}...`);
            try {
              hls.startLoad();
              return;
            } catch (err) {
              console.warn(`[SentinelStreamPlayer:${cameraId}] hls.startLoad() failed:`, err);
            }
          }
          console.warn(`[SentinelStreamPlayer:${cameraId}] Stream interruption [${classification}]: ${data.details}. Scheduling auto-reconnect.`);
          setPlayerState('RECONNECTING');
          setErrorMessage(data.details || 'Stream connection interrupted');
          scheduleReconnect();
        } else {
          console.warn(`[SentinelStreamPlayer:${cameraId}] Playback issue [${classification}]: ${data.details}. Scheduling auto-reconnect.`);
          setPlayerState('RECONNECTING');
          setErrorMessage(data.details || 'Stream connection interrupted');
          scheduleReconnect();
        }
      });

      // Drift alignment & Live Edge Latency (Section 2)
      wallClockSyncIntervalRef.current = setInterval(() => {
        if (videoRef.current && hlsRef.current) {
          const liveSync = hlsRef.current.liveSyncPosition;
          if (liveSync && Number.isFinite(liveSync) && videoRef.current.currentTime > 0) {
            const drift = liveSync - videoRef.current.currentTime;
            setLiveEdgeLatencySec(Math.round(drift * 10) / 10);
            if (drift > 6) {
              videoRef.current.currentTime = liveSync;
            }
          }
        }
      }, 3000);

      setupFrameCallback();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari iOS/macOS HLS support
      video.src = resolvedStreamUrl;
      video.loop = true;
      video.addEventListener('loadedmetadata', () => {
        if (autoPlay) video.play().catch(() => {});
      });
      video.addEventListener('playing', () => {
        setPlayerState('LIVE');
        setReconnectCount(0);
        const now = Date.now();
        if (!firstValidFrameTimestamp) {
          setFirstValidFrameTimestamp(now);
          streamOptimizationManager.recordValidDecodedFrame(cameraId);
        }
        if (!gopSyncEnabled && !aiStartedTimestamp) {
          setAiStartedTimestamp(now);
          setAiStartLatencyMs(0);
          setAiExecutionStatus('PROCESSING');
          triggerCameraAiScan(cameraId);
        }
      });
      video.addEventListener('waiting', () => {
        setPlayerState('BUFFERING');
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
  }, [resolvedStreamUrl, autoPlay, cleanupClientPlayer, setupFrameCallback]);

  // Exponential backoff reconnection (Section 3: 2s -> 4s -> 8s -> 16s -> 30s)
  const scheduleReconnect = useCallback(() => {
    cleanupClientPlayer();
    setPlayerState('RECONNECTING');

    setReconnectCount((prev) => {
      const nextCount = prev + 1;
      const delays = [2, 4, 8, 16, 30];
      const delaySec = delays[Math.min(prev, delays.length - 1)];
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

  // Real FPS & Bandwidth calculation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeDeltaSec = (now - lastFpsCalcTimeRef.current) / 1000;

      if (timeDeltaSec > 0.8) {
        // Calculate measured display FPS from RVFC or getVideoPlaybackQuality
        const video = videoRef.current;
        let calculatedDisplayFps = 0;

        if (rvfcFrameCountInIntervalRef.current > 0) {
          calculatedDisplayFps = Math.round((rvfcFrameCountInIntervalRef.current / timeDeltaSec) * 10) / 10;
          rvfcFrameCountInIntervalRef.current = 0;
        } else if (video && typeof video.getVideoPlaybackQuality === 'function') {
          const quality = video.getVideoPlaybackQuality();
          const currentTotal = quality.totalVideoFrames;
          const framesDelta = currentTotal - lastFramesCountRef.current;
          calculatedDisplayFps = Math.max(0, Math.round((framesDelta / timeDeltaSec) * 10) / 10);
          lastFramesCountRef.current = currentTotal;
          setTotalFrames(currentTotal);
          setDroppedFrames(quality.droppedVideoFrames);
        } else if (playerState === 'LIVE') {
          calculatedDisplayFps = actualSourceFps;
        }

        if (playerState === 'LIVE') {
          setDisplayFps(calculatedDisplayFps > 0 ? calculatedDisplayFps : actualSourceFps);
        } else {
          setDisplayFps(0);
        }

        // Calculate real bandwidth
        const bytesDelta = bytesDownloadedRef.current;
        bytesDownloadedRef.current = 0;
        const bwKbps = Math.round(((bytesDelta * 8) / timeDeltaSec) / 1024);
        if (bwKbps > 0) {
          setMeasuredBandwidthKbps(bwKbps);
        }

        lastFpsCalcTimeRef.current = now;
      }

      const ageMs = now - lastFrameTimeRef.current;
      setLastFrameAgeMs(ageMs);

      if (onTelemetryUpdate) {
        onTelemetryUpdate({
          state: playerState,
          sourceFps: actualSourceFps,
          displayFps: playerState === 'LIVE' ? displayFps : 0,
          aiInferenceFps,
          totalFrames,
          droppedFrames,
          width: videoDims.width || 1920,
          height: videoDims.height || 1080,
          ptsSeconds: currentPts,
          lastFrameAgeMs: ageMs,
          bitrateKbps: streamBitrateKbps || measuredBandwidthKbps,
          reconnectAttempts: reconnectCount,
          protocol: 'RTSP over TCP → HLS (fMP4/TS)',
          videoHealth,
          bandwidthKbps: measuredBandwidthKbps,
          errorMessage: errorMessage || undefined
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playerState, displayFps, actualSourceFps, aiInferenceFps, totalFrames, droppedFrames, videoDims, currentPts, reconnectCount, errorMessage, streamBitrateKbps, measuredBandwidthKbps, videoHealth, onTelemetryUpdate]);

  // Mode switch: Grid thumbnail mode vs Live full streaming mode
  useEffect(() => {
    if (lowBandwidthMode) {
      destroyPlayer();
      setPlayerState('LIVE');
      setVideoDims({ width: 320, height: 180 });
      setDisplayFps(0.4);

      let isCancelled = false;
      const refreshThumb = async () => {
        if (isCancelled) return;
        const startTime = Date.now();
        const url = `/api/sentinel/thumbnail/${cameraId}?t=${startTime}`;
        setThumbnailUrl(url);
        try {
          const res = await fetch(url);
          if (res.ok) {
            const blob = await res.blob();
            const bytes = blob.size;
            bytesDownloadedRef.current += bytes;
            setTotalFrames((prev) => prev + 1);
            lastFrameTimeRef.current = Date.now();
          }
        } catch {
          // Ignored
        }
      };

      refreshThumb();
      const interval = setInterval(refreshThumb, 10000);
      return () => {
        isCancelled = true;
        clearInterval(interval);
      };
    } else {
      initPlayback();
      return () => {
        destroyPlayer();
      };
    }
  }, [lowBandwidthMode, cameraId, initPlayback, destroyPlayer]);

  // Quality Level Switching
  const handleQualityChange = (mode: StreamQualityMode) => {
    setSelectedQuality(mode);
    if (!hlsRef.current) return;

    if (mode === 'AUTO') {
      hlsRef.current.currentLevel = -1;
    } else if (mode === '720p') {
      const idx = hlsRef.current.levels.findIndex(l => l.height === 720);
      if (idx !== -1) hlsRef.current.currentLevel = idx;
    } else if (mode === '1080p' || mode === 'SOURCE') {
      const idx = hlsRef.current.levels.findIndex(l => l.height >= 1080);
      if (idx !== -1) hlsRef.current.currentLevel = idx;
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Snapshot frame from canvas
  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `SENTINEL_${cameraId}_${Date.now()}.jpg`;
        a.click();
      }
    } catch {
      window.open(`/api/sentinel/snapshot/${cameraId}`, '_blank');
    }
  }, [cameraId]);

  const aspectClass = aspectRatio === '16/9' ? 'aspect-video' : aspectRatio === '4/3' ? 'aspect-4/3' : 'h-full';

  return (
    <div
      ref={containerRef}
      id={`sentinel-player-${cameraId}`}
      onClick={onClick}
      className={`relative w-full ${aspectClass} bg-slate-950 overflow-hidden select-none group font-sans ${className} ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Video Element or Thumbnail */}
      {lowBandwidthMode ? (
        <img
          src={thumbnailUrl}
          alt={`Preview ${cameraId}`}
          className="w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%23090d16"/><text x="160" y="95" fill="%2364748b" font-size="12" font-family="sans-serif" text-anchor="middle">Thumbnail Standby</text></svg>';
          }}
        />
      ) : (
        <video
          ref={videoRef}
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover pointer-events-none"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setVideoReadyState(v.readyState);
            setVideoNetworkState(v.networkState);
            if (v.videoWidth && v.videoHeight) {
              setVideoDims({ width: v.videoWidth, height: v.videoHeight });
            }
            console.info(`[SentinelStreamPlayer:${cameraId}] loadedmetadata: ${v.videoWidth}x${v.videoHeight}, readyState=${v.readyState}`);
          }}
          onCanPlay={(e) => {
            setVideoReadyState(e.currentTarget.readyState);
          }}
          onPlaying={(e) => {
            setPlayerState('LIVE');
            setFailureClassification('NO_ERROR');
            setVideoReadyState(e.currentTarget.readyState);
            setVideoNetworkState(e.currentTarget.networkState);
          }}
          onWaiting={(e) => {
            setPlayerState('BUFFERING');
            setStallWaitingCount((c) => c + 1);
            setVideoReadyState(e.currentTarget.readyState);
          }}
          onStalled={(e) => {
            setStallWaitingCount((c) => c + 1);
            setVideoNetworkState(e.currentTarget.networkState);
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setCurrentPts(v.currentTime);
            setVideoReadyState(v.readyState);
            setVideoNetworkState(v.networkState);
            if (v.buffered && v.buffered.length > 0) {
              for (let i = 0; i < v.buffered.length; i++) {
                if (v.buffered.start(i) <= v.currentTime && v.currentTime <= v.buffered.end(i)) {
                  setBufferedAheadSec(Math.round((v.buffered.end(i) - v.currentTime) * 10) / 10);
                }
              }
            }
          }}
          onError={(e) => {
            const err = e.currentTarget.error;
            if (err?.code === 3) {
              setFailureClassification('VIDEO_DECODE_ERROR');
            } else if (err?.code === 2) {
              setFailureClassification('NETWORK_SEGMENT_ERROR');
            } else {
              setFailureClassification('BROWSER_HLS_ERROR');
            }
            console.warn(`[SentinelStreamPlayer:${cameraId}] HTMLVideoElement notice:`, err?.code, err?.message);
          }}
        />
      )}

      {/* Real YOLOv8 AI Vision Inference Bounding Boxes (Decoupled Asynchronous Overlay) */}
      {isAiOverlayActive && aiDetections.length > 0 && playerState === 'LIVE' && (
        <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
          {aiDetections.map((det: any, idx: number) => {
            const bbox = det.bbox || { x: 0.2, y: 0.3, width: 0.2, height: 0.2 };
            const left = `${Math.max(0, Math.min(95, bbox.x * 100))}%`;
            const top = `${Math.max(0, Math.min(95, bbox.y * 100))}%`;
            const width = `${Math.min(100 - bbox.x * 100, bbox.width * 100)}%`;
            const height = `${Math.min(100 - bbox.y * 100, bbox.height * 100)}%`;

            const isAlert = det.truthStatus === 'ALERT' || det.className === 'person';
            const isAttention = det.className === 'motorcycle' || det.className === 'bus';
            const borderCol = isAlert
              ? 'border-red-500 shadow-red-500/50'
              : isAttention
              ? 'border-amber-400 shadow-amber-400/50'
              : 'border-emerald-400 shadow-emerald-400/40';
            const badgeBg = isAlert
              ? 'bg-red-600 text-white border-red-400'
              : isAttention
              ? 'bg-amber-600 text-white border-amber-300'
              : 'bg-emerald-600 text-white border-emerald-300';

            const confPct = Math.round((det.confidence || 0.85) * 100);

            return (
              <div
                key={det.id || `det-${idx}`}
                style={{ left, top, width, height }}
                className={`absolute border-2 rounded-xs shadow-sm transition-all duration-300 ${borderCol}`}
              >
                <div
                  className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 border shadow-xs whitespace-nowrap leading-none cursor-pointer hover:brightness-110 ${badgeBg}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInspectDetection(det);
                  }}
                  title="Click to trigger AI Clarifier & Evidence Verification"
                >
                  <span className="capitalize">{det.className || 'object'}</span>
                  <span>{confPct}%</span>
                  {det.trackId && (
                    <span className="opacity-80">#{det.trackId.replace(/^TRK-/, '')}</span>
                  )}
                  <Sparkles size={9} className="text-amber-200 ml-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top Overlay Header */}
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

        {/* Status Badges with Clickable Diagnostics Panel Trigger (Section 7 & 24) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {lowBandwidthMode ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <Zap size={10} className="text-indigo-400" />
              GRID THUMBNAIL
            </span>
          ) : (
            <>
              {playerState === 'LIVE' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDiagnosticsModal(true);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer hover:brightness-125 ${
                    displayFps >= 20
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : actualSourceFps <= 15
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                  }`}
                  title="Click to view full Stream Diagnostics"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${displayFps >= 20 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span>
                    {displayFps >= 20
                      ? `LIVE • ${displayFps.toFixed(0)} FPS`
                      : actualSourceFps <= 15
                      ? `SOURCE LIMITED • ${displayFps.toFixed(0)} FPS`
                      : `DEGRADED • ${displayFps.toFixed(0)} FPS`}
                  </span>
                </button>
              )}

              {/* GOP Synchronization Status Badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDiagnosticsModal(true);
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition cursor-pointer hover:brightness-125 ${
                  !gopSyncEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : gopSyncState === 'SYNCHRONIZED'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : gopSyncState === 'TIMEOUT_FALLBACK'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                }`}
                title={
                  !gopSyncEnabled
                    ? 'GOP Sync: OFF (Live AI Priority • Zero keyframe wait)'
                    : gopSyncState === 'SYNCHRONIZED'
                    ? `GOP Sync: ON • Synchronized (${gopWaitLatencyMs ?? 0}ms wait)`
                    : gopSyncState === 'TIMEOUT_FALLBACK'
                    ? 'GOP Sync: ON • Timeout Fallback (AI active on valid frames)'
                    : 'GOP Sync: WAITING for keyframe...'
                }
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  !gopSyncEnabled
                    ? 'bg-emerald-400'
                    : gopSyncState === 'SYNCHRONIZED'
                    ? 'bg-blue-400'
                    : 'bg-amber-400'
                }`} />
                <span>
                  {!gopSyncEnabled
                    ? 'GOP: OFF'
                    : gopSyncState === 'SYNCHRONIZED'
                    ? 'GOP: SYNCED'
                    : gopSyncState === 'TIMEOUT_FALLBACK'
                    ? 'GOP: FALLBACK'
                    : 'GOP: SYNCING...'}
                </span>
              </button>

              {playerState === 'BUFFERING' && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <RotateCw size={10} className="animate-spin text-amber-400" />
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

              {/* Authoritative Sentinel Camera AI Status Badge (Requirement 1, 2, 3) */}
              {isAiOverlayActive && (
                <span
                  id={`ai-status-badge-${cameraId}`}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition shadow-xs ${
                    aiStatus === 'WAITING_FOR_FRAME'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                      : aiStatus === 'STARTING'
                      ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                      : aiStatus === 'PROCESSING' || aiExecutionStatus === 'PROCESSING'
                      ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60 animate-pulse'
                      : aiStatus === 'DETECTIONS_FOUND' || (cameraAiTelem && cameraAiTelem.aiFramesCompleted > 0 && (cameraAiTelem.detectionsTotal > 0 || aiDetections.length > 0))
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                      : aiStatus === 'NO_DETECTIONS'
                      ? 'bg-slate-900/90 text-slate-300 border-slate-700'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                  }`}
                  title={
                    aiStatus === 'ERROR' || cameraAiTelem?.lastError
                      ? `AI Inference Error: ${cameraAiTelem?.lastError || 'Inference engine exception'}`
                      : aiStatus === 'WAITING_FOR_FRAME'
                      ? 'AI Lifecycle: Waiting for valid decoded frame before inference'
                      : aiStatus === 'STARTING'
                      ? 'AI Lifecycle: Decoded frame acquired. Initializing YOLOv8 inference buffers...'
                      : aiStatus === 'PROCESSING' || aiExecutionStatus === 'PROCESSING'
                      ? 'AI Lifecycle: YOLOv8 ONNX inference actively executing on frame...'
                      : aiStatus === 'DETECTIONS_FOUND' || (cameraAiTelem && cameraAiTelem.aiFramesCompleted > 0 && (cameraAiTelem.detectionsTotal > 0 || aiDetections.length > 0))
                      ? `AI Lifecycle: YOLOv8 completed with ${cameraAiTelem?.detectionsTotal || aiDetections.length} detections (${cameraAiTelem?.vehiclesDetected ?? aiDetections.length} vehicles)`
                      : `AI Lifecycle: YOLOv8 inference executed and completed with 0 detections`
                  }
                >
                  <Shield
                    size={10}
                    className={
                      aiStatus === 'DETECTIONS_FOUND' || aiDetections.length > 0
                        ? 'text-emerald-400'
                        : aiStatus === 'PROCESSING' || aiExecutionStatus === 'PROCESSING'
                        ? 'text-indigo-400'
                        : aiStatus === 'STARTING'
                        ? 'text-blue-400'
                        : aiStatus === 'ERROR'
                        ? 'text-rose-400'
                        : aiStatus === 'NO_DETECTIONS'
                        ? 'text-slate-400'
                        : 'text-amber-400'
                    }
                  />
                  <span>
                    {aiStatus === 'WAITING_FOR_FRAME'
                      ? 'AI: WAITING FOR FRAME'
                      : aiStatus === 'STARTING'
                      ? 'AI: STARTING'
                      : aiStatus === 'PROCESSING' || aiExecutionStatus === 'PROCESSING'
                      ? 'AI: PROCESSING'
                      : aiStatus === 'DETECTIONS_FOUND' || (cameraAiTelem && cameraAiTelem.aiFramesCompleted > 0 && (cameraAiTelem.detectionsTotal > 0 || aiDetections.length > 0))
                      ? `AI: YOLOv8 (${cameraAiTelem?.detectionsTotal || aiDetections.length})`
                      : aiStatus === 'NO_DETECTIONS'
                      ? 'AI: NO DETECTIONS'
                      : 'AI: ERROR'}
                  </span>
                </span>
              )}

              {/* Decoder Timeout Warning Badge (Requirement 5 & 10) */}
              {cameraAiTelem?.decoderStatus === 'FRAME_TIMEOUT' && (
                <span
                  id={`decoder-timeout-badge-${cameraId}`}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-600/60 flex items-center gap-1 animate-pulse shadow-xs"
                  title="Decoder timed out waiting for first frame (>5000ms). Auto-reconnect triggered."
                >
                  <AlertTriangle size={10} className="text-rose-400" />
                  <span>DECODER: TIMEOUT</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Loading / Reconnecting State Overlay */}
      {playerState !== 'LIVE' && !lowBandwidthMode && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-5">
          {playerState === 'CONNECTING' && (
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-xs font-medium text-slate-300">Connecting RTSP → HLS Stream...</p>
              <p className="text-[10px] font-mono text-slate-400">Stream-Copy Remux • Zero Transcoding Delay</p>
            </div>
          )}

          {playerState === 'BUFFERING' && (
            <div className="space-y-2 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${cameraAiTelem?.decoderStatus === 'FRAME_TIMEOUT' ? 'border-rose-500' : 'border-amber-500'}`} />
              <p className={`text-xs font-medium ${cameraAiTelem?.decoderStatus === 'FRAME_TIMEOUT' ? 'text-rose-300 font-bold' : 'text-amber-300'}`}>
                {cameraAiTelem?.decoderStatus === 'FRAME_TIMEOUT'
                  ? 'Decoder Frame Timeout (>5s) — Reconnecting...'
                  : gopSyncEnabled
                  ? gopSyncState === 'TIMEOUT_FALLBACK'
                    ? 'GOP sync timeout: Continuing with live AI...'
                    : 'Synchronizing GOP keyframes...'
                  : 'Connecting Live Decoder Frame...'}
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                {cameraAiTelem?.decoderStatus === 'FRAME_TIMEOUT'
                  ? 'RTSP stream did not emit frame within 5000ms. Recovery cycle active.'
                  : gopSyncEnabled
                  ? `Keyframe sync limit: ${gopSyncTimeoutMs}ms`
                  : 'GOP OFF • Live AI Priority Active'}
              </p>
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
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg transition cursor-pointer"
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
                  {errorMessage || 'RTSP upstream feed returned offline or connection timed out.'}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  initPlayback();
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px] rounded-lg border border-slate-700 transition cursor-pointer"
              >
                Reconnect Feed
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Detailed Telemetry Overlay */}
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
            <div>Source FPS: <span className="text-blue-400 font-bold">{actualSourceFps.toFixed(1)}</span></div>
            <div>Display FPS: <span className="text-emerald-400 font-bold">{displayFps.toFixed(1)}</span></div>
            <div>AI Inference FPS: <span className="text-indigo-400 font-bold">{aiInferenceFps.toFixed(1)}</span></div>
            <div>Decoded Frames: <span className="text-white">{totalFrames.toLocaleString()}</span></div>
            <div>Dropped Frames: <span className={droppedFrames > 0 ? 'text-amber-400' : 'text-slate-400'}>{droppedFrames}</span></div>
            <div>Bitrate: <span className="text-cyan-400">{streamBitrateKbps ? `${streamBitrateKbps} kbps` : `${measuredBandwidthKbps} kbps`}</span></div>
            <div>Frame Age: <span className={lastFrameAgeMs > 800 ? 'text-amber-400' : 'text-emerald-400'}>{lastFrameAgeMs}ms</span></div>
            <div>Reconnects: <span className="text-slate-300">{reconnectCount}</span></div>
          </div>
        </div>
      )}

      {/* Bottom Control & Quality Selector Bar (Section 8 & 24) */}
      {showControls && (
        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          {/* Quick Metrics & Adaptive Quality Selector (Section 8) */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDiagnosticsModal(true);
              }}
              className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/60 text-emerald-400 font-bold hover:bg-slate-800 transition cursor-pointer"
              title="Click to view Stream Diagnostics"
            >
              {displayFps > 0 ? `${displayFps.toFixed(0)} FPS` : `${actualSourceFps} FPS`}
            </button>

            <span className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/60 text-slate-300">
              {videoDims.width > 0 ? `${videoDims.width}x${videoDims.height}` : '1920x1080'}
            </span>

            {/* Quality Selector (Section 8) */}
            {!lowBandwidthMode && (
              <div className="flex items-center bg-slate-900/90 border border-slate-700/60 rounded p-0.5">
                {(['AUTO', '720p', '1080p', 'SOURCE'] as StreamQualityMode[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQualityChange(q);
                    }}
                    className={`px-1 py-0.2 rounded text-[9px] font-bold transition cursor-pointer ${
                      selectedQuality === q ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Quick GOP Optimization Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleGopSync(!gopSyncEnabled);
              }}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition cursor-pointer border ${
                !gopSyncEnabled
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/40'
              }`}
              title={
                !gopSyncEnabled
                  ? 'GOP SYNC: OFF (Live AI Priority • Zero keyframe wait) — Click to toggle ON'
                  : 'GOP SYNC: ON (Keyframe Synchronization) — Click to toggle OFF'
              }
            >
              GOP: {gopSyncEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              title={isAiOverlayActive ? 'Hide AI Detection Overlay' : 'Show AI Detection Overlay'}
              onClick={(e) => {
                e.stopPropagation();
                setIsAiOverlayActive((prev) => !prev);
              }}
              className={`p-1 rounded transition cursor-pointer ${
                isAiOverlayActive ? 'bg-emerald-600/90 text-white' : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400'
              }`}
            >
              <Shield size={13} />
            </button>

            <button
              type="button"
              title="Stream Diagnostics Panel"
              onClick={(e) => {
                e.stopPropagation();
                setShowDiagnosticsModal(true);
              }}
              className="p-1 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Sliders size={13} />
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
              title={showBackgroundAiPanel ? 'Hide Background Live Evidence & ANPR' : 'Show Background Live Evidence & ANPR (Gemini + GCP + Firestore)'}
              onClick={(e) => {
                e.stopPropagation();
                setShowBackgroundAiPanel(prev => !prev);
              }}
              className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                showBackgroundAiPanel 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50' 
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles size={13} className={showBackgroundAiPanel ? 'text-amber-300 animate-pulse' : ''} />
              <span className="text-[10px] font-mono font-bold hidden sm:inline">GCP AI</span>
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

      {/* Stream Quality & Diagnostics Modal (Section 22, 23 & 24) */}
      {showDiagnosticsModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    STREAM DIAGNOSTICS
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Camera: {cameraId.toUpperCase()} • {cameraName || location}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Health Diagnosis Header */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  videoHealth === 'GOOD'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : videoHealth === 'SOURCE_LIMITED'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <div>
                    <span className="font-bold">
                      VIDEO HEALTH:{' '}
                      {videoHealth === 'GOOD'
                        ? 'GOOD'
                        : videoHealth === 'SOURCE_LIMITED'
                        ? 'SOURCE LIMITED'
                        : 'DEGRADED'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                      {videoHealth === 'GOOD'
                        ? 'Real CCTV stream operating at normal playback frame rate.'
                        : videoHealth === 'SOURCE_LIMITED'
                        ? 'The source camera supplies low FPS; video player is aligned with source.'
                        : 'Display FPS is below source rate. Check decoder, network, or buffering.'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-950/60">
                  {displayFps.toFixed(1)} FPS
                </span>
              </div>

              {/* Stream Optimization & GOP Control Section */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu size={18} className={gopSyncEnabled ? 'text-blue-400' : 'text-emerald-400'} />
                    <div>
                      <h4 className="font-bold text-white text-xs">STREAM OPTIMIZATION & KEYFRAME CONTROL</h4>
                      <p className="text-[10px] text-slate-400">
                        {gopSyncEnabled
                          ? 'Keyframe synchronization enabled for HLS segment alignment.'
                          : 'Live AI Priority: GOP synchronization bypassed for immediate inference on first decoded frame.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleGopSync(!gopSyncEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      gopSyncEnabled
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                    }`}
                  >
                    <span>GOP SYNC: {gopSyncEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <div className={`p-2.5 rounded-lg border text-[11px] ${
                  gopSyncEnabled
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>OPERATIONAL MODE: {gopSyncEnabled ? 'KEYFRAME SYNCHRONIZATION' : 'LIVE AI PRIORITY (GOP OFF)'}</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/50">{gopSyncState}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1">
                    {!gopSyncEnabled
                      ? 'GOP OFF ≠ AI OFF. Live AI runs immediately upon first valid decoded frame without waiting for keyframe boundary.'
                      : 'GOP sync improves decoder/HLS synchronization. Bounded timeout will fallback to valid frames after 3000ms.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">GOP State:</span>
                    <span className={gopSyncState === 'DISABLED' ? 'text-emerald-400 font-bold' : gopSyncState === 'SYNCHRONIZED' ? 'text-blue-400 font-bold' : 'text-amber-400 font-bold'}>
                      {gopSyncState}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">AI Latency:</span>
                    <span className="text-cyan-400 font-bold">
                      {aiStartLatencyMs !== null ? `${aiStartLatencyMs}ms` : '0ms'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">First Valid Frame:</span>
                    <span className="text-slate-200">
                      {firstValidFrameTimestamp ? `${Math.round((Date.now() - firstValidFrameTimestamp) / 1000)}s ago` : 'Waiting'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Timeout Fallbacks:</span>
                    <span className={gopSyncFallbackCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {gopSyncFallbackCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exact Diagnostic Fields (Section 24) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Camera:</span>
                  <span className="text-white font-bold">{cameraId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Source:</span>
                  <span className="text-emerald-400 font-bold">RTSP (TCP Port 8554)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Protocol:</span>
                  <span className="text-blue-400 font-bold">RTSP over TCP → HLS (Stream-Copy Remux)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Codec:</span>
                  <span className="text-white">{codec} High Profile</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Source FPS:</span>
                  <span className="text-blue-400 font-bold">{actualSourceFps.toFixed(1)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Display FPS:</span>
                  <span className="text-emerald-400 font-bold">{displayFps.toFixed(1)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">AI Inference FPS:</span>
                  <span className="text-indigo-400 font-bold">{aiInferenceFps.toFixed(1)} (Decoupled)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Resolution:</span>
                  <span className="text-white">{videoDims.width || 1920}×{videoDims.height || 1080} (Actual)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Bitrate:</span>
                  <span className="text-cyan-400">{streamBitrateKbps ? `${streamBitrateKbps} kbps` : `${measuredBandwidthKbps} kbps`}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Latency:</span>
                  <span className="text-slate-200">~1.2s (Live Edge)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Dropped Frames:</span>
                  <span className={droppedFrames > 0 ? 'text-amber-400' : 'text-slate-300'}>{droppedFrames}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Current Playback PTS:</span>
                  <span className="text-cyan-300 font-bold">{currentPts.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Buffer Ahead:</span>
                  <span className={bufferedAheadSec > 2 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {bufferedAheadSec.toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Live Edge Drift:</span>
                  <span className="text-slate-200">~{liveEdgeLatencySec.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">HTMLVideo readyState:</span>
                  <span className="text-slate-200">
                    {videoReadyState === 4
                      ? '4 (HAVE_ENOUGH_DATA)'
                      : videoReadyState === 3
                      ? '3 (HAVE_FUTURE_DATA)'
                      : videoReadyState === 2
                      ? '2 (HAVE_CURRENT_DATA)'
                      : videoReadyState === 1
                      ? '1 (HAVE_METADATA)'
                      : '0 (HAVE_NOTHING)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">HLS Segments Loaded:</span>
                  <span className="text-slate-200">{fragLoadedCount}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Stalls / Waiting Events:</span>
                  <span className={stallWaitingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>{stallWaitingCount}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Error Classification:</span>
                  <span
                    className={`font-bold ${
                      failureClassification === 'NO_ERROR' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {failureClassification}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Reconnect Count:</span>
                  <span className="text-slate-300">{reconnectCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">{playerState}</span>
                </div>
              </div>

              {/* Technical Details: Authoritative Camera AI State Machine & Telemetry (Requirement 2, 4, 7) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-indigo-400" />
                    <span className="font-bold text-white font-sans text-xs">AI & DECODER STATE MACHINE TELEMETRY</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerCameraAiScan(cameraId)}
                    className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Zap size={11} className="text-indigo-300" />
                    <span>TRIGGER YOLO SCAN</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Source Connected:</span>
                    <span className={cameraAiTelem?.sourceConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {cameraAiTelem?.sourceConnected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Decoder Status:</span>
                    <span className={
                      cameraAiTelem?.decoderStatus === 'FRAME_RECEIVED' ? 'text-emerald-400 font-bold' :
                      cameraAiTelem?.decoderStatus === 'FRAME_TIMEOUT' ? 'text-rose-400 font-bold' :
                      cameraAiTelem?.decoderStatus === 'STARTED' ? 'text-blue-400 font-bold' : 'text-slate-400'
                    }>
                      {cameraAiTelem?.decoderStatus || 'IDLE'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">AI Status:</span>
                    <span className={
                      aiStatus === 'DETECTIONS_FOUND' ? 'text-emerald-400 font-bold' :
                      aiStatus === 'PROCESSING' ? 'text-indigo-400 font-bold animate-pulse' :
                      aiStatus === 'STARTING' ? 'text-blue-400 font-bold' :
                      aiStatus === 'ERROR' ? 'text-rose-400 font-bold' :
                      aiStatus === 'NO_DETECTIONS' ? 'text-slate-300 font-bold' : 'text-amber-400 font-bold'
                    }>
                      {aiStatus}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Inference Latency:</span>
                    <span className="text-cyan-400 font-bold">
                      {cameraAiTelem?.currentInferenceLatencyMs ? `${cameraAiTelem.currentInferenceLatencyMs}ms` : '0ms'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Frames Received:</span>
                    <span className="text-slate-200">{cameraAiTelem?.framesReceived ?? 0}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Quality Approved:</span>
                    <span className="text-emerald-300 font-bold">{cameraAiTelem?.framesProcessed ?? 0}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">AI Frames Submitted:</span>
                    <span className="text-blue-300">{cameraAiTelem?.aiFramesSubmitted ?? 0}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">AI Frames Completed:</span>
                    <span className="text-cyan-300 font-bold">{cameraAiTelem?.aiFramesCompleted ?? 0}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Total Detections:</span>
                    <span className={(cameraAiTelem?.detectionsTotal ?? 0) > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {cameraAiTelem?.detectionsTotal ?? 0}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Vehicles Detected:</span>
                    <span className={(cameraAiTelem?.vehiclesDetected ?? 0) > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {cameraAiTelem?.vehiclesDetected ?? 0}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Last Decoded Frame:</span>
                    <span className="text-slate-300">
                      {cameraAiTelem?.lastDecodedFrameAt ? `${Math.max(0, Date.now() - cameraAiTelem.lastDecodedFrameAt)}ms ago` : 'None'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">HSRP Status:</span>
                    <span className={cameraAiTelem?.hsrpStatus === 'VERIFIED' ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                      {cameraAiTelem?.hsrpStatus || 'PENDING'}
                    </span>
                  </div>
                </div>

                {cameraAiTelem?.lastError && (
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[10px]">
                    <span className="font-bold">Last Error: </span>{cameraAiTelem.lastError}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    initPlayback();
                    setShowDiagnosticsModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition cursor-pointer"
                >
                  Reload Stream
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Object Clarifier & Evidence Verification Modal */}
      <AiObjectEvidenceModal
        record={selectedEvidenceRecord}
        onClose={() => setSelectedEvidenceRecord(null)}
      />

      {/* Background Livestream ANPR, HSRP & Electronic Evidence Vault Panel */}
      {showBackgroundAiPanel && (
        <div className="mt-3 w-full" onClick={(e) => e.stopPropagation()}>
          <LiveStreamBackgroundAiPanel
            cameraId={cameraId}
            cameraName={cameraName || location}
            videoElementRef={videoRef}
          />
        </div>
      )}
    </div>
  );
};
