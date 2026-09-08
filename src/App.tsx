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
import { ViewMode, DetectionEvent } from './types';
import { mockDetections } from './mockData';
import { PROJECT_BRANDING } from './branding';
import { audioAlertService } from './services/AudioAlertService';
import { Shield, Volume2, VolumeX, Menu, X, Info } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('command_center');
  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [detections, setDetections] = useState<DetectionEvent[]>(mockDetections);
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
            onNavigateToGodsEye={(plate) => setCurrentView('challenge')} 
            onSelectCameraId={(camId) => setCurrentView('cameras')} 
          />
        );
      case 'challan_mode':
        return (
          <ChallanModeDashboard 
            onNavigate={(view, payload) => {
              setCurrentView(view as ViewMode);
            }} 
          />
        );
      case 'ai_training_lab':
        return <AiTrainingLab />;
      case 'ai_mesh':
        return <AIAgentMesh onNavigateToTracking={() => setCurrentView('challenge')} onNavigateToCameras={() => setCurrentView('cameras')} />;
      case 'federated':
        return <FederatedCctvView onNavigate={setCurrentView} />;
      case 'sites':
        return <CctvSiteRegistryView onNavigate={setCurrentView} />;
      case 'challenge':
        return <ChallengeMode />;
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
      case 'geospatial_map':
        return (
          <GeospatialMapView
            onNavigate={(view) => setCurrentView(view)}
            onSelectVehicle={(plate) => {
              setCurrentView('tracking');
            }}
            onSelectCameraId={(camId) => {
              setCurrentView('cameras');
            }}
          />
        );
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
      <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-cyan-950/60 bg-[#090c14] shrink-0 z-30 shadow-md">
        {/* Left Branding & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-label="Open Navigation Menu"
            className="lg:hidden p-2 rounded-lg bg-[#0d121f] border border-cyan-900/50 text-cyan-300 hover:text-white hover:bg-cyan-950/50 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div 
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Click to view System Information, Authorship & Verification"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-900 to-indigo-950 rounded-lg border border-cyan-500/40 group-hover:border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)] relative transition-all shrink-0">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090c14] flex items-center justify-center">
                <span className="w-1 h-1 bg-white rounded-full"></span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-300 font-mono">GUJARAT POLICE</span>
                <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-400 border border-cyan-700/40 rounded font-semibold tracking-wider">
                  {PROJECT_BRANDING.version}
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-zinc-100 font-mono group-hover:text-cyan-200 transition-colors">
                AI CCTV INTELLIGENCE
              </h1>
            </div>
          </div>

          {/* Simple Clean Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#0d121f] border border-emerald-500/30 rounded-full ml-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-emerald-400 font-bold tracking-wider text-[11px] font-mono">SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Far Right Badge & IST Time */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Alert Toggle */}
          <button
            onClick={handleToggleAudio}
            title={isAudioMuted ? "Unmute Audio Alert Chimes" : "Mute Audio Alert Chimes"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono transition-colors cursor-pointer min-h-[36px] ${
              isAudioMuted
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 hover:bg-rose-900/40'
                : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40'
            }`}
          >
            {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span className="hidden md:inline text-[10px] font-bold">{isAudioMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>

          {/* SIMULATED DEMO BADGE (PROMINENT) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 border border-amber-500/50 rounded shadow-[0_0_10px_rgba(245,158,11,0.15)] min-h-[36px]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono font-bold text-amber-300 tracking-wider">SIMULATED DEMO</span>
              <span className="hidden sm:inline text-[8px] font-mono text-amber-400/80 -mt-0.5">SYNTHETIC FEEDS</span>
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
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }} 
          activeAlertCount={3}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar bg-[#05070c]">
          {renderView()}
        </main>
      </div>

      {/* Subtle Professional Application Footer */}
      <footer className="px-4 py-1.5 bg-[#06080d] border-t border-cyan-950/40 shrink-0 z-20 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-zinc-500 select-none">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold">{PROJECT_BRANDING.systemName}</span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="text-zinc-400">{PROJECT_BRANDING.conceptAndEngineering}</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-zinc-500 mt-0.5 sm:mt-0">
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="text-cyan-400/90 font-medium hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Info size={10} />
            <span>{PROJECT_BRANDING.madeBy}</span>
          </button>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <span className="text-zinc-400">{PROJECT_BRANDING.copyrightNotice}</span>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <button
            onClick={() => setIsAboutOpen(true)}
            className="px-1.5 py-0.2 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/40 rounded text-[8px] font-bold tracking-wider cursor-pointer"
          >
            ABOUT / SYSTEM INFO
          </button>
        </div>
      </footer>

      {/* In-App About & System Info Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
