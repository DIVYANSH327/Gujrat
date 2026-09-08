/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * CameraOutputNormalizer: Multi-Protocol Video Ingest Normalization Engine
 * Normalizes RTSP, ONVIF, DVR/NVR, Vendor VMS, Mobile Cameras, and Demo Feeds into Unified Domain Records.
 * Guarantees explicit SourceClassification on every frame and observation.
 */

import { 
  ObservationSourceType, 
  VehicleObservation, 
  VehicleClassType, 
  normalizeLicensePlate 
} from '../types';

export type NormalizedSourceType =
  | 'REAL_CAMERA'
  | 'AUTHORIZED_VIDEO'
  | 'MOBILE_CAMERA'
  | 'SYNTHETIC_DEMO'
  | 'YOUTUBE_DEMO';

export interface NormalizedCameraFrame {
  frameId: string;
  cameraId: string;
  sourceType: NormalizedSourceType;
  protocol: 'RTSP' | 'ONVIF' | 'VMS' | 'WEBRTC' | 'MP4_UPLOAD' | 'YOUTUBE_IFRAME';
  width: number;
  height: number;
  fps: number;
  timestamp: string;
  isAccessiblePixelBuffer: boolean;
  frameUrl?: string;
  rawPayload?: any;
}

export interface RawStreamPayload {
  cameraId: string;
  streamUrl?: string;
  protocol?: string;
  deviceVendor?: string;
  sourceClassification?: string;
  width?: number;
  height?: number;
  timestamp?: string;
  detectionMetadata?: any;
}

export class CameraOutputNormalizer {
  private static instance: CameraOutputNormalizer | null = null;

  private constructor() {}

  public static getInstance(): CameraOutputNormalizer {
    if (!CameraOutputNormalizer.instance) {
      CameraOutputNormalizer.instance = new CameraOutputNormalizer();
    }
    return CameraOutputNormalizer.instance;
  }

  /**
   * Classify camera input into authoritative NormalizedSourceType
   */
  public resolveSourceType(input: RawStreamPayload): NormalizedSourceType {
    const rawClass = input.sourceClassification || '';
    const camId = input.cameraId || '';

    if (rawClass === 'YOUTUBE_DEMO' || camId.startsWith('YT-') || input.protocol === 'YOUTUBE_DEMO') {
      return 'YOUTUBE_DEMO';
    }
    if (camId.includes('MOBILE') || input.protocol === 'MOBILE') {
      return 'MOBILE_CAMERA';
    }
    if (rawClass === 'AUTHORIZED_UPLOADED_VIDEO' || input.protocol === 'MP4_UPLOAD') {
      return 'AUTHORIZED_VIDEO';
    }
    if (rawClass === 'REAL_CONNECTED' || input.protocol === 'RTSP' || input.protocol === 'ONVIF' || input.protocol === 'VMS') {
      return 'REAL_CAMERA';
    }
    return 'SYNTHETIC_DEMO';
  }

  /**
   * Normalize an incoming raw stream into a canonical NormalizedCameraFrame
   */
  public normalizeFrame(raw: RawStreamPayload): NormalizedCameraFrame {
    const sourceType = this.resolveSourceType(raw);
    const isAccessible = sourceType !== 'YOUTUBE_DEMO'; // YouTube iframes cannot expose raw pixels to browser DOM

    return {
      frameId: `FRM-${raw.cameraId}-${Date.now()}`,
      cameraId: raw.cameraId,
      sourceType,
      protocol: (raw.protocol as any) || 'RTSP',
      width: raw.width || 1920,
      height: raw.height || 1080,
      fps: 25,
      timestamp: raw.timestamp || new Date().toISOString(),
      isAccessiblePixelBuffer: isAccessible,
      frameUrl: raw.streamUrl,
      rawPayload: raw
    };
  }

  /**
   * Normalize raw AI vision output into a canonical VehicleObservation
   */
  public normalizeObservation(params: {
    cameraId: string;
    cameraName?: string;
    edgeNodeId: string;
    rawDetection: any;
    sourceType?: NormalizedSourceType;
    imageRef: string;
  }): VehicleObservation {
    const d = params.rawDetection;
    const sourceType = params.sourceType || 'REAL_CAMERA';
    const normalizedPlate = d.plateText ? normalizeLicensePlate(d.plateText) : undefined;
    const isWatchlist = normalizedPlate === 'GJ05AB1234' || normalizedPlate === 'GJ01AB1234';

    return {
      observationId: `OBS-${params.cameraId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId: `EVT-${Date.now()}`,
      cameraId: params.cameraId,
      cameraName: params.cameraName || `CCTV ${params.cameraId}`,
      edgeNodeId: params.edgeNodeId,
      trackId: d.trackId || `TRACK-${Date.now().toString().slice(-4)}`,
      vehicleClass: (d.vehicleType as VehicleClassType) || 'car',
      vehicleColor: d.color || 'white',
      plateText: d.plateText,
      plateNormalized: normalizedPlate,
      plateConfidence: d.plateConfidence || (d.plateText ? 0.94 : undefined),
      plateStatus: d.plateText ? 'PLATE_READ' : 'PLATE_NOT_READ',
      vehicleConfidence: d.detectionConfidence || 0.95,
      bbox: d.boundingBox ? [d.boundingBox.ymin, d.boundingBox.xmin, d.boundingBox.ymax, d.boundingBox.xmax] : [0.2, 0.2, 0.8, 0.8],
      frameWidth: 1920,
      frameHeight: 1080,
      timestamp: new Date().toISOString(),
      gps: d.gps || { latitude: 23.0410, longitude: 72.5050 },
      heading: d.direction === 'northbound' ? 0 : 90,
      speedEstimate: d.speedEstimate || 48,
      lane: d.lane || 1,
      direction: d.direction || 'Northbound',
      sourceType: sourceType as any,
      analysisMode: sourceType === 'REAL_CAMERA' || sourceType === 'AUTHORIZED_VIDEO' ? 'REAL_AI' : 'SIMULATED_DEMO',
      imageReference: params.imageRef,
      thumbnailReference: params.imageRef,
      evidenceReference: `EVD-${Date.now()}`,
      isBestFrame: true,
      bestFrameScore: 0.92,
      watchlistMatch: isWatchlist,
      watchlistReason: isWatchlist ? 'Active Intercept Warrant' : undefined,
      status: 'CAPTURED',
      isMobileCamera: sourceType === 'MOBILE_CAMERA'
    };
  }
}

export const cameraOutputNormalizer = CameraOutputNormalizer.getInstance();
