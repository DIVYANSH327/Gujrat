/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VAHAN Vehicle Registry Integration Adapter Abstraction
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { normalizeLicensePlate } from '../../types';

export type VahanIntegrationStatus = 
  | 'CONNECTED' 
  | 'AUTHORIZED_INTEGRATION' 
  | 'INTEGRATION_READY' 
  | 'SIMULATED' 
  | 'FUTURE' 
  | 'UNAVAILABLE';

export interface VahanVehicleRecord {
  registrationNumber: string;
  normalizedPlate: string;
  registrationStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'UNKNOWN' | 'NOT_CONNECTED';
  vehicleClass: string;
  make: string;
  model: string;
  color: string;
  fuelType: string;
  registrationDate?: string;
  registrationAuthority?: string;
  state?: string;
  rto?: string;
  flagStatus?: string;
  source: 'DEMO_DATA' | 'SYNTHETIC_RECORD' | 'AUTHORIZED_VAHAN_API' | 'FUTURE_INTEGRATION';
  retrievedAt: string;
  confidence: number;
  isSimulated: boolean;
  disclaimer: string;
}

export interface IVahanAdapter {
  getIntegrationStatus(): VahanIntegrationStatus;
  healthCheck(): Promise<{ isHealthy: boolean; status: string; latencyMs: number }>;
  lookupVehicleRegistration(plate: string): Promise<VahanVehicleRecord>;
}

/**
 * Standard VahanAdapter Implementation
 * Strict Rule: Never claims live VAHAN connectivity unless authorized credentials are authenticated.
 * Defaults to FUTURE AUTHORIZED INTEGRATION with explicit demo simulation options.
 */
export class VahanAdapter implements IVahanAdapter {
  private status: VahanIntegrationStatus;
  private isConfigured: boolean;

  constructor(status: VahanIntegrationStatus = 'FUTURE') {
    this.status = status;
    this.isConfigured = false;
  }

  public getIntegrationStatus(): VahanIntegrationStatus {
    return this.status;
  }

  public setStatus(status: VahanIntegrationStatus) {
    this.status = status;
  }

  public async healthCheck(): Promise<{ isHealthy: boolean; status: string; latencyMs: number }> {
    return {
      isHealthy: this.status === 'CONNECTED' || this.status === 'SIMULATED',
      status: this.status,
      latencyMs: this.status === 'SIMULATED' ? 42 : 0
    };
  }

  public async lookupVehicle(plate: string): Promise<VahanVehicleRecord> {
    return this.lookupVehicleRegistration(plate);
  }

  /**
   * Look up vehicle registration with explicit source labeling
   */
  public async lookupVehicleRegistration(plate: string): Promise<VahanVehicleRecord> {
    const normalized = normalizeLicensePlate(plate);
    const retrievedAt = new Date().toISOString();

    // If future or not connected, return truthful NOT_CONNECTED record
    if (this.status === 'FUTURE' || this.status === 'UNAVAILABLE' || this.status === 'INTEGRATION_READY') {
      return {
        registrationNumber: plate,
        normalizedPlate: normalized,
        registrationStatus: 'NOT_CONNECTED',
        vehicleClass: 'UNKNOWN',
        make: 'UNKNOWN',
        model: 'UNKNOWN',
        color: 'UNKNOWN',
        fuelType: 'UNKNOWN',
        source: 'FUTURE_INTEGRATION',
        retrievedAt,
        confidence: 0.0,
        isSimulated: false,
        disclaimer: 'VAHAN STATUS: FUTURE AUTHORIZED INTEGRATION — No live government database connection. Requires state transport credentials.'
      };
    }

    // In SIMULATED / DEMO mode, return structured synthetic vehicle data matching canonical test plates
    const syntheticDb: Record<string, Partial<VahanVehicleRecord>> = {
      'GJ05AB1234': {
        vehicleClass: 'SUV',
        make: 'Mahindra',
        model: 'Scorpio-N',
        color: 'WHITE',
        fuelType: 'DIESEL',
        registrationDate: '2023-04-12',
        registrationAuthority: 'RTO Surat (GJ-05)',
        state: 'Gujarat',
        rto: 'GJ-05',
        flagStatus: 'WANTED_IN_POLICE_RECORD',
        registrationStatus: 'ACTIVE'
      },
      'GJ01AB1234': {
        vehicleClass: 'SEDAN',
        make: 'Honda',
        model: 'City ZX',
        color: 'SILVER',
        fuelType: 'PETROL',
        registrationDate: '2022-08-19',
        registrationAuthority: 'RTO Ahmedabad (GJ-01)',
        state: 'Gujarat',
        rto: 'GJ-01',
        flagStatus: 'COMMERCIAL_CLEAR',
        registrationStatus: 'ACTIVE'
      },
      'GJ05XY6789': {
        vehicleClass: 'MOTORCYCLE',
        make: 'Hero',
        model: 'Splendor Plus',
        color: 'BLACK',
        fuelType: 'PETROL',
        registrationDate: '2021-11-05',
        registrationAuthority: 'RTO Surat (GJ-05)',
        state: 'Gujarat',
        rto: 'GJ-05',
        flagStatus: 'ALERT_SUSPECT_VEHICLE',
        registrationStatus: 'ACTIVE'
      },
      'GJ27AX9999': {
        vehicleClass: 'TRUCK',
        make: 'Tata',
        model: 'Prima 4028.S',
        color: 'BLUE',
        fuelType: 'DIESEL',
        registrationDate: '2020-02-14',
        registrationAuthority: 'RTO Gandhinagar (GJ-27)',
        state: 'Gujarat',
        rto: 'GJ-27',
        flagStatus: 'COMMERCIAL_CARRIER',
        registrationStatus: 'ACTIVE'
      }
    };

    const record = syntheticDb[normalized] || {
      vehicleClass: 'CAR',
      make: 'Maruti Suzuki',
      model: 'Swift Dzire',
      color: 'WHITE',
      fuelType: 'PETROL',
      registrationDate: '2022-01-10',
      registrationAuthority: 'RTO Ahmedabad East (GJ-27)',
      state: 'Gujarat',
      rto: 'GJ-27',
      flagStatus: 'STANDARD',
      registrationStatus: 'ACTIVE'
    };

    return {
      registrationNumber: plate,
      normalizedPlate: normalized,
      registrationStatus: record.registrationStatus || 'ACTIVE',
      vehicleClass: record.vehicleClass || 'CAR',
      make: record.make || 'UNKNOWN',
      model: record.model || 'UNKNOWN',
      color: record.color || 'UNKNOWN',
      fuelType: record.fuelType || 'PETROL',
      registrationDate: record.registrationDate,
      registrationAuthority: record.registrationAuthority,
      state: record.state || 'Gujarat',
      rto: record.rto,
      flagStatus: record.flagStatus,
      source: 'DEMO_DATA',
      retrievedAt,
      confidence: 0.95,
      isSimulated: true,
      disclaimer: 'DEMO DATA — SYNTHETIC RECORD (Abstracted VAHAN Adapter Connector for Prototype Architecture)'
    };
  }
}

export const vahanAdapter = new VahanAdapter('FUTURE');
