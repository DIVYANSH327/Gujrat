/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * RoadSegmentIntelligenceService: Arterial Highway & Junction Corridor State Service
 */

import { RoadSegmentIntelligence } from '../types';

export class RoadSegmentIntelligenceService {
  private static instance: RoadSegmentIntelligenceService | null = null;
  private segments: Map<string, RoadSegmentIntelligence> = new Map();

  private constructor() {
    this.seedSegments();
  }

  public static getInstance(): RoadSegmentIntelligenceService {
    if (!RoadSegmentIntelligenceService.instance) {
      RoadSegmentIntelligenceService.instance = new RoadSegmentIntelligenceService();
    }
    return RoadSegmentIntelligenceService.instance;
  }

  private seedSegments(): void {
    const defaultSegments: RoadSegmentIntelligence[] = [
      {
        segmentId: 'SEG-AIRPORT-RD',
        name: 'Airport Approach Corridor (Hansol - Terminal 2)',
        cameraIds: ['CAM-007', 'CAM-014'],
        direction: 'NORTH_EASTBOUND',
        vehicleCount: 142,
        averageSpeedEstimate: 54,
        congestion: 'LOW',
        incidents: 1,
        roadSafetyEvents: 4,
        watchlistEvents: 1,
        lastUpdated: new Date().toISOString()
      },
      {
        segmentId: 'SEG-SG-HIGHWAY',
        name: 'Sarkhej - Gandhinagar Highway (Thaltej - Iskcon Flyover)',
        cameraIds: ['CAM-023', 'CAM-031'],
        direction: 'DUAL_CARRIAGEWAY',
        vehicleCount: 384,
        averageSpeedEstimate: 62,
        congestion: 'MEDIUM',
        incidents: 2,
        roadSafetyEvents: 9,
        watchlistEvents: 2,
        lastUpdated: new Date().toISOString()
      },
      {
        segmentId: 'SEG-RING-RD',
        name: 'Sardar Patel Ring Road (Bopal - Vaishnodevi Junction)',
        cameraIds: ['CAM-001', 'CAM-002'],
        direction: 'OUTER_RING',
        vehicleCount: 290,
        averageSpeedEstimate: 68,
        congestion: 'LOW',
        incidents: 0,
        roadSafetyEvents: 3,
        watchlistEvents: 0,
        lastUpdated: new Date().toISOString()
      }
    ];

    defaultSegments.forEach(s => this.segments.set(s.segmentId, s));
  }

  public getAllSegments(): RoadSegmentIntelligence[] {
    return Array.from(this.segments.values());
  }

  public getSegment(segmentId: string): RoadSegmentIntelligence | null {
    return this.segments.get(segmentId) || null;
  }

  public updateSegmentMetrics(segmentId: string, delta: Partial<RoadSegmentIntelligence>): void {
    const seg = this.segments.get(segmentId);
    if (seg) {
      this.segments.set(segmentId, {
        ...seg,
        ...delta,
        lastUpdated: new Date().toISOString()
      });
    }
  }
}

export const roadSegmentIntelligenceService = RoadSegmentIntelligenceService.getInstance();
