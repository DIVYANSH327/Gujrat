/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * FaceDetectionAgent
 * Distributed AI Vision Agent for Face Detection, Quality Scoring & Biometric Tokenization.
 * 
 * Legal Principles: Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)
 * Absolute Rules:
 * 1. Never leak raw float embedding arrays.
 * 2. Maintain strict camera observation provenance.
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { FaceObservation } from '../../types/facePersonIntelligenceTypes';
import { faceFeatureExtractor } from '../../services/ai/FaceIntelligenceEngine';
import { faceWatchlistService } from '../../services/FaceWatchlistService';
import { sysEvents } from '../../services/Architecture';
import { computeDeterministicHash } from '../../services/GodsEyeService';

export class FaceDetectionAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; edgeNodeId?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'AGENT-FACE-DETECTION-01',
      agentType: 'FACE_DETECTION',
      region: params?.region || 'AHMEDABAD_NORTH',
      assignedScope: 'HIGHWAY_AND_METRO_CCTV',
      edgeNodeId: params?.edgeNodeId || 'EDGE-AHM-001',
      capabilities: ['FACE_DETECTION'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<{
    observation: FaceObservation;
    matchCandidateGenerated: boolean;
    summary: string;
  }> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const { 
        frameDataUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60', 
        cameraId = 'CAM-007', 
        cameraName = 'CCTV Node CAM-007 (Airport Circle)',
        district = 'Ahmedabad North',
        associatedPlate = 'GJ01AB1234',
        customTargetAlias
      } = job.payload || {};

      // 1. Extract biometric features & quality metrics
      const extracted = await faceFeatureExtractor.extractFeatures(frameDataUrl);

      // 2. Build canonical FaceObservation
      const observationId = `OBS-FACE-${cameraId}-${Date.now()}`;
      const sha256IntegrityHash = computeDeterministicHash(`FACE-OBS-${observationId}-${extracted.embeddingReferenceId}`);

      const observation: FaceObservation = {
        observationId,
        cameraId,
        cameraName,
        district,
        timestamp: new Date().toISOString(),
        boundingBox: {
          xmin: 0.35,
          ymin: 0.15,
          xmax: 0.65,
          ymax: 0.55
        },
        quality: extracted.quality,
        cropReferenceUrl: frameDataUrl,
        frameReferenceUrl: frameDataUrl,
        embeddingReferenceId: customTargetAlias 
          ? `EMB-TOKEN-${customTargetAlias.toUpperCase().replace(/\s+/g, '_')}`
          : extracted.embeddingReferenceId,
        sourceClassification: this.isSimulated ? 'SYNTHETIC_SIMULATION' : 'REAL_CONNECTED',
        associatedVehiclePlate: associatedPlate,
        provenance: 'CAMERA_OBSERVED',
        sha256IntegrityHash
      };

      // 3. Process with Face Watchlist Service
      const candidate = await faceWatchlistService.processObservation(observation);

      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);

      const summary = candidate 
        ? `Face detected on ${cameraId}. Watchlist candidate match found: ${candidate.targetAlias} (Similarity: ${candidate.similarityScore}). Enqueued for human review.`
        : `Face detected on ${cameraId} with overall quality ${observation.quality.overallQuality}. No watchlist match.`;

      sysEvents.emit('FACE_OBSERVATION_PROCESSED', { observation, candidate });

      return {
        observation,
        matchCandidateGenerated: !!candidate,
        summary
      };
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }
}

export const faceDetectionAgent = new FaceDetectionAgent();
