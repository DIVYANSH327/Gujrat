/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * V2.2 Challan Mode Mesh Agents:
 * - ChallanDetectionAgent
 * - ViolationEvidenceAgent
 * - ChallanReviewAgent
 * - ChallanDispatchAgent
 * - EvidenceSufficiencyAgent
 * - TrafficViolationRuleAgent
 * 
 * Security & Integrity:
 * Strict typed commands only. No arbitrary shell execution or dynamic code evaluation.
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { 
  ViolationCase, 
  ViolationEvidencePackage, 
  AuthorizedDispatchContext, 
  ViolationType,
  EvidenceSufficiencyResult 
} from '../../types/v22ChallanTypes';
import { trafficViolationRuleEngine } from '../../services/TrafficViolationRuleEngine';
import { violationEvidenceCaptureService } from '../../services/ViolationEvidenceCaptureService';
import { evidenceSufficiencyService } from '../../services/EvidenceSufficiencyService';
import { challanReviewService } from '../../services/ChallanReviewService';
import { simulatedChallanProvider } from '../../services/ChallanProviderService';

/**
 * 1. ChallanDetectionAgent
 * Ingests camera optical observations and identifies candidate violation events
 */
export class ChallanDetectionAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; edgeNodeId?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'CHALLAN-DETECTION-01',
      agentType: 'CHALLAN_DETECTION',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'ROAD_SAFETY_DETECTION',
      edgeNodeId: params?.edgeNodeId || 'EDGE-AHM-001',
      capabilities: ['CHALLAN_DETECTION'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount++;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<any> {
    this.activeJobsCount++;
    const start = Date.now();
    try {
      const { violationType, evaluationContext, speedLimitKmH = 60 } = job.payload || {};
      const result = trafficViolationRuleEngine.evaluateViolation(violationType, evaluationContext, speedLimitKmH);
      this.completedJobsCount++;
      this.totalLatencyMs += (Date.now() - start);
      return result;
    } catch (err) {
      this.failedJobsCount++;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public async handleCommand(command: string, params: any): Promise<any> {
    if (command === 'SET_DETECTION_MODE') {
      return { status: 'OK', mode: params?.mode || 'REAL_TIME' };
    }
    return super.handleCommand(command, params);
  }
}

/**
 * 2. ViolationEvidenceAgent
 * Collects multi-frame context, vehicle crop, plate crop, and calculates SHA-256 integrity fingerprint
 */
export class ViolationEvidenceAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; edgeNodeId?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'VIOLATION-EVIDENCE-01',
      agentType: 'VIOLATION_EVIDENCE',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'EVIDENCE_PACKAGING',
      edgeNodeId: params?.edgeNodeId || 'EDGE-AHM-001',
      capabilities: ['VIOLATION_EVIDENCE_PACKAGING'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount++;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<ViolationEvidencePackage> {
    this.activeJobsCount++;
    const start = Date.now();
    try {
      const pkg = violationEvidenceCaptureService.captureViolationEvidence(job.payload);
      this.evidenceCapturedCount++;
      this.completedJobsCount++;
      this.totalLatencyMs += (Date.now() - start);
      return pkg;
    } catch (err) {
      this.failedJobsCount++;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public async handleCommand(command: string, params: any): Promise<any> {
    if (command === 'VERIFY_PACKAGE_INTEGRITY') {
      const pkg = violationEvidenceCaptureService.getEvidencePackage(params.packageId);
      if (!pkg) return { error: 'Package not found' };
      return violationEvidenceCaptureService.verifyIntegrityHash(pkg);
    }
    return super.handleCommand(command, params);
  }
}

/**
 * 3. ChallanReviewAgent
 * Routes candidate cases to human review queues, manages locks, claims, and approval audits
 */
export class ChallanReviewAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; edgeNodeId?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'CHALLAN-REVIEW-01',
      agentType: 'CHALLAN_REVIEW',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'HUMAN_REVIEW_ORCHESTRATION',
      edgeNodeId: params?.edgeNodeId || 'EDGE-AHM-001',
      capabilities: ['CHALLAN_REVIEW_ROUTING'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount++;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<any> {
    this.activeJobsCount++;
    const start = Date.now();
    try {
      const { action, caseObj, caseId, reviewer, reason } = job.payload || {};
      let res: any;

      if (action === 'SUBMIT') {
        res = challanReviewService.submitForReview(caseObj);
      } else if (action === 'CLAIM') {
        res = challanReviewService.claimCase(caseId, reviewer);
      } else if (action === 'APPROVE') {
        res = challanReviewService.approveCase(caseId, reviewer, reason);
      } else if (action === 'REJECT') {
        res = challanReviewService.rejectCase(caseId, reviewer, reason);
      } else if (action === 'INSUFFICIENT') {
        res = challanReviewService.markInsufficientEvidence(caseId, reviewer, reason);
      } else {
        res = challanReviewService.getPendingCases();
      }

      this.completedJobsCount++;
      this.totalLatencyMs += (Date.now() - start);
      return res;
    } catch (err) {
      this.failedJobsCount++;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public async handleCommand(command: string, params: any): Promise<any> {
    if (command === 'GET_REVIEW_QUEUE_METRICS') {
      return challanReviewService.getKPIs();
    }
    return super.handleCommand(command, params);
  }
}

/**
 * 4. ChallanDispatchAgent
 * Executes authorized dispatch to verified e-challan provider gateway
 */
export class ChallanDispatchAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; edgeNodeId?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'CHALLAN-DISPATCH-01',
      agentType: 'CHALLAN_DISPATCH',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'ECHALLAN_DISPATCH_GATEWAY',
      edgeNodeId: params?.edgeNodeId || 'EDGE-AHM-001',
      capabilities: ['CHALLAN_DISPATCH_GATEWAY'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount++;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<any> {
    this.activeJobsCount++;
    const start = Date.now();
    try {
      const { caseId, reviewer, provider = simulatedChallanProvider } = job.payload || {};
      const res = await challanReviewService.dispatchChallan(caseId, reviewer, provider);
      this.completedJobsCount++;
      this.totalLatencyMs += (Date.now() - start);
      return res;
    } catch (err) {
      this.failedJobsCount++;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public async handleCommand(command: string, params: any): Promise<any> {
    if (command === 'GATEWAY_HEALTH_CHECK') {
      return await simulatedChallanProvider.healthCheck();
    }
    return super.handleCommand(command, params);
  }
}

/**
 * 5. EvidenceSufficiencyAgent
 * Validates evidentiary completeness & protects against low-confidence false positives
 */
export class EvidenceSufficiencyAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; edgeNodeId?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'EVIDENCE-SUFFICIENCY-01',
      agentType: 'EVIDENCE_SUFFICIENCY',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'EVIDENTIARY_VALIDATION',
      edgeNodeId: params?.edgeNodeId || 'EDGE-AHM-001',
      capabilities: ['EVIDENCE_SUFFICIENCY_ANALYSIS'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount++;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<EvidenceSufficiencyResult> {
    this.activeJobsCount++;
    const start = Date.now();
    try {
      const { caseObj, evidencePkg } = job.payload || {};
      const res = evidenceSufficiencyService.evaluateSufficiency(caseObj, evidencePkg);
      this.completedJobsCount++;
      this.totalLatencyMs += (Date.now() - start);
      return res;
    } catch (err) {
      this.failedJobsCount++;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public async handleCommand(command: string, params: any): Promise<any> {
    if (command === 'CHECK_CAN_DISPATCH') {
      const res = evidenceSufficiencyService.evaluateSufficiency(params.caseObj);
      return { canDispatch: res.canDispatch, status: res.status };
    }
    return super.handleCommand(command, params);
  }
}

/**
 * 6. TrafficViolationRuleAgent
 * Maintains and runs statutory motor vehicles rules configuration
 */
export class TrafficViolationRuleAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; edgeNodeId?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'TRAFFIC-RULE-AGENT-01',
      agentType: 'TRAFFIC_VIOLATION_RULE',
      region: params?.region || 'AHMEDABAD',
      assignedScope: 'STATUTORY_RULES_MAINTENANCE',
      edgeNodeId: params?.edgeNodeId || 'EDGE-AHM-001',
      capabilities: ['TRAFFIC_RULE_EVALUATION'],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount++;
    this.recordHeartbeat();
  }

  public async assignJob(job: AIAgentJob): Promise<any> {
    this.activeJobsCount++;
    const start = Date.now();
    try {
      const { violationType } = job.payload || {};
      const rule = trafficViolationRuleEngine.getRule(violationType);
      const readiness = trafficViolationRuleEngine.getReadinessState(violationType);
      this.completedJobsCount++;
      this.totalLatencyMs += (Date.now() - start);
      return { rule, readiness };
    } catch (err) {
      this.failedJobsCount++;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  public async handleCommand(command: string, params: any): Promise<any> {
    if (command === 'LIST_RULES') {
      return trafficViolationRuleEngine.getAllRules();
    }
    return super.handleCommand(command, params);
  }
}

// Singletons
export const challanDetectionAgent = new ChallanDetectionAgent();
export const violationEvidenceAgent = new ViolationEvidenceAgent();
export const challanReviewAgent = new ChallanReviewAgent();
export const challanDispatchAgent = new ChallanDispatchAgent();
export const evidenceSufficiencyAgent = new EvidenceSufficiencyAgent();
export const trafficViolationRuleAgent = new TrafficViolationRuleAgent();
