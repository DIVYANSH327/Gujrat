/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VahanIntelligenceAgent: Vehicle Registration Verification & Registry Lookup Agent
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { vahanAdapter, VahanVehicleRecord, IVahanAdapter } from '../../services/integrations/VahanAdapter';
import { dataAccessAuditService } from '../../services/DataAccessAuditService';

export class VahanIntelligenceAgent extends BaseAgent {
  private adapter: IVahanAdapter;

  constructor(params?: { agentId?: string; region?: string; adapter?: IVahanAdapter }) {
    super({
      agentId: params?.agentId || 'VAHAN-INTEL-CENTRAL-001',
      agentType: 'VAHAN_INTELLIGENCE',
      region: params?.region || 'CENTRAL',
      assignedScope: 'STATE_VEHICLE_REGISTRY_VERIFICATION',
      capabilities: ['VAHAN_INTEGRATION'],
      isSimulated: true
    });
    this.adapter = params?.adapter || vahanAdapter;
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async lookupVehicle(plate: string, operator: string = 'System Orchestrator'): Promise<VahanVehicleRecord> {
    const job: AIAgentJob = {
      jobId: `job-vahan-${Date.now()}`,
      jobType: 'VAHAN_RECORD_LOOKUP',
      priority: 'HIGH',
      status: 'RUNNING',
      assignedAgentId: this.agentId,
      sourceId: plate,
      requiredCapabilities: ['VAHAN_INTEGRATION'],
      attempt: 1,
      maxAttempts: 2,
      createdAt: new Date().toISOString(),
      correlationId: `corr-vahan-${Date.now()}`,
      payload: { plate, operator }
    };

    return this.assignJob(job);
  }

  public async assignJob(job: AIAgentJob): Promise<VahanVehicleRecord> {
    const start = Date.now();
    this.activeJobsCount += 1;
    try {
      const payload = job.payload || {};
      const plate = payload.plate || '';
      const operator = payload.operator || 'System Orchestrator';

      const record = await this.adapter.lookupVehicleRegistration(plate);

      // Record audit trail
      dataAccessAuditService.logAccess(
        'VahanIntelligenceAgent',
        'VAHAN_REGISTRY_LOOKUP',
        plate,
        record.registrationStatus !== 'NOT_CONNECTED' ? 'RECORD_FOUND' : 'NOT_CONNECTED',
        record.source,
        operator,
        `Vehicle class: ${record.vehicleClass}, Make: ${record.make}, RTO: ${record.rto || 'N/A'}`,
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

export const vahanIntelligenceAgent = new VahanIntelligenceAgent();
