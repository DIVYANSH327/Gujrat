/**
 * Forensic Alert Truthfulness Audit Test Suite
 * Validates strict BSA 2023 Section 63 frame-binding rules for real operational alerts.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forensicAlertGuardService } from '../../services/alert/ForensicAlertGuardService';

test('Sentinel Grid Forensic Alert Truthfulness Audit', async (t) => {
  const validFrameSha256 = '7f9a2e34b12589d87c04994821e3b7c2d19f8841b9c7823e408a6b10f54668aa';
  const validTimestamp = Date.now();

  await t.test('1. real frame + valid detector result → alert allowed as OBSERVED', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: validTimestamp,
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-CAM01-20260923-001',
      detector: 'YOLOv8-Edge',
      detectionType: 'WATCHLIST_HIT',
      confidence: 0.96,
      targetId: 'GJ01AB1234'
    });

    assert.equal(alert.isOperational, true);
    assert.equal(alert.truthStatus, 'OBSERVED');
    assert.equal(alert.provenance, 'CAMERA_FRAME');
    assert.match(alert.uiLabel, /ACTIVE ALERT/);
  });

  await t.test('2. no frame / missing frame timestamp → alert rejected / unverified', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: 0, // missing
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-001',
      detector: 'YOLOv8-Edge',
      detectionType: 'WATCHLIST_HIT',
      confidence: 0.96
    });

    assert.equal(alert.isOperational, false);
    assert.equal(alert.truthStatus, 'UNVERIFIED');
    assert.match(alert.uiLabel, /TEST \/ UNVERIFIED/);
  });

  await t.test('3. demo image / unsplash url → operational alert rejected as DEMO', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM-023',
      frameTimestamp: validTimestamp,
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-001',
      frameDataUri: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      detector: 'YOLOv8-Edge',
      detectionType: 'NO_HELMET',
      confidence: 0.93
    });

    assert.equal(alert.isOperational, false);
    assert.equal(alert.truthStatus, 'DEMO');
    assert.equal(alert.provenance, 'DEMO_ASSET');
    assert.match(alert.uiLabel, /DEMO ASSET/);
  });

  await t.test('4. test fixture → operational alert rejected as TEST', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM-001',
      isTestFixture: true,
      frameTimestamp: validTimestamp,
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-001',
      detector: 'YOLOv8-Edge',
      detectionType: 'NO_HELMET',
      confidence: 0.94
    });

    assert.equal(alert.isOperational, false);
    assert.equal(alert.truthStatus, 'TEST');
    assert.equal(alert.provenance, 'TEST_FIXTURE');
    assert.match(alert.uiLabel, /TEST \/ UNVERIFIED/);
  });

  await t.test('5. missing frameSha256 → alert rejected', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: validTimestamp,
      frameSha256: '', // missing hash
      evidenceId: 'EVD-001',
      detector: 'YOLOv8-Edge',
      detectionType: 'WATCHLIST_HIT',
      confidence: 0.95
    });

    assert.equal(alert.isOperational, false);
    assert.equal(alert.truthStatus, 'UNVERIFIED');
  });

  await t.test('6. missing evidenceId → alert rejected', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: validTimestamp,
      frameSha256: validFrameSha256,
      evidenceId: '', // missing
      detector: 'YOLOv8-Edge',
      detectionType: 'WATCHLIST_HIT',
      confidence: 0.95
    });

    assert.equal(alert.isOperational, false);
    assert.equal(alert.truthStatus, 'UNVERIFIED');
  });

  await t.test('7. motorcycle alone without helmet evidence → NO HELMET alert rejected', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: validTimestamp,
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-001',
      detector: 'YOLOv8-Edge',
      detectionType: 'NO_HELMET',
      confidence: 0.92,
      targetId: 'MOTORCYCLE-01'
      // hasHelmet not specified
    });

    assert.equal(alert.isOperational, false);
    assert.equal(alert.truthStatus, 'UNVERIFIED');
    assert.match(alert.uiLabel, /UNVERIFIED - INDETERMINATE HELMET/);
  });

  await t.test('8. unknown helmet state / occluded head → no enforcement alert', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: validTimestamp,
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-001',
      detector: 'YOLOv8-Edge',
      detectionType: 'NO_HELMET',
      confidence: 0.92,
      hasHelmet: 'UNKNOWN',
      headVisible: false
    });

    assert.equal(alert.isOperational, false);
    assert.equal(alert.truthStatus, 'UNVERIFIED');
  });

  await t.test('9. real alert retains cameraId', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: validTimestamp,
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-CAM01-09',
      detector: 'YOLOv8-Edge',
      detectionType: 'ANPR_WATCHLIST_MATCH',
      confidence: 0.98
    });

    assert.equal(alert.cameraId, 'CAM01');
  });

  await t.test('10. real alert retains frameTimestamp', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: 1790176397938,
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-CAM01-10',
      detector: 'YOLOv8-Edge',
      detectionType: 'SPEED_VIOLATION',
      confidence: 0.97
    });

    assert.equal(alert.frameTimestamp, 1790176397938);
    assert.equal(alert.frameTimestampIso, new Date(1790176397938).toISOString());
  });

  await t.test('11. real alert retains evidence provenance and observation ID', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      observationId: 'OBS-CAM01-TRACK4',
      frameTimestamp: validTimestamp,
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-CAM01-11',
      detector: 'YOLOv8-Edge',
      detectionType: 'WATCHLIST_HIT',
      confidence: 0.95
    });

    assert.equal(alert.observationId, 'OBS-CAM01-TRACK4');
    assert.equal(alert.evidenceId, 'EVD-CAM01-11');
    assert.equal(alert.provenance, 'CAMERA_FRAME');
  });

  await t.test('12. alert image provenance is CAMERA_FRAME for operational alerts', () => {
    const alert = forensicAlertGuardService.validateAndBindAlert({
      cameraId: 'CAM01',
      frameTimestamp: validTimestamp,
      frameSha256: validFrameSha256,
      evidenceId: 'EVD-CAM01-12',
      detector: 'YOLOv8-Edge',
      detectionType: 'WATCHLIST_HIT',
      confidence: 0.95
    });

    assert.equal(alert.provenance, 'CAMERA_FRAME');
    assert.equal(alert.isOperational, true);
  });
});
