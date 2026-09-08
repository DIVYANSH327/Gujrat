/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ForensicBiometricsAgent: Isolated Forensic Correlation & AFIS Interface Agent
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 * 
 * Strict Constraint:
 * Forensic candidate correlations strictly require human officer review and judicial warrant.
 * Autonomous criminal identification is explicitly prohibited.
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { afisAdapter, BiometricCandidateMatch, IAFISAdapter } from '../../services/integrations/AFISAdapter';
import { dataAccessAuditService } from '../../services/DataAccessAuditService';

export class ForensicBiometricsAgent extends BaseAgent {
  private adapter: IAFISAdapter;

  constructor(params?: { agentId?: string; region?: string; adapter?: IAFISAdapter }) {
    super({
      agentId: params?.agentId || 'FORENSIC-BIOMETRICS-CENTRAL-001',
      agentType: 'FORENSIC_BIOMETRICS',
      region: params?.region || 'CENTRAL',
      assignedScope: 'ISOLATED_FORENSIC_BIOMETRICS_CORRELATION',
      capabilities: ['FORENSIC_BIOMETRICS'],
      isSimulated: true
    });
    this.adapter = params?.adapter || afisAdapter;
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async evaluateVisualCorrelation(embeddingRef: string, operator: string = 'Forensic Officer'): Promise<BiometricCandidateMatch | null> {
    const job: AIAgentJob = {
      jobId: `job-afis-${Date.now()}`,
      jobType: 'FORENSIC_CANDIDATE_CORRELATION',
      priority: 'HIGH',
      status: 'RUNNING',
      assignedAgentId: this.agentId,
      sourceId: embeddingRef,
      requiredCapabilities: ['FORENSIC_BIOMETRICS'],
      attempt: 1,
      maxAttempts: 2,
      createdAt: new Date().toISOString(),
      correlationId: `corr-afis-${Date.now()}`,
      payload: { embeddingRef, operator }
    };

    return this.assignJob(job);
  }

  public async assignJob(job: AIAgentJob): Promise<BiometricCandidateMatch | null> {
    const start = Date.now();
    this.activeJobsCount += 1;
    try {
      const payload = job.payload || {};
      const embeddingRef = payload.embeddingRef || '';
      const operator = payload.operator || 'Forensic Officer';

      const match = await this.adapter.requestCandidateVisualCorrelation(embeddingRef);

      dataAccessAuditService.logAccess(
        'ForensicBiometricsAgent',
        'AFIS_CORRELATION_REQUEST',
        embeddingRef,
        'NOT_CONNECTED',
        'AFIS Isolated Adapter',
        operator,
        'Forensic candidate query dispatched — Human verification strictly required.',
        job.correlationId
      );

      this.eventsProcessedCount += 1;
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.recordHeartbeat();

      return match;
    } catch (err) {
      this.failedJobsCount += 1;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      throw err;
    }
  }
}

export const forensicBiometricsAgent = new ForensicBiometricsAgent();
