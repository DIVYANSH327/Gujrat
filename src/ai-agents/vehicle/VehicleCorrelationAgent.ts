/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleCorrelationAgent: Multi-Modal Cross-Source Vehicle Correlation Engine
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { normalizeLicensePlate, VehicleSighting, VehicleJourney } from '../../types';
import { VahanVehicleRecord } from '../../services/integrations/VahanAdapter';
import { EChallanRecord } from '../../services/integrations/EChallanAdapter';
import { PoliceRecordsResult } from '../../services/integrations/EGujCopAdapter';
import { VehicleClassificationResult } from './VehicleClassificationAgent';
import { ANPRResult } from './ANPRAgent';
import { vahanIntelligenceAgent } from '../police/VahanIntelligenceAgent';
import { echallanIntelligenceAgent } from '../police/EChallanIntelligenceAgent';
import { policeRecordsIntelligenceAgent } from '../police/PoliceRecordsIntelligenceAgent';
import { anprAgent } from './ANPRAgent';
import { vehicleClassificationAgent } from './VehicleClassificationAgent';
import { centralRepo } from '../../services/Architecture';
import { dataAccessAuditService } from '../../services/DataAccessAuditService';

export interface VehicleCorrelationResult {
  vehicleNumber: string;
  normalizedPlate: string;
  anprResult: ANPRResult;
  visualClassification: VehicleClassificationResult;
  vahanRecord: VahanVehicleRecord;
  echallanRecord: EChallanRecord;
  policeRecords: PoliceRecordsResult;
  watchlistStatus: 'MATCH' | 'NO_MATCH' | 'UNKNOWN';
  comparisonStatus: 'MATCH' | 'DISCREPANCY' | 'UNKNOWN' | 'CRITICAL_DISCREPANCY';
  discrepancyDetails: string[];
  requiresHumanVerification: boolean;
  alertReason: string;
  confidence: number;
  correlationTimestamp: string;
  disclaimer: string;
}

export class VehicleCorrelationAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string }) {
    super({
      agentId: params?.agentId || 'VEHICLE-CORR-CENTRAL-001',
      agentType: 'VEHICLE_CORRELATION',
      region: params?.region || 'CENTRAL',
      assignedScope: 'STATEWIDE_CROSS_MODAL_VEHICLE_CORRELATION',
      capabilities: ['VEHICLE_CORRELATION', 'VEHICLE_INTELLIGENCE'],
      isSimulated: true
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async correlateVehicleTarget(params: {
    rawPlate: string;
    cameraId?: string;
    hintClass?: string;
    hintColor?: string;
    operator?: string;
  }): Promise<VehicleCorrelationResult> {
    const job: AIAgentJob = {
      jobId: `job-corr-${Date.now()}`,
      jobType: 'MULTI_MODAL_VEHICLE_CORRELATION',
      priority: 'CRITICAL',
      status: 'RUNNING',
      assignedAgentId: this.agentId,
      sourceId: params.rawPlate,
      requiredCapabilities: ['VEHICLE_CORRELATION'],
      attempt: 1,
      maxAttempts: 2,
      createdAt: new Date().toISOString(),
      correlationId: `corr-mesh-${Date.now()}`,
      payload: params
    };

    return this.assignJob(job);
  }

  public async assignJob(job: AIAgentJob): Promise<VehicleCorrelationResult> {
    const start = Date.now();
    this.activeJobsCount += 1;
    try {
      const payload = job.payload || {};
      const rawPlate = payload.rawPlate || '';
      const cameraId = payload.cameraId || 'CAM-007';
      const operator = payload.operator || 'Command Officer';

      // 1. Run ANPR OCR & Normalization
      const anprResult = await anprAgent.recognizePlate({
        rawPlate,
        cameraId,
        timestamp: new Date().toISOString()
      });
      const normalized = anprResult.normalizedPlate;

      // 2. Run Visual Vehicle Classification
      const visualClassification = await vehicleClassificationAgent.classifyVehicle({
        cameraId,
        hintClass: payload.hintClass || 'SUV',
        hintColor: payload.hintColor || 'WHITE',
        timestamp: new Date().toISOString()
      });

      // 3. Query VAHAN Registry
      const vahanRecord = await vahanIntelligenceAgent.lookupVehicle(normalized, operator);

      // 4. Query eChallan System
      const echallanRecord = await echallanIntelligenceAgent.lookupChallans(normalized, operator);

      // 5. Query eGujCop Police Records
      const policeRecords = await policeRecordsIntelligenceAgent.lookupPoliceRecords(normalized, operator);

      // 6. Check Central Watchlist
      const allEvents = centralRepo.getAllEvents();
      const isWatchlist = allEvents.some(
        e => normalizeLicensePlate(e.metadata?.plate || '') === normalized && (e.metadata?.isWatchlistMatch || e.priority === 'critical')
      ) || normalized === 'GJ05AB1234' || normalized === 'GJ05XY6789';

      const watchlistStatus: 'MATCH' | 'NO_MATCH' | 'UNKNOWN' = isWatchlist ? 'MATCH' : 'NO_MATCH';

      // 7. Perform Discrepancy & Cross-Modal Consistency Analysis
      const discrepancyDetails: string[] = [];
      let comparisonStatus: 'MATCH' | 'DISCREPANCY' | 'UNKNOWN' | 'CRITICAL_DISCREPANCY' = 'MATCH';

      if (vahanRecord.registrationStatus === 'NOT_CONNECTED') {
        comparisonStatus = 'UNKNOWN';
        discrepancyDetails.push('Vehicle registry comparison pending: VAHAN adapter not connected.');
      } else {
        // Check vehicle class match
        const observedClass = visualClassification.vehicleType.toUpperCase();
        const registryClass = vahanRecord.vehicleClass.toUpperCase();
        
        if (observedClass !== 'UNKNOWN' && registryClass !== 'UNKNOWN') {
          const isClassCompatible = 
            observedClass === registryClass ||
            (observedClass === 'SUV' && (registryClass.includes('SUV') || registryClass.includes('CAR') || registryClass.includes('LMV'))) ||
            (observedClass === 'SEDAN' && (registryClass.includes('SEDAN') || registryClass.includes('CAR') || registryClass.includes('LMV'))) ||
            (observedClass === 'MOTORCYCLE' && (registryClass.includes('TWO') || registryClass.includes('MOTORCYCLE') || registryClass.includes('CYCLE')));

          if (!isClassCompatible) {
            comparisonStatus = 'CRITICAL_DISCREPANCY';
            discrepancyDetails.push(`CRITICAL CLASS MISMATCH: Observed visual type '${observedClass}' conflicts with official VAHAN registry record '${registryClass}'. Possible fake/cloned number plate.`);
          }
        }

        // Check color match
        const observedColor = visualClassification.color.toUpperCase();
        const registryColor = (vahanRecord.color || '').toUpperCase();
        if (observedColor && registryColor && observedColor !== 'UNKNOWN' && registryColor !== 'UNKNOWN') {
          if (!registryColor.includes(observedColor) && !observedColor.includes(registryColor)) {
            if (comparisonStatus !== 'CRITICAL_DISCREPANCY') comparisonStatus = 'DISCREPANCY';
            discrepancyDetails.push(`COLOR DISCREPANCY: Observed '${observedColor}' vs Registered '${registryColor}'.`);
          }
        }
      }

      // Build comprehensive alert reason
      let alertReason = `ANPR identified plate ${normalized} at ${cameraId} with ${(anprResult.confidence * 100).toFixed(0)}% confidence.`;
      if (watchlistStatus === 'MATCH') {
        alertReason += ` Flagged as WATCHLIST TARGET in active police tracking grid.`;
      }
      if (policeRecords.recordsFound > 0) {
        alertReason += ` Correlated with ${policeRecords.recordsFound} eGujCop police record(s) (${policeRecords.records[0].category}).`;
      }
      if (echallanRecord.pendingChallans > 0) {
        alertReason += ` ${echallanRecord.pendingChallans} pending eChallan violation(s) (₹${echallanRecord.totalOutstandingAmount}).`;
      }
      if (comparisonStatus === 'CRITICAL_DISCREPANCY') {
        alertReason += ` CRITICAL DATA DISCREPANCY: ${discrepancyDetails.join(' ')}`;
      }

      const result: VehicleCorrelationResult = {
        vehicleNumber: rawPlate,
        normalizedPlate: normalized,
        anprResult,
        visualClassification,
        vahanRecord,
        echallanRecord,
        policeRecords,
        watchlistStatus,
        comparisonStatus,
        discrepancyDetails,
        requiresHumanVerification: true,
        alertReason,
        confidence: 0.94,
        correlationTimestamp: new Date().toISOString(),
        disclaimer: 'AI CORRELATION RESULT (Synthesized Cross-Source Analysis — Requires human officer confirmation before field action)'
      };

      dataAccessAuditService.logAccess(
        'VehicleCorrelationAgent',
        'INVESTIGATION_DOSSIER_ACCESS',
        normalized,
        'SUCCESS',
        'Unified Intelligence Mesh',
        operator,
        `Synthesized dossier: Watchlist=${watchlistStatus}, PoliceRecords=${policeRecords.recordsFound}, Discrepancies=${discrepancyDetails.length}`,
        job.correlationId
      );

      this.eventsProcessedCount += 1;
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.recordHeartbeat();

      return result;
    } catch (err) {
      this.failedJobsCount += 1;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      throw err;
    }
  }
}

export const vehicleCorrelationAgent = new VehicleCorrelationAgent();
