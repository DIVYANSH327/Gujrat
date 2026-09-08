/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ExternalDataProviderRegistry: Central Federation for Authorized Government Gateways
 * 
 * Principle:
 * "ONE VEHICLE IDENTITY CONTEXT ACROSS CAMERA OBSERVATIONS, EVIDENCE,
 * INVESTIGATIONS AND AUTHORIZED DATA SOURCES."
 * 
 * Does not claim live integration merely because an adapter exists.
 * Manages zero-trust authorization, caching, rate limiting, and immutable audit trails.
 */

import { 
  ExternalProviderStatus, 
  ExternalProviderMetadata,
  ExternalDataAuditRecord,
  normalizeLicensePlate 
} from '../types';
import { ProviderAuthorizationContext } from './integrations/ExternalProviderInterfaces';
import { authorizedVahanProvider, AuthorizedVahanProvider } from './integrations/AuthorizedVahanProvider';
import { authorizedEChallanProvider, AuthorizedEChallanProvider } from './integrations/AuthorizedEChallanProvider';
import { authorizedEGujCopProvider, AuthorizedEGujCopProvider } from './integrations/AuthorizedEGujCopProvider';
import { externalLookupPolicyEngine } from './ExternalLookupPolicyEngine';
import { externalLookupCache } from './ExternalLookupCache';
import { externalLookupRateLimiter } from './ExternalLookupRateLimiter';
import { dataAccessAuditService } from './DataAccessAuditService';

export interface ProviderHealthDashboardItem {
  code: string;
  name: string;
  status: ExternalProviderStatus;
  latencyMs: number;
  lastSuccessfulRequest?: string;
  failureRate: number;
  requestsToday: number;
  rateLimitState: string;
  authorizationState: string;
  isSimulated: boolean;
  disclaimer: string;
}

export class ExternalDataProviderRegistry {
  private static instance: ExternalDataProviderRegistry | null = null;

  private vahanProvider: AuthorizedVahanProvider = authorizedVahanProvider;
  private echallanProvider: AuthorizedEChallanProvider = authorizedEChallanProvider;
  private egujcopProvider: AuthorizedEGujCopProvider = authorizedEGujCopProvider;

  // Telemetry trackers
  private requestStats = new Map<string, { requestsToday: number; failuresToday: number; lastSuccess?: string }>();

  private constructor() {
    this.requestStats.set('VAHAN', { requestsToday: 14, failuresToday: 0, lastSuccess: new Date().toISOString() });
    this.requestStats.set('ECHALLAN', { requestsToday: 18, failuresToday: 0, lastSuccess: new Date().toISOString() });
    this.requestStats.set('EGUJCOP', { requestsToday: 8, failuresToday: 0, lastSuccess: new Date().toISOString() });
  }

  public static getInstance(): ExternalDataProviderRegistry {
    if (!ExternalDataProviderRegistry.instance) {
      ExternalDataProviderRegistry.instance = new ExternalDataProviderRegistry();
    }
    return ExternalDataProviderRegistry.instance;
  }

  public getVahanProvider(): AuthorizedVahanProvider {
    return this.vahanProvider;
  }

  public getEChallanProvider(): AuthorizedEChallanProvider {
    return this.echallanProvider;
  }

  public getEGujCopProvider(): AuthorizedEGujCopProvider {
    return this.egujcopProvider;
  }

  public setProviderStatus(provider: 'VAHAN' | 'ECHALLAN' | 'EGUJCOP', status: ExternalProviderStatus): void {
    if (provider === 'VAHAN') this.vahanProvider.setProviderStatus(status);
    if (provider === 'ECHALLAN') this.echallanProvider.setProviderStatus(status);
    if (provider === 'EGUJCOP') this.egujcopProvider.setProviderStatus(status);
  }

  public getProviderMetadata(provider: 'VAHAN' | 'ECHALLAN' | 'EGUJCOP'): ExternalProviderMetadata {
    switch (provider) {
      case 'VAHAN':
        return {
          providerId: this.vahanProvider.providerId,
          name: this.vahanProvider.name,
          capabilities: this.vahanProvider.getCapabilities(),
          status: this.vahanProvider.getProviderStatus(),
          authorizationState: this.vahanProvider.getProviderStatus() === 'AVAILABLE' ? 'MOCK_SANDBOX' : 'NOT_CONFIGURED',
          supportedQueries: this.vahanProvider.supportedQueries,
          lastHealthCheck: new Date().toISOString(),
          rateLimit: { maxRequestsPerMin: 60, currentCount: 14, resetTime: new Date(Date.now() + 30000).toISOString() },
          timeoutMs: 4000,
          auditRequirements: ['PURPOSE', 'ROLE', 'CASE_ID', 'ACTOR_ID'],
          isSimulated: true,
          disclaimer: 'Strictly requires Gujarat Transport Department mTLS credentials for live queries.'
        };
      case 'ECHALLAN':
        return {
          providerId: this.echallanProvider.providerId,
          name: this.echallanProvider.name,
          capabilities: this.echallanProvider.getCapabilities(),
          status: this.echallanProvider.getProviderStatus(),
          authorizationState: this.echallanProvider.getProviderStatus() === 'AVAILABLE' ? 'MOCK_SANDBOX' : 'NOT_CONFIGURED',
          supportedQueries: this.echallanProvider.supportedQueries,
          lastHealthCheck: new Date().toISOString(),
          rateLimit: { maxRequestsPerMin: 100, currentCount: 18, resetTime: new Date(Date.now() + 30000).toISOString() },
          timeoutMs: 3000,
          auditRequirements: ['PURPOSE', 'ROLE', 'ACTOR_ID'],
          isSimulated: true,
          disclaimer: 'Sandbox demo connector active. Live gateway requires Gujarat Traffic Police token.'
        };
      case 'EGUJCOP':
        return {
          providerId: this.egujcopProvider.providerId,
          name: this.egujcopProvider.name,
          capabilities: this.egujcopProvider.getCapabilities(),
          status: this.egujcopProvider.getProviderStatus(),
          authorizationState: this.egujcopProvider.getProviderStatus() === 'AVAILABLE' ? 'MOCK_SANDBOX' : 'NOT_CONFIGURED',
          supportedQueries: this.egujcopProvider.supportedQueries,
          lastHealthCheck: new Date().toISOString(),
          rateLimit: { maxRequestsPerMin: 30, currentCount: 8, resetTime: new Date(Date.now() + 30000).toISOString() },
          timeoutMs: 5000,
          auditRequirements: ['PURPOSE', 'ROLE', 'CASE_ID', 'ACTOR_ID', 'JUSTIFICATION'],
          isSimulated: true,
          disclaimer: 'Direct CCTNS link requires State Crime Records Bureau (SCRB) clearance.'
        };
    }
  }

  /**
   * Executes query to VAHAN vehicle registry under strict policy governance
   */
  public async queryVahan(plate: string, context: ProviderAuthorizationContext): Promise<any> {
    const normalized = normalizeLicensePlate(plate);
    const correlationId = `CORR-VAHAN-${Date.now()}`;
    const stats = this.requestStats.get('VAHAN') || { requestsToday: 0, failuresToday: 0 };
    stats.requestsToday++;

    // 1. Check Policy
    const policy = externalLookupPolicyEngine.evaluatePolicy(
      'VAHAN',
      this.vahanProvider.getProviderStatus(),
      context,
      normalized
    );

    if (!policy.isAllowed) {
      this.logAuditRecord({
        actorId: context.actorId,
        role: context.role,
        provider: 'VAHAN',
        plate: normalized,
        purpose: context.purpose,
        caseId: context.caseId,
        requestedFields: ['registrationNumber', 'vehicleClass', 'make', 'model', 'color'],
        returnedFields: [],
        requestId: `BLOCKED-${Date.now()}`,
        success: false,
        error: policy.reason,
        policyDecision: policy.decision,
        correlationId
      });

      return {
        status: policy.decision,
        isAuthorized: false,
        error: policy.reason,
        disclaimer: 'REQUEST BLOCKED BY ZERO-TRUST POLICY ENGINE'
      };
    }

    // 2. Check Cache
    const cached = externalLookupCache.get('VAHAN', normalized);
    if (cached) {
      return cached;
    }

    // 3. Rate limit check & dispatch
    externalLookupRateLimiter.recordRequest('VAHAN');

    try {
      const result = await this.vahanProvider.lookupVehicle(normalized, context);
      stats.lastSuccess = new Date().toISOString();

      // Cache result if valid
      if (result && result.status === 'SUCCESS') {
        externalLookupCache.set('VAHAN', normalized, result, {
          actorId: context.actorId,
          role: context.role,
          caseId: context.caseId
        });
      }

      this.logAuditRecord({
        actorId: context.actorId,
        role: context.role,
        provider: 'VAHAN',
        plate: normalized,
        purpose: context.purpose,
        caseId: context.caseId,
        requestedFields: ['vehicleClass', 'make', 'model', 'color', 'rto', 'flagStatus'],
        returnedFields: result?.record ? Object.keys(result.record) : [],
        requestId: result.requestId || `REQ-${Date.now()}`,
        success: result.status === 'SUCCESS',
        error: result.error,
        policyDecision: 'ALLOW',
        correlationId
      });

      return result;
    } catch (err: any) {
      stats.failuresToday++;
      const errorMsg = err?.message || 'Upstream VAHAN gateway error';
      return {
        status: 'EXTERNAL_PROVIDER_OFFLINE',
        isAuthorized: false,
        error: errorMsg,
        disclaimer: 'PROVIDER ERROR: Fallback to local CCTV observations'
      };
    }
  }

  /**
   * Executes query to Gujarat eChallan enforcement gateway under strict policy governance
   */
  public async queryEChallan(plate: string, context: ProviderAuthorizationContext): Promise<any> {
    const normalized = normalizeLicensePlate(plate);
    const correlationId = `CORR-ECH-${Date.now()}`;
    const stats = this.requestStats.get('ECHALLAN') || { requestsToday: 0, failuresToday: 0 };
    stats.requestsToday++;

    const policy = externalLookupPolicyEngine.evaluatePolicy(
      'ECHALLAN',
      this.echallanProvider.getProviderStatus(),
      context,
      normalized
    );

    if (!policy.isAllowed) {
      this.logAuditRecord({
        actorId: context.actorId,
        role: context.role,
        provider: 'ECHALLAN',
        plate: normalized,
        purpose: context.purpose,
        caseId: context.caseId,
        requestedFields: ['challans', 'pendingAmount'],
        returnedFields: [],
        requestId: `BLOCKED-${Date.now()}`,
        success: false,
        error: policy.reason,
        policyDecision: policy.decision,
        correlationId
      });

      return {
        status: policy.decision,
        isAuthorized: false,
        challans: [],
        totalPendingAmount: 0,
        error: policy.reason
      };
    }

    const cached = externalLookupCache.get('ECHALLAN', normalized);
    if (cached) return cached;

    externalLookupRateLimiter.recordRequest('ECHALLAN');

    try {
      const result = await this.echallanProvider.lookupChallans(normalized, context);
      stats.lastSuccess = new Date().toISOString();

      if (result && result.status === 'SUCCESS') {
        externalLookupCache.set('ECHALLAN', normalized, result, {
          actorId: context.actorId,
          role: context.role,
          caseId: context.caseId
        });
      }

      this.logAuditRecord({
        actorId: context.actorId,
        role: context.role,
        provider: 'ECHALLAN',
        plate: normalized,
        purpose: context.purpose,
        caseId: context.caseId,
        requestedFields: ['challans', 'amount'],
        returnedFields: ['challanNumber', 'violationType', 'amount', 'status'],
        requestId: result.requestId || `REQ-${Date.now()}`,
        success: result.status === 'SUCCESS',
        policyDecision: 'ALLOW',
        correlationId
      });

      return result;
    } catch (err: any) {
      stats.failuresToday++;
      return {
        status: 'EXTERNAL_PROVIDER_OFFLINE',
        isAuthorized: false,
        challans: [],
        totalPendingAmount: 0,
        error: err?.message || 'eChallan gateway timeout'
      };
    }
  }

  /**
   * Executes query to eGujCop police records under strict policy governance
   */
  public async queryEGujCop(plate: string, context: ProviderAuthorizationContext): Promise<any> {
    const normalized = normalizeLicensePlate(plate);
    const correlationId = `CORR-EGUJ-${Date.now()}`;
    const stats = this.requestStats.get('EGUJCOP') || { requestsToday: 0, failuresToday: 0 };
    stats.requestsToday++;

    const policy = externalLookupPolicyEngine.evaluatePolicy(
      'EGUJCOP',
      this.egujcopProvider.getProviderStatus(),
      context,
      normalized
    );

    if (!policy.isAllowed) {
      this.logAuditRecord({
        actorId: context.actorId,
        role: context.role,
        provider: 'EGUJCOP',
        plate: normalized,
        purpose: context.purpose,
        caseId: context.caseId,
        requestedFields: ['firSummaries', 'warrants'],
        returnedFields: [],
        requestId: `BLOCKED-${Date.now()}`,
        success: false,
        error: policy.reason,
        policyDecision: policy.decision,
        correlationId
      });

      return {
        status: policy.decision,
        isAuthorized: false,
        records: [],
        hasActiveWarrantsOrFir: false,
        error: policy.reason
      };
    }

    const cached = externalLookupCache.get('EGUJCOP', normalized);
    if (cached) return cached;

    externalLookupRateLimiter.recordRequest('EGUJCOP');

    try {
      const result = await this.egujcopProvider.lookupPoliceRecords(normalized, context);
      stats.lastSuccess = new Date().toISOString();

      if (result && result.status === 'SUCCESS') {
        externalLookupCache.set('EGUJCOP', normalized, result, {
          actorId: context.actorId,
          role: context.role,
          caseId: context.caseId
        });
      }

      this.logAuditRecord({
        actorId: context.actorId,
        role: context.role,
        provider: 'EGUJCOP',
        plate: normalized,
        purpose: context.purpose,
        caseId: context.caseId,
        requestedFields: ['fir', 'warrants', 'interceptBulletins'],
        returnedFields: ['caseNumber', 'sections', 'status', 'policeStation'],
        requestId: result.requestId || `REQ-${Date.now()}`,
        success: result.status === 'SUCCESS',
        policyDecision: 'ALLOW',
        correlationId
      });

      return result;
    } catch (err: any) {
      stats.failuresToday++;
      return {
        status: 'EXTERNAL_PROVIDER_OFFLINE',
        isAuthorized: false,
        records: [],
        hasActiveWarrantsOrFir: false,
        error: err?.message || 'eGujCop GovNet unreachable'
      };
    }
  }

  /**
   * Queries all authorized external providers concurrently with resilience
   */
  public async queryAllAuthorized(plate: string, context: ProviderAuthorizationContext): Promise<{
    vahan: any;
    echallan: any;
    egujcop: any;
    providerStatus: Record<string, ExternalProviderStatus>;
  }> {
    const [vahan, echallan, egujcop] = await Promise.all([
      this.queryVahan(plate, context),
      this.queryEChallan(plate, context),
      this.queryEGujCop(plate, context)
    ]);

    return {
      vahan,
      echallan,
      egujcop,
      providerStatus: {
        VAHAN: this.vahanProvider.getProviderStatus(),
        ECHALLAN: this.echallanProvider.getProviderStatus(),
        EGUJCOP: this.egujcopProvider.getProviderStatus()
      }
    };
  }

  /**
   * Aggregates telemetry for Vehicle Data Health Dashboard
   */
  public getHealthDashboard(): ProviderHealthDashboardItem[] {
    const vahanStats = this.requestStats.get('VAHAN')!;
    const echallanStats = this.requestStats.get('ECHALLAN')!;
    const egujcopStats = this.requestStats.get('EGUJCOP')!;

    return [
      {
        code: 'VAHAN',
        name: this.vahanProvider.name,
        status: this.vahanProvider.getProviderStatus(),
        latencyMs: 54,
        lastSuccessfulRequest: vahanStats.lastSuccess,
        failureRate: vahanStats.requestsToday > 0 ? vahanStats.failuresToday / vahanStats.requestsToday : 0,
        requestsToday: vahanStats.requestsToday,
        rateLimitState: '60/min (14 used)',
        authorizationState: this.vahanProvider.getProviderStatus() === 'AVAILABLE' ? 'MOCK_SANDBOX' : 'NOT_CONFIGURED',
        isSimulated: true,
        disclaimer: 'Abstracted VAHAN Adapter (Sandbox Prototype)'
      },
      {
        code: 'ECHALLAN',
        name: this.echallanProvider.name,
        status: this.echallanProvider.getProviderStatus(),
        latencyMs: 48,
        lastSuccessfulRequest: echallanStats.lastSuccess,
        failureRate: echallanStats.requestsToday > 0 ? echallanStats.failuresToday / echallanStats.requestsToday : 0,
        requestsToday: echallanStats.requestsToday,
        rateLimitState: '100/min (18 used)',
        authorizationState: this.echallanProvider.getProviderStatus() === 'AVAILABLE' ? 'MOCK_SANDBOX' : 'NOT_CONFIGURED',
        isSimulated: true,
        disclaimer: 'Gujarat Traffic Police eChallan Gateway (Sandbox)'
      },
      {
        code: 'EGUJCOP',
        name: this.egujcopProvider.name,
        status: this.egujcopProvider.getProviderStatus(),
        latencyMs: 62,
        lastSuccessfulRequest: egujcopStats.lastSuccess,
        failureRate: egujcopStats.requestsToday > 0 ? egujcopStats.failuresToday / egujcopStats.requestsToday : 0,
        requestsToday: egujcopStats.requestsToday,
        rateLimitState: '30/min (8 used)',
        authorizationState: this.egujcopProvider.getProviderStatus() === 'AVAILABLE' ? 'MOCK_SANDBOX' : 'NOT_CONFIGURED',
        isSimulated: true,
        disclaimer: 'eGujCop CCTNS GovNet Gateway (Sandbox)'
      }
    ];
  }

  private logAuditRecord(params: {
    actorId: string;
    role: any;
    provider: string;
    plate: string;
    purpose: string;
    caseId?: string;
    requestedFields: string[];
    returnedFields: string[];
    requestId: string;
    success: boolean;
    error?: string;
    policyDecision: any;
    correlationId: string;
  }): void {
    const record: ExternalDataAuditRecord = {
      auditId: `AUD-EXT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...params
    };
    dataAccessAuditService.recordExternalAudit(record);
  }
}

export const externalDataProviderRegistry = ExternalDataProviderRegistry.getInstance();
