/**
 * TemporalPlateConsensusEngine.ts
 * Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
 * 
 * Multi-Frame Character Consensus & Temporal Plate Reconstruction.
 * Evaluates candidate OCR strings across multiple frames of the same vehicle track.
 * Forms consensus strictly from observed evidence without inventing or hallucinating characters.
 * 
 * Invariants:
 * - Never manufactures missing characters.
 * - Regex is strictly used for VALIDATION, never completion or generation.
 * - Output status: READABLE | UNCERTAIN | NOT_READABLE.
 */

export type SemanticOcrStatus = 'READABLE' | 'UNCERTAIN' | 'NOT_READABLE';

export type NotReadableReason =
  | 'LOW_RESOLUTION'
  | 'MOTION_BLUR'
  | 'GLARE'
  | 'OCCLUSION'
  | 'OBLIQUE_ANGLE'
  | 'PLATE_NOT_LOCALIZED'
  | 'NO_TEXT_DETECTED'
  | 'INSUFFICIENT_CHARACTER_DETAIL'
  | 'SOURCE_DEGRADED';

export type UncertainReason =
  | 'OCR_CONFLICT'
  | 'LOW_CONFIDENCE'
  | 'PARTIAL_PLATE'
  | 'TEMPORAL_DISAGREEMENT'
  | 'FORMAT_AMBIGUITY';

export interface FrameOcrObservation {
  frameId: string;
  frameTimestamp: number;
  rawText: string;
  cleanedText: string;
  confidence: number;
  qualityScore: number;
  isGeometricallyValid: boolean;
  unreadableReason?: NotReadableReason;
}

export interface CharacterConsensusItem {
  index: number;
  char: string;
  agreementRatio: number;
  supportingFrames: string[];
}

export interface TemporalConsensusResult {
  finalPlate: string | null;
  status: SemanticOcrStatus;
  confidence: number;
  method: 'TEMPORAL_OCR_CONSENSUS' | 'SINGLE_FRAME_OCR' | 'NONE';
  candidateStrings: string[];
  characterConsensus: CharacterConsensusItem[];
  supportingFrames: string[];
  notReadableReason?: NotReadableReason;
  uncertainReason?: UncertainReason;
  formatValidation: {
    isValid: boolean;
    formatType?: 'STANDARD_GJ' | 'OTHER_INDIAN_STATE' | 'BH_SERIES' | 'COMMERCIAL' | 'DIPLOMATIC';
  };
}

export class TemporalPlateConsensusEngine {
  private static instance: TemporalPlateConsensusEngine;

  public static getInstance(): TemporalPlateConsensusEngine {
    if (!TemporalPlateConsensusEngine.instance) {
      TemporalPlateConsensusEngine.instance = new TemporalPlateConsensusEngine();
    }
    return TemporalPlateConsensusEngine.instance;
  }

  /**
   * Strictly validates Indian registration syntax without mutating or generating characters.
   */
  public validateIndianPlateFormat(plate: string): { isValid: boolean; formatType?: TemporalConsensusResult['formatValidation']['formatType'] } {
    if (!plate || typeof plate !== 'string') {
      return { isValid: false };
    }

    const clean = plate.toUpperCase().replace(/[\s-]/g, '');

    // Complete Indian registration must be at least 6 characters (e.g. GJ01A1 to GJ01AB1234)
    if (clean.length < 6 || clean.length > 11) {
      return { isValid: false };
    }

    // 1. Standard Gujarat (e.g. GJ01AB1234, GJ27C5678, GJ03XY1122, GJ1A1234)
    const gjPattern = /^GJ([0-9]{1,2})([A-Z]{1,3})([0-9]{1,4})$/;
    if (gjPattern.test(clean)) {
      return { isValid: true, formatType: 'STANDARD_GJ' };
    }

    // 2. Other Indian State (e.g. MH02CD1234, DL8CAA1111, RJ14AB9999)
    const allStates = 'AN|AP|AR|AS|BR|CH|CG|DD|DL|DN|GA|GJ|HP|HR|JH|JK|KA|KL|LA|LD|MH|ML|MN|MP|MZ|NL|OD|PB|PY|RJ|SK|TN|TR|TS|UK|UP|WB';
    const statePattern = new RegExp(`^(${allStates})([0-9]{1,2})([A-Z]{1,3})([0-9]{1,4})$`);
    if (statePattern.test(clean)) {
      return { isValid: true, formatType: 'OTHER_INDIAN_STATE' };
    }

    // 3. Bharat Series (BH) (e.g. 21BH1234AA, 22BH9999B)
    const bhPattern = /^([0-9]{2})BH([0-9]{4})([A-Z]{1,2})$/;
    if (bhPattern.test(clean)) {
      return { isValid: true, formatType: 'BH_SERIES' };
    }

    // 4. Diplomatic (e.g. 77CD12, 11UN123)
    const cdPattern = /^([0-9]{1,3})(CD|CC|UN)([0-9]{1,4})$/;
    if (cdPattern.test(clean)) {
      return { isValid: true, formatType: 'DIPLOMATIC' };
    }

    return { isValid: false };
  }

  /**
   * Reconstructs plate consensus across multiple frames of a tracked vehicle.
   * Never invents characters: every character in finalPlate must have supporting evidence.
   */
  public evaluateTemporalConsensus(observations: FrameOcrObservation[]): TemporalConsensusResult {
    if (!observations || observations.length === 0) {
      return {
        finalPlate: null,
        status: 'NOT_READABLE',
        confidence: 0,
        method: 'NONE',
        candidateStrings: [],
        characterConsensus: [],
        supportingFrames: [],
        notReadableReason: 'PLATE_NOT_LOCALIZED',
        formatValidation: { isValid: false }
      };
    }

    // Filter observations with actual text
    const textObs = observations.filter(o => o.cleanedText && o.cleanedText.length >= 4);
    const candidateStrings = textObs.map(o => o.cleanedText);

    if (textObs.length === 0) {
      // Determine physical failure reason from the latest or lowest-quality observations
      const latest = observations[observations.length - 1];
      const reason: NotReadableReason = latest.unreadableReason || (latest.qualityScore < 30 ? 'LOW_RESOLUTION' : 'NO_TEXT_DETECTED');
      return {
        finalPlate: null,
        status: 'NOT_READABLE',
        confidence: 0,
        method: 'NONE',
        candidateStrings: [],
        characterConsensus: [],
        supportingFrames: [],
        notReadableReason: reason,
        formatValidation: { isValid: false }
      };
    }

    // Multi-frame consensus analysis
    // Group candidate strings by length to evaluate positional character alignment
    const lengthMap = new Map<number, FrameOcrObservation[]>();
    for (const obs of textObs) {
      const len = obs.cleanedText.length;
      if (!lengthMap.has(len)) lengthMap.set(len, []);
      lengthMap.get(len)!.push(obs);
    }

    // Pick dominant length group
    let dominantLength = 0;
    let dominantGroup: FrameOcrObservation[] = [];
    for (const [len, group] of lengthMap.entries()) {
      if (group.length > dominantGroup.length) {
        dominantLength = len;
        dominantGroup = group;
      }
    }

    const consensusChars: CharacterConsensusItem[] = [];
    const agreedFrameIds = new Set<string>();

    for (let pos = 0; pos < dominantLength; pos++) {
      const votes = new Map<string, { count: number; frames: string[] }>();
      for (const obs of dominantGroup) {
        const char = obs.cleanedText[pos];
        if (char && char !== '?') {
          if (!votes.has(char)) votes.set(char, { count: 0, frames: [] });
          const entry = votes.get(char)!;
          entry.count++;
          entry.frames.push(obs.frameId);
        }
      }

      // Find winner for this position
      let bestChar = '?';
      let bestCount = 0;
      let supporting: string[] = [];

      for (const [char, entry] of votes.entries()) {
        if (entry.count > bestCount) {
          bestChar = char;
          bestCount = entry.count;
          supporting = entry.frames;
        }
      }

      const ratio = dominantGroup.length > 0 ? +(bestCount / dominantGroup.length).toFixed(2) : 0;
      consensusChars.push({
        index: pos,
        char: bestChar,
        agreementRatio: ratio,
        supportingFrames: supporting
      });

      for (const fId of supporting) agreedFrameIds.add(fId);
    }

    const reconstructedStr = consensusChars.map(c => c.char).join('');
    const hasUncertainChars = reconstructedStr.includes('?');

    // Check format validity
    const formatCheck = this.validateIndianPlateFormat(reconstructedStr);

    // Compute aggregate confidence
    const avgConfidence = dominantGroup.reduce((sum, o) => sum + o.confidence, 0) / (dominantGroup.length || 1);

    // Formulate final status
    if (!hasUncertainChars && formatCheck.isValid && avgConfidence >= 0.65 && dominantGroup.length >= 1) {
      return {
        finalPlate: reconstructedStr,
        status: 'READABLE',
        confidence: +avgConfidence.toFixed(3),
        method: dominantGroup.length > 1 ? 'TEMPORAL_OCR_CONSENSUS' : 'SINGLE_FRAME_OCR',
        candidateStrings,
        characterConsensus: consensusChars,
        supportingFrames: Array.from(agreedFrameIds),
        formatValidation: formatCheck
      };
    }

    // If characters are partially resolved or format is ambiguous
    if (dominantGroup.length >= 1 && (hasUncertainChars || !formatCheck.isValid || avgConfidence < 0.65)) {
      let uncertainReason: UncertainReason = 'LOW_CONFIDENCE';
      if (hasUncertainChars) uncertainReason = 'PARTIAL_PLATE';
      else if (!formatCheck.isValid) uncertainReason = 'FORMAT_AMBIGUITY';
      else if (textObs.length > 1 && dominantGroup.length < textObs.length) uncertainReason = 'TEMPORAL_DISAGREEMENT';

      return {
        finalPlate: reconstructedStr,
        status: 'UNCERTAIN',
        confidence: +avgConfidence.toFixed(3),
        method: dominantGroup.length > 1 ? 'TEMPORAL_OCR_CONSENSUS' : 'SINGLE_FRAME_OCR',
        candidateStrings,
        characterConsensus: consensusChars,
        supportingFrames: Array.from(agreedFrameIds),
        uncertainReason,
        formatValidation: formatCheck
      };
    }

    return {
      finalPlate: null,
      status: 'NOT_READABLE',
      confidence: 0,
      method: 'NONE',
      candidateStrings,
      characterConsensus: [],
      supportingFrames: [],
      notReadableReason: 'INSUFFICIENT_CHARACTER_DETAIL',
      formatValidation: { isValid: false }
    };
  }
}

export const temporalPlateConsensusEngine = TemporalPlateConsensusEngine.getInstance();
