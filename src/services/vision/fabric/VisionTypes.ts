/**
 * Sentinel Vision Fabric Type Definitions
 * Gujarat Police CCTV & AI Intelligence Platform
 * Multi-Engine Architecture: Edge YOLOv8 + Google Cloud Vision + Gemini Reasoning
 */

import { BoundingBox } from '../visionTypes.js';

export type VisionEngineType = 'YOLO' | 'GOOGLE_CLOUD_VISION' | 'GEMINI' | 'UNAVAILABLE';

export type VisionEngineHealthState = 
  | 'READY' 
  | 'RUNNING' 
  | 'DEGRADED' 
  | 'UNAVAILABLE' 
  | 'ERROR' 
  | 'NOT_CONFIGURED';

export type TruthStatus = 'OBSERVED' | 'INFERRED' | 'PREDICTED' | 'UNCERTAIN' | 'UNAVAILABLE';

export type TrackLifecycleState = 'NEW' | 'ACTIVE' | 'LOST' | 'EXPIRED';

export type PipelineProcessingState =
  | 'VEHICLE_DETECTED'
  | 'PLATE_REGION_VISIBLE'
  | 'HSRP_CANDIDATE'
  | 'FRAME_SELECTED'
  | 'AI_VERIFICATION_PENDING'
  | 'PLATE_READABLE'
  | 'PLATE_VERIFIED'
  | 'PLATE_UNCERTAIN'
  | 'PLATE_NOT_READABLE'
  | 'AI_UNAVAILABLE'
  | 'EVIDENCE_READY';

export interface VisionEngineStatus {
  name: string;
  engineType: VisionEngineType;
  status: VisionEngineHealthState;
  version: string;
  device: 'CPU' | 'CUDA';
  latencyMs: number;
  fps: number;
  confidenceThreshold: number;
  capabilities: string[];
  modelLicenseNotice?: string;
  errorMessage?: string;
  lastActive?: string;
}

export interface VisionDetection {
  id: string;
  cameraId: string;
  frameTimestamp: number;
  engine: string;
  model: string;
  className: string;
  confidence: number;
  bbox: BoundingBox; // Normalized { x, y, width, height }
  trackId?: string;
  truthStatus: TruthStatus;
}

export interface VisionTrack {
  trackId: string; // Camera-local track ID (e.g. TRK-CAM01-042)
  cameraId: string;
  className: string;
  confidence: number;
  bbox: BoundingBox;
  firstSeen: string;
  lastSeen: string;
  frameCount: number;
  truthStatus: TruthStatus;
  state: TrackLifecycleState;
  plateCandidate?: boolean;
  bestFrameId?: string;
  bestFrameScore?: number;
  candidateFrameCount?: number;
  pipelineStatus?: PipelineProcessingState;
}

export interface VisionObservation {
  id: string;
  cameraId: string;
  frameTimestamp: number;
  captureIso: string;
  engine: string;
  model: string;
  device: 'CPU' | 'CUDA';
  latencyMs: number;
  detections: VisionDetection[];
  tracks: VisionTrack[];
  frameQuality: 'READABLE' | 'UNREADABLE' | 'DEGRADED';
  truthStatus: TruthStatus;
  sha256: string;
  frameUrl?: string;
  reasoningNotes?: string;
}

export type CameraVisionProfileType = 
  | 'TRAFFIC_HIGHWAY' 
  | 'TRAFFIC_JUNCTION' 
  | 'TRANSIT_HUB' 
  | 'GENERAL_SURVEILLANCE';

export interface CameraVisionProfile {
  cameraId: string;
  cameraName: string;
  profileName: CameraVisionProfileType;
  allowedCapabilities: {
    objectDetection: boolean;
    vehicleDetection: boolean;
    personDetection: boolean;
    trafficAnalysis: boolean;
    platePipeline: boolean;
    nightMode: boolean;
    thermalMode: boolean;
    ptzMode: boolean;
  };
  preferredEngine: 'AUTO' | 'YOLO' | 'CLOUD' | 'GEMINI';
  frameSamplingRateHz: number;
  confidenceThreshold: number;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface VisionFabricConfiguration {
  defaultEngine: 'AUTO' | 'YOLO' | 'CLOUD' | 'GEMINI';
  yoloModel: 'YOLOv8n' | 'YOLOv8s';
  confidenceThreshold: number;
  imageSize: 640 | 1280;
  trackingEnabled: boolean;
  cloudReasoningEnabled: boolean;
  plateOcrEnabled: boolean;
  modelLicenseAcknowledged: boolean;
}

export interface VisionFabricTelemetry {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  mode: 'EDGE + CLOUD';
  engines: Record<string, VisionEngineStatus>;
  activeCameraId: string;
  activeProfile: CameraVisionProfile;
  framesReceived: number;
  objectsDetected: number;
  activeTracksCount: number;
  platesReadCount: number;
  latencies: {
    frameAcquisitionMs: number;
    decodeMs: number;
    yoloMs: number;
    ocrMs: number;
    cloudAiMs: number;
    queueMs: number;
    endToEndMs: number;
  };
  recentDetections: VisionDetection[];
  activeTracks: VisionTrack[];
  latestObservation: VisionObservation | null;
  routerState: {
    selectedEngine: string;
    reason: string;
    truthStatus: TruthStatus;
  };
}
