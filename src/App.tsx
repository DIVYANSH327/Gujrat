import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AISearch } from './components/AISearch';
import { Cameras } from './components/Cameras';
import { Alerts } from './components/Alerts';
import { Watchlist } from './components/Watchlist';
import { TargetTracking } from './components/TargetTracking';
import { EdgeFleet } from './components/EdgeFleet';
import { SecurityPolicies } from './components/SecurityPolicies';
import { ChallengeMode } from './components/ChallengeMode';
import { SystemReadinessView } from './components/SystemReadinessView';
import { ViewMode, DetectionEvent } from './types';
import { mockDetections } from './mockData';
import { Shield, Radio, Server, Video, AlertTriangle, Activity, CheckCircle2, Cpu } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('challenge');
  const [time, setTime] = useState(new Date());
  const [detections, setDetections] = useState<DetectionEvent[]>(mockDetections);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAutoCapture = (imageUrl: string, mode: string) => {
    const newEvent: DetectionEvent = {
      id: `auto-${Date.now()}`,
      cameraId: 'CAM-014',
      timestamp: new Date().toISOString(),
      objectType: mode === 'walking' ? 'person' : 'vehicle',
      confidence: +(0.88 + Math.random() * 0.10).toFixed(2),
      metadata: { movementMode: mode, plate: 'GJ01AB1234' },
      snapshotUrl: imageUrl
    };
    setDetections(prev => [newEvent, ...prev]);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'challenge':
        return <ChallengeMode />;
      case 'search':
        return <AISearch detections={detections} />;
      case 'cameras':
        return <Cameras onAutoCapture={handleAutoCapture} />;
      case 'alerts':
        return <Alerts />;
      case 'watchlist':
        return <Watchlist />;
      case 'tracking':
        return <TargetTracking />;
      case 'nodes':
        return <EdgeFleet />;
      case 'policies':
        return <SecurityPolicies />;
      case 'system':
        return <SystemReadinessView />;
      default:
        return <ChallengeMode />;
    }
  };

  // Indian Standard Time format (UTC+5:30)
  const istTimeStr = time.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });
  const istDateStr = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

  return (
    <div className="flex flex-col h-screen bg-[#07090e] text-zinc-100 font-sans overflow-hidden select-none">
      {/* Top Global Command Status Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-950/60 bg-[#090c14] shrink-0 z-30 shadow-md">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-900 to-indigo-950 rounded border border-cyan-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)] relative">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090c14] flex items-center justify-center">
              <span className="w-1 h-1 bg-white rounded-full"></span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-mono">GUJARAT POLICE</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-400 border border-cyan-700/40 rounded font-semibold tracking-wider">
                V0.7-PROD
              </span>
            </div>
            <h1 className="text-sm font-black tracking-tight text-zinc-100 font-mono">
              AI CCTV INTELLIGENCE <span className="text-cyan-400 font-normal text-xs">| COMMAND CENTER</span>
            </h1>
          </div>
        </div>

        {/* Center / Right Operational Telemetry Matrix */}
        <div className="hidden lg:flex items-center gap-5 text-xs font-mono">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0d121f] border border-emerald-500/30 rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-emerald-400 font-bold tracking-wider text-[11px]">SYSTEM OPERATIONAL</span>
          </div>

          {/* Edge Nodes */}
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Server size={10} className="text-cyan-400" /> EDGE NODES
            </span>
            <span className="text-[11px] font-bold text-zinc-200">
              <span className="text-cyan-400">6</span> / 6 ONLINE
            </span>
          </div>

          {/* Cameras */}
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Video size={10} className="text-cyan-400" /> CAMERAS
            </span>
            <span className="text-[11px] font-bold text-zinc-200">
              <span className="text-cyan-400">50</span> MONITORED
            </span>
          </div>

          {/* Active Alerts */}
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <AlertTriangle size={10} className="text-amber-400" /> ACTIVE ALERTS
            </span>
            <span className="text-[11px] font-bold text-amber-400">
              3 <span className="text-zinc-500 text-[9px] font-normal">UNACK</span>
            </span>
          </div>

          {/* Events/Min */}
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Activity size={10} className="text-cyan-400" /> EVENTS/MIN
            </span>
            <span className="text-[11px] font-bold text-zinc-200">
              142 <span className="text-emerald-400 text-[9px]">▲ +4%</span>
            </span>
          </div>

          {/* Sync Status */}
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-400" /> SYNC STATUS
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              SYNCHRONIZED
            </span>
          </div>
        </div>

        {/* Far Right Badge & IST Time */}
        <div className="flex items-center gap-3">
          {/* SIMULATED DEMO BADGE (PROMINENT) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 border border-amber-500/50 rounded shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono font-bold text-amber-300 tracking-wider">SIMULATED DEMO</span>
              <span className="text-[8px] font-mono text-amber-400/80 -mt-0.5">SYNTHETIC FEEDS</span>
            </div>
          </div>

          {/* Clock */}
          <div className="hidden sm:flex flex-col items-end pl-2 border-l border-white/10 font-mono">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest">IST (UTC+5:30)</span>
            <span className="text-xs font-bold text-cyan-300 tabular-nums">{istTimeStr}</span>
            <span className="text-[8px] text-zinc-500">{istDateStr}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} activeAlertCount={3} />
        <main className="flex-1 relative overflow-hidden flex flex-col custom-scrollbar bg-[#05070c]">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
