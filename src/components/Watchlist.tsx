import React, { useState, useEffect, useRef } from 'react';
import { mockWatchlist } from '../mockData';
import { WatchlistTarget } from '../types';
import { Camera as CameraIcon, Target, Crosshair, AlertTriangle, ShieldAlert, CheckCircle2, UserCheck, Plus } from 'lucide-react';

export function Watchlist() {
  const [targets, setTargets] = useState<WatchlistTarget[]>(mockWatchlist);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    attire: '',
    plate: '',
    threatLevel: 'high' as 'high' | 'medium' | 'critical'
  });

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsCapturing(true);
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage) return;

    const newTarget: WatchlistTarget = {
      id: `TGT-GJ-${Date.now().toString().slice(-4)}`,
      name: formData.name || 'Unknown Suspect',
      imageUrl: capturedImage,
      threatLevel: formData.threatLevel,
      associatedPlate: formData.plate,
      lastKnownAttire: formData.attire,
      dateAdded: new Date().toISOString()
    };

    setTargets([newTarget, ...targets]);
    setCapturedImage(null);
    setFormData({ name: '', attire: '', plate: '', threatLevel: 'high' });
  };

  return (
    <div className="p-6 h-full flex flex-col bg-[#05070c] text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <div className="mb-5 shrink-0 border-b border-cyan-950/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              GUJARAT POLICE CID / CRIME BRANCH
            </span>
            <span className="text-[10px] font-mono text-zinc-400">EDGE RE-IDENTIFICATION</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-100 font-mono">
            WATCHLIST & SUSPECT TARGET REGISTRY
          </h1>
          <p className="text-xs text-zinc-400">
            Register POI biometric embeddings, vehicle numbers, and attire descriptors for real-time edge alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-3 py-1.5 rounded border border-cyan-700/50 flex items-center gap-1.5 font-bold">
            <UserCheck size={14} />
            <span>{targets.length} ACTIVE TARGETS SYNCED</span>
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden">
        {/* Left: Registration Form */}
        <div className="w-full lg:w-[380px] bg-[#090d16] border border-cyan-950/70 rounded-lg flex flex-col shrink-0 overflow-hidden shadow-md">
          <div className="p-3.5 border-b border-cyan-950/60 bg-[#06080e] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
              <Crosshair size={14} /> NEW TARGET DOSSIER
            </h2>
            <span className="text-[9px] font-mono text-zinc-500">STATEWIDE BROADCAST</span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="mb-4">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
                FACIAL CAPTURE & EMBEDDING
              </label>
              
              <div className="relative aspect-video bg-[#04060a] border border-cyan-950 rounded-lg overflow-hidden flex flex-col items-center justify-center mb-2 group">
                {!isCapturing && !capturedImage && (
                  <button 
                    onClick={startCamera} 
                    className="flex flex-col items-center text-cyan-400 hover:text-cyan-300 transition-colors p-4 cursor-pointer"
                  >
                    <CameraIcon size={28} className="mb-1.5 opacity-80" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider">INITIALIZE CAPTURE SENSOR</span>
                  </button>
                )}
                
                {isCapturing && (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                      <div className="w-1/2 h-2/3 border-2 border-cyan-400/80 rounded-sm relative shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
                      </div>
                    </div>
                  </>
                )}
                
                {capturedImage && (
                  <img src={capturedImage} alt="Captured face" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {isCapturing && (
                <button 
                  onClick={captureFace} 
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-2 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                >
                  EXTRACT 512-D VECTOR EMBEDDING
                </button>
              )}
              {capturedImage && (
                <button 
                  onClick={startCamera} 
                  className="w-full bg-[#0d121f] hover:bg-[#131b2e] text-cyan-300 border border-cyan-900/40 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  RECAPTURE SENSOR
                </button>
              )}
            </div>

            <form onSubmit={handleRegister} className="space-y-3 font-mono">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">SUBJECT ALIAS / NAME</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-[#05070c] border border-cyan-950 rounded px-3 py-1.5 text-xs text-zinc-100 focus:border-cyan-500 focus:outline-none uppercase" 
                  placeholder="e.g. SUSPECT DELTA / J. PATEL" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">LAST KNOWN ATTIRE</label>
                <input 
                  type="text" 
                  value={formData.attire} 
                  onChange={e => setFormData({...formData, attire: e.target.value})} 
                  className="w-full bg-[#05070c] border border-cyan-950 rounded px-3 py-1.5 text-xs text-zinc-100 focus:border-cyan-500 focus:outline-none" 
                  placeholder="e.g. Dark jacket, white cap" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">ASSOCIATED VEHICLE LICENSE PLATE</label>
                <input 
                  type="text" 
                  value={formData.plate} 
                  onChange={e => setFormData({...formData, plate: e.target.value})} 
                  className="w-full bg-[#05070c] border border-cyan-950 rounded px-3 py-1.5 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none uppercase" 
                  placeholder="GJ01AB1234" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">THREAT SEVERITY</label>
                <select 
                  value={formData.threatLevel} 
                  onChange={e => setFormData({...formData, threatLevel: e.target.value as 'high' | 'medium' | 'critical'})} 
                  className="w-full bg-[#05070c] border border-cyan-950 rounded px-3 py-1.5 text-xs text-zinc-100 focus:border-cyan-500 focus:outline-none uppercase cursor-pointer"
                >
                  <option value="critical">CRITICAL (Rule Alert & Intercept)</option>
                  <option value="high">HIGH (Active Surveillance)</option>
                  <option value="medium">MEDIUM (POI / Trajectory Log)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={!capturedImage} 
                className="w-full mt-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-40 disabled:pointer-events-none text-white py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer"
              >
                DEPLOY TO STATEWIDE EDGE FLEET
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Watchlist */}
        <div className="flex-1 bg-[#090d16] border border-cyan-950/70 rounded-lg flex flex-col min-w-0 shadow-md">
          <div className="p-3.5 border-b border-cyan-950/60 bg-[#06080e] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
              <Target size={14} /> ACTIVE TRACKING PROFILES ({targets.length})
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/30">
              STATEWIDE REPLICATION: 100%
            </span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-4">
              {targets.map(target => (
                <div 
                  key={target.id} 
                  className="bg-[#05070c] border border-cyan-950/80 rounded-lg p-3 flex gap-3.5 hover:border-cyan-600/50 transition-colors group shadow-sm"
                >
                  <div className="w-24 h-24 shrink-0 rounded bg-black border border-cyan-950 relative overflow-hidden">
                    <img 
                      src={target.imageUrl} 
                      alt={target.name} 
                      className="w-full h-full object-cover mix-blend-luminosity group-hover:mix-blend-normal transition-all" 
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute top-0 right-0 w-full h-1 ${
                      target.threatLevel === 'critical' ? 'bg-rose-500' :
                      target.threatLevel === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between font-mono">
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-xs text-zinc-100 truncate pr-2">{target.name}</h3>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${
                          target.threatLevel === 'critical' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                          target.threatLevel === 'high' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                          'text-blue-400 border-blue-500/30 bg-blue-500/10'
                        }`}>
                          {target.threatLevel}
                        </span>
                      </div>
                      
                      {target.associatedPlate && (
                        <div className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 inline-block px-1.5 py-0.5 rounded border border-cyan-700/40 mb-1">
                          IND | {target.associatedPlate}
                        </div>
                      )}
                      
                      {target.lastKnownAttire && (
                        <p className="text-[11px] text-zinc-400 truncate mb-1">
                          Attire: {target.lastKnownAttire}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-1 border-t border-white/5">
                      <span>{target.id}</span>
                      <span className="text-emerald-400">EDGE SYNCED</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
