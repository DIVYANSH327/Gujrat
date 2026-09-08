/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Unified CCTV Intelligence Grid V2.1 — External Data Provider Interfaces
 * Core Contracts for VAHAN, eChallan, eGujCop and Authorized Government Gateways
 */

import { ExternalProviderStatus, UserRole, ExternalLookupPolicyDecision } from '../../types';

export interface ProviderAuthorizationContext {
  actorId: string;
  role: UserRole;
  purpose: string;
  caseId?: string;
  isWatchlistTarget?: boolean;
  isActiveInvestigation?: boolean;
}

export interface ProviderHealthResponse {
  isHealthy: boolean;
  status: ExternalProviderStatus;
  latencyMs: number;
  lastChecked: string;
}

export interface IExternalDataProvider<TResult = any> {
  providerId: string;
  name: string;
  capabilities: string[];
  supportedQueries: string[];
  getProviderStatus(): ExternalProviderStatus;
  setProviderStatus(status: ExternalProviderStatus): void;
  healthCheck(): Promise<ProviderHealthResponse>;
  getCapabilities(): string[];
  lookup(query: string, context: ProviderAuthorizationContext): Promise<TResult>;
}

export interface IVahanProvider extends IExternalDataProvider {
  lookupVehicle(plate: string, context: ProviderAuthorizationContext): Promise<any>;
}

export interface IEChallanProvider extends IExternalDataProvider {
  lookupChallans(plate: string, context: ProviderAuthorizationContext): Promise<any>;
}

export interface IEGujCopProvider extends IExternalDataProvider {
  lookupPoliceRecords(plate: string, context: ProviderAuthorizationContext): Promise<any>;
}
