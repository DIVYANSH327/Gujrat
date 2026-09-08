/**
 * Copyright © 2026 DIVYANSH Shrivastava.
 * All Rights Reserved.
 * 
 * In-App About & Project Information Presentation Panel
 */

import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Cpu, 
  Hash, 
  Award, 
  Layers, 
  Info, 
  Copy, 
  Check, 
  X, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { PROJECT_IDENTITY } from '../branding';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'authorship' | 'integrity' | 'license'>('overview');

  if (!isOpen) return null;

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(PROJECT_IDENTITY.releaseIntegrityHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#090d16] border border-cyan-500/40 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-zinc-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-cyan-950/80 bg-[#060910] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-900/60 to-blue-950 rounded-lg border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  SYSTEM INFORMATION & ABOUT
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  ID: {PROJECT_IDENTITY.id}
                </span>
              </div>
              <h2 className="text-base font-bold text-zinc-100 font-mono tracking-tight">
                {PROJECT_IDENTITY.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 bg-[#0b0f19] border-b border-white/5 overflow-x-auto text-xs font-mono shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Info size={14} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('authorship')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'authorship'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Award size={14} />
            <span>Authorship & Ownership</span>
          </button>

          <button
            onClick={() => setActiveTab('integrity')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'integrity'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Hash size={14} />
            <span>Project Integrity & Build</span>
          </button>

          <button
            onClick={() => setActiveTab('license')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'license'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <FileText size={14} />
            <span>Proprietary License</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs font-sans">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-[#050811] border border-cyan-950/80 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <Layers size={16} className="text-cyan-400" />
                  Presentation & System Summary
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  {PROJECT_IDENTITY.tagline}
                </p>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Engineered with an end-to-end edge-to-central pipeline supporting DVR/NVR/VMS hardware normalization, ONVIF/RTSP streaming, localized CV inference, and multi-camera person trajectory tracking in God's Eye view.
                </p>
              </div>

              {/* Structured Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                <div className="bg-[#060a14] border border-zinc-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">PROJECT</div>
                  <div className="text-zinc-100 font-bold">{PROJECT_IDENTITY.name}</div>
                </div>

                <div className="bg-[#060a14] border border-zinc-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">AUTHOR</div>
                  <div className="text-cyan-300 font-bold">{PROJECT_IDENTITY.author}</div>
                </div>

                <div className="bg-[#060a14] border border-zinc-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">ROLE</div>
                  <div className="text-zinc-200">{PROJECT_IDENTITY.role}</div>
                </div>

                <div className="bg-[#060a14] border border-zinc-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">COPYRIGHT</div>
                  <div className="text-zinc-200">{PROJECT_IDENTITY.copyright}</div>
                </div>

                <div className="bg-[#060a14] border border-zinc-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">LICENSE</div>
                  <div className="text-amber-400 font-semibold">{PROJECT_IDENTITY.license} (Evaluation & Demo)</div>
                </div>

                <div className="bg-[#060a14] border border-zinc-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">VERSION & BUILD</div>
                  <div className="text-emerald-400 font-semibold">{PROJECT_IDENTITY.version} • {PROJECT_IDENTITY.buildId}</div>
                </div>
              </div>

              {/* Demonstration Notice Box */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3.5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                    Demonstration & Synthetic Data Notice
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    {PROJECT_IDENTITY.demonstrationNotice}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTHORSHIP */}
          {activeTab === 'authorship' && (
            <div className="space-y-4">
              <div className="bg-[#050811] border border-cyan-950/80 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-cyan-400" />
                  <h3 className="text-sm font-bold text-zinc-100 font-mono">
                    Project Authorship & Engineering Attribution
                  </h3>
                </div>

                <div className="p-4 bg-[#080d1a] border border-cyan-900/40 rounded-lg space-y-2 font-mono">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                    <span className="text-zinc-500">PROJECT AUTHOR</span>
                    <span className="text-cyan-300 font-bold text-sm">{PROJECT_IDENTITY.author}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                    <span className="text-zinc-500">ENGINEERING ROLE</span>
                    <span className="text-zinc-200">{PROJECT_IDENTITY.conceptAndEngineering}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                    <span className="text-zinc-500">PROJECT OWNERSHIP</span>
                    <span className="text-zinc-200 font-semibold">{PROJECT_IDENTITY.ownershipNotice}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-zinc-500">PROJECT STATUS</span>
                    <span className="text-amber-400 font-semibold">{PROJECT_IDENTITY.projectStatus}</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  This platform was conceived, architected, and engineered by <strong>{PROJECT_IDENTITY.author}</strong> as a complete demonstration system for multi-camera video stream ingestion, edge-agent distributed processing, and cross-camera corridor tracking.
                </p>
              </div>

              {/* Third-Party Acknowledgments */}
              <div className="bg-[#060a14] border border-zinc-800 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                  Third-Party Software & Specifications
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {PROJECT_IDENTITY.thirdPartyNotice}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRITY & BUILD */}
          {activeTab === 'integrity' && (
            <div className="space-y-4">
              <div className="bg-[#050811] border border-cyan-950/80 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Hash size={18} className="text-cyan-400" />
                  <h3 className="text-sm font-bold text-zinc-100 font-mono">
                    Tamper-Evident Project Identity & Build Verification
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="bg-[#080d1a] border border-cyan-900/30 rounded p-3">
                    <span className="text-[10px] text-zinc-500 block uppercase">PROJECT IDENTITY</span>
                    <span className="text-cyan-300 font-bold">{PROJECT_IDENTITY.id}</span>
                  </div>
                  <div className="bg-[#080d1a] border border-cyan-900/30 rounded p-3">
                    <span className="text-[10px] text-zinc-500 block uppercase">VERSION</span>
                    <span className="text-zinc-200 font-bold">{PROJECT_IDENTITY.version}</span>
                  </div>
                  <div className="bg-[#080d1a] border border-cyan-900/30 rounded p-3">
                    <span className="text-[10px] text-zinc-500 block uppercase">BUILD ID</span>
                    <span className="text-emerald-400 font-bold">{PROJECT_IDENTITY.buildId}</span>
                  </div>
                  <div className="bg-[#080d1a] border border-cyan-900/30 rounded p-3">
                    <span className="text-[10px] text-zinc-500 block uppercase">INTEGRITY ALGORITHM</span>
                    <span className="text-zinc-200 font-bold">{PROJECT_IDENTITY.integrityAlgorithm}</span>
                  </div>
                </div>

                {/* Release Integrity Hash Card */}
                <div className="bg-[#080d1a] border border-cyan-500/30 rounded-lg p-3.5 space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        {PROJECT_IDENTITY.integrityLabel}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                      SHA-256 DIGEST
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#04060b] border border-zinc-800 rounded flex items-center justify-between gap-2 overflow-hidden">
                    <code className="text-[11px] text-cyan-300 font-mono truncate select-all">
                      {PROJECT_IDENTITY.releaseIntegrityHash}
                    </code>
                    <button
                      onClick={handleCopyHash}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 hover:text-white transition-colors shrink-0 flex items-center gap-1 text-[10px]"
                      title="Copy Release Hash"
                    >
                      {copiedHash ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedHash ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                    <strong>Integrity Notice:</strong> {PROJECT_IDENTITY.integrityPurpose}. This hash validates that the distributed build artifact has not been modified or tampered with.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LICENSE */}
          {activeTab === 'license' && (
            <div className="space-y-4">
              <div className="bg-[#050811] border border-cyan-950/80 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-zinc-100 font-mono">
                    Proprietary Software License Terms
                  </h3>
                </div>

                <div className="p-4 bg-[#080d1a] border border-zinc-800 rounded-lg font-mono text-[11px] text-zinc-300 space-y-3 leading-relaxed">
                  <div className="font-bold text-amber-300 pb-2 border-b border-white/10">
                    Copyright © 2026 {PROJECT_IDENTITY.author}. All rights reserved.
                  </div>

                  <p>
                    This software is proprietary demonstration software authored and engineered by {PROJECT_IDENTITY.author}.
                  </p>

                  <div className="space-y-1">
                    <div className="text-zinc-400 font-semibold">1. Evaluation & Demonstration Grant:</div>
                    <p className="text-zinc-400 pl-2">
                      Permission is granted to use, run, and evaluate this software solely for authorized evaluation, demonstration, hackathon judging, and academic review.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-zinc-400 font-semibold">2. Express Restrictions:</div>
                    <p className="text-zinc-400 pl-2">
                      Unless expressly authorized in writing by the copyright owner, users may not copy, redistribute, publish source code, create derivative works, commercially exploit, remove attribution notices, or present this software as their own work.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 font-mono">
                  Full license text is provided in the repository root in <span className="text-zinc-300 font-bold">LICENSE.txt</span>.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-cyan-950/80 bg-[#060910] flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 font-mono text-[11px]">
          <div className="text-zinc-400 flex items-center gap-2">
            <span className="text-cyan-400 font-semibold">{PROJECT_IDENTITY.madeBy}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{PROJECT_IDENTITY.copyright}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-200 font-bold rounded transition-colors text-xs cursor-pointer"
          >
            DISMISS
          </button>
        </div>

      </div>
    </div>
  );
}
