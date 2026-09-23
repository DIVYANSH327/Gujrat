/**
 * PlateCandidateDetector.ts
 * Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
 * 
 * Plate candidate extraction & localization abstraction.
 * Localizes plate candidates within detected vehicle crops,
 * performs geometric validation, calculates optical quality metrics,
 * and ranks candidates for multi-frame analysis.
 * 
 * Does NOT assume the entire vehicle crop is the plate.
 */

import crypto from 'node:crypto';
import { BoundingBox } from './visionTypes.js';
import { ImageCropUtil, CropResult } from './imageCropUtil.js';

export type PlateDetectorProvider = 
  | 'NATIVE_ANPR'
  | 'EDGE_AI'
  | 'SENTINEL_PLATE_DETECTOR'
  | 'OCR_HEURISTIC';

export interface PlateCandidate {
  candidateId: string;
  cameraId: string;
  trackId: string;
  captureTimestamp: number;
  frameTimestamp: number;
  vehicleBoundingBox: BoundingBox;
  plateBoundingBox: BoundingBox; // Normalized relative to full frame
  localPlateBox: BoundingBox; // Normalized relative to vehicle crop
  plateWidth: number;
  plateHeight: number;
  aspectRatio: number;
  sharpness: number;
  brightness: number;
  contrast: number;
  motionBlurScore: number;
  cropQuality: number; // 0 - 100 overall optical score
  provider: PlateDetectorProvider;
  rawPlateCrop: Buffer;
  rawPlateCropSha256: string;
  enhancedPlateCrop?: Buffer;
  enhancedPlateCropSha256?: string;
  isGeometricallyValid: boolean;
  rejectionReason?: string;
}

export class PlateCandidateDetector {
  private static instance: PlateCandidateDetector;

  public static getInstance(): PlateCandidateDetector {
    if (!PlateCandidateDetector.instance) {
      PlateCandidateDetector.instance = new PlateCandidateDetector();
    }
    return PlateCandidateDetector.instance;
  }

  /**
   * Localizes plate candidates from a vehicle crop.
   * Tests candidate zones (e.g. lower bumper area, center bumper area),
   * validates geometry (aspect ratio ~1.5 - 6.0, minimum dimensions),
   * and ranks them by optical quality.
   */
  public async extractCandidates(params: {
    cameraId: string;
    trackId: string;
    rawFrameBuffer: Buffer;
    frameWidth: number;
    frameHeight: number;
    vehicleBox: BoundingBox;
    captureTimestamp: number;
    frameTimestamp: number;
    provider?: PlateDetectorProvider;
  }): Promise<PlateCandidate[]> {
    const {
      cameraId,
      trackId,
      rawFrameBuffer,
      frameWidth,
      frameHeight,
      vehicleBox,
      captureTimestamp,
      frameTimestamp,
      provider = 'SENTINEL_PLATE_DETECTOR'
    } = params;

    const candidates: PlateCandidate[] = [];

    // Define standard plate search regions relative to vehicle box:
    // Region 1: Lower Bumper Center (Primary for cars, buses, trucks)
    // Region 2: Lower Bumper Wide
    // Region 3: Rear/Front Mudguard (for two-wheelers)
    const candidateZones: Array<{ id: string; localBox: BoundingBox }> = [
      {
        id: 'bumper_primary',
        localBox: {
          x: 0.15,
          y: 0.58,
          width: 0.70,
          height: 0.35
        }
      },
      {
        id: 'bumper_compact_center',
        localBox: {
          x: 0.22,
          y: 0.65,
          width: 0.56,
          height: 0.30
        }
      },
      {
        id: 'tail_lower_center',
        localBox: {
          x: 0.20,
          y: 0.72,
          width: 0.60,
          height: 0.26
        }
      }
    ];

    for (let idx = 0; idx < candidateZones.length; idx++) {
      const zone = candidateZones[idx];
      // Convert local vehicle box to absolute frame normalized box
      const absBox: BoundingBox = {
        x: Math.max(0, Math.min(0.98, vehicleBox.x + vehicleBox.width * zone.localBox.x)),
        y: Math.max(0, Math.min(0.98, vehicleBox.y + vehicleBox.height * zone.localBox.y)),
        width: Math.max(0.02, Math.min(0.8, vehicleBox.width * zone.localBox.width)),
        height: Math.max(0.015, Math.min(0.6, vehicleBox.height * zone.localBox.height))
      };

      try {
        const crop = await ImageCropUtil.cropJpeg(rawFrameBuffer, absBox, frameWidth, frameHeight);
        const pixelW = crop.width;
        const pixelH = crop.height;
        const aspectRatio = pixelH > 0 ? +(pixelW / pixelH).toFixed(2) : 0;

        // Geometric validation
        let isValid = true;
        let rejectionReason: string | undefined;

        // Indian plates typically have aspect ratio between 1.5 (two-wheeler vertical) and 6.0 (standard rectangular)
        if (pixelW < 45 || pixelH < 14) {
          isValid = false;
          rejectionReason = 'LOW_RESOLUTION';
        } else if (aspectRatio < 1.1 || aspectRatio > 7.5) {
          isValid = false;
          rejectionReason = 'OBLIQUE_ANGLE';
        }

        // Quality assessment (sharpness, contrast, motion blur proxy)
        const qualityAssessment = this.assessCropQuality(crop.buffer, pixelW, pixelH);

        const candidateId = `CAND-${trackId}-${frameTimestamp}-${idx}`;
        const candidate: PlateCandidate = {
          candidateId,
          cameraId,
          trackId,
          captureTimestamp,
          frameTimestamp,
          vehicleBoundingBox: vehicleBox,
          plateBoundingBox: absBox,
          localPlateBox: zone.localBox,
          plateWidth: pixelW,
          plateHeight: pixelH,
          aspectRatio,
          sharpness: qualityAssessment.sharpness,
          brightness: qualityAssessment.brightness,
          contrast: qualityAssessment.contrast,
          motionBlurScore: qualityAssessment.motionBlurScore,
          cropQuality: qualityAssessment.overallQuality,
          provider,
          rawPlateCrop: crop.buffer,
          rawPlateCropSha256: crop.sha256,
          isGeometricallyValid: isValid,
          rejectionReason
        };

        candidates.push(candidate);
      } catch {
        // Skip unprocessable crop
      }
    }

    // Rank candidates: geometrically valid first, then by cropQuality descending
    candidates.sort((a, b) => {
      if (a.isGeometricallyValid && !b.isGeometricallyValid) return -1;
      if (!a.isGeometricallyValid && b.isGeometricallyValid) return 1;
      return b.cropQuality - a.cropQuality;
    });

    return candidates;
  }

  /**
   * Optical analysis of the cropped plate image.
   * Sharpness, contrast, and motion blur are computed directly from image bytes.
   */
  private assessCropQuality(cropBuf: Buffer, width: number, height: number): {
    sharpness: number;
    brightness: number;
    contrast: number;
    motionBlurScore: number;
    overallQuality: number;
  } {
    let brightness = 50;
    let contrast = 50;
    let sharpness = 40;
    let motionBlurScore = 20;

    if (cropBuf && cropBuf.length > 50) {
      // Sample byte variance for contrast and high-frequency transitions for sharpness
      const sampleSize = Math.min(cropBuf.length, 2048);
      let sum = 0;
      for (let i = 0; i < sampleSize; i += 4) {
        sum += cropBuf[i];
      }
      const mean = sum / (sampleSize / 4);
      brightness = Math.min(100, Math.round((mean / 255) * 100));

      let varSum = 0;
      let diffSum = 0;
      for (let i = 0; i < sampleSize - 4; i += 4) {
        varSum += Math.abs(cropBuf[i] - mean);
        diffSum += Math.abs(cropBuf[i] - cropBuf[i + 4]);
      }
      contrast = Math.min(100, Math.round((varSum / (sampleSize / 4) / 128) * 100));
      sharpness = Math.min(100, Math.round((diffSum / (sampleSize / 4) / 64) * 100));
      // Motion blur is inversely related to high-frequency edge transitions
      motionBlurScore = Math.max(0, 100 - sharpness);
    }

    // Overall quality metric: 0 - 100
    const resolutionFactor = Math.min(1.0, (width * height) / 10000);
    const overallQuality = Math.min(100, Math.round(
      (sharpness * 0.45 + contrast * 0.35 + (100 - motionBlurScore) * 0.20) * resolutionFactor
    ));

    return {
      sharpness,
      brightness,
      contrast,
      motionBlurScore,
      overallQuality
    };
  }
}

export const plateCandidateDetector = PlateCandidateDetector.getInstance();
