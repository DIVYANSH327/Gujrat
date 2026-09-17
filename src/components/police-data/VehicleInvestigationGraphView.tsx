/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleInvestigationGraphView: Multi-Entity Spatiotemporal Knowledge Graph
 * 
 * Visualizes relational graph connecting:
 * Vehicle Node <-> Camera Checkpoints <-> Forensic Evidence <-> Watchlist <-> External Registries
 */

import React, { useState } from 'react';
import { VehicleDossier } from '../../types';
import { 
  Car, 
  Camera, 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  Database, 
  Info,
  Maximize2
} from 'lucide-react';

interface Props {
  dossier: VehicleDossier;
}

interface GraphNode {
  id: string;
  type: 'VEHICLE' | 'CAMERA' | 'EVIDENCE' | 'INCIDENT' | 'WATCHLIST' | 'EXTERNAL_DATA';
  label: string;
  subtitle: string;
  x: number;
  y: number;
  status?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  color?: string;
}

export const VehicleInvestigationGraphView: React.FC<Props> = ({ dossier }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Build nodes based on dossier entities
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Central Vehicle Node
  const centralNodeId = `NODE-${dossier.canonicalPlate}`;
  nodes.push({
    id: centralNodeId,
    type: 'VEHICLE',
    label: dossier.canonicalPlate,
    subtitle: `${dossier.vehicleAttributes.observedClass.toUpperCase()} (${dossier.vehicleAttributes.observedColor || 'WHITE'})`,
    x: 400,
    y: 220
  });

  // Camera nodes
  dossier.cameraPath.forEach((camId, idx) => {
    const angle = (idx / Math.max(1, dossier.cameraPath.length)) * 2 * Math.PI - Math.PI / 2;
    const radius = 180;
    const camNodeId = `CAM-${camId}-${idx}`;
    nodes.push({
      id: camNodeId,
      type: 'CAMERA',
      label: camId,
      subtitle: `Checkpoint ${idx + 1}`,
      x: 400 + Math.cos(angle) * radius,
      y: 220 + Math.sin(angle) * radius
    });

    edges.push({
      from: centralNodeId,
      to: camNodeId,
      label: `SIGHTED #${idx + 1}`,
      color: '#10b981'
    });

    if (idx > 0) {
      edges.push({
        from: `CAM-${dossier.cameraPath[idx - 1]}-${idx - 1}`,
        to: camNodeId,
        label: 'TRANSIT',
        color: '#6366f1'
      });
    }
  });

  // Watchlist nodes
  if (dossier.watchlistMatches.length > 0) {
    const wlNodeId = 'NODE-WATCHLIST';
    nodes.push({
      id: wlNodeId,
      type: 'WATCHLIST',
      label: 'STATE WATCHLIST',
      subtitle: 'Priority Interception Flag',
      x: 200,
      y: 80
    });
    edges.push({
      from: centralNodeId,
      to: wlNodeId,
      label: 'WATCHLIST MATCH',
      color: '#ef4444'
    });
  }

  // External Data Nodes
  if (dossier.externalData?.vahan?.record) {
    const vahanNodeId = 'NODE-VAHAN-REG';
    nodes.push({
      id: vahanNodeId,
      type: 'EXTERNAL_DATA',
      label: 'VAHAN 4.0 REGISTRY',
      subtitle: `${dossier.externalData.vahan.record.make} ${dossier.externalData.vahan.record.model}`,
      x: 600,
      y: 80
    });
    edges.push({
      from: centralNodeId,
      to: vahanNodeId,
      label: 'REGISTERED AS',
      color: '#06b6d4'
    });
  }

  if (dossier.externalData?.echallan?.challans && dossier.externalData.echallan.challans.length > 0) {
    const echNodeId = 'NODE-ECHALLAN';
    nodes.push({
      id: echNodeId,
      type: 'EXTERNAL_DATA',
      label: 'GUJARAT eCHALLAN',
      subtitle: `${dossier.externalData.echallan.challans.length} Traffic Violations`,
      x: 650,
      y: 320
    });
    edges.push({
      from: centralNodeId,
      to: echNodeId,
      label: 'PENDING CHALLANS',
      color: '#f59e0b'
    });
  }

  if ((dossier.externalData?.egujcop as any)?.records && (dossier.externalData.egujcop as any).records.length > 0) {
    const egujNodeId = 'NODE-EGUJCOP';
    nodes.push({
      id: egujNodeId,
      type: 'INCIDENT',
      label: 'eGujCop CCTNS',
      subtitle: 'FIR / Warrant Linkage',
      x: 180,
      y: 340
    });
    edges.push({
      from: centralNodeId,
      to: egujNodeId,
      label: 'INVESTIGATION LINK',
      color: '#dc2626'
    });
  }

  const filteredNodes = filterType === 'ALL' 
    ? nodes 
    : nodes.filter(n => n.type === filterType || n.type === 'VEHICLE');

  const getNodeIcon = (type: GraphNode['type']) => {
    switch (type) {
      case 'VEHICLE': return Car;
      case 'CAMERA': return Camera;
      case 'EVIDENCE': return FileText;
      case 'INCIDENT': return AlertTriangle;
      case 'WATCHLIST': return ShieldAlert;
      case 'EXTERNAL_DATA': return Database;
    }
  };

  const getNodeBorderColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'VEHICLE': return 'border-amber-500 bg-amber-950/70 text-amber-300';
      case 'CAMERA': return 'border-emerald-500 bg-emerald-950/70 text-emerald-300';
      case 'EVIDENCE': return 'border-indigo-500 bg-indigo-950/70 text-indigo-300';
      case 'INCIDENT': return 'border-rose-500 bg-rose-950/70 text-rose-300';
      case 'WATCHLIST': return 'border-red-600 bg-red-950/80 text-red-300';
      case 'EXTERNAL_DATA': return 'border-cyan-500 bg-cyan-950/70 text-cyan-300';
    }
  };

  return (
    <div id="vehicle-investigation-graph-view" className="space-y-4">
      {/* Control bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Entity Filter:</span>
          {['ALL', 'CAMERA', 'EXTERNAL_DATA', 'WATCHLIST', 'INCIDENT'].map(ft => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                filterType === ft
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Click any node to inspect spatiotemporal relational context
        </div>
      </div>

      {/* SVG Canvas and Graph Layout */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-lg h-[460px] overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {edges.map((edge, i) => {
            const fromNode = filteredNodes.find(n => n.id === edge.from);
            const toNode = filteredNodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            return (
              <g key={`edge-${i}`}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={edge.color || '#475569'}
                  strokeWidth="1.5"
                  strokeDasharray={edge.label === 'TRANSIT' ? '4,4' : undefined}
                  opacity="0.65"
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {filteredNodes.map((node) => {
          const Icon = getNodeIcon(node.type);
          const colorClass = getNodeBorderColor(node.type);
          const isSelected = selectedNode?.id === node.id;

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              style={{ left: `${node.x - 65}px`, top: `${node.y - 30}px` }}
              className={`absolute w-36 p-2 rounded-lg border cursor-pointer transition-all duration-150 select-none shadow-lg ${colorClass} ${
                isSelected ? 'ring-2 ring-amber-400 scale-105 z-20' : 'hover:scale-102 z-10'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-bold font-mono truncate">{node.label}</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate mt-0.5">{node.subtitle}</p>
            </div>
          );
        })}

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute bottom-3 right-3 w-80 bg-slate-900/95 border border-slate-700 rounded-lg p-3.5 shadow-2xl backdrop-blur space-y-2 z-30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 font-mono">{selectedNode.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {selectedNode.type}
              </span>
            </div>
            <p className="text-xs text-slate-300">{selectedNode.subtitle}</p>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Correlated In: <span className="text-slate-200">Statewide CCTV Mesh</span></div>
              <div>Relationship: <span className="text-emerald-400">Validated Spatiotemporal Link</span></div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="w-full mt-2 text-[10px] text-slate-400 hover:text-slate-200 py-1 bg-slate-800/80 rounded"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
