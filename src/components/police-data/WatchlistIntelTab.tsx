/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * WatchlistIntelTab: Central Law Enforcement Watchlist Intelligence
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import React, { useState } from 'react';
import { Search, ShieldAlert, Plus, Trash2, Eye, AlertTriangle, CheckCircle2, Radio, Filter } from 'lucide-react';
import { normalizeLicensePlate } from '../../types';

interface WatchlistIntelItem {
  id: string;
  targetType: 'VEHICLE' | 'PERSON_SYNTHETIC';
  plateOrId: string;
  category: 'CRITICAL_WANTED' | 'INTERSTATE_THEFT' | 'HIT_AND_RUN' | 'SURVEILLANCE';
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  addedBy: string;
  dateAdded: string;
  activeSightingsCount: number;
}

export function WatchlistIntelTab() {
  const [items, setItems] = useState<WatchlistIntelItem[]>([
    {
      id: 'WL-001',
      targetType: 'VEHICLE',
      plateOrId: 'GJ05AB1234',
      category: 'CRITICAL_WANTED',
      threatLevel: 'CRITICAL',
      description: 'Vehicle involved in interstate logistics diversion incident along NH-48 / Ring Road corridor.',
      addedBy: 'Inspector R. K. Patel (Airport PS)',
      dateAdded: '2026-08-14T08:00:00Z',
      activeSightingsCount: 4
    },
    {
      id: 'WL-002',
      targetType: 'VEHICLE',
      plateOrId: 'GJ05XY6789',
      category: 'SURVEILLANCE',
      threatLevel: 'HIGH',
      description: 'Vehicle designated for active movement observation under Varachha PS warrant.',
      addedBy: 'Inspector V. S. Dave (Surat Crime Branch)',
      dateAdded: '2026-07-22T10:30:00Z',
      activeSightingsCount: 4
    },
    {
      id: 'WL-003',
      targetType: 'VEHICLE',
      plateOrId: 'GJ01CD5678',
      category: 'HIT_AND_RUN',
      threatLevel: 'HIGH',
      description: 'Silver Sedan sought in connection with Ashram Road traffic collision.',
      addedBy: 'Traffic Control Room Ahmedabad',
      dateAdded: '2026-08-01T12:00:00Z',
      activeSightingsCount: 1
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newCategory, setNewCategory] = useState<WatchlistIntelItem['category']>('CRITICAL_WANTED');
  const [newThreat, setNewThreat] = useState<WatchlistIntelItem['threatLevel']>('CRITICAL');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = () => {
    const normalized = normalizeLicensePlate(newPlate);
    if (!normalized || !newDesc) return;

    const newItem: WatchlistIntelItem = {
      id: `WL-${Date.now().toString().slice(-4)}`,
      targetType: 'VEHICLE',
      plateOrId: normalized,
      category: newCategory,
      threatLevel: newThreat,
      description: newDesc,
      addedBy: 'Command Center Officer',
      dateAdded: new Date().toISOString(),
      activeSightingsCount: 0
    };

    setItems([newItem, ...items]);
    setShowAddModal(false);
    setNewPlate('');
    setNewDesc('');
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const filteredItems = items.filter(
    i => i.plateOrId.toUpperCase().includes(searchQuery.toUpperCase()) ||
         i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
         i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="watchlist-intel-tab">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-semibold">
                CENTRAL LAW ENFORCEMENT WATCHLIST MESH
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {items.length} ACTIVE TARGETS
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Real-Time Edge Node Interception & Target Watchlist
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Distributes active wanted vehicle and subject descriptors to 1,600+ edge gateways for sub-50ms optical match triggers and human officer verification.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all self-start md:self-auto"
            id="add-watchlist-target-btn"
          >
            <Plus className="w-4 h-4" />
            <span>ADD WATCHLIST TARGET</span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search watchlist by plate number, reason, category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-rose-500"
              id="watchlist-search-input"
            />
          </div>
        </div>
      </div>

      {/* Targets Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-white uppercase">
            Active Statewide Watchlist Entries ({filteredItems.length})
          </span>
          <span className="text-xs font-mono text-slate-400">
            SYNC STATE: DISTRIBUTED ACROSS ALL EDGE NODES
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-850/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-bold font-mono text-white tracking-wider">
                    {item.plateOrId}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                    item.threatLevel === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {item.threatLevel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {item.category}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    {item.activeSightingsCount} Active Sightings
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {item.description}
                </p>
                <div className="text-[11px] font-mono text-slate-500 flex flex-wrap gap-4 pt-1">
                  <span>Target ID: {item.id}</span>
                  <span>Added By: {item.addedBy}</span>
                  <span>Date: {new Date(item.dateAdded).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/30 transition-all"
                  title="Remove from Watchlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for adding item */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Add Target to Central Watchlist Mesh
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">REGISTRATION PLATE NUMBER</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. GJ05AB1234"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">THREAT LEVEL</label>
                  <select
                    value={newThreat}
                    onChange={(e) => setNewThreat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">CATEGORY</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="CRITICAL_WANTED">CRITICAL WANTED</option>
                    <option value="INTERSTATE_THEFT">INTERSTATE THEFT</option>
                    <option value="HIT_AND_RUN">HIT AND RUN</option>
                    <option value="SURVEILLANCE">SURVEILLANCE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">REASON / CASE DETAILS</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide case number, station, and operational instructions..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-mono text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-mono text-xs font-bold"
              >
                Deploy Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
