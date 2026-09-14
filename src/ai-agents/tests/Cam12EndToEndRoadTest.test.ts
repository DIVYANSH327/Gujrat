/**
 * Cam12EndToEndRoadTest.test.ts
 * Automated Verification Suite for CAM12 Road Test, Capability Routing & Technology Switches
 * Gujarat Police CCTV & AI Intelligence Platform
 * Author: DIVYANSH Shrivastava
 */

import assert from 'assert';
import { aiTechnologySwitchService } from '../../services/AiTechnologySwitchService.js';
import { cameraIntelligenceProfileService } from '../../services/CameraIntelligenceProfileService.js';
import { centralEventBus } from '../../services/CentralEventBus.js';

console.log('--- RUNNING CAM12 END-TO-END ROAD TEST & ROUTING SUITE ---');

async function runCam12TestSuite() {
  try {
    // -------------------------------------------------------------
    // Test 1: Technology switches toggle states accurately
    // -------------------------------------------------------------
    aiTechnologySwitchService.setDeterministicBaseline();
    const baseline = aiTechnologySwitchService.getSwitches();
    assert.strictEqual(baseline.yoloEnabled, true, 'Test 1: YOLO must be enabled in baseline');
    assert.strictEqual(baseline.anprEnabled, true, 'Test 1: ANPR must be enabled in baseline');
    assert.strictEqual(baseline.hsrpEnabled, true, 'Test 1: HSRP must be enabled in baseline');
    assert.strictEqual(baseline.ocrEnabled, true, 'Test 1: OCR must be enabled in baseline');
    assert.strictEqual(baseline.omniRouteEnabled, false, 'Test 1: OmniRoute disabled in deterministic baseline');

    aiTechnologySwitchService.updateSwitches({ ocrEnabled: false, hsrpEnabled: false });
    const updated = aiTechnologySwitchService.getSwitches();
    assert.strictEqual(updated.ocrEnabled, false, 'Test 1: OCR should be disabled');
    assert.strictEqual(updated.hsrpEnabled, false, 'Test 1: HSRP should be disabled');
    assert.strictEqual(aiTechnologySwitchService.isEnabled('OCR'), false);
    assert.strictEqual(aiTechnologySwitchService.isEnabled('HSRP'), false);
    console.log('✅ Test 1 Passed: Technology switches toggle states accurately.');

    // -------------------------------------------------------------
    // Test 2: Camera Intelligence Profile routes CAM12 correctly
    // -------------------------------------------------------------
    aiTechnologySwitchService.setDeterministicBaseline();
    cameraIntelligenceProfileService.updateProfile('cam12', {
      status: 'ONLINE',
      cameraClass: 'ANPR',
      aiEnabled: true,
      frameQuality: 'HIGH',
      lastFrameAge: 500
    });

    const profile = cameraIntelligenceProfileService.getProfile('cam12');
    assert.ok(profile, 'Test 2: CAM12 profile must exist');
    assert.strictEqual(profile.cameraId, 'cam12');
    assert.strictEqual(profile.supportsANPR, true);

    const routingDecision = cameraIntelligenceProfileService.evaluateRoutingDecision('cam12', 'AUTO');
    assert.strictEqual(routingDecision.eligible, true, 'Test 2: CAM12 must be eligible for ANPR');
    assert.strictEqual(routingDecision.activeDetector, 'ANPR');
    assert.strictEqual(routingDecision.suggestedAction, 'RUN_ANPR_PIPELINE');
    console.log('✅ Test 2 Passed: Camera Intelligence Profile routes CAM12 correctly based on ANPR capability.');

    // -------------------------------------------------------------
    // Test 3: Respects offline camera status without fake data
    // -------------------------------------------------------------
    cameraIntelligenceProfileService.updateProfile('cam12', { status: 'OFFLINE', cameraClass: 'OFFLINE' });
    const decision = cameraIntelligenceProfileService.evaluateRoutingDecision('cam12', 'AUTO');
    assert.strictEqual(decision.eligible, false, 'Test 3: Offline camera must not be eligible');
    assert.strictEqual(decision.reason, 'CAMERA_OFFLINE');

    // Restore online status
    cameraIntelligenceProfileService.updateProfile('cam12', {
      status: 'ONLINE',
      cameraClass: 'ANPR',
      aiEnabled: true,
      frameQuality: 'HIGH',
      lastFrameAge: 500
    });
    console.log('✅ Test 3 Passed: Respects offline camera status and rejects processing without fake data.');

    // -------------------------------------------------------------
    // Test 4: Global technology switch disabling YOLO halts processing gracefully
    // -------------------------------------------------------------
    aiTechnologySwitchService.updateSwitches({ yoloEnabled: false });
    const yoloDecision = cameraIntelligenceProfileService.evaluateRoutingDecision('cam12', 'VEHICLE_YOLO');
    assert.strictEqual(yoloDecision.eligible, false, 'Test 4: Disabled YOLO must halt processing');
    assert.strictEqual(yoloDecision.reason, 'YOLO_DISABLED_BY_SWITCH');
    console.log('✅ Test 4 Passed: Global technology switch disabling YOLO halts processing gracefully.');

    // -------------------------------------------------------------
    // Test 5: Subscribes to centralEventBus and receives traceable real events
    // -------------------------------------------------------------
    let capturedEvent: any = null;
    const subId = centralEventBus.subscribe('VIOLATION_CASE_CREATED', (evt) => {
      capturedEvent = evt;
    });

    centralEventBus.publish({
      eventType: 'VIOLATION_CASE_CREATED',
      sourceId: 'cam12',
      correlationId: 'TRK-cam12-101',
      idempotencyKey: `TEST-EVT-${Date.now()}`,
      priority: 'P1',
      payload: {
        eventId: 'EVT-TEST-101',
        cameraId: 'cam12',
        cameraName: '12 Tri Mandir Adalaj Tollnaka',
        location: 'Tri Mandir Adalaj Tollnaka, Gandhinagar',
        vehiclePlate: 'GJ01AB1234',
        detectionType: 'car',
        model: 'yolov8-quantized-edge',
        technology: 'DETERMINISTIC_CV',
        evidenceReference: '/api/intelligence/snapshots/SNAP-TEST-1',
        evidenceSha256: 'a1b2c3d4e5f60102030405060708090a1b2c3d4e5f60102030405060708090aa',
        confidence: 0.94,
        sourceFrameTimestamp: Date.now(),
        title: 'HSRP Non-Compliance Detected',
        description: 'Missing mandatory hologram under CMVR Rule 50.'
      }
    });

    assert.ok(capturedEvent, 'Test 5: Event must be received by CentralEventBus subscriber');
    assert.strictEqual(capturedEvent.sourceId, 'cam12');
    assert.strictEqual(capturedEvent.payload.vehiclePlate, 'GJ01AB1234');
    assert.ok(capturedEvent.payload.evidenceSha256);
    centralEventBus.unsubscribe(subId);
    console.log('✅ Test 5 Passed: Subscribes to centralEventBus and receives traceable real events.');

    console.log('===============================================================');
    console.log('🎉 ALL CAM12 ROAD TEST & ROUTING VALIDATIONS PASSED!');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error in CAM12 test suite:', err);
    process.exit(1);
  }
}

runCam12TestSuite();
