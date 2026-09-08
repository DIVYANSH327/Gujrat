import React, { useState, useEffect } from 'react';
import {
  Server,
  Building2,
  Video,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { cctvSiteRegistry } from '../services/CctvSiteRegistry';
import { federatedCctvService } from '../services/FederatedCctvService';
import { audioAlertService, AlertAudioTone } from '../services/AudioAlertService';
import { verificationPackageService } from '../services/VerificationPackageService';
import { CctvSite, VerificationPackage, ViewMode } from '../types';

interface CctvSiteRegistryViewProps {
  onNavigate?: (view: ViewMode) => void;
}

export function CctvSiteRegistryView({ onNavigate }: CctvSiteRegistryViewProps) {
  const [sites, setSites] = useState<CctvSite[]>(() => cctvSiteRegistry.listSites());
  const [selectedSite, setSelectedSite] = useState<CctvSite | null>(() => sites[0] || null);
  const [activeTab, setActiveTab] = useState<'SITES' | 'DEPARTMENTS' | 'VERIFICATION' | 'AUDIO'>('SITES');
  const [departments] = useState(() => federatedCctvService.get26DepartmentIntegrations());
  const [deptSearch, setDeptSearch] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(() => audioAlertService.isMuted());
  const [audioFeedback, setAudioFeedback] = useState<string>('');
  const [verificationPackages, setVerificationPackages] = useState<VerificationPackage[]>(() =>
    verificationPackageService.listAllPackages()
  );
  const [verificationActionMessage, setVerificationActionMessage] = useState<string>('');

  const refreshSites = () => {
    const list = cctvSiteRegistry.listSites();
    setSites(list);
    if (selectedSite) {
      const updated = list.find((s) => s.siteId === selectedSite.siteId);
      if (updated) setSelectedSite(updated);
    }
  };

  const handleTestAudio = (tone: AlertAudioTone, label: string) => {
    audioAlertService.playTone(tone);
    setAudioFeedback(`Playing audio alert chime: ${label}`);
    setTimeout(() => setAudioFeedback(''), 3500);
  };

  const handleToggleMute = () => {
    const next = audioAlertService.toggleMute();
    setIsAudioMuted(next);
  };

  const handleVerificationDecision = (
    packageId: string,
    decision: 'CONFIRMED' | 'REJECTED' | 'ESCALATED'
  ) => {
    const res = verificationPackageService.recordDecision(
      packageId,
      decision,
      'Command Duty Officer (Badge 4092)',
      'Gujarat State Police CCTV Intelligence Desk'
    );
    setVerificationPackages(verificationPackageService.listAllPackages());
    setVerificationActionMessage(res.message);
    setTimeout(() => setVerificationActionMessage(''), 4000);
  };

  const filteredDepts = (departments || []).filter(
    (d) =>
      d?.name?.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d?.tech?.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d?.id?.toLowerCase().includes(deptSearch.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 bg-[#05070c] text-zinc-100 font-sans h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded font-bold tracking-wider uppercase">
                V1.0 SITE REGISTRY & GOVERNANCE
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                MULTI-GATEWAY EDGE TOPOLOGY & AUDIT
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-zinc-100 mt-1">
              CCTV SITES, DEPARTMENTS & VERIFICATION
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
              Centralized site registry managing local Edge Gateways (CP Plus, ONVIF, Hikvision), 26-department federated retention boundaries, and human-in-the-loop candidate verification.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#090d16] border border-cyan-950/80 px-3 py-2 rounded">
              <div className="text-[9px] font-mono text-zinc-500 uppercase">Registered Sites</div>
              <div className="text-sm font-mono font-bold text-cyan-400">
                {(sites || []).length} Active Sites
              </div>
            </div>
            <div className="bg-[#090d16] border border-cyan-950/80 px-3 py-2 rounded">
              <div className="text-[9px] font-mono text-zinc-500 uppercase">Federated Depts</div>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {(departments || []).length} Statewide Entities
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-cyan-950/60 pb-2">
          <button
            onClick={() => setActiveTab('SITES')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'SITES'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Building2 size={14} />
            <span>CCTV SITE REGISTRY ({(sites || []).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Layers size={14} />
            <span>26 DEPARTMENTS REGISTRY</span>
          </button>
          <button
            onClick={() => setActiveTab('VERIFICATION')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'VERIFICATION'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <ShieldCheck size={14} />
            <span>HUMAN VERIFICATION QUEUE ({(verificationPackages || []).filter((p) => p?.status === 'PENDING_VERIFICATION').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIO')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'AUDIO'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            {isAudioMuted ? <VolumeX size={14} className="text-rose-400" /> : <Volume2 size={14} className="text-cyan-400" />}
            <span>AUDIO ALERT CONTROLLER</span>
          </button>
        </div>

        {/* TAB 1: CCTV SITE REGISTRY */}
        {activeTab === 'SITES' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left list */}
            <div className="space-y-3 lg:col-span-1">
              <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Authorized Sites</span>
                <span className="text-[10px] text-cyan-400 font-normal">Edge Gateway Enabled</span>
              </h2>

              <div className="space-y-2">
                {(sites || []).map((site) => {
                  const isSelected = selectedSite?.siteId === site?.siteId;
                  const onlineGateways = (site?.gateways || []).filter((g) => g?.connectionStatus === 'CONNECTED').length;
                  return (
                    <button
                      key={site.siteId}
                      onClick={() => setSelectedSite(site)}
                      className={`w-full text-left p-3 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0a1220] border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-[#080d16] border-cyan-950/80 hover:border-cyan-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800/40 rounded font-bold">
                              {site.siteId}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase">{site.district}</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-zinc-200 mt-1 truncate">
                            {site.siteName}
                          </div>
                        </div>
                        <span
                          className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                            site.status === 'ACTIVE'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {site.status}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-cyan-950/40 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>{(site?.gateways || []).length} Gateways ({onlineGateways} Online)</span>
                        <span className="text-cyan-400">{site?.channelCount || 0} Channels</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right details */}
            {selectedSite && (
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-[#080d16] border border-cyan-950/80 rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-950/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800/40 rounded font-bold">
                          SITE: {selectedSite.siteId}
                        </span>
                        <span className="text-xs font-mono text-emerald-400 font-semibold">
                          JURISDICTION: {selectedSite.departmentId}
                        </span>
                      </div>
                      <h2 className="text-base font-bold font-mono text-zinc-100 mt-1">
                        {selectedSite.siteName}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">{selectedSite.location}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">Total Channels</div>
                        <div className="text-sm font-mono font-bold text-cyan-300">
                          {selectedSite.channelCount || 0} Feeds Configured
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gateway List */}
                  <div className="mt-4 space-y-3">
                    <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Server size={14} className="text-cyan-400" />
                      <span>Edge Gateways & DVR / NVR Hardware Adapters</span>
                    </h3>

                    <div className="space-y-3">
                      {(selectedSite?.gateways || []).map((gw) => (
                        <div
                          key={gw.gatewayId}
                          className="p-3.5 bg-[#060a12] border border-cyan-900/40 rounded-lg space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-zinc-200">
                                  {gw.gatewayName}
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded">
                                  {gw.adapterType}
                                </span>
                                <span
                                  className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                                    gw.connectionStatus === 'CONNECTED'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                                  }`}
                                >
                                  {gw.connectionStatus}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-zinc-400 mt-1">
                                IP Address: <strong className="text-zinc-200">{gw.ipAddress}:{gw.port}</strong> • Model: {gw.model || 'Universal'} • Channels: {gw.channelCount}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800/40 rounded shrink-0">
                              {gw.sourceClassification}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-cyan-950/40 text-[10px] font-mono">
                            <div>
                              <span className="text-zinc-500 block">VENDOR</span>
                              <span className="text-zinc-200 font-semibold">{gw.vendor}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">EDGE PROTOCOL</span>
                              <span className="text-zinc-200 font-semibold">{gw.protocol}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">CREDENTIAL BOUNDARY</span>
                              <span className="text-emerald-400 font-semibold">SECURE EDGE VAULT</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">LAST HEALTH CHECK</span>
                              <span className="text-zinc-300">{new Date(gw.lastHealthCheck).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Retention Policy for this site */}
                  <div className="mt-4 p-3 bg-[#05080f] border border-zinc-800 rounded text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-zinc-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-400" />
                        <span>Site Retention Policy: {selectedSite.retentionPolicy.departmentName}</span>
                      </span>
                      <span className="text-amber-400">
                        {selectedSite.retentionPolicy.rawVideoRetentionDays} Days Raw Video Quota
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      {selectedSite.retentionPolicy.policyNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 26 DEPARTMENTS REGISTRY */}
        {activeTab === 'DEPARTMENTS' && (
          <div className="bg-[#080d16] border border-cyan-950/80 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-950/60">
              <div>
                <h2 className="text-base font-bold font-mono text-zinc-100">
                  26-DEPARTMENT STATEWIDE AUTONOMOUS CCTV INTEGRATIONS
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Statewide federation covers police commissionerates, municipal ITMS systems, transit hubs, and infrastructure security.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="FILTER DEPARTMENTS..."
                  className="w-full bg-[#05080f] border border-cyan-900/40 rounded py-1.5 pl-8 pr-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 uppercase focus:outline-none focus:border-cyan-500"
                />
                <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-500" />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-cyan-950/80 bg-[#060a12] text-zinc-400">
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">DEPARTMENT / JURISDICTION</th>
                    <th className="p-2.5">VMS / TECH PLATFORM</th>
                    <th className="p-2.5">CAPACITY</th>
                    <th className="p-2.5">RAW RETENTION</th>
                    <th className="p-2.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-950/40">
                  {filteredDepts.map((d) => (
                    <tr key={d.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="p-2.5 font-bold text-cyan-400">{d.id}</td>
                      <td className="p-2.5 font-semibold text-zinc-200">{d.name}</td>
                      <td className="p-2.5 text-zinc-400">{d.tech}</td>
                      <td className="p-2.5 text-zinc-300 font-bold">{d.cameras.toLocaleString()}</td>
                      <td className="p-2.5 text-amber-400">{d.rawDays} Days</td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                            d.status === 'INTEGRATION_READY'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : d.status === 'SIMULATED'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: HUMAN VERIFICATION QUEUE */}
        {activeTab === 'VERIFICATION' && (
          <div className="bg-[#080d16] border border-cyan-950/80 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.2 bg-rose-950 text-rose-300 border border-rose-800/40 rounded font-bold">
                    MANDATORY OPERATOR IN THE LOOP
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    ETHICAL AI GOVERNANCE
                  </span>
                </div>
                <h2 className="text-base font-bold font-mono text-zinc-100 mt-1">
                  CANDIDATE VERIFICATION PACKAGES
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  High-impact AI detections are categorized as CANDIDATE MATCHES requiring explicit human confirmation before dispatch or escalation.
                </p>
              </div>
            </div>

            {verificationActionMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-mono rounded flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{verificationActionMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              {verificationPackages.map((pkg) => (
                <div
                  key={pkg.packageId}
                  className="p-4 bg-[#060a12] border border-cyan-900/40 rounded-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-cyan-950/40">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800/40 rounded font-bold">
                        {pkg.packageId}
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-200">
                        {pkg.matchType}: <strong className="text-cyan-300">{pkg.normalizedPlate || pkg.vehiclePlate}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-400">
                        CONFIDENCE: <strong className="text-emerald-400">{Math.round(pkg.candidateConfidence * 100)}%</strong>
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          pkg.status === 'PENDING_VERIFICATION'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/40 animate-pulse'
                            : pkg.status === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                            : pkg.status === 'ESCALATED'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {pkg.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-2.5 bg-[#080d16] rounded border border-cyan-950/60">
                      <div className="text-[9px] text-zinc-500 uppercase">Camera & Location</div>
                      <div className="text-zinc-200 font-bold mt-0.5">{pkg.cameraName}</div>
                      <div className="text-zinc-400 text-[10px] mt-0.5">{pkg.location}</div>
                    </div>
                    <div className="p-2.5 bg-[#080d16] rounded border border-cyan-950/60">
                      <div className="text-[9px] text-zinc-500 uppercase">Classification & Source</div>
                      <div className="text-cyan-400 font-bold mt-0.5">{pkg.sourceClassification}</div>
                      <div className="text-zinc-400 text-[10px] mt-0.5">SHA-256 Digest Sealed</div>
                    </div>
                    <div className="p-2.5 bg-[#080d16] rounded border border-cyan-950/60">
                      <div className="text-[9px] text-zinc-500 uppercase">Investigation Reference</div>
                      <div className="text-zinc-200 font-bold mt-0.5">{pkg.referenceItem?.targetAlias || 'Wanted Target'}</div>
                      <div className="text-zinc-400 text-[10px] mt-0.5">{pkg.referenceItem?.notes || 'Flagged corridor alert'}</div>
                    </div>
                  </div>

                  {pkg.status === 'PENDING_VERIFICATION' && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        <span>HUMAN DECISION MANDATORY — Select action:</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerificationDecision(pkg.packageId, 'CONFIRMED')}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} />
                          <span>CONFIRM</span>
                        </button>
                        <button
                          onClick={() => handleVerificationDecision(pkg.packageId, 'REJECTED')}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
                        >
                          REJECT
                        </button>
                        <button
                          onClick={() => handleVerificationDecision(pkg.packageId, 'ESCALATED')}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <ShieldAlert size={13} />
                          <span>ESCALATE TO DISPATCH</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {pkg.decision && (
                    <div className="p-2.5 bg-[#05080f] rounded border border-emerald-900/40 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                      <span>Audit: Verified by {pkg.decision.verifiedBy} ({pkg.decision.role})</span>
                      <span className="text-zinc-400">{new Date(pkg.decision.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIO ALERT CONTROLLER */}
        {activeTab === 'AUDIO' && (
          <div className="bg-[#080d16] border border-cyan-950/80 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-950/60">
              <div>
                <h2 className="text-base font-bold font-mono text-zinc-100">
                  WEB AUDIO API SYNTHESIZED ALERT CHIMES
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pure Web Audio API tone synthesis with dedicated frequencies for INFO, HIGH, and CRITICAL dispatch triggers.
                </p>
              </div>

              <button
                onClick={handleToggleMute}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                  isAudioMuted
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isAudioMuted ? 'UNMUTE ALERTS' : 'MUTE ALERTS'}</span>
              </button>
            </div>

            {audioFeedback && (
              <div className="p-3 bg-cyan-950/80 border border-cyan-700 text-cyan-200 text-xs font-mono rounded">
                {audioFeedback}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-4 bg-[#060a12] border border-cyan-900/40 rounded-lg space-y-2">
                <div className="text-xs font-mono font-bold text-zinc-200 uppercase">INFO TONE</div>
                <div className="text-[10px] text-zinc-400">520Hz → 659Hz Dual-tone chime</div>
                <button
                  onClick={() => handleTestAudio('INFO', 'INFO (Low Priority)')}
                  className="w-full mt-2 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  PLAY INFO TONE
                </button>
              </div>

              <div className="p-4 bg-[#060a12] border border-cyan-900/40 rounded-lg space-y-2">
                <div className="text-xs font-mono font-bold text-amber-300 uppercase">HIGH PRIORITY</div>
                <div className="text-[10px] text-zinc-400">784Hz → 880Hz → 1046Hz Tri-tone</div>
                <button
                  onClick={() => handleTestAudio('HIGH', 'HIGH (Urgent Incident)')}
                  className="w-full mt-2 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  PLAY HIGH TONE
                </button>
              </div>

              <div className="p-4 bg-[#060a12] border border-cyan-900/40 rounded-lg space-y-2">
                <div className="text-xs font-mono font-bold text-rose-400 uppercase">CRITICAL ALERT</div>
                <div className="text-[10px] text-zinc-400">880Hz ↔ 660Hz Alternating Pulse</div>
                <button
                  onClick={() => handleTestAudio('CRITICAL', 'CRITICAL (Emergency Alert)')}
                  className="w-full mt-2 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  PLAY CRITICAL TONE
                </button>
              </div>

              <div className="p-4 bg-[#060a12] border border-cyan-900/40 rounded-lg space-y-2">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase">TEST ALERT</div>
                <div className="text-[10px] text-zinc-400">523Hz → 659Hz → 784Hz → 1046Hz</div>
                <button
                  onClick={() => handleTestAudio('TEST_ALERT', 'TEST ALERT')}
                  className="w-full mt-2 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  TEST ALERT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
