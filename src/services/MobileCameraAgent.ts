/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * MobileCameraAgent: Mobile Patrol Interceptor as First-Class Edge AI Node
 * Coordinates dynamic GPS location, heading, on-dash ANPR inference, and offline queueing.
 */

import { BaseAgent } from '../ai-agents/base/BaseAgent';
import { 
  VehicleObservation, 
  ObservationSourceType, 
  PlateReadStatus, 
  normalizeLicensePlate 
} from '../types';
import { godsEyeObservationService } from './GodsEyeObservationService';
import { centralEventBus } from './CentralEventBus';
import { sysEvents } from './Architecture';

export interface MobileTelemetry {
  mobileCameraId: string;
  patrolVehicleId: string;
  operatorId: string;
  gps: { latitude: number; longitude: number };
  heading: number; // 0-360 deg
  speedKmh: number;
  cameraOrientation: 'FORWARD_FACING' | 'REAR_FACING' | 'ROOFTOP_360';
  recordingStatus: 'RECORDING' | 'STANDBY' | 'ERROR';
  networkStatus: '5G_POLICE_NET' | '4G_DEGRADED' | 'OFFLINE_STORE_AND_FORWARD';
  batteryPercent: number;
  storageRemainingPercent: number;
  temperatureCelsius: number;
  resolution: string;
  fps: number;
  aiInferenceStatus: 'ACTIVE_EDGE_TFLITE' | 'STANDBY' | 'OVERHEATED';
  lastHeartbeat: string;
  queuedOfflineSightingsCount: number;
}

export class MobileCameraAgent extends BaseAgent {
  private telemetry: MobileTelemetry;
  private offlineObservationBuffer: VehicleObservation[] = [];

  constructor(params: {
    mobileCameraId: string;
    patrolVehicleId: string;
    operatorId: string;
    initialGps?: { latitude: number; longitude: number };
  }) {
    super({
      agentId: params.mobileCameraId,
      agentType: 'MOBILE_CAMERA',
      region: 'AHMEDABAD',
      assignedScope: 'MOBILE_HIGHWAY_INTERCEPTOR',
      capabilities: ['VISION_DETECTION', 'ANPR_RECOGNITION', 'ROAD_SAFETY', 'EVIDENCE_CAPTURE', 'WATCHLIST'],
      isSimulated: true
    });

    this.telemetry = {
      mobileCameraId: params.mobileCameraId,
      patrolVehicleId: params.patrolVehicleId,
      operatorId: params.operatorId,
      gps: params.initialGps || { latitude: 23.0520, longitude: 72.5180 },
      heading: 45,
      speedKmh: 48,
      cameraOrientation: 'FORWARD_FACING',
      recordingStatus: 'RECORDING',
      networkStatus: '5G_POLICE_NET',
      batteryPercent: 92,
      storageRemainingPercent: 84,
      temperatureCelsius: 41,
      resolution: '1920x1080',
      fps: 30,
      aiInferenceStatus: 'ACTIVE_EDGE_TFLITE',
      lastHeartbeat: new Date().toISOString(),
      queuedOfflineSightingsCount: 0
    };
  }

  public getTelemetry(): MobileTelemetry {
    return { ...this.telemetry, lastHeartbeat: new Date().toISOString() };
  }

  public updateGpsLocation(lat: number, lng: number, heading: number, speedKmh: number): void {
    this.telemetry.gps = { latitude: lat, longitude: lng };
    this.telemetry.heading = heading;
    this.telemetry.speedKmh = speedKmh;
  }

  /**
   * Record a vehicle sighting from the moving patrol interceptor
   */
  public async captureMobileObservation(params: {
    plateText?: string;
    vehicleClass: 'car' | 'motorcycle' | 'truck' | 'bus' | 'suv' | 'van';
    color: string;
    image: string;
  }): Promise<VehicleObservation> {
    const obsId = `OBS-${this.telemetry.mobileCameraId}-${Date.now()}`;
    const normalized = params.plateText ? normalizeLicensePlate(params.plateText) : undefined;
    const isWatchlist = normalized === 'GJ05AB1234' || normalized === 'GJ01AB1234';

    const timestamp = new Date().toISOString();
    const obs: VehicleObservation = {
      observationId: obsId,
      vehicleId: normalized ? `VEH-${normalized}` : undefined,
      plateRaw: params.plateText,
      plateNormalized: normalized,
      timestamp,
      cameraId: this.telemetry.mobileCameraId,
      cameraName: `Gujarat Police Mobile Patrol (${this.telemetry.patrolVehicleId})`,
      cameraType: 'MOBILE_CAMERA',
      location: {
        latitude: this.telemetry.gps.latitude,
        longitude: this.telemetry.gps.longitude,
        accuracyMeters: 8,
        heading: this.telemetry.heading,
        speed: this.telemetry.speedKmh,
        capturedAt: timestamp,
        source: 'DEVICE_GPS',
        locationStatus: 'VERIFIED'
      },
      locationSource: 'DEVICE_GPS',
      locationAccuracyMeters: 8,
      locationStatus: 'VERIFIED',
      heading: this.telemetry.heading,
      speed: this.telemetry.speedKmh,
      frameReference: params.image,
      evidenceReferences: [`EVD-MOB-${Date.now()}`],
      sourceOfTruth: 'CAMERA_OBSERVED',
      captureMethod: 'MOBILE_DASHCAM',

      eventId: `EVT-MOB-${Date.now()}`,
      edgeNodeId: `MOBILE-EDGE-${this.telemetry.patrolVehicleId}`,
      trackId: `TRACK-MOB-${Date.now().toString().slice(-4)}`,
      vehicleClass: params.vehicleClass,
      vehicleColor: params.color,
      plateText: params.plateText,
      plateConfidence: params.plateText ? 0.94 : undefined,
      plateStatus: params.plateText ? 'PLATE_READ' : 'PLATE_NOT_READ',
      vehicleConfidence: 0.96,
      bbox: [0.25, 0.25, 0.75, 0.75],
      frameWidth: 1920,
      frameHeight: 1080,
      gps: { ...this.telemetry.gps },
      speedEstimate: Math.round(this.telemetry.speedKmh * 1.1),
      lane: 1,
      direction: 'Corridor Pursuit',
      sourceType: 'MOBILE_CAMERA',
      analysisMode: 'REAL_AI',
      imageReference: params.image,
      thumbnailReference: params.image,
      evidenceReference: `EVD-MOB-${Date.now()}`,
      isBestFrame: true,
      bestFrameScore: 0.92,
      watchlistMatch: isWatchlist,
      watchlistReason: isWatchlist ? 'Active Intercept Warrant' : undefined,
      status: 'CAPTURED',
      isMobileCamera: true
    };

    // If offline store-and-forward, buffer locally
    if (this.telemetry.networkStatus === 'OFFLINE_STORE_AND_FORWARD') {
      this.offlineObservationBuffer.push(obs);
      this.telemetry.queuedOfflineSightingsCount = this.offlineObservationBuffer.length;
    } else {
      // Ingest directly into statewide observation service
      godsEyeObservationService.recordObservation(obs);
      centralEventBus.publish({
        eventType: 'VEHICLE_DETECTED',
        sourceId: this.telemetry.mobileCameraId,
        correlationId: `CORR-MOB-${Date.now()}`,
        idempotencyKey: obs.observationId,
        priority: isWatchlist ? 'P0' : 'P3',
        payload: obs
      });
    }

    return obs;
  }

  /**
   * Resync buffered offline events when network restores
   */
  public async syncOfflineBuffer(): Promise<number> {
    const count = this.offlineObservationBuffer.length;
    for (const obs of this.offlineObservationBuffer) {
      godsEyeObservationService.recordObservation(obs);
      centralEventBus.publish({
        eventType: 'VEHICLE_DETECTED',
        sourceId: this.telemetry.mobileCameraId,
        correlationId: `CORR-MOB-SYNC-${Date.now()}`,
        idempotencyKey: obs.observationId,
        priority: obs.watchlistMatch ? 'P0' : 'P3',
        payload: obs
      });
    }
    this.offlineObservationBuffer = [];
    this.telemetry.queuedOfflineSightingsCount = 0;
    this.telemetry.networkStatus = '5G_POLICE_NET';
    sysEvents.emit('mobile_buffer_synced', { mobileCameraId: this.telemetry.mobileCameraId, syncedCount: count });
    return count;
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount++;
    this.recordHeartbeat();
  }

  public async assignJob(job: any): Promise<any> {
    this.activeJobsCount++;
    try {
      if (job?.payload?.plateText) {
        return this.captureMobileObservation({
          plateText: job.payload.plateText,
          vehicleClass: job.payload.vehicleClass || 'car',
          color: job.payload.vehicleColor || 'white',
          image: job.payload.imageReference || 'evidence/simulated/mobile_frame.jpg'
        });
      }
      return { status: 'COMPLETED', agentId: this.agentId };
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.completedJobsCount++;
    }
  }
}

export const mobilePatrolAlpha = new MobileCameraAgent({
  mobileCameraId: 'MOBILE-PATROL-01',
  patrolVehicleId: 'GJ-POL-INT-101',
  operatorId: 'INSP-R-K-JADEJA-8841',
  initialGps: { latitude: 23.0550, longitude: 72.5210 }
});
