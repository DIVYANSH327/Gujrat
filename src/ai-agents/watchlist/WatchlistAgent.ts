/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * WatchlistAgent: Synthetic Subject & Vehicle Plate Cross-Correlation Agent
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { centralRepo, sysEvents } from '../../services/Architecture';
import { WatchlistTarget } from '../../types';

export interface WatchlistMatchResult {
  matched: boolean;
  target?: WatchlistTarget;
  similarity: number;
  confidence: number;
  explanation: string;
  disclaimer: string;
  isSimulated: boolean;
}

export class WatchlistAgent extends BaseAgent {
  private syntheticWatchlist: WatchlistTarget[] = [
    {
      id: 'WL-001',
      targetId: 'P-DEMO-003',
      name: 'Synthetic Subject Alpha (P-DEMO-003)',
      imageUrl: '/demo-traffic-frame.jpg',
      threatLevel: 'high',
      lastKnownAttire: 'Synthetic demonstration target for corridor traversal validation',
      dateAdded: '2026-09-01T00:00:00Z'
    },
    {
      id: 'WL-002',
      name: 'White Sedan (GJ01AB1234)',
      imageUrl: '/demo-traffic-frame.jpg',
      associatedPlate: 'GJ01AB1234',
      vehiclePlate: 'GJ01AB1234',
      threatLevel: 'critical',
      lastKnownAttire: 'Associated with Airport Road traffic incident investigation',
      dateAdded: '2026-09-02T00:00:00Z'
    }
  ];

  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'WATCHLIST-CENTRAL-001',
      agentType: 'WATCHLIST',
      region: params?.region || 'CENTRAL',
      assignedScope: 'STATEWIDE_SURVEILLANCE',
      capabilities: ['WATCHLIST'],
      isSimulated: params?.isSimulated ?? true
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<WatchlistMatchResult> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const { targetId, licensePlate, category = 'PERSON' } = job.payload || {};

      let matchedTarget: WatchlistTarget | undefined;
      let similarity = 0;

      // Check against synthetic watchlist
      if (targetId && (targetId === 'P-DEMO-003' || targetId.includes('P-DEMO') || targetId.includes('WL-001'))) {
        matchedTarget = this.syntheticWatchlist.find(t => t.id === 'WL-001');
        similarity = 0.94;
      } else if (licensePlate && (licensePlate === 'GJ01AB1234' || licensePlate.includes('GJ01'))) {
        matchedTarget = this.syntheticWatchlist.find(t => t.id === 'WL-002');
        similarity = 0.98;
      }

      const result: WatchlistMatchResult = {
        matched: !!matchedTarget,
        target: matchedTarget,
        similarity,
        confidence: matchedTarget ? similarity : 0.15,
        explanation: matchedTarget 
          ? `Visual target matched synthetic profile ${matchedTarget.name} with ${Math.round(similarity * 100)}% visual feature correlation.`
          : 'No visual or optical match found against active watchlist targets.',
        disclaimer: 'AI VISUAL CORRELATION / SYNTHETIC INVESTIGATION SUBJECT — NOT BIOMETRIC IDENTITY',
        isSimulated: this.isSimulated
      };

      if (matchedTarget) {
        sysEvents.emit('watchlist_matched', {
          targetId: matchedTarget.id,
          targetName: matchedTarget.name,
          confidence: similarity,
          correlationId: job.correlationId,
          timestamp: new Date().toISOString()
        });
      }

      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      return result;
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public getWatchlistTargets(): WatchlistTarget[] {
    return [...this.syntheticWatchlist];
  }
}
