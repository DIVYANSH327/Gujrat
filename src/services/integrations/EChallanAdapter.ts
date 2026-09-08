/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * eChallan Traffic Enforcement Integration Adapter Abstraction
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { normalizeLicensePlate } from '../../types';

export type EChallanIntegrationStatus = 
  | 'CONNECTED' 
  | 'AUTHORIZED_INTEGRATION' 
  | 'INTEGRATION_READY' 
  | 'SIMULATED' 
  | 'FUTURE' 
  | 'NOT_CONNECTED';

export interface EChallanItem {
  challanNumber: string;
  vehicleNumber: string;
  violationType: string;
  amount: number;
  date: string;
  location: string;
  status: 'PENDING' | 'PAID' | 'DISPUTED' | 'COURT_PENDING';
  evidenceSnapshotUrl?: string;
  source: string;
}

export interface EChallanRecord {
  vehicleNumber: string;
  normalizedPlate: string;
  pendingChallans: number;
  totalOutstandingAmount: number;
  recentViolations: EChallanItem[];
  lastViolationDate?: string;
  status: 'HAS_PENDING' | 'CLEAN' | 'NOT_CONNECTED';
  source: 'DEMO_DATA' | 'AUTHORIZED_ECHALLAN_API' | 'NOT_CONNECTED';
  retrievedAt: string;
  isSimulated: boolean;
  disclaimer: string;
}

export interface IEChallanAdapter {
  getIntegrationStatus(): EChallanIntegrationStatus;
  healthCheck(): Promise<{ isHealthy: boolean; status: string; latencyMs: number }>;
  lookupChallansByVehicle(plate: string): Promise<EChallanRecord>;
  lookupChallanByNumber(challanNumber: string): Promise<EChallanItem | null>;
}

export class EChallanAdapter implements IEChallanAdapter {
  private status: EChallanIntegrationStatus;

  constructor(status: EChallanIntegrationStatus = 'FUTURE') {
    this.status = status;
  }

  public getIntegrationStatus(): EChallanIntegrationStatus {
    return this.status;
  }

  public setStatus(status: EChallanIntegrationStatus) {
    this.status = status;
  }

  public async healthCheck(): Promise<{ isHealthy: boolean; status: string; latencyMs: number }> {
    return {
      isHealthy: this.status === 'CONNECTED' || this.status === 'SIMULATED',
      status: this.status,
      latencyMs: this.status === 'SIMULATED' ? 38 : 0
    };
  }

  public async lookupChallansByVehicle(plate: string): Promise<EChallanRecord> {
    const normalized = normalizeLicensePlate(plate);
    const retrievedAt = new Date().toISOString();

    if (this.status === 'FUTURE' || this.status === 'NOT_CONNECTED' || this.status === 'INTEGRATION_READY') {
      return {
        vehicleNumber: plate,
        normalizedPlate: normalized,
        pendingChallans: 0,
        totalOutstandingAmount: 0,
        recentViolations: [],
        status: 'NOT_CONNECTED',
        source: 'NOT_CONNECTED',
        retrievedAt,
        isSimulated: false,
        disclaimer: 'eCHALLAN STATUS: FUTURE AUTHORIZED INTEGRATION — Not connected to live Traffic Police eChallan gateway.'
      };
    }

    // Synthetic database for demo/testing
    const syntheticChallans: Record<string, EChallanItem[]> = {
      'GJ05AB1234': [
        {
          challanNumber: 'GJ-CH-2024-098841',
          vehicleNumber: 'GJ05AB1234',
          violationType: 'RED_LIGHT_VIOLATION',
          amount: 1000,
          date: '2026-08-20T14:32:00Z',
          location: 'Airport Circle Junction, Ahmedabad',
          status: 'PENDING',
          source: 'DEMO_DATA'
        },
        {
          challanNumber: 'GJ-CH-2024-081232',
          vehicleNumber: 'GJ05AB1234',
          violationType: 'OVERSPEEDING (>80 km/h in 60 km/h zone)',
          amount: 2000,
          date: '2026-07-15T09:12:00Z',
          location: 'SG Highway Flyover, Ahmedabad',
          status: 'PENDING',
          source: 'DEMO_DATA'
        },
        {
          challanNumber: 'GJ-CH-2024-041920',
          vehicleNumber: 'GJ05AB1234',
          violationType: 'STOP_LINE_CROSSING',
          amount: 500,
          date: '2026-05-10T18:45:00Z',
          location: 'Hansol Crossroad, Ahmedabad',
          status: 'PENDING',
          source: 'DEMO_DATA'
        }
      ],
      'GJ05XY6789': [
        {
          challanNumber: 'GJ-CH-2024-033109',
          vehicleNumber: 'GJ05XY6789',
          violationType: 'NO_HELMET',
          amount: 500,
          date: '2026-08-11T11:20:00Z',
          location: 'Ring Road Junction, Surat',
          status: 'PENDING',
          source: 'DEMO_DATA'
        }
      ]
    };

    const violations = syntheticChallans[normalized] || [];
    const pendingList = violations.filter(v => v.status === 'PENDING');
    const totalAmount = pendingList.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      vehicleNumber: plate,
      normalizedPlate: normalized,
      pendingChallans: pendingList.length,
      totalOutstandingAmount: totalAmount,
      recentViolations: violations,
      lastViolationDate: violations.length > 0 ? violations[0].date : undefined,
      status: pendingList.length > 0 ? 'HAS_PENDING' : 'CLEAN',
      source: 'DEMO_DATA',
      retrievedAt,
      isSimulated: true,
      disclaimer: 'SOURCE: DEMO DATA (Synthetic eChallan Enforcement Connector for Demonstration)'
    };
  }

  public async lookupChallanByNumber(challanNumber: string): Promise<EChallanItem | null> {
    if (this.status === 'FUTURE' || this.status === 'NOT_CONNECTED') {
      return null;
    }
    return {
      challanNumber,
      vehicleNumber: 'GJ05AB1234',
      violationType: 'RED_LIGHT_VIOLATION',
      amount: 1000,
      date: '2026-08-20T14:32:00Z',
      location: 'Airport Circle Junction, Ahmedabad',
      status: 'PENDING',
      source: 'DEMO_DATA'
    };
  }
}

export const echallanAdapter = new EChallanAdapter('FUTURE');
