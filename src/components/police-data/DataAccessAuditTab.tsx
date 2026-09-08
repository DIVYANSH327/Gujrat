/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * DataAccessAuditTab: Real-Time Transparent Data Access Audit Log
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Download, Trash2, Filter, Activity, Clock, CheckCircle2, Lock } from 'lucide-react';
import { dataAccessAuditService, DataAccessAuditRecord } from '../../services/DataAccessAuditService';

export function DataAccessAuditTab() {
  const [logs, setLogs] = useState<DataAccessAuditRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');

  const refreshLogs = () => {
    setLogs(dataAccessAuditService.getLogs());
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.identifier.toUpperCase().includes(searchQuery.toUpperCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.correlationId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAgent = selectedAgent === 'ALL' || l.agent === selectedAgent;
    return matchesSearch && matchesAgent;
  });

  const exportAuditReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `POLICE_DATA_ACCESS_AUDIT_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6" id="data-access-audit-tab">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">
                STATUTORY AUDIT & COMPLIANCE
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {logs.length} RECORDED TRANSACTIONS
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Transparent External Data Access & Query Audit Trail
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Immutable logging of every vehicle registry query, eChallan lookup, eGujCop FIR search, and AFIS correlation with operator credentials, timestamp, and cryptographic correlation tokens. Zero credential exposure.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={exportAuditReport}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 flex items-center gap-1.5"
              id="export-audit-btn"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit JSON</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit by plate, action, operator, correlation ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
              id="audit-search-input"
            />
          </div>

          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            id="audit-agent-filter"
          >
            <option value="ALL">All AI Agents</option>
            <option value="ANPRAgent">ANPRAgent</option>
            <option value="VahanIntelligenceAgent">VahanIntelligenceAgent</option>
            <option value="EChallanIntelligenceAgent">EChallanIntelligenceAgent</option>
            <option value="PoliceRecordsIntelligenceAgent">PoliceRecordsIntelligenceAgent</option>
            <option value="VehicleCorrelationAgent">VehicleCorrelationAgent</option>
            <option value="ForensicBiometricsAgent">ForensicBiometricsAgent</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-3.5">TIMESTAMP</th>
                <th className="p-3.5">AGENT</th>
                <th className="p-3.5">ACTION</th>
                <th className="p-3.5">IDENTIFIER</th>
                <th className="p-3.5">OPERATOR</th>
                <th className="p-3.5">RESULT</th>
                <th className="p-3.5">CORRELATION ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/40 transition-all">
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3.5 font-bold text-white whitespace-nowrap">
                    {log.agent}
                  </td>
                  <td className="p-3.5 text-emerald-400 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="p-3.5 font-bold text-white whitespace-nowrap">
                    {log.identifier}
                  </td>
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">
                    {log.operator}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      log.result === 'RECORD_FOUND' || log.result === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {log.result}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                    {log.correlationId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
