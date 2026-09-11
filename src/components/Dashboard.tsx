import React, { useState } from 'react';
import { 
  Camera as CameraIcon, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Server, 
  Video, 
  MapPin, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Database, 
  ChevronRight,
  Shield,
  Eye,
  Radio,
  FileText,
  Workflow,
  Sliders
} from 'lucide-react';
import { ViewMode } from '../types';
import { AlertCard } from './AlertCard';

interface DashboardProps {
  onViewChange?: (view: ViewMode) => void;
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  const districts = [
    { id: 'ALL', name: 'ALL GUJARAT', nodes: 6, cameras: 50, alerts: 3 },
    { id: 'Ahmedabad', name: 'AHMEDABAD METRO', nodes: 3, cameras: 24, alerts: 2 },
    { id: 'Surat', name: 'SURAT TEXTILE ZONE', nodes: 1, cameras: 14, alerts: 1 },
    { id: 'Vadodara', name: 'VADODARA CENTRAL', nodes: 1, cameras: 8, alerts: 0 },
    { id: 'Rajkot', name: 'RAJKOT ARTERIAL', nodes: 1, cameras: 4, alerts: 0 },
  ];

  const recentEvents = [
    {
      id: 'EVT-9041',
      time: '18:54:12',
      camera: 'CAM-014 (Ashram Rd Hub)',
      district: 'Ahmedabad',
      eventType: 'WATCHLIST MATCH',
      target: 'GJ01AB1234',
      confidence: 96,
      node: 'EDGE-GJ-001',
      status: 'RULE_TRIGGERED',
      statusColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    {
      id: 'EVT-9040',
      time: '18:52:05',
      camera: 'CAM-023 (Sindhu Bhavan Toll)',
      district: 'Ahmedabad',
      eventType: 'HELMET VIOLATION',
      target: 'TWO-WHEELER RIDER',
      confidence: 92,
      node: 'EDGE-GJ-001',
      status: 'FLAGGED',
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'EVT-9039',
      time: '18:49:30',
      camera: 'CAM-007 (SG Highway North)',
      district: 'Ahmedabad',
      eventType: 'SPEED RESTRICTION',
      target: 'GJ05XY6789',
      confidence: 98,
      node: 'EDGE-GJ-001',
      status: 'E-CHALLAN READY',
      statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    },
    {
      id: 'EVT-9038',
      time: '18:45:18',
      camera: 'CAM-042 (Surat Market Gate 1)',
      district: 'Surat',
      eventType: 'ANPR TRANSIT',
      target: 'GJ05CD5521',
      confidence: 99,
      node: 'EDGE-GJ-002',
      status: 'VERIFIED',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'EVT-9037',
      time: '18:41:02',
      camera: 'CAM-031 (Ring Rd Interchange)',
      district: 'Ahmedabad',
      eventType: 'TRAFFIC DENSITY',
      target: 'CONGESTION LVL 2',
      confidence: 94,
      node: 'EDGE-GJ-001',
      status: 'LOGGED',
      statusColor: 'text-zinc-400 bg-zinc-800 border-zinc-700'
    }
  ];

  const activeInvestigations = [
    {
      id: 'INV-GJ-001',
      target: 'GJ01AB1234 (Sedan)',
      subject: 'White Sedan Corridor Trajectory',
      route: 'CAM-007 → CAM-014 → CAM-023 → CAM-031',
      lastSeen: 'CAM-031 @ 18:45 IST',
      alertStatus: 'CRITICAL (CAM-014 Trigger)',
      statusColor: 'border-rose-500/40 bg-rose-950/20 text-rose-300'
    },
    {
      id: 'INV-GJ-002',
      target: 'P-DEMO-001 (Subject Alpha)',
      subject: 'Multi-Camera Person Traversal',
      route: 'CAM-007 → CAM-014 → CAM-023',
      lastSeen: 'CAM-023 @ 18:38 IST',
      alertStatus: 'MONITORED',
      statusColor: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
    },
    {
      id: 'INV-GJ-003',
      target: 'GJ05XY6789 (Motorcycle)',
      subject: 'Speed & Helmet Non-Compliance',
      route: 'CAM-007 → CAM-023',
      lastSeen: 'CAM-007 @ 18:22 IST',
      alertStatus: 'CITATION ISSUED',
      statusColor: 'border-amber-500/40 bg-amber-950/20 text-amber-300'
    }
  ];

  const edgeFleetHealth = [
    { node: 'EDGE-GJ-001', location: 'Ahmedabad Central C4i', status: 'online', dvr: 2, cams: 16, queue: 0, sync: '100% SYNC', ping: '4ms' },
    { node: 'EDGE-GJ-002', location: 'Surat City Traffic HQ', status: 'online', dvr: 2, cams: 14, queue: 2, sync: '100% SYNC', ping: '7ms' },
    { node: 'EDGE-GJ-003', location: 'Vadodara Smart City Hub', status: 'online', dvr: 2, cams: 12, queue: 0, sync: '100% SYNC', ping: '6ms' },
    { node: 'EDGE-GJ-004', location: 'Rajkot Traffic Cell', status: 'online', dvr: 1, cams: 8, queue: 0, sync: '100% SYNC', ping: '9ms' },
  ];

  return (
    <div className="p-5 h-full overflow-y-auto bg-[#05070c] text-zinc-100 font-sans custom-scrollbar">
      {/* Header Banner */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-cyan-950/50 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              GUJARAT POLICE STATEWIDE C4i
            </span>
            <span className="text-[10px] font-mono text-zinc-400">TELEMETRY POLLING: 1000ms</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-100 font-mono flex items-center gap-2">
            OPERATIONAL COMMAND OVERVIEW
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time multi-camera edge analytics, synthetic trajectory tracking, and unified alert dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onViewChange && (
            <>
              <button
                onClick={() => onViewChange('system_brain')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Workflow size={14} className="text-cyan-400" />
                <span>SYSTEM BRAIN</span>
              </button>
              <button
                onClick={() => onViewChange('scale_lab')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Sliders size={14} className="text-amber-400" />
                <span>SCALE LAB</span>
              </button>
              <button
                onClick={() => onViewChange('challenge')}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                <Eye size={15} />
                <span>LAUNCH GOD'S EYE</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 1. Top Section: SYSTEM STATUS KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {/* Edge Nodes */}
        <div className="bg-[#090d16] border border-cyan-950/70 rounded-lg p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <Server size={13} className="text-cyan-400" /> EDGE NODES
            </div>
            <div className="text-2xl font-black font-mono text-zinc-100 mt-1">
              6 <span className="text-xs font-normal text-zinc-400">/ 6 ONLINE</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 100% CLUSTER HEALTH
            </div>
          </div>
          <div className="p-2.5 bg-cyan-950/30 rounded border border-cyan-800/30 text-cyan-400">
            <Cpu size={20} />
          </div>
        </div>

        {/* Real CCTV Ingest Status */}
        <div 
          onClick={() => onViewChange && onViewChange('cameras')}
          className="bg-[#090d16] border border-cyan-950/70 hover:border-cyan-500/40 rounded-lg p-3.5 flex items-center justify-between shadow-sm cursor-pointer transition-all group"
        >
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <Video size={13} className="text-cyan-400" /> REAL CCTV SOURCES
            </div>
            <div className="text-2xl font-black font-mono text-zinc-100 mt-1">
              0 <span className="text-xs font-normal text-zinc-500">CONNECTED</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
              <span className="text-cyan-400 font-bold">DVR / NVR / VMS / ONVIF</span> READY
            </div>
          </div>
          <div className="p-2.5 bg-cyan-950/30 rounded border border-cyan-800/30 text-cyan-400 group-hover:border-cyan-500/50">
            <CameraIcon size={20} />
          </div>
        </div>

        {/* YouTube Demo Feeds */}
        <div 
          onClick={() => onViewChange && onViewChange('youtube_demo')}
          className="bg-[#090d16] border border-amber-950/50 hover:border-amber-500/40 rounded-lg p-3.5 flex items-center justify-between shadow-sm cursor-pointer transition-all group"
        >
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <Video size={13} className="text-amber-400" /> YOUTUBE DEMO SOURCES
            </div>
            <div className="text-2xl font-black font-mono text-amber-300 mt-1">
              4 <span className="text-xs font-normal text-amber-400">SOURCES</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
              <span className="text-amber-400 font-bold">DEMO VIDEO ONLY</span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-950/30 rounded border border-amber-800/30 text-amber-400 group-hover:border-amber-500/50">
            <Video size={20} />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-[#090d16] border border-cyan-950/70 rounded-lg p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-rose-400" /> ACTIVE ALERTS
            </div>
            <div className="text-2xl font-black font-mono text-rose-400 mt-1">
              3 <span className="text-xs font-normal text-zinc-400">INCIDENTS</span>
            </div>
            <div className="text-[10px] font-mono text-rose-300 mt-0.5">
              1 CRITICAL (CAM-014) • 2 WARN
            </div>
          </div>
          <div className="p-2.5 bg-rose-950/30 rounded border border-rose-800/30 text-rose-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Inferences & Storage */}
        <div className="bg-[#090d16] border border-cyan-950/70 rounded-lg p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <Activity size={13} className="text-emerald-400" /> INFERENCE RATE
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              142 <span className="text-xs font-normal text-zinc-400">EVT/MIN</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
              AVG LATENCY: <span className="text-cyan-400 font-bold">14.2ms</span> (EDGE)
            </div>
          </div>
          <div className="p-2.5 bg-emerald-950/30 rounded border border-emerald-800/30 text-emerald-400">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* Active Priority Alert Card */}
      <div className="mb-5">
        <AlertCard
          alert={{
            id: 'ALT-8821',
            violationType: 'Wrong-Way Transit & Speed Exceedance',
            vehiclePlate: 'GJ01AB1234',
            vehicleType: 'White SUV',
            cameraId: 'CAM-014',
            location: 'Ahmedabad • SG Highway Junction',
            timestamp: '18:54:12',
            confidence: 96.4,
            evidenceUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'
          }}
          onReviewAlert={() => onViewChange && onViewChange('tracking')}
          onViewFullEvidence={() => onViewChange && onViewChange('tracking')}
          onTrackVehicle={() => onViewChange && onViewChange('tracking')}
          onViewCamera={() => onViewChange && onViewChange('cameras')}
        />
      </div>

      {/* 2. Middle Section: OPERATIONAL MAP & ACTIVE INVESTIGATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* OPERATIONAL MAP (GUJARAT MUNICIPAL GRID) */}
        <div className="lg:col-span-2 bg-[#090d16] border border-cyan-950/70 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-cyan-950/40 pb-2.5">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
                OPERATIONAL GIS MAP GRID (GUJARAT REGIONAL JURISDICTION)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
              SIMULATED LIVE COORDINATES
            </span>
          </div>

          {/* Interactive District Filter */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            {districts.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDistrict(d.id)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono tracking-wider cursor-pointer shrink-0 transition-colors ${
                  selectedDistrict === d.id
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                    : 'bg-[#06080e] text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {d.name} ({d.cameras} CAMS)
              </button>
            ))}
          </div>

          {/* Visual Map Representation */}
          <div className="relative flex-1 min-h-[260px] bg-[#04060a] border border-cyan-950/80 rounded-md overflow-hidden p-4 flex flex-col justify-between">
            {/* Grid background styling */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#081b2915_1px,transparent_1px),linear-gradient(to_bottom,#081b2915_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Radar / Corridor Path Visual */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-cyan-500/30 fill-none">
              <path d="M 80 180 Q 220 140 340 100 T 580 80" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 120 190 L 260 130 L 420 150 L 520 220" strokeWidth="1.5" strokeDasharray="2 2" stroke="rgba(244,63,94,0.4)" />
            </svg>

            {/* Simulated Map Nodes */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Ahmedabad Hotspot */}
              <div className="bg-[#0b101c]/90 border border-cyan-500/40 rounded p-2.5 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold mb-1">
                  <span>AHMEDABAD (SG HWY)</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <div className="text-[9px] font-mono text-zinc-400">
                  CORRIDOR: CAM-007 → CAM-031
                </div>
                <div className="text-[9px] font-mono text-rose-400 mt-1 font-semibold">
                  ● ALERT: CAM-014 MATCH
                </div>
              </div>

              {/* Surat Hotspot */}
              <div className="bg-[#0b101c]/90 border border-cyan-900/40 rounded p-2.5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 font-bold mb-1">
                  <span>SURAT (RING ROAD)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[9px] font-mono text-zinc-400">
                  14 CAMS ACTIVE (100%)
                </div>
                <div className="text-[9px] font-mono text-emerald-400 mt-1">
                  ● NOMINAL FLOW
                </div>
              </div>

              {/* Vadodara Hotspot */}
              <div className="bg-[#0b101c]/90 border border-cyan-900/40 rounded p-2.5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 font-bold mb-1">
                  <span>VADODARA (ALKAPURI)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[9px] font-mono text-zinc-400">
                  8 CAMS ACTIVE (1 DEGR)
                </div>
                <div className="text-[9px] font-mono text-zinc-500 mt-1">
                  ● STREAM RECOVERED
                </div>
              </div>

              {/* Rajkot Hotspot */}
              <div className="bg-[#0b101c]/90 border border-cyan-900/40 rounded p-2.5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 font-bold mb-1">
                  <span>RAJKOT (EXPRESSWAY)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[9px] font-mono text-zinc-400">
                  4 CAMS ACTIVE (100%)
                </div>
                <div className="text-[9px] font-mono text-emerald-400 mt-1">
                  ● NOMINAL FLOW
                </div>
              </div>
            </div>

            {/* Map bottom bar */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-cyan-950/60 text-[10px] font-mono text-zinc-400">
              <span>LAT: 23.0225° N | LON: 72.5714° E (GUJARAT REGIONAL GIS GRID)</span>
              <span className="text-cyan-400">SCALE: 1:25,000</span>
            </div>
          </div>
        </div>

        {/* ACTIVE SYNTHETIC INVESTIGATIONS */}
        <div className="bg-[#090d16] border border-cyan-950/70 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-cyan-950/40 pb-2.5">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
                  ACTIVE INVESTIGATIONS
                </h2>
              </div>
              <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
                3 ONGOING
              </span>
            </div>

            <div className="space-y-2.5">
              {activeInvestigations.map(inv => (
                <div 
                  key={inv.id} 
                  onClick={() => onViewChange && onViewChange('tracking')}
                  className={`p-3 rounded border ${inv.statusColor} cursor-pointer hover:opacity-95 transition-all group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-black tracking-wider text-zinc-100">
                      {inv.target}
                    </span>
                    <span className="text-[9px] font-mono uppercase font-bold tracking-wider opacity-90">
                      {inv.alertStatus}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-300 font-medium mb-1">
                    {inv.subject}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-400 truncate">
                    PATH: {inv.route}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5 text-[9px] font-mono text-zinc-400">
                    <span>{inv.lastSeen}</span>
                    <span className="text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      VIEW DOSSIER <ChevronRight size={11} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-cyan-950/50">
            <button 
              onClick={() => onViewChange && onViewChange('tracking')}
              className="w-full py-2 bg-[#0d121f] hover:bg-[#131b2e] border border-cyan-900/40 text-cyan-300 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText size={13} />
              <span>OPEN INVESTIGATION DOSSIERS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: LIVE EVENT STREAM & EDGE FLEET HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LIVE EVENT STREAM */}
        <div className="lg:col-span-2 bg-[#090d16] border border-cyan-950/70 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-cyan-950/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Radio size={15} className="text-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
                LIVE EVENT STREAM (SIMULATED LIVE INFERENCES)
              </h2>
            </div>
            <span className="text-[9px] font-mono text-zinc-400">
              BUFFER: 50 EVENTS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-cyan-950/60 text-[9px] uppercase tracking-wider text-zinc-500">
                  <th className="pb-2 font-bold">TIME</th>
                  <th className="pb-2 font-bold">CAMERA / LOCATION</th>
                  <th className="pb-2 font-bold">EVENT TYPE</th>
                  <th className="pb-2 font-bold">TARGET</th>
                  <th className="pb-2 font-bold">CONF</th>
                  <th className="pb-2 font-bold">EDGE NODE</th>
                  <th className="pb-2 font-bold text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950/30 text-[11px]">
                {recentEvents.map((evt, idx) => (
                  <tr key={evt.id ? `${evt.id}-${idx}` : `evt-${idx}`} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-2.5 text-zinc-400">{evt.time}</td>
                    <td className="py-2.5 text-zinc-200 font-semibold">{evt.camera}</td>
                    <td className="py-2.5 text-cyan-300 font-bold">{evt.eventType}</td>
                    <td className="py-2.5 text-zinc-300">{evt.target}</td>
                    <td className="py-2.5 text-zinc-400">{evt.confidence}%</td>
                    <td className="py-2.5 text-zinc-500 text-[10px]">{evt.node}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${evt.statusColor}`}>
                        {evt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EDGE HEALTH MONITOR */}
        <div className="bg-[#090d16] border border-cyan-950/70 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-cyan-950/40 pb-2.5">
              <div className="flex items-center gap-2">
                <Server size={15} className="text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
                  EDGE FLEET HEALTH
                </h2>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/30">
                100% ONLINE
              </span>
            </div>

            <div className="space-y-2">
              {edgeFleetHealth.map(node => (
                <div key={node.node} className="p-2.5 bg-[#05070c] border border-cyan-950/60 rounded text-xs font-mono flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">{node.node}</span>
                    <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {node.sync}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {node.location}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-1 border-t border-white/5">
                    <span>{node.cams} CAMS ({node.dvr} DVRs)</span>
                    <span>QUEUE: {node.queue} | RTT: {node.ping}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-cyan-950/50">
            <button 
              onClick={() => onViewChange && onViewChange('nodes')}
              className="w-full py-2 bg-[#0d121f] hover:bg-[#131b2e] border border-cyan-900/40 text-cyan-300 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Server size={13} />
              <span>MANAGE EDGE NODES</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
