/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * CamerasAndFiltersPanel: Clean White Police Command Center Left Panel
 * Real Sentinel Camera Registry, District & Status Filtering, GPS Availability,
 * and Instant Camera-to-Map Focus Controls.
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Camera, 
  MapPin, 
  Video, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  SlidersHorizontal,
  Compass,
  Filter,
  Radio,
  Maximize2
} from 'lucide-react';
import { SentinelCameraLocation } from './types';

interface CamerasAndFiltersPanelProps {
  cameras: SentinelCameraLocation[];
  selectedCameraId?: string;
  onSelectCamera: (camera: SentinelCameraLocation) => void;
  onFocusCameraMap: (camera: SentinelCameraLocation) => void;
  onOpenLiveStream?: (cameraId: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
}

export function CamerasAndFiltersPanel({
  cameras,
  selectedCameraId,
  onSelectCamera,
  onFocusCameraMap,
  onOpenLiveStream,
  selectedDistrict,
  onSelectDistrict
}: CamerasAndFiltersPanelProps) {
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'LIVE' | 'DEGRADED' | 'OFFLINE'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Extract unique sorted districts
  const districts = useMemo(() => {
    return Array.from(new Set(cameras.map(c => c.district).filter(Boolean))).sort();
  }, [cameras]);

  // Counts based strictly on authoritative backend data
  const mappedCount = useMemo(() => {
    return cameras.filter(c => c.latitude && c.longitude && c.hasCoordinates).length;
  }, [cameras]);
  const unmappedCount = cameras.length - mappedCount;

  // Filtered cameras based on controls
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      // 1. Search Query
      if (search) {
        const q = search.toLowerCase();
        const match = 
          cam.name.toLowerCase().includes(q) || 
          cam.cameraId.toLowerCase().includes(q) || 
          cam.district.toLowerCase().includes(q) ||
          cam.location.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Tab Filter (GPS Availability)
      if (activeTab === 'mapped' && (!cam.latitude || !cam.longitude || !cam.hasCoordinates)) {
        return false;
      }
      if (activeTab === 'unmapped' && (cam.latitude && cam.longitude && cam.hasCoordinates)) {
        return false;
      }

      // 3. District Filter
      if (selectedDistrict !== 'all' && cam.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'all' && cam.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [cameras, search, activeTab, selectedDistrict, statusFilter]);

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200 select-none overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-100 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              CAMERAS & FILTERS
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {cameras.length} Authoritative Sentinel Nodes
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition-colors ${
            showFilters || selectedDistrict !== 'all' || statusFilter !== 'all'
              ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle Filter Options"
          aria-label="Filter Options"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {(selectedDistrict !== 'all' || statusFilter !== 'all') && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          )}
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 bg-slate-50/70 border-b border-slate-100 flex-shrink-0 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search camera, junction or camera ID..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-200/80 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => onSelectDistrict(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Districts</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="LIVE">Live Online</option>
                  <option value="DEGRADED">Degraded / Warning</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>
            </div>

            {(selectedDistrict !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  onSelectDistrict('all');
                  setStatusFilter('all');
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Reset all filters
              </button>
            )}
          </div>
        )}

        {/* Tabs: ALL | MAPPED | UNMAPPED */}
        <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 px-2 rounded-md transition-all text-center flex items-center justify-center gap-1 ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>ALL</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {cameras.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mapped')}
            className={`flex-1 py-1 px-2 rounded-md transition-all text-center flex items-center justify-center gap-1 ${
              activeTab === 'mapped'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>MAPPED</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              {mappedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unmapped')}
            className={`flex-1 py-1 px-2 rounded-md transition-all text-center flex items-center justify-center gap-1 ${
              activeTab === 'unmapped'
                ? 'bg-white text-amber-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>UNMAPPED</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
              {unmappedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Camera Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-[#F6F8FB]/60">
        {filteredCameras.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-2xs my-4">
            <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No cameras matched</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Try adjusting your search query or active filter tags.
            </p>
          </div>
        ) : (
          filteredCameras.map((cam) => {
            const isSelected = cam.cameraId === selectedCameraId;
            const hasGps = Boolean(cam.latitude && cam.longitude && cam.hasCoordinates);

            return (
              <div
                key={cam.cameraId}
                id={`camera-card-${cam.cameraId}`}
                onClick={() => onSelectCamera(cam)}
                className={`p-3 bg-white rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Row: Status Dot + Camera ID + District */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        cam.status === 'LIVE'
                          ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                          : cam.status === 'DEGRADED'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {cam.cameraId.toUpperCase()}
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-slate-500 truncate max-w-[120px]">
                    {cam.district}
                  </span>
                </div>

                {/* Camera Name / Junction */}
                <h3 className="text-xs font-semibold text-slate-800 line-clamp-1 mb-2">
                  {cam.name}
                </h3>

                {/* Badges: Status + GPS */}
                <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      cam.status === 'LIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : cam.status === 'DEGRADED'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {cam.status}
                  </span>

                  {/* GPS Badge */}
                  {hasGps ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-blue-600" />
                      GPS Mapped
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                      GPS Unavailable
                    </span>
                  )}
                </div>

                {/* Action Buttons: [Focus Map] [View] */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocusCameraMap(cam);
                    }}
                    disabled={!hasGps}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-all ${
                      hasGps
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 active:scale-[0.98]'
                        : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                    title={hasGps ? "Center Google Maps on camera coordinates" : "Coordinates unavailable"}
                  >
                    <Compass className="w-3 h-3" />
                    <span>Focus Map</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCamera(cam);
                      if (onOpenLiveStream) onOpenLiveStream(cam.cameraId);
                    }}
                    className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs"
                    title="View live stream / telemetry"
                  >
                    <Eye className="w-3 h-3 text-slate-500" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Panel Footer Summary */}
      <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{mappedCount} active on map</span>
        </span>
        <span className="font-mono text-slate-400">
          Total: {cameras.length} nodes
        </span>
      </div>
    </div>
  );
}
