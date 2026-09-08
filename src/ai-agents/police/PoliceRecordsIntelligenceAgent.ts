/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * PoliceRecordsIntelligenceAgent: eGujCop / CCTNS FIR, Warrant, and BOLO Agent
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { egujcopAdapter, PoliceRecordsResult, IEGujCopAdapter } from '../../services/integrations/EGujCopAdapter';
import { dataAccessAuditService } from '../../services/DataAccessAuditService';

export class PoliceRecordsIntelligenceAgent extends BaseAgent {
  private adapter: IEGujCopAdapter;

  constructor(params?: { agentId?: string; region?: string; adapter?: IEGujCopAdapter }) {
    super({
      agentId: params?.agentId || 'POLICE-RECORDS-CENTRAL-001',
      agentType: 'POLICE_RECORDS_INTELLIGENCE',
      region: params?.region || 'CENTRAL',
      assignedScope: 'STATE_POLICE_RECORDS_EGUJCOP_INTEL',
      capabilities: ['POLICE_RECORDS_INTEGRATION'],
      isSimulated: true
    });
    this.adapter = params?.adapter || egujcopAdapter;
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async lookupPoliceRecords(target: string, operator: string = 'System Orchestrator'): Promise<PoliceRecordsResult> {
    const job: AIAgentJob = {
      jobId: `job-records-${Date.now()}`,
      jobType: 'POLICE_RECORDS_LOOKUP',
      priority: 'CRITICAL',
      status: 'RUNNING',
      assignedAgentId: this.agentId,
      sourceId: target,
      requiredCapabilities: ['POLICE_RECORDS_INTEGRATION'],
      attempt: 1,
      maxAttempts: 2,
      createdAt: new Date().toISOString(),
      correlationId: `corr-records-${Date.now()}`,
      payload: { target, operator }
    };

    return this.assignJob(job);
  }

  public async assignJob(job: AIAgentJob): Promise<PoliceRecordsResult> {
    const start = Date.now();
    this.activeJobsCount += 1;
    try {
      const payload = job.payload || {};
      const target = payload.target || '';
      const operator = payload.operator || 'System Orchestrator';

      const result = await this.adapter.lookupVehicle(target);

      // Record audit trail
      dataAccessAuditService.logAccess(
        'PoliceRecordsIntelligenceAgent',
        'EGUJCOP_FIR_SEARCH',
        target,
        result.status === 'RECORDS_FOUND' ? 'RECORD_FOUND' : result.status === 'FUTURE_INTEGRATION' ? 'NOT_CONNECTED' : 'NO_RECORD',
        result.source,
        operator,
        `Records found: ${result.recordsFound} (eGujCop / CCTNS Records Search)`,
        job.correlationId
      );

      this.eventsProcessedCount += 1;
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.recordHeartbeat();

      return result;
    } catch (err) {
      this.failedJobsCount += 1;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      throw err;
    }
  }
}

export const policeRecordsIntelligenceAgent = new PoliceRecordsIntelligenceAgent();
