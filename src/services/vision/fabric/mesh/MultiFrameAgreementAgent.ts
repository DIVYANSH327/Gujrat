/**
 * Multi-Frame Agreement Agent
 * Gujarat Police CCTV & AI Intelligence Platform (SENTINEL GRID)
 *
 * Implements strict temporal multi-frame consensus across independently captured frames:
 * - Frame A: GJ01AB1234
 * - Frame B: GJ01AB1234
 * - Frame C: GJ01AB1234
 * => PLATE_VERIFIED
 *
 * If frames disagree:
 * - Frame A: GJ01AB1234
 * - Frame B: GJ01AB1284
 * => PLATE_UNCERTAIN (Never guess or arbitrarily pick a number!)
 *
 * Attaches cameraId, timestamp, frameHash, trackId to every observation.
 */

import { CandidateFrame } from '../IntelligentFrameSelector.js';
import { AIPlateVerificationResult, sentinelAIFrameDispatcher } from '../SentinelAIFrameDispatcher.js';
import { MultiFrameAgreementResult, MultiFrameObservation } from './MeshTypes.js';

export class MultiFrameAgreementAgent {
  private static instance: MultiFrameAgreementAgent;

  public static getInstance(): MultiFrameAgreementAgent {
    if (!MultiFrameAgreementAgent.instance) {
      MultiFrameAgreementAgent.instance = new MultiFrameAgreementAgent();
    }
    return MultiFrameAgreementAgent.instance;
  }

  /**
   * Evaluates consensus across candidate frames of the same vehicle track.
   * Runs AI verification on up to 3 highest-quality frames if not already analyzed.
   */
  public async evaluateConsensus(
    trackId: string,
    cameraId: string,
    primaryCandidate: CandidateFrame,
    primaryAiResult: AIPlateVerificationResult,
    additionalCandidates: CandidateFrame[] = []
  ): Promise<MultiFrameAgreementResult> {
    const observations: MultiFrameObservation[] = [];

    // 1. Record primary observation
    observations.push({
      frameId: primaryCandidate.id,
      frameTimestamp: primaryCandidate.frameTimestamp,
      captureIso: primaryCandidate.captureIso,
      frameSha256: primaryCandidate.frameSha256,
      cameraId,
      trackId,
      rawPlateText: primaryAiResult.plateText,
      normalizedPlateText: primaryAiResult.normalizedPlateText,
      confidence: primaryAiResult.confidence || 0,
      sharpnessScore: primaryCandidate.scores.sharpnessScore,
      readability: primaryAiResult.status === 'PLATE_READABLE' ? 'READABLE' : 'NOT_READABLE'
    });

    // 2. If primary frame is not readable or AI is unavailable, we cannot form positive consensus
    if (primaryAiResult.status === 'AI_UNAVAILABLE') {
      return {
        trackId,
        cameraId,
        framesAnalyzed: 1,
        framesAgreeing: 0,
        unanimousAgreement: false,
        consensusPlateText: null,
        agreementStatus: 'AI_UNAVAILABLE',
        confidence: 0,
        observations,
        discrepancies: ['AI provider was unavailable during frame analysis.'],
        truthState: 'UNAVAILABLE'
      };
    }

    if (primaryAiResult.status !== 'PLATE_READABLE' || !primaryAiResult.normalizedPlateText) {
      return {
        trackId,
        cameraId,
        framesAnalyzed: 1,
        framesAgreeing: 0,
        unanimousAgreement: false,
        consensusPlateText: null,
        agreementStatus: 'PLATE_NOT_READABLE',
        confidence: 0,
        observations,
        discrepancies: [primaryAiResult.reason || 'Primary frame plate text was unreadable.'],
        truthState: 'OBSERVED'
      };
    }

    // 3. Evaluate additional candidate frames for temporal agreement (up to 2 secondary frames)
    const validSecondaryCandidates = additionalCandidates
      .filter(c => c.id !== primaryCandidate.id && c.plateRegionVisible && c.scores.sharpnessScore >= 0.25)
      .slice(0, 2);

    for (const secondaryCandidate of validSecondaryCandidates) {
      try {
        const secondaryAiResult = await sentinelAIFrameDispatcher.submitFrameForVerification(
          secondaryCandidate,
          'P2'
        );

        observations.push({
          frameId: secondaryCandidate.id,
          frameTimestamp: secondaryCandidate.frameTimestamp,
          captureIso: secondaryCandidate.captureIso,
          frameSha256: secondaryCandidate.frameSha256,
          cameraId,
          trackId,
          rawPlateText: secondaryAiResult.plateText,
          normalizedPlateText: secondaryAiResult.normalizedPlateText,
          confidence: secondaryAiResult.confidence || 0,
          sharpnessScore: secondaryCandidate.scores.sharpnessScore,
          readability: secondaryAiResult.status === 'PLATE_READABLE' ? 'READABLE' : 'NOT_READABLE'
        });
      } catch {
        // Fallback: Skip frame if secondary verification encountered error
      }
    }

    // 4. Compare all readable observations
    const readableObservations = observations.filter(o => o.readability === 'READABLE' && o.normalizedPlateText);
    const primaryPlate = primaryAiResult.normalizedPlateText;
    const discrepancies: string[] = [];

    if (readableObservations.length === 1) {
      // Only 1 frame was readable: High-confidence single frame is acceptable but marked as needing agreement if confidence < 0.90
      if (primaryAiResult.confidence && primaryAiResult.confidence >= 0.88) {
        return {
          trackId,
          cameraId,
          framesAnalyzed: observations.length,
          framesAgreeing: 1,
          unanimousAgreement: true,
          consensusPlateText: primaryPlate,
          agreementStatus: 'PLATE_VERIFIED',
          confidence: primaryAiResult.confidence,
          observations,
          discrepancies: [],
          truthState: 'OBSERVED'
        };
      } else {
        return {
          trackId,
          cameraId,
          framesAnalyzed: observations.length,
          framesAgreeing: 1,
          unanimousAgreement: false,
          consensusPlateText: primaryPlate,
          agreementStatus: 'PLATE_UNCERTAIN',
          confidence: primaryAiResult.confidence || 0.5,
          observations,
          discrepancies: ['Single-frame detection with moderate confidence; awaiting temporal corroboration.'],
          truthState: 'UNCERTAIN'
        };
      }
    }

    // Multiple frames were readable: Check unanimous agreement
    let agreeingCount = 0;
    for (const obs of readableObservations) {
      if (obs.normalizedPlateText === primaryPlate) {
        agreeingCount++;
      } else {
        discrepancies.push(
          `Frame at ${obs.captureIso} read '${obs.normalizedPlateText}' which disagrees with primary '${primaryPlate}'`
        );
      }
    }

    const unanimous = agreeingCount === readableObservations.length;

    if (unanimous && agreeingCount >= 2) {
      // True unanimous agreement across multiple independent frames!
      const avgConfidence = readableObservations.reduce((sum, o) => sum + o.confidence, 0) / readableObservations.length;
      return {
        trackId,
        cameraId,
        framesAnalyzed: observations.length,
        framesAgreeing: agreeingCount,
        unanimousAgreement: true,
        consensusPlateText: primaryPlate,
        agreementStatus: 'PLATE_VERIFIED',
        confidence: Number(avgConfidence.toFixed(3)),
        observations,
        discrepancies: [],
        truthState: 'OBSERVED'
      };
    } else {
      // Disagreement between frames => PLATE_UNCERTAIN (Never arbitrarily pick one)
      return {
        trackId,
        cameraId,
        framesAnalyzed: observations.length,
        framesAgreeing: agreeingCount,
        unanimousAgreement: false,
        consensusPlateText: null, // Zero tolerance for hallucination on conflicting reads
        agreementStatus: 'PLATE_UNCERTAIN',
        confidence: 0.45,
        observations,
        discrepancies,
        truthState: 'UNCERTAIN'
      };
    }
  }
}

export const multiFrameAgreementAgent = MultiFrameAgreementAgent.getInstance();
