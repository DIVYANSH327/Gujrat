/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * PoliceRecordsTab: eGujCop / CCTNS FIR, Warrant, and BOLO Query Portal
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, AlertTriangle, FileText, ToggleLeft, ToggleRight, Building, User, Calendar, Info } from 'lucide-react';
import { policeRecordsIntelligenceAgent } from '../../ai-agents/police/PoliceRecordsIntelligenceAgent';
import { PoliceRecordsResult, egujcopAdapter } from '../../services/integrations/EGujCopAdapter';
import { normalizeLicensePlate } from '../../types';

export function PoliceRecordsTab() {
  const [queryTarget, setQueryTarget] = useState('GJ05AB1234');
  const [result, setResult] = useState<PoliceRecordsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchRecords = async (target: string) => {
    const normalized = normalizeLicensePlate(target);
    if (!normalized) return;

    setIsLoading(true);
    try {
      const res = await policeRecordsIntelligenceAgent.lookupPoliceRecords(normalized, 'Crime Branch Duty Officer');
      setResult(res);
    } catch (err) {
      console.error('Police records lookup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDemoMode = () => {
    const nextState = !isDemoMode;
    setIsDemoMode(nextState);
    egujcopAdapter.setStatus(nextState ? 'SIMULATED' : 'FUTURE');
    fetchRecords(queryTarget);
  };

  useEffect(() => {
    fetchRecords(queryTarget);
  }, []);

  return (
    <div className="space-y-6" id="police-records-tab">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-semibold">
                eGujCop / CCTNS CORE POLICE RECORDS
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono border ${
                isDemoMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isDemoMode ? 'DEMO CONNECTOR ACTIVE (SYNTHETIC)' : 'STATUS: FUTURE AUTHORIZED INTEGRATION'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              State Crime Records & Law Enforcement Case Cross-Match
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Correlates active First Information Reports (FIRs), non-bailable warrants, Be-On-The-Lookout (BOLO) alerts, and vehicle theft cases across all 33 Gujarat police districts.
            </p>
          </div>

          <button
            onClick={handleToggleDemoMode}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-all self-start md:self-auto"
            id="egujcop-demo-toggle"
          >
            {isDemoMode ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
            <span>{isDemoMode ? 'Demo Data Mode: ON' : 'Demo Data Mode: OFF (Default)'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={queryTarget}
              onChange={(e) => setQueryTarget(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecords(queryTarget)}
              placeholder="Enter registration plate or subject ID (e.g. GJ05AB1234)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-rose-500"
              id="police-records-query-input"
            />
          </div>
          <button
            onClick={() => fetchRecords(queryTarget)}
            disabled={isLoading}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg font-mono flex items-center justify-center gap-2"
            id="police-records-search-btn"
          >
            <Search className="w-4 h-4" />
            <span>QUERY POLICE RECORDS</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5" id="police-records-result-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-slate-400">QUERY TARGET IDENTIFIER</span>
              <h3 className="text-xl font-bold text-white font-mono tracking-wider">{result.queryTarget}</h3>
            </div>
            <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
              result.recordsFound > 0 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {result.recordsFound} ACTIVE RECORD(S)
            </span>
          </div>

          {result.records.length > 0 ? (
            <div className="space-y-3">
              {result.records.map((rec, idx) => (
                <div key={rec.recordId || idx} className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        {rec.category}
                      </span>
                      <span className="text-sm font-bold text-white font-mono">{rec.firNumber || rec.recordId}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Issued: {new Date(rec.date).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 font-sans leading-relaxed">
                    {rec.details}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500">POLICE STATION: </span>
                      <span className="text-slate-200">{rec.policeStation}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">DISTRICT: </span>
                      <span className="text-slate-200">{rec.district || 'Statewide'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">SEVERITY: </span>
                      <span className="text-rose-400 font-bold">{rec.severity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-lg text-center">
              <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-semibold text-white font-mono">No Active Criminal or Interception Records Found</h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">{result.disclaimer}</p>
            </div>
          )}

          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-lg flex items-start gap-2.5 text-xs font-mono text-slate-400">
            <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-semibold block">{result.disclaimer}</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Retrieved at: {new Date(result.retrievedAt).toLocaleString()} | Source: {result.source}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
