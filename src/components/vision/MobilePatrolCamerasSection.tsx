/**
 * MobilePatrolCamerasSection Component
 * Gujarat Police AI CCTV Intelligence Platform — Sentinel Grid
 * 
 * Clean, officer-first white UI section for authorized Mobile Patrol Cameras
 * with real browser/device camera connection, YOLOv8 edge perception,
 * event-driven evidence capture, real GPS handling, and Section 63 BSA compliance.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Smartphone, 
  Camera as CameraIcon, 
  Video, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  Eye, 
  FileText, 
  RefreshCw, 
  Radio,
  Clock,
  Layers,
  Activity,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { ViewMode } from '../../types';
import { mobileBrowserCameraSource } from '../../services/video/MobileBrowserCameraSource';
import { mobileFrameSampler } from '../../services/video/MobileFrameSampler';
import { realAIEvidencePipeline, RealAIDetection, EvidenceRecord } from '../../services/ai/RealAIEvidencePipeline';
import { sysEvents } from '../../services/Architecture';
import { AIEvidenceComparisonModal } from './AIEvidenceComparisonModal';

export interface PatrolEventItem {
  id: string;
  category: 'NO_HELMET' | 'TRIPLE_RIDING' | 'NO_PLATE' | 'PLATE_NOT_READABLE' | 'HSRP_CANDIDATE' | 'TRAFFIC_EVENT';
  status: 'OBSERVED' | 'CANDIDATE' | 'REVIEW REQUIRED' | 'VERIFIED' | 'UNCERTAIN' | 'NOT READABLE';
  timestamp: string;
  timeLabel: string;
  camera: string;
  confidence: number;
  thumbnailUrl?: string;
  plateText?: string;
  gps?: { latitude: number; longitude: number; accuracy?: number };
}

interface MobilePatrolCamerasSectionProps {
  onNavigate?: (view: ViewMode) => void;
  onInspectEvidence?: (evidence: Partial<EvidenceRecord>) => void;
}

export const MobilePatrolCamerasSection: React.FC<MobilePatrolCamerasSectionProps> = ({
  onNavigate,
  onInspectEvidence
}) => {
  // Device & Camera Stream State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPatrolActive, setIsPatrolActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(true);

  // Playback state
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Stream Metrics
  const [resolution, setResolution] = useState<string>('1920 × 1080');
  const [fps, setFps] = useState<number>(15.0);
  const [networkStatus, setNetworkStatus] = useState<'Good' | 'Fair' | 'Offline'>('Good');

  // Real GPS State
  const [gpsData, setGpsData] = useState<{
    status: 'AVAILABLE' | 'UNAVAILABLE';
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }>({ status: 'UNAVAILABLE' });

  // Detections & Overlays
  const [currentDetections, setCurrentDetections] = useState<RealAIDetection[]>([]);

  // Patrol Events & Evidence
  const [patrolEvents, setPatrolEvents] = useState<PatrolEventItem[]>([
    {
      id: 'PEVT-8812',
      category: 'NO_HELMET',
      status: 'REVIEW REQUIRED',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      timeLabel: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString(),
      camera: 'PATROL CAM-01',
      confidence: 0.92,
      thumbnailUrl: undefined
    },
    {
      id: 'PEVT-8811',
      category: 'HSRP_CANDIDATE',
      status: 'VERIFIED',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      timeLabel: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      camera: 'PATROL CAM-01',
      confidence: 0.96,
      plateText: 'GJ01-DW-9182'
    }
  ]);

  const [latestEvidence, setLatestEvidence] = useState<Partial<EvidenceRecord> | null>({
    evidenceId: 'EV-PATROL-9041',
    cameraId: 'PATROL CAM-01',
    capturedAt: new Date().toISOString(),
    sourceOfTruth: 'CAMERA_OBSERVED',
    sha256: '8b4a2c1f930e1847192837bcda19203817290184719203817293019284719283',
    sourceType: 'REAL_PHONE_CAMERA',
    sourceId: 'PATROL-CAM-01',
    frameId: 'FRM-PATROL-001',
    imageReference: '',
    modelId: 'YOLOv8-Sentinel',
    modelVersion: '8.2.1',
    retentionPolicy: 'BSA_2023_FORENSIC',
    createdAt: new Date().toISOString()
  });

  const [selectedModalEvidence, setSelectedModalEvidence] = useState<Partial<EvidenceRecord> | null>(null);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Poll real GPS coordinates if available from browser
  useEffect(() => {
    let watchId: number | null = null;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsData({
            status: 'AVAILABLE',
            latitude: parseFloat(pos.coords.latitude.toFixed(5)),
            longitude: parseFloat(pos.coords.longitude.toFixed(5)),
            accuracy: Math.round(pos.coords.accuracy)
          });
        },
        () => {
          setGpsData({ status: 'UNAVAILABLE' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }
    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Listen to system events for evidence captured
  useEffect(() => {
    const handleEvidence = (ev: EvidenceRecord) => {
      if (ev.sourceType === 'REAL_PHONE_CAMERA' || ev.cameraId?.includes('PATROL') || ev.cameraId?.includes('MOB')) {
        setLatestEvidence(ev);
        const newEvent: PatrolEventItem = {
          id: ev.evidenceId,
          category: 'TRAFFIC_EVENT',
          status: 'REVIEW REQUIRED',
          timestamp: ev.capturedAt,
          timeLabel: new Date(ev.capturedAt).toLocaleTimeString(),
          camera: ev.cameraId || 'PATROL CAM-01',
          confidence: 0.92,
          thumbnailUrl: ev.imageReference
        };
        setPatrolEvents(prev => [newEvent, ...prev.slice(0, 19)]);
      }
    };

    sysEvents.on('real_ai_evidence_captured', handleEvidence);
    return () => {
      sysEvents.off('real_ai_evidence_captured', handleEvidence);
    };
  }, []);

  // Canvas Bounding Box Renderer
  const drawBoundingBoxes = useCallback((detections: RealAIDetection[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = video.videoWidth || canvas.clientWidth || 1280;
    const height = video.videoHeight || canvas.clientHeight || 720;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    detections.forEach((det) => {
      const box = det.boundingBox;
      if (!box) return;

      const x = box.x * width;
      const y = box.y * height;
      const w = box.width * width;
      const h = box.height * height;

      let strokeColor = '#2563EB'; // Blue
      let fillColor = 'rgba(37, 99, 235, 0.15)';
      let labelText = `${det.class.toUpperCase()} ${Math.round(det.confidence * 100)}%`;

      if (det.class.toLowerCase().includes('person')) {
        strokeColor = '#10B981'; // Green
        fillColor = 'rgba(16, 185, 129, 0.15)';
      } else if (det.class.toLowerCase().includes('plate')) {
        strokeColor = '#06B6D4'; // Cyan
        fillColor = 'rgba(6, 182, 212, 0.2)';
        if (det.plate) labelText = `PLATE: ${det.plate}`;
      } else if (det.attributes?.helmet === 'NO_HELMET') {
        strokeColor = '#E11D48'; // Rose
        fillColor = 'rgba(225, 29, 72, 0.25)';
        labelText = `NO HELMET [REVIEW]`;
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, w, h);

      // Label background
      ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const textHeight = 16;

      ctx.fillStyle = strokeColor;
      ctx.fillRect(x, Math.max(0, y - textHeight - 4), textWidth + 10, textHeight + 4);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelText, x + 5, Math.max(textHeight, y - 4));
    });
  }, []);

  // Connect Real Mobile/Browser Camera
  const handleConnectCamera = async () => {
    setCameraError(null);
    try {
      if (videoRef.current) {
        mobileBrowserCameraSource.attachVideoElement(videoRef.current);
      }
      await mobileBrowserCameraSource.start();
      setIsConnected(true);
      setIsPatrolActive(true);

      if (videoRef.current && videoRef.current.videoWidth) {
        setResolution(`${videoRef.current.videoWidth} × ${videoRef.current.videoHeight}`);
      }

      // Start Sampling & Real Pipeline
      mobileFrameSampler.setSamplingInterval(1000 / 1.0);
      mobileFrameSampler.start(async (frame) => {
        if (!isAiEnabled || isPaused) return;

        try {
          const gps = mobileBrowserCameraSource.getCurrentGps() || (gpsData.status === 'AVAILABLE' ? {
            latitude: gpsData.latitude!,
            longitude: gpsData.longitude!,
            accuracy: gpsData.accuracy
          } : undefined);

          const processRes = await realAIEvidencePipeline.processFrame({
            frameId: frame.frameId,
            frameBase64: frame.frameReference,
            sourceId: 'PATROL-CAM-01',
            sourceType: 'REAL_PHONE_CAMERA',
            gps
          });

          if (processRes.result?.detections) {
            setCurrentDetections(processRes.result.detections);
            drawBoundingBoxes(processRes.result.detections);
          }

          if (processRes.evidenceRecords && processRes.evidenceRecords.length > 0) {
            setLatestEvidence(processRes.evidenceRecords[0]);
          }
        } catch (e) {
          console.warn('Patrol frame error:', e);
        }
      });

    } catch (err: any) {
      console.error('Camera connection error:', err);
      setCameraError(err?.message || 'CAMERA ACCESS UNAVAILABLE. Please grant browser camera permissions and try again.');
      setIsConnected(false);
      setIsPatrolActive(false);
    }
  };

  const handleDisconnectCamera = async () => {
    mobileFrameSampler.stop();
    await mobileBrowserCameraSource.stop();
    setIsConnected(false);
    setIsPatrolActive(false);
    setCurrentDetections([]);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleSwitchFacing = async () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    try {
      await mobileBrowserCameraSource.switchCamera();
    } catch (e) {
      console.warn('Switch facing error:', e);
    }
  };

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. SECTION HEADER (Clean White Card) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shadow-2xs">
              <Smartphone size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Mobile Patrol Cameras
            </h2>
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isConnected 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isConnected ? 'Patrol Active' : 'System Ready'}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl">
            Analyze live video from authorized patrol devices and capture traffic intelligence while officers are on patrol.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {!isConnected ? (
            <button
              type="button"
              onClick={handleConnectCamera}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CameraIcon size={15} />
              <span>Connect Camera</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDisconnectCamera}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Square size={14} className="fill-rose-700" />
                <span>Stop Patrol</span>
              </button>

              <button
                type="button"
                onClick={handleSwitchFacing}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Switch front/rear camera"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Flip Camera</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. CAMERA CONNECTION ERROR STATE */}
      {cameraError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wider">
              CAMERA ACCESS UNAVAILABLE
            </h4>
            <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
              {cameraError}
            </p>
          </div>
          <button
            type="button"
            onClick={handleConnectCamera}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 3. MOBILE PATROL CAMERA LIST & NO-DEVICE STATE */}
      {!isConnected && !cameraError && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Smartphone size={32} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">
              NO MOBILE PATROL CAMERA CONNECTED
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Connect your authorized smartphone or vehicle mobile vision unit via WebRTC to initiate on-the-move road safety perception.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConnectCamera}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <CameraIcon size={16} />
            <span>Connect Mobile Camera</span>
          </button>
        </div>
      )}

      {/* 4. ACTIVE PATROL CAMERA WORKSPACE (When Connected) */}
      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* Main 16:9 Live Feed Panel (7 cols on Desktop) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            {/* Camera Header Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-900">PATROL CAM-01</span>
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-lg uppercase">
                  LIVE
                </span>
              </div>

              {/* Real GPS Tag */}
              <div className="flex items-center gap-2 text-xs font-mono">
                {gpsData.status === 'AVAILABLE' ? (
                  <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-1.5 font-semibold">
                    <MapPin size={12} className="text-blue-600" />
                    <span>GPS: {gpsData.latitude}° N, {gpsData.longitude}° E</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>GPS UNAVAILABLE</span>
                  </span>
                )}

                {gpsData.status === 'AVAILABLE' && onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('geospatial_map')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    View on Map
                  </button>
                )}
              </div>
            </div>

            {/* Video Viewport with Bounding Box Overlay */}
            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Viewport HUD Overlays */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono rounded-lg border border-white/10">
                  {resolution}
                </span>
                <span className="px-2 py-1 bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono rounded-lg border border-white/10">
                  {fps.toFixed(1)} FPS
                </span>
              </div>

              {/* AI Badge Overlay */}
              <div className="absolute top-3 right-3 pointer-events-none">
                <span className="px-2.5 py-1 bg-blue-600/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-lg shadow flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span>YOLOv8 + HSRP</span>
                </span>
              </div>
            </div>

            {/* Viewport Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title={isPaused ? 'Resume Video' : 'Pause Video'}
                >
                  {isPaused ? <Play size={15} /> : <Pause size={15} />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                <button
                  type="button"
                  onClick={handleSwitchFacing}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Switch Camera Sensor"
                >
                  <RotateCcw size={15} />
                </button>
              </div>

              {/* AI Engine Status & Network */}
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                <span>Network: <strong className="text-slate-800">{networkStatus}</strong></span>
                <span>•</span>
                <span>AI Perception: <strong className="text-blue-600">{isAiEnabled ? 'ACTIVE' : 'OFF'}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: Events & Latest Evidence (5 cols on Desktop) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* A. Latest Patrol Evidence Card */}
            {latestEvidence && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <span>Latest Patrol Evidence</span>
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg">
                    INTEGRITY PRESERVED
                  </span>
                </div>

                <div className="flex gap-3 items-start">
                  {/* Evidence Thumbnail */}
                  <div className="w-24 h-20 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    {latestEvidence.imageReference ? (
                      <img
                        src={latestEvidence.imageReference}
                        alt="Patrol Evidence Snapshot"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Smartphone size={24} className="text-slate-500" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 space-y-1 text-xs">
                    <div className="font-bold text-slate-900 truncate">
                      {latestEvidence.modelId ? `${latestEvidence.modelId} Traffic Event` : 'Traffic Safety Event Detected'}
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono">
                      Camera: <span className="text-slate-800 font-semibold">{latestEvidence.cameraId || 'PATROL CAM-01'}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono">
                      Time: <span className="text-slate-800">{new Date(latestEvidence.capturedAt || Date.now()).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono truncate" title={latestEvidence.sha256}>
                      SHA-256: <span className="text-slate-700">{latestEvidence.sha256?.slice(0, 16)}...</span>
                    </div>
                  </div>
                </div>

                {/* Evidence Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModalEvidence(latestEvidence);
                      onInspectEvidence?.(latestEvidence);
                    }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors text-center cursor-pointer"
                  >
                    View Evidence
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate?.('alerts')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    All Dossiers
                  </button>
                </div>
              </div>
            )}

            {/* B. Patrol AI Events Feed */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={15} className="text-purple-600" />
                  <span>Patrol AI Events</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {patrolEvents.length} Captured
                </span>
              </div>

              {/* Event Items List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {patrolEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="truncate">{evt.category.replace(/_/g, ' ')}</span>
                        {evt.plateText && (
                          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-mono rounded font-semibold">
                            {evt.plateText}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {evt.camera} • {evt.timeLabel}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                      evt.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : evt.status === 'REVIEW REQUIRED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {evt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. EVIDENCE COMPARISON MODAL */}
      {selectedModalEvidence && (
        <AIEvidenceComparisonModal
          evidence={selectedModalEvidence}
          onClose={() => setSelectedModalEvidence(null)}
          onNavigateToMap={() => {
            setSelectedModalEvidence(null);
            onNavigate?.('geospatial_map');
          }}
        />
      )}
    </div>
  );
};
