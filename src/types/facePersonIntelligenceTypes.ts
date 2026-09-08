/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * MASTER PROMPT V2.3 — FACE WATCHLIST, PERSON INTELLIGENCE & GOVERNMENT NAS ARCHITECTURE
 * Core Type Definitions for Face Detection, Feature Extraction, Face Watchlist Engine,
 * Person Investigation Dossier, Government NAS Storage Abstraction, and On-Premise Deployment.
 * 
 * Strict Legal Standards: Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)
 * Absolute Policy: "A face detection is not an identity. A similarity score is not legal certainty.
 * A watchlist candidate is not confirmation."
 */

import { SourceClassification } from '../types';

export type FaceQualityBand = 'OPTIMAL' | 'ACCEPTABLE' | 'DEGRADED' | 'UNUSABLE';

export interface FaceBoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface FaceQualityMetrics {
  overallQuality: number; // 0.00 - 1.00
  sharpness: number;      // 0.00 - 1.00
  illumination: number;   // 0.00 - 1.00
  frontalPoseScore: number; // 0.00 - 1.00 (1.0 = direct frontal)
  poseAngles: {
    yaw: number;   // degrees (-90 to +90)
    pitch: number; // degrees (-90 to +90)
    roll: number;  // degrees (-180 to +180)
  };
  resolutionWidthPx: number;
  resolutionHeightPx: number;
  qualityBand: FaceQualityBand;
  occlusionFlag: boolean;
  occlusionDetails?: string;
}

export type BiometricProvenance = 
  | 'CAMERA_OBSERVED' 
  | 'AI_INFERRED' 
  | 'HUMAN_VERIFIED' 
  | 'HUMAN_REJECTED' 
  | 'SIMULATED';

export interface FaceObservation {
  observationId: string;
  cameraId: string;
  cameraName: string;
  siteId?: string;
  district?: string;
  timestamp: string;
  boundingBox: FaceBoundingBox;
  quality: FaceQualityMetrics;
  cropReferenceUrl: string;       // Safe tokenized URL or local image reference
  frameReferenceUrl: string;      // Full camera frame reference
  embeddingReferenceId: string;   // Tokenized biometric hash/ID (never expose raw float array in UI/logs)
  sourceClassification: SourceClassification;
  demographicEstimate?: {
    ageRangeEstimate?: string;     // e.g. "30-40" - explicitly labeled AI_ESTIMATE_ONLY
    genderPresentation?: string;   // labeled AI_ESTIMATE_ONLY
    disclaimer: 'AI_ESTIMATE_ONLY_NOT_FACTUAL';
  };
  attireDescription?: string;
  associatedPersonTrackId?: string;
  associatedVehiclePlate?: string; // Correlated vehicle license plate if detected co-incident
  provenance: BiometricProvenance;
  nasStoragePath?: string;
  evidenceId?: string;
  sha256IntegrityHash?: string;
}

export type FaceWatchlistCategory = 
  | 'CRITICAL_WANTED' 
  | 'SECTION_302_MURDER' 
  | 'ORGANIZED_CRIME' 
  | 'INTERPOL_RED_NOTICE' 
  | 'MISSING_PERSON' 
  | 'VIP_SECURITY' 
  | 'JUDICIAL_WARRANT' 
  | 'RESTRICTED_AREA_TRESPASS';

export interface FaceWatchlistReferenceImage {
  imageId: string;
  referenceUrl: string;
  enrolledTimestamp: string;
  qualityScore: number;
  sha256: string;
  enrolledCameraOrSource: string;
}

export interface FaceWatchlistEntry {
  targetId: string;
  caseId: string;
  aliasName: string;
  fullName?: string;
  category: FaceWatchlistCategory;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  enrolledAt: string;
  enrolledByOfficer: string;
  issuingAuthority: string;
  warrantNumber?: string;
  associatedVehicles?: string[];
  referenceImages: FaceWatchlistReferenceImage[];
  legalNotice: string;
  statutoryBasis: 'Bharatiya Sakshya Adhiniyam, 2023 / Section 63-65 Sanctioned Order';
  notes?: string;
  activeMatchesCount: number;
}

export type MatchCandidateStatus = 
  | 'WATCHLIST_CANDIDATE' 
  | 'HUMAN_IN_REVIEW' 
  | 'HUMAN_VERIFIED' 
  | 'HUMAN_REJECTED' 
  | 'DISPUTED';

export interface FaceMatchCandidate {
  matchId: string;
  watchlistTargetId: string;
  targetAlias: string;
  watchlistCategory: FaceWatchlistCategory;
  observationId: string;
  cameraId: string;
  cameraName: string;
  locationName: string;
  district: string;
  timestamp: string;
  similarityScore: number;       // 0.00 - 1.00 cosine similarity
  confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  status: MatchCandidateStatus;
  verifyingOfficer?: string;
  verificationTimestamp?: string;
  verificationNotes?: string;
  evidenceRecordId: string;
  evidenceNasPath?: string;
  sha256Hash: string;
  contributingSignals: {
    signalName: string;
    value: string;
    status: 'MATCH' | 'PARTIAL' | 'MISMATCH';
    weight: number;
  }[];
  conflictingSignals: string[];
  sourceClassification: SourceClassification;
  legalDisclaimer: string;
}

// Abstract Interfaces for Biometric Feature Extraction & Recognition Providers
export interface IFaceFeatureExtractor {
  extractorId: string;
  modelName: string;
  modelVersion: string;
  extractFeatures(imagePayload: string | ArrayBuffer): Promise<{
    quality: FaceQualityMetrics;
    embeddingReferenceId: string;
    featureDimensions: number;
  }>;
}

export interface IFaceRecognitionProvider {
  providerId: string;
  providerType: 'ON_PREM_EDGE_TENSOR' | 'LOCAL_SIMULATED_FABRIC' | 'STATE_HPC_CLUSTER';
  compareEmbeddings(refEmbeddingId: string, obsEmbeddingId: string): Promise<{
    similarityScore: number;
    matchFound: boolean;
    confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  }>;
}

// Government Forensic NAS Storage Abstraction Layer
export interface NasClusterNode {
  nodeId: string;
  ipAddress: string;
  mountPoint: string;
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED' | 'OFFLINE';
  role: 'PRIMARY_INGEST' | 'SECONDARY_REPLICATION' | 'ARCHIVE_VAULT';
  totalCapacityTB: number;
  usedCapacityTB: number;
  wormPolicyEnabled: boolean; // Write-Once-Read-Many
  readWriteLatencyMs: number;
}

export interface NasStorageClusterConfig {
  clusterId: string;
  clusterName: string;
  nodes: NasClusterNode[];
  rootMountPoint: string;
  redundancyProtocol: 'RAID_6' | 'CEPH_REPLICATED_3X' | 'ZFS_RAIDZ2';
  encryptionAtRest: 'AES_256_GCM_HARDWARE';
  tamperSealingProtocol: 'SHA_256_BSA_2023_CERTIFIED';
  primaryRetentionDays: number;
  statutoryWormRetentionYears: number; // e.g. 7 years for BSA 2023
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'FAILOVER_ACTIVE' | 'MAINTENANCE';
}

export interface NasEvidenceFileMeta {
  fileId: string;
  evidenceId: string;
  filename: string;
  nasAbsolutePath: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Checksum: string;
  timestampStored: string;
  storedByAgentId: string;
  isWormSealed: boolean;
  legalCertificateHash: string;
  section65BCertificateGenerated: boolean;
}

export interface INasEvidenceStorage {
  clusterConfig: NasStorageClusterConfig;
  storeFrame(frameBuffer: string | ArrayBuffer, metadata: Record<string, any>): Promise<NasEvidenceFileMeta>;
  retrieveFrame(fileId: string): Promise<NasEvidenceFileMeta | null>;
  verifyWormSeal(fileId: string): Promise<{ isValid: boolean; sha256: string; timestamp: string }>;
  getClusterHealth(): { status: string; freeCapacityTB: number; totalCapacityTB: number; activeNodes: number };
}

// Person Dossier & Multi-Modal Unified Dossier
export interface PersonSightingRecord {
  sightingId: string;
  observationId: string;
  timestamp: string;
  cameraId: string;
  cameraName: string;
  district: string;
  location: string;
  faceCropUrl: string;
  qualityScore: number;
  associatedPlate?: string;
  associatedVehicleType?: string;
  watchlistMatchStatus: MatchCandidateStatus;
  evidenceId: string;
  nasStoragePath?: string;
  sha256: string;
}

export interface PersonDossier {
  dossierId: string;
  personIdentifier: string; // Target ID or Generated Tracking Token
  personAlias: string;
  category: FaceWatchlistCategory | 'INVESTIGATION_SUBJECT';
  firstSeenTimestamp: string;
  lastSeenTimestamp: string;
  totalObservations: number;
  uniqueCamerasVisited: number;
  districtsTraversed: string[];
  sightings: PersonSightingRecord[];
  correlatedVehicles: {
    plate: string;
    correlationScore: number;
    lastCoOccurrenceCamera: string;
    lastCoOccurrenceTimestamp: string;
  }[];
  statutoryAdmissibilityNotice: string;
  evidenceChain: {
    evidenceId: string;
    timestamp: string;
    sha256: string;
    nasPath: string;
    status: 'SEALED_VALID';
  }[];
  dossierCompilationTimestamp: string;
  compiledByRole: string;
}

// Government On-Premise Deployment Architecture Specification
export interface GpuInferenceNode {
  nodeId: string;
  hostName: string;
  gpuModel: string;
  totalVramGB: number;
  usedVramGB: number;
  fpsThroughput: number;
  modelsLoaded: string[];
  status: 'ONLINE' | 'STANDBY' | 'THERMAL_THROTTLED' | 'FAULT';
  temperatureCelsius: number;
}

export interface GovernmentDeploymentConfig {
  deploymentId: string;
  installationName: string;
  governmentTier: 'STATE_POLICE_HEADQUARTERS' | 'DISTRICT_COMMAND_CENTER' | 'BORDER_INTERCEPTION_POST';
  networkMode: 'AIR_GAPPED_INTRANET' | 'SECURE_GOV_SWAN' | 'LOCAL_ON_PREM_CONTAINER';
  zeroCloudDependencyVerified: boolean;
  activeContainerRuntime: 'DOCKER_ENTERPRISE_SECURE' | 'PODMAN_ROOTLESS_GOV' | 'CONTAINERD_K8S_ON_PREM';
  nasClusterConfig: NasStorageClusterConfig;
  gpuInferenceNodes: GpuInferenceNode[];
  activeSecurityPolicy: 'BSA_2023_EVIDENCE_STRICT' | 'STANDARD_TRAFFIC_ITMS';
  totalConfiguredCameras: number;
  edgeIngressNodesCount: number;
  lastDeploymentAuditTimestamp: string;
}
