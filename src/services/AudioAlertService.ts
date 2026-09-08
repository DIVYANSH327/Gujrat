export type AlertAudioTone = 'INFO' | 'HIGH' | 'CRITICAL' | 'TEST_ALERT';

export class AudioAlertService {
  private static instance: AudioAlertService;
  private audioCtx: any = null;
  private muted: boolean = false;
  private lastPlayedTime: number = 0;

  private constructor() {
    // Lazy initialized on first user interaction in browser
  }

  public static getInstance(): AudioAlertService {
    if (!AudioAlertService.instance) {
      AudioAlertService.instance = new AudioAlertService();
    }
    return AudioAlertService.instance;
  }

  private initAudioContext(): any {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Play synthesized alert chime.
   * Throttled to prevent audio overlap spamming.
   */
  public playTone(tone: AlertAudioTone): void {
    if (this.muted) return;
    if (typeof window === 'undefined') return;

    const now = Date.now();
    // Prevent overlapping bursts within 500ms
    if (tone !== 'TEST_ALERT' && now - this.lastPlayedTime < 500) {
      return;
    }
    this.lastPlayedTime = now;

    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const currentTime = ctx.currentTime;

      if (tone === 'INFO') {
        // Soft ascending two-tone (520Hz -> 659Hz)
        this.playBeep(ctx, 520, currentTime, 0.1, 0.15);
        this.playBeep(ctx, 659, currentTime + 0.1, 0.15, 0.15);
      } else if (tone === 'HIGH') {
        // Urgent 3-pulse beep (784Hz -> 880Hz -> 1046Hz)
        this.playBeep(ctx, 784, currentTime, 0.08, 0.2);
        this.playBeep(ctx, 880, currentTime + 0.1, 0.08, 0.2);
        this.playBeep(ctx, 1046, currentTime + 0.2, 0.15, 0.25);
      } else if (tone === 'CRITICAL') {
        // Alternating siren pulse (880Hz <-> 660Hz)
        this.playBeep(ctx, 880, currentTime, 0.12, 0.3);
        this.playBeep(ctx, 660, currentTime + 0.14, 0.12, 0.3);
        this.playBeep(ctx, 880, currentTime + 0.28, 0.12, 0.3);
        this.playBeep(ctx, 660, currentTime + 0.42, 0.18, 0.3);
      } else if (tone === 'TEST_ALERT') {
        // Melodic test confirmation chime (523Hz -> 659Hz -> 784Hz -> 1046Hz)
        this.playBeep(ctx, 523.25, currentTime, 0.1, 0.2);
        this.playBeep(ctx, 659.25, currentTime + 0.1, 0.1, 0.2);
        this.playBeep(ctx, 783.99, currentTime + 0.2, 0.1, 0.2);
        this.playBeep(ctx, 1046.50, currentTime + 0.3, 0.25, 0.25);
      }
    } catch (e) {
      // Audio autoplay policy or hardware restriction: fail silently
    }
  }

  private playBeep(ctx: any, freq: number, startTime: number, duration: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

export const audioAlertService = AudioAlertService.getInstance();
