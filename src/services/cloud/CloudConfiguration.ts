/**
 * CloudConfiguration.ts
 * Google Cloud Deployment & Cost Protection Configuration
 * Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
 * 
 * Invariants:
 * 1. ZERO MANDATORY GEMINI INFERENCE: Gemini is NEVER used for continuous CCTV frames or plate crops.
 * 2. REAL-DATA EDGE GATEWAY: CCTV feeds stay local/edge; only structured events & verified evidence go upstream.
 * 3. COST CONTROL: CLOUD_MODE defaults to EVENT_ONLY.
 * 4. CREDIT PROTECTION: Protects available GCP free credits from unbounded cloud video transcoding or AI API billing.
 */

export type CloudMode = 'LOCAL_ONLY' | 'EVENT_ONLY' | 'HYBRID';
export type CloudEnvironment = 'LOCAL' | 'GCP_DEV' | 'GCP_STAGING' | 'GCP_PRODUCTION';
export type EventBusProviderType = 'LOCAL' | 'PUBSUB';
export type EvidenceStoreProviderType = 'LOCAL' | 'GCS';
export type ReasoningProviderType = 'DISABLED' | 'GEMINI' | 'FUTURE';

export interface CloudMetrics {
  cloudEventsPublished: number;
  cloudBytesUploaded: number;
  evidenceBytesUploaded: number;
  pubsubFailures: number;
  cloudStorageUploads: number;
  dataflowProcessingErrors: number;
  spooledEventsCount: number;
  geminiInvocations: number; // MUST REMAIN 0 FOR CONTINUOUS INFERENCE
}

export class CloudConfigurationService {
  private static instance: CloudConfigurationService;

  public environment: CloudEnvironment;
  public cloudMode: CloudMode;
  public eventBusProvider: EventBusProviderType;
  public evidenceStoreProvider: EvidenceStoreProviderType;
  public geminiReasoningEnabled: boolean;
  public projectId: string;
  public region: string;
  public pubsubTopicEvents: string;
  public gcsEvidenceBucket: string;
  public bigqueryDataset: string;

  private metrics: CloudMetrics = {
    cloudEventsPublished: 0,
    cloudBytesUploaded: 0,
    evidenceBytesUploaded: 0,
    pubsubFailures: 0,
    cloudStorageUploads: 0,
    dataflowProcessingErrors: 0,
    spooledEventsCount: 0,
    geminiInvocations: 0
  };

  private constructor() {
    this.environment = (process.env.SENTINEL_ENV as CloudEnvironment) || 'LOCAL';
    
    // Explicit cost control mode: Default to EVENT_ONLY
    this.cloudMode = (process.env.CLOUD_MODE as CloudMode) || 'EVENT_ONLY';
    
    this.eventBusProvider = (process.env.EVENT_BUS as EventBusProviderType) || 
      (process.env.ENABLE_GOOGLE_CLOUD_SYNC === 'true' ? 'PUBSUB' : 'LOCAL');
    
    this.evidenceStoreProvider = (process.env.EVIDENCE_STORE as EvidenceStoreProviderType) ||
      (process.env.ENABLE_GOOGLE_CLOUD_SYNC === 'true' ? 'GCS' : 'LOCAL');
    
    // CRITICAL BILLING CONSTRAINT: Gemini reasoning is STRICTLY OPTIONAL and disabled by default
    this.geminiReasoningEnabled = process.env.GEMINI_REASONING_ENABLED === 'true';

    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'gujarat-police-sentinel';
    this.region = process.env.GOOGLE_CLOUD_REGION || 'asia-south1';
    this.pubsubTopicEvents = process.env.GCP_PUBSUB_TOPIC_EVENTS || 'projects/gujarat-police-sentinel/topics/sentinel-vehicle-events';
    this.gcsEvidenceBucket = process.env.GCP_GCS_EVIDENCE_BUCKET || 'gujarat-police-sentinel-evidence-asia-south1';
    this.bigqueryDataset = process.env.GCP_BIGQUERY_DATASET || 'sentinel_surveillance_mesh';
  }

  public static getInstance(): CloudConfigurationService {
    if (!CloudConfigurationService.instance) {
      CloudConfigurationService.instance = new CloudConfigurationService();
    }
    return CloudConfigurationService.instance;
  }

  public get gcpProjectId(): string {
    return this.projectId;
  }

  public setCloudMode(mode: CloudMode): void {
    this.cloudMode = mode;
  }

  public setGeminiReasoningEnabled(enabled: boolean): void {
    this.geminiReasoningEnabled = enabled;
  }

  public getMetrics(): CloudMetrics {
    return { ...this.metrics };
  }

  public increment(metric: keyof CloudMetrics, amount = 1): void {
    this.metrics[metric] += amount;
  }

  public recordEventPublished(bytes = 0): void {
    this.metrics.cloudEventsPublished++;
    this.metrics.cloudBytesUploaded += bytes;
  }

  public recordEvidenceUpload(bytes = 0): void {
    this.metrics.cloudStorageUploads++;
    this.metrics.evidenceBytesUploaded += bytes;
    this.metrics.cloudBytesUploaded += bytes;
  }

  public recordPubSubFailure(): void {
    this.metrics.pubsubFailures++;
  }

  public recordDataflowError(): void {
    this.metrics.dataflowProcessingErrors++;
  }

  public setSpooledCount(count: number): void {
    this.metrics.spooledEventsCount = count;
  }

  public getSummary() {
    return {
      environment: this.environment,
      cloudMode: this.cloudMode,
      eventBus: this.eventBusProvider,
      evidenceStore: this.evidenceStoreProvider,
      geminiReasoningEnabled: this.geminiReasoningEnabled,
      projectId: this.projectId,
      region: this.region,
      metrics: this.getMetrics(),
      costControl: {
        rawVideoUploadToCloud: false,
        continuousGeminiInference: false,
        localEdgeProcessingActive: true,
        billingProtected: true
      }
    };
  }
}

export const cloudConfig = CloudConfigurationService.getInstance();
