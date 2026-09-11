/**
 * Plate Detection Agent
 * Detects registration plate regions inside vehicle bounding boxes.
 * Extracts genuine cropped JPEG buffers using FFmpeg and validates minimum physical dimensions.
 */

import crypto from 'crypto';
import { ImageCropUtil } from './imageCropUtil.js';
import { BoundingBox, PlateCandidate, VehicleDetection, VehicleTrack, VisionFrame } from './visionTypes.js';

export class PlateDetectionAgent {
  private static instance: PlateDetectionAgent;

  public static getInstance(): PlateDetectionAgent {
    if (!PlateDetectionAgent.instance) {
      PlateDetectionAgent.instance = new PlateDetectionAgent();
    }
    return PlateDetectionAgent.instance;
  }

  /**
   * Detects or extracts plate candidate for a vehicle detection within a frame.
   */
  public async detectPlate(
    frame: VisionFrame,
    detection: VehicleDetection,
    track: VehicleTrack
  ): Promise<PlateCandidate | null> {
    let plateBox: BoundingBox;
    let confidence = 0.85;

    if (detection.plateBox) {
      plateBox = detection.plateBox;
      confidence = Math.max(0.7, detection.confidence);
    } else {
      // Estimate plate position inside vehicle bounding box
      // Typically at bottom center (cars/trucks: y+0.75*height to y+0.95*height, x+0.35*width to x+0.65*width)
      // or motorcycles: bottom center or rear
      const isTwoWheeler = detection.class === 'motorcycle' || detection.class === 'scooter';
      const pW = Math.max(0.03, detection.box.width * (isTwoWheeler ? 0.35 : 0.38));
      const pH = Math.max(0.015, detection.box.height * (isTwoWheeler ? 0.25 : 0.16));
      const pX = detection.box.x + (detection.box.width - pW) / 2;
      const pY = detection.box.y + detection.box.height * (isTwoWheeler ? 0.70 : 0.76);

      plateBox = {
        x: Math.max(0, Math.min(0.97, pX)),
        y: Math.max(0, Math.min(0.97, pY)),
        width: Math.min(1 - pX, pW),
        height: Math.min(1 - pY, pH)
      };
      confidence = Math.max(0.5, detection.confidence * 0.85);
    }

    // Crop genuine JPEG region
    try {
      const cropResult = await ImageCropUtil.cropJpeg(
        frame.imageBuffer,
        plateBox,
        frame.width,
        frame.height
      );

      const candidateId = `PLATE-${track.vehicleTrackId}-${Date.now()}`;
      const isAdequateSize = cropResult.width >= 40 && cropResult.height >= 16;

      const candidate: PlateCandidate = {
        candidateId,
        vehicleTrackId: track.vehicleTrackId,
        bbox: plateBox,
        confidence,
        cropBuffer: cropResult.buffer,
        cropSha256: cropResult.sha256,
        frameId: frame.frameId,
        frameTimestamp: new Date(frame.timestamp).getTime(),
        widthPx: cropResult.width,
        heightPx: cropResult.height,
        isAdequateSize
      };

      return candidate;
    } catch (err) {
      console.warn('[PlateDetectionAgent] Crop failed:', err);
      return null;
    }
  }
}

export const plateDetectionAgent = PlateDetectionAgent.getInstance();
