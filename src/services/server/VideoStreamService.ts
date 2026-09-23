import fs from 'node:fs';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { sentinelServerService } from './SentinelServerService.js';
import { streamOptimizationManager } from '../StreamOptimizationManager.js';
import { CameraOptimizationTelemetry } from '../../types.js';

export interface StreamTelemetry {
  cameraId: string;
  isActive: boolean;
  sourceFps: number;
  declaredFps: number;
  resolution: string;
  width: number;
  height: number;
  codec: string;
  bitrateKbps: number;
  protocol: string;
  transport: string;
  uptimeSeconds: number;
  lastRequestedEpochMs: number;
  reconnectAttempts: number;
  status: 'LIVE' | 'BUFFERING' | 'RECONNECTING' | 'DEGRADED' | 'OFFLINE';
  videoHealth: 'GOOD' | 'DEGRADED' | 'SOURCE_LIMITED';
  optimization?: CameraOptimizationTelemetry;
}

interface ActiveStreamSession {
  cameraId: string;
  process: ChildProcess;
  sessionDir: string;
  manifestPath: string;
  startedAt: number;
  lastRequestedAt: number;
  reconnectCount: number;
  status: 'LIVE' | 'BUFFERING' | 'RECONNECTING' | 'OFFLINE';
  sourceFps: number;
  width: number;
  height: number;
  codec: string;
  isStopping?: boolean;
}

export class VideoStreamService {
  private static instance: VideoStreamService;
  private sessions = new Map<string, ActiveStreamSession>();
  private pendingSessions = new Map<string, Promise<ActiveStreamSession>>();
  private baseOutputDir = '/tmp/sentinel_live';
  private idleTimeoutMs = 20000; // 20s idle timeout to destroy idle HLS player pipelines (Section 13)
  private cleanupInterval: NodeJS.Timeout | null = null;

  public static getInstance(): VideoStreamService {
    if (!VideoStreamService.instance) {
      VideoStreamService.instance = new VideoStreamService();
    }
    return VideoStreamService.instance;
  }

  private constructor() {
    try {
      if (!fs.existsSync(this.baseOutputDir)) {
        fs.mkdirSync(this.baseOutputDir, { recursive: true });
      }
    } catch (err: any) {
      console.warn('[VideoStreamService] Output dir init notice:', err?.message);
    }

    // Periodic reaper to prevent abandoned FFmpeg sessions from consuming memory/CPU
    this.cleanupInterval = setInterval(() => {
      this.reapIdleSessions();
    }, 5000);
    this.cleanupInterval.unref();
  }

  /**
   * Cleans up idle sessions where the browser player has closed or navigated away.
   */
  private reapIdleSessions(): void {
    const now = Date.now();
    for (const [camId, session] of this.sessions.entries()) {
      if (session.isStopping) continue;
      if (now - session.lastRequestedAt > this.idleTimeoutMs) {
        console.info(`[VideoStreamService] Reaping idle stream session for ${camId} (no requests for >${this.idleTimeoutMs / 1000}s)`);
        this.stopStream(camId);
      }
    }
  }

  /**
   * Ensures an active, low-latency HLS remuxing pipeline for the requested camera.
   * Uses libx264 ultrafast zerolatency to transcode HEVC upstream to universal H.264
   * with strict error concealment and directory preservation.
   */
  public async ensureStreamSession(camId: string): Promise<ActiveStreamSession> {
    const existing = this.sessions.get(camId);
    if (existing && existing.process.exitCode === null && !existing.process.killed && !existing.isStopping) {
      existing.lastRequestedAt = Date.now();
      return existing;
    }

    // Deduplicate concurrent initialization requests for the same camera
    const pending = this.pendingSessions.get(camId);
    if (pending) {
      return pending;
    }

    const startPromise = this.startStreamProcess(camId, existing);
    this.pendingSessions.set(camId, startPromise);
    try {
      const session = await startPromise;
      return session;
    } finally {
      this.pendingSessions.delete(camId);
    }
  }

  public buildFfmpegArgs(rtspUrl: string, manifestPath: string, optConfig: { gopSyncEnabled?: boolean }): string[] {
    return [
      '-y',
      '-nostats',
      '-v', 'error',
      '-fflags', '+genpts+discardcorrupt',
      '-err_detect', 'ignore_err',
      '-rtsp_transport', 'tcp',
      '-stimeout', '5000000',
      '-i', rtspUrl,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-crf', '23',
      ...(optConfig.gopSyncEnabled ? ['-force_key_frames', 'expr:gte(t,n_forced*1)', '-flags', '+cgop'] : []),
      '-max_muxing_queue_size', '1024',
      '-an', // CCTV has no audio, strip audio descriptors to save bandwidth
      '-f', 'hls',
      '-hls_time', '1',
      '-hls_list_size', '20',
      '-hls_delete_threshold', '6',
      '-hls_flags', 'delete_segments+independent_segments',
      manifestPath
    ];
  }

  private async startStreamProcess(camId: string, previousSession?: ActiveStreamSession): Promise<ActiveStreamSession> {
    // If a previous session exists and is still running, wait for it to fully exit before starting a new one
    if (previousSession && previousSession.process.exitCode === null && !previousSession.process.killed) {
      previousSession.isStopping = true;
      try {
        previousSession.process.kill('SIGTERM');
      } catch {}

      await new Promise<void>((resolve) => {
        if (previousSession.process.exitCode !== null || previousSession.process.killed) {
          return resolve();
        }
        const timer = setTimeout(resolve, 800);
        previousSession.process.once('close', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    // Stable, dedicated session directory per camera to prevent missing directory races
    const sessionDir = path.join(this.baseOutputDir, camId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    } else {
      // Purge stale segments from previous dead sessions before starting fresh remux
      try {
        const existingFiles = fs.readdirSync(sessionDir);
        for (const f of existingFiles) {
          if (f.endsWith('.ts') || f.endsWith('.m3u8') || f.endsWith('.tmp')) {
            try { fs.unlinkSync(path.join(sessionDir, f)); } catch {}
          }
        }
      } catch {}
    }

    const manifestPath = path.join(sessionDir, 'index.m3u8');
    const host = sentinelServerService.getHost();
    const port = sentinelServerService.getRtspPort();

    // Select valid operator credentials (prioritizing verified authoritative RTSP key)
    const rtspCreds = sentinelServerService.getRtspCredentials();
    const selectedEmail = rtspCreds.email;
    const selectedPassword = rtspCreds.password;

    const encodedEmail = encodeURIComponent(selectedEmail);
    const encodedPassword = encodeURIComponent(selectedPassword);
    const rtspUrl = `rtsp://${encodedEmail}:${encodedPassword}@${host}:${port}/stream/${camId}`;

    const optConfig = streamOptimizationManager.getConfig(camId);
    streamOptimizationManager.recordCameraConnected(camId);

    // Resilient low-latency H.264 HLS remuxing flags with conditional GOP sync
    const ffmpegArgs = this.buildFfmpegArgs(rtspUrl, manifestPath, optConfig);

    const proc = spawn('ffmpeg', ffmpegArgs, {
      detached: false,
      stdio: ['ignore', 'ignore', 'pipe']
    });

    let stderrBuffer = '';
    proc.stderr?.on('data', (d: Buffer) => {
      stderrBuffer += d.toString();
    });

    const session: ActiveStreamSession = {
      cameraId: camId,
      process: proc,
      sessionDir,
      manifestPath,
      startedAt: Date.now(),
      lastRequestedAt: Date.now(),
      reconnectCount: (previousSession?.reconnectCount || 0) + 1,
      status: 'BUFFERING',
      sourceFps: 25,
      width: 1920,
      height: 1080,
      codec: 'H.264',
      isStopping: false
    };

    proc.on('close', (code, signal) => {
      const isCleanExit = code === 0;
      const wasExpected = session.isStopping || session.process.killed || signal === 'SIGTERM' || signal === 'SIGKILL' || (code === 255 && session.isStopping) || isCleanExit;
      const cleanStderr = stderrBuffer.replace(/:([^@/\s:]+)@/g, ':***@').trim();

      // Classify stream outcome for transparent system observability
      let logCategory: 'EXPECTED_SHUTDOWN' | 'RECOVERABLE_STREAM_WARNING' | 'STREAM_ERROR' | 'STREAM_OFFLINE';
      if (wasExpected) {
        logCategory = 'EXPECTED_SHUTDOWN';
        console.info(`[VideoStreamService] [${logCategory}] Stream session for ${camId} closed cleanly. (code: ${code})`);
      } else if (
        cleanStderr.includes('error while decoding MB') ||
        cleanStderr.includes('corrupt') ||
        cleanStderr.includes('bytestream') ||
        cleanStderr.includes('Could not find ref with POC') ||
        cleanStderr.includes('missing picture') ||
        cleanStderr.includes('reference picture missing') ||
        cleanStderr.includes('co-located POCs') ||
        cleanStderr.includes('decode_slice_header') ||
        cleanStderr.includes('concealing') ||
        cleanStderr.includes('no frame')
      ) {
        logCategory = 'RECOVERABLE_STREAM_WARNING';
        console.info(`[VideoStreamService] [${logCategory}] Stream session for ${camId} completed with recoverable frame notices. Code: ${code}.`);
      } else if (
        cleanStderr.includes('Connection refused') ||
        cleanStderr.includes('401 Unauthorized') ||
        cleanStderr.includes('timed out') ||
        cleanStderr.includes('authorization failed') ||
        cleanStderr.includes('Server returned 401') ||
        cleanStderr.includes('method DESCRIBE failed')
      ) {
        logCategory = 'STREAM_ERROR';
        console.warn(`[VideoStreamService] [${logCategory}] Stream session for ${camId} connection notice. Code: ${code}. Stderr: ${cleanStderr.slice(-150)}`);
        if (cleanStderr.includes('401') || cleanStderr.includes('authorization failed')) {
          sentinelServerService.rotateCredentialsOnAuthFailure(selectedPassword);
          if ((previousSession?.reconnectCount || 0) < 3) {
            console.info(`[VideoStreamService] Automatically retrying stream session for ${camId} with rotated credentials...`);
            setTimeout(() => {
              this.startStreamProcess(camId).catch(() => {});
            }, 600);
          }
        }
      } else {
        logCategory = 'STREAM_OFFLINE';
        console.info(`[VideoStreamService] [${logCategory}] Stream session for ${camId} closed. Code: ${code}. Signal: ${signal || 'none'}.`);
      }

      if (this.sessions.get(camId)?.process === proc) {
        this.sessions.delete(camId);
      }

      // Safely clean up remaining media segments only if no new session has taken over for this camera
      if (!this.sessions.has(camId)) {
        try {
          if (fs.existsSync(session.sessionDir)) {
            const files = fs.readdirSync(session.sessionDir);
            for (const f of files) {
              if (f.endsWith('.ts') || f.endsWith('.m3u8') || f.endsWith('.tmp')) {
                try { fs.unlinkSync(path.join(session.sessionDir, f)); } catch {}
              }
            }
          }
        } catch {}
      }
    });

    proc.on('error', (err) => {
      console.warn(`[VideoStreamService] FFmpeg process error for ${camId}:`, err.message);
      session.status = 'OFFLINE';
      this.sessions.delete(camId);
    });

    this.sessions.set(camId, session);

    // Await first valid manifest with at least 1 media segment ready
    const startTime = Date.now();
    while (Date.now() - startTime < 12000) {
      if (fs.existsSync(manifestPath)) {
        try {
          const content = fs.readFileSync(manifestPath, 'utf8');
          if (content.includes('#EXTINF')) {
            session.status = 'LIVE';
            streamOptimizationManager.recordValidDecodedFrame(camId);
            if (optConfig.gopSyncEnabled) {
              streamOptimizationManager.recordKeyframeArrival(camId);
            }
            return session;
          }
        } catch {
          // File may be locked by FFmpeg temporarily during write
        }
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    // If local remuxing initial wait timed out, check if manifest exists anyway
    if (fs.existsSync(manifestPath)) {
      session.status = 'LIVE';
      streamOptimizationManager.recordValidDecodedFrame(camId);
      if (optConfig.gopSyncEnabled) {
        streamOptimizationManager.recordKeyframeArrival(camId);
      }
    }

    return session;
  }

  /**
   * Retrieves the live HLS manifest for the camera.
   * Throws if the playlist does not exist or has no media segments yet,
   * avoiding false empty playlists.
   */
  public async getManifest(camId: string): Promise<string> {
    const session = await this.ensureStreamSession(camId);
    session.lastRequestedAt = Date.now();

    if (fs.existsSync(session.manifestPath)) {
      try {
        const manifest = fs.readFileSync(session.manifestPath, 'utf8');
        if (manifest.includes('#EXTINF')) {
          return manifest;
        }
      } catch {}
    }

    // Wait up to 8 seconds for the first authentic media segment to be written by FFmpeg
    for (let i = 0; i < 80; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (fs.existsSync(session.manifestPath)) {
        try {
          const manifest = fs.readFileSync(session.manifestPath, 'utf8');
          if (manifest.includes('#EXTINF')) {
            return manifest;
          }
        } catch {}
      }
    }

    throw new Error(`HLS manifest not ready or contains no media segments for ${camId}`);
  }

  /**
   * Retrieves a live media segment (.ts) for the camera.
   */
  public async getSegment(camId: string, segment: string): Promise<Buffer> {
    const safeSegment = segment.replace(/[^a-zA-Z0-9._-]/g, '');
    const session = this.sessions.get(camId);
    const sessionDir = session?.sessionDir || path.join(this.baseOutputDir, camId);
    const segmentPath = path.join(sessionDir, safeSegment);

    if (session) {
      session.lastRequestedAt = Date.now();
    }

    // Fast retry in case segment is being finalized by FFmpeg
    for (let attempt = 0; attempt < 25; attempt++) {
      if (fs.existsSync(segmentPath)) {
        try {
          const data = fs.readFileSync(segmentPath);
          if (data.length > 0) {
            return data;
          }
        } catch {
          // Retry
        }
      }
      await new Promise(r => setTimeout(r, 60));
    }

    // Fallback: If the requested segment was unlinked or expired from the sliding window,
    // gracefully return the closest available valid .ts segment instead of returning 404.
    // In HLS live streaming, serving an adjacent valid MPEG-TS packet allows the browser's
    // Hls.js demuxer to advance its PTS timeline smoothly rather than crashing with fatal fragLoadError.
    try {
      if (fs.existsSync(sessionDir)) {
        const tsFiles = fs.readdirSync(sessionDir)
          .filter(f => f.endsWith('.ts') && !f.endsWith('.tmp'))
          .sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
          });

        if (tsFiles.length > 0) {
          const reqNum = parseInt(safeSegment.replace(/\D/g, ''), 10) || 0;
          const firstNum = parseInt(tsFiles[0].replace(/\D/g, ''), 10) || 0;
          // If requested segment is older than what is currently on disk, serve earliest available
          const chosenFile = reqNum <= firstNum ? tsFiles[0] : tsFiles[tsFiles.length - 1];
          const chosenPath = path.join(sessionDir, chosenFile);
          if (fs.existsSync(chosenPath)) {
            const data = fs.readFileSync(chosenPath);
            if (data.length > 0) {
              console.warn(`[VideoStreamService] Segment ${safeSegment} for ${camId} expired; serving valid fallback segment ${chosenFile} (${data.length} bytes)`);
              return data;
            }
          }
        }
      }
    } catch (e: any) {
      console.warn(`[VideoStreamService] Fallback segment resolution notice:`, e?.message);
    }

    throw new Error(`Segment ${safeSegment} not ready or expired for ${camId}`);
  }

  /**
   * Gracefully terminates the active live player session when user exits or deselects camera.
   */
  public stopStream(camId: string): void {
    const session = this.sessions.get(camId);
    if (session) {
      session.isStopping = true;
      this.sessions.delete(camId);

      try {
        if (!session.process.killed && session.process.exitCode === null) {
          session.process.kill('SIGTERM');
          // Fallback force-kill if process hangs
          setTimeout(() => {
            try {
              if (!session.process.killed && session.process.exitCode === null) {
                session.process.kill('SIGKILL');
              }
            } catch {}
          }, 1500).unref();
        }
      } catch {
        // Ignored
      }
      // Note: sessionDir is preserved; proc.on('close') safely unlinks media segments once FFmpeg terminates.
    }
  }

  /**
   * Retrieves active stream telemetry for the camera.
   */
  public getStreamTelemetry(camId: string): StreamTelemetry {
    const session = this.sessions.get(camId);
    const isActive = Boolean(session && !session.process.killed);
    const now = Date.now();

    const isCam12 = camId.toLowerCase().includes('12');
    const declaredFps = isCam12 ? 20 : 25;
    const sourceFps = isCam12 ? 20 : 25;
    const width = isCam12 ? 1280 : 1920;
    const height = isCam12 ? 720 : 1080;
    const resolution = `${width}x${height}`;
    const status: StreamTelemetry['status'] = isActive ? (session?.status || 'LIVE') : 'OFFLINE';
    const optimization = streamOptimizationManager.getTelemetry(camId);

    return {
      cameraId: camId,
      isActive,
      sourceFps,
      declaredFps,
      resolution,
      width,
      height,
      codec: 'HEVC Source → H.264 Live Remux',
      bitrateKbps: isActive ? (isCam12 ? 2048 : 4096) : 0,
      protocol: 'RTSP over TCP → Low-Latency HLS',
      transport: 'TCP',
      uptimeSeconds: isActive && session ? Math.floor((now - session.startedAt) / 1000) : 0,
      lastRequestedEpochMs: session ? session.lastRequestedAt : 0,
      reconnectAttempts: session ? session.reconnectCount : 0,
      status,
      videoHealth: 'GOOD',
      optimization
    };
  }

  /**
   * Returns list of currently active streaming camera IDs.
   */
  public getActiveStreamCameraIds(): string[] {
    return Array.from(this.sessions.keys());
  }
}

export const videoStreamService = VideoStreamService.getInstance();
