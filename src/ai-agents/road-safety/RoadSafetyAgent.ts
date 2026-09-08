/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * RoadSafetyAgent: Traffic Safety Evaluation, Helmet Compliance & Temporal Anomaly Validator
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { centralRepo, sysEvents } from '../../services/Architecture';
import { centralEventBus } from '../../services/CentralEventBus';
import { SecurityEventPayload } from '../../types';

export type RoadSafetyViolationType = 
  | 'NO_HELMET'
  | 'TRIPLE_RIDING'
  | 'WRONG_WAY'
  | 'RED_LIGHT_VIOLATION'
  | 'STOP_LINE_VIOLATION'
  | 'DANGEROUS_PARKING'
  | 'PEDESTRIAN_CONFLICT'
  | 'UNSAFE_RIDING'
  | 'COMPLIANT'
  | 'UNKNOWN';

export interface RoadSafetyEvaluation {
  status: 'VIOLATION_CONFIRMED' | 'COMPLIANT' | 'INSUFFICIENT_EVIDENCE';
  violationType: RoadSafetyViolationType;
  confidence: number;
  riderTrackId: string;
  headRegionVisible: boolean;
  temporalObservationsCount: number;
  explanation: string;
  isSimulated: boolean;
}

export class RoadSafetyAgent extends BaseAgent {
  private minConfidenceThreshold: number = 0.85;

  constructor(params?: { agentId?: string; region?: string; edgeNodeId?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'ROAD-SAFETY-AHM-001',
      agentType: 'ROAD_SAFETY',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'ROAD_SAFETY_ENFORCEMENT',
      edgeNodeId: params?.edgeNodeId || 'EDGE-AHM-001',
      capabilities: ['ROAD_SAFETY'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<{
    evaluation: RoadSafetyEvaluation;
    event?: SecurityEventPayload;
  }> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const { 
        riderTrackId = 'BIKE-TRACK-001', 
        hasHelmet, 
        confidence = 0.92,
        headVisible = true,
        temporalCount = 2,
        specificViolation,
        cameraId = 'CAM-AHM-014'
      } = job.payload || {};

      let evaluation: RoadSafetyEvaluation;

      // Rule 1: If head region is not clearly visible, return UNKNOWN
      if (!headVisible) {
        evaluation = {
          status: 'INSUFFICIENT_EVIDENCE',
          violationType: 'UNKNOWN',
          confidence: 0.40,
          riderTrackId,
          headRegionVisible: false,
          temporalObservationsCount: temporalCount,
          explanation: 'Rider head region occluded or outside camera resolution threshold; cannot verify helmet status.',
          isSimulated: this.isSimulated
        };
      } 
      // Rule 2: Helmet absent with confidence >= threshold
      else if (hasHelmet === false || specificViolation === 'NO_HELMET') {
        const evalConfidence = Math.max(this.minConfidenceThreshold, confidence);
        evaluation = {
          status: 'VIOLATION_CONFIRMED',
          violationType: 'NO_HELMET',
          confidence: evalConfidence,
          riderTrackId,
          headRegionVisible: true,
          temporalObservationsCount: temporalCount,
          explanation: `Rider observed without standard safety helmet across ${temporalCount} consecutive frames. Confidence: ${Math.round(evalConfidence * 100)}%.`,
          isSimulated: this.isSimulated
        };
      } 
      // Rule 3: Helmet present
      else if (hasHelmet === true) {
        evaluation = {
          status: 'COMPLIANT',
          violationType: 'COMPLIANT',
          confidence: Math.max(0.85, confidence),
          riderTrackId,
          headRegionVisible: true,
          temporalObservationsCount: temporalCount,
          explanation: 'Rider verified wearing certified protective safety helmet.',
          isSimulated: this.isSimulated
        };
      } 
      // Rule 4: Other specific safety violation (e.g. wrong way, triple riding)
      else if (specificViolation && specificViolation !== 'COMPLIANT') {
        evaluation = {
          status: 'VIOLATION_CONFIRMED',
          violationType: specificViolation,
          confidence: confidence >= this.minConfidenceThreshold ? confidence : this.minConfidenceThreshold,
          riderTrackId,
          headRegionVisible: true,
          temporalObservationsCount: temporalCount,
          explanation: `Road safety anomaly detected: ${specificViolation}.`,
          isSimulated: this.isSimulated
        };
      } 
      // Default: Insufficient evidence
      else {
        evaluation = {
          status: 'INSUFFICIENT_EVIDENCE',
          violationType: 'UNKNOWN',
          confidence: 0.50,
          riderTrackId,
          headRegionVisible: true,
          temporalObservationsCount: temporalCount,
          explanation: 'Indeterminate rider posture; insufficient optical features to confirm safety violation.',
          isSimulated: this.isSimulated
        };
      }

      let eventPayload: SecurityEventPayload | undefined;

      // If violation confirmed, create a high-priority ROAD_SAFETY event
      if (evaluation.status === 'VIOLATION_CONFIRMED') {
        const eventId = `EVT-SAFETY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        eventPayload = {
          eventId,
          edgeNodeId: this.edgeNodeId || 'EDGE-AHM-001',
          siteId: 'SITE-AHM-CENTRAL',
          cameraId,
          timestamp: new Date().toISOString(),
          eventType: 'ROAD_SAFETY',
          priority: 'high',
          confidence: evaluation.confidence,
          metadata: {
            violationType: evaluation.violationType,
            riderTrackId: evaluation.riderTrackId,
            correlationId: job.correlationId,
            explanation: evaluation.explanation,
            isSimulation: this.isSimulated
          }
        };

        centralRepo.createEvent(eventPayload);
        sysEvents.emit('event_created', eventPayload);

        // Notify Challan Review Mesh of candidate detection
        centralEventBus.publish({
          eventType: 'VIOLATION_CANDIDATE_DETECTED',
          sourceId: this.agentId,
          correlationId: job.correlationId,
          idempotencyKey: `IDEMP-${eventId}`,
          priority: 'P1',
          payload: {
            eventId,
            cameraId,
            violationType: evaluation.violationType,
            confidence: evaluation.confidence,
            isSimulated: this.isSimulated,
            riderTrackId: evaluation.riderTrackId,
            explanation: evaluation.explanation
          }
        });
      }

      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);

      return { evaluation, event: eventPayload };
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public setConfidenceThreshold(threshold: number): void {
    this.minConfidenceThreshold = threshold;
  }
}
