/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VisionDetectionAgent: Multi-Class Vehicle & Pedestrian Detection & Tracking Agent
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { centralRepo, sysEvents } from '../../services/Architecture';
import { SecurityEventPayload } from '../../types';

export interface DetectionResult {
  trackId: string;
  class: 'person' | 'car' | 'motorcycle' | 'bicycle' | 'bus' | 'truck';
  confidence: number;
  box: { ymin: number; xmin: number; ymax: number; xmax: number };
  attributes?: Record<string, any>;
}

export class VisionDetectionAgent extends BaseAgent {
  private detectionCounts = {
    person: 0,
    car: 0,
    motorcycle: 0,
    bicycle: 0,
    bus: 0,
    truck: 0
  };

  constructor(params?: { agentId?: string; region?: string; edgeNodeId?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'VISION-AHM-001',
      agentType: 'VISION_DETECTION',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'JUNCTION_SURVEILLANCE',
      edgeNodeId: params?.edgeNodeId || 'EDGE-AHM-001',
      capabilities: ['VISION_DETECTION'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<{
    detections: DetectionResult[];
    event?: SecurityEventPayload;
    summary: string;
  }> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const { frameDataUrl, simulatedObjects, cameraId, correlationId } = job.payload || {};
      const targetCamera = cameraId || job.cameraId || 'CAM-AHM-007';

      let detections: DetectionResult[] = [];

      // 1. If real frame is provided, process via real server-side Gemini Vision
      if (frameDataUrl && !this.isSimulated) {
        const response = await fetch('/api/ai/analyze-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frameDataUrl,
            frameTimestamp: Date.now() / 1000,
            sourceId: targetCamera
          })
        });

        if (!response.ok) {
          throw new Error(`AI_ANALYSIS_SERVER_ERROR_${response.status}`);
        }

        const data = await response.json();
        if (data.detections && Array.isArray(data.detections)) {
          detections = data.detections.map((d: any, idx: number) => ({
            trackId: d.trackId || `TRK-${idx + 1}`,
            class: d.class,
            confidence: Math.min(1.0, Math.max(0.1, d.confidence || 0.85)),
            box: {
              ymin: Math.max(0, Math.min(1, d.box?.ymin ?? 0.1)),
              xmin: Math.max(0, Math.min(1, d.box?.xmin ?? 0.1)),
              ymax: Math.max(0, Math.min(1, d.box?.ymax ?? 0.9)),
              xmax: Math.max(0, Math.min(1, d.box?.xmax ?? 0.9))
            },
            attributes: d.attributes || {}
          }));
        }
      } else {
        // 2. Deterministic simulation mode
        if (simulatedObjects && Array.isArray(simulatedObjects)) {
          detections = simulatedObjects.map((obj: any, idx: number) => ({
            trackId: obj.trackId || `SIM-TRK-${idx + 1}`,
            class: obj.class || 'car',
            confidence: obj.confidence || 0.92,
            box: obj.box || { ymin: 0.2, xmin: 0.2, ymax: 0.6, xmax: 0.6 },
            attributes: obj.attributes || {}
          }));
        } else {
          // Default deterministic sample detection
          detections = [
            {
              trackId: 'P-TRACK-001',
              class: 'person',
              confidence: 0.94,
              box: { ymin: 0.22, xmin: 0.35, ymax: 0.78, xmax: 0.52 }
            },
            {
              trackId: 'BIKE-TRACK-001',
              class: 'motorcycle',
              confidence: 0.91,
              box: { ymin: 0.38, xmin: 0.50, ymax: 0.82, xmax: 0.72 },
              attributes: { hasHelmet: false }
            }
          ];
        }
      }

      // Update counters based strictly on actual detections returned
      for (const d of detections) {
        if (this.detectionCounts[d.class] !== undefined) {
          this.detectionCounts[d.class] += 1;
        }
      }

      // Generate central SecurityEventPayload
      let eventPayload: SecurityEventPayload | undefined;
      if (detections.length > 0) {
        const primary = detections[0];
        const eventId = `EVT-VIS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        eventPayload = {
          eventId,
          edgeNodeId: this.edgeNodeId || 'EDGE-AHM-001',
          siteId: 'SITE-AHM-CENTRAL',
          cameraId: targetCamera,
          timestamp: new Date().toISOString(),
          eventType: primary.class === 'person' ? 'PERSON_TRACK' : 'OBJECT_DETECTION',
          priority: job.priority === 'CRITICAL' ? 'critical' : 'low',
          confidence: primary.confidence,
          metadata: {
            classes: detections.map(d => d.class).join(', '),
            detectionCount: detections.length,
            trackId: primary.trackId,
            correlationId: job.correlationId,
            isSimulation: this.isSimulated
          }
        };

        centralRepo.createEvent(eventPayload);
        sysEvents.emit('event_created', eventPayload);
      }

      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);

      return {
        detections,
        event: eventPayload,
        summary: `Detected ${detections.length} objects (${detections.map(d => d.class).join(', ')})`
      };
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public getCounts() {
    return { ...this.detectionCounts };
  }
}
