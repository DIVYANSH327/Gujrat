/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * EChallanTab: Gujarat Traffic Police eChallan Enforcement & Violations View
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle2, FileText, ToggleLeft, ToggleRight, DollarSign, Calendar, MapPin, Info } from 'lucide-react';
import { echallanIntelligenceAgent } from '../../ai-agents/police/EChallanIntelligenceAgent';
import { EChallanRecord, echallanAdapter } from '../../services/integrations/EChallanAdapter';
import { normalizeLicensePlate } from '../../types';

export function EChallanTab() {
  const [queryPlate, setQueryPlate] = useState('GJ05AB1234');
  const [record, setRecord] = useState<EChallanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchRecord = async (plate: string) => {
    const normalized = normalizeLicensePlate(plate);
    if (!normalized) return;

    setIsLoading(true);
    try {
      const res = await echallanIntelligenceAgent.lookupChallans(normalized, 'Traffic Enforcement Officer');
      setRecord(res);
    } catch (err) {
      console.error('eChallan lookup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDemoMode = () => {
    const nextState = !isDemoMode;
    setIsDemoMode(nextState);
    echallanAdapter.setStatus(nextState ? 'SIMULATED' : 'FUTURE');
    fetchRecord(queryPlate);
  };

  useEffect(() => {
    fetchRecord(queryPlate);
  }, []);

  return (
    <div className="space-y-6" id="echallan-tab">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-semibold">
                GUJARAT ECHALLAN ENFORCEMENT GATEWAY
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono border ${
                isDemoMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isDemoMode ? 'DEMO CONNECTOR ACTIVE (SYNTHETIC)' : 'STATUS: FUTURE AUTHORIZED INTEGRATION'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Traffic Violations & eChallan Recovery Portal
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Integrates with state traffic eChallan servers to cross-reference red light jumping, overspeeding, stop line crossing, and helmet infractions.
            </p>
          </div>

          <button
            onClick={handleToggleDemoMode}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-all self-start md:self-auto"
            id="echallan-demo-toggle"
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
              value={queryPlate}
              onChange={(e) => setQueryPlate(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecord(queryPlate)}
              placeholder="Enter vehicle registration number (e.g. GJ05AB1234)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
              id="echallan-plate-input"
            />
          </div>
          <button
            onClick={() => fetchRecord(queryPlate)}
            disabled={isLoading}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg font-mono flex items-center justify-center gap-2"
            id="echallan-search-btn"
          >
            <Search className="w-4 h-4" />
            <span>QUERY CHALLANS</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {record && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5" id="echallan-record-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-slate-400">VEHICLE IDENTIFIER</span>
              <h3 className="text-xl font-bold text-white font-mono tracking-wider">{record.vehicleNumber}</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block">TOTAL OUTSTANDING</span>
                <span className="text-lg font-bold font-mono text-amber-400">₹{record.totalOutstandingAmount.toLocaleString()}</span>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
                record.pendingChallans > 0 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {record.pendingChallans} PENDING
              </span>
            </div>
          </div>

          {record.recentViolations.length > 0 ? (
            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase font-semibold block">
                Recorded Violation Items ({record.recentViolations.length})
              </span>
              {record.recentViolations.map((v, idx) => (
                <div key={v.challanNumber || idx} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">{v.challanNumber}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                        {v.violationType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{v.location}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(v.date).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-bold font-mono text-amber-400">
                      ₹{v.amount}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-lg text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-semibold text-white font-mono">No Pending Violations Recorded</h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">{record.disclaimer}</p>
            </div>
          )}

          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-lg flex items-start gap-2.5 text-xs font-mono text-slate-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-semibold block">{record.disclaimer}</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Retrieved at: {new Date(record.retrievedAt).toLocaleString()} | Source: {record.source}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
