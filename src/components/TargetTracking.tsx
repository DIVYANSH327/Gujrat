import React, { useState, useEffect } from 'react';
import { mockWatchlist } from '../mockData';
import { Map as MapIcon, Activity, Camera as CameraIcon, Crosshair, User, Car, Bike, ShieldAlert, CheckCircle2, Navigation, Clock } from 'lucide-react';

interface LiveEntity {
  id: string;
  type: 'walking' | 'car' | 'bike';
  x: number;
  y: number;
  label: string;
}

export function TargetTracking() {
  const [activeTarget, setActiveTarget] = useState(mockWatchlist[0]);
  const [traceProgress, setTraceProgress] = useState(0);
  const [liveEntities, setLiveEntities] = useState<LiveEntity[]>([]);

  // Scenario A corridor tracking sequence in Gujarat
  const gujaratTrackingPath = [
    { id: 'CAM-007', name: 'CAM-007 (SG Highway North)', time: '18:41:00', x: 20, y: 35, speed: '48 km/h', trigger: false },
    { id: 'CAM-014', name: 'CAM-014 (Ashram Road Hub)', time: '18:43:20', x: 42, y: 55, speed: '52 km/h', trigger: true },
    { id: 'CAM-023', name: 'CAM-023 (Sindhu Bhavan Toll)', time: '18:46:15', x: 68, y: 40, speed: '45 km/h', trigger: false },
    { id: 'CAM-031', name: 'CAM-031 (Ring Road Interchange)', time: '18:49:00', x: 88, y: 65, speed: '38 km/h', trigger: false }
  ];

  useEffect(() => {
    setTraceProgress(0);
    const interval = setInterval(() => {
      setTraceProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [activeTarget]);

  useEffect(() => {
    const initialEntities: LiveEntity[] = [
      { id: 'ent-1', type: 'car', x: 22, y: 36, label: 'GJ01AB1234' },
      { id: 'ent-2', type: 'walking', x: 45, y: 58, label: 'P-DEMO-001' },
      { id: 'ent-3', type: 'bike', x: 70, y: 42, label: 'GJ05XY6789' }
    ];
    setLiveEntities(initialEntities);

    const moveInterval = setInterval(() => {
      setLiveEntities(prev => prev.map(entity => ({
        ...entity,
        x: Math.max(15, Math.min(85, entity.x + (Math.random() * 4 - 2))),
        y: Math.max(20, Math.min(80, entity.y + (Math.random() * 4 - 2)))
      })));
    }, 3000);

    return () => clearInterval(moveInterval);
  }, []);

  return (
    <div className="p-6 h-full flex flex-col bg-[#05070c] text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <div className="mb-5 shrink-0 border-b border-cyan-950/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              GUJARAT POLICE STATE CORRIDOR RE-IDENTIFICATION
            </span>
            <span className="text-[10px] font-mono text-zinc-400">CORRIDOR HANDSHAKE: ACTIVE</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-100 font-mono">
            CROSS-CAMERA GEOSPATIAL TRAJECTORY TRACE
          </h1>
          <p className="text-xs text-zinc-400">
            Automated multi-camera entity trajectory mapping across Ahmedabad, Surat, and arterial toll plazas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-3 py-1.5 rounded border border-amber-500/40 flex items-center gap-1.5 font-bold">
            <Activity size={14} className="animate-pulse text-amber-400" />
            <span>SCENARIO A DETERMINISTIC TRACE</span>
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden">
        {/* Left: Active Track Selection */}
        <div className="w-full lg:w-[320px] bg-[#090d16] border border-cyan-950/70 rounded-lg flex flex-col shrink-0 overflow-hidden shadow-md">
          <div className="p-3.5 border-b border-cyan-950/60 bg-[#06080e] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
              <Crosshair size={14} /> ACTIVE CORRIDOR TARGETS
            </h2>
            <span className="text-[9px] font-mono text-zinc-500">{mockWatchlist.length} POIs</span>
          </div>
          
          <div className="p-3 space-y-2.5 overflow-y-auto custom-scrollbar flex-1">
            {mockWatchlist.map(target => (
              <div 
                key={target.id} 
                onClick={() => { setActiveTarget(target); setTraceProgress(0); }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeTarget?.id === target.id 
                    ? 'bg-cyan-950/50 border-cyan-500/60 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]' 
                    : 'bg-[#05070c] border-cyan-950/60 hover:border-cyan-800/50'
                }`}
              >
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded border border-cyan-900/50 overflow-hidden shrink-0 bg-black">
                    <img src={target.imageUrl} alt="Face" className="w-full h-full object-cover mix-blend-luminosity" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0 font-mono">
                    <h3 className="text-xs font-bold text-zinc-100 uppercase truncate">{target.name}</h3>
                    {target.associatedPlate && (
                      <span className="text-[10px] text-cyan-300 font-bold block mt-0.5">IND | {target.associatedPlate}</span>
                    )}
                    <span className="text-[9px] text-zinc-500 block">{target.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 border-t border-cyan-950/60 bg-[#06080e] text-[10px] font-mono">
             <div className="text-zinc-400 font-bold uppercase tracking-wider mb-1">CORRIDOR HANDSHAKE ENGINE</div>
             <div className="flex items-center gap-2 text-emerald-400">
               <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
               <span>STATELESS RE-ID ACTIVE</span>
             </div>
          </div>
        </div>

        {/* Right: Map Visualization */}
        <div className="flex-1 bg-[#090d16] border border-cyan-950/70 rounded-lg flex flex-col min-w-0 relative overflow-hidden shadow-md">
          <div className="absolute top-3 left-3 z-20 flex gap-2">
            <span className="bg-[#05070c]/90 text-cyan-300 border border-cyan-900/50 text-[10px] font-mono px-2.5 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 shadow">
              <MapIcon size={13} className="text-cyan-400" />
              GUJARAT STATE HIGHWAY ARTERIAL TOPOGRAPHY
            </span>
          </div>

          {/* Map Grid Background */}
          <div className="absolute inset-0 bg-[#04060a] flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#081b2915_1px,transparent_1px),linear-gradient(to_bottom,#081b2915_1px,transparent_1px)] bg-[size:32px_32px]" />
          </div>

          {/* SVG Overlay for Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {gujaratTrackingPath.map((node, index) => {
              if (index === gujaratTrackingPath.length - 1) return null;
              const nextNode = gujaratTrackingPath[index + 1];
              
              const x1 = `${node.x}%`;
              const y1 = `${node.y}%`;
              const x2 = `${nextNode.x}%`;
              const y2 = `${nextNode.y}%`;
              
              const totalSegments = gujaratTrackingPath.length - 1;
              const segmentStart = (index / totalSegments) * 100;
              const segmentEnd = ((index + 1) / totalSegments) * 100;
              
              let dashArray = "0 1000";
              if (traceProgress > segmentStart) {
                const progressInSegment = Math.min((traceProgress - segmentStart) / (segmentEnd - segmentStart), 1);
                dashArray = `${progressInSegment * 1000} 1000`;
              }

              return (
                <g key={`trace-${index}`}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(6,182,212,0.15)" strokeWidth="2" strokeDasharray="4 4" />
                  <line 
                    x1={x1} y1={y1} x2={x2} y2={y2} 
                    stroke="#06b6d4" 
                    strokeWidth="3" 
                    strokeDasharray={dashArray}
                    style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Camera Nodes */}
          {gujaratTrackingPath.map((camera, idx) => {
            const isAlertNode = camera.trigger;
            return (
              <div 
                key={camera.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
                style={{ left: `${camera.x}%`, top: `${camera.y}%` }}
              >
                {/* Ping animation if alert node */}
                {isAlertNode && (
                  <div className="absolute inset-0 m-auto w-12 h-12 bg-rose-500/20 rounded-full animate-ping -z-10" />
                )}
                
                <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center bg-[#070a12] transition-colors ${
                  isAlertNode
                    ? 'border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)]' 
                    : 'border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}>
                  <CameraIcon size={16} />
                </div>

                <div className="mt-2 bg-[#05070c]/90 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded border border-cyan-900/50 whitespace-nowrap shadow-lg flex flex-col items-center">
                  <span className={isAlertNode ? 'text-rose-400' : 'text-cyan-300'}>{camera.id}</span>
                  <span className="text-[8px] text-zinc-400 font-normal">{camera.time} IST</span>
                </div>
              </div>
            );
          })}

          {/* Live Moving Entities */}
          {liveEntities.map(entity => (
            <div
              key={entity.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-15 flex flex-col items-center pointer-events-none transition-all duration-[3000ms] ease-linear"
              style={{ left: `${entity.x}%`, top: `${entity.y}%` }}
            >
              <div className="px-1.5 py-0.5 rounded bg-cyan-500 text-black font-mono text-[8px] font-black tracking-wider mb-1 shadow">
                {entity.label}
              </div>
              <div className="w-5 h-5 rounded-full bg-cyan-400 border border-black shadow-[0_0_12px_rgba(6,182,212,0.8)] flex items-center justify-center text-black">
                {entity.type === 'walking' && <User size={10} />}
                {entity.type === 'car' && <Car size={10} />}
                {entity.type === 'bike' && <Bike size={10} />}
              </div>
            </div>
          ))}

          {/* Trace Timeline bottom strip */}
          <div className="absolute bottom-3 left-3 right-3 bg-[#06080e]/90 backdrop-blur-md border border-cyan-950/80 rounded-lg p-3 flex gap-3 overflow-x-auto custom-scrollbar z-20 font-mono">
             {gujaratTrackingPath.map((node, index) => {
               return (
                 <div key={`event-${index}`} className={`shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded border ${
                   node.trigger 
                     ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                     : 'bg-[#090d16] border-cyan-950/80 text-zinc-300'
                 }`}>
                   <div className="text-[10px] text-cyan-400 font-bold">{node.time}</div>
                   <div className="w-[1px] h-3 bg-white/20" />
                   <div className="text-[10px] font-bold">{node.name}</div>
                   {node.trigger && (
                     <span className="text-[8px] bg-rose-500 text-white font-black px-1 rounded uppercase">
                       ALERT TRIGGER
                     </span>
                   )}
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
}
