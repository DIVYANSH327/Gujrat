/**
 * UniversalPlateIntelligenceAcceptance.test.ts
 * Master Verification Test Suite for Gujarat Police Sentinel Grid
 * Universal Indian Registration Plate Intelligence & Google Cloud Architecture
 */

process.env.NODE_ENV = 'test';

import { universalPlateIntelligenceService } from '../../services/vision/UniversalPlateIntelligenceService.js';
import { googleCloudPlateEventPipeline } from '../../services/cloud/GoogleCloudPlateEventPipeline.js';
import { AUTHORITATIVE_SENTINEL_GEO_REGISTRY } from '../../data/sentinelCatalogue.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`, detail || '');
    failed++;
  }
}

async function runTestSuite() {
  // Explicitly initialize test dataset for test execution
  universalPlateIntelligenceService.seedAuthoritativeObservations();

  console.log('================================================================');
  console.log('SENTINEL GRID: UNIVERSAL PLATE INTELLIGENCE ACCEPTANCE TEST');
  console.log('================================================================\n');

  // Test 1: Authoritative Camera Registry Coverage
  const cameras = Object.values(AUTHORITATIVE_SENTINEL_GEO_REGISTRY);
  assert(cameras.length >= 30, 'Camera Registry has all 30 CCTV nodes configured', { count: cameras.length });
  const verifiedCams = cameras.filter(c => c.locationVerified && c.latitude && c.longitude);
  assert(verifiedCams.length >= 25, 'Majority of Gujarat cameras have verified physical coordinates', { verified: verifiedCams.length });

  // Test 2: Universal Plate Capture - HSRP Plate
  const hsrpRecord = await universalPlateIntelligenceService.captureAndProcessPlate({
    cameraId: 'cam01',
    vehicleClass: 'car',
    yoloConfidence: 0.96,
    bbox: { x: 120, y: 80, width: 220, height: 110 },
    forcedOcr: 'GJ01AB1234',
    forcedHsrp: true
  });

  assert(hsrpRecord.plateType === 'HSRP', 'HSRP plate is recognized as HSRP format', hsrpRecord.plateType);
  assert(hsrpRecord.hsrpStatus === 'HSRP_VERIFIED', 'HSRP status is HSRP_VERIFIED', hsrpRecord.hsrpStatus);
  assert(Boolean(hsrpRecord.hsrpProof?.hasAshokaChakraHologram), 'HSRP verification confirms Ashoka Chakra hologram');
  assert(hsrpRecord.rawSha256.startsWith('sha256:'), 'Raw frame SHA-256 cryptographic seal is generated');
  assert(hsrpRecord.enhancedSha256.startsWith('sha256:'), 'Enhanced frame SHA-256 cryptographic seal is generated');
  assert(hsrpRecord.rawSha256 !== hsrpRecord.enhancedSha256, 'Raw and enhanced frames have distinct SHA-256 hashes');

  // Test 3: Universal Plate Capture - Standard Legacy Plate
  const standardRecord = await universalPlateIntelligenceService.captureAndProcessPlate({
    cameraId: 'cam02',
    vehicleClass: 'car',
    yoloConfidence: 0.91,
    bbox: { x: 100, y: 90, width: 180, height: 90 },
    forcedOcr: 'GJ05CD5678',
    forcedHsrp: false
  });

  assert(standardRecord.plateType === 'STANDARD_LEGACY_INDIAN', 'Legacy plate captured without being discarded as non-HSRP');
  assert(standardRecord.ocrStatus === 'READABLE', 'Legacy plate OCR is readable');
  assert(standardRecord.truthStatus === 'OBSERVED', 'Truth label is strictly OBSERVED');

  // Test 4: Universal Plate Capture - Two-Wheeler / Motorcycle Plate
  const motoRecord = await universalPlateIntelligenceService.captureAndProcessPlate({
    cameraId: 'cam04',
    vehicleClass: 'motorcycle',
    yoloConfidence: 0.93,
    bbox: { x: 200, y: 150, width: 100, height: 120 },
    forcedOcr: 'GJ01EF9988',
    forcedHsrp: false
  });

  assert(motoRecord.plateType === 'TWO_WHEELER_VERTICAL', 'Motorcycle plate correctly captured as vertical format');
  assert(motoRecord.vehicleClass === 'motorcycle', 'Vehicle class recorded as motorcycle');

  // Test 5: Universal Plate Capture - Degraded / Unreadable Plate
  const unreadableRecord = await universalPlateIntelligenceService.captureAndProcessPlate({
    cameraId: 'cam06',
    vehicleClass: 'truck',
    yoloConfidence: 0.89,
    bbox: { x: 50, y: 50, width: 140, height: 80 },
    forcedUnreadableReason: 'GLARE'
  });

  assert(unreadableRecord.ocrStatus === 'NOT_READABLE', 'Degraded capture marked NOT_READABLE (anti-hallucination)');
  assert(unreadableRecord.unreadableReason === 'GLARE', 'Specific degradation reason GLARE preserved for maintenance');
  assert(unreadableRecord.ocrText === null, 'Anti-hallucination: unreadable plate does NOT invent characters');
  assert(unreadableRecord.truthStatus === 'NOT_READABLE', 'Truth label is NOT_READABLE');

  // Test 6: Multi-Frame Temporal Track Consensus Engine
  const trackId = 'TRK-TEST-CONSENSUS-01';
  await universalPlateIntelligenceService.captureAndProcessPlate({
    cameraId: 'cam03',
    vehicleClass: 'car',
    yoloConfidence: 0.92,
    bbox: { x: 100, y: 100, width: 150, height: 100 },
    trackId,
    forcedOcr: 'GJ03XY1122'
  });
  const verifiedMulti = await universalPlateIntelligenceService.captureAndProcessPlate({
    cameraId: 'cam03',
    vehicleClass: 'car',
    yoloConfidence: 0.95,
    bbox: { x: 120, y: 110, width: 160, height: 100 },
    trackId,
    forcedOcr: 'GJ03XY1122'
  });

  assert(verifiedMulti.multiFrameVerification.consensusReached, 'Multi-frame temporal consensus reached across track');
  assert(verifiedMulti.multiFrameVerification.agreeingFramesCount >= 2, 'Consensus has >= 2 agreeing frames');
  assert(verifiedMulti.multiFrameVerification.sampledFrameIds.length >= 2, 'Sampled frame IDs recorded for audit');

  // Test 7: "Where Was A Plate Detected?" Chronological Journey
  const dossier = universalPlateIntelligenceService.searchPlate('GJ01AB1234');
  assert(dossier !== null, 'Plate journey search returns dossier for GJ01AB1234');
  if (dossier) {
    assert(dossier.hops.length >= 3, 'Journey contains multi-hop camera sequence', { hops: dossier.hops.length });
    assert(dossier.predictedCorridor !== undefined, 'Predicted corridor generated for next likely camera node');
    assert(dossier.hops[0].isObserved, 'Confirmed hops marked strictly isObserved: true');
  }

  // Test 8: Unreadable Hotspots Diagnostic Query
  const hotspots = universalPlateIntelligenceService.getUnreadableHotspots();
  assert(hotspots.length > 0, 'Unreadable hotspots query returns active degraded locations');
  assert(hotspots.every(h => h.unreadableReason !== 'NONE'), 'All hotspot records have valid unreadableReason');

  // Test 9: Camera Quality Intelligence Analytics
  const quality = universalPlateIntelligenceService.getCameraQualityIntelligence();
  assert(quality.length >= 30, 'Quality ranking calculated for all 30 camera nodes');
  assert(quality.every(q => q.readabilityRatePct >= 0 && q.readabilityRatePct <= 100), 'Readability rate is percentage 0-100%');

  // Test 10: Google Cloud Event Pipeline - Pub/Sub
  await googleCloudPlateEventPipeline.publishObservation(hsrpRecord);
  const pubsubMetrics = googleCloudPlateEventPipeline.pubsub.getTopicMetrics();
  assert(pubsubMetrics.totalEvents > 0, 'Events successfully published to Google Pub/Sub');
  assert(pubsubMetrics.topicCounts['sentinel-plate-observations'] > 0, 'Published to sentinel-plate-observations');
  assert(pubsubMetrics.topicCounts['sentinel-hsrp-observations'] > 0, 'Published to sentinel-hsrp-observations');

  // Test 11: Google BigQuery Schema & DDL
  const bqSchema = googleCloudPlateEventPipeline.bigquery.getSchemaMetadata();
  assert(bqSchema.partitioning === 'DATE(timestamp)', 'BigQuery table day-partitioned by timestamp');
  assert(bqSchema.clustering.includes('camera_id'), 'BigQuery table clustered by camera_id');
  assert(bqSchema.clustering.includes('ocr_text'), 'BigQuery table clustered by ocr_text');
  assert(bqSchema.ddl.includes('CREATE TABLE IF NOT EXISTS'), 'BigQuery DDL generated cleanly');

  // Test 12: Google Dataflow Streaming Windowing
  const dfStatus = googleCloudPlateEventPipeline.dataflow.getPipelineStatus();
  assert(dfStatus.state === 'JOB_STATE_RUNNING', 'Dataflow pipeline runner is active');
  assert(dfStatus.throughputEventsPerSec > 0, 'Dataflow throughput reported');

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
