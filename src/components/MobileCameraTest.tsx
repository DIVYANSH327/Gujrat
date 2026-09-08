/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * MobileCameraTest: Production-structured Mobile Camera Test View
 * 
 * Objectives (Phase 1):
 * 1. Android browser accesses phone camera via getUserMedia()
 * 2. Displays live phone camera stream
 * 3. Captures real pixel frame into canvas
 * 4. Samples actual frames at 1 FPS into existing event/edge bus
 * 5. Tags provenance as MOBILE_CAMERA / REAL_CAMERA / analysisMode: NONE
 * 6. Clean track teardown and robust error handling
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Video,
  VideoOff,
  Camera,
  Play,
  Pause,
  Square,
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Clock,
  Compass,
  Layers,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Maximize2
} from 'lucide-react';
import { 
  ViewMode, 
  MobileCameraConnectionState, 
  MobileCameraFrame, 
  MobileCameraMetrics 
} from '../types';
import { mobileBrowserCameraSource } from '../services/video/MobileBrowserCameraSource';
import { mobileFrameSampler } from '../services/video/MobileFrameSampler';
import { sysEvents } from '../services/Architecture';

interface MobileCameraTestProps {
  onNavigate?: (view: ViewMode) => void;
}

export function MobileCameraTest({ onNavigate }: MobileCameraTestProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [connectionState, setConnectionState] = useState<MobileCameraConnectionState>(
    mobileBrowserCameraSource.getConnectionState()
  );
  const [isSampling, setIsSampling] = useState<boolean>(mobileFrameSampler.isActive());
  const [lastFrame, setLastFrame] = useState<MobileCameraFrame | null>(null);
  const [recentFrames, setRecentFrames] = useState<MobileCameraFrame[]>([]);
  const [metrics, setMetrics] = useState<MobileCameraMetrics>(mobileBrowserCameraSource.getMetrics());
  const [errorMessage, setErrorMessage] = useState<string | null>(mobileBrowserCameraSource.getLastErrorMessage());
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(mobileBrowserCameraSource.getFacingMode());
  const [isDashcamMode, setIsDashcamMode] = useState<boolean>(false);
  const [currentGps, setCurrentGps] = useState(mobileBrowserCameraSource.getCurrentGps());
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Bind video element and event listeners
  useEffect(() => {
    if (videoRef.current) {
      mobileBrowserCameraSource.attachVideoElement(videoRef.current);
    }

    // Subscribe to sampler
    const unsubscribeSampler = mobileFrameSampler.subscribe((frame) => {
      setLastFrame(frame);
      setRecentFrames((prev) => [frame, ...prev.slice(0, 5)]);
      setMetrics(mobileBrowserCameraSource.getMetrics());
      setCurrentGps(mobileBrowserCameraSource.getCurrentGps());
    });

    const handleCameraStarted = () => {
      setConnectionState('CONNECTED');
      setErrorMessage(null);
      setMetrics(mobileBrowserCameraSource.getMetrics());
    };

    const handleCameraStopped = () => {
      setConnectionState('DISCONNECTED');
      setIsSampling(false);
      setMetrics(mobileBrowserCameraSource.getMetrics());
    };

    const handleCameraPaused = () => {
      setConnectionState('PAUSED');
    };

    const handleCameraResumed = () => {
      setConnectionState('CONNECTED');
    };

    const handleFrameCaptured = (frame: MobileCameraFrame) => {
      setLastFrame(frame);
      setRecentFrames((prev) => [frame, ...prev.slice(0, 5)]);
      setMetrics(mobileBrowserCameraSource.getMetrics());
      setCurrentGps(mobileBrowserCameraSource.getCurrentGps());
    };

    sysEvents.on('mobile_camera_started', handleCameraStarted);
    sysEvents.on('mobile_camera_stopped', handleCameraStopped);
    sysEvents.on('mobile_camera_paused', handleCameraPaused);
    sysEvents.on('mobile_camera_resumed', handleCameraResumed);
    sysEvents.on('mobile_camera_frame_captured', handleFrameCaptured);

    // Track viewport orientation for dashcam mode
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        setOrientation(window.innerWidth >= window.innerHeight ? 'LANDSCAPE' : 'PORTRAIT');
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    // Initial state sync
    setConnectionState(mobileBrowserCameraSource.getConnectionState());
    setIsSampling(mobileFrameSampler.isActive());

    return () => {
      unsubscribeSampler();
      sysEvents.off('mobile_camera_started', handleCameraStarted);
      sysEvents.off('mobile_camera_stopped', handleCameraStopped);
      sysEvents.off('mobile_camera_paused', handleCameraPaused);
      sysEvents.off('mobile_camera_resumed', handleCameraResumed);
      sysEvents.off('mobile_camera_frame_captured', handleFrameCaptured);
      window.removeEventListener('resize', checkOrientation);

      // Phase 1 Clean Teardown: Stop camera and sampler on unmount
      mobileFrameSampler.stop();
      mobileBrowserCameraSource.stop().catch(() => {});
    };
  }, []);

  // Update video element reference if element remounts
  useEffect(() => {
    if (videoRef.current) {
      mobileBrowserCameraSource.attachVideoElement(videoRef.current);
    }
  }, [connectionState]);

  const handleStartCamera = async () => {
    setErrorMessage(null);
    setConnectionState('REQUESTING_PERMISSION');
    try {
      if (videoRef.current) {
        mobileBrowserCameraSource.attachVideoElement(videoRef.current);
      }
      await mobileBrowserCameraSource.start();
      setConnectionState('CONNECTED');
      setFacingMode(mobileBrowserCameraSource.getFacingMode());
      setMetrics(mobileBrowserCameraSource.getMetrics());
    } catch (err: any) {
      setConnectionState('ERROR');
      setErrorMessage(err?.message || 'Failed to access device camera.');
    }
  };

  const handleStopCamera = async () => {
    mobileFrameSampler.stop();
    setIsSampling(false);
    await mobileBrowserCameraSource.stop();
    setConnectionState('DISCONNECTED');
    setMetrics(mobileBrowserCameraSource.getMetrics());
  };

  const handlePauseResume = () => {
    if (connectionState === 'CONNECTED') {
      mobileBrowserCameraSource.pause();
      mobileFrameSampler.pause();
      setConnectionState('PAUSED');
    } else if (connectionState === 'PAUSED') {
      mobileBrowserCameraSource.resume();
      mobileFrameSampler.resume();
      setConnectionState('CONNECTED');
    }
  };

  const handleCaptureSingleFrame = async () => {
    try {
      const frame = await mobileBrowserCameraSource.captureFrame(false);
      if (frame) {
        setLastFrame(frame);
        setRecentFrames((prev) => [frame, ...prev.slice(0, 5)]);
        setMetrics(mobileBrowserCameraSource.getMetrics());
      }
    } catch (err: any) {
      console.error('Frame capture failed:', err);
    }
  };

  const handleToggleSampling = () => {
    if (isSampling) {
      mobileFrameSampler.stop();
      setIsSampling(false);
    } else {
      if (connectionState !== 'CONNECTED') {
        setErrorMessage('Camera must be CONNECTED before starting frame sampling.');
        return;
      }
      mobileFrameSampler.start();
      setIsSampling(true);
    }
  };

  const handleSwitchFacingMode = async () => {
    setIsSwitching(true);
    try {
      await mobileBrowserCameraSource.switchCamera();
      setFacingMode(mobileBrowserCameraSource.getFacingMode());
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to switch camera device.');
    } finally {
      setIsSwitching(false);
    }
  };

  // Status badge styling
  const getStatusBadge = () => {
    switch (connectionState) {
      case 'CONNECTED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            CONNECTED
          </span>
        );
      case 'REQUESTING_PERMISSION':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            REQUESTING PERMISSION
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-yellow-950/80 text-yellow-300 border border-yellow-500/40">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            PAUSED
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            ERROR
          </span>
        );
      case 'DISCONNECTED':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-700">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            DISCONNECTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fade-in text-zinc-100 max-w-7xl mx-auto pb-12">
      {/* Top Header & Context Bar */}
      <div className="bg-[#090d16] border border-cyan-950/70 rounded-xl p-4 md:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('cameras')}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-zinc-200 transition-colors mr-1"
                  title="Return to Camera Matrix"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <h1 className="text-lg md:text-xl font-bold font-mono tracking-wide text-zinc-100 flex items-center gap-2">
                <Smartphone className="text-emerald-400" size={22} />
                MOBILE CAMERA TEST
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                PHASE 1 REAL SOURCE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                AI: NOT CONNECTED
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400">
              GUJARAT UNIFIED CCTV INTELLIGENCE GRID • BROWSER GETUSERMEDIA REAL CAMERA ADAPTER
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-mono text-zinc-400">CAMERA ID</div>
              <div className="text-xs font-mono font-bold text-cyan-300">{mobileBrowserCameraSource.id}</div>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Error / Alert Display */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-500/50 rounded-xl flex items-start gap-3 text-xs font-mono text-rose-200">
          <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={16} />
          <div className="space-y-1 flex-1">
            <div className="font-bold tracking-wide text-rose-300">CAMERA ACCESS NOTIFICATION</div>
            <div>{errorMessage}</div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-zinc-200 text-sm p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Column / Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Center Column: Live Camera Video Viewport & Direct Controls */}
        <div className="lg:col-span-8 space-y-4">
          <div className={`bg-[#06080d] border border-cyan-950/80 rounded-xl overflow-hidden shadow-2xl relative flex flex-col ${isDashcamMode ? 'ring-2 ring-emerald-500/40' : ''}`}>
            {/* Viewport Header */}
            <div className="p-3 bg-[#090d16] border-b border-cyan-950/70 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-zinc-200">LIVE CAMERA PREVIEW</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                  {facingMode === 'environment' ? 'BACK SENSOR' : 'FRONT SENSOR'}
                </span>
                {isDashcamMode && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/40 font-bold">
                    DASHCAM MODE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                <span>{metrics.cameraWidth > 0 ? `${metrics.cameraWidth}×${metrics.cameraHeight}` : '1920×1080 (REQ)'}</span>
                <span className="hidden sm:inline">ORIENTATION: {orientation}</span>
              </div>
            </div>

            {/* Video Canvas Viewport Container */}
            <div className="relative bg-black min-h-[300px] sm:min-h-[420px] max-h-[560px] flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                style={{ maxHeight: isDashcamMode ? '500px' : '440px' }}
              />

              {/* Viewport HUD Reticles (CCTV Command Center Aesthetics) */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner reticles */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400/70" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400/70" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400/70" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400/70" />

                {/* Center crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none opacity-40">
                  <div className="w-full h-[1px] bg-cyan-400 absolute top-1/2" />
                  <div className="h-full w-[1px] bg-cyan-400 absolute left-1/2" />
                </div>

                {/* Top overlay watermark */}
                <div className="absolute top-3 left-8 text-[9px] font-mono text-cyan-400/80 bg-black/60 px-2 py-0.5 rounded border border-cyan-900/40 tracking-wider">
                  GUJARAT POLICE • MOB-ANDROID-001 • REAL SENSOR
                </div>

                {/* Live sampling indicator */}
                {isSampling && (
                  <div className="absolute top-3 right-8 flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>SAMPLING 1 FPS</span>
                  </div>
                )}
              </div>

              {/* Offline / Standby / Requesting Overlay */}
              {connectionState !== 'CONNECTED' && connectionState !== 'PAUSED' && (
                <div className="absolute inset-0 bg-[#06080d]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
                  {connectionState === 'REQUESTING_PERMISSION' ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-amber-950/40 border border-amber-500/50 flex items-center justify-center text-amber-400 animate-pulse">
                        <Camera size={26} />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <div className="text-sm font-mono font-bold text-amber-300">
                          AWAITING PERMISSION
                        </div>
                        <p className="text-xs font-mono text-zinc-400">
                          Check your Android browser prompt and tap <strong>Allow</strong> to grant camera access.
                        </p>
                      </div>
                    </>
                  ) : connectionState === 'ERROR' ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-rose-950/40 border border-rose-500/50 flex items-center justify-center text-rose-400">
                        <XCircle size={26} />
                      </div>
                      <div className="space-y-1 max-w-md">
                        <div className="text-sm font-mono font-bold text-rose-300">
                          CAMERA ACCESS HALTED
                        </div>
                        <p className="text-xs font-mono text-zinc-300">
                          {errorMessage || 'Browser camera initialization error.'}
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={handleStartCamera}
                            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded text-xs font-mono transition-colors"
                          >
                            RETRY CAMERA PERMISSION
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400">
                        <VideoOff size={26} />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <div className="text-sm font-mono font-bold text-zinc-200">
                          PHONE CAMERA DISCONNECTED
                        </div>
                        <p className="text-xs font-mono text-zinc-400">
                          Tap <strong>START CAMERA</strong> below to activate Android browser camera test mode.
                        </p>
                      </div>
                      <button
                        onClick={handleStartCamera}
                        className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg text-xs font-mono flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                      >
                        <Play size={14} />
                        START CAMERA
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Camera Action Bar */}
            <div className="p-3.5 bg-[#090d16] border-t border-cyan-950/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {connectionState !== 'CONNECTED' && connectionState !== 'PAUSED' ? (
                  <button
                    onClick={handleStartCamera}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    <Play size={15} />
                    START CAMERA
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCaptureSingleFrame}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 shadow transition-all active:scale-95"
                    >
                      <Camera size={15} />
                      CAPTURE FRAME
                    </button>

                    <button
                      onClick={handleToggleSampling}
                      className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow ${
                        isSampling
                          ? 'bg-amber-600 hover:bg-amber-500 text-black'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                      }`}
                    >
                      <Sliders size={14} />
                      {isSampling ? 'STOP SAMPLING' : 'START SAMPLING (1 FPS)'}
                    </button>

                    <button
                      onClick={handlePauseResume}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border border-zinc-700"
                    >
                      {connectionState === 'PAUSED' ? <Play size={14} /> : <Pause size={14} />}
                      {connectionState === 'PAUSED' ? 'RESUME' : 'PAUSE'}
                    </button>

                    <button
                      onClick={handleStopCamera}
                      className="px-3 py-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/50 text-rose-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                    >
                      <Square size={13} />
                      STOP
                    </button>
                  </>
                )}
              </div>

              {/* Auxiliary Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSwitchFacingMode}
                  disabled={isSwitching || connectionState !== 'CONNECTED'}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-cyan-800/40 text-cyan-300 rounded text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Switch Front/Back Lens"
                >
                  <RefreshCw size={13} className={isSwitching ? 'animate-spin' : ''} />
                  <span>{facingMode === 'environment' ? 'BACK ⇋ FRONT' : 'FRONT ⇋ BACK'}</span>
                </button>

                <button
                  onClick={() => setIsDashcamMode(!isDashcamMode)}
                  className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-colors border ${
                    isDashcamMode
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Toggle Dashcam Orientation Layout"
                >
                  <Maximize2 size={13} />
                  <span>DASHCAM</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real Frame Telemetry Pipeline Box */}
          <div className="bg-[#090d16] border border-cyan-950/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-950/60 pb-2">
              <div className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-2">
                <Layers size={14} className="text-cyan-400" />
                FRAME SAMPLING & TELEMETRY PIPELINE
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                RATE: 1 FPS (1000ms)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-[#06080d] p-2.5 rounded border border-cyan-950/50">
                <div className="text-[10px] text-zinc-500 uppercase">FRAMES CAPTURED</div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">{metrics.framesCaptured}</div>
              </div>
              <div className="bg-[#06080d] p-2.5 rounded border border-cyan-950/50">
                <div className="text-[10px] text-zinc-500 uppercase">FRAMES SAMPLED</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{metrics.framesSampled}</div>
              </div>
              <div className="bg-[#06080d] p-2.5 rounded border border-cyan-950/50">
                <div className="text-[10px] text-zinc-500 uppercase">DROPPED FRAMES</div>
                <div className="text-lg font-bold text-zinc-400 mt-0.5">{metrics.droppedFrames}</div>
              </div>
              <div className="bg-[#06080d] p-2.5 rounded border border-cyan-950/50">
                <div className="text-[10px] text-zinc-500 uppercase">STREAM PIPELINE</div>
                <div className="text-xs font-bold text-zinc-200 mt-1 truncate">
                  {connectionState === 'CONNECTED' ? (isSampling ? 'SAMPLING ACTIVE' : 'READY') : 'STANDBY'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-cyan-950/40 gap-2">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-cyan-400" />
                <span>LAST FRAME:</span>
                <span className="text-zinc-200">
                  {metrics.lastFrameTimestamp
                    ? new Date(metrics.lastFrameTimestamp).toLocaleTimeString('en-IN', { hour12: false })
                    : '--'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-cyan-400" />
                <span>GPS:</span>
                <span className={currentGps ? 'text-emerald-300' : 'text-zinc-500'}>
                  {currentGps
                    ? `${currentGps.latitude.toFixed(4)}, ${currentGps.longitude.toFixed(4)} (±${Math.round(currentGps.accuracy)}m)`
                    : 'GPS: UNAVAILABLE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Last Captured Frame Preview, Metadata & Provenance */}
        <div className="lg:col-span-4 space-y-4">
          {/* Last Captured Frame Card */}
          <div className="bg-[#090d16] border border-cyan-950/70 rounded-xl overflow-hidden shadow-lg flex flex-col">
            <div className="p-3 bg-[#06080e] border-b border-cyan-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="text-cyan-400" size={15} />
                <h3 className="text-xs font-bold font-mono text-zinc-100">
                  LAST CAPTURED FRAME
                </h3>
              </div>
              {lastFrame && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                  #{lastFrame.sequenceNumber}
                </span>
              )}
            </div>

            {/* Frame Image Viewport */}
            <div className="relative aspect-video bg-[#040609] flex items-center justify-center border-b border-cyan-950/60 overflow-hidden">
              {lastFrame ? (
                <img
                  src={lastFrame.frameReference}
                  alt="Last Captured Real Phone Frame"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 space-y-2 text-zinc-500">
                  <Camera size={24} className="mx-auto text-zinc-600" />
                  <div className="text-xs font-mono">NO FRAME CAPTURED YET</div>
                  <p className="text-[10px] font-mono text-zinc-600 max-w-[200px]">
                    Press [CAPTURE FRAME] or [START SAMPLING] while camera is active.
                  </p>
                </div>
              )}

              {lastFrame && (
                <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-zinc-300 bg-black/70 px-1.5 py-0.5 rounded">
                  {lastFrame.width}×{lastFrame.height}
                </div>
              )}
            </div>

            {/* Frame Metadata Breakdown */}
            <div className="p-3.5 bg-[#070a12] space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>FRAME ID:</span>
                <span className="text-cyan-300 font-bold font-mono">
                  {lastFrame ? lastFrame.frameId : 'MOBF-00000000'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>SOURCE:</span>
                <span className="text-emerald-400 font-bold">REAL PHONE CAMERA</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>CAPTURE METHOD:</span>
                <span className="text-zinc-200">BROWSER_GET_USER_MEDIA</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ANALYSIS MODE:</span>
                <span className="text-zinc-300 bg-zinc-800 px-1 rounded">NONE (PHASE 1)</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-1 border-t border-cyan-950/60">
                <span>TIMESTAMP (IST):</span>
                <span className="text-zinc-300">
                  {lastFrame
                    ? new Date(lastFrame.capturedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                    : '--'}
                </span>
              </div>
            </div>

            {/* Gallery of Recent Frames */}
            {recentFrames.length > 1 && (
              <div className="p-3 border-t border-cyan-950/60 bg-[#06080d]">
                <div className="text-[10px] font-mono text-zinc-400 uppercase mb-2">RECENT FRAME BUFFER:</div>
                <div className="grid grid-cols-4 gap-2">
                  {recentFrames.slice(0, 4).map((frm) => (
                    <div
                      key={frm.frameId}
                      onClick={() => setLastFrame(frm)}
                      className={`aspect-video rounded border overflow-hidden cursor-pointer transition-all ${
                        lastFrame?.frameId === frm.frameId
                          ? 'border-cyan-400 ring-1 ring-cyan-400'
                          : 'border-zinc-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={frm.frameReference} alt="Thumbnail" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Source Integrity & Disclaimer Notice */}
          <div className="bg-[#090d16] border border-cyan-950/70 rounded-xl p-4 space-y-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-300 font-bold border-b border-cyan-950/60 pb-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              SOURCE PROVENANCE VERIFICATION
            </div>

            <div className="space-y-1.5 text-zinc-400 text-[11px]">
              <div className="flex justify-between">
                <span>CLASSIFICATION:</span>
                <span className="text-emerald-300 font-bold">REAL_CAMERA</span>
              </div>
              <div className="flex justify-between">
                <span>ADAPTER:</span>
                <span className="text-zinc-200">MobileBrowserCameraSource</span>
              </div>
              <div className="flex justify-between">
                <span>AI INFERENCE:</span>
                <span className="text-zinc-400">NOT CONNECTED (REAL CAMERA ≠ REAL AI)</span>
              </div>
              <div className="flex justify-between">
                <span>EVENT BRIDGE:</span>
                <span className="text-cyan-300">CentralEventBus & EdgeRuntime</span>
              </div>
            </div>

            <div className="p-2.5 bg-[#06080d] border border-cyan-950/60 rounded text-[10px] text-zinc-400 leading-relaxed">
              <span className="text-zinc-300 font-bold">STATUTORY NOTICE: </span>
              "Mobile Camera Test Mode uses the device camera through the browser and is intended for development/testing. It does not by itself provide guaranteed background recording, continuous operation, or production field-camera capabilities."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
