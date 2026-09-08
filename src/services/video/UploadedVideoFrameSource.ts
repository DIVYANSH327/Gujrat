/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Uploaded Video Frame Source Implementation
 * Uses standard HTMLVideoElement and Offscreen/HTMLCanvasElement to extract
 * real pixel frames from user-provided video files (MP4, WebM, MOV).
 */

import { IVideoFrameSource, CapturedFrame } from './types';

export class UploadedVideoFrameSource implements IVideoFrameSource {
  public readonly id: string;
  public readonly type = 'UPLOADED_FILE' as const;
  public readonly isAnalyzable = true;

  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private objectUrl: string | null = null;
  private fileName: string = 'authorized_demo_video.mp4';
  private duration: number = 0;
  private naturalWidth: number = 1280;
  private naturalHeight: number = 720;
  private lastCapturedTimestamp: number = -1;

  constructor(id: string = 'UPLOAD-DEMO-001', existingVideo?: HTMLVideoElement) {
    this.id = id;
    if (typeof document !== 'undefined') {
      if (existingVideo) {
        this.videoElement = existingVideo;
      } else {
        this.videoElement = document.createElement('video');
        this.videoElement.playsInline = true;
        this.videoElement.muted = true; // Auto-mute for browser autoplay policies
        this.videoElement.preload = 'auto';
      }
      this.canvasElement = document.createElement('canvas');
    }
  }

  public setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
    if (typeof document !== 'undefined' && !this.canvasElement) {
      this.canvasElement = document.createElement('canvas');
    }
  }

  public async loadSource(source: File | string): Promise<void> {
    if (this.objectUrl && typeof URL !== 'undefined') {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }

    let url: string;
    if (typeof source === 'string') {
      url = source;
      this.fileName = source.split('/').pop() || 'demo_video.mp4';
    } else {
      if (typeof URL === 'undefined') {
        throw new Error('URL.createObjectURL is not supported in this runtime environment');
      }
      this.objectUrl = URL.createObjectURL(source);
      url = this.objectUrl;
      this.fileName = source.name;
    }

    if (!this.videoElement) {
      return;
    }

    return new Promise((resolve, reject) => {
      const video = this.videoElement!;
      
      const onLoadedMetadata = () => {
        this.duration = video.duration || 0;
        this.naturalWidth = video.videoWidth || 1280;
        this.naturalHeight = video.videoHeight || 720;
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error(`Failed to decode video file: ${this.fileName}`));
      };

      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);

      video.src = url;
      video.load();
    });
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public captureCurrentFrame(quality: number = 0.82): CapturedFrame | null {
    if (!this.videoElement || typeof document === 'undefined') {
      return null;
    }

    const video = this.videoElement;
    if (video.readyState < 2) {
      // HAVE_CURRENT_DATA or higher
      return null;
    }

    const currentTimestamp = video.currentTime;
    // Limit canvas size to max 1280x720 for fast network transfer & optimal Gemini vision resolution
    const maxDim = 1280;
    let targetWidth = video.videoWidth || this.naturalWidth;
    let targetHeight = video.videoHeight || this.naturalHeight;

    if (targetWidth > maxDim || targetHeight > maxDim) {
      if (targetWidth >= targetHeight) {
        targetHeight = Math.round((targetHeight / targetWidth) * maxDim);
        targetWidth = maxDim;
      } else {
        targetWidth = Math.round((targetWidth / targetHeight) * maxDim);
        targetHeight = maxDim;
      }
    }

    if (!this.canvasElement) {
      this.canvasElement = document.createElement('canvas');
    }

    const canvas = this.canvasElement;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64Data = dataUrl.split(',')[1] || '';

    this.lastCapturedTimestamp = currentTimestamp;

    return {
      base64: base64Data,
      timestamp: currentTimestamp,
      width: targetWidth,
      height: targetHeight,
      sourceId: this.id,
      capturedAt: new Date().toISOString()
    };
  }

  public async play(): Promise<void> {
    if (this.videoElement) {
      await this.videoElement.play();
    }
  }

  public pause(): void {
    if (this.videoElement) {
      this.videoElement.pause();
    }
  }

  public seek(seconds: number): void {
    if (this.videoElement && Number.isFinite(seconds)) {
      this.videoElement.currentTime = Math.max(0, Math.min(seconds, this.duration || seconds));
    }
  }

  public getCurrentTime(): number {
    return this.videoElement?.currentTime || 0;
  }

  public getDuration(): number {
    return this.videoElement?.duration || this.duration;
  }

  public isPlaying(): boolean {
    return !!(this.videoElement && !this.videoElement.paused && !this.videoElement.ended && this.videoElement.readyState > 2);
  }

  public getVideoMetadata() {
    return {
      width: this.videoElement?.videoWidth || this.naturalWidth,
      height: this.videoElement?.videoHeight || this.naturalHeight,
      duration: this.videoElement?.duration || this.duration,
      fileName: this.fileName
    };
  }

  public dispose(): void {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement.load();
    }
    if (this.objectUrl && typeof URL !== 'undefined') {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.videoElement = null;
    this.canvasElement = null;
  }
}
