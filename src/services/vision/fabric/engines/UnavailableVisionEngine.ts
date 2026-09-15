/**
 * UnavailableVisionEngine: Null Object Pattern Fallback
 * Gujarat Police CCTV & AI Intelligence Platform
 * 
 * Truthful State Handling:
 * - Emits truthStatus: 'UNAVAILABLE'
 * - Never fabricates fake detections
 */

import { VisionEngine, VisionFrameInput } from '../VisionEngine.js';
import { VisionEngineStatus, VisionObservation } from '../VisionTypes.js';

export class UnavailableVisionEngine implements VisionEngine {
  public readonly name = 'Inference Engine Unavailable';
  public readonly engineType = 'UNAVAILABLE' as const;
  public readonly capabilities: string[] = [];

  public async isAvailable(): Promise<boolean> {
    return false;
  }

  public getStatus(): VisionEngineStatus {
    return {
      name: this.name,
      engineType: this.engineType,
      status: 'UNAVAILABLE',
      version: 'none',
      device: 'CPU',
      latencyMs: 0,
      fps: 0,
      confidenceThreshold: 0,
      capabilities: [],
      errorMessage: 'No vision engine configured for this camera.'
    };
  }

  public async analyzeFrame(input: VisionFrameInput): Promise<VisionObservation> {
    const { cameraId, timestamp, captureIso, sha256 } = input;
    return {
      id: `OBS-UNAVAIL-${cameraId}-${timestamp}`,
      cameraId,
      frameTimestamp: timestamp,
      captureIso,
      engine: this.name,
      model: 'none',
      device: 'CPU',
      latencyMs: 0,
      detections: [],
      tracks: [],
      frameQuality: 'DEGRADED',
      truthStatus: 'UNAVAILABLE',
      sha256,
      reasoningNotes: 'Vision inference engine is unavailable.'
    };
  }
}

export const unavailableVisionEngine = new UnavailableVisionEngine();
