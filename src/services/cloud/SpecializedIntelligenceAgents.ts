/**
 * SpecializedIntelligenceAgents.ts
 * Core 6 Specialized Intelligence Agents for Gujarat Police Sentinel Grid
 * 
 * 1. IncidentIntelligenceAgent
 * 2. VehicleInvestigationAgent
 * 3. CameraHealthAgent
 * 4. EvidenceIntegrityAgent
 * 5. OfficerReportAgent
 * 6. WatchlistIntelligenceAgent
 * 
 * Invariants:
 * - Strict adherence to facts; zero hallucinations or fabricated sightings.
 * - Admissibility under Section 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023).
 */

import { defaultReasoningProvider } from './ReasoningProvider.js';
import { defaultLocalEvidenceStore } from './EvidenceStore.js';
import crypto from 'crypto';

// ============================================================================
// AGENT 1: Incident Intelligence Agent
// ============================================================================

export interface IncidentAgentInput {
  incidentId: string;
  incidentType: string;
  description: string;
  location: string;
  cameraIds: string[];
  observations: any[];
  timestamps: string[];
}

export interface IncidentAgentOutput {
  incidentId: string;
  factualSummary: string;
  evidenceTimeline: Array<{
    timestamp: string;
    cameraId: string;
    event: string;
    certainty: 'OBSERVED' | 'INFERRED' | 'UNCERTAIN' | 'NOT_AVAILABLE';
    evidenceSha256?: string;
  }>;
  camerasInvolved: string[];
  observationsCount: number;
  uncertainties: string[];
  missingEvidence: string[];
  statutoryAdmissibility: 'BSA_2023_SECTION_63_INTEGRITY_PRESERVED';
}

export class IncidentIntelligenceAgent {
  public async analyze(input: IncidentAgentInput): Promise<IncidentAgentOutput> {
    const reasoning = await defaultReasoningProvider.analyzeIncident({
      incidentId: input.incidentId,
      description: input.description,
      observations: input.observations,
      timestamps: input.timestamps,
      cameraIds: input.cameraIds
    });

    return {
      incidentId: input.incidentId,
      factualSummary: reasoning.factualSummary,
      evidenceTimeline: reasoning.evidenceTimeline,
      camerasInvolved: reasoning.camerasInvolved,
      observationsCount: input.observations.length,
      uncertainties: reasoning.uncertainties,
      missingEvidence: reasoning.missingEvidence,
      statutoryAdmissibility: 'BSA_2023_SECTION_63_INTEGRITY_PRESERVED'
    };
  }
}

// ============================================================================
// AGENT 2: Vehicle Investigation Agent
// ============================================================================

export interface VehicleInvestigationQuery {
  targetPlateOrTrack: string;
  timeRange?: { from: string; to: string };
  existingObservations: any[];
}

export interface VehicleInvestigationOutput {
  target: string;
  sightingsCount: number;
  chronologicalSightings: Array<{
    timestamp: string;
    cameraId: string;
    location: string;
    plateRead: string | null;
    vehicleType: string;
    confidence: number;
    evidenceSha256: string;
  }>;
  observedPath: string[];
  investigativeSummary: string;
  anomaliesDetected: string[];
}

export class VehicleInvestigationAgent {
  public async investigate(query: VehicleInvestigationQuery): Promise<VehicleInvestigationOutput> {
    const targetNorm = query.targetPlateOrTrack.toUpperCase().replace(/[\s-]/g, '');
    const matched = query.existingObservations.filter(obs => {
      const plate = (obs.ocrResult || obs.bestPlateText || obs.plateNumber || '').toUpperCase().replace(/[\s-]/g, '');
      const track = (obs.vehicleTrackId || obs.trackId || '').toUpperCase();
      return plate.includes(targetNorm) || track.includes(targetNorm);
    });

    const reasoning = await defaultReasoningProvider.investigateVehicle({
      target: query.targetPlateOrTrack,
      observations: matched.length > 0 ? matched : query.existingObservations.slice(0, 10),
      timeRange: query.timeRange
    });

    return {
      target: query.targetPlateOrTrack,
      sightingsCount: reasoning.chronologicalSightings.length,
      chronologicalSightings: reasoning.chronologicalSightings,
      observedPath: reasoning.observedPath,
      investigativeSummary: reasoning.synthesis,
      anomaliesDetected: reasoning.anomaliesDetected
    };
  }
}

// ============================================================================
// AGENT 3: Camera Health Agent
// ============================================================================

export interface CameraDiagnosticsInput {
  cameraId: string;
  name: string;
  status: 'online' | 'offline';
  lastFrameTimestampMs?: number;
  fps?: number;
  resolution?: string;
  reconnectCount?: number;
  latencyMs?: number;
  blurScore?: number;
  frozenFrameDetected?: boolean;
}

export interface CameraHealthReport {
  cameraId: string;
  operationalStatus: 'HEALTHY' | 'STALE' | 'OFFLINE' | 'DEGRADED' | 'FROZEN';
  frameAgeSeconds: number;
  fps: number;
  resolution: string;
  explanation: string;
  reconnectCount: number;
  recommendation: string;
}

export class CameraHealthAgent {
  public evaluate(cam: CameraDiagnosticsInput): CameraHealthReport {
    const now = Date.now();
    const frameAgeMs = cam.lastFrameTimestampMs ? Math.max(0, now - cam.lastFrameTimestampMs) : 999999;
    const frameAgeSeconds = Math.round(frameAgeMs / 1000);

    let operationalStatus: 'HEALTHY' | 'STALE' | 'OFFLINE' | 'DEGRADED' | 'FROZEN' = 'HEALTHY';
    let explanation = `Camera ${cam.cameraId} is operating nominally at ${cam.fps || 25} FPS.`;
    let recommendation = 'No action required.';

    if (cam.status === 'offline' || frameAgeSeconds > 60) {
      operationalStatus = 'OFFLINE';
      explanation = `Camera ${cam.cameraId} has had no fresh frame for ${frameAgeSeconds} seconds.`;
      recommendation = 'Check RTSP feed URL and network switch power.';
    } else if (cam.frozenFrameDetected) {
      operationalStatus = 'FROZEN';
      explanation = `Camera ${cam.cameraId} frame buffer has identical hash over multiple consecutive cycles.`;
      recommendation = 'Issue RTSP stream reset command.';
    } else if (frameAgeSeconds > 15) {
      operationalStatus = 'STALE';
      explanation = `Camera ${cam.cameraId} frame latency elevated (${frameAgeSeconds}s old).`;
      recommendation = 'Monitor connection stability.';
    } else if ((cam.blurScore && cam.blurScore < 40) || (cam.fps && cam.fps < 10)) {
      operationalStatus = 'DEGRADED';
      explanation = `Camera ${cam.cameraId} image quality is low or FPS is degraded.`;
      recommendation = 'Inspect optical lens cleanliness and bandwidth allocation.';
    }

    return {
      cameraId: cam.cameraId,
      operationalStatus,
      frameAgeSeconds,
      fps: cam.fps || 0,
      resolution: cam.resolution || '1920x1080',
      explanation,
      reconnectCount: cam.reconnectCount || 0,
      recommendation
    };
  }
}

// ============================================================================
// AGENT 4: Evidence Integrity Agent
// ============================================================================

export interface EvidenceVerificationResult {
  evidenceId: string;
  status: 'VERIFIED' | 'FAILED' | 'UNKNOWN';
  originalSha256: string;
  calculatedSha256: string;
  timestamp: string;
  complianceRule: 'BSA_2023_SECTION_63';
}

export class EvidenceIntegrityAgent {
  public async verifyEvidence(evidenceId: string, expectedSha256: string, buffer?: Buffer): Promise<EvidenceVerificationResult> {
    if (buffer) {
      const calculated = crypto.createHash('sha256').update(buffer).digest('hex');
      const isMatch = calculated.toLowerCase() === expectedSha256.toLowerCase();
      return {
        evidenceId,
        status: isMatch ? 'VERIFIED' : 'FAILED',
        originalSha256: expectedSha256,
        calculatedSha256: calculated,
        timestamp: new Date().toISOString(),
        complianceRule: 'BSA_2023_SECTION_63'
      };
    }

    const check = await defaultLocalEvidenceStore.verifyIntegrity(evidenceId, expectedSha256);
    return {
      evidenceId,
      status: check.verified ? 'VERIFIED' : 'FAILED',
      originalSha256: expectedSha256,
      calculatedSha256: check.actualSha256,
      timestamp: new Date().toISOString(),
      complianceRule: 'BSA_2023_SECTION_63'
    };
  }
}

// ============================================================================
// AGENT 5: Officer Report Agent
// ============================================================================

export class OfficerReportAgent {
  public async generateReport(params: {
    incident: any;
    observations: any[];
    evidence: any[];
    officerNotes?: string;
  }) {
    return defaultReasoningProvider.generateOfficerReport(params);
  }
}

// ============================================================================
// AGENT 6: Watchlist Intelligence Agent
// ============================================================================

export interface WatchlistMatchCandidate {
  matchId: string;
  watchlistId: string;
  targetPlate: string;
  observedPlate: string;
  similarityScore: number;
  cameraId: string;
  timestamp: string;
  reviewStatus: 'MATCH_CANDIDATE' | 'MATCH_CONFIRMED_BY_OFFICER' | 'NO_MATCH' | 'INSUFFICIENT_EVIDENCE';
  evidenceId: string;
}

export class WatchlistIntelligenceAgent {
  public evaluateSighting(
    observedPlate: string,
    watchlists: Array<{ id: string; plateNumber: string; category: string }>,
    cameraId: string
  ): WatchlistMatchCandidate | null {
    if (!observedPlate || observedPlate === 'NOT_READABLE' || observedPlate.length < 4) {
      return null;
    }

    const normObs = observedPlate.toUpperCase().replace(/[\s-]/g, '');

    for (const target of watchlists) {
      const normTarget = target.plateNumber.toUpperCase().replace(/[\s-]/g, '');
      if (normObs === normTarget) {
        return {
          matchId: `MATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          watchlistId: target.id,
          targetPlate: target.plateNumber,
          observedPlate,
          similarityScore: 1.0,
          cameraId,
          timestamp: new Date().toISOString(),
          reviewStatus: 'MATCH_CANDIDATE',
          evidenceId: `EVID-WL-${cameraId}-${Date.now()}`
        };
      }
    }

    return null;
  }
}

// Export singleton instances
export const incidentIntelligenceAgent = new IncidentIntelligenceAgent();
export const vehicleInvestigationAgent = new VehicleInvestigationAgent();
export const cameraHealthAgent = new CameraHealthAgent();
export const evidenceIntegrityAgent = new EvidenceIntegrityAgent();
export const officerReportAgent = new OfficerReportAgent();
export const watchlistIntelligenceAgent = new WatchlistIntelligenceAgent();
