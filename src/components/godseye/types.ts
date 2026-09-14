/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Gujarat Police Sentinel Grid — God's Eye V2 Workspace Types
 */

export interface SentinelCameraLocation {
  cameraId: string;
  sourceId?: string;
  name: string;
  district: string;
  location: string;
  latitude?: number;
  longitude?: number;
  hasCoordinates: boolean;
  status: 'LIVE' | 'OFFLINE' | 'DEGRADED' | 'RECONNECTING';
  streamUrlRef?: string;
  thumbnailUrl?: string;
  protocol?: string;
  sourceType?: string;
  capabilities: string[];
  health?: {
    fps: number;
    bitrateKbps: number;
    packetLossPct: number;
  };
  lastSeen?: string;
  lastFrameTimestamp?: number;
}

export interface VerifiedVehicleSighting {
  observationId: string;
  vehicleObservationId?: string;
  plateObservationId?: string;
  cameraId: string;
  cameraName: string;
  district: string;
  location: string;
  latitude?: number;
  longitude?: number;
  hasCoordinates: boolean;
  timestamp: string;
  frameTimestamp: number;
  rawPlateText: string;
  normalizedPlateText: string;
  plateStatus: string;
  ocrConfidence: number;
  vehicleType: string;
  vehicleColor: string;
  vehicleMake?: string;
  direction?: string;
  speedKmh?: number;
  confidence: number;
  evidenceId: string;
  originalFrameHash: string;
  sourceId: string;
  sourceType: string;
  verificationState: 'OBSERVED' | 'VERIFIED' | 'PREDICTED';
  statutoryCompliance: string;
  thumbnailUrl?: string;
  sequenceIndex?: number;
}

export interface CorrelatedTargetAlert {
  alertId: string;
  eventId: string;
  cameraId: string;
  cameraName?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  eventType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'acknowledged' | 'in_progress' | 'closed';
  confidence: number;
  evidenceId?: string;
  vehiclePlate: string;
  vehicleType?: string;
  description: string;
  verificationState: string;
  acknowledgedBy?: string;
}

export interface CorridorTransitSegment {
  fromCameraId: string;
  fromCameraName: string;
  toCameraId: string;
  toCameraName: string;
  fromCoords: [number, number]; // [lat, lng]
  toCoords: [number, number];
  distanceMeters: number;
  transitTimeSec: number;
  averageSpeedKmh: number;
  isPredicted: boolean;
}

export interface DownstreamPrediction {
  targetCameraId: string;
  cameraName: string;
  district: string;
  latitude: number;
  longitude: number;
  estimatedArrivalSec: number;
  probabilityPercent: number;
  corridorName: string;
}

export interface TargetDossierSummary {
  plateNormalized: string;
  vehicleClass: string;
  vehicleColor: string;
  firstSeenAt?: string;
  firstCameraId?: string;
  firstLocation?: string;
  lastSeenAt?: string;
  lastCameraId?: string;
  lastLocation?: string;
  totalSightings: number;
  distinctCameras: number;
  averageSpeedKmh?: number;
  complianceCertNumber: string;
  digitalSealHash: string;
}

export interface WorkspaceFilterState {
  timeRange: 'TODAY' | 'LAST_24_HOURS' | 'LAST_7_DAYS' | 'ALL';
  district: string;
  selectedCamera: string;
  minConfidence: number;
  showOnlyAlerts: boolean;
  showCameraLayer: boolean;
  showCorridorLayer: boolean;
  showAlertLayer: boolean;
}
