# Sentinel Grid — Google Cloud Project Migration & Forensics Audit (Part 1)

**Audit Timestamp:** 2026-09-27T17:15:00Z  
**Canonical Target GCP Project:** `gujrat-cctv`  
**Authoritative Project Number:** `264410664731`  
**Primary Region:** `asia-south1` (Mumbai)  
**Target Cloud Run Service:** `sentinel-grid`  
**Target Production Runtime Service Account:** `sentinel-runtime@gujrat-cctv.iam.gserviceaccount.com`  

---

## 1. Migration Inventory & Resource Dependency Mapping

| Component | File / Path | Current Configuration | Old Project Reference Detected | Target Configuration | Migration Status | Risk Level | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Central GCP Target Config** | `src/services/cloud/TargetProjectConfig.ts` | `gujrat-cctv` / `264410664731` | None (Stale `792282820119` purged) | `gujrat-cctv` / `264410664731` / `asia-south1` | Verified Synchronized | Low | Authoritative configuration anchor |
| **Cloud Build Script** | `cloudbuild.yaml` | `sentinel-grid` in `asia-south1` | None | `asia-south1-docker.pkg.dev/$PROJECT_ID/sentinel-grid/sentinel-server` | Verified Synchronized | Low | Configured for `asia-south1` Artifact Registry |
| **Production Dockerfile** | `Dockerfile` | Multi-stage Node.js Alpine | None | Exposes port 3000 / listens on `PORT` / healthcheck on `/api/system/liveness` | Verified Synchronized | Low | Non-interactive production container |
| **Environment Template** | `.env.example` | `gujrat-cctv` / `264410664731` | None | All target variables predefined without secrets | Verified Synchronized | Low | Clean environment template |
| **Diagnostics UI Panel** | `src/components/dashboard/GcpPocDiagnosticsPanel.tsx` | `gujrat-cctv` / `264410664731` | None | Displays `264410664731` & `asia-south1` | Verified Synchronized | Low | Frontend display synced with backend |
| **Vertex AI Provider** | `src/services/cloud/ReasoningProvider.ts` | `asia-south1` (`gemini-1.5-flash` / `gemini-3.8-flash`) | None | Project: `gujrat-cctv`, Region: `asia-south1` | Verified Synchronized | Medium | Non-blocking `LocalReasoningProvider` fallback active |
| **BigQuery Adapter** | `src/services/cloud/BigQueryAdapter.ts` | Dataset: `sentinel_poc`, Table: `observations` | None | Partitioned DDL schemas target `gujrat-cctv.sentinel_poc` | Verified Synchronized | Low | In-memory query cache + remote sync outbox |
| **Pub/Sub Event Bus** | `src/services/cloud/EventBus.ts` | `projects/gujrat-cctv/topics/sentinel-poc-observations` | None | Fully qualified path targeting `gujrat-cctv` | Verified Synchronized | Low | In-memory CentralEventBus fallback active |
| **Evidence Store** | `src/services/cloud/EvidenceStore.ts` | Bucket: `sentinel-evidence-gujrat-cctv` | None | `gs://sentinel-evidence-gujrat-cctv` | Verified Synchronized | Low | Local SHA-256 vault active |
| **Server Entrypoint** | `server.ts` | `process.env.PORT || 3000` on `0.0.0.0` | None | Dynamic port binding, Express routes | Verified Synchronized | Low | All health probes operational |
| **E2E Test Suites** | `src/ai-agents/tests/*.test.ts` | `TargetProjectMigrationProof.test.ts` & `CompletePipelineEndToEnd.test.ts` | None | Tests validate `264410664731` and `gujrat-cctv` | Verified Synchronized | Low | 100% automated test pass |
| **Real Cloud Docs** | `docs/SENTINEL_REAL_CLOUD_VERIFICATION.md` | `gujrat-cctv` / `264410664731` | None | Updated forensic records | Verified Synchronized | Low | Documentation synced |

---

## 2. Environment Variables & Secret Analysis

### Canonical Target Variables:
* `NODE_ENV=production`
* `PORT=3000` (or injected by Cloud Run)
* `GOOGLE_CLOUD_PROJECT=gujrat-cctv`
* `GOOGLE_CLOUD_PROJECT_NUMBER=264410664731`
* `GOOGLE_CLOUD_REGION=asia-south1`
* `VERTEX_AI_LOCATION=asia-south1`
* `VERTEX_AI_ENABLED=true`
* `GCS_BUCKET=sentinel-evidence-gujrat-cctv`
* `BIGQUERY_DATASET=sentinel_poc`
* `BIGQUERY_TABLE=observations`
* `PUBSUB_TOPIC=sentinel-poc-observations`
* `PUBSUB_DLQ_TOPIC=sentinel-poc-observations-dlq`

### Secret Audit Findings:
* **Service Account Private Key JSON Files:** `NONE` (Zero `.json` private keys committed in source tree).
* **Hardcoded Passwords / Private Keys:** `NONE` (Source code uses environment variables and server-side proxies).
* **Client-Side Secret Leakage:** `NONE` (No `process.env` secrets or Node built-in modules bundled into client Vite build).

---

## 3. Cloud Resources Status & Verification (asia-south1)

| Cloud Resource | Resource Identifier | Referenced in Code | Local Fallback Operational | Remote GCP Status |
| :--- | :--- | :--- | :--- | :--- |
| **Cloud Run Service** | `sentinel-grid` (`asia-south1`) | Yes | Yes (Local Express) | `NOT_CREATED` (Pre-deployment) |
| **Artifact Registry** | `asia-south1-docker.pkg.dev/gujrat-cctv/sentinel-grid` | Yes | N/A | `UNVERIFIED / PENDING_DEPLOYER_IAM` |
| **Cloud Build** | `cloudbuild.googleapis.com` (`gujrat-cctv`) | Yes | N/A | `UNVERIFIED / PENDING_DEPLOYER_IAM` |
| **Cloud Storage** | `gs://sentinel-evidence-gujrat-cctv` | Yes | Yes (Local SHA-256 Vault) | `NOT_CREATED` |
| **BigQuery Dataset** | `gujrat-cctv.sentinel_poc.observations` | Yes | Yes (Local Query Cache) | `CONFIGURED_NOT_VERIFIED` |
| **Pub/Sub Topic** | `projects/gujrat-cctv/topics/sentinel-poc-observations` | Yes | Yes (CentralEventBus Outbox) | `CONFIGURED_NOT_VERIFIED` |
| **Vertex AI** | `asia-south1-aiplatform.googleapis.com/.../gemini-1.5-flash` | Yes | Yes (`LocalReasoningProvider`) | `BLOCKED` (HTTP 403 `IAM_PERMISSION_DENIED`) |
| **Runtime Service Account** | `sentinel-runtime@gujrat-cctv.iam.gserviceaccount.com` | Yes | N/A | Target Service Account |

---

## 4. AI Truth-Status Semantics & Provider Verification

* **Live Cloud Vertex AI:** Currently blocked by remote IAM permissions (`aiplatform.endpoints.predict`).
* **Local Deterministic Fallback (`LocalReasoningProvider`):** Verified 100% operational.
* **Truthfulness Labeling:** The system explicitly labels analytical outputs as `LOCAL_DETERMINISTIC` or `UNCERTAIN` when remote Vertex AI is unavailable, never fabricating cloud inference.
* **CCTV Node Status:** Fixed at 30 operational testbed nodes; 80,000 cameras is strictly modeled as an architectural scalability target (`ScaleSimulationService.ts`).
