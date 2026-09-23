/**
 * Real-Camera ANPR & Plate Extraction Verification Script
 * Gujarat Police Sentinel Grid - Corp8 CCTV Sandbox
 * 
 * Truthful, unvarnished execution on actual camera pixels:
 * Camera Snapshot -> Frame SHA-256 -> YOLOv8 ONNX -> Vehicle Crop -> Plate Crop -> 
 * Optical Enhancement -> Tesseract OCR -> Truthful Evidence Record
 */

import { sentinelServerService } from '../src/services/server/SentinelServerService.js';
import { YoloVisionEngine } from '../src/services/vision/fabric/engines/YoloVisionEngine.js';
import { localPlateOcrService } from '../src/services/vision/LocalPlateOcrService.js';
import { ImageCropUtil } from '../src/services/vision/imageCropUtil.js';
import crypto from 'crypto';

async function verifyRealCameraAnpr() {
  console.log('================================================================');
  console.log('SENTINEL GRID: REAL-DATA CCTV PLATE EXTRACTION AUDIT');
  console.log('================================================================\n');

  const yolo = new YoloVisionEngine();
  const yoloAvailable = await yolo.isAvailable();
  console.log(`[STATUS] YOLOv8 ONNX Engine Ready: ${yoloAvailable}`);

  // Test across reachable Corp8 cameras
  const targetCameras = ['cam01', 'cam02', 'cam03', 'cam04', 'cam05', 'cam06', 'cam07', 'cam08', 'cam09', 'cam10'];
  let totalFramesAudited = 0;
  let totalVehiclesDetected = 0;
  let readablePlates = 0;
  let uncertainPlates = 0;
  let unreadablePlates = 0;

  for (const camId of targetCameras) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`AUDITING CCTV NODE: ${camId}`);
    console.log(`------------------------------------------------------------`);

    let frameBuffer: Buffer | null = null;
    try {
      frameBuffer = await sentinelServerService.getSnapshot(camId);
    } catch (err: any) {
      console.log(`[CAMERA] ${camId} snapshot acquisition error: ${err.message}`);
      continue;
    }

    if (!frameBuffer || frameBuffer.length === 0) {
      console.log(`[CAMERA] ${camId} returned empty frame`);
      continue;
    }

    totalFramesAudited++;
    const frameSha256 = crypto.createHash('sha256').update(frameBuffer).digest('hex');
    console.log(`[FRAME] Acquired real JPEG: ${frameBuffer.length} bytes`);
    console.log(`[SHA-256] sha256:${frameSha256}`);

    // Run real YOLOv8 ONNX detection
    const obs = await yolo.analyzeFrame({
      frameBuffer,
      cameraId: camId,
      timestamp: Date.now(),
      captureIso: new Date().toISOString(),
      mimeType: 'image/jpeg',
      sha256: frameSha256
    });

    const vehicles = (obs.detections || []).filter((d: any) =>
      ['car', 'motorcycle', 'bus', 'truck', 'bicycle'].includes(d.className?.toLowerCase())
    );

    console.log(`[YOLO] Detected ${vehicles.length} vehicle(s) on ${camId}`);
    totalVehiclesDetected += vehicles.length;

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      console.log(`\n  [VEHICLE ${i + 1}] Class: ${v.className.toUpperCase()} | Confidence: ${(v.confidence * 100).toFixed(1)}%`);
      console.log(`  [BBOX] x: ${v.bbox.x.toFixed(3)}, y: ${v.bbox.y.toFixed(3)}, w: ${v.bbox.width.toFixed(3)}, h: ${v.bbox.height.toFixed(3)}`);

      // Calculate candidate plate region (lower bumper)
      const plateBox = {
        x: Math.max(0, v.bbox.x + v.bbox.width * 0.15),
        y: Math.max(0, v.bbox.y + v.bbox.height * 0.60),
        width: Math.min(1.0 - v.bbox.x, v.bbox.width * 0.70),
        height: Math.min(1.0 - v.bbox.y, v.bbox.height * 0.35)
      };

      try {
        const ocrResult = await localPlateOcrService.extractPlateFromCrop(
          frameBuffer,
          plateBox,
          1920,
          1080
        );

        console.log(`  [CROP] Dimensions: ${ocrResult.cropDimensions.width}x${ocrResult.cropDimensions.height} px`);
        console.log(`  [RAW SHA-256] ${ocrResult.rawCropSha256.slice(0, 32)}...`);
        console.log(`  [ENH SHA-256] ${ocrResult.enhancedCropSha256.slice(0, 32)}...`);
        console.log(`  [OCR STATUS] ${ocrResult.status}`);
        console.log(`  [OCR RAW TEXT] "${(ocrResult.rawText || '').replace(/\n/g, ' ')}"`);
        console.log(`  [OCR NORMALIZED] "${ocrResult.plateText || 'NONE'}"`);
        console.log(`  [CONFIDENCE] ${(ocrResult.confidence * 100).toFixed(1)}%`);

        if (ocrResult.status === 'READABLE') {
          readablePlates++;
          console.log(`  >>> RESULT: VERIFIED REAL PLATE EXTRACTED: ${ocrResult.plateText}`);
        } else if (ocrResult.status === 'UNCERTAIN') {
          uncertainPlates++;
          console.log(`  >>> RESULT: UNCERTAIN/PARTIAL PLATE: ${ocrResult.plateText}`);
        } else {
          unreadablePlates++;
          console.log(`  >>> RESULT: NOT READABLE - Reason: ${ocrResult.unreadableReason || 'LOW_RESOLUTION'}`);
        }
      } catch (ocrErr: any) {
        console.error(`  [OCR ERROR] ${ocrErr.message}`);
        unreadablePlates++;
      }
    }
  }

  console.log('\n================================================================');
  console.log('REAL-DATA EXTRACTION SUMMARY');
  console.log('================================================================');
  console.log(`Total Frames Audited:    ${totalFramesAudited}`);
  console.log(`Total Vehicles Detected: ${totalVehiclesDetected}`);
  console.log(`Readable License Plates: ${readablePlates}`);
  console.log(`Uncertain/Partial:       ${uncertainPlates}`);
  console.log(`Not Readable / Degraded: ${unreadablePlates}`);
  console.log('================================================================\n');

  process.exit(0);
}

verifyRealCameraAnpr().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
