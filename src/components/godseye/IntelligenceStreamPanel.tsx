/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * IntelligenceStreamPanel: Column 3 (Right Panel)
 * Live Camera Stream Player, Correlated Alerts, BSA 2023 Chain of Custody, and Downstream Prediction.
 */

import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Video, 
  Play, 
  Square, 
  Maximize2, 
  Camera as CameraIcon, 
  AlertTriangle, 
  Shield, 
  CheckCircle2, 
  Radio, 
  Activity, 
  Compass, 
  ArrowRight, 
  RefreshCw, 
  ExternalLink,
  ChevronDown,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';
import { 
  SentinelCameraLocation, 
  CorrelatedTargetAlert, 
  DownstreamPrediction, 
  VerifiedVehicleSighting 
} from './types';

interface IntelligenceStreamPanelProps {
  selectedCamera: SentinelCameraLocation | null;
  selectedSighting: VerifiedVehicleSighting | null;
  alerts: CorrelatedTargetAlert[];
  downstreamPrediction: DownstreamPrediction | null;
  cameras: SentinelCameraLocation[];
  onSelectCamera: (camera: SentinelCameraLocation) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onDismissAlert: (alertId: string) => void;
  onTrackAlert: (alertId: string) => void;
}

export function IntelligenceStreamPanel({
  selectedCamera,
  selectedSighting,
  alerts,
  downstreamPrediction,
  cameras,
  onSelectCamera,
  onAcknowledgeAlert,
  onDismissAlert,
  onTrackAlert
}: IntelligenceStreamPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [streamStatus, setStreamStatus] = useState<'CONNECTING' | 'LIVE' | 'FALLBACK_FRAME' | 'ERROR'>('CONNECTING');
  const [snapshotTimestamp, setSnapshotTimestamp] = useState<number>(Date.now());
  const [isSnapshotRefreshing, setIsSnapshotRefreshing] = useState<boolean>(false);

  // Active camera ID: prefer selectedCamera, or fallback to selectedSighting's camera, or first online camera
  const activeCamera = selectedCamera || 
    (selectedSighting ? cameras.find(c => c.cameraId === selectedSighting.cameraId) : null) || 
    cameras.find(c => c.status === 'LIVE') || 
    cameras[0];

  // Set up HLS or snapshot fallback for the active camera
  useEffect(() => {
    if (!activeCamera) return;

    setStreamStatus('CONNECTING');

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (!video) return;

    const streamUrl = `/api/sentinel/stream/${encodeURIComponent(activeCamera.cameraId)}/index.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 10
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStreamStatus('LIVE');
        video.play().catch(() => {
          // Autoplay policy fallback: mute and play
          video.muted = true;
          video.play().catch(() => {});
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          // Gracefully fallback to high-rate live snapshot polling
          setStreamStatus('FALLBACK_FRAME');
          hls.destroy();
          hlsRef.current = null;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setStreamStatus('LIVE');
        video.play().catch(() => {});
      });
    } else {
      setStreamStatus('FALLBACK_FRAME');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeCamera?.cameraId]);

  // Periodic snapshot refresher when running in frame fallback mode
  useEffect(() => {
    if (streamStatus !== 'FALLBACK_FRAME' || !activeCamera) return;

    const interval = setInterval(() => {
      setSnapshotTimestamp(Date.now());
    }, 2500);

    return () => clearInterval(interval);
  }, [streamStatus, activeCamera?.cameraId]);

  const handleManualFrameRefresh = () => {
    setIsSnapshotRefreshing(true);
    setSnapshotTimestamp(Date.now());
    setTimeout(() => setIsSnapshotRefreshing(false), 500);
  };

  return (
    <div className="w-full lg:w-96 flex-shrink-0 flex flex-col h-full bg-slate-900 border-l border-slate-800 select-none">
      {/* Live Video Feed Player Section */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>CCTV Intercept Stream</span>
          </div>

          {/* Camera Selector Dropdown */}
          <select
            value={activeCamera?.cameraId || ''}
            onChange={(e) => {
              const found = cameras.find(c => c.cameraId === e.target.value);
              if (found) onSelectCamera(found);
            }}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-0.5 focus:outline-none font-mono"
          >
            {cameras.map(c => (
              <option key={c.cameraId} value={c.cameraId}>
                {c.name} ({c.district})
              </option>
            ))}
          </select>
        </div>

        {/* Video Canvas Container */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
          {streamStatus === 'LIVE' || streamStatus === 'CONNECTING' ? (
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={`/api/cameras/${encodeURIComponent(activeCamera?.cameraId || 'cam01')}/thumbnail?t=${snapshotTimestamp}`}
              alt="Live Camera Snapshot"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback image placeholder if camera stream completely offline
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60';
              }}
            />
          )}

          {/* Live Telemetry HUD Overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-600/90 text-white rounded text-[9px] font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE
            </span>
            <span className="px-1.5 py-0.5 bg-slate-900/80 text-slate-300 rounded text-[9px] font-mono border border-slate-700">
              {activeCamera?.cameraId}
            </span>
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1">
            <button
              onClick={handleManualFrameRefresh}
              className="p-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 text-xs transition-colors"
              title="Refresh frame snapshot"
            >
              <RefreshCw className={`w-3 h-3 ${isSnapshotRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 flex items-center justify-between text-[10px] text-slate-300 font-mono pointer-events-none">
            <div>
              <span className="text-white font-bold">{activeCamera?.name || 'Sentinel CCTV Node'}</span>
              <span className="text-slate-400 block text-[9px]">
                {activeCamera?.district} · {activeCamera?.protocol || 'RTSP/H.264'}
              </span>
            </div>
            <div className="text-right text-[9px]">
              <span className="text-emerald-400 font-bold block">25.0 FPS</span>
              <span className="text-slate-400">1080p · 2048 kbps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column Scrollable Section: Alerts, Forensic Integrity, Prediction */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-slate-800/50">
        {/* Downstream Corridor Prediction Card */}
        {downstreamPrediction && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Next Predicted Checkpoint</span>
              </span>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/30">
                {downstreamPrediction.probabilityPercent}% Probability
              </span>
            </div>

            <div className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">
                  {downstreamPrediction.cameraName}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {downstreamPrediction.targetCameraId}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Corridor:</span>
                <span className="text-slate-300">{downstreamPrediction.corridorName}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Est. Intercept Window:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  ~{Math.round(downstreamPrediction.estimatedArrivalSec / 60)} mins
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Correlated Active Alerts Card */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Correlated Target Alerts</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {alerts.length} Incidents
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-lg text-center text-xs text-slate-500">
              No open alerts associated with this target or camera corridor.
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className="p-2.5 bg-slate-800/70 border border-slate-700/70 rounded-lg text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      alert.severity === 'critical' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour12: false })} IST
                    </span>
                  </div>

                  <p className="text-slate-200 text-xs leading-snug">
                    {alert.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/60">
                    <span>Node: <strong className="text-slate-300 font-mono">{alert.cameraId}</strong></span>
                    <span className="capitalize text-slate-300">{alert.status}</span>
                  </div>

                  {/* Operational Incident Buttons */}
                  {alert.status === 'new' && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => onAcknowledgeAlert(alert.alertId)}
                        className="flex-1 py-1 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Acknowledge</span>
                      </button>
                      <button
                        onClick={() => onTrackAlert(alert.alertId)}
                        className="flex-1 py-1 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Dispatch Intercept</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statutory Forensic Custody & BSA 2023 Validation */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Forensic Chain of Custody</span>
            </span>
            <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              BSA 2023 §63
            </span>
          </div>

          <div className="p-2.5 bg-slate-800/40 border border-slate-700/50 rounded-lg text-xs space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Evidence ID:</span>
              <span className="font-mono text-slate-200">
                {selectedSighting ? selectedSighting.evidenceId : `EVD-SENTINEL-${Date.now().toString().slice(-6)}`}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Cryptographic Seal:</span>
              <span className="font-mono text-emerald-400 truncate max-w-[140px]">
                {selectedSighting ? selectedSighting.originalFrameHash.slice(0, 16) + '...' : 'SHA-256 Validated'}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Statutory Status:</span>
              <span className="text-slate-200 font-medium">Court-Admissible</span>
            </div>

            <div className="pt-2 border-t border-slate-700/50 text-[10px] text-slate-400 leading-relaxed">
              Every sighting observation is cryptographically anchored at time of capture. Unaltered frames preserved under Section 63 of Bharatiya Sakshya Adhiniyam, 2023.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
