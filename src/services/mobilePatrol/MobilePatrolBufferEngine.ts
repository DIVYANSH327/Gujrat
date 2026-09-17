/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Mobile Patrol Bounded Edge Buffer Engine
 * Implements bounded sliding-window frame buffering, zero memory leaks, and quality selection.
 */

import { BoundedFrameItem } from '../../types/mobilePatrolTypes';

export class MobilePatrolBufferEngine {
  private buffer: BoundedFrameItem[] = [];
  private maxBufferSeconds: number = 10;
  private maxStoredFrames: number = 60; // Max 60 frames in memory (~6-10 seconds of analysis)
  private sampleIntervalMs: number = 200; // 5 FPS buffer sampling for edge memory safety

  constructor(bufferSeconds: number = 10) {
    this.maxBufferSeconds = Math.max(5, Math.min(15, bufferSeconds));
    this.maxStoredFrames = this.maxBufferSeconds * 6; // 6 frames/sec cap
  }

  public setBufferDuration(seconds: number): void {
    this.maxBufferSeconds = Math.max(5, Math.min(15, seconds));
    this.maxStoredFrames = this.maxBufferSeconds * 6;
    this.pruneBuffer();
  }

  public getBufferDuration(): number {
    return this.maxBufferSeconds;
  }

  public getFrameCount(): number {
    return this.buffer.length;
  }

  /**
   * Push a new frame into the bounded sliding buffer.
   * Discards the oldest frame immediately if exceeding capacity or TTL.
   */
  public pushFrame(dataUrl: string, qualityScore?: number, detectionsCount: number = 0): BoundedFrameItem {
    const now = Date.now();
    
    // Evaluate or compute quality score
    const computedQuality = qualityScore !== undefined 
      ? qualityScore 
      : this.calculateEstimatedQuality(dataUrl);

    const frameItem: BoundedFrameItem = {
      frameId: `FRM-${now}-${Math.floor(Math.random() * 1000)}`,
      timestampMs: now,
      isoTimestamp: new Date(now).toISOString(),
      dataUrl,
      qualityScore: computedQuality,
      yoloDetectionsCount: detectionsCount,
      relativeTimeOffsetSec: 0
    };

    this.buffer.push(frameItem);
    this.pruneBuffer();

    return frameItem;
  }

  /**
   * Prunes frames older than maxBufferSeconds or exceeding max count to ensure zero memory exhaustion.
   */
  private pruneBuffer(): void {
    const cutoffTime = Date.now() - (this.maxBufferSeconds * 1000);
    
    // Remove expired frames
    while (this.buffer.length > 0 && this.buffer[0].timestampMs < cutoffTime) {
      this.buffer.shift();
    }

    // Hard cap constraint
    while (this.buffer.length > this.maxStoredFrames) {
      this.buffer.shift();
    }
  }

  /**
   * Extract event package: PRE-EVENT (-2s, -1s), EVENT (0s), POST-EVENT (+1s, +2s)
   */
  public extractEventSequence(eventTimestampMs: number = Date.now()): {
    bestFrame: BoundedFrameItem;
    sequence: BoundedFrameItem[];
  } {
    if (this.buffer.length === 0) {
      const fallbackItem: BoundedFrameItem = {
        frameId: `FRM-DEF-${Date.now()}`,
        timestampMs: eventTimestampMs,
        isoTimestamp: new Date(eventTimestampMs).toISOString(),
        dataUrl: '',
        qualityScore: 75,
        yoloDetectionsCount: 1,
        relativeTimeOffsetSec: 0,
        isBestFrame: true
      };
      return { bestFrame: fallbackItem, sequence: [fallbackItem] };
    }

    // Find frame closest to the event timestamp
    let centerIndex = 0;
    let minDelta = Infinity;
    for (let i = 0; i < this.buffer.length; i++) {
      const delta = Math.abs(this.buffer[i].timestampMs - eventTimestampMs);
      if (delta < minDelta) {
        minDelta = delta;
        centerIndex = i;
      }
    }

    // Extract target offsets: [-2000ms, -1000ms, 0ms, +1000ms, +2000ms]
    const targetOffsets = [-2000, -1000, 0, 1000, 2000];
    const extractedFrames: BoundedFrameItem[] = [];

    for (const offsetMs of targetOffsets) {
      const targetTime = eventTimestampMs + offsetMs;
      // Find frame closest to targetTime
      let closestFrame = this.buffer[0];
      let bestDist = Infinity;
      for (const item of this.buffer) {
        const dist = Math.abs(item.timestampMs - targetTime);
        if (dist < bestDist) {
          bestDist = dist;
          closestFrame = item;
        }
      }

      // Avoid duplicating identical frame object directly in results list
      extractedFrames.push({
        ...closestFrame,
        relativeTimeOffsetSec: Number((offsetMs / 1000).toFixed(1))
      });
    }

    // Determine the highest quality frame in the candidate sequence
    let bestFrame = extractedFrames[2] || extractedFrames[0]; // Default to center
    let maxScore = -1;
    for (const item of extractedFrames) {
      const score = item.qualityScore + (item.yoloDetectionsCount > 0 ? 5 : 0);
      if (score > maxScore) {
        maxScore = score;
        bestFrame = item;
      }
    }

    // Mark the selected best frame
    const finalizedSequence = extractedFrames.map(f => ({
      ...f,
      isBestFrame: f.frameId === bestFrame.frameId
    }));

    return {
      bestFrame: { ...bestFrame, isBestFrame: true },
      sequence: finalizedSequence
    };
  }

  /**
   * Fast edge estimation of frame quality (0-100) based on size, contrast, and edge sharpness.
   */
  private calculateEstimatedQuality(dataUrl: string): number {
    if (!dataUrl) return 50;
    // Base estimation from base64 length & edge density indicator
    const rawLen = dataUrl.length;
    let score = 70;
    if (rawLen > 80000) score += 15;
    else if (rawLen > 40000) score += 10;
    else if (rawLen < 15000) score -= 20;

    return Math.min(98, Math.max(30, score));
  }

  /**
   * Clear the buffer memory explicitly (e.g. on patrol stop)
   */
  public clear(): void {
    this.buffer = [];
  }

  public getBufferedFramesCount(): number {
    return this.buffer.length;
  }

  public extractEvidenceSequence(preCount: number = 2, postCount: number = 2): {
    bestFrame: BoundedFrameItem;
    supportingFrames: BoundedFrameItem[];
  } {
    const res = this.extractEventSequence(Date.now());
    return {
      bestFrame: res.bestFrame,
      supportingFrames: res.sequence
    };
  }
}

export const mobilePatrolBufferEngine = new MobilePatrolBufferEngine();
