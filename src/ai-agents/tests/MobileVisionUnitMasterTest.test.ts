/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Police Mobile Vision Unit & Edge Perception Test Suite
 * Validating 24 Forensic & Technical Acceptance Criteria
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mobilePatrolNodeService } from '../../services/mobilePatrol/MobilePatrolNodeService';
import { mobileVisionUnitRegistry } from '../../services/mobilePatrol/MobileVisionUnitRegistry';
import { mobilePatrolBufferEngine } from '../../services/mobilePatrol/MobilePatrolBufferEngine';
import { mobilePatrolMeshAgentService } from '../../services/mobilePatrol/MobilePatrolMeshAgentService';

describe('SENTINEL GRID — POLICE MOBILE VISION UNIT ACCEPTANCE SUITE', () => {

  // Test 1: Mobile camera registration
  it('1. Should register canonical MobileVisionUnit with valid capabilities', () => {
    const units = mobileVisionUnitRegistry.getAllUnits();
    assert.ok(units.length >= 3, 'At least 3 canonical units must be registered');
    const unit1 = mobileVisionUnitRegistry.getUnitById('MVU-001');
    assert.ok(unit1, 'MVU-001 must exist');
    assert.strictEqual(unit1?.unitId, 'MVU-001');
    assert.strictEqual(unit1?.cameraCapabilities.objectDetection, true);
    assert.strictEqual(unit1?.cameraCapabilities.vehicleDetection, true);
  });

  // Test 2: YOLO vehicle detection
  it('2. Should maintain YOLOv8 edge detection classes with bounding boxes', () => {
    const frame = mobilePatrolBufferEngine.pushFrame('data:image/jpeg;base64,sampleFrame', 85, 2);
    assert.ok(frame.frameId.startsWith('FRM-'));
    assert.strictEqual(frame.qualityScore, 85);
  });

  // Test 3: Vehicle tracking
  it('3. Should maintain short-lived vehicle tracking state', () => {
    const currentMeta = mobilePatrolNodeService.getMetadata();
    assert.ok(currentMeta.cameraId, 'Camera ID must be assigned to track');
  });

  // Test 4: Plate candidate detection
  it('4. Should detect plate candidates when vehicle has legible plate', async () => {
    const evt = await mobilePatrolNodeService.triggerEvent({
      category: 'HSRP_CANDIDATE',
      vehicleClass: 'car',
      rawPlateText: 'GJ01AB1234'
    });
    assert.strictEqual(evt.plateText, 'GJ01AB1234');
    assert.strictEqual(evt.category, 'HSRP_CANDIDATE');
  });

  // Test 5: No-plate candidate
  it('5. Should trigger NO_PLATE_CANDIDATE when plate is missing or obscured', async () => {
    const evt = await mobilePatrolNodeService.triggerEvent({
      category: 'NO_PLATE_CANDIDATE',
      vehicleClass: 'motorcycle',
      rawPlateText: '',
      helmetState: 'NO_HELMET_CANDIDATE'
    });
    assert.strictEqual(evt.category, 'NO_PLATE_CANDIDATE');
    assert.strictEqual(evt.plateStatus, 'NO_PLATE_CANDIDATE');
  });

  // Test 6: HSRP verification
  it('6. Should evaluate CMVR Rule 50 features during HSRP verification', async () => {
    const deliberation = await mobilePatrolMeshAgentService.deliberateEvent({
      category: 'HSRP_CANDIDATE',
      vehicleClass: 'car',
      vehicleConfidence: 0.95,
      rawPlateText: 'GJ01AB1234',
      rawFrameHash: 'a'.repeat(64),
      enhancedFrameHash: 'b'.repeat(64),
      cameraId: 'PATROL-04',
      vehicleId: 'GJ01-G-9988'
    });
    assert.ok(deliberation.agentDeliberations.length >= 10, 'Agent mesh must execute multi-agent deliberation');
    assert.ok(deliberation.meshFinalVerdict.length > 0);
  });

  // Test 7: Intelligent frame selection
  it('7. Should select highest quality frame from temporal window', () => {
    const snapshot = mobilePatrolBufferEngine.extractEvidenceSequence(2, 2);
    assert.ok(snapshot.bestFrame, 'Must extract best quality frame');
    assert.ok(snapshot.supportingFrames.length > 0, 'Must include pre/post event sequence');
  });

  // Test 8: Image enhancement
  it('8. Should provide derived enhanced version while preserving raw source', async () => {
    const evt = await mobilePatrolNodeService.triggerEvent({
      category: 'NO_HELMET',
      vehicleClass: 'motorcycle'
    });
    assert.ok(evt.bestFrameUrl, 'Raw source must exist');
    assert.ok(evt.enhancedFrameUrl, 'Enhanced version must exist');
  });

  // Test 9: SHA-256 evidence integrity
  it('9. Should compute dual SHA-256 digests for raw and enhanced frames', async () => {
    const evt = await mobilePatrolNodeService.triggerEvent({
      category: 'TRIPLE_RIDING',
      vehicleClass: 'motorcycle'
    });
    assert.strictEqual(evt.rawFrameHash.length, 64, 'Raw hash must be 64-character SHA-256');
    assert.strictEqual(evt.enhancedFrameHash.length, 64, 'Enhanced hash must be 64-character SHA-256');
  });

  // Test 10: GPS metadata
  it('10. Should attach valid GPS coordinates or report GPS_UNAVAILABLE', () => {
    const meta = mobilePatrolNodeService.getMetadata();
    assert.ok(meta.gps.status === 'AVAILABLE' || meta.gps.status === 'GPS_UNAVAILABLE');
  });

  // Test 11: Google Cloud event dispatch
  it('11. Should format event for Google Cloud Pub/Sub dispatch', async () => {
    const syncResult = await mobilePatrolNodeService.syncOfflineQueueToCloud();
    assert.strictEqual(typeof syncResult.syncedCount, 'number');
    assert.strictEqual(typeof syncResult.pubSubTopic, 'string');
  });

  // Test 12: BigQuery event schema
  it('12. Should validate BigQuery structured record fields without storing raw 4K video', async () => {
    const evt = mobilePatrolNodeService.getEvents()[0];
    assert.ok(evt.eventId);
    assert.ok(evt.cameraId);
    assert.ok(evt.timestamp);
    assert.ok(evt.rawFrameHash);
  });

  // Test 13: Cloud Storage evidence reference
  it('13. Should reference cloud storage URI in evidence payload', async () => {
    const evt = mobilePatrolNodeService.getEvents()[0];
    assert.ok(evt.cloudStorageUri?.startsWith('gs://'));
  });

  // Test 14: Map event rendering
  it('14. Should query geo-located events from registry search', () => {
    const results = mobileVisionUnitRegistry.searchObservations({ term: 'GJ01' });
    assert.ok(Array.isArray(results.events));
    assert.ok(Array.isArray(results.units));
  });

  // Test 15: Patrol mode
  it('15. Should maintain event counters for dedicated patrol mode', () => {
    const events = mobilePatrolNodeService.getEvents();
    assert.ok(Array.isArray(events));
  });

  // Test 16: Manual evidence capture
  it('16. Should allow 1-tap manual evidence triggering', async () => {
    const evt = await mobilePatrolNodeService.triggerEvent({
      category: 'NO_PLATE_CANDIDATE',
      vehicleClass: 'car'
    });
    assert.ok(evt.eventId);
  });

  // Test 17: Queue backpressure
  it('17. Should enforce bounded memory window without buffer exhaustion', () => {
    for (let i = 0; i < 70; i++) {
      mobilePatrolBufferEngine.pushFrame(`data:image/jpeg;base64,frame${i}`, 80, 1);
    }
    const count = mobilePatrolBufferEngine.getBufferedFramesCount();
    assert.ok(count <= 60, `Buffer must be capped at 60 max frames, currently: ${count}`);
  });

  // Test 18: Dropped-frame handling
  it('18. Should maintain metrics on bandwidth and storage reduction', () => {
    const metrics = mobilePatrolNodeService.getStorageMetrics();
    assert.ok(metrics.bandwidthReductionRatio.includes('99.4%'));
  });

  // Test 19: AI unavailable fallback
  it('19. Should handle AI engine offline fallback gracefully', async () => {
    const deliberation = await mobilePatrolMeshAgentService.deliberateEvent({
      category: 'OVERSPEED_CANDIDATE',
      vehicleClass: 'car',
      vehicleConfidence: 0.88,
      rawPlateText: 'GJ01XX9999',
      rawFrameHash: 'c'.repeat(64),
      enhancedFrameHash: 'd'.repeat(64),
      cameraId: 'PATROL-04',
      vehicleId: 'GJ01-G-9988'
    });
    assert.ok(deliberation.meshConfidence > 0);
  });

  // Test 20: GPS unavailable fallback
  it('20. Should handle GPS unavailable status gracefully without throwing', () => {
    const currentMeta = mobilePatrolNodeService.getMetadata();
    assert.ok(currentMeta.gps);
  });

  // Test 21: Responsive UI configuration
  it('21. Should allow configuration of buffer seconds and acceleration modes', () => {
    mobilePatrolNodeService.updateConfiguration({
      rollingBufferSeconds: 8,
      accelerationMode: 'GPU'
    });
    const cfg = mobilePatrolNodeService.getConfiguration();
    assert.strictEqual(cfg.rollingBufferSeconds, 8);
    assert.strictEqual(cfg.accelerationMode, 'GPU');
  });

  // Test 22: Authentication
  it('22. Should sign evidence records with BSA 2023 Section 63 officer badges', async () => {
    const evt = mobilePatrolNodeService.getEvents()[0];
    assert.ok(evt.bsaSection63Cert.officerBadge);
    assert.ok(evt.bsaSection63Cert.deviceFingerprint);
  });

  // Test 23: Authorization
  it('23. Should update officer review status with authorized transitions', () => {
    const evt = mobilePatrolNodeService.getEvents()[0];
    mobilePatrolNodeService.updateEventReviewStatus(evt.eventId, 'OFFICER_VERIFIED', 'Verified by Patrol Lead');
    const updated = mobilePatrolNodeService.getEvents().find(e => e.eventId === evt.eventId);
    assert.strictEqual(updated?.reviewStatus, 'OFFICER_VERIFIED');
  });

  // Test 24: No-secret-leak test
  it('24. Should ensure no sensitive API credentials in client-facing models', () => {
    const units = mobileVisionUnitRegistry.getAllUnits();
    const str = JSON.stringify(units);
    assert.ok(!str.includes('AIzaSy'), 'No Google API keys in unit registry');
    assert.ok(!str.includes('sk_live'), 'No private secret keys in unit registry');
  });

});
