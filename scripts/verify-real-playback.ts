import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TestResult {
  camera: string;
  manifestPass: boolean;
  extinfPass: boolean;
  segmentDeliveryPass: boolean;
  ffprobeStreamPass: boolean;
  decoderPass: boolean;
  continuous60sPass: boolean;
  reconnectPass: boolean;
  metrics: {
    sourceFps: number;
    resolution: string;
    codec: string;
    totalSegmentsFetched: number;
    totalBytes: number;
    avgSegmentSizeKb: number;
    playbackDurationSec: number;
    stalls: number;
    maxBufferDepthSec: number;
    minBufferDepthSec: number;
    hlsListSize: number;
  };
  errors: string[];
}

function fetchHttp(url: string, timeoutMs: number = 8000): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url} after ${timeoutMs}ms`));
    }, timeoutMs);

    const req = http.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        clearTimeout(timer);
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function runCameraValidation(camId: string): Promise<TestResult> {
  console.log(`\n==================================================`);
  console.log(`STARTING VALIDATION FOR ${camId.toUpperCase()}`);
  console.log(`==================================================`);

  const result: TestResult = {
    camera: camId,
    manifestPass: false,
    extinfPass: false,
    segmentDeliveryPass: false,
    ffprobeStreamPass: false,
    decoderPass: false,
    continuous60sPass: false,
    reconnectPass: false,
    metrics: {
      sourceFps: 25,
      resolution: 'Unknown',
      codec: 'H.264',
      totalSegmentsFetched: 0,
      totalBytes: 0,
      avgSegmentSizeKb: 0,
      playbackDurationSec: 0,
      stalls: 0,
      maxBufferDepthSec: 0,
      minBufferDepthSec: 999,
      hlsListSize: 0
    },
    errors: []
  };

  const baseUrl = `http://localhost:3000/api/sentinel/stream/${camId}`;
  const manifestUrl = `${baseUrl}/index.m3u8`;

  // 1. Initial Manifest Warmup & Verification
  console.log(`[${camId}] Step 1: Requesting initial HLS manifest...`);
  let initialManifestText = '';
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const res = await fetchHttp(manifestUrl, 10000);
      if (res.statusCode === 200) {
        initialManifestText = res.body.toString('utf8');
        if (initialManifestText.includes('#EXTINF')) {
          result.manifestPass = true;
          result.extinfPass = true;
          console.log(`[${camId}] ✓ Manifest received with valid #EXTINF on attempt ${attempt}`);
          break;
        }
      }
    } catch (e: any) {
      console.log(`[${camId}] Attempt ${attempt} failed: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (!result.manifestPass) {
    result.errors.push('Failed to retrieve valid manifest with #EXTINF within 10s');
    return result;
  }

  // 2. Initial Segment Delivery Check
  console.log(`[${camId}] Step 2: Testing direct segment retrieval...`);
  const lines = initialManifestText.split('\n').map((l) => l.trim());
  const firstSegLine = lines.find((l) => l.endsWith('.ts'));
  if (firstSegLine) {
    try {
      const segRes = await fetchHttp(`${baseUrl}/${firstSegLine}`, 6000);
      if (segRes.statusCode === 200 && segRes.body.length > 50000) {
        result.segmentDeliveryPass = true;
        console.log(`[${camId}] ✓ Segment ${firstSegLine} downloaded successfully (${(segRes.body.length / 1024).toFixed(1)} KB, Content-Type: ${segRes.headers['content-type']})`);
      } else {
        result.errors.push(`Segment ${firstSegLine} returned status ${segRes.statusCode}, size ${segRes.body.length}`);
      }
    } catch (e: any) {
      result.errors.push(`Error downloading segment ${firstSegLine}: ${e.message}`);
    }
  }

  // 3. Media Probe using FFprobe
  console.log(`[${camId}] Step 3: Probing stream metadata with ffprobe...`);
  try {
    const probeCmd = `ffprobe -v error -show_entries stream=width,height,codec_name,r_frame_rate -of json "${manifestUrl}"`;
    const probeOut = execSync(probeCmd, { timeout: 15000 }).toString();
    const probeData = JSON.parse(probeOut);
    const videoStream = probeData.streams?.find((s: any) => s.width && s.height);
    if (videoStream) {
      result.ffprobeStreamPass = true;
      result.metrics.resolution = `${videoStream.width}x${videoStream.height}`;
      result.metrics.codec = videoStream.codec_name;
      console.log(`[${camId}] ✓ Stream Probe: ${result.metrics.resolution}, Codec: ${result.metrics.codec}, FrameRate: ${videoStream.r_frame_rate}`);
    }
  } catch (e: any) {
    console.warn(`[${camId}] ffprobe probe note: ${e.message?.split('\n')[0]}`);
  }

  // 4. Decoder Test with FFmpeg null sink (10 seconds packet decode)
  console.log(`[${camId}] Step 4: Testing real stream decoding via FFmpeg null sink...`);
  try {
    const decodeCmd = `ffmpeg -v error -t 10 -i "${manifestUrl}" -f null -`;
    execSync(decodeCmd, { timeout: 20000 });
    result.decoderPass = true;
    console.log(`[${camId}] ✓ Decoder Pass: 10s of live HLS video decoded with 0 fatal errors`);
  } catch (e: any) {
    result.errors.push(`Decoder error: ${e.message?.split('\n')[0]}`);
    console.error(`[${camId}] Decoder test error:`, e.message);
  }

  // 5. 60-Second Continuous Playback Simulation
  console.log(`[${camId}] Step 5: Commencing 60-second continuous playback & buffering test...`);
  const downloadedSegments = new Set<string>();
  let playbackClockSec = 0;
  let simulatedBufferSec = 0;
  const startTime = Date.now();
  const testDurationMs = 60000;
  let checkCount = 0;

  while (Date.now() - startTime < testDurationMs) {
    checkCount++;
    try {
      const manifestRes = await fetchHttp(manifestUrl, 5000);
      if (manifestRes.statusCode === 200) {
        const text = manifestRes.body.toString('utf8');
        const segsInPlaylist = text.split('\n').map((l) => l.trim()).filter((l) => l.endsWith('.ts'));
        result.metrics.hlsListSize = segsInPlaylist.length;

        // Fetch any new segments
        for (const seg of segsInPlaylist) {
          if (!downloadedSegments.has(seg)) {
            downloadedSegments.add(seg);
            const segRes = await fetchHttp(`${baseUrl}/${seg}`, 5000);
            if (segRes.statusCode === 200) {
              result.metrics.totalSegmentsFetched++;
              result.metrics.totalBytes += segRes.body.length;
              simulatedBufferSec += 1.0; // 1-second segment
            } else {
              result.errors.push(`Segment ${seg} HTTP ${segRes.statusCode}`);
            }
          }
        }

        // Simulate 1 second of player consumption
        if (simulatedBufferSec > 0) {
          simulatedBufferSec = Math.max(0, simulatedBufferSec - 1.0);
          playbackClockSec += 1.0;
        } else {
          result.metrics.stalls++;
        }

        if (simulatedBufferSec > result.metrics.maxBufferDepthSec) {
          result.metrics.maxBufferDepthSec = Math.round(simulatedBufferSec * 10) / 10;
        }
        if (simulatedBufferSec < result.metrics.minBufferDepthSec) {
          result.metrics.minBufferDepthSec = Math.round(simulatedBufferSec * 10) / 10;
        }

        if (checkCount % 10 === 0) {
          console.log(`[${camId}] Progress: ${Math.round((Date.now() - startTime) / 1000)}s | Clock: ${playbackClockSec.toFixed(1)}s | Segments: ${result.metrics.totalSegmentsFetched} | Buffer: ${simulatedBufferSec.toFixed(1)}s | Stalls: ${result.metrics.stalls}`);
        }
      }
    } catch (e: any) {
      console.warn(`[${camId}] Poll error at ${Math.round((Date.now() - startTime) / 1000)}s: ${e.message}`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  result.metrics.playbackDurationSec = playbackClockSec;
  if (result.metrics.totalSegmentsFetched > 0) {
    result.metrics.avgSegmentSizeKb = Math.round(result.metrics.totalBytes / result.metrics.totalSegmentsFetched / 1024);
  }

  if (result.metrics.playbackDurationSec >= 50 && result.metrics.stalls === 0) {
    result.continuous60sPass = true;
    console.log(`[${camId}] ✓ 60-Second Playback Test PASSED (${result.metrics.playbackDurationSec}s elapsed, 0 stalls, ${result.metrics.totalSegmentsFetched} segments)`);
  } else {
    result.errors.push(`Continuous playback completed ${result.metrics.playbackDurationSec}s with ${result.metrics.stalls} stalls`);
  }

  // 6. Intentional Interruption & Reconnect Verification
  console.log(`[${camId}] Step 6: Testing intentional interruption and reconnect...`);
  try {
    // Send stop signal
    const stopRes = await new Promise<{ statusCode: number }>((resolve) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: 3000,
          path: `/api/sentinel/stream/${camId}/stop`,
          method: 'POST'
        },
        (res) => resolve({ statusCode: res.statusCode || 0 })
      );
      req.end();
    });

    console.log(`[${camId}] Dispatched stop request (status ${stopRes.statusCode}). Waiting 2s for process teardown...`);
    await new Promise((r) => setTimeout(r, 2000));

    // Request stream again
    const reconnectStart = Date.now();
    let reconnected = false;
    for (let rAttempt = 1; rAttempt <= 8; rAttempt++) {
      try {
        const recRes = await fetchHttp(manifestUrl, 6000);
        if (recRes.statusCode === 200 && recRes.body.toString('utf8').includes('#EXTINF')) {
          reconnected = true;
          const latency = Date.now() - reconnectStart;
          console.log(`[${camId}] ✓ Stream reconnected successfully in ${latency}ms on attempt ${rAttempt}`);
          result.reconnectPass = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!reconnected) {
      result.errors.push('Stream failed to recover after intentional stop');
    }
  } catch (e: any) {
    result.errors.push(`Reconnect test error: ${e.message}`);
  }

  return result;
}

async function main() {
  console.log(`Sentinel Grid — High-Fidelity Real Camera Playback Verification`);
  console.log(`Testing CAM-06 and CAM-12 against live RTSP feeds...\n`);

  const cam06Result = await runCameraValidation('cam06');
  const cam12Result = await runCameraValidation('cam12');

  // Verify process counts and audit orphans
  console.log(`\n==================================================`);
  console.log(`PROCESS SAFETY & ORPHAN AUDIT`);
  console.log(`==================================================`);
  try {
    const psOut = execSync('ps aux | grep -E "ffmpeg|cam06|cam12" | grep -v grep').toString();
    console.log('Active FFmpeg / Camera processes:\n' + psOut.trim());
    const remuxLines = psOut.split('\n').filter((l) => l.includes('-hls_time'));
    console.log(`\nActive HLS Remux Sessions count: ${remuxLines.length}`);
  } catch (e) {
    console.log('No remaining ffmpeg processes.');
  }

  console.log(`\n==================================================`);
  console.log(`SUMMARY REPORT FOR REAL CAMERA PLAYBACK`);
  console.log(`==================================================`);
  console.log(JSON.stringify({ cam06: cam06Result, cam12: cam12Result }, null, 2));
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
