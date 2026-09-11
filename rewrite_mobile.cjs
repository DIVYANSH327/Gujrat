const fs = require('fs');

const code = `import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Smartphone, Play, Square, AlertTriangle, MapPin, Camera, Activity, Info } from 'lucide-react';
import { centralRepo } from '../services/Architecture';
import { SecurityEventPayload, ViewMode } from '../types';

interface MobileCameraTestProps {
  onNavigate?: (view: ViewMode) => void;
}

interface AIDetection {
  class: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
  plate?: string;
  plateConfidence?: number;
}

interface GpsStatus {
  status: 'AVAILABLE' | 'UNAVAILABLE';
  lat?: number;
  lon?: number;
  acc?: number;
}

export function MobileCameraTest({ onNavigate }: MobileCameraTestProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isPatrolActiveRef = useRef<boolean>(false);

  const [cameraState, setCameraState] = useState<'STARTING' | 'LIVE' | 'ERROR' | 'OFFLINE'>('OFFLINE');
  const [aiState, setAiState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'KEY_REQUIRED' | 'NETWORK_ERROR'>('IDLE');
  const [isPatrolActive, setIsPatrolActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>({ status: 'UNAVAILABLE' });
  const [detections, setDetections] = useState<AIDetection[]>([]);
  const [eventsLog, setEventsLog] = useState<any[]>([]);
  
  const [diagnostics, setDiagnostics] = useState({
    permission: 'unknown',
    streamActive: false,
    videoReadyState: 0,
    videoWidth: 0,
    videoHeight: 0,
    trackState: 'none',
    trackEnabled: false,
    trackMuted: false,
    jpegBytes: 0,
    inferenceLatency: 0
  });

  // Sync ref for the loop
  useEffect(() => {
    isPatrolActiveRef.current = isPatrolActive;
  }, [isPatrolActive]);

  const updateDiagnostics = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];
    
    setDiagnostics(prev => ({
      ...prev,
      streamActive: !!stream?.active,
      videoReadyState: video ? video.readyState : 0,
      videoWidth: video ? video.videoWidth : 0,
      videoHeight: video ? video.videoHeight : 0,
      trackState: track ? track.readyState : 'none',
      trackEnabled: track ? track.enabled : false,
      trackMuted: track ? track.muted : false
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(updateDiagnostics, 1000);
    return () => clearInterval(interval);
  }, [updateDiagnostics]);

  useEffect(() => {
    // GPS Logic
    if (!navigator.geolocation) {
      setGpsStatus({ status: 'UNAVAILABLE' });
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setGpsStatus({ status: 'AVAILABLE', lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy }),
      (err) => setGpsStatus({ status: 'UNAVAILABLE' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    
    // Permission check if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as any })
        .then(res => setDiagnostics(p => ({ ...p, permission: res.state })))
        .catch(() => {});
    }

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const startCamera = async () => {
    setCameraState('STARTING');
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            setCameraState('LIVE');
            updateDiagnostics();
          } catch (playErr: any) {
            setErrorMessage('Auto-play blocked: ' + playErr.message);
            setCameraState('ERROR');
          }
        };
      } else {
        setCameraState('LIVE');
      }
      
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' as any }).then(res => setDiagnostics(p => ({ ...p, permission: res.state }))).catch(()=>{});
      } else {
        setDiagnostics(p => ({ ...p, permission: 'granted' }));
      }
    } catch (err: any) {
      setCameraState('ERROR');
      setErrorMessage(err.name + ': ' + err.message);
      if (err.name === 'NotAllowedError') setDiagnostics(p => ({ ...p, permission: 'denied' }));
    }
    updateDiagnostics();
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const track = streamRef.current?.getVideoTracks()[0];
        if (cameraState === 'LIVE' && track && track.readyState !== 'live') {
          startCamera(); // Reacquire if track died in background
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [cameraState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearTimeout(loopRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    if (video.readyState < 2 || video.videoWidth === 0) return null; // 2 = HAVE_CURRENT_DATA
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const runPatrolIteration = async () => {
    if (!isPatrolActiveRef.current) return;
    
    if (isProcessingRef.current) {
      loopRef.current = setTimeout(runPatrolIteration, 1000); // Skip, try again next sec
      return;
    }
    
    const base64 = captureFrame();
    if (!base64) {
      // Waiting for video frame
      loopRef.current = setTimeout(runPatrolIteration, 500);
      return;
    }
    
    setDiagnostics(prev => ({ ...prev, jpegBytes: base64.length }));
    isProcessingRef.current = true;
    setAiState('PROCESSING');
    const start = Date.now();
    
    try {
      const res = await fetch('/api/ai/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameBase64: base64,
          frameTimestamp: Date.now(),
          sourceId: 'MOB-PATROL-001'
        })
      });
      
      if (res.status === 503) {
        setAiState('KEY_REQUIRED');
        setIsPatrolActive(false); // Stop patrol if no key
        return;
      }
      
      if (!res.ok) throw new Error('AI Server returned ' + res.status);
      
      const data = await res.json();
      setDiagnostics(prev => ({ ...prev, inferenceLatency: Date.now() - start }));
      setAiState('SUCCESS');
      
      const foundDetections: AIDetection[] = data.detections || [];
      setDetections(foundDetections);
      
      // Dispatch genuine events
      if (foundDetections.length > 0) {
        foundDetections.forEach(det => {
          const plate = det.plate ? det.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() : null;
          const evId = 'EVT-MOB-' + Date.now() + '-' + Math.floor(Math.random()*1000);
          
          const payload: SecurityEventPayload = {
            eventId: evId,
            edgeNodeId: 'MOB-DEVICE-01',
            siteId: 'MOBILE-PATROL',
            cameraId: 'mobile-rear',
            timestamp: new Date().toISOString(),
            eventType: plate ? 'WATCHLIST_MATCH' : 'VEHICLE_DETECTED',
            priority: plate ? 'high' : 'medium',
            confidence: det.confidence,
            snapshotReference: base64,
            metadata: {
              sourceType: 'MOBILE_PATROL_CAMERA',
              vehicleClass: det.class,
              registrationNumber: plate || 'UNKNOWN',
              plateConfidence: det.plateConfidence,
              gps: gpsStatus.status === 'AVAILABLE' ? { latitude: gpsStatus.lat, longitude: gpsStatus.lon, accuracyMeters: gpsStatus.acc } : null,
              isRealAI: true
            }
          };
          centralRepo.createEvent(payload);
          
          setEventsLog(prev => [{
            time: new Date().toLocaleTimeString(),
            class: det.class,
            plate: plate || 'PLATE UNCERTAIN',
            confidence: det.confidence,
            evId
          }, ...prev.slice(0, 4)]);
        });
      }
    } catch (err: any) {
      console.error(err);
      setAiState('NETWORK_ERROR');
    } finally {
      isProcessingRef.current = false;
      if (isPatrolActiveRef.current) {
        loopRef.current = setTimeout(runPatrolIteration, 1000);
      }
    }
  };

  const togglePatrol = () => {
    if (isPatrolActive) {
      setIsPatrolActive(false);
      clearTimeout(loopRef.current);
      setAiState('IDLE');
    } else {
      if (cameraState !== 'LIVE') {
         startCamera().then(() => {
            setIsPatrolActive(true);
            isProcessingRef.current = false;
            runPatrolIteration();
         });
      } else {
        setIsPatrolActive(true);
        isProcessingRef.current = false;
        runPatrolIteration();
      }
    }
  };

  // Draw overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    detections.forEach(det => {
      const x = det.box.x * canvas.width;
      const y = det.box.y * canvas.height;
      const w = det.box.width * canvas.width;
      const h = det.box.height * canvas.height;
      
      ctx.strokeStyle = '#3b82f6'; // Blue-500
      ctx.lineWidth = Math.max(2, canvas.width / 400);
      ctx.strokeRect(x, y, w, h);
      
      ctx.fillStyle = '#3b82f6';
      const text = det.plate ? \`\${det.class.toUpperCase()} - \${det.plate}\` : det.class.toUpperCase();
      const fontSize = Math.max(14, canvas.width / 40);
      ctx.font = \`bold \${fontSize}px sans-serif\`;
      ctx.fillText(text, x, y > fontSize + 5 ? y - 5 : y + fontSize + 5);
    });
  }, [detections, diagnostics.videoWidth]);

  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-4 text-white flex flex-col font-sans">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 mb-3">
        <div className="flex items-center gap-3">
          <Smartphone className="text-blue-500" size={24} />
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide">Patrol Camera</h1>
            <div className="text-xs text-slate-400">Mobile Unit Dashcam</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className={\`w-2.5 h-2.5 rounded-full \${cameraState === 'LIVE' ? 'bg-emerald-500' : 'bg-rose-500'}\`} />
           <span className="text-xs font-bold text-slate-300">
             {cameraState === 'LIVE' ? 'CAMERA LIVE' : cameraState}
           </span>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-3 p-3 bg-rose-900/50 border border-rose-500/50 rounded-xl flex items-start gap-2 text-rose-200 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Main Viewport & HUD */}
      <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
        <div className="relative flex-1 min-h-[300px] flex items-center justify-center">
          {cameraState !== 'LIVE' && cameraState !== 'STARTING' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 space-y-4">
                <Camera size={48} className="text-slate-600" />
                <button 
                  onClick={startCamera}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg transition-colors"
                >
                  INITIALIZE CAMERA
                </button>
             </div>
          )}
          
          {diagnostics.videoWidth === 0 && cameraState === 'LIVE' && (
             <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50 text-sm font-bold text-slate-300">
                WAITING FOR CAMERA FRAME...
             </div>
          )}

          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          
          {/* HUD Overlays */}
          {cameraState === 'LIVE' && (
             <>
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur rounded p-2 text-[11px] font-mono border border-white/10 text-emerald-400">
                   <div className="flex items-center gap-1.5 mb-1">
                      <Activity size={12} />
                      <span>AI STATUS: {aiState}</span>
                   </div>
                   {detections.length === 0 && aiState === 'SUCCESS' ? (
                      <div className="text-slate-400 mt-1">NO VEHICLES DETECTED</div>
                   ) : (
                      <div className="mt-1">DETECTED: {detections.length}</div>
                   )}
                </div>
                
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur rounded p-2 text-[11px] font-mono border border-white/10 text-right">
                   <div className="flex items-center gap-1.5 justify-end mb-1">
                      <MapPin size={12} className={gpsStatus.status === 'AVAILABLE' ? 'text-blue-400' : 'text-rose-400'} />
                      <span className={gpsStatus.status === 'AVAILABLE' ? 'text-blue-400' : 'text-rose-400'}>
                         {gpsStatus.status === 'AVAILABLE' ? 'GPS LOCKED' : 'GPS UNAVAILABLE'}
                      </span>
                   </div>
                   {gpsStatus.status === 'AVAILABLE' && (
                      <div className="text-slate-300">
                         {gpsStatus.lat?.toFixed(4)}, {gpsStatus.lon?.toFixed(4)}
                      </div>
                   )}
                </div>
             </>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <button
            onClick={togglePatrol}
            disabled={cameraState === 'ERROR' || aiState === 'KEY_REQUIRED'}
            className={\`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg cursor-pointer \${
              isPatrolActive 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
            }\`}
          >
            {isPatrolActive ? <Square size={24} /> : <Play size={24} />}
            <span>{isPatrolActive ? 'PAUSE PATROL' : 'PATROL ACTIVE'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Detections Log */}
      {isPatrolActive && (
        <div className="mt-3 bg-slate-900 rounded-xl border border-slate-800 p-3">
          <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Detection Stream</div>
          <div className="space-y-2">
            {eventsLog.length === 0 ? (
              <div className="text-xs text-slate-400 py-2 font-mono">Awaiting AI inference...</div>
            ) : (
              eventsLog.map((ev, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 font-mono text-xs">
                   <div>
                      <span className="text-slate-500 mr-2">{ev.time}</span>
                      <span className="text-blue-400 font-bold">{ev.class.toUpperCase()}</span>
                   </div>
                   <div className="flex gap-3 text-right">
                      <span className={ev.plate !== 'PLATE UNCERTAIN' ? 'text-amber-400' : 'text-slate-500'}>{ev.plate}</span>
                      <span className="text-emerald-500">{Math.round(ev.confidence * 100)}%</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Diagnostics Panel (Phase 2 & Final Verification) */}
      <div className="mt-3 bg-slate-900 rounded-xl border border-slate-800 p-3 text-[10px] sm:text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2 mb-2 text-slate-300 font-bold">
           <Info size={14} /> <span>REAL CAMERA DIAGNOSTICS</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
           <div className="flex justify-between"><span>Permission:</span> <span className="text-white">{diagnostics.permission}</span></div>
           <div className="flex justify-between"><span>Stream Active:</span> <span className="text-white">{diagnostics.streamActive ? 'YES' : 'NO'}</span></div>
           <div className="flex justify-between"><span>Resolution:</span> <span className="text-white">{diagnostics.videoWidth}x{diagnostics.videoHeight}</span></div>
           <div className="flex justify-between"><span>Video ReadyState:</span> <span className="text-white">{diagnostics.videoReadyState}</span></div>
           <div className="flex justify-between"><span>Track State:</span> <span className="text-white">{diagnostics.trackState}</span></div>
           <div className="flex justify-between"><span>Track Enabled:</span> <span className="text-white">{diagnostics.trackEnabled ? 'YES' : 'NO'}</span></div>
           <div className="flex justify-between"><span>JPEG Bytes:</span> <span className="text-white">{diagnostics.jpegBytes}</span></div>
           <div className="flex justify-between"><span>Inference Latency:</span> <span className="text-white">{diagnostics.inferenceLatency}ms</span></div>
           <div className="flex justify-between col-span-2 mt-1 pt-1 border-t border-slate-800">
              <span>Actual Model:</span> <span className="text-white">Gemini 2.5 Pro (via /api/ai/analyze-frame)</span>
           </div>
        </div>
      </div>
    </div>
  );
}
`
fs.writeFileSync('src/components/MobileCameraTest.tsx', code);
console.log('MobileCameraTest.tsx Phase 1 rewrite completed.');
