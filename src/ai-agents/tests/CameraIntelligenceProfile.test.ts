import assert from 'assert';
import { 
  CameraIntelligenceProfileService,
  cameraIntelligenceProfileService 
} from '../../services/CameraIntelligenceProfileService';

console.log('--- RUNNING CAMERA INTELLIGENCE PROFILE & ROUTING TEST SUITE ---');

async function runTests() {
  const service = cameraIntelligenceProfileService;
  service.resetToDefaults();

  // Test 1: ANPR Profile Retrieval and Capabilities
  console.log('Testing ANPR profile capabilities (CAM-007)...');
  const cam007 = service.getProfile('CAM-007');
  assert.strictEqual(cam007.cameraClass, 'ANPR', 'CAM-007 must be ANPR class');
  assert.strictEqual(cam007.supportsANPR, true, 'CAM-007 must support ANPR');
  assert.strictEqual(cam007.supportsHSRP, true, 'CAM-007 must support HSRP');
  assert.strictEqual(cam007.preferredDetector, 'ANPR', 'CAM-007 preferred detector must be ANPR');
  assert.strictEqual(cam007.processingPriority, 'P1', 'CAM-007 processing priority must be P1');
  console.log('✅ Test 1 Passed: ANPR specialized profile verified.');

  // Test 2: AI_SMART Profile Retrieval and Capabilities
  console.log('Testing AI_SMART profile capabilities (CAM-023)...');
  const cam023 = service.getProfile('CAM-023');
  assert.strictEqual(cam023.cameraClass, 'AI_SMART', 'CAM-023 must be AI_SMART class');
  assert.strictEqual(cam023.supportsANPR, false, 'CAM-023 does not support ANPR');
  assert.strictEqual(cam023.supportsAdvancedVision, true, 'CAM-023 supports Advanced Vision');
  assert.strictEqual(cam023.preferredDetector, 'YOLO', 'CAM-023 preferred detector is YOLO');
  assert.strictEqual(cam023.processingPriority, 'P2', 'CAM-023 processing priority is P2');
  console.log('✅ Test 2 Passed: AI_SMART profile verified.');

  // Test 3: NORMAL CCTV Profile Retrieval and Capabilities
  console.log('Testing NORMAL CCTV profile capabilities (CAM-042)...');
  const cam042 = service.getProfile('CAM-042');
  assert.strictEqual(cam042.cameraClass, 'NORMAL', 'CAM-042 must be NORMAL class');
  assert.strictEqual(cam042.supportsANPR, false, 'CAM-042 must not support ANPR');
  assert.strictEqual(cam042.supportsAdvancedVision, false, 'CAM-042 must not support Advanced Vision');
  assert.strictEqual(cam042.preferredDetector, 'YOLO', 'CAM-042 preferred detector is YOLO');
  assert.strictEqual(cam042.processingPriority, 'P3', 'CAM-042 processing priority is P3');
  console.log('✅ Test 3 Passed: NORMAL CCTV profile verified.');

  // Test 4: OFFLINE Profile Enforcement
  console.log('Testing OFFLINE profile policy (CAM-048)...');
  const cam048 = service.getProfile('CAM-048');
  assert.strictEqual(cam048.status, 'OFFLINE', 'CAM-048 must be OFFLINE');
  assert.strictEqual(cam048.aiEnabled, false, 'CAM-048 AI must be disabled');
  assert.strictEqual(cam048.preferredDetector, 'NONE', 'CAM-048 preferred detector must be NONE');
  assert.strictEqual(cam048.processingPriority, 'P4', 'CAM-048 priority must be P4');
  console.log('✅ Test 4 Passed: OFFLINE safety policy verified.');

  // Test 5: Camera-Aware AI Routing - Offline camera rejection
  console.log('Testing routing decision for OFFLINE camera...');
  const offlineDecision = service.evaluateRoutingDecision('CAM-048', 'ANPR');
  assert.strictEqual(offlineDecision.eligible, false, 'Offline camera must not be eligible for AI');
  assert.strictEqual(offlineDecision.reason, 'CAMERA_OFFLINE', 'Reason must be CAMERA_OFFLINE');
  assert.strictEqual(offlineDecision.suggestedAction, 'SKIP_PROCESSING');
  console.log('✅ Test 5 Passed: Offline camera rejected from AI queue.');

  // Test 6: Camera-Aware AI Routing - Image Quality Gate
  console.log('Testing image quality gate...');
  service.updateFrameTelemetry('CAM-007', { frameQuality: 'INSUFFICIENT' });
  const qualityGateDecision = service.evaluateRoutingDecision('CAM-007', 'ANPR');
  assert.strictEqual(qualityGateDecision.eligible, false, 'Insufficient quality must reject processing');
  assert.strictEqual(qualityGateDecision.reason, 'IMAGE_QUALITY_INSUFFICIENT');
  // Restore frame quality
  service.updateFrameTelemetry('CAM-007', { frameQuality: 'HIGH' });
  console.log('✅ Test 6 Passed: Image quality gate prevents processing degraded frames.');

  // Test 7: Camera-Aware AI Routing - Task vs Capability Matching
  console.log('Testing capability matching and fallbacks...');
  // ANPR camera with ANPR task
  const anprDecision = service.evaluateRoutingDecision('CAM-007', 'ANPR');
  assert.strictEqual(anprDecision.eligible, true);
  assert.strictEqual(anprDecision.suggestedAction, 'RUN_ANPR_PIPELINE');

  // NORMAL camera requesting ANPR -> Fallback to YOLO
  const normalAnprDecision = service.evaluateRoutingDecision('CAM-042', 'ANPR');
  assert.strictEqual(normalAnprDecision.eligible, true);
  assert.strictEqual(normalAnprDecision.suggestedAction, 'RUN_YOLO_PIPELINE');
  assert.strictEqual(normalAnprDecision.reason, 'ANPR_UNSUPPORTED_FALLBACK_YOLO');
  console.log('✅ Test 7 Passed: Capability matching and fallback logic verified.');

  // Test 8: Dynamic Profile Updates and Subscriptions
  console.log('Testing live profile updates and listeners...');
  let listenerCalled = false;
  const unsubscribe = service.subscribe((profiles) => {
    listenerCalled = true;
    assert(profiles.length > 0);
  });

  service.setAiEnabled('CAM-014', false);
  assert.strictEqual(listenerCalled, true, 'Listener must be triggered on profile update');
  const disabledDecision = service.evaluateRoutingDecision('CAM-014');
  assert.strictEqual(disabledDecision.eligible, false);
  assert.strictEqual(disabledDecision.reason, 'AI_DISABLED_BY_OPERATOR');

  unsubscribe();
  console.log('✅ Test 8 Passed: Dynamic subscription and operator control verified.');

  console.log('=============================================================');
  console.log('🎉 ALL 8 CAMERA INTELLIGENCE PROFILE TESTS PASSED!');
  console.log('=============================================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
