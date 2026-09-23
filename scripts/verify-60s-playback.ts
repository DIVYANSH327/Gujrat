import http from 'http';

interface CameraStats {
  camId: string;
  manifestRequests: number;
  manifestSuccesses: number;
  segmentsDownloaded: number;
  totalBytes: number;
  stalls: number;
  seenMediaSequences: number[];
  seenSegments: Set<string>;
  bufferDepths: number[];
  intervals: number[];
  lastSegmentTime: number;
  errors: string[];
}

function fetchBuffer(url: string, timeoutMs = 6000): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
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

async function runContinuousPlaybackTest(durationSeconds = 60) {
  console.log(`Starting 60-Second Concurrent Playback Validation for CAM-06 and CAM-12...`);
  console.log(`Test Duration: ${durationSeconds} seconds\n`);

  const cameras: Record<string, CameraStats> = {
    cam06: {
      camId: 'cam06',
      manifestRequests: 0,
      manifestSuccesses: 0,
      segmentsDownloaded: 0,
      totalBytes: 0,
      stalls: 0,
      seenMediaSequences: [],
      seenSegments: new Set<string>(),
      bufferDepths: [],
      intervals: [],
      lastSegmentTime: Date.now(),
      errors: []
    },
    cam12: {
      camId: 'cam12',
      manifestRequests: 0,
      manifestSuccesses: 0,
      segmentsDownloaded: 0,
      totalBytes: 0,
      stalls: 0,
      seenMediaSequences: [],
      seenSegments: new Set<string>(),
      bufferDepths: [],
      intervals: [],
      lastSegmentTime: Date.now(),
      errors: []
    }
  };

  console.log(`Warming up stream sessions for CAM-06 and CAM-12...`);
  for (const camId of ['cam06', 'cam12']) {
    let ready = false;
    for (let w = 1; w <= 12; w++) {
      try {
        const res = await fetchBuffer(`http://localhost:3000/api/sentinel/stream/${camId}/index.m3u8`, 12000);
        if (res.statusCode === 200 && res.body.toString('utf8').includes('#EXTINF')) {
          console.log(`✓ ${camId.toUpperCase()} session ready on attempt ${w}.`);
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!ready) {
      console.warn(`Warning: ${camId.toUpperCase()} did not warm up cleanly.`);
    }
  }
  console.log(`Both cameras armed. Starting 60-second continuous playback measurement...\n`);

  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;
  let pollIteration = 0;

  while (Date.now() < endTime) {
    pollIteration++;
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);

    for (const camId of ['cam06', 'cam12']) {
      const stats = cameras[camId];
      const manifestUrl = `http://localhost:3000/api/sentinel/stream/${camId}/index.m3u8`;

      try {
        stats.manifestRequests++;
        const res = await fetchBuffer(manifestUrl, 3000);

        if (res.statusCode === 200) {
          stats.manifestSuccesses++;
          const text = res.body.toString('utf8');
          const lines = text.split('\n').map((l) => l.trim());

          // Check media sequence
          const seqLine = lines.find((l) => l.startsWith('#EXT-X-MEDIA-SEQUENCE:'));
          if (seqLine) {
            const seq = parseInt(seqLine.split(':')[1], 10);
            if (!stats.seenMediaSequences.includes(seq)) {
              stats.seenMediaSequences.push(seq);
            }
          }

          // Segments in current playlist
          const segments = lines.filter((l) => l.endsWith('.ts'));
          stats.bufferDepths.push(segments.length);

          for (const seg of segments) {
            if (!stats.seenSegments.has(seg)) {
              stats.seenSegments.add(seg);
              const segUrl = `http://localhost:3000/api/sentinel/stream/${camId}/${seg}`;
              const segRes = await fetchBuffer(segUrl, 3000);

              if (segRes.statusCode === 200 && segRes.body.length > 20000) {
                stats.segmentsDownloaded++;
                stats.totalBytes += segRes.body.length;
                const now = Date.now();
                if (stats.lastSegmentTime > 0) {
                  stats.intervals.push((now - stats.lastSegmentTime) / 1000);
                }
                stats.lastSegmentTime = now;
              } else {
                stats.stalls++;
                stats.errors.push(`Segment ${seg} failed with status ${segRes.statusCode}, size ${segRes.body.length}`);
              }
            }
          }
        } else {
          stats.stalls++;
          stats.errors.push(`Manifest failed with status ${res.statusCode}`);
        }
      } catch (err: any) {
        stats.stalls++;
        stats.errors.push(`Polling error: ${err.message}`);
      }
    }

    if (pollIteration % 5 === 0 || elapsedSec >= durationSeconds) {
      console.log(`[T+${elapsedSec}s] Status Check:`);
      for (const camId of ['cam06', 'cam12']) {
        const s = cameras[camId];
        console.log(`  ${camId.toUpperCase()}: Segments Downloaded: ${s.segmentsDownloaded} | Buffer Window: ${s.bufferDepths[s.bufferDepths.length - 1] || 0} segs | Stalls: ${s.stalls} | Data: ${(s.totalBytes / 1024 / 1024).toFixed(2)} MB`);
      }
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\n==================================================`);
  console.log(`FINAL 60-SECOND CONTINUOUS PLAYBACK REPORT`);
  console.log(`==================================================\n`);

  for (const camId of ['cam06', 'cam12']) {
    const s = cameras[camId];
    const avgBuffer = s.bufferDepths.length ? (s.bufferDepths.reduce((a, b) => a + b, 0) / s.bufferDepths.length).toFixed(1) : '0';
    const minBuffer = s.bufferDepths.length ? Math.min(...s.bufferDepths) : 0;
    const maxBuffer = s.bufferDepths.length ? Math.max(...s.bufferDepths) : 0;
    const avgInterval = s.intervals.length ? (s.intervals.reduce((a, b) => a + b, 0) / s.intervals.length).toFixed(2) : '0';
    const avgSegSizeKb = s.segmentsDownloaded > 0 ? Math.round(s.totalBytes / s.segmentsDownloaded / 1024) : 0;
    const continuityScore = s.manifestRequests > 0 ? ((s.manifestSuccesses / s.manifestRequests) * 100).toFixed(1) : '0';

    console.log(`CAMERA: ${camId.toUpperCase()}`);
    console.log(`- Manifest Retrieval Success Rate: ${s.manifestSuccesses}/${s.manifestRequests} (${continuityScore}%)`);
    console.log(`- Total Segments Downloaded: ${s.segmentsDownloaded}`);
    console.log(`- Total Media Data Transferred: ${(s.totalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Average Segment Size: ${avgSegSizeKb} KB`);
    console.log(`- Average Segment Cadence: ${avgInterval}s`);
    console.log(`- Sliding Buffer Depth: Min ${minBuffer} segs | Avg ${avgBuffer} segs | Max ${maxBuffer} segs`);
    console.log(`- Stalls / Dropped Segments: ${s.stalls}`);
    console.log(`- Playback Health Verdict: ${s.stalls === 0 && s.segmentsDownloaded >= 40 ? 'PERFECT / ZERO-STALL CONTINUOUS' : s.stalls <= 2 ? 'STABLE' : 'DEGRADED'}`);
    console.log(`- Error Count: ${s.errors.length}`);
    if (s.errors.length > 0) {
      console.log(`  Sample Errors: ${s.errors.slice(0, 3).join(', ')}`);
    }
    console.log(``);
  }
}

runContinuousPlaybackTest(60).catch((err) => {
  console.error('Fatal playback test error:', err);
  process.exit(1);
});
