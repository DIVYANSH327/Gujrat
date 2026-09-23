import React, { useState, useEffect, useRef } from 'react';
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
  MapPin, 
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
  Moon,
  Layers,
  Filter,
  ChevronsUpDown,
  Cloud
} from 'lucide-react';
import { ViewMode } from '../types';
import { PROJECT_BRANDING } from '../branding';
import { useAuth } from '../context/AuthContext';
import { getRequiredPermissionForView } from '../types/auth';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activeAlertCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: ViewMode;
  label: string;
  sub: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  id: string;
  title: string;
  categoryLabel: string;
  icon: React.ReactNode;
  accentColor: {
    badge: string;
    indicator: string;
    activeText: string;
  };
  items: NavItem[];
}

const STORAGE_KEY = 'sentinel_sidebar_collapsed_groups';

export function Sidebar({ 
  currentView, 
  onViewChange, 
  activeAlertCount = 3,
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const { officer, hasPermission } = useAuth();
  const [filterText, setFilterText] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  
  // Drawer ref for background outside-click detection
  const drawerRef = useRef<HTMLDivElement>(null);

  // Collapsible groups state with localStorage persistence
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore storage access errors
    }
    // Default: Keep COMMAND and INVESTIGATION open; SYSTEM collapsed by default
    return {
      SYSTEM: true
    };
  });

  // Save collapsed groups state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedGroups));
    } catch {
      // ignore storage access errors
    }
  }, [collapsedGroups]);

  // Group definitions
  const navGroups: NavGroup[] = [
    {
      id: 'COMMAND',
      title: 'COMMAND & DISPATCH',
      categoryLabel: 'Command',
      icon: <LayoutDashboard size={14} />,
      accentColor: {
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        indicator: 'bg-blue-500',
        activeText: 'text-blue-700'
      },
      items: [
        { 
          id: 'command_center', 
          label: 'Dashboard', 
          sub: 'Operations & CCTV Overview',
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
          sub: 'SCRB Ingestion & Stream Lab',
          icon: <Radio size={18} />,
          badge: 'INGESTION LAB',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        },
        { 
          id: 'mobile_camera', 
          label: 'Mobile Field Cam', 
          sub: 'Live Officer Video Uplink',
          icon: <Smartphone size={18} />,
          badge: 'FIELD LINK',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
      ]
    },
    {
      id: 'INVESTIGATION',
      title: 'SURVEILLANCE & GIS',
      categoryLabel: 'Investigation',
      icon: <Search size={14} />,
      accentColor: {
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        indicator: 'bg-amber-500',
        activeText: 'text-amber-800'
      },
      items: [
        { 
          id: 'search', 
          label: 'Vehicle Search', 
          sub: 'Plate, Color & Class Query',
          icon: <Search size={18} /> 
        },
        { 
          id: 'plate_intelligence_map', 
          label: 'Plate Intelligence', 
          sub: 'Universal Plate GIS & Hotspots',
          icon: <Globe size={18} />,
          badge: 'HSRP + GIS',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
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
          icon: <MapPin size={18} />
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
          id: 'tracking', 
          label: 'Forensic Evidence', 
          sub: 'SHA-256 Forensic Dossiers',
          icon: <Compass size={18} /> 
        }
      ]
    },
    {
      id: 'OPERATIONS',
      title: 'OPERATIONS & PATROL',
      categoryLabel: 'Operations',
      icon: <AlertTriangle size={14} />,
      accentColor: {
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        indicator: 'bg-rose-500',
        activeText: 'text-rose-700'
      },
      items: [
        { 
          id: 'alerts', 
          label: 'Operational Alerts', 
          sub: 'Active Rule Triggers',
          icon: <AlertTriangle size={18} />,
          badge: activeAlertCount > 0 ? `${activeAlertCount}` : undefined,
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
        },
        { 
          id: 'incidents', 
          label: 'Incident Triage', 
          sub: 'Command & Triage Log',
          icon: <AlertOctagon size={18} />
        },
        { 
          id: 'missions', 
          label: 'Active Missions', 
          sub: 'Autonomous Tracking',
          icon: <Crosshair size={18} />
        },
        { 
          id: 'review_queue', 
          label: 'Officer Review Queue', 
          sub: 'Human-in-the-Loop Triage',
          icon: <UserCheck size={18} />,
          badge: 'HITL',
          badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
        },
        { 
          id: 'challan_mode', 
          label: 'Challan Review', 
          sub: 'Violation Adjudication',
          icon: <Scale size={18} />
        },
        { 
          id: 'night_audit', 
          label: 'Night CCTV Audit', 
          sub: 'Overnight Sentinel Audit',
          icon: <Moon size={18} />,
          badge: 'BSA 2023',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
        }
      ]
    },
    {
      id: 'AI',
      title: 'AI & VISION LAB',
      categoryLabel: 'AI Lab',
      icon: <Sparkles size={14} />,
      accentColor: {
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        indicator: 'bg-purple-500',
        activeText: 'text-purple-700'
      },
      items: [
        { 
          id: 'ai_mesh', 
          label: 'AI Agent Mesh', 
          sub: '13 Specialized Neural Agents',
          icon: <Cpu size={18} />,
          badge: 'ORCHESTRATOR',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
        },
        { 
          id: 'real_ai_test_lab', 
          label: 'AI Vision Lab', 
          sub: 'YOLOv8 + Gemini 3.8 Flash',
          icon: <Sparkles size={18} />,
          badge: 'AI LAB',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        },
        { 
          id: 'gcp_vision_hub', 
          label: 'GCP Live Stream AI', 
          sub: 'Plate & Face Recognition',
          icon: <Cloud size={18} />,
          badge: 'GCP AI',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        },
        { 
          id: 'raw_video_audit', 
          label: 'HSRP Verification', 
          sub: 'Laser PIN & Hologram Audit',
          icon: <Activity size={18} />
        },
        { 
          id: 'ai_training_lab', 
          label: 'AI Model Training', 
          sub: 'Edge Model Fine-Tuning',
          icon: <Workflow size={18} />
        }
      ]
    },
    {
      id: 'SYSTEM',
      title: 'SYSTEM & SECURITY',
      categoryLabel: 'System',
      icon: <Server size={14} />,
      accentColor: {
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        indicator: 'bg-slate-500',
        activeText: 'text-slate-900'
      },
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
          sub: 'Hardware & Diagnostics',
          icon: <Activity size={18} />
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
          id: 'cyber_security', 
          label: 'Defensive Cyber', 
          sub: 'Threat Telemetry & Hardening',
          icon: <ShieldCheck size={18} />
        },
        { 
          id: 'gov_deployment', 
          label: 'Settings', 
          sub: 'Air-Gap & Resource Config',
          icon: <Settings size={18} />
        }
      ]
    }
  ];

  // RBAC filter: restrict navigation groups and items based on officer role/permissions
  const authorizedNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!officer || officer.role === 'ADMIN') return true;
      return hasPermission(getRequiredPermissionForView(item.id));
    })
  })).filter(group => group.items.length > 0);

  // Auto-expand the category group containing the currently active view
  useEffect(() => {
    const activeGroup = authorizedNavGroups.find(group => 
      group.items.some(item => item.id === currentView || (item.id === 'command_center' && currentView === 'dashboard'))
    );
    if (activeGroup && collapsedGroups[activeGroup.id]) {
      setCollapsedGroups(prev => ({
        ...prev,
        [activeGroup.id]: false
      }));
    }
  }, [currentView]);

  // Auto-hide when user clicks anywhere on the background (outside drawer panel)
  useEffect(() => {
    if (!isOpen) return;
    
    const handleBackgroundClick = (event: MouseEvent | TouchEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleBackgroundClick);
    document.addEventListener('touchstart', handleBackgroundClick, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleBackgroundClick);
      document.removeEventListener('touchstart', handleBackgroundClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleSelectView = (view: ViewMode) => {
    onViewChange(view);
    if (onClose) {
      onClose();
    }
  };

  // Quick toggle all categories
  const areAllCollapsed = authorizedNavGroups.every(g => !!collapsedGroups[g.id]);
  const handleToggleAllGroups = () => {
    const nextState: Record<string, boolean> = {};
    authorizedNavGroups.forEach(g => {
      nextState[g.id] = !areAllCollapsed;
    });
    setCollapsedGroups(nextState);
  };

  // Filter groups by active category filter
  const displayedGroups = authorizedNavGroups.filter(group => {
    if (activeCategoryFilter === 'ALL') return true;
    return group.id === activeCategoryFilter;
  });

  const totalVisibleModules = displayedGroups.reduce((acc, g) => acc + g.items.length, 0);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 select-none border-r border-slate-200">
      {/* Mobile Drawer Header with Close Button */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Shield size={18} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 tracking-wide font-mono">
              GUJARAT POLICE
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Operational Suite ({totalVisibleModules} modules)
            </div>
          </div>
        </div>
        {onClose && (
          <button 
            id="sidebar-close-button"
            onClick={onClose}
            aria-label="Close navigation drawer"
            title="Close navigation"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Quick Search & Filter Toolbar */}
      <div className="p-3 border-b border-slate-200 bg-white space-y-2.5 shrink-0">
        {/* Search input */}
        <div className="relative">
          <input 
            id="sidebar-search-input"
            type="text" 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search operational modules..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-7 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-colors" 
          />
          <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
            <Search size={14} />
          </div>
          {filterText && (
            <button 
              id="sidebar-clear-search-button"
              onClick={() => setFilterText('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills & Bulk Collapse Control */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
            <button
              id="sidebar-category-filter-all"
              type="button"
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {authorizedNavGroups.map(group => {
              const isSelected = activeCategoryFilter === group.id;
              const hasActiveView = group.items.some(
                item => item.id === currentView || (item.id === 'command_center' && currentView === 'dashboard')
              );
              return (
                <button
                  key={group.id}
                  id={`sidebar-category-filter-${group.id}`}
                  type="button"
                  onClick={() => {
                    setActiveCategoryFilter(group.id);
                    // Ensure the selected category group is expanded
                    if (collapsedGroups[group.id]) {
                      setCollapsedGroups(prev => ({ ...prev, [group.id]: false }));
                    }
                  }}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : hasActiveView
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{group.categoryLabel}</span>
                  {hasActiveView && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            id="sidebar-toggle-all-button"
            type="button"
            onClick={handleToggleAllGroups}
            title={areAllCollapsed ? "Expand all categories" : "Collapse all categories"}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 cursor-pointer text-[10px] flex items-center gap-0.5 border border-slate-200"
          >
            <ChevronsUpDown size={13} />
          </button>
        </div>
      </div>

      {/* Grouped Navigation List with Collapsible Categories */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {displayedGroups.map((group) => {
          const matchingItems = group.items.filter(item => 
            !filterText || 
            item.label.toLowerCase().includes(filterText.toLowerCase()) || 
            item.sub.toLowerCase().includes(filterText.toLowerCase())
          );

          if (matchingItems.length === 0) return null;

          // When searching, ignore collapsed state to surface matches immediately
          const isGroupCollapsed = !filterText && !!collapsedGroups[group.id];
          
          const hasActiveView = group.items.some(
            item => item.id === currentView || (item.id === 'command_center' && currentView === 'dashboard')
          );

          return (
            <div 
              key={group.id} 
              id={`sidebar-group-${group.id}`}
              className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-1 space-y-1 transition-all"
            >
              {/* Collapsible Category Header Button */}
              <button
                id={`sidebar-group-header-${group.id}`}
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={!isGroupCollapsed}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold tracking-wider rounded-lg transition-colors cursor-pointer ${
                  hasActiveView
                    ? 'text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`p-1 rounded-md ${group.accentColor.badge} shrink-0`}>
                    {group.icon}
                  </span>
                  <span className="truncate uppercase">{group.title}</span>
                  {hasActiveView && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 ring-2 ring-blue-200" title="Active module inside" />
                  )}
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 font-mono">
                    {matchingItems.length}
                  </span>
                  <span className="text-slate-400">
                    {isGroupCollapsed ? (
                      <ChevronRight size={14} className="transition-transform duration-200" />
                    ) : (
                      <ChevronDown size={14} className="transition-transform duration-200" />
                    )}
                  </span>
                </div>
              </button>

              {/* Group Items (Collapsible body) */}
              {!isGroupCollapsed && (
                <div className="space-y-0.5 pt-0.5 animate-in fade-in duration-150">
                  {matchingItems.map((item) => {
                    const isActive = currentView === item.id || (item.id === 'command_center' && currentView === 'dashboard');
                    return (
                      <button
                        key={item.id}
                        id={`sidebar-item-${item.id}`}
                        type="button"
                        onClick={() => handleSelectView(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left min-h-[44px] cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'hover:bg-white text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`${isActive ? 'text-white' : 'text-slate-400'} shrink-0`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs font-semibold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                              {item.label}
                            </div>
                            <div className={`text-[11px] font-normal truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                              {item.sub}
                            </div>
                          </div>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ml-2 ${
                            isActive 
                              ? 'bg-blue-700 text-white border-blue-500' 
                              : item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
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

        {displayedGroups.length === 0 && (
          <div className="p-6 text-center text-slate-400 text-xs">
            No matching operational modules found.
          </div>
        )}
      </nav>

      {/* Subtle Sidebar Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs space-y-1 shrink-0">
        <div className="flex items-center justify-between text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span className="text-[11px] text-emerald-700 font-semibold">Online & Encrypted</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">BSA 2023</span>
        </div>
      </div>
    </div>
  );

  // Collapsed Sidebar Rail (Icon-Only View for High-Density Grid Mode)
  const collapsedSidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      <div className="p-3 border-b border-slate-200 flex flex-col items-center justify-center gap-2 shrink-0">
        <button
          id="sidebar-expand-rail-button"
          type="button"
          onClick={onToggleCollapse}
          title="Expand Navigation Sidebar"
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 transition cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
        {authorizedNavGroups.map((group) => {
          const hasActive = group.items.some(
            item => item.id === currentView || (item.id === 'command_center' && currentView === 'dashboard')
          );
          return (
            <div key={group.id} className="space-y-1.5">
              <div 
                className={`text-[9px] font-bold text-center uppercase tracking-wider ${
                  hasActive ? 'text-blue-600' : 'text-slate-400'
                }`}
                title={group.title}
              >
                {group.id.substring(0, 3)}
              </div>
              {group.items.map((item) => {
                const isActive = currentView === item.id || (item.id === 'command_center' && currentView === 'dashboard');
                return (
                  <button
                    key={item.id}
                    id={`sidebar-rail-item-${item.id}`}
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
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-200 flex justify-center shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="System Online" />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static / Collapsible Sidebar (lg+) */}
      <aside 
        id="desktop-navigation-sidebar"
        className={`hidden lg:flex border-r border-slate-200 select-none shrink-0 z-20 h-full transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-72'}`}
      >
        {isCollapsed ? collapsedSidebarContent : sidebarContent}
      </aside>

      {/* Navigation Drawer Overlay (Mobile & Auto-Hide on Background Click) */}
      {isOpen && (
        <div 
          id="sidebar-drawer-container"
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Drawer"
        >
          {/* Translucent Backdrop: Clicking outside/background immediately closes/auto-hides drawer */}
          <div 
            id="sidebar-backdrop"
            onClick={onClose} 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Panel: Clicks inside do not close */}
          <div 
            ref={drawerRef}
            id="sidebar-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 bg-white transform transition-transform duration-200 ease-out animate-in slide-in-from-left"
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
