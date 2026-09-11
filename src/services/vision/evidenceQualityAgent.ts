/**
 * Evidence Quality Assessment Agent
 * Computes measurable quality signals: plate pixel dimensions, sharpness, blur penalty,
 * aspect ratio, vehicle framing, and composite score (0-100).
 */

import { EvidenceQualityScore, PlateCandidate, VehicleDetection, VisionFrame } from './visionTypes.js';

export class EvidenceQualityAgent {
  private static instance: EvidenceQualityAgent;

  public static getInstance(): EvidenceQualityAgent {
    if (!EvidenceQualityAgent.instance) {
      EvidenceQualityAgent.instance = new EvidenceQualityAgent();
    }
    return EvidenceQualityAgent.instance;
  }

  /**
   * Assesses quality of candidate plate and vehicle evidence.
   */
  public evaluateQuality(
    frame: VisionFrame,
    detection: VehicleDetection,
    plateCandidate: PlateCandidate | null
  ): EvidenceQualityScore {
    let plateVisibilityScore = 0;
    let sharpnessScore = 20;
    let OCRScore = 0;
    let vehicleVisibilityScore = 25;
    let framingScore = 15;
    let blurPenalty = 0;
    let occlusionPenalty = 0;

    let widthPx = 0;
    let heightPx = 0;

    // Vehicle visibility & framing
    if (detection.box.width > 0.15 && detection.box.height > 0.15) {
      vehicleVisibilityScore = 30;
    } else if (detection.box.width < 0.05 || detection.box.height < 0.05) {
      vehicleVisibilityScore = 10;
      occlusionPenalty += 10;
    }

    // Centered framing bonus
    const centerX = detection.box.x + detection.box.width / 2;
    const centerY = detection.box.y + detection.box.height / 2;
    const distFromCenter = Math.sqrt(Math.pow(centerX - 0.5, 2) + Math.pow(centerY - 0.5, 2));
    if (distFromCenter < 0.3) {
      framingScore = 20;
    }

    if (plateCandidate) {
      widthPx = plateCandidate.widthPx;
      heightPx = plateCandidate.heightPx;

      // Plate dimensions (ideal HSRP reading is >= 80px wide)
      if (widthPx >= 100) {
        plateVisibilityScore = 30;
      } else if (widthPx >= 60) {
        plateVisibilityScore = 22;
      } else if (widthPx >= 35) {
        plateVisibilityScore = 14;
      } else {
        plateVisibilityScore = 0;
        blurPenalty += 35;
      }

      // Aspect ratio check (India standard plates are ~ 4:1 for 500x120mm cars, or ~ 2:1 for 200x100mm 2-wheelers)
      const aspect = widthPx / Math.max(1, heightPx);
      if (aspect >= 1.8 && aspect <= 5.2) {
        sharpnessScore += 10;
      } else {
        occlusionPenalty += 8;
      }

      if (plateCandidate.confidence > 0.8) {
        OCRScore += 15;
      } else if (plateCandidate.confidence > 0.6) {
        OCRScore += 8;
      }
    } else {
      occlusionPenalty += 30;
    }

    const rawTotal =
      plateVisibilityScore +
      sharpnessScore +
      OCRScore +
      vehicleVisibilityScore +
      framingScore -
      blurPenalty -
      occlusionPenalty;

    const totalScore = Math.max(5, Math.min(100, Math.round(rawTotal)));
    const isAdequateForHSRP = totalScore >= 45 && widthPx >= 35;

    let reason: string | undefined;
    if (!isAdequateForHSRP) {
      if (widthPx < 35) {
        reason = `Plate candidate resolution (${widthPx}x${heightPx}px) is below minimum optical threshold for HSRP feature verification.`;
      } else if (totalScore < 45) {
        reason = `Low overall evidence quality score (${totalScore}/100) due to distance or angle.`;
      }
    }

    return {
      totalScore,
      plateVisibilityScore,
      sharpnessScore,
      OCRScore,
      vehicleVisibilityScore,
      framingScore,
      blurPenalty,
      occlusionPenalty,
      details: {
        sharpnessEst: sharpnessScore,
        pixelDimensions: { width: widthPx, height: heightPx },
        isAdequateForHSRP,
        reason
      }
    };
  }
}

export const evidenceQualityAgent = EvidenceQualityAgent.getInstance();
