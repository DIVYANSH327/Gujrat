/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Mobile Patrol Unit & AI Mesh Service
 */

import { 
  MobilePatrolSnapshot, 
  AIMeshJudicialVerdict, 
  QwenHsrpDetection 
} from '../types/mobilePatrolHsrpTypes';
import { sysEvents } from './Architecture';

class MobilePatrolService {
  private static instance: MobilePatrolService;
  private snapshots: MobilePatrolSnapshot[] = [];
  private judgments: AIMeshJudicialVerdict[] = [];

  private constructor() {
    this.loadInitialHistory();
  }

  public static getInstance(): MobilePatrolService {
    if (!MobilePatrolService.instance) {
      MobilePatrolService.instance = new MobilePatrolService();
    }
    return MobilePatrolService.instance;
  }

  private async loadInitialHistory() {
    try {
      const res = await fetch('/api/ai-mesh/mobile-judgments');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.judgments = data;
        }
      }
    } catch (e) {
      // Offline fallback
    }
  }

  public getSnapshots(): MobilePatrolSnapshot[] {
    return [...this.snapshots];
  }

  public getAllSnapshots(): MobilePatrolSnapshot[] {
    return [...this.snapshots];
  }

  public getJudgments(): AIMeshJudicialVerdict[] {
    return [...this.judgments];
  }

  public subscribeToSnapshots(callback: (snapshots: MobilePatrolSnapshot[]) => void): () => void {
    const handler = () => callback([...this.snapshots]);
    sysEvents.on('mobile_patrol_snapshot_added', handler);
    sysEvents.on('mobile_patrol_snapshot_updated', handler);
    return () => {
      sysEvents.off('mobile_patrol_snapshot_added', handler);
      sysEvents.off('mobile_patrol_snapshot_updated', handler);
    };
  }

  public addSnapshot(snap: MobilePatrolSnapshot): void {
    this.snapshots.unshift(snap);
    if (this.snapshots.length > 50) this.snapshots.pop();
    sysEvents.emit('mobile_patrol_snapshot_added', snap);
  }

  public async captureVehicleSnapshot(
    frameBase64: string,
    detection: QwenHsrpDetection,
    unitId: string,
    officerCallSign: string,
    speedKmH: number,
    gps: { latitude: number; longitude: number; accuracyMeters?: number } | null,
    aiEngineUsed: string
  ): Promise<MobilePatrolSnapshot> {
    const id = `SNAP-MOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Compute simple SHA-256 fingerprint in browser
    let sha256 = `SHA256-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(frameBase64.substring(0, 1024) + id);
        const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
        sha256 = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch {
      // Fallback fingerprint
    }

    const snap: MobilePatrolSnapshot = {
      id,
      timestamp: new Date().toISOString(),
      vehicleClass: detection.vehicleClass || 'Vehicle',
      plateText: detection.plateText || 'UNKNOWN',
      snapshotDataUrl: frameBase64,
      plateCropDataUrl: detection.plateCropBase64,
      sha256,
      gps: {
        lat: gps?.latitude || 23.0225,
        lon: gps?.longitude || 72.5714,
        acc: gps?.accuracyMeters || 4.5
      },
      speedKmH,
      unitId,
      aiEngine: aiEngineUsed.toLowerCase().includes('qwen') ? 'Qwen 2.5-VL Vision' : 'Gemini 3.8 Flash',
      hsrpStatus: detection.hsrpStatus,
      features: detection.features,
      meshStatus: 'UNASSIGNED'
    };

    this.addSnapshot(snap);
    return snap;
  }

  /**
   * Run Qwen AI Vision on a live dash cam frame
   */
  public async analyzeFrameWithQwenVision(params: {
    frameBase64: string;
    frameTimestamp?: number;
    sourceId?: string;
    gps?: { lat: number; lon: number; acc?: number };
    speedKmH?: number;
  }): Promise<{
    status: string;
    detections: QwenHsrpDetection[];
    aiModel: string;
    analysisTimeMs: number;
    frameSha256?: string;
  }> {
    const res = await fetch('/api/ai/qwen-vision/analyze-hsrp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Qwen Vision failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Assign a captured snapshot to the AI Agent Mesh for statutory judgment
   */
  public async assignSnapshotToAiMesh(snapshotOrId: string | MobilePatrolSnapshot): Promise<AIMeshJudicialVerdict> {
    const snapshotId = typeof snapshotOrId === 'string' ? snapshotOrId : snapshotOrId.id;
    let snap = this.snapshots.find(s => s.id === snapshotId);
    if (!snap && typeof snapshotOrId !== 'string') {
      snap = snapshotOrId;
      this.addSnapshot(snap);
    }
    if (!snap) {
      throw new Error(`Snapshot ${snapshotId} not found in local reel`);
    }

    snap.meshStatus = 'ASSIGNED';
    sysEvents.emit('mobile_patrol_snapshot_updated', snap);

    const res = await fetch('/api/ai-mesh/judge-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshotBase64: snap.snapshotDataUrl,
        plateCropBase64: snap.plateCropDataUrl,
        vehicleClass: snap.vehicleClass,
        plateText: snap.plateText,
        gps: snap.gps,
        speedKmH: snap.speedKmH,
        unitId: snap.unitId,
        features: snap.features,
        hsrpStatus: snap.hsrpStatus,
        aiEngine: snap.aiEngine
      })
    });

    if (!res.ok) {
      snap.meshStatus = 'UNASSIGNED';
      sysEvents.emit('mobile_patrol_snapshot_updated', snap);
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'AI Mesh failed to deliberate on snapshot');
    }

    const verdict: AIMeshJudicialVerdict = await res.json();
    snap.meshStatus = 'JUDGED';
    snap.verdict = verdict;

    // Add to judgments ledger
    this.judgments.unshift(verdict);
    if (this.judgments.length > 50) this.judgments.pop();

    sysEvents.emit('mobile_patrol_snapshot_updated', snap);
    sysEvents.emit('mobile_patrol_snapshot_judged', verdict);

    return verdict;
  }
}

export const mobilePatrolService = MobilePatrolService.getInstance();
