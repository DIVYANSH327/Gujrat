/**
 * Multi-Camera Stream & Plate Extraction Audit
 * Gujarat Police Sentinel Grid - Corp8 CCTV Sandbox
 */

import { sentinelServerService } from '../src/services/server/SentinelServerService.js';
import { YoloVisionEngine } from '../src/services/vision/fabric/engines/YoloVisionEngine.js';
import { localPlateOcrService } from '../src/services/vision/LocalPlateOcrService.js';
import crypto from 'crypto';

async function auditAllCameras() {
  console.log('>>> Auditing Corp8 cameras for vehicle traffic and readable plates...');
  const yolo = new YoloVisionEngine();
  await yolo.isAvailable();

  const camsToTest = ['cam01', 'cam04', 'cam05', 'cam11', 'cam12', 'cam13', 'cam14', 'cam15', 'cam16', 'cam17', 'cam18', 'cam19', 'cam20'];
  const extractedPlates: any[] = [];

  for (const camId of camsToTest) {
    try {
      const buf = await sentinelServerService.getSnapshot(camId);
      if (!buf || buf.length < 50000) {
        console.log(`[-] ${camId}: Skipped (Frame size ${buf?.length || 0} bytes - fallback or offline)`);
        continue;
      }

      const sha = crypto.createHash('sha256').update(buf).digest('hex');
      console.log(`[+] ${camId}: Acquired ${buf.length} bytes | SHA: ${sha.slice(0, 16)}...`);

      const obs = await yolo.analyzeFrame({
        frameBuffer: buf,
        cameraId: camId,
        timestamp: Date.now(),
        captureIso: new Date().toISOString(),
        mimeType: 'image/jpeg',
        sha256: sha
      });

      const vehicles = (obs.detections || []).filter((d: any) =>
        ['car', 'motorcycle', 'bus', 'truck', 'bicycle'].includes(d.className?.toLowerCase())
      );

      console.log(`    Detected ${vehicles.length} vehicle(s)`);

      for (const v of vehicles) {
        const plateBox = {
          x: Math.max(0, v.bbox.x + v.bbox.width * 0.15),
          y: Math.max(0, v.bbox.y + v.bbox.height * 0.60),
          width: Math.min(1.0 - v.bbox.x, v.bbox.width * 0.70),
          height: Math.min(1.0 - v.bbox.y, v.bbox.height * 0.35)
        };

        const ocr = await localPlateOcrService.extractPlateFromCrop(buf, plateBox, 1920, 1080);
        console.log(`    [CROP ${ocr.cropDimensions.width}x${ocr.cropDimensions.height}] OCR: "${(ocr.plateText || 'NONE')}" (${ocr.status}) Conf: ${(ocr.confidence * 100).toFixed(1)}%`);

        if (ocr.status === 'READABLE' || ocr.status === 'UNCERTAIN') {
          extractedPlates.push({
            camera: camId,
            vehicle: v.className,
            plateText: ocr.plateText,
            confidence: ocr.confidence,
            rawSha256: ocr.rawCropSha256,
            enhancedSha256: ocr.enhancedCropSha256,
            dims: ocr.cropDimensions
          });
        }
      }
    } catch (e: any) {
      console.log(`[-] ${camId}: Error ${e.message}`);
    }
  }

  console.log('\n============================================================');
  console.log(`EXTRACTED PLATES SUMMARY (${extractedPlates.length} captured)`);
  console.log('============================================================');
  extractedPlates.forEach((p, idx) => {
    console.log(`Plate #${idx + 1}: ${p.plateText} (${p.vehicle} on ${p.camera}) - Conf: ${(p.confidence * 100).toFixed(1)}%`);
    console.log(`  Raw SHA:      ${p.rawSha256}`);
    console.log(`  Enhanced SHA: ${p.enhancedSha256}`);
    console.log(`  Dimensions:   ${p.dims.width}x${p.dims.height}`);
  });

  process.exit(0);
}

auditAllCameras().catch(console.error);
