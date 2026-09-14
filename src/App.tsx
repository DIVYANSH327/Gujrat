import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { GodsEyeWorkspace } from './components/godseye/GodsEyeWorkspace';
import { SystemReadinessView } from './components/SystemReadinessView';
import { YouTubeDemoCameras } from './components/YouTubeDemoCameras';
import { AIAgentMesh } from './components/AIAgentMesh';
import { SystemBrainView } from './components/SystemBrainView';
import { ScaleLab } from './components/ScaleLab';
import { FederatedCctvView } from './components/FederatedCctvView';
import { CctvSiteRegistryView } from './components/CctvSiteRegistryView';
import { PoliceDataIntelligence } from './components/PoliceDataIntelligence';
import { ChallanModeDashboard } from './components/challan/ChallanModeDashboard';
import { MobileCameraTest } from './components/MobileCameraTest';
import { RealAIVisionTestLab } from './components/RealAIVisionTestLab';
import { AiTrainingLab } from './components/AiTrainingLab';
import { AboutModal } from './components/AboutModal';
import { CommandCenterView } from './components/CommandCenterView';
import { MissionControlView } from './components/MissionControlView';
import { IncidentCommandView } from './components/IncidentCommandView';
import { HumanReviewQueueView } from './components/HumanReviewQueueView';
import { DigitalTwinScaleView } from './components/DigitalTwinScaleView';
import { GovernmentDeploymentView } from './components/GovernmentDeploymentView';
import { GeospatialMapView } from './components/geospatial/GeospatialMapView';
import { SentinelCameraGridLab } from './components/SentinelCameraGridLab';
import { SentinelHealthIndicator } from './components/SentinelHealthIndicator';
import { NightAuditView } from './components/night-audit/NightAuditView';
import { AlertNotificationToast } from './components/AlertNotificationToast';
import { ViewMode, DetectionEvent } from './types';
import { PROJECT_BRANDING } from './branding';
import { audioAlertService } from './services/AudioAlertService';
import { 
  Shield, 
  Volume2, 
  VolumeX, 
  Menu, 
  X, 
  Info, 
  Search, 
  Bell, 
  User, 
  CheckCircle2, 
  Clock,
  PanelLeftClose
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('command_center');
  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [headerSearchQuery, setHeaderSearchQuery] = useState<string>('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());
  const [detections, setDetections] = useState<DetectionEvent[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(() => audioAlertService.isMuted());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleAudio = () => {
    const next = audioAlertService.toggleMute();
    setIsAudioMuted(next);
  };

  const handleAutoCapture = (imageUrl: string, mode: string) => {
    const newEvent: DetectionEvent = {
      id: `capture-${Date.now()}`,
      cameraId: 'LIVE-CAM',
      timestamp: new Date().toISOString(),
      objectType: mode === 'walking' ? 'person' : 'vehicle',
      confidence: 1.0,
      metadata: { movementMode: mode },
      snapshotUrl: imageUrl
    };
    setDetections(prev => [newEvent, ...prev]);
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerSearchQuery.trim().toUpperCase();
    if (!q) return;

    if (q.startsWith('CAM-') || q.startsWith('CAMERA')) {
      setCurrentView('cameras');
    } else if (q.startsWith('INC-')) {
      setSelectedIncidentId(q);
      setCurrentView('incidents');
    } else if (q.startsWith('MSN-')) {
      setSelectedMissionId(q);
      setCurrentView('missions');
    } else {
      // Direct to Vehicle Search
      setCurrentView('search');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'command_center':
        return (
          <CommandCenterView
            onNavigate={(viewId) => setCurrentView(viewId as ViewMode)}
            onSelectMission={(missionId) => {
              setSelectedMissionId(missionId);
              setCurrentView('missions');
            }}
            onSelectIncident={(incidentId) => {
              setSelectedIncidentId(incidentId);
              setCurrentView('incidents');
            }}
          />
        );
      case 'missions':
        return (
          <MissionControlView 
            initialMissionId={selectedMissionId} 
            onNavigate={(view) => setCurrentView(view as ViewMode)} 
          />
        );
      case 'incidents':
        return (
          <IncidentCommandView 
            initialIncidentId={selectedIncidentId} 
            onNavigate={(view) => setCurrentView(view as ViewMode)} 
          />
        );
      case 'review_queue':
        return <HumanReviewQueueView />;
      case 'digital_twin':
        return <DigitalTwinScaleView />;
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'system_brain':
        return <SystemBrainView />;
      case 'scale_lab':
        return <ScaleLab />;
      case 'police_intel':
        return (
          <PoliceDataIntelligence 
            onNavigateToGodsEye={() => setCurrentView('challenge')} 
            onSelectCameraId={() => setCurrentView('cameras')} 
          />
        );
      case 'challan_mode':
        return (
          <ChallanModeDashboard 
            onNavigate={(view) => {
              setCurrentView(view as ViewMode);
            }} 
          />
        );
      case 'ai_training_lab':
        return <AiTrainingLab />;
      case 'ai_mesh':
        return (
          <AIAgentMesh 
            onNavigateToTracking={() => setCurrentView('challenge')} 
            onNavigateToCameras={() => setCurrentView('cameras')} 
            onNavigateToMobileCamera={() => setCurrentView('mobile_camera')} 
          />
        );
      case 'federated':
        return <FederatedCctvView onNavigate={setCurrentView} />;
      case 'sites':
        return <CctvSiteRegistryView onNavigate={setCurrentView} />;
      case 'challenge':
        return <GodsEyeWorkspace />;
      case 'search':
        return <AISearch detections={detections} onNavigateToGodsEye={() => setCurrentView('challenge')} />;
      case 'cameras':
        return <Cameras onAutoCapture={handleAutoCapture} onNavigate={setCurrentView} />;
      case 'mobile_camera':
        return <MobileCameraTest onNavigate={setCurrentView} />;
      case 'real_ai_test_lab':
        return <RealAIVisionTestLab onNavigate={setCurrentView} />;
      case 'youtube_demo':
        return <YouTubeDemoCameras onNavigate={setCurrentView} />;
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
      case 'gov_deployment':
        return <GovernmentDeploymentView />;
      case 'sentinel_grid':
        return (
          <SentinelCameraGridLab
            onNavigate={(view) => setCurrentView(view)}
            onImportCameraToLive={(cam) => {
              setCurrentView('cameras');
            }}
          />
        );
      case 'raw_video_audit':
        return (
          <SentinelCameraGridLab
            initialTab="diagnostics"
            onNavigate={(view) => setCurrentView(view)}
            onImportCameraToLive={(cam) => {
              setCurrentView('cameras');
            }}
          />
        );
      case 'night_audit':
        return <NightAuditView />;
      case 'geospatial_map':
        return (
          <GeospatialMapView
            onNavigate={(view) => setCurrentView(view)}
            onSelectVehicle={() => {
              setCurrentView('tracking');
            }}
            onSelectCameraId={() => {
              setCurrentView('cameras');
            }}
          />
        );
      default:
        return <ChallengeMode />;
    }
  };

  // Indian Standard Time format (UTC+5:30)
  const istTimeStr = time.toLocaleTimeString('en-IN', { hour12: true, timeZone: 'Asia/Kolkata' });

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden select-none">
      {/* Officer Global Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-white border-b border-slate-200 shrink-0 z-30 shadow-2xs">
        {/* Left: Branding & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-label="Open Navigation Menu"
            className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            aria-label={isSidebarCollapsed ? "Expand Navigation Sidebar" : "Collapse Navigation Sidebar"}
            title={isSidebarCollapsed ? "Expand Navigation Sidebar" : "Collapse Navigation Sidebar"}
            className="hidden lg:flex p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition min-h-[40px] min-w-[40px] items-center justify-center cursor-pointer"
          >
            <PanelLeftClose size={18} className={isSidebarCollapsed ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>

          {/* Clean Gujarat Police Emblem / Title */}
          <div 
            onClick={() => setCurrentView('command_center')}
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="Gujarat Police AI CCTV Intelligence Platform"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors shrink-0">
              <Shield size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 leading-tight">
                  Gujarat Police
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  HQ Operational
                </span>
              </div>
              <h1 className="text-xs font-medium text-slate-500 leading-tight">
                AI CCTV Intelligence Platform
              </h1>
            </div>
          </div>
        </div>

        {/* Center/Desktop: Officer Universal Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-6">
          <form onSubmit={handleGlobalSearch} className="w-full relative">
            <input
              type="text"
              value={headerSearchQuery}
              onChange={(e) => setHeaderSearchQuery(e.target.value)}
              placeholder="Search vehicle, plate, camera or incident..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
            />
            <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
              <Search size={16} />
            </div>
            {headerSearchQuery && (
              <button
                type="button"
                onClick={() => setHeaderSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Right: Notifications, Officer Profile, Online Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SentinelHealthIndicator />
          {/* Online Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">Online</span>
          </div>

          {/* Audio Chime Button */}
          <button
            onClick={handleToggleAudio}
            title={isAudioMuted ? "Unmute Audio Alert Chimes" : "Mute Audio Alert Chimes"}
            className={`p-2 rounded-xl border transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center ${
              isAudioMuted
                ? 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setCurrentView('alerts')}
            title="Operational Alerts"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer relative min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          </button>

          {/* Officer Profile Badge */}
          <div 
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer group select-none"
            title="Officer Profile & System Credentials"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 group-hover:border-blue-400 group-hover:text-blue-600 transition-colors font-bold text-xs">
              VJ
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Insp. V. K. Jadeja
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                HQ Control Room
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Officer Grouped Navigation Sidebar */}
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }} 
          activeAlertCount={6}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* Content Area */}
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar bg-slate-50" id="main-content-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full h-full"
              id={`view-container-${currentView}`}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Clean Modern Government Footer */}
      <footer className="px-4 sm:px-6 py-2 bg-white border-t border-slate-200 shrink-0 z-20 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 select-none gap-1 sm:gap-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">{PROJECT_BRANDING.systemName}</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500">{PROJECT_BRANDING.conceptAndEngineering}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">{PROJECT_BRANDING.copyrightNotice}</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <Info size={12} />
            <span>Legal Notice & System Info</span>
          </button>
        </div>
      </footer>

      {/* Real-time Slide-in Incident Notification Toasts */}
      <AlertNotificationToast 
        onNavigate={(view) => setCurrentView(view as ViewMode)}
        onSelectIncident={(incidentId) => {
          setSelectedIncidentId(incidentId);
          setCurrentView('incidents');
        }}
        onSelectCamera={(cameraId) => {
          setCurrentView('cameras');
        }}
      />

      {/* In-App About & System Info Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
