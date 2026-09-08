/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIAuditAgent: Cryptographic & Statutory AI Action Auditing Agent
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob, AIAgentAuditRecord } from '../types';
import { sysEvents } from '../../services/Architecture';

export class AIAuditAgent extends BaseAgent {
  private auditRecords: AIAgentAuditRecord[] = [];

  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'AUDIT-CENTRAL-001',
      agentType: 'AUDIT',
      region: params?.region || 'CENTRAL',
      assignedScope: 'GOVERNANCE_COMPLIANCE',
      capabilities: ['AUDIT_COMPLIANCE'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<AIAgentAuditRecord> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const { action = 'ACTION_RECORDED', agentId = this.agentId, eventId, details = '', result = 'SUCCESS' } = job.payload || {};
      
      const record: AIAgentAuditRecord = {
        auditId: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        agentId,
        action,
        eventId,
        jobId: job.jobId,
        correlationId: job.correlationId,
        result: result as any,
        details: this.sanitizeDetails(details)
      };

      this.auditRecords.unshift(record);
      if (this.auditRecords.length > 500) this.auditRecords.pop();

      sysEvents.emit('ai_audit_logged', record);

      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);

      return record;
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public logAction(recordData: Omit<AIAgentAuditRecord, 'auditId' | 'timestamp'>): AIAgentAuditRecord {
    const record: AIAgentAuditRecord = {
      ...recordData,
      auditId: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      details: this.sanitizeDetails(recordData.details)
    };

    this.auditRecords.unshift(record);
    if (this.auditRecords.length > 500) this.auditRecords.pop();

    sysEvents.emit('ai_audit_logged', record);
    return record;
  }

  public getAuditRecords(): AIAgentAuditRecord[] {
    return [...this.auditRecords];
  }

  private sanitizeDetails(text: string): string {
    return text
      .replace(/api[_-]?key[:=]\s*["']?[^"'}\s]+["']?/gi, 'apiKey=[REDACTED]')
      .replace(/password[:=]\s*["']?[^"'}\s]+["']?/gi, 'password=[REDACTED]')
      .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]');
  }
}
