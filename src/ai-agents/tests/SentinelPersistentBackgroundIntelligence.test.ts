/**
 * SentinelPersistentBackgroundIntelligence.test.ts
 * Master Runtime Validation & Acceptance Suite for Persistent Background Intelligence
 * Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { sentinelBackgroundIntelligenceService } from '../../services/server/SentinelBackgroundIntelligenceService.js';
import { plateCandidateDetector } from '../../services/vision/PlateCandidateDetector.js';
import { temporalPlateConsensusEngine, FrameOcrObservation } from '../../services/vision/TemporalPlateConsensusEngine.js';
import { BackgroundIntelligenceService } from '../../services/video/BackgroundIntelligenceService.js';

async function runAcceptanceSuite() {
  console.log('================================================================');
  console.log('SENTINEL PERSISTENT BACKGROUND INTELLIGENCE ACCEPTANCE SUITE');
  console.log('Validating Server-Side Autonomy, Multi-Frame Consensus & BSA 2023');
  console.log('================================================================\n');

  // Test 1: Service Lifecycle (Start, Status, Stop, Restart)
  console.log('--- TEST 1: Background Service Lifecycle & State Autonomy ---');
  sentinelBackgroundIntelligenceService.start();
  let status = sentinelBackgroundIntelligenceService.getStatusReport();
  assert.equal(status.service, 'RUNNING', 'Service state should be RUNNING');
  assert.ok(status.cameras['cam01'], 'cam01 should be registered');
  assert.ok(status.cameras['cam04'], 'cam04 should be registered');
  assert.ok(status.cameras['cam05'], 'cam05 should be registered');
  assert.ok(status.cameras['cam06'], 'cam06 should be registered');
  assert.ok(status.cameras['cam12'], 'cam12 should be registered');

  // Verify operational state independence
  const cam01State = status.cameras['cam01'];
  assert.ok(['LIVE', 'CONNECTING', 'DEGRADED'].includes(cam01State.source), 'Source state must be valid');
  assert.ok(['PROCESSING', 'IDLE', 'STALLED'].includes(cam01State.ai), 'AI state must be valid');
  assert.ok(['STREAMING', 'BUFFERING', 'IDLE'].includes(cam01State.player), 'Player state must be valid');
  assert.ok(['READY', 'CAPTURING', 'EMPTY'].includes(cam01State.evidence), 'Evidence state must be valid');
  console.log('✔ Passed: Background service initializes with independent SOURCE, AI, PLAYER, EVIDENCE states.\n');

  // Test 2: React Independence Test
  console.log('--- TEST 2: React Independence & UI Decoupling ---');
  const clientService = BackgroundIntelligenceService.getInstance();
  let receivedUpdates = 0;
  
  // Simulate React Component Mount & Subscription
  const unsubscribe = clientService.subscribeTask('cam01', (task) => {
    receivedUpdates++;
    assert.equal(task.cameraId, 'cam01');
  });
  assert.ok(receivedUpdates > 0, 'React listener should receive initial state immediately upon mount');

  // Simulate React Component Unmount (calling unsubscribe)
  unsubscribe();
  // Service must continue to hold tasks and run in memory
  const taskAfterUnmount = clientService.getTask('cam01');
  assert.ok(taskAfterUnmount, 'Task must persist in memory after React component unmount');
  assert.equal(taskAfterUnmount.status, 'RUNNING', 'Task must remain RUNNING in background');
  console.log('✔ Passed: Unmounting React components does not terminate or impact background tasks.\n');

  // Test 3: Plate Candidate Extraction & Geometric Ranking
  console.log('--- TEST 3: Plate Candidate Extraction & Quality Ranking ---');
  // Create mock realistic frame buffer (JPEG header bytes)
  const syntheticFrame = Buffer.alloc(10000, 0xAA);
  syntheticFrame[0] = 0xFF; syntheticFrame[1] = 0xD8; // JPEG SOI
  syntheticFrame[9998] = 0xFF; syntheticFrame[9999] = 0xD9; // JPEG EOI

  const candidates = await plateCandidateDetector.extractCandidates({
    cameraId: 'cam01',
    trackId: 'TRK-CAM01-TEST',
    rawFrameBuffer: syntheticFrame,
    frameWidth: 1920,
    frameHeight: 1080,
    vehicleBox: { x: 0.3, y: 0.4, width: 0.4, height: 0.3 },
    captureTimestamp: Date.now(),
    frameTimestamp: Date.now(),
    provider: 'SENTINEL_PLATE_DETECTOR'
  });

  assert.ok(Array.isArray(candidates), 'Candidates must be an array');
  assert.ok(candidates.length > 0, 'Should extract candidates from vehicle crop zones');
  for (const c of candidates) {
    assert.ok(c.candidateId, 'Candidate must have unique ID');
    assert.ok(c.plateWidth > 0 && c.plateHeight > 0, 'Dimensions must be positive');
    assert.ok(c.rawPlateCropSha256 && c.rawPlateCropSha256.length === 64, 'Must have valid SHA-256');
    assert.ok(typeof c.cropQuality === 'number', 'Crop quality score must be present');
  }
  // Candidates must be ordered by validity and quality descending
  for (let i = 0; i < candidates.length - 1; i++) {
    if (candidates[i].isGeometricallyValid === candidates[i + 1].isGeometricallyValid) {
      assert.ok(candidates[i].cropQuality >= candidates[i + 1].cropQuality, 'Candidates must be ranked by quality score');
    }
  }
  console.log(`✔ Passed: Extracted ${candidates.length} candidates with geometric validation and quality ranking.\n`);

  // Test 4: Indian Plate Syntax Validation (Strict Validation, Never Generation)
  console.log('--- TEST 4: Plate Format Validation (No Generation/Hallucination) ---');
  const validGJ = temporalPlateConsensusEngine.validateIndianPlateFormat('GJ01AB1234');
  assert.equal(validGJ.isValid, true);
  assert.equal(validGJ.formatType, 'STANDARD_GJ');

  const validOther = temporalPlateConsensusEngine.validateIndianPlateFormat('MH02CD5555');
  assert.equal(validOther.isValid, true);
  assert.equal(validOther.formatType, 'OTHER_INDIAN_STATE');

  const validBH = temporalPlateConsensusEngine.validateIndianPlateFormat('22BH1234AA');
  assert.equal(validBH.isValid, true);
  assert.equal(validBH.formatType, 'BH_SERIES');

  const invalidPartial = temporalPlateConsensusEngine.validateIndianPlateFormat('GJ01?B1234');
  assert.equal(invalidPartial.isValid, false, 'Partial or wildcard plate must NOT pass format validation');

  const invalidShort = temporalPlateConsensusEngine.validateIndianPlateFormat('GJ01');
  assert.equal(invalidShort.isValid, false, 'Truncated plate must NOT pass format validation');
  console.log('✔ Passed: Registration format engine strictly validates syntax without generating missing characters.\n');

  // Test 5: Multi-Frame Temporal Character Consensus
  console.log('--- TEST 5: Multi-Frame Temporal OCR & Character Consensus ---');
  // Scenario A: Multi-frame agreement produces valid consensus
  const agreeingObservations: FrameOcrObservation[] = [
    { frameId: 'f1', frameTimestamp: 1000, rawText: 'GJ01AB1234', cleanedText: 'GJ01AB1234', confidence: 0.85, qualityScore: 80, isGeometricallyValid: true },
    { frameId: 'f2', frameTimestamp: 2000, rawText: 'GJ01AB1234', cleanedText: 'GJ01AB1234', confidence: 0.88, qualityScore: 85, isGeometricallyValid: true },
    { frameId: 'f3', frameTimestamp: 3000, rawText: 'GJ01AB1234', cleanedText: 'GJ01AB1234', confidence: 0.90, qualityScore: 82, isGeometricallyValid: true }
  ];

  const consensusA = temporalPlateConsensusEngine.evaluateTemporalConsensus(agreeingObservations);
  assert.equal(consensusA.status, 'READABLE');
  assert.equal(consensusA.finalPlate, 'GJ01AB1234');
  assert.equal(consensusA.method, 'TEMPORAL_OCR_CONSENSUS');
  assert.equal(consensusA.supportingFrames.length, 3);
  assert.equal(consensusA.candidateStrings.length, 3);
  assert.equal(consensusA.characterConsensus.length, 10);
  console.log('✔ Passed: Formed valid TEMPORAL_OCR_CONSENSUS across 3 agreeing frames.');

  // Scenario B: Ambiguous / conflict characters produce UNCERTAIN, never a guessed plate
  const conflictingObservations: FrameOcrObservation[] = [
    { frameId: 'f1', frameTimestamp: 1000, rawText: 'GJ01AB1234', cleanedText: 'GJ01AB1234', confidence: 0.50, qualityScore: 50, isGeometricallyValid: true },
    { frameId: 'f2', frameTimestamp: 2000, rawText: 'GJ01CD1234', cleanedText: 'GJ01CD1234', confidence: 0.55, qualityScore: 52, isGeometricallyValid: true }
  ];

  const consensusB = temporalPlateConsensusEngine.evaluateTemporalConsensus(conflictingObservations);
  assert.ok(['UNCERTAIN', 'NOT_READABLE'].includes(consensusB.status), 'Conflicting observations must produce UNCERTAIN, not a fabricated plate');
  console.log('✔ Passed: Conflicting frames accurately categorized as UNCERTAIN without hallucination.');

  // Scenario C: Insufficient optical resolution produces NOT_READABLE with exact physical reason
  const unreadableObservations: FrameOcrObservation[] = [
    { frameId: 'f1', frameTimestamp: 1000, rawText: '', cleanedText: '', confidence: 0, qualityScore: 18, isGeometricallyValid: false, unreadableReason: 'LOW_RESOLUTION' }
  ];

  const consensusC = temporalPlateConsensusEngine.evaluateTemporalConsensus(unreadableObservations);
  assert.equal(consensusC.status, 'NOT_READABLE');
  assert.equal(consensusC.finalPlate, null);
  assert.equal(consensusC.notReadableReason, 'LOW_RESOLUTION');
  console.log('✔ Passed: Truthful NOT_READABLE with exact physical reason (LOW_RESOLUTION).\n');

  // Test 6: Bounded Temporal Buffers & Memory Safety
  console.log('--- TEST 6: Bounded Temporal Buffers & Anti-Blocking ---');
  // Trigger camera processing on cam01
  const records = await sentinelBackgroundIntelligenceService.processCameraNode('cam01');
  assert.ok(Array.isArray(records), 'Process camera node must return array of records');

  const updatedStatus = sentinelBackgroundIntelligenceService.getStatusReport();
  assert.ok(updatedStatus.metrics.framesReceived >= 1, 'framesReceived counter must increment');
  assert.ok(updatedStatus.metrics.framesProcessed >= 1, 'framesProcessed counter must increment');

  const tracks = sentinelBackgroundIntelligenceService.getTracks(50);
  for (const track of tracks) {
    assert.ok(track.candidatesBuffer.length <= 10, 'Track candidates buffer must be bounded (<= 10)');
    assert.ok(track.ocrObservations.length <= 15, 'Track OCR observations must be bounded (<= 15)');
  }
  console.log('✔ Passed: Temporal buffers are strictly bounded preventing memory leaks.\n');

  // Test 7: BSA 2023 Section 63 Evidence Integrity
  console.log('--- TEST 7: BSA 2023 Section 63 Evidence Integrity ---');
  const evidencePackages = sentinelBackgroundIntelligenceService.getEvidencePackages(5);
  assert.ok(evidencePackages.length > 0, 'Must produce Section 63 evidence packages');
  const samplePkg = evidencePackages[0];
  assert.ok(samplePkg.evidenceId.startsWith('EVD-BSA63-'), 'Evidence ID must have BSA prefix');
  assert.ok(samplePkg.rawFrameSha256 && samplePkg.rawFrameSha256.length === 64, 'rawFrameSha256 must be valid SHA-256 hex');
  assert.ok(samplePkg.rawCropSha256 && samplePkg.rawCropSha256.length === 64, 'rawCropSha256 must be valid SHA-256 hex');
  assert.equal(samplePkg.legalStandard, 'BSA 2023 Section 63 evidence-ready');
  console.log(`✔ Passed: Evidence package ${samplePkg.evidenceId} satisfies BSA 2023 Section 63 integrity.\n`);

  // Test 8: Patrol Video Source (No fake data when unconfigured)
  console.log('--- TEST 8: Patrol Dashcam Secondary Source Abstraction ---');
  const patrolStatus = sentinelBackgroundIntelligenceService.getPatrolSourceStatus();
  assert.equal(patrolStatus.status, 'PATROL_SOURCE_NOT_CONFIGURED');
  console.log('✔ Passed: Patrol dashcam correctly returns PATROL_SOURCE_NOT_CONFIGURED without synthetic data.\n');

  console.log('================================================================');
  console.log('ALL 8 ACCEPTANCE TESTS PASSED: PERSISTENT BACKGROUND INTELLIGENCE VERIFIED');
  console.log('================================================================\n');

  // Stop background services so test process exits cleanly
  sentinelBackgroundIntelligenceService.stop();
  clientService.destroy();
  process.exit(0);
}

runAcceptanceSuite().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
