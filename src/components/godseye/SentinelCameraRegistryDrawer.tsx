/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * SentinelCameraRegistryDrawer: 30-Node Gujarat CCTV Registry
 * Full search, district filtering, GPS telemetry, and live stream launching.
 */

import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Camera, 
  MapPin, 
  Video, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Eye, 
  SlidersHorizontal 
} from 'lucide-react';
import { SentinelCameraLocation } from './types';

interface SentinelCameraRegistryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: SentinelCameraLocation[];
  onSelectCamera: (camera: SentinelCameraLocation) => void;
  onOpenLiveStream: (cameraId: string) => void;
}

export function SentinelCameraRegistryDrawer({
  isOpen,
  onClose,
  cameras,
  onSelectCamera,
  onOpenLiveStream
}: SentinelCameraRegistryDrawerProps) {
  const [search, setSearch] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!isOpen) return null;

  const districts = Array.from(new Set(cameras.map(c => c.district).filter(Boolean))).sort();

  const filteredCameras = cameras.filter(cam => {
    if (search) {
      const q = search.toLowerCase();
      const match = cam.name.toLowerCase().includes(q) || 
                    cam.cameraId.toLowerCase().includes(q) || 
                    cam.district.toLowerCase().includes(q) ||
                    cam.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (districtFilter !== 'all' && cam.district.toLowerCase() !== districtFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter !== 'all' && cam.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-700 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Sentinel Camera Registry
              </h3>
              <p className="text-[10px] text-slate-400">
                {cameras.length} Authoritative Gujarat CCTV Sensor Nodes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search camera name, node ID, junction..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="all">All Districts ({cameras.length})</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="LIVE">Live Feeds</option>
              <option value="DEGRADED">Degraded</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
        </div>

        {/* Camera List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCameras.map((cam) => {
            const isOnline = cam.status === 'LIVE';

            return (
              <div
                key={cam.cameraId}
                className="p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-lg transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-semibold text-xs text-slate-200 leading-tight">
                      {cam.name}
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400">
                      {cam.cameraId} · {cam.district}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {cam.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{cam.location}</span>
                </p>

                {cam.latitude && cam.longitude && (
                  <div className="text-[10px] font-mono text-slate-500">
                    GPS: {cam.latitude.toFixed(4)}°N, {cam.longitude.toFixed(4)}°E
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onSelectCamera(cam);
                      onClose();
                    }}
                    className="flex-1 py-1 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-sky-400" />
                    <span>Focus Map</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenLiveStream(cam.cameraId);
                      onClose();
                    }}
                    className="flex-1 py-1 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Video className="w-3 h-3" />
                    <span>Stream Feed</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
