/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * MobileFrameSampler: Controlled 1-FPS Real Frame Sampler
 * 
 * Guarantees:
 * - Samples frames from real MobileBrowserCameraSource at a controlled rate (default 1 FPS = 1000ms).
 * - Avoids flooding AI pipeline with 30/60 FPS raw stream.
 * - Only samples when camera connectionState === 'CONNECTED'.
 * - Tracks exact real metrics (framesSampled, droppedFrames, lastFrameTimestamp).
 * - No fake or synthetic frames.
 */

import { MobileCameraFrame, MobileCameraMetrics } from '../../types';
import { MobileBrowserCameraSource } from './MobileBrowserCameraSource';

export type FrameSampleCallback = (frame: MobileCameraFrame) => void;

export class MobileFrameSampler {
  private cameraSource: MobileBrowserCameraSource;
  private samplingIntervalMs: number;
  private intervalTimerId: any = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private frameListeners: Set<FrameSampleCallback> = new Set();

  constructor(cameraSource: MobileBrowserCameraSource, samplingIntervalMs: number = 1000) {
    this.cameraSource = cameraSource;
    this.samplingIntervalMs = samplingIntervalMs;
  }

  public getSamplingRate(): number {
    return Math.round(1000 / this.samplingIntervalMs);
  }

  public setSamplingInterval(intervalMs: number): void {
    this.samplingIntervalMs = Math.max(200, intervalMs);
    if (this.isRunning && !this.isPaused) {
      this.stop();
      this.start();
    }
  }

  public isActive(): boolean {
    return this.isRunning && !this.isPaused;
  }

  public isSamplerRunning(): boolean {
    return this.isRunning;
  }

  public subscribe(callback: FrameSampleCallback): () => void {
    this.frameListeners.add(callback);
    return () => {
      this.frameListeners.delete(callback);
    };
  }

  public start(onFrame?: FrameSampleCallback): void {
    if (onFrame) {
      this.frameListeners.add(onFrame);
    }

    if (this.isRunning && !this.isPaused) {
      return;
    }

    this.isRunning = true;
    this.isPaused = false;

    // Immediately attempt one sample if camera is connected
    this.tickSample();

    this.intervalTimerId = setInterval(() => {
      this.tickSample();
    }, this.samplingIntervalMs);
  }

  public stop(): void {
    if (this.intervalTimerId) {
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = null;
    }
    this.isRunning = false;
    this.isPaused = false;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
    }
  }

  private async tickSample(): Promise<void> {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    // Only sample when the real camera stream is actively connected
    if (this.cameraSource.getConnectionState() !== 'CONNECTED') {
      return;
    }

    try {
      const frame = await this.cameraSource.captureFrame(true);
      if (frame) {
        this.frameListeners.forEach((callback) => {
          try {
            callback(frame);
          } catch (err) {
            console.error('Error in frame sample listener:', err);
          }
        });
      }
    } catch (err) {
      console.error('Failed to sample frame from mobile camera source:', err);
    }
  }

  public getMetrics(): MobileCameraMetrics {
    const base = this.cameraSource.getMetrics();
    return {
      ...base,
      samplingRate: this.getSamplingRate()
    };
  }
}

// Default export singleton paired with singleton mobileBrowserCameraSource
import { mobileBrowserCameraSource } from './MobileBrowserCameraSource';
export const mobileFrameSampler = new MobileFrameSampler(mobileBrowserCameraSource, 1000);
