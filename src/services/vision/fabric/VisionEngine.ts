/**
 * Common VisionEngine Interface
 * Gujarat Police CCTV & AI Intelligence Platform
 * Pluggable engine specification enabling YOLO local, Google Cloud Vision, Gemini, and future models
 */

import { VisionEngineStatus, VisionObservation } from './VisionTypes.js';

export interface VisionFrameInput {
  cameraId: string;
  timestamp: number;
  captureIso: string;
  frameBuffer: Buffer;
  mimeType: string;
  sha256: string;
  width?: number;
  height?: number;
  qualityMetrics?: {
    sharpnessScore?: number;
    brightnessScore?: number;
    contrastScore?: number;
    isReadable?: boolean;
  };
}

export interface VisionEngine {
  readonly name: string;
  readonly engineType: 'YOLO' | 'GOOGLE_CLOUD_VISION' | 'GEMINI' | 'UNAVAILABLE';
  readonly capabilities: string[];
  
  /**
   * Evaluates if the engine is configured, authenticated, and ready to accept frames.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Returns current health, version, device, latency, and capability status.
   */
  getStatus(): VisionEngineStatus;

  /**
   * Performs real inference on a genuine CCTV frame buffer.
   */
  analyzeFrame(input: VisionFrameInput): Promise<VisionObservation>;
}
