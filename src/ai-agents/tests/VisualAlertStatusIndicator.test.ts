/**
 * Visual Alert Status Indicator & Image Provenance Classification Test Suite
 * 
 * Verifies that:
 * 1. Images classified as 'CAMERA_FRAME' indicate live operational CCTV.
 * 2. Images classified as 'EVIDENCE_FRAME' indicate tamper-evident vault records.
 * 3. Incomplete / unsealed images classify as 'UNVERIFIED'.
 * 4. 'DEMO_ASSET' or 'TEST_FIXTURE' sources strictly trigger non-operational labeling.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forensicAlertGuardService } from '../../services/alert/ForensicAlertGuardService';

test('Visual Alert Status Indicator Classification Suite', async (t) => {
  const validSha256 = '8f4c2e34b12589d87c04994821e3b7c2d19f8841b9c7823e408a6b10f54668bb';
  const validTimestamp = Date.now();

  await t.test('1. Valid live camera capture resolves to CAMERA_FRAME / OBSERVED', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: validTimestamp,
      frameSha256: validSha256,
      evidenceId: 'EVD-CAM01-001',
      detector: 'YOLOv8-Edge',
      detectionType: 'RED_LIGHT_VIOLATION',
      confidence: 0.94
    });

    assert.equal(alert.provenance, 'CAMERA_FRAME');
    assert.equal(alert.truthStatus, 'OBSERVED');
    assert.equal(alert.isOperational, true);
  });

  await t.test('2. Missing digest/hash resolves to UNVERIFIED (non-operational)', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: validTimestamp,
      frameSha256: '', // Missing
      evidenceId: 'EVD-CAM01-002',
      detector: 'YOLOv8-Edge',
      detectionType: 'SPEED_VIOLATION',
      confidence: 0.90
    });

    assert.equal(alert.provenance, 'UNVERIFIED');
    assert.equal(alert.truthStatus, 'UNVERIFIED');
    assert.equal(alert.isOperational, false);
    assert.match(alert.uiLabel, /TEST \/ UNVERIFIED/);
  });

  await t.test('3. DEMO_ASSET source type strictly triggers non-operational label', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM-DEMO',
      isDemoAsset: true,
      frameTimestamp: validTimestamp,
      frameSha256: validSha256,
      evidenceId: 'EVD-DEMO-001',
      detector: 'YOLOv8-Edge',
      confidence: 0.95
    });

    assert.equal(alert.provenance, 'DEMO_ASSET');
    assert.equal(alert.truthStatus, 'DEMO');
    assert.equal(alert.isOperational, false);
    assert.match(alert.uiLabel, /DEMO ASSET - NOT LIVE OPERATIONAL CCTV/);
  });

  await t.test('4. TEST_FIXTURE source type strictly triggers non-operational label', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM-TEST',
      isTestFixture: true,
      frameTimestamp: validTimestamp,
      frameSha256: validSha256,
      evidenceId: 'EVD-TEST-001',
      detector: 'YOLOv8-Edge',
      confidence: 0.95
    });

    assert.equal(alert.provenance, 'TEST_FIXTURE');
    assert.equal(alert.truthStatus, 'TEST');
    assert.equal(alert.isOperational, false);
    assert.match(alert.uiLabel, /TEST \/ UNVERIFIED - NO OPERATIONAL EVIDENCE/);
  });

  await t.test('5. Unsplash or external demo URL triggers DEMO_ASSET classification', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM-012',
      frameDataUri: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
      frameTimestamp: validTimestamp,
      frameSha256: validSha256,
      evidenceId: 'EVD-012',
      detector: 'YOLOv8-Edge',
      confidence: 0.95
    });

    assert.equal(alert.provenance, 'DEMO_ASSET');
    assert.equal(alert.truthStatus, 'DEMO');
    assert.equal(alert.isOperational, false);
  });
});
