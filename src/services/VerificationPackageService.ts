import {
  VerificationPackage,
  HumanVerificationDecision,
  SourceClassification,
} from '../types';
import { sysEvents } from './Architecture';

export class VerificationPackageService {
  private static instance: VerificationPackageService;
  private packages: Map<string, VerificationPackage> = new Map();

  private constructor() {
    this.seedDefaultDemoPackages();
  }

  public static getInstance(): VerificationPackageService {
    if (!VerificationPackageService.instance) {
      VerificationPackageService.instance = new VerificationPackageService();
    }
    return VerificationPackageService.instance;
  }

  private seedDefaultDemoPackages(): void {
    const defaultPkg: VerificationPackage = {
      packageId: 'VPKG-DEMO-001',
      eventId: 'EVT-CORR-GJ05AB1234-01',
      alertId: 'ALT-CANDIDATE-001',
      targetId: 'V-DEMO-001',
      vehiclePlate: 'GJ05AB1234',
      normalizedPlate: 'GJ05AB1234',
      cameraId: 'CAM-007',
      cameraName: 'SG Highway - Pakwan Cross Junction (Eastbound)',
      location: 'Pakwan Cross Junction, SG Highway, Ahmedabad',
      timestamp: new Date().toISOString(),
      candidateConfidence: 0.94,
      matchType: 'WATCHLIST_VEHICLE',
      sourceClassification: 'SYNTHETIC_SIMULATION',
      requiresHumanVerification: true,
      status: 'PENDING_VERIFICATION',
      frames: {
        candidateActualFrame: '/api/cctv/snapshot/CAM-007',
        burstAvailable: false,
      },
      referenceItem: {
        targetAlias: 'Silver Sedan Corridor Alert',
        severity: 'critical',
        notes: 'Simulated watchlist vehicle wanted for verification test scenario.',
      },
    };

    this.packages.set(defaultPkg.packageId, defaultPkg);
  }

  public createPackage(params: {
    eventId: string;
    alertId?: string;
    targetId?: string;
    vehiclePlate?: string;
    normalizedPlate?: string;
    cameraId: string;
    cameraName: string;
    location: string;
    timestamp?: string;
    candidateConfidence: number;
    matchType: 'WATCHLIST_VEHICLE' | 'PERSON_VISUAL_CORRELATION';
    sourceClassification: SourceClassification;
    candidateActualFrame: string;
    previousActualFrame?: string;
    nextActualFrame?: string;
    referenceItem?: {
      referencePhoto?: string;
      targetAlias?: string;
      severity: string;
      notes?: string;
    };
  }): VerificationPackage {
    const packageId = `VPKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pkg: VerificationPackage = {
      packageId,
      eventId: params.eventId,
      alertId: params.alertId,
      targetId: params.targetId,
      vehiclePlate: params.vehiclePlate,
      normalizedPlate: params.normalizedPlate,
      cameraId: params.cameraId,
      cameraName: params.cameraName,
      location: params.location,
      timestamp: params.timestamp || new Date().toISOString(),
      candidateConfidence: params.candidateConfidence,
      matchType: params.matchType,
      sourceClassification: params.sourceClassification,
      requiresHumanVerification: true,
      status: 'PENDING_VERIFICATION',
      frames: {
        candidateActualFrame: params.candidateActualFrame,
        previousActualFrame: params.previousActualFrame,
        nextActualFrame: params.nextActualFrame,
        burstAvailable: Boolean(params.previousActualFrame || params.nextActualFrame),
      },
      referenceItem: params.referenceItem,
    };

    this.packages.set(packageId, pkg);

    sysEvents.emit('verification_package_created', {
      packageId,
      eventId: params.eventId,
      targetId: params.targetId,
      plate: params.normalizedPlate,
      requiresHumanVerification: true,
    });

    return pkg;
  }

  public recordDecision(
    packageId: string,
    decision: 'CONFIRMED' | 'REJECTED' | 'ESCALATED',
    verifiedBy: string = 'Duty Officer (Badge 4092)',
    role: string = 'Command Center Operator',
    notes?: string
  ): { success: boolean; decisionRecord?: HumanVerificationDecision; message: string } {
    const pkg = this.packages.get(packageId);
    if (!pkg) {
      return { success: false, message: `Package ${packageId} not found.` };
    }

    const decisionRecord: HumanVerificationDecision = {
      decisionId: `DEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      packageId,
      verifiedBy,
      role,
      decision,
      timestamp: new Date().toISOString(),
      notes: notes || `Human verification operator marked candidate as ${decision}`,
      auditCorrelationId: pkg.eventId,
    };

    pkg.status = decision;
    pkg.decision = decisionRecord;

    sysEvents.emit('human_verification_decision', {
      packageId,
      decision,
      verifiedBy,
      role,
      timestamp: decisionRecord.timestamp,
    });

    return {
      success: true,
      decisionRecord,
      message: `Candidate verification successfully recorded as ${decision}.`,
    };
  }

  public getPackage(packageId: string): VerificationPackage | undefined {
    return this.packages.get(packageId);
  }

  public listPendingPackages(): VerificationPackage[] {
    return Array.from(this.packages.values()).filter(p => p.status === 'PENDING_VERIFICATION');
  }

  public listAllPackages(): VerificationPackage[] {
    return Array.from(this.packages.values());
  }

  public resetDemo(): void {
    this.packages.clear();
    this.seedDefaultDemoPackages();
  }
}

export const verificationPackageService = VerificationPackageService.getInstance();
