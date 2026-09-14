/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * InvestigationTargetPanel: Column 1 (Left Panel)
 * Authoritative Sentinel Camera Directory, GIS Coordinate Status,
 * Vehicle Target Dossier, and Spatiotemporal Filtering.
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Car, 
  MapPin, 
  Clock, 
  Shield, 
  ShieldAlert, 
  Sliders, 
  Filter, 
  CheckCircle2, 
  ChevronRight, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink,
  Navigation,
  ArrowUpRight,
  Eye,
  Activity,
  AlertTriangle,
  Camera as CameraIcon,
  Radio,
  Video,
  Layers,
  Map as MapIcon,
  Compass
} from 'lucide-react';
import { 
  VerifiedVehicleSighting, 
  TargetDossierSummary, 
  WorkspaceFilterState, 
  SentinelCameraLocation 
} from './types';

interface InvestigationTargetPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (plate: string) => void;
  targetSummary: TargetDossierSummary | null;
  sightings: VerifiedVehicleSighting[];
  cameras: SentinelCameraLocation[];
  selectedSightingId?: string;
  selectedCameraId?: string;
  onSelectSighting: (sighting: VerifiedVehicleSighting) => void;
  onSelectCamera?: (camera: SentinelCameraLocation) => void;
  onOpenLiveStream?: (cameraId: string) => void;
  filters: WorkspaceFilterState;
  onFilterChange: (filters: Partial<WorkspaceFilterState>) => void;
  isLoading: boolean;
  onAddToWatchlist: (plate: string) => void;
  onExportDossier: () => void;
  onDispatchInterceptor: (plate: string) => void;
}

const PRESET_TARGETS = ['GJ01AB1234', 'GJ05AB1234', 'GJ01AR8901', 'GJ01GP9999'];

export function InvestigationTargetPanel({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  targetSummary,
  sightings,
  cameras,
  selectedSightingId,
  selectedCameraId,
  onSelectSighting,
  onSelectCamera,
  onOpenLiveStream,
  filters,
  onFilterChange,
  isLoading,
  onAddToWatchlist,
  onExportDossier,
  onDispatchInterceptor
}: InvestigationTargetPanelProps) {
  // Panel Tab: 'cameras' (Section 10 Camera/Filters) vs 'target' (Target Dossier)
  const [panelTab, setPanelTab] = useState<'cameras' | 'target'>('cameras');
  const [cameraSearch, setCameraSearch] = useState<string>('');
  const [cameraStatusFilter, setCameraStatusFilter] = useState<'all' | 'LIVE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN'>('all');
  const [locationAvailabilityFilter, setLocationAvailabilityFilter] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [cameraTypeFilter, setCameraTypeFilter] = useState<string>('all');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Unique districts from authoritative camera registry
  const districts = useMemo(() => {
    return Array.from(new Set(cameras.map(c => c.district).filter(Boolean))).sort();
  }, [cameras]);

  // Mapped vs unmapped counts
  const mappedCount = useMemo(() => {
    return cameras.filter(c => c.latitude && c.longitude && c.hasCoordinates).length;
  }, [cameras]);
  const unmappedCount = cameras.length - mappedCount;

  // Filtered cameras based on current controls
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      if (cameraSearch) {
        const q = cameraSearch.toLowerCase();
        const match = cam.name.toLowerCase().includes(q) || 
                      cam.cameraId.toLowerCase().includes(q) || 
                      cam.district.toLowerCase().includes(q) ||
                      cam.location.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.district !== 'all' && cam.district.toLowerCase() !== filters.district.toLowerCase()) {
        return false;
      }
      if (cameraStatusFilter !== 'all' && cam.status !== cameraStatusFilter) {
        return false;
      }
      if (locationAvailabilityFilter === 'mapped' && (!cam.latitude || !cam.longitude || !cam.hasCoordinates)) {
        return false;
      }
      if (locationAvailabilityFilter === 'unmapped' && (cam.latitude && cam.longitude && cam.hasCoordinates)) {
        return false;
      }
      return true;
    });
  }, [cameras, cameraSearch, filters.district, cameraStatusFilter, locationAvailabilityFilter]);

  return (
    <div className="w-full lg:w-96 flex-shrink-0 flex flex-col h-full bg-slate-900 border-r border-slate-800 select-none">
      {/* Top Left Panel Switcher Tab */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950 px-2 pt-2 gap-1 flex-shrink-0">
        <button
          onClick={() => setPanelTab('cameras')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-t border-x ${
            panelTab === 'cameras'
              ? 'bg-slate-900 text-sky-400 border-slate-800 border-b-transparent shadow-xs'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
          }`}
        >
          <CameraIcon className="w-3.5 h-3.5" />
          <span>Cameras & Filters</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
            {cameras.length}
          </span>
        </button>

        <button
          onClick={() => setPanelTab('target')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-t border-x ${
            panelTab === 'target'
              ? 'bg-slate-900 text-sky-400 border-slate-800 border-b-transparent shadow-xs'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Target Dossier</span>
          {sightings.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
              {sightings.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CAMERAS & FILTERS (Section 10 & 19 Specification) */}
      {/* ========================================================= */}
      {panelTab === 'cameras' && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Filters & Search Header */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/90 space-y-2.5 flex-shrink-0">
            {/* Camera Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={cameraSearch}
                onChange={(e) => setCameraSearch(e.target.value)}
                placeholder="Search camera name, node ID, junction..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              {cameraSearch && (
                <button
                  onClick={() => setCameraSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* District & Status Filters Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">District:</label>
                <select
                  value={filters.district}
                  onChange={(e) => onFilterChange({ district: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="all">All Gujarat Districts</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Status:</label>
                <select
                  value={cameraStatusFilter}
                  onChange={(e) => setCameraStatusFilter(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="LIVE">LIVE (Online)</option>
                  <option value="DEGRADED">DEGRADED</option>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </select>
              </div>
            </div>

            {/* Location Availability Filter (Section 19) */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400 font-medium">GIS Location:</span>
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded border border-slate-700/60 text-[10px]">
                <button
                  onClick={() => setLocationAvailabilityFilter('all')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    locationAvailabilityFilter === 'all'
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({cameras.length})
                </button>
                <button
                  onClick={() => setLocationAvailabilityFilter('mapped')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    locationAvailabilityFilter === 'mapped'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mapped ({mappedCount})
                </button>
                <button
                  onClick={() => setLocationAvailabilityFilter('unmapped')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    locationAvailabilityFilter === 'unmapped'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Unmapped ({unmappedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Authoritative Camera List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-800/40">
            {filteredCameras.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                <CameraIcon className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p>No Sentinel cameras match current filter criteria.</p>
              </div>
            ) : (
              filteredCameras.map((camera) => {
                const isSelected = camera.cameraId === selectedCameraId;
                const hasGps = Boolean(camera.latitude && camera.longitude && camera.hasCoordinates);

                return (
                  <div
                    key={camera.cameraId}
                    onClick={() => onSelectCamera?.(camera)}
                    className={`pt-2.5 cursor-pointer rounded-lg p-2.5 transition-all ${
                      isSelected
                        ? 'bg-sky-950/70 border border-sky-500/60 shadow-md ring-1 ring-sky-500/30'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {/* Status Indicator */}
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          camera.status === 'LIVE' ? 'bg-emerald-400 ring-2 ring-emerald-500/20' :
                          camera.status === 'DEGRADED' ? 'bg-amber-400' :
                          camera.status === 'OFFLINE' ? 'bg-rose-400' : 'bg-slate-500'
                        }`} />
                        <div>
                          <h5 className="font-semibold text-xs text-slate-200 leading-snug">
                            {camera.name}
                          </h5>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {camera.cameraId} · {camera.district}
                          </span>
                        </div>
                      </div>

                      {/* Location Badge */}
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${
                        hasGps 
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' 
                          : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                      }`}>
                        {hasGps ? 'GPS Mapped' : 'Location Unavailable'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mb-2 truncate">
                      {camera.location}
                    </div>

                    {/* Coordinates & Quick Actions */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px]">
                      <div className="flex items-center gap-1 font-mono text-slate-400">
                        <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
                        {hasGps ? (
                          <span>{camera.latitude?.toFixed(4)}°, {camera.longitude?.toFixed(4)}°</span>
                        ) : (
                          <span className="text-amber-400/80">Survey Pending</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCamera?.(camera);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[10px] transition-colors"
                        >
                          Focus Map
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLiveStream?.(camera.cameraId);
                          }}
                          className="px-2 py-0.5 bg-sky-700 hover:bg-sky-600 text-white rounded text-[10px] font-medium transition-colors flex items-center gap-1"
                        >
                          <Video className="w-2.5 h-2.5" />
                          <span>Stream</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TARGET INVESTIGATION DOSSIER                      */}
      {/* ========================================================= */}
      {panelTab === 'target' && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Search & Query Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex-shrink-0">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Vehicle Target Query
            </label>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  onSearchSubmit(searchQuery.trim());
                }
              }}
              className="relative flex items-center"
            >
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value.toUpperCase())}
                placeholder="e.g. GJ01AB1234"
                className="w-full pl-9 pr-16 py-2 bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-10 text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="absolute right-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors"
              >
                {isLoading ? '...' : 'Track'}
              </button>
            </form>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <span className="text-slate-500 text-[10px] whitespace-nowrap">Active:</span>
              {PRESET_TARGETS.map(plate => (
                <button
                  key={plate}
                  onClick={() => {
                    onSearchChange(plate);
                    onSearchSubmit(plate);
                  }}
                  className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors whitespace-nowrap ${
                    searchQuery === plate 
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/60'
                  }`}
                >
                  {plate}
                </button>
              ))}
            </div>

            {/* Filter Toggle Bar */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              >
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <span>Filters ({filters.district !== 'all' || filters.minConfidence > 0 ? 'Active' : 'Default'})</span>
              </button>
              <span className="text-[11px] text-slate-500 font-mono">
                {sightings.length} Sightings
              </span>
            </div>

            {/* Expandable Filter Box */}
            {showFilters && (
              <div className="mt-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">District Focus:</label>
                  <select
                    value={filters.district}
                    onChange={(e) => onFilterChange({ district: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="all">All Gujarat Districts</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Min AI OCR Confidence:</span>
                    <span className="font-mono text-sky-400">{(filters.minConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.95"
                    step="0.05"
                    value={filters.minConfidence}
                    onChange={(e) => onFilterChange({ minConfidence: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Target Summary Card */}
          {targetSummary && (
            <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded font-mono font-bold text-xs tracking-wider">
                      {targetSummary.plateNormalized}
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3 text-blue-400" />
                      BSA VERIFIED
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {targetSummary.vehicleClass || 'Motor Vehicle'} · {targetSummary.vehicleColor || 'Standard Color'}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Sightings</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {targetSummary.totalSightings} Points ({targetSummary.distinctCameras} Cams)
                  </div>
                </div>
              </div>

              {/* Forensic Status Metadata */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/90 p-2 rounded border border-slate-800 mb-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">First Observation:</span>
                  <span className="text-slate-300 font-mono">
                    {targetSummary.firstSeenAt ? new Date(targetSummary.firstSeenAt).toLocaleTimeString('en-IN', { hour12: false }) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Last Observation:</span>
                  <span className="text-slate-300 font-mono">
                    {targetSummary.lastSeenAt ? new Date(targetSummary.lastSeenAt).toLocaleTimeString('en-IN', { hour12: false }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddToWatchlist(targetSummary.plateNormalized)}
                  className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  Watchlist
                </button>
                <button
                  onClick={onExportDossier}
                  className="flex-1 py-1 px-2 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700/60 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  BSA §63
                </button>
                <button
                  onClick={() => onDispatchInterceptor(targetSummary.plateNormalized)}
                  className="py-1 px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  title="Dispatch Highway Interceptor Protocol"
                >
                  <Navigation className="w-3 h-3" />
                  Intercept
                </button>
              </div>
            </div>
          )}

          {/* Chronological Sighting Cards Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-800/40">
            {sightings.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Car className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p>NO VERIFIED VEHICLE OBSERVATION FOUND</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Query target license plate to reconstruct temporal transit corridor.
                </p>
              </div>
            ) : (
              sightings.map((sighting, idx) => {
                const isSelected = sighting.observationId === selectedSightingId;
                const seq = sighting.sequenceIndex !== undefined ? sighting.sequenceIndex : idx + 1;

                return (
                  <div
                    key={sighting.observationId}
                    onClick={() => onSelectSighting(sighting)}
                    className={`pt-2.5 cursor-pointer rounded-lg p-2.5 transition-all ${
                      isSelected 
                        ? 'bg-sky-950/70 border border-sky-500/60 shadow-md ring-1 ring-sky-500/30' 
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                          isSelected ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {seq}
                        </span>
                        <div>
                          <h5 className="font-semibold text-xs text-slate-200 leading-snug">
                            {sighting.cameraName}
                          </h5>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {sighting.cameraId} · {sighting.district}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/50">
                        {new Date(sighting.timestamp).toLocaleTimeString('en-IN', { hour12: false })} IST
                      </span>
                    </div>

                    {/* Sighting Details */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-700/50 rounded font-mono text-[10px] font-bold">
                          {sighting.rawPlateText}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          {(sighting.ocrConfidence * 100).toFixed(0)}% OCR
                        </span>
                      </div>

                      {sighting.speedKmh ? (
                        <span className="text-[11px] text-slate-300 font-mono">
                          {sighting.speedKmh} km/h {sighting.direction ? `· ${sighting.direction}` : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          {sighting.direction || 'Corridor transit'}
                        </span>
                      )}
                    </div>

                    {/* Cryptographic SHA-256 Digest Bar */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1 font-mono truncate max-w-[200px]">
                        <Shield className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{sighting.originalFrameHash.slice(0, 16)}...</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(sighting.originalFrameHash, sighting.observationId);
                        }}
                        className="hover:text-slate-300 p-0.5 transition-colors"
                        title="Copy full cryptographic SHA-256 hash"
                      >
                        {copiedHash === sighting.observationId ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
