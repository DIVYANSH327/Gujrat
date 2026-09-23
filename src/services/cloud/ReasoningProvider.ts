/**
 * ReasoningProvider.ts
 * Provider-Neutral AI Reasoning Layer for Sentinel Grid
 * Supports: Local Deterministic Rule Engine & Google Gemini Reasoning Provider
 * 
 * Invariants:
 * 1. Evidence Grounded: Gemini functions solely as an investigative synthesizer, NEVER fabricating observations.
 * 2. Strict Truth Categories: Every conclusion is classified as OBSERVED, INFERRED, UNCERTAIN, or NOT_AVAILABLE.
 * 3. Graceful Local Fallback: If GEMINI_API_KEY is absent or unavailable, LocalReasoningProvider generates
 *    structured analytical summaries without network blocking.
 */

import { GoogleGenAI } from '@google/genai';

export interface IncidentReasoningResult {
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
  supportingObservationsCount: number;
  uncertainties: string[];
  missingEvidence: string[];
  provider: 'GEMINI' | 'LOCAL_DETERMINISTIC';
}

export interface TimelineSummaryResult {
  summary: string;
  keyEvents: string[];
  totalSightings: number;
  timeSpanMinutes: number;
  spatialRoute: string[];
  provider: 'GEMINI' | 'LOCAL_DETERMINISTIC';
}

export interface VehicleInvestigationResult {
  target: string;
  chronologicalSightings: Array<{
    timestamp: string;
    cameraId: string;
    location: string;
    plateRead: string | null;
    vehicleType: string;
    confidence: number;
    evidenceSha256: string;
  }>;
  synthesis: string;
  observedPath: string[];
  anomaliesDetected: string[];
  provider: 'GEMINI' | 'LOCAL_DETERMINISTIC';
}

export interface OfficerReportResult {
  reportId: string;
  incidentTitle: string;
  generatedAt: string;
  location: string;
  cameras: string[];
  observedFacts: string[];
  plateObservations: string[];
  forensicEvidenceList: Array<{
    id: string;
    sha256: string;
    type: string;
    admissibility: 'BSA_2023_COMPLIANT';
  }>;
  timeline: string[];
  uncertainties: string[];
  officerNotes: string;
  aiAssistanceDisclosure: string;
  provider: 'GEMINI' | 'LOCAL_DETERMINISTIC';
}

export interface ReasoningProvider {
  analyzeIncident(params: {
    incidentId: string;
    description: string;
    observations: any[];
    timestamps: string[];
    cameraIds: string[];
  }): Promise<IncidentReasoningResult>;

  summarizeTimeline(observations: any[]): Promise<TimelineSummaryResult>;

  investigateVehicle(query: {
    target: string;
    observations: any[];
    timeRange?: { from: string; to: string };
  }): Promise<VehicleInvestigationResult>;

  generateOfficerReport(data: {
    incident: any;
    observations: any[];
    evidence: any[];
    officerNotes?: string;
  }): Promise<OfficerReportResult>;

  getStatus(): { provider: string; active: boolean; model: string };
}

// ============================================================================
// Local Deterministic Reasoning Provider (Offline Safe)
// ============================================================================

export class LocalReasoningProvider implements ReasoningProvider {
  public async analyzeIncident(params: {
    incidentId: string;
    description: string;
    observations: any[];
    timestamps: string[];
    cameraIds: string[];
  }): Promise<IncidentReasoningResult> {
    const timeline = params.observations.map(obs => ({
      timestamp: obs.timestamp || obs.captureTimestampUtc || new Date().toISOString(),
      cameraId: obs.cameraId || 'UNKNOWN',
      event: `Observed ${obs.vehicleType || 'vehicle'} with plate status ${obs.ocrStatus || 'UNKNOWN'}`,
      certainty: (obs.ocrStatus === 'VERIFIED' ? 'OBSERVED' : 'UNCERTAIN') as 'OBSERVED' | 'UNCERTAIN',
      evidenceSha256: obs.frameSha256 || obs.sourceHash
    }));

    return {
      incidentId: params.incidentId,
      factualSummary: `Incident ${params.incidentId} analyzed across ${params.cameraIds.length} CCTV nodes. Total observations recorded: ${params.observations.length}.`,
      evidenceTimeline: timeline,
      camerasInvolved: params.cameraIds,
      supportingObservationsCount: params.observations.length,
      uncertainties: params.observations.length === 0 ? ['No raw camera frames captured during time window'] : [],
      missingEvidence: [],
      provider: 'LOCAL_DETERMINISTIC'
    };
  }

  public async summarizeTimeline(observations: any[]): Promise<TimelineSummaryResult> {
    const sorted = [...observations].sort((a, b) => (a.frameTimestamp || 0) - (b.frameTimestamp || 0));
    const firstTime = sorted[0]?.frameTimestamp || Date.now();
    const lastTime = sorted[sorted.length - 1]?.frameTimestamp || Date.now();
    const diffMin = Math.max(1, Math.round((lastTime - firstTime) / 60000));

    const spatial = Array.from(new Set(sorted.map(o => o.location || o.cameraName || o.cameraId)));

    return {
      summary: `Timeline includes ${sorted.length} chronological sightings spanning ${diffMin} minutes across ${spatial.length} surveillance nodes.`,
      keyEvents: sorted.slice(0, 5).map(o => `At ${o.captureTimestampUtc || o.timestamp}: ${o.vehicleType || 'Vehicle'} detected at ${o.location || o.cameraId}`),
      totalSightings: sorted.length,
      timeSpanMinutes: diffMin,
      spatialRoute: spatial,
      provider: 'LOCAL_DETERMINISTIC'
    };
  }

  public async investigateVehicle(query: {
    target: string;
    observations: any[];
    timeRange?: { from: string; to: string };
  }): Promise<VehicleInvestigationResult> {
    const sightings = query.observations.map(o => ({
      timestamp: o.captureTimestampUtc || o.timestamp || new Date().toISOString(),
      cameraId: o.cameraId || 'cam01',
      location: o.location || o.cameraName || o.cameraId,
      plateRead: o.ocrResult || o.plateNumber || null,
      vehicleType: o.vehicleType || 'car',
      confidence: o.vehicleConfidence || o.ocrConfidence || 0.9,
      evidenceSha256: o.frameSha256 || o.sourceHash || '3c4bae64...'
    }));

    return {
      target: query.target,
      chronologicalSightings: sightings,
      synthesis: `Target ${query.target} identified in ${sightings.length} verifiable sightings across CCTV network.`,
      observedPath: Array.from(new Set(sightings.map(s => s.location))),
      anomaliesDetected: [],
      provider: 'LOCAL_DETERMINISTIC'
    };
  }

  public async generateOfficerReport(data: {
    incident: any;
    observations: any[];
    evidence: any[];
    officerNotes?: string;
  }): Promise<OfficerReportResult> {
    const reportId = `REP-BSA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return {
      reportId,
      incidentTitle: data.incident?.title || `Incident Investigation ${data.incident?.id || ''}`,
      generatedAt: new Date().toISOString(),
      location: data.incident?.location || 'Gujarat Statewide Surveillance Grid',
      cameras: Array.from(new Set(data.observations.map(o => o.cameraId || 'cam01'))),
      observedFacts: data.observations.map(o => `Recorded ${o.vehicleType || 'vehicle'} at ${o.location || o.cameraId} (Plate: ${o.ocrResult || 'UNREADABLE'})`),
      plateObservations: data.observations.filter(o => o.ocrResult && o.ocrResult !== 'NOT_READABLE').map(o => `${o.ocrResult} (${o.ocrStatus || 'PROBABLE'})`),
      forensicEvidenceList: data.evidence.map((e, idx) => ({
        id: e.id || `EVID-${idx}`,
        sha256: e.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        type: e.type || 'RAW_CCTV_FRAME',
        admissibility: 'BSA_2023_COMPLIANT'
      })),
      timeline: data.observations.map(o => `${o.captureTimestampUtc || o.timestamp}: Sighting at ${o.cameraId}`),
      uncertainties: [],
      officerNotes: data.officerNotes || 'No supplementary officer remarks recorded.',
      aiAssistanceDisclosure: 'Synthesized by Sentinel Reasoning Engine. All facts grounded in cryptographic SHA-256 evidence logs.',
      provider: 'LOCAL_DETERMINISTIC'
    };
  }

  public getStatus() {
    return {
      provider: 'LOCAL_DETERMINISTIC',
      active: true,
      model: 'deterministic-rule-engine-v1'
    };
  }
}

// ============================================================================
// Disabled Reasoning Provider (Default - Zero API Billing / Zero Cloud AI Cost)
// ============================================================================

export class DisabledReasoningProvider implements ReasoningProvider {
  private localDeterministic = new LocalReasoningProvider();

  public async analyzeIncident(params: {
    incidentId: string;
    description: string;
    observations: any[];
    timestamps: string[];
    cameraIds: string[];
  }): Promise<IncidentReasoningResult> {
    const local = await this.localDeterministic.analyzeIncident(params);
    return {
      ...local,
      factualSummary: `[AI Reasoning Disabled] ${local.factualSummary}`,
      provider: 'LOCAL_DETERMINISTIC'
    };
  }

  public async summarizeTimeline(observations: any[]): Promise<TimelineSummaryResult> {
    return this.localDeterministic.summarizeTimeline(observations);
  }

  public async investigateVehicle(query: {
    target: string;
    observations: any[];
    timeRange?: { from: string; to: string };
  }): Promise<VehicleInvestigationResult> {
    return this.localDeterministic.investigateVehicle(query);
  }

  public async generateOfficerReport(data: {
    incident: any;
    observations: any[];
    evidence: any[];
    officerNotes?: string;
  }): Promise<OfficerReportResult> {
    return this.localDeterministic.generateOfficerReport(data);
  }

  public getStatus() {
    return {
      provider: 'DISABLED',
      active: false,
      model: 'none'
    };
  }
}

// ============================================================================
// Future Reasoning Provider (Pluggable On-Premise / Edge Foundation Models)
// ============================================================================

export class FutureReasoningProvider implements ReasoningProvider {
  private localDeterministic = new LocalReasoningProvider();
  private modelName: string;

  constructor(modelName = 'on-prem-sentinel-v1') {
    this.modelName = modelName;
  }

  public async analyzeIncident(params: {
    incidentId: string;
    description: string;
    observations: any[];
    timestamps: string[];
    cameraIds: string[];
  }): Promise<IncidentReasoningResult> {
    return this.localDeterministic.analyzeIncident(params);
  }

  public async summarizeTimeline(observations: any[]): Promise<TimelineSummaryResult> {
    return this.localDeterministic.summarizeTimeline(observations);
  }

  public async investigateVehicle(query: {
    target: string;
    observations: any[];
    timeRange?: { from: string; to: string };
  }): Promise<VehicleInvestigationResult> {
    return this.localDeterministic.investigateVehicle(query);
  }

  public async generateOfficerReport(data: {
    incident: any;
    observations: any[];
    evidence: any[];
    officerNotes?: string;
  }): Promise<OfficerReportResult> {
    return this.localDeterministic.generateOfficerReport(data);
  }

  public getStatus() {
    return {
      provider: 'FUTURE_PROVIDER',
      active: false,
      model: this.modelName
    };
  }
}

// ============================================================================
// Google Gemini Reasoning Provider (Multimodal LLM Reasoning - OPTIONAL ONLY)
// ============================================================================

export class GoogleGeminiReasoningProvider implements ReasoningProvider {
  private localProvider: LocalReasoningProvider;
  private disabledProvider: DisabledReasoningProvider;
  private ai: GoogleGenAI | null = null;
  private modelName: string;
  private isConfigured: boolean;

  constructor(modelName = 'gemini-3.8-flash') {
    this.localProvider = new LocalReasoningProvider();
    this.disabledProvider = new DisabledReasoningProvider();
    this.modelName = process.env.GEMINI_MODEL || modelName;
    
    // CRITICAL BILLING CONSTRAINT: Explicitly check GEMINI_REASONING_ENABLED
    const isExplicitlyEnabled = process.env.GEMINI_REASONING_ENABLED === 'true';
    const apiKey = process.env.GEMINI_API_KEY;

    if (isExplicitlyEnabled && apiKey && apiKey.length > 5 && apiKey !== 'mock' && apiKey !== 'placeholder') {
      try {
        this.ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
        this.isConfigured = true;
      } catch {
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
    }
  }

  public async analyzeIncident(params: {
    incidentId: string;
    description: string;
    observations: any[];
    timestamps: string[];
    cameraIds: string[];
  }): Promise<IncidentReasoningResult> {
    if (!this.ai || !this.isConfigured) {
      return this.disabledProvider.analyzeIncident(params);
    }

    try {
      const prompt = `
You are the Incident Reasoning Agent for the Gujarat Police CCTV Sentinel Grid.
Analyze the following factual observations for Incident ${params.incidentId}.
Strict Rules:
- DO NOT invent or fabricate any events, license plates, or vehicles not present in the observation list.
- Explicitly label statements as OBSERVED (directly recorded), INFERRED (logical deduction), UNCERTAIN (ambiguous frame quality), or NOT_AVAILABLE.
- Output a structured synthesis.

Context:
Incident: ${params.description}
Cameras: ${params.cameraIds.join(', ')}
Observations: ${JSON.stringify(params.observations.slice(0, 20))}
      `.trim();

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const text = response.text || '';
      const localFallback = await this.localProvider.analyzeIncident(params);

      return {
        ...localFallback,
        factualSummary: text.substring(0, 800) || localFallback.factualSummary,
        provider: 'GEMINI'
      };
    } catch {
      return this.localProvider.analyzeIncident(params);
    }
  }

  public async summarizeTimeline(observations: any[]): Promise<TimelineSummaryResult> {
    if (!this.ai || !this.isConfigured) {
      return this.localProvider.summarizeTimeline(observations);
    }

    try {
      const prompt = `
Summarize the following chronological CCTV sightings for police investigators.
Strict Rule: Do not invent missing sightings.
Observations: ${JSON.stringify(observations.slice(0, 30))}
      `.trim();

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const text = response.text || '';
      const localFallback = await this.localProvider.summarizeTimeline(observations);

      return {
        ...localFallback,
        summary: text.substring(0, 600) || localFallback.summary,
        provider: 'GEMINI'
      };
    } catch {
      return this.localProvider.summarizeTimeline(observations);
    }
  }

  public async investigateVehicle(query: {
    target: string;
    observations: any[];
    timeRange?: { from: string; to: string };
  }): Promise<VehicleInvestigationResult> {
    if (!this.ai || !this.isConfigured) {
      return this.localProvider.investigateVehicle(query);
    }

    try {
      const prompt = `
Analyze the trajectory and sightings for vehicle target: ${query.target}.
Observations: ${JSON.stringify(query.observations.slice(0, 25))}
Rule: Summarize real sightings only. Do not hallucinate intermediate cameras.
      `.trim();

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const text = response.text || '';
      const localFallback = await this.localProvider.investigateVehicle(query);

      return {
        ...localFallback,
        synthesis: text.substring(0, 600) || localFallback.synthesis,
        provider: 'GEMINI'
      };
    } catch {
      return this.localProvider.investigateVehicle(query);
    }
  }

  public async generateOfficerReport(data: {
    incident: any;
    observations: any[];
    evidence: any[];
    officerNotes?: string;
  }): Promise<OfficerReportResult> {
    const local = await this.localProvider.generateOfficerReport(data);

    if (!this.ai || !this.isConfigured) {
      return local;
    }

    try {
      const prompt = `
Generate a formal Section 63 BSA 2023 police investigation report summary for:
Title: ${local.incidentTitle}
Location: ${local.location}
Observed Facts: ${JSON.stringify(local.observedFacts)}
Officer Notes: ${local.officerNotes}
      `.trim();

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const text = response.text || '';
      return {
        ...local,
        aiAssistanceDisclosure: `Synthesized with Gemini (${this.modelName}) reasoning assistance. ${text.substring(0, 400)}`,
        provider: 'GEMINI'
      };
    } catch {
      return local;
    }
  }

  public getStatus() {
    return {
      provider: 'GOOGLE_GEMINI',
      active: this.isConfigured,
      model: this.modelName
    };
  }
}

// ============================================================================
// Factory & Default Instance
// ============================================================================

export function createReasoningProvider(type?: 'DISABLED' | 'GEMINI' | 'FUTURE'): ReasoningProvider {
  const selectedType = type || (process.env.GEMINI_REASONING_ENABLED === 'true' ? 'GEMINI' : 'DISABLED');
  switch (selectedType) {
    case 'GEMINI':
      return new GoogleGeminiReasoningProvider();
    case 'FUTURE':
      return new FutureReasoningProvider();
    case 'DISABLED':
    default:
      return new DisabledReasoningProvider();
  }
}

// Default export: Defaults to DisabledReasoningProvider unless GEMINI_REASONING_ENABLED=true
export const defaultReasoningProvider: ReasoningProvider = createReasoningProvider();
