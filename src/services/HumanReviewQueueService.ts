/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * HumanReviewQueueService
 * Human Oversight & Verification Queue for High-Impact Autonomous AI Operations.
 * Absolute Rule: Human review never silently overwrites raw AI inference.
 */

import { 
  HumanReviewItem, 
  ReviewType, 
  ReviewStatus 
} from '../types';
import { centralEventBus } from './CentralEventBus';
import { confidencePolicyService } from './ConfidencePolicyService';
import { sysEvents } from './Architecture';

export class HumanReviewQueueService {
  private static instance: HumanReviewQueueService | null = null;
  private queue: Map<string, HumanReviewItem> = new Map();

  private constructor() {
    this.seedDefaultReviewItems();
  }

  public static getInstance(): HumanReviewQueueService {
    if (!HumanReviewQueueService.instance) {
      HumanReviewQueueService.instance = new HumanReviewQueueService();
    }
    return HumanReviewQueueService.instance;
  }

  private seedDefaultReviewItems(): void {
    const now = Date.now();

    const items: HumanReviewItem[] = [
      {
        reviewId: 'REV-2026-0101',
        reviewType: 'WATCHLIST_MATCH',
        priority: 'P0_CRITICAL',
        status: 'PENDING',
        subjectPlate: 'GJ01AB1234',
        cameraId: 'CAM-007',
        originalInference: {
          matchedTarget: 'Arjun Rathod (GJ-WLIST-001)',
          anprScore: 0.96,
          visualEmbeddingSimilarity: 0.88,
          crimeCategory: 'Section 302 IPC / Serious Offense'
        },
        originalConfidence: 0.92,
        confidenceBand: 'VERY_HIGH',
        contributingSignals: [
          { signal: 'HSRP Plate OCR', value: 'GJ01AB1234 (Exact Match)', status: 'MATCH', weight: 40 },
          { signal: 'Vehicle Make/Model', value: 'White Toyota Fortuner SUV', status: 'MATCH', weight: 25 },
          { signal: 'Temporal Corridor', value: 'Pakwan Cross Junction', status: 'MATCH', weight: 20 },
          { signal: 'Known Modus Operandi', value: 'Highway corridor transit', status: 'MATCH', weight: 15 }
        ],
        conflictingSignals: [],
        missingSignals: ['Frontal driver facial biometric'],
        evidenceThumbnail: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=60',
        sourceOfTruth: 'AI_INFERRED',
        createdAt: new Date(now - 14 * 60000).toISOString()
      },
      {
        reviewId: 'REV-2026-0102',
        reviewType: 'PLATE_VERIFICATION',
        priority: 'P1_HIGH',
        status: 'PENDING',
        subjectPlate: 'GJ05AB1034',
        cameraId: 'CAM-014',
        originalInference: {
          rawOcrPlate: 'GJ05AB1O34',
          cleanedPlate: 'GJ05AB1034',
          ambiguousCharacter: 'O vs 0',
          characterConfidence: 0.74
        },
        originalConfidence: 0.76,
        confidenceBand: 'MEDIUM',
        contributingSignals: [
          { signal: 'Character 7 Ambiguity', value: 'Glyph O / 0 ambiguity detected', status: 'PARTIAL', weight: 35 },
          { signal: 'Vehicle Geometry', value: 'Commercial Tata Ace Van', status: 'MATCH', weight: 30 },
          { signal: 'HSRP Font Norm', value: 'Standard High Security Plate', status: 'MATCH', weight: 20 }
        ],
        conflictingSignals: ['Optical character thickness inconsistent with letter O'],
        missingSignals: [],
        evidenceThumbnail: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&auto=format&fit=crop&q=60',
        sourceOfTruth: 'AI_INFERRED',
        createdAt: new Date(now - 28 * 60000).toISOString()
      },
      {
        reviewId: 'REV-2026-0103',
        reviewType: 'VIOLATION_REVIEW',
        priority: 'P2_OPERATIONAL',
        status: 'PENDING',
        subjectPlate: 'GJ01CD5678',
        cameraId: 'CAM-019',
        originalInference: {
          violationType: 'NO_HELMET',
          riderCount: 2,
          pillionHelmet: 'NO_HELMET',
          riderHelmet: 'HELMET'
        },
        originalConfidence: 0.88,
        confidenceBand: 'HIGH',
        contributingSignals: [
          { signal: 'Pillion Head Bounding Box', value: 'Bare head / No helmet detected', status: 'MATCH', weight: 45 },
          { signal: 'Vehicle Class', value: 'Two-Wheeler / Scooter', status: 'MATCH', weight: 30 },
          { signal: 'Lighting Quality', value: 'Daylight clear illumination', status: 'MATCH', weight: 20 }
        ],
        conflictingSignals: [],
        missingSignals: [],
        evidenceThumbnail: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&auto=format&fit=crop&q=60',
        sourceOfTruth: 'AI_INFERRED',
        createdAt: new Date(now - 45 * 60000).toISOString()
      }
    ];

    items.forEach(item => this.queue.set(item.reviewId, item));
  }

  public enqueueReview(params: Omit<HumanReviewItem, 'reviewId' | 'status' | 'createdAt' | 'sourceOfTruth'>): HumanReviewItem {
    const reviewId = `REV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const item: HumanReviewItem = {
      ...params,
      reviewId,
      status: 'PENDING',
      sourceOfTruth: 'AI_INFERRED',
      createdAt: now
    };

    this.queue.set(reviewId, item);

    centralEventBus.publish({
      eventType: 'HUMAN_REVIEW_REQUIRED',
      sourceId: 'HumanReviewQueueService',
      correlationId: reviewId,
      idempotencyKey: `REV-REQ-${reviewId}`,
      priority: params.priority === 'P0_CRITICAL' ? 'P0' : params.priority === 'P1_HIGH' ? 'P1' : 'P2',
      payload: item
    });

    sysEvents.emit('REVIEW_ENQUEUED', item);
    return item;
  }

  /**
   * Records authoritative human decision without mutating original AI inference
   */
  public submitDecision(params: {
    reviewId: string;
    decision: 'APPROVED' | 'REJECTED' | 'DISPUTED';
    reviewerId: string;
    reviewerName: string;
    comment: string;
  }): HumanReviewItem | null {
    const item = this.queue.get(params.reviewId);
    if (!item) return null;

    item.status = params.decision === 'APPROVED' ? 'APPROVED' : params.decision === 'REJECTED' ? 'REJECTED' : 'DISPUTED';
    item.humanDecision = params.decision;
    item.reviewerId = params.reviewerId;
    item.reviewerName = params.reviewerName;
    item.humanComment = params.comment;
    item.decidedAt = new Date().toISOString();
    item.sourceOfTruth = params.decision === 'APPROVED' ? 'HUMAN_VERIFIED' : 'HUMAN_DISPUTED';

    // Record lineage audit trail
    confidencePolicyService.recordLineage({
      recordId: item.reviewId,
      sourceType: item.sourceOfTruth,
      sourceId: item.reviewerId,
      derivedFrom: [item.reviewId],
      transformation: `Human decision [${params.decision}] by ${params.reviewerName}: ${params.comment}`,
      humanReview: true,
      confidence: params.decision === 'APPROVED' ? 1.0 : 0.0
    });

    centralEventBus.publish({
      eventType: 'HUMAN_REVIEW_COMPLETED',
      sourceId: 'HumanReviewQueueService',
      correlationId: item.reviewId,
      idempotencyKey: `REV-DEC-${item.reviewId}-${Date.now()}`,
      priority: 'P1',
      payload: item
    });

    sysEvents.emit('REVIEW_RESOLVED', item);
    return item;
  }

  public getReviewItem(reviewId: string): HumanReviewItem | undefined {
    return this.queue.get(reviewId);
  }

  public listReviewItems(filter?: { status?: ReviewStatus; reviewType?: ReviewType }): HumanReviewItem[] {
    let list = Array.from(this.queue.values());
    if (filter) {
      if (filter.status) list = list.filter(i => i.status === filter.status);
      if (filter.reviewType) list = list.filter(i => i.reviewType === filter.reviewType);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPendingCount(): number {
    return Array.from(this.queue.values()).filter(i => i.status === 'PENDING').length;
  }
}

export const humanReviewQueueService = HumanReviewQueueService.getInstance();
