/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * FaceWatchlistAgent
 * Central AI Agent for Biometric Watchlist Candidate Corroboration & Person Dossier Assembly.
 * 
 * Strict Legal Standards: Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { faceWatchlistService } from '../../services/FaceWatchlistService';
import { unifiedPersonInvestigationService } from '../../services/UnifiedPersonInvestigationService';
import { FaceMatchCandidate, PersonDossier } from '../../types/facePersonIntelligenceTypes';
import { sysEvents } from '../../services/Architecture';

export class FaceWatchlistAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'AGENT-FACE-WATCHLIST-01',
      agentType: 'FACE_WATCHLIST',
      region: params?.region || 'STATE_COMMAND_CENTRAL',
      assignedScope: 'STATEWIDE_WATCHLIST_CORRELATION',
      capabilities: ['FACE_WATCHLIST_MATCHING', 'PERSON_INVESTIGATION'],
      isSimulated: params?.isSimulated ?? true
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<{
    candidates?: FaceMatchCandidate[];
    dossier?: PersonDossier | null;
    summary: string;
  }> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const { action = 'LIST_CANDIDATES', targetId, targetAlias } = job.payload || {};

      if (action === 'BUILD_DOSSIER') {
        const query = targetId || targetAlias || 'WLIST-FACE-001';
        const dossier = await unifiedPersonInvestigationService.buildPersonDossier(query);
        
        this.completedJobsCount += 1;
        this.totalLatencyMs += (Date.now() - start);

        return {
          dossier,
          summary: dossier 
            ? `Compiled unified person dossier for ${dossier.personAlias} with ${dossier.sightings.length} sightings and ${dossier.correlatedVehicles.length} vehicle links.`
            : `Target not found for dossier compilation: ${query}`
        };
      }

      // Default: list or filter candidates
      const candidates = faceWatchlistService.listMatchCandidates({ targetId });
      
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);

      return {
        candidates,
        summary: `Retrieved ${candidates.length} face watchlist candidates from state intelligence repository.`
      };
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }
}

export const faceWatchlistAgent = new FaceWatchlistAgent();
