/**
 * Copyright (c) 2026 Gujarat Police Surveillance Infrastructure.
 * Google Cloud Platform Vision & Live Stream Recognition Types
 * 
 * Defines schemas for:
 * 1. Google Cloud Vision API / Gemini ANPR & HSRP Plate Catch
 * 2. Google Cloud Face Detection & Vertex AI Vector Search Biometrics
 * 3. Cloud Pub/Sub & Dataflow Multi-Frame Temporal Consensus
 * 4. Cloud Storage (GCS) SHA-256 Tamper-Proof Evidence Certificates (BSA 2023 Sec 63)
 */

export interface PlateBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CharacterConfidence {
  char: string;
  confidence: number;
  disambiguatedFrom?: string;
  isAmbiguous: boolean;
}

export interface GCPPlateCatch {
  catchId: string;
  plateNumber: string;
  formattedPlate: string; // e.g., "GJ 01 AB 1234"
  stateCode: string;
  rtoCode: string;
  rtoDistrict: string;
  series: string;
  numericCode: string;
  confidence: number;
  box: PlateBoundingBox;
  vehicleType: 'TWO_WHEELER' | 'FOUR_WHEELER_CAR' | 'COMMERCIAL_TRUCK' | 'BUS' | 'AUTO_RICKSHAW' | 'UNKNOWN';
  vehicleColor?: string;
  
  // HSRP Compliance (CMVR Rule 50)
  hsrpCompliance: {
    isCompliant: boolean;
    hologramDetected: boolean;
    laserPinDetected: boolean;
    laserPin?: string;
    fontCompliant: boolean;
    colorSchemeValid: boolean; // Yellow for commercial, White for private, Green for EV
    violations: string[];
  };

  // Police Watchlist Cross-Reference
  watchlistMatch?: {
    isMatched: boolean;
    category: 'STOLEN_VEHICLE' | 'HIT_AND_RUN' | 'SUSPECT_INTERCEPT' | 'UNREGISTERED' | 'E_CHALLAN_DEFAULTER';
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    caseNumber?: string;
    firDate?: string;
    policeStation?: string;
    ownerName?: string;
    chassisMatchStatus?: 'MATCHED' | 'UNVERIFIED' | 'TAMPERED';
  };

  // Multi-frame Dataflow Consensus
  consensus: {
    state: 'CONSENSUS_VERIFIED' | 'VOTING_IN_PROGRESS' | 'SINGLE_FRAME_CANDIDATE';
    consecutiveFrames: number;
    requiredFrames: number;
    consensusScore: number;
    firstSeenIso: string;
    lastSeenIso: string;
  };

  disambiguationNotes: string[];
}

export interface FaceBoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface FacialLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  noseTip: { x: number; y: number };
  mouthCenter: { x: number; y: number };
}

export interface GCPFaceRecognitionResult {
  faceId: string;
  box: FaceBoundingBox;
  detectionConfidence: number;
  
  // Quality & Pose
  qualityScore: number; // 0.0 - 1.0
  sharpness: number;
  illumination: number;
  pose: {
    pitch: number;
    roll: number;
    yaw: number;
  };
  landmarks: FacialLandmarks;

  // Vertex AI Vector Search / BigQuery Vector Match
  vectorSearch: {
    searchedIndex: string; // e.g. "vertex-ai-scrb-criminal-watchlists-512d"
    embeddingDimension: number; // 512
    isWatchlistMatch: boolean;
    matchedPersonId?: string;
    matchedName?: string;
    aliasName?: string;
    riskCategory?: 'WANTED_FUGITIVE' | 'HISTORY_SHEETER' | 'MISSING_PERSON' | 'VIP_PROTECTION';
    riskLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    similarityScore: number; // 0.0 - 1.0 (cosine similarity)
    warrantNumber?: string;
    ipcSection?: string;
    registeredDistrict?: string;
    referencePhotoUrl?: string;
  };

  // Multi-frame Dataflow Consensus
  consensus: {
    state: 'CONSENSUS_VERIFIED' | 'VOTING_IN_PROGRESS' | 'SINGLE_FRAME_CANDIDATE';
    consecutiveFrames: number;
    requiredFrames: number;
    consensusScore: number;
  };
}

export interface EvidenceReceipt {
  evidenceId: string;
  sha256: string;
  kmsKeyUri: string;
  gcsBucketUri: string;
  capturedAt: string;
  statutoryCompliance: 'BSA_2023_SECTION_63_CERTIFIED' | 'BSA_2023_SECTION_65B';
  cameraId: string;
  cameraName: string;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
    locationName: string;
  };
}

export interface GCPStreamAnalysisResult {
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  cameraId: string;
  cameraName: string;
  sourceType: 'LIVE_RTSP_STREAM' | 'UPLOADED_FRAME' | 'SYNTHETIC_DIAGNOSTIC';
  analyzedAt: string;
  latencyMs: number;
  
  // Core Recognitions
  plates: GCPPlateCatch[];
  faces: GCPFaceRecognitionResult[];

  // Google Cloud Service Execution Summary
  cloudExecution: {
    visionApiOcrLatencyMs: number;
    vertexAiVectorSearchLatencyMs: number;
    pubsubEventPublished: boolean;
    pubsubMessageId?: string;
    dataflowConsensusApplied: boolean;
    gcsArchived: boolean;
    geminiMultimodalDisambiguationUsed: boolean;
    activeAiEngine: string;
  };

  // Tamper-Proof Evidence Receipt
  evidenceReceipt: EvidenceReceipt;

  // Real-time Actionable Alert
  operationalAlert?: {
    alertId: string;
    alertType: 'WANTED_VEHICLE_INTERCEPT' | 'BIOMETRIC_WATCHLIST_HIT' | 'HSRP_TAMPER_SUSPECT';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    title: string;
    instruction: string;
    assignedPoliceUnits: string[];
  };
}

export interface GCPPipelineTelemetry {
  totalStreamFramesAnalyzed: number;
  totalPlateCatches: number;
  totalFaceRecognitions: number;
  totalWatchlistHits: number;
  averageLatencyMs: number;
  temporalConsensusSuppressionRate: number; // Percentage of 1-frame glitches discarded
  activeCloudProducts: {
    visionApiOcr: 'OPERATIONAL' | 'DEGRADED';
    vertexAiVectorSearch: 'OPERATIONAL' | 'DEGRADED';
    cloudPubSub: 'OPERATIONAL' | 'DEGRADED';
    cloudDataflow: 'OPERATIONAL' | 'DEGRADED';
    cloudStorageKms: 'OPERATIONAL' | 'DEGRADED';
    geminiMultimodal: 'OPERATIONAL' | 'DEGRADED';
  };
}

export interface GCPBackgroundEvidenceRecord {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  plateNumber: string;
  formattedPlate: string;
  rtoDistrict: string;
  vehicleType: string;
  vehicleBrandModel: string;
  vehicleColor: string;
  hsrpStatus: 'HSRP_COMPLIANT' | 'HSRP_NON_COMPLIANT' | 'HSRP_TAMPERED' | 'HSRP_UNCERTAIN';
  hsrpDetails: {
    isCompliant: boolean;
    hologramDetected: boolean;
    laserPinDetected: boolean;
    laserPin?: string;
    indStripeDetected: boolean;
    reasoning?: string;
  };
  violation?: string;
  confidence: number;
  frameSha256: string;
  frameSnapshotUrl: string;
  vehicleCropUrl?: string;
  plateCropUrl?: string;
  bsaCertificateId: string;
  bsaCertificate: {
    certificateId: string;
    actReference: string;
    hashAlgorithm: string;
    originalFrameHash: string;
    sourceDeviceUid: string;
    captureTimestampUtc: string;
    verificationSignature: string;
    custodyChainStatus: string;
  };
  firestoreSaved: boolean;
  firestoreDocId: string;
  firestoreDatabaseId: string;
  sourceType: 'LIVESTREAM_BACKGROUND_AUTO' | 'OFFICER_MANUAL_CLICK';
}

