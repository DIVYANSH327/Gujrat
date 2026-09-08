/**
 * AI VISION AGENT & VISUAL ANALYSIS DEMONSTRATION SERVICE
 * 
 * Status: SIMULATED DEMONSTRATION / INTEGRATION READY ARCHITECTURE
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - YouTube feeds remain PUBLIC DEMONSTRATION SOURCES ONLY.
 * - This layer demonstrates how the REAL Edge Agent + AI/CV pipeline processes video feeds.
 * - DOES NOT claim YouTube is Gujarat Police CCTV.
 * - DOES NOT claim biometric facial recognition.
 * - DOES NOT fabricate actual pixel detection results unless a real model is running.
 * - Clearly labels all events: SIMULATED AI EVENT / SYNTHETIC INVESTIGATION SUBJECT / SIMULATED DEMO EVIDENCE.
 * - Reuses existing IHelmetDetectionService and IEvidenceCaptureService without duplication.
 */

import {
  SecurityEventPayload,
  Alert,
  EvidenceItem,
  EvidenceCaptureReason,
  HelmetDetectionResult,
  HelmetStatus,
  IHelmetDetectionService,
  IEvidenceCaptureService,
  PersonDetectionResult,
  VehicleDetectionResult,
  ANPRResult,
  WatchlistEntry
} from '../types';
import { HelmetDetectionService, EvidenceCaptureService, computeDeterministicHash } from './GodsEyeService';
import { centralRepo, sysEvents } from './Architecture';

let timelineCounter = 0;
function generateTimelineId(prefix: string): string {
  timelineCounter += 1;
  const rand = Math.random().toString(36).substring(2, 8);
  return `tl-${prefix}-${Date.now()}-${timelineCounter}-${rand}`;
}

export type RoadSafetyViolationType = 
  | 'HELMET_COMPLIANT'
  | 'NO_HELMET'
  | 'TRIPLE_RIDING'
  | 'WRONG_WAY'
  | 'STOP_LINE_VIOLATION'
  | 'RED_LIGHT_VIOLATION'
  | 'DANGEROUS_PARKING'
  | 'PEDESTRIAN_CONFLICT'
  | 'VEHICLE_DETECTION';

export interface RoadSafetyEvent {
  id: string;
  type: RoadSafetyViolationType;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  targetId?: string;
  trackId?: string;
  isSimulated: true;
  evidenceId?: string;
}

export interface SyntheticDetectionBox {
  id: string;
  label: string;
  category: 'person' | 'vehicle' | 'plate' | 'violation';
  trackId: string;
  confidence: number;
  x: number; // percentage [0-100]
  y: number; // percentage [0-100]
  width: number;
  height: number;
  violation?: string;
  color: string;
}

export interface VisionAnalysisResult {
  sourceId: string;
  sourceType: 'YOUTUBE_DEMO';
  isSimulation: true;
  timestamp: string;
  persons: PersonDetectionResult[];
  vehicles: VehicleDetectionResult[];
  helmets: HelmetDetectionResult[];
  roadSafetyEvents: RoadSafetyEvent[];
  plates: ANPRResult[];
  boundingBoxes: SyntheticDetectionBox[];
  summary: string;
}

export interface AIAgentTimelineItem {
  id: string;
  timestamp: string;
  timeFormatted: string;
  stage: 'AI_DETECTION' | 'EVENT_CREATED' | 'AUTO_CAPTURE' | 'EVIDENCE' | 'WATCHLIST' | 'ALERT' | 'GODS_EYE';
  type: string;
  targetId: string;
  description: string;
  confidence: number;
  evidenceId?: string;
  alertId?: string;
  isSimulated: true;
  badgeColor: string;
}

export interface IAIVisionAgent {
  readonly mode: 'SIMULATED' | 'REAL';
  analyzeFrame(sourceId: string): Promise<VisionAnalysisResult>;
  detectPersons(sourceId: string): Promise<PersonDetectionResult[]>;
  detectVehicles(sourceId: string): Promise<VehicleDetectionResult[]>;
  detectHelmet(sourceId: string, imageReference?: string): Promise<HelmetDetectionResult>;
  detectRoadSafety(sourceId: string): Promise<RoadSafetyEvent[]>;
  detectPlate(sourceId: string): Promise<ANPRResult>;
  createDetectionEvent(params: {
    sourceId: string;
    targetType: 'person' | 'vehicle' | 'road_safety' | 'anpr' | 'watchlist';
    customTargetId?: string;
    customReason?: EvidenceCaptureReason;
  }): Promise<{
    event: SecurityEventPayload;
    evidence?: EvidenceItem;
    alert?: Alert;
    watchlistMatch?: boolean;
    summary: string;
  }>;
}

/**
 * Simulated AI Vision Demonstration Agent
 * Connects YouTube Demo Feeds to the Central Event, Evidence, Alert, and God's Eye pipeline.
 */
export class SimulatedAIVisionAgent implements IAIVisionAgent {
  public readonly mode = 'SIMULATED' as const;
  private helmetService: IHelmetDetectionService;
  private evidenceService: IEvidenceCaptureService;

  // Active in-memory alerts and timeline generated during demo analysis
  private activeDemoAlerts: Alert[] = [];
  private timeline: AIAgentTimelineItem[] = [];
  private activeEvents: SecurityEventPayload[] = [];
  private activeEvidence: EvidenceItem[] = [];

  constructor(
    helmetService?: IHelmetDetectionService,
    evidenceService?: IEvidenceCaptureService
  ) {
    this.helmetService = helmetService || new HelmetDetectionService();
    this.evidenceService = evidenceService || new EvidenceCaptureService();
  }

  getHelmetService(): IHelmetDetectionService {
    return this.helmetService;
  }

  getEvidenceService(): IEvidenceCaptureService {
    return this.evidenceService;
  }

  async analyzeFrame(sourceId: string): Promise<VisionAnalysisResult> {
    const timestamp = new Date().toISOString();
    const persons = await this.detectPersons(sourceId);
    const vehicles = await this.detectVehicles(sourceId);
    const helmet = await this.detectHelmet(sourceId);
    const roadSafetyEvents = await this.detectRoadSafety(sourceId);
    const plate = await this.detectPlate(sourceId);

    const boundingBoxes: SyntheticDetectionBox[] = [
      {
        id: `box-p-${sourceId}`,
        label: 'PERSON [SYNTHETIC]',
        category: 'person',
        trackId: persons[0]?.syntheticPersonId || 'P-DEMO-003',
        confidence: persons[0]?.confidence || 0.94,
        x: 28,
        y: 35,
        width: 14,
        height: 38,
        color: '#06b6d4'
      },
      {
        id: `box-v-${sourceId}`,
        label: 'MOTORCYCLE [SYNTHETIC]',
        category: 'vehicle',
        trackId: 'V-DEMO-001',
        confidence: vehicles[0]?.confidence || 0.95,
        x: 52,
        y: 42,
        width: 22,
        height: 36,
        color: '#f59e0b'
      },
      {
        id: `box-h-${sourceId}`,
        label: helmet.status === 'NO_HELMET' ? 'NO HELMET [VIOLATION]' : 'HELMET [COMPLIANT]',
        category: 'violation',
        trackId: 'P-DEMO-003',
        confidence: helmet.confidence,
        x: 56,
        y: 32,
        width: 10,
        height: 12,
        violation: helmet.status === 'NO_HELMET' ? 'NO_HELMET' : undefined,
        color: helmet.status === 'NO_HELMET' ? '#f43f5e' : '#10b981'
      }
    ];

    const helmetStatusStr = (helmet?.status ? String(helmet.status).toLowerCase().replace(/_/g, '-') : 'no-helmet');
    const summary = `Demonstration event detected involving a motorcycle rider (Track V-DEMO-001) and pedestrian (Track ${persons[0]?.syntheticPersonId || 'P-DEMO-003'}). Synthetic road-safety analysis classified the rider as ${helmetStatusStr}. A demonstration evidence record was created and evaluated against the configured watchlist and alert rules.`;

    return {
      sourceId,
      sourceType: 'YOUTUBE_DEMO',
      isSimulation: true,
      timestamp,
      persons,
      vehicles,
      helmets: [helmet],
      roadSafetyEvents,
      plates: [plate],
      boundingBoxes,
      summary
    };
  }

  async detectPersons(sourceId: string): Promise<PersonDetectionResult[]> {
    const isP3 = sourceId.includes('001') || sourceId.includes('003');
    const personId = isP3 ? 'P-DEMO-003' : 'P-DEMO-001';
    return [
      {
        syntheticPersonId: personId,
        confidence: 0.94,
        boundingBox: { x: 140, y: 180, width: 120, height: 310 },
        clothingColor: 'Dark Attire / Denim (Simulated)',
        timestamp: new Date().toISOString(),
        cameraId: sourceId,
        isSimulated: true
      }
    ];
  }

  async detectVehicles(sourceId: string): Promise<VehicleDetectionResult[]> {
    const isMotorcycle = sourceId.includes('001') || sourceId.includes('004');
    return [
      {
        vehicleType: isMotorcycle ? 'Motorcycle' : 'Sedan',
        vehicleColor: isMotorcycle ? 'Black / Metallic' : 'Silver',
        confidence: 0.95,
        boundingBox: { x: 220, y: 240, width: 280, height: 210 },
        timestamp: new Date().toISOString(),
        cameraId: sourceId,
        isSimulated: true
      }
    ];
  }

  async detectHelmet(sourceId: string, imageReference?: string): Promise<HelmetDetectionResult> {
    const isViolation = sourceId.includes('001') || sourceId.includes('002');
    return this.helmetService.detectHelmet(imageReference || 'simulated-frame-ref', {
      cameraId: sourceId,
      helmetStatus: isViolation ? 'NO_HELMET' : 'HELMET',
      helmetConfidence: isViolation ? 0.92 : 0.96,
      timestamp: new Date().toISOString()
    });
  }

  async detectRoadSafety(sourceId: string): Promise<RoadSafetyEvent[]> {
    const now = new Date().toISOString();
    return [
      {
        id: `RSE-${Date.now()}-1`,
        type: 'NO_HELMET',
        severity: 'high',
        title: 'RIDER WITHOUT HELMET DETECTED',
        description: 'Synthetic road safety analysis classified rider without safety helmet at 92% confidence.',
        confidence: 0.92,
        timestamp: now,
        targetId: 'P-DEMO-003',
        trackId: 'V-DEMO-001',
        isSimulated: true
      },
      {
        id: `RSE-${Date.now()}-2`,
        type: 'STOP_LINE_VIOLATION',
        severity: 'medium',
        title: 'STOP-LINE ENCROACHMENT',
        description: 'Vehicle front axle crossed active junction stop-line prior to signal transition.',
        confidence: 0.88,
        timestamp: now,
        targetId: 'V-DEMO-001',
        isSimulated: true
      }
    ];
  }

  async detectPlate(sourceId: string): Promise<ANPRResult> {
    const isWl = sourceId.includes('001') || sourceId.includes('002');
    return {
      plate: isWl ? 'GJ01AB1234' : 'GJ05XY6789',
      confidence: 0.96,
      boundingBox: { x: 240, y: 310, width: 160, height: 50 },
      timestamp: new Date().toISOString(),
      cameraId: sourceId,
      isSimulated: true
    };
  }

  /**
   * Execute full AI Demonstration Processing Pipeline:
   * AI DETECTION ➔ EVENT CREATED ➔ AUTO CAPTURE ➔ EVIDENCE ➔ WATCHLIST ➔ ALERT ➔ GOD'S EYE
   */
  async createDetectionEvent(params: {
    sourceId: string;
    targetType: 'person' | 'vehicle' | 'road_safety' | 'anpr' | 'watchlist';
    customTargetId?: string;
    customReason?: EvidenceCaptureReason;
  }): Promise<{
    event: SecurityEventPayload;
    evidence?: EvidenceItem;
    alert?: Alert;
    watchlistMatch?: boolean;
    summary: string;
  }> {
    const now = new Date();
    const timestamp = now.toISOString();
    const timeFormatted = now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const eventId = `EVT-YT-${params.targetType.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const sourceId = params.sourceId || 'YT-DEMO-001';

    let eventType: 'ANPR' | 'PERSON_TRACK' | 'CROWD' | 'ROAD_SAFETY' | 'TRAFFIC' = 'PERSON_TRACK';
    let targetId = params.customTargetId || 'P-DEMO-003';
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let confidence = 0.94;
    let captureReason: EvidenceCaptureReason = params.customReason || 'PERSON_TRACK';
    let helmetStatus: HelmetStatus = 'UNKNOWN';
    let plateNumber = 'GJ01AB1234';
    let isWatchlistTarget = false;
    let description = '';

    switch (params.targetType) {
      case 'person':
        eventType = 'PERSON_TRACK';
        targetId = params.customTargetId || 'P-DEMO-003';
        priority = 'medium';
        confidence = 0.94;
        captureReason = 'PERSON_TRACK';
        description = `Synthetic person track ${targetId} detected on demo video stream.`;
        break;

      case 'vehicle':
        eventType = 'ANPR';
        targetId = params.customTargetId || 'V-DEMO-002';
        plateNumber = 'GJ01AB1234';
        priority = 'medium';
        confidence = 0.95;
        captureReason = 'VEHICLE_DETECTION';
        description = `Synthetic vehicle track ${targetId} (Motorcycle) detected heading Northbound.`;
        break;

      case 'road_safety':
        eventType = 'ROAD_SAFETY';
        targetId = params.customTargetId || 'P-DEMO-003';
        helmetStatus = 'NO_HELMET';
        priority = 'high';
        confidence = 0.92;
        captureReason = 'NO_HELMET';
        description = `Synthetic road safety violation: Rider detected without helmet (92% confidence).`;
        break;

      case 'anpr':
        eventType = 'ANPR';
        targetId = params.customTargetId || 'GJ01AB1234';
        plateNumber = targetId;
        priority = 'medium';
        confidence = 0.96;
        captureReason = 'ANPR_MATCH';
        description = `Synthetic ANPR detection: ${plateNumber} (96% optical OCR confidence).`;
        break;

      case 'watchlist':
        eventType = 'ANPR';
        targetId = params.customTargetId || 'P-DEMO-003';
        plateNumber = 'GJ01AB1234';
        priority = 'critical';
        confidence = 0.97;
        captureReason = 'WATCHLIST_MATCH';
        isWatchlistTarget = true;
        description = `High-Priority Watchlist Match: Target ${targetId} / ${plateNumber} enrolled in active statewide tracking.`;
        break;
    }

    // Step 1 & 2: Create Security Event Payload
    const securityEvent: SecurityEventPayload = {
      eventId,
      edgeNodeId: 'EDGE-DEMO-YT',
      siteId: 'SITE-DEMO-PRESENTATION',
      cameraId: sourceId,
      timestamp,
      eventType: eventType as any,
      priority,
      confidence,
      snapshotReference: `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
      metadata: {
        personTrackId: targetId.startsWith('P-') ? targetId : undefined,
        plate: plateNumber,
        vehicleType: 'Motorcycle',
        direction: 'Northbound',
        helmetStatus,
        helmetConfidence: helmetStatus === 'NO_HELMET' ? 0.92 : undefined,
        isSimulatedDemo: true,
        sourceType: 'YOUTUBE_DEMO',
        locationLabel: 'Synthetic Demo Location (Ahmedabad SG Highway Corridor)',
        evidenceId: `EVD-YT-${eventId.slice(-8)}`
      }
    };

    // Store in Central Event Store
    centralRepo.createEvent(securityEvent);
    this.activeEvents.unshift(securityEvent);
    if (this.activeEvents.length > 50) this.activeEvents.pop();

    // Step 3 & 4: Automatic Evidence Capture via IEvidenceCaptureService
    const evidenceItem = await this.evidenceService.captureEvidence({
      eventId,
      cameraId: sourceId,
      targetId,
      reason: captureReason,
      correlationId: `CORR-YT-${eventId.slice(-6)}`,
      metadata: {
        timestamp,
        edgeNodeId: 'EDGE-DEMO-YT',
        latitude: 23.0225,
        longitude: 72.5714,
        isSimulated: true,
        location: 'Ahmedabad SG Highway Corridor (Synthetic Demo)',
        detectionType: params.targetType.toUpperCase(),
        vehicleId: targetId.startsWith('V-') ? targetId : 'V-DEMO-002',
        personId: targetId.startsWith('P-') ? targetId : 'P-DEMO-003',
        helmetStatus,
        confidence,
        captureSource: 'YOUTUBE DEMO',
        status: 'SIMULATED DEMO EVIDENCE',
        label: 'SIMULATED DEMO EVIDENCE'
      }
    });
    this.activeEvidence.unshift(evidenceItem);

    // Step 5 & 6: Watchlist Evaluation & Alert Creation
    let alert: Alert | undefined;
    const isAlertWorthy = isWatchlistTarget || helmetStatus === 'NO_HELMET' || priority === 'critical' || priority === 'high';

    if (isAlertWorthy) {
      const alertId = `ALT-YT-${eventId.slice(-8)}`;
      alert = {
        id: alertId,
        type: isWatchlistTarget ? 'watchlist' : helmetStatus === 'NO_HELMET' ? 'road_safety' : 'detection',
        severity: isWatchlistTarget ? 'critical' : priority as any,
        cameraId: sourceId,
        cameraName: `YouTube Demo Source (${sourceId})`,
        location: 'Synthetic Demo Location (SG Highway)',
        timestamp,
        description: isWatchlistTarget
          ? `WATCHLIST TARGET DETECTED: ${targetId} / ${plateNumber} matched active watchlist rules on demonstration stream.`
          : helmetStatus === 'NO_HELMET'
          ? `🚨 ROAD SAFETY ALERT: NO HELMET DETECTED on source ${sourceId} (Confidence: ${Math.round(confidence * 100)}%)`
          : description,
        isRead: false,
        snapshotUrl: securityEvent.snapshotReference!,
        vehicleNumber: plateNumber,
        targetId,
        personTrackId: targetId.startsWith('P-') ? targetId : undefined,
        syntheticMatch: true,
        label: 'SIMULATED DEMONSTRATION ALERT',
        confidence,
        status: 'new',
        evidenceReference: evidenceItem.evidenceId
      };
      this.activeDemoAlerts.unshift(alert);
      if (this.activeDemoAlerts.length > 30) this.activeDemoAlerts.pop();
    }

    // Step 7: Record Chronological Pipeline Timeline Events
    this.timeline.unshift(
      {
        id: generateTimelineId('det'),
        timestamp,
        timeFormatted,
        stage: 'AI_DETECTION',
        type: `${params.targetType.toUpperCase()} DETECTED`,
        targetId,
        description,
        confidence,
        isSimulated: true,
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/60'
      },
      {
        id: generateTimelineId('evd'),
        timestamp,
        timeFormatted,
        stage: 'AUTO_CAPTURE',
        type: 'AUTO SNAPSHOT & EVIDENCE CREATED',
        targetId,
        description: `Evidence ${evidenceItem.evidenceId} fingerprinted with SHA-256 digest: ${evidenceItem.sha256.slice(0, 16)}...`,
        confidence: 1.0,
        evidenceId: evidenceItem.evidenceId,
        isSimulated: true,
        badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60'
      }
    );

    if (alert) {
      this.timeline.unshift({
        id: generateTimelineId('alt'),
        timestamp,
        timeFormatted,
        stage: isWatchlistTarget ? 'WATCHLIST' : 'ALERT',
        type: isWatchlistTarget ? 'WATCHLIST MATCH ALERT' : 'ROAD SAFETY ALERT',
        targetId,
        description: alert.description,
        confidence,
        alertId: alert.id,
        isSimulated: true,
        badgeColor: isWatchlistTarget 
          ? 'text-rose-400 border-rose-500/40 bg-rose-950/60' 
          : 'text-amber-400 border-amber-500/40 bg-amber-950/60'
      });
    }

    if (this.timeline.length > 50) {
      this.timeline = this.timeline.slice(0, 50);
    }

    // Notify UI event bus
    sysEvents.emit('LOG', {
      dir: 'internal',
      type: `AI_DEMO_${params.targetType.toUpperCase()}`,
      size: JSON.stringify(securityEvent).length,
      status: 'success'
    });

    const summary = isWatchlistTarget
      ? `High-priority demonstration watchlist match verified for synthetic target ${targetId}. Automatic evidence record ${evidenceItem.evidenceId} archived with SHA-256 integrity hash. Incident alert dispatched to Gujarat Police Command Center.`
      : helmetStatus === 'NO_HELMET'
      ? `Demonstration road-safety event detected involving motorcycle rider. Synthetic helmet classification evaluated as NO_HELMET (${Math.round(confidence * 100)}% confidence). Evidence record ${evidenceItem.evidenceId} generated with SHA-256 digest.`
      : `Demonstration event successfully evaluated for target ${targetId}. Ingested into Central Event Store with evidence hash ${evidenceItem.sha256.slice(0, 16)}... and linked to God's Eye trajectory reconstructor.`;

    return {
      event: securityEvent,
      evidence: evidenceItem,
      alert,
      watchlistMatch: isWatchlistTarget,
      summary
    };
  }

  getTimeline(): AIAgentTimelineItem[] {
    const seen = new Set<string>();
    const deduplicated: AIAgentTimelineItem[] = [];
    for (const item of this.timeline) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        deduplicated.push(item);
      }
    }
    return deduplicated;
  }

  getActiveAlerts(): Alert[] {
    return this.activeDemoAlerts;
  }

  getActiveEvidence(): EvidenceItem[] {
    return this.activeEvidence;
  }

  async simulateVehicle(sourceId: string = 'YT-DEMO-001') {
    return this.createDetectionEvent({
      sourceId,
      targetType: 'vehicle',
      customTargetId: 'V-DEMO-002'
    });
  }

  async simulatePerson(sourceId: string = 'YT-DEMO-001') {
    return this.createDetectionEvent({
      sourceId,
      targetType: 'person',
      customTargetId: 'P-DEMO-003'
    });
  }

  async simulateNoHelmet(sourceId: string = 'YT-DEMO-001') {
    return this.createDetectionEvent({
      sourceId,
      targetType: 'road_safety',
      customTargetId: 'P-DEMO-003'
    });
  }

  async simulateRoadSafetyAlert(sourceId: string = 'YT-DEMO-001') {
    return this.createDetectionEvent({
      sourceId,
      targetType: 'road_safety',
      customTargetId: 'P-DEMO-003'
    });
  }

  async simulateWatchlistCheck(sourceId: string = 'YT-DEMO-001') {
    return this.createDetectionEvent({
      sourceId,
      targetType: 'watchlist',
      customTargetId: 'P-DEMO-003'
    });
  }

  async captureEvidenceNow(sourceId: string = 'YT-DEMO-001') {
    return this.createDetectionEvent({
      sourceId,
      targetType: 'person',
      customTargetId: 'P-DEMO-003',
      customReason: 'PERSON_TRACK'
    });
  }

  clearDemoData(): void {
    this.activeDemoAlerts = [];
    this.timeline = [];
    this.activeEvents = [];
    this.activeEvidence = [];
  }
}

/**
 * Future Production Real AI Vision Agent Stub
 * For Hardware Jetson Orin Edge Nodes running TensorRT / YOLOv8.
 */
export class RealAIVisionAgent implements IAIVisionAgent {
  public readonly mode = 'REAL' as const;
  
  async analyzeFrame(): Promise<never> {
    throw new Error('RealAIVisionAgent: Requires production hardware Jetson Orin Edge Node with TensorRT acceleration. Currently in FUTURE DEPLOYMENT state.');
  }

  async detectPersons(): Promise<never> {
    throw new Error('RealAIVisionAgent: Not available on web demonstration client.');
  }

  async detectVehicles(): Promise<never> {
    throw new Error('RealAIVisionAgent: Not available on web demonstration client.');
  }

  async detectHelmet(): Promise<never> {
    throw new Error('RealAIVisionAgent: Not available on web demonstration client.');
  }

  async detectRoadSafety(): Promise<never> {
    throw new Error('RealAIVisionAgent: Not available on web demonstration client.');
  }

  async detectPlate(): Promise<never> {
    throw new Error('RealAIVisionAgent: Not available on web demonstration client.');
  }

  async createDetectionEvent(): Promise<never> {
    throw new Error('RealAIVisionAgent: Not available on web demonstration client.');
  }
}

// Global Singleton Export
export const aiVisionAgent = new SimulatedAIVisionAgent();
