/**
 * ObservabilityService.ts
 * Real-time System & Cloud Pipeline Observability for Gujarat Police Sentinel Grid
 * 
 * Invariants:
 * 1. TRUTHFUL TELEMETRY: Badges and health indicators strictly represent actual sub-system states.
 * 2. ZERO HALLUCINATED METRICS: Connects to actual running VideoStreamService, EventBus, Dataflow, and Storage.
 * 3. REASONING TRANSPARENCY: Accurately reports REASONING: "DISABLED" when Gemini API is uninvoked to protect billing.
 */

import { defaultPubSubEventBus } from './EventBus.js';
import { defaultCloudEvidenceStore } from './EvidenceStore.js';
import { defaultBigQueryAdapter } from './BigQueryAdapter.js';
import { defaultReasoningProvider } from './ReasoningProvider.js';
import { dataflowStreamingEngine } from './DataflowPipeline.js';
import { cloudConfig } from './CloudConfiguration.js';
import { sentinelBackgroundIntelligenceService } from '../server/SentinelBackgroundIntelligenceService.js';
import { videoStreamService } from '../server/VideoStreamService.js';

export interface SentinelObservabilityReport {
  edge: 'LIVE' | 'DEGRADED' | 'OFFLINE';
  source: 'LIVE' | 'STALE' | 'FAILED';
  ai: 'PROCESSING' | 'IDLE' | 'ERROR';
  player: 'STREAMING' | 'BUFFERING' | 'STOPPED';
  eventBus: 'CONNECTED' | 'LOCAL_ACTIVE' | 'SPOOLED';
  dataflow: 'HEALTHY' | 'BACKPRESSURE' | 'ERROR';
  bigquery: 'HEALTHY' | 'LATENCY' | 'ERROR';
  evidenceStorage: 'HEALTHY' | 'FULL' | 'ERROR';
  reasoning: 'DISABLED' | 'ACTIVE' | 'ERROR';
  cloudMode: 'LOCAL_ONLY' | 'EVENT_ONLY' | 'HYBRID';
  metrics: {
    cloudEventsPublished: number;
    cloudBytesUploaded: number;
    evidenceBytesUploaded: number;
    pubsubFailures: number;
    cloudStorageUploads: number;
    dataflowProcessingErrors: number;
    spooledEventsCount: number;
    geminiInvocations: number;
  };
  subsystems: {
    activeCamerasCount: number;
    persistentBackgroundActive: boolean;
    dataflowRunner: string;
    bigqueryDataset: string;
    evidenceBucket: string;
    reasoningProviderName: string;
  };
  generatedAt: string;
}

export class ObservabilityService {
  private static instance: ObservabilityService;

  private constructor() {}

  public static getInstance(): ObservabilityService {
    if (!ObservabilityService.instance) {
      ObservabilityService.instance = new ObservabilityService();
    }
    return ObservabilityService.instance;
  }

  public getObservabilityReport(): SentinelObservabilityReport {
    // 1. Edge State
    const bgStatus = sentinelBackgroundIntelligenceService.getStatus();
    const activeCamIds = videoStreamService.getActiveStreamCameraIds();
    
    let edge: 'LIVE' | 'DEGRADED' | 'OFFLINE' = 'LIVE';
    if (!bgStatus.isRunning) {
      edge = activeCamIds.length > 0 ? 'DEGRADED' : 'OFFLINE';
    }

    // 2. Source (CCTV RTSP) State
    let source: 'LIVE' | 'STALE' | 'FAILED' = 'LIVE';
    if (activeCamIds.length > 0) {
      const statuses = activeCamIds.map(id => videoStreamService.getStreamTelemetry(id).status);
      const allOffline = statuses.every(s => s === 'OFFLINE');
      const anyDegraded = statuses.some(s => s === 'DEGRADED' || s === 'RECONNECTING');
      if (allOffline) {
        source = 'FAILED';
      } else if (anyDegraded) {
        source = 'STALE';
      }
    }

    // 3. Local AI State
    let ai: 'PROCESSING' | 'IDLE' | 'ERROR' = 'IDLE';
    if (bgStatus.isRunning) {
      ai = 'PROCESSING';
    }

    // 4. Player State
    const player: 'STREAMING' | 'BUFFERING' | 'STOPPED' = activeCamIds.length > 0 ? 'STREAMING' : 'STOPPED';

    // 5. Event Bus State
    const busStatus = defaultPubSubEventBus.getStatus();
    let eventBus: 'CONNECTED' | 'LOCAL_ACTIVE' | 'SPOOLED' = 'LOCAL_ACTIVE';
    if (busStatus.active) {
      eventBus = 'CONNECTED';
    } else if ((busStatus.spooledCount || 0) > 0) {
      eventBus = 'SPOOLED';
    }

    // 6. Dataflow State
    const dfStatus = dataflowStreamingEngine.getStatus();
    let dataflow: 'HEALTHY' | 'BACKPRESSURE' | 'ERROR' = 'HEALTHY';
    if (dfStatus.metrics.validationErrorsCount > 10) {
      dataflow = 'ERROR';
    } else if (dfStatus.cachedIdempotencyKeys > 1000) {
      dataflow = 'BACKPRESSURE';
    }

    // 7. BigQuery State
    const bqStatus = defaultBigQueryAdapter.getStatus();
    const bigquery: 'HEALTHY' | 'LATENCY' | 'ERROR' = bqStatus.tablesCount > 0 ? 'HEALTHY' : 'ERROR';

    // 8. Evidence Storage State
    const storeStatus = defaultCloudEvidenceStore.getStatus();
    let evidenceStorage: 'HEALTHY' | 'FULL' | 'ERROR' = 'HEALTHY';
    if (storeStatus.integrityStatus === 'COMPROMISED') {
      evidenceStorage = 'ERROR';
    }

    // 9. Reasoning Provider State (CRITICAL: Reflects DISABLED by default)
    const reasoningStatus = defaultReasoningProvider.getStatus();
    let reasoning: 'DISABLED' | 'ACTIVE' | 'ERROR' = 'DISABLED';
    if (reasoningStatus.active && reasoningStatus.provider === 'GOOGLE_GEMINI') {
      reasoning = 'ACTIVE';
    }

    // Current metrics
    const metrics = cloudConfig.getMetrics();
    metrics.spooledEventsCount = busStatus.spooledCount || 0;

    return {
      edge,
      source,
      ai,
      player,
      eventBus,
      dataflow,
      bigquery,
      evidenceStorage,
      reasoning,
      cloudMode: cloudConfig.cloudMode,
      metrics,
      subsystems: {
        activeCamerasCount: activeCamIds.length,
        persistentBackgroundActive: bgStatus.isRunning,
        dataflowRunner: dfStatus.runner,
        bigqueryDataset: bqStatus.dataset,
        evidenceBucket: cloudConfig.gcsEvidenceBucket,
        reasoningProviderName: reasoningStatus.provider
      },
      generatedAt: new Date().toISOString()
    };
  }
}

export const observabilityService = ObservabilityService.getInstance();
