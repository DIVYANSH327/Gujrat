/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleRegistryTab: VAHAN 4.0 Vehicle Registry Query & Verification
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import React, { useState, useEffect } from 'react';
import { Search, Database, ShieldAlert, CheckCircle2, AlertTriangle, FileText, ToggleLeft, ToggleRight, Info, BookOpen, ChevronRight, HelpCircle, Tag, ShieldCheck } from 'lucide-react';
import { vahanIntelligenceAgent } from '../../ai-agents/police/VahanIntelligenceAgent';
import { VahanVehicleRecord, vahanAdapter } from '../../services/integrations/VahanAdapter';
import { vehicleRegistryKnowledgeService, VahanKnowledgeDoc } from '../../services/VehicleRegistryKnowledgeService';
import { normalizeLicensePlate } from '../../types';

export function VehicleRegistryTab() {
  const [queryPlate, setQueryPlate] = useState('GJ05AB1234');
  const [record, setRecord] = useState<VahanVehicleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // RAG Knowledge Layer State
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<VahanKnowledgeDoc[]>(() => vehicleRegistryKnowledgeService.getAllDocuments());
  const [selectedDoc, setSelectedDoc] = useState<VahanKnowledgeDoc | null>(null);

  const fetchRecord = async (plate: string) => {
    const normalized = normalizeLicensePlate(plate);
    if (!normalized) return;

    setIsLoading(true);
    try {
      const res = await vahanIntelligenceAgent.lookupVehicle(normalized, 'Command Center Duty Officer');
      setRecord(res);
    } catch (err) {
      console.error('VAHAN lookup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDemoMode = () => {
    const nextState = !isDemoMode;
    setIsDemoMode(nextState);
    vahanAdapter.setStatus(nextState ? 'SIMULATED' : 'FUTURE');
    fetchRecord(queryPlate);
  };

  const handleRagSearch = (query: string) => {
    setRagQuery(query);
    const res = vehicleRegistryKnowledgeService.queryKnowledgeBase(query);
    setRagResults(res.matchedDocs);
  };

  useEffect(() => {
    fetchRecord(queryPlate);
  }, []);

  return (
    <div className="space-y-6" id="vehicle-registry-tab">
      {/* Header card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-semibold">
                VAHAN 4.0 NATIONAL REGISTRY INTERFACE
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono border ${
                isDemoMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isDemoMode ? 'DEMO CONNECTOR ACTIVE (SYNTHETIC)' : 'STATUS: FUTURE AUTHORIZED INTEGRATION'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              State Transport Vehicle Registration Lookup
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Provides authorized vehicle registration verification, class validation, chassis / engine metadata, and RTO jurisdictional assignment.
            </p>
          </div>

          <button
            onClick={handleToggleDemoMode}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-all self-start md:self-auto"
            id="vahan-demo-toggle"
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
              placeholder="Enter registration plate (e.g. GJ05AB1234, GJ01AB1234)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
              id="vahan-plate-input"
            />
          </div>
          <button
            onClick={() => fetchRecord(queryPlate)}
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg font-mono flex items-center justify-center gap-2"
            id="vahan-search-btn"
          >
            <Search className="w-4 h-4" />
            <span>QUERY VAHAN</span>
          </button>
        </div>
      </div>

      {/* Result Dossier */}
      {record && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5" id="vahan-record-card">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-slate-400">REGISTRATION NUMBER</span>
              <h3 className="text-xl font-bold text-white font-mono tracking-wider">{record.registrationNumber}</h3>
            </div>
            <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
              record.registrationStatus === 'ACTIVE' 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {record.registrationStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <span className="text-[11px] font-mono text-slate-500 block">VEHICLE CLASS</span>
              <span className="text-sm font-bold text-white font-mono">{record.vehicleClass}</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <span className="text-[11px] font-mono text-slate-500 block">MAKE & MODEL</span>
              <span className="text-sm font-bold text-white font-mono">{record.make} {record.model}</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <span className="text-[11px] font-mono text-slate-500 block">BODY COLOR</span>
              <span className="text-sm font-bold text-white font-mono">{record.color}</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <span className="text-[11px] font-mono text-slate-500 block">FUEL TYPE</span>
              <span className="text-sm font-bold text-white font-mono">{record.fuelType}</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <span className="text-[11px] font-mono text-slate-500 block">RTO JURISDICTION</span>
              <span className="text-sm font-bold text-white font-mono">{record.rto || 'RTO Gujarat'}</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <span className="text-[11px] font-mono text-slate-500 block">SPECIAL FLAG</span>
              <span className={`text-sm font-bold font-mono ${
                record.flagStatus?.includes('WANTED') ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {record.flagStatus || 'STANDARD'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-lg flex items-start gap-2.5 text-xs font-mono text-slate-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-semibold block">{record.disclaimer}</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Retrieved at: {new Date(record.retrievedAt).toLocaleString()} | Source: {record.source}</span>
            </div>
          </div>
        </div>
      )}

      {/* VAHAN Documentation & RAG Knowledge Reference Layer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4" id="vahan-rag-knowledge-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              VAHAN RAG Knowledge & Technical Schema Reference
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/40">
            AUTHORITATIVE SPECIFICATIONS LAYER
          </span>
        </div>

        <p className="text-xs text-slate-400 font-mono">
          Search MoRTH Central Motor Vehicles Rules, VAHAN 4.0 technical schema fields, VIN ISO 3779 decoding standards, and DPDP privacy governance policies.
        </p>

        {/* RAG Query Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => handleRagSearch(e.target.value)}
              placeholder="Search VAHAN schemas & field definitions (e.g. chassis, fitness, rc_status, hsrp, hypothecation)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              id="vahan-rag-input"
            />
          </div>
          {ragQuery && (
            <button
              onClick={() => handleRagSearch('')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
          <span className="text-slate-500 py-0.5">Quick specs:</span>
          {['HSRP CMV Rule 50', 'Chassis / VIN ISO 3779', 'RC Status Lifecycle', 'Fitness Validity', 'Hypothecation Lien'].map((chip) => (
            <button
              key={chip}
              onClick={() => handleRagSearch(chip.split(' ')[0])}
              className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[10px] transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Knowledge Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {ragResults.map((doc) => (
            <div
              key={doc.docId}
              onClick={() => setSelectedDoc(selectedDoc?.docId === doc.docId ? null : doc)}
              className={`p-3.5 bg-slate-950 border rounded-lg cursor-pointer transition-all ${
                selectedDoc?.docId === doc.docId
                  ? 'border-cyan-500 ring-1 ring-cyan-500/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {doc.category}
                </span>
                {doc.fieldName && (
                  <span className="text-[10px] font-mono text-cyan-400">
                    Field: <code className="text-cyan-300 font-bold">{doc.fieldName}</code>
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white font-mono mt-2">{doc.title}</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                {doc.description}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="truncate max-w-[200px]">{doc.authorityReference}</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-0.5">
                  {selectedDoc?.docId === doc.docId ? 'Expanded' : 'Details'} <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Doc Modal / Expanded Detail */}
        {selectedDoc && (
          <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-lg space-y-2.5 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300">{selectedDoc.title}</span>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-950 text-cyan-400 rounded border border-cyan-800">
                {selectedDoc.docId}
              </span>
            </div>
            <p className="text-slate-200 font-sans text-xs leading-relaxed">{selectedDoc.description}</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-900 text-slate-400">
              <div>
                <span className="text-slate-500 block">AUTHORITY STANDARD</span>
                <span className="text-slate-200">{selectedDoc.authorityReference}</span>
              </div>
              <div>
                <span className="text-slate-500 block">CLEARANCE REQUIRED</span>
                <span className="text-slate-200">{selectedDoc.securityClearanceRequired}</span>
              </div>
              {selectedDoc.dataType && (
                <div>
                  <span className="text-slate-500 block">DATA TYPE</span>
                  <span className="text-slate-200">{selectedDoc.dataType}</span>
                </div>
              )}
              {selectedDoc.exampleValue && (
                <div>
                  <span className="text-slate-500 block">EXAMPLE VALUE</span>
                  <span className="text-emerald-400">{selectedDoc.exampleValue}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
