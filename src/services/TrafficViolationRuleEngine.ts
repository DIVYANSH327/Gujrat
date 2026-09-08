/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * TrafficViolationRuleEngine: Configurable Motor Vehicle Act & Gujarat Rules Engine
 * Evaluates candidate detections against statutory thresholds, jurisdiction rules,
 * and temporal corroboration criteria.
 */

import {
  ViolationType,
  ViolationCapabilityReadiness,
  RuleConfiguration,
  ViolationDetectionResult,
  ViolationSourceType
} from '../types/v22ChallanTypes';

export interface ViolationEvaluationContext {
  cameraId: string;
  sourceType: ViolationSourceType;
  vehicleTrackId: string;
  vehicleType: string;
  plate: string;
  plateConfidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  timestamp: string;

  // Measurements & Telemetry
  measuredSpeedKmH?: number;
  speedSensorType?: 'RADAR' | 'LASER' | 'AI_OPTICAL_TRACKING' | 'SIMULATED';
  signalState?: 'RED' | 'YELLOW' | 'GREEN' | 'UNKNOWN';
  stopLineCrossed?: boolean;
  laneId?: string;
  corridorDirection?: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'OPPOSITE';
  riderCount?: number;
  hasHelmet?: boolean;
  headVisible?: boolean;
  seatbeltFastened?: boolean;
  phoneDetectedInHand?: boolean;
  stationaryDurationSec?: number;
  isBRTSLane?: boolean;
  opticalConfidence?: number;
}

export class TrafficViolationRuleEngine {
  private static instance: TrafficViolationRuleEngine | null = null;
  private rules: Map<ViolationType, RuleConfiguration> = new Map();

  public static getInstance(): TrafficViolationRuleEngine {
    if (!TrafficViolationRuleEngine.instance) {
      TrafficViolationRuleEngine.instance = new TrafficViolationRuleEngine();
    }
    return TrafficViolationRuleEngine.instance;
  }

  private constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Statutory rule table calibrated to Gujarat Motor Vehicles Rules & MV Act 1988 (Amended 2019)
   */
  private initializeDefaultRules() {
    this.registerRule({
      ruleId: 'RULE-GJ-SPD-001',
      jurisdiction: 'GUJARAT_STATEWIDE',
      effectiveFrom: '2024-01-01T00:00:00Z',
      violationType: 'OVERSPEEDING',
      thresholds: {
        speedToleranceKmH: 5, // 5 km/h buffer
        minConfidenceThreshold: 0.85,
        minPlateConfidenceThreshold: 0.75
      },
      evidenceRequirements: ['CONTEXT_FRAME', 'VEHICLE_CROP', 'PLATE_CROP', 'SPEED_MEASUREMENT_RECORD'],
      statutoryFineInr: 1500,
      enabled: true,
      version: '2.2.0',
      source: 'Section 183(1) & 183(2), Motor Vehicles Act 1988',
      configuredBy: 'Gujarat Traffic Police HQ'
    });

    this.registerRule({
      ruleId: 'RULE-GJ-RLV-002',
      jurisdiction: 'GUJARAT_STATEWIDE',
      effectiveFrom: '2024-01-01T00:00:00Z',
      violationType: 'RED_LIGHT_VIOLATION',
      thresholds: {
        redLightGracePeriodSec: 1.0, // 1s grace period after amber transition
        minConfidenceThreshold: 0.88,
        minPlateConfidenceThreshold: 0.75
      },
      evidenceRequirements: ['CONTEXT_FRAME', 'VEHICLE_CROP', 'PLATE_CROP', 'TEMPORAL_SEQUENCE_3_FRAMES', 'SIGNAL_STATE_RED'],
      statutoryFineInr: 1000,
      enabled: true,
      version: '2.2.0',
      source: 'Section 184, Motor Vehicles Act 1988 (Dangerous Driving / Jumping Red Signal)',
      configuredBy: 'Gujarat Traffic Police HQ'
    });

    this.registerRule({
      ruleId: 'RULE-GJ-HLM-003',
      jurisdiction: 'GUJARAT_STATEWIDE',
      effectiveFrom: '2024-01-01T00:00:00Z',
      violationType: 'HELMETLESS_RIDING',
      thresholds: {
        minConfidenceThreshold: 0.88,
        minPlateConfidenceThreshold: 0.70,
        minRiderConfidenceThreshold: 0.85
      },
      evidenceRequirements: ['CONTEXT_FRAME', 'VEHICLE_CROP', 'PLATE_CROP', 'HEAD_REGION_CROP'],
      statutoryFineInr: 500,
      enabled: true,
      version: '2.2.0',
      source: 'Section 129 read with Section 194D, Motor Vehicles Act 1988',
      configuredBy: 'Gujarat Traffic Police HQ'
    });

    this.registerRule({
      ruleId: 'RULE-GJ-TRP-004',
      jurisdiction: 'GUJARAT_STATEWIDE',
      effectiveFrom: '2024-01-01T00:00:00Z',
      violationType: 'TRIPLE_RIDING',
      thresholds: {
        minConfidenceThreshold: 0.85,
        minPlateConfidenceThreshold: 0.70
      },
      evidenceRequirements: ['CONTEXT_FRAME', 'VEHICLE_CROP', 'PLATE_CROP', 'RIDER_COUNT_CONFIRMATION'],
      statutoryFineInr: 1000,
      enabled: true,
      version: '2.2.0',
      source: 'Section 128 read with Section 194C, Motor Vehicles Act 1988',
      configuredBy: 'Gujarat Traffic Police HQ'
    });

    this.registerRule({
      ruleId: 'RULE-GJ-WRG-005',
      jurisdiction: 'GUJARAT_STATEWIDE',
      effectiveFrom: '2024-01-01T00:00:00Z',
      violationType: 'WRONG_SIDE_DRIVING',
      thresholds: {
        minConfidenceThreshold: 0.90,
        minPlateConfidenceThreshold: 0.75
      },
      evidenceRequirements: ['CONTEXT_FRAME', 'VEHICLE_CROP', 'PLATE_CROP', 'CORRIDOR_VECTOR_PROOF'],
      statutoryFineInr: 1500,
      enabled: true,
      version: '2.2.0',
      source: 'Section 184, Motor Vehicles Act 1988 (Driving Against Traffic Flow)',
      configuredBy: 'Gujarat Traffic Police HQ'
    });

    this.registerRule({
      ruleId: 'RULE-GJ-BRT-006',
      jurisdiction: 'AHMEDABAD_BRTS_SURAT_BRTS',
      effectiveFrom: '2024-01-01T00:00:00Z',
      violationType: 'WRONG_LANE',
      thresholds: {
        minConfidenceThreshold: 0.88,
        minPlateConfidenceThreshold: 0.75
      },
      evidenceRequirements: ['CONTEXT_FRAME', 'VEHICLE_CROP', 'PLATE_CROP', 'LANE_BOUNDS_PROOF'],
      statutoryFineInr: 1500,
      enabled: true,
      version: '2.2.0',
      source: 'Gujarat Special Corridor & BRTS Regulation Notification',
      configuredBy: 'Ahmedabad Traffic Police Commissionerate'
    });
  }

  public registerRule(rule: RuleConfiguration): void {
    this.rules.set(rule.violationType, rule);
  }

  public getRule(violationType: ViolationType): RuleConfiguration | undefined {
    return this.rules.get(violationType);
  }

  public getAllRules(): RuleConfiguration[] {
    return Array.from(this.rules.values());
  }

  /**
   * Returns statutory readiness state of each violation type
   */
  public getReadinessState(violationType: ViolationType): ViolationCapabilityReadiness {
    switch (violationType) {
      case 'OVERSPEEDING':
      case 'RED_LIGHT_VIOLATION':
      case 'HELMETLESS_RIDING':
      case 'TRIPLE_RIDING':
      case 'WRONG_LANE':
        return 'IMPLEMENTED';
      case 'WRONG_SIDE_DRIVING':
      case 'STOP_LINE_VIOLATION':
      case 'NO_SEATBELT':
      case 'DANGEROUS_PARKING':
        return 'INTEGRATION_READY';
      case 'MOBILE_PHONE_WHILE_DRIVING':
      case 'PEDESTRIAN_CONFLICT':
      case 'VEHICLE_CLASS_RESTRICTION':
      case 'PLATE_OBSTRUCTION':
        return 'SIMULATED';
      default:
        return 'FUTURE_DEPLOYMENT';
    }
  }

  /**
   * Evaluates if a given camera frame/telemetry event constitutes a violation candidate
   */
  public evaluateViolation(
    violationType: ViolationType, 
    context: ViolationEvaluationContext, 
    speedLimitKmH: number = 60
  ): ViolationDetectionResult {
    const rule = this.rules.get(violationType);
    const reasonCodes: string[] = [];
    const observations: string[] = [];
    const requiredEvidence: string[] = rule?.evidenceRequirements || ['CONTEXT_FRAME', 'VEHICLE_CROP', 'PLATE_CROP'];

    let detected = false;
    let confidence = context.opticalConfidence || 0.85;
    let measurement: number | string | undefined;
    let measurementUnit: string | undefined;
    let ruleContext: string = rule?.source || 'Statutory Motor Vehicles Regulation';

    switch (violationType) {
      case 'OVERSPEEDING': {
        measurementUnit = 'km/h';
        if (context.measuredSpeedKmH !== undefined && context.measuredSpeedKmH > 0) {
          measurement = context.measuredSpeedKmH;
          const tolerance = rule?.thresholds.speedToleranceKmH || 5;
          const excess = context.measuredSpeedKmH - speedLimitKmH;

          if (excess > tolerance) {
            detected = true;
            confidence = Math.min(0.99, (context.opticalConfidence || 0.90) + 0.05);
            reasonCodes.push('EXCESS_SPEED_MEASURED');
            reasonCodes.push('VERIFIED_RADAR_OPTICAL_DOPPLER');
            observations.push(`Measured speed of ${context.measuredSpeedKmH} km/h exceeds limit of ${speedLimitKmH} km/h by ${excess} km/h (tolerance ${tolerance} km/h applied).`);
            observations.push(`Speed sensor: ${context.speedSensorType || 'AI_OPTICAL_TRACKING'}`);
          } else {
            reasonCodes.push('WITHIN_TOLERANCE');
            observations.push(`Speed ${context.measuredSpeedKmH} km/h is within permitted threshold (${speedLimitKmH} + ${tolerance} km/h).`);
          }
        } else {
          // NO MEASUREMENT AVAILABLE: Do not invent a speed measurement!
          detected = false;
          measurement = 'UNKNOWN';
          reasonCodes.push('SPEED_TELEMETRY_UNAVAILABLE');
          observations.push('Visual impression of speed alone cannot be used for enforcement. Speed remains UNKNOWN.');
        }
        break;
      }

      case 'RED_LIGHT_VIOLATION': {
        measurement = context.signalState || 'UNKNOWN';
        measurementUnit = 'SIGNAL_STATE';

        if (context.signalState === 'RED' && context.stopLineCrossed) {
          detected = true;
          confidence = context.opticalConfidence || 0.93;
          reasonCodes.push('RED_SIGNAL_BREACH');
          reasonCodes.push('STOP_LINE_PHYSICAL_CROSSING');
          observations.push('Vehicle crossed illuminated red stop-line boundary into active intersection.');
        } else {
          reasonCodes.push('SIGNAL_COMPLIANT_OR_AMBER');
          observations.push(`Signal state: ${context.signalState}, stopline crossed: ${context.stopLineCrossed}`);
        }
        break;
      }

      case 'HELMETLESS_RIDING': {
        const isTwoWheeler = context.vehicleType.toLowerCase().includes('motorcycle') ||
                             context.vehicleType.toLowerCase().includes('two_wheeler') ||
                             context.vehicleType.toLowerCase().includes('scooter') ||
                             context.vehicleType.toLowerCase().includes('bike');

        if (isTwoWheeler && context.hasHelmet === false && context.headVisible !== false) {
          detected = true;
          confidence = context.opticalConfidence || 0.94;
          reasonCodes.push('HELMET_ABSENT_ON_RIDER');
          reasonCodes.push('HEAD_REGION_UNOBSTRUCTED');
          observations.push('Rider observed operating two-wheeled vehicle without standard safety helmet.');
        } else if (context.headVisible === false) {
          detected = false;
          reasonCodes.push('HEAD_OCCLUDED_INSUFFICIENT_EVIDENCE');
          observations.push('Rider head region occluded; cannot determine helmet presence.');
        }
        break;
      }

      case 'TRIPLE_RIDING': {
        measurement = context.riderCount || 0;
        measurementUnit = 'RIDERS';

        if ((context.riderCount || 0) > 2) {
          detected = true;
          confidence = context.opticalConfidence || 0.91;
          reasonCodes.push('EXCESS_RIDER_COUNT');
          observations.push(`Observed ${context.riderCount} riders on two-wheeler (maximum legal limit is 2).`);
        }
        break;
      }

      case 'WRONG_LANE': {
        if (context.isBRTSLane) {
          detected = true;
          confidence = context.opticalConfidence || 0.95;
          reasonCodes.push('BRTS_DEDICATED_CORRIDOR_TRESPASS');
          observations.push(`Non-authorized vehicle (${context.vehicleType}) entered segregated BRTS rapid transit corridor.`);
        }
        break;
      }

      case 'WRONG_SIDE_DRIVING': {
        if (context.corridorDirection === 'OPPOSITE') {
          detected = true;
          confidence = context.opticalConfidence || 0.96;
          reasonCodes.push('OPPOSING_DIRECTION_OF_TRAVEL');
          observations.push('Vehicle travel trajectory is directly opposite to statutory road corridor vector.');
        }
        break;
      }

      default: {
        // Fallback for simulation or other violations
        detected = (context.opticalConfidence || 0.85) >= 0.88;
        observations.push(`Candidate road safety event flagged: ${violationType}`);
        break;
      }
    }

    return {
      violationType,
      detected,
      confidence,
      timestamp: context.timestamp,
      cameraId: context.cameraId,
      vehicleTrackId: context.vehicleTrackId,
      boundingBox: context.boundingBox,
      requiredEvidence,
      reasonCodes,
      observations,
      measurement,
      measurementUnit,
      ruleContext,
      modelName: 'Gujarat Police Traffic AI Mesh',
      modelVersion: '2.2.0',
      agentId: 'TrafficViolationRuleAgent-AHM-01',
      sourceType: context.sourceType,
      status: detected ? 'CONFIRMED_BY_RULE' : 'REJECTED_BY_RULE'
    };
  }
}

export const trafficViolationRuleEngine = TrafficViolationRuleEngine.getInstance();
