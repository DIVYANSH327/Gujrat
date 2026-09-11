/**
 * Vehicle Tracking Agent
 * Maintains temporal tracking across consecutive frames.
 * Generates persistent vehicleTrackId (e.g. cam01-v-000182) and associates detections using IoU and centroid distance.
 */

import { BoundingBox, VehicleDetection, VehicleTrack, VisionFrame } from './visionTypes.js';

export class VehicleTrackingAgent {
  private static instance: VehicleTrackingAgent;
  private tracks: Map<string, VehicleTrack> = new Map();
  private trackCounter = 180; // Starts from 180 for realistic production numbering

  public static getInstance(): VehicleTrackingAgent {
    if (!VehicleTrackingAgent.instance) {
      VehicleTrackingAgent.instance = new VehicleTrackingAgent();
    }
    return VehicleTrackingAgent.instance;
  }

  /**
   * Calculates Intersection-over-Union (IoU) between two bounding boxes.
   */
  public calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
    const xA = Math.max(boxA.x, boxB.x);
    const yA = Math.max(boxA.y, boxB.y);
    const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
    const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = boxA.width * boxA.height;
    const boxBArea = boxB.width * boxB.height;
    const unionArea = boxAArea + boxBArea - interArea;

    return unionArea > 0 ? interArea / unionArea : 0;
  }

  /**
   * Calculates normalized Euclidean centroid distance.
   */
  public calculateCentroidDistance(boxA: BoundingBox, boxB: BoundingBox): number {
    const cAx = boxA.x + boxA.width / 2;
    const cAy = boxA.y + boxA.height / 2;
    const cBx = boxB.x + boxB.width / 2;
    const cBy = boxB.y + boxB.height / 2;
    return Math.sqrt(Math.pow(cAx - cBx, 2) + Math.pow(cAy - cBy, 2));
  }

  /**
   * Ingests detections for a new frame, updates existing tracks or creates new tracks.
   */
  public updateTracks(frame: VisionFrame, detections: VehicleDetection[]): VehicleTrack[] {
    const nowMs = Date.now();
    const updatedTracks: VehicleTrack[] = [];
    const matchedTrackIds = new Set<string>();

    // Filter vehicle detections only
    const vehicleDetections = detections.filter(d =>
      ['car', 'motorcycle', 'scooter', 'bus', 'truck', 'auto_rickshaw', 'van', 'suv', 'other_vehicle'].includes(d.class)
    );

    // Clean up stale tracks (> 60s inactivity)
    for (const [id, track] of this.tracks.entries()) {
      const lastSeenMs = new Date(track.lastSeen).getTime();
      if (nowMs - lastSeenMs > 60000) {
        track.status = 'EXPIRED';
        this.tracks.delete(id);
      }
    }

    for (const det of vehicleDetections) {
      let bestMatch: VehicleTrack | null = null;
      let highestScore = 0;

      for (const track of this.tracks.values()) {
        if (matchedTrackIds.has(track.vehicleTrackId)) continue;
        if (track.cameraId !== frame.cameraId) continue;

        const lastBoxEntry = track.boxes[track.boxes.length - 1];
        if (!lastBoxEntry) continue;

        const iou = this.calculateIoU(det.box, lastBoxEntry.box);
        const dist = this.calculateCentroidDistance(det.box, lastBoxEntry.box);
        const classMatch = track.vehicleClass === det.class ? 0.2 : -0.1;

        // Score based on IoU and spatial proximity
        const score = iou * 0.6 + (1 - Math.min(1, dist * 3)) * 0.4 + classMatch;

        if (score > 0.35 && score > highestScore) {
          highestScore = score;
          bestMatch = track;
        }
      }

      if (bestMatch) {
        // Update existing track
        matchedTrackIds.add(bestMatch.vehicleTrackId);
        bestMatch.lastSeen = frame.timestamp;
        bestMatch.frameCount++;
        bestMatch.boxes.push({
          frameId: frame.frameId,
          timestamp: nowMs,
          box: det.box
        });
        if (bestMatch.boxes.length > 20) bestMatch.boxes.shift(); // Keep window bounded
        bestMatch.trackingConfidence = Math.min(0.98, bestMatch.trackingConfidence + 0.05);

        updatedTracks.push(bestMatch);
      } else {
        // Create new track with persistent formatted ID
        this.trackCounter++;
        const paddedNum = String(this.trackCounter).padStart(6, '0');
        const trackId = `${frame.cameraId.toLowerCase()}-v-${paddedNum}`;

        const newTrack: VehicleTrack = {
          vehicleTrackId: trackId,
          cameraId: frame.cameraId,
          vehicleClass: det.class,
          firstSeen: frame.timestamp,
          lastSeen: frame.timestamp,
          frameCount: 1,
          boxes: [{
            frameId: frame.frameId,
            timestamp: nowMs,
            box: det.box
          }],
          bestFrameId: frame.frameId,
          bestPlateCandidate: null,
          trackingConfidence: Math.max(0.65, det.confidence),
          status: 'TRACKING'
        };

        this.tracks.set(trackId, newTrack);
        matchedTrackIds.add(trackId);
        updatedTracks.push(newTrack);
      }
    }

    return updatedTracks;
  }

  public getTrack(trackId: string): VehicleTrack | undefined {
    return this.tracks.get(trackId);
  }

  public getActiveTracksCount(): number {
    return Array.from(this.tracks.values()).filter(t => t.status !== 'EXPIRED').length;
  }

  public getAllTracks(): VehicleTrack[] {
    return Array.from(this.tracks.values());
  }
}

export const vehicleTrackingAgent = VehicleTrackingAgent.getInstance();
