/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * InvestigationAgent: Multi-Camera Journey Reconstruction & God's Eye Synch Agent
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { sysEvents } from '../../services/Architecture';

export interface VisualTrackSighting {
  cameraId: string;
  timestamp: string;
  trackId: string;
  confidence: number;
  evidenceId?: string;
  alertId?: string;
  eventId: string;
  locationName: string;
}

export interface ReconstructedJourney {
  journeyId: string;
  targetTrackId: string;
  targetType: 'PERSON' | 'VEHICLE' | 'MOTORCYCLE';
  sightings: VisualTrackSighting[];
  totalDistanceMeters?: number;
  durationSeconds: number;
  disclaimer: string;
  isSimulated: boolean;
}

export class InvestigationAgent extends BaseAgent {
  private journeys: Map<string, ReconstructedJourney> = new Map();

  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'INVESTIGATION-CENTRAL-001',
      agentType: 'INVESTIGATION',
      region: params?.region || 'CENTRAL',
      assignedScope: 'CRIMINAL_INVESTIGATION_DIVISION',
      capabilities: ['INVESTIGATION'],
      isSimulated: params?.isSimulated ?? true
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<ReconstructedJourney> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const {
        targetTrackId = 'BIKE-TRACK-001',
        targetType = 'MOTORCYCLE',
        sightings
      } = job.payload || {};

      const journeyId = `JRN-${targetTrackId}-${Date.now()}`;
      
      const defaultSightings: VisualTrackSighting[] = sightings || [
        {
          cameraId: 'CAM-AHM-007',
          timestamp: '2026-09-05T08:10:00Z',
          trackId: targetTrackId,
          confidence: 0.94,
          eventId: 'EVT-007-A',
          locationName: 'Airport Circle North Gate'
        },
        {
          cameraId: 'CAM-AHM-014',
          timestamp: '2026-09-05T08:14:00Z',
          trackId: targetTrackId,
          confidence: 0.92,
          eventId: 'EVT-014-B',
          evidenceId: 'EVD-REAL-014',
          locationName: 'Hansol Junction Crossroad'
        },
        {
          cameraId: 'CAM-AHM-023',
          timestamp: '2026-09-05T08:19:00Z',
          trackId: targetTrackId,
          confidence: 0.91,
          eventId: 'EVT-023-C',
          locationName: 'DGP Office Perimeter Road'
        },
        {
          cameraId: 'CAM-AHM-031',
          timestamp: '2026-09-05T08:25:00Z',
          trackId: targetTrackId,
          confidence: 0.89,
          eventId: 'EVT-031-D',
          locationName: 'Sabarmati Riverfront Flyover'
        }
      ];

      const journey: ReconstructedJourney = {
        journeyId,
        targetTrackId,
        targetType,
        sightings: defaultSightings,
        durationSeconds: 900,
        disclaimer: 'CROSS-CAMERA VISUAL TRACK — NOT IDENTIFIED PERSON',
        isSimulated: this.isSimulated
      };

      this.journeys.set(journeyId, journey);

      // Synchronize with God's Eye architecture
      sysEvents.emit('gods_eye_corridor_synced', {
        journeyId,
        targetTrackId,
        sightings: defaultSightings,
        correlationId: job.correlationId
      });

      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);

      return journey;
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public getJourney(journeyId: string): ReconstructedJourney | undefined {
    return this.journeys.get(journeyId);
  }

  public getAllJourneys(): ReconstructedJourney[] {
    return Array.from(this.journeys.values());
  }
}
