/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleIntelligenceAgent: License Plate Recognition, HSRP Normalization,
 * Cross-Camera Vehicle Journey & Authorized Lookup Abstraction Agent
 * 
 * Unified CCTV Intelligence Grid V1.1
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';
import { 
  StandardAnprEvent, 
  AnprEventStatus, 
  normalizeLicensePlate,
  IVehicleDataProvider,
  SafeMockVehicleDataProvider,
  VehicleDataRecord,
  VehicleSighting,
  VehicleJourney,
  SecurityEventPayload,
  VehicleObservation
} from '../../types';
import { centralRepo, sysEvents } from '../../services/Architecture';
import { godsEyeObservationService } from '../../services/GodsEyeObservationService';

export interface VehicleProcessingResult {
  plate: string;
  normalizedPlate: string;
  plateConfidence: number;
  vehicleClass: string;
  status: AnprEventStatus;
  isWatchlistMatch: boolean;
  event?: StandardAnprEvent;
  vehicleDataLookup: VehicleDataRecord;
  disclaimer: string;
}

export class VehicleIntelligenceAgent extends BaseAgent {
  private vehicleDataProvider: IVehicleDataProvider;
  private sightings: Map<string, VehicleSighting[]> = new Map();

  constructor(params?: { 
    agentId?: string; 
    region?: string; 
    isSimulated?: boolean;
    dataProvider?: IVehicleDataProvider;
  }) {
    super({
      agentId: params?.agentId || 'VEHICLE-INTEL-CENTRAL-001',
      agentType: 'VEHICLE_INTELLIGENCE',
      region: params?.region || 'CENTRAL',
      assignedScope: 'STATEWIDE_TRAFFIC_AND_ANPR_CORRIDORS',
      capabilities: ['VEHICLE_INTELLIGENCE'],
      isSimulated: params?.isSimulated ?? true
    });
    this.vehicleDataProvider = params?.dataProvider || new SafeMockVehicleDataProvider();
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  /**
   * Convenience processor for vehicle frame
   */
  public async processVehicleFrame(params: {
    cameraId: string;
    siteId?: string;
    timestamp?: string;
    rawPlate: string;
    plateConfidence?: number;
    vehicleClass?: string;
    sourceEdgeNode?: string;
    direction?: string;
  }): Promise<VehicleProcessingResult> {
    const job: AIAgentJob = {
      jobId: `job-veh-${Date.now()}`,
      jobType: 'VEHICLE_ANPR_EVALUATION',
      priority: 'HIGH',
      status: 'RUNNING',
      assignedAgentId: this.agentId,
      sourceId: params.cameraId,
      requiredCapabilities: ['VEHICLE_INTELLIGENCE'],
      attempt: 1,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      correlationId: `corr-veh-${Date.now()}`,
      payload: {
        rawPlate: params.rawPlate,
        confidence: params.plateConfidence ?? 0.95,
        vehicleClass: params.vehicleClass ?? 'Sedan',
        cameraId: params.cameraId,
        edgeNodeId: params.sourceEdgeNode ?? 'EDGE-00001',
        direction: params.direction ?? 'Northbound'
      }
    };
    return this.assignJob(job);
  }

  /**
   * Plate Normalization
   * Strips hyphens, whitespaces, and symbols to produce standard registration format
   */
  public normalize(raw: string): string {
    return normalizeLicensePlate(raw);
  }

  /**
   * Evaluates plate readability. In Real AI mode, if the model cannot extract a confident plate,
   * it returns PLATE_UNKNOWN or PLATE_UNREADABLE — never fabricates.
   */
  public evaluatePlateReadability(
    rawPlate?: string, 
    confidence = 0.0, 
    isRealAi = false
  ): { plate: string; status: AnprEventStatus; confidence: number } {
    if (!rawPlate || rawPlate.trim() === '' || confidence < 0.35) {
      return {
        plate: 'PLATE_UNKNOWN',
        status: 'PLATE_UNKNOWN',
        confidence: 0.0
      };
    }

    if (rawPlate.toUpperCase().includes('UNREADABLE') || rawPlate.toUpperCase().includes('UNKNOWN')) {
      return {
        plate: 'PLATE_UNREADABLE',
        status: 'UNREADABLE',
        confidence: 0.0
      };
    }

    const normalized = normalizeLicensePlate(rawPlate);
    if (normalized.length < 4) {
      return {
        plate: 'PLATE_UNREADABLE',
        status: 'UNREADABLE',
        confidence
      };
    }

    return {
      plate: normalized,
      status: 'VERIFIED',
      confidence
    };
  }

  /**
   * Authorized vehicle database lookup abstraction.
   * Truthfully returns 'DATABASE LOOKUP: NOT CONNECTED' unless authorized credentials exist.
   */
  public async lookupVehicleData(plate: string): Promise<VehicleDataRecord> {
    return this.vehicleDataProvider.lookupVehicle(plate);
  }

  /**
   * Assign and execute job
   */
  public async assignJob(job: AIAgentJob): Promise<VehicleProcessingResult> {
    this.activeJobsCount += 1;
    const start = Date.now();

    try {
      const {
        rawPlate = '',
        confidence = 0.95,
        vehicleClass = 'Sedan',
        cameraId = 'CAM-AHM-007',
        edgeNodeId = 'EDGE-00042',
        location = 'Airport Circle Corridor',
        direction = 'Northbound',
        correlationId = job.correlationId,
        sourceMode = 'SIMULATED',
        isRealAi = false,
        watchlistPlates = ['GJ05AB1234', 'GJ01AB1234']
      } = job.payload || {};

      const readResult = this.evaluatePlateReadability(rawPlate, confidence, isRealAi);
      const normalized = readResult.plate;
      const isMatch = readResult.status === 'VERIFIED' && watchlistPlates.includes(normalized);

      const status: AnprEventStatus = isMatch 
        ? 'WATCHLIST_MATCH' 
        : readResult.status;

      const eventType = isMatch 
        ? 'VEHICLE_WATCHLIST_MATCH' 
        : 'LICENSE_PLATE_DETECTED';

      const eventId = `EVT-ANPR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const timestamp = new Date().toISOString();

      const anprEvent: StandardAnprEvent = {
        eventId,
        cameraId,
        edgeNodeId,
        timestamp,
        plate: normalized,
        plateConfidence: readResult.confidence,
        vehicleClass,
        direction,
        location,
        correlationId,
        sourceMode,
        status,
        eventType,
        metadata: {
          rawPlate,
          normalizedPlate: normalized,
          isWatchlistMatch: isMatch
        }
      };

      // Ingest into central repository (zero parallel database)
      const secPayload: SecurityEventPayload = {
        eventId,
        edgeNodeId,
        siteId: 'SITE-STATEWIDE',
        cameraId,
        timestamp,
        eventType,
        priority: isMatch ? 'critical' : 'medium',
        confidence: readResult.confidence,
        metadata: {
          plate: normalized,
          vehicleClass,
          direction,
          location,
          correlationId,
          isWatchlistMatch: isMatch
        }
      };
      centralRepo.createEvent(secPayload);

      // Record sighting in memory store for journey reconstruction
      if (normalized !== 'PLATE_UNKNOWN' && normalized !== 'PLATE_UNREADABLE') {
        const existingSightings = this.sightings.get(normalized) || [];
        existingSightings.push({
          sightingId: `SGT-${eventId}`,
          vehicleNumber: normalized,
          cameraId,
          siteId: 'SITE-STATEWIDE',
          timestamp,
          direction,
          plateConfidence: readResult.confidence,
          vehicleConfidence: 0.92,
          sourceEdgeNode: edgeNodeId,
          eventId
        });
        this.sightings.set(normalized, existingSightings);
      }

      // Query abstracted vehicle data provider
      const lookupRecord = await this.lookupVehicleData(normalized);

      this.eventsProcessedCount += 1;
      this.completedJobsCount += 1;
      const latency = Date.now() - start;
      this.totalLatencyMs += latency;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.recordHeartbeat();

      return {
        plate: rawPlate,
        normalizedPlate: normalized,
        plateConfidence: readResult.confidence,
        vehicleClass,
        status,
        isWatchlistMatch: isMatch,
        event: anprEvent,
        vehicleDataLookup: lookupRecord,
        disclaimer: 'ONE UNIFIED EVENT LAYER OVER AUTHORIZED CONNECTED CCTV — NO FABRICATED VEHICLE RECORDS'
      };
    } catch (err: any) {
      this.failedJobsCount += 1;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      throw err;
    }
  }

  /**
   * Reconstruct cross-camera vehicle journey using existing CentralEventStore
   * and recorded sightings.
   */
  public reconstructJourney(plate: string): VehicleJourney | null {
    return this.reconstructVehicleJourney(plate);
  }

  public reconstructVehicleJourney(plate: string): VehicleJourney | null {
    const normalized = normalizeLicensePlate(plate);
    if (!normalized) return null;

    // Search existing centralRepo events
    const centralEvents = centralRepo.getEventsByPlate(normalized);
    const inMemorySightings = this.sightings.get(normalized) || [];

    const combinedSightings: VehicleSighting[] = [...inMemorySightings];

    // Merge centralRepo events if not already present in combinedSightings
    for (const ce of centralEvents) {
      if (!combinedSightings.some(s => s.eventId === ce.eventId)) {
        combinedSightings.push({
          sightingId: `SGT-${ce.eventId}`,
          vehicleNumber: normalized,
          cameraId: ce.cameraId,
          siteId: ce.siteId || 'SITE-1',
          timestamp: ce.timestamp,
          direction: ce.metadata?.direction || 'Northbound',
          plateConfidence: ce.confidence,
          vehicleConfidence: 0.90,
          sourceEdgeNode: ce.edgeNodeId,
          eventId: ce.eventId
        });
      }
    }

    if (combinedSightings.length === 0) {
      return null;
    }

    // Sort chronologically
    combinedSightings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const firstSeen = combinedSightings[0].timestamp;
    const lastSeen = combinedSightings[combinedSightings.length - 1].timestamp;
    const durationMinutes = Math.max(
      1,
      Math.round((new Date(lastSeen).getTime() - new Date(firstSeen).getTime()) / 60000)
    );

    const camerasVisited = new Set(combinedSightings.map(s => s.cameraId)).size;

    return {
      vehicleNumber: normalized,
      sightings: combinedSightings,
      totalSightings: combinedSightings.length,
      firstSeen,
      lastSeen,
      camerasVisited,
      districtsVisited: 1,
      durationMinutes
    };
  }

  /**
   * God's Eye V2: Ingest, score, and archive a vehicle observation via the AI Agent Mesh.
   */
  public async processVehicleObservation(obsParams: Partial<VehicleObservation>): Promise<VehicleObservation> {
    this.activeJobsCount += 1;
    try {
      const observation = await godsEyeObservationService.recordObservation(obsParams);
      
      // Mirror to central event store
      centralRepo.createEvent({
        eventId: observation.eventId,
        edgeNodeId: observation.edgeNodeId,
        siteId: 'SITE-STATEWIDE',
        cameraId: observation.cameraId,
        timestamp: observation.timestamp,
        eventType: observation.plateStatus === 'PLATE_READ' ? 'ANPR' : 'VEHICLE_SIGHTING',
        priority: observation.watchlistMatch ? 'critical' : 'medium',
        confidence: observation.vehicleConfidence,
        metadata: {
          plate: observation.plateNormalized,
          vehicleClass: observation.vehicleClass,
          direction: observation.direction,
          speed: observation.speedEstimate,
          trackId: observation.trackId,
          isBestFrame: observation.isBestFrame,
          evidenceId: observation.evidenceReference
        }
      });

      this.eventsProcessedCount += 1;
      this.completedJobsCount += 1;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.recordHeartbeat();
      return observation;
    } catch (err) {
      this.failedJobsCount += 1;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      throw err;
    }
  }
}
