/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * EChallanIntelligenceAgent: Traffic Violation History & Fine Status Agent
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { echallanAdapter, EChallanRecord, IEChallanAdapter } from '../../services/integrations/EChallanAdapter';
import { dataAccessAuditService } from '../../services/DataAccessAuditService';

export class EChallanIntelligenceAgent extends BaseAgent {
  private adapter: IEChallanAdapter;

  constructor(params?: { agentId?: string; region?: string; adapter?: IEChallanAdapter }) {
    super({
      agentId: params?.agentId || 'ECHALLAN-INTEL-CENTRAL-001',
      agentType: 'ECHALLAN_INTELLIGENCE',
      region: params?.region || 'CENTRAL',
      assignedScope: 'TRAFFIC_ENFORCEMENT_CHALLAN_INTEL',
      capabilities: ['ECHALLAN_INTEGRATION'],
      isSimulated: true
    });
    this.adapter = params?.adapter || echallanAdapter;
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async lookupChallans(plate: string, operator: string = 'System Orchestrator'): Promise<EChallanRecord> {
    const job: AIAgentJob = {
      jobId: `job-echallan-${Date.now()}`,
      jobType: 'ECHALLAN_RECORD_LOOKUP',
      priority: 'NORMAL',
      status: 'RUNNING',
      assignedAgentId: this.agentId,
      sourceId: plate,
      requiredCapabilities: ['ECHALLAN_INTEGRATION'],
      attempt: 1,
      maxAttempts: 2,
      createdAt: new Date().toISOString(),
      correlationId: `corr-echallan-${Date.now()}`,
      payload: { plate, operator }
    };

    return this.assignJob(job);
  }

  public async assignJob(job: AIAgentJob): Promise<EChallanRecord> {
    const start = Date.now();
    this.activeJobsCount += 1;
    try {
      const payload = job.payload || {};
      const plate = payload.plate || '';
      const operator = payload.operator || 'System Orchestrator';

      const record = await this.adapter.lookupChallansByVehicle(plate);

      // Record audit trail
      dataAccessAuditService.logAccess(
        'EChallanIntelligenceAgent',
        'ECHALLAN_QUERY',
        plate,
        record.status !== 'NOT_CONNECTED' ? 'RECORD_FOUND' : 'NOT_CONNECTED',
        record.source,
        operator,
        `Pending challans: ${record.pendingChallans}, Total fine: ₹${record.totalOutstandingAmount}`,
        job.correlationId
      );

      this.eventsProcessedCount += 1;
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.recordHeartbeat();

      return record;
    } catch (err) {
      this.failedJobsCount += 1;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      throw err;
    }
  }
}

export const echallanIntelligenceAgent = new EChallanIntelligenceAgent();
