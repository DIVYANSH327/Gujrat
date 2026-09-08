/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * OPERATIONAL AI COMMAND & AUTONOMOUS COORDINATION FABRIC
 * Core Type Definitions for Statewide Orchestrator, Mission Control,
 * Predictive Handoff, Incident Command, Human Review Queue, and Digital Twin.
 */

export type MissionType = 
  | 'TRACK_VEHICLE'
  | 'FIND_LAST_SEEN'
  | 'LOCATE_WATCHLIST_CANDIDATE'
  | 'INVESTIGATE_INCIDENT'
  | 'SEARCH_CORRIDOR'
  | 'FOLLOW_MOBILE_CAMERA'
  | 'ANALYZE_TRAFFIC_SEGMENT'
  | 'FIND_RELATED_VEHICLES'
  | 'BUILD_VEHICLE_DOSSIER'
  | 'RECONSTRUCT_JOURNEY'
  | 'VERIFY_EVIDENCE'
  | 'CAMERA_HEALTH_SWEEP';

export type MissionStatus = 
  | 'DRAFT'
  | 'PLANNING'
  | 'WAITING_FOR_APPROVAL'
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'DEGRADED'
  | 'WAITING_FOR_AGENT'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type MissionPriority = 
  | 'P0_CRITICAL' 
  | 'P1_HIGH' 
  | 'P2_OPERATIONAL' 
  | 'P3_NORMAL' 
  | 'P4_BACKGROUND';

export type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'WAITING_APPROVAL';

export interface MissionStep {
  stepId: string;
  stepNumber: number;
  name: string;
  description: string;
  status: StepStatus;
  assignedAgentType: string;
  assignedAgentId?: string;
  jobId?: string;
  approvalRequired: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  outputSummary?: string;
}

export interface MissionApproval {
  approvalId: string;
  stepId: string;
  missionId: string;
  actionTitle: string;
  reason: string;
  confidence: number;
  evidenceThumbnail?: string;
  requiredRole: 'SUPER_ADMIN' | 'OFFICER' | 'INVESTIGATOR' | 'TRAFFIC_OFFICER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewerId?: string;
  reviewerName?: string;
  comments?: string;
  requestedAt: string;
  decidedAt?: string;
}

export interface MissionEvidence {
  evidenceId: string;
  type: 'KEY_FRAME' | 'PLATE_CROP' | 'VEHICLE_CROP' | 'VIOLATION_FRAME' | 'MULTI_FRAME';
  thumbnailUrl: string;
  sha256: string;
  sourceCameraId: string;
  capturedAt: string;
  sourceOfTruth: 'CAMERA_OBSERVED' | 'AI_ANALYZED_VIDEO_FRAME' | 'DEMO_DEVELOPMENT_EVIDENCE';
}

export interface MissionResult {
  summary: string;
  targetPlate?: string;
  normalizedPlate?: string;
  observationsFound: number;
  camerasInvolved: string[];
  trajectoryDistanceKm?: number;
  evidenceCount: number;
  humanReviewsRequired: number;
  completionRatePercent: number;
}

export interface Mission {
  missionId: string;
  missionType: MissionType;
  objective: string;
  requestedBy: string;
  priority: MissionPriority;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  targetPlate?: string;
  startingCameraId?: string;
  corridor?: string;
  constraints?: Record<string, any>;
  steps: MissionStep[];
  approvals: MissionApproval[];
  evidence: MissionEvidence[];
  assignedAgents: string[];
  status: MissionStatus;
  result?: MissionResult;
  executionLog: {
    timestamp: string;
    agentId: string;
    message: string;
    stepId?: string;
  }[];
}

// Predictive Camera Handoff
export type HandoffState = 'OBSERVED' | 'PREDICTED' | 'CANDIDATE' | 'CONFIRMED' | 'MISSED';

export interface PredictiveHandoffPoint {
  pointId: string;
  vehiclePlate: string;
  fromCameraId: string;
  toCameraId: string;
  corridorName: string;
  handoffState: HandoffState;
  predictionConfidence: number; // 0.0 - 1.0
  predictionReason: string;
  expectedArrivalWindowStart: string;
  expectedArrivalWindowEnd: string;
  actualArrivalTimestamp?: string;
  travelDistanceMeters: number;
  expectedTravelDurationSec: number;
  actualTravelDurationSec?: number;
  accuracyScore?: number;
  vehicleClass: string;
  vehicleColor: string;
}

// Incident Command
export type IncidentType = 
  | 'TRAFFIC_VIOLATION'
  | 'WATCHLIST_CANDIDATE'
  | 'MISSING_VEHICLE'
  | 'ROAD_BLOCKAGE'
  | 'DANGEROUS_DRIVING'
  | 'CAMERA_OUTAGE'
  | 'MULTI_VEHICLE_EVENT'
  | 'INVESTIGATION'
  | 'OTHER';

export type IncidentStatus = 
  | 'DETECTED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'INVESTIGATING'
  | 'AWAITING_HUMAN_REVIEW'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface IncidentRecord {
  incidentId: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  district: string;
  cameraIds: string[];
  vehiclePlates: string[];
  assignedAgentIds: string[];
  assignedOfficer?: string;
  detectedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  timeline: {
    timestamp: string;
    actor: string;
    action: string;
    notes?: string;
  }[];
  evidenceIds: string[];
  decisions: {
    timestamp: string;
    officer: string;
    decision: string;
    justification: string;
  }[];
}

// Human Review Queue
export type ReviewType = 
  | 'PLATE_VERIFICATION'
  | 'VEHICLE_MATCH'
  | 'WATCHLIST_MATCH'
  | 'VIOLATION_REVIEW'
  | 'EVIDENCE_REVIEW'
  | 'CROSS_CAMERA_MATCH'
  | 'EXTERNAL_DATA_VERIFICATION'
  | 'MISSION_APPROVAL';

export type ReviewStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISPUTED' | 'EXPIRED';

export type ConfidenceBand = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface ContributingSignal {
  signal: string;
  value: string;
  status: 'MATCH' | 'MISMATCH' | 'PARTIAL';
  weight: number;
}

export interface HumanReviewItem {
  reviewId: string;
  reviewType: ReviewType;
  priority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_OPERATIONAL' | 'P3_NORMAL';
  status: ReviewStatus;
  subjectPlate?: string;
  cameraId?: string;
  missionId?: string;
  incidentId?: string;
  originalInference: any;
  originalConfidence: number;
  confidenceBand: ConfidenceBand;
  contributingSignals: ContributingSignal[];
  conflictingSignals: string[];
  missingSignals: string[];
  evidenceThumbnail?: string;
  reviewerId?: string;
  reviewerName?: string;
  humanDecision?: 'APPROVED' | 'REJECTED' | 'DISPUTED';
  humanComment?: string;
  sourceOfTruth: 'AI_INFERRED' | 'HUMAN_VERIFIED' | 'HUMAN_DISPUTED';
  createdAt: string;
  decidedAt?: string;
}

// AI Explainability & Lineage
export interface AIExplainabilityRecord {
  recordId: string;
  targetType: 'CORRELATION' | 'ANPR' | 'VIOLATION' | 'HANDOFF' | 'WATCHLIST';
  targetId: string;
  modelProvider: string;
  modelVersion: string;
  confidence: number;
  confidenceBand: ConfidenceBand;
  contributingSignals: ContributingSignal[];
  conflictingSignals: string[];
  missingSignals: string[];
  decisionSummary: string;
  timestamp: string;
}

export interface OperationalDataLineageRecord {
  lineageId: string;
  recordId: string;
  sourceType: 
    | 'CAMERA_OBSERVED' 
    | 'AI_INFERRED' 
    | 'HUMAN_VERIFIED' 
    | 'HUMAN_DISPUTED' 
    | 'EXTERNAL_AUTHORIZED' 
    | 'SIMULATED' 
    | 'PREDICTED';
  sourceId: string;
  createdAt: string;
  derivedFrom?: string[];
  transformation?: string;
  agentId?: string;
  modelId?: string;
  modelVersion?: string;
  humanReview?: boolean;
  confidence?: number;
  correlationId?: string;
}

// Operational Digital Twin
export type DigitalTwinFleetScale = 1000 | 10000 | 50000 | 80000 | 100000;

export interface RegionalFleetLoad {
  region: string;
  camerasCount: number;
  activeAgents: number;
  loadPercent: number;
  bandwidthMbps: number;
  status: 'NORMAL' | 'ELEVATED' | 'OVERLOADED';
}

export interface DigitalTwinMetrics {
  fleetScale: DigitalTwinFleetScale;
  eventsPerSec: number;
  activeCameras: number;
  activeAgents: number;
  queuedJobs: number;
  processingJobs: number;
  failedJobs: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  droppedEvents: number;
  backpressureActive: boolean;
  rebalancingActive: boolean;
  regionalLoads: RegionalFleetLoad[];
  faultInjectionState: {
    cameraFailureActive: boolean;
    edgeFailureActive: boolean;
    regionalFailureActive: boolean;
    latencyBurstActive: boolean;
    agentOverloadActive: boolean;
  };
  lastUpdateTimestamp: string;
}

// Multi-vehicle Group Traffic Candidate
export interface GroupTrafficCandidate {
  candidateId: string;
  title: string;
  description: string;
  vehicles: {
    plate: string;
    class: string;
    color: string;
    lastCameraId: string;
    lastSeenTime: string;
  }[];
  corridor: string;
  timeDeltaSec: number;
  spatialDistanceMeters: number;
  coMovementConfidence: number;
  classification: 'GROUP_TRAFFIC_CANDIDATE';
  detectionTimestamp: string;
}
