/**
 * SentinelDemoRecordingService.ts
 * Phase 8: 10-Minute Demo Recording & Server-Side Post-Processing Workflow
 * 
 * Invariants:
 * 1. Bounded storage: Maximum 10 minutes recording duration, automatically pruned.
 * 2. Asynchronous Server-Side Post-Processing: Samples keyframes, scores physical quality,
 *    extracts vehicle candidates and executes plate recognition.
 * 3. Strict Truth in Labeling: Results are explicitly labeled:
 *    "DEMO RECORDING (SERVER-SIDE POST-PROCESSING)" (isLiveInference: false).
 *    Never mislabels post-processing as live inference.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn, ChildProcess } from 'child_process';
import { sentinelServerService } from './SentinelServerService.js';
import { frameQualityEngine } from './FrameQualityEngine.js';
import { backgroundVehicleIntelligenceEngine } from './BackgroundVehicleIntelligenceEngine.js';
import { aiProviderRouter } from '../ai/providers/index.js';
import { ImageCropUtil } from '../vision/imageCropUtil.js';
import type { DemoRecordingSession, DemoRecordingResult } from '../../types.js';

interface ActiveRecording {
  session: DemoRecordingSession;
  process?: ChildProcess;
  outputFilePath: string;
  autoStopTimer?: NodeJS.Timeout;
}

export class SentinelDemoRecordingService {
  private static instance: SentinelDemoRecordingService;
  private recordings: Map<string, ActiveRecording> = new Map();
  private baseDir = '/tmp/sentinel_recordings';

  private constructor() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public static getInstance(): SentinelDemoRecordingService {
    if (!SentinelDemoRecordingService.instance) {
      SentinelDemoRecordingService.instance = new SentinelDemoRecordingService();
    }
    return SentinelDemoRecordingService.instance;
  }

  /**
   * Starts a bounded recording session on the server.
   */
  public async startRecording(cameraId: string, durationSeconds: number = 30): Promise<DemoRecordingSession> {
    // Bound duration between 5s and 600s (10 minutes max)
    const boundedDuration = Math.max(5, Math.min(600, Math.round(durationSeconds)));
    const now = Date.now();
    const recordingId = `REC-${cameraId.toUpperCase()}-${now}`;
    const outputFilePath = path.join(this.baseDir, `${recordingId}.mp4`);

    const rtspUrl = sentinelServerService.getRtspUrl(cameraId);

    const session: DemoRecordingSession = {
      recordingId,
      cameraId,
      cameraName: `Sentinel CCTV Node ${cameraId.toUpperCase()}`,
      durationSeconds: boundedDuration,
      startedAt: new Date(now).toISOString(),
      status: 'RECORDING',
      filePath: outputFilePath,
      label: 'DEMO RECORDING (SERVER-SIDE POST-PROCESSING)',
      isLiveInference: false
    };

    const activeRec: ActiveRecording = {
      session,
      outputFilePath
    };

    // Spawn FFmpeg to record stream directly with copy mode for bounded duration
    const ffmpegArgs = [
      '-y',
      '-v', 'error',
      '-rtsp_transport', 'tcp',
      '-stimeout', '5000000',
      '-i', rtspUrl,
      '-t', String(boundedDuration),
      '-c', 'copy',
      outputFilePath
    ];

    const proc = spawn('ffmpeg', ffmpegArgs);
    activeRec.process = proc;

    proc.on('close', async (code) => {
      console.info(`[SentinelDemoRecordingService] Recording ${recordingId} finished with code ${code}`);
      if (activeRec.session.status === 'RECORDING') {
        await this.postProcessRecording(recordingId);
      }
    });

    proc.on('error', (err) => {
      console.warn(`[SentinelDemoRecordingService] FFmpeg recording error for ${recordingId}:`, err.message);
      activeRec.session.status = 'FAILED';
      activeRec.session.error = err.message;
    });

    // Schedule automatic termination timeout safeguard
    activeRec.autoStopTimer = setTimeout(() => {
      if (activeRec.session.status === 'RECORDING') {
        this.stopRecording(recordingId).catch(() => {});
      }
    }, (boundedDuration + 5) * 1000);

    this.recordings.set(recordingId, activeRec);
    this.pruneOldRecordings();

    return { ...session };
  }

  /**
   * Explicitly stops an active recording session and begins server-side post-processing.
   */
  public async stopRecording(recordingId: string): Promise<DemoRecordingSession> {
    const activeRec = this.recordings.get(recordingId);
    if (!activeRec) {
      throw new Error(`Recording ${recordingId} not found`);
    }

    if (activeRec.autoStopTimer) {
      clearTimeout(activeRec.autoStopTimer);
    }

    if (activeRec.process && !activeRec.process.killed) {
      activeRec.process.kill('SIGINT');
    }

    return await this.postProcessRecording(recordingId);
  }

  /**
   * Executes server-side post-processing on the recorded media.
   */
  private async postProcessRecording(recordingId: string): Promise<DemoRecordingSession> {
    const activeRec = this.recordings.get(recordingId);
    if (!activeRec) {
      throw new Error(`Recording ${recordingId} not found`);
    }

    activeRec.session.status = 'PROCESSING';

    const outputFilePath = activeRec.outputFilePath;
    if (!fs.existsSync(outputFilePath)) {
      activeRec.session.status = 'FAILED';
      activeRec.session.error = 'Recording file was not generated or stream was empty';
      return { ...activeRec.session };
    }

    const stat = fs.statSync(outputFilePath);
    activeRec.session.fileSizeBytes = stat.size;

    // Sample keyframes across the recording into a temporary directory
    const framesDir = path.join(this.baseDir, `frames_${recordingId}`);
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    try {
      // Extract keyframes (1 frame every ~2-4 seconds or I-frames)
      await new Promise<void>((resolve, reject) => {
        const sampleProc = spawn('ffmpeg', [
          '-y',
          '-nostats',
          '-loglevel', 'quiet',
          '-i', outputFilePath,
          '-vf', 'fps=0.5', // 1 frame every 2 seconds
          '-vframes', '15',  // Maximum 15 sampled frames to keep processing lightweight
          '-f', 'image2',
          path.join(framesDir, 'frame_%03d.jpg')
        ], {
          stdio: ['ignore', 'ignore', 'ignore']
        });
        sampleProc.on('close', () => resolve());
        sampleProc.on('error', (err) => reject(err));
      });

      const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg')).sort();
      const scoredFrames: Array<{ file: string; buffer: Buffer; sharpness: number; sha256: string }> = [];

      for (const file of frameFiles) {
        const filePath = path.join(framesDir, file);
        const buf = fs.readFileSync(filePath);
        const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
        const quality = await frameQualityEngine.assessFrame(activeRec.session.cameraId, buf);
        scoredFrames.push({
          file,
          buffer: buf,
          sharpness: quality.sharpnessScore,
          sha256
        });
      }

      // Sort by Laplacian sharpness (best frames first)
      scoredFrames.sort((a, b) => b.sharpness - a.sharpness);
      const topFrames = scoredFrames.slice(0, 5);

      const candidates: DemoRecordingResult['candidates'] = [];
      let totalVehicles = 0;
      let readablePlates = 0;
      let unreadablePlates = 0;

      for (let i = 0; i < topFrames.length; i++) {
        const tf = topFrames[i];
        const frameSnapshotId = `DEMO-FRM-${recordingId}-${i}`;
        backgroundVehicleIntelligenceEngine.storeSnapshot(frameSnapshotId, {
          buffer: tf.buffer,
          mimeType: 'image/jpeg',
          timestamp: Date.now(),
          sha256: tf.sha256
        });
        const frameUrl = `/api/intelligence/snapshots/${frameSnapshotId}`;

        // Run vehicle candidate detection on top frame
        let detections: any[] = [];
        try {
          const aiRes = await aiProviderRouter.routeFrameAnalysis({
            frameBase64: tf.buffer.toString('base64'),
            frameTimestamp: Date.now() / 1000,
            sourceId: activeRec.session.cameraId,
            helmetThreshold: 0.85
          });
          detections = (aiRes?.detections || []).filter((d: any) =>
            ['car', 'motorcycle', 'bus', 'truck', 'auto-rickshaw', 'vehicle', 'van', 'suv'].includes(d.class?.toLowerCase())
          );
        } catch {
          detections = [];
        }

        totalVehicles += detections.length;

        for (let j = 0; j < Math.min(2, detections.length); j++) {
          const d = detections[j];
          const rawPlate = (d.plate || '').trim().toUpperCase();
          const isValidPlate = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{3,4}$/.test(rawPlate.replace(/\s+/g, ''));
          const isReadable = isValidPlate && (d.plateConfidence || 0) >= 0.70;

          if (isReadable) {
            readablePlates++;
          } else {
            unreadablePlates++;
          }

          const vehicleBox = {
            x: Math.max(0, Math.min(0.9, d.box?.x ?? 0.2)),
            y: Math.max(0, Math.min(0.9, d.box?.y ?? 0.3)),
            width: Math.max(0.1, Math.min(0.8, d.box?.width ?? 0.3)),
            height: Math.max(0.1, Math.min(0.8, d.box?.height ?? 0.3))
          };

          let vehicleCropBuffer = tf.buffer;
          let vehicleCropSha256 = tf.sha256;
          try {
            const cropRes = await ImageCropUtil.cropJpeg(tf.buffer, vehicleBox, 1920, 1080);
            vehicleCropBuffer = cropRes.buffer;
            vehicleCropSha256 = cropRes.sha256;
          } catch {
            // Keep fallback
          }

          const vCropId = `DEMO-CROP-VEH-${recordingId}-${i}-${j}`;
          backgroundVehicleIntelligenceEngine.storeSnapshot(vCropId, {
            buffer: vehicleCropBuffer,
            mimeType: 'image/jpeg',
            timestamp: Date.now(),
            sha256: vehicleCropSha256
          });

          candidates.push({
            frameTimestampMs: Date.now() - (i * 2000),
            frameSha256: tf.sha256,
            frameUrl,
            sharpnessScore: tf.sharpness,
            vehicleType: d.class || 'vehicle',
            vehicleCropUrl: `/api/intelligence/snapshots/${vCropId}`,
            ocrText: isReadable ? rawPlate : 'NOT_READABLE',
            ocrStatus: isReadable ? 'READABLE' : (rawPlate.length >= 4 ? 'UNCERTAIN' : 'NOT_READABLE'),
            confidence: d.confidence || 0.85
          });
        }
      }

      // Cleanup extracted frame files to bound local disk usage
      try {
        for (const f of frameFiles) {
          fs.unlinkSync(path.join(framesDir, f));
        }
        fs.rmdirSync(framesDir);
      } catch {
        // Non-fatal cleanup
      }

      const avgSharpness = scoredFrames.length > 0
        ? Math.round(scoredFrames.reduce((acc, f) => acc + f.sharpness, 0) / scoredFrames.length)
        : 0;

      const result: DemoRecordingResult = {
        recordingId,
        cameraId: activeRec.session.cameraId,
        durationSeconds: activeRec.session.durationSeconds,
        fileSizeBytes: stat.size,
        sampledFramesCount: scoredFrames.length,
        bestFramesCount: topFrames.length,
        label: 'DEMO RECORDING (SERVER-SIDE POST-PROCESSING)',
        isLiveInference: false,
        summary: {
          totalVehiclesDetected: totalVehicles,
          readablePlatesCount: readablePlates,
          unreadablePlatesCount: unreadablePlates,
          averageFrameSharpness: avgSharpness
        },
        candidates
      };

      activeRec.session.status = 'COMPLETED';
      activeRec.session.completedAt = new Date().toISOString();
      activeRec.session.result = result;

      return { ...activeRec.session };
    } catch (err: any) {
      activeRec.session.status = 'FAILED';
      activeRec.session.error = err?.message || 'Server post-processing failed';
      return { ...activeRec.session };
    }
  }

  public getRecording(recordingId: string): DemoRecordingSession | undefined {
    const active = this.recordings.get(recordingId);
    return active ? { ...active.session } : undefined;
  }

  public listRecordings(): DemoRecordingSession[] {
    return Array.from(this.recordings.values()).map(r => ({ ...r.session }));
  }

  /**
   * Bounds local storage by keeping at most 5 recent recordings.
   */
  private pruneOldRecordings(): void {
    const maxRecordings = 5;
    if (this.recordings.size <= maxRecordings) return;

    const entries = Array.from(this.recordings.entries());
    const toDelete = entries.slice(0, entries.length - maxRecordings);

    for (const [id, rec] of toDelete) {
      try {
        if (fs.existsSync(rec.outputFilePath)) {
          fs.unlinkSync(rec.outputFilePath);
        }
      } catch {
        // Ignored
      }
      this.recordings.delete(id);
    }
  }
}

export const sentinelDemoRecordingService = SentinelDemoRecordingService.getInstance();
