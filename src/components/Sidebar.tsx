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
  Cpu,
  Globe,
  Building2,
  Tv,
  Car,
  Tag,
  Workflow,
  Sliders,
  Scale,
  Smartphone,
  Sparkles,
  Crosshair,
  AlertOctagon,
  UserCheck,
  Shield,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { ViewMode } from '../types';
import { PROJECT_BRANDING } from '../branding';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activeAlertCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavGroup {
  id: string;
  title: string;
  items: {
    id: ViewMode;
    label: string;
    sub: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }[];
}

export function Sidebar({ 
  currentView, 
  onViewChange, 
  activeAlertCount = 3,
  isOpen = false,
  onClose 
}: SidebarProps) {
  const [filterText, setFilterText] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    ADVANCED: true // Advanced starts collapsed to reduce clutter
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'HOME',
      title: 'HOME',
      items: [
        { 
          id: 'command_center', 
          label: 'COMMAND CENTER', 
          sub: 'AI Command Center',
          icon: <Shield size={18} />
        },
        { 
          id: 'alerts', 
          label: 'ALERTS', 
          sub: 'Immediate Dispatches',
          icon: <AlertTriangle size={18} />,
          badge: activeAlertCount > 0 ? `${activeAlertCount}` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        },
        { 
          id: 'missions', 
          label: 'MISSIONS', 
          sub: 'Autonomous Tracking',
          icon: <Crosshair size={18} />
        },
        { 
          id: 'review_queue', 
          label: 'REVIEW QUEUE', 
          sub: 'Officer Verification',
          icon: <UserCheck size={18} />,
          badge: '3',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        },
        { 
          id: 'incidents', 
          label: 'INCIDENTS', 
          sub: 'Triage & Log',
          icon: <AlertOctagon size={18} />
        },
      ]
    },
    {
      id: 'INVESTIGATION',
      title: 'INVESTIGATION',
      items: [
        { 
          id: 'geospatial_map', 
          label: 'OPERATIONAL MAP', 
          sub: 'Real GIS & Evidence',
          icon: <Globe size={18} />
        },
        { 
          id: 'search', 
          label: 'VEHICLE SEARCH', 
          sub: 'Plate & Color Query',
          icon: <Search size={18} /> 
        },
        { 
          id: 'challenge', 
          label: "GOD'S EYE", 
          sub: 'Corridor Tracking',
          icon: <Eye size={18} />
        },
        { 
          id: 'tracking', 
          label: 'EVIDENCE & DOSSIERS', 
          sub: 'Forensic Records',
          icon: <Compass size={18} /> 
        },
        { 
          id: 'police_intel', 
          label: 'POLICE DATA INTEL', 
          sub: 'VAHAN & eChallan',
          icon: <Car size={18} />
        },
      ]
    },
    {
      id: 'CAMERAS',
      title: 'CAMERAS',
      items: [
        { 
          id: 'cameras', 
          label: 'CAMERA MATRIX', 
          sub: 'Real CCTV Grid',
          icon: <Video size={18} />
        },
        { 
          id: 'real_ai_test_lab', 
          label: 'REAL AI VISION LAB', 
          sub: 'Gemini 3.8 Live Pipeline',
          icon: <Sparkles size={18} />,
          badge: 'REAL AI',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
        },
        { 
          id: 'mobile_camera', 
          label: 'MOBILE CAMERA', 
          sub: 'Phone Video Feed',
          icon: <Smartphone size={18} />,
          badge: 'REAL',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        },
        { 
          id: 'youtube_demo', 
          label: 'YOUTUBE DEMO', 
          sub: 'Public Display Only',
          icon: <Tv size={18} />,
          badge: 'DISPLAY ONLY',
          badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700'
        },
        { 
          id: 'federated', 
          label: 'UNIFIED GRID', 
          sub: 'Cross-Dept CCTV',
          icon: <Globe size={18} />
        },
        { 
          id: 'sites', 
          label: 'CCTV SITES', 
          sub: 'Gateways & Hardware',
          icon: <Building2 size={18} />
        },
      ]
    },
    {
      id: 'ENFORCEMENT',
      title: 'ENFORCEMENT',
      items: [
        { 
          id: 'challan_mode', 
          label: 'CHALLAN MODE', 
          sub: 'Enforcement & BSA 2023',
          icon: <Scale size={18} />
        },
        { 
          id: 'watchlist', 
          label: 'WATCHLIST', 
          sub: 'Face (BSA 2023) & Vehicle',
          icon: <ScanFace size={18} />,
          badge: 'BSA 2023',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        },
      ]
    },
    {
      id: 'SYSTEM',
      title: 'SYSTEM',
      items: [
        { 
          id: 'gov_deployment', 
          label: 'GOV ON-PREMISE', 
          sub: 'Air-Gapped & NAS Cluster',
          icon: <Server size={18} />,
          badge: 'ON-PREM',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        },
        { 
          id: 'ai_mesh', 
          label: 'AI AGENTS', 
          sub: 'Agent Mesh Fleet',
          icon: <Cpu size={18} />
        },
        { 
          id: 'system_brain', 
          label: 'SYSTEM BRAIN', 
          sub: 'Operations Fabric',
          icon: <Workflow size={18} />
        },
        { 
          id: 'nodes', 
          label: 'EDGE FLEET', 
          sub: 'Edge Gateways',
          icon: <Server size={18} /> 
        },
        { 
          id: 'policies', 
          label: 'SECURITY & POLICIES', 
          sub: 'Rules & Certs',
          icon: <Lock size={18} /> 
        },
        { 
          id: 'system', 
          label: 'SYSTEM HEALTH', 
          sub: 'Readiness Matrix',
          icon: <Activity size={18} />
        },
      ]
    },
    {
      id: 'ADVANCED',
      title: 'ADVANCED',
      items: [
        { 
          id: 'digital_twin', 
          label: 'DIGITAL TWIN', 
          sub: '80K Scale & Fault Lab',
          icon: <Server size={18} />,
          badge: '80K',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
        },
        { 
          id: 'scale_lab', 
          label: 'SCALE LAB', 
          sub: 'Load Testing',
          icon: <Sliders size={18} />
        },
        { 
          id: 'ai_training_lab', 
          label: 'AI TRAINING LAB', 
          sub: 'Dataset Prep',
          icon: <Tag size={18} />
        },
        { 
          id: 'dashboard', 
          label: 'CLASSIC DASHBOARD', 
          sub: 'Legacy Metric Grid',
          icon: <LayoutDashboard size={18} /> 
        },
      ]
    }
  ];

  const handleSelectView = (view: ViewMode) => {
    onViewChange(view);
    if (onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#080b12] text-zinc-300 select-none">
      {/* Mobile Drawer Header with Close Button */}
      <div className="p-3 border-b border-cyan-950/40 bg-[#06080c] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Shield size={14} />
          </div>
          <span className="text-xs font-bold font-mono tracking-wider text-white">POLICE MODULES</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filter / Quick search */}
      <div className="p-2.5 border-b border-cyan-950/40 bg-[#07090f]">
        <div className="relative">
          <input 
            type="text" 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search modules..." 
            className="w-full bg-[#0d121c] border border-cyan-900/40 rounded-lg py-2 pl-8 pr-7 text-xs font-mono tracking-wider focus:outline-none focus:border-cyan-500 text-zinc-100 placeholder:text-zinc-500" 
          />
          <div className="absolute left-2.5 top-2.5 text-zinc-500 pointer-events-none">
            <Search size={14} />
          </div>
          {filterText && (
            <button 
              onClick={() => setFilterText('')}
              className="absolute right-2.5 top-2 text-xs text-zinc-500 hover:text-zinc-200 p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grouped Navigation List */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
        {navGroups.map((group) => {
          const matchingItems = group.items.filter(item => 
            !filterText || 
            item.label.toLowerCase().includes(filterText.toLowerCase()) || 
            item.sub.toLowerCase().includes(filterText.toLowerCase())
          );

          if (matchingItems.length === 0) return null;

          const isCollapsed = !filterText && !!collapsedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-mono font-bold tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors uppercase rounded"
              >
                <span>{group.title}</span>
                <span className="text-zinc-500 flex items-center space-x-1">
                  <span className="text-[10px] text-zinc-600">({matchingItems.length})</span>
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>

              {/* Group Items */}
              {!isCollapsed && (
                <div className="space-y-1 pl-0.5">
                  {matchingItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectView(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left min-h-[44px] cursor-pointer ${
                          isActive
                            ? 'bg-cyan-950/60 text-cyan-200 border-l-2 border-cyan-400 border-y border-r border-cyan-900/40 font-medium'
                            : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`${isActive ? 'text-cyan-400' : 'text-zinc-500'} shrink-0`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs font-semibold tracking-wider font-mono truncate ${isActive ? 'text-cyan-100' : 'text-zinc-200'}`}>
                              {item.label}
                            </div>
                            <div className="text-[10px] text-zinc-500 truncate font-sans">
                              {item.sub}
                            </div>
                          </div>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ml-2 ${item.badgeColor || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Subtle Sidebar Footer */}
      <div className="p-3 border-t border-cyan-950/40 bg-[#06080c] text-xs font-mono space-y-1">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400">SYSTEM ONLINE</span>
          </span>
          <span className="text-[10px] text-zinc-500">GJ POLICE</span>
        </div>
        <div className="text-[9px] text-zinc-500 truncate text-center pt-1">
          {PROJECT_BRANDING.madeBy}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar (lg+) */}
      <aside className="hidden lg:flex w-64 border-r border-cyan-950/40 select-none shrink-0 z-20 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay (< lg) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={onClose} 
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

