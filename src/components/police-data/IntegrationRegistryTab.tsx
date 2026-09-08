/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * IntegrationRegistryTab: Statewide Government & Vendor Integration Node Registry
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import React, { useState } from 'react';
import { Layers, ShieldCheck, CheckCircle2, AlertTriangle, Activity, Database, ToggleLeft, ToggleRight, Server, Key, Radio } from 'lucide-react';
import { policeDataIntegrationRegistry, PoliceIntegrationNode } from '../../services/PoliceDataIntegrationRegistry';

export function IntegrationRegistryTab() {
  const [integrations, setIntegrations] = useState<PoliceIntegrationNode[]>(
    policeDataIntegrationRegistry.getAllIntegrations()
  );

  const handleToggle = (code: any, currentStatus: string) => {
    const enableSim = currentStatus !== 'SIMULATED';
    policeDataIntegrationRegistry.toggleSimulationMode(code, enableSim);
    setIntegrations(policeDataIntegrationRegistry.getAllIntegrations());
  };

  return (
    <div className="space-y-6" id="integration-registry-tab">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">
                SYSTEM INTEGRATION REGISTRY V1.2
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {integrations.length} CONFIGURED ADAPTERS
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Statewide Interoperability & External Gateway Registry
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Inspect connector health, data classifications, mutual TLS authentication readiness, and adapter interfaces for state transport, traffic enforcement, police records, and CCTV edge hardware.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of integration cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((node) => {
          const isSimulated = node.status === 'SIMULATED';
          const isConnected = node.status === 'CONNECTED';
          const isFuture = node.status === 'FUTURE_AUTHORIZED_INTEGRATION';

          return (
            <div
              key={node.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-lg"
              id={`integration-card-${node.code}`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {node.category}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1 font-mono">{node.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : isSimulated
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {node.status}
                  </span>
                </div>

                {/* Purpose */}
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {node.purpose}
                </p>

                {/* Metadata */}
                <div className="space-y-1.5 text-xs font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">PROTOCOL:</span>
                    <span className="text-slate-300">{node.protocol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">AUTH STATE:</span>
                    <span className="text-emerald-400">{node.authenticationState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CLASSIFICATION:</span>
                    <span className="text-amber-400">{node.dataClassification}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DEPARTMENT:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{node.department}</span>
                  </div>
                </div>

                {/* Operations */}
                <div>
                  <span className="text-[11px] font-mono text-slate-500 block mb-1">AVAILABLE INTERFACES:</span>
                  <div className="flex flex-wrap gap-1">
                    {node.availableOperations.map((op, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {op}()
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                {(node.code === 'VAHAN' || node.code === 'ECHALLAN' || node.code === 'EGUJCOP') ? (
                  <button
                    onClick={() => handleToggle(node.code, node.status)}
                    className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white"
                  >
                    {isSimulated ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                    <span>{isSimulated ? 'Simulation Sandbox' : 'Future Mode'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-slate-500">
                    {node.code === 'AFIS' ? 'Air-Gapped Interface' : 'Hardware Direct Adapter'}
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(node.lastHealthCheck).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
