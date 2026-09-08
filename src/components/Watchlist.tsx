import React, { useState, useEffect, useRef } from 'react';
import { WatchlistTarget } from '../types';
import { targetPersistenceService, compressImage } from '../services/TargetPersistenceService';
import { FaceWatchlistView } from './FaceWatchlistView';
import { 
  Camera as CameraIcon, 
  Target, 
  Crosshair, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  UserCheck, 
  Plus, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Image as ImageIcon,
  Info,
  ScanFace,
  Car
} from 'lucide-react';

export function Watchlist() {
  const [activeWatchlistTab, setActiveWatchlistTab] = useState<'FACE_BIOMETRIC' | 'VEHICLE_SYNTHETIC'>('FACE_BIOMETRIC');
  // Rehydrate persisted synthetic targets
  const [targets, setTargets] = useState<WatchlistTarget[]>(() => targetPersistenceService.listTargets());
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Rehydrate draft photo and draft form if user previously selected an image or navigated away
  const [capturedImage, setCapturedImage] = useState<string | null>(() => targetPersistenceService.getDraftImage());
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(() => {
    const draft = targetPersistenceService.getDraftForm();
    return draft || {
      name: '',
      attire: '',
      plate: '',
      threatLevel: 'high' as 'high' | 'medium' | 'critical'
    };
  });

  // Re-sync with persistence on mount (protects against stale tab state)
  useEffect(() => {
    const loaded = targetPersistenceService.listTargets();
    setTargets(loaded);
  }, []);

  // Persist form changes as draft
  useEffect(() => {
    targetPersistenceService.saveDraftForm(formData);
  }, [formData]);

  // Persist draft image
  useEffect(() => {
    targetPersistenceService.saveDraftImage(capturedImage);
  }, [capturedImage]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsCapturing(true);
    setQuotaWarning(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Camera access not available, prompting file selection", err);
      setIsCapturing(false);
      // Fallback to file picker if camera is blocked/unavailable
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const captureFace = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera();
        
        try {
          const compressed = await compressImage(rawDataUrl, 320, 320, 0.75);
          setCapturedImage(compressed);
          targetPersistenceService.saveDraftImage(compressed);
        } catch {
          setCapturedImage(rawDataUrl);
          targetPersistenceService.saveDraftImage(rawDataUrl);
        }
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuotaWarning(null);
    try {
      const compressed = await compressImage(file, 320, 320, 0.75);
      setCapturedImage(compressed);
      targetPersistenceService.saveDraftImage(compressed);
    } catch (err) {
      console.error("Failed to load and compress image file", err);
      setQuotaWarning("Failed to process selected image file.");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage) return;

    if (editingTargetId) {
      // Update existing target
      const updated = targetPersistenceService.updateTarget(editingTargetId, {
        name: formData.name || 'Unknown Suspect',
        imageUrl: capturedImage,
        threatLevel: formData.threatLevel,
        associatedPlate: formData.plate.toUpperCase(),
        lastKnownAttire: formData.attire
      });

      if (updated) {
        const freshList = targetPersistenceService.listTargets();
        setTargets(freshList);
      }
      setEditingTargetId(null);
    } else {
      // Create new target
      const targetId = `TGT-GJ-${Date.now().toString().slice(-4)}`;
      const newTarget: WatchlistTarget = {
        id: targetId,
        targetId: targetId,
        syntheticPersonId: `P-DEMO-${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name || 'Unknown Suspect',
        alias: formData.name || 'Unknown Suspect',
        imageUrl: capturedImage,
        threatLevel: formData.threatLevel,
        severity: formData.threatLevel,
        associatedPlate: formData.plate ? formData.plate.toUpperCase() : undefined,
        vehiclePlate: formData.plate ? formData.plate.toUpperCase() : undefined,
        lastKnownAttire: formData.attire || 'Dark attire (Simulated)',
        attire: formData.attire || 'Dark attire (Simulated)',
        dateAdded: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'SYNCHRONIZED'
      };

      targetPersistenceService.saveTarget(newTarget);
      
      if (targetPersistenceService.storageQuotaExceeded) {
        setQuotaWarning("DEMO IMAGE STORAGE LIMIT REACHED — image may be stored transiently.");
      } else {
        setQuotaWarning(null);
      }

      const freshList = targetPersistenceService.listTargets();
      setTargets(freshList);
    }

    // Clear active registration fields and draft persistence
    setCapturedImage(null);
    targetPersistenceService.saveDraftImage(null);
    setFormData({ name: '', attire: '', plate: '', threatLevel: 'high' });
    targetPersistenceService.saveDraftForm({ name: '', attire: '', plate: '', threatLevel: 'high' });
  };

  const handleStartEdit = (target: WatchlistTarget) => {
    setEditingTargetId(target.id);
    setCapturedImage(target.imageUrl);
    targetPersistenceService.saveDraftImage(target.imageUrl);
    setFormData({
      name: target.name || target.alias || '',
      attire: target.lastKnownAttire || target.attire || '',
      plate: target.associatedPlate || target.vehiclePlate || '',
      threatLevel: (target.threatLevel || target.severity || 'high') as 'high' | 'medium' | 'critical'
    });
  };

  const handleCancelEdit = () => {
    setEditingTargetId(null);
    setCapturedImage(null);
    targetPersistenceService.saveDraftImage(null);
    setFormData({ name: '', attire: '', plate: '', threatLevel: 'high' });
    targetPersistenceService.saveDraftForm({ name: '', attire: '', plate: '', threatLevel: 'high' });
  };

  const handleDeleteTarget = (id: string) => {
    targetPersistenceService.deleteTarget(id);
    const freshList = targetPersistenceService.listTargets();
    setTargets(freshList);
    if (editingTargetId === id) {
      handleCancelEdit();
    }
  };

  const handleResetDemo = () => {
    const reseeded = targetPersistenceService.resetToDemoDefaults();
    setTargets(reseeded);
    setCapturedImage(null);
    setEditingTargetId(null);
    setQuotaWarning(null);
    setFormData({ name: '', attire: '', plate: '', threatLevel: 'high' });
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-[#05070c] text-zinc-100 font-sans overflow-hidden">
      {/* Primary Watchlist Navigation Tabs */}
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-cyan-950/60 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveWatchlistTab('FACE_BIOMETRIC')}
            id="tab-watchlist-face"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
              activeWatchlistTab === 'FACE_BIOMETRIC'
                ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:bg-zinc-800'
            }`}
          >
            <ScanFace size={15} />
            <span>Face Biometric Watchlist (BSA 2023)</span>
          </button>

          <button
            onClick={() => setActiveWatchlistTab('VEHICLE_SYNTHETIC')}
            id="tab-watchlist-vehicle"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
              activeWatchlistTab === 'VEHICLE_SYNTHETIC'
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:bg-zinc-800'
            }`}
          >
            <Car size={15} />
            <span>Vehicle & Target Registry</span>
          </button>
        </div>

        {activeWatchlistTab === 'VEHICLE_SYNTHETIC' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDemo}
              title="Restore default deterministic demo targets"
              className="px-2.5 py-1.5 bg-[#0d121f] hover:bg-[#162035] text-zinc-400 hover:text-cyan-300 border border-cyan-900/40 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>RESET DEMO</span>
            </button>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-1.5 rounded border border-cyan-700/50 flex items-center gap-1 font-bold">
              <UserCheck size={13} />
              <span>{targets.length} SYNCED</span>
            </span>
          </div>
        )}
      </div>

      {activeWatchlistTab === 'FACE_BIOMETRIC' ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <FaceWatchlistView />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-4 shrink-0 border-b border-cyan-950/50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  GUJARAT POLICE CID / CRIME BRANCH
                </span>
                <span className="text-[10px] font-mono text-zinc-400">EDGE RE-IDENTIFICATION & SYNTHETIC DOSSIER REGISTRY</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-zinc-100 font-mono">
                LOCAL VEHICLE & TARGET PROFILE REGISTRY
              </h1>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Info size={12} className="text-cyan-400" />
                <span>Synthetic subject image & vehicle profiles — persisted across browser sessions.</span>
              </p>
            </div>
          </div>

          {/* Quota Warning if limit reached */}
          {quotaWarning && (
            <div className="mb-3 px-3 py-2 bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono rounded flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <span>{quotaWarning}</span>
            </div>
          )}

          <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden">
        {/* Left: Registration Form */}
        <div className="w-full lg:w-[380px] bg-[#090d16] border border-cyan-950/70 rounded-lg flex flex-col shrink-0 overflow-hidden shadow-md">
          <div className="p-3.5 border-b border-cyan-950/60 bg-[#06080e] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
              <Crosshair size={14} /> {editingTargetId ? 'EDIT TARGET DOSSIER' : 'NEW SYNTHETIC TARGET DOSSIER'}
            </h2>
            <span className="text-[9px] font-mono text-zinc-500">STATEWIDE BROADCAST</span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  FACIAL CAPTURE & EMBEDDING
                </label>
                <span className="text-[9px] font-mono text-zinc-500">
                  {capturedImage ? 'PHOTO STORED' : 'PHOTO REQUIRED'}
                </span>
              </div>
              
              {/* Hidden file input for file selection */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />

              {/* Photo & Sensor Area */}
              <div className="relative aspect-video bg-[#04060a] border border-cyan-950 rounded-lg overflow-hidden flex flex-col items-center justify-center mb-2 group">
                {!isCapturing && !capturedImage && (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <button 
                      onClick={startCamera} 
                      type="button"
                      className="flex flex-col items-center text-cyan-400 hover:text-cyan-300 transition-colors p-2 cursor-pointer mb-2"
                    >
                      <CameraIcon size={28} className="mb-1.5 opacity-80" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider">INITIALIZE CAPTURE SENSOR</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] font-mono text-zinc-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                    >
                      <Upload size={12} /> Or Select Synthetic Photo File
                    </button>
                  </div>
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
                
                {capturedImage && !isCapturing && (
                  <>
                    <img 
                      src={capturedImage} 
                      alt="Synthetic Subject Preview" 
                      className="absolute inset-0 w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-mono text-cyan-300 flex items-center justify-between z-10 border border-cyan-900/40">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-400" /> STORED PREVIEW
                      </span>
                      <span className="text-zinc-400">PERSISTED</span>
                    </div>
                  </>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Action buttons for capture / retake */}
              {isCapturing && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={captureFace} 
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-2 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer text-center"
                  >
                    CAPTURE PHOTO
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              )}

              {capturedImage && !isCapturing && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={startCamera} 
                    className="bg-[#0d121f] hover:bg-[#131b2e] text-cyan-300 border border-cyan-900/40 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={12} />
                    <span>RETAKE SENSOR</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()} 
                    className="bg-[#0d121f] hover:bg-[#131b2e] text-zinc-300 border border-cyan-900/40 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Upload size={12} />
                    <span>CHANGE FILE</span>
                  </button>
                </div>
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
                  placeholder="e.g. SYNTHETIC SUBJECT DELTA / J. PATEL" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">LAST KNOWN ATTIRE</label>
                <input 
                  type="text" 
                  value={formData.attire} 
                  onChange={e => setFormData({...formData, attire: e.target.value})} 
                  className="w-full bg-[#05070c] border border-cyan-950 rounded px-3 py-1.5 text-xs text-zinc-100 focus:border-cyan-500 focus:outline-none" 
                  placeholder="e.g. Dark jacket, white helmet" 
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

              <div className="pt-2 flex flex-col gap-2">
                <button 
                  type="submit" 
                  disabled={!capturedImage} 
                  className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-40 disabled:pointer-events-none text-white py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{editingTargetId ? 'UPDATE SYNTHETIC TARGET DOSSIER' : 'DEPLOY TO STATEWIDE EDGE FLEET'}</span>
                </button>

                {editingTargetId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
                  >
                    CANCEL EDIT
                  </button>
                )}
              </div>
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
                  className={`bg-[#05070c] border rounded-lg p-3 flex gap-3.5 transition-colors group shadow-sm ${
                    editingTargetId === target.id ? 'border-cyan-400 bg-cyan-950/20' : 'border-cyan-950/80 hover:border-cyan-600/50'
                  }`}
                >
                  <div className="w-24 h-24 shrink-0 rounded bg-black border border-cyan-950 relative overflow-hidden">
                    <img 
                      src={target.imageUrl} 
                      alt={target.name} 
                      className="w-full h-full object-cover mix-blend-luminosity group-hover:mix-blend-normal transition-all" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Graceful fallback on corrupt/missing image
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className={`absolute top-0 right-0 w-full h-1 ${
                      target.threatLevel === 'critical' ? 'bg-rose-500' :
                      target.threatLevel === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between font-mono">
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-xs text-zinc-100 truncate pr-2" title={target.name}>
                          {target.name}
                        </h3>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${
                          target.threatLevel === 'critical' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                          target.threatLevel === 'high' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                          'text-blue-400 border-blue-500/30 bg-blue-500/10'
                        }`}>
                          {target.threatLevel}
                        </span>
                      </div>
                      
                      {(target.associatedPlate || target.vehiclePlate) && (
                        <div className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 inline-block px-1.5 py-0.5 rounded border border-cyan-700/40 mb-1">
                          IND | {target.associatedPlate || target.vehiclePlate}
                        </div>
                      )}
                      
                      {(target.lastKnownAttire || target.attire) && (
                        <p className="text-[11px] text-zinc-400 truncate mb-1">
                          Attire: {target.lastKnownAttire || target.attire}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span>{target.id}</span>
                        <span className="text-emerald-400">● EDGE SYNCED</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(target)}
                          className="text-cyan-400 hover:text-cyan-200 p-1 cursor-pointer"
                          title="Edit Target Dossier"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTarget(target.id)}
                          className="text-rose-400 hover:text-rose-200 p-1 cursor-pointer"
                          title="Delete Target"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
}

