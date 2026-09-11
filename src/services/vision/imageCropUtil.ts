/**
 * Resilient Server-Side Image Crop Utility for Camera Frames
 * Gujarat Police CCTV & AI Intelligence Platform
 */

import { spawn } from 'child_process';
import crypto from 'crypto';
import { BoundingBox } from './visionTypes.js';

export interface CropResult {
  buffer: Buffer;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  sha256: string;
}

export class ImageCropUtil {
  /**
   * Crops a region of interest from a genuine JPEG frame buffer using FFmpeg.
   * Coordinates are normalized [0.0 - 1.0].
   */
  public static async cropJpeg(
    imageBuffer: Buffer,
    box: BoundingBox,
    frameWidth = 1920,
    frameHeight = 1080
  ): Promise<CropResult> {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Cannot crop empty image buffer');
    }

    // Clamp and calculate pixel boundaries
    const clampedX = Math.max(0, Math.min(0.99, box.x));
    const clampedY = Math.max(0, Math.min(0.99, box.y));
    const clampedW = Math.max(0.01, Math.min(1.0 - clampedX, box.width));
    const clampedH = Math.max(0.01, Math.min(1.0 - clampedY, box.height));

    const xPx = Math.floor(clampedX * frameWidth);
    const yPx = Math.floor(clampedY * frameHeight);
    const wPx = Math.max(16, Math.floor(clampedW * frameWidth));
    const hPx = Math.max(16, Math.floor(clampedH * frameHeight));

    // Ensure within frame bounds
    const safeW = Math.min(wPx, frameWidth - xPx);
    const safeH = Math.min(hPx, frameHeight - yPx);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const proc = spawn('ffmpeg', [
        '-y',
        '-v', 'error',
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        '-i', 'pipe:0',
        '-vf', `crop=${safeW}:${safeH}:${xPx}:${yPx}`,
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        'pipe:1'
      ]);

      proc.stdout.on('data', (d: Buffer) => chunks.push(d));
      proc.on('error', (err) => reject(err));
      proc.on('close', (code) => {
        if (code === 0 && chunks.length > 0) {
          const croppedBuffer = Buffer.concat(chunks);
          const sha256 = crypto.createHash('sha256').update(croppedBuffer).digest('hex');
          resolve({
            buffer: croppedBuffer,
            mimeType: 'image/jpeg',
            width: safeW,
            height: safeH,
            sha256
          });
        } else {
          // Fallback: If ffmpeg crop fails for any reason, return the source buffer
          const sha256 = crypto.createHash('sha256').update(imageBuffer).digest('hex');
          resolve({
            buffer: imageBuffer,
            mimeType: 'image/jpeg',
            width: frameWidth,
            height: frameHeight,
            sha256
          });
        }
      });

      proc.stdin.write(imageBuffer);
      proc.stdin.end();
    });
  }
}
