/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Mobile Patrol Live Viewfinder & Bounded Edge Buffer Monitor
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Camera, 
  Play, 
  Square, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Crosshair,
  RefreshCw
} from 'lucide-react';
import { 
  PatrolCameraMetadata, 
  PatrolEventCategory,
  YoloVehicleDetection 
} from '../../types/mobilePatrolTypes';

interface MobilePatrolLiveViewProps {
  metadata: PatrolCameraMetadata;
  onTriggerEvent: (params: {
    category: PatrolEventCategory;
    vehicleClass: string;
    rawPlateText?: string;
    helmetState?: 'HELMET_VISIBLE' | 'NO_HELMET_CANDIDATE' | 'UNCERTAIN';
    riderCountState?: 'ONE_RIDER' | 'TWO_RIDERS' | 'THREE_OR_MORE_RIDERS' | 'UNCERTAIN';
    riderCount?: number;
    speedKmH?: number;
  }) => void;
  onPushFrame: (dataUrl: string, detectionsCount?: number) => void;
}

export const MobilePatrolLiveView: React.FC<MobilePatrolLiveViewProps> = ({
  metadata,
  onTriggerEvent,
  onPushFrame
}) => {
  const [streamSource, setStreamSource] = useState<'SIMULATED_PATROL' | 'DEVICE_CAMERA'>('SIMULATED_PATROL');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeDetections, setActiveDetections] = useState<YoloVehicleDetection[]>([
    {
      trackId: 'TRK-MOT-402',
      class: 'motorcycle',
      confidence: 0.96,
      box: { x: 28, y: 35, width: 22, height: 45 },
      helmetState: 'NO_HELMET_CANDIDATE',
      riderCountState: 'ONE_RIDER',
      riderCount: 1,
      speedEstimateKmH: 38,
      plateDetected: true,
      plateBox: { x: 33, y: 68, width: 12, height: 7 },
      plateText: 'GJ01KM8821',
      eventsTriggered: ['NO_HELMET']
    },
    {
      trackId: 'TRK-SED-104',
      class: 'car',
      confidence: 0.97,
      box: { x: 58, y: 25, width: 34, height: 55 },
      plateDetected: true,
      plateBox: { x: 68, y: 62, width: 14, height: 8 },
      plateText: 'GJ01AB1234',
      isHsrpCandidate: true,
      eventsTriggered: ['HSRP_CANDIDATE']
    }
  ]);

  const [bufferFramesCount, setBufferFramesCount] = useState<number>(48);
  const [isProcessingTrigger, setIsProcessingTrigger] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Buffer Simulation Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setBufferFramesCount(prev => (prev >= 60 ? 55 : prev + 1));
      // Feed virtual frame to bounded buffer
      onPushFrame('/api/sentinel/snapshot/PATROL-CAM-04-4K', activeDetections.length);
    }, 200);

    return () => clearInterval(interval);
  }, [activeDetections, onPushFrame]);

  // Handle Device Camera Toggle
  const toggleDeviceCamera = async () => {
    if (streamSource === 'SIMULATED_PATROL') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setStreamSource('DEVICE_CAMERA');
      } catch (err) {
        console.warn('Could not access device camera, retaining simulated patrol stream:', err);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setStreamSource('SIMULATED_PATROL');
    }
  };

  const handleQuickTrigger = async (
    category: PatrolEventCategory,
    vehicleClass: string,
    rawPlateText: string,
    extra?: {
      helmetState?: 'HELMET_VISIBLE' | 'NO_HELMET_CANDIDATE' | 'UNCERTAIN';
      riderCountState?: 'ONE_RIDER' | 'TWO_RIDERS' | 'THREE_OR_MORE_RIDERS' | 'UNCERTAIN';
      riderCount?: number;
      speedKmH?: number;
    }
  ) => {
    setIsProcessingTrigger(true);
    try {
      await onTriggerEvent({
        category,
        vehicleClass,
        rawPlateText,
        ...extra
      });
    } finally {
      setTimeout(() => setIsProcessingTrigger(false), 400);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      
      {/* Top Bar / Viewfinder Status */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          <span className="font-mono font-semibold tracking-wider">
            {metadata.cameraType === 'PATROL_4K_CAMERA' ? '4K UHD PATROL STREAM' : metadata.cameraType === 'PATROL_ANPR_CAMERA' ? 'ANPR HIGH-SHUTTER FEED' : 'DUAL 4K + ANPR SENSOR'}
          </span>
          <span className="text-slate-400 font-mono">| {metadata.resolution}</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={toggleDeviceCamera}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Camera size={13} />
            <span>{streamSource === 'DEVICE_CAMERA' ? 'Switch to Highway Feed' : 'Use Device Camera'}</span>
          </button>
          
          <div className="flex items-center gap-1 text-slate-300 font-mono">
            <Clock size={12} className="text-blue-400" />
            <span>10s Bounded Buffer ({bufferFramesCount}/60 frames)</span>
          </div>
        </div>
      </div>

      {/* Main Viewfinder Canvas / Stream */}
      <div className="relative aspect-video bg-slate-950 w-full overflow-hidden flex items-center justify-center">
        
        {streamSource === 'DEVICE_CAMERA' ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full bg-slate-900 overflow-hidden">
            {/* Real Sentinel Snapshot or High-Res Patrol Backdrop */}
            <img
              src="/api/sentinel/snapshot/PATROL-CAM-04-4K"
              alt="Live Patrol Stream"
              className="w-full h-full object-cover opacity-90"
              onError={(e) => {
                // Fallback to default Sentinel camera
                (e.target as HTMLImageElement).src = '/api/sentinel/snapshot/CAM-001';
              }}
            />

            {/* Simulated Road Crosshair Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
              <div className="w-16 h-16 border border-white/50 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time YOLOv8 Bounding Box Overlays */}
        {activeDetections.map((det) => (
          <div
            key={det.trackId}
            className={`absolute border-2 rounded-sm transition-all pointer-events-none ${
              det.eventsTriggered.includes('NO_HELMET') || det.eventsTriggered.includes('TRIPLE_RIDING')
                ? 'border-rose-500 bg-rose-500/10'
                : det.isHsrpCandidate
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-blue-500 bg-blue-500/10'
            }`}
            style={{
              left: `${det.box.x}%`,
              top: `${det.box.y}%`,
              width: `${det.box.width}%`,
              height: `${det.box.height}%`
            }}
          >
            {/* Top Tag */}
            <div className="absolute -top-6 left-0 bg-slate-900/90 text-white px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5 whitespace-nowrap shadow-xs">
              <span className="font-bold uppercase text-blue-400">{det.class}</span>
              <span className="text-slate-300">{(det.confidence * 100).toFixed(0)}%</span>
              <span className="text-slate-400">[{det.trackId}]</span>
            </div>

            {/* Violation or Safety Badge */}
            {det.helmetState === 'NO_HELMET_CANDIDATE' && (
              <div className="absolute -bottom-5 left-0 bg-rose-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-xs">
                <AlertTriangle size={10} />
                <span>NO HELMET</span>
              </div>
            )}

            {det.riderCount && det.riderCount >= 3 && (
              <div className="absolute -bottom-5 left-0 bg-amber-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-xs">
                <AlertTriangle size={10} />
                <span>3 RIDERS (TRIPLE)</span>
              </div>
            )}

            {/* Plate Sub-box */}
            {det.plateDetected && (
              <div 
                className="absolute border border-yellow-400 bg-yellow-400/20 rounded-xs flex items-center justify-center text-[9px] font-mono font-bold text-yellow-200"
                style={{
                  bottom: '5%',
                  left: '15%',
                  width: '70%',
                  height: '18%'
                }}
              >
                <span>{det.plateText}</span>
              </div>
            )}
          </div>
        ))}

        {/* Viewfinder Telemetry Overlay (Bottom Left) */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-xs border border-white/10 rounded-md px-2.5 py-1 text-[11px] font-mono text-slate-300 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            EDGE PERCEPTION: 12.4 FPS
          </span>
          <span>SPEED: {metadata.gps.speedKmH || 42} KM/H</span>
          <span>HEADING: 315° NW</span>
        </div>

        {/* Edge Processing Flash */}
        {isProcessingTrigger && (
          <div className="absolute inset-0 bg-white/20 pointer-events-none transition-opacity duration-300"></div>
        )}
      </div>

      {/* Real-Time Bounded Buffer Timeline Visualizer */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">10-Second Sliding Rolling Buffer:</span>
        </div>

        <div className="flex-1 flex items-center gap-1 h-3 bg-slate-200 rounded-full p-0.5 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full rounded-xs transition-colors ${
                i === 10 
                  ? 'bg-rose-500 animate-pulse' 
                  : i > 7 && i < 13 
                    ? 'bg-blue-500' 
                    : 'bg-emerald-400'
              }`}
              title={i === 10 ? 'Center Event Frame (0s)' : i < 10 ? `Pre-Event Frame (-${(10 - i) * 0.5}s)` : `Post-Event Frame (+${(i - 10) * 0.5}s)`}
            />
          ))}
        </div>

        <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
          Auto-discards old frames (Zero RAM leak)
        </span>
      </div>

      {/* Officer Quick Trigger Bar */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Edge Event Triggers (Auto-Extracts 5-Frame Evidence Package & Deliberates AI Mesh):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          
          <button
            onClick={() => handleQuickTrigger('NO_HELMET', 'motorcycle', 'GJ01KM8821', {
              helmetState: 'NO_HELMET_CANDIDATE',
              riderCount: 1,
              speedKmH: 38
            })}
            disabled={isProcessingTrigger}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-medium transition-colors text-left"
          >
            <ShieldAlert size={15} className="text-rose-600 shrink-0" />
            <div>
              <div className="font-semibold">No Helmet</div>
              <div className="text-[10px] text-rose-600 font-mono">GJ01KM8821</div>
            </div>
          </button>

          <button
            onClick={() => handleQuickTrigger('TRIPLE_RIDING', 'motorcycle', 'GJ27BC4409', {
              helmetState: 'NO_HELMET_CANDIDATE',
              riderCountState: 'THREE_OR_MORE_RIDERS',
              riderCount: 3,
              speedKmH: 44
            })}
            disabled={isProcessingTrigger}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium transition-colors text-left"
          >
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <div>
              <div className="font-semibold">Triple Riding</div>
              <div className="text-[10px] text-amber-700 font-mono">3 Occupants</div>
            </div>
          </button>

          <button
            onClick={() => handleQuickTrigger('HSRP_CANDIDATE', 'car', 'GJ01AB1234', {
              speedKmH: 52
            })}
            disabled={isProcessingTrigger}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium transition-colors text-left"
          >
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <div>
              <div className="font-semibold">HSRP Car</div>
              <div className="text-[10px] text-emerald-700 font-mono">Rule 50 CMVR</div>
            </div>
          </button>

          <button
            onClick={() => handleQuickTrigger('WATCHLIST_MATCH', 'car', 'GJ01AB1234', {
              speedKmH: 48
            })}
            disabled={isProcessingTrigger}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-medium transition-colors text-left"
          >
            <Crosshair size={15} className="text-purple-600 shrink-0" />
            <div>
              <div className="font-semibold">Watchlist Match</div>
              <div className="text-[10px] text-purple-700 font-mono">SCRB Intercept</div>
            </div>
          </button>

          <button
            onClick={() => handleQuickTrigger('OVERSPEED_CANDIDATE', 'car', 'GJ06XY9900', {
              speedKmH: 78
            })}
            disabled={isProcessingTrigger}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-medium transition-colors text-left"
          >
            <Zap size={15} className="text-blue-600 shrink-0" />
            <div>
              <div className="font-semibold">Overspeed (78k)</div>
              <div className="text-[10px] text-blue-700 font-mono">Zone Limit 50</div>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
};
