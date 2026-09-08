/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * V2.2 CHALLAN MODE — VIOLATION ENFORCEMENT & EVIDENCE REVIEW
 * Domain Models, State Machine, Violation Types & Evidence Specifications
 * 
 * Statutory Notice:
 * Designed for integration with applicable electronic-evidence procedures
 * under the Bharatiya Sakshya Adhiniyam, 2023.
 * Legal admissibility, certification, evidentiary weight, and chain-of-custody
 * requirements depend on applicable law and competent-authority procedures.
 */

export type ViolationType =
  | 'OVERSPEEDING'
  | 'RED_LIGHT_VIOLATION'
  | 'STOP_LINE_VIOLATION'
  | 'WRONG_SIDE_DRIVING'
  | 'WRONG_LANE'
  | 'HELMETLESS_RIDING'
  | 'TRIPLE_RIDING'
  | 'NO_SEATBELT'
  | 'DANGEROUS_PARKING'
  | 'ILLEGAL_TURN'
  | 'PEDESTRIAN_CONFLICT'
  | 'MOBILE_PHONE_WHILE_DRIVING'
  | 'VEHICLE_CLASS_RESTRICTION'
  | 'PLATE_OBSTRUCTION'
  | 'OTHER';

export type ViolationCapabilityReadiness =
  | 'IMPLEMENTED'
  | 'INTEGRATION_READY'
  | 'SIMULATED'
  | 'FUTURE_DEPLOYMENT';

export type ViolationCaseStatus =
  | 'DETECTED'
  | 'EVIDENCE_CAPTURED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'HUMAN_DISPUTED'
  | 'DISPATCH_PENDING'
  | 'E_CHALLAN_ISSUED'
  | 'DISPATCH_FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'DUPLICATE';

export type ViolationSourceType =
  | 'REAL_CAMERA'
  | 'AUTHORIZED_VIDEO'
  | 'MOBILE_CAMERA'
  | 'SIMULATION'
  | 'YOUTUBE_DEMO';

export type SourceOfTruth =
  | 'CAMERA_OBSERVED'
  | 'AI_INFERRED'
  | 'HUMAN_VERIFIED'
  | 'SIMULATED';

export type EvidenceCompleteness = 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
export type EvidenceQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ViolationEvidenceFrame {
  frameId: string;
  frameType: 'CONTEXT' | 'VEHICLE_CROP' | 'PLATE_CROP' | 'PRE_VIOLATION' | 'VIOLATION_PEAK' | 'POST_VIOLATION' | 'ADDITIONAL';
  timestamp: string;
  relativeTimeOffsetSec: number; // e.g. -2.0, 0.0, +1.0
  imageUri: string;
  thumbnailUri?: string;
  sha256Hash: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  opticalQualityScore: number;
  label: string;
}

export interface ViolationEvidencePackage {
  evidencePackageId: string;
  caseId: string;
  createdAt: string;
  sourceType: ViolationSourceType;
  cameraId: string;
  edgeNodeId: string;
  captureTimestamp: string;
  location: string;
  frameReferences: {
    contextFrame: string;
    vehicleCrop: string;
    plateCrop: string;
    preViolationFrame?: string;
    violationFrame?: string;
    postViolationFrame?: string;
    additionalFrames?: string[];
  };
  frames: ViolationEvidenceFrame[];
  imageReferences: string[];
  metadataReferences: {
    cameraModel?: string;
    gpsCoordinates?: { latitude: number; longitude: number };
    speedEstimateKmH?: number;
    speedLimitKmH?: number;
    signalState?: 'RED' | 'YELLOW' | 'GREEN' | 'UNKNOWN';
    laneDesignation?: string;
    modelName: string;
    modelVersion: string;
    agentId: string;
  };
  integrityHash: string;
  hashAlgorithm: 'SHA-256';
  evidenceStatus: 'VERIFIED' | 'TAMPER_DETECTED' | 'PENDING_VERIFICATION';
  integrityNotice: string;
  isSimulated: boolean;
}

export interface EvidenceSufficiencyResult {
  status: 'SUFFICIENT' | 'PARTIAL' | 'INSUFFICIENT';
  score: number; // 0.0 - 1.0
  checks: {
    hasContextFrame: boolean;
    hasTargetVehicle: boolean;
    hasPlateEvidence: boolean;
    hasTimestamp: boolean;
    hasCameraIdentity: boolean;
    hasLocation: boolean;
    hasViolationSpecificEvidence: boolean;
    hasRequiredMeasurements: boolean;
    hasIntegrityHash: boolean;
  };
  reasons: string[];
  missingElements: string[];
  canDispatch: boolean;
}

export interface ViolationDetectionResult {
  violationType: ViolationType;
  detected: boolean;
  confidence: number;
  timestamp: string;
  cameraId: string;
  vehicleTrackId: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  requiredEvidence: string[];
  reasonCodes: string[];
  observations: string[];
  measurement?: number | string;
  measurementUnit?: string;
  ruleContext?: string;
  modelName: string;
  modelVersion: string;
  agentId: string;
  sourceType: ViolationSourceType;
  status: 'CANDIDATE' | 'CONFIRMED_BY_RULE' | 'REJECTED_BY_RULE';
}

export interface RuleConfiguration {
  ruleId: string;
  jurisdiction: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  violationType: ViolationType;
  thresholds: {
    speedToleranceKmH?: number;
    redLightGracePeriodSec?: number;
    minConfidenceThreshold: number;
    minPlateConfidenceThreshold: number;
    minRiderConfidenceThreshold?: number;
  };
  evidenceRequirements: string[];
  statutoryFineInr: number;
  enabled: boolean;
  version: string;
  source: string; // e.g. "Gujarat Motor Vehicles Rules & Section 183 MV Act"
  configuredBy: string;
}

export interface ViolationCase {
  caseId: string;
  eventId: string;
  correlationId: string;
  sourceType: ViolationSourceType;
  cameraId: string;
  edgeNodeId: string;
  mobileCameraId?: string;
  timestamp: string;
  location: string;
  latitude: number;
  longitude: number;

  vehicleObservationId: string;
  trajectoryId?: string;
  plateObservationId?: string;

  vehiclePlate: string;
  normalizedPlate: string;
  plateConfidence: number;
  vehicleType: string;
  vehicleColor: string;
  vehicleMakeModel?: string;
  vehicleConfidence: number;

  violationType: ViolationType;
  violationSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  violationDescription: string;

  observedValue?: number | string;
  allowedValue?: number | string;
  unit?: string;

  aiConfidence: number;
  anprConfidence: number;
  evidenceQuality: EvidenceQuality;
  evidenceCompleteness: EvidenceCompleteness;

  fullContextEvidenceId: string;
  vehicleCropEvidenceId: string;
  plateCropEvidenceId: string;
  additionalEvidenceIds: string[];

  signalStateEvidence?: {
    signalColor: 'RED' | 'YELLOW' | 'GREEN' | 'UNKNOWN';
    amberIntervalSec?: number;
    redElapsedSec?: number;
    stopLineCrossed: boolean;
  };
  speedEvidence?: {
    measuredSpeedKmH: number;
    allowedSpeedKmH: number;
    speedSensorType: 'RADAR' | 'LASER' | 'AI_OPTICAL_TRACKING' | 'SIMULATED';
    zoneName: string;
  };
  laneEvidence?: {
    assignedLane: string;
    observedLane: string;
    laneViolationType: 'WRONG_LANE' | 'BRTS_LANE_INTRUSION' | 'SOLID_LINE_CROSS';
  };
  helmetEvidence?: {
    riderCount: number;
    helmetlessRidersCount: number;
    headRegionVisible: boolean;
  };

  status: ViolationCaseStatus;

  reviewerId?: string;
  reviewedAt?: string;
  reviewDecision?: 'APPROVED' | 'REJECTED' | 'INSUFFICIENT_EVIDENCE' | 'MORE_EVIDENCE_REQUESTED';
  reviewReason?: string;

  externalLookupStatus: 'NOT_PERFORMED' | 'AUTHORIZED_LOADED' | 'SIMULATED' | 'FAILED';
  externalVehicleRecordId?: string;

  challanProvider: string;
  challanReference?: string;
  dispatchStatus: 'NONE' | 'PENDING' | 'ISSUED' | 'FAILED';
  dispatchTimestamp?: string;

  integrityHash: string;
  evidencePackageId: string;

  createdAt: string;
  updatedAt: string;

  sourceOfTruth: SourceOfTruth;

  retentionPolicy: {
    policyId: string;
    rawVideoDays: number;
    statutoryEvidenceYears: number;
    isTamperSealed: boolean;
    department: string;
  };
  retentionUntil: string;

  auditRecordIds: string[];
  suggestedFineAmount: number;
  isSimulated: boolean;
}

export interface AuthorizedDispatchContext {
  officerId: string;
  officerName: string;
  badgeNumber: string;
  role: 'OPERATOR' | 'INVESTIGATOR' | 'REVIEWER' | 'SUPER_ADMIN';
  jurisdiction: string;
  authSignature?: string;
  dispatchReason?: string;
}

export interface ChallanDispatchResult {
  success: boolean;
  referenceId: string;
  receiptNumber?: string;
  issuedAt: string;
  provider: string;
  providerStatus: 'SUCCESS' | 'QUEUED' | 'REJECTED' | 'CONNECTION_ERROR';
  fineAmount: number;
  statutoryNotice: string;
  isSimulated: boolean;
  error?: string;
}

export interface ChallanStatusResult {
  referenceId: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'DISPUTED' | 'CANCELLED' | 'COURT_HEARING';
  amountDue: number;
  lastUpdated: string;
}

export interface IChallanProvider {
  providerId: string;
  providerName: string;
  isSimulated: boolean;
  validateCaseForDispatch(caseObj: ViolationCase): { valid: boolean; errors: string[] };
  createChallan(caseObj: ViolationCase, authorizedContext: AuthorizedDispatchContext): Promise<ChallanDispatchResult>;
  getChallanStatus(reference: string): Promise<ChallanStatusResult>;
  cancelChallan(reference: string, authorizedContext: AuthorizedDispatchContext): Promise<boolean>;
  healthCheck(): Promise<'HEALTHY' | 'DEGRADED' | 'DOWN'>;
}

export interface ChallanAuditRecord {
  auditId: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: 
    | 'AI_DETECTION'
    | 'EVIDENCE_CAPTURE'
    | 'EVIDENCE_VERIFICATION'
    | 'EXTERNAL_LOOKUP'
    | 'CASE_VIEW'
    | 'CASE_CLAIM'
    | 'CASE_RELEASE'
    | 'CASE_APPROVAL'
    | 'CASE_REJECTION'
    | 'REQUEST_MORE_EVIDENCE'
    | 'MARK_INSUFFICIENT'
    | 'CHALLAN_DISPATCH'
    | 'CHALLAN_DISPATCH_FAILURE'
    | 'STATUS_CHANGE'
    | 'EVIDENCE_EXPORT';
  caseId: string;
  correlationId: string;
  source: ViolationSourceType;
  beforeState?: string;
  afterState?: string;
  reason?: string;
  details: Record<string, any>;
  integrityChecksum: string;
}
