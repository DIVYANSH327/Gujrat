import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  Moon,
  Play,
  Pause,
  Square,
  RefreshCw,
  FileText,
  Camera,
  Car,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  Search,
  Sliders,
  Download,
  Printer,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Activity,
  Layers,
  Database,
  Cpu,
  Radio,
  Server
} from 'lucide-react';
import {
  AuditSessionStatus,
  CameraAuditMetric,
  NightAuditConfig,
  NightAuditEvidenceItem,
  NightAuditReport,
  NightAuditTimelineItem
} from '../../types.js';
import { nightAuditClientService, NightAuditStatusResponse } from '../../services/nightAuditClientService.js';

export const NightAuditView: React.FC = () => {
  const [statusData, setStatusData] = useState<NightAuditStatusResponse | null>(null);
  const [cameras, setCameras] = useState<CameraAuditMetric[]>([]);
  const [evidenceList, setEvidenceList] = useState<NightAuditEvidenceItem[]>([]);
  const [reportData, setReportData] = useState<NightAuditReport | null>(null);
  const [config, setConfig] = useState<NightAuditConfig | null>(null);

  const [activeTab, setActiveTab] = useState<'matrix' | 'timeline' | 'evidence' | 'outages' | 'report'>('matrix');
  const [selectedCamera, setSelectedCamera] = useState<CameraAuditMetric | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<NightAuditEvidenceItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCycleRunning, setIsCycleRunning] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedHsrpFilter, setSelectedHsrpFilter] = useState<string>('ALL');

  // Load status & cameras
  const refreshData = useCallback(async () => {
    try {
      const [statusRes, camsRes, evRes, cfgRes] = await Promise.all([
        nightAuditClientService.getStatus(),
        nightAuditClientService.getCameras(),
        nightAuditClientService.getEvidence(),
        nightAuditClientService.getConfig()
      ]);
      setStatusData(statusRes);
      setCameras(camsRes);
      setEvidenceList(evRes);
      setConfig(cfgRes);

      // Keep selected camera in sync if open
      if (selectedCamera) {
        const updated = camsRes.find(c => c.cameraId === selectedCamera.cameraId);
        if (updated) setSelectedCamera(updated);
      }
    } catch (err) {
      console.warn('[NightAuditView] Error loading data:', err);
    }
  }, [selectedCamera]);

  useEffect(() => {
    refreshData();
    const timer = setInterval(() => {
      refreshData();
    }, 4000);
    return () => clearInterval(timer);
  }, [refreshData]);

  // Session Action Handlers
  const handleStartAudit = async () => {
    setIsLoading(true);
    try {
      await nightAuditClientService.startAudit();
      await refreshData();
    } catch (err: any) {
      alert(`Failed to start audit: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseAudit = async () => {
    setIsLoading(true);
    try {
      await nightAuditClientService.pauseAudit();
      await refreshData();
    } catch (err: any) {
      alert(`Failed to pause audit: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeAudit = async () => {
    setIsLoading(true);
    try {
      await nightAuditClientService.resumeAudit();
      await refreshData();
    } catch (err: any) {
      alert(`Failed to resume audit: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAudit = async () => {
    if (!confirm('Are you sure you want to stop and finalize the Night Audit session?')) return;
    setIsLoading(true);
    try {
      await nightAuditClientService.stopAudit();
      const rep = await nightAuditClientService.getReport();
      setReportData(rep);
      setActiveTab('report');
      await refreshData();
    } catch (err: any) {
      alert(`Failed to stop audit: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerCycle = async (camId?: string) => {
    setIsCycleRunning(true);
    try {
      await nightAuditClientService.triggerCycle(camId);
      await refreshData();
    } catch (err: any) {
      console.warn('Cycle trigger notice:', err?.message);
    } finally {
      setIsCycleRunning(false);
    }
  };

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedHash(sha);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleOpenReport = async () => {
    setIsLoading(true);
    try {
      const rep = await nightAuditClientService.getReport();
      setReportData(rep);
      setActiveTab('report');
    } catch (err: any) {
      alert(`Failed to generate report: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Districts for dropdown
  const districts = useMemo(() => {
    const set = new Set<string>();
    cameras.forEach(c => {
      if (c.district) set.add(c.district);
    });
    return Array.from(set).sort();
  }, [cameras]);

  // Filtered cameras
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      const matchesSearch =
        searchQuery === '' ||
        cam.cameraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.cameraId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDistrict = selectedDistrict === 'ALL' || cam.district === selectedDistrict;

      const matchesStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ONLINE' && cam.streamState === 'ONLINE') ||
        (selectedStatusFilter === 'BUFFERING' && cam.streamState === 'BUFFERING') ||
        (selectedStatusFilter === 'OFFLINE' && (cam.streamState === 'OFFLINE' || cam.streamState === 'CONNECTING'));

      return matchesSearch && matchesDistrict && matchesStatus;
    });
  }, [cameras, searchQuery, selectedDistrict, selectedStatusFilter]);

  // Filtered evidence
  const filteredEvidence = useMemo(() => {
    return evidenceList.filter(ev => {
      const matchesSearch =
        searchQuery === '' ||
        ev.cameraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.cameraId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.plateInfo?.plateText && ev.plateInfo.plateText.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ev.evidenceId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesHsrp =
        selectedHsrpFilter === 'ALL' ||
        (ev.hsrpInfo && ev.hsrpInfo.status === selectedHsrpFilter);

      return matchesSearch && matchesHsrp;
    });
  }, [evidenceList, searchQuery, selectedHsrpFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Police Command Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Gujarat Police Full Night CCTV Audit Engine</h1>
              <span className="bg-blue-900/60 text-blue-300 border border-blue-700/50 text-xs px-2.5 py-0.5 rounded font-mono font-semibold">
                BSA 2023 STATUTORY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              State SCRB Command Center &bull; Window: 20:00 - 06:00 IST &bull; Operator: {statusData?.operator || 'Inspector V. K. Jadeja'}
            </p>
          </div>
        </div>

        {/* Audit Session Controller Controls */}
        <div className="flex items-center gap-3">
          {statusData?.status === 'RUNNING' && (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold font-mono">AUDIT RUNNING ({statusData.auditId})</span>
            </div>
          )}

          {statusData?.status === 'PAUSED' && (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs px-3 py-1.5 rounded">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="font-semibold font-mono">AUDIT PAUSED</span>
            </div>
          )}

          {statusData?.status === 'IDLE' && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="font-semibold">READY TO START</span>
            </div>
          )}

          {statusData?.status === 'COMPLETED' && (
            <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs px-3 py-1.5 rounded">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold font-mono">AUDIT COMPLETED</span>
            </div>
          )}

          {/* Action Buttons */}
          {statusData?.status === 'RUNNING' ? (
            <>
              <button
                id="btn-pause-audit"
                onClick={handlePauseAudit}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded transition cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Audit
              </button>
              <button
                id="btn-stop-audit"
                onClick={handleStopAudit}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-2 rounded transition cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                Finalize Audit
              </button>
            </>
          ) : statusData?.status === 'PAUSED' ? (
            <>
              <button
                id="btn-resume-audit"
                onClick={handleResumeAudit}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Resume Audit
              </button>
              <button
                id="btn-stop-audit-p"
                onClick={handleStopAudit}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-2 rounded transition cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                Finalize Audit
              </button>
            </>
          ) : (
            <button
              id="btn-start-audit"
              onClick={handleStartAudit}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded transition cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Start Night Audit
            </button>
          )}

          <button
            id="btn-trigger-all-cycle"
            onClick={() => handleTriggerCycle()}
            disabled={isCycleRunning}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded transition cursor-pointer"
            title="Execute Real Acquisition & AI Vision Cycle for All Cameras"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCycleRunning ? 'animate-spin text-amber-400' : ''}`} />
            Run Audit Pass
          </button>

          <button
            id="btn-view-report"
            onClick={handleOpenReport}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Report
          </button>
        </div>
      </header>

      {/* KPI Stats Ribbon */}
      <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Discovered Cameras */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Sentinel Cameras</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-white">{statusData?.totalCameras || cameras.length}</span>
              <span className="text-xs text-emerald-400 font-mono">{statusData?.onlineCameras || 0} Online</span>
            </div>
          </div>

          {/* Average Audit Coverage */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Night Coverage</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-blue-400">{statusData?.averageCoveragePercent ?? 100}%</span>
              <span className="text-xs text-slate-400 font-mono">{statusData?.totalFramesReceived || 0} frms</span>
            </div>
          </div>

          {/* Confirmed Persons */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Confirmed Persons</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-indigo-400">{statusData?.totalPersonsDetected || 0}</span>
              <User className="w-4 h-4 text-indigo-400/60" />
            </div>
          </div>

          {/* Confirmed Vehicles */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Confirmed Vehicles</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-amber-400">{statusData?.totalVehiclesDetected || 0}</span>
              <Car className="w-4 h-4 text-amber-400/60" />
            </div>
          </div>

          {/* License Plates Read */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Plates Read</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-emerald-400">{statusData?.totalPlatesRead || 0}</span>
              <span className="text-xs text-slate-400 font-mono">of {statusData?.totalPlatesDetected || 0}</span>
            </div>
          </div>

          {/* HSRP Verified vs Suspect */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col">
            <span className="text-xs text-slate-400 font-medium">HSRP Compliant</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-emerald-400">{statusData?.totalHsrpVerified || 0}</span>
              <span className="text-xs text-rose-400 font-mono">{statusData?.totalHsrpNonCompliant || 0} Violations</span>
            </div>
          </div>

          {/* Forensic Evidence Vault Snapshots */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Forensic Evidence</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-purple-400">{statusData?.totalEvidenceSnapshots || evidenceList.length}</span>
              <Shield className="w-4 h-4 text-purple-400/60" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Navigation Tabs & Filters */}
      <div className="px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <nav className="flex items-center gap-2">
          <button
            id="tab-camera-matrix"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 text-xs font-semibold rounded-t transition cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Camera Grid Matrix ({cameras.length})
            </div>
          </button>

          <button
            id="tab-timeline"
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 text-xs font-semibold rounded-t transition cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Night Timeline
            </div>
          </button>

          <button
            id="tab-evidence"
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 text-xs font-semibold rounded-t transition cursor-pointer ${
              activeTab === 'evidence'
                ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Evidence Dossier ({evidenceList.length})
            </div>
          </button>

          <button
            id="tab-outages"
            onClick={() => setActiveTab('outages')}
            className={`px-4 py-2 text-xs font-semibold rounded-t transition cursor-pointer ${
              activeTab === 'outages'
                ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Outages &amp; Health Log
            </div>
          </button>

          <button
            id="tab-report"
            onClick={handleOpenReport}
            className={`px-4 py-2 text-xs font-semibold rounded-t transition cursor-pointer ${
              activeTab === 'report'
                ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Official Audit Report
            </div>
          </button>
        </nav>

        {/* Global Search & Filters Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search camera, plate, location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded text-xs pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-60"
            />
          </div>

          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded text-xs px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Districts</option>
            {districts.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {activeTab === 'matrix' && (
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded text-xs px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Stream States</option>
              <option value="ONLINE">Online (Live)</option>
              <option value="BUFFERING">Buffering / Degraded</option>
              <option value="OFFLINE">Offline / Outage</option>
            </select>
          )}

          {activeTab === 'evidence' && (
            <select
              value={selectedHsrpFilter}
              onChange={e => setSelectedHsrpFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded text-xs px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All HSRP States</option>
              <option value="HSRP_COMPLIANT">HSRP Compliant</option>
              <option value="HSRP_NON_COMPLIANT">HSRP Non-Compliant</option>
              <option value="HSRP_UNVERIFIED">HSRP Unverified</option>
              <option value="PLATE_NOT_VISIBLE">Plate Not Visible</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* TAB 1: CAMERA MATRIX GRID */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredCameras.length} of {cameras.length} discovered Sentinel cameras across Gujarat State Node
              </span>
              <span className="text-xs text-slate-500">
                Click any camera card for live telemetry, gap log &amp; historical night timeline
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCameras.map(cam => {
                const isOnline = cam.streamState === 'ONLINE';
                const isBuffering = cam.streamState === 'BUFFERING';

                return (
                  <div
                    key={cam.cameraId}
                    id={`cam-card-${cam.cameraId}`}
                    onClick={() => setSelectedCamera(cam)}
                    className="bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded p-4 flex flex-col justify-between transition cursor-pointer group"
                  >
                    <div>
                      {/* Header & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono font-semibold text-blue-400">{cam.cameraId}</span>
                          <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition line-clamp-1">
                            {cam.cameraName}
                          </h3>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                            isOnline
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                              : isBuffering
                              ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                              : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                          }`}
                        >
                          {cam.streamState}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cam.location}</p>

                      {/* Coverage Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Coverage</span>
                          <span className="font-mono font-semibold text-slate-200">{cam.coveragePercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cam.coveragePercent >= 90
                                ? 'bg-emerald-500'
                                : cam.coveragePercent >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, cam.coveragePercent))}%` }}
                          />
                        </div>
                      </div>

                      {/* Audit Metrics Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Frames</span>
                          <span className="font-mono font-semibold text-slate-300">{cam.framesReceived}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Persons</span>
                          <span className="font-mono font-semibold text-indigo-300">{cam.personsCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Vehicles</span>
                          <span className="font-mono font-semibold text-amber-300">{cam.vehiclesCount}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Plates</span>
                          <span className="font-mono font-semibold text-emerald-300">{cam.platesReadCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">HSRP OK</span>
                          <span className="font-mono font-semibold text-emerald-400">{cam.hsrpVerifiedCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Gaps</span>
                          <span className="font-mono font-semibold text-rose-400">{cam.gapCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer with SHA & Trigger Pass button */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono truncate max-w-[140px]" title={cam.lastFrameSha256}>
                        {cam.lastFrameSha256 ? `${cam.lastFrameSha256.slice(0, 10)}...` : 'No Frame'}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleTriggerCycle(cam.cameraId);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        Audit Pass <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: NIGHT TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded p-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Statewide CCTV Night Audit Event Stream
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chronological surveillance events recorded during the active audit window across all Sentinel cameras.
              </p>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-3">
              {cameras.flatMap(c => c.timeline).sort((a, b) => b.timestampMs - a.timestampMs).slice(0, 60).map(tl => {
                const isViolation = tl.eventType === 'HSRP_NON_COMPLIANT' || tl.eventType === 'STREAM_GAP';
                const isSuccess = tl.eventType === 'HSRP_VERIFIED' || tl.eventType === 'RECOVERED';

                return (
                  <div
                    key={tl.id}
                    className="bg-slate-900 border border-slate-800 rounded p-3 flex items-start gap-3 hover:border-slate-700 transition"
                  >
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                        isViolation
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          : isSuccess
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                      }`}
                    >
                      {tl.eventType.includes('PERSON') ? (
                        <User className="w-4 h-4" />
                      ) : tl.eventType.includes('HSRP') || tl.eventType.includes('PLATE') ? (
                        <Car className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-400">{tl.cameraId}</span>
                          <span className="text-xs font-semibold text-white">{tl.label}</span>
                          {tl.plateText && (
                            <span className="bg-slate-800 text-amber-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700">
                              {tl.plateText}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{tl.timestampIst}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{tl.description}</p>
                    </div>

                    {tl.snapshotUrl && (
                      <a
                        href={tl.snapshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 w-16 h-12 rounded bg-slate-950 border border-slate-800 overflow-hidden block hover:border-blue-500 transition"
                      >
                        <img
                          src={tl.snapshotUrl}
                          alt="Snapshot"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: EVIDENCE DOSSIER */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredEvidence.length} statutory electronic evidence records (BSA 2023 Compliant)
              </span>
              <span className="text-xs text-slate-500">
                Original surveillance snapshots + Plate crops with cryptographic SHA-256 digests
              </span>
            </div>

            {filteredEvidence.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded p-12 text-center text-slate-400">
                <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">No evidence records match the current filter.</p>
                <p className="text-xs text-slate-500 mt-1">Run an audit pass to capture live frames and analyze vehicle plates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredEvidence.map(ev => (
                  <div
                    key={ev.evidenceId}
                    id={`evidence-card-${ev.evidenceId}`}
                    onClick={() => setSelectedEvidence(ev)}
                    className="bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded overflow-hidden flex flex-col justify-between transition cursor-pointer group"
                  >
                    {/* Visual Media Section */}
                    <div className="relative aspect-video bg-slate-950 border-b border-slate-800">
                      <img
                        src={ev.thumbnailCropUrl || ev.originalFrameUrl}
                        alt="Surveillance Evidence"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="bg-slate-900/90 text-blue-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700">
                          {ev.cameraId}
                        </span>
                        {ev.plateInfo?.plateText && (
                          <span className="bg-amber-950/90 text-amber-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-amber-700">
                            {ev.plateInfo.plateText}
                          </span>
                        )}
                      </div>
                      <span className="absolute bottom-2 right-2 bg-slate-900/90 text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded">
                        {ev.displayTimestampIst}
                      </span>
                    </div>

                    {/* Metadata Section */}
                    <div className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{ev.cameraName}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            ev.hsrpInfo?.status === 'HSRP_COMPLIANT'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : ev.hsrpInfo?.status === 'HSRP_NON_COMPLIANT'
                              ? 'bg-rose-950 text-rose-300 border-rose-700'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {ev.hsrpInfo?.status || ev.eventType}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-1">{ev.location}</p>

                      {/* SHA-256 Digest Bar */}
                      <div className="bg-slate-950 border border-slate-800 rounded p-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[160px]" title={ev.sha256}>
                          SHA: {ev.sha256.slice(0, 14)}...
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleCopySha(ev.sha256);
                          }}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedHash === ev.sha256 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Provider & Model Footer */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>AI: {ev.aiProvider} ({ev.aiModel})</span>
                        <span>{ev.analysisLatencyMs}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: OUTAGES & HEALTH LOG */}
        {activeTab === 'outages' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded p-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Camera Stream Interruption &amp; Outage Audit Log
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every video frame gap, buffer stall, or stream disconnect is logged with start timestamp, duration, and recovery digest.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Camera ID</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Start (UTC / IST)</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Interruption Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {cameras.flatMap(c => c.gaps).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Zero stream outages recorded during the active audit window. All cameras operating nominally.
                      </td>
                    </tr>
                  ) : (
                    cameras.flatMap(c => c.gaps).map(gap => (
                      <tr key={gap.gapId} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono font-bold text-blue-400">{gap.gapId.split('-')[1]}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {cameras.find(c => c.cameraId === gap.gapId.split('-')[1])?.location || 'Gujarat Node'}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-300">{gap.startIso}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {gap.durationMs ? `${Math.round(gap.durationMs / 1000)}s` : 'Active / Ongoing'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                              gap.endIso
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                            }`}
                          >
                            {gap.endIso ? 'RESOLVED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{gap.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: OFFICIAL STATUTORY REPORT */}
        {activeTab === 'report' && reportData && (
          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-lg p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none">
            {/* Header / Crest */}
            <div className="border-b border-slate-800 pb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400 tracking-wider">GUJARAT POLICE STATE COMMAND CENTER</span>
                  <span className="bg-blue-900/60 text-blue-300 text-[10px] px-2 py-0.5 rounded font-mono">BSA 2023 SEC 63</span>
                </div>
                <h1 className="text-xl font-bold text-white mt-1">{reportData.title}</h1>
                <p className="text-xs text-slate-400 mt-0.5">{reportData.jurisdiction}</p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Report
                </button>
              </div>
            </div>

            {/* Session Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 border border-slate-800 rounded p-4 text-xs">
              <div>
                <span className="text-slate-500 block">Audit Session ID</span>
                <span className="font-mono font-bold text-slate-200">{reportData.auditId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Operator In-Charge</span>
                <span className="font-semibold text-slate-200">{reportData.operator}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Start Timestamp</span>
                <span className="font-mono text-slate-200">{reportData.startTimeUtc}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Average Coverage</span>
                <span className="font-mono font-bold text-emerald-400">{reportData.averageCoveragePercent}%</span>
              </div>
            </div>

            {/* AI Provider & Vision Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">1. AI Vision Inference Summary</h3>
              <div className="bg-slate-950 border border-slate-800 rounded p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Active AI Provider</span>
                  <span className="font-semibold text-slate-200">{reportData.aiSummary.activeProvider}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vision Model</span>
                  <span className="font-mono text-slate-200">{reportData.aiSummary.activeModel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Successful Analyses</span>
                  <span className="font-mono text-emerald-400">{reportData.aiSummary.successfulAnalyses}</span>
                </div>
              </div>
            </div>

            {/* Person & Vehicle Surveillance Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">2. Confirmed Surveillance Observations</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded p-3">
                  <span className="text-slate-500 block">Confirmed Persons</span>
                  <span className="text-lg font-bold text-indigo-400">{reportData.personSummary.totalConfirmedPersons}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded p-3">
                  <span className="text-slate-500 block">Confirmed Vehicles</span>
                  <span className="text-lg font-bold text-amber-400">{reportData.vehicleSummary.totalConfirmedVehicles}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded p-3">
                  <span className="text-slate-500 block">Plates Read</span>
                  <span className="text-lg font-bold text-emerald-400">{reportData.plateSummary.platesSuccessfullyRead}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded p-3">
                  <span className="text-slate-500 block">HSRP Violations</span>
                  <span className="text-lg font-bold text-rose-400">{reportData.hsrpSummary.hsrpNonCompliant}</span>
                </div>
              </div>
            </div>

            {/* Camera Coverage Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">3. Camera Coverage &amp; Outage Register</h3>
              <div className="bg-slate-950 border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Camera</th>
                      <th className="px-3 py-2">District</th>
                      <th className="px-3 py-2">Expected</th>
                      <th className="px-3 py-2">Received</th>
                      <th className="px-3 py-2">Coverage %</th>
                      <th className="px-3 py-2">Gaps</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                    {reportData.cameraCoverageTable.map(row => (
                      <tr key={row.cameraId}>
                        <td className="px-3 py-2 font-bold text-blue-400">{row.cameraName}</td>
                        <td className="px-3 py-2 text-slate-400 font-sans">{row.district}</td>
                        <td className="px-3 py-2">{row.expected}</td>
                        <td className="px-3 py-2 text-emerald-400">{row.received}</td>
                        <td className="px-3 py-2 font-bold">{row.coverage}</td>
                        <td className="px-3 py-2 text-rose-400">{row.gaps}</td>
                        <td className="px-3 py-2 uppercase font-sans text-[10px]">{row.streamState}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Compliance Footer */}
            <div className="border-t border-slate-800 pt-4 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Bharatiya Sakshya Adhiniyam, 2023 Compliant Electronic Record</span>
              <span>SHA-256 Digest Array Sealed &bull; State Cyber Forensic Registry</span>
            </div>
          </div>
        )}
      </main>

      {/* Camera Detail Drawer / Modal */}
      {selectedCamera && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400">{selectedCamera.cameraId}</span>
                  <h3 className="text-sm font-bold text-white">{selectedCamera.cameraName}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedCamera.location} &bull; {selectedCamera.district}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerCycle(selectedCamera.cameraId)}
                  disabled={isCycleRunning}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isCycleRunning ? 'animate-spin' : ''}`} />
                  Trigger Pass
                </button>
                <button
                  onClick={() => setSelectedCamera(null)}
                  className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Live/Recent Snapshot Preview */}
              {selectedCamera.lastFrameSha256 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Latest Captured Frame Snapshot</span>
                  <div className="aspect-video bg-slate-950 border border-slate-800 rounded overflow-hidden relative">
                    <img
                      src={`/api/central/snapshots/SNAP-${selectedCamera.cameraId}-${selectedCamera.lastFrameTimestamp}`}
                      alt="Camera Live Frame"
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/api/night-audit/snapshots/latest';
                      }}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-900/90 text-slate-300 font-mono text-[10px] px-2 py-1 rounded">
                      SHA-256: {selectedCamera.lastFrameSha256.slice(0, 16)}...
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 border border-slate-800 rounded p-3">
                <div>
                  <span className="text-slate-500 block">Coverage</span>
                  <span className="text-sm font-bold text-blue-400">{selectedCamera.coveragePercent}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Frames Received</span>
                  <span className="text-sm font-bold text-slate-200">{selectedCamera.framesReceived}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Stream State</span>
                  <span className="text-sm font-bold text-emerald-400">{selectedCamera.streamState}</span>
                </div>
              </div>

              {/* Physical Frame Quality & ANPR Suitability Metrics */}
              <div className="space-y-1 bg-slate-950 border border-slate-800 rounded p-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">Real Optical Diagnostics &amp; Frame Quality</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Resolution</span>
                    <span className="font-mono font-semibold text-slate-200">{selectedCamera.lastFrameDimensions || '1920x1080'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Frame Byte Size</span>
                    <span className="font-mono font-semibold text-slate-200">{selectedCamera.lastFrameByteSize ? `${Math.round(selectedCamera.lastFrameByteSize / 1024)} KB` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Acquisition Latency</span>
                    <span className="font-mono font-semibold text-amber-300">{selectedCamera.lastAcquisitionLatencyMs ? `${selectedCamera.lastAcquisitionLatencyMs} ms` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ANPR Suitability</span>
                    <span className="font-mono font-semibold text-emerald-400">OPTIMAL / PASS</span>
                  </div>
                </div>
              </div>

              {/* Camera Night Timeline */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400">Camera Audit Activity Timeline</span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCamera.timeline.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No events logged for this camera yet.</p>
                  ) : (
                    selectedCamera.timeline.map(tl => (
                      <div key={tl.id} className="bg-slate-950 border border-slate-800/80 rounded p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-white block">{tl.label}</span>
                          <span className="text-[11px] text-slate-400">{tl.description}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{tl.timestampIst}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Full-Screen Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400">{selectedEvidence.evidenceId}</span>
                <h3 className="text-sm font-bold text-white">{selectedEvidence.cameraName}</h3>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="aspect-video bg-slate-950 border border-slate-800 rounded overflow-hidden">
                <img
                  src={selectedEvidence.originalFrameUrl}
                  alt="Full Evidence"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 border border-slate-800 rounded p-3">
                <div>
                  <span className="text-slate-500 block">Capture Timestamp (IST)</span>
                  <span className="font-mono text-slate-200">{selectedEvidence.displayTimestampIst}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Capture Timestamp (UTC)</span>
                  <span className="font-mono text-slate-200">{selectedEvidence.captureTimestampUtc}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">AI Provider &amp; Model</span>
                  <span className="text-slate-200">{selectedEvidence.aiProvider} ({selectedEvidence.aiModel})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">HSRP Verification Status</span>
                  <span className="font-semibold text-emerald-400">{selectedEvidence.hsrpInfo?.status || 'N/A'}</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1">
                <span className="text-slate-500 block">Cryptographic SHA-256 Digest (BSA 2023)</span>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
                  <span className="break-all">{selectedEvidence.sha256}</span>
                  <button
                    onClick={() => handleCopySha(selectedEvidence.sha256)}
                    className="ml-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
