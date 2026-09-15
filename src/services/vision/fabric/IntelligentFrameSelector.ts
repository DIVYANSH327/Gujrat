/**
 * Intelligent Frame Selection Engine
 * Gujarat Police CCTV & AI Intelligence Platform (SENTINEL GRID)
 *
 * Implements measurable mathematical frame scoring to gatekeep expensive AI inference:
 * FRAME_SCORE =
 *     vehicleConfidence
 *     + plateVisibilityScore
 *     + sharpnessScore
 *     + exposureScore
 *     + plateSizeScore
 *     - blurPenalty
 *     - occlusionPenalty
 *
 * Rules:
 * 1. YOLOv8 is the continuous visual perception and frame-selection layer.
 * 2. Only selected high-value frames are forwarded to the AI Dispatcher.
 * 3. Never send every frame to Google AI.
 * 4. Bounded candidate frame buffers per vehicle track (max 5 candidates).
 */

import crypto from 'node:crypto';
import { BoundingBox } from '../visionTypes.js';
import { FrameQualityMetrics, frameQualityEngine } from '../../server/FrameQualityEngine.js';
import { ImageCropUtil } from '../imageCropUtil.js';

export interface CandidateFrame {
  id: string;
  cameraId: string;
  trackId: string;
  frameTimestamp: number;
  captureIso: string;
  frameBuffer: Buffer;
  frameSha256: string;
  vehicleClass: string;
  vehicleConfidence: number;
  vehicleBbox: BoundingBox;
  
  // Real Frame Quality Scores
  laplacianVariance: number;
  meanLuminance: number;
  contrastScore: number;
  blurCategory: 'CRISP' | 'ACCEPTABLE' | 'BLURRY' | 'SEVERE_MOTION_BLUR';
  exposureCategory: 'UNDEREXPOSED' | 'NORMAL' | 'OVEREXPOSED' | 'NIGHT_IR';

  // Plate Region Candidate
  plateRegionVisible: boolean;
  plateBbox?: BoundingBox;
  plateCropBuffer?: Buffer;
  plateCropSha256?: string;
  plateCropWidth?: number;
  plateCropHeight?: number;

  // Mathematical Frame Scoring Breakdown
  scores: {
    vehicleConfidence: number;      // 0.0 - 1.0
    plateVisibilityScore: number;   // 0.0 - 1.0
    sharpnessScore: number;         // 0.0 - 1.0 (Laplacian variance normalized)
    exposureScore: number;          // 0.0 - 1.0 (Luminance balance)
    plateSizeScore: number;         // 0.0 - 1.0 (Pixel width suitability)
    blurPenalty: number;            // 0.0 - 0.8 (Motion/focus blur penalty)
    occlusionPenalty: number;       // 0.0 - 0.5 (Frame edge cut-off penalty)
    totalScore: number;             // Composite composite frame score
  };

  // Pipeline Status for this candidate
  pipelineStatus: 
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

  truthState: 'OBSERVED' | 'INFERRED' | 'PREDICTED' | 'UNCERTAIN' | 'NOT_AVAILABLE';
}

export class IntelligentFrameSelector {
  private static instance: IntelligentFrameSelector;

  // Minimum composite score required to qualify for Google AI verification dispatch
  private readonly HSRP_CANDIDATE_THRESHOLD = 2.40;
  // Minimum sharpness score to prevent sending severely blurred frames
  private readonly MIN_SHARPNESS_THRESHOLD = 0.20;

  public static getInstance(): IntelligentFrameSelector {
    if (!IntelligentFrameSelector.instance) {
      IntelligentFrameSelector.instance = new IntelligentFrameSelector();
    }
    return IntelligentFrameSelector.instance;
  }

  /**
   * Evaluates a real vehicle frame detection and computes the authentic mathematical frame score.
   */
  public async evaluateFrame(
    cameraId: string,
    trackId: string,
    frameBuffer: Buffer,
    frameTimestamp: number,
    captureIso: string,
    vehicleClass: string,
    vehicleConfidence: number,
    vehicleBbox: BoundingBox,
    estimatedPlateBox?: BoundingBox
  ): Promise<CandidateFrame> {
    const frameSha256 = crypto.createHash('sha256').update(frameBuffer).digest('hex');

    // 1. Analyze physical frame quality using Laplacian variance and luminance
    const qualityMetrics: FrameQualityMetrics = await frameQualityEngine.assessFrame(
      cameraId,
      frameBuffer,
      frameTimestamp
    );

    // 2. Compute Mathematical Component Scores:
    // a) Vehicle Confidence (normalized 0.0 - 1.0)
    const cVehicle = Math.max(0, Math.min(1.0, vehicleConfidence));

    // b) Sharpness Score (normalized Laplacian variance, 600+ is excellent)
    const cSharpness = Math.max(0, Math.min(1.0, qualityMetrics.sharpnessScore / 600));

    // c) Exposure Score (closeness to 128 mid-gray luminance)
    const distFromIdealLuminance = Math.abs(qualityMetrics.brightnessScore - 128);
    const cExposure = Math.max(0, 1.0 - distFromIdealLuminance / 128);

    // d) Blur Penalty based on detected Laplacian category
    let blurPenalty = 0.0;
    if (qualityMetrics.blurCategory === 'SEVERE_MOTION_BLUR') {
      blurPenalty = 0.8;
    } else if (qualityMetrics.blurCategory === 'BLURRY') {
      blurPenalty = 0.4;
    } else if (qualityMetrics.blurCategory === 'ACCEPTABLE') {
      blurPenalty = 0.1;
    }

    // e) Occlusion / Edge Contact Penalty
    // If vehicle touches frame borders, it is entering or leaving the field of view
    let occlusionPenalty = 0.0;
    if (
      vehicleBbox.x < 0.02 ||
      vehicleBbox.y < 0.02 ||
      vehicleBbox.x + vehicleBbox.width > 0.98 ||
      vehicleBbox.y + vehicleBbox.height > 0.98
    ) {
      occlusionPenalty = 0.35;
    }

    // f) Plate Region Visibility and Crop Extraction
    let plateRegionVisible = false;
    let plateVisibilityScore = 0.0;
    let plateSizeScore = 0.0;
    let plateCropBuffer: Buffer | undefined;
    let plateCropSha256: string | undefined;
    let plateCropWidth = 0;
    let plateCropHeight = 0;
    let actualPlateBbox: BoundingBox | undefined = estimatedPlateBox;

    // If estimatedPlateBox is not provided, estimate bottom 35% center of vehicle bounding box
    if (!actualPlateBbox && (vehicleClass === 'car' || vehicleClass === 'truck' || vehicleClass === 'bus' || vehicleClass === 'motorcycle')) {
      const pWidth = vehicleBbox.width * 0.45;
      const pHeight = vehicleBbox.height * 0.22;
      const pX = vehicleBbox.x + (vehicleBbox.width - pWidth) / 2;
      const pY = vehicleBbox.y + vehicleBbox.height * 0.65;
      actualPlateBbox = {
        x: Math.max(0, Math.min(0.99, pX)),
        y: Math.max(0, Math.min(0.99, pY)),
        width: Math.max(0.01, Math.min(1.0 - pX, pWidth)),
        height: Math.max(0.01, Math.min(1.0 - pY, pHeight))
      };
    }

    if (actualPlateBbox) {
      try {
        const cropRes = await ImageCropUtil.cropJpeg(
          frameBuffer,
          actualPlateBbox,
          qualityMetrics.width || 1920,
          qualityMetrics.height || 1080
        );

        if (cropRes && cropRes.buffer.length > 0) {
          plateCropBuffer = cropRes.buffer;
          plateCropSha256 = cropRes.sha256;
          plateCropWidth = cropRes.width;
          plateCropHeight = cropRes.height;
          plateRegionVisible = true;

          // Plate visibility score: aspect ratio check (standard Indian HSRP is ~3.5:1 or ~2:1 for 2-wheelers)
          const aspectRatio = cropRes.width / Math.max(1, cropRes.height);
          if (aspectRatio >= 1.5 && aspectRatio <= 5.0) {
            plateVisibilityScore = 1.0;
          } else {
            plateVisibilityScore = 0.5;
          }

          // Plate size score: pixel width evaluation
          // >= 80px: 1.0, 50-80px: 0.75, 35-50px: 0.45, < 35px: 0.15
          if (cropRes.width >= 80) {
            plateSizeScore = 1.0;
          } else if (cropRes.width >= 50) {
            plateSizeScore = 0.75;
          } else if (cropRes.width >= 35) {
            plateSizeScore = 0.45;
          } else {
            plateSizeScore = 0.15;
          }
        }
      } catch {
        // Crop failure or invalid coordinates
        plateRegionVisible = false;
        plateVisibilityScore = 0.0;
        plateSizeScore = 0.0;
      }
    }

    // Formula execution
    const totalScore = Math.max(
      0,
      cVehicle +
      plateVisibilityScore +
      cSharpness +
      cExposure +
      plateSizeScore -
      blurPenalty -
      occlusionPenalty
    );

    // Classify pipeline status
    let pipelineStatus: CandidateFrame['pipelineStatus'] = 'VEHICLE_DETECTED';
    if (plateRegionVisible) {
      if (totalScore >= this.HSRP_CANDIDATE_THRESHOLD && cSharpness >= this.MIN_SHARPNESS_THRESHOLD) {
        pipelineStatus = 'HSRP_CANDIDATE';
      } else {
        pipelineStatus = 'PLATE_REGION_VISIBLE';
      }
    }

    const candidateId = `CAN-${cameraId}-${trackId}-${frameTimestamp}`;

    return {
      id: candidateId,
      cameraId,
      trackId,
      frameTimestamp,
      captureIso,
      frameBuffer,
      frameSha256,
      vehicleClass,
      vehicleConfidence: cVehicle,
      vehicleBbox,
      laplacianVariance: qualityMetrics.sharpnessScore,
      meanLuminance: qualityMetrics.brightnessScore,
      contrastScore: qualityMetrics.contrastScore,
      blurCategory: qualityMetrics.blurCategory,
      exposureCategory: qualityMetrics.exposureCategory,
      plateRegionVisible,
      plateBbox: actualPlateBbox,
      plateCropBuffer,
      plateCropSha256,
      plateCropWidth,
      plateCropHeight,
      scores: {
        vehicleConfidence: Number(cVehicle.toFixed(3)),
        plateVisibilityScore: Number(plateVisibilityScore.toFixed(3)),
        sharpnessScore: Number(cSharpness.toFixed(3)),
        exposureScore: Number(cExposure.toFixed(3)),
        plateSizeScore: Number(plateSizeScore.toFixed(3)),
        blurPenalty: Number(blurPenalty.toFixed(3)),
        occlusionPenalty: Number(occlusionPenalty.toFixed(3)),
        totalScore: Number(totalScore.toFixed(3))
      },
      pipelineStatus,
      truthState: 'OBSERVED'
    };
  }

  /**
   * Evaluates if a new candidate frame is superior to existing best candidate frame.
   */
  public isSuperiorCandidate(newCandidate: CandidateFrame, currentBest?: CandidateFrame): boolean {
    if (!currentBest) return true;
    // Require at least a 0.15 score improvement to replace existing selected frame to prevent jitter
    return newCandidate.scores.totalScore > currentBest.scores.totalScore + 0.15;
  }
}

export const intelligentFrameSelector = IntelligentFrameSelector.getInstance();
