/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ANPRAgent: Automatic Number Plate Recognition & OCR Normalization Agent
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { normalizeLicensePlate, AnprEventStatus } from '../../types';

export interface ANPRResult {
  plate: string;
  rawPlate: string;
  normalizedPlate: string;
  confidence: number;
  status: AnprEventStatus;
  plateBoundingBox?: { xmin: number; ymin: number; xmax: number; ymax: number };
  frameId?: string;
  cameraId: string;
  timestamp: string;
  disclaimer: string;
}

export class ANPRAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'ANPR-OCR-CENTRAL-001',
      agentType: 'ANPR',
      region: params?.region || 'CENTRAL',
      assignedScope: 'HIGH_SPEED_ANPR_OCR_CORRIDORS',
      capabilities: ['ANPR_RECOGNITION', 'VISION_DETECTION'],
      isSimulated: params?.isSimulated ?? true
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async recognizePlate(params: {
    rawPlate: string;
    confidence?: number;
    frameId?: string;
    cameraId: string;
    timestamp?: string;
    bbox?: { xmin: number; ymin: number; xmax: number; ymax: number };
  }): Promise<ANPRResult> {
    const job: AIAgentJob = {
      jobId: `job-anpr-${Date.now()}`,
      jobType: 'ANPR_OCR_EXTRACTION',
      priority: 'CRITICAL',
      status: 'RUNNING',
      assignedAgentId: this.agentId,
      sourceId: params.cameraId,
      requiredCapabilities: ['ANPR_RECOGNITION'],
      attempt: 1,
      maxAttempts: 2,
      createdAt: new Date().toISOString(),
      correlationId: `corr-anpr-${Date.now()}`,
      payload: params
    };

    return this.assignJob(job);
  }

  public async assignJob(job: AIAgentJob): Promise<ANPRResult> {
    const start = Date.now();
    this.activeJobsCount += 1;
    try {
      const payload = job.payload || {};
      const raw = payload.rawPlate || '';
      const normalized = normalizeLicensePlate(raw);
      const confidence = payload.confidence ?? (normalized.length >= 8 ? 0.96 : 0.65);
      const cameraId = payload.cameraId || 'CAM-001';
      const timestamp = payload.timestamp || new Date().toISOString();

      let status: AnprEventStatus = 'VERIFIED';
      if (!normalized || normalized.length < 4) {
        status = 'UNREADABLE';
      } else if (confidence < 0.70) {
        status = 'PLATE_UNKNOWN';
      }

      this.eventsProcessedCount += 1;
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.recordHeartbeat();

      return {
        plate: normalized,
        rawPlate: raw,
        normalizedPlate: normalized,
        confidence,
        status,
        plateBoundingBox: payload.bbox || { xmin: 0.35, ymin: 0.65, xmax: 0.65, ymax: 0.78 },
        frameId: payload.frameId,
        cameraId,
        timestamp,
        disclaimer: 'OCR INFERENCE RESULT (Optical character recognition subject to lighting, speed, and angle)'
      };
    } catch (err) {
      this.failedJobsCount += 1;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      throw err;
    }
  }
}

export const anprAgent = new ANPRAgent();
