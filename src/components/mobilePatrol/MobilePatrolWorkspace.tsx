/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Police Mobile Vision Unit & AI Vision Lab Master Workspace
 */

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Video, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Scale, 
  HardDrive, 
  Sliders, 
  RefreshCw,
  Eye,
  Search,
  Activity,
  Terminal,
  FileText,
  Compass,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { 
  PatrolCameraMetadata, 
  PatrolEventEvidence, 
  StorageEfficiencyMetrics, 
  PatrolNodeConfiguration, 
  PatrolCameraMode, 
  OfficerReviewStatus,
  VisionLabTab 
} from '../../types/mobilePatrolTypes';
import { mobilePatrolNodeService } from '../../services/mobilePatrol/MobilePatrolNodeService';
import { mobileVisionUnitRegistry } from '../../services/mobilePatrol/MobileVisionUnitRegistry';
import { MobilePatrolHeader } from './MobilePatrolHeader';
import { MobilePatrolLiveView } from './MobilePatrolLiveView';
import { MobilePatrolEventFeed } from './MobilePatrolEventFeed';
import { MobilePatrolEvidenceCard } from './MobilePatrolEvidenceCard';
import { MobilePatrolReviewModal } from './MobilePatrolReviewModal';
import { MobilePatrolSettingsModal } from './MobilePatrolSettingsModal';
import { MobilePatrolMap } from './MobilePatrolMap';
import { MobilePatrolModeView } from './MobilePatrolModeView';
import { MobilePatrolPerformanceDashboard } from './MobilePatrolPerformanceDashboard';
import { MobilePatrolHsrpMatrix } from './MobilePatrolHsrpMatrix';
import { MobilePatrolSearchModal } from './MobilePatrolSearchModal';
import { MobilePatrolAuditDiagnostics } from './MobilePatrolAuditDiagnostics';
import { ViewMode } from '../../types';

interface MobilePatrolWorkspaceProps {
  onNavigate?: (view: ViewMode) => void;
}

export const MobilePatrolWorkspace: React.FC<MobilePatrolWorkspaceProps> = ({ onNavigate }) => {
  const [metadata, setMetadata] = useState<PatrolCameraMetadata>(mobilePatrolNodeService.getMetadata());
  const [events, setEvents] = useState<PatrolEventEvidence[]>(mobilePatrolNodeService.getEvents());
  const [metrics, setMetrics] = useState<StorageEfficiencyMetrics>(mobilePatrolNodeService.getStorageMetrics());
  const [config, setConfig] = useState<PatrolNodeConfiguration>(mobilePatrolNodeService.getConfiguration());
  
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<VisionLabTab>('LIVE_PATROL');
  const [selectedEvent, setSelectedEvent] = useState<PatrolEventEvidence | null>(events[0] || null);
  const [reviewingEvent, setReviewingEvent] = useState<PatrolEventEvidence | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Mobile active sub-tab for 3-column fallback
  const [mobileSubTab, setMobileSubTab] = useState<'LIVE' | 'EVENTS' | 'EVIDENCE'>('LIVE');

  useEffect(() => {
    const unsubMeta = mobilePatrolNodeService.subscribeMetadata((newMeta) => setMetadata(newMeta));
    const unsubEvents = mobilePatrolNodeService.subscribeEvents((newEvents) => {
      setEvents(newEvents);
      if (!selectedEvent && newEvents.length > 0) {
        setSelectedEvent(newEvents[0]);
      }
    });
    const unsubMetrics = mobilePatrolNodeService.subscribeTelemetry((newMetrics) => setMetrics(newMetrics));

    return () => {
      unsubMeta();
      unsubEvents();
      unsubMetrics();
    };
  }, [selectedEvent]);

  // Handle Event Triggering from Live View or Manual
  const handleTriggerEvent = async (params: any) => {
    const newEvent = await mobilePatrolNodeService.triggerEvent(params);
    setSelectedEvent(newEvent);
    if (window.innerWidth < 1024) {
      setMobileSubTab('EVIDENCE');
    }
  };

  const handlePushFrame = (dataUrl: string, detectionsCount?: number) => {
    mobilePatrolNodeService.pushLiveFrameToBuffer(dataUrl, 88, detectionsCount || 0);
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    try {
      await mobilePatrolNodeService.syncOfflineQueueToCloud();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleChangeCameraMode = (mode: PatrolCameraMode) => {
    mobilePatrolNodeService.setCameraMode(mode);
    mobileVisionUnitRegistry.setUnitCameraMode('MVU-001', mode);
  };

  const tabs: Array<{ id: VisionLabTab; label: string; icon: React.ReactNode }> = [
    { id: 'LIVE_PATROL', label: 'LIVE PATROL', icon: <Radio size={14} /> },
    { id: 'PATROL_MODE', label: 'PATROL MODE', icon: <Car size={14} /> },
    { id: 'CAMERA', label: 'CAMERA', icon: <Video size={14} /> },
    { id: 'EVENTS', label: 'EVENTS', icon: <Layers size={14} /> },
    { id: 'HSRP', label: 'HSRP MATRIX', icon: <ShieldCheck size={14} /> },
    { id: 'EVIDENCE', label: 'EVIDENCE', icon: <FileText size={14} /> },
    { id: 'MAP', label: 'MAP', icon: <MapPin size={14} /> },
    { id: 'PERFORMANCE', label: 'PERFORMANCE', icon: <Activity size={14} /> },
    { id: 'AUDIT', label: 'AUDIT & COMPLIANCE', icon: <Terminal size={14} /> }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-900 font-sans">
      
      {/* Top Header */}
      <MobilePatrolHeader
        metadata={metadata}
        metrics={metrics}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSyncCloud={handleSyncCloud}
        onChangeCameraMode={handleChangeCameraMode}
        isSyncing={isSyncing}
      />

      {/* Primary Navigation Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          
          <div className="flex items-center gap-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer border border-slate-200"
            >
              <Search size={13} className="text-blue-600" />
              <span className="hidden sm:inline">Search Plate / Unit</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4">
        
        {/* TAB: LIVE PATROL (3-Column Full Command Center) */}
        {activeTab === 'LIVE_PATROL' && (
          <div>
            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex items-center bg-white p-1 rounded-xl border border-slate-200 mb-3 shadow-xs">
              <button
                onClick={() => setMobileSubTab('LIVE')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  mobileSubTab === 'LIVE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Live Camera
              </button>
              <button
                onClick={() => setMobileSubTab('EVENTS')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  mobileSubTab === 'EVENTS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Events ({events.length})
              </button>
              <button
                onClick={() => setMobileSubTab('EVIDENCE')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  mobileSubTab === 'EVIDENCE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Evidence
              </button>
            </div>

            {/* 3-Column Desktop Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
              {/* Column 1: Live Video Feed (Width: 5 cols) */}
              <div className={`lg:col-span-5 ${mobileSubTab !== 'LIVE' ? 'hidden lg:block' : 'block'}`}>
                <MobilePatrolLiveView
                  metadata={metadata}
                  onTriggerEvent={handleTriggerEvent}
                  onPushFrame={handlePushFrame}
                />
              </div>

              {/* Column 2: Real-time Event Feed (Width: 3.5 cols) */}
              <div className={`lg:col-span-3.5 ${mobileSubTab !== 'EVENTS' ? 'hidden lg:block' : 'block'}`}>
                <MobilePatrolEventFeed
                  events={events}
                  selectedEventId={selectedEvent?.eventId || null}
                  onSelectEvent={(evt) => setSelectedEvent(evt)}
                  onOpenReview={(evt) => setReviewingEvent(evt)}
                />
              </div>

              {/* Column 3: Evidence Dossier & SHA-256 (Width: 3.5 cols) */}
              <div className={`lg:col-span-3.5 ${mobileSubTab !== 'EVIDENCE' ? 'hidden lg:block' : 'block'}`}>
                <MobilePatrolEvidenceCard
                  event={selectedEvent}
                  onOpenReviewModal={(evt) => setReviewingEvent(evt)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: PATROL MODE (Dedicated Large Touch Officer Interface) */}
        {activeTab === 'PATROL_MODE' && (
          <MobilePatrolModeView
            metadata={metadata}
            events={events}
            onSelectEvent={(evt) => {
              setSelectedEvent(evt);
              setActiveTab('EVIDENCE');
            }}
            onReviewEvent={(evt) => setReviewingEvent(evt)}
          />
        )}

        {/* TAB: CAMERA (Dedicated Camera Stream View) */}
        {activeTab === 'CAMERA' && (
          <div className="max-w-4xl mx-auto">
            <MobilePatrolLiveView
              metadata={metadata}
              onTriggerEvent={handleTriggerEvent}
              onPushFrame={handlePushFrame}
            />
          </div>
        )}

        {/* TAB: EVENTS (Dedicated Event Filter Feed) */}
        {activeTab === 'EVENTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <MobilePatrolEventFeed
                events={events}
                selectedEventId={selectedEvent?.eventId || null}
                onSelectEvent={(evt) => setSelectedEvent(evt)}
                onOpenReview={(evt) => setReviewingEvent(evt)}
              />
            </div>
            <div className="lg:col-span-7">
              <MobilePatrolEvidenceCard
                event={selectedEvent}
                onOpenReviewModal={(evt) => setReviewingEvent(evt)}
              />
            </div>
          </div>
        )}

        {/* TAB: HSRP MATRIX (Forensic Rule 50 Inspection) */}
        {activeTab === 'HSRP' && (
          <MobilePatrolHsrpMatrix
            selectedEvent={selectedEvent}
            onReviewEvent={(evt) => setReviewingEvent(evt)}
          />
        )}

        {/* TAB: EVIDENCE (Dossier & Integrity Verification) */}
        {activeTab === 'EVIDENCE' && (
          <div className="max-w-4xl mx-auto">
            <MobilePatrolEvidenceCard
              event={selectedEvent}
              onOpenReviewModal={(evt) => setReviewingEvent(evt)}
            />
          </div>
        )}

        {/* TAB: MAP (Mobile Evidence Map) */}
        {activeTab === 'MAP' && (
          <MobilePatrolMap
            events={events}
            onSelectEvent={(evt) => {
              setSelectedEvent(evt);
              setActiveTab('EVIDENCE');
            }}
            selectedEventId={selectedEvent?.eventId}
          />
        )}

        {/* TAB: PERFORMANCE (Hardware & Resource Optimization) */}
        {activeTab === 'PERFORMANCE' && (
          <MobilePatrolPerformanceDashboard
            metrics={metrics}
            config={config}
            onUpdateConfig={(newCfg) => setConfig(prev => ({ ...prev, ...newCfg }))}
          />
        )}

        {/* TAB: AUDIT (Forensic Admissibility & Test Runner) */}
        {activeTab === 'AUDIT' && (
          <MobilePatrolAuditDiagnostics
            selectedEvent={selectedEvent}
          />
        )}

      </main>

      {/* Review Modal for Judicial Adjudication */}
      {reviewingEvent && (
        <MobilePatrolReviewModal
          event={reviewingEvent}
          onClose={() => setReviewingEvent(null)}
          onSubmitReview={(eventId, newStatus, notes) => {
            mobilePatrolNodeService.updateEventReviewStatus(eventId, newStatus, notes);
            setReviewingEvent(null);
          }}
        />
      )}

      {/* Node Settings Modal */}
      {isSettingsOpen && (
        <MobilePatrolSettingsModal
          config={config}
          onClose={() => setIsSettingsOpen(false)}
          onSaveConfig={(newCfg) => {
            mobilePatrolNodeService.updateConfiguration(newCfg);
            setConfig(prev => ({ ...prev, ...newCfg }));
            setIsSettingsOpen(false);
          }}
        />
      )}

      {/* Unified Search Modal */}
      <MobilePatrolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectEvent={(evt) => {
          setSelectedEvent(evt);
          setActiveTab('EVIDENCE');
        }}
      />

    </div>
  );
};
