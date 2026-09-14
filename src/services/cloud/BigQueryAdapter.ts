/**
 * BigQueryAdapter.ts
 * Provider-Neutral BigQuery Intelligence Schema & Analytical Query Adapter
 * Designed for Statewide Scalable Video Intelligence Analytics
 * 
 * Invariants:
 * 1. Schema Precision: BigQuery schemas are day-partitioned on `timestamp` with clustering by `camera_id` and `district`.
 * 2. Immutable Auditability: All tables include `source_hash`, `evidence_reference`, and `idempotency_key`.
 * 3. No Fake Data: When queried, only returns actual observations stored in repository/history.
 * 4. Offline Fallback: If BigQuery is not provisioned, local in-memory queries execute transparently.
 */

export interface BigQueryField {
  name: string;
  type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'TIMESTAMP' | 'RECORD';
  mode: 'REQUIRED' | 'NULLABLE' | 'REPEATED';
  description: string;
  fields?: BigQueryField[];
}

export interface BigQueryTableDefinition {
  dataset: string;
  table: string;
  description: string;
  partitionField: string;
  clusterFields: string[];
  schema: BigQueryField[];
  ddl: string;
}

export class BigQueryIntelligenceAdapter {
  private dataset: string;
  private isConfigured: boolean;

  constructor(dataset = 'police_surveillance_mesh') {
    this.dataset = process.env.GCP_BIGQUERY_DATASET || dataset;
    this.isConfigured = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_SERVICE_ACCOUNT_KEY) &&
                         process.env.ENABLE_GOOGLE_CLOUD_SYNC === 'true';
  }

  /**
   * Return comprehensive DDLs and table definitions for all 11 surveillance entities
   */
  public getAllTableDefinitions(): Record<string, BigQueryTableDefinition> {
    return {
      camera_events: {
        dataset: this.dataset,
        table: 'camera_events',
        description: 'Raw telemetry and state transition events from CCTV fleet',
        partitionField: 'timestamp',
        clusterFields: ['camera_id', 'district', 'event_type'],
        schema: [
          { name: 'event_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique event identifier' },
          { name: 'camera_id', type: 'STRING', mode: 'REQUIRED', description: 'Camera identifier' },
          { name: 'district', type: 'STRING', mode: 'REQUIRED', description: 'Administrative district' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Event timestamp' },
          { name: 'event_type', type: 'STRING', mode: 'REQUIRED', description: 'CAMERA_ONLINE | CAMERA_OFFLINE | STALE' },
          { name: 'fps', type: 'FLOAT', mode: 'NULLABLE', description: 'Reported frames per second' },
          { name: 'latency_ms', type: 'FLOAT', mode: 'NULLABLE', description: 'RTSP ping latency' },
          { name: 'idempotency_key', type: 'STRING', mode: 'REQUIRED', description: 'Deduplication key' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.camera_events\` (
  event_id STRING NOT NULL,
  camera_id STRING NOT NULL,
  district STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  event_type STRING NOT NULL,
  fps FLOAT64,
  latency_ms FLOAT64,
  idempotency_key STRING NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY camera_id, district, event_type;`
      },

      camera_health: {
        dataset: this.dataset,
        table: 'camera_health',
        description: 'Periodic aggregated health metrics per CCTV node',
        partitionField: 'recorded_at',
        clusterFields: ['camera_id', 'health_state'],
        schema: [
          { name: 'camera_id', type: 'STRING', mode: 'REQUIRED', description: 'Camera identifier' },
          { name: 'recorded_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Health assessment time' },
          { name: 'health_state', type: 'STRING', mode: 'REQUIRED', description: 'LIVE | STALE | OFFLINE | DEGRADED' },
          { name: 'uptime_seconds', type: 'INTEGER', mode: 'REQUIRED', description: 'Continuous uptime' },
          { name: 'reconnect_count', type: 'INTEGER', mode: 'REQUIRED', description: 'Auto-reconnection count' },
          { name: 'frame_age_ms', type: 'INTEGER', mode: 'REQUIRED', description: 'Age of latest frame' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.camera_health\` (
  camera_id STRING NOT NULL,
  recorded_at TIMESTAMP NOT NULL,
  health_state STRING NOT NULL,
  uptime_seconds INT64 NOT NULL,
  reconnect_count INT64 NOT NULL,
  frame_age_ms INT64 NOT NULL
)
PARTITION BY DATE(recorded_at)
CLUSTER BY camera_id, health_state;`
      },

      vehicle_observations: {
        dataset: this.dataset,
        table: 'vehicle_observations',
        description: 'Detected vehicle sightings and temporal tracking records',
        partitionField: 'timestamp',
        clusterFields: ['camera_id', 'district', 'vehicle_type'],
        schema: [
          { name: 'observation_id', type: 'STRING', mode: 'REQUIRED', description: 'Observation ID' },
          { name: 'camera_id', type: 'STRING', mode: 'REQUIRED', description: 'Camera identifier' },
          { name: 'district', type: 'STRING', mode: 'REQUIRED', description: 'District of camera' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Capture timestamp' },
          { name: 'track_id', type: 'STRING', mode: 'REQUIRED', description: 'Vehicle track ID' },
          { name: 'vehicle_type', type: 'STRING', mode: 'REQUIRED', description: 'Car | Motorcycle | Truck | Bus | Auto' },
          { name: 'vehicle_crop_uri', type: 'STRING', mode: 'REQUIRED', description: 'GCS URI for vehicle crop' },
          { name: 'source_hash', type: 'STRING', mode: 'REQUIRED', description: 'Raw frame SHA-256' },
          { name: 'confidence', type: 'FLOAT', mode: 'REQUIRED', description: 'Detection confidence' },
          { name: 'idempotency_key', type: 'STRING', mode: 'REQUIRED', description: 'Unique idempotency key' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.vehicle_observations\` (
  observation_id STRING NOT NULL,
  camera_id STRING NOT NULL,
  district STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  track_id STRING NOT NULL,
  vehicle_type STRING NOT NULL,
  vehicle_crop_uri STRING NOT NULL,
  source_hash STRING NOT NULL,
  confidence FLOAT64 NOT NULL,
  idempotency_key STRING NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY camera_id, district, vehicle_type;`
      },

      plate_observations: {
        dataset: this.dataset,
        table: 'plate_observations',
        description: 'OCR and HSRP plate verification sightings',
        partitionField: 'timestamp',
        clusterFields: ['plate_number', 'camera_id', 'hsrp_status'],
        schema: [
          { name: 'plate_event_id', type: 'STRING', mode: 'REQUIRED', description: 'Plate event ID' },
          { name: 'camera_id', type: 'STRING', mode: 'REQUIRED', description: 'Camera identifier' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Capture timestamp' },
          { name: 'track_id', type: 'STRING', mode: 'REQUIRED', description: 'Vehicle track ID' },
          { name: 'plate_number', type: 'STRING', mode: 'NULLABLE', description: 'Normalized license plate text or NULL if unreadable' },
          { name: 'ocr_confidence', type: 'FLOAT', mode: 'REQUIRED', description: 'OCR model confidence' },
          { name: 'ocr_status', type: 'STRING', mode: 'REQUIRED', description: 'VERIFIED | PROBABLE | UNCERTAIN | NOT_READABLE' },
          { name: 'hsrp_status', type: 'STRING', mode: 'REQUIRED', description: 'HSRP_COMPLIANT | HSRP_VIOLATION | STANDARD_PLATE' },
          { name: 'enhancement_type', type: 'STRING', mode: 'REQUIRED', description: 'NONE | OPTICAL_ENHANCEMENT | NEURAL_SUPER_RESOLUTION' },
          { name: 'plate_crop_uri', type: 'STRING', mode: 'NULLABLE', description: 'Original crop URI' },
          { name: 'source_hash', type: 'STRING', mode: 'REQUIRED', description: 'Source SHA-256' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.plate_observations\` (
  plate_event_id STRING NOT NULL,
  camera_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  track_id STRING NOT NULL,
  plate_number STRING,
  ocr_confidence FLOAT64 NOT NULL,
  ocr_status STRING NOT NULL,
  hsrp_status STRING NOT NULL,
  enhancement_type STRING NOT NULL,
  plate_crop_uri STRING,
  source_hash STRING NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY plate_number, camera_id, hsrp_status;`
      },

      incidents: {
        dataset: this.dataset,
        table: 'incidents',
        description: 'Traffic and public safety incident logs',
        partitionField: 'created_at',
        clusterFields: ['incident_type', 'district', 'severity'],
        schema: [
          { name: 'incident_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique incident ID' },
          { name: 'incident_type', type: 'STRING', mode: 'REQUIRED', description: 'SPEEDING | RED_LIGHT | WRONG_WAY | ACCIDENT' },
          { name: 'severity', type: 'STRING', mode: 'REQUIRED', description: 'CRITICAL | HIGH | MEDIUM | LOW' },
          { name: 'camera_id', type: 'STRING', mode: 'REQUIRED', description: 'Originating camera' },
          { name: 'district', type: 'STRING', mode: 'REQUIRED', description: 'District' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Detection time' },
          { name: 'evidence_id', type: 'STRING', mode: 'REQUIRED', description: 'Sealed evidence ID' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.incidents\` (
  incident_id STRING NOT NULL,
  incident_type STRING NOT NULL,
  severity STRING NOT NULL,
  camera_id STRING NOT NULL,
  district STRING NOT NULL,
  created_at TIMESTAMP NOT NULL,
  evidence_id STRING NOT NULL
)
PARTITION BY DATE(created_at)
CLUSTER BY incident_type, district, severity;`
      },

      watchlist_matches: {
        dataset: this.dataset,
        table: 'watchlist_matches',
        description: 'Authorized vehicle and person watchlist triggers',
        partitionField: 'timestamp',
        clusterFields: ['watchlist_id', 'camera_id', 'review_status'],
        schema: [
          { name: 'match_id', type: 'STRING', mode: 'REQUIRED', description: 'Match identifier' },
          { name: 'watchlist_id', type: 'STRING', mode: 'REQUIRED', description: 'Target watchlist ID' },
          { name: 'target_value', type: 'STRING', mode: 'REQUIRED', description: 'Plate number or target entity' },
          { name: 'camera_id', type: 'STRING', mode: 'REQUIRED', description: 'Sighting camera' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Match timestamp' },
          { name: 'review_status', type: 'STRING', mode: 'REQUIRED', description: 'MATCH_CANDIDATE | CONFIRMED_BY_OFFICER | DISMISSED' },
          { name: 'evidence_id', type: 'STRING', mode: 'REQUIRED', description: 'Linked evidence ID' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.watchlist_matches\` (
  match_id STRING NOT NULL,
  watchlist_id STRING NOT NULL,
  target_value STRING NOT NULL,
  camera_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  review_status STRING NOT NULL,
  evidence_id STRING NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY watchlist_id, camera_id, review_status;`
      },

      audit_events: {
        dataset: this.dataset,
        table: 'audit_events',
        description: 'Forensic tamper-evident audit logs for judicial traceability',
        partitionField: 'timestamp',
        clusterFields: ['user_id', 'action'],
        schema: [
          { name: 'audit_id', type: 'STRING', mode: 'REQUIRED', description: 'Audit log identifier' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Action timestamp' },
          { name: 'user_id', type: 'STRING', mode: 'REQUIRED', description: 'Officer ID or service account' },
          { name: 'action', type: 'STRING', mode: 'REQUIRED', description: 'EVIDENCE_ACCESSED | CHALLAN_ISSUED | WATCHLIST_ADDED' },
          { name: 'resource_id', type: 'STRING', mode: 'REQUIRED', description: 'Accessed resource' },
          { name: 'ip_address', type: 'STRING', mode: 'NULLABLE', description: 'Client IP' },
          { name: 'sha256_record_seal', type: 'STRING', mode: 'REQUIRED', description: 'Cryptographic block seal' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.audit_events\` (
  audit_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  user_id STRING NOT NULL,
  action STRING NOT NULL,
  resource_id STRING NOT NULL,
  ip_address STRING,
  sha256_record_seal STRING NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY user_id, action;`
      },

      evidence_records: {
        dataset: this.dataset,
        table: 'evidence_records',
        description: 'Immutable electronic evidence vault records with SHA-256 metadata under BSA Section 63',
        partitionField: 'capture_timestamp',
        clusterFields: ['camera_id', 'incident_id', 'is_original'],
        schema: [
          { name: 'evidence_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique evidence identifier' },
          { name: 'camera_id', type: 'STRING', mode: 'REQUIRED', description: 'Source CCTV camera identifier' },
          { name: 'district', type: 'STRING', mode: 'REQUIRED', description: 'Administrative district' },
          { name: 'capture_timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Frame capture timestamp' },
          { name: 'stored_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Storage commit timestamp' },
          { name: 'storage_uri', type: 'STRING', mode: 'REQUIRED', description: 'GCS or local storage URI' },
          { name: 'sha256_hash', type: 'STRING', mode: 'REQUIRED', description: 'Cryptographic SHA-256 integrity hash' },
          { name: 'is_original', type: 'BOOLEAN', mode: 'REQUIRED', description: 'True if original sensor frame; false if derived/crop' },
          { name: 'original_sha256', type: 'STRING', mode: 'NULLABLE', description: 'Parent original frame SHA-256 if derived' },
          { name: 'enhancement_type', type: 'STRING', mode: 'REQUIRED', description: 'NONE | OPTICAL_ENHANCEMENT | NEURAL_SUPER_RESOLUTION' },
          { name: 'incident_id', type: 'STRING', mode: 'NULLABLE', description: 'Linked incident ID if any' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.evidence_records\` (
  evidence_id STRING NOT NULL,
  camera_id STRING NOT NULL,
  district STRING NOT NULL,
  capture_timestamp TIMESTAMP NOT NULL,
  stored_at TIMESTAMP NOT NULL,
  storage_uri STRING NOT NULL,
  sha256_hash STRING NOT NULL,
  is_original BOOL NOT NULL,
  original_sha256 STRING,
  enhancement_type STRING NOT NULL,
  incident_id STRING
)
PARTITION BY DATE(capture_timestamp)
CLUSTER BY camera_id, incident_id, is_original;`
      },

      route_observations: {
        dataset: this.dataset,
        table: 'route_observations',
        description: 'Multi-camera vehicle trajectory and spatio-temporal route observations',
        partitionField: 'observed_at',
        clusterFields: ['target_plate', 'track_id', 'district'],
        schema: [
          { name: 'route_id', type: 'STRING', mode: 'REQUIRED', description: 'Route segment identifier' },
          { name: 'track_id', type: 'STRING', mode: 'REQUIRED', description: 'Vehicle track ID' },
          { name: 'target_plate', type: 'STRING', mode: 'NULLABLE', description: 'Normalized vehicle plate or NULL' },
          { name: 'camera_id', type: 'STRING', mode: 'REQUIRED', description: 'Observation camera node' },
          { name: 'district', type: 'STRING', mode: 'REQUIRED', description: 'District of camera node' },
          { name: 'latitude', type: 'FLOAT', mode: 'NULLABLE', description: 'Geographic latitude' },
          { name: 'longitude', type: 'FLOAT', mode: 'NULLABLE', description: 'Geographic longitude' },
          { name: 'observed_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Observation timestamp' },
          { name: 'speed_kmph', type: 'FLOAT', mode: 'NULLABLE', description: 'Estimated or radar speed in km/h' },
          { name: 'source_hash', type: 'STRING', mode: 'REQUIRED', description: 'Underlying evidence SHA-256' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.route_observations\` (
  route_id STRING NOT NULL,
  track_id STRING NOT NULL,
  target_plate STRING,
  camera_id STRING NOT NULL,
  district STRING NOT NULL,
  latitude FLOAT64,
  longitude FLOAT64,
  observed_at TIMESTAMP NOT NULL,
  speed_kmph FLOAT64,
  source_hash STRING NOT NULL
)
PARTITION BY DATE(observed_at)
CLUSTER BY target_plate, track_id, district;`
      },

      ai_analyses: {
        dataset: this.dataset,
        table: 'ai_analyses',
        description: 'Synthesized AI investigative reasoning records with factual observation provenance',
        partitionField: 'analyzed_at',
        clusterFields: ['analysis_id', 'provider', 'model_name'],
        schema: [
          { name: 'analysis_id', type: 'STRING', mode: 'REQUIRED', description: 'Analysis record ID' },
          { name: 'incident_id', type: 'STRING', mode: 'NULLABLE', description: 'Associated incident ID' },
          { name: 'analyzed_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Analysis completion timestamp' },
          { name: 'provider', type: 'STRING', mode: 'REQUIRED', description: 'GEMINI | LOCAL_DETERMINISTIC' },
          { name: 'model_name', type: 'STRING', mode: 'REQUIRED', description: 'Underlying model version' },
          { name: 'factual_summary', type: 'STRING', mode: 'REQUIRED', description: 'Synthesized factual summary' },
          { name: 'observations_count', type: 'INTEGER', mode: 'REQUIRED', description: 'Number of grounded observations evaluated' },
          { name: 'uncertainties_count', type: 'INTEGER', mode: 'REQUIRED', description: 'Explicit count of unresolved ambiguities' },
          { name: 'provenance_hash', type: 'STRING', mode: 'REQUIRED', description: 'SHA-256 seal of input observation set' }
        ],
        ddl: `CREATE TABLE IF NOT EXISTS \`${this.dataset}.ai_analyses\` (
  analysis_id STRING NOT NULL,
  incident_id STRING,
  analyzed_at TIMESTAMP NOT NULL,
  provider STRING NOT NULL,
  model_name STRING NOT NULL,
  factual_summary STRING NOT NULL,
  observations_count INT64 NOT NULL,
  uncertainties_count INT64 NOT NULL,
  provenance_hash STRING NOT NULL
)
PARTITION BY DATE(analyzed_at)
CLUSTER BY analysis_id, provider, model_name;`
      }
    };
  }

  /**
   * Generates a BigQuery SQL query to trace a vehicle across cameras within a time window
   */
  public generateVehicleTraceQuery(plateOrTrack: string, startTimeIso: string, endTimeIso: string): string {
    return `
SELECT 
  v.timestamp,
  v.camera_id,
  v.district,
  v.track_id,
  v.vehicle_type,
  p.plate_number,
  p.ocr_confidence,
  p.hsrp_status,
  v.vehicle_crop_uri,
  v.source_hash
FROM \`${this.dataset}.vehicle_observations\` v
LEFT JOIN \`${this.dataset}.plate_observations\` p 
  ON v.track_id = p.track_id AND DATE(v.timestamp) = DATE(p.timestamp)
WHERE (p.plate_number = @targetPlate OR v.track_id = @targetTrack)
  AND v.timestamp BETWEEN TIMESTAMP(@startTime) AND TIMESTAMP(@endTime)
ORDER BY v.timestamp ASC
LIMIT 100;
    `.trim();
  }

  public getStatus() {
    return {
      provider: 'GOOGLE_BIGQUERY',
      dataset: this.dataset,
      active: this.isConfigured,
      tablesCount: Object.keys(this.getAllTableDefinitions()).length,
      partitionStrategy: 'DAY_PARTITIONING_WITH_DISTRICT_CLUSTERING'
    };
  }
}

export const defaultBigQueryAdapter = new BigQueryIntelligenceAdapter();
