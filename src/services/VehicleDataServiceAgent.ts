/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleDataServiceAgent: Controlled Gateway for Authorized Government Vehicle Services
 * Principle: Strict Adapter Pattern, Zero Credential Exposure, Separation of Camera vs Gov Records.
 */

export type VehicleProviderState =
  | 'DISABLED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'AVAILABLE'
  | 'DEGRADED'
  | 'OFFLINE';

export interface VehicleLookupContext {
  officerId: string;
  badgeNumber: string;
  caseId: string;
  purpose: 'ACTIVE_INVESTIGATION' | 'WATCHLIST_VERIFICATION' | 'ENFORCEMENT_ACTION' | 'COURT_SUMMONS';
  role: string;
}

export interface AuthorizedVehicleRecord {
  plateNumber: string;
  registrationDate?: string;
  vehicleClass?: string;
  maker?: string;
  model?: string;
  fuelType?: string;
  emissionNorm?: string;
  color?: string;
  insuranceValidUntil?: string;
  fitnessValidUntil?: string;
  pucValidUntil?: string;
  rcStatus?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  blacklisted?: boolean;
  blacklistReason?: string;
  maskedOwnerName?: string; // e.g. "R****H K***R" for privacy compliance
  rtoCode?: string;
  state: string;
  providerSource: string;
  retrievedAt: string;
  isSimulatedAdapter: boolean;
}

export interface VehicleDataLookupAudit {
  auditId: string;
  who: string;
  role: string;
  when: string;
  plate: string;
  purpose: string;
  caseId: string;
  provider: string;
  fieldsRequested: string[];
  fieldsReturned: string[];
  requestId: string;
  success: boolean;
  error?: string;
}

export interface IVehicleDataProvider {
  readonly providerId: string;
  readonly providerName: string;
  getProviderStatus(): VehicleProviderState;
  getSupportedFields(): string[];
  getRetentionPolicy(): string;
  getLastSync(): string;
  healthCheck(): Promise<boolean>;
  lookupVehicle(plate: string, context: VehicleLookupContext): Promise<AuthorizedVehicleRecord | null>;
}

export class MockVehicleDataProvider implements IVehicleDataProvider {
  public readonly providerId = 'MOCK_VAHAN_ADAPTER';
  public readonly providerName = 'Mock VAHAN 4.0 Testing Adapter';

  public getProviderStatus(): VehicleProviderState {
    return 'AVAILABLE';
  }

  public getSupportedFields(): string[] {
    return ['vehicleClass', 'maker', 'model', 'fuelType', 'rcStatus', 'maskedOwnerName', 'insuranceValidUntil', 'fitnessValidUntil'];
  }

  public getRetentionPolicy(): string {
    return 'EPHEMERAL_CASE_ATTACHED_30_DAYS';
  }

  public getLastSync(): string {
    return new Date().toISOString();
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }

  public async lookupVehicle(plate: string, context: VehicleLookupContext): Promise<AuthorizedVehicleRecord | null> {
    const norm = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Sample database of authorized mock records for testing
    const mockDb: Record<string, Partial<AuthorizedVehicleRecord>> = {
      GJ05AB1234: {
        vehicleClass: 'Motor Car (LMV)',
        maker: 'Maruti Suzuki',
        model: 'Swift VXi',
        color: 'Pearl Arctic White',
        fuelType: 'PETROL',
        emissionNorm: 'BHARAT STAGE VI',
        registrationDate: '2022-04-14',
        rcStatus: 'ACTIVE',
        blacklisted: true,
        blacklistReason: 'SURAT_POLICE_INTERCEPT_WARRANT',
        maskedOwnerName: 'D*****H S*********A',
        rtoCode: 'GJ05 (Surat City RTO)',
        insuranceValidUntil: '2027-04-13',
        fitnessValidUntil: '2037-04-13'
      },
      GJ01AB1234: {
        vehicleClass: 'Motor Car (LMV)',
        maker: 'Hyundai',
        model: 'Creta SX',
        color: 'White',
        fuelType: 'DIESEL',
        registrationDate: '2023-01-10',
        rcStatus: 'ACTIVE',
        blacklisted: true,
        blacklistReason: 'STATEWIDE_WATCHLIST_FLAG',
        maskedOwnerName: 'A***L P***L',
        rtoCode: 'GJ01 (Ahmedabad RTO)',
        insuranceValidUntil: '2026-01-09',
        fitnessValidUntil: '2038-01-09'
      }
    };

    const record = mockDb[norm] || {
      vehicleClass: 'Motor Car (LMV)',
      maker: 'Generic Fleet',
      model: 'Sedan',
      color: 'Silver',
      fuelType: 'PETROL',
      rcStatus: 'ACTIVE',
      maskedOwnerName: 'V*****R R*******D',
      rtoCode: 'GJ01 (Ahmedabad)',
      insuranceValidUntil: '2026-12-31'
    };

    return {
      plateNumber: norm,
      state: 'Gujarat',
      providerSource: 'MOCK_VAHAN_SIMULATION',
      retrievedAt: new Date().toISOString(),
      isSimulatedAdapter: true,
      ...record
    };
  }
}

export class AuthorizedVahanProvider implements IVehicleDataProvider {
  public readonly providerId = 'GOVT_VAHAN_NATIONAL_REGISTRY';
  public readonly providerName = 'National VAHAN 4.0 Integration Gateway';

  public getProviderStatus(): VehicleProviderState {
    // In production without live API key or secure mutual-TLS tunnel, reports NOT_CONFIGURED
    return 'CONFIGURED';
  }

  public getSupportedFields(): string[] {
    return ['chassisNumber', 'engineNumber', 'registrationDate', 'ownerDetails', 'hypothecation', 'permitDetails'];
  }

  public getRetentionPolicy(): string {
    return 'STATUTORY_INVESTIGATION_LIFECYCLE';
  }

  public getLastSync(): string {
    return 'STANDBY_AWAITING_MUTUAL_TLS_CERT';
  }

  public async healthCheck(): Promise<boolean> {
    return false; // Truthful: mutual-TLS tunnel is standby
  }

  public async lookupVehicle(plate: string, context: VehicleLookupContext): Promise<AuthorizedVehicleRecord | null> {
    throw new Error('Authorized National VAHAN API requires authenticated mTLS gateway and valid NIC credentials. Currently operating in integration-ready mode.');
  }
}

export class VehicleDataServiceAgent {
  private static instance: VehicleDataServiceAgent | null = null;
  private provider: IVehicleDataProvider;
  private auditLog: VehicleDataLookupAudit[] = [];

  private constructor() {
    this.provider = new MockVehicleDataProvider();
  }

  public static getInstance(): VehicleDataServiceAgent {
    if (!VehicleDataServiceAgent.instance) {
      VehicleDataServiceAgent.instance = new VehicleDataServiceAgent();
    }
    return VehicleDataServiceAgent.instance;
  }

  public async queryVehicleData(plate: string, context: VehicleLookupContext): Promise<{
    record: AuthorizedVehicleRecord | null;
    disclaimer: string;
    auditReference: string;
  }> {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fieldsRequested = ['vehicleClass', 'maker', 'model', 'fuelType', 'rcStatus', 'maskedOwnerName'];

    try {
      const record = await this.provider.lookupVehicle(plate, context);

      const audit: VehicleDataLookupAudit = {
        auditId: `AUDIT-${Date.now()}`,
        who: context.officerId,
        role: context.role,
        when: new Date().toISOString(),
        plate,
        purpose: context.purpose,
        caseId: context.caseId,
        provider: this.provider.providerId,
        fieldsRequested,
        fieldsReturned: record ? Object.keys(record) : [],
        requestId,
        success: !!record
      };
      this.auditLog.unshift(audit);

      return {
        record,
        disclaimer: 'DATA ORIGIN: Mock VAHAN testing adapter for hackathon/demonstration. Never scraped; does not connect to live production NIC servers without authorized departmental credentials.',
        auditReference: audit.auditId
      };
    } catch (err: any) {
      const audit: VehicleDataLookupAudit = {
        auditId: `AUDIT-${Date.now()}`,
        who: context.officerId,
        role: context.role,
        when: new Date().toISOString(),
        plate,
        purpose: context.purpose,
        caseId: context.caseId,
        provider: this.provider.providerId,
        fieldsRequested,
        fieldsReturned: [],
        requestId,
        success: false,
        error: err.message
      };
      this.auditLog.unshift(audit);
      throw err;
    }
  }

  public getAuditLog(): VehicleDataLookupAudit[] {
    return [...this.auditLog];
  }

  public getProviderStatus(): VehicleProviderState {
    return this.provider.getProviderStatus();
  }
}

export const vehicleDataService = VehicleDataServiceAgent.getInstance();
