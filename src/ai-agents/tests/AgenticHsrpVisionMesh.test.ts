/**
 * Test Suite: Corp8 Sentinel Agentic HSRP Vision Mesh
 * Gujarat Police CCTV & AI Intelligence Platform
 */

import crypto from 'crypto';
import { vehicleTrackingAgent } from '../../services/vision/vehicleTrackingAgent.js';
import { evidenceQualityAgent } from '../../services/vision/evidenceQualityAgent.js';
import { plateOcrAgent } from '../../services/vision/plateOcrAgent.js';
import { vehiclePlateConsistencyAgent } from '../../services/vision/aiMesh/vehiclePlateConsistencyAgent.js';
import { finalVerificationAgent } from '../../services/vision/aiMesh/finalVerificationAgent.js';
import { hsrpVisionMeshService } from '../../services/vision/hsrpVisionMeshService.js';
import {
  BoundingBox,
  PlateCandidate,
  VehicleDetection,
  VisionFrame
} from '../../services/vision/visionTypes.js';

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function runTests() {
  console.log('===============================================================');
  console.log('  CORP8 SENTINEL AGENTIC HSRP VISION MESH TEST SUITE           ');
  console.log('===============================================================');

  // TEST GROUP 1: Vehicle Tracking & Temporal Association
  console.log('\n--- TEST GROUP 1: Vehicle Tracking & Temporal Association ---');
  const boxA: BoundingBox = { x: 0.2, y: 0.3, width: 0.2, height: 0.3 };
  const boxB: BoundingBox = { x: 0.2, y: 0.3, width: 0.2, height: 0.3 };
  const iouIdentical = vehicleTrackingAgent.calculateIoU(boxA, boxB);
  assert(Math.abs(iouIdentical - 1.0) < 0.001, 'IoU for identical boxes is 1.0');

  const boxDisjoint: BoundingBox = { x: 0.7, y: 0.7, width: 0.1, height: 0.1 };
  const iouDisjoint = vehicleTrackingAgent.calculateIoU(boxA, boxDisjoint);
  assert(iouDisjoint === 0, 'IoU for disjoint boxes is 0.0');

  const centroidDist = vehicleTrackingAgent.calculateCentroidDistance(boxA, boxB);
  assert(centroidDist === 0, 'Centroid distance for identical boxes is 0');

  // Track Creation
  const dummyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
  const dummySha = crypto.createHash('sha256').update(dummyJpeg).digest('hex');
  const frame1: VisionFrame = {
    cameraId: 'cam01',
    timestamp: new Date().toISOString(),
    frameId: 'FRAME-CAM01-TEST-001',
    imageBuffer: dummyJpeg,
    mimeType: 'image/jpeg',
    sha256: dummySha,
    source: 'RTSP',
    width: 1920,
    height: 1080
  };

  const detections1: VehicleDetection[] = [
    {
      id: 'DET-1',
      class: 'car',
      box: { x: 0.3, y: 0.4, width: 0.2, height: 0.25 },
      confidence: 0.92,
      frameId: frame1.frameId
    }
  ];

  const updatedTracks1 = vehicleTrackingAgent.updateTracks(frame1, detections1);
  assert(updatedTracks1.length === 1, 'Track successfully created for detected vehicle');
  const trackId = updatedTracks1[0].vehicleTrackId;
  assert(trackId.startsWith('cam01-v-'), `Track ID follows canonical format (cam01-v-XXXXXX): ${trackId}`);
  assert(updatedTracks1[0].frameCount === 1, 'Initial frameCount is 1');

  // Consecutive Frame Association
  const frame2: VisionFrame = {
    cameraId: 'cam01',
    timestamp: new Date(Date.now() + 1000).toISOString(),
    frameId: 'FRAME-CAM01-TEST-002',
    imageBuffer: dummyJpeg,
    mimeType: 'image/jpeg',
    sha256: dummySha,
    source: 'RTSP',
    width: 1920,
    height: 1080
  };

  const detections2: VehicleDetection[] = [
    {
      id: 'DET-2',
      class: 'car',
      box: { x: 0.32, y: 0.41, width: 0.2, height: 0.25 }, // slight motion
      confidence: 0.94,
      frameId: frame2.frameId
    }
  ];

  const updatedTracks2 = vehicleTrackingAgent.updateTracks(frame2, detections2);
  assert(updatedTracks2.length === 1, 'Detection associated with existing track');
  assert(updatedTracks2[0].vehicleTrackId === trackId, 'Persistent track ID preserved across consecutive frames');
  assert(updatedTracks2[0].frameCount === 2, 'Track frame count incremented to 2');

  // TEST GROUP 2: Evidence Quality Assessment
  console.log('\n--- TEST GROUP 2: Evidence Quality Assessment ---');
  const highQualityCandidate: PlateCandidate = {
    candidateId: 'PLATE-HQ-001',
    vehicleTrackId: trackId,
    bbox: { x: 0.35, y: 0.58, width: 0.08, height: 0.04 },
    confidence: 0.91,
    cropBuffer: dummyJpeg,
    cropSha256: dummySha,
    frameId: frame2.frameId,
    frameTimestamp: Date.now(),
    widthPx: 140,
    heightPx: 45,
    isAdequateSize: true
  };

  const hqScore = evidenceQualityAgent.evaluateQuality(frame2, detections2[0], highQualityCandidate);
  assert(hqScore.totalScore >= 70, `High quality candidate receives high composite score: ${hqScore.totalScore}/100`);
  assert(hqScore.details.isAdequateForHSRP === true, 'High quality candidate is adequate for HSRP verification');

  const lowQualityCandidate: PlateCandidate = {
    candidateId: 'PLATE-LQ-001',
    vehicleTrackId: trackId,
    bbox: { x: 0.35, y: 0.58, width: 0.01, height: 0.005 },
    confidence: 0.40,
    cropBuffer: dummyJpeg,
    cropSha256: dummySha,
    frameId: frame2.frameId,
    frameTimestamp: Date.now(),
    widthPx: 20,
    heightPx: 10,
    isAdequateSize: false
  };

  const lqScore = evidenceQualityAgent.evaluateQuality(frame2, detections2[0], lowQualityCandidate);
  assert(lqScore.details.isAdequateForHSRP === false, 'Low resolution plate rejected as inadequate for HSRP');
  assert(lqScore.totalScore <= 50, `Low resolution plate score penalized: ${lqScore.totalScore}`);

  // TEST GROUP 3: Indian Plate OCR Normalization
  console.log('\n--- TEST GROUP 3: Indian Plate OCR Normalization ---');
  const ocr1 = plateOcrAgent.normalizeIndianPlate('GJ 01 AB 1234');
  assert(ocr1.normalized === 'GJ01AB1234', 'Standard plate normalized without spaces');
  assert(ocr1.stateCode === 'GJ', 'State code extracted correctly: GJ');
  assert(ocr1.rtoCode === '01', 'RTO code extracted correctly: 01 (Ahmedabad)');
  assert(ocr1.series === 'AB', 'Series extracted correctly: AB');
  assert(ocr1.digits === '1234', 'Digits extracted correctly: 1234');
  assert(ocr1.isValidFormat === true, 'Identified as valid format under Indian MVA');

  const ocr2 = plateOcrAgent.normalizeIndianPlate('gj-27-m-9999');
  assert(ocr2.normalized === 'GJ27M9999', 'Lower case with hyphens correctly normalized');
  assert(ocr2.stateCode === 'GJ', 'GJ state code verified');
  assert(ocr2.rtoCode === '27', 'RTO code 27 verified');

  const ocrInvalid = plateOcrAgent.normalizeIndianPlate('INVALID');
  assert(ocrInvalid.isValidFormat === false, 'Invalid format rejected');

  // TEST GROUP 4: Vehicle-Plate Consistency Agent
  console.log('\n--- TEST GROUP 4: Vehicle-Plate Consistency Agent ---');
  const consistencyValid = vehiclePlateConsistencyAgent.checkConsistency('car', {
    text: 'GJ01AB1234',
    normalizedText: 'GJ01AB1234',
    confidence: 0.95,
    readable: true,
    stateCode: 'GJ',
    rtoCode: '01',
    series: 'AB',
    digits: '1234'
  });
  assert(consistencyValid.data.isConsistent === true, 'Valid car plate is marked consistent');

  // TEST GROUP 5: Final Verification Agent Deterministic Decision Matrix
  console.log('\n--- TEST GROUP 5: Final Verification Decision Engine ---');
  // Scenario A: Verified Genuine HSRP
  const verifiedResult = finalVerificationAgent.evaluateDecision({
    vehicleTrackId: trackId,
    vehicleClass: 'car',
    cameraId: 'cam01',
    frameId: frame2.frameId,
    timestamp: frame2.timestamp,
    fullFrameUrl: `/api/central/snapshots/${frame2.frameId}`,
    fullFrameSha256: dummySha,
    plateCropUrl: `/api/central/snapshots/${highQualityCandidate.candidateId}`,
    plateCropSha256: dummySha,
    agents: {
      plate: {
        agentName: 'PlateDetectionAgent',
        status: 'SUCCESS',
        data: highQualityCandidate,
        confidence: 0.92,
        execution: { provider: 'optical', model: 'ffmpeg', latencyMs: 10, status: 'SUCCESS', retryCount: 0 }
      },
      ocr: {
        agentName: 'PlateOcrAgent',
        status: 'SUCCESS',
        data: {
          text: 'GJ01AB1234',
          normalizedText: 'GJ01AB1234',
          confidence: 0.94,
          readable: true,
          stateCode: 'GJ',
          rtoCode: '01',
          series: 'AB',
          digits: '1234'
        },
        confidence: 0.94,
        execution: { provider: 'gemini', model: 'gemini-3.8-flash', latencyMs: 350, status: 'SUCCESS', retryCount: 0 }
      },
      hsrp: {
        agentName: 'HsrpAnalysisAgent',
        status: 'SUCCESS',
        data: {
          visible: true,
          characteristics: [
            'Chromium Hot-Stamp Ashoka Chakra Hologram',
            '10-digit Laser Etched PIN Code',
            'Blue IND Country Identifier',
            'Snap-Lock Tamper Evident Rivets'
          ],
          inconsistencies: [],
          confidence: 0.91,
          result: 'CONSISTENT'
        },
        confidence: 0.91,
        execution: { provider: 'gemini', model: 'gemini-3.8-flash', latencyMs: 400, status: 'SUCCESS', retryCount: 0 }
      },
      quality: {
        agentName: 'EvidenceQualityAgent',
        status: 'SUCCESS',
        data: hqScore,
        confidence: 0.85,
        execution: { provider: 'rule_engine', model: 'quality', latencyMs: 2, status: 'SUCCESS', retryCount: 0 }
      },
      consistency: consistencyValid
    }
  });

  assert(verifiedResult.decision === 'HSRP_VERIFIED', 'Consistent HSRP features result in HSRP_VERIFIED');
  assert(verifiedResult.registrationNumber === 'GJ01AB1234', 'Verified registration plate retained');
  assert(verifiedResult.auditNotice.includes('Bharatiya Sakshya Adhiniyam, 2023'), 'Includes BSA 2023 legal admissibility clause');

  // Scenario B: Non-HSRP plate
  const nonHsrpResult = finalVerificationAgent.evaluateDecision({
    vehicleTrackId: trackId,
    vehicleClass: 'car',
    cameraId: 'cam01',
    frameId: frame2.frameId,
    timestamp: frame2.timestamp,
    fullFrameUrl: `/api/central/snapshots/${frame2.frameId}`,
    fullFrameSha256: dummySha,
    plateCropUrl: `/api/central/snapshots/${highQualityCandidate.candidateId}`,
    plateCropSha256: dummySha,
    agents: {
      plate: {
        agentName: 'PlateDetectionAgent',
        status: 'SUCCESS',
        data: highQualityCandidate,
        confidence: 0.88,
        execution: { provider: 'optical', model: 'ffmpeg', latencyMs: 10, status: 'SUCCESS', retryCount: 0 }
      },
      ocr: {
        agentName: 'PlateOcrAgent',
        status: 'SUCCESS',
        data: { text: 'GJ01AB1234', normalizedText: 'GJ01AB1234', confidence: 0.9, readable: true },
        confidence: 0.9,
        execution: { provider: 'gemini', model: 'gemini-3.8-flash', latencyMs: 300, status: 'SUCCESS', retryCount: 0 }
      },
      hsrp: {
        agentName: 'HsrpAnalysisAgent',
        status: 'SUCCESS',
        data: {
          visible: true,
          characteristics: [],
          inconsistencies: ['Decorative handwritten font', 'Missing IND legend', 'No security hologram'],
          confidence: 0.89,
          result: 'INCONSISTENT'
        },
        confidence: 0.89,
        execution: { provider: 'gemini', model: 'gemini-3.8-flash', latencyMs: 350, status: 'SUCCESS', retryCount: 0 }
      },
      quality: {
        agentName: 'EvidenceQualityAgent',
        status: 'SUCCESS',
        data: hqScore,
        confidence: 0.85,
        execution: { provider: 'rule_engine', model: 'quality', latencyMs: 2, status: 'SUCCESS', retryCount: 0 }
      },
      consistency: consistencyValid
    }
  });

  assert(nonHsrpResult.decision === 'HSRP_NOT_VERIFIED', 'Inconsistent plate results in HSRP_NOT_VERIFIED');

  // Scenario C: Low resolution / degraded frame
  const needsCaptureResult = finalVerificationAgent.evaluateDecision({
    vehicleTrackId: trackId,
    vehicleClass: 'car',
    cameraId: 'cam01',
    frameId: frame2.frameId,
    timestamp: frame2.timestamp,
    fullFrameUrl: `/api/central/snapshots/${frame2.frameId}`,
    fullFrameSha256: dummySha,
    plateCropUrl: `/api/central/snapshots/${lowQualityCandidate.candidateId}`,
    plateCropSha256: dummySha,
    agents: {
      plate: {
        agentName: 'PlateDetectionAgent',
        status: 'SUCCESS',
        data: lowQualityCandidate,
        confidence: 0.5,
        execution: { provider: 'optical', model: 'ffmpeg', latencyMs: 10, status: 'SUCCESS', retryCount: 0 }
      },
      ocr: {
        agentName: 'PlateOcrAgent',
        status: 'SUCCESS',
        data: { text: null, normalizedText: null, confidence: 0, readable: false },
        confidence: 0,
        execution: { provider: 'gemini', model: 'gemini-3.8-flash', latencyMs: 200, status: 'SUCCESS', retryCount: 0 }
      },
      hsrp: {
        agentName: 'HsrpAnalysisAgent',
        status: 'SUCCESS',
        data: { visible: false, characteristics: [], inconsistencies: [], confidence: 0, result: 'UNCERTAIN' },
        confidence: 0,
        execution: { provider: 'gemini', model: 'gemini-3.8-flash', latencyMs: 200, status: 'SUCCESS', retryCount: 0 }
      },
      quality: {
        agentName: 'EvidenceQualityAgent',
        status: 'SUCCESS',
        data: lqScore,
        confidence: 0.3,
        execution: { provider: 'rule_engine', model: 'quality', latencyMs: 2, status: 'SUCCESS', retryCount: 0 }
      },
      consistency: consistencyValid
    }
  });

  assert(needsCaptureResult.decision === 'NEEDS_BETTER_CAPTURE', 'Low resolution returns NEEDS_BETTER_CAPTURE');

  // TEST GROUP 6: Vision Mesh Telemetry & Bounded Queue
  console.log('\n--- TEST GROUP 6: Vision Mesh Telemetry ---');
  const telemetry = hsrpVisionMeshService.getTelemetry();
  assert(typeof telemetry.framesCaptured === 'number', 'Telemetry tracks framesCaptured');
  assert(typeof telemetry.vehiclesDetected === 'number', 'Telemetry tracks vehiclesDetected');
  assert(typeof telemetry.activeTracks === 'number', 'Telemetry tracks activeTracks');
  assert(typeof telemetry.HSRPChecks === 'number', 'Telemetry tracks HSRPChecks');
  assert(typeof telemetry.HSRPVerified === 'number', 'Telemetry tracks HSRPVerified');
  assert(typeof telemetry.HSRPNotVerified === 'number', 'Telemetry tracks HSRPNotVerified');
  assert(typeof telemetry.needsBetterCapture === 'number', 'Telemetry tracks needsBetterCapture');
  assert(typeof telemetry.pipelineState === 'string', 'Telemetry tracks pipelineState');

  console.log('\n===============================================================');
  console.log('  ALL AGENTIC HSRP VISION MESH TESTS PASSED SUCCESSFULLY!       ');
  console.log('===============================================================');
}

runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test failed with unhandled error:', err);
  process.exit(1);
});
