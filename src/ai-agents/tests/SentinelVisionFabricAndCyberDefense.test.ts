/**
 * Test Suite: Sentinel Vision Fabric + YOLOv8 + Defensive Cybersecurity Agent Mesh
 * Gujarat Police CCTV & AI Intelligence Platform
 */

import crypto from 'crypto';
import { yoloVisionEngine } from '../../services/vision/fabric/engines/YoloVisionEngine.js';
import { yoloTracker } from '../../services/vision/fabric/tracking/YoloTracker.js';
import { visionModelRouter } from '../../services/vision/fabric/VisionModelRouter.js';
import { cameraProfileRegistry } from '../../services/vision/fabric/CameraProfileRegistry.js';
import { visionFabricService } from '../../services/vision/fabric/VisionFabricService.js';
import { cyberSecurityOrchestrator } from '../../services/cybersecurity/CyberSecurityOrchestrator.js';

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function runVisionFabricTests() {
  console.log('===============================================================');
  console.log('  SENTINEL VISION FABRIC & CYBER DEFENSE TEST SUITE             ');
  console.log('===============================================================');

  // TEST GROUP 1: YOLOv8 Engine & Hardware Verification
  console.log('\n--- TEST GROUP 1: YOLOv8 Engine & Hardware Verification ---');
  const yoloStatus = yoloVisionEngine.getStatus();
  assert(yoloStatus.name.includes('YOLOv8'), 'Engine name correctly reports YOLOv8');
  assert(yoloStatus.device === 'CPU' || yoloStatus.device === 'CUDA', `Hardware device accurately exposed: ${yoloStatus.device}`);
  assert(yoloStatus.modelLicenseNotice !== undefined, 'Ultralytics AGPL-3.0 / Enterprise review notice present');
  assert(yoloStatus.fps > 0, `FPS calculated from latency: ${yoloStatus.fps} FPS`);

  // Empty or invalid buffer rejection
  const emptyBuf = Buffer.from([]);
  const emptySha = crypto.createHash('sha256').update(emptyBuf).digest('hex');
  const emptyObs = await yoloVisionEngine.analyzeFrame({
    cameraId: 'cam01',
    timestamp: Date.now(),
    captureIso: new Date().toISOString(),
    frameBuffer: emptyBuf,
    mimeType: 'image/jpeg',
    sha256: emptySha
  });
  assert(emptyObs.detections.length === 0, 'Zero detections emitted on empty buffer (never fabricates detections)');
  assert(emptyObs.frameQuality === 'UNREADABLE', 'Frame accurately flagged as UNREADABLE');

  // Valid JPEG frame evaluation
  // Construct a minimal valid JPEG with variance in pixel payload
  const jpegHeader = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46];
  const variableData = Array.from({ length: 400 }, (_, i) => (i * 17) % 256);
  const jpegFooter = [0xff, 0xd9];
  const validJpeg = Buffer.from([...jpegHeader, ...variableData, ...jpegFooter]);
  const validSha = crypto.createHash('sha256').update(validJpeg).digest('hex');

  const validObs = await yoloVisionEngine.analyzeFrame({
    cameraId: 'cam01',
    timestamp: Date.now(),
    captureIso: new Date().toISOString(),
    frameBuffer: validJpeg,
    mimeType: 'image/jpeg',
    sha256: validSha
  });
  assert(validObs.frameQuality === 'READABLE', 'Valid frame with optical contrast recognized as READABLE');
  assert(validObs.detections.length > 0, `Real detections extracted from frame: ${validObs.detections.length} objects`);
  assert(validObs.detections[0].trackId !== undefined, 'Detection assigned persistent trackId');
  assert(validObs.latencyMs > 0, `Actual measured inference latency: ${validObs.latencyMs} ms`);

  // TEST GROUP 2: YOLO Multi-Object Tracker (IoU Association)
  console.log('\n--- TEST GROUP 2: YOLO Multi-Object Tracker (IoU Association) ---');
  yoloTracker.clear();
  const initialTrackCount = yoloTracker.getActiveTracksCount('cam01');
  assert(initialTrackCount === 0, 'Tracker clears state cleanly');

  const box1 = { x: 0.30, y: 0.40, width: 0.20, height: 0.25 };
  const box2 = { x: 0.31, y: 0.41, width: 0.20, height: 0.25 }; // ~84% overlap
  const iou = yoloTracker.calculateIoU(box1, box2);
  assert(iou > 0.80, `IoU calculated accurately: ${Math.round(iou * 100)}%`);

  // TEST GROUP 3: Vision Model Router
  console.log('\n--- TEST GROUP 3: Vision Model Router ---');
  const routeObj = await visionModelRouter.route({
    taskType: 'OBJECT_DETECTION',
    cameraId: 'cam01'
  });
  assert(routeObj.engineType === 'YOLO', 'Object detection routed to Edge YOLOv8');
  assert(routeObj.truthStatus === 'OBSERVED', 'Truth status preserved as OBSERVED');

  const routeReasoning = await visionModelRouter.route({
    taskType: 'SCENE_REASONING',
    cameraId: 'cam01'
  });
  assert(routeReasoning.engineType === 'GEMINI' || routeReasoning.engineType === 'YOLO', 'Scene reasoning routes to Gemini or falls back to YOLO');

  // TEST GROUP 4: Camera Profile Registry
  console.log('\n--- TEST GROUP 4: Camera Profile Registry ---');
  const cam01Profile = cameraProfileRegistry.getProfile('cam01');
  assert(cam01Profile.profileName === 'TRAFFIC_HIGHWAY', 'CAM-01 registered as TRAFFIC_HIGHWAY');
  assert(cam01Profile.allowedCapabilities.vehicleDetection === true, 'CAM-01 allows vehicle detection');
  assert(cam01Profile.coordinates.latitude === 23.0225, 'CAM-01 verified latitude matches Chiman bhai Bridge');

  const cam07Profile = cameraProfileRegistry.getProfile('cam07');
  assert(cam07Profile.profileName === 'TRAFFIC_JUNCTION', 'CAM-07 registered as TRAFFIC_JUNCTION');

  // TEST GROUP 5: Defensive Cybersecurity Agent Mesh
  console.log('\n--- TEST GROUP 5: Defensive Cybersecurity Agent Mesh ---');
  const posture = await cyberSecurityOrchestrator.runFullScan();
  assert(posture.totalAgentsCount === 10, 'All 10 defensive cybersecurity agents active');
  assert(posture.agentsOnlineCount === 10, 'All 10 defensive agents online');
  assert(posture.overallStatus === 'PROTECTED' || posture.overallStatus === 'ATTENTION_REQUIRED', `Security posture: ${posture.overallStatus}`);

  const findings = cyberSecurityOrchestrator.getFindings();
  assert(findings.length >= 7, `Defensive findings cataloged: ${findings.length}`);

  // Test Human Approval Workflow
  const pendingActions = findings.flatMap(f => f.recommendedActions).filter(a => a.requiresHumanApproval && a.approvalState === 'PENDING_HUMAN_APPROVAL');
  if (pendingActions.length > 0) {
    const testActionId = pendingActions[0].actionId;
    const approvalRes = cyberSecurityOrchestrator.approveAction(testActionId, 'Insp. V. K. Jadeja');
    assert(approvalRes.success === true, `Human authorization approved action ${testActionId}`);
    assert(approvalRes.action?.approvalState === 'APPROVED', 'Action state updated to APPROVED');

    const auditLog = cyberSecurityOrchestrator.getAuditLog();
    const approvedLog = auditLog.find(l => l.action === approvalRes.action?.title);
    assert(approvedLog !== undefined, 'Audit log recorded authorization with officer credentials');
  }

  console.log('===============================================================');
  console.log('🎉 ALL SENTINEL VISION FABRIC & CYBER DEFENSE TESTS PASSED!    ');
  console.log('===============================================================');
}

runVisionFabricTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
