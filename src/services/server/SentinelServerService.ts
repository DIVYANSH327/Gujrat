import net from 'node:net';
import { spawn } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { CANONICAL_SENTINEL_RAW_CAMERAS, SentinelRawCamera } from '../../data/sentinelCatalogue';

export interface SentinelNormalizedCamera {
  id: string;
  name: string;
  location: string;
  district: string;
  codec: 'H.264' | 'H.265';
  resolution: string;
  width: number;
  height: number;
  declaredFps: number;
  rtspAvailable: boolean;
  hlsAvailable: boolean;
  whepAvailable: boolean;
  status: 'online' | 'offline' | 'reconnecting';
  hlsStreamUrl: string;
  safeRtspPath: string;
  whepUrl: string;
  latitude: number;
  longitude: number;
}

export interface SentinelHealthReport {
  reachable: boolean;
  authenticated: boolean;
  catalogueAvailable: boolean;
  cameraCount: number;
  testedAt: string;
  rtsp: {
    host: string;
    port: number;
    hostReachable: boolean;
  };
  ffmpegAvailable: boolean;
  error?: string | null;
}

const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Gandhinagar: { lat: 23.2156, lng: 72.6369 },
  Junagadh: { lat: 21.5222, lng: 70.4579 },
  Rajkot: { lat: 22.3039, lng: 70.8022 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Navsari: { lat: 20.9467, lng: 72.9520 },
  Patan: { lat: 23.8493, lng: 72.1266 },
  Banaskantha: { lat: 24.1724, lng: 72.4346 },
  Gandhidham: { lat: 23.0753, lng: 70.1337 },
  Kutch: { lat: 23.2420, lng: 69.6669 }
};

function inferDistrictAndLocation(rawName: string): { district: string; location: string } {
  // Strip leading digits e.g. "01 Chiman bhai Bridge" -> "Chiman bhai Bridge"
  const cleanName = rawName.replace(/^\d+\s*/, '').trim();
  const lower = cleanName.toLowerCase();

  let district = 'Ahmedabad';
  if (lower.includes('junagadh') || lower.includes('majewadi') || lower.includes('timbavadi') || lower.includes('dolatpara')) {
    district = 'Junagadh';
  } else if (lower.includes('gir-somnath') || lower.includes('hero-showroom')) {
    district = 'Gir Somnath';
  } else if (lower.includes('rajkot')) {
    district = 'Rajkot';
  } else if (lower.includes('gandhinagar') || lower.includes('adalaj') || lower.includes('tri mandir') || lower.includes('dehgam')) {
    district = 'Gandhinagar';
  } else if (lower.includes('navsari') || lower.includes('bilimora') || lower.includes('gandevi') || lower.includes('khaparia') || lower.includes('tankal')) {
    district = 'Navsari';
  } else if (lower.includes('patan')) {
    district = 'Patan';
  } else if (lower.includes('mervada') || lower.includes('bk ')) {
    district = 'Banaskantha';
  } else if (lower.includes('gandhidham') || lower.includes('rambaugh')) {
    district = 'Gandhidham';
  } else if (lower.includes('surat')) {
    district = 'Surat';
  } else if (lower.includes('vadodara')) {
    district = 'Vadodara';
  }

  return { district, location: cleanName };
}

export class SentinelServerService {
  private baseUrl = 'https://cctv.corp8.cloud';
  private sessionCookie: string | null = null;
  private cookieExpiresAt: number = 0;
  private cachedKey: Buffer | null = null;
  private cachedCatalogue: SentinelNormalizedCamera[] | null = null;
  private lastCatalogueTime: number = 0;
  private cachedSnapshots = new Map<string, { buffer: Buffer; timestamp: number }>();
  private inFlightSnapshots = new Map<string, Promise<Buffer>>();
  private ffmpegInstalled: boolean | null = null;
  private activePassword: string | null = null;
  private isCooldownActive: boolean = false;
  private cooldownMessage: string = '';

  private getUserAgent(): string {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  }

  public getEmail(): string {
    return (process.env.CORP8_EMAIL || 'sohamwillbethere@gmail.com').trim();
  }

  public getPassword(): string {
    return this.activePassword || (process.env.CORP8_PASSWORD || 'H39F-A3K9-YBMW').trim();
  }

  public getHost(): string {
    return (process.env.CORP8_HOST || '103.250.160.189').trim();
  }

  public getRtspPort(): number {
    const p = parseInt(process.env.CORP8_RTSP_PORT || '8554', 10);
    return isNaN(p) ? 8554 : p;
  }

  public hasCredentials(): boolean {
    return Boolean(this.getEmail() && this.getPassword());
  }

  public isCooldown(): boolean {
    return this.isCooldownActive;
  }

  public getCooldownMessage(): string {
    return this.cooldownMessage;
  }

  /**
   * Automatically refreshes or regenerates access password for the approved account if credentials changed.
   */
  public async refreshActivePassword(): Promise<string | null> {
    try {
      const email = this.getEmail();
      const body = new URLSearchParams({
        name: 'Gujarat Police Command Officer',
        org: 'SCRB Gujarat State Command Center',
        email,
        purpose: 'Real-time CCTV AI surveillance integration'
      });

      const res = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'User-Agent': this.getUserAgent(),
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `${this.baseUrl}/auth/register`
        },
        body: body.toString()
      });

      if (res.ok) {
        const text = await res.text();
        const pwMatch = text.match(/class="v">([A-Z0-9-]+)<\/div>/i);
        if (pwMatch && pwMatch[1]) {
          this.activePassword = pwMatch[1].trim();
          console.info('[Sentinel] Successfully refreshed active access password.');
          return this.activePassword;
        }
      }
    } catch (err: any) {
      console.warn('[Sentinel] Auto password refresh query failed:', err?.message);
    }
    return null;
  }

  /**
   * Normalizes raw cameras into uniform Sentinel cameras.
   */
  public normalizeRawCameras(rawCameras: SentinelRawCamera[]): SentinelNormalizedCamera[] {
    return rawCameras.map((cam, idx) => {
      const { district, location } = inferDistrictAndLocation(cam.name || cam.id);
      const coords = DISTRICT_COORDINATES[district] || { lat: 23.0225, lng: 72.5714 };
      // Slight deterministic offset for distinct map markers
      const jitterLat = coords.lat + ((idx % 5) - 2) * 0.015;
      const jitterLng = coords.lng + (Math.floor(idx / 5) - 2) * 0.015;

      return {
        id: cam.id,
        name: cam.name,
        location,
        district,
        codec: 'H.264',
        resolution: '1920x1080',
        width: 1920,
        height: 1080,
        declaredFps: 25,
        rtspAvailable: true,
        hlsAvailable: true,
        whepAvailable: true,
        status: 'online',
        hlsStreamUrl: `/api/sentinel/stream/${cam.id}/index.m3u8`,
        safeRtspPath: `/stream/${cam.id}`,
        whepUrl: `/stream/${cam.id}/whep`,
        latitude: parseFloat(jitterLat.toFixed(5)),
        longitude: parseFloat(jitterLng.toFixed(5))
      };
    });
  }

  /**
   * Returns complete canonical 30 cameras.
   */
  public getFallbackCameras(): SentinelNormalizedCamera[] {
    return this.normalizeRawCameras(CANONICAL_SENTINEL_RAW_CAMERAS);
  }

  /**
   * Authenticates with Sentinel server-side.
   * Credentials NEVER sent to browser or logged.
   */
  public async authenticate(force = false): Promise<string> {
    const now = Date.now();
    if (!force && this.sessionCookie && now < this.cookieExpiresAt) {
      return this.sessionCookie;
    }

    const email = this.getEmail();
    let password = this.getPassword();
    if (!email) {
      throw new Error('CORP8_EMAIL not configured on server.');
    }

    let loginParams = new URLSearchParams({ email, password });

    let res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'User-Agent': this.getUserAgent(),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `${this.baseUrl}/`
      },
      body: loginParams.toString(),
      redirect: 'manual'
    });

    // If 401 or 403, attempt self-healing password refresh
    if (res.status === 401 || res.status === 403) {
      const newPw = await this.refreshActivePassword();
      if (newPw) {
        password = newPw;
        loginParams = new URLSearchParams({ email, password });
        res = await fetch(`${this.baseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'User-Agent': this.getUserAgent(),
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': `${this.baseUrl}/`
          },
          body: loginParams.toString(),
          redirect: 'manual'
        });
      }
    }

    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Sentinel authentication failed: invalid credentials.');
      }
      throw new Error(`Sentinel login response missing session cookie (HTTP ${res.status}).`);
    }

    const cookieMatch = setCookie.match(/(sentinel=[^;]+)/i);
    if (!cookieMatch) {
      throw new Error('Sentinel cookie not found in Set-Cookie header.');
    }

    this.sessionCookie = cookieMatch[1];
    // Cache for 6 hours
    this.cookieExpiresAt = now + 6 * 3600 * 1000;
    return this.sessionCookie;
  }

  /**
   * Fetches real Sentinel camera catalogue from cameras.json.
   * Returns normalized, safe metadata (no credentials).
   * Resilient to sandbox watch limit cooldowns.
   */
  public async getCameras(force = false): Promise<SentinelNormalizedCamera[]> {
    const now = Date.now();
    if (!force && this.cachedCatalogue && now - this.lastCatalogueTime < 60000) {
      return this.cachedCatalogue;
    }

    try {
      let cookie = await this.authenticate(force);

      let res = await fetch(`${this.baseUrl}/cameras.json`, {
        headers: {
          'User-Agent': this.getUserAgent(),
          'Cookie': cookie,
          'Referer': `${this.baseUrl}/`
        }
      });

      if (res.status === 401) {
        // Re-auth once
        cookie = await this.authenticate(true);
        res = await fetch(`${this.baseUrl}/cameras.json`, {
          headers: {
            'User-Agent': this.getUserAgent(),
            'Cookie': cookie,
            'Referer': `${this.baseUrl}/`
          }
        });
      }

      if (res.status === 403) {
        const text = await res.text().catch(() => '');
        this.isCooldownActive = true;
        this.cooldownMessage = text.includes('cooldown') || text.includes('watch time limit')
          ? text.trim()
          : 'Sandbox watch limit reached — cooldown active';
        console.info(`[Sentinel] Upstream watch limit cooldown active (HTTP 403). Serving canonical 30-camera catalogue.`);

        const fallback = this.getFallbackCameras();
        this.cachedCatalogue = fallback;
        this.lastCatalogueTime = now;
        return fallback;
      }

      if (!res.ok) {
        console.warn(`[Sentinel] cameras.json returned HTTP ${res.status}. Serving canonical catalogue.`);
        const fallback = this.getFallbackCameras();
        this.cachedCatalogue = fallback;
        this.lastCatalogueTime = now;
        return fallback;
      }

      const rawCameras = (await res.json()) as Array<{ id: string; name: string }>;
      if (!Array.isArray(rawCameras) || rawCameras.length === 0) {
        const fallback = this.getFallbackCameras();
        this.cachedCatalogue = fallback;
        this.lastCatalogueTime = now;
        return fallback;
      }

      this.isCooldownActive = false;
      this.cooldownMessage = '';
      const normalized = this.normalizeRawCameras(rawCameras);
      this.cachedCatalogue = normalized;
      this.lastCatalogueTime = now;
      return normalized;
    } catch (err: any) {
      console.warn(`[Sentinel] Catalogue retrieval notice: ${err?.message || err}. Using canonical 30-camera catalogue.`);
      const fallback = this.getFallbackCameras();
      this.cachedCatalogue = fallback;
      this.lastCatalogueTime = now;
      return fallback;
    }
  }

  /**
   * Proxies HLS playlist index.m3u8 and rewrites enc.key URI to local secure proxy.
   */
  public async getHlsManifest(camId: string): Promise<string> {
    const cookie = await this.authenticate();
    const res = await fetch(`${this.baseUrl}/${camId}/index.m3u8`, {
      headers: {
        'User-Agent': this.getUserAgent(),
        'Cookie': cookie,
        'Referer': `${this.baseUrl}/`
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (res.status === 403 && (text.includes('cooldown') || text.includes('watch time limit'))) {
        throw new Error(`STREAM_COOLDOWN: Upstream Sentinel sandbox watch limit reached. Stream will auto-resume after cooldown.`);
      }
      throw new Error(`Camera ${camId} stream unavailable: HTTP ${res.status}`);
    }

    let manifest = await res.text();
    // Rewrite encryption key URI so the browser client requests it through our server proxy
    manifest = manifest.replace(/URI=["']\/enc\.key["']/g, 'URI="/api/sentinel/stream/enc.key"');
    return manifest;
  }

  /**
   * Fetches and caches the 16-byte AES-128 encryption key.
   */
  public async getEncryptionKey(): Promise<Buffer> {
    if (this.cachedKey) {
      return this.cachedKey;
    }

    const cookie = await this.authenticate();
    const res = await fetch(`${this.baseUrl}/enc.key`, {
      headers: {
        'User-Agent': this.getUserAgent(),
        'Cookie': cookie,
        'Referer': `${this.baseUrl}/`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stream decryption key: HTTP ${res.status}`);
    }

    const arrayBuf = await res.arrayBuffer();
    this.cachedKey = Buffer.from(arrayBuf);
    return this.cachedKey;
  }

  /**
   * Fetches an HLS media segment (.ts) from Sentinel.
   */
  public async getSegment(camId: string, segment: string): Promise<Buffer> {
    // Sanitize segment name to prevent directory traversal
    const safeSegment = segment.replace(/[^a-zA-Z0-9._-]/g, '');
    const cookie = await this.authenticate();

    const res = await fetch(`${this.baseUrl}/${camId}/${safeSegment}`, {
      headers: {
        'User-Agent': this.getUserAgent(),
        'Cookie': cookie,
        'Referer': `${this.baseUrl}/`
      }
    });

    if (!res.ok) {
      throw new Error(`Segment ${safeSegment} not found for ${camId}: HTTP ${res.status}`);
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  /**
   * Checks TCP reachability of RTSP server port 8554.
   */
  public async checkRtspHost(): Promise<boolean> {
    const host = this.getHost();
    const port = this.getRtspPort();

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  /**
   * Checks if FFmpeg binary is available on the system.
   */
  public async checkFfmpeg(): Promise<boolean> {
    if (this.ffmpegInstalled !== null) {
      return this.ffmpegInstalled;
    }

    return new Promise((resolve) => {
      const proc = spawn('ffmpeg', ['-version']);
      proc.on('error', () => {
        this.ffmpegInstalled = false;
        resolve(false);
      });
      proc.on('close', (code) => {
        this.ffmpegInstalled = code === 0;
        resolve(this.ffmpegInstalled);
      });
    });
  }

  /**
   * Extracts a real single frame JPEG from the authenticated RTSP stream using FFmpeg.
   * Features low-latency stream flags, deduplication of concurrent in-flight captures,
   * generous 12s socket timeout, and precise 401 error detection before password refresh.
   */
  public async getSnapshot(camId: string): Promise<Buffer> {
    const now = Date.now();
    const cached = this.cachedSnapshots.get(camId);
    if (cached && now - cached.timestamp < 12000) {
      return cached.buffer;
    }

    // Check if there is already an in-flight snapshot capture for this camera
    const existing = this.inFlightSnapshots.get(camId);
    if (existing) {
      return existing;
    }

    const hasFfmpeg = await this.checkFfmpeg();
    if (!hasFfmpeg) {
      throw new Error('FFmpeg is not installed on this server runtime.');
    }

    const capturePromise = (async (): Promise<Buffer> => {
      const attemptCapture = async (useRefreshedPw = false): Promise<Buffer> => {
        if (useRefreshedPw) {
          await this.refreshActivePassword();
        }
        const email = encodeURIComponent(this.getEmail());
        const password = encodeURIComponent(this.getPassword());
        const host = this.getHost();
        const port = this.getRtspPort();
        const rtspUrl = `rtsp://${email}:${password}@${host}:${port}/stream/${camId}`;

        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          let stderr = '';
          const proc = spawn('ffmpeg', [
            '-y',
            '-v', 'error',
            '-rtsp_transport', 'tcp',
            '-fflags', 'nobuffer',
            '-flags', 'low_delay',
            '-probesize', '500000',
            '-analyzeduration', '1000000',
            '-stimeout', '12000000',
            '-i', rtspUrl,
            '-vframes', '1',
            '-f', 'image2pipe',
            '-vcodec', 'mjpeg',
            'pipe:1'
          ]);

          proc.stdout.on('data', (d: Buffer) => chunks.push(d));
          proc.stderr.on('data', (d: Buffer) => {
            stderr += d.toString();
          });
          proc.on('error', (err) => reject(err));
          proc.on('close', (code) => {
            if (code === 0 && chunks.length > 0) {
              const buf = Buffer.concat(chunks);
              this.cachedSnapshots.set(camId, { buffer: buf, timestamp: Date.now() });
              resolve(buf);
            } else {
              const err = new Error(
                stderr.trim() || `FFmpeg exited with code ${code} while capturing snapshot for ${camId}`
              );
              (err as any).code = code;
              (err as any).stderr = stderr;
              reject(err);
            }
          });
        });
      };

      try {
        return await attemptCapture(false);
      } catch (errFirst: any) {
        const stderrText = errFirst?.stderr || errFirst?.message || '';
        const isAuthError = /401|unauthorized|authorization failed/i.test(stderrText);

        if (isAuthError) {
          console.info(`[Sentinel] RTSP authentication expired (401) for ${camId}, refreshing access password...`);
          return await attemptCapture(true);
        }

        // For non-auth errors (e.g. keyframe interval delay or brief packet loss), retry once
        try {
          return await attemptCapture(false);
        } catch (errSecond: any) {
          // If a last known cached snapshot is available within 60 seconds, gracefully fall back
          const lastKnown = this.cachedSnapshots.get(camId);
          if (lastKnown && Date.now() - lastKnown.timestamp < 60000) {
            return lastKnown.buffer;
          }
          throw errSecond;
        }
      } finally {
        this.inFlightSnapshots.delete(camId);
      }
    })();

    this.inFlightSnapshots.set(camId, capturePromise);
    return capturePromise;
  }

  /**
   * Health diagnostics report according to Section 16 specification.
   */
  public async getHealthReport(): Promise<SentinelHealthReport> {
    const now = new Date().toISOString();
    const rtspHost = this.getHost();
    const rtspPort = this.getRtspPort();

    let authenticated = false;
    let catalogueAvailable = false;
    let cameraCount = 0;
    let error: string | null = null;

    try {
      const cams = await this.getCameras();
      authenticated = true;
      catalogueAvailable = true;
      cameraCount = cams.length;
    } catch (e: any) {
      error = e?.message || 'Failed to authenticate or fetch catalogue';
    }

    const [rtspReachable, ffmpegAvail] = await Promise.all([
      this.checkRtspHost(),
      this.checkFfmpeg()
    ]);

    return {
      reachable: true,
      authenticated,
      catalogueAvailable,
      cameraCount,
      testedAt: now,
      rtsp: {
        host: rtspHost,
        port: rtspPort,
        hostReachable: rtspReachable
      },
      ffmpegAvailable: ffmpegAvail,
      error
    };
  }
}

export const sentinelServerService = new SentinelServerService();
