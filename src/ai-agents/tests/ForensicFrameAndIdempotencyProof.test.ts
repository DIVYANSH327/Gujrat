/**
 * ForensicFrameAndIdempotencyProof.test.ts
 * Rigorous Unit Tests for Forensic Evidence Verification, SHA-256 Non-Empty Validation,
 * Deterministic Idempotency Keys, and Cloud Mode State Truthfulness.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jpeg from 'jpeg-js';
import {
  validateCameraFrame,
  generateDeterministicIdempotencyKey,
  computeRawSha256,
  EMPTY_SHA256_DIGEST
} from '../../services/vision/ForensicFrameValidator.js';

describe('Forensic Frame & SHA-256 Validation Suite', () => {

  // Helper to generate a genuine decodable JPEG buffer in memory
  function createRealJpegBuffer(width = 64, height = 48): Buffer {
    const frameData = Buffer.alloc(width * height * 4);
    for (let i = 0; i < frameData.length; i += 4) {
      frameData[i] = 120;     // R
      frameData[i + 1] = 180; // G
      frameData[i + 2] = 240; // B
      frameData[i + 3] = 255; // A
    }
    const rawImageData = {
      data: frameData,
      width,
      height
    };
    const jpegImageData = jpeg.encode(rawImageData, 80);
    return Buffer.from(jpegImageData.data);
  }

  it('1. Rejects null, undefined, or empty 0-byte buffer', () => {
    const emptyResult = validateCameraFrame({
      buffer: Buffer.alloc(0),
      cameraId: 'CAM12'
    });

    assert.equal(emptyResult.valid, false);
    assert.equal(emptyResult.truthStatus, 'UNVERIFIED');
    assert.match(emptyResult.error || '', /BUFFER_EMPTY/);
    assert.equal(emptyResult.sha256, EMPTY_SHA256_DIGEST);
    assert.equal(emptyResult.provenance.bsaSection63Compliant, false);
  });

  it('2. Rejects empty SHA-256 digest', () => {
    const emptySha = computeRawSha256(Buffer.alloc(0));
    assert.equal(emptySha, EMPTY_SHA256_DIGEST);
  });

  it('3. Rejects corrupted buffer missing JPEG SOI marker (0xFF 0xD8)', () => {
    const corruptedBuffer = Buffer.from('NOT_A_REAL_JPEG_HEADER_1234567890');
    const result = validateCameraFrame({
      buffer: corruptedBuffer,
      cameraId: 'CAM12'
    });

    assert.equal(result.valid, false);
    assert.equal(result.truthStatus, 'UNVERIFIED');
    assert.match(result.error || '', /INVALID_JPEG_HEADER/);
  });

  it('4. Rejects suspiciously tiny placeholder files (< 128 bytes)', () => {
    // Fake mini header
    const miniBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const result = validateCameraFrame({
      buffer: miniBuffer,
      cameraId: 'CAM12'
    });

    assert.equal(result.valid, false);
    assert.equal(result.truthStatus, 'UNVERIFIED');
    assert.match(result.error || '', /JPEG_DECODE_FAILED|INVALID_JPEG_HEADER|SUSPICIOUS_ARTIFACT/);
  });

  it('5. Successfully validates a real camera JPEG with non-empty SHA-256 and non-zero dimensions', () => {
    const realBuffer = createRealJpegBuffer(640, 480);
    assert.ok(realBuffer.length > 500, 'Real JPEG buffer should be several hundred bytes');

    const result = validateCameraFrame({
      buffer: realBuffer,
      cameraId: 'CAM12',
      normalizedPlate: 'GJ01AB1234',
      eventType: 'VEHICLE_OBSERVED'
    });

    assert.equal(result.valid, true);
    assert.equal(result.truthStatus, 'OBSERVED');
    assert.equal(result.cameraId, 'CAM12');
    assert.equal(result.width, 640);
    assert.equal(result.height, 480);
    assert.equal(result.frameByteLength, realBuffer.length);
    assert.notEqual(result.sha256, EMPTY_SHA256_DIGEST);
    assert.equal(result.sha256.length, 64);
    assert.equal(result.provenance.bsaSection63Compliant, true);
  });

  it('6. Demonstrates deterministic Idempotency Key generation', () => {
    const key1 = generateDeterministicIdempotencyKey({
      cameraId: 'CAM12',
      timestampIso: '2026-09-23T12:00:00.000Z',
      normalizedPlate: 'GJ01AB1234',
      eventType: 'VEHICLE_OBSERVED'
    });

    const key2 = generateDeterministicIdempotencyKey({
      cameraId: 'CAM12',
      timestampIso: '2026-09-23T12:00:00.000Z',
      normalizedPlate: 'GJ01AB1234',
      eventType: 'VEHICLE_OBSERVED'
    });

    const keyDifferentTime = generateDeterministicIdempotencyKey({
      cameraId: 'CAM12',
      timestampIso: '2026-09-23T12:00:01.000Z',
      normalizedPlate: 'GJ01AB1234',
      eventType: 'VEHICLE_OBSERVED'
    });

    const keyDifferentPlate = generateDeterministicIdempotencyKey({
      cameraId: 'CAM12',
      timestampIso: '2026-09-23T12:00:00.000Z',
      normalizedPlate: 'GJ05CD5678',
      eventType: 'VEHICLE_OBSERVED'
    });

    // Same inputs produce identical key (idempotent)
    assert.equal(key1, key2);
    assert.equal(key1.length, 64);

    // Different inputs produce distinct keys
    assert.notEqual(key1, keyDifferentTime);
    assert.notEqual(key1, keyDifferentPlate);
  });

  it('7. Correctly labels test or synthetic inputs as TEST truth status', () => {
    const realBuffer = createRealJpegBuffer(128, 96);
    const result = validateCameraFrame({
      buffer: realBuffer,
      cameraId: 'CAM12',
      isDemoOrTest: true
    });

    assert.equal(result.valid, true);
    assert.equal(result.truthStatus, 'TEST');
  });
});
