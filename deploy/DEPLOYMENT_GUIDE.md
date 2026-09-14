# Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
## Google Cloud Scale Architecture & Deployment Guide

This document outlines the architecture and deployment steps to operate Sentinel Grid in hybrid Edge-to-Cloud topology, scaling up to 80,000+ CCTV nodes statewide across 33 districts.

---

### 1. Architectural Overview & Bandwidth Reduction Math

```
[80,000 Heterogeneous Cameras (RTSP/ONVIF/DVR/NVR/VMS)]
                          │
                          ▼
           [33 Regional Edge Gateways]
    • Continuous RTSP Frame Ingestion
    • Frame Quality Engine & Sampling
    • Edge Vehicle & Plate Candidate Detection
    • Cryptographic SHA-256 Frame Sealing (BSA 2023)
                          │ (Only Structured Metadata + Keyframe Crops)
                          ▼
           [Google Cloud Ingestion Layer]
    • Cloud Run (Sentinel Master Orchestrator)
    • Cloud Pub/Sub (CloudEvents v1.0 Streaming Bus)
    • Cloud Storage (Tamper-Sealed Forensic Vault)
    • BigQuery (Day-Partitioned Analytical Lakehouse)
    • Gemini Models (Multimodal Spatial-Temporal Reasoning)
```

#### Bandwidth Economics:
- **Raw Streaming (Forbidden)**: `80,000 × 4 Mbps = 320 Gbps` (Requires ~₹48 Crore/month WAN infrastructure).
- **Edge-Filtered CloudEvents**: `80,000 × 1.2 events/min × 12 KB/crop = 1.15 Gbps` (**~99.6% Theoretical Bandwidth Savings**, where `1 - (1.15 / 320) = 99.64%`).

---

### 2. Google Cloud Infrastructure Setup

#### Step 2.1: Create Pub/Sub Topics & Subscriptions
```bash
# Set GCP Project
export PROJECT_ID="gujarat-police-cctv"
gcloud config set project $PROJECT_ID

# Create Event Ingestion Topic & Dead Letter Topic
gcloud pubsub topics create cctv-vehicle-events
gcloud pubsub topics create cctv-events-dead-letter

# Create BigQuery Streaming Subscription
gcloud pubsub subscriptions create cctv-events-bigquery-sub \
  --topic=cctv-vehicle-events \
  --dead-letter-topic=cctv-events-dead-letter \
  --max-delivery-attempts=5
```

#### Step 2.2: Provision BigQuery Dataset & Tables
```bash
# Create Dataset in asia-south1 (Mumbai)
bq mk --location=asia-south1 --dataset police_surveillance_mesh

# Deploy Tables with Day Partitioning (Execute Schema DDLs from BigQueryAdapter.ts)
bq query --use_legacy_sql=false '
CREATE TABLE IF NOT EXISTS `police_surveillance_mesh.vehicle_observations` (
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
CLUSTER BY camera_id, district, vehicle_type;
'
```

#### Step 2.3: Create Cloud Storage Bucket (Evidence Vault)
```bash
# Create Vault Bucket with Object Versioning and Retention Policy (BSA 2023 Compliance)
gsutil mb -l asia-south1 gs://gujarat-police-cctv-evidence-asia-south1/
gsutil versioning set on gs://gujarat-police-cctv-evidence-asia-south1/
gsutil retention set 7y gs://gujarat-police-cctv-evidence-asia-south1/
```

#### Step 2.4: Deploy to Cloud Run
```bash
# Build and Deploy via Cloud Build
gcloud builds submit --config=cloudbuild.yaml .
```

---

### 3. Statutory Compliance (Bharatiya Sakshya Adhiniyam, 2023)

All raw evidence stored in Sentinel Grid maintains cryptographic hash continuity:
1. **Original Evidence (`/original/`)**: Bit-for-bit raw camera frame SHA-256 seal. Never modified.
2. **Derived Crops (`/derived/`)**: Enhanced optical/super-resolution crops are stored separately with `enhancementType` and parent `sourceHash` cross-reference.
3. **Audit Records**: Every access, export, or query generates a cryptographic ledger entry in `police_surveillance_mesh.audit_events`.
