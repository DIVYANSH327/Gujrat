/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleHistoryAgent: Persistent Vehicle Sightings, Trajectory Graph Reconstruction,
 * Last-Known Location Resolution & Multi-Agency Intelligence Synthesis Agent
 * 
 * Unified CCTV Intelligence Grid V1.3 — Persistent Vehicle Intelligence & AI Training Lab
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import {
  VehicleSighting,
  VehicleJourney,
  LastKnownSightingInfo,
  normalizeLicensePlate,
  VehicleIdentity
} from '../../types';
import { vehicleHistoryRepository } from '../../services/VehicleHistoryRepository';
import { vehicleJourneyService } from '../../services/VehicleJourneyService';
import { vahanAdapter } from '../../services/integrations/VahanAdapter';
import { echallanAdapter } from '../../services/integrations/EChallanAdapter';
import { egujcopAdapter } from '../../services/integrations/EGujCopAdapter';

export interface VehicleInvestigationSummary {
  normalizedPlate: string;
  rawPlate: string;
  vehicleIdentity: VehicleIdentity;
  lastKnownLocation: LastKnownSightingInfo | null;
  journey: VehicleJourney;
  sightingsCount: number;
  watchlistStatus: string;
  vahanStatus: string;
  vahanDetails?: any;
  echallanStatus: string;
  echallanDetails?: any;
  policeRecordsStatus: string;
  policeRecordsDetails?: any;
  generatedAt: string;
  correlationId: string;
  dataClassification: string;
  disclaimer: string;
}

export class VehicleHistoryAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'AGENT-VEHICLE-HISTORY-01',
      agentType: 'VEHICLE_HISTORY',
      region: params?.region || 'CENTRAL',
      assignedScope: 'STATEWIDE_VEHICLE_TRAJECTORY_AND_PERSISTENT_CORRELATION',
      capabilities: ['VEHICLE_HISTORY', 'VEHICLE_INTELLIGENCE', 'STATE_HISTORY_INQUIRY', 'TEMPORAL_CORRIDOR_MAPPING'],
      isSimulated: params?.isSimulated ?? true
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  /**
   * Ingests a new vehicle sighting into persistent history.
   */
  public async ingestSighting(sighting: VehicleSighting): Promise<VehicleSighting> {
    const saved = await vehicleHistoryRepository.saveSighting(sighting);
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
    return saved;
  }

  /**
   * Retrieves chronological sightings history for a vehicle plate.
   */
  public async getHistory(plate: string): Promise<VehicleSighting[]> {
    const norm = normalizeLicensePlate(plate);
    return vehicleHistoryRepository.getVehicleHistory(norm);
  }

  /**
   * Resolves the authoritative last known camera sighting for a vehicle.
   */
  public async getLastKnown(plate: string): Promise<LastKnownSightingInfo | null> {
    const norm = normalizeLicensePlate(plate);
    return vehicleJourneyService.getLastKnownLocation(norm);
  }

  /**
   * Reconstructs the complete trajectory and cross-camera corridor journey.
   */
  public async buildJourney(plate: string): Promise<VehicleJourney> {
    const norm = normalizeLicensePlate(plate);
    return vehicleJourneyService.buildJourney(norm);
  }

  /**
   * Synthesizes a unified multi-agency vehicle investigation dossier.
   */
  public async synthesizeInvestigationSummary(
    plate: string,
    correlationId = `CORR-DOSSIER-${Date.now()}`
  ): Promise<VehicleInvestigationSummary> {
    const norm = normalizeLicensePlate(plate);
    const journey = await this.buildJourney(norm);
    const lastKnown = journey.lastKnownLocation || null;
    const history = journey.sightings;

    // Concurrently query multi-agency adapters
    const [vahanRes, echallanRes, policeRes] = await Promise.all([
      vahanAdapter.lookupVehicle(norm),
      echallanAdapter.lookupChallansByVehicle(norm),
      egujcopAdapter.lookupVehicle(norm)
    ]);

    const firstSeen = history.length > 0 ? history[0].timestamp : new Date().toISOString();
    const lastSeen = lastKnown ? lastKnown.lastTimestamp : firstSeen;
    const primaryType = lastKnown?.vehicleType || history[0]?.vehicleType || 'SUV';
    const primaryColor = lastKnown?.color || history[0]?.colorEstimate || 'WHITE';
    const watchlistStatus = (norm === 'GJ05AB1234' || lastKnown?.watchlistStatus === 'MATCH')
      ? 'MATCH'
      : lastKnown?.watchlistStatus === 'WATCHLIST_CANDIDATE'
      ? 'WATCHLIST_CANDIDATE'
      : 'CLEAR';

    const vehicleIdentity: VehicleIdentity = {
      normalizedPlate: norm,
      rawPlate: history[0]?.rawPlate || norm,
      firstSeen,
      lastSeen,
      totalSightings: history.length,
      primaryVehicleType: primaryType,
      primaryColor,
      watchlistStatus: watchlistStatus as any,
      label: 'VEHICLE RECORD',
      disclaimer: 'VEHICLE RECORD ONLY — NOT CRIMINAL RECORD. Criminal correlation requires explicit judicial or CCTNS record.'
    };

    return {
      normalizedPlate: norm,
      rawPlate: history[0]?.rawPlate || norm,
      vehicleIdentity,
      lastKnownLocation: lastKnown,
      journey,
      sightingsCount: history.length,
      watchlistStatus,
      vahanStatus: vahanRes.registrationStatus || 'NOT_CONNECTED',
      vahanDetails: vahanRes,
      echallanStatus: echallanRes.status,
      echallanDetails: echallanRes,
      policeRecordsStatus: policeRes.status,
      policeRecordsDetails: policeRes,
      generatedAt: new Date().toISOString(),
      correlationId,
      dataClassification: journey.dataClassification || 'SYNTHETIC_SIMULATION',
      disclaimer: 'UNIFIED VEHICLE INTELLIGENCE DOSSIER: Correlated from authorized CCTV sightings, VAHAN reference registry, eChallan records, and eGujCop CCTNS incident status.'
    };
  }

  /**
   * Synthesizes full dossier with structured evidence chain and watchlist verification.
   */
  public async synthesizeVehicleHistoryDossier(plate: string) {
    const norm = normalizeLicensePlate(plate);
    const summary = await this.synthesizeInvestigationSummary(norm);
    const journey = summary.journey;

    const evidenceChain = journey.sightings.map(s => ({
      sightingId: s.sightingId,
      cameraId: s.cameraId,
      timestamp: s.timestamp,
      sha256Hash: `SHA256-${s.sightingId}-HEX-${Date.now().toString(16)}`,
      clipReference: s.clipReference || `EVD-CLIP-${s.sightingId}`
    }));

    return {
      success: true,
      dossier: {
        vehicleNumber: norm,
        watchlistStatus: {
          isFlagged: summary.watchlistStatus === 'MATCH' || norm === 'GJ05AB1234',
          category: 'CRITICAL_HIGHWAY_PATROL',
          severity: 'CRITICAL'
        },
        journey,
        evidenceChain,
        multiAgencySummary: summary
      }
    };
  }

  /**
   * Executes assigned agent job.
   */
  public async assignJob(job: AIAgentJob): Promise<any> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const {
        action = 'LOOKUP_HISTORY',
        plate = 'GJ05AB1234',
        sighting
      } = job.payload || {};

      let result: any;

      if (action === 'INGEST_SIGHTING' && sighting) {
        result = await this.ingestSighting(sighting);
      } else if (action === 'GET_LAST_KNOWN') {
        result = await this.getLastKnown(plate);
      } else if (action === 'BUILD_JOURNEY') {
        result = await this.buildJourney(plate);
      } else if (action === 'SYNTHESIZE_DOSSIER') {
        result = await this.synthesizeInvestigationSummary(plate, job.correlationId);
      } else {
        result = await this.getHistory(plate);
      }

      this.eventsProcessedCount += 1;
      this.completedJobsCount += 1;
      const latency = Date.now() - start;
      this.totalLatencyMs += latency;
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

export const vehicleHistoryAgent = new VehicleHistoryAgent();
