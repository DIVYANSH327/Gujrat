import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Eye, 
  Video, 
  Search, 
  Compass, 
  AlertTriangle, 
  ScanFace, 
  Server, 
  ShieldCheck, 
  Activity,
  Radio,
  Lock,
  Cpu
} from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activeAlertCount?: number;
}

export function Sidebar({ currentView, onViewChange, activeAlertCount = 3 }: SidebarProps) {
  const [filterText, setFilterText] = useState('');

  const navItems: { id: ViewMode; label: string; sub: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    { 
      id: 'dashboard', 
      label: 'COMMAND', 
      sub: 'Operational Overview',
      icon: <LayoutDashboard size={17} /> 
    },
    { 
      id: 'challenge', 
      label: "GOD'S EYE", 
      sub: 'Multi-Camera Tracking',
      icon: <Eye size={17} />, 
      badge: 'HERO', 
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' 
    },
    { 
      id: 'cameras', 
      label: 'LIVE CAMERAS', 
      sub: 'Simulated CCTV Grid',
      icon: <Video size={17} />,
      badge: '50',
      badgeColor: 'bg-zinc-800 text-zinc-400 border-white/10'
    },
    { 
      id: 'search', 
      label: 'AI SEARCH', 
      sub: 'Plate & Person Query',
      icon: <Search size={17} /> 
    },
    { 
      id: 'tracking', 
      label: 'INVESTIGATIONS', 
      sub: 'Trajectory & Dossiers',
      icon: <Compass size={17} /> 
    },
    { 
      id: 'alerts', 
      label: 'ALERTS', 
      sub: 'Incident Queue',
      icon: <AlertTriangle size={17} />,
      badge: activeAlertCount > 0 ? `${activeAlertCount} ACT` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40'
    },
    { 
      id: 'watchlist', 
      label: 'WATCHLIST', 
      sub: 'Synthetic Subjects',
      icon: <ScanFace size={17} /> 
    },
    { 
      id: 'nodes', 
      label: 'EDGE FLEET', 
      sub: 'Hardware & Sync Node',
      icon: <Server size={17} /> 
    },
    { 
      id: 'policies', 
      label: 'SECURITY', 
      sub: 'Rules & Certs',
      icon: <Lock size={17} /> 
    },
    { 
      id: 'system', 
      label: 'SYSTEM', 
      sub: 'Readiness Matrix',
      icon: <Cpu size={17} />,
      badge: 'v0.7',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
  ];

  const filteredItems = navItems.filter(item => 
    item.label.toLowerCase().includes(filterText.toLowerCase()) || 
    item.sub.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <aside className="w-60 bg-[#090b10] text-zinc-300 flex flex-col h-full border-r border-cyan-950/40 select-none shrink-0 z-20">
      {/* Search / Filter rail */}
      <div className="p-3 border-b border-cyan-950/40 bg-[#06080c]">
        <div className="relative">
          <input 
            type="text" 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="FILTER MODULES..." 
            className="w-full bg-[#0d1117] border border-cyan-900/30 rounded py-1.5 pl-7 pr-3 text-[11px] font-mono tracking-wider focus:outline-none focus:border-cyan-500/60 text-zinc-100 placeholder:text-zinc-600 uppercase" 
          />
          <div className="absolute left-2 top-2 text-zinc-500">
            <Search size={12} />
          </div>
          {filterText && (
            <button 
              onClick={() => setFilterText('')}
              className="absolute right-2 top-1.5 text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        <div className="px-2.5 pt-2 pb-1.5 flex items-center justify-between text-[9px] uppercase font-mono font-bold text-zinc-500 tracking-widest">
          <span>OPERATIONAL MODULES</span>
          <span className="flex items-center gap-1 text-[8px] text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            ONLINE
          </span>
        </div>

        {filteredItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded transition-all text-left group cursor-pointer ${
                isActive
                  ? 'bg-cyan-950/40 text-cyan-200 border-l-2 border-cyan-400 border-y border-r border-cyan-900/30 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)] font-medium'
                  : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`${isActive ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'} transition-colors shrink-0`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className={`text-[12px] font-semibold tracking-wider font-mono truncate ${isActive ? 'text-cyan-100' : 'text-zinc-300'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate font-sans -mt-0.5">
                    {item.sub}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ml-1.5 ${item.badgeColor || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Edge telemetry status footer */}
      <div className="p-3 border-t border-cyan-950/40 bg-[#06080c] space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Radio size={12} className="text-emerald-400 animate-pulse" />
            <span>CENTRAL SYNC</span>
          </span>
          <span className="text-emerald-400 font-bold">100% ACK</span>
        </div>
        <div className="text-[9px] font-mono text-zinc-500 flex justify-between">
          <span>DISTRICT:</span>
          <span className="text-zinc-400">GUJARAT STATE (GJ)</span>
        </div>
        <div className="text-[9px] font-mono text-zinc-500 flex justify-between">
          <span>FRAME SEC:</span>
          <span className="text-cyan-400/80">SHA-256 SIGNED</span>
        </div>
      </div>
    </aside>
  );
}
