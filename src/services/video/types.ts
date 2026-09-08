/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Video Frame Source Abstraction
 * Supports uploaded video files, and structured for future RTSP / Edge Agent cameras.
 * Notice: YouTube iframes cannot be sampled due to browser cross-origin pixel security policies.
 */

export interface CapturedFrame {
  /** Base64 JPEG data URL or raw base64 string */
  base64: string;
  /** Video playback timestamp in seconds */
  timestamp: number;
  /** Pixel width of the frame */
  width: number;
  /** Pixel height of the frame */
  height: number;
  /** Source identifier */
  sourceId: string;
  /** Captured real-world timestamp ISO string */
  capturedAt: string;
}

export interface IVideoFrameSource {
  readonly id: string;
  readonly type: 'UPLOADED_FILE' | 'RTSP_STREAM' | 'EDGE_AGENT';
  readonly isAnalyzable: boolean;

  /** Load video from File or Object URL */
  loadSource(source: File | string): Promise<void>;

  /** Get underlying HTMLVideoElement if available */
  getVideoElement(): HTMLVideoElement | null;

  /** Sample the current video frame into a JPEG */
  captureCurrentFrame(quality?: number): CapturedFrame | null;

  /** Playback controls */
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): void;

  /** Telemetry */
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  getVideoMetadata(): { width: number; height: number; duration: number; fileName?: string };

  /** Release resources */
  dispose(): void;
}
