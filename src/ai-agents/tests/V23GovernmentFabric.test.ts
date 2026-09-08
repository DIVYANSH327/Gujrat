/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * V2.3 Architecture Test Suite:
 * Government On-Premise AI CCTV + Person & Vehicle Intelligence Fabric
 * Forensic Storage, WORM Immutability, Face Watchlist & BSA 2023 Admissibility
 */

import {
  LocalFilesystemEvidenceProvider,
  NasEvidenceProvider,
  FutureObjectStorageEvidenceProvider,
  EvidenceStorageFactory,
  evidenceStorage
} from '../../services/EvidenceStorageProvider';
import { faceWatchlistService } from '../../services/FaceWatchlistService';
import { unifiedPersonInvestigationService } from '../../services/UnifiedPersonInvestigationService';
import { nasEvidenceStorageService } from '../../services/NasEvidenceStorageService';
import { faceFeatureExtractor, faceRecognitionProvider } from '../../services/ai/FaceIntelligenceEngine';
import { FaceObservation, FaceWatchlistEntry } from '../../types/facePersonIntelligenceTypes';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
    passedCount++;
  } else {
    console.error(`❌ FAILED: ${message}`);
    failedCount++;
  }
}

async function runV23TestSuite() {
  console.log('===============================================================');
  console.log('  GUJARAT CCTV INTELLIGENCE GRID V2.3 ARCHITECTURAL SUITE');
  console.log('  Government On-Premise Fabric + Forensic Storage + BSA 2023');
  console.log('===============================================================');

  // -------------------------------------------------------------
  // TEST GROUP 1: Forensic Storage Abstraction & Lifecycle Provider
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 1: Forensic Storage Abstraction & Lifecycle Provider ---');
  
  const localProvider = new LocalFilesystemEvidenceProvider({
    storageRoot: './data/test_vault'
  });
  
  assert(localProvider.providerType === 'LOCAL_FILESYSTEM', 'LocalFilesystemEvidenceProvider initialized with correct type');
  assert(localProvider.config.storageRoot === './data/test_vault', 'Custom storageRoot honored without hardcoding assumptions');

  // Test Evidence Storing with all mandatory Part 3 fields
  const stored = await localProvider.storeEvidence({
    evidenceId: 'EVD-TEST-202609-001',
    sourceCamera: 'CAM-007',
    sourceType: 'REAL_CAMERA',
    plateNormalized: 'GJ01AB1234',
    vehicleClass: 'car',
    GPS: { latitude: 23.0725, longitude: 72.6289 }
  });

  assert(stored.evidenceId === 'EVD-TEST-202609-001', 'Evidence object contains required evidenceId');
  assert(stored.storageProvider === 'LOCAL_FILESYSTEM', 'Evidence object contains storageProvider');
  assert(Boolean(stored.storageReference), 'Evidence object contains storageReference URI');
  assert(stored.sourceCamera === 'CAM-007', 'Evidence object contains sourceCamera');
  assert(stored.sourceType === 'REAL_CAMERA', 'Evidence object contains sourceType');
  assert(Boolean(stored.timestamp), 'Evidence object contains capture timestamp');
  assert(stored.GPS.latitude === 23.0725, 'Evidence object contains GPS coordinates');
  assert(Boolean(stored.frameReference), 'Evidence object contains frameReference');
  assert(stored.sha256.length === 64, 'Evidence object has valid 64-char SHA-256 digest');
  assert(Boolean(stored.createdAt), 'Evidence object has createdAt timestamp');
  assert(Boolean(stored.retentionUntil), 'Evidence object has retentionUntil calculated date');
  assert(stored.retentionPolicy.statutoryEvidenceYears === 7, 'Evidence retention matches statutory 7-year BSA period');
  assert(stored.legalHold === false, 'Evidence initial legalHold is false');
  assert((stored.sourceOfTruth as string) === 'CAMERA_OBSERVED', 'Evidence sourceOfTruth is CAMERA_OBSERVED');
  assert(stored.lifecycleState === 'STORED', 'Evidence lifecycle starts at STORED');

  // Test Integrity Verification
  const verification = await localProvider.verifyIntegrity('EVD-TEST-202609-001');
  assert(verification.valid === true, 'SHA-256 integrity verification succeeded');
  assert(verification.algorithm === 'SHA-256', 'Integrity algorithm correctly reported as SHA-256');
  assert(verification.isDigitalSignature === false, 'Crucial legal fact: isDigitalSignature is false');
  assert(verification.disclaimer.includes('SHA-256 is an integrity digest'), 'Integrity disclaimer clarifies digest vs digital signature');

  // Test Legal Hold Lifecycle
  const held = await localProvider.applyLegalHold(
    'EVD-TEST-202609-001',
    'Court Order Judicial Inquiry',
    'SP R. K. Patel (CID Crime)'
  );
  assert(held?.legalHold === true, 'Legal hold flag successfully set to true');
  assert(held?.lifecycleState === 'LEGAL_HOLD', 'Lifecycle state updated to LEGAL_HOLD');

  const released = await localProvider.releaseLegalHold(
    'EVD-TEST-202609-001',
    'Judicial Inquiry Concluded',
    'SP R. K. Patel (CID Crime)'
  );
  assert(released?.legalHold === false, 'Legal hold successfully released');
  assert(released?.lifecycleState === 'RETAINED', 'Lifecycle state restored to RETAINED');

  // -------------------------------------------------------------
  // TEST GROUP 2: Government Forensic NAS Provider & Cluster Health
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Government Forensic NAS Provider & Cluster Health ---');

  const nasProvider = new NasEvidenceProvider();
  assert(nasProvider.providerType === 'GOVERNMENT_NAS', 'NasEvidenceProvider initialized with GOVERNMENT_NAS');
  assert(nasProvider.config.storageRoot.includes('nas') || nasProvider.config.storageRoot.length > 0, 'NAS storage root dynamically resolved');

  const nasStored = await nasProvider.storeEvidence({
    evidenceId: 'EVD-NAS-TEST-002',
    sourceCamera: 'CAM-014',
    plateNormalized: 'GJ05CD9900',
    vehicleClass: 'suv'
  });
  assert(nasStored.storageProvider === 'GOVERNMENT_NAS', 'NAS stored record has GOVERNMENT_NAS provider');
  assert(nasStored.retentionPolicy.isTamperSealed === true, 'NAS stored record has isTamperSealed set to true');

  // Check Storage Diagnostics
  const diag = nasProvider.getStorageDiagnostics();
  assert(diag.operationalMode === 'INTEGRATION_READY', 'NAS provider operational mode is INTEGRATION_READY');
  assert(diag.complianceNotice.includes('BSA 2023'), 'Compliance notice cites BSA 2023');

  // Cluster health from service
  const health = nasEvidenceStorageService.getClusterHealth();
  assert(health.status === 'HEALTHY', 'NAS Cluster reports HEALTHY status');
  assert(health.activeNodes === 3, 'NAS Cluster has 3 active operational nodes');
  assert(health.freeCapacityTB > 0, 'NAS Cluster reports positive free capacity');

  // -------------------------------------------------------------
  // TEST GROUP 3: Biometric Feature Extraction & Recognition Providers
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Biometric Feature Extraction & Recognition Providers ---');

  const featureResult = await faceFeatureExtractor.extractFeatures('SYNTHETIC_CCTV_FRAME_BUFFER_PAYLOAD');
  assert(featureResult.featureDimensions === 512, 'Face feature extractor outputs 512-dimension vector features');
  assert(featureResult.embeddingReferenceId.startsWith('EMB-TOKEN-'), 'Raw float vectors converted to tokenized EMB-TOKEN- reference');
  assert(featureResult.quality.overallQuality >= 0.0 && featureResult.quality.overallQuality <= 1.0, 'Overall quality is valid normalized float');
  assert(['OPTIMAL', 'ACCEPTABLE', 'DEGRADED', 'UNUSABLE'].includes(featureResult.quality.qualityBand), 'Quality band correctly categorized');

  // Biometric Vector Comparison
  const compMatch = await faceRecognitionProvider.compareEmbeddings('REF-ARJUN_RATHOD', 'OBS-TOKEN-ARJUN-01');
  assert(compMatch.matchFound === true, 'Recognition provider correctly matched concordant embeddings');
  assert(compMatch.similarityScore >= 0.78, 'Similarity score exceeds operational threshold (>= 0.78)');
  assert(['HIGH', 'VERY_HIGH'].includes(compMatch.confidenceBand), 'Confidence band correctly evaluated');

  // -------------------------------------------------------------
  // TEST GROUP 4: Person Watchlist Registry & Candidate Generation
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Person Watchlist Registry & Candidate Generation ---');

  const watchlist = faceWatchlistService.listWatchlist();
  assert(watchlist.length >= 3, 'Default watchlist contains pre-enrolled sanctioned targets');
  
  const arjunTarget = faceWatchlistService.getWatchlistEntry('WLIST-FACE-001');
  assert(arjunTarget?.aliasName === 'Arjun Rathod', 'Target WLIST-FACE-001 alias is Arjun Rathod');
  assert(arjunTarget?.category === 'SECTION_302_MURDER', 'Target category correctly marked SECTION_302_MURDER');
  assert(arjunTarget?.threatLevel === 'CRITICAL', 'Target threat level is CRITICAL');
  assert(arjunTarget?.statutoryBasis.includes('Bharatiya Sakshya Adhiniyam, 2023'), 'Target cites statutory basis under BSA 2023');

  // Enroll New Target
  const newTarget: FaceWatchlistEntry = {
    targetId: 'WLIST-FACE-TEST-99',
    caseId: 'FIR-2026-TEST-0099',
    aliasName: 'Test Suspect',
    category: 'RESTRICTED_AREA_TRESPASS',
    threatLevel: 'MEDIUM',
    status: 'ACTIVE',
    enrolledAt: new Date().toISOString(),
    enrolledByOfficer: 'Inspector Test (Netram)',
    issuingAuthority: 'Judicial Magistrate First Class',
    referenceImages: [],
    legalNotice: 'INVESTIGATIVE ADVISORY ONLY',
    statutoryBasis: 'Bharatiya Sakshya Adhiniyam, 2023 / Section 63-65 Sanctioned Order',
    activeMatchesCount: 0
  };
  faceWatchlistService.enrollTarget(newTarget);
  assert(faceWatchlistService.getWatchlistEntry('WLIST-FACE-TEST-99') !== null, 'New target enrolled successfully');

  // Process Observation into Match Candidate
  const mockObservation: FaceObservation = {
    observationId: 'OBS-FACE-TEST-01',
    cameraId: 'CAM-007',
    cameraName: 'Airport Circle Node',
    timestamp: new Date().toISOString(),
    boundingBox: { xmin: 0.2, ymin: 0.3, xmax: 0.4, ymax: 0.6 },
    quality: {
      overallQuality: 0.88,
      sharpness: 0.90,
      illumination: 0.85,
      frontalPoseScore: 0.92,
      poseAngles: { yaw: 2, pitch: -1, roll: 0 },
      resolutionWidthPx: 180,
      resolutionHeightPx: 220,
      qualityBand: 'OPTIMAL',
      occlusionFlag: false
    },
    cropReferenceUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    frameReferenceUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    embeddingReferenceId: 'OBS-ARJUN-TOKEN-01',
    sourceClassification: 'REAL_CONNECTED',
    provenance: 'CAMERA_OBSERVED',
    associatedVehiclePlate: 'GJ01AB1234'
  };

  const candidate = await faceWatchlistService.processObservation(mockObservation);
  assert(candidate !== null, 'Candidate generated for matching observation');
  assert(candidate?.status === 'WATCHLIST_CANDIDATE', 'Candidate initially flagged as WATCHLIST_CANDIDATE (never auto-enforced)');
  assert(candidate?.contributingSignals.length! >= 3, 'Candidate contains at least 3 contributing signals');
  assert(candidate?.legalDisclaimer.includes('WATCHLIST CANDIDATE ONLY'), 'Candidate includes mandatory non-confirmation disclaimer');

  // -------------------------------------------------------------
  // TEST GROUP 5: Human Officer Verification Gateway
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Human Officer Verification Gateway ---');

  const verified = faceWatchlistService.verifyCandidate(
    candidate!.matchId,
    'HUMAN_VERIFIED',
    'GP-CID-7842',
    'Inspector V. K. Jadeja',
    'Biometric facial landmark concordance and vehicle co-occurrence confirmed by reviewing officer.'
  );

  assert(verified?.status === 'HUMAN_VERIFIED', 'Candidate status updated to HUMAN_VERIFIED after officer signoff');
  assert(verified?.verifyingOfficer?.includes('V. K. Jadeja'), 'Verifying officer recorded on candidate');
  assert(Boolean(verified?.verificationTimestamp), 'Verification timestamp recorded on candidate');

  // -------------------------------------------------------------
  // TEST GROUP 6: Unified Multi-Modal Person Dossier & BSA 2023 Admissibility
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Unified Multi-Modal Person Dossier & BSA 2023 Admissibility ---');

  const dossier = await unifiedPersonInvestigationService.buildPersonDossier('Arjun Rathod');
  assert(dossier !== null, 'Person dossier synthesized for Arjun Rathod');
  assert(dossier?.personAlias === 'Arjun Rathod', 'Dossier personAlias is Arjun Rathod');
  assert(dossier?.sightings.length! >= 2, 'Dossier contains chronological camera sightings');
  assert(dossier?.correlatedVehicles.length! >= 1, 'Dossier identifies correlated vehicles (GJ01AB1234 Fortuner)');
  assert(dossier?.correlatedVehicles[0].plate === 'GJ01AB1234', 'Primary correlated vehicle is GJ01AB1234');
  assert(dossier?.evidenceChain.length! >= 2, 'Evidence chain contains integrity-verified records');
  assert(dossier?.evidenceChain[0].sha256.length === 64, 'Evidence chain includes valid SHA-256 hash');
  assert(dossier?.statutoryAdmissibilityNotice.includes('ELECTRONIC EVIDENCE INTEGRITY PACKAGE'), 'Dossier includes Electronic Evidence Integrity Package notice');
  assert(dossier?.statutoryAdmissibilityNotice.includes('Bharatiya Sakshya Adhiniyam, 2023'), 'Dossier cites Bharatiya Sakshya Adhiniyam, 2023');
  assert(dossier?.statutoryAdmissibilityNotice.includes('SHA-256 is an integrity digest'), 'Dossier clarifies SHA-256 is NOT a digital signature');

  // -------------------------------------------------------------
  // TEST GROUP 7: Storage Factory & Singleton Compliance
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Storage Factory & Singleton Compliance ---');

  const objectStore = EvidenceStorageFactory.createProvider('OBJECT_STORAGE');
  assert(objectStore.providerType === 'OBJECT_STORAGE', 'EvidenceStorageFactory creates OBJECT_STORAGE provider');
  
  const defaultProvider = EvidenceStorageFactory.getProvider();
  assert(Boolean(defaultProvider), 'Default storage provider is available via factory');
  assert(Boolean(evidenceStorage), 'Singleton evidenceStorage export is ready for use');

  console.log('===============================================================');
  console.log(`🎯 V2.3 ARCHITECTURAL SUITE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runV23TestSuite().catch(err => {
  console.error('Fatal error running V2.3 test suite:', err);
  process.exit(1);
});
