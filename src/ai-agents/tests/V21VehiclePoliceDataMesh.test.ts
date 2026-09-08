/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * V2.1 Architecture Test Suite: Vehicle & Police Data Intelligence Mesh
 * 
 * Validates:
 * 1. ANPR Quality & Ambiguity Intelligence
 * 2. Multi-Attribute Spatiotemporal Correlation
 * 3. Evidence Timeline & Journey Quality
 * 4. External Data Federation & Zero-Trust RBAC Policy
 * 5. Master Vehicle Dossier Fabric (Strict Epistemic Separation)
 * 6. Human Review Verification without Overwriting AI Inference
 * 7. Traffic Group & Corridor Volumetrics
 * 8. 11-Stage Investigation Mission Orchestrator
 */

import { normalizeLicensePlate, VehicleObservation } from '../../types';
import { anprQualityService } from '../../services/ANPRQualityService';
import { vehicleAttributeCorrelationService } from '../../services/VehicleAttributeCorrelationService';
import { evidenceCorrelationService } from '../../services/EvidenceCorrelationService';
import { externalDataProviderRegistry } from '../../services/ExternalDataProviderRegistry';
import { externalLookupPolicyEngine } from '../../services/ExternalLookupPolicyEngine';
import { externalLookupCache } from '../../services/ExternalLookupCache';
import { externalLookupRateLimiter } from '../../services/ExternalLookupRateLimiter';
import { vehicleDossierService } from '../../services/VehicleDossierService';
import { vehicleDataIntelligenceAgent } from '../vehicle/VehicleDataIntelligenceAgent';
import { trafficGroupCorrelationAgent } from '../traffic/TrafficGroupCorrelationAgent';
import { trafficFlowAgent } from '../traffic/TrafficFlowAgent';
import { roadSegmentIntelligenceService } from '../../services/RoadSegmentIntelligenceService';
import { vehicleInvestigationMissionService } from '../../services/VehicleInvestigationMissionService';

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

async function runV21TestSuite() {
  console.log('===============================================================');
  console.log('  GUJARAT CCTV INTELLIGENCE GRID V2.1 ARCHITECTURAL SUITE');
  console.log('  Vehicle & Police Data Intelligence Mesh + Forensic Dossier');
  console.log('===============================================================');

  // -------------------------------------------------------------
  // TEST GROUP 1: ANPR Quality & Optical Ambiguity Service
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 1: ANPR Quality & Ambiguity Intelligence ---');
  const rawPlate = 'gj-05 ob 1234';
  const normalized = normalizeLicensePlate(rawPlate);
  assert(normalized === 'GJ05OB1234', 'Plate string normalization strips punctuation, whitespace and capitalizes');

  const ambiguity = anprQualityService.analyzePlateAmbiguity('GJ05OB1234');
  assert(ambiguity.hasAmbiguity === true, 'Identified optical ambiguity for character O/0 or B/8');
  assert(ambiguity.variants.length >= 2, 'Generated candidate ambiguity variants');
  assert(ambiguity.variants.includes('GJ050B1234') || ambiguity.variants.includes('GJ05O81234'), 'Generated plausible optical character permutations');

  const obsQuality = anprQualityService.createPlateObservation({
    observationId: 'OBS-TEST-001',
    cameraId: 'CAM-007',
    cameraName: 'Airport Approach',
    timestamp: new Date().toISOString(),
    rawRead: 'GJ05AB1234',
    agentId: 'OCR-EDGE-01',
    correlationId: 'CORR-001',
    metricsInput: { imageQuality: 0.95, blurScore: 0.92, angleScore: 0.90, occlusionScore: 0.98 }
  });
  assert(obsQuality.quality.classification === 'HIGH_QUALITY', 'Assigned HIGH_QUALITY category based on composite optical metrics');
  assert(obsQuality.confidence >= 0.85, 'High confidence mapped for standard HSRP plate');

  // -------------------------------------------------------------
  // TEST GROUP 2: Vehicle Attribute Multi-Modal Correlation
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Vehicle Attribute Multi-Modal Correlation ---');
  const obsA = {
    observationId: 'OBS-A',
    eventId: 'EVT-A',
    edgeNodeId: 'EDGE-01',
    trackId: 'TRK-01',
    cameraId: 'CAM-007',
    cameraName: 'Airport North Approach',
    timestamp: '2026-09-06T10:00:00.000Z',
    gps: { latitude: 23.0725, longitude: 72.6288 },
    plateText: 'GJ05AB1234',
    plateNormalized: 'GJ05AB1234',
    plateStatus: 'PLATE_READ' as const,
    plateConfidence: 0.95,
    vehicleClass: 'suv' as const,
    vehicleColor: 'WHITE',
    vehicleConfidence: 0.94,
    direction: 'NORTHBOUND',
    speedEstimate: 55,
    sourceType: 'REAL_CAMERA' as const,
    analysisMode: 'REAL_AI' as const,
    imageReference: '/snapshots/cam007-a.jpg',
    isBestFrame: true,
    watchlistMatch: false,
    status: 'CAPTURED' as const,
    frameWidth: 1920,
    frameHeight: 1080,
    evidenceHash: 'HASH-SHA256-A'
  } as VehicleObservation;

  const obsB = {
    observationId: 'OBS-B',
    eventId: 'EVT-B',
    edgeNodeId: 'EDGE-01',
    trackId: 'TRK-02',
    cameraId: 'CAM-014',
    cameraName: 'Hansol Junction',
    timestamp: '2026-09-06T10:04:00.000Z', // 4 minutes later, ~3.5 km away
    gps: { latitude: 23.0850, longitude: 72.6320 },
    plateText: 'GJ05AB1234',
    plateNormalized: 'GJ05AB1234',
    plateStatus: 'PLATE_READ' as const,
    plateConfidence: 0.92,
    vehicleClass: 'suv' as const,
    vehicleColor: 'WHITE',
    vehicleConfidence: 0.93,
    direction: 'NORTHBOUND',
    speedEstimate: 52,
    sourceType: 'REAL_CAMERA' as const,
    analysisMode: 'REAL_AI' as const,
    imageReference: '/snapshots/cam014-b.jpg',
    isBestFrame: true,
    watchlistMatch: false,
    status: 'CAPTURED' as const,
    frameWidth: 1920,
    frameHeight: 1080,
    evidenceHash: 'HASH-SHA256-B'
  } as VehicleObservation;

  const correlation = vehicleAttributeCorrelationService.correlateAttributes(obsA, obsB);
  assert(correlation.decision === 'HIGH_CONFIDENCE_CORRELATION' || correlation.decision === 'SAME_VEHICLE', 'Classified concordant observations with high confidence correlation');
  assert(correlation.confidence >= 0.85, 'Multi-attribute confidence exceeds 85% threshold');
  assert(correlation.breakdown.temporalConsistency > 0, 'Temporal velocity transit is physically plausible');
  assert(correlation.whyLinked.length > 0, 'Exposes structured explainability reasons for link');

  // Test speed impossibility
  const obsC: VehicleObservation = {
    ...obsB,
    observationId: 'OBS-C',
    timestamp: '2026-09-06T10:00:10.000Z' // 10 seconds later, 3.5 km away = ~1260 km/h
  };
  const impossibleCorr = vehicleAttributeCorrelationService.correlateAttributes(obsA, obsC);
  assert(impossibleCorr.conflictingSignals.some(s => s.includes('Improbable transit speed')), 'Flags physically impossible velocity as conflicting signal');

  // -------------------------------------------------------------
  // TEST GROUP 3: Evidence Timeline & Journey Quality
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Evidence Timeline & Journey Quality ---');
  const journeyTimeline = evidenceCorrelationService.buildEvidenceTimeline([obsA, obsB]);
  assert(journeyTimeline.length === 2, 'Constructed 2-checkpoint chronological timeline');
  assert(journeyTimeline[0].stageName === 'FIRST_SEEN', 'Initial observation designated as FIRST_SEEN');
  assert(journeyTimeline[1].stageName === 'LAST_SEEN', 'Terminal observation designated as LAST_SEEN');

  const journeyQuality = evidenceCorrelationService.calculateJourneyQuality([obsA, obsB]);
  assert(journeyQuality.level === 'HIGH', 'Continuous multi-camera sighting evaluated as HIGH quality journey');
  assert(journeyQuality.score >= 80, 'Journey quality score >= 80');

  const signals = evidenceCorrelationService.aggregateSignals({
    observations: [obsA, obsB],
    watchlistMatches: []
  });
  assert(signals.totalSignalsCount === 0, 'Zero illicit signals asserted when none present');
  assert(!signals.explanation.includes('Criminal Score'), 'No arbitrary numeric criminal scoring generated');

  // -------------------------------------------------------------
  // TEST GROUP 4: External Data Federation & Governance Policy
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: External Data Federation & Policy Engine ---');
  // RBAC Policy Test: VIEWER cannot query eGujCop
  const viewerCheck = externalLookupPolicyEngine.canQueryProvider(
    { actorId: 'OPERATOR-01', role: 'VIEWER', purpose: 'Ad-hoc check' },
    'EGUJCOP'
  );
  assert(viewerCheck.allowed === false, 'Blocked VIEWER role from accessing sensitive eGujCop police records');

  // INVESTIGATOR with active case can query
  const investigatorCheck = externalLookupPolicyEngine.canQueryProvider(
    { actorId: 'OFFICER-01', role: 'INVESTIGATOR', purpose: 'Active Robbery Case', caseId: 'CASE-2026-01', isActiveInvestigation: true },
    'EGUJCOP'
  );
  assert(investigatorCheck.allowed === true, 'Permitted INVESTIGATOR with active case to query eGujCop');

  // Cache and rate limiting
  externalLookupCache.set('VAHAN', 'GJ99XX9999', { test: true }, { actorId: 'TEST-ACTOR', role: 'INVESTIGATOR' });
  assert(externalLookupCache.has('VAHAN', 'GJ99XX9999') === true, 'External lookup successfully cached');
  const rateAllowed = externalLookupRateLimiter.isAllowed('TEST-ACTOR', 'VAHAN');
  assert(rateAllowed === true, 'Rate limiter permits initial lookup request');

  // Authorized federation query
  const extResults = await externalDataProviderRegistry.queryAllAuthorized('GJ05AB1234', {
    actorId: 'OFFICER-PATEL',
    role: 'INVESTIGATOR',
    purpose: 'Statutory Case Verification',
    caseId: 'CASE-2026-08'
  });
  assert(extResults.vahan !== undefined, 'VAHAN gateway returned vehicle registration details');
  assert(extResults.vahan.isSimulated === true, 'External response explicitly marked isSimulated for prototype');
  assert(extResults.vahan.disclaimer.length > 0, 'Statutory disclaimer included in response');
  assert(extResults.echallan !== undefined, 'eChallan gateway returned traffic fines summary');
  assert(extResults.egujcop !== undefined, 'eGujCop gateway returned core police records status');

  // -------------------------------------------------------------
  // TEST GROUP 5: Master Vehicle Dossier Fabric (Strict Epistemic Separation)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Master Vehicle Dossier Fabric ---');
  const dossier = vehicleDossierService.getOrCreateDossier('GJ05AB1234');
  assert(dossier.canonicalPlate === 'GJ05AB1234', 'Created or retrieved canonical VehicleDossier');
  assert(dossier.firstSeen.sourceOfTruth === 'CAMERA_OBSERVED', 'First seen labeled strictly as CAMERA_OBSERVED');
  assert(dossier.lastSeen.sourceOfTruth === 'CAMERA_OBSERVED', 'Last seen labeled strictly as CAMERA_OBSERVED');

  // Attach external data
  const updatedDossier = vehicleDossierService.updateDossierWithExternalData('GJ05AB1234', extResults);
  assert(updatedDossier.externalDataStatus === 'AUTHORIZED_LOADED', 'External data status updated to AUTHORIZED_LOADED');
  assert(updatedDossier.externalData?.vahan?.record?.make !== undefined, 'VAHAN record present in separate externalData container');
  assert((updatedDossier.observations[0].sourceType as string) !== 'EXTERNAL_DATA', 'Camera observation fact set remained strictly independent');

  // Partial plate matching
  const partialHits = vehicleDossierService.searchPartialPlate('GJ05');
  assert(partialHits.length > 0, 'Found partial plate candidate matches');
  assert(partialHits[0].disclaimer.includes('PARTIAL OPTICAL CANDIDATE'), 'Partial candidate includes explicit disclaimer not to assert definitive identity');

  // -------------------------------------------------------------
  // TEST GROUP 6: Human Verification Review
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Human-in-the-Loop Review ---');
  const reviewedDossier = vehicleDossierService.addHumanReview('GJ05AB1234', {
    reviewId: 'REV-001',
    decision: 'CONFIRM',
    reviewerId: 'OFFICER-SUPERVISOR-99',
    reviewerRole: 'SUPERVISOR',
    timestamp: new Date().toISOString(),
    reason: 'Verified optical IR frame against physical Scorpio-N vehicle',
    verifiedState: 'HUMAN_VERIFIED',
    targetVehicleId: dossier.vehicleId
  });
  assert(reviewedDossier.humanReviews.length >= 1, 'Recorded human review decision into dossier');
  assert(reviewedDossier.humanReviews[0].verifiedState === 'HUMAN_VERIFIED', 'Recorded status as HUMAN_VERIFIED');
  assert(reviewedDossier.confidence > 0, 'Original automated AI confidence preserved alongside review');

  // Export forensic dossier
  const exported = vehicleDossierService.exportDossier('GJ05AB1234', {
    id: 'OFFICER-SUPERVISOR-99',
    role: 'SUPERVISOR',
    purpose: 'Courtroom Presentation'
  });
  assert(exported.legalDisclaimer.includes('Section 65B'), 'Exported dossier includes Section 65B Indian Evidence Act admissibility notice');

  // -------------------------------------------------------------
  // TEST GROUP 7: Traffic Flow & Group Correlation Agents
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Traffic Flow & Group Correlation ---');
  const groups = trafficGroupCorrelationAgent.detectTrafficGroups([obsA, obsB]);
  assert(Array.isArray(groups), 'Traffic group correlation agent returned candidates array');

  const flow = trafficFlowAgent.computeFlowMetrics([obsA, obsB]);
  assert(flow.vehiclesPerMinute > 0, 'Calculated vehicles per minute corridor throughput');
  assert(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(flow.congestionLevel), 'Valid congestion classification calculated');

  const segments = roadSegmentIntelligenceService.getAllSegments();
  assert(segments.length >= 3, 'Road segment intelligence service maintains key arterial corridors');

  // -------------------------------------------------------------
  // TEST GROUP 8: 11-Stage Investigation Mission Orchestrator
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: 11-Stage Investigation Mission ---');
  const mission = await vehicleInvestigationMissionService.launchMission('GJ05AB1234', {
    actorId: 'OFFICER-TEST',
    role: 'INVESTIGATOR',
    purpose: 'Automated Pipeline Test',
    caseId: 'CASE-2026-TEST',
    includeExternalData: true
  });
  assert(mission.status === 'COMPLETED', 'Investigation mission completed all 11 stages');
  assert(mission.stages.length === 11, 'All 11 stages tracked');
  assert(mission.stages.find(s => s.name === 'AUDIT')?.status === 'COMPLETED', 'Statutory audit stage executed and sealed');
  assert(mission.dossier !== undefined, 'Compiled final VehicleDossier object at conclusion of mission');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`  V2.1 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runV21TestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
