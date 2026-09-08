/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ChallanReviewService: Human-in-the-Loop Review Queue, Approval Gate & Audit Orchestration
 * 
 * Strict Enforcement:
 * AI detection alone: CANNOT issue challan.
 * AI detection + evidence: CANNOT issue challan.
 * AI detection + external vehicle lookup: CANNOT issue challan.
 * ONLY:
 * AUTHORIZED HUMAN REVIEWER + APPROVED CASE + REQUIRED EVIDENCE COMPLETE + AUTHORIZED CHALLAN PROVIDER + VALID POLICY
 * may transition to DISPATCH_PENDING then E_CHALLAN_ISSUED.
 */

import {
  ViolationCase,
  ViolationCaseStatus,
  AuthorizedDispatchContext,
  ChallanDispatchResult,
  ChallanAuditRecord,
  IChallanProvider,
  ViolationType,
  ViolationEvidencePackage
} from '../types/v22ChallanTypes';
import { evidenceSufficiencyService } from './EvidenceSufficiencyService';
import { simulatedChallanProvider, authorizedEChallanProvider } from './ChallanProviderService';
import { centralEventBus } from './CentralEventBus';
import { sysEvents } from './Architecture';
import { vehicleDossierService } from './VehicleDossierService';
import { violationEvidenceCaptureService } from './ViolationEvidenceCaptureService';

export interface ReviewQueueFilters {
  status?: ViolationCaseStatus | 'ALL';
  violationType?: ViolationType | 'ALL';
  cameraId?: string;
  searchQuery?: string;
  minConfidence?: number;
  page?: number;
  pageSize?: number;
}

export class ChallanReviewService {
  private static instance: ChallanReviewService | null = null;
  private cases: Map<string, ViolationCase> = new Map();
  private auditTrail: ChallanAuditRecord[] = [];
  private idempotencyKeys: Map<string, string> = new Map(); // key -> caseId

  public static getInstance(): ChallanReviewService {
    if (!ChallanReviewService.instance) {
      ChallanReviewService.instance = new ChallanReviewService();
      ChallanReviewService.instance.seedInitialCases();
    }
    return ChallanReviewService.instance;
  }

  private constructor() {}

  /**
   * Deterministic duplicate prevention key
   */
  public generateEnforcementFingerprint(
    cameraId: string, 
    normalizedPlate: string, 
    violationType: string, 
    timeBucketMinutes: number = 5
  ): string {
    const bucket = Math.floor(Date.now() / (timeBucketMinutes * 60 * 1000));
    return `FP-${cameraId}-${normalizedPlate.replace(/[^A-Z0-9]/g, '')}-${violationType}-${bucket}`;
  }

  /**
   * Submits a newly detected violation case into the human review queue
   */
  public submitForReview(caseObj: ViolationCase): { caseId: string; duplicate: boolean } {
    const fp = this.generateEnforcementFingerprint(caseObj.cameraId, caseObj.normalizedPlate, caseObj.violationType);

    if (this.idempotencyKeys.has(fp)) {
      const existingId = this.idempotencyKeys.get(fp)!;
      const existing = this.cases.get(existingId);
      if (existing) {
        this.recordAudit({
          actorId: 'SYSTEM_DEDUP',
          actorRole: 'SYSTEM',
          action: 'STATUS_CHANGE',
          caseId: caseObj.caseId,
          correlationId: caseObj.correlationId,
          source: caseObj.sourceType,
          beforeState: caseObj.status,
          afterState: 'DUPLICATE',
          reason: `Duplicate enforcement candidate detected matching existing case ${existingId}`,
          details: { fingerprint: fp, matchingCaseId: existingId }
        });
        caseObj.status = 'DUPLICATE';
        return { caseId: existingId, duplicate: true };
      }
    }

    this.idempotencyKeys.set(fp, caseObj.caseId);
    caseObj.status = 'PENDING_REVIEW';
    caseObj.updatedAt = new Date().toISOString();
    this.cases.set(caseObj.caseId, caseObj);

    this.recordAudit({
      actorId: 'AI_DETECTION_MESH',
      actorRole: 'SYSTEM_AGENT',
      action: 'VIOLATION_CASE_SUBMITTED_FOR_REVIEW' as any,
      caseId: caseObj.caseId,
      correlationId: caseObj.correlationId,
      source: caseObj.sourceType,
      afterState: 'PENDING_REVIEW',
      details: {
        violationType: caseObj.violationType,
        plate: caseObj.vehiclePlate,
        confidence: caseObj.aiConfidence,
        cameraId: caseObj.cameraId
      }
    });

    centralEventBus.publish({
      eventType: 'VIOLATION_CASE_SUBMITTED_FOR_REVIEW',
      sourceId: caseObj.cameraId,
      correlationId: caseObj.correlationId,
      idempotencyKey: `SUBMIT-${caseObj.caseId}`,
      priority: caseObj.violationSeverity === 'CRITICAL' ? 'P0' : 'P2',
      payload: { caseId: caseObj.caseId, violationType: caseObj.violationType, plate: caseObj.vehiclePlate }
    });

    sysEvents.emit('CHALLAN_CASE_CREATED', caseObj);

    return { caseId: caseObj.caseId, duplicate: false };
  }

  /**
   * Officer claims a pending case to avoid simultaneous reviews
   */
  public claimCase(caseId: string, reviewer: AuthorizedDispatchContext): ViolationCase {
    const caseObj = this.cases.get(caseId);
    if (!caseObj) throw new Error(`Case ${caseId} not found.`);

    if (caseObj.status !== 'PENDING_REVIEW' && caseObj.status !== 'UNDER_REVIEW') {
      throw new Error(`Case ${caseId} cannot be claimed in status ${caseObj.status}.`);
    }

    const before = caseObj.status;
    caseObj.status = 'UNDER_REVIEW';
    caseObj.reviewerId = reviewer.officerId;
    caseObj.updatedAt = new Date().toISOString();

    this.recordAudit({
      actorId: reviewer.officerId,
      actorRole: reviewer.role,
      action: 'CASE_CLAIM',
      caseId,
      correlationId: caseObj.correlationId,
      source: caseObj.sourceType,
      beforeState: before,
      afterState: 'UNDER_REVIEW',
      reason: `Officer ${reviewer.officerName} claimed case for evidentiary evaluation`,
      details: { reviewerName: reviewer.officerName, badgeNumber: reviewer.badgeNumber }
    });

    centralEventBus.publish({
      eventType: 'VIOLATION_CASE_CLAIMED',
      sourceId: reviewer.officerId,
      correlationId: caseObj.correlationId,
      idempotencyKey: `CLAIM-${caseId}-${Date.now()}`,
      priority: 'P2',
      payload: { caseId, reviewerId: reviewer.officerId }
    });

    return caseObj;
  }

  /**
   * Officer releases a claimed case back to the pool
   */
  public releaseCase(caseId: string, reviewer: AuthorizedDispatchContext): ViolationCase {
    const caseObj = this.cases.get(caseId);
    if (!caseObj) throw new Error(`Case ${caseId} not found.`);

    if (caseObj.reviewerId !== reviewer.officerId && reviewer.role !== 'SUPER_ADMIN') {
      throw new Error(`Officer ${reviewer.officerId} cannot release case claimed by ${caseObj.reviewerId}.`);
    }

    caseObj.status = 'PENDING_REVIEW';
    caseObj.reviewerId = undefined;
    caseObj.updatedAt = new Date().toISOString();

    this.recordAudit({
      actorId: reviewer.officerId,
      actorRole: reviewer.role,
      action: 'CASE_RELEASE',
      caseId,
      correlationId: caseObj.correlationId,
      source: caseObj.sourceType,
      beforeState: 'UNDER_REVIEW',
      afterState: 'PENDING_REVIEW',
      details: { releasedBy: reviewer.officerName }
    });

    return caseObj;
  }

  /**
   * Officer APPROVES the violation after reviewing context, vehicle crop, plate, and measurements
   */
  public approveCase(
    caseId: string, 
    reviewer: AuthorizedDispatchContext, 
    reason: string = 'Violation confirmed upon visual and evidentiary inspection'
  ): ViolationCase {
    const caseObj = this.cases.get(caseId);
    if (!caseObj) throw new Error(`Case ${caseId} not found.`);

    // RBAC: Only REVIEWER or SUPER_ADMIN can approve
    if (reviewer.role !== 'REVIEWER' && reviewer.role !== 'SUPER_ADMIN') {
      throw new Error(`Access Denied: Role ${reviewer.role} does not hold approval authority.`);
    }

    // Evidentiary sufficiency gate: Cannot approve if evidence is insufficient
    const sufficiency = evidenceSufficiencyService.evaluateSufficiency(caseObj);
    if (sufficiency.status === 'INSUFFICIENT') {
      throw new Error(`Cannot approve case with INSUFFICIENT evidence: ${sufficiency.reasons.join('; ')}`);
    }

    const before = caseObj.status;
    caseObj.status = 'APPROVED';
    caseObj.reviewerId = reviewer.officerId;
    caseObj.reviewedAt = new Date().toISOString();
    caseObj.reviewDecision = 'APPROVED';
    caseObj.reviewReason = reason;
    caseObj.sourceOfTruth = 'HUMAN_VERIFIED';
    caseObj.updatedAt = new Date().toISOString();

    this.recordAudit({
      actorId: reviewer.officerId,
      actorRole: reviewer.role,
      action: 'CASE_APPROVAL',
      caseId,
      correlationId: caseObj.correlationId,
      source: caseObj.sourceType,
      beforeState: before,
      afterState: 'APPROVED',
      reason,
      details: {
        reviewerName: reviewer.officerName,
        badgeNumber: reviewer.badgeNumber,
        evidenceScore: sufficiency.score,
        suggestedFine: caseObj.suggestedFineAmount
      }
    });

    centralEventBus.publish({
      eventType: 'VIOLATION_CASE_APPROVED',
      sourceId: reviewer.officerId,
      correlationId: caseObj.correlationId,
      idempotencyKey: `APPROVE-${caseId}`,
      priority: 'P1',
      payload: { caseId, approvedBy: reviewer.officerId }
    });

    // Update Vehicle Dossier if present
    this.syncWithVehicleDossier(caseObj);

    sysEvents.emit('CHALLAN_CASE_APPROVED', caseObj);
    return caseObj;
  }

  /**
   * Officer REJECTS the violation with mandatory statutory reason
   */
  public rejectCase(caseId: string, reviewer: AuthorizedDispatchContext, reason: string): ViolationCase {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A mandatory, substantive reason is required when rejecting a violation case.');
    }

    const caseObj = this.cases.get(caseId);
    if (!caseObj) throw new Error(`Case ${caseId} not found.`);

    if (reviewer.role !== 'REVIEWER' && reviewer.role !== 'SUPER_ADMIN') {
      throw new Error(`Access Denied: Role ${reviewer.role} does not hold review authority.`);
    }

    const before = caseObj.status;
    caseObj.status = 'REJECTED';
    caseObj.reviewerId = reviewer.officerId;
    caseObj.reviewedAt = new Date().toISOString();
    caseObj.reviewDecision = 'REJECTED';
    caseObj.reviewReason = reason;
    caseObj.updatedAt = new Date().toISOString();

    this.recordAudit({
      actorId: reviewer.officerId,
      actorRole: reviewer.role,
      action: 'CASE_REJECTION',
      caseId,
      correlationId: caseObj.correlationId,
      source: caseObj.sourceType,
      beforeState: before,
      afterState: 'REJECTED',
      reason,
      details: { reviewerName: reviewer.officerName }
    });

    centralEventBus.publish({
      eventType: 'VIOLATION_CASE_REJECTED',
      sourceId: reviewer.officerId,
      correlationId: caseObj.correlationId,
      idempotencyKey: `REJECT-${caseId}`,
      priority: 'P2',
      payload: { caseId, rejectedBy: reviewer.officerId, reason }
    });

    this.syncWithVehicleDossier(caseObj);
    sysEvents.emit('CHALLAN_CASE_REJECTED', caseObj);
    return caseObj;
  }

  /**
   * Marks case as INSUFFICIENT_EVIDENCE (e.g. obscured plate, missing speed telemetry)
   */
  public markInsufficientEvidence(caseId: string, reviewer: AuthorizedDispatchContext, reason: string): ViolationCase {
    const caseObj = this.cases.get(caseId);
    if (!caseObj) throw new Error(`Case ${caseId} not found.`);

    const before = caseObj.status;
    caseObj.status = 'INSUFFICIENT_EVIDENCE';
    caseObj.reviewerId = reviewer.officerId;
    caseObj.reviewedAt = new Date().toISOString();
    caseObj.reviewDecision = 'INSUFFICIENT_EVIDENCE';
    caseObj.reviewReason = reason;
    caseObj.updatedAt = new Date().toISOString();

    this.recordAudit({
      actorId: reviewer.officerId,
      actorRole: reviewer.role,
      action: 'MARK_INSUFFICIENT',
      caseId,
      correlationId: caseObj.correlationId,
      source: caseObj.sourceType,
      beforeState: before,
      afterState: 'INSUFFICIENT_EVIDENCE',
      reason,
      details: { reviewerName: reviewer.officerName }
    });

    centralEventBus.publish({
      eventType: 'VIOLATION_CASE_INSUFFICIENT_EVIDENCE',
      sourceId: reviewer.officerId,
      correlationId: caseObj.correlationId,
      idempotencyKey: `INSUFF-${caseId}`,
      priority: 'P3',
      payload: { caseId, reason }
    });

    return caseObj;
  }

  /**
   * Request more evidence (e.g. next corridor camera frame or HD VMS clip)
   */
  public requestMoreEvidence(caseId: string, reviewer: AuthorizedDispatchContext): ViolationCase {
    const caseObj = this.cases.get(caseId);
    if (!caseObj) throw new Error(`Case ${caseId} not found.`);

    caseObj.reviewDecision = 'MORE_EVIDENCE_REQUESTED';
    caseObj.updatedAt = new Date().toISOString();

    this.recordAudit({
      actorId: reviewer.officerId,
      actorRole: reviewer.role,
      action: 'REQUEST_MORE_EVIDENCE',
      caseId,
      correlationId: caseObj.correlationId,
      source: caseObj.sourceType,
      details: { requestedBy: reviewer.officerName }
    });

    return caseObj;
  }

  /**
   * Dispatches an APPROVED case to the designated e-Challan provider
   * Gated strictly: Cannot dispatch without human approval.
   */
  public async dispatchChallan(
    caseId: string, 
    reviewer: AuthorizedDispatchContext, 
    provider: IChallanProvider = simulatedChallanProvider
  ): Promise<ChallanDispatchResult> {
    const caseObj = this.cases.get(caseId);
    if (!caseObj) throw new Error(`Case ${caseId} not found.`);

    if (caseObj.status !== 'APPROVED' && caseObj.status !== 'DISPATCH_PENDING') {
      throw new Error(`Dispatch Blocked: Case must be in APPROVED state before dispatch. Current state: ${caseObj.status}`);
    }

    if (caseObj.sourceType === 'YOUTUBE_DEMO') {
      throw new Error('Dispatch Barred: YouTube demo video streams cannot be dispatched as official e-challans.');
    }

    // Role check
    if (reviewer.role !== 'REVIEWER' && reviewer.role !== 'SUPER_ADMIN') {
      throw new Error(`Dispatch Denied: Officer role ${reviewer.role} cannot trigger electronic challan dispatch.`);
    }

    caseObj.status = 'DISPATCH_PENDING';
    caseObj.dispatchStatus = 'PENDING';
    caseObj.updatedAt = new Date().toISOString();

    this.recordAudit({
      actorId: reviewer.officerId,
      actorRole: reviewer.role,
      action: 'CHALLAN_DISPATCH',
      caseId,
      correlationId: caseObj.correlationId,
      source: caseObj.sourceType,
      beforeState: 'APPROVED',
      afterState: 'DISPATCH_PENDING',
      details: { provider: provider.providerName }
    });

    try {
      const result = await provider.createChallan(caseObj, reviewer);
      if (result.success) {
        caseObj.status = 'E_CHALLAN_ISSUED';
        caseObj.dispatchStatus = 'ISSUED';
        caseObj.challanReference = result.referenceId;
        caseObj.challanProvider = provider.providerName;
        caseObj.dispatchTimestamp = result.issuedAt;
        caseObj.updatedAt = new Date().toISOString();

        this.recordAudit({
          actorId: reviewer.officerId,
          actorRole: reviewer.role,
          action: 'CHALLAN_DISPATCH',
          caseId,
          correlationId: caseObj.correlationId,
          source: caseObj.sourceType,
          beforeState: 'DISPATCH_PENDING',
          afterState: 'E_CHALLAN_ISSUED',
          details: { referenceId: result.referenceId, fineAmount: result.fineAmount, isSimulated: result.isSimulated }
        });

        centralEventBus.publish({
          eventType: 'CHALLAN_DISPATCHED',
          sourceId: reviewer.officerId,
          correlationId: caseObj.correlationId,
          idempotencyKey: `DISPATCH-SUCCESS-${caseId}`,
          priority: 'P1',
          payload: { caseId, referenceId: result.referenceId, fineAmount: result.fineAmount }
        });

        this.syncWithVehicleDossier(caseObj);
        sysEvents.emit('CHALLAN_ISSUED', { caseObj, result });
        return result;
      } else {
        caseObj.status = 'DISPATCH_FAILED';
        caseObj.dispatchStatus = 'FAILED';
        caseObj.updatedAt = new Date().toISOString();

        this.recordAudit({
          actorId: reviewer.officerId,
          actorRole: reviewer.role,
          action: 'CHALLAN_DISPATCH_FAILURE',
          caseId,
          correlationId: caseObj.correlationId,
          source: caseObj.sourceType,
          beforeState: 'DISPATCH_PENDING',
          afterState: 'DISPATCH_FAILED',
          reason: result.error || 'Gateway rejected dispatch payload',
          details: { error: result.error }
        });

        centralEventBus.publish({
          eventType: 'CHALLAN_DISPATCH_FAILED',
          sourceId: reviewer.officerId,
          correlationId: caseObj.correlationId,
          idempotencyKey: `DISPATCH-FAIL-${caseId}`,
          priority: 'P1',
          payload: { caseId, error: result.error }
        });

        return result;
      }
    } catch (err: any) {
      caseObj.status = 'DISPATCH_FAILED';
      caseObj.dispatchStatus = 'FAILED';
      caseObj.updatedAt = new Date().toISOString();

      this.recordAudit({
        actorId: reviewer.officerId,
        actorRole: reviewer.role,
        action: 'CHALLAN_DISPATCH_FAILURE',
        caseId,
        correlationId: caseObj.correlationId,
        source: caseObj.sourceType,
        beforeState: 'DISPATCH_PENDING',
        afterState: 'DISPATCH_FAILED',
        reason: err.message,
        details: { error: err.message }
      });

      throw err;
    }
  }

  /**
   * Syncs the approved/issued violation case with Master Vehicle Dossier Fabric
   */
  private syncWithVehicleDossier(caseObj: ViolationCase) {
    try {
      const dossier = vehicleDossierService.getOrCreateDossier(caseObj.vehiclePlate);
      if (dossier) {
        // Append violation into dossier alerts or investigation history
        if (!(dossier as any).violations) {
          (dossier as any).violations = [];
        }
        const existingIdx = (dossier as any).violations.findIndex((v: any) => v.caseId === caseObj.caseId);
        const record = {
          caseId: caseObj.caseId,
          violationType: caseObj.violationType,
          violationDescription: caseObj.violationDescription,
          cameraId: caseObj.cameraId,
          location: caseObj.location,
          timestamp: caseObj.timestamp,
          status: caseObj.status,
          challanReference: caseObj.challanReference,
          fineAmount: caseObj.suggestedFineAmount,
          evidencePackageId: caseObj.evidencePackageId,
          integrityHash: caseObj.integrityHash,
          sourceOfTruth: caseObj.sourceOfTruth,
          isSimulated: caseObj.isSimulated
        };

        if (existingIdx >= 0) {
          (dossier as any).violations[existingIdx] = record;
        } else {
          (dossier as any).violations.push(record);
        }
      }
    } catch (e) {
      // Non-blocking dossier integration
    }
  }

  /**
   * Record an immutable audit log entry
   */
  public recordAudit(entry: Omit<ChallanAuditRecord, 'auditId' | 'timestamp' | 'integrityChecksum'>): ChallanAuditRecord {
    const auditId = `AUD-CHAL-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
    const timestamp = new Date().toISOString();
    const checksum = violationEvidenceCaptureService.sha256String(
      `${auditId}|${timestamp}|${entry.actorId}|${entry.action}|${entry.caseId}|${entry.afterState}`
    );

    const record: ChallanAuditRecord = {
      auditId,
      timestamp,
      integrityChecksum: checksum,
      ...entry
    };

    this.auditTrail.unshift(record);
    return record;
  }

  public getCase(caseId: string): ViolationCase | undefined {
    return this.cases.get(caseId);
  }

  public getAllCases(): ViolationCase[] {
    return Array.from(this.cases.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getCaseAuditTrail(caseId: string): ChallanAuditRecord[] {
    return this.auditTrail.filter(a => a.caseId === caseId);
  }

  public getPendingCases(filters?: ReviewQueueFilters): { cases: ViolationCase[]; total: number } {
    let list = Array.from(this.cases.values());

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter(c => c.status === filters.status);
    }
    if (filters?.violationType && filters.violationType !== 'ALL') {
      list = list.filter(c => c.violationType === filters.violationType);
    }
    if (filters?.cameraId) {
      list = list.filter(c => c.cameraId.toLowerCase().includes(filters.cameraId!.toLowerCase()));
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(c => 
        c.caseId.toLowerCase().includes(q) ||
        c.vehiclePlate.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
      );
    }
    if (filters?.minConfidence) {
      list = list.filter(c => c.aiConfidence >= filters.minConfidence!);
    }

    // Sort: PENDING_REVIEW and UNDER_REVIEW first, then by timestamp desc
    list.sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        'PENDING_REVIEW': 1,
        'UNDER_REVIEW': 2,
        'APPROVED': 3,
        'DISPATCH_PENDING': 4,
        'INSUFFICIENT_EVIDENCE': 5,
        'E_CHALLAN_ISSUED': 6,
        'REJECTED': 7,
        'DISPATCH_FAILED': 8,
        'DUPLICATE': 9
      };
      const pA = priorityOrder[a.status] || 10;
      const pB = priorityOrder[b.status] || 10;
      if (pA !== pB) return pA - pB;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const paged = list.slice(start, start + pageSize);

    return {
      cases: paged,
      total: list.length
    };
  }

  public getKPIs() {
    const list = Array.from(this.cases.values());
    const pendingReview = list.filter(c => c.status === 'PENDING_REVIEW').length;
    const underReview = list.filter(c => c.status === 'UNDER_REVIEW').length;
    const approved = list.filter(c => c.status === 'APPROVED').length;
    const rejected = list.filter(c => c.status === 'REJECTED').length;
    const issuedToday = list.filter(c => c.status === 'E_CHALLAN_ISSUED').length;
    const dispatchFailed = list.filter(c => c.status === 'DISPATCH_FAILED').length;
    const insufficientEvidence = list.filter(c => c.status === 'INSUFFICIENT_EVIDENCE').length;
    const totalDetections = list.length;

    return {
      pendingReview,
      underReview,
      approved,
      rejected,
      issuedToday,
      dispatchFailed,
      insufficientEvidence,
      totalDetections
    };
  }

  /**
   * Seeds realistic demo cases including the exact scenario from user's image:
   * CAM-014 SG Highway, GJ05AB1234, Overspeeding 92/60, BMW X5
   */
  private seedInitialCases() {
    // 1. Primary Demo Case (from user screenshot)
    const case1EvidencePkg = violationEvidenceCaptureService.captureViolationEvidence({
      caseId: 'VC-000124',
      sourceType: 'SIMULATION',
      cameraId: 'CAM-014',
      edgeNodeId: 'EDGE-AHM-SG-01',
      location: 'SG Highway (Ahmedabad)',
      timestamp: '2025-04-04T16:42:37Z',
      contextFrameUri: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      vehicleCropUri: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      plateCropUri: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=400&q=80',
      preViolationFrameUri: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
      violationFrameUri: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      postViolationFrameUri: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80',
      metadata: {
        speedEstimateKmH: 92,
        speedLimitKmH: 60,
        modelName: 'Gemini Vision Edge / RoadSafetyAgent',
        modelVersion: '2.1.0'
      },
      isSimulated: true
    });

    const case1: ViolationCase = {
      caseId: 'VC-000124',
      eventId: 'EV-20250404-001234',
      correlationId: 'CORR-VIO-20250404-001234',
      sourceType: 'SIMULATION',
      cameraId: 'CAM-014',
      edgeNodeId: 'EDGE-AHM-SG-01',
      timestamp: '2025-04-04T16:42:37Z',
      location: 'SG Highway (Ahmedabad)',
      latitude: 23.0225,
      longitude: 72.5714,

      vehicleObservationId: 'OBS-SG-001234',
      trajectoryId: 'TRAJ-GJ05AB1234-SG',
      plateObservationId: 'PLT-001234',

      vehiclePlate: 'GJ05AB1234',
      normalizedPlate: 'GJ05AB1234',
      plateConfidence: 0.98,
      vehicleType: 'Car (SUV)',
      vehicleColor: 'White / Blue / Green',
      vehicleMakeModel: 'BMW X5 (Likely)',
      vehicleConfidence: 0.96,

      violationType: 'OVERSPEEDING',
      violationSeverity: 'HIGH',
      violationDescription: 'Vehicle exceeded the speed limit of 60 km/h by 32 km/h.',

      observedValue: 92,
      allowedValue: 60,
      unit: 'km/h',

      aiConfidence: 0.97,
      anprConfidence: 0.98,
      evidenceQuality: 'HIGH',
      evidenceCompleteness: 'COMPLETE',

      fullContextEvidenceId: case1EvidencePkg.frameReferences.contextFrame,
      vehicleCropEvidenceId: case1EvidencePkg.frameReferences.vehicleCrop,
      plateCropEvidenceId: case1EvidencePkg.frameReferences.plateCrop,
      additionalEvidenceIds: [
        case1EvidencePkg.frameReferences.preViolationFrame!,
        case1EvidencePkg.frameReferences.violationFrame!,
        case1EvidencePkg.frameReferences.postViolationFrame!
      ],

      speedEvidence: {
        measuredSpeedKmH: 92,
        allowedSpeedKmH: 60,
        speedSensorType: 'SIMULATED',
        zoneName: 'SG Highway Speed Enforcement Sector 4'
      },

      status: 'PENDING_REVIEW',
      externalLookupStatus: 'NOT_PERFORMED',
      challanProvider: 'Gujarat e-Challan Simulation Gateway (Demonstration)',
      dispatchStatus: 'NONE',

      integrityHash: case1EvidencePkg.integrityHash,
      evidencePackageId: case1EvidencePkg.evidencePackageId,

      createdAt: '2025-04-04T16:42:37Z',
      updatedAt: '2025-04-04T16:42:40Z',
      sourceOfTruth: 'SIMULATED',

      retentionPolicy: {
        policyId: 'RET-TRAFFIC-STATUTORY-01',
        rawVideoDays: 30,
        statutoryEvidenceYears: 3,
        isTamperSealed: true,
        department: 'Traffic Enforcement Branch'
      },
      retentionUntil: '2028-04-04T16:42:37Z',
      auditRecordIds: [],
      suggestedFineAmount: 1500,
      isSimulated: true
    };

    this.cases.set(case1.caseId, case1);
    this.idempotencyKeys.set(
      this.generateEnforcementFingerprint(case1.cameraId, case1.normalizedPlate, case1.violationType),
      case1.caseId
    );

    // 2. Case 2: Red Light Jump (Already Issued / Simulated)
    const case2: ViolationCase = {
      caseId: 'VC-000123',
      eventId: 'EV-20250404-001230',
      correlationId: 'CORR-VIO-20250404-001230',
      sourceType: 'SIMULATION',
      cameraId: 'CAM-008',
      edgeNodeId: 'EDGE-AHM-WEST-02',
      timestamp: '2025-04-04T16:38:12Z',
      location: 'Navrangpura Crossroad',
      latitude: 23.0365,
      longitude: 72.5611,
      vehicleObservationId: 'OBS-NAV-001',
      vehiclePlate: 'GJ01CD5678',
      normalizedPlate: 'GJ01CD5678',
      plateConfidence: 0.96,
      vehicleType: 'Sedan',
      vehicleColor: 'Silver',
      vehicleConfidence: 0.94,
      violationType: 'RED_LIGHT_VIOLATION',
      violationSeverity: 'HIGH',
      violationDescription: 'Crossed stop line 2.4 seconds after signal transitioned to red.',
      observedValue: 'RED (2.4s)',
      allowedValue: 'GREEN',
      aiConfidence: 0.95,
      anprConfidence: 0.96,
      evidenceQuality: 'HIGH',
      evidenceCompleteness: 'COMPLETE',
      fullContextEvidenceId: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      vehicleCropEvidenceId: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
      plateCropEvidenceId: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=300&q=80',
      additionalEvidenceIds: [],
      signalStateEvidence: {
        signalColor: 'RED',
        amberIntervalSec: 3.0,
        redElapsedSec: 2.4,
        stopLineCrossed: true
      },
      status: 'E_CHALLAN_ISSUED',
      reviewerId: 'POLICE-OFFICER-742',
      reviewedAt: '2025-04-04T16:39:00Z',
      reviewDecision: 'APPROVED',
      reviewReason: 'Red light breach clearly established across camera sequence',
      externalLookupStatus: 'AUTHORIZED_LOADED',
      challanProvider: 'Gujarat e-Challan Simulation Gateway (Demonstration)',
      challanReference: 'DEMO-CHALLAN-GJ-RLV-1638-9214',
      dispatchStatus: 'ISSUED',
      dispatchTimestamp: '2025-04-04T16:39:15Z',
      integrityHash: 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef123456',
      evidencePackageId: 'EVPKG-VC-000123-SIM',
      createdAt: '2025-04-04T16:38:12Z',
      updatedAt: '2025-04-04T16:39:15Z',
      sourceOfTruth: 'HUMAN_VERIFIED',
      retentionPolicy: {
        policyId: 'RET-TRAFFIC-STATUTORY-01',
        rawVideoDays: 30,
        statutoryEvidenceYears: 3,
        isTamperSealed: true,
        department: 'Traffic Enforcement Branch'
      },
      retentionUntil: '2028-04-04T16:38:12Z',
      auditRecordIds: [],
      suggestedFineAmount: 1000,
      isSimulated: true
    };
    this.cases.set(case2.caseId, case2);

    // 3. Case 3: No Helmet (Under Review)
    const case3: ViolationCase = {
      caseId: 'VC-000122',
      eventId: 'EV-20250404-001225',
      correlationId: 'CORR-VIO-20250404-001225',
      sourceType: 'SIMULATION',
      cameraId: 'CAM-019',
      edgeNodeId: 'EDGE-AHM-CENTRAL-01',
      timestamp: '2025-04-04T16:32:45Z',
      location: 'Ellis Bridge (West End)',
      latitude: 23.0258,
      longitude: 72.5732,
      vehicleObservationId: 'OBS-ELL-002',
      vehiclePlate: 'GJ27EF9012',
      normalizedPlate: 'GJ27EF9012',
      plateConfidence: 0.94,
      vehicleType: 'Motorcycle',
      vehicleColor: 'Black',
      vehicleConfidence: 0.95,
      violationType: 'HELMETLESS_RIDING',
      violationSeverity: 'MEDIUM',
      violationDescription: 'Two-wheeler rider observed without certified safety helmet.',
      aiConfidence: 0.93,
      anprConfidence: 0.94,
      evidenceQuality: 'HIGH',
      evidenceCompleteness: 'COMPLETE',
      fullContextEvidenceId: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      vehicleCropEvidenceId: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
      plateCropEvidenceId: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=300&q=80',
      additionalEvidenceIds: [],
      helmetEvidence: {
        riderCount: 1,
        helmetlessRidersCount: 1,
        headRegionVisible: true
      },
      status: 'UNDER_REVIEW',
      reviewerId: 'POLICE-OFFICER-512',
      reviewedAt: '2025-04-04T16:35:10Z',
      externalLookupStatus: 'NOT_PERFORMED',
      challanProvider: 'Gujarat e-Challan Simulation Gateway (Demonstration)',
      dispatchStatus: 'NONE',
      integrityHash: 'c1d2e3f405162738495a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
      evidencePackageId: 'EVPKG-VC-000122-SIM',
      createdAt: '2025-04-04T16:32:45Z',
      updatedAt: '2025-04-04T16:35:10Z',
      sourceOfTruth: 'AI_INFERRED',
      retentionPolicy: {
        policyId: 'RET-TRAFFIC-STATUTORY-01',
        rawVideoDays: 30,
        statutoryEvidenceYears: 3,
        isTamperSealed: true,
        department: 'Traffic Enforcement Branch'
      },
      retentionUntil: '2028-04-04T16:32:45Z',
      auditRecordIds: [],
      suggestedFineAmount: 500,
      isSimulated: true
    };
    this.cases.set(case3.caseId, case3);

    // 4. Case 4: Wrong Lane (BRTS Corridor Trespass)
    const case4: ViolationCase = {
      caseId: 'VC-000121',
      eventId: 'EV-20250404-001218',
      correlationId: 'CORR-VIO-20250404-001218',
      sourceType: 'SIMULATION',
      cameraId: 'CAM-022',
      edgeNodeId: 'EDGE-AHM-BRTS-03',
      timestamp: '2025-04-04T16:21:05Z',
      location: 'Prahladnagar BRTS Junction',
      latitude: 23.0134,
      longitude: 72.5123,
      vehicleObservationId: 'OBS-PRH-003',
      vehiclePlate: 'GJ03XY3456',
      normalizedPlate: 'GJ03XY3456',
      plateConfidence: 0.97,
      vehicleType: 'Car',
      vehicleColor: 'Red',
      vehicleConfidence: 0.96,
      violationType: 'WRONG_LANE',
      violationSeverity: 'HIGH',
      violationDescription: 'Unauthorized private vehicle entered segregated BRTS rapid bus corridor.',
      aiConfidence: 0.96,
      anprConfidence: 0.97,
      evidenceQuality: 'HIGH',
      evidenceCompleteness: 'COMPLETE',
      fullContextEvidenceId: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      vehicleCropEvidenceId: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
      plateCropEvidenceId: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=300&q=80',
      additionalEvidenceIds: [],
      laneEvidence: {
        assignedLane: 'GENERAL_TRAFFIC',
        observedLane: 'BRTS_EXCLUSIVE',
        laneViolationType: 'BRTS_LANE_INTRUSION'
      },
      status: 'E_CHALLAN_ISSUED',
      reviewerId: 'POLICE-OFFICER-742',
      reviewedAt: '2025-04-04T16:23:00Z',
      reviewDecision: 'APPROVED',
      externalLookupStatus: 'AUTHORIZED_LOADED',
      challanProvider: 'Gujarat e-Challan Simulation Gateway (Demonstration)',
      challanReference: 'DEMO-CHALLAN-GJ-BRT-1621-4819',
      dispatchStatus: 'ISSUED',
      dispatchTimestamp: '2025-04-04T16:23:30Z',
      integrityHash: 'e1f2a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
      evidencePackageId: 'EVPKG-VC-000121-SIM',
      createdAt: '2025-04-04T16:21:05Z',
      updatedAt: '2025-04-04T16:23:30Z',
      sourceOfTruth: 'HUMAN_VERIFIED',
      retentionPolicy: {
        policyId: 'RET-TRAFFIC-STATUTORY-01',
        rawVideoDays: 30,
        statutoryEvidenceYears: 3,
        isTamperSealed: true,
        department: 'Traffic Enforcement Branch'
      },
      retentionUntil: '2028-04-04T16:21:05Z',
      auditRecordIds: [],
      suggestedFineAmount: 1500,
      isSimulated: true
    };
    this.cases.set(case4.caseId, case4);
  }
}

export const challanReviewService = ChallanReviewService.getInstance();
