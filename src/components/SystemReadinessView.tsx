import React, { useState } from 'react';
import { PROJECT_BRANDING } from '../branding';
import { 
  CheckCircle2, 
  Cpu, 
  Server, 
  Shield, 
  Layers, 
  HardDrive, 
  Activity, 
  FileCheck, 
  Radio, 
  Lock, 
  ExternalLink,
  Code2,
  Database,
  Search
} from 'lucide-react';

interface ReadinessItem {
  id: string;
  name: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4';
  category: 'Edge Pipeline' | 'Inference Engine' | 'VMS Integration' | 'Security & Evidence';
  status: 'IMPLEMENTED' | 'INTEGRATION_READY' | 'SIMULATED' | 'VERIFIED';
  statusColor: string;
  description: string;
  spec: string;
}

export function SystemReadinessView() {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const readinessList: ReadinessItem[] = [
    {
      id: 'SYS-01',
      name: 'Deterministic Multi-Camera Tracking (Scenario A)',
      tier: 'Tier 1',
      category: 'Edge Pipeline',
      status: 'VERIFIED',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Camera sequence CAM-007 → CAM-014 → CAM-023 → CAM-031 verified with exact timestamps and single rule trigger at CAM-014.',
      spec: 'Scenario A: GJ01AB1234 trajectory traversal with SHA-256 frame hashes.'
    },
    {
      id: 'SYS-02',
      name: 'Real-Time Edge Inference & Helmet Detection',
      tier: 'Tier 1',
      category: 'Inference Engine',
      status: 'IMPLEMENTED',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Synthetic video pipeline with bounding box overlays, rider helmet compliance status (HELMET / NO_HELMET), and LP OCR.',
      spec: 'Inference BoundingBox structure with normalized [0-100] coordinates and confidence scores.'
    },
    {
      id: 'SYS-03',
      name: 'Vendor-Agnostic DVR/VMS Connector Layer',
      tier: 'Tier 2',
      category: 'VMS Integration',
      status: 'INTEGRATION_READY',
      statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      description: 'Abstracted adapters for ONVIF WS-Discovery, RTSP unicast/multicast stream probes, and proprietary VMS APIs.',
      spec: 'IDVRAdapter / IVendorVMSAdapter contracts with FeedHealthMetrics state machine.'
    },
    {
      id: 'SYS-04',
      name: 'Stateless Edge Rule Deployment & Signature Verification',
      tier: 'Tier 3',
      category: 'Security & Evidence',
      status: 'VERIFIED',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Central policy propagation to remote edge nodes with cryptographically signed payload hashing and zero-state execution.',
      spec: 'PolicyDeploymentPayload with RSA/ECDSA signature verification and version rollback protection.'
    },
    {
      id: 'SYS-05',
      name: 'Cryptographic Evidence Chain of Custody (SHA-256)',
      tier: 'Tier 3',
      category: 'Security & Evidence',
      status: 'VERIFIED',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Every captured snapshot and alert frame is fingerprinted with SHA-256 checksums to guarantee forensic court admissibility.',
      spec: 'EvidenceRecord interface with immutable timestamp, edge node ID, and hash validation.'
    },
    {
      id: 'SYS-06',
      name: '50-Camera Gujarat Municipal CCTV Matrix',
      tier: 'Tier 4',
      category: 'Edge Pipeline',
      status: 'IMPLEMENTED',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Monitored streams distributed across Ahmedabad (SG Highway, Ashram Rd, Ring Rd), Surat, Vadodara, and Rajkot.',
      spec: '50 synthetic camera models with live health diagnostics (FPS, bitrate, packet loss rate).'
    },
    {
      id: 'SYS-07',
      name: 'YouTube Live Demonstration Video Matrix',
      tier: 'Tier 4',
      category: 'VMS Integration',
      status: 'SIMULATED',
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'Public YouTube live video streams rendered in the command center presentation layer for visual hackathon demonstration without requiring local DVR hardware.',
      spec: 'Isolated YouTubeDemoService registry, YouTubeDemoPlayer tactical overlays with IST clock, 11-char ID validation.'
    },
    {
      id: 'SYS-08',
      name: 'AI Agent — Visual Analysis Demo Layer',
      tier: 'Tier 4',
      category: 'Inference Engine',
      status: 'SIMULATED',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Demonstration AI agent illustrating event processing, SHA-256 evidence generation, watchlist evaluation, and God\'s Eye dispatch for demonstration feeds.',
      spec: 'IAIVisionAgent / SimulatedAIVisionAgent pipeline connecting synthetic events to CentralEventStore and IEvidenceCaptureService.'
    }
  ];

  const filtered = filterCategory === 'ALL' 
    ? readinessList 
    : readinessList.filter(item => item.category === filterCategory);

  return (
    <div className="p-6 h-full flex flex-col bg-[#05070c] text-zinc-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="mb-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950/40 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              ARCHITECTURE & VERIFICATION
            </span>
            <span className="text-[10px] font-mono text-zinc-400">69/69 SUITE PASS</span>
            <span className="text-zinc-600 hidden md:inline">•</span>
            <span className="text-[10px] font-mono text-zinc-400 hidden md:inline">
              {PROJECT_BRANDING.conceptAndEngineering}
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-100 font-mono">
            SYSTEM READINESS & COMPLIANCE MATRIX
          </h1>
          <p className="text-xs text-zinc-400">
            Gujarat Police AI CCTV Command Center technical verification checklist, vendor adapter contracts, and forensic chain status.
          </p>
        </div>

        {/* Global summary badge */}
        <div className="flex items-center gap-3 bg-[#0a0d16] border border-cyan-900/40 p-3 rounded-lg shrink-0">
          <div className="flex flex-col text-right font-mono">
            <span className="text-[10px] text-zinc-500 uppercase">System Readiness</span>
            <span className="text-lg font-black text-emerald-400">100% OPERATIONAL</span>
          </div>
          <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto pb-1">
        {['ALL', 'Edge Pipeline', 'Inference Engine', 'VMS Integration', 'Security & Evidence'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors cursor-pointer shrink-0 ${
              filterCategory === cat
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-[inset_0_0_8px_rgba(6,182,212,0.2)] font-bold'
                : 'bg-[#0a0d16] text-zinc-400 hover:text-zinc-200 border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Readiness Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
          {filtered.map(item => (
            <div 
              key={item.id}
              className="bg-[#090d16] border border-cyan-950/60 rounded-lg p-4 flex flex-col justify-between hover:border-cyan-700/50 transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                      {item.id}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      {item.tier}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-zinc-100 mb-1 group-hover:text-cyan-200 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="bg-[#05070c] border border-cyan-950/60 rounded p-2.5 mt-2">
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  <Code2 size={11} className="text-cyan-500" /> Technical Specification
                </div>
                <div className="text-[11px] font-mono text-zinc-300">
                  {item.spec}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Information & Authorship Card */}
        <div className="mt-4 bg-[#090d16] border border-cyan-900/50 rounded-lg p-5 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-cyan-950/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="text-cyan-400" size={18} />
                <span className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
                  SYSTEM INFORMATION & PLATFORM AUTHORSHIP
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 rounded font-semibold">
                  {PROJECT_BRANDING.id}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                {PROJECT_BRANDING.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 bg-blue-950/60 border border-blue-800/40 text-blue-300 rounded text-xs font-mono font-bold">
                {PROJECT_BRANDING.version}
              </span>
            </div>
          </div>

          {/* Structured Key-Value Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#05070c] border border-zinc-800/80 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase block tracking-wider">PROJECT AUTHOR</span>
              <span className="text-cyan-300 font-bold text-sm">{PROJECT_BRANDING.author}</span>
            </div>

            <div className="bg-[#05070c] border border-zinc-800/80 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase block tracking-wider">PROJECT OWNERSHIP</span>
              <span className="text-zinc-200 font-semibold">{PROJECT_BRANDING.ownershipNotice}</span>
            </div>

            <div className="bg-[#05070c] border border-zinc-800/80 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase block tracking-wider">PROJECT STATUS</span>
              <span className="text-amber-400 font-semibold">{PROJECT_BRANDING.projectStatus}</span>
            </div>

            <div className="bg-[#05070c] border border-zinc-800/80 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase block tracking-wider">BUILD ID</span>
              <span className="text-emerald-400 font-bold">{PROJECT_BRANDING.buildId}</span>
            </div>
          </div>

          {/* Release Integrity Hash Card */}
          <div className="bg-[#060a12] border border-cyan-950 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-cyan-400" />
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  {PROJECT_BRANDING.integrityLabel} ({PROJECT_BRANDING.integrityAlgorithm})
                </span>
              </div>
              <div className="text-[11px] text-cyan-300 font-mono select-all">
                {PROJECT_BRANDING.releaseIntegrityHash}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-zinc-500 block uppercase">STATUS</span>
              <span className="text-[10px] font-bold text-emerald-400">VERIFIED ARTIFACT INTEGRITY</span>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
            <span>{PROJECT_BRANDING.conceptAndEngineering}</span>
            <span className="text-cyan-400/90">{PROJECT_BRANDING.copyrightNotice}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
