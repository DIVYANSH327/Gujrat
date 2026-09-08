/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ForensicIntegrationTab: Automated Fingerprint & Biometric System (AFIS) Interface
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import React, { useState } from 'react';
import { Fingerprint, ShieldAlert, Lock, AlertTriangle, CheckCircle2, FileText, Info, ExternalLink, UserCheck } from 'lucide-react';
import { forensicBiometricsAgent } from '../../ai-agents/police/ForensicBiometricsAgent';
import { BiometricCandidateMatch } from '../../services/integrations/AFISAdapter';

export function ForensicIntegrationTab() {
  const [embeddingRef, setEmbeddingRef] = useState('EMBED-CORR-SCENARIO-P002');
  const [matchResult, setMatchResult] = useState<BiometricCandidateMatch | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleQuery = async () => {
    setIsQuerying(true);
    try {
      const res = await forensicBiometricsAgent.evaluateVisualCorrelation(embeddingRef, 'Forensic Officer Inspector Dave');
      setMatchResult(res);
    } catch (err) {
      console.error('AFIS query error:', err);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6" id="forensic-integration-tab">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-semibold">
                ISOLATED FORENSIC INTERFACE (DFS GANDHINAGAR)
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                STATUS: FUTURE AUTHORIZED INTEGRATION
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-purple-400" />
              Automated Fingerprint & Forensic Biometrics Integration (AFIS)
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Strictly non-autonomous post-incident forensic correlation. The grid performs Person Visual Correlation only; autonomous identity determination is explicitly prohibited without forensic officer review.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-950/40 px-3.5 py-2 rounded-lg border border-amber-500/30">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>AIR-GAPPED PROTOCOL</span>
          </div>
        </div>
      </div>

      {/* Ethical Safeguards Box */}
      <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs font-mono text-amber-200">
          <span className="font-bold uppercase tracking-wider block">STATUTORY ETHICAL & LEGAL PRINCIPLE</span>
          <p className="font-sans text-amber-300/90 leading-relaxed">
            1. All CCTV camera detections represent <strong>PERSON VISUAL CORRELATIONS</strong> (clothing color, movement vectors, optical track IDs), NOT verified biometric identities.<br/>
            2. The AFIS interface remains strictly isolated for post-incident judicial evidence verification.<br/>
            3. Automated criminal matching without magistrate approval is prohibited by departmental policy.
          </p>
        </div>
      </div>

      {/* Candidate Correlation Tester */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-purple-400" />
          Forensic Visual Embedding Candidate Correlation Tester
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={embeddingRef}
            onChange={(e) => setEmbeddingRef(e.target.value)}
            placeholder="Enter synthetic person track reference..."
            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
            id="afis-embedding-input"
          />
          <button
            onClick={handleQuery}
            disabled={isQuerying}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-mono font-bold rounded-lg flex items-center justify-center gap-2"
            id="afis-query-btn"
          >
            <Fingerprint className="w-4 h-4" />
            <span>REQUEST CORRELATION</span>
          </button>
        </div>

        {matchResult && (
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 font-mono text-xs" id="afis-result-card">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">CANDIDATE ALIAS</span>
              <span className="text-purple-400 font-bold">{matchResult.candidateAlias}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">INTEGRATION STATE</span>
              <span className="text-slate-300">{matchResult.biometricMatchStatus}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">HUMAN VERIFICATION REQUIRED</span>
              <span className="text-amber-400 font-bold">YES (MANDATORY)</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-300 text-[11px] leading-relaxed">
              {matchResult.ethicalNotice}
            </div>
            <p className="text-[10px] text-slate-500">{matchResult.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
