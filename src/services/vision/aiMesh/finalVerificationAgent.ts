/**
 * Final Verification Agent
 * Deterministic AI Mesh Decision Engine.
 * Combines signals from Plate Detection, OCR, HSRP Analysis, Evidence Quality, and Consistency Agents.
 */

import {
  AgentResult,
  EvidenceQualityScore,
  HSRPAnalysis,
  HSRPVerificationDecision,
  HSRPVerificationResult,
  PlateCandidate,
  PlateOCRResult,
  VehicleClass
} from '../visionTypes.js';

export interface FinalVerificationParams {
  vehicleTrackId: string;
  vehicleClass: VehicleClass;
  cameraId: string;
  frameId: string;
  timestamp: string;
  fullFrameUrl: string;
  fullFrameSha256: string;
  plateCropUrl: string;
  plateCropSha256: string;
  agents: {
    plate: AgentResult<PlateCandidate | null>;
    ocr: AgentResult<PlateOCRResult>;
    hsrp: AgentResult<HSRPAnalysis>;
    quality: AgentResult<EvidenceQualityScore>;
    consistency: AgentResult<{ isConsistent: boolean; reason: string }>;
  };
}

export class FinalVerificationAgent {
  private static instance: FinalVerificationAgent;

  public static getInstance(): FinalVerificationAgent {
    if (!FinalVerificationAgent.instance) {
      FinalVerificationAgent.instance = new FinalVerificationAgent();
    }
    return FinalVerificationAgent.instance;
  }

  public evaluateDecision(params: FinalVerificationParams): HSRPVerificationResult {
    const {
      vehicleTrackId,
      vehicleClass,
      cameraId,
      frameId,
      timestamp,
      fullFrameUrl,
      fullFrameSha256,
      plateCropUrl,
      plateCropSha256,
      agents
    } = params;

    const reasons: string[] = [];
    let decision: HSRPVerificationDecision = 'UNCERTAIN';

    const quality = agents.quality.data;
    const ocr = agents.ocr.data;
    const hsrp = agents.hsrp.data;
    const consistency = agents.consistency.data;

    // Rule 1: Insufficient quality / resolution check
    if (!quality.details.isAdequateForHSRP || quality.totalScore < 40) {
      decision = 'NEEDS_BETTER_CAPTURE';
      reasons.push(
        quality.details.reason ||
          `Evidence quality score (${quality.totalScore}/100) below threshold for definitive verification.`
      );
    } else if (hsrp.result === 'INCONSISTENT') {
      // Rule 2: Explicit inconsistency found
      decision = 'HSRP_NOT_VERIFIED';
      reasons.push('Plate exhibits non-HSRP characteristics (non-standard typography or missing mandatory security elements).');
      if (hsrp.inconsistencies.length > 0) {
        reasons.push(...hsrp.inconsistencies);
      }
    } else if (hsrp.result === 'CONSISTENT' && hsrp.confidence >= 0.70) {
      // Rule 3: Verified genuine HSRP
      decision = 'HSRP_VERIFIED';
      reasons.push('Plate exhibits confirmed High Security Registration Plate (HSRP) features under CMVR Rule 50.');
      if (hsrp.characteristics.length > 0) {
        reasons.push(`Detected security elements: ${hsrp.characteristics.join(', ')}`);
      }
      if (ocr.readable && ocr.normalizedText) {
        reasons.push(`Registration identifier verified as ${ocr.normalizedText}`);
      }
    } else {
      // Rule 4: Indeterminate features
      decision = 'UNCERTAIN';
      reasons.push(
        hsrp.reason ||
          'Visual security elements cannot be verified with sufficient certainty due to viewing angle or distance.'
      );
    }

    if (!consistency.isConsistent) {
      reasons.push(`Consistency advisory: ${consistency.reason}`);
    }

    // Calculate composite confidence
    const confidence = Math.max(
      0.1,
      Math.min(
        0.98,
        (quality.totalScore / 100) * 0.35 +
          hsrp.confidence * 0.45 +
          (ocr.readable ? ocr.confidence * 0.2 : 0.05)
      )
    );

    const auditNotice =
      'Admissibility statement: This record constitutes machine-observed electronic evidence. SHA-256 integrity digests are cryptographically sealed at capture. Visual AI classifications represent investigative guidance subject to supervisory verification under Section 63 of Bharatiya Sakshya Adhiniyam, 2023.';

    return {
      decision,
      registrationNumber: ocr.readable ? ocr.normalizedText : null,
      confidence: Math.round(confidence * 100) / 100,
      evidenceQuality: quality.totalScore,
      reasons,
      vehicleTrackId,
      vehicleClass,
      cameraId,
      frameId,
      timestamp,
      fullFrameUrl,
      fullFrameSha256,
      plateCropUrl,
      plateCropSha256,
      agents,
      auditNotice
    };
  }
}

export const finalVerificationAgent = FinalVerificationAgent.getInstance();
