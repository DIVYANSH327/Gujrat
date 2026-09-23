/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Persistent Background Video Intelligence Service Types
 * Gujarat Police CCTV & AI Intelligence Platform
 * 
 * Defines the contract for persistent, decoupled video acquisition,
 * frame extraction, and AI analysis that continues uninterrupted across
 * React component mount/unmount lifecycles.
 */

import { RealVisionDetection, RealRoadSafetyEvent, VisionAgentMetrics } from '../ai/types.js';
import { EvidenceItem, Alert, SecurityEventPayload } from '../../types.js';
import { CapturedFrame } from './types.js';

export type VideoTaskSourceType = 'UPLOADED_FILE' | 'LIVE_CCTV_NODE' | 'STREAM_URL' | 'SAMPLE_TRAFFIC_CLIP';

export type VideoTaskStatus = 
  | 'IDLE'
  | 'INITIALIZING'
  | 'RUNNING'
  | 'PAUSED'
  | 'STOPPED'
  | 'ERROR'
  | 'COMPLETED';

export interface PersistentVideoTaskConfig {
  /** Unique task identifier (e.g. 'task-airport-rd' or 'live-cctv-cam01') */
  taskId: string;
  /** Human-readable task name */
  name: string;
  /** Source classification */
  sourceType: VideoTaskSourceType;
  /** Target camera ID if applicable */
  cameraId?: string;
  /** File object or URL string */
  sourceMedia?: File | string;
  /** Frame analysis frequency (FPS, typically 0.5 to 2.0) */
  fps: number;
  /** Helmet detection confidence threshold */
  helmetThreshold?: number;
  /** Auto-loop video playback for continuous background surveillance */
  loop?: boolean;
  /** Automatically generate alerts on high-confidence violations */
  autoGenerateAlerts?: boolean;
  /** Automatically capture forensic evidence packages */
  autoCaptureEvidence?: boolean;
}

export interface PersistentVideoTaskMetrics {
  framesAcquired: number;
  framesAnalyzed: number;
  framesDroppedConcurrency: number;
  totalDetections: number;
  personsDetected: number;
  carsDetected: number;
  motorcyclesDetected: number;
  bicyclesDetected: number;
  helmetsDetected: number;
  noHelmetsDetected: number;
  violationsDetected: number;
  evidenceCapturedCount: number;
  alertsGeneratedCount: number;
  lastAnalysisDurationMs: number;
  currentVideoTimeSec: number;
  videoDurationSec: number;
  startedAt: string;
  lastAnalyzedAt: string | null;
  uptimeSeconds: number;
}

export interface PersistentVideoTaskState {
  config: PersistentVideoTaskConfig;
  status: VideoTaskStatus;
  errorMessage?: string;
  metrics: PersistentVideoTaskMetrics;
  activeAiModel: string;
  lastFrameSha256?: string;
  lastCapturedFrame?: CapturedFrame;
  currentDetections: RealVisionDetection[];
  currentRoadEvents: RealRoadSafetyEvent[];
  recentEvidence: EvidenceItem[];
  recentAlerts: Alert[];
  recentEvents: SecurityEventPayload[];
  isUiAttached: boolean;
}

export type TaskStateListener = (state: PersistentVideoTaskState) => void;
export type GlobalTasksListener = (tasks: PersistentVideoTaskState[]) => void;
