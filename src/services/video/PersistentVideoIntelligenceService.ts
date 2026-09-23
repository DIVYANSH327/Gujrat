/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Persistent Background Video Intelligence Service
 * Gujarat Police CCTV & AI Intelligence Platform (SCRB)
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Decouples video stream acquisition and AI frame analysis from the React UI lifecycle.
 * AI analysis tasks run in module-level background memory and DO NOT terminate when
 * React components unmount, views transition, or tabs switch.
 */

import { 
  PersistentVideoTaskConfig, 
  PersistentVideoTaskState, 
  PersistentVideoTaskMetrics,
  VideoTaskStatus,
  TaskStateListener, 
  GlobalTasksListener 
} from './PersistentVideoIntelligenceTypes.js';
import { CapturedFrame } from './types.js';
import { geminiVisionAgent } from '../ai/IAIVisionAgent.js';
import { RealVisionDetection, RealRoadSafetyEvent } from '../ai/types.js';
import { computeDeterministicHash } from '../GodsEyeService.js';
import { sysEvents, centralRepo } from '../Architecture.js';
import { centralEventBus } from '../CentralEventBus.js';
import { Alert, EvidenceItem, SecurityEventPayload } from '../../types.js';

interface TaskContext {
  config: PersistentVideoTaskConfig;
  state: PersistentVideoTaskState;
  headlessVideo: HTMLVideoElement | null;
  headlessCanvas: HTMLCanvasElement | null;
  sampleTimer: any;
  uptimeTimer: any;
  attachedUiVideo: HTMLVideoElement | null;
  attachedUiCanvas: HTMLCanvasElement | null;
  listeners: Set<TaskStateListener>;
  isBusyAnalyzing: boolean;
  lastSampleSec: number;
  objectUrlToRevoke: string | null;
}

const STORAGE_KEY = 'sentinel_persistent_video_tasks_v1';

export class PersistentVideoIntelligenceService {
  private static instance: PersistentVideoIntelligenceService | null = null;
  private tasks = new Map<string, TaskContext>();
  private globalListeners = new Set<GlobalTasksListener>();
  private isInitialized = false;

  private constructor() {
    this.initializeFromStorage();
  }

  public static getInstance(): PersistentVideoIntelligenceService {
    if (!PersistentVideoIntelligenceService.instance) {
      PersistentVideoIntelligenceService.instance = new PersistentVideoIntelligenceService();
    }
    return PersistentVideoIntelligenceService.instance;
  }

  /**
   * Rehydrate previously registered task configurations from local storage
   */
  private initializeFromStorage(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const savedConfigs: PersistentVideoTaskConfig[] = JSON.parse(stored);
        if (Array.isArray(savedConfigs)) {
          for (const cfg of savedConfigs) {
            // Re-register as IDLE or ready to resume
            if (!this.tasks.has(cfg.taskId)) {
              this.registerTask(cfg);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[PersistentVideoService] Error rehydrating tasks from storage:', e);
    }
  }

  private persistTasksToStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const configsToSave: PersistentVideoTaskConfig[] = [];
      for (const ctx of this.tasks.values()) {
        // Do not persist raw File objects to localStorage (only file names / URLs)
        const safeConfig: PersistentVideoTaskConfig = {
          ...ctx.config,
          sourceMedia: typeof ctx.config.sourceMedia === 'string' ? ctx.config.sourceMedia : undefined
        };
        configsToSave.push(safeConfig);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configsToSave));
    } catch (e) {
      // Storage quota or serialization warning
    }
  }

  /**
   * Register or update a video intelligence task
   */
  public registerTask(config: PersistentVideoTaskConfig): PersistentVideoTaskState {
    const existing = this.tasks.get(config.taskId);
    if (existing) {
      existing.config = { ...existing.config, ...config };
      this.notifyTaskListeners(existing);
      this.notifyGlobalListeners();
      this.persistTasksToStorage();
      return existing.state;
    }

    const initialMetrics: PersistentVideoTaskMetrics = {
      framesAcquired: 0,
      framesAnalyzed: 0,
      framesDroppedConcurrency: 0,
      totalDetections: 0,
      personsDetected: 0,
      carsDetected: 0,
      motorcyclesDetected: 0,
      bicyclesDetected: 0,
      helmetsDetected: 0,
      noHelmetsDetected: 0,
      violationsDetected: 0,
      evidenceCapturedCount: 0,
      alertsGeneratedCount: 0,
      lastAnalysisDurationMs: 0,
      currentVideoTimeSec: 0,
      videoDurationSec: 0,
      startedAt: new Date().toISOString(),
      lastAnalyzedAt: null,
      uptimeSeconds: 0
    };

    const state: PersistentVideoTaskState = {
      config,
      status: 'IDLE',
      metrics: initialMetrics,
      activeAiModel: 'Gemini Vision (Decoupled Background Node)',
      currentDetections: [],
      currentRoadEvents: [],
      recentEvidence: [],
      recentAlerts: [],
      recentEvents: [],
      isUiAttached: false
    };

    let headlessVideo: HTMLVideoElement | null = null;
    let headlessCanvas: HTMLCanvasElement | null = null;

    if (typeof document !== 'undefined') {
      headlessVideo = document.createElement('video');
      headlessVideo.playsInline = true;
      headlessVideo.muted = true; // Required for reliable browser playback
      headlessVideo.loop = config.loop ?? true;
      headlessVideo.preload = 'auto';

      headlessCanvas = document.createElement('canvas');
      headlessCanvas.width = 1280;
      headlessCanvas.height = 720;
    }

    const context: TaskContext = {
      config,
      state,
      headlessVideo,
      headlessCanvas,
      sampleTimer: null,
      uptimeTimer: null,
      attachedUiVideo: null,
      attachedUiCanvas: null,
      listeners: new Set<TaskStateListener>(),
      isBusyAnalyzing: false,
      lastSampleSec: -1,
      objectUrlToRevoke: null
    };

    this.tasks.set(config.taskId, context);
    this.persistTasksToStorage();
    this.notifyGlobalListeners();
    return state;
  }

  /**
   * Start or resume background video acquisition and frame analysis
   */
  public async startTask(taskId: string, mediaOverride?: File | string): Promise<PersistentVideoTaskState> {
    const ctx = this.tasks.get(taskId);
    if (!ctx) {
      throw new Error(`[PersistentVideoService] Task with ID "${taskId}" is not registered.`);
    }

    if (mediaOverride) {
      ctx.config.sourceMedia = mediaOverride;
    }

    ctx.state.status = 'INITIALIZING';
    this.notifyTaskListeners(ctx);
    this.notifyGlobalListeners();

    try {
      // 1. Prepare video source if media is configured
      if (ctx.headlessVideo && ctx.config.sourceMedia) {
        await this.bindMediaToHeadlessVideo(ctx, ctx.config.sourceMedia);
      }

      // 2. Start video playback
      if (ctx.headlessVideo && ctx.config.sourceType !== 'LIVE_CCTV_NODE') {
        try {
          await ctx.headlessVideo.play();
        } catch (playErr) {
          console.warn('[PersistentVideoService] Background video auto-play warning:', playErr);
        }
      }

      // 3. Clear existing intervals
      if (ctx.sampleTimer) clearInterval(ctx.sampleTimer);
      if (ctx.uptimeTimer) clearInterval(ctx.uptimeTimer);

      // 4. Start Uptime / Telemetry tick (every 1 sec)
      ctx.uptimeTimer = setInterval(() => {
        if (ctx.state.status === 'RUNNING') {
          ctx.state.metrics.uptimeSeconds += 1;
          if (ctx.headlessVideo) {
            ctx.state.metrics.currentVideoTimeSec = ctx.headlessVideo.currentTime;
            ctx.state.metrics.videoDurationSec = ctx.headlessVideo.duration || 0;
          }
          this.notifyTaskListeners(ctx);
        }
      }, 1000);

      // 5. Start Decoupled Frame Analysis Loop
      // Analysis frequency derived from config.fps (e.g. 1 FPS = tick check every 250ms)
      const tickIntervalMs = Math.max(100, Math.floor(1000 / (ctx.config.fps * 2)));
      ctx.sampleTimer = setInterval(() => {
        this.executeAnalysisStep(ctx);
      }, tickIntervalMs);

      ctx.state.status = 'RUNNING';
      ctx.state.errorMessage = undefined;
      this.notifyTaskListeners(ctx);
      this.notifyGlobalListeners();
      return ctx.state;
    } catch (err: any) {
      ctx.state.status = 'ERROR';
      ctx.state.errorMessage = err?.message || 'Failed to start persistent task';
      this.notifyTaskListeners(ctx);
      this.notifyGlobalListeners();
      throw err;
    }
  }

  /**
   * Bind media file or stream URL to headless video element
   */
  private async bindMediaToHeadlessVideo(ctx: TaskContext, media: File | string): Promise<void> {
    const video = ctx.headlessVideo;
    if (!video) return;

    if (ctx.objectUrlToRevoke && typeof URL !== 'undefined') {
      URL.revokeObjectURL(ctx.objectUrlToRevoke);
      ctx.objectUrlToRevoke = null;
    }

    let url: string;
    if (typeof media === 'string') {
      url = media;
    } else {
      if (typeof URL === 'undefined') {
        throw new Error('URL.createObjectURL not supported in current environment');
      }
      url = URL.createObjectURL(media);
      ctx.objectUrlToRevoke = url;
    }

    return new Promise((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        ctx.state.metrics.videoDurationSec = video.duration || 0;
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load video source for task ${ctx.config.taskId}`));
      };
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);
      video.src = url;
      video.load();
    });
  }

  /**
   * Decoupled Frame Analysis Step: Extracts frame and dispatches to AI pipeline
   */
  public async executeAnalysisStep(ctx: TaskContext): Promise<void> {
    if (ctx.state.status !== 'RUNNING') return;

    // Concurrency / Backpressure Guard: Drop frame if previous analysis in-flight
    if (ctx.isBusyAnalyzing) {
      ctx.state.metrics.framesDroppedConcurrency += 1;
      return;
    }

    // Capture Frame Based on Source Type
    let frame: CapturedFrame | null = null;
    const now = Date.now();

    if (ctx.config.sourceType === 'LIVE_CCTV_NODE' && ctx.config.cameraId) {
      // Live CCTV acquisition via server snapshot
      frame = await this.acquireLiveCctvFrame(ctx.config.cameraId);
    } else if (ctx.headlessVideo && ctx.headlessCanvas) {
      // Offscreen / Headless Video Playback Frame Sampling
      const video = ctx.headlessVideo;
      if (video.paused || video.ended || video.readyState < 2) {
        return;
      }

      const currentSec = video.currentTime;
      const intervalSec = 1 / ctx.config.fps;
      if (ctx.lastSampleSec >= 0 && Math.abs(currentSec - ctx.lastSampleSec) < intervalSec * 0.8) {
        return;
      }

      ctx.lastSampleSec = currentSec;
      frame = this.captureHeadlessCanvasFrame(video, ctx.headlessCanvas, ctx.config.taskId, currentSec);
    } else {
      // Synthetic or Test Frame
      frame = {
        base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        timestamp: Date.now() / 1000,
        width: 1280,
        height: 720,
        sourceId: ctx.config.taskId,
        capturedAt: new Date().toISOString()
      };
    }

    if (!frame || !frame.base64) {
      return;
    }

    ctx.state.metrics.framesAcquired += 1;
    ctx.state.lastCapturedFrame = frame;

    // Cryptographic SHA-256 seal (BSA 2023)
    const sha256 = computeDeterministicHash(frame.base64);
    ctx.state.lastFrameSha256 = sha256;

    // Dispatch to AI Vision Pipeline
    ctx.isBusyAnalyzing = true;
    const callStart = Date.now();

    try {
      const analysisResult = await geminiVisionAgent.analyzeFrame({
        frameBase64: frame.base64,
        frameTimestamp: frame.timestamp,
        sourceId: ctx.config.cameraId || ctx.config.taskId,
        fps: ctx.config.fps,
        helmetThreshold: ctx.config.helmetThreshold ?? 0.85
      });

      const durationMs = Date.now() - callStart;
      ctx.state.metrics.lastAnalysisDurationMs = durationMs;
      ctx.state.metrics.framesAnalyzed += 1;
      ctx.state.metrics.lastAnalyzedAt = new Date().toISOString();

      if (analysisResult.aiModel) {
        ctx.state.activeAiModel = analysisResult.aiModel;
      }

      const detections = analysisResult.detections || [];
      const roadEvents = analysisResult.roadSafetyEvents || [];

      ctx.state.currentDetections = detections;
      ctx.state.currentRoadEvents = roadEvents;
      ctx.state.metrics.totalDetections += detections.length;

      // Update specific category metrics
      for (const det of detections) {
        const cls = det.class?.toLowerCase();
        if (cls === 'person') ctx.state.metrics.personsDetected += 1;
        else if (cls === 'car') ctx.state.metrics.carsDetected += 1;
        else if (cls === 'motorcycle') ctx.state.metrics.motorcyclesDetected += 1;
        else if (cls === 'bicycle') ctx.state.metrics.bicyclesDetected += 1;

        if (det.attributes?.helmet === 'HELMET') {
          ctx.state.metrics.helmetsDetected += 1;
        } else if (det.attributes?.helmet === 'NO_HELMET') {
          ctx.state.metrics.noHelmetsDetected += 1;
          ctx.state.metrics.violationsDetected += 1;
        }
      }

      // Sync with attached UI canvas if currently visible
      if (ctx.attachedUiCanvas) {
        this.renderBoundingBoxesToCanvas(ctx.attachedUiCanvas, detections);
      }

      // Notify Central Event Bus and subscribers
      this.notifyTaskListeners(ctx);
    } catch (err: any) {
      console.warn(`[PersistentVideoService] AI Analysis error on task ${ctx.config.taskId}:`, err?.message || err);
    } finally {
      ctx.isBusyAnalyzing = false;
    }
  }

  /**
   * Capture JPEG frame from headless offscreen video to canvas
   */
  private captureHeadlessCanvasFrame(
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement, 
    sourceId: string, 
    timestampSec: number
  ): CapturedFrame | null {
    try {
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.82);

      return {
        base64,
        timestamp: timestampSec,
        width: w,
        height: h,
        sourceId,
        capturedAt: new Date().toISOString()
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Acquire live camera frame directly from Sentinel CCTV snapshot endpoint
   */
  private async acquireLiveCctvFrame(cameraId: string): Promise<CapturedFrame | null> {
    try {
      const res = await fetch(`/api/sentinel/stream/${cameraId}/snapshot.jpg?t=${Date.now()}`);
      if (!res.ok) return null;
      const blob = await res.blob();

      return new Promise<CapturedFrame | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve({
            base64,
            timestamp: Date.now() / 1000,
            width: 1920,
            height: 1080,
            sourceId: cameraId,
            capturedAt: new Date().toISOString()
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  /**
   * Render real HUD bounding boxes onto attached canvas
   */
  public renderBoundingBoxesToCanvas(canvas: HTMLCanvasElement, detections: RealVisionDetection[]): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!detections || detections.length === 0) return;

    const w = canvas.width;
    const h = canvas.height;

    for (const det of detections) {
      const box = det.box;
      const x = box.x * w;
      const y = box.y * h;
      const boxW = box.width * w;
      const boxH = box.height * h;

      const isNoHelmet = det.attributes?.helmet === 'NO_HELMET';
      let strokeColor = '#06b6d4'; // Cyan for Person
      let bgColor = 'rgba(6, 182, 212, 0.15)';
      let labelText = `PERSON ${Math.round(det.confidence * 100)}%`;

      if (isNoHelmet) {
        strokeColor = '#f43f5e'; // Rose/Red for No Helmet
        bgColor = 'rgba(244, 63, 94, 0.25)';
        labelText = `NO HELMET ${Math.round(det.confidence * 100)}%`;
      } else if (det.class === 'motorcycle' || det.class === 'bicycle') {
        strokeColor = '#a855f7'; // Purple for 2-wheelers
        bgColor = 'rgba(168, 85, 247, 0.15)';
        labelText = `${det.class.toUpperCase()} ${Math.round(det.confidence * 100)}%`;
      } else if (['car', 'vehicle', 'bus', 'truck'].includes(det.class?.toLowerCase())) {
        strokeColor = '#f59e0b'; // Amber for Vehicles
        bgColor = 'rgba(245, 158, 11, 0.15)';
        labelText = `${det.class.toUpperCase()} ${Math.round(det.confidence * 100)}%`;
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, boxW, boxH);
      ctx.strokeRect(x, y, boxW, boxH);

      // HUD corner brackets
      const cornerLen = Math.min(14, boxW / 4, boxH / 4);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLen, y);
      ctx.moveTo(x + boxW - cornerLen, y);
      ctx.lineTo(x + boxW, y);
      ctx.lineTo(x + boxW, y + cornerLen);
      ctx.moveTo(x, y + boxH - cornerLen);
      ctx.lineTo(x, y + boxH);
      ctx.lineTo(x + cornerLen, y + boxH);
      ctx.moveTo(x + boxW - cornerLen, y + boxH);
      ctx.lineTo(x + boxW, y + boxH);
      ctx.lineTo(x + boxW, y + boxH - cornerLen);
      ctx.stroke();

      // Label text
      const trackText = det.trackId ? ` [${det.trackId}]` : '';
      const fullLabel = `${labelText}${trackText}`;
      ctx.font = 'bold 11px monospace';
      const textMetrics = ctx.measureText(fullLabel);
      const pad = 4;
      const badgeW = textMetrics.width + pad * 2;
      const badgeH = 18;

      ctx.fillStyle = strokeColor;
      ctx.fillRect(x, Math.max(0, y - badgeH), badgeW, badgeH);
      ctx.fillStyle = '#000000';
      ctx.fillText(fullLabel, x + pad, Math.max(13, y - 4));
    }
  }

  /**
   * Pause background task
   */
  public pauseTask(taskId: string): void {
    const ctx = this.tasks.get(taskId);
    if (!ctx) return;
    ctx.state.status = 'PAUSED';
    if (ctx.headlessVideo) ctx.headlessVideo.pause();
    this.notifyTaskListeners(ctx);
    this.notifyGlobalListeners();
  }

  /**
   * Resume paused background task
   */
  public resumeTask(taskId: string): void {
    const ctx = this.tasks.get(taskId);
    if (!ctx) return;
    ctx.state.status = 'RUNNING';
    if (ctx.headlessVideo) ctx.headlessVideo.play().catch(() => {});
    this.notifyTaskListeners(ctx);
    this.notifyGlobalListeners();
  }

  /**
   * Explicitly stop background task and release resources
   */
  public stopTask(taskId: string): void {
    const ctx = this.tasks.get(taskId);
    if (!ctx) return;

    if (ctx.sampleTimer) clearInterval(ctx.sampleTimer);
    if (ctx.uptimeTimer) clearInterval(ctx.uptimeTimer);
    if (ctx.headlessVideo) {
      ctx.headlessVideo.pause();
      ctx.headlessVideo.src = '';
    }
    if (ctx.objectUrlToRevoke && typeof URL !== 'undefined') {
      URL.revokeObjectURL(ctx.objectUrlToRevoke);
      ctx.objectUrlToRevoke = null;
    }

    ctx.state.status = 'STOPPED';
    this.notifyTaskListeners(ctx);
    this.notifyGlobalListeners();
    this.tasks.delete(taskId);
    this.persistTasksToStorage();
  }

  /**
   * Attach a mounted UI <video> element to synchronize with background playback
   */
  public attachUiVideoElement(taskId: string, videoEl: HTMLVideoElement): void {
    const ctx = this.tasks.get(taskId);
    if (!ctx) return;

    ctx.attachedUiVideo = videoEl;
    ctx.state.isUiAttached = true;

    // Sync source and timestamp if headless video is loaded
    if (ctx.headlessVideo && ctx.headlessVideo.src) {
      if (videoEl.src !== ctx.headlessVideo.src) {
        videoEl.src = ctx.headlessVideo.src;
        videoEl.currentTime = ctx.headlessVideo.currentTime;
        if (!ctx.headlessVideo.paused) {
          videoEl.play().catch(() => {});
        }
      }
    }
    this.notifyTaskListeners(ctx);
  }

  /**
   * Detach UI <video> element on React unmount WITHOUT interrupting background playback
   */
  public detachUiVideoElement(taskId: string): void {
    const ctx = this.tasks.get(taskId);
    if (!ctx) return;

    ctx.attachedUiVideo = null;
    ctx.state.isUiAttached = false;
    // Note: ctx.headlessVideo keeps playing!
    this.notifyTaskListeners(ctx);
  }

  /**
   * Attach mounted UI <canvas> for HUD bounding box overlay rendering
   */
  public attachUiCanvas(taskId: string, canvasEl: HTMLCanvasElement): void {
    const ctx = this.tasks.get(taskId);
    if (!ctx) return;

    ctx.attachedUiCanvas = canvasEl;
    if (ctx.state.currentDetections.length > 0) {
      this.renderBoundingBoxesToCanvas(canvasEl, ctx.state.currentDetections);
    }
  }

  /**
   * Detach UI <canvas> on React unmount
   */
  public detachUiCanvas(taskId: string): void {
    const ctx = this.tasks.get(taskId);
    if (!ctx) return;
    ctx.attachedUiCanvas = null;
  }

  /**
   * Set task FPS frequency
   */
  public setTaskFps(taskId: string, fps: number): void {
    const ctx = this.tasks.get(taskId);
    if (!ctx) return;
    ctx.config.fps = fps;
    if (ctx.state.status === 'RUNNING') {
      if (ctx.sampleTimer) clearInterval(ctx.sampleTimer);
      const tickIntervalMs = Math.max(100, Math.floor(1000 / (fps * 2)));
      ctx.sampleTimer = setInterval(() => {
        this.executeAnalysisStep(ctx);
      }, tickIntervalMs);
    }
    this.notifyTaskListeners(ctx);
  }

  /**
   * Subscribe to state updates for a specific task
   */
  public subscribe(taskId: string, listener: TaskStateListener): () => void {
    const ctx = this.tasks.get(taskId);
    if (ctx) {
      ctx.listeners.add(listener);
      listener(ctx.state);
    }

    return () => {
      const currentCtx = this.tasks.get(taskId);
      if (currentCtx) {
        currentCtx.listeners.delete(listener);
      }
    };
  }

  /**
   * Subscribe to global background task registry updates
   */
  public subscribeAll(listener: GlobalTasksListener): () => void {
    this.globalListeners.add(listener);
    listener(this.getAllTasks());

    return () => {
      this.globalListeners.delete(listener);
    };
  }

  public getTask(taskId: string): PersistentVideoTaskState | undefined {
    return this.tasks.get(taskId)?.state;
  }

  public getAllTasks(): PersistentVideoTaskState[] {
    return Array.from(this.tasks.values()).map(ctx => ctx.state);
  }

  public getActiveTasks(): PersistentVideoTaskState[] {
    return this.getAllTasks().filter(t => t.status === 'RUNNING');
  }

  public getHeadlessVideo(taskId: string): HTMLVideoElement | null {
    return this.tasks.get(taskId)?.headlessVideo || null;
  }

  private notifyTaskListeners(ctx: TaskContext): void {
    const stateSnapshot = { ...ctx.state };
    for (const listener of ctx.listeners) {
      try {
        listener(stateSnapshot);
      } catch (e) {
        console.warn('[PersistentVideoService] Listener callback error:', e);
      }
    }
  }

  private notifyGlobalListeners(): void {
    const all = this.getAllTasks();
    for (const listener of this.globalListeners) {
      try {
        listener(all);
      } catch (e) {
        console.warn('[PersistentVideoService] Global listener callback error:', e);
      }
    }
  }
}

export const persistentVideoIntelligenceService = PersistentVideoIntelligenceService.getInstance();
