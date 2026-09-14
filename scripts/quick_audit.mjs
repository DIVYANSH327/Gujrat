import http from 'http';
import crypto from 'crypto';

async function getJson(path) {
  return new Promise((res) => {
    http.get('http://localhost:3000' + path, (r) => {
      const d = [];
      r.on('data', c => d.push(c));
      r.on('end', () => {
        try {
          res(JSON.parse(Buffer.concat(d).toString()));
        } catch {
          res(null);
        }
      });
    }).on('error', () => res(null));
  });
}

async function getHead(path) {
  return new Promise((res) => {
    http.get('http://localhost:3000' + path, (r) => {
      const d = [];
      r.on('data', c => d.push(c));
      r.on('end', () => {
        const buf = Buffer.concat(d);
        const hash = crypto.createHash('sha256').update(buf).digest('hex');
        res({ status: r.statusCode, length: buf.length, hash, isJpeg: buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8 });
      });
    }).on('error', (e) => res({ status: 500, length: 0, hash: 'ERR', isJpeg: false, error: e.message }));
  });
}

async function main() {
  const status = await getJson('/api/intelligence/status');
  const camsData = await getJson('/api/sentinel/cameras');
  const anprSuit = await getJson('/api/intelligence/anpr-suitability') || {};
  const cameras = camsData?.cameras || [];

  console.log('STATUS:', JSON.stringify(status, null, 2));

  // Test CAM12
  const cam12Snap = await getHead('/api/sentinel/snapshot/cam12');
  console.log('CAM12 SNAPSHOT:', cam12Snap);

  // Test CAM01-CAM05 thumbnails to measure size
  const sampleThumbs = [];
  for (let i = 1; i <= 5; i++) {
    const cid = 'cam' + String(i).padStart(2, '0');
    const h = await getHead('/api/sentinel/thumbnail/' + cid);
    sampleThumbs.push({ cid, ...h });
  }
  console.log('SAMPLE THUMBNAILS:', sampleThumbs);

  const avgThumbBytes = sampleThumbs.reduce((a, b) => a + b.length, 0) / sampleThumbs.length;
  const totalThumb30 = avgThumbBytes * 30;
  const bwKbSec = totalThumb30 / 3.0 / 1024;

  console.log('AUDIT_DATA:');
  console.log({
    camerasCount: cameras.length,
    avgThumbBytes,
    totalThumb30,
    bwKbSec: bwKbSec.toFixed(2),
    status
  });
}

main();
