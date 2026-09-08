/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Unified CCTV Intelligence Grid V2.1 — Vehicle + Police Data Intelligence Mesh
 * Core Type Definitions & Multi-Source Contracts
 * 
 * Principle: "ONE VEHICLE IDENTITY CONTEXT ACROSS CAMERA OBSERVATIONS,
 * EVIDENCE, INVESTIGATIONS AND AUTHORIZED DATA SOURCES."
 * 
 * Strict Separation:
 * CAMERA OBSERVED DATA is strictly differentiated from EXTERNAL AUTHORIZED DATA.
 */

import { 
  VehicleObservation, 
  ForensicEvidenceRecord, 
  Alert, 
  VehicleClassType,
  DownstreamPrediction
} from '../types';

export type SourceOfTruthCategory =
  | 'CAMERA_OBSERVED'
  | 'AI_INFERRED'
  | 'HUMAN_VERIFIED'
  | 'EXTERNAL_AUTHORIZED'
  | 'SIMULATED'
  | 'PREDICTED';

export type UserRole =
  | 'VIEWER'
  | 'OPERATOR'
  | 'INVESTIGATOR'
  | 'SUPERVISOR'
  | 'ADMIN'
  | 'SYSTEM_AGENT';

export type ExternalLookupPolicyDecision =
  | 'ALLOW'
  | 'DENY'
  | 'REVIEW_REQUIRED'
  | 'RATE_LIMITED'
  | 'NOT_CONFIGURED';

export type ExternalProviderStatus =
  | 'DISABLED'
  | 'NOT_CONFIGURED'
  | 'AUTHORIZED'
  | 'AVAILABLE'
  | 'DEGRADED'
  | 'OFFLINE'
  | 'ERROR';

export type PlateQualityClassification =
  | 'HIGH_QUALITY'
  | 'USABLE'
  | 'LOW_QUALITY'
  | 'UNREADABLE';

export interface PlateQualityMetrics {
  plateConfidence: number;
  characterConfidence: number;
  imageQuality: number;
  blurScore: number;
  angleScore: number;
  occlusionScore: number;
  illuminationScore: number;
  plateVisibility: number;
  classification: PlateQualityClassification;
  isReadable: boolean;
  explanation: string;
}

export interface PlateObservation {
  observationId: string;
  cameraId: string;
  cameraName?: string;
  timestamp: string;
  rawRead?: string;
  normalizedRead?: string;
  confidence: number;
  quality: PlateQualityMetrics;
  imageReference?: string;
  evidenceReference?: string;
  agentId: string;
  correlationId: string;
  sourceOfTruth: SourceOfTruthCategory;
}

export interface VehicleAttributeCorrelationResult {
  correlationId: string;
  score: number;
  confidence: number;
  signals: string[];
  conflictingSignals: string[];
  decision: string;
  requiresReview: boolean;
  breakdown: {
    plateConsistency: number;
    typeConsistency: number;
    colorConsistency: number;
    directionConsistency: number;
    topologyConsistency: number;
    temporalConsistency: number;
  };
  whyLinked: string[];
}

export interface JourneyQualityScore {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  reasons: string[];
  metrics: {
    observationCount: number;
    averagePlateConfidence: number;
    topologyConsistency: number;
    timeConsistency: number;
    evidenceCount: number;
  };
}

export type VehicleSignalType =
  | 'WATCHLIST_MATCH'
  | 'MULTIPLE_ROAD_SAFETY_EVENTS'
  | 'ACTIVE_INVESTIGATION'
  | 'RECENT_INCIDENT'
  | 'MULTIPLE_HIGH_CONFIDENCE_SIGHTINGS'
  | 'PLATE_ANOMALY'
  | 'CROSS_CAMERA_CORRELATION';

export interface DetectedVehicleSignal {
  type: VehicleSignalType;
  source: string;
  sourceCategory: SourceOfTruthCategory;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  referenceId?: string;
}

export interface VehicleSignalSummary {
  signals: DetectedVehicleSignal[];
  totalSignalsCount: number;
  hasCriticalSignals: boolean;
  explanation: string;
}

export interface HumanReviewDecision {
  reviewId: string;
  decision: 'CONFIRM' | 'REJECT' | 'MARK_UNCERTAIN';
  reviewerId: string;
  reviewerRole: UserRole;
  timestamp: string;
  reason: string;
  verifiedState: 'HUMAN_VERIFIED' | 'REJECTED' | 'UNCERTAIN';
  targetObservationId?: string;
  targetVehicleId?: string;
}

export interface DataLineageRecord {
  lineageId: string;
  inputRecords: string[];
  processingAgent: string;
  modelOrMethod: string;
  timestamp: string;
  outputRecord: string;
  correlationId: string;
  sourceCategory: SourceOfTruthCategory;
}

export interface ExternalDataAuditRecord {
  auditId: string;
  actorId: string;
  role: UserRole;
  provider: 'VAHAN' | 'ECHALLAN' | 'EGUJCOP' | 'OTHER_AUTHORIZED_PROVIDER' | string;
  plate: string;
  purpose: string;
  caseId?: string;
  requestedFields: string[];
  returnedFields: string[];
  timestamp: string;
  requestId: string;
  success: boolean;
  error?: string;
  policyDecision: ExternalLookupPolicyDecision;
  correlationId: string;
}

export interface ExternalProviderMetadata {
  providerId: string;
  name: string;
  capabilities: string[];
  status: ExternalProviderStatus;
  authorizationState: 'AUTHORIZED' | 'PENDING_CLEARANCE' | 'NOT_CONFIGURED' | 'MOCK_SANDBOX';
  supportedQueries: string[];
  lastHealthCheck: string;
  rateLimit: {
    maxRequestsPerMin: number;
    currentCount: number;
    resetTime: string;
  };
  timeoutMs: number;
  auditRequirements: string[];
  isSimulated: boolean;
  disclaimer: string;
}

export interface VehicleDossierFirstSeen {
  camera: string;
  cameraName?: string;
  timestamp: string;
  evidenceRef?: string;
  location?: string;
  confidence: number;
  sourceOfTruth: SourceOfTruthCategory;
}

export interface VehicleDossierLastSeen {
  camera: string;
  cameraName?: string;
  timestamp: string;
  evidenceRef?: string;
  location?: string;
  direction?: string;
  estimatedSpeedKmh?: number;
  confidence: number;
  sourceOfTruth: SourceOfTruthCategory;
  predictedNextCameras: DownstreamPrediction[];
}

export interface VehicleDossierExternalData {
  vahan?: {
    record?: any;
    providerStatus: ExternalProviderStatus;
    requestId?: string;
    retrievedAt?: string;
    disclaimer: string;
    isAuthorized: boolean;
  };
  echallan?: {
    challans?: any[];
    totalPendingAmount?: number;
    providerStatus: ExternalProviderStatus;
    requestId?: string;
    retrievedAt?: string;
    disclaimer: string;
    isAuthorized: boolean;
  };
  egujcop?: {
    firSummaries?: any[];
    warrants?: any[];
    providerStatus: ExternalProviderStatus;
    requestId?: string;
    retrievedAt?: string;
    disclaimer: string;
    isAuthorized: boolean;
  };
  providerStatus: Record<string, ExternalProviderStatus>;
}

export interface VehicleDossier {
  vehicleId: string;
  canonicalPlate: string;
  plateVariants: string[];
  observations: VehicleObservation[];
  plateObservations: PlateObservation[];
  firstSeen: VehicleDossierFirstSeen;
  lastSeen: VehicleDossierLastSeen;
  cameraPath: string[];
  trajectory?: any;
  evidence: ForensicEvidenceRecord[];
  watchlistMatches: any[];
  alerts: Alert[];
  incidents: any[];
  roadSafetyEvents: any[];
  externalData: VehicleDossierExternalData;
  externalDataStatus: 'NONE' | 'AUTHORIZED_LOADED' | 'NOT_CONFIGURED' | 'OFFLINE' | 'PARTIAL';
  vehicleAttributes: {
    observedClass: VehicleClassType;
    observedColor?: string;
    registeredClass?: string;
    registeredMake?: string;
    registeredModel?: string;
    registeredColor?: string;
  };
  correlationResults: VehicleAttributeCorrelationResult[];
  confidence: number;
  journeyQuality: JourneyQualityScore;
  signalsSummary: VehicleSignalSummary;
  humanReviews: HumanReviewDecision[];
  dataLineage: DataLineageRecord[];
  investigationReferences: string[];
  auditReferences: string[];
  retentionStatus: {
    isRawVideoExpired: boolean;
    isEvidenceTamperSealed: boolean;
    statutoryPolicy: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RoadSegmentIntelligence {
  segmentId: string;
  name: string;
  cameraIds: string[];
  direction: string;
  vehicleCount: number;
  averageSpeedEstimate: number;
  congestion: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incidents: number;
  roadSafetyEvents: number;
  watchlistEvents: number;
  lastUpdated: string;
}

export interface TrafficGroupCandidate {
  groupId: string;
  vehicleIds: string[];
  plates: string[];
  cameraSequence: string[];
  timeWindowStart: string;
  timeWindowEnd: string;
  averageSpacingMeters: number;
  confidence: number;
  classification: 'GROUP_TRAFFIC_CANDIDATE';
  reasons: string[];
}

export interface TrafficFlowMetrics {
  vehiclesPerMinute: number;
  directionDistribution: Record<string, number>;
  laneDistribution: Record<string, number>;
  vehicleClassDistribution: Record<string, number>;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  averageTravelTimeSeconds: number;
  cameraThroughput: Record<string, number>;
  timestamp: string;
}

export interface VehicleInvestigationMission {
  missionId: string;
  targetQuery: string;
  targetNormalizedPlate: string;
  status: 'INITIALIZED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  currentStage: string;
  stages: {
    name: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED';
    timestamp?: string;
    summary?: string;
  }[];
  dossier?: VehicleDossier;
  events: {
    stage: string;
    timestamp: string;
    details: string;
    agentId: string;
  }[];
}
