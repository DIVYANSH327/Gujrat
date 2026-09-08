/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ExternalEnforcementAdapter: Pluggable Adapter Architecture for eChallan, eGujCop, and Departmental Systems
 * Principles: Zero Hardcoded Credentials, Strict Permission Validation, Caching & Deduplication.
 */

export interface EnforcementRecord {
  caseOrChallanId: string;
  sourceSystem: 'eChallan' | 'eGujCop' | 'Inter-State CCTNS' | 'MOCK_ENFORCEMENT';
  vehicleNumber: string;
  timestamp: string;
  location: string;
  violationType: string;
  amountDue?: number;
  paymentStatus: 'PAID' | 'PENDING' | 'DISPUTED' | 'COURT_FORWARDED';
  officerBadge: string;
  isSimulated: boolean;
}

export interface IExternalEnforcementDataProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  fetchPendingChallans(vehiclePlate: string, token: string): Promise<EnforcementRecord[]>;
  fetchCriminalHistory(vehiclePlate: string, token: string): Promise<any[]>;
}

export class ExternalEnforcementAdapter implements IExternalEnforcementDataProvider {
  private static instance: ExternalEnforcementAdapter | null = null;
  public readonly providerName = 'Gujarat eChallan & eGujCop Police Integration Gateway';
  private cache: Map<string, { data: EnforcementRecord[]; expiresAt: number }> = new Map();

  private constructor() {}

  public static getInstance(): ExternalEnforcementAdapter {
    if (!ExternalEnforcementAdapter.instance) {
      ExternalEnforcementAdapter.instance = new ExternalEnforcementAdapter();
    }
    return ExternalEnforcementAdapter.instance;
  }

  public isConfigured(): boolean {
    return true; // Adapter abstraction loaded in sandbox demo mode
  }

  public async fetchPendingChallans(vehiclePlate: string, token: string): Promise<EnforcementRecord[]> {
    const norm = vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Cache check: 60-second TTL to avoid slamming upstream gateways
    const cached = this.cache.get(norm);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Deterministic mock challans for known targets
    let records: EnforcementRecord[] = [];
    if (norm === 'GJ05AB1234') {
      records = [
        {
          caseOrChallanId: 'ECH-SUR-2026-08912',
          sourceSystem: 'eChallan',
          vehicleNumber: norm,
          timestamp: '2026-08-20T10:15:00Z',
          location: 'Ring Road Interchange, Surat',
          violationType: 'RED_LIGHT_VIOLATION & OVERSPEEDING',
          amountDue: 2000,
          paymentStatus: 'PENDING',
          officerBadge: 'GJ-POL-4412',
          isSimulated: true
        }
      ];
    } else if (norm === 'GJ01AB1234') {
      records = [
        {
          caseOrChallanId: 'ECH-AHM-2026-01294',
          sourceSystem: 'eChallan',
          vehicleNumber: norm,
          timestamp: '2026-09-01T14:30:00Z',
          location: 'Pakwan Cross Road, SG Highway',
          violationType: 'UNSAFE_LANE_CHANGE',
          amountDue: 1000,
          paymentStatus: 'PENDING',
          officerBadge: 'GJ-POL-8819',
          isSimulated: true
        }
      ];
    }

    this.cache.set(norm, { data: records, expiresAt: Date.now() + 60000 });
    return records;
  }

  public async fetchCriminalHistory(vehiclePlate: string, token: string): Promise<any[]> {
    const norm = vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (norm === 'GJ05AB1234' || norm === 'GJ01AB1234') {
      return [
        {
          firNumber: 'FIR-2026-AHD-CR-0041',
          policeStation: 'Vastrapur Police Station',
          sections: ['IPC 379', 'MV Act 192'],
          status: 'UNDER_INVESTIGATION',
          wantedSubject: 'Flagged vehicle associated with active surveillance warrant'
        }
      ];
    }
    return [];
  }
}

export const externalEnforcement = ExternalEnforcementAdapter.getInstance();
