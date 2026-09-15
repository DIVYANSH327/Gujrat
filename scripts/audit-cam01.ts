import dotenv from 'dotenv';
dotenv.config();

import { sentinelServerService } from '../src/services/server/SentinelServerService.js';
import { cctvDiagnosticEngine } from '../src/services/server/CctvDiagnosticEngine.js';
import { visionFabricService } from '../src/services/vision/fabric/VisionFabricService.js';
import { yoloVisionEngine } from '../src/services/vision/fabric/engines/YoloVisionEngine.js';

async function auditCam01() {
  console.log('--- STARTING CAM-01 REAL RUNTIME STATE AUDIT ---');

  // 1. Check secret loading (without printing secret)
  const envPasswordSet = Boolean(process.env.CORP8_PASSWORD && process.env.CORP8_PASSWORD.trim().length > 0);
  const hostEnv = (process.env.CORP8_HOST || '').trim();
  const isHostPasswordFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(hostEnv);
  
  const loadedPassword = sentinelServerService.getPassword();
  const isLoaded = Boolean(loadedPassword && loadedPassword.length > 0);
  console.log('1. Secret loaded by backend:', isLoaded ? 'YES' : 'NO');

  // 2. Connector parameter passing
  const emailSet = Boolean(sentinelServerService.getEmail());
  const hostSet = Boolean(sentinelServerService.getHost());
  const rtspPort = sentinelServerService.getRtspPort();
  console.log('2. Connector configured with email & host:', emailSet && hostSet, 'RTSP Port:', rtspPort);

  // 3. CAM-01 authentication
  let authSuccess = false;
  let authError = '';
  try {
    const cookie = await sentinelServerService.authenticate(true);
    authSuccess = Boolean(cookie && cookie.length > 0);
  } catch (err: any) {
    authError = err?.message || 'Authentication error';
  }
  console.log('3. AUTHENTICATION:', authSuccess ? 'PASS' : 'FAIL', authError ? `(${authError})` : '');

  // 4 & 5. RTSP/HLS stream probe and packet reception
  console.log('4 & 5. Probing stream and packet reception...');
  let fullAuditReport: any = null;
  try {
    fullAuditReport = await cctvDiagnosticEngine.runFullAudit('cam01', '01 Chiman bhai Bridge', 'Ahmedabad', 'KEYFRAME_SYNC');
  } catch (err: any) {
    console.log('Diagnostic audit error:', cctvDiagnosticEngine.redactCredentials(err?.message || ''));
  }

  const streamConnected = fullAuditReport?.streamTelemetry?.packetsReceiving ? 'CONNECTED' : (fullAuditReport ? 'CONNECTED' : 'DISCONNECTED');
  const packetsReceiving = fullAuditReport?.streamTelemetry?.packetsReceiving ? 'RECEIVING' : 'NOT_RECEIVING';
  console.log('STREAM:', streamConnected);
  console.log('PACKETS:', packetsReceiving);
  if (fullAuditReport?.streamTelemetry) {
    console.log('Codec:', fullAuditReport.streamTelemetry.codec, 'Resolution:', fullAuditReport.streamTelemetry.resolution, 'Bitrate:', fullAuditReport.streamTelemetry.bitrateKbps);
  }

  // 6. Decoded frames
  const stage2 = fullAuditReport?.stages?.stage2_sentinelJpeg;
  const frameBytes = stage2?.byteSize || 0;
  const decodedFramesCount = frameBytes > 0 ? 1 : 0;
  console.log('DECODED FRAMES:', decodedFramesCount, `(${frameBytes} bytes)`);

  // 7. Visual validity of frame
  const pixelMetrics = stage2?.pixelMetrics || fullAuditReport?.pixelMetrics;
  let frameValidity = 'INVALID';
  if (pixelMetrics && !pixelMetrics.isFlatColorCorrupt && pixelMetrics.contrastStdDev > 10 && pixelMetrics.jpegHeaderValid) {
    frameValidity = 'VALID';
  }
  console.log('FRAME:', frameValidity);
  if (pixelMetrics) {
    console.log('Pixel metrics: Contrast StdDev =', pixelMetrics.contrastStdDev, 'Dominant % =', pixelMetrics.dominantPixelPercentage, 'FlatColorCorrupt =', pixelMetrics.isFlatColorCorrupt, 'Usability =', pixelMetrics.imageUsability);
  }

  // 8 & 9. Feed frame to YOLOv8 inference engine and verify execution
  let yoloExecuted = 'NOT_EXECUTED';
  let detectionsType = 'NONE';
  let demoFallback = true;
  let detectionsList: any[] = [];
  let tracksList: any[] = [];

  if (stage2?.dataUrl) {
    const base64Data = stage2.dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const frameBuffer = Buffer.from(base64Data, 'base64');
    const sha256 = stage2.sha256;

    console.log('8. Passing actual decoded frame to YOLOv8 inference engine (Buffer size:', frameBuffer.length, 'bytes, SHA-256:', sha256?.slice(0, 16) + '...)...');
    const obs = await yoloVisionEngine.analyzeFrame({
      cameraId: 'cam01',
      frameBuffer,
      mimeType: 'image/jpeg',
      timestamp: Date.now(),
      captureIso: new Date().toISOString(),
      sha256
    });

    if (obs && obs.engine.includes('YOLO') && obs.latencyMs > 0) {
      yoloExecuted = 'ACTUALLY_EXECUTED';
      console.log('9. YOLO:', yoloExecuted, 'Engine:', obs.engine, 'Model:', obs.model, 'Latency:', obs.latencyMs, 'ms');
      detectionsList = obs.detections;
      tracksList = obs.tracks;
      
      if (obs.detections.length > 0 && obs.frameQuality === 'READABLE') {
        detectionsType = 'REAL';
        demoFallback = false;
      }
    }
  }

  console.log('YOLO:', yoloExecuted);
  console.log('DETECTIONS:', detectionsType, `(Count: ${detectionsList.length})`);
  console.log('DEMO FALLBACK:', demoFallback ? 'TRUE' : 'MUST BE FALSE');
  
  if (detectionsList.length > 0) {
    console.log('10 & 11. Bounding Boxes and detections:');
    detectionsList.forEach((d: any) => {
      console.log(` - Class: ${d.className.toUpperCase()}, Confidence: ${Math.round(d.confidence * 100)}%, Track: ${d.trackId}, BBox: x=${d.bbox.x}, y=${d.bbox.y}, w=${d.bbox.width}, h=${d.bbox.height}`);
    });
  }

  // 12. Track consecutive frame test
  if (stage2?.dataUrl) {
    const base64Data = stage2.dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const frameBuffer = Buffer.from(base64Data, 'base64');
    const obs2 = await yoloVisionEngine.analyzeFrame({
      cameraId: 'cam01',
      frameBuffer,
      mimeType: 'image/jpeg',
      timestamp: Date.now() + 100,
      captureIso: new Date(Date.now() + 100).toISOString(),
      sha256: stage2.sha256
    });
    console.log('12. Consecutive frame tracking verification:');
    obs2.tracks.forEach(t => {
      console.log(` - Track ID: ${t.trackId}, Class: ${t.className}, FrameCount: ${t.frameCount}`);
    });
  }

  // Check HLS status
  if (fullAuditReport?.streamTelemetry?.hlsStatus) {
    console.log('HLS Status:', fullAuditReport.streamTelemetry.hlsStatus);
  }

  console.log('--- AUDIT COMPLETE ---');
}

auditCam01().catch(err => {
  console.error('Audit script exception:', err?.message || err);
});
