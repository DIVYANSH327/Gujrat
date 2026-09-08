/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ANPRQualityService: Optical Character & Plate Quality Intelligence Engine
 * Evaluates optical clarity, blur, perspective distortion, occlusion, and illumination.
 * 
 * Strict Principle:
 * If a plate is unreadable, DO NOT invent plate characters. Classify as PLATE_UNREADABLE.
 */

import { 
  PlateQualityMetrics, 
  PlateQualityClassification, 
  PlateObservation,
  SourceOfTruthCategory
} from '../types';

export interface ANPRInputAnalysis {
  rawPlateText?: string;
  imageQuality?: number; // 0.0 - 1.0
  blurScore?: number; // 0.0 - 1.0 (1.0 = sharp, 0.0 = severe motion blur)
  angleScore?: number; // 0.0 - 1.0 (1.0 = perpendicular view)
  occlusionScore?: number; // 0.0 - 1.0 (1.0 = completely unobstructed)
  illuminationScore?: number; // 0.0 - 1.0 (1.0 = optimal day/night IR)
  characterConfidenceArray?: number[];
  cameraId?: string;
  timestamp?: string;
}

export class ANPRQualityService {
  private static instance: ANPRQualityService | null = null;

  private constructor() {}

  public static getInstance(): ANPRQualityService {
    if (!ANPRQualityService.instance) {
      ANPRQualityService.instance = new ANPRQualityService();
    }
    return ANPRQualityService.instance;
  }

  /**
   * Evaluates plate capture quality across 6 physical vision dimensions
   */
  public evaluatePlateQuality(input: ANPRInputAnalysis): PlateQualityMetrics {
    const imageQuality = input.imageQuality ?? 0.85;
    const blurScore = input.blurScore ?? 0.88;
    const angleScore = input.angleScore ?? 0.90;
    const occlusionScore = input.occlusionScore ?? 0.92;
    const illuminationScore = input.illuminationScore ?? 0.86;

    // Calculate composite character confidence
    let charConf = 0.85;
    if (input.characterConfidenceArray && input.characterConfidenceArray.length > 0) {
      charConf = input.characterConfidenceArray.reduce((a, b) => a + b, 0) / input.characterConfidenceArray.length;
    } else if (input.rawPlateText) {
      charConf = input.rawPlateText.length >= 8 ? 0.94 : 0.65;
    }

    // Weighted composite plate confidence
    // Blur (25%), Angle (15%), Occlusion (20%), Illumination (15%), CharConf (25%)
    const compositePlateConfidence = 
      blurScore * 0.25 + 
      angleScore * 0.15 + 
      occlusionScore * 0.20 + 
      illuminationScore * 0.15 + 
      charConf * 0.25;

    const plateVisibility = Math.min(1.0, (blurScore + illuminationScore + occlusionScore) / 3);

    // Classification boundaries
    let classification: PlateQualityClassification;
    let isReadable = true;
    let explanation: string;

    if (!input.rawPlateText || input.rawPlateText.trim() === '' || compositePlateConfidence < 0.40 || occlusionScore < 0.30) {
      classification = 'UNREADABLE';
      isReadable = false;
      explanation = 'PLATE_UNREADABLE: Optical capture obstructed, severe motion blur, or plate out of frame.';
    } else if (compositePlateConfidence >= 0.85 && blurScore >= 0.80 && charConf >= 0.80) {
      classification = 'HIGH_QUALITY';
      explanation = `HIGH_QUALITY capture: Sharp characters (${Math.round(charConf * 100)}%), unobstructed (${Math.round(occlusionScore * 100)}%), optimal illumination.`;
    } else if (compositePlateConfidence >= 0.65) {
      classification = 'USABLE';
      explanation = `USABLE capture: Acceptable confidence (${Math.round(compositePlateConfidence * 100)}%) with minor angular skew or illumination variance.`;
    } else {
      classification = 'LOW_QUALITY';
      explanation = `LOW_QUALITY capture: Degraded confidence (${Math.round(compositePlateConfidence * 100)}%). Ambiguous characters require probabilistic correlation.`;
    }

    return {
      plateConfidence: Number(compositePlateConfidence.toFixed(3)),
      characterConfidence: Number(charConf.toFixed(3)),
      imageQuality: Number(imageQuality.toFixed(3)),
      blurScore: Number(blurScore.toFixed(3)),
      angleScore: Number(angleScore.toFixed(3)),
      occlusionScore: Number(occlusionScore.toFixed(3)),
      illuminationScore: Number(illuminationScore.toFixed(3)),
      plateVisibility: Number(plateVisibility.toFixed(3)),
      classification,
      isReadable,
      explanation
    };
  }

  /**
   * Normalizes plate text and detects potential optical character confusion (e.g. '8' vs 'B', '0' vs 'O')
   */
  public analyzePlateAmbiguity(plateText: string): {
    normalized: string;
    variants: string[];
    hasAmbiguity: boolean;
  } {
    const clean = (plateText || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) {
      return { normalized: '', variants: [], hasAmbiguity: false };
    }

    const variants = new Set<string>();
    variants.add(clean);

    // Common Indian ANPR OCR confusions:
    // 'B' <-> '8' in serial characters
    // 'O' <-> '0'
    // 'I' <-> '1'
    // 'D' <-> '0'
    // 'Z' <-> '2'
    // Generate candidate variants without blindly replacing
    if (clean.includes('B')) variants.add(clean.replace(/B/g, '8'));
    if (clean.includes('8')) variants.add(clean.replace(/8/g, 'B'));
    if (clean.includes('0')) variants.add(clean.replace(/0/g, 'O'));
    if (clean.includes('O')) variants.add(clean.replace(/O/g, '0'));

    return {
      normalized: clean,
      variants: Array.from(variants),
      hasAmbiguity: variants.size > 1
    };
  }

  /**
   * Creates a formal PlateObservation tracking OCR quality & lineage
   */
  public createPlateObservation(params: {
    observationId: string;
    cameraId: string;
    cameraName?: string;
    timestamp: string;
    rawRead?: string;
    agentId: string;
    correlationId: string;
    imageReference?: string;
    evidenceReference?: string;
    metricsInput?: Partial<ANPRInputAnalysis>;
  }): PlateObservation {
    const quality = this.evaluatePlateQuality({
      rawPlateText: params.rawRead,
      ...params.metricsInput
    });

    const normalizedRead = quality.isReadable && params.rawRead 
      ? params.rawRead.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : undefined;

    return {
      observationId: params.observationId,
      cameraId: params.cameraId,
      cameraName: params.cameraName,
      timestamp: params.timestamp,
      rawRead: params.rawRead,
      normalizedRead,
      confidence: quality.plateConfidence,
      quality,
      imageReference: params.imageReference,
      evidenceReference: params.evidenceReference,
      agentId: params.agentId,
      correlationId: params.correlationId,
      sourceOfTruth: 'CAMERA_OBSERVED' as SourceOfTruthCategory
    };
  }
}

export const anprQualityService = ANPRQualityService.getInstance();
