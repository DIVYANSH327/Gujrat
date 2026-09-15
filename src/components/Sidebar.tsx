import React, { useState, useEffect } from 'react';
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
  X,
  FileText,
  Settings,
  Moon
} from 'lucide-react';
import { ViewMode } from '../types';
import { PROJECT_BRANDING } from '../branding';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activeAlertCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const [filterText, setFilterText] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    'ADMIN / ADVANCED': true // Collapsed by default for clean officer experience
  });

  // Close drawer on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close drawer on route change
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [currentView]);

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
          label: 'Dashboard', 
          sub: 'Traffic & CCTV Overview',
          icon: <LayoutDashboard size={18} />
        },
        { 
          id: 'cameras', 
          label: 'Live Cameras', 
          sub: 'Operational Video Grid',
          icon: <Video size={18} />
        },
        { 
          id: 'sentinel_grid', 
          label: 'Sentinel Camera Grid', 
          sub: 'SCRB Sandbox & Ingestion Lab',
          icon: <Radio size={18} />,
          badge: 'SCRB SANDBOX',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
        },
      ]
    },
    {
      id: 'INVESTIGATION',
      title: 'INVESTIGATION',
      items: [
        { 
          id: 'search', 
          label: 'Vehicle Search', 
          sub: 'Plate & Color Query',
          icon: <Search size={18} /> 
        },
        { 
          id: 'watchlist', 
          label: 'Person Watchlist', 
          sub: 'Face & Target Review',
          icon: <ScanFace size={18} />,
          badge: 'BSA 2023',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
        },
        { 
          id: 'challenge', 
          label: "God's Eye", 
          sub: 'Corridor Reconstruction',
          icon: <Eye size={18} />
        },
        { 
          id: 'geospatial_map', 
          label: 'Evidence Map', 
          sub: 'Verified GIS Coordinates',
          icon: <Globe size={18} />
        },
      ]
    },
    {
      id: 'OPERATIONS',
      title: 'OPERATIONS',
      items: [
        { 
          id: 'raw_video_audit', 
          label: 'Raw Video Audit', 
          sub: 'Corp8 Decoder Forensic',
          icon: <Activity size={18} />,
          badge: 'DECODER AUDIT',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        },
        { 
          id: 'night_audit', 
          label: 'Night CCTV Audit', 
          sub: 'Overnight Sentinel Audit',
          icon: <Moon size={18} />,
          badge: 'BSA 2023',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        },
        { 
          id: 'alerts', 
          label: 'Alerts', 
          sub: 'Active Rule Triggers',
          icon: <AlertTriangle size={18} />,
          badge: activeAlertCount > 0 ? `${activeAlertCount}` : undefined,
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
        },
        { 
          id: 'incidents', 
          label: 'Incidents', 
          sub: 'Command & Triage Log',
          icon: <AlertOctagon size={18} />
        },
        { 
          id: 'missions', 
          label: 'Missions', 
          sub: 'Autonomous Tracking',
          icon: <Crosshair size={18} />
        },
      ]
    },
    {
      id: 'ENFORCEMENT',
      title: 'ENFORCEMENT',
      items: [
        { 
          id: 'challan_mode', 
          label: 'Challan Review', 
          sub: 'Violation Adjudication',
          icon: <Scale size={18} />
        },
        { 
          id: 'tracking', 
          label: 'Evidence', 
          sub: 'SHA-256 Forensic Dossiers',
          icon: <Compass size={18} /> 
        },
      ]
    },
    {
      id: 'SYSTEM',
      title: 'SYSTEM',
      items: [
        { 
          id: 'sites', 
          label: 'Camera Matrix', 
          sub: 'Hardware & Sites Registry',
          icon: <Building2 size={18} />
        },
        { 
          id: 'system', 
          label: 'System Health', 
          sub: 'Readiness & Diagnostic',
          icon: <Activity size={18} />
        },
      ]
    },
    {
      id: 'ADMIN / ADVANCED',
      title: 'ADMIN / ADVANCED',
      items: [
        { 
          id: 'ai_mesh', 
          label: 'AI Agent Mesh', 
          sub: 'Distributed Intelligence',
          icon: <Cpu size={18} />
        },
        { 
          id: 'cyber_security', 
          label: 'Cyber Defense Mesh', 
          sub: '10 Defensive Agents',
          icon: <ShieldCheck size={18} />,
          badge: 'DEFENSE',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        },
        { 
          id: 'nodes', 
          label: 'Edge Fleet', 
          sub: 'Edge Node Gateways',
          icon: <Server size={18} /> 
        },
        { 
          id: 'police_intel', 
          label: 'Audit & Records', 
          sub: 'VAHAN & Enforcement Logs',
          icon: <FileText size={18} />
        },
        { 
          id: 'policies', 
          label: 'Security & Certs', 
          sub: 'Policy & Access Controls',
          icon: <Lock size={18} /> 
        },
        { 
          id: 'gov_deployment', 
          label: 'Settings / On-Prem', 
          sub: 'Air-Gap & NAS Config',
          icon: <Settings size={18} />
        },
        { 
          id: 'real_ai_test_lab', 
          label: 'Real AI Vision Lab', 
          sub: 'Gemini 3.8 Flash Engine',
          icon: <Sparkles size={18} />,
          badge: 'AI LAB',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
        },
        { 
          id: 'mobile_camera', 
          label: 'Mobile Patrol Cam', 
          sub: 'Live Device Video Source',
          icon: <Smartphone size={18} />
        },
        { 
          id: 'youtube_demo', 
          label: 'YouTube Demo', 
          sub: 'Synthetic / Display Only',
          icon: <Tv size={18} />,
          badge: 'DEMO ONLY',
          badgeColor: 'bg-slate-100 text-slate-500 border-slate-300'
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
    <div className="flex flex-col h-full bg-white text-slate-700 select-none border-r border-slate-200">
      {/* Mobile Drawer Header with Close Button */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Shield size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              GUJARAT POLICE
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Navigation Menu
            </div>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Filter / Quick search */}
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="relative">
          <input 
            type="text" 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search navigation..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-7 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-colors" 
          />
          <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
            <Search size={14} />
          </div>
          {filterText && (
            <button 
              onClick={() => setFilterText('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grouped Navigation List */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
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
                className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold tracking-wider text-slate-500 hover:text-slate-800 transition-colors uppercase rounded-lg cursor-pointer"
              >
                <span>{group.title}</span>
                <span className="flex items-center space-x-1">
                  <span className="text-[10px] text-slate-400">({matchingItems.length})</span>
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>

              {/* Group Items */}
              {!isCollapsed && (
                <div className="space-y-0.5 pt-0.5">
                  {matchingItems.map((item) => {
                    const isActive = currentView === item.id || (item.id === 'command_center' && currentView === 'dashboard');
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectView(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left min-h-[44px] cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                            : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`${isActive ? 'text-blue-600' : 'text-slate-400'} shrink-0`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold leading-tight truncate">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal truncate">
                              {item.sub}
                            </div>
                          </div>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ml-2 ${item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
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
      <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-xs space-y-1">
        <div className="flex items-center justify-between text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-emerald-700 font-semibold">Online</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Gujarat Police HQ</span>
        </div>
      </div>
    </div>
  );

  // Collapsed Sidebar Rail (Icon-Only View for High-Density Grid Mode)
  const collapsedSidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-3 border-b border-slate-200 flex flex-col items-center justify-center gap-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand Navigation Sidebar"
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 transition cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
        {navGroups.map((group) => (
          <div key={group.id} className="space-y-1.5">
            <div className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wider">
              {group.id.substring(0, 3)}
            </div>
            {group.items.map((item) => {
              const isActive = currentView === item.id || (item.id === 'command_center' && currentView === 'dashboard');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectView(item.id)}
                  title={`${item.label} — ${item.sub}`}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center transition cursor-pointer relative group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  {item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-slate-200 flex justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="System Online" />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static / Collapsible Sidebar (lg+) */}
      <aside className={`hidden lg:flex border-r border-slate-200 select-none shrink-0 z-20 h-full transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        {isCollapsed ? collapsedSidebarContent : sidebarContent}
      </aside>

      {/* Navigation Drawer Overlay (Mobile & Desktop Overlay) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Drawer"
        >
          {/* Translucent Backdrop: Clicking outside closes drawer */}
          <div 
            onClick={onClose} 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 cursor-pointer"
            aria-hidden="true"
          />
          {/* Drawer Panel: Clicks inside do not close */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 bg-white transform transition-transform duration-200 ease-out animate-in slide-in-from-left"
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
