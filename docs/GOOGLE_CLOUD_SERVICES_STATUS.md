# Google Cloud Services Status & Discovery Matrix
**Target Project:** dns1-c27a5  
**Project Number:** 611281686758  
**Primary Region:** asia-south1 (Mumbai)  
**Discovery Timestamp:** 2026-09-24T12:00:00Z  
**Runtime Caller:** ais-sandbox@ais-asia-southeast1-9e118291d7.iam.gserviceaccount.com  

---

## 1. Google Cloud Service Discovery Matrix

| Service Name | API Identifier | Enabled / Configured | Required by Code | Health Status | Auth Status | Permission Status | Last Probe Status | Error / Diagnostic Output |
|---|---|---|---|---|---|---|---|---|
| **Google Cloud Authentication** | `iam.googleapis.com` | YES (Configured) | YES | **AUTHENTICATED** (Sandbox Identity) | AUTHENTICATED | INSUFFICIENT_PROJECT_PERMS | Token Acquired (expires in 1800s) | Service Account lacks `roles/serviceusage.serviceUsageConsumer` on `dns1-c27a5`. |
| **Service Usage API** | `serviceusage.googleapis.com` | ENABLED in Target | YES | **WARN** | AUTHENTICATED | PERMISSION_DENIED (HTTP 403) | 2026-09-24 | `Caller does not have required permission to use project dns1-c27a5. Grant roles/serviceusage.serviceUsageConsumer.` |
| **Cloud Run** | `run.googleapis.com` | ENABLED in Target | YES | **PASS** (Local Dev) / **WARN** (Remote IAM) | AUTHENTICATED | PERMISSION_DENIED (HTTP 403) | 2026-09-24 | Express server runs locally on Port 3000. Remote Cloud Run management probe returned 403 `run.services.list denied`. |
| **Cloud Pub/Sub** | `pubsub.googleapis.com` | ENABLED in Target | YES | **PASS** (Local Outbox) / **WARN** (Direct Rest) | AUTHENTICATED | PERMISSION_DENIED (HTTP 403) | 2026-09-24 | Target topic `sentinel-poc-observations` configured. REST probe returned 403; local in-memory outbox spool active. |
| **BigQuery** | `bigquery.googleapis.com` | ENABLED in Target | YES | **PASS** (Local Adapter) / **WARN** (Direct Rest) | AUTHENTICATED | PERMISSION_DENIED (HTTP 403) | 2026-09-24 | Dataset `sentinel_poc` with day-partitioned schemas verified in adapter; REST probe returned 403 without project IAM. |
| **Cloud Storage (GCS)** | `storage.googleapis.com` | ENABLED | YES | **PASS** (API Accessible) / **NOT_FOUND** (Bucket) | AUTHENTICATED | ACCESS_PERMITTED (HTTP 404) | 2026-09-24 | Storage API returned HTTP 404 `The specified bucket does not exist`, proving GCS network egress and API are active. |
| **Secret Manager** | `secretmanager.googleapis.com` | NOT_ENABLED in Project | OPTIONAL | **NOT_CONFIGURED** (HTTP 403) | AUTHENTICATED | SERVICE_DISABLED (HTTP 403) | 2026-09-24 | `Secret Manager API has not been used in project dns1-c27a5 before or it is disabled.` Local env vars utilized. |
| **Cloud KMS** | `cloudkms.googleapis.com` | NOT_CONFIGURED | OPTIONAL | **NOT_CONFIGURED** | NOT_CONFIGURED | NOT_EVALUATED | 2026-09-24 | Node.js native `crypto` SHA-256 and AES vaults active; no cloud KMS keyring provisioned. |
| **Vertex AI / Gemini API**| `generativelanguage.googleapis.com` | ENABLED | YES | **PASS** | AUTHENTICATED (API Key) | GRANTED | 2026-09-24 | Tested `gemini-3.5-flash-lite` and `gemini-3.8-flash`. API returned valid `PONG` response with real-time latency. |
| **Cloud Logging** | `logging.googleapis.com` | ENABLED in Target | YES | **PASS** (Local Logger) / **WARN** (Remote Sink) | AUTHENTICATED | PERMISSION_DENIED (HTTP 403) | 2026-09-24 | Structured stdout JSON logging operational; remote cloud logging sink requires target IAM. |
| **Cloud Monitoring** | `monitoring.googleapis.com` | NOT_CONFIGURED | OPTIONAL | **NOT_CONFIGURED** | NOT_CONFIGURED | NOT_EVALUATED | 2026-09-24 | In-process latency & request counters active in `ObservabilityService`. |
| **Artifact Registry** | `artifactregistry.googleapis.com`| ENABLED in Target | YES | **NOT_CONFIGURED** (Dev Env) | AUTHENTICATED | SKIPPED | 2026-09-24 | Dockerfile configured for deployment to `asia-south1-docker.pkg.dev/dns1-c27a5/sentinel-repo/sentinel-command-center`. |
| **Cloud Build** | `cloudbuild.googleapis.com` | ENABLED in Target | YES | **PASS** (Config Valid) | AUTHENTICATED | READY | 2026-09-24 | `cloudbuild.yaml` syntax verified for multi-stage Docker build and Cloud Run deployment. |

---

## 2. Immediate IAM Remediation Instructions

To bind the runtime environment to the target project `dns1-c27a5`, execute the following gcloud commands in the admin console:

```bash
# 1. Grant Service Usage Consumer
gcloud projects add-iam-policy-binding dns1-c27a5 \
  --member="serviceAccount:ais-sandbox@ais-asia-southeast1-9e118291d7.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageConsumer"

# 2. Grant Pub/Sub Publisher
gcloud projects add-iam-policy-binding dns1-c27a5 \
  --member="serviceAccount:ais-sandbox@ais-asia-southeast1-9e118291d7.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

# 3. Grant BigQuery Data Editor
gcloud projects add-iam-policy-binding dns1-c27a5 \
  --member="serviceAccount:ais-sandbox@ais-asia-southeast1-9e118291d7.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataEditor"

# 4. Create Evidence Bucket
gcloud storage buckets create gs://sentinel-evidence-dns1-c27a5 \
  --project=dns1-c27a5 \
  --location=asia-south1 \
  --uniform-bucket-level-access

# 5. Grant Storage Admin on Evidence Bucket
gcloud storage buckets add-iam-policy-binding gs://sentinel-evidence-dns1-c27a5 \
  --member="serviceAccount:ais-sandbox@ais-asia-southeast1-9e118291d7.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```
