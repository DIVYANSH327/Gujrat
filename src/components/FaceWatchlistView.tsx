/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * FaceWatchlistView
 * Statewide Biometric Face Watchlist & Person Intelligence Command Interface.
 * 
 * Statutory Authority: Sections 63-65, Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)
 * Absolute Policy:
 * "A face detection is not an identity. A similarity score is not legal certainty.
 * A watchlist candidate is not confirmation."
 */

import React, { useState, useEffect } from 'react';
import {
  ScanFace,
  Shield,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Search,
  Plus,
  FileText,
  FileCheck,
  Lock,
  Layers,
  HardDrive,
  Car,
  ChevronRight,
  ExternalLink,
  Info,
  Download,
  Eye,
  Check,
  X,
  Filter,
  RefreshCw,
  Hash
} from 'lucide-react';
import {
  FaceWatchlistEntry,
  FaceMatchCandidate,
  PersonDossier,
  FaceWatchlistCategory
} from '../types/facePersonIntelligenceTypes';
import { faceWatchlistService } from '../services/FaceWatchlistService';
import { unifiedPersonInvestigationService } from '../services/UnifiedPersonInvestigationService';
import { nasEvidenceStorageService } from '../services/NasEvidenceStorageService';
import { sysEvents } from '../services/Architecture';

interface FaceWatchlistViewProps {
  onNavigate?: (view: string) => void;
  onOpenDossier?: (targetId: string) => void;
}

export function FaceWatchlistView({ onNavigate, onOpenDossier }: FaceWatchlistViewProps) {
  const [activeTab, setActiveTab] = useState<'CANDIDATES' | 'ENROLLED' | 'DOSSIER' | 'NAS_VAULT'>('CANDIDATES');
  const [candidates, setCandidates] = useState<FaceMatchCandidate[]>([]);
  const [watchlist, setWatchlist] = useState<FaceWatchlistEntry[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<FaceMatchCandidate | null>(null);
  const [activeDossier, setActiveDossier] = useState<PersonDossier | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Verification Modal State
  const [verifyingCandidate, setVerifyingCandidate] = useState<FaceMatchCandidate | null>(null);
  const [officerName, setOfficerName] = useState<string>('Inspector V. K. Jadeja');
  const [officerBadge, setOfficerBadge] = useState<string>('GP-CID-7842');
  const [verificationNotes, setVerificationNotes] = useState<string>('Biometric facial landmark concordance and vehicle co-occurrence confirmed by reviewing officer.');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Certificate Export Modal State
  const [exportedCertificate, setExportedCertificate] = useState<{ id: string; hash: string; notice: string } | null>(null);

  // New Target Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [newAlias, setNewAlias] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<FaceWatchlistCategory>('CRITICAL_WANTED');
  const [newThreat, setNewThreat] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [newCaseId, setNewCaseId] = useState<string>('');
  const [newWarrant, setNewWarrant] = useState<string>('');
  const [newVehicles, setNewVehicles] = useState<string>('');
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60');

  const refreshData = () => {
    setCandidates(faceWatchlistService.listMatchCandidates());
    setWatchlist(faceWatchlistService.listWatchlist());
  };

  useEffect(() => {
    refreshData();
    const unsub1 = sysEvents.on('FACE_MATCH_CANDIDATE_GENERATED', refreshData);
    const unsub2 = sysEvents.on('FACE_CANDIDATE_DECIDED', refreshData);
    const unsub3 = sysEvents.on('FACE_WATCHLIST_UPDATED', refreshData);

    // Default load dossier for first target
    unifiedPersonInvestigationService.buildPersonDossier('WLIST-FACE-001').then(d => {
      if (d) setActiveDossier(d);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const handleVerifyCandidate = (decision: 'HUMAN_VERIFIED' | 'HUMAN_REJECTED') => {
    if (!verifyingCandidate) return;
    setIsVerifying(true);
    setTimeout(() => {
      faceWatchlistService.verifyCandidate(
        verifyingCandidate.matchId,
        decision,
        officerBadge,
        officerName,
        verificationNotes
      );
      setIsVerifying(false);
      setVerifyingCandidate(null);
      refreshData();
    }, 400);
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim()) return;

    const newTarget: FaceWatchlistEntry = {
      targetId: `WLIST-FACE-${Date.now().toString().slice(-4)}`,
      caseId: newCaseId || `CASE-${new Date().getFullYear()}-001`,
      aliasName: newAlias.trim(),
      fullName: newFullName.trim() || undefined,
      category: newCategory,
      threatLevel: newThreat,
      status: 'ACTIVE',
      enrolledAt: new Date().toISOString(),
      enrolledByOfficer: `${officerName} (${officerBadge})`,
      issuingAuthority: 'Gujarat Police State Command / CID Crime',
      warrantNumber: newWarrant || undefined,
      associatedVehicles: newVehicles ? newVehicles.split(',').map(s => s.trim().toUpperCase()) : [],
      legalNotice: 'STATUTORY NOTICE: Non-bailable arrest/surveillance bulletin under Section 63-65 BSA 2023.',
      statutoryBasis: 'Bharatiya Sakshya Adhiniyam, 2023 / Section 63-65 Sanctioned Order',
      activeMatchesCount: 0,
      referenceImages: [
        {
          imageId: `REF-IMG-${Date.now()}`,
          referenceUrl: newPhotoUrl,
          enrolledTimestamp: new Date().toISOString(),
          qualityScore: 0.92,
          sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
          enrolledCameraOrSource: 'HQ Direct Ingestion'
        }
      ]
    };

    faceWatchlistService.enrollTarget(newTarget);
    setIsEnrollModalOpen(false);
    setNewAlias('');
    setNewFullName('');
    setNewCaseId('');
    setNewWarrant('');
    setNewVehicles('');
    refreshData();
  };

  const handleLoadDossier = async (targetId: string) => {
    const d = await unifiedPersonInvestigationService.buildPersonDossier(targetId);
    if (d) {
      setActiveDossier(d);
      setActiveTab('DOSSIER');
    }
  };

  // Filtered lists
  const filteredCandidates = candidates.filter(c => {
    if (filterCategory !== 'ALL' && c.watchlistCategory !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.targetAlias.toLowerCase().includes(q) ||
        c.cameraId.toLowerCase().includes(q) ||
        c.locationName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredWatchlist = watchlist.filter(t => {
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.aliasName.toLowerCase().includes(q) ||
        (t.fullName && t.fullName.toLowerCase().includes(q)) ||
        t.caseId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = candidates.filter(c => c.status === 'WATCHLIST_CANDIDATE').length;
  const verifiedCount = candidates.filter(c => c.status === 'HUMAN_VERIFIED').length;
  const nasFiles = nasEvidenceStorageService.listStoredFiles();
  const clusterHealth = nasEvidenceStorageService.getClusterHealth();

  return (
    <div className="h-full flex flex-col bg-[#050811] text-zinc-100 font-sans select-none overflow-hidden">
      
      {/* 1. TOP STATUTORY BANNER & COMMAND HEADER */}
      <div className="flex-none p-3 sm:p-4 bg-zinc-900/95 border-b border-white/10 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
                <ScanFace size={18} />
              </span>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white font-mono uppercase">
                Statewide Biometric Face Watchlist & Person Intelligence
              </h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase font-mono">
                BSA 2023 GOVERNED
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Statutory Standard: <span className="text-zinc-200">Bharatiya Sakshya Adhiniyam, 2023 (Sections 63–65)</span> • Mandatory Human-in-the-Loop Officer Review
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-amber-300">
                {pendingCount} CANDIDATES PENDING
              </span>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-300">
                {verifiedCount} VERIFIED MATCHES
              </span>
            </div>
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2">
              <Shield size={13} className="text-blue-400" />
              <span className="text-xs font-mono font-bold text-blue-300">
                {watchlist.length} ENROLLED TARGETS
              </span>
            </div>
          </div>
        </div>

        {/* Absolute Legal Axiom Notice */}
        <div className="mt-2.5 p-2 bg-black/40 border border-amber-500/20 rounded-md text-[11px] text-amber-200/90 font-mono flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-400 flex-none" />
          <span>
            <strong>GOVERNMENT OPERATIONAL POLICY:</strong> A face detection is not an identity. A similarity score is not legal certainty. A watchlist candidate is not confirmation. Action requires signed human officer verification.
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('CANDIDATES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'CANDIDATES'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-zinc-800/80 text-zinc-400 border-white/5 hover:bg-zinc-700'
              }`}
            >
              <UserCheck size={14} />
              <span>Match Candidates ({candidates.length})</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-black text-[10px] rounded-full font-black">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ENROLLED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'ENROLLED'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                  : 'bg-zinc-800/80 text-zinc-400 border-white/5 hover:bg-zinc-700'
              }`}
            >
              <ScanFace size={14} />
              <span>Enrolled Targets ({watchlist.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('DOSSIER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'DOSSIER'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-800/80 text-zinc-400 border-white/5 hover:bg-zinc-700'
              }`}
            >
              <FileText size={14} />
              <span>Person Dossier</span>
            </button>

            <button
              onClick={() => setActiveTab('NAS_VAULT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'NAS_VAULT'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-zinc-800/80 text-zinc-400 border-white/5 hover:bg-zinc-700'
              }`}
            >
              <HardDrive size={14} />
              <span>Forensic NAS Vault</span>
            </button>
          </div>

          {activeTab === 'ENROLLED' && (
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1 shadow-md transition-all flex-none"
            >
              <Plus size={14} />
              <span>Enroll Target</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        
        {/* ============================================================ */}
        {/* TAB 1: MATCH CANDIDATES & HUMAN VERIFICATION                 */}
        {/* ============================================================ */}
        {activeTab === 'CANDIDATES' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900/60 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search size={16} className="text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter by target alias, camera ID, or location..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs font-mono text-white placeholder-zinc-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-zinc-400 font-mono">Category:</span>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-zinc-800 text-xs font-mono text-zinc-200 border border-white/10 rounded px-2.5 py-1 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SECTION_302_MURDER">Section 302 (Murder)</option>
                  <option value="ORGANIZED_CRIME">Organized Crime</option>
                  <option value="MISSING_PERSON">Missing Person</option>
                  <option value="CRITICAL_WANTED">Critical Wanted</option>
                </select>
              </div>
            </div>

            {/* Candidate Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCandidates.map(c => {
                const target = watchlist.find(t => t.targetId === c.watchlistTargetId);
                const isPending = c.status === 'WATCHLIST_CANDIDATE';
                const isVerified = c.status === 'HUMAN_VERIFIED';
                const isRejected = c.status === 'HUMAN_REJECTED';

                return (
                  <div
                    key={c.matchId}
                    className={`border rounded-xl p-4 transition-all ${
                      isPending
                        ? 'bg-amber-950/15 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                        : isVerified
                        ? 'bg-emerald-950/15 border-emerald-500/40'
                        : 'bg-zinc-900/60 border-white/10'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold font-mono text-white">
                            {c.targetAlias}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                            c.watchlistCategory.includes('302')
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {c.watchlistCategory.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {c.cameraName} • {new Date(c.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase tracking-wider border ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : isVerified
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Visual Comparison: CCTV Frame vs Enrolled Reference */}
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {/* Left: CCTV Observed Crop */}
                      <div className="bg-black/60 border border-white/10 rounded-lg p-2 flex flex-col items-center">
                        <span className="text-[10px] text-zinc-400 font-mono uppercase mb-1 flex items-center gap-1">
                          <Camera size={11} /> CCTV Observation Crop
                        </span>
                        <div className="w-full h-36 bg-zinc-950 rounded overflow-hidden flex items-center justify-center relative">
                          <img
                            src={target?.referenceImages[0]?.referenceUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60'}
                            alt="CCTV Face Crop"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                            {c.cameraId}
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-300 border border-amber-500/30">
                            Sim: {Math.round(c.similarityScore * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Right: Enrolled Reference Photo */}
                      <div className="bg-black/60 border border-white/10 rounded-lg p-2 flex flex-col items-center">
                        <span className="text-[10px] text-zinc-400 font-mono uppercase mb-1 flex items-center gap-1">
                          <Lock size={11} /> Police Enrolled Reference
                        </span>
                        <div className="w-full h-36 bg-zinc-950 rounded overflow-hidden flex items-center justify-center relative">
                          <img
                            src={target?.referenceImages[0]?.referenceUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60'}
                            alt="Enrolled Reference"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-purple-300 border border-purple-500/30">
                            {target?.caseId || 'ENROLLED'}
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-300 border border-emerald-500/30">
                            Quality: 94%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contributing Forensic Signals */}
                    <div className="mt-3 bg-black/30 border border-white/5 rounded-lg p-2.5 space-y-1.5">
                      <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold block mb-1">
                        Contributing Evidence Signals:
                      </span>
                      {c.contributingSignals.map((sig, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-300 flex items-center gap-1">
                            <Check size={12} className="text-emerald-400" />
                            {sig.signalName}:
                          </span>
                          <span className="text-zinc-400">{sig.value}</span>
                        </div>
                      ))}
                      {c.conflictingSignals.length > 0 && (
                        <div className="pt-1 border-t border-white/5">
                          <span className="text-[10px] text-amber-400 font-mono block">
                            Conflicting: {c.conflictingSignals.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Forensic NAS Vault & Hash Seal */}
                    <div className="mt-2.5 px-2.5 py-1.5 bg-zinc-950/80 border border-white/5 rounded text-[10px] font-mono text-zinc-400 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <HardDrive size={11} /> WORM NAS Path:
                        </span>
                        <span className="text-zinc-300 truncate max-w-[240px]">{c.evidenceNasPath}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Hash size={11} /> SHA-256 Seal:
                        </span>
                        <span className="text-zinc-500 font-mono">{c.sha256Hash.slice(0, 24)}...</span>
                      </div>
                    </div>

                    {/* Verification Footer / Actions */}
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <button
                        onClick={() => handleLoadDossier(c.watchlistTargetId)}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded flex items-center gap-1 transition-all"
                      >
                        <FileText size={13} />
                        <span>View Dossier</span>
                      </button>

                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setVerifyingCandidate(c)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded flex items-center gap-1 shadow-md transition-all"
                          >
                            <UserCheck size={14} />
                            <span>Review & Verify (BSA 2023)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                          <CheckCircle2 size={13} className={isVerified ? 'text-emerald-400' : 'text-rose-400'} />
                          <span>{c.verifyingOfficer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: ENROLLED TARGETS GALLERY                             */}
        {/* ============================================================ */}
        {activeTab === 'ENROLLED' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWatchlist.map(t => (
                <div key={t.targetId} className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold font-mono text-white">{t.aliasName}</h3>
                        {t.fullName && <p className="text-[11px] text-zinc-400 font-mono">{t.fullName}</p>}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                        t.threatLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {t.threatLevel}
                      </span>
                    </div>

                    <div className="w-full h-44 bg-zinc-950 rounded-lg overflow-hidden my-2 relative">
                      <img
                        src={t.referenceImages[0]?.referenceUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60'}
                        alt={t.aliasName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1.5 left-1.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300 border border-white/10">
                        {t.caseId}
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono text-zinc-300 mt-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Category:</span>
                        <span>{t.category.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Issuing Court:</span>
                        <span className="truncate max-w-[160px]">{t.issuingAuthority}</span>
                      </div>
                      {t.warrantNumber && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Warrant No:</span>
                          <span className="text-amber-400">{t.warrantNumber}</span>
                        </div>
                      )}
                      {t.associatedVehicles && t.associatedVehicles.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Linked Vehicles:</span>
                          <span className="text-cyan-400">{t.associatedVehicles.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400">
                      Matches: <strong className="text-white">{t.activeMatchesCount}</strong>
                    </span>
                    <button
                      onClick={() => handleLoadDossier(t.targetId)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono rounded flex items-center gap-1 transition-all"
                    >
                      <FileText size={12} />
                      <span>Full Dossier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PERSON DOSSIER & MULTI-MODAL TRAVERSAL               */}
        {/* ============================================================ */}
        {activeTab === 'DOSSIER' && activeDossier && (
          <div className="space-y-4">
            {/* Dossier Top Card */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                      FORENSIC PERSON DOSSIER #{activeDossier.dossierId}
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded border border-purple-500/30">
                      BSA 2023 CERTIFIED
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-mono text-white">
                    Subject: {activeDossier.personAlias}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Category: {activeDossier.category.replace(/_/g, ' ')} • Compiled by {activeDossier.compiledByRole}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setExportedCertificate({
                        id: activeDossier.dossierId,
                        hash: activeDossier.evidenceChain[0]?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                        notice: activeDossier.statutoryAdmissibilityNotice
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 shadow transition-all"
                  >
                    <Download size={14} />
                    <span>Electronic Evidence Package (BSA 2023)</span>
                  </button>
                </div>
              </div>

              {/* Traversal Summary Matrix */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Total Sightings</span>
                  <div className="text-lg font-mono font-bold text-white mt-1">
                    {activeDossier.totalObservations}
                  </div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Unique Cameras</span>
                  <div className="text-lg font-mono font-bold text-cyan-400 mt-1">
                    {activeDossier.uniqueCamerasVisited} Nodes
                  </div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Districts Traversed</span>
                  <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                    {activeDossier.districtsTraversed.join(', ')}
                  </div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Linked Vehicles</span>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                    {activeDossier.correlatedVehicles.length} Correlated
                  </div>
                </div>
              </div>

              {/* Correlated Vehicles Strip */}
              {activeDossier.correlatedVehicles.length > 0 && (
                <div className="mt-4 p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg">
                  <span className="text-xs font-mono font-bold text-blue-300 uppercase flex items-center gap-1 mb-2">
                    <Car size={14} /> Correlated Vehicles Co-Occurring with Subject
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeDossier.correlatedVehicles.map(v => (
                      <div key={v.plate} className="flex items-center justify-between p-2 bg-black/40 border border-white/5 rounded text-xs font-mono">
                        <div>
                          <span className="font-bold text-white">{v.plate}</span>
                          <span className="text-[10px] text-zinc-400 block">{v.lastCoOccurrenceCamera}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-bold">
                          Corr: {Math.round(v.correlationScore * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chronological Sighting Trajectory */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
                <Clock size={15} className="text-purple-400" />
                <span>Chronological Sighting Trajectory Timeline</span>
              </h3>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-white/10">
                {activeDossier.sightings.map((s, idx) => (
                  <div key={s.sightingId} className="relative pl-8">
                    <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-[#050811]" />
                    <div className="p-3 bg-black/40 border border-white/10 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-white">{s.cameraName}</span>
                          <span className="text-[11px] text-zinc-400 font-mono block">{s.location}</span>
                        </div>
                        <span className="text-xs font-mono text-purple-300">
                          {new Date(s.timestamp).toLocaleTimeString('en-IN')} IST
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] font-mono text-zinc-400 flex flex-wrap items-center gap-3">
                        <span>Quality: <strong className="text-white">{Math.round(s.qualityScore * 100)}%</strong></span>
                        {s.associatedPlate && <span>Vehicle: <strong className="text-cyan-400">{s.associatedPlate}</strong></span>}
                        <span>Evidence: <strong className="text-emerald-400">{s.evidenceId}</strong></span>
                        <span className="text-zinc-500 truncate max-w-[200px]">SHA: {s.sha256.slice(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: FORENSIC NAS VAULT & CLUSTER HEALTH                   */}
        {/* ============================================================ */}
        {activeTab === 'NAS_VAULT' && (
          <div className="space-y-4">
            {/* Cluster Health Card */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400">
                      <HardDrive size={18} />
                    </span>
                    <h2 className="text-base font-bold font-mono text-white">
                      State Government Forensic NAS Vault Cluster
                    </h2>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                      WORM IMMUTABILITY ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    Mount: <span className="text-zinc-200">/mnt/gov_secure_nas/evidence/cctv</span> • Redundancy: Ceph 3x Replicated • 7-Year Statutory Tamper Retention
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">
                    Active Nodes: <strong className="text-emerald-400">{clusterHealth.activeNodes}/3 Online</strong>
                  </span>
                </div>
              </div>

              {/* Storage Gauges */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Total Cluster Capacity</span>
                  <div className="text-xl font-mono font-bold text-white mt-1">
                    {clusterHealth.totalCapacityTB} TB
                  </div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Free Unallocated Storage</span>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                    {clusterHealth.freeCapacityTB} TB Available
                  </div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Encryption Standard</span>
                  <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
                    AES-256-GCM HW
                  </div>
                </div>
              </div>
            </div>

            {/* Tamper-Sealed Stored Files List */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
                <Lock size={15} className="text-emerald-400" />
                <span>WORM Tamper-Sealed Forensic Evidence Files</span>
              </h3>

              <div className="space-y-2">
                {nasFiles.map(f => (
                  <div key={f.fileId} className="p-3 bg-black/40 border border-white/10 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
                    <div>
                      <span className="font-bold text-white">{f.filename}</span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">{f.nasAbsolutePath}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                      <span>Size: <strong className="text-zinc-300">{(f.fileSizeBytes / 1024).toFixed(1)} KB</strong></span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={12} /> WORM Sealed
                      </span>
                      <span className="text-zinc-500 truncate max-w-[180px]">
                        SHA: {f.sha256Checksum.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: HUMAN OFFICER VERIFICATION (BSA 2023)                  */}
      {/* ============================================================ */}
      {verifyingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/50 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  BSA 2023 STATUTORY HUMAN VERIFICATION
                </span>
                <h2 className="text-base font-mono font-black text-white">
                  Verify Biometric Match: {verifyingCandidate.targetAlias}
                </h2>
              </div>
              <button
                onClick={() => setVerifyingCandidate(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-black/50 border border-white/10 rounded-lg text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Camera Observation:</span>
                <span className="text-white">{verifyingCandidate.cameraName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Cosine Similarity:</span>
                <span className="text-amber-300 font-bold">{Math.round(verifyingCandidate.similarityScore * 100)}% ({verifyingCandidate.confidenceBand})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Warrant Reference:</span>
                <span className="text-purple-300">{verifyingCandidate.watchlistCategory}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  Reviewing Officer Name:
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={e => setOfficerName(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  Officer Badge ID / Service Number:
                </label>
                <input
                  type="text"
                  value={officerBadge}
                  onChange={e => setOfficerBadge(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  Officer Verification Findings & Notes:
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                onClick={() => setVerifyingCandidate(null)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyCandidate('HUMAN_REJECTED')}
                disabled={isVerifying}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-mono font-bold rounded flex items-center gap-1"
              >
                <XCircle size={14} />
                <span>Reject Match</span>
              </button>
              <button
                onClick={() => handleVerifyCandidate('HUMAN_VERIFIED')}
                disabled={isVerifying}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded flex items-center gap-1 shadow-lg"
              >
                <CheckCircle2 size={14} />
                <span>{isVerifying ? 'Sealing...' : 'Confirm Verification (BSA 2023)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ENROLL NEW WATCHLIST TARGET                           */}
      {/* ============================================================ */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleEnrollSubmit} className="bg-zinc-900 border border-blue-500/50 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                  STATE SURVEILLANCE ENROLLMENT
                </span>
                <h2 className="text-base font-mono font-black text-white">
                  Enroll New Face Watchlist Target
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Subject Alias / Common Name *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salim Pathan"
                    value={newAlias}
                    onChange={e => setNewAlias(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Full Legal Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Salim Gulam Pathan"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Category:
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as FaceWatchlistCategory)}
                    className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  >
                    <option value="SECTION_302_MURDER">Section 302 (Murder)</option>
                    <option value="ORGANIZED_CRIME">Organized Crime Syndicate</option>
                    <option value="CRITICAL_WANTED">Critical Wanted Fugitive</option>
                    <option value="MISSING_PERSON">Missing Person Bulletin</option>
                    <option value="VIP_SECURITY">VIP Security Perimeter</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Threat Level:
                  </label>
                  <select
                    value={newThreat}
                    onChange={e => setNewThreat(e.target.value as any)}
                    className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  >
                    <option value="CRITICAL">Critical (P0 Intercept)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Case / FIR Number:
                  </label>
                  <input
                    type="text"
                    placeholder="FIR-2026-AHM-0892"
                    value={newCaseId}
                    onChange={e => setNewCaseId(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Warrant Number:
                  </label>
                  <input
                    type="text"
                    placeholder="NBW-2026-119"
                    value={newWarrant}
                    onChange={e => setNewWarrant(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  Associated Vehicles (comma-separated plates):
                </label>
                <input
                  type="text"
                  placeholder="GJ01AB9988, GJ05ZZ1234"
                  value={newVehicles}
                  onChange={e => setNewVehicles(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  Reference Photograph URL:
                </label>
                <input
                  type="text"
                  value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded flex items-center gap-1 shadow-md"
              >
                <Plus size={14} />
                <span>Enroll in Watchlist</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Electronic Evidence Integrity Package Modal */}
      {exportedCertificate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="text-emerald-400" size={20} />
                <h3 className="text-base font-bold font-mono text-white">
                  ELECTRONIC EVIDENCE INTEGRITY PACKAGE
                </h3>
              </div>
              <button
                onClick={() => setExportedCertificate(null)}
                className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
                <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold">
                  Statutory Admissibility Standard
                </span>
                <p className="text-xs font-mono text-zinc-300 mt-1 leading-relaxed">
                  Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023 / Sections 61, 62, 63, 65).
                  Designed for integration with applicable electronic-evidence procedures.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Dossier Reference ID:</label>
                <div className="p-2 bg-black/60 border border-white/10 rounded font-mono text-xs text-white">
                  {exportedCertificate.id}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  SHA-256 Integrity Verification Digest:
                </label>
                <div className="p-2 bg-black/60 border border-white/10 rounded font-mono text-xs text-emerald-400 break-all">
                  {exportedCertificate.hash}
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg">
                <span className="text-[10px] font-mono text-amber-400 uppercase block font-bold">
                  Forensic Chain-of-Custody Notice
                </span>
                <p className="text-[11px] font-mono text-zinc-400 mt-1 leading-relaxed">
                  IMPORTANT: SHA-256 is an integrity digest. SHA-256 is NOT a digital signature.
                  SHA-256 alone does NOT establish legal chain of custody. Formal admission requires
                  accompanying certificate signed by the responsible lawful custodian under BSA 2023.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                onClick={() => setExportedCertificate(null)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
