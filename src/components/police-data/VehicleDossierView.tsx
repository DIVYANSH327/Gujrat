/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleDossierView: Master Unified Vehicle Intelligence Dossier & Evidence Fabric
 * 
 * Core Mandate:
 * "ONE VEHICLE IDENTITY CONTEXT ACROSS CAMERA OBSERVATIONS, EVIDENCE,
 * INVESTIGATIONS AND AUTHORIZED DATA SOURCES."
 * 
 * Strict Epistemic Separation:
 * CAMERA OBSERVED DATA is never merged with EXTERNAL AUTHORIZED DATA into an undifferentiated fact set.
 */

import React, { useState } from 'react';
import { 
  VehicleDossier, 
  VehicleObservation, 
  ForensicEvidenceRecord,
  UserRole 
} from '../../types';
import { vehicleDossierService } from '../../services/VehicleDossierService';
import { externalDataProviderRegistry } from '../../services/ExternalDataProviderRegistry';
import { vehicleInvestigationMissionService } from '../../services/VehicleInvestigationMissionService';
import { evidenceCorrelationService } from '../../services/EvidenceCorrelationService';
import { trafficGroupCorrelationAgent } from '../../ai-agents/traffic/TrafficGroupCorrelationAgent';
import { trafficFlowAgent } from '../../ai-agents/traffic/TrafficFlowAgent';
import { roadSegmentIntelligenceService } from '../../services/RoadSegmentIntelligenceService';
import { SourceOfTruthBadge } from './SourceOfTruthBadge';
import { InvestigationReviewPanel } from './InvestigationReviewPanel';
import { VehicleInvestigationGraphView } from './VehicleInvestigationGraphView';
import { 
  ShieldCheck, 
  Car, 
  Camera, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  Compass, 
  Database, 
  Share2, 
  CheckCircle2, 
  Eye, 
  Layers, 
  Activity, 
  BarChart3, 
  History, 
  Download,
  Search,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface Props {
  dossier: VehicleDossier;
  onDossierUpdated?: (updated: VehicleDossier) => void;
  onClose?: () => void;
}

export const VehicleDossierView: React.FC<Props> = ({ 
  dossier: initialDossier, 
  onDossierUpdated, 
  onClose 
}) => {
  const [dossier, setDossier] = useState<VehicleDossier>(initialDossier);
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'TIMELINE' | 'PHOTOS' | 'CORRELATION' | 'EXTERNAL' | 'TRAFFIC' | 'GRAPH' | 'AUDIT' | 'REVIEW'
  >('OVERVIEW');

  const [isQueryingExternal, setIsQueryingExternal] = useState(false);
  const [queryMessage, setQueryMessage] = useState<string | null>(null);
  const [isLaunchingMission, setIsLaunchingMission] = useState(false);
  const [missionStatus, setMissionStatus] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ForensicEvidenceRecord | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Timeline & Evidence Items
  const timelineItems = evidenceCorrelationService.buildEvidenceTimeline(dossier.observations);
  const trafficGroups = trafficGroupCorrelationAgent.detectTrafficGroups(dossier.observations);
  const flowMetrics = trafficFlowAgent.computeFlowMetrics(dossier.observations);
  const roadSegments = roadSegmentIntelligenceService.getAllSegments();

  const handleUpdateDossier = (updated: VehicleDossier) => {
    setDossier(updated);
    if (onDossierUpdated) onDossierUpdated(updated);
  };

  // Launch Authorized External Queries
  const handleQueryExternal = async () => {
    setIsQueryingExternal(true);
    setQueryMessage('Querying VAHAN 4.0, Gujarat eChallan, and eGujCop gateways...');

    try {
      const results = await externalDataProviderRegistry.queryAllAuthorized(dossier.canonicalPlate, {
        actorId: 'OFFICER-INVESTIGATOR-01',
        role: 'INVESTIGATOR',
        purpose: 'Statutory Investigation Verification',
        caseId: dossier.investigationReferences[0] || 'CASE-2026-INV-881'
      });

      const updated = vehicleDossierService.updateDossierWithExternalData(dossier.canonicalPlate, results);
      handleUpdateDossier(updated);
      setQueryMessage('External government records successfully retrieved and correlated.');
      setTimeout(() => setQueryMessage(null), 4000);
    } catch (err: any) {
      setQueryMessage(`External query failed: ${err?.message}`);
    } finally {
      setIsQueryingExternal(false);
    }
  };

  // Launch 11-Stage Mission
  const handleLaunchMission = async () => {
    setIsLaunchingMission(true);
    setMissionStatus('Initializing 11-Stage Spatiotemporal Investigation Protocol...');

    try {
      const mission = await vehicleInvestigationMissionService.launchMission(dossier.canonicalPlate, {
        actorId: 'OFFICER-INVESTIGATOR-01',
        role: 'INVESTIGATOR',
        purpose: 'Comprehensive Mission Verification',
        includeExternalData: true
      });

      if (mission.dossier) {
        handleUpdateDossier(mission.dossier);
      }
      setMissionStatus(`Mission ${mission.missionId} successfully finished.`);
      setTimeout(() => setMissionStatus(null), 5000);
    } catch (err: any) {
      setMissionStatus(`Mission error: ${err?.message}`);
    } finally {
      setIsLaunchingMission(false);
    }
  };

  // Export Dossier
  const handleExport = () => {
    const exported = vehicleDossierService.exportDossier(dossier.canonicalPlate, {
      id: 'OFFICER-INVESTIGATOR-01',
      role: 'INVESTIGATOR',
      purpose: 'Statutory Judicial Record Export'
    });

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exported, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DOSSIER_${dossier.canonicalPlate}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportNotice('Forensic JSON Dossier exported successfully.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div id="vehicle-dossier-view" className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0 text-slate-100 font-sans">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 p-6 border-b border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-bold font-mono tracking-tight text-white">
                    {dossier.canonicalPlate}
                  </h2>
                  <SourceOfTruthBadge category="CAMERA_OBSERVED" size="md" />
                  {dossier.humanReviews.length > 0 && (
                    <SourceOfTruthBadge category="HUMAN_VERIFIED" size="md" />
                  )}
                  {dossier.externalDataStatus === 'AUTHORIZED_LOADED' && (
                    <SourceOfTruthBadge category="EXTERNAL_AUTHORIZED" size="md" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Observed: <span className="text-slate-200 font-semibold">{dossier.vehicleAttributes.observedColor || 'WHITE'}</span>{' '}
                  <span className="text-amber-400 font-semibold uppercase">{dossier.vehicleAttributes.observedClass}</span> • Sighted across{' '}
                  <span className="text-slate-200 font-semibold">{dossier.observations.length} cameras</span> • 
                  Confidence: <span className="text-emerald-400 font-mono font-bold">{(dossier.confidence * 100).toFixed(0)}%</span>
                </p>
              </div>
            </div>

            {/* Strict Epistemic Separation Disclaimer */}
            <div className="text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-800/40 px-3 py-1.5 rounded mt-3 inline-flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Epistemic Separation Notice:</strong> Camera optical facts (ANPR / CCTV) are maintained separately from authorized external registries (VAHAN / eChallan / eGujCop).
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-query-external-registries"
              onClick={handleQueryExternal}
              disabled={isQueryingExternal}
              className="px-3.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              {isQueryingExternal ? 'Querying Gateways...' : 'Query External Registries'}
            </button>
            <button
              id="btn-launch-mission"
              onClick={handleLaunchMission}
              disabled={isLaunchingMission}
              className="px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 rounded text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5" />
              {isLaunchingMission ? 'Executing Mission...' : 'Run 11-Stage Mission'}
            </button>
            <button
              id="btn-export-dossier"
              onClick={handleExport}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Dossier
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded text-xs transition"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Dynamic status notifications */}
        {(queryMessage || missionStatus || exportNotice) && (
          <div className="mt-3 p-2 bg-slate-900/90 border border-slate-700 rounded text-xs font-mono text-amber-300 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>{queryMessage || missionStatus || exportNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-800 pt-5 overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: Car },
            { id: 'TIMELINE', label: 'Journey & Timeline', icon: Clock },
            { id: 'PHOTOS', label: 'All Evidence Photos', icon: Camera },
            { id: 'CORRELATION', label: 'Cross-Camera AI', icon: Cpu },
            { id: 'EXTERNAL', label: 'Government Registries', icon: Database },
            { id: 'TRAFFIC', label: 'Traffic & Segments', icon: BarChart3 },
            { id: 'GRAPH', label: 'Relational Graph', icon: Share2 },
            { id: 'AUDIT', label: 'Lineage & Audit', icon: History },
            { id: 'REVIEW', label: 'Human Verification', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id.toLowerCase()}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content Canvas */}
      <div className="p-6">
        {/* ============================================================ */}
        {/* 1. OVERVIEW TAB */}
        {/* ============================================================ */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Top Quick Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
                <span className="text-xs text-slate-400">First Sighting</span>
                <p className="text-sm font-bold font-mono text-slate-100 mt-1">
                  {dossier.firstSeen.cameraName || dossier.firstSeen.camera}
                </p>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {new Date(dossier.firstSeen.timestamp).toLocaleTimeString()}
                </span>
                <div className="mt-2">
                  <SourceOfTruthBadge category={dossier.firstSeen.sourceOfTruth} />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
                <span className="text-xs text-slate-400">Authoritative Last Seen</span>
                <p className="text-sm font-bold font-mono text-emerald-400 mt-1">
                  {dossier.lastSeen.cameraName || dossier.lastSeen.camera}
                </p>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {new Date(dossier.lastSeen.timestamp).toLocaleTimeString()} • {dossier.lastSeen.direction || 'Transit'}
                </span>
                <div className="mt-2">
                  <SourceOfTruthBadge category={dossier.lastSeen.sourceOfTruth} />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
                <span className="text-xs text-slate-400">Journey Consistency</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-bold ${
                    dossier.journeyQuality.level === 'HIGH' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {dossier.journeyQuality.level} ({dossier.journeyQuality.score}/100)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                  {dossier.journeyQuality.reasons.join(', ')}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
                <span className="text-xs text-slate-400">Operational Signals</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertTriangle className={`w-4 h-4 ${
                    dossier.signalsSummary.hasCriticalSignals ? 'text-red-400' : 'text-amber-400'
                  }`} />
                  <span className="text-sm font-bold text-slate-100">
                    {dossier.signalsSummary.totalSignalsCount} Signals
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1 truncate">
                  {dossier.signalsSummary.explanation}
                </span>
              </div>
            </div>

            {/* Sighting vs Registry Discrepancy Matrix */}
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  Sensor Observed vs Registered Attributes
                </h3>
                <span className="text-xs text-slate-400 font-mono">Discrepancy Audit Engine</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Camera Observed Facts */}
                <div className="bg-slate-950/80 border border-emerald-950/80 p-4 rounded space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 uppercase font-mono">Camera Observed Facts</span>
                    <SourceOfTruthBadge category="CAMERA_OBSERVED" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Optical Plate: <span className="font-mono text-white font-semibold">{dossier.canonicalPlate}</span></div>
                    <div>Vehicle Class: <span className="font-semibold text-white uppercase">{dossier.vehicleAttributes.observedClass}</span></div>
                    <div>Color Signature: <span className="font-semibold text-white">{dossier.vehicleAttributes.observedColor || 'WHITE'}</span></div>
                    <div>Sightings Count: <span className="font-semibold text-white">{dossier.observations.length}</span></div>
                  </div>
                </div>

                {/* Authorized Registry Facts */}
                <div className="bg-slate-950/80 border border-cyan-950/80 p-4 rounded space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 uppercase font-mono">VAHAN 4.0 Registration</span>
                    <SourceOfTruthBadge category="EXTERNAL_AUTHORIZED" />
                  </div>
                  {dossier.externalData?.vahan?.record ? (
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>Registered Plate: <span className="font-mono text-white font-semibold">{dossier.canonicalPlate}</span></div>
                      <div>Make / Model: <span className="font-semibold text-white">{dossier.externalData.vahan.record.make} {dossier.externalData.vahan.record.model}</span></div>
                      <div>Registered Color: <span className="font-semibold text-white">{dossier.externalData.vahan.record.color}</span></div>
                      <div>RTO Jurisdiction: <span className="font-semibold text-white">{dossier.externalData.vahan.record.registrationAuthority}</span></div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic py-2">
                      External VAHAN data not queried yet. Click "Query External Registries" above.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Forward Corridor Downstream Predictions */}
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  Predictive Forward Corridor (Next Expected Sighting)
                </h3>
                <SourceOfTruthBadge category="PREDICTED" />
              </div>
              <p className="text-xs text-slate-400">
                Spatiotemporal transit projection based on camera network topology and road velocity models.
              </p>

              {dossier.lastSeen.predictedNextCameras.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {(dossier.lastSeen as any)?.predictedNextCameras?.map((pred: any, i: number) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-800 p-3 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-purple-300">{pred.cameraName || pred.cameraId || `CAM-${i}`}</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {((pred.probability || pred.confidence || 0.8) * 100).toFixed(0)}% PROBABILITY
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Expected Arrival: <span className="text-slate-200">{pred.expectedWindowStart || '10m'} - {pred.expectedWindowEnd || '25m'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Corridor prediction requires minimum 2 transit observations in topological graph.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. TIMELINE TAB */}
        {/* ============================================================ */}
        {activeTab === 'TIMELINE' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Evidence-First Spatiotemporal Transit Lineage ({timelineItems.length} Checkpoints)
              </h3>
              <span className="text-xs text-slate-400 font-mono">Chronologically Ordered</span>
            </div>

            <div className="relative border-l border-slate-800 ml-4 space-y-6 py-2">
              {timelineItems.map((item, idx) => (
                <div key={item.observationId} className="relative pl-6 group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-2.5 top-1 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    item.stageName === 'FIRST_SEEN' 
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300' 
                      : item.stageName === 'LAST_SEEN'
                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                      : item.stageName === 'WATCHLIST_HIT'
                      ? 'bg-red-950 border-red-500 text-red-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-lg space-y-2 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{item.cameraName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {item.stageName}
                        </span>
                        <SourceOfTruthBadge category={item.sourceCategory} />
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{item.whyLinked}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
                      <div>Plate Optical Read: <span className="font-mono text-slate-200 font-semibold">{item.plateText || 'Unread'}</span></div>
                      <div>Vehicle Class: <span className="text-slate-200 capitalize">{item.vehicleClass}</span></div>
                      <div>Correlation Conf: <span className="text-emerald-400 font-mono">{(item.correlationConfidence * 100).toFixed(0)}%</span></div>
                      <div>Evidence Seal: <span className="font-mono text-indigo-400 truncate block">{item.evidenceHash ? 'SHA-256 SEALED' : 'UNSEALED'}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. ALL EVIDENCE PHOTOS TAB */}
        {/* ============================================================ */}
        {activeTab === 'PHOTOS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Chronological Forensic Photographic Evidence Archive ({dossier.evidence.length} Frames)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cryptographically sealed capture frames preserved under Section 65B statutory digital custody.
                </p>
              </div>
              <SourceOfTruthBadge category="CAMERA_OBSERVED" size="md" />
            </div>

            {dossier.evidence.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-lg text-slate-500">
                <Camera className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">NO IMAGE EVIDENCE AVAILABLE</p>
                <p className="text-xs text-slate-600 mt-1">Optical frames await camera edge snapshot ingestion.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dossier.evidence.map((ev, idx) => (
                  <div 
                    key={`${ev.evidenceId}-${idx}`}
                    onClick={() => setSelectedPhoto(ev)}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-lg overflow-hidden cursor-pointer transition group"
                  >
                    <div className="h-44 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                      {(ev as any).mediaPayloadUrl || ev.imageReference || (ev as any).snapshotUrl ? (
                        <img 
                          src={(ev as any).mediaPayloadUrl || ev.imageReference || (ev as any).snapshotUrl} 
                          alt={`Evidence from ${(ev as any).cameraNodeId || ev.cameraId}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="text-center text-slate-600">
                          <Camera className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px] font-mono">FRAME {idx + 1}</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 border border-slate-700">
                        {(ev as any).cameraNodeId || ev.cameraId}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-emerald-950/90 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-600/40">
                        SEALED
                      </div>
                    </div>

                    <div className="p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{(ev as any).evidenceType || 'CAMERA_SIGHTING'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date((ev as any).capturedAt || ev.timestamp || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{(ev as any).notes || `Captured at ${(ev as any).cameraNodeId || ev.cameraId}`}</p>
                      <div className="text-[10px] font-mono text-slate-500 truncate pt-1 border-t border-slate-800">
                        SHA-256: {(ev as any).cryptographicSha256 || ev.sha256}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. CROSS-CAMERA AI CORRELATION TAB */}
        {/* ============================================================ */}
        {activeTab === 'CORRELATION' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    Multi-Attribute Spatiotemporal Consistency Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluates optical character variance, vehicle classification, color, heading, topology, and physical transit windows.
                  </p>
                </div>
                <SourceOfTruthBadge category="AI_INFERRED" size="md" />
              </div>

              {dossier.correlationResults.length > 0 ? (
                <div className="space-y-4">
                  {dossier.correlationResults.map((corr, idx) => (
                    <div key={corr.correlationId} className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          Correlation #{idx + 1}: {corr.decision}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {(corr.confidence * 100).toFixed(0)}% MATCH CONFIDENCE
                        </span>
                      </div>

                      {/* Progress breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px]">Plate Consistency</span>
                          <div className="text-slate-100 font-bold font-mono">{corr.breakdown.plateConsistency}%</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Type Consistency</span>
                          <div className="text-slate-100 font-bold font-mono">{corr.breakdown.typeConsistency}%</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Color Signature</span>
                          <div className="text-slate-100 font-bold font-mono">{corr.breakdown.colorConsistency}%</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Direction Heading</span>
                          <div className="text-slate-100 font-bold font-mono">{corr.breakdown.directionConsistency}%</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Topology Network</span>
                          <div className="text-slate-100 font-bold font-mono">{corr.breakdown.topologyConsistency}%</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Transit Plausibility</span>
                          <div className="text-slate-100 font-bold font-mono">{corr.breakdown.temporalConsistency}%</div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 pt-2 border-t border-slate-900 space-y-1">
                        <span className="text-slate-400 font-semibold block text-[11px]">Why Linked:</span>
                        {corr.whyLinked.map((w, wi) => (
                          <div key={wi} className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Single sighting recorded. Multi-camera correlation requires 2 or more camera checkpoints.
                </div>
              )}
            </div>

            {/* Group Traffic / Convoy Candidates */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-lg space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Group Traffic & Convoy Candidates ({trafficGroups.length})
              </h3>
              <p className="text-xs text-slate-400">
                Detects vehicles traveling in tandem across multiple camera checkpoints within tight temporal proximity.
              </p>

              {trafficGroups.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {trafficGroups.map(grp => (
                    <div key={grp.groupId} className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {grp.plates.join('  <—>  ')}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {(grp.confidence * 100).toFixed(0)}% CONVOY PROBABILITY
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Camera Sequence: <span className="font-mono text-slate-200">{grp.cameraSequence.join(' -> ')}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">
                        {grp.reasons.join(' • ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  No convoy or group travel candidates detected for this vehicle trajectory.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. GOVERNMENT REGISTRIES TAB */}
        {/* ============================================================ */}
        {activeTab === 'EXTERNAL' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Authorized Government Data Federation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Zero-trust external registry lookups with immutable purpose-driven audit logging.
                </p>
              </div>
              <SourceOfTruthBadge category="EXTERNAL_AUTHORIZED" size="md" />
            </div>

            {/* VAHAN 4.0 Card */}
            <div className="bg-slate-900/80 border border-cyan-950 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 font-mono text-sm">
                  VAHAN 4.0 National Vehicle Registry
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Status: {dossier.externalData?.providerStatus?.VAHAN || 'AVAILABLE'}
                </span>
              </div>

              {dossier.externalData?.vahan?.record ? (
                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
                    <div>Make / Model: <span className="text-white font-semibold block">{dossier.externalData.vahan.record.make} {dossier.externalData.vahan.record.model}</span></div>
                    <div>Vehicle Class: <span className="text-white font-semibold uppercase block">{dossier.externalData.vahan.record.vehicleClass}</span></div>
                    <div>Color: <span className="text-white font-semibold block">{dossier.externalData.vahan.record.color}</span></div>
                    <div>Fuel: <span className="text-white font-semibold block">{dossier.externalData.vahan.record.fuelType}</span></div>
                    <div>RTO Authority: <span className="text-white font-semibold block">{dossier.externalData.vahan.record.registrationAuthority}</span></div>
                    <div>Registration Date: <span className="text-white font-semibold block">{dossier.externalData.vahan.record.registrationDate}</span></div>
                    <div>PUC Valid: <span className="text-white font-semibold block">{dossier.externalData.vahan.record.pucValidUntil}</span></div>
                    <div>Insurance Valid: <span className="text-white font-semibold block">{dossier.externalData.vahan.record.insuranceValidUntil}</span></div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic pt-2 border-t border-slate-800">
                    {dossier.externalData.vahan.disclaimer}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-950/60 rounded border border-slate-800">
                  No VAHAN registry data queried yet.
                </div>
              )}
            </div>

            {/* Gujarat eChallan Card */}
            <div className="bg-slate-900/80 border border-amber-950 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 font-mono text-sm">
                  Gujarat eChallan Traffic Enforcement Gateway
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Pending Amount: ₹{dossier.externalData?.echallan?.totalPendingAmount ?? 0}
                </span>
              </div>

              {dossier.externalData?.echallan?.challans && dossier.externalData.echallan.challans.length > 0 ? (
                <div className="space-y-2">
                  {dossier.externalData.echallan.challans.map((ch: any) => (
                    <div key={ch.challanNumber} className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-white font-bold">{ch.challanNumber}</span>
                        <p className="text-slate-400 text-[11px]">{ch.violationType} • {ch.location}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-amber-400 font-bold">₹{ch.amount}</span>
                        <span className={`block text-[10px] uppercase font-semibold ${
                          ch.status === 'PENDING' ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {ch.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-950/60 rounded border border-slate-800">
                  No pending traffic challans or query not executed.
                </div>
              )}
            </div>

            {/* eGujCop CCTNS Police Records Card */}
            <div className="bg-slate-900/80 border border-rose-950 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 font-mono text-sm">
                  eGujCop / CCTNS Core Police Records
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Status: {dossier.externalData?.providerStatus?.EGUJCOP || 'AVAILABLE'}
                </span>
              </div>

              {(dossier.externalData?.egujcop as any)?.records && (dossier.externalData.egujcop as any).records.length > 0 ? (
                <div className="space-y-2">
                  {(dossier.externalData.egujcop as any).records.map((rec: any, i: number) => (
                    <div key={i} className="bg-slate-950 p-4 rounded border border-rose-900/40 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-rose-300 font-bold">{rec.caseNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 uppercase font-mono">
                          {rec.recordType}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{rec.briefSummary}</p>
                      <div className="text-[10px] text-slate-400">
                        Station: <span className="text-slate-200">{rec.policeStation}</span> • Sections: <span className="text-slate-200">{rec.sections?.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-950/60 rounded border border-slate-800">
                  No police records flagged or query not executed under active case reference.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. TRAFFIC FLOW & ROAD SEGMENTS TAB */}
        {/* ============================================================ */}
        {activeTab === 'TRAFFIC' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <span className="text-xs text-slate-400">Corridor Flow Density</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {flowMetrics.vehiclesPerMinute} <span className="text-xs text-slate-400">veh/min</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Congestion: <span className="text-slate-200 font-bold">{flowMetrics.congestionLevel}</span>
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <span className="text-xs text-slate-400">Average Transit Time</span>
                <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                  {flowMetrics.averageTravelTimeSeconds}s
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Corridor Speed: <span className="text-slate-200 font-bold">58 km/h (Nominal)</span>
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <span className="text-xs text-slate-400">Active Arterial Segments</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {roadSegments.length}
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Monitored state arterial highways
                </span>
              </div>
            </div>

            {/* Arterial Road Segments Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Arterial Highway & Corridor Telemetry
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Corridor Segment</th>
                      <th className="p-3">Cameras</th>
                      <th className="p-3">Vehicle Count</th>
                      <th className="p-3">Avg Speed</th>
                      <th className="p-3">Congestion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {roadSegments.map(seg => (
                      <tr key={seg.segmentId} className="hover:bg-slate-950/40">
                        <td className="p-3 font-semibold text-slate-200">
                          {seg.name}
                          <span className="block text-[10px] text-slate-500 font-mono">{seg.segmentId}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">{seg.cameraIds.join(', ')}</td>
                        <td className="p-3 font-mono text-slate-200">{seg.vehicleCount}</td>
                        <td className="p-3 font-mono text-emerald-400">{seg.averageSpeedEstimate} km/h</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            seg.congestion === 'LOW' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {seg.congestion}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 7. RELATIONAL GRAPH TAB */}
        {/* ============================================================ */}
        {activeTab === 'GRAPH' && (
          <VehicleInvestigationGraphView dossier={dossier} />
        )}

        {/* ============================================================ */}
        {/* 8. LINEAGE & AUDIT TAB */}
        {/* ============================================================ */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Statutory Chain-of-Custody & Data Lineage (BNSS 2023 / Section 65B)
                </h3>
                <span className="text-xs text-emerald-400 font-mono">TAMPER-EVIDENT SEALED</span>
              </div>

              <div className="space-y-3">
                {dossier.dataLineage.map(lin => (
                  <div key={lin.lineageId} className="bg-slate-950 p-4 rounded border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-200">{lin.lineageId}</span>
                      <SourceOfTruthBadge category={lin.sourceCategory} />
                    </div>
                    <p className="text-slate-400">
                      Processing Agent: <span className="text-slate-200 font-semibold">{lin.processingAgent}</span> • Method: <span className="text-slate-200 font-mono">{lin.modelOrMethod}</span>
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Timestamp: {new Date(lin.timestamp).toLocaleString()} • Correlation ID: {lin.correlationId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 9. HUMAN VERIFICATION REVIEW TAB */}
        {/* ============================================================ */}
        {activeTab === 'REVIEW' && (
          <InvestigationReviewPanel 
            dossier={dossier} 
            onDossierUpdated={handleUpdateDossier} 
          />
        )}
      </div>

      {/* Modal for detailed photo evidence inspection */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-mono font-bold text-amber-400 text-sm">{selectedPhoto.evidenceId}</span>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                [CLOSE ESC]
              </button>
            </div>
            <div className="h-72 bg-slate-950 rounded flex items-center justify-center overflow-hidden">
              {(selectedPhoto as any).mediaPayloadUrl || selectedPhoto.imageReference || (selectedPhoto as any).snapshotUrl ? (
                <img src={(selectedPhoto as any).mediaPayloadUrl || selectedPhoto.imageReference || (selectedPhoto as any).snapshotUrl} alt="Evidence" className="w-full h-full object-contain" />
              ) : (
                <Camera className="w-12 h-12 text-slate-600" />
              )}
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div>Camera Checkpoint: <span className="font-mono text-white">{(selectedPhoto as any).cameraNodeId || selectedPhoto.cameraId}</span></div>
              <div>Captured Timestamp: <span className="font-mono text-white">{new Date((selectedPhoto as any).capturedAt || selectedPhoto.timestamp || Date.now()).toLocaleString()}</span></div>
              <div className="font-mono text-[11px] text-slate-400 break-all">SHA-256: {(selectedPhoto as any).cryptographicSha256 || selectedPhoto.sha256}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
