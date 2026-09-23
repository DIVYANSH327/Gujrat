/**
 * Direct Live Camera ANPR Test
 * Gujarat Police Sentinel Grid - Corp8 CCTV Sandbox
 */

import { sentinelServerService } from '../src/services/server/SentinelServerService.js';
import { YoloVisionEngine } from '../src/services/vision/fabric/engines/YoloVisionEngine.js';
import { localPlateOcrService } from '../src/services/vision/LocalPlateOcrService.js';
import crypto from 'crypto';

async function runDirectCamTest() {
  console.log('>>> [START] Testing cam01 Direct Live Frame...');
  const yolo = new YoloVisionEngine();
  await yolo.isAvailable();

  const camId = 'cam01';
  console.log(`>>> Fetching real snapshot from ${camId}...`);
  const frameBuffer = await sentinelServerService.getSnapshot(camId);

  const frameSha256 = crypto.createHash('sha256').update(frameBuffer).digest('hex');
  console.log(`>>> Frame acquired: ${frameBuffer.length} bytes | sha256:${frameSha256}`);

  console.log('>>> Running real YOLOv8 ONNX inference...');
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

  console.log(`>>> YOLO detected ${vehicles.length} vehicle(s):`);
  vehicles.forEach((v: any, i: number) => {
    console.log(`    [${i + 1}] ${v.className} (${(v.confidence * 100).toFixed(1)}%) at bbox:`, v.bbox);
  });

  if (vehicles.length > 0) {
    const v = vehicles[0];
    const plateBox = {
      x: Math.max(0, v.bbox.x + v.bbox.width * 0.15),
      y: Math.max(0, v.bbox.y + v.bbox.height * 0.60),
      width: Math.min(1.0 - v.bbox.x, v.bbox.width * 0.70),
      height: Math.min(1.0 - v.bbox.y, v.bbox.height * 0.35)
    };

    console.log('>>> Extracting plate crop, running optical enhancement & OCR...');
    const result = await localPlateOcrService.extractPlateFromCrop(frameBuffer, plateBox, 1920, 1080);
    console.log('>>> OCR Result:', {
      status: result.status,
      isReadable: result.isReadable,
      plateText: result.plateText,
      confidence: result.confidence,
      unreadableReason: result.unreadableReason,
      cropDims: result.cropDimensions,
      rawCropSha256: result.rawCropSha256.slice(0, 32) + '...',
      enhancedSha256: result.enhancedCropSha256.slice(0, 32) + '...'
    });
  }

  process.exit(0);
}

runDirectCamTest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
