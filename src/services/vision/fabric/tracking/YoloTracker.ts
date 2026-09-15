/**
 * YOLO Multi-Object Tracker (SORT / IoU Association)
 * Gujarat Police CCTV & AI Intelligence Platform
 * 
 * Preserves stable trackId across consecutive camera frames.
 * Strictly maintains object tracking ID distinct from vehicle registration numbers.
 */

import { BoundingBox } from '../../visionTypes.js';
import { PipelineProcessingState, TrackLifecycleState, VisionDetection, VisionTrack } from '../VisionTypes.js';
import { CandidateFrame } from '../IntelligentFrameSelector.js';

interface ActiveTrackInternal {
  trackId: string;
  cameraId: string;
  className: string;
  confidence: number;
  bbox: BoundingBox;
  firstSeen: string;
  lastSeen: string;
  frameCount: number;
  missedFrames: number;
  state: TrackLifecycleState;
  plateCandidate: boolean;
  pipelineStatus: PipelineProcessingState;
  candidateFrames: CandidateFrame[]; // Bounded rolling candidate frames (max 5)
  bestFrame: CandidateFrame | null;
  history: Array<{ timestamp: number; bbox: BoundingBox }>;
}

export class YoloTracker {
  private tracks: Map<string, ActiveTrackInternal> = new Map();
  private trackSequence = 1;
  private readonly maxMissedFrames = 15; // Track dropped after 15 missed frames (~3-5s)
  private readonly iouThreshold = 0.30;   // Minimum IoU to associate detection with track
  private readonly maxCandidateFrames = 5; // Bounded candidate frames per vehicle

  /**
   * Calculates Intersection over Union between two normalized bounding boxes.
   */
  public calculateIoU(a: BoundingBox, b: BoundingBox): number {
    const xLeft = Math.max(a.x, b.x);
    const yTop = Math.max(a.y, b.y);
    const xRight = Math.min(a.x + a.width, b.x + b.width);
    const yBottom = Math.min(a.y + a.height, b.y + b.height);

    if (xRight < xLeft || yBottom < yTop) {
      return 0.0;
    }

    const intersectionArea = (xRight - xLeft) * (yBottom - yTop);
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    const unionArea = areaA + areaB - intersectionArea;

    if (unionArea <= 0) return 0.0;
    return intersectionArea / unionArea;
  }

  /**
   * Updates existing tracks with detections in current frame and creates new tracks.
   */
  public update(cameraId: string, timestamp: number, captureIso: string, detections: VisionDetection[]): VisionTrack[] {
    const activeCameraTracks = Array.from(this.tracks.values()).filter(t => t.cameraId === cameraId);
    const matchedTrackIds = new Set<string>();
    const matchedDetectionIndices = new Set<number>();

    // Step 1: Match detections to existing tracks by class and highest IoU
    for (let i = 0; i < detections.length; i++) {
      const det = detections[i];
      let bestMatch: ActiveTrackInternal | null = null;
      let highestIoU = this.iouThreshold;

      for (const trk of activeCameraTracks) {
        if (matchedTrackIds.has(trk.trackId)) continue;
        if (trk.className !== det.className) continue;

        const iou = this.calculateIoU(trk.bbox, det.bbox);
        if (iou > highestIoU) {
          highestIoU = iou;
          bestMatch = trk;
        }
      }

      if (bestMatch) {
        // Associate detection with existing track
        bestMatch.bbox = det.bbox;
        bestMatch.confidence = det.confidence;
        bestMatch.lastSeen = captureIso;
        bestMatch.frameCount += 1;
        bestMatch.missedFrames = 0;
        bestMatch.state = 'ACTIVE';
        bestMatch.history.push({ timestamp, bbox: det.bbox });
        if (bestMatch.history.length > 30) bestMatch.history.shift();

        det.trackId = bestMatch.trackId;
        matchedTrackIds.add(bestMatch.trackId);
        matchedDetectionIndices.add(i);
      }
    }

    // Step 2: Create new tracks for unmatched detections
    for (let i = 0; i < detections.length; i++) {
      if (matchedDetectionIndices.has(i)) continue;
      const det = detections[i];

      const seqNumber = this.trackSequence++;
      const formattedSeq = String(seqNumber).padStart(3, '0');
      const trackId = `TRK-${cameraId.toUpperCase()}-${formattedSeq}`;

      const newTrack: ActiveTrackInternal = {
        trackId,
        cameraId,
        className: det.className,
        confidence: det.confidence,
        bbox: det.bbox,
        firstSeen: captureIso,
        lastSeen: captureIso,
        frameCount: 1,
        missedFrames: 0,
        state: 'NEW',
        plateCandidate: false,
        pipelineStatus: 'VEHICLE_DETECTED',
        candidateFrames: [],
        bestFrame: null,
        history: [{ timestamp, bbox: det.bbox }]
      };

      this.tracks.set(trackId, newTrack);
      det.trackId = trackId;
    }

    // Step 3: Age out unmatched tracks with LOST -> EXPIRED lifecycle
    for (const trk of activeCameraTracks) {
      if (!matchedTrackIds.has(trk.trackId)) {
        trk.missedFrames += 1;
        if (trk.missedFrames >= 1 && trk.missedFrames <= this.maxMissedFrames) {
          trk.state = 'LOST';
        } else if (trk.missedFrames > this.maxMissedFrames) {
          trk.state = 'EXPIRED';
          this.tracks.delete(trk.trackId);
        }
      }
    }

    // Return public VisionTrack representation
    return Array.from(this.tracks.values())
      .filter(t => t.cameraId === cameraId && (t.state === 'NEW' || t.state === 'ACTIVE' || t.state === 'LOST'))
      .map(t => ({
        trackId: t.trackId,
        cameraId: t.cameraId,
        className: t.className,
        confidence: t.confidence,
        bbox: t.bbox,
        firstSeen: t.firstSeen,
        lastSeen: t.lastSeen,
        frameCount: t.frameCount,
        truthStatus: 'OBSERVED',
        state: t.state,
        plateCandidate: t.plateCandidate,
        bestFrameId: t.bestFrame?.id,
        bestFrameScore: t.bestFrame?.scores.totalScore,
        candidateFrameCount: t.candidateFrames.length,
        pipelineStatus: t.pipelineStatus
      }));
  }

  /**
   * Records a candidate frame into the track's bounded candidate buffer.
   */
  public recordCandidateFrame(trackId: string, candidate: CandidateFrame): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    if (candidate.plateRegionVisible) {
      track.plateCandidate = true;
    }

    // Update pipeline status progression
    if (candidate.pipelineStatus === 'HSRP_CANDIDATE') {
      track.pipelineStatus = 'HSRP_CANDIDATE';
    } else if (candidate.pipelineStatus === 'PLATE_REGION_VISIBLE' && track.pipelineStatus === 'VEHICLE_DETECTED') {
      track.pipelineStatus = 'PLATE_REGION_VISIBLE';
    }

    // Update best frame if current candidate has superior score
    if (!track.bestFrame || candidate.scores.totalScore > track.bestFrame.scores.totalScore) {
      track.bestFrame = candidate;
    }

    // Insert candidate into bounded candidateFrames list sorted by totalScore descending
    track.candidateFrames.push(candidate);
    track.candidateFrames.sort((a, b) => b.scores.totalScore - a.scores.totalScore);
    if (track.candidateFrames.length > this.maxCandidateFrames) {
      track.candidateFrames = track.candidateFrames.slice(0, this.maxCandidateFrames);
    }
  }

  public getTrack(trackId: string): ActiveTrackInternal | undefined {
    return this.tracks.get(trackId);
  }

  public getBestFrameForTrack(trackId: string): CandidateFrame | null {
    const track = this.tracks.get(trackId);
    return track ? track.bestFrame : null;
  }

  public getCandidateFramesForTrack(trackId: string): CandidateFrame[] {
    const track = this.tracks.get(trackId);
    return track ? [...track.candidateFrames] : [];
  }

  public updateTrackPipelineStatus(trackId: string, status: PipelineProcessingState): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.pipelineStatus = status;
    }
  }

  public getActiveTracksCount(cameraId?: string): number {
    if (cameraId) {
      return Array.from(this.tracks.values()).filter(t => t.cameraId === cameraId && (t.state === 'NEW' || t.state === 'ACTIVE')).length;
    }
    return Array.from(this.tracks.values()).filter(t => t.state === 'NEW' || t.state === 'ACTIVE').length;
  }

  public getActiveTracks(cameraId?: string): VisionTrack[] {
    const list = Array.from(this.tracks.values());
    const filtered = cameraId 
      ? list.filter(t => t.cameraId === cameraId && (t.state === 'NEW' || t.state === 'ACTIVE')) 
      : list.filter(t => t.state === 'NEW' || t.state === 'ACTIVE');
    return filtered.map(t => ({
      trackId: t.trackId,
      cameraId: t.cameraId,
      className: t.className,
      confidence: t.confidence,
      bbox: t.bbox,
      firstSeen: t.firstSeen,
      lastSeen: t.lastSeen,
      frameCount: t.frameCount,
      truthStatus: 'OBSERVED',
      state: t.state,
      plateCandidate: t.plateCandidate,
      bestFrameId: t.bestFrame?.id,
      bestFrameScore: t.bestFrame?.scores.totalScore,
      candidateFrameCount: t.candidateFrames.length,
      pipelineStatus: t.pipelineStatus
    }));
  }

  public clear(): void {
    this.tracks.clear();
    this.trackSequence = 1;
  }
}

export const yoloTracker = new YoloTracker();
