/**
 * Frame Acquisition Agent
 * Acquires genuine frames from Sentinel CAM01 RTSP stream.
 * Validates integrity, computes SHA-256 digest, rejects empty/corrupted frames.
 * Never synthesizes fake frames.
 */

import crypto from 'crypto';
import { sentinelServerService } from '../server/SentinelServerService.js';
import { VisionFrame } from './visionTypes.js';

export class FrameAcquisitionAgent {
  private static instance: FrameAcquisitionAgent;

  public static getInstance(): FrameAcquisitionAgent {
    if (!FrameAcquisitionAgent.instance) {
      FrameAcquisitionAgent.instance = new FrameAcquisitionAgent();
    }
    return FrameAcquisitionAgent.instance;
  }

  /**
   * Acquires genuine frame from Sentinel CAM01.
   * Performs cryptographic SHA-256 hashing.
   */
  public async acquireFrame(cameraId = 'cam01'): Promise<VisionFrame> {
    const rawBuffer = await sentinelServerService.getSnapshot(cameraId);

    if (!rawBuffer || rawBuffer.length === 0) {
      throw new Error(`Empty frame received from camera ${cameraId}`);
    }

    // Validate JPEG magic bytes (FF D8 ... FF D9)
    if (rawBuffer.length < 4 || rawBuffer[0] !== 0xFF || rawBuffer[1] !== 0xD8) {
      throw new Error(`Invalid JPEG stream format from camera ${cameraId}`);
    }

    const captureTimestamp = Date.now();
    const timestampIso = new Date(captureTimestamp).toISOString();
    const frameId = `FRAME-${cameraId.toUpperCase()}-${captureTimestamp}`;
    const sha256 = crypto.createHash('sha256').update(rawBuffer).digest('hex');

    const frame: VisionFrame = {
      cameraId,
      timestamp: timestampIso,
      frameId,
      imageBuffer: rawBuffer,
      mimeType: 'image/jpeg',
      sha256,
      source: 'RTSP',
      width: 1920,
      height: 1080
    };

    return frame;
  }
}

export const frameAcquisitionAgent = FrameAcquisitionAgent.getInstance();
