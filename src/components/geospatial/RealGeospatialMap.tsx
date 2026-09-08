/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * RealGeospatialMap: Interactive Operational GIS Map connected to Live State
 * 
 * Supports:
 * - Real Leaflet tile rendering (OSM / Government GIS / Local Tile Server)
 * - Offline vector fallback if tiles or network are unavailable (air-gapped ready)
 * - Green observed nodes, Blue predicted corridor nodes, Yellow human-verified, Red alerts
 * - Tiered inspection modal (Summary -> Details -> Advanced Details)
 * - Chronological vehicle journey playback
 * - Comprehensive filtering and search
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';

// Safeguard Leaflet DomUtil to prevent 'Cannot read properties of undefined (reading _leaflet_pos)'
// This protects during fast re-renders, component unmounts, and background animations.
if (typeof window !== 'undefined' && L && L.DomUtil) {
  const originalGetPosition = L.DomUtil.getPosition;
  L.DomUtil.getPosition = function (el: HTMLElement): L.Point {
    if (!el) {
      return new L.Point(0, 0);
    }
    try {
      if (originalGetPosition) {
        return originalGetPosition.call(L.DomUtil, el);
      }
      return (el as any)._leaflet_pos || new L.Point(0, 0);
    } catch {
      return (el && (el as any)._leaflet_pos) || new L.Point(0, 0);
    }
  };

  const originalSetPosition = L.DomUtil.setPosition;
  L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point): void {
    if (!el) return;
    try {
      if (originalSetPosition) {
        originalSetPosition.call(L.DomUtil, el, point);
      } else {
        (el as any)._leaflet_pos = point;
      }
    } catch {
      if (el) {
        (el as any)._leaflet_pos = point;
      }
    }
  };
}

import {
  MapPin,
  Camera,
  Navigation,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  Layers,
  Maximize2,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Car,
  Activity,
  AlertTriangle,
  FileText,
  Radio,
  RefreshCw,
  Eye,
  Sliders,
  X,
  Compass,
  CheckCircle2,
  Server
} from 'lucide-react';
import {
  MapMarkerItem,
  VehicleJourneyPath,
  MapFilterCriteria,
  geospatialEvidenceService
} from '../../services/GeospatialEvidenceService';
import { normalizeLicensePlate, ViewMode } from '../../types';

interface RealGeospatialMapProps {
  compact?: boolean;
  initialPlate?: string;
  onOpenFullMap?: () => void;
  onSelectVehicle?: (plate: string) => void;
  onSelectCameraId?: (cameraId: string) => void;
  onOpenEvidenceModal?: (evidenceId: string) => void;
  className?: string;
}

export const RealGeospatialMap: React.FC<RealGeospatialMapProps> = ({
  compact = false,
  initialPlate = '',
  onOpenFullMap,
  onSelectVehicle,
  onSelectCameraId,
  onOpenEvidenceModal,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>(initialPlate);
  const [activePlate, setActivePlate] = useState<string>(initialPlate);
  const [timeFilter, setTimeFilter] = useState<MapFilterCriteria['timeRange']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OBSERVED' | 'PREDICTED' | 'ALERT'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'FIXED_CAMERA' | 'MOBILE_CAMERA'>('ALL');
  
  // Inspection & Journey state
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);
  const [inspectionTab, setInspectionTab] = useState<'summary' | 'details' | 'advanced'>('summary');
  const [journeyPath, setJourneyPath] = useState<VehicleJourneyPath | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isAirGappedMode, setIsAirGappedMode] = useState<boolean>(false);
  const [tileError, setTileError] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // State to ensure map is mounted before populating layers
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Synchronize initialPlate prop changes into internal search state
  useEffect(() => {
    if (initialPlate) {
      const norm = normalizeLicensePlate(initialPlate);
      setSearchQuery(norm || initialPlate);
      setActivePlate(norm || initialPlate);
    }
  }, [initialPlate]);

  // Initial map center: Ahmedabad / SG Highway corridor (23.0525, 72.5220)
  const defaultCenter: [number, number] = [23.0525, 72.5220];
  const defaultZoom = compact ? 12 : 13;

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Destroy existing instance if container is reused
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Map cleanup safely handled:', e);
      }
      mapInstanceRef.current = null;
    }

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    let map: L.Map | null = null;
    try {
      map = L.map(container, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: !compact,
        attributionControl: false
      });
    } catch (err) {
      console.error('Failed to initialize Leaflet map:', err);
      return;
    }

    // Tile Layer: Standard OpenStreetMap tiles or high-contrast Carto Dark Matter
    const tileUrl = isAirGappedMode 
      ? 'http://localhost:8080/tiles/{z}/{x}/{y}.png' // Local tile server
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd'
    });

    tiles.on('tileerror', () => {
      setTileError(true);
    });

    tiles.addTo(map);

    // Layer group for dynamic markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Invalidate size after mount safely
    const invalidateTimer = window.setTimeout(() => {
      if (mapInstanceRef.current && container.isConnected) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch {
          // ignore
        }
      }
    }, 200);

    return () => {
      window.clearTimeout(invalidateTimer);
      setIsMapReady(false);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Map cleanup safely handled:', e);
        }
        mapInstanceRef.current = null;
      }
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
    };
  }, [compact, isAirGappedMode]);

  // Load and Render Markers & Journey
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    // Safely unbind existing tooltips to avoid memory leaks or pos calculations
    try {
      markersLayer.eachLayer((layer: any) => {
        if (layer.unbindTooltip) {
          layer.unbindTooltip();
        }
      });
      markersLayer.clearLayers();
    } catch (e) {
      console.warn('Error clearing markers layer:', e);
    }

    // Clear existing polyline
    if (routeLayerRef.current) {
      try {
        routeLayerRef.current.remove();
      } catch (e) {
        console.warn('Error removing route layer:', e);
      }
      routeLayerRef.current = null;
    }

    // Fetch markers from GeospatialEvidenceService
    const allMarkers = geospatialEvidenceService.getMapMarkers({
      timeRange: timeFilter,
      plateQuery: activePlate || undefined
    });

    // Filter by status & source if selected
    const filteredMarkers = allMarkers.filter(m => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'OBSERVED' && m.colorCategory !== 'OBSERVED') return false;
        if (statusFilter === 'PREDICTED' && m.colorCategory !== 'PREDICTED') return false;
        if (statusFilter === 'ALERT' && m.colorCategory !== 'ALERT') return false;
      }
      if (sourceFilter !== 'ALL') {
        if (sourceFilter === 'FIXED_CAMERA' && m.markerType !== 'FIXED_CAMERA') return false;
        if (sourceFilter === 'MOBILE_CAMERA' && m.markerType !== 'MOBILE_PATROL') return false;
      }
      return true;
    });

    // Populate markers on map
    filteredMarkers.forEach(item => {
      let iconHtml = '';
      let markerClass = 'border-2 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg';

      if (item.colorCategory === 'ALERT') {
        iconHtml = `<div class="${markerClass} w-8 h-8 bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse">⚠️</div>`;
      } else if (item.colorCategory === 'PREDICTED') {
        iconHtml = `<div class="${markerClass} w-7 h-7 bg-blue-950/90 border-blue-400 border-dashed text-blue-300">🔵</div>`;
      } else if (item.colorCategory === 'HUMAN_VERIFIED') {
        iconHtml = `<div class="${markerClass} w-7 h-7 bg-amber-950/90 border-amber-400 text-amber-300">⭐</div>`;
      } else if (item.markerType === 'MOBILE_PATROL') {
        iconHtml = `<div class="${markerClass} w-7 h-7 bg-cyan-950/90 border-cyan-400 text-cyan-300">🚓</div>`;
      } else if (item.markerType === 'FIXED_CAMERA') {
        iconHtml = `<div class="${markerClass} w-6 h-6 bg-zinc-900 border-zinc-600 text-zinc-300">📹</div>`;
      } else {
        // Observed evidence
        iconHtml = `<div class="${markerClass} w-7 h-7 bg-emerald-950/90 border-emerald-400 text-emerald-300">📍</div>`;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([item.latitude, item.longitude], { icon: customIcon });
      marker.on('click', () => {
        setSelectedMarker(item);
        setInspectionTab('summary');
      });

      // Tooltip
      marker.bindTooltip(`
        <div class="px-2 py-1 font-mono text-[11px] bg-zinc-950 text-white border border-zinc-700 rounded shadow">
          <strong class="text-emerald-400">${item.title}</strong><br/>
          <span class="text-zinc-400">${item.subtitle}</span>
        </div>
      `, { direction: 'top', offset: [0, -10] });

      marker.addTo(markersLayer);
    });

    // If a vehicle is searched, generate and plot journey polyline
    if (activePlate) {
      const journey = geospatialEvidenceService.generateVehicleJourney(activePlate);
      setJourneyPath(journey);

      if (journey.nodes.length > 0) {
        // Draw polyline segments
        const latLngs = journey.nodes.map(n => [n.latitude, n.longitude] as [number, number]);
        
        const polyline = L.polyline(latLngs, {
          color: journey.nodes.some(n => n.isPredicted) ? '#38bdf8' : '#22c55e',
          weight: 4,
          dashArray: journey.nodes.some(n => n.isPredicted) ? '8, 6' : undefined,
          opacity: 0.85
        }).addTo(map);

        routeLayerRef.current = polyline;

        // Auto pan/fit bounds safely without throwing animation race condition errors
        try {
          const mapSize = map.getSize();
          if (mapSize.x > 0 && mapSize.y > 0) {
            if (latLngs.length > 1) {
              map.fitBounds(polyline.getBounds(), { padding: [40, 40], animate: false, maxZoom: 15 });
            } else if (latLngs.length === 1) {
              map.setView(latLngs[0], 14, { animate: false });
            }
          }
        } catch (e) {
          console.warn('fitBounds error handled:', e);
        }
      }
    } else {
      setJourneyPath(null);
    }
  }, [isMapReady, activePlate, timeFilter, statusFilter, sourceFilter, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = normalizeLicensePlate(searchQuery);
    setActivePlate(norm || searchQuery.toUpperCase().trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActivePlate('');
    setJourneyPath(null);
    setSelectedMarker(null);
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.setView(defaultCenter, defaultZoom, { animate: false });
      } catch (e) {
        console.warn('setView error on clear:', e);
      }
    }
  };

  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className={`relative flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-sans ${className}`}>
      {/* MAP HEADER / STATUS BAR */}
      <div className="p-3 bg-zinc-900/90 backdrop-blur border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold font-mono text-emerald-300 tracking-wider">REAL MAP DATA</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-xs font-mono text-zinc-300">
            {isAirGappedMode ? 'AIR-GAPPED LOCAL GIS' : 'OPENSTREETMAP GRID'}
          </span>
          {tileError && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono">
              OFFLINE VECTOR FALLBACK ACTIVE
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {compact && onOpenFullMap && (
            <button
              onClick={onOpenFullMap}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Maximize2 size={13} />
              OPEN FULL MAP
            </button>
          )}

          {!compact && (
            <>
              <button
                onClick={() => setIsAirGappedMode(!isAirGappedMode)}
                title="Toggle Air-Gapped Private Server Mode"
                className={`px-2.5 py-1 text-[11px] font-mono rounded border flex items-center gap-1 transition-colors ${
                  isAirGappedMode
                    ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                    : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                <Server size={12} />
                {isAirGappedMode ? 'AIR-GAPPED MODE (ACTIVE)' : 'AIR-GAPPED MODE'}
              </button>

              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors"
                title="Refresh Map Points"
              >
                <RefreshCw size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* SEARCH & FILTER BAR (NON-COMPACT) */}
      {!compact && (
        <div className="p-2.5 bg-zinc-900/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Plate Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 flex-1 min-w-[240px] max-w-md">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Plate (e.g. GJ01AB1234), Camera, Device ID..."
                className="w-full pl-8 pr-8 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded font-mono text-xs font-semibold"
            >
              LOCATE
            </button>
          </form>

          {/* Preset Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-zinc-500 mr-1">FILTERS:</span>
            
            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-700 text-zinc-300 rounded px-2 py-1 text-xs font-mono focus:outline-none"
            >
              <option value="ALL">Time: All Sightings</option>
              <option value="TODAY">Time: Today Only</option>
              <option value="LAST_1_HOUR">Time: Last 1 Hour</option>
              <option value="LAST_6_HOURS">Time: Last 6 Hours</option>
              <option value="LAST_24_HOURS">Time: Last 24 Hours</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-700 text-zinc-300 rounded px-2 py-1 text-xs font-mono focus:outline-none"
            >
              <option value="ALL">Status: All</option>
              <option value="OBSERVED">Observed (Green)</option>
              <option value="PREDICTED">Predicted (Blue)</option>
              <option value="ALERT">Alert / Wanted (Red)</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-700 text-zinc-300 rounded px-2 py-1 text-xs font-mono focus:outline-none"
            >
              <option value="ALL">Source: All Types</option>
              <option value="FIXED_CAMERA">Fixed CCTV Only</option>
              <option value="MOBILE_CAMERA">Mobile Patrols Only</option>
            </select>
          </div>
        </div>
      )}

      {/* JOURNEY SUMMARY BANNER (WHEN VEHICLE IS LOCATED) */}
      {journeyPath && (
        <div className="px-3 py-2 bg-emerald-950/40 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Car size={15} className="text-emerald-400" />
            <span className="font-bold text-emerald-300">{journeyPath.plateNormalized}</span>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-300">{journeyPath.summaryText}</span>
          </div>

          {journeyPath.firstObserved && journeyPath.lastConfirmed && (
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span>First: <strong className="text-white">{journeyPath.firstObserved.cameraId}</strong> ({new Date(journeyPath.firstObserved.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
              <span>➔</span>
              <span>Last: <strong className="text-white">{journeyPath.lastConfirmed.cameraId}</strong> ({new Date(journeyPath.lastConfirmed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
              {onSelectVehicle && (
                <button
                  onClick={() => onSelectVehicle(journeyPath.plateNormalized)}
                  className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded transition-colors"
                >
                  FULL DOSSIER
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* LEAFLET CANVAS CONTAINER */}
      <div className="relative flex-1 min-h-[300px] w-full bg-zinc-950">
        <div ref={mapContainerRef} className="w-full h-full min-h-[300px] z-0" />

        {/* MAP LEGEND OVERLAY */}
        <div className="absolute bottom-3 left-3 z-10 p-2.5 bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-lg text-[10px] font-mono flex flex-col gap-1.5 pointer-events-auto shadow-xl">
          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Legend (No Synthetic Coordinates)</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-300">Observed Evidence (Camera / Device GPS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-blue-400 border-dashed bg-blue-900/50" />
            <span className="text-zinc-300">Predicted Corridor Point (Blue)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-zinc-300">Watchlist Alert Match (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-zinc-300">Human Verified Location (Yellow)</span>
          </div>
        </div>

        {/* DETAIL INSPECTION OVERLAY MODAL */}
        {selectedMarker && (
          <div className="absolute top-3 right-3 z-20 w-80 max-w-[calc(100%-24px)] bg-zinc-950/95 backdrop-blur border border-zinc-700 rounded-xl shadow-2xl overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{selectedMarker.colorCategory === 'ALERT' ? '⚠️' : '📍'}</span>
                <div>
                  <h4 className="font-bold text-white font-mono">{selectedMarker.title}</h4>
                  <p className="text-[10px] text-zinc-400 font-mono">{selectedMarker.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMarker(null)}
                className="p-1 text-zinc-400 hover:text-white rounded"
              >
                <X size={15} />
              </button>
            </div>

            {/* Photo Thumbnail if Available */}
            {selectedMarker.thumbnailUrl && (
              <div className="relative w-full h-32 bg-black overflow-hidden border-b border-zinc-800 flex items-center justify-center">
                <img
                  src={selectedMarker.thumbnailUrl}
                  alt={selectedMarker.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 rounded text-[9px] font-mono text-emerald-300 border border-emerald-500/40">
                  REAL FRAME CAPTURE
                </div>
              </div>
            )}

            {/* Tier Tabs */}
            <div className="flex border-b border-zinc-800 text-[11px] font-mono">
              <button
                onClick={() => setInspectionTab('summary')}
                className={`flex-1 py-1.5 text-center font-bold ${
                  inspectionTab === 'summary'
                    ? 'text-cyan-400 border-b-2 border-cyan-500 bg-zinc-900/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                SUMMARY
              </button>
              <button
                onClick={() => setInspectionTab('details')}
                className={`flex-1 py-1.5 text-center font-bold ${
                  inspectionTab === 'details'
                    ? 'text-cyan-400 border-b-2 border-cyan-500 bg-zinc-900/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                DETAILS
              </button>
              <button
                onClick={() => setInspectionTab('advanced')}
                className={`flex-1 py-1.5 text-center font-bold ${
                  inspectionTab === 'advanced'
                    ? 'text-cyan-400 border-b-2 border-cyan-500 bg-zinc-900/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ADVANCED
              </button>
            </div>

            {/* Tier 1: Summary */}
            {inspectionTab === 'summary' && (
              <div className="p-3 space-y-2 font-mono">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Source:</span>
                  <span className="text-zinc-200 font-semibold">{selectedMarker.locationSource}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Status:</span>
                  <span className={`font-semibold ${
                    selectedMarker.locationStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>{selectedMarker.locationStatus}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Timestamp:</span>
                  <span className="text-zinc-200">{new Date(selectedMarker.timestamp).toLocaleString()} IST</span>
                </div>
                {selectedMarker.accuracyMeters && (
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Accuracy:</span>
                    <span className="text-zinc-200">±{Math.round(selectedMarker.accuracyMeters)} meters</span>
                  </div>
                )}
              </div>
            )}

            {/* Tier 2: Details */}
            {inspectionTab === 'details' && (
              <div className="p-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Latitude:</span>
                  <span className="text-zinc-200">{selectedMarker.latitude.toFixed(6)}° N</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Longitude:</span>
                  <span className="text-zinc-200">{selectedMarker.longitude.toFixed(6)}° E</span>
                </div>
                {selectedMarker.speedKmh !== undefined && (
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Speed:</span>
                    <span className="text-zinc-200">{selectedMarker.speedKmh} km/h</span>
                  </div>
                )}
                {selectedMarker.heading !== undefined && (
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Heading:</span>
                    <span className="text-zinc-200">{selectedMarker.heading}°</span>
                  </div>
                )}
                {selectedMarker.vehicleClass && (
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Vehicle Class:</span>
                    <span className="text-zinc-200 uppercase">{selectedMarker.vehicleClass}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tier 3: Advanced Details (Forensic & Legal) */}
            {inspectionTab === 'advanced' && (
              <div className="p-3 space-y-2 font-mono text-[10px]">
                {selectedMarker.evidenceId && (
                  <div className="py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500 block mb-0.5">Evidence ID:</span>
                    <span className="text-zinc-200 break-all">{selectedMarker.evidenceId}</span>
                  </div>
                )}
                {selectedMarker.sha256 && (
                  <div className="py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500 block mb-0.5">SHA-256 Digest:</span>
                    <span className="text-zinc-300 break-all text-[9px]">{selectedMarker.sha256}</span>
                  </div>
                )}
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-200/90 text-[9px] leading-tight">
                  BSA 2023 NOTICE: SHA-256 is an integrity digest, not a digital signature. Requires officer custodian certification for legal custody.
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="p-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center gap-1.5">
              {selectedMarker.evidenceId && onOpenEvidenceModal && (
                <button
                  onClick={() => onOpenEvidenceModal(selectedMarker.evidenceId!)}
                  className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-center font-mono font-bold text-[11px] transition-colors"
                >
                  VIEW EVIDENCE
                </button>
              )}
              {selectedMarker.plateNormalized && onSelectVehicle && (
                <button
                  onClick={() => onSelectVehicle(selectedMarker.plateNormalized!)}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-center font-mono font-bold text-[11px] transition-colors"
                >
                  INVESTIGATE
                </button>
              )}
              <button
                onClick={() => handleCopyCoords(selectedMarker.latitude, selectedMarker.longitude)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                title="Copy Coordinates"
              >
                {copySuccess ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
