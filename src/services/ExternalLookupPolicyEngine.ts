/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ExternalLookupPolicyEngine: Zero-Trust Governance & RBAC for Government Registries
 * Enforces purpose-driven access, rate limits, and prevents mass surveillance harvesting.
 */

import { 
  UserRole, 
  ExternalLookupPolicyDecision, 
  ExternalProviderStatus 
} from '../types';
import { ProviderAuthorizationContext } from './integrations/ExternalProviderInterfaces';
import { externalLookupRateLimiter } from './ExternalLookupRateLimiter';

export interface PolicyEvaluationResult {
  decision: ExternalLookupPolicyDecision;
  reason: string;
  isAllowed: boolean;
  requiredAction?: 'REQUEST_SUPERVISOR_APPROVAL' | 'ATTACH_CASE_ID' | 'WAIT_FOR_RATE_LIMIT' | 'CONFIGURE_CREDENTIALS';
}

export class ExternalLookupPolicyEngine {
  private static instance: ExternalLookupPolicyEngine | null = null;

  private constructor() {}

  public static getInstance(): ExternalLookupPolicyEngine {
    if (!ExternalLookupPolicyEngine.instance) {
      ExternalLookupPolicyEngine.instance = new ExternalLookupPolicyEngine();
    }
    return ExternalLookupPolicyEngine.instance;
  }

  /**
   * Evaluates if an external lookup request is compliant with Gujarat Police Data Governance SOP
   */
  public evaluatePolicy(
    provider: string,
    providerStatus: ExternalProviderStatus,
    context: ProviderAuthorizationContext,
    plate: string
  ): PolicyEvaluationResult {
    // 1. Check provider availability state
    if (providerStatus === 'NOT_CONFIGURED' || providerStatus === 'DISABLED') {
      return {
        decision: 'NOT_CONFIGURED',
        reason: `${provider} Gateway is not configured with state agency credentials.`,
        isAllowed: false,
        requiredAction: 'CONFIGURE_CREDENTIALS'
      };
    }

    if (providerStatus === 'OFFLINE' || providerStatus === 'ERROR') {
      return {
        decision: 'DENY',
        reason: `${provider} Gateway is currently offline or unreachable.`,
        isAllowed: false
      };
    }

    // 2. Check Rate Limits
    const rateStatus = externalLookupRateLimiter.checkLimit(provider);
    if (!rateStatus.isAllowed) {
      return {
        decision: 'RATE_LIMITED',
        reason: `Exceeded statutory query quota (${rateStatus.maxAllowedPerMinute}/min). Retry in ${rateStatus.retryAfterSeconds}s.`,
        isAllowed: false,
        requiredAction: 'WAIT_FOR_RATE_LIMIT'
      };
    }

    // 3. RBAC Enforcement
    switch (context.role) {
      case 'VIEWER':
        return {
          decision: 'DENY',
          reason: 'Role VIEWER has access to CCTV camera observations only. External vehicle registries are restricted.',
          isAllowed: false
        };

      case 'OPERATOR':
        // Allowed only for active watchlist targets or active incident triggers
        if (context.isWatchlistTarget || context.isActiveInvestigation) {
          return {
            decision: 'ALLOW',
            reason: 'Role OPERATOR authorized: Target matches active watchlist or incident trigger.',
            isAllowed: true
          };
        }
        return {
          decision: 'REVIEW_REQUIRED',
          reason: 'Routine traffic lookup requires supervisor escalation or active investigation tag.',
          isAllowed: false,
          requiredAction: 'REQUEST_SUPERVISOR_APPROVAL'
        };

      case 'INVESTIGATOR':
        if (context.caseId || context.isActiveInvestigation || context.isWatchlistTarget) {
          return {
            decision: 'ALLOW',
            reason: `Role INVESTIGATOR authorized under Case Reference [${context.caseId || 'ACTIVE_CASE'}].`,
            isAllowed: true
          };
        }
        return {
          decision: 'REVIEW_REQUIRED',
          reason: 'Investigation lookup requires a valid FIR or Case ID reference to proceed.',
          isAllowed: false,
          requiredAction: 'ATTACH_CASE_ID'
        };

      case 'SUPERVISOR':
      case 'ADMIN':
        return {
          decision: 'ALLOW',
          reason: `Role ${context.role} has statutory oversight and audit authority.`,
          isAllowed: true
        };

      case 'SYSTEM_AGENT':
        if (context.isWatchlistTarget || context.isActiveInvestigation) {
          return {
            decision: 'ALLOW',
            reason: 'Autonomous Agent authorized for registered watchlist/case correlation.',
            isAllowed: true
          };
        }
        return {
          decision: 'DENY',
          reason: 'Autonomous Agent query blocked: Mass automated lookups for arbitrary plates are prohibited.',
          isAllowed: false
        };

      default:
        return {
          decision: 'DENY',
          reason: 'Unknown or unauthenticated role.',
          isAllowed: false
        };
    }
  }

  public canQueryProvider(
    context: ProviderAuthorizationContext,
    provider: string,
    plate?: string
  ): { allowed: boolean; decision: ExternalLookupPolicyDecision; reason: string } {
    const res = this.evaluatePolicy(provider, 'AVAILABLE', context, plate || 'GJ05AB1234');
    return {
      allowed: res.isAllowed,
      decision: res.decision,
      reason: res.reason
    };
  }
}

export const externalLookupPolicyEngine = ExternalLookupPolicyEngine.getInstance();
