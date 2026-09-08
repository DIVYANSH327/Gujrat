/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleDataIntelligenceAgent: Central Multimodal Intelligence & Registry Correlation Agent
 * 
 * Capabilities:
 * - Consumes VehicleObservation from Edge nodes & CCTV cameras
 * - Normalizes plate strings and identifies OCR ambiguities
 * - Associates observations into unified VehicleDossier
 * - Queries authorized external providers (VAHAN, eChallan, eGujCop) via zero-trust policy engine
 * - Flags color/make discrepancies between observed sensor facts and registered records
 * - Updates spatiotemporal graph and last-seen prediction corridor
 * - Maintains immutable audit lineage without executing autonomous penalties
 */

import { BaseAgent } from '../base/BaseAgent';
import { 
  VehicleObservation, 
  VehicleDossier, 
  AIAgentJob, 
  UserRole,
  normalizeLicensePlate 
} from '../../types';
import { vehicleDossierService } from '../../services/VehicleDossierService';
import { externalDataProviderRegistry } from '../../services/ExternalDataProviderRegistry';
import { vehicleIntelligenceGraphService } from '../../services/VehicleIntelligenceGraphService';
import { lastSeenVehicleService } from '../../services/LastSeenVehicleService';
import { anprQualityService } from '../../services/ANPRQualityService';
import { sysEvents } from '../../services/Architecture';

export interface VehicleDataIntelligenceJobPayload {
  plate: string;
  context?: {
    actorId?: string;
    role?: UserRole;
    purpose?: string;
    caseId?: string;
    queryExternalRegistries?: boolean;
  };
}

export class VehicleDataIntelligenceAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'VEH-DATA-INTEL-CENTRAL-01',
      agentType: 'VEHICLE_DATA_INTELLIGENCE',
      region: params?.region || 'CENTRAL',
      assignedScope: 'STATEWIDE_VEHICLE_INTELLIGENCE_MESH',
      capabilities: [
        'VEHICLE_DATA_INTELLIGENCE',
        'VEHICLE_INTELLIGENCE',
        'VAHAN_INTEGRATION',
        'ECHALLAN_INTEGRATION',
        'POLICE_RECORDS_INTEGRATION'
      ],
      isSimulated: params?.isSimulated ?? false
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();

    if (event?.type === 'VEHICLE_OBSERVATION_CAPTURED' && event.observation) {
      await this.processObservation(event.observation);
    }
  }

  /**
   * Processes an incoming raw camera observation into the intelligence mesh
   */
  public async processObservation(obs: VehicleObservation): Promise<VehicleDossier> {
    const start = Date.now();
    this.recordHeartbeat();

    // 1. Ingest into Master Dossier
    const dossier = vehicleDossierService.updateDossierWithObservation(obs);

    // 2. Ingest into Knowledge Graph
    try {
      vehicleIntelligenceGraphService.ingestObservation(obs);
    } catch {
      // Graph ingestion resilient
    }

    // 3. Emit downstream telemetry
    const elapsed = Date.now() - start;
    this.totalLatencyMs += elapsed;
    this.completedJobsCount += 1;

    sysEvents.emit('VEHICLE_DOSSIER_UPDATED', {
      agentId: this.agentId,
      vehicleId: dossier.vehicleId,
      plate: dossier.canonicalPlate,
      observationId: obs.observationId,
      timestamp: new Date().toISOString()
    });

    return dossier;
  }

  /**
   * Performs policy-governed query across authorized government databases
   */
  public async queryAuthorizedExternalData(
    plate: string, 
    context?: {
      actorId?: string;
      role?: UserRole;
      purpose?: string;
      caseId?: string;
    }
  ): Promise<any> {
    const normalized = normalizeLicensePlate(plate);
    const authContext = {
      actorId: context?.actorId || 'AGENT-AUTO-CORR',
      role: context?.role || 'SYSTEM_AGENT',
      purpose: context?.purpose || 'Autonomous Vehicle Dossier Correlation',
      caseId: context?.caseId,
      isActiveInvestigation: true
    };

    const extResults = await externalDataProviderRegistry.queryAllAuthorized(normalized, authContext);
    
    // Update dossier with external facts
    const updatedDossier = vehicleDossierService.updateDossierWithExternalData(normalized, extResults);

    // Check for attribute discrepancies (e.g. White SUV observed vs Silver Hatchback registered)
    const observedColor = updatedDossier.vehicleAttributes.observedColor?.toUpperCase();
    const registeredColor = extResults.vahan?.record?.color?.toUpperCase();
    if (observedColor && registeredColor && observedColor !== 'UNKNOWN' && observedColor !== registeredColor) {
      this.alertsGeneratedCount += 1;
      sysEvents.emit('ALERT_CREATED', {
        alertId: `ALT-DISCREPANCY-${Date.now()}`,
        type: 'REGISTRY_ATTRIBUTE_DISCREPANCY',
        severity: 'HIGH',
        details: `Color discrepancy on ${normalized}: Observed [${observedColor}] vs VAHAN Registry [${registeredColor}]`
      });
    }

    return updatedDossier;
  }

  /**
   * Executes scheduled job via AI Job Queue
   */
  public async assignJob(job: AIAgentJob): Promise<VehicleDossier> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const payload: VehicleDataIntelligenceJobPayload = job.payload || { plate: 'GJ05AB1234' };
      const plate = normalizeLicensePlate(payload.plate);

      let dossier = vehicleDossierService.getOrCreateDossier(plate);

      if (payload.context?.queryExternalRegistries) {
        dossier = await this.queryAuthorizedExternalData(plate, payload.context);
      }

      this.completedJobsCount += 1;
      this.totalLatencyMs += Date.now() - start;
      return dossier;
    } catch (err: any) {
      this.failedJobsCount += 1;
      throw err;
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }
}

export const vehicleDataIntelligenceAgent = new VehicleDataIntelligenceAgent();
