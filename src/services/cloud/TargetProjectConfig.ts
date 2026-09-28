/**
 * TargetProjectConfig.ts
 * Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
 * 
 * Centralized Target Google Cloud Project Configuration for Migration to:
 * - Project Name: Gujrat cctv
 * - Project ID: gujrat-cctv
 * - Primary Region: asia-south1
 */

export interface ServiceAccountDefinition {
  id: string;
  email: string;
  displayName: string;
  description: string;
  roles: string[];
}

export interface BigQueryColumnSchema {
  name: string;
  type: string;
  mode: 'REQUIRED' | 'NULLABLE' | 'REPEATED';
  description: string;
}

export interface GcsRetentionPolicyConfig {
  bucketName: string;
  location: string;
  versioningEnabled: boolean;
  uniformBucketLevelAccess: boolean;
  lifecycleRules: Array<{
    action: { type: string; storageClass?: string };
    condition: { ageDays: number };
  }>;
  configuredRetentionPolicyYears: number;
}

export interface GcpTargetConfig {
  projectName: string;
  projectId: string;
  projectNumber: string;
  region: string;
  pubSubTopic: string;
  pubSubDlqTopic: string;
  pubSubSubscription: string;
  pubSubBigQuerySubscription: string;
  bigQueryDataset: string;
  bigQueryTable: string;
  bigQueryColumns: BigQueryColumnSchema[];
  gcsBucket: string;
  gcsRetentionPolicy: GcsRetentionPolicyConfig;
  serviceAccounts: {
    runtime: ServiceAccountDefinition;
    edge: ServiceAccountDefinition;
    pubsubBigQuery: ServiceAccountDefinition;
  };
  cloudRunService: {
    name: string;
    port: number;
    minInstances: number;
    maxInstances: number;
    memory: string;
    cpu: string;
  };
  vertexAiGemini: {
    model: string;
    serverSideOnly: boolean;
    userAgent: string;
    enabled: boolean;
  };
}

export const TARGET_GCP_CONFIG: GcpTargetConfig = {
  projectName: process.env.GCP_PROJECT_NAME || 'Gujrat cctv',
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID || process.env.GCP_PROJECT || 'gujrat-cctv',
  projectNumber: process.env.GOOGLE_CLOUD_PROJECT_NUMBER || process.env.GCP_PROJECT_NUMBER || '264410664731',
  region: process.env.GOOGLE_CLOUD_REGION || process.env.GCP_REGION || 'asia-south1',
  pubSubTopic: process.env.PUBSUB_TOPIC || 'sentinel-poc-observations',
  pubSubDlqTopic: process.env.PUBSUB_DLQ_TOPIC || 'sentinel-poc-observations-dlq',
  pubSubSubscription: process.env.PUBSUB_SUBSCRIPTION || 'sentinel-poc-observations-sub',
  pubSubBigQuerySubscription: process.env.PUBSUB_BQ_SUBSCRIPTION || 'sentinel-poc-bigquery-sub',
  bigQueryDataset: process.env.BIGQUERY_DATASET || 'sentinel_poc',
  bigQueryTable: process.env.BIGQUERY_TABLE || 'observations',
  bigQueryColumns: [
    { name: 'eventId', type: 'STRING', mode: 'REQUIRED', description: 'Deterministic unique event identifier' },
    { name: 'idempotencyKey', type: 'STRING', mode: 'REQUIRED', description: 'SHA-256 deduplication key for at-least-once delivery' },
    { name: 'cameraId', type: 'STRING', mode: 'REQUIRED', description: 'Sensor hardware / camera identifier e.g. CAM12' },
    { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Event observation timestamp in UTC' },
    { name: 'eventType', type: 'STRING', mode: 'REQUIRED', description: 'Category: VEHICLE_OBSERVED, ANPR_ALERT, WATCHLIST_HIT' },
    { name: 'vehicleClass', type: 'STRING', mode: 'NULLABLE', description: 'Classified vehicle type e.g. SEDAN, SUV, TRUCK, 2W' },
    { name: 'plateStatus', type: 'STRING', mode: 'NULLABLE', description: 'HSRP compliance status e.g. HSRP_COMPLIANT, NON_COMPLIANT' },
    { name: 'evidenceId', type: 'STRING', mode: 'REQUIRED', description: 'Forensic evidence token under BSA Section 63' },
    { name: 'evidenceSha256', type: 'STRING', mode: 'REQUIRED', description: 'Cryptographic SHA-256 hash of raw captured frame' },
    { name: 'source', type: 'STRING', mode: 'REQUIRED', description: 'Sensor source stream e.g. SRC-CAM12-CORP8-RTSP' },
    { name: 'truthStatus', type: 'STRING', mode: 'REQUIRED', description: 'Forensic truth tier: OBSERVED vs UNVERIFIED' },
    { name: 'district', type: 'STRING', mode: 'NULLABLE', description: 'Administrative police district in Gujarat' },
    { name: 'aiConfidence', type: 'FLOAT', mode: 'NULLABLE', description: 'Model confidence score 0.0 to 1.0' },
    { name: 'ingestedAt', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Cloud control plane ingestion instant' }
  ],
  gcsBucket: process.env.GCS_BUCKET || 'sentinel-evidence-gujrat-cctv',
  gcsRetentionPolicy: {
    bucketName: process.env.GCS_BUCKET || 'sentinel-evidence-gujrat-cctv',
    location: process.env.GCP_REGION || 'asia-south1',
    versioningEnabled: true,
    uniformBucketLevelAccess: true,
    lifecycleRules: [
      { action: { type: 'SetStorageClass', storageClass: 'COLDLINE' }, condition: { ageDays: 30 } },
      { action: { type: 'SetStorageClass', storageClass: 'ARCHIVE' }, condition: { ageDays: 365 } }
    ],
    // Configured digital evidence retention policy for Gujarat Police Surveillance archive
    configuredRetentionPolicyYears: 7
  },
  serviceAccounts: {
    runtime: {
      id: 'sentinel-runtime',
      email: process.env.GCP_RUNTIME_SA_EMAIL || 'sentinel-runtime@gujrat-cctv.iam.gserviceaccount.com',
      displayName: 'Sentinel Grid Cloud Run Runtime Identity',
      description: 'Executes Express API backend with least-privilege access to Pub/Sub, BigQuery, GCS, Vertex AI and Secret Manager',
      roles: [
        'roles/pubsub.publisher',
        'roles/bigquery.dataEditor',
        'roles/storage.objectAdmin',
        'roles/aiplatform.user',
        'roles/secretmanager.secretAccessor'
      ]
    },
    edge: {
      id: 'sentinel-edge-sa',
      email: process.env.GCP_EDGE_SA_EMAIL || 'sentinel-edge-sa@gujrat-cctv.iam.gserviceaccount.com',
      displayName: 'Sentinel Grid District Edge Node Identity',
      description: 'Used by local District Edge servers to publish structured events and upload sealed evidence frames',
      roles: [
        'roles/pubsub.publisher',
        'roles/storage.objectCreator'
      ]
    },
    pubsubBigQuery: {
      id: 'pubsub-to-bigquery-sa',
      email: process.env.GCP_PUBSUB_BQ_SA_EMAIL || 'pubsub-to-bigquery-sa@gujrat-cctv.iam.gserviceaccount.com',
      displayName: 'Pub/Sub BigQuery Streaming Service Agent',
      description: 'Used by Pub/Sub service agent to stream observations directly into partitioned BigQuery table',
      roles: [
        'roles/bigquery.dataEditor',
        'roles/bigquery.jobUser'
      ]
    }
  },
  cloudRunService: {
    name: 'sentinel-command-center',
    port: 3000,
    minInstances: 0,
    maxInstances: 10,
    memory: '2Gi',
    cpu: '2'
  },
  vertexAiGemini: {
    model: 'gemini-3.8-flash',
    serverSideOnly: true,
    userAgent: 'aistudio-build',
    enabled: true
  }
};

export function getFullPubSubTopicPath(config: GcpTargetConfig = TARGET_GCP_CONFIG): string {
  return `projects/${config.projectId}/topics/${config.pubSubTopic}`;
}

export function getFullPubSubSubscriptionPath(config: GcpTargetConfig = TARGET_GCP_CONFIG): string {
  return `projects/${config.projectId}/subscriptions/${config.pubSubSubscription}`;
}

export function getFullBigQueryTablePath(config: GcpTargetConfig = TARGET_GCP_CONFIG): string {
  return `${config.projectId}.${config.bigQueryDataset}.${config.bigQueryTable}`;
}

export function getGcsBucketUri(config: GcpTargetConfig = TARGET_GCP_CONFIG): string {
  return `gs://${config.gcsBucket}`;
}
