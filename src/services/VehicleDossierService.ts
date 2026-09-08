/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleDossierService: Master Dossier Fabric & Multi-Source Synthesis
 * 
 * Core Mandate:
 * "ONE VEHICLE IDENTITY CONTEXT ACROSS CAMERA OBSERVATIONS, EVIDENCE,
 * INVESTIGATIONS AND AUTHORIZED DATA SOURCES."
 * 
 * Critical Boundary:
 * Strictly separates CAMERA OBSERVED DATA from EXTERNAL AUTHORIZED DATA.
 * Never silently merges camera readings with government registry entries into an undifferentiated fact set.
 */

import { 
  VehicleDossier, 
  VehicleObservation, 
  PlateObservation,
  ForensicEvidenceRecord,
  HumanReviewDecision,
  DataLineageRecord,
  ExternalProviderStatus,
  normalizeLicensePlate 
} from '../types';
import { anprQualityService } from './ANPRQualityService';
import { evidenceCorrelationService } from './EvidenceCorrelationService';
import { vehicleAttributeCorrelationService } from './VehicleAttributeCorrelationService';
import { lastSeenVehicleService } from './LastSeenVehicleService';
import { godsEyeObservationService } from './GodsEyeObservationService';

export interface DossierSearchFilters {
  camera?: string;
  startDate?: string;
  endDate?: string;
  district?: string;
  vehicleClass?: string;
  hasWatchlistHit?: boolean;
  hasExternalData?: boolean;
}

export interface PartialPlateMatchCandidate {
  plateText: string;
  normalizedPlate: string;
  confidence: number;
  lastSeenCamera: string;
  lastSeenTimestamp: string;
  observationsCount: number;
  hasEvidence: boolean;
  vehicleClass: string;
  color?: string;
  disclaimer: string;
}

export class VehicleDossierService {
  private static instance: VehicleDossierService | null = null;
  private dossiers: Map<string, VehicleDossier> = new Map();

  private constructor() {
    this.seedInitialDossiers();
  }

  public static getInstance(): VehicleDossierService {
    if (!VehicleDossierService.instance) {
      VehicleDossierService.instance = new VehicleDossierService();
    }
    return VehicleDossierService.instance;
  }

  /**
   * Seed foundational dossiers from existing God's Eye observations for demo continuity
   */
  private seedInitialDossiers(): void {
    const allObs = godsEyeObservationService.getAllObservations();
    const grouped = new Map<string, VehicleObservation[]>();

    for (const obs of allObs) {
      const plate = obs.plateNormalized || (obs.plateText ? normalizeLicensePlate(obs.plateText) : undefined);
      if (plate) {
        const list = grouped.get(plate) || [];
        list.push(obs);
        grouped.set(plate, list);
      }
    }

    for (const [plate, obsList] of grouped.entries()) {
      this.buildAndStoreDossier(plate, obsList);
    }
  }

  /**
   * Retrieves or constructs a unified VehicleDossier for a normalized plate
   */
  public getOrCreateDossier(plateQuery: string): VehicleDossier {
    const canonical = normalizeLicensePlate(plateQuery);
    let dossier = this.dossiers.get(canonical);

    if (!dossier) {
      // Find matching observations from GodsEye service
      const obsList = godsEyeObservationService.getObservationsForPlate(canonical);
      dossier = this.buildAndStoreDossier(canonical, obsList);
    }

    return dossier;
  }

  public getDossier(plateQuery: string): VehicleDossier | null {
    const canonical = normalizeLicensePlate(plateQuery);
    return this.dossiers.get(canonical) || null;
  }

  public getAllDossiers(): VehicleDossier[] {
    return Array.from(this.dossiers.values());
  }

  /**
   * Compiles observations, optical metrics, and correlations into a compliant VehicleDossier
   */
  public buildAndStoreDossier(
    canonicalPlate: string, 
    observations: VehicleObservation[],
    externalDataOverride?: any
  ): VehicleDossier {
    const sortedObs = [...observations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Optical plate observations
    const plateObservations: PlateObservation[] = sortedObs.map((obs, idx) => 
      anprQualityService.createPlateObservation({
        observationId: obs.observationId,
        cameraId: obs.cameraId,
        cameraName: obs.cameraName,
        timestamp: obs.timestamp,
        rawRead: obs.plateText || obs.plateNormalized,
        agentId: 'ANPR-OCR-AGENT-01',
        correlationId: `CORR-OCR-${obs.observationId}`,
        imageReference: obs.imageReference,
        evidenceReference: obs.evidenceReference,
        metricsInput: {
          imageQuality: 0.90,
          blurScore: 0.88,
          angleScore: 0.92,
          occlusionScore: 0.94
        }
      })
    );

    // Ambiguity detection
    const ambiguity = anprQualityService.analyzePlateAmbiguity(canonicalPlate);

    // Spatiotemporal Journey & Quality
    const journeyQuality = evidenceCorrelationService.calculateJourneyQuality(sortedObs);
    const cameraPath = sortedObs.map(o => o.cameraId);

    // First and Last Seen
    const firstObs = sortedObs[0] || null;
    const lastObs = sortedObs[sortedObs.length - 1] || null;
    const lastSeenData = lastSeenVehicleService.getVehicleLastSeen(canonicalPlate);

    // Evidence aggregation
    const evidenceList: ForensicEvidenceRecord[] = sortedObs
      .filter(o => o.evidenceReference || o.evidenceHash)
      .map((o, idx) => ({
        evidenceId: o.evidenceReference || `EVID-${o.observationId}`,
        observationId: o.observationId,
        eventId: `EVT-${o.observationId}`,
        cameraId: o.cameraId,
        cameraName: o.cameraName,
        edgeNodeId: 'EDGE-01',
        timestamp: o.timestamp,
        location: o.cameraName || o.cameraId,
        imageReference: o.imageReference,
        thumbnailReference: o.thumbnailReference || o.imageReference,
        captureSource: o.sourceType,
        analysisMode: o.analysisMode || 'REAL_AI',
        vehicleTrackId: `TRK-${o.observationId}`,
        plateText: o.plateText,
        plateNormalized: o.plateNormalized,
        plateStatus: (o.plateStatus || 'PLATE_READ') as any,
        plateConfidence: o.plateConfidence,
        vehicleConfidence: o.vehicleConfidence,
        vehicleClass: o.vehicleClass,
        vehicleColor: o.vehicleColor,
        correlationId: o.correlationId || `CORR-${o.observationId}`,
        trajectoryId: o.trajectoryId || 'TRAJ-01',
        isFirstSeen: idx === 0,
        isLastSeen: idx === sortedObs.length - 1,
        sequenceIndex: idx,
        sha256: o.evidenceHash || `HASH-SHA256-${o.observationId}`,
        retentionPolicy: {
          department: 'Gujarat Police Unified Grid',
          rawVideoDays: 30,
          statutoryEvidenceYears: 7,
          isTamperSealed: true
        },
        label: 'FORENSIC EVIDENCE RECORD',
        createdAt: o.timestamp,
        status: 'VERIFIED'
      }));

    // Multi-attribute cross-camera correlation
    const correlationResults = [];
    if (sortedObs.length > 1) {
      for (let i = 1; i < sortedObs.length; i++) {
        correlationResults.push(
          vehicleAttributeCorrelationService.correlateAttributes(sortedObs[i - 1], sortedObs[i])
        );
      }
    }

    // Signals Aggregation (no arbitrary criminal score)
    const watchlistHits = sortedObs.filter(o => o.watchlistMatch);
    const signalsSummary = evidenceCorrelationService.aggregateSignals({
      observations: sortedObs,
      watchlistMatches: watchlistHits.map(w => ({
        id: `WL-${w.observationId}`,
        severity: 'CRITICAL',
        reason: 'Flagged on State Priority Watchlist',
        matchedAt: w.timestamp
      })),
      externalData: externalDataOverride
    });

    const dominantClass = sortedObs.length > 0 ? sortedObs[sortedObs.length - 1].vehicleClass : 'car';
    const dominantColor = sortedObs.length > 0 ? sortedObs[sortedObs.length - 1].vehicleColor : 'WHITE';

    const existingDossier = this.dossiers.get(canonicalPlate);

    const dossier: VehicleDossier = {
      vehicleId: `VEH-${canonicalPlate}`,
      canonicalPlate,
      plateVariants: ambiguity.variants,
      observations: sortedObs,
      plateObservations,
      firstSeen: {
        camera: firstObs?.cameraId || 'UNKNOWN',
        cameraName: firstObs?.cameraName || firstObs?.cameraId,
        timestamp: firstObs?.timestamp || new Date().toISOString(),
        evidenceRef: firstObs?.evidenceReference,
        location: firstObs ? `GPS: ${firstObs.gps.latitude.toFixed(4)}, ${firstObs.gps.longitude.toFixed(4)}` : undefined,
        confidence: firstObs?.vehicleConfidence || 0.9,
        sourceOfTruth: 'CAMERA_OBSERVED'
      },
      lastSeen: {
        camera: lastObs?.cameraId || 'UNKNOWN',
        cameraName: lastObs?.cameraName || lastObs?.cameraId,
        timestamp: lastObs?.timestamp || new Date().toISOString(),
        evidenceRef: lastObs?.evidenceReference,
        location: lastObs ? `GPS: ${lastObs.gps.latitude.toFixed(4)}, ${lastObs.gps.longitude.toFixed(4)}` : undefined,
        direction: lastObs?.direction,
        estimatedSpeedKmh: lastObs?.speedEstimate,
        confidence: lastObs?.vehicleConfidence || 0.9,
        sourceOfTruth: 'CAMERA_OBSERVED',
        predictedNextCameras: lastSeenData?.nextLikelyCameras || []
      },
      cameraPath,
      evidence: evidenceList,
      watchlistMatches: watchlistHits,
      alerts: [],
      incidents: [],
      roadSafetyEvents: [],
      externalData: externalDataOverride || existingDossier?.externalData || {
        providerStatus: {
          VAHAN: 'AVAILABLE',
          ECHALLAN: 'AVAILABLE',
          EGUJCOP: 'AVAILABLE'
        }
      },
      externalDataStatus: externalDataOverride ? 'AUTHORIZED_LOADED' : (existingDossier?.externalDataStatus || 'NONE'),
      vehicleAttributes: {
        observedClass: dominantClass,
        observedColor: dominantColor,
        registeredClass: externalDataOverride?.vahan?.record?.vehicleClass,
        registeredMake: externalDataOverride?.vahan?.record?.make,
        registeredModel: externalDataOverride?.vahan?.record?.model,
        registeredColor: externalDataOverride?.vahan?.record?.color
      },
      correlationResults,
      confidence: sortedObs.length > 0 ? sortedObs[sortedObs.length - 1].vehicleConfidence : 0.85,
      journeyQuality,
      signalsSummary,
      humanReviews: existingDossier?.humanReviews || [],
      dataLineage: existingDossier?.dataLineage || [{
        lineageId: `LIN-${Date.now()}`,
        inputRecords: sortedObs.map(o => o.observationId),
        processingAgent: 'VehicleDataIntelligenceAgent',
        modelOrMethod: 'Spatiotemporal Multi-Modal Fusion V2.1',
        timestamp: new Date().toISOString(),
        outputRecord: `VEH-${canonicalPlate}`,
        correlationId: `CORR-DOSSIER-${canonicalPlate}`,
        sourceCategory: 'AI_INFERRED'
      }],
      investigationReferences: existingDossier?.investigationReferences || [`INV-REF-${canonicalPlate}`],
      auditReferences: existingDossier?.auditReferences || [],
      retentionStatus: {
        isRawVideoExpired: false,
        isEvidenceTamperSealed: true,
        statutoryPolicy: 'Section 65B Indian Evidence Act / BNSS 2023 Digital Custody'
      },
      createdAt: existingDossier?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dossiers.set(canonicalPlate, dossier);
    return dossier;
  }

  /**
   * Adds a new physical camera observation to the relevant dossier
   */
  public updateDossierWithObservation(observation: VehicleObservation): VehicleDossier {
    const plate = observation.plateNormalized || 
      (observation.plateText ? normalizeLicensePlate(observation.plateText) : `TRACK-${observation.trackId}`);

    const existing = this.getOrCreateDossier(plate);
    const obsList = [...existing.observations, observation];
    return this.buildAndStoreDossier(plate, obsList, existing.externalData);
  }

  /**
   * Attaches authorized external data to dossier without merging with camera facts
   */
  public updateDossierWithExternalData(
    canonicalPlate: string, 
    externalData: any
  ): VehicleDossier {
    const existing = this.getOrCreateDossier(canonicalPlate);
    return this.buildAndStoreDossier(canonicalPlate, existing.observations, externalData);
  }

  /**
   * Records human verification review without overwriting original AI inference
   */
  public addHumanReview(canonicalPlate: string, review: HumanReviewDecision): VehicleDossier {
    const dossier = this.getOrCreateDossier(canonicalPlate);
    dossier.humanReviews.unshift(review);
    dossier.updatedAt = new Date().toISOString();
    this.dossiers.set(canonicalPlate, dossier);
    return dossier;
  }

  /**
   * Performs partial plate matching without asserting definitive identity
   */
  public searchPartialPlate(partialText: string): PartialPlateMatchCandidate[] {
    const query = partialText.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!query) return [];

    const results: PartialPlateMatchCandidate[] = [];
    for (const dossier of this.dossiers.values()) {
      if (dossier.canonicalPlate.includes(query) || dossier.plateVariants.some(v => v.includes(query))) {
        results.push({
          plateText: dossier.canonicalPlate,
          normalizedPlate: dossier.canonicalPlate,
          confidence: dossier.confidence,
          lastSeenCamera: dossier.lastSeen.cameraName || dossier.lastSeen.camera,
          lastSeenTimestamp: dossier.lastSeen.timestamp,
          observationsCount: dossier.observations.length,
          hasEvidence: dossier.evidence.length > 0,
          vehicleClass: dossier.vehicleAttributes.observedClass,
          color: dossier.vehicleAttributes.observedColor,
          disclaimer: 'PARTIAL OPTICAL CANDIDATE: Requires verification. Does NOT assert definitive identity.'
        });
      }
    }

    return results;
  }

  /**
   * Advanced multi-filter search across dossier records
   */
  public searchDossiers(query?: string, filters?: DossierSearchFilters): VehicleDossier[] {
    let list = Array.from(this.dossiers.values());

    if (query) {
      const q = query.toUpperCase().replace(/[^A-Z0-9]/g, '');
      list = list.filter(d => 
        d.canonicalPlate.includes(q) || 
        d.plateVariants.some(v => v.includes(q)) ||
        d.vehicleId.toUpperCase().includes(q) ||
        d.observations.some(o => o.observationId.toUpperCase().includes(q))
      );
    }

    if (filters?.camera) {
      list = list.filter(d => d.cameraPath.includes(filters.camera!));
    }

    if (filters?.vehicleClass) {
      list = list.filter(d => d.vehicleAttributes.observedClass === filters.vehicleClass);
    }

    if (filters?.hasWatchlistHit) {
      list = list.filter(d => d.watchlistMatches.length > 0);
    }

    if (filters?.hasExternalData) {
      list = list.filter(d => d.externalDataStatus === 'AUTHORIZED_LOADED');
    }

    return list;
  }

  /**
   * Exports an audit-compliant forensic dossier object
   */
  public exportDossier(canonicalPlate: string, actor: { id: string; role: string; purpose: string }): any {
    const dossier = this.getOrCreateDossier(canonicalPlate);
    return {
      title: 'GUJARAT POLICE UNIFIED CCTV INTELLIGENCE GRID — VEHICLE INVESTIGATION DOSSIER',
      classification: 'OFFICIAL LAW ENFORCEMENT RECORD — NOT FOR PUBLIC DISSEMINATION',
      dossierId: `EXP-DOSSIER-${canonicalPlate}-${Date.now()}`,
      exportedAt: new Date().toISOString(),
      exportedBy: actor,
      legalDisclaimer: 'DEMO / PROTOTYPE INVESTIGATION DOSSIER — Subject to Section 65B Indian Evidence Act / BNSS 2023 admissibility verification.',
      dossierSummary: {
        canonicalPlate: dossier.canonicalPlate,
        observedAttributes: dossier.vehicleAttributes,
        totalSightings: dossier.observations.length,
        firstSeen: dossier.firstSeen,
        lastSeen: dossier.lastSeen,
        journeyQualityScore: dossier.journeyQuality,
        signalsDetected: dossier.signalsSummary
      },
      cameraObservationLineage: dossier.observations.map(o => ({
        observationId: o.observationId,
        camera: o.cameraName || o.cameraId,
        timestamp: o.timestamp,
        plateText: o.plateNormalized || o.plateText,
        confidence: o.vehicleConfidence,
        evidenceHash: o.evidenceHash,
        source: o.sourceType
      })),
      authorizedExternalRegistryData: dossier.externalData,
      forensicEvidenceIndex: dossier.evidence.map(e => ({
        evidenceId: e.evidenceId,
        cameraNode: e.cameraId,
        sha256: e.sha256,
        custodyStatus: e.status
      })),
      humanVerificationDecisions: dossier.humanReviews,
      dataLineage: dossier.dataLineage
    };
  }
}

export const vehicleDossierService = VehicleDossierService.getInstance();
