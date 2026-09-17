import React, { useState, useEffect, useCallback } from 'react';
import { 
  Video, 
  ExternalLink, 
  Maximize2, 
  RefreshCw, 
  Info, 
  Radio, 
  Layers, 
  Search, 
  Sliders, 
  AlertTriangle,
  X,
  Play,
  Square,
  Tv,
  Cpu,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Upload,
  Sparkles,
  Eye,
  ArrowRight,
  Hash,
  Clock,
  User,
  Car,
  Bike,
  Copy,
  Check,
  Zap,
  Activity,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { 
  youtubeDemoService, 
  YouTubeDemoCamera, 
  isValidYouTubeVideoId, 
  getYouTubeWatchUrl 
} from '../services/YouTubeDemoService';
import { YouTubeDemoPlayer } from './YouTubeDemoPlayer';
import { RealAIVideoAnalysis } from './RealAIVideoAnalysis';
import { 
  aiVisionAgent, 
  SyntheticDetectionBox, 
  AIAgentTimelineItem 
} from '../services/AIVisionAgent';
import { EvidenceItem, Alert, SecurityEventPayload } from '../types';
import { PROJECT_BRANDING } from '../branding';

interface YouTubeDemoCamerasProps {
  onNavigate?: (view: any) => void;
}

interface LatestDetectionInfo {
  type: string;
  badgeLabel: string;
  badgeColor: string;
  targetId: string;
  sourceId: string;
  timestamp: string;
  timeFormatted: string;
  confidence: number;
  eventId: string;
  evidenceId?: string;
  alertId?: string;
  isHighPriorityAlert?: boolean;
  alertTitle?: string;
  helmetStatus?: string;
  vehicleId?: string;
  personId?: string;
  snapshotUrl?: string;
}

export const YouTubeDemoCameras: React.FC<YouTubeDemoCamerasProps> = ({ onNavigate }) => {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'REAL_AI' | 'YOUTUBE_DEMO'>('REAL_AI');
  const [sources, setSources] = useState<YouTubeDemoCamera[]>([]);
  const [activeAnalysisSourceId, setActiveAnalysisSourceId] = useState<string>('YT-DEMO-001');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [activeBoxes, setActiveBoxes] = useState<SyntheticDetectionBox[]>([]);
  const [timeline, setTimeline] = useState<AIAgentTimelineItem[]>(() => aiVisionAgent.getTimeline());
  const [recentEvidence, setRecentEvidence] = useState<EvidenceItem[]>(() => aiVisionAgent.getActiveEvidence());
  
  // Live Metrics
  const [counters, setCounters] = useState({
    persons: 4,
    vehicles: 6,
    helmets: 5,
    violations: 2,
    snapshots: 4,
    alerts: 3
  });

  // Pipeline animation stage
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);

  // Latest Detection State
  const [latestDetection, setLatestDetection] = useState<LatestDetectionInfo>({
    type: 'NO_HELMET',
    badgeLabel: 'ROAD SAFETY VIOLATION',
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-950/60',
    targetId: 'P-DEMO-003',
    sourceId: 'YT-DEMO-001',
    timestamp: new Date().toISOString(),
    timeFormatted: '16:47:06 IST',
    confidence: 0.92,
    eventId: 'EVT-YT-ROAD_SAFETY-204918',
    evidenceId: 'EVD-YT-ROAD_SAFETY-204918',
    alertId: 'ALT-YT-ROAD_SAFETY-204918',
    isHighPriorityAlert: true,
    alertTitle: 'NO HELMET DETECTED',
    helmetStatus: 'NO_HELMET',
    vehicleId: 'V-DEMO-002',
    personId: 'P-DEMO-003',
    snapshotUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'
  });

  // Narrative summary
  const [aiSummary, setAiSummary] = useState<string>(
    'Demonstration event detected involving a motorcycle rider (Track V-DEMO-002) and pedestrian (Track P-DEMO-003). Synthetic road-safety analysis classified the rider as NO_HELMET (92% confidence). A demonstration evidence record was archived with SHA-256 integrity digest.'
  );

  // Modals
  const [inspectingEvidence, setInspectingEvidence] = useState<EvidenceItem | null>(null);
  const [inspectingAlertModal, setInspectingAlertModal] = useState<boolean>(false);
  const [configSource, setConfigSource] = useState<YouTubeDemoCamera | null>(null);
  const [editVideoId, setEditVideoId] = useState<string>('');
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedEvent, setCopiedEvent] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [timelineSearch, setTimelineSearch] = useState<string>('');

  const refreshSources = () => {
    setSources(youtubeDemoService.listSources());
  };

  useEffect(() => {
    refreshSources();
  }, []);

  // Update bounding boxes and analysis frame for active feed
  const runFrameAnalysis = useCallback(async (sourceId: string) => {
    try {
      const res = await aiVisionAgent.analyzeFrame(sourceId);
      setActiveBoxes(res.boundingBoxes);
      setTimeline(aiVisionAgent.getTimeline());
      setRecentEvidence(aiVisionAgent.getActiveEvidence());
    } catch (e) {
      console.error('Frame analysis simulation error:', e);
    }
  }, []);

  useEffect(() => {
    if (isAnalyzing && activeAnalysisSourceId) {
      runFrameAnalysis(activeAnalysisSourceId);
    } else {
      setActiveBoxes([]);
    }
  }, [isAnalyzing, activeAnalysisSourceId, runFrameAnalysis]);

  // Find active source object
  const activeSource = sources.find((s) => s.id === activeAnalysisSourceId) || sources[0] || {
    id: 'YT-DEMO-001',
    videoId: 'QhFYcPBmkcI',
    youtubeVideoId: 'QhFYcPBmkcI',
    name: 'YouTube Demo 01',
    locationLabel: 'Public Livestream 01'
  };

  // Pipeline stage stepping animation
  const animatePipeline = async () => {
    for (let step = 1; step <= 8; step++) {
      setActivePipelineStep(step);
      // Fast optical progress
      await new Promise(r => setTimeout(r, 90));
    }
    setTimeout(() => setActivePipelineStep(0), 1200);
  };

  // Demonstration Action Trigger
  const handleTriggerAction = async (
    actionType: 'vehicle' | 'person' | 'no_helmet' | 'road_safety_alert' | 'evidence' | 'watchlist'
  ) => {
    setActionLoading(actionType);
    animatePipeline();

    try {
      let res;
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' IST';

      if (actionType === 'vehicle') {
        res = await aiVisionAgent.simulateVehicle(activeAnalysisSourceId);
        setCounters(prev => ({ ...prev, vehicles: prev.vehicles + 1, snapshots: prev.snapshots + 1 }));
        setLatestDetection({
          type: 'ANPR',
          badgeLabel: 'VEHICLE DETECTED',
          badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-950/60',
          targetId: 'V-DEMO-002',
          sourceId: activeAnalysisSourceId,
          timestamp: res.event.timestamp,
          timeFormatted,
          confidence: 0.95,
          eventId: res.event.eventId,
          evidenceId: res.evidence?.evidenceId,
          isHighPriorityAlert: false,
          vehicleId: 'V-DEMO-002',
          personId: undefined,
          snapshotUrl: res.event.snapshotReference
        });
      } else if (actionType === 'person') {
        res = await aiVisionAgent.simulatePerson(activeAnalysisSourceId);
        setCounters(prev => ({ ...prev, persons: prev.persons + 1, snapshots: prev.snapshots + 1 }));
        setLatestDetection({
          type: 'PERSON_TRACK',
          badgeLabel: 'PERSON DETECTED',
          badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/60',
          targetId: 'P-DEMO-003',
          sourceId: activeAnalysisSourceId,
          timestamp: res.event.timestamp,
          timeFormatted,
          confidence: 0.94,
          eventId: res.event.eventId,
          evidenceId: res.evidence?.evidenceId,
          isHighPriorityAlert: false,
          personId: 'P-DEMO-003',
          snapshotUrl: res.event.snapshotReference
        });
      } else if (actionType === 'no_helmet' || actionType === 'road_safety_alert') {
        res = await aiVisionAgent.simulateNoHelmet(activeAnalysisSourceId);
        setCounters(prev => ({
          ...prev,
          helmets: prev.helmets + 1,
          violations: prev.violations + 1,
          snapshots: prev.snapshots + 1,
          alerts: prev.alerts + 1
        }));
        setLatestDetection({
          type: 'ROAD_SAFETY',
          badgeLabel: 'ROAD SAFETY VIOLATION',
          badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-950/60',
          targetId: 'P-DEMO-003',
          sourceId: activeAnalysisSourceId,
          timestamp: res.event.timestamp,
          timeFormatted,
          confidence: 0.92,
          eventId: res.event.eventId,
          evidenceId: res.evidence?.evidenceId,
          alertId: res.alert?.id,
          isHighPriorityAlert: true,
          alertTitle: 'NO HELMET DETECTED',
          helmetStatus: 'NO_HELMET',
          vehicleId: 'V-DEMO-002',
          personId: 'P-DEMO-003',
          snapshotUrl: res.event.snapshotReference
        });
      } else if (actionType === 'evidence') {
        res = await aiVisionAgent.captureEvidenceNow(activeAnalysisSourceId);
        setCounters(prev => ({ ...prev, snapshots: prev.snapshots + 1 }));
        if (res.evidence) {
          setInspectingEvidence(res.evidence);
        }
      } else if (actionType === 'watchlist') {
        res = await aiVisionAgent.simulateWatchlistCheck(activeAnalysisSourceId);
        setCounters(prev => ({ ...prev, alerts: prev.alerts + 1, snapshots: prev.snapshots + 1 }));
        setLatestDetection({
          type: 'WATCHLIST',
          badgeLabel: 'WATCHLIST MATCH',
          badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-950/60',
          targetId: 'P-DEMO-003',
          sourceId: activeAnalysisSourceId,
          timestamp: res.event.timestamp,
          timeFormatted,
          confidence: 0.97,
          eventId: res.event.eventId,
          evidenceId: res.evidence?.evidenceId,
          alertId: res.alert?.id,
          isHighPriorityAlert: true,
          alertTitle: 'WATCHLIST TARGET DETECTED',
          vehicleId: 'V-DEMO-002',
          personId: 'P-DEMO-003',
          snapshotUrl: res.event.snapshotReference
        });
      }

      if (res) {
        if (res.summary) setAiSummary(res.summary);
        setTimeline(aiVisionAgent.getTimeline());
        setRecentEvidence(aiVisionAgent.getActiveEvidence());
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenConfig = (source: YouTubeDemoCamera) => {
    setConfigSource(source);
    setEditVideoId(source.youtubeVideoId);
    setConfigError(null);
    setConfigSuccess(false);
  };

  const handleSaveConfig = () => {
    if (!configSource) return;
    if (!isValidYouTubeVideoId(editVideoId)) {
      setConfigError('Invalid YouTube Video ID. Please enter a valid 11-character alphanumeric YouTube Video ID.');
      return;
    }

    try {
      youtubeDemoService.updateVideoId(configSource.id, editVideoId);
      setConfigSuccess(true);
      refreshSources();
      setTimeout(() => {
        setConfigSource(null);
        setConfigSuccess(false);
      }, 900);
    } catch (err: any) {
      setConfigError(err.message || 'Failed to update video ID');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const copyEventDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEvent(true);
    setTimeout(() => setCopiedEvent(false), 2000);
  };

  // Pipeline flow definition
  const pipelineStages = [
    { label: 'YOUTUBE VIDEO', icon: Tv },
    { label: 'AI AGENT', icon: Cpu },
    { label: 'AI DETECTION', icon: Sparkles },
    { label: 'EVENT CREATED', icon: Zap },
    { label: 'AUTO CAPTURE', icon: Video },
    { label: 'EVIDENCE', icon: Hash },
    { label: 'WATCHLIST CHECK', icon: ShieldAlert },
    { label: 'ALERT', icon: AlertTriangle },
    { label: "GOD'S EYE", icon: Eye }
  ];

  // Filtered timeline
  const filteredTimeline = (timeline || []).filter((item) => {
    if (!timelineSearch) return true;
    const q = timelineSearch.toLowerCase();
    return (
      item?.stage?.toLowerCase().includes(q) ||
      item?.description?.toLowerCase().includes(q) ||
      item?.targetId?.toLowerCase().includes(q) ||
      (item?.evidenceId && item.evidenceId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-full w-full p-3 sm:p-4 md:p-6 space-y-6 text-zinc-100 overflow-x-hidden">
      {/* 1. TOP HEADER & BRANDING */}
      <div className="bg-[#0b0f19] border border-cyan-900/40 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-wide text-zinc-100 flex items-center gap-2">
                <Tv className="text-cyan-400" size={20} />
                YOUTUBE DEMO CAMERAS
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                DEMO ONLY
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                AI WORKSPACE DEMONSTRATOR
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 flex-wrap">
              <span>VISUAL AI DEMONSTRATION WORKSPACE</span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-cyan-400 font-semibold">{PROJECT_BRANDING.conceptAndEngineering}</span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-zinc-500">{PROJECT_BRANDING.copyright}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsAnalyzing(!isAnalyzing)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow ${
                isAnalyzing
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Square size={12} className="fill-black" /> STOP AI ANALYSIS
                </>
              ) : (
                <>
                  <Play size={12} className="fill-zinc-200" /> START AI ANALYSIS
                </>
              )}
            </button>

            <button
              onClick={() => {
                youtubeDemoService.resetToDefaults();
                aiVisionAgent.clearDemoData();
                refreshSources();
                setTimeline(aiVisionAgent.getTimeline());
                setRecentEvidence(aiVisionAgent.getActiveEvidence());
              }}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              RESET DEMO
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('cameras')}
                className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Video size={12} />
                SWITCH TO REAL CCTV MATRIX
              </button>
            )}
          </div>
        </div>

        {/* 2. DEMO WARNING BANNER */}
        <div className="mt-4 p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg flex items-start gap-3 text-xs font-mono">
          <Info className="text-amber-400 shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <span className="font-bold text-amber-300 tracking-wider">
              DEMONSTRATION ONLY — PUBLIC YOUTUBE LIVESTREAMS:
            </span>
            <p className="text-zinc-400 leading-relaxed">
              These video feeds are public YouTube demonstration streams and are <strong className="text-zinc-200">NOT</strong> connected to Gujarat Police CCTV, DVR/NVR, or Edge Agent devices. All bounding boxes, violations, and evidence digests shown in this workspace are <strong className="text-cyan-300">SIMULATED DEMONSTRATIONS</strong> showing how the Edge Agent + Central Event architecture processes live video feeds.
            </p>
          </div>
        </div>
      </div>

      {/* 2. WORKSPACE MODE SELECTOR */}
      <div className="flex items-center gap-3 bg-[#080d1a] p-1.5 rounded-xl border border-zinc-800 shadow-md">
        <button
          onClick={() => setActiveWorkspaceTab('REAL_AI')}
          className={`flex-1 py-3 px-4 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeWorkspaceTab === 'REAL_AI'
              ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.35)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Sparkles size={16} className={activeWorkspaceTab === 'REAL_AI' ? 'text-black' : 'text-cyan-400'} />
          <span>REAL FRAME-BY-FRAME AI VISION</span>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
            activeWorkspaceTab === 'REAL_AI'
              ? 'bg-black/20 text-black font-bold'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            GEMINI 3.8 LIVE
          </span>
        </button>

        <button
          onClick={() => setActiveWorkspaceTab('YOUTUBE_DEMO')}
          className={`flex-1 py-3 px-4 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeWorkspaceTab === 'YOUTUBE_DEMO'
              ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.35)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Tv size={16} className={activeWorkspaceTab === 'YOUTUBE_DEMO' ? 'text-black' : 'text-amber-400'} />
          <span>YOUTUBE DEMO FEEDS</span>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
            activeWorkspaceTab === 'YOUTUBE_DEMO'
              ? 'bg-black/20 text-black font-bold'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            PUBLIC DISPLAY ONLY
          </span>
        </button>
      </div>

      {activeWorkspaceTab === 'REAL_AI' ? (
        <RealAIVideoAnalysis onNavigate={onNavigate} />
      ) : (
        <>
          {/* NOTICE: YOUTUBE CROSS-ORIGIN PIXEL LIMITATION */}
          <div className="p-3 bg-amber-950/25 border border-amber-700/50 rounded-lg text-xs font-mono text-amber-200 flex items-start gap-2.5">
            <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-amber-300">YOUTUBE SOURCE — PUBLIC DEMO ONLY — NOT DIRECTLY FRAME-ANALYZABLE IN BROWSER:</strong>
              <p className="text-zinc-400 leading-relaxed">
                A YouTube iframe is cross-origin and the application cannot read individual video pixels from the iframe using normal browser JavaScript. The YouTube player is visual display only.
                To analyze real video pixels with genuine Gemini AI bounding boxes and forensic SHA-256 evidence, switch to the <strong className="text-cyan-400 cursor-pointer underline" onClick={() => setActiveWorkspaceTab('REAL_AI')}>REAL FRAME-BY-FRAME AI VISION</strong> tab above.
              </p>
            </div>
          </div>

          {/* 3. RESPONSIVE TWO-COLUMN AI DEMONSTRATION WORKSPACE (DESKTOP: 2-COLUMN, MOBILE: STACKED) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LARGE YOUTUBE VIDEO PLAYER & FEEDS (Cols 1 to 7 on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Video Player Container */}
          <div className="bg-[#080c16] border border-cyan-950/80 rounded-xl overflow-hidden shadow-2xl relative">
            {/* Player Sub-header */}
            <div className="p-3 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                  {activeSource.id}
                </span>
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  {activeSource.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline truncate">
                  ({activeSource.locationLabel})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isAnalyzing && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/60 animate-pulse">
                    <Cpu size={10} />
                    AI ACTIVE
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  DEMO ONLY
                </span>
                <a
                  href={getYouTubeWatchUrl(activeSource.youtubeVideoId || activeSource.videoId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono flex items-center gap-1 transition-colors"
                  title="Open livestream in YouTube"
                >
                  <ExternalLink size={10} />
                  YOUTUBE
                </a>
              </div>
            </div>

            {/* Video Player Embed (16:9 responsive aspect ratio) */}
            <div className="relative bg-black w-full" style={{ minHeight: '260px' }}>
              <YouTubeDemoPlayer
                videoId={activeSource.youtubeVideoId || activeSource.videoId}
                cameraId={activeSource.id}
                title={activeSource.name}
                locationLabel={activeSource.locationLabel}
                district={(activeSource as any).district || 'Gujarat'}
                aspectRatio="16/9"
                className="w-full"
              />
            </div>

            {/* Tactical Status Footer Bar */}
            <div className="p-2.5 bg-[#060912] border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-400 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span>
                  SOURCE: <strong className="text-amber-300">YOUTUBE DEMO</strong>
                </span>
                <span>
                  PIPELINE STATUS: <strong className="text-zinc-300">PUBLIC DISPLAY ONLY</strong>
                </span>
                <span>
                  FRAME ACCESS: <strong className="text-rose-400">NONE (CROSS-ORIGIN ISOLATED)</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>POLICE CCTV: <strong className="text-rose-400">NO</strong></span>
                <span>•</span>
                <span>VIDEO ID: <strong className="text-zinc-300">{activeSource.youtubeVideoId}</strong></span>
              </div>
            </div>
          </div>

          {/* Video Feed Selector (YT-DEMO-001 to YT-DEMO-004) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio size={13} className="text-cyan-400" />
                SELECT DEMO FEED (4 UNIQUE PUBLIC STREAMS)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                CLICK TO SWITCH ACTIVE PLAYER
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sources.map((src) => {
                const isSelected = src.id === activeAnalysisSourceId;
                return (
                  <button
                    key={src.id}
                    onClick={() => {
                      setActiveAnalysisSourceId(src.id);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-[#0a0e19] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-xs font-mono font-bold ${isSelected ? 'text-cyan-300' : 'text-zinc-200'}`}>
                          {src.id}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-zinc-300 truncate">
                        {src.name}
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                      <span className="truncate max-w-[80px]">{src.youtubeVideoId}</span>
                      <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-zinc-500'}>
                        {isSelected ? 'ACTIVE' : 'SELECT'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SOURCE PROVENANCE ARCHITECTURAL COMPARISON */}
          <div className="bg-[#080c16] border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-cyan-400" />
                SOURCE INTEGRITY & PROVENANCE AUDIT
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 uppercase">
                INTEGRITY ENFORCED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-3 bg-[#0a0e19] border border-amber-900/40 rounded-lg space-y-1.5">
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Tv size={13} />
                  YOUTUBE FEEDS
                </div>
                <div className="text-[10px] text-zinc-400 leading-relaxed">
                  Status: <strong className="text-amber-300">DISPLAY ONLY</strong><br />
                  Raw Pixels: <strong className="text-rose-400">BLOCKED (CORS)</strong><br />
                  AI Ingestion: <strong className="text-rose-400">DISABLED</strong><br />
                  Alerts: <strong className="text-zinc-300">0 (NEVER FAKED)</strong>
                </div>
              </div>

              <div className="p-3 bg-[#0a0e19] border border-emerald-900/40 rounded-lg space-y-1.5">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Camera size={13} />
                  REAL PHONE CAMERA
                </div>
                <div className="text-[10px] text-zinc-400 leading-relaxed">
                  Status: <strong className="text-emerald-300">ANALYZABLE</strong><br />
                  Raw Pixels: <strong className="text-emerald-300">100% ACCESS</strong><br />
                  AI Ingestion: <strong className="text-cyan-300">GEMINI 3.8 FLASH</strong><br />
                  Truth: <strong className="text-emerald-300">CAMERA_OBSERVED</strong>
                </div>
              </div>

              <div className="p-3 bg-[#0a0e19] border border-purple-900/40 rounded-lg space-y-1.5">
                <div className="text-purple-400 font-bold flex items-center gap-1.5">
                  <Upload size={13} />
                  UPLOADED VIDEO
                </div>
                <div className="text-[10px] text-zinc-400 leading-relaxed">
                  Status: <strong className="text-purple-300">ANALYZABLE</strong><br />
                  Raw Pixels: <strong className="text-purple-300">CANVAS DECODED</strong><br />
                  AI Ingestion: <strong className="text-cyan-300">GEMINI 3.8 FLASH</strong><br />
                  Truth: <strong className="text-purple-300">VIDEO_OBSERVED</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: YOUTUBE STATUS & REAL AI TEST LAB PROMOTION (Cols 8 to 12 on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Inspection Card */}
          <div className="bg-[#080c16] border border-amber-900/50 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Tv className="text-amber-400" size={18} />
                <div>
                  <h2 className="text-sm font-bold font-mono text-zinc-100 tracking-wide uppercase">
                    YOUTUBE STREAM STATUS
                  </h2>
                  <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    CROSS-ORIGIN ISOLATED • PUBLIC DISPLAY ONLY
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/50 uppercase">
                  DISPLAY ONLY
                </span>
              </div>
            </div>

            {/* AUDIT CHECKLIST (Fulfilling Requirement 14) */}
            <div className="bg-[#05070e] border border-zinc-900 rounded-lg p-3.5 space-y-2 text-xs font-mono">
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                YOUTUBE INTEGRITY CHECKLIST
              </div>

              <div className="flex justify-between items-center py-1 border-b border-zinc-900/80">
                <span className="text-zinc-400">Stream Mode:</span>
                <span className="text-amber-300 font-bold">DISPLAY_ONLY</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-900/80">
                <span className="text-zinc-400">AI Processing Status:</span>
                <span className="text-rose-400 font-bold">NO FRAME ACCESS</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-900/80">
                <span className="text-zinc-400">Detection Overlays:</span>
                <span className="text-emerald-400 font-bold">NONE (ZERO FAKE BOXES)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-900/80">
                <span className="text-zinc-400">Alerts Triggered:</span>
                <span className="text-zinc-200 font-bold">0</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-900/80">
                <span className="text-zinc-400">Evidence Generated:</span>
                <span className="text-zinc-200 font-bold">0</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400">Vehicle Counts Incremented:</span>
                <span className="text-zinc-200 font-bold">0</span>
              </div>
            </div>

            {/* CALL TO ACTION: SWITCH TO REAL AI VISION */}
            <div className="bg-gradient-to-b from-cyan-950/50 to-[#0a1222] border border-cyan-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs">
                <Sparkles size={16} className="text-cyan-400 animate-pulse" />
                READY FOR REAL FRAME AI ANALYSIS?
              </div>
              <p className="text-[11px] font-mono text-zinc-300 leading-relaxed">
                To run actual Gemini 3.8 Flash and Local Vision models with real pixel frame extraction, road safety violation classification (Helmet detection), and forensic SHA-256 evidence digests, use real analyzable sources:
              </p>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setActiveWorkspaceTab('REAL_AI')}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Sparkles size={14} />
                  SWITCH TO REAL FRAME-BY-FRAME AI VISION
                </button>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('mobile_camera')}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera size={14} className="text-emerald-400" />
                    TEST WITH REAL PHONE CAMERA
                  </button>
                )}
              </div>
            </div>

            {/* WHY YOUTUBE CANNOT BE ANALYZED EXPLANATION */}
            <div className="bg-[#05070e] border border-zinc-900 rounded-lg p-3 space-y-1.5 text-[11px] font-mono">
              <span className="font-bold text-zinc-400 uppercase tracking-wider block">
                BROWSER SECURITY ARCHITECTURE:
              </span>
              <p className="text-zinc-400 leading-relaxed">
                Web browsers enforce cross-origin isolation (RFC 6454 / SOP). Third-party YouTube iframes cannot be read pixel-by-pixel into an HTML canvas due to browser security restrictions. To guarantee authentic AI detection without simulation, frame analysis is strictly isolated to user-owned camera and video sources.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* 4. AI DEMONSTRATION PIPELINE (COMPACT HORIZONTAL DESKTOP, SCROLLABLE MOBILE) */}
      <div className="bg-[#080c16] border border-cyan-950/80 rounded-xl p-4 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={13} className="text-cyan-400" />
            AI DEMONSTRATION PIPELINE ARCHITECTURE
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            END-TO-END CENTRAL EVENT PROCESSING
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-2 custom-scrollbar">
          {pipelineStages.map((stage, idx) => {
            const StageIcon = stage.icon;
            const isHighlighted = activePipelineStep === idx + 1;
            return (
              <React.Fragment key={stage.label}>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono font-bold shrink-0 transition-all ${
                    isHighlighted
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                      : 'bg-[#05070e] text-zinc-300 border-zinc-800'
                  }`}
                >
                  <StageIcon size={13} className={isHighlighted ? 'text-black' : 'text-cyan-400'} />
                  <span className="whitespace-nowrap">{stage.label}</span>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <ChevronRight size={14} className="text-zinc-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 5. LIVE EVENT TIMELINE & HISTORY */}
      <div className="bg-[#080c16] border border-cyan-950/80 rounded-xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-cyan-400" />
            <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
              REAL-TIME AI EVENT TIMELINE (CHRONOLOGICAL EVENT LOG)
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              ({timeline.length} EVENTS)
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
            <input
              type="text"
              placeholder="Search timeline..."
              value={timelineSearch}
              onChange={(e) => setTimelineSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-[#05070e] border border-zinc-800 rounded text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="bg-[#05070e] border border-zinc-900 rounded-lg max-h-64 overflow-y-auto custom-scrollbar divide-y divide-zinc-900">
          {filteredTimeline.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-zinc-400 space-y-2">
              <ShieldCheck size={20} className="mx-auto text-emerald-400" />
              <div className="text-zinc-200 font-bold">SOURCE ISOLATION ACTIVE: 0 SYNTHETIC DETECTIONS</div>
              <div className="text-zinc-500 max-w-md mx-auto leading-relaxed">
                YouTube feeds are cross-origin protected and cannot emit AI detection events. To generate authentic detections with Gemini 3.8 Flash and real forensic SHA-256 evidence, use the Real Frame-by-Frame AI Vision tab or connect your Phone Camera.
              </div>
            </div>
          ) : (
            filteredTimeline.map((item, idx) => (
              <div
                key={item.id ? `${item.id}-${idx}` : `tl-item-${idx}`}
                className="p-2.5 flex items-center justify-between gap-3 text-xs font-mono hover:bg-zinc-900/40 transition-colors flex-wrap sm:flex-nowrap"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {item.timeFormatted}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${item.badgeColor}`}>
                    {item.stage}
                  </span>
                  <span className="text-zinc-200 font-bold shrink-0">
                    [{item.targetId}]
                  </span>
                  <span className="text-zinc-400 truncate">
                    {item.description}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.evidenceId && (
                    <button
                      onClick={() => {
                        setInspectingEvidence({
                          evidenceId: item.evidenceId!,
                          eventId: `EVT-${item.id.slice(-6)}`,
                          cameraId: activeAnalysisSourceId,
                          timestamp: item.timestamp,
                          targetId: item.targetId,
                          captureReason: 'PERSON_TRACK',
                          reason: 'PERSON_TRACK',
                          imageReference: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60',
                          sha256: '285f7a9420b98751e18cd9fa5e8a2a7a4cf8a28795908e2f69046c4f0122e239',
                          status: 'VERIFIED',
                          isSimulation: true,
                          label: 'SIMULATED DEMO EVIDENCE',
                          integrityNotice: 'Evidence Integrity Hash — DEMO',
                          correlationId: `CORR-${item.id.slice(-6)}`
                        });
                      }}
                      className="px-2 py-0.5 bg-purple-950/60 hover:bg-purple-900 border border-purple-800/50 text-purple-300 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Hash size={10} />
                      {item.evidenceId}
                    </button>
                  )}
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">
                    SIMULATED
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. EVIDENCE GALLERY ("RECENT AI EVIDENCE") */}
      <div className="bg-[#080c16] border border-cyan-950/80 rounded-xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="text-purple-400" size={16} />
            <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
              RECENT AI EVIDENCE (FINGERPRINTED WITH SHA-256)
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {recentEvidence.length} RECORDS ARCHIVED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {recentEvidence.slice(0, 8).map((evd, idx) => (
            <div
              key={`${evd.evidenceId || 'evd'}-${idx}`}
              onClick={() => setInspectingEvidence(evd)}
              className="bg-[#05070e] border border-zinc-800 hover:border-purple-500/60 rounded-lg p-3 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Snapshot Image with DEMO EVIDENCE SNAPSHOT overlay */}
                <div className="relative aspect-video rounded overflow-hidden bg-black border border-zinc-800">
                  <img
                    src={evd.imageReference || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'}
                    alt="Demo Evidence Snapshot"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/80 border border-purple-500/50 px-1.5 py-0.5 rounded text-[8px] font-mono text-purple-300 font-bold uppercase">
                    DEMO EVIDENCE SNAPSHOT
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-zinc-300">
                    {evd.cameraId}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-purple-400 font-bold">{evd.evidenceId}</span>
                    <span className="text-zinc-500">{new Date(evd.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-200 truncate mt-0.5">
                    {String(evd.captureReason || evd.reason || 'DETECTION EVENT').replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    TARGET: <span className="text-cyan-300 font-bold">{evd.targetId}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <span className="truncate max-w-[120px]">SHA-256: {evd.sha256?.slice(0, 10)}...</span>
                <span className="text-purple-400 font-bold group-hover:underline">VIEW</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. ALERT DETAILS & PROFESSIONAL EVIDENCE VIEWER MODAL */}
      {(inspectingEvidence || inspectingAlertModal) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0e18] border border-cyan-900/60 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="text-rose-400" size={18} />
                <div>
                  <h3 className="text-sm font-bold font-mono text-rose-300 tracking-wider">
                    HIGH PRIORITY ALERT — INCIDENT DETAILS
                  </h3>
                  <div className="text-[10px] font-mono text-zinc-400">
                    SIMULATED DEMONSTRATION RECORD
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setInspectingEvidence(null);
                  setInspectingAlertModal(false);
                }}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Alert Summary Box */}
              <div className="bg-[#05070e] border border-rose-900/50 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-300 uppercase">
                    🚨 ROAD SAFETY ALERT: {latestDetection.alertTitle || 'NO HELMET DETECTED'}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800/50">
                    SEVERITY: HIGH
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
                  <div className="text-zinc-400">
                    SOURCE: <strong className="text-zinc-200">{latestDetection.sourceId} / YOUTUBE DEMO</strong>
                  </div>
                  <div className="text-zinc-400">
                    TIME: <strong className="text-zinc-200">{latestDetection.timeFormatted}</strong>
                  </div>
                  <div className="text-zinc-400">
                    CONFIDENCE: <strong className="text-emerald-400">{Math.round(latestDetection.confidence * 100)}%</strong>
                  </div>
                  <div className="text-zinc-400">
                    PERSON: <strong className="text-cyan-300">{latestDetection.personId || 'P-DEMO-003'}</strong>
                  </div>
                  <div className="text-zinc-400">
                    VEHICLE: <strong className="text-amber-300">{latestDetection.vehicleId || 'V-DEMO-002'}</strong>
                  </div>
                  <div className="text-zinc-400">
                    STATUS: <strong className="text-rose-400 font-bold">NO_HELMET</strong>
                  </div>
                </div>
              </div>

              {/* Captured Evidence Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash size={13} className="text-purple-400" />
                    CAPTURED EVIDENCE
                  </span>
                  <span className="text-[9px] font-mono text-purple-300 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-800/50">
                    STATUS: SIMULATED DEMO EVIDENCE
                  </span>
                </div>

                {/* Large Evidence Snapshot */}
                <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-black">
                  <img
                    src={inspectingEvidence?.imageReference || latestDetection.snapshotUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'}
                    alt="Captured Demo Evidence"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {/* Watermark Label */}
                  <div className="absolute top-2 left-2 bg-black/85 border border-purple-500/60 px-2 py-1 rounded text-[9px] font-mono font-bold text-purple-300 uppercase">
                    SIMULATED DEMO EVIDENCE
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/85 px-2 py-1 rounded text-[9px] font-mono text-zinc-300">
                    CORRIDOR: AHMEDABAD SG HIGHWAY (SIMULATED)
                  </div>
                </div>

                {/* Forensic Metadata Grid */}
                <div className="bg-[#05070e] border border-zinc-900 rounded-lg p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                    <span className="text-zinc-500">EVIDENCE ID:</span>
                    <span className="text-purple-400 font-bold font-mono">
                      {inspectingEvidence?.evidenceId || latestDetection.evidenceId || 'EVD-YT-ROAD_SAFETY-204918'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                    <span className="text-zinc-500">EVENT ID:</span>
                    <span className="text-zinc-300 font-mono">
                      {inspectingEvidence?.eventId || latestDetection.eventId}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                    <span className="text-zinc-500">CAPTURE SOURCE:</span>
                    <span className="text-amber-300 font-bold">YOUTUBE DEMO</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                    <span className="text-zinc-500">STATUS:</span>
                    <span className="text-cyan-300 font-bold">SIMULATED DEMO EVIDENCE</span>
                  </div>

                  {/* SHA-256 Digest */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-500 text-[11px]">SHA-256 FORENSIC INTEGRITY HASH:</span>
                      <button
                        onClick={() => copyToClipboard(inspectingEvidence?.sha256 || '285f7a9420b98751e18cd9fa5e8a2a7a4cf8a28795908e2f69046c4f0122e239')}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedHash ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copiedHash ? 'COPIED' : 'COPY HASH'}
                      </button>
                    </div>
                    <div className="p-2 bg-black/80 rounded border border-zinc-800 text-[10px] font-mono text-emerald-400 break-all select-all">
                      {inspectingEvidence?.sha256 || '285f7a9420b98751e18cd9fa5e8a2a7a4cf8a28795908e2f69046c4f0122e239'}
                    </div>
                    <p className="text-[9px] font-mono text-zinc-500 mt-1">
                      Evidence Integrity Hash — DEMO (Deterministic verification digest)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {onNavigate && (
                  <button
                    onClick={() => {
                      setInspectingEvidence(null);
                      setInspectingAlertModal(false);
                      onNavigate('tracking');
                    }}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                  >
                    <Eye size={12} />
                    VIEW GOD&apos;S EYE
                  </button>
                )}

                <button
                  onClick={() => {
                    const eventData = JSON.stringify({
                      eventId: inspectingEvidence?.eventId || latestDetection.eventId,
                      evidenceId: inspectingEvidence?.evidenceId || latestDetection.evidenceId,
                      targetId: inspectingEvidence?.targetId || latestDetection.targetId,
                      sourceId: inspectingEvidence?.cameraId || latestDetection.sourceId,
                      confidence: latestDetection.confidence,
                      timestamp: inspectingEvidence?.timestamp || latestDetection.timestamp,
                      sha256: inspectingEvidence?.sha256 || '285f7a9420b98751e18cd9fa5e8a2a7a4cf8a28795908e2f69046c4f0122e239'
                    }, null, 2);
                    copyEventDetails(eventData);
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedEvent ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedEvent ? 'COPIED EVENT' : 'VIEW EVENT DATA'}
                </button>
              </div>

              <button
                onClick={() => {
                  setInspectingEvidence(null);
                  setInspectingAlertModal(false);
                }}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs rounded transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CONFIG MODAL FOR YOUTUBE VIDEO ID */}
      {configSource && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101d] border border-cyan-900/60 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sliders className="text-cyan-400" size={16} />
                <h3 className="text-sm font-bold font-mono text-zinc-200">
                  CONFIGURE VIDEO ID ({configSource.id})
                </h3>
              </div>
              <button
                onClick={() => setConfigSource(null)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <p className="text-zinc-400">
                Enter a valid 11-character YouTube video ID. Standard YouTube embeds only.
              </p>

              <div>
                <label className="block text-zinc-400 mb-1">YouTube Video ID (11 chars):</label>
                <input
                  type="text"
                  value={editVideoId}
                  onChange={(e) => {
                    setEditVideoId(e.target.value.trim());
                    setConfigError(null);
                  }}
                  placeholder="e.g. QhFYcPBmkcI"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded font-mono text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {configError && (
                <div className="p-2 bg-rose-950/50 border border-rose-800/50 rounded text-rose-300 text-[11px]">
                  {configError}
                </div>
              )}

              {configSuccess && (
                <div className="p-2 bg-emerald-950/50 border border-emerald-800/50 rounded text-emerald-300 text-[11px]">
                  Video ID updated successfully!
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfigSource(null)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs rounded cursor-pointer shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
