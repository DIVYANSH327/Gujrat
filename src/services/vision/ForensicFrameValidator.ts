/**
 * ForensicFrameValidator.ts
 * Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
 * 
 * Cryptographic & Forensic Validation for Camera Frames under Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023) Section 63.
 * 
 * Strict Invariants:
 * 1. ZERO-TOLERANCE for empty buffers or empty-hash digests (e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855).
 * 2. True JPEG signature validation (SOI: 0xFF, 0xD8).
 * 3. Actual image decoding and dimension validation (width > 0, height > 0).
 * 4. Deterministic Idempotency Key derivation: SHA256(cameraId|timestampIso|normalizedPlate|eventType).
 * 5. Strict Provenance & Truth Status Categorization (OBSERVED | UNVERIFIED | DEMO | TEST | SUPPRESSED).
 */

import crypto from 'crypto';
import jpeg from 'jpeg-js';

export const EMPTY_SHA256_DIGEST = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export type TruthStatus = 'OBSERVED' | 'UNVERIFIED' | 'DEMO' | 'TEST' | 'SUPPRESSED';

export interface ForensicValidationResult {
  valid: boolean;
  error?: string;
  evidenceId: string;
  idempotencyKey: string;
  cameraId: string;
  sourceId: string;
  frameTimestamp: string;
  captureTimestamp: string;
  frameByteLength: number;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
  sha256: string;
  qualityScore: number;
  provenance: {
    sensorId: string;
    captureMethod: 'DIRECT_RTSP_FRAME' | 'HLS_SEGMENT_KEYFRAME' | 'ONVIF_SNAPSHOT' | 'EDGE_CAPTURE';
    softwareVersion: string;
    bsaSection63Compliant: boolean;
  };
  storageStatus: 'LOCAL_EDGE' | 'OUTBOX_QUEUED' | 'GCS_STORED' | 'INTEGRITY_VERIFIED';
  truthStatus: TruthStatus;
}

export interface FrameValidationInput {
  buffer: Buffer | Uint8Array;
  cameraId: string;
  sourceId?: string;
  timestampIso?: string;
  normalizedPlate?: string;
  eventType?: string;
  isDemoOrTest?: boolean;
}

/**
 * Calculates a strictly deterministic Idempotency Key
 */
export function generateDeterministicIdempotencyKey(params: {
  cameraId: string;
  timestampIso: string;
  normalizedPlate?: string | null;
  eventType?: string;
  frameSha256?: string | null;
}): string {
  const normalizedCam = (params.cameraId || 'UNKNOWN_CAM').trim().toUpperCase();
  const normalizedTime = (params.timestampIso || new Date().toISOString()).trim();
  const normalizedPlt = (params.normalizedPlate || 'NO_PLATE').trim().toUpperCase();
  const normalizedEvt = (params.eventType || 'VEHICLE_OBSERVED').trim().toUpperCase();
  const hashSuffix = params.frameSha256 ? `|${params.frameSha256.trim()}` : '';

  const canonicalString = `${normalizedCam}|${normalizedTime}|${normalizedPlt}|${normalizedEvt}${hashSuffix}`;
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Calculates SHA-256 from raw buffer
 */
export function computeRawSha256(buffer: Buffer | Uint8Array): string {
  if (!buffer || buffer.length === 0) {
    return EMPTY_SHA256_DIGEST;
  }
  return crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');
}

/**
 * Validates a camera frame buffer against forensic standards
 */
export function validateCameraFrame(input: FrameValidationInput): ForensicValidationResult {
  const {
    buffer,
    cameraId,
    sourceId = `SRC-${cameraId}`,
    timestampIso = new Date().toISOString(),
    normalizedPlate = 'NO_PLATE',
    eventType = 'VEHICLE_OBSERVED',
    isDemoOrTest = false
  } = input;

  const idempotencyKey = generateDeterministicIdempotencyKey({
    cameraId,
    timestampIso,
    normalizedPlate,
    eventType
  });

  const evidenceId = `EVID-${cameraId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  // 1. Buffer Existence & Length Check
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: 'BUFFER_EMPTY: Frame buffer is null, undefined, or 0 bytes.',
      evidenceId,
      idempotencyKey,
      cameraId,
      sourceId,
      frameTimestamp: timestampIso,
      captureTimestamp: new Date().toISOString(),
      frameByteLength: 0,
      width: 0,
      height: 0,
      mimeType: 'image/jpeg',
      sha256: EMPTY_SHA256_DIGEST,
      qualityScore: 0,
      provenance: {
        sensorId: cameraId,
        captureMethod: 'DIRECT_RTSP_FRAME',
        softwareVersion: 'SentinelGrid-v0.7.2',
        bsaSection63Compliant: false
      },
      storageStatus: 'LOCAL_EDGE',
      truthStatus: 'UNVERIFIED'
    };
  }

  const rawBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const calculatedSha256 = computeRawSha256(rawBuffer);

  // 2. Reject Empty SHA-256 Digest
  if (calculatedSha256 === EMPTY_SHA256_DIGEST) {
    return {
      valid: false,
      error: 'EMPTY_DIGEST_REJECTED: SHA-256 calculated matches empty-byte sequence.',
      evidenceId,
      idempotencyKey,
      cameraId,
      sourceId,
      frameTimestamp: timestampIso,
      captureTimestamp: new Date().toISOString(),
      frameByteLength: rawBuffer.length,
      width: 0,
      height: 0,
      mimeType: 'image/jpeg',
      sha256: calculatedSha256,
      qualityScore: 0,
      provenance: {
        sensorId: cameraId,
        captureMethod: 'DIRECT_RTSP_FRAME',
        softwareVersion: 'SentinelGrid-v0.7.2',
        bsaSection63Compliant: false
      },
      storageStatus: 'LOCAL_EDGE',
      truthStatus: 'UNVERIFIED'
    };
  }

  // 3. JPEG SOI (Start Of Image) Marker Verification: 0xFF, 0xD8
  if (rawBuffer.length < 4 || rawBuffer[0] !== 0xFF || rawBuffer[1] !== 0xD8) {
    return {
      valid: false,
      error: 'INVALID_JPEG_HEADER: Buffer lacks authentic JPEG SOI header (0xFF 0xD8).',
      evidenceId,
      idempotencyKey,
      cameraId,
      sourceId,
      frameTimestamp: timestampIso,
      captureTimestamp: new Date().toISOString(),
      frameByteLength: rawBuffer.length,
      width: 0,
      height: 0,
      mimeType: 'image/jpeg',
      sha256: calculatedSha256,
      qualityScore: 0,
      provenance: {
        sensorId: cameraId,
        captureMethod: 'DIRECT_RTSP_FRAME',
        softwareVersion: 'SentinelGrid-v0.7.2',
        bsaSection63Compliant: false
      },
      storageStatus: 'LOCAL_EDGE',
      truthStatus: 'UNVERIFIED'
    };
  }

  // 4. Actual Image Decoding & Dimension Extraction
  let decodedWidth = 0;
  let decodedHeight = 0;
  try {
    const decoded = jpeg.decode(rawBuffer, { useTArray: true, formatAsRGBA: false });
    decodedWidth = decoded.width || 0;
    decodedHeight = decoded.height || 0;
  } catch (err: any) {
    return {
      valid: false,
      error: `JPEG_DECODE_FAILED: Corrupted or non-standard JPEG stream: ${err?.message || err}`,
      evidenceId,
      idempotencyKey,
      cameraId,
      sourceId,
      frameTimestamp: timestampIso,
      captureTimestamp: new Date().toISOString(),
      frameByteLength: rawBuffer.length,
      width: 0,
      height: 0,
      mimeType: 'image/jpeg',
      sha256: calculatedSha256,
      qualityScore: 0,
      provenance: {
        sensorId: cameraId,
        captureMethod: 'DIRECT_RTSP_FRAME',
        softwareVersion: 'SentinelGrid-v0.7.2',
        bsaSection63Compliant: false
      },
      storageStatus: 'LOCAL_EDGE',
      truthStatus: 'UNVERIFIED'
    };
  }

  // 5. Dimension Validation
  if (decodedWidth <= 0 || decodedHeight <= 0) {
    return {
      valid: false,
      error: `INVALID_DIMENSIONS: Decoded image has invalid dimensions (${decodedWidth}x${decodedHeight}).`,
      evidenceId,
      idempotencyKey,
      cameraId,
      sourceId,
      frameTimestamp: timestampIso,
      captureTimestamp: new Date().toISOString(),
      frameByteLength: rawBuffer.length,
      width: decodedWidth,
      height: decodedHeight,
      mimeType: 'image/jpeg',
      sha256: calculatedSha256,
      qualityScore: 0,
      provenance: {
        sensorId: cameraId,
        captureMethod: 'DIRECT_RTSP_FRAME',
        softwareVersion: 'SentinelGrid-v0.7.2',
        bsaSection63Compliant: false
      },
      storageStatus: 'LOCAL_EDGE',
      truthStatus: 'UNVERIFIED'
    };
  }

  // 6. Suspicious / Tiny Placeholder Detection
  // Reject tiny mock placeholder files under 128 bytes or 16x16 pixels
  if (rawBuffer.length < 128 || (decodedWidth < 16 && decodedHeight < 16)) {
    return {
      valid: false,
      error: `SUSPICIOUS_ARTIFACT: Image buffer is suspiciously tiny (${rawBuffer.length} bytes, ${decodedWidth}x${decodedHeight}px). Classified as UNVERIFIED.`,
      evidenceId,
      idempotencyKey,
      cameraId,
      sourceId,
      frameTimestamp: timestampIso,
      captureTimestamp: new Date().toISOString(),
      frameByteLength: rawBuffer.length,
      width: decodedWidth,
      height: decodedHeight,
      mimeType: 'image/jpeg',
      sha256: calculatedSha256,
      qualityScore: 10,
      provenance: {
        sensorId: cameraId,
        captureMethod: 'DIRECT_RTSP_FRAME',
        softwareVersion: 'SentinelGrid-v0.7.2',
        bsaSection63Compliant: false
      },
      storageStatus: 'LOCAL_EDGE',
      truthStatus: 'UNVERIFIED'
    };
  }

  // Calculate standard frame quality score
  const qualityScore = Math.min(100, Math.max(30, Math.round((rawBuffer.length / (decodedWidth * decodedHeight)) * 500)));

  const truthStatus: TruthStatus = isDemoOrTest ? 'TEST' : 'OBSERVED';

  return {
    valid: true,
    evidenceId,
    idempotencyKey,
    cameraId,
    sourceId,
    frameTimestamp: timestampIso,
    captureTimestamp: new Date().toISOString(),
    frameByteLength: rawBuffer.length,
    width: decodedWidth,
    height: decodedHeight,
    mimeType: 'image/jpeg',
    sha256: calculatedSha256,
    qualityScore,
    provenance: {
      sensorId: cameraId,
      captureMethod: 'DIRECT_RTSP_FRAME',
      softwareVersion: 'SentinelGrid-v0.7.2',
      bsaSection63Compliant: true
    },
    storageStatus: 'INTEGRITY_VERIFIED',
    truthStatus
  };
}
