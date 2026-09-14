/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * GoogleMapsIntelligenceViewer: Real Google Maps GIS Intelligence Core
 * Integrated with @vis.gl/react-google-maps and AdvancedMarkerElement.
 * Includes statutory internalUsageAttributionIds={"gmp_mcp_codeassist_v1_aistudio"}.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { 
  SentinelCameraLocation, 
  VerifiedVehicleSighting, 
  CorrelatedTargetAlert, 
  WorkspaceFilterState 
} from './types';
import { 
  Camera as CameraIcon, 
  Video, 
  AlertTriangle, 
  Navigation, 
  Maximize2, 
  Layers, 
  MapPin, 
  Eye, 
  Activity, 
  CheckCircle2, 
  X, 
  Compass, 
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Car
} from 'lucide-react';

interface GoogleMapsIntelligenceViewerProps {
  cameras: SentinelCameraLocation[];
  sightings: VerifiedVehicleSighting[];
  alerts: CorrelatedTargetAlert[];
  filters: WorkspaceFilterState;
  selectedSightingId?: string;
  selectedCameraId?: string;
  onSelectSighting: (sighting: VerifiedVehicleSighting) => void;
  onSelectCamera: (camera: SentinelCameraLocation) => void;
  onOpenLiveStream: (cameraId: string) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
}

// Default center coordinates: Gujarat Central (Ahmedabad)
const GUJARAT_CENTER = { lat: 23.0225, lng: 72.5714 };

/**
 * Hook-based Polyline component for robust Google Maps native polyline rendering
 */
function TrajectoryPolyline({ 
  points, 
  visible = true 
}: { 
  points: { lat: number; lng: number }[]; 
  visible?: boolean; 
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: '#0284c7', // Sky-600 / Command blue
        strokeOpacity: 0.9,
        strokeWeight: 4,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: '#0284c7',
              fillColor: '#38bdf8',
              fillOpacity: 1
            },
            offset: '50%',
            repeat: '100px'
          }
        ],
        map
      });
    } else {
      polylineRef.current.setPath(points);
      polylineRef.current.setVisible(visible && points.length > 1);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, points, visible]);

  return null;
}

/**
 * Controller component to handle programmatically focusing or fitting bounds
 */
function MapBoundsController({
  sightings,
  selectedSighting,
  triggerFit
}: {
  sightings: VerifiedVehicleSighting[];
  selectedSighting?: VerifiedVehicleSighting;
  triggerFit: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    if (selectedSighting && selectedSighting.latitude && selectedSighting.longitude) {
      map.panTo({ lat: selectedSighting.latitude, lng: selectedSighting.longitude });
      map.setZoom(15);
      return;
    }

    const validCoords = sightings.filter(s => s.latitude && s.longitude);
    if (validCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validCoords.forEach(s => {
        bounds.extend({ lat: s.latitude!, lng: s.longitude! });
      });
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [map, triggerFit, selectedSighting]);

  return null;
}

export function GoogleMapsIntelligenceViewer({
  cameras,
  sightings,
  alerts,
  filters,
  selectedSightingId,
  selectedCameraId,
  onSelectSighting,
  onSelectCamera,
  onOpenLiveStream,
  onAcknowledgeAlert
}: GoogleMapsIntelligenceViewerProps) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const mapId = (import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID').trim();

  // Active info popup states
  const [activeCameraPopup, setActiveCameraPopup] = useState<SentinelCameraLocation | null>(null);
  const [activeSightingPopup, setActiveSightingPopup] = useState<VerifiedVehicleSighting | null>(null);
  const [activeAlertPopup, setActiveAlertPopup] = useState<CorrelatedTargetAlert | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [triggerFitCount, setTriggerFitCount] = useState<number>(0);
  const [mapLoadError, setMapLoadError] = useState<boolean>(false);

  // Selected sighting object
  const activeSighting = useMemo(() => {
    return sightings.find(s => s.observationId === selectedSightingId);
  }, [sightings, selectedSightingId]);

  // Filtered cameras with real coordinates
  const validCameras = useMemo(() => {
    if (!filters.showCameraLayer) return [];
    return cameras.filter(c => {
      if (!c.latitude || !c.longitude || !c.hasCoordinates) return false;
      if (filters.district !== 'all' && c.district.toLowerCase() !== filters.district.toLowerCase()) return false;
      return true;
    });
  }, [cameras, filters.showCameraLayer, filters.district]);

  // Valid chronological sighting path
  const trajectoryPath = useMemo(() => {
    if (!filters.showCorridorLayer) return [];
    return sightings
      .filter(s => s.latitude && s.longitude)
      .map(s => ({ lat: s.latitude!, lng: s.longitude! }));
  }, [sightings, filters.showCorridorLayer]);

  // Alerts with real coordinates
  const validAlerts = useMemo(() => {
    if (!filters.showAlertLayer) return [];
    return alerts.filter(a => a.latitude && a.longitude);
  }, [alerts, filters.showAlertLayer]);

  const handleFitToTrajectory = () => {
    setTriggerFitCount(prev => prev + 1);
  };

  // Render Configuration Required State if API key is missing (Never render a fake map)
  const renderMissingApiKeyScreen = () => {
    return (
      <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-6 text-slate-100 select-none">
        <div className="relative z-10 max-w-lg w-full bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-center text-slate-100 uppercase tracking-wider mb-1">
            GOOGLE MAPS CONFIGURATION REQUIRED
          </h3>
          <p className="text-xs text-slate-400 text-center mb-5 leading-relaxed">
            Gujarat Police Sentinel Grid God's Eye V2 operates strictly on authoritative Google Maps Platform GIS infrastructure. In accordance with operational standards, synthetic or placeholder maps are strictly disabled.
          </p>

          <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono mb-4">
            <div className="flex items-center justify-between text-rose-400 font-semibold">
              <span>Missing:</span>
              <span>VITE_GOOGLE_MAPS_API_KEY</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Optional / Required:</span>
              <span className={mapId ? 'text-emerald-400' : 'text-amber-300'}>
                {mapId ? `VITE_GOOGLE_MAP_ID (${mapId})` : 'VITE_GOOGLE_MAP_ID (Recommended for Advanced Markers)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Authoritative Sentinel Cameras:</span>
              <span className="text-slate-200 font-semibold">{cameras.length} loaded ({validCameras.length} mapped)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Location Status:</span>
              <span className="text-emerald-400">{validCameras.length} Verified GPS / {cameras.length - validCameras.length} Pending Survey</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-800/60 p-3 rounded border border-slate-700/60 space-y-1">
            <span className="font-semibold text-slate-200 block">Operator / Developer Diagnostic:</span>
            <p>1. Open your project environment file or settings.</p>
            <p>2. Define <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY=&lt;YOUR_API_KEY&gt;</code>.</p>
            <p>3. Optionally set <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">VITE_GOOGLE_MAP_ID=&lt;YOUR_MAP_ID&gt;</code> to enable Google Maps Advanced Markers.</p>
          </div>
        </div>
      </div>
    );
  };

  // Render Unavailable State if Google Maps Platform fails to load
  const renderMapUnavailableScreen = () => {
    return (
      <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-6 text-slate-100 select-none">
        <div className="relative z-10 max-w-lg w-full bg-slate-900 border border-rose-900/60 rounded-xl p-6 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-center text-rose-300 uppercase tracking-wider mb-1">
            GOOGLE MAPS UNAVAILABLE
          </h3>
          <p className="text-xs text-slate-400 text-center mb-5 leading-relaxed">
            Google Maps Platform JavaScript API failed to initialize. Synthetic fallback maps are prohibited by system policy.
          </p>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-rose-300 mb-4 space-y-1">
            <div className="font-semibold text-slate-300">Failure Diagnostic:</div>
            <div>• Google Maps API script error or connection timed out</div>
            <div>• Verify API key billing status and HTTP referrer restrictions</div>
            <div>• Ensure Maps JavaScript API is enabled in Google Cloud Console</div>
          </div>

          <button
            onClick={() => setMapLoadError(false)}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Retry Google Maps Connection
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex-1 bg-slate-950 overflow-hidden flex flex-col">
      {/* Floating Tactical Map Control HUD */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 shadow-lg text-xs text-slate-200">
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded font-semibold text-sky-400 border border-slate-700">
          <Navigation className="w-3.5 h-3.5" />
          <span>Gujarat Police GIS</span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mapType === 'roadmap' ? 'bg-sky-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mapType === 'satellite' ? 'bg-sky-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Fit / Recenter Buttons */}
        <button
          onClick={handleFitToTrajectory}
          title="Fit bounds to vehicle journey corridor"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Fit Corridor</span>
        </button>

        {/* Active Target Indicator Badge */}
        {sightings.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{sightings.length} Chronological Sighting Points</span>
          </div>
        )}
      </div>

      {/* Map Legend Overlay (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-700/80 shadow-xl text-[11px] text-slate-300">
        <div className="font-semibold text-slate-100 flex items-center gap-1.5 pb-1 border-b border-slate-800">
          <Layers className="w-3 h-3 text-sky-400" />
          <span>Surveillance Layers</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
          <span>Sentinel Camera (Live)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500 ring-2 ring-sky-500/30 flex items-center justify-center text-[8px] font-bold text-white">
            1
          </div>
          <span>Target Observation Sighting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-sky-500" />
          <span>Corridor Trajectory Line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
          <span>Critical Alert Incident</span>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="w-full h-full relative flex-1">
        {!apiKey ? (
          renderMissingApiKeyScreen()
        ) : mapLoadError ? (
          renderMapUnavailableScreen()
        ) : (
          <APIProvider 
            apiKey={apiKey}
            onError={() => {
              console.warn('[Google Maps Platform] Loading error caught.');
              setMapLoadError(true);
            }}
          >
            <Map
              defaultCenter={GUJARAT_CENTER}
              defaultZoom={11}
              mapId={mapId}
              mapTypeId={mapType}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              disableDefaultUI={false}
              zoomControl={true}
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={false}
              className="w-full h-full"
            >
              {/* Native Polyline for Sighting Journey */}
              <TrajectoryPolyline points={trajectoryPath} visible={filters.showCorridorLayer} />

              {/* Dynamic Bounds & Pan Controller */}
              <MapBoundsController 
                sightings={sightings} 
                selectedSighting={activeSighting} 
                triggerFit={triggerFitCount} 
              />

              {/* Fixed Sentinel Cameras (Advanced Markers) */}
              {validCameras.map((cam) => {
                const isSelected = selectedCameraId === cam.cameraId;
                const isOnline = cam.status === 'LIVE';
                const isDegraded = cam.status === 'DEGRADED';

                return (
                  <AdvancedMarker
                    key={`cam-${cam.cameraId}`}
                    position={{ lat: cam.latitude!, lng: cam.longitude! }}
                    title={`${cam.name} (${cam.district})`}
                    onClick={() => {
                      onSelectCamera(cam);
                      setActiveCameraPopup(cam);
                      setActiveSightingPopup(null);
                      setActiveAlertPopup(null);
                    }}
                  >
                    <div 
                      className={`relative flex items-center justify-center p-1.5 rounded-full shadow-lg cursor-pointer transition-all transform hover:scale-125 ${
                        isSelected 
                          ? 'bg-sky-500 ring-4 ring-sky-400/50 scale-125 z-30' 
                          : isOnline 
                          ? 'bg-slate-900 border-2 border-emerald-500 text-emerald-400 hover:border-emerald-300' 
                          : isDegraded 
                          ? 'bg-slate-900 border-2 border-amber-500 text-amber-400' 
                          : 'bg-slate-900 border-2 border-slate-600 text-slate-500'
                      }`}
                    >
                      <CameraIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} />
                      {/* Real status indicator badge */}
                      <span 
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-slate-900 ${
                          isOnline ? 'bg-emerald-400 animate-ping opacity-75' : isDegraded ? 'bg-amber-400' : 'bg-slate-500'
                        }`} 
                      />
                      <span 
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-slate-900 ${
                          isOnline ? 'bg-emerald-400' : isDegraded ? 'bg-amber-400' : 'bg-slate-500'
                        }`} 
                      />
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Chronological Vehicle Sightings (Advanced Markers) */}
              {sightings.map((sighting, idx) => {
                if (!sighting.latitude || !sighting.longitude) return null;
                const isSelected = selectedSightingId === sighting.observationId;
                const seq = sighting.sequenceIndex !== undefined ? sighting.sequenceIndex : idx + 1;

                return (
                  <AdvancedMarker
                    key={`sight-${sighting.observationId}`}
                    position={{ lat: sighting.latitude, lng: sighting.longitude }}
                    title={`Sighting #${seq}: ${sighting.rawPlateText} at ${sighting.cameraName}`}
                    onClick={() => {
                      onSelectSighting(sighting);
                      setActiveSightingPopup(sighting);
                      setActiveCameraPopup(null);
                      setActiveAlertPopup(null);
                    }}
                  >
                    <div 
                      className={`relative flex items-center justify-center cursor-pointer transition-all transform ${
                        isSelected 
                          ? 'scale-125 z-40' 
                          : 'hover:scale-110 z-20'
                      }`}
                    >
                      {/* Outer pulse if active */}
                      {isSelected && (
                        <div className="absolute -inset-2 bg-sky-500/40 rounded-full animate-ping pointer-events-none" />
                      )}

                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full shadow-2xl border ${
                        isSelected 
                          ? 'bg-sky-500 border-white text-white font-bold' 
                          : 'bg-slate-900/95 border-sky-400 text-sky-300 hover:border-sky-300'
                      }`}>
                        <Car className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono font-bold">#{seq}</span>
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Correlated Active Alerts (Advanced Markers) */}
              {validAlerts.map((alert) => (
                <AdvancedMarker
                  key={`alert-${alert.alertId}`}
                  position={{ lat: alert.latitude!, lng: alert.longitude! }}
                  title={`Alert: ${alert.eventType} (${alert.vehiclePlate})`}
                  onClick={() => {
                    setActiveAlertPopup(alert);
                    setActiveCameraPopup(null);
                    setActiveSightingPopup(null);
                  }}
                >
                  <div className="relative cursor-pointer transform hover:scale-125 transition-transform z-30">
                    <div className="absolute -inset-2 bg-rose-500/40 rounded-full animate-ping pointer-events-none" />
                    <div className="flex items-center justify-center w-7 h-7 bg-rose-600 text-white rounded-full shadow-2xl border-2 border-white">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                </AdvancedMarker>
              ))}

              {/* InfoWindow: Sentinel Camera Popup */}
              {activeCameraPopup && activeCameraPopup.latitude && activeCameraPopup.longitude && (
                <InfoWindow
                  position={{ lat: activeCameraPopup.latitude, lng: activeCameraPopup.longitude }}
                  onCloseClick={() => setActiveCameraPopup(null)}
                >
                  <div className="p-2.5 max-w-xs text-slate-800">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {activeCameraPopup.cameraId}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        activeCameraPopup.status === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {activeCameraPopup.status}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-slate-900 leading-snug mb-1">
                      {activeCameraPopup.name}
                    </h4>

                    <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{activeCameraPopup.location}, {activeCameraPopup.district}</span>
                    </p>

                    <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-200 mb-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">GPS Coords:</span>
                        <span className="font-mono text-slate-800">{activeCameraPopup.latitude.toFixed(4)}, {activeCameraPopup.longitude?.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Capabilities:</span>
                        <span className="text-slate-700 font-medium">{activeCameraPopup.capabilities.join(', ')}</span>
                      </div>
                      {activeCameraPopup.health && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Telemetry:</span>
                          <span className="text-slate-700 font-mono">{activeCameraPopup.health.fps} FPS · {activeCameraPopup.health.bitrateKbps} kbps</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onOpenLiveStream(activeCameraPopup.cameraId);
                        setActiveCameraPopup(null);
                      }}
                      className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Launch Live Feed</span>
                    </button>
                  </div>
                </InfoWindow>
              )}

              {/* InfoWindow: Vehicle Sighting Popup */}
              {activeSightingPopup && activeSightingPopup.latitude && activeSightingPopup.longitude && (
                <InfoWindow
                  position={{ lat: activeSightingPopup.latitude, lng: activeSightingPopup.longitude }}
                  onCloseClick={() => setActiveSightingPopup(null)}
                >
                  <div className="p-2.5 max-w-sm text-slate-800">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                        {activeSightingPopup.normalizedPlateText}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                        OCR: {(activeSightingPopup.ocrConfidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Sighting Snapshot if available */}
                    {activeSightingPopup.thumbnailUrl && (
                      <div className="w-full h-24 mb-2 rounded bg-slate-900 overflow-hidden relative">
                        <img 
                          src={activeSightingPopup.thumbnailUrl} 
                          alt="Sighting Frame" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <span className="absolute bottom-1 right-1 text-[9px] bg-slate-950/80 text-white px-1.5 py-0.5 rounded font-mono">
                          BSA §63 Seal
                        </span>
                      </div>
                    )}

                    <div className="text-xs space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Camera Node:</span>
                        <span className="font-medium text-slate-800">{activeSightingPopup.cameraName} ({activeSightingPopup.cameraId})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Time Observed:</span>
                        <span className="font-mono text-slate-800">{new Date(activeSightingPopup.timestamp).toLocaleTimeString('en-IN', { hour12: false })} IST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Direction / Speed:</span>
                        <span className="text-slate-800 font-medium">
                          {activeSightingPopup.direction || 'Corridor transit'} {activeSightingPopup.speedKmh ? `· ${activeSightingPopup.speedKmh} km/h` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Evidence SHA-256:</span>
                        <span className="font-mono text-slate-600 truncate max-w-[150px]">{activeSightingPopup.originalFrameHash.slice(0, 16)}...</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onOpenLiveStream(activeSightingPopup.cameraId);
                          setActiveSightingPopup(null);
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5 text-sky-400" />
                        <span>Live Stream</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectSighting(activeSightingPopup);
                          setActiveSightingPopup(null);
                        }}
                        className="flex-1 py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Focus Dossier</span>
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}

              {/* InfoWindow: Alert Popup */}
              {activeAlertPopup && activeAlertPopup.latitude && activeAlertPopup.longitude && (
                <InfoWindow
                  position={{ lat: activeAlertPopup.latitude, lng: activeAlertPopup.longitude }}
                  onCloseClick={() => setActiveAlertPopup(null)}
                >
                  <div className="p-2.5 max-w-xs text-slate-800">
                    <div className="flex items-center justify-between gap-2 border-b border-rose-200 pb-1.5 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded uppercase">
                        {activeAlertPopup.severity} ALERT
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {activeAlertPopup.vehiclePlate}
                      </span>
                    </div>

                    <h5 className="font-semibold text-xs text-slate-900 mb-1">
                      {activeAlertPopup.eventType.toUpperCase()}
                    </h5>
                    <p className="text-xs text-slate-600 mb-2 leading-tight">
                      {activeAlertPopup.description}
                    </p>

                    <div className="text-[11px] bg-rose-50 p-2 rounded border border-rose-100 mb-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Camera:</span>
                        <span className="font-medium text-slate-800">{activeAlertPopup.cameraId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="font-mono text-slate-800">{new Date(activeAlertPopup.timestamp).toLocaleTimeString('en-IN', { hour12: false })} IST</span>
                      </div>
                    </div>

                    {onAcknowledgeAlert && activeAlertPopup.status === 'new' && (
                      <button
                        onClick={() => {
                          onAcknowledgeAlert(activeAlertPopup.alertId);
                          setActiveAlertPopup(null);
                        }}
                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Acknowledge Incident</span>
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        )}
      </div>
    </div>
  );
}
