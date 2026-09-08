/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * PoliceDataIntelligence: Top-Level Police Data Intelligence Mesh
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import React, { useState } from 'react';
import { 
  Car, 
  Database, 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  Fingerprint, 
  Layers, 
  ShieldCheck, 
  Activity,
  Radio,
  FileText
} from 'lucide-react';
import { VehicleIntelligenceTab } from './police-data/VehicleIntelligenceTab';
import { VehicleRegistryTab } from './police-data/VehicleRegistryTab';
import { EChallanTab } from './police-data/EChallanTab';
import { PoliceRecordsTab } from './police-data/PoliceRecordsTab';
import { WatchlistIntelTab } from './police-data/WatchlistIntelTab';
import { ForensicIntegrationTab } from './police-data/ForensicIntegrationTab';
import { IntegrationRegistryTab } from './police-data/IntegrationRegistryTab';
import { DataAccessAuditTab } from './police-data/DataAccessAuditTab';
import { VehicleDossierView } from './police-data/VehicleDossierView';
import { vehicleDossierService } from '../services/VehicleDossierService';

export type PoliceDataSubView = 
  | 'v21_dossier'
  | 'vehicle_intel' 
  | 'vehicle_registry' 
  | 'echallan' 
  | 'police_records' 
  | 'watchlist_intel' 
  | 'forensic_afis' 
  | 'integrations' 
  | 'audit_log';

interface PoliceDataIntelligenceProps {
  initialSubView?: PoliceDataSubView;
  initialPlate?: string;
  onNavigateToGodsEye?: (plate: string) => void;
  onSelectCameraId?: (cameraId: string) => void;
}

export function PoliceDataIntelligence({
  initialSubView = 'v21_dossier',
  initialPlate = 'GJ05AB1234',
  onNavigateToGodsEye,
  onSelectCameraId
}: PoliceDataIntelligenceProps) {
  const [activeSubView, setActiveSubView] = useState<PoliceDataSubView>(initialSubView);
  const [activeDossierPlate, setActiveDossierPlate] = useState(initialPlate);

  const subNavItems = [
    { id: 'v21_dossier', label: 'V2.1 Master Dossier', icon: FileText, tag: 'NEW V2.1 MESH' },
    { id: 'vehicle_intel', label: 'Vehicle Intelligence', icon: Car, tag: 'ANPR + MESH' },
    { id: 'vehicle_registry', label: 'Vehicle Registry', icon: Database, tag: 'VAHAN 4.0' },
    { id: 'echallan', label: 'eChallan Intelligence', icon: AlertTriangle, tag: 'TRAFFIC FINES' },
    { id: 'police_records', label: 'Police Records', icon: ShieldAlert, tag: 'eGujCop / CCTNS' },
    { id: 'watchlist_intel', label: 'Watchlist Intelligence', icon: Eye, tag: 'TARGET TRACK' },
    { id: 'forensic_afis', label: 'Forensic Integration', icon: Fingerprint, tag: 'AFIS / DFS' },
    { id: 'integrations', label: 'Integration Registry', icon: Layers, tag: 'GATEWAYS' },
    { id: 'audit_log', label: 'Data Access Audit', icon: ShieldCheck, tag: 'COMPLIANCE' }
  ];

  return (
    <div className="space-y-6" id="police-data-intelligence-root">
      {/* Sub-Navigation Tabs Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 backdrop-blur-md overflow-x-auto shadow-lg">
        <div className="flex items-center gap-1.5 min-w-max">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubView(item.id as PoliceDataSubView)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                id={`police-subtab-${item.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive ? 'bg-emerald-700/80 text-emerald-100' : 'bg-slate-800 text-slate-500'
                }`}>
                  {item.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-View */}
      {activeSubView === 'v21_dossier' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300">DOSSIER TARGET:</span>
              {['GJ05AB1234', 'GJ01AB1234', 'GJ05XY6789', 'GJ27AX9999'].map(p => (
                <button
                  key={p}
                  onClick={() => setActiveDossierPlate(p)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded border transition ${
                    activeDossierPlate === p
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={activeDossierPlate}
                onChange={e => setActiveDossierPlate(e.target.value.toUpperCase())}
                placeholder="CUSTOM PLATE"
                className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-xs font-mono text-slate-200 uppercase w-36 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <VehicleDossierView dossier={vehicleDossierService.getOrCreateDossier(activeDossierPlate)} />
        </div>
      )}

      {activeSubView === 'vehicle_intel' && (
        <VehicleIntelligenceTab
          initialPlate={initialPlate}
          onNavigateToGodsEye={onNavigateToGodsEye}
          onSelectCameraId={onSelectCameraId}
        />
      )}

      {activeSubView === 'vehicle_registry' && <VehicleRegistryTab />}

      {activeSubView === 'echallan' && <EChallanTab />}

      {activeSubView === 'police_records' && <PoliceRecordsTab />}

      {activeSubView === 'watchlist_intel' && <WatchlistIntelTab />}

      {activeSubView === 'forensic_afis' && <ForensicIntegrationTab />}

      {activeSubView === 'integrations' && <IntegrationRegistryTab />}

      {activeSubView === 'audit_log' && <DataAccessAuditTab />}
    </div>
  );
}
