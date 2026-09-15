/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * GoogleMapsIntelligenceViewer: Professional Clean Light Police GIS Command Map
 * Authoritative Sentinel CCTV Nodes, Verified Multi-Camera Observation Path,
 * Solid Observed vs Dashed Predicted Trajectories, and Instant Camera Info Windows.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { 
  Camera, 
  MapPin, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Compass, 
  AlertTriangle, 
  Eye, 
  Radio, 
  CheckCircle2, 
  RefreshCw, 
  Navigation, 
  ShieldAlert, 
  Sparkles,
  Car,
  Video
} from 'lucide-react';
import { 
  SentinelCameraLocation, 
  VerifiedVehicleSighting, 
  CorrelatedTargetAlert, 
  WorkspaceFilterState,
  DownstreamPrediction
} from './types';

interface GoogleMapsIntelligenceViewerProps {
  cameras: SentinelCameraLocation[];
  sightings: VerifiedVehicleSighting[];
  alerts: CorrelatedTargetAlert[];
  filters: WorkspaceFilterState;
  selectedSightingId?: string;
  selectedCameraId?: string;
  downstreamPrediction?: DownstreamPrediction | null;
  onSelectSighting: (sighting: VerifiedVehicleSighting) => void;
  onSelectCamera: (camera: SentinelCameraLocation) => void;
  onOpenLiveStream: (cameraId: string) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

// Default center coordinates: Gujarat Central (Ahmedabad)
const GUJARAT_CENTER = { lat: 23.0225, lng: 72.5714 };

/**
 * Native Google Maps Polyline Component for Solid Observed & Dashed Predicted Paths
 */
function TrajectoryPolylines({
  observedPoints,
  predictedPoints,
  showPath = true
}: {
  observedPoints: { lat: number; lng: number }[];
  predictedPoints: { lat: number; lng: number }[];
  showPath?: boolean;
}) {
  const map = useMap();
  const observedPolyRef = useRef<google.maps.Polyline | null>(null);
  const predictedPolyRef = useRef<google.maps.Polyline | null>(null);

  // 1. Solid Blue Line for OBSERVED Trajectory
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    if (!observedPolyRef.current) {
      observedPolyRef.current = new google.maps.Polyline({
        path: observedPoints,
        geodesic: true,
        strokeColor: '#2563eb', // Blue-600 (Clean Command Center Blue)
        strokeOpacity: 0.95,
        strokeWeight: 4,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: '#1d4ed8',
              fillColor: '#3b82f6',
              fillOpacity: 1
            },
            offset: '50%',
            repeat: '120px'
          }
        ],
        map
      });
    } else {
      observedPolyRef.current.setPath(observedPoints);
      observedPolyRef.current.setVisible(showPath && observedPoints.length > 1);
    }

    return () => {
      if (observedPolyRef.current) {
        observedPolyRef.current.setMap(null);
        observedPolyRef.current = null;
      }
    };
  }, [map, observedPoints, showPath]);

  // 2. Dashed Amber Line for PREDICTED Trajectory
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    const dashedSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      strokeColor: '#d97706', // Amber-600
      scale: 3
    };

    if (!predictedPolyRef.current) {
      predictedPolyRef.current = new google.maps.Polyline({
        path: predictedPoints,
        geodesic: true,
        strokeOpacity: 0,
        strokeWeight: 3,
        icons: [
          {
            icon: dashedSymbol,
            offset: '0',
            repeat: '14px'
          }
        ],
        map
      });
    } else {
      predictedPolyRef.current.setPath(predictedPoints);
      predictedPolyRef.current.setVisible(showPath && predictedPoints.length > 1);
    }

    return () => {
      if (predictedPolyRef.current) {
        predictedPolyRef.current.setMap(null);
        predictedPolyRef.current = null;
      }
    };
  }, [map, predictedPoints, showPath]);

  return null;
}

/**
 * Controller to handle Map Bounds and Centering
 */
function MapBoundsController({
  sightings,
  cameras,
  selectedCamera,
  selectedSighting,
  triggerFit
}: {
  sightings: VerifiedVehicleSighting[];
  cameras: SentinelCameraLocation[];
  selectedCamera?: SentinelCameraLocation | null;
  selectedSighting?: VerifiedVehicleSighting;
  triggerFit: number;
}) {
  const map = useMap();

  // Focus on Selected Camera
  useEffect(() => {
    if (!map || !selectedCamera || !selectedCamera.latitude || !selectedCamera.longitude) return;
    map.panTo({ lat: selectedCamera.latitude, lng: selectedCamera.longitude });
    map.setZoom(16);
  }, [map, selectedCamera]);

  // Focus on Selected Sighting
  useEffect(() => {
    if (!map || !selectedSighting || !selectedSighting.latitude || !selectedSighting.longitude) return;
    map.panTo({ lat: selectedSighting.latitude, lng: selectedSighting.longitude });
    map.setZoom(16);
  }, [map, selectedSighting]);

  // Fit Bounds across all active investigation points
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    const validSightingCoords = sightings.filter(s => s.latitude && s.longitude);
    const validCameraCoords = cameras.filter(c => c.latitude && c.longitude && c.hasCoordinates);

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (validSightingCoords.length > 0) {
      validSightingCoords.forEach(s => {
        bounds.extend({ lat: s.latitude!, lng: s.longitude! });
        hasPoints = true;
      });
    } else if (validCameraCoords.length > 0) {
      validCameraCoords.forEach(c => {
        bounds.extend({ lat: c.latitude!, lng: c.longitude! });
        hasPoints = true;
      });
    }

    if (hasPoints) {
      map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
    }
  }, [map, triggerFit]);

  return null;
}

export function GoogleMapsIntelligenceViewer({
  cameras,
  sightings,
  alerts,
  filters,
  selectedSightingId,
  selectedCameraId,
  downstreamPrediction,
  onSelectSighting,
  onSelectCamera,
  onOpenLiveStream,
  onAcknowledgeAlert,
  isFullscreen = false,
  onToggleFullscreen
}: GoogleMapsIntelligenceViewerProps) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const mapId = (import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID').trim();

  // Active info popup states
  const [activeCameraPopup, setActiveCameraPopup] = useState<SentinelCameraLocation | null>(null);
  const [activeSightingPopup, setActiveSightingPopup] = useState<VerifiedVehicleSighting | null>(null);
  const [activeAlertPopup, setActiveAlertPopup] = useState<CorrelatedTargetAlert | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [triggerFitCount, setTriggerFitCount] = useState<number>(0);
  const [showLayersMenu, setShowLayersMenu] = useState<boolean>(false);
  const [mapLoadError, setMapLoadError] = useState<boolean>(false);

  // Local layer controls
  const [layers, setLayers] = useState({
    cameras: true,
    sightings: true,
    trajectory: true,
    incidents: true,
    traffic: false
  });

  // Selected sighting object
  const activeSighting = useMemo(() => {
    return sightings.find(s => s.observationId === selectedSightingId);
  }, [sightings, selectedSightingId]);

  // Selected camera object
  const activeCamera = useMemo(() => {
    return cameras.find(c => c.cameraId === selectedCameraId) || null;
  }, [cameras, selectedCameraId]);

  // Filtered cameras with real coordinates only
  const validCameras = useMemo(() => {
    if (!layers.cameras || !filters.showCameraLayer) return [];
    return cameras.filter(c => {
      if (!c.latitude || !c.longitude || !c.hasCoordinates) return false;
      if (filters.district !== 'all' && c.district.toLowerCase() !== filters.district.toLowerCase()) return false;
      return true;
    });
  }, [cameras, layers.cameras, filters.showCameraLayer, filters.district]);

  // Chronological observed trajectory points
  const observedPath = useMemo(() => {
    if (!layers.trajectory || !filters.showCorridorLayer) return [];
    return sightings
      .filter(s => s.latitude && s.longitude)
      .map(s => ({ lat: s.latitude!, lng: s.longitude! }));
  }, [sightings, layers.trajectory, filters.showCorridorLayer]);

  // Predicted corridor points (from last observed to predicted next camera)
  const predictedPath = useMemo(() => {
    if (!layers.trajectory || !downstreamPrediction || observedPath.length === 0) return [];
    const lastObserved = observedPath[observedPath.length - 1];
    
    // Find target camera coordinates for prediction
    const targetCam = cameras.find(c => c.cameraId === downstreamPrediction.predictedCameraId);
    if (targetCam && targetCam.latitude && targetCam.longitude) {
      return [lastObserved, { lat: targetCam.latitude, lng: targetCam.longitude }];
    }
    return [];
  }, [observedPath, downstreamPrediction, cameras, layers.trajectory]);

  // Alerts with real coordinates
  const validAlerts = useMemo(() => {
    if (!layers.incidents || !filters.showAlertLayer) return [];
    return alerts.filter(a => a.latitude && a.longitude);
  }, [alerts, layers.incidents, filters.showAlertLayer]);

  const handleFitInvestigation = useCallback(() => {
    setTriggerFitCount(prev => prev + 1);
  }, []);

  // Missing API Key screen (Professional white fallback)
  if (!apiKey) {
    return (
      <div className="relative w-full h-full min-h-[500px] bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 select-none border border-slate-200">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              GOOGLE MAPS PLATFORM CONFIGURATION
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gujarat Police Sentinel Command Center operates on Google Maps GIS infrastructure. Please configure your API credentials.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-rose-600 font-semibold">
              <span>Required:</span>
              <span>VITE_GOOGLE_MAPS_API_KEY</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Authoritative Nodes:</span>
              <span>{cameras.length} cameras ({validCameras.length} mapped)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[520px] bg-slate-100 flex flex-col overflow-hidden select-none">
      {/* Floating Top Control HUD (Clean White) */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-md text-xs text-slate-800">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold border border-blue-100">
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>Gujarat GIS Command</span>
        </div>

        {/* Roadmap / Satellite Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 rounded-md text-xs transition-all ${
              mapType === 'roadmap'
                ? 'bg-white text-blue-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-md text-xs transition-all ${
              mapType === 'satellite'
                ? 'bg-white text-blue-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Fit Investigation Button */}
        <button
          onClick={handleFitInvestigation}
          title="Fit bounds to all active cameras & vehicle sightings"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors shadow-2xs"
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Fit Investigation</span>
        </button>

        {/* Layer Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLayersMenu(!showLayersMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              showLayersMenu
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>Layers</span>
          </button>

          {/* Layer Menu Popover */}
          {showLayersMenu && (
            <div className="absolute top-full mt-1.5 left-0 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-30 space-y-1 text-xs">
              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={layers.cameras}
                  onChange={(e) => setLayers(l => ({ ...l, cameras: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Sentinel Cameras</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={layers.sightings}
                  onChange={(e) => setLayers(l => ({ ...l, sightings: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Vehicle Sightings</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={layers.trajectory}
                  onChange={(e) => setLayers(l => ({ ...l, trajectory: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Investigation Path</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={layers.incidents}
                  onChange={(e) => setLayers(l => ({ ...l, incidents: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Incidents</span>
              </label>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle Button */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Expand Map"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-blue-600" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-600" />}
          </button>
        )}
      </div>

      {/* Floating Bottom-Left Clean Legend */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg text-[11px] text-slate-700">
        <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Surveillance GIS Legend</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs ring-2 ring-emerald-100" />
          <span>Live Camera</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100" />
          <span>Degraded Node</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100" />
          <span>Offline Node</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
            1
          </div>
          <span>Observed Sighting</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 bg-blue-600" />
          <span className="font-medium text-blue-700">Observed Route</span>
        </div>

        {downstreamPrediction && (
          <div className="flex items-center gap-2">
            <div className="w-5 border-t-2 border-dashed border-amber-500" />
            <span className="font-medium text-amber-700">Predicted Checkpoint</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rotate-45 bg-rose-600" />
          <span>Incident Point</span>
        </div>
      </div>

      {/* Main Google Maps Component */}
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={GUJARAT_CENTER}
          defaultZoom={11}
          mapId={mapId || undefined}
          mapTypeId={mapType}
          disableDefaultUI={false}
          zoomControl={true}
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
          className="w-full h-full flex-1"
        >
          {/* Native Polyline Engine */}
          <TrajectoryPolylines
            observedPoints={observedPath}
            predictedPoints={predictedPath}
            showPath={layers.trajectory}
          />

          {/* Bounds / Focus Controller */}
          <MapBoundsController
            sightings={sightings}
            cameras={cameras}
            selectedCamera={activeCamera}
            selectedSighting={activeSighting}
            triggerFit={triggerFitCount}
          />

          {/* 1. Verified Camera Markers */}
          {layers.cameras && validCameras.map((cam) => {
            const isSelected = cam.cameraId === selectedCameraId;
            const isDegraded = cam.status === 'DEGRADED';
            const isOffline = cam.status === 'OFFLINE';

            return (
              <AdvancedMarker
                key={`cam-marker-${cam.cameraId}`}
                position={{ lat: cam.latitude!, lng: cam.longitude! }}
                onClick={() => {
                  onSelectCamera(cam);
                  setActiveCameraPopup(cam);
                }}
                title={`${cam.name} (${cam.district})`}
              >
                <div
                  className={`relative flex items-center justify-center rounded-xl p-1.5 transition-transform hover:scale-110 shadow-md cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white ring-4 ring-blue-300 scale-110 z-30'
                      : isOffline
                      ? 'bg-rose-600 text-white'
                      : isDegraded
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white ring-2 ring-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />

                  {/* Pulsing Dot for Live Status */}
                  {cam.status === 'LIVE' && !isSelected && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-white animate-ping" />
                  )}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* 2. Vehicle Observation Sighting Markers */}
          {layers.sightings && sightings.filter(s => s.latitude && s.longitude).map((sighting, idx) => {
            const isSelected = sighting.observationId === selectedSightingId;

            return (
              <AdvancedMarker
                key={`sighting-marker-${sighting.observationId || idx}`}
                position={{ lat: sighting.latitude!, lng: sighting.longitude! }}
                onClick={() => {
                  onSelectSighting(sighting);
                  setActiveSightingPopup(sighting);
                }}
                title={`Sighting ${idx + 1}: ${sighting.vehiclePlate} at ${sighting.cameraName}`}
              >
                <div
                  className={`relative flex items-center justify-center rounded-full transition-transform hover:scale-110 shadow-lg cursor-pointer ${
                    isSelected
                      ? 'w-7 h-7 bg-blue-600 text-white ring-4 ring-blue-200 scale-125 z-40'
                      : 'w-6 h-6 bg-blue-700 text-white ring-2 ring-white'
                  }`}
                >
                  <span className="text-[10px] font-black">{idx + 1}</span>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* 3. Downstream Predicted Marker */}
          {downstreamPrediction && downstreamPrediction.predictedCameraId && (() => {
            const predCam = cameras.find(c => c.cameraId === downstreamPrediction.predictedCameraId);
            if (!predCam || !predCam.latitude || !predCam.longitude) return null;

            return (
              <AdvancedMarker
                position={{ lat: predCam.latitude, lng: predCam.longitude }}
                title={`Predicted Checkpoint: ${predCam.name}`}
              >
                <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white ring-4 ring-amber-200/80 shadow-lg animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </AdvancedMarker>
            );
          })()}

          {/* 4. Critical Incident Markers */}
          {layers.incidents && validAlerts.map((alert) => (
            <AdvancedMarker
              key={`alert-marker-${alert.alertId}`}
              position={{ lat: alert.latitude!, lng: alert.longitude! }}
              onClick={() => setActiveAlertPopup(alert)}
            >
              <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-rose-600 text-white ring-2 ring-white shadow-lg animate-bounce">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </AdvancedMarker>
          ))}

          {/* Camera InfoWindow Popup (Clean White Card) */}
          {activeCameraPopup && activeCameraPopup.latitude && activeCameraPopup.longitude && (
            <InfoWindow
              position={{ lat: activeCameraPopup.latitude, lng: activeCameraPopup.longitude }}
              onCloseClick={() => setActiveCameraPopup(null)}
            >
              <div className="p-3 bg-white max-w-xs select-none space-y-2.5 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeCameraPopup.status === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-xs font-bold font-mono text-slate-900">
                      {activeCameraPopup.cameraId.toUpperCase()}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {activeCameraPopup.status}
                  </span>
                </div>

                {/* Location Info */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {activeCameraPopup.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {activeCameraPopup.location} • {activeCameraPopup.district}
                  </p>
                </div>

                {/* Telemetry Fields */}
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-[10px] space-y-1 font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>GPS:</span>
                    <span className="text-slate-800 font-semibold">
                      {activeCameraPopup.latitude.toFixed(5)}, {activeCameraPopup.longitude.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stream:</span>
                    <span className={activeCameraPopup.status === 'LIVE' ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                      {activeCameraPopup.status === 'LIVE' ? 'Available (HLS/RTSP)' : 'Degraded'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      onSelectCamera(activeCameraPopup);
                      onOpenLiveStream(activeCameraPopup.cameraId);
                    }}
                    className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Camera</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectCamera(activeCameraPopup);
                      setActiveCameraPopup(null);
                    }}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Focus
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Sighting InfoWindow Popup */}
          {activeSightingPopup && activeSightingPopup.latitude && activeSightingPopup.longitude && (
            <InfoWindow
              position={{ lat: activeSightingPopup.latitude, lng: activeSightingPopup.longitude }}
              onCloseClick={() => setActiveSightingPopup(null)}
            >
              <div className="p-3 bg-white max-w-xs select-none space-y-2 font-sans">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black font-mono text-slate-900">
                    {activeSightingPopup.vehiclePlate}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    OBSERVED
                  </span>
                </div>

                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-slate-800">
                    {activeSightingPopup.cameraName} ({activeSightingPopup.cameraId.toUpperCase()})
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {new Date(activeSightingPopup.timestamp).toLocaleTimeString('en-IN', { hour12: false })} IST
                  </p>
                </div>

                <div className="bg-slate-50 p-2 rounded text-[10px] font-mono text-slate-600 flex justify-between">
                  <span>Confidence:</span>
                  <span className="text-emerald-700 font-bold">{Math.round(activeSightingPopup.confidence * 100)}%</span>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
