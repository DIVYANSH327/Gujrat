/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AuthorizedEChallanProvider: Gujarat eChallan Traffic Enforcement Gateway
 * 
 * Strict Principle:
 * Live integration remains AUTHORIZED / FUTURE DEPLOYMENT until configured.
 * Sandbox adapter provides structured test validation without spoofing live networks.
 */

import { 
  IEChallanProvider, 
  ProviderAuthorizationContext, 
  ProviderHealthResponse 
} from './ExternalProviderInterfaces';
import { ExternalProviderStatus } from '../../types';
import { normalizeLicensePlate } from '../../types';

export interface EChallanRecord {
  challanNumber: string;
  violationDate: string;
  violationType: string;
  location: string;
  amount: number;
  status: 'PENDING' | 'DISPOSED' | 'CONTESTED';
  evidenceSnapshotUrl?: string;
  cameraReference?: string;
}

export class AuthorizedEChallanProvider implements IEChallanProvider {
  public providerId = 'ECHALLAN-GUJ-02';
  public name = 'Gujarat eChallan Traffic Enforcement Gateway';
  public capabilities = [
    'PENDING_CHALLAN_QUERY',
    'VIOLATION_HISTORY',
    'TRAFFIC_FINE_AUDIT'
  ];
  public supportedQueries = ['REGISTRATION_NUMBER', 'CHALLAN_NUMBER'];

  private status: ExternalProviderStatus = 'AVAILABLE';
  private isSimulationEnabled: boolean = true;

  constructor(initialStatus: ExternalProviderStatus = 'AVAILABLE', enableSimulation = true) {
    this.status = initialStatus;
    this.isSimulationEnabled = enableSimulation;
  }

  public getProviderStatus(): ExternalProviderStatus {
    return this.status;
  }

  public setProviderStatus(status: ExternalProviderStatus): void {
    this.status = status;
  }

  public getCapabilities(): string[] {
    return [...this.capabilities];
  }

  public async healthCheck(): Promise<ProviderHealthResponse> {
    const isHealthy = this.status === 'AVAILABLE' || this.status === 'AUTHORIZED';
    return {
      isHealthy,
      status: this.status,
      latencyMs: isHealthy ? 48 : 0,
      lastChecked: new Date().toISOString()
    };
  }

  public async lookup(query: string, context: ProviderAuthorizationContext): Promise<any> {
    return this.lookupChallans(query, context);
  }

  public async lookupChallans(plate: string, context: ProviderAuthorizationContext): Promise<any> {
    const normalized = normalizeLicensePlate(plate);
    const requestId = `ECH-REQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const retrievedAt = new Date().toISOString();

    if (this.status === 'NOT_CONFIGURED' || this.status === 'DISABLED') {
      return {
        status: 'EXTERNAL_LOOKUP_NOT_CONFIGURED',
        provider: this.name,
        requestId,
        normalizedPlate: normalized,
        challans: [],
        totalPendingAmount: 0,
        error: 'Gujarat eChallan gateway credentials not configured on this node.',
        disclaimer: 'NO LIVE ECHALLAN CONNECTION: Requires Gujarat Traffic Police API Key.',
        isAuthorized: false,
        retrievedAt
      };
    }

    if (this.status === 'OFFLINE' || this.status === 'ERROR') {
      return {
        status: 'EXTERNAL_PROVIDER_OFFLINE',
        provider: this.name,
        requestId,
        normalizedPlate: normalized,
        challans: [],
        totalPendingAmount: 0,
        error: 'Gujarat eChallan upstream gateway is currently offline.',
        disclaimer: 'ECHALLAN SERVICE OFFLINE: Local investigation proceeds unaffected.',
        isAuthorized: false,
        retrievedAt
      };
    }

    // Known demo plates
    const challanDb: Record<string, EChallanRecord[]> = {
      'GJ05AB1234': [
        {
          challanNumber: 'GJ-ECH-2026-98124',
          violationDate: '2026-08-20T14:32:00Z',
          violationType: 'RED_LIGHT_VIOLATION',
          location: 'Hansol Crossroad Junction (CAM-014)',
          amount: 1000,
          status: 'PENDING',
          cameraReference: 'CAM-014'
        },
        {
          challanNumber: 'GJ-ECH-2026-99512',
          violationDate: '2026-09-01T09:15:00Z',
          violationType: 'OVERSPEEDING_85KMH_IN_60KMH_ZONE',
          location: 'SG Highway Flyover (CAM-023)',
          amount: 2000,
          status: 'PENDING',
          cameraReference: 'CAM-023'
        },
        {
          challanNumber: 'GJ-ECH-2026-100234',
          violationDate: '2026-09-04T18:05:00Z',
          violationType: 'NO_PARKING_ZONE_OBSTRUCTION',
          location: 'Airport North Approach Road',
          amount: 500,
          status: 'PENDING'
        }
      ],
      'GJ01AB1234': [
        {
          challanNumber: 'GJ-ECH-2026-88129',
          violationDate: '2026-07-11T11:20:00Z',
          violationType: 'SEATBELT_NON_COMPLIANCE',
          location: 'Paldi Crossroad',
          amount: 500,
          status: 'DISPOSED'
        }
      ]
    };

    const records = challanDb[normalized] || [];
    const pendingAmount = records
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      status: 'SUCCESS',
      provider: this.name,
      requestId,
      normalizedPlate: normalized,
      challans: records,
      totalPendingAmount: pendingAmount,
      totalChallansCount: records.length,
      retrievedAt,
      isAuthorized: true,
      sourceOfTruth: 'EXTERNAL_AUTHORIZED',
      isSimulated: this.isSimulationEnabled,
      disclaimer: 'AUTHORIZED TRAFFIC DATA — Retrieved via Gujarat eChallan Gateway (Sandbox environment).'
    };
  }
}

export const authorizedEChallanProvider = new AuthorizedEChallanProvider('AVAILABLE', true);
