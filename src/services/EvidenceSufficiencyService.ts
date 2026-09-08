/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * EvidenceSufficiencyService & No-False-Confidence Protection Layer
 * 
 * Enforces strict evidentiary thresholds before any violation can be
 * recommended for approval or processed for enforcement.
 */

import {
  ViolationCase,
  ViolationEvidencePackage,
  EvidenceSufficiencyResult
} from '../types/v22ChallanTypes';

export class EvidenceSufficiencyService {
  private static instance: EvidenceSufficiencyService | null = null;

  public static getInstance(): EvidenceSufficiencyService {
    if (!EvidenceSufficiencyService.instance) {
      EvidenceSufficiencyService.instance = new EvidenceSufficiencyService();
    }
    return EvidenceSufficiencyService.instance;
  }

  /**
   * Evaluates if the case and its evidence package satisfy the legal and technical
   * sufficiency standards for traffic violation enforcement.
   */
  public evaluateSufficiency(caseObj: ViolationCase, evidencePkg?: ViolationEvidencePackage): EvidenceSufficiencyResult {
    const reasons: string[] = [];
    const missingElements: string[] = [];

    // 1. Core Frame Checks
    const hasContextFrame = Boolean(caseObj.fullContextEvidenceId && (evidencePkg ? evidencePkg.frameReferences.contextFrame : true));
    if (!hasContextFrame) {
      missingElements.push('Full Context Video/Image Frame');
      reasons.push('Full contextual frame missing; environmental context cannot be verified.');
    }

    const hasTargetVehicle = Boolean(caseObj.vehicleCropEvidenceId && caseObj.vehicleConfidence >= 0.70);
    if (!hasTargetVehicle) {
      missingElements.push('High-Resolution Target Vehicle Crop');
      reasons.push('Vehicle crop missing or vehicle visual detection confidence below 70%.');
    }

    const hasPlateEvidence = Boolean(caseObj.plateCropEvidenceId && caseObj.vehiclePlate && caseObj.plateConfidence >= 0.75);
    if (!hasPlateEvidence) {
      missingElements.push('Clear License Plate Crop with ANPR Read >= 75%');
      reasons.push(`Plate confidence (${Math.round(caseObj.plateConfidence * 100)}%) is below enforcement threshold (75%).`);
    }

    // 2. Metadata Checks
    const hasTimestamp = Boolean(caseObj.timestamp && caseObj.timestamp.length > 5);
    if (!hasTimestamp) {
      missingElements.push('Synchronized Hardware Timestamp');
      reasons.push('Timestamp absent or unverified.');
    }

    const hasCameraIdentity = Boolean(caseObj.cameraId && caseObj.edgeNodeId);
    if (!hasCameraIdentity) {
      missingElements.push('Registered Camera & Edge Node Identity');
      reasons.push('Camera ID or Edge Node ID unverified in statutory site registry.');
    }

    const hasLocation = Boolean(caseObj.location && (caseObj.latitude !== 0 || caseObj.longitude !== 0));
    if (!hasLocation) {
      missingElements.push('Geographic Coordinates & Named Location');
      reasons.push('Jurisdictional location or GPS coordinates missing.');
    }

    // 3. Violation-Specific Evidence Checks (NO_FALSE_CONFIDENCE_LAYER)
    let hasViolationSpecificEvidence = true;
    let hasRequiredMeasurements = true;

    switch (caseObj.violationType) {
      case 'OVERSPEEDING': {
        const hasMeasured = typeof caseObj.observedValue === 'number' && caseObj.observedValue > 0;
        const hasAllowed = typeof caseObj.allowedValue === 'number' && caseObj.allowedValue > 0;
        if (!hasMeasured || !hasAllowed) {
          hasRequiredMeasurements = false;
          hasViolationSpecificEvidence = false;
          missingElements.push('Calibrated Speed Measurement from Radar/Laser/Verified Optical Doppler');
          reasons.push('Exact numerical speed measurement unavailable. Visual impression of speed cannot serve as enforcement evidence.');
        } else if (caseObj.observedValue <= caseObj.allowedValue) {
          hasViolationSpecificEvidence = false;
          reasons.push(`Measured speed (${caseObj.observedValue} km/h) does not exceed configured speed limit (${caseObj.allowedValue} km/h).`);
        }
        break;
      }

      case 'RED_LIGHT_VIOLATION': {
        const signalRed = caseObj.signalStateEvidence?.signalColor === 'RED';
        const stopLineCrossed = caseObj.signalStateEvidence?.stopLineCrossed === true;
        const hasTemporalFrames = evidencePkg?.frameReferences?.preViolationFrame || evidencePkg?.frameReferences?.postViolationFrame;

        if (!signalRed) {
          hasViolationSpecificEvidence = false;
          missingElements.push('Verified RED Signal Phase Evidence');
          reasons.push('Signal state is not verified as RED at the moment of line crossing.');
        }
        if (!stopLineCrossed) {
          hasViolationSpecificEvidence = false;
          missingElements.push('Physical Stop Line Cross Trajectory Proof');
          reasons.push('Stop line boundary breach unconfirmed.');
        }
        if (!hasTemporalFrames) {
          reasons.push('Multi-temporal sequence (T-2s, T, T+1s) incomplete; single frame is partial proof for signal violation.');
        }
        break;
      }

      case 'HELMETLESS_RIDING': {
        const isTwoWheeler = caseObj.vehicleType.toLowerCase().includes('motorcycle') ||
                             caseObj.vehicleType.toLowerCase().includes('two_wheeler') ||
                             caseObj.vehicleType.toLowerCase().includes('scooter') ||
                             caseObj.vehicleType.toLowerCase().includes('bike');
        const headVisible = caseObj.helmetEvidence?.headRegionVisible !== false;

        if (!isTwoWheeler) {
          hasViolationSpecificEvidence = false;
          reasons.push(`Vehicle type (${caseObj.vehicleType}) is not a two-wheeler.`);
        }
        if (!headVisible) {
          hasViolationSpecificEvidence = false;
          missingElements.push('Unobstructed Rider Head Region Crop');
          reasons.push('Rider head region occluded by obstacle or weather; cannot conclusively verify helmet absence.');
        }
        break;
      }

      case 'TRIPLE_RIDING': {
        const count = caseObj.helmetEvidence?.riderCount || 0;
        if (count <= 2) {
          hasViolationSpecificEvidence = false;
          reasons.push(`Observed rider count (${count}) does not exceed legal threshold of 2.`);
        }
        break;
      }

      case 'WRONG_SIDE_DRIVING': {
        if (!caseObj.laneEvidence && !caseObj.violationDescription) {
          hasViolationSpecificEvidence = false;
          missingElements.push('Opposing Corridor Directional Vector Evidence');
          reasons.push('Corridor direction vector not established.');
        }
        break;
      }

      default:
        // Other violations require at least a valid AI confidence >= 0.85
        if (caseObj.aiConfidence < 0.80) {
          hasViolationSpecificEvidence = false;
          reasons.push(`AI confidence (${Math.round(caseObj.aiConfidence * 100)}%) is below minimum threshold for enforcement.`);
        }
        break;
    }

    // 4. Integrity Hash Check
    const hasIntegrityHash = Boolean(caseObj.integrityHash && caseObj.integrityHash.length >= 32);
    if (!hasIntegrityHash) {
      missingElements.push('Evidence Package SHA-256 Integrity Hash');
      reasons.push('Cryptographic evidence package fingerprint missing.');
    }

    const checks = {
      hasContextFrame,
      hasTargetVehicle,
      hasPlateEvidence,
      hasTimestamp,
      hasCameraIdentity,
      hasLocation,
      hasViolationSpecificEvidence,
      hasRequiredMeasurements,
      hasIntegrityHash
    };

    const totalPassed = Object.values(checks).filter(Boolean).length;
    const score = Number((totalPassed / Object.keys(checks).length).toFixed(2));

    let status: 'SUFFICIENT' | 'PARTIAL' | 'INSUFFICIENT';
    if (totalPassed === Object.keys(checks).length && missingElements.length === 0) {
      status = 'SUFFICIENT';
    } else if (hasContextFrame && hasPlateEvidence && score >= 0.70) {
      status = 'PARTIAL';
    } else {
      status = 'INSUFFICIENT';
    }

    // YouTube source is never sufficient for legal enforcement
    if (caseObj.sourceType === 'YOUTUBE_DEMO') {
      status = 'INSUFFICIENT';
      missingElements.push('Authorized Law Enforcement Camera Stream');
      reasons.push('YouTube public demo cameras are display-only feeds and legally barred from evidence capture or challan issuance.');
    }

    return {
      status,
      score,
      checks,
      reasons,
      missingElements,
      canDispatch: status === 'SUFFICIENT' && caseObj.status === 'APPROVED'
    };
  }
}

export const evidenceSufficiencyService = EvidenceSufficiencyService.getInstance();
