/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Types for Real Frame-by-Frame AI Vision Pipeline
 */

import { SecurityEventPayload, Alert, EvidenceItem } from '../../types';

export type VisionObjectClass = 
  | 'person'
  | 'car'
  | 'motorcycle'
  | 'bicycle'
  | 'bus'
  | 'truck'
  | 'vehicle'
  | 'unknown';

export type HelmetEvaluation = 'HELMET' | 'NO_HELMET' | 'UNKNOWN';

export type RoadSafetyViolation = 
  | 'NO_HELMET'
  | 'TRIPLE_RIDING'
  | 'WRONG_WAY'
  | 'RED_LIGHT_VIOLATION'
  | 'STOP_LINE_VIOLATION'
  | 'DANGEROUS_PARKING'
  | 'PEDESTRIAN_CONFLICT'
  | 'UNSAFE_RIDING'
  | 'UNKNOWN';

export interface NormalizedBox {
  /** Top-left X normalized to [0, 1] */
  x: number;
  /** Top-left Y normalized to [0, 1] */
  y: number;
  /** Width normalized to [0, 1] */
  width: number;
  /** Height normalized to [0, 1] */
  height: number;
}

export interface RealVisionDetection {
  id?: string;
  class: VisionObjectClass;
  confidence: number;
  box: NormalizedBox;
  attributes?: {
    helmet?: HelmetEvaluation;
    [key: string]: any;
  };
  trackId?: string;
}

export interface RealRoadSafetyEvent {
  type: RoadSafetyViolation;
  confidence: number;
  description?: string;
  trackId?: string;
}

export interface FrameAnalysisRequest {
  frameBase64: string;
  frameTimestamp: number;
  sourceId: string;
  fps?: number;
  helmetThreshold?: number;
}

export interface FrameAnalysisResponse {
  frameTimestamp: number;
  detections: RealVisionDetection[];
  roadSafetyEvents: RealRoadSafetyEvent[];
  aiModel: string;
  analysisTimeMs: number;
  error?: string;
}

export interface VisionAgentMetrics {
  framesAnalyzed: number;
  totalDetections: number;
  personsDetected: number;
  carsDetected: number;
  motorcyclesDetected: number;
  bicyclesDetected: number;
  helmetsDetected: number;
  noHelmetsDetected: number;
  roadSafetyEventsCount: number;
  evidenceCapturedCount: number;
  alertsCreatedCount: number;
  lastAnalysisDelaySec: number;
  status: 'IDLE' | 'LOADING_VIDEO' | 'SAMPLING_FRAME' | 'SENDING_FRAME_TO_AI' | 'AI_ANALYZING' | 'DETECTIONS_RECEIVED' | 'CAPTURING_EVIDENCE' | 'CREATING_ALERT' | 'PAUSED' | 'ERROR';
  errorMessage?: string;
}

export interface ProcessedDetectionEvent {
  event: SecurityEventPayload;
  evidence?: EvidenceItem;
  alert?: Alert;
  watchlistMatch?: boolean;
  trackId: string;
}

export function clampBox(box: { x?: number; y?: number; width?: number; height?: number }): NormalizedBox {
  const x = Math.max(0, Math.min(1, Number(box.x) || 0));
  const y = Math.max(0, Math.min(1, Number(box.y) || 0));
  const maxW = Math.max(0, 1 - x);
  const maxH = Math.max(0, 1 - y);
  const width = Math.max(0.01, Math.min(maxW, Number(box.width) || 0.05));
  const height = Math.max(0.01, Math.min(maxH, Number(box.height) || 0.05));
  return { x, y, width, height };
}

export function normalizeVisionClass(rawClass: string): VisionObjectClass {
  const c = (rawClass || '').toLowerCase().trim();
  if (c.includes('person') || c.includes('pedestrian') || c.includes('human') || c.includes('rider')) return 'person';
  if (c.includes('motorcycle') || c.includes('motorbike') || c.includes('scooter') || c.includes('bike') && !c.includes('bicycle')) return 'motorcycle';
  if (c.includes('bicycle') || c.includes('cyclist')) return 'bicycle';
  if (c.includes('car') || c.includes('sedan') || c.includes('suv') || c.includes('auto')) return 'car';
  if (c.includes('bus')) return 'bus';
  if (c.includes('truck')) return 'truck';
  if (c.includes('vehicle')) return 'vehicle';
  return 'unknown';
}
