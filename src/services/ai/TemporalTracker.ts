/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Deterministic Lightweight Temporal Visual Tracker
 * 
 * IMPORTANT CONSTRAINTS:
 * - Assigns temporary visual track IDs based on spatial overlap (IoU) and proximity across frames.
 * - DOES NOT perform facial recognition or claim biometric identification.
 * - Explicitly labeled: "VISUAL TRACK — NOT IDENTITY".
 */

import { RealVisionDetection, NormalizedBox } from './types';

export interface ActiveTrack {
  trackId: string;
  category: 'person' | 'vehicle' | 'bike' | 'other';
  lastBox: NormalizedBox;
  lastTimestamp: number;
  detectionsCount: number;
  firstTimestamp: number;
  label: string;
}

export class TemporalTracker {
  private activeTracks: Map<string, ActiveTrack> = new Map();
  private counters = {
    person: 0,
    vehicle: 0,
    bike: 0,
    other: 0
  };

  /** Maximum time gap in seconds between frames to consider tracking the same object */
  private readonly maxTimeGapSec: number = 3.0;

  /** Minimum Intersection-over-Union or proximity threshold */
  private readonly minIouThreshold: number = 0.20;
  private readonly maxCenterDistNorm: number = 0.20;

  /**
   * Reset all active tracks and counters
   */
  public reset(): void {
    this.activeTracks.clear();
    this.counters.person = 0;
    this.counters.vehicle = 0;
    this.counters.bike = 0;
    this.counters.other = 0;
  }

  /**
   * Assign track IDs to detections in the current frame
   */
  public updateTracks(
    detections: RealVisionDetection[],
    frameTimestamp: number
  ): RealVisionDetection[] {
    // 1. Clean up expired tracks
    for (const [id, track] of this.activeTracks.entries()) {
      if (Math.abs(frameTimestamp - track.lastTimestamp) > this.maxTimeGapSec) {
        this.activeTracks.delete(id);
      }
    }

    const matchedTrackIds = new Set<string>();

    // 2. Match each detection against existing tracks
    const updatedDetections: RealVisionDetection[] = detections.map(det => {
      const category = this.getCategory(det.class);
      let bestTrack: ActiveTrack | null = null;
      let bestScore = -1;

      for (const track of this.activeTracks.values()) {
        if (matchedTrackIds.has(track.trackId)) continue;
        if (track.category !== category) continue;

        const iou = this.calculateIoU(det.box, track.lastBox);
        const centerDist = this.calculateCenterDistance(det.box, track.lastBox);

        // Score combines IoU and center proximity
        let score = 0;
        if (iou >= this.minIouThreshold) {
          score = iou * 2;
        } else if (centerDist <= this.maxCenterDistNorm) {
          score = 1 - (centerDist / this.maxCenterDistNorm);
        }

        if (score > 0.3 && score > bestScore) {
          bestScore = score;
          bestTrack = track;
        }
      }

      let assignedTrackId: string;

      if (bestTrack) {
        assignedTrackId = bestTrack.trackId;
        matchedTrackIds.add(assignedTrackId);
        bestTrack.lastBox = det.box;
        bestTrack.lastTimestamp = frameTimestamp;
        bestTrack.detectionsCount += 1;
      } else {
        assignedTrackId = this.generateNewTrackId(category);
        this.activeTracks.set(assignedTrackId, {
          trackId: assignedTrackId,
          category,
          lastBox: det.box,
          lastTimestamp: frameTimestamp,
          detectionsCount: 1,
          firstTimestamp: frameTimestamp,
          label: 'VISUAL TRACK — NOT IDENTITY'
        });
      }

      return {
        ...det,
        trackId: assignedTrackId
      };
    });

    return updatedDetections;
  }

  public getActiveTrackCount(): number {
    return this.activeTracks.size;
  }

  public getActiveTracks(): ActiveTrack[] {
    return Array.from(this.activeTracks.values());
  }

  private getCategory(visionClass: string): 'person' | 'vehicle' | 'bike' | 'other' {
    if (visionClass === 'person') return 'person';
    if (visionClass === 'motorcycle' || visionClass === 'bicycle') return 'bike';
    if (visionClass === 'car' || visionClass === 'bus' || visionClass === 'truck' || visionClass === 'vehicle') return 'vehicle';
    return 'other';
  }

  private generateNewTrackId(category: 'person' | 'vehicle' | 'bike' | 'other'): string {
    this.counters[category] += 1;
    const num = this.counters[category].toString().padStart(3, '0');
    switch (category) {
      case 'person':
        return `P-TRACK-${num}`;
      case 'bike':
        return `BIKE-TRACK-${num}`;
      case 'vehicle':
        return `VEH-TRACK-${num}`;
      default:
        return `OBJ-TRACK-${num}`;
    }
  }

  private calculateIoU(a: NormalizedBox, b: NormalizedBox): number {
    const xA = Math.max(a.x, b.x);
    const yA = Math.max(a.y, b.y);
    const xB = Math.min(a.x + a.width, b.x + b.width);
    const yB = Math.min(a.y + a.height, b.y + b.height);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    if (interArea === 0) return 0;

    const boxAArea = a.width * a.height;
    const boxBArea = b.width * b.height;
    const unionArea = boxAArea + boxBArea - interArea;

    return unionArea > 0 ? interArea / unionArea : 0;
  }

  private calculateCenterDistance(a: NormalizedBox, b: NormalizedBox): number {
    const centerAX = a.x + a.width / 2;
    const centerAY = a.y + a.height / 2;
    const centerBX = b.x + b.width / 2;
    const centerBY = b.y + b.height / 2;

    const dx = centerAX - centerBX;
    const dy = centerAY - centerBY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
