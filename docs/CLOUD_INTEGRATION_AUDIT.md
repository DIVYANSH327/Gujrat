# Gujarat Police Sentinel Grid — Forensic Cloud Integration Audit
**Document ID:** SEC-GCP-AUDIT-2026-01  
**Project ID:** dns1-c27a5  
**Project Number:** 611281686758  
**Primary Region:** asia-south1 (Mumbai)  
**Classification:** Law Enforcement Sensitive / Technical Architecture Audit  
**Audit Date:** 2026-09-24  
**Auditor:** Senior Cloud Architect & Reliability Engineer (Gujarat Police Sentinel Grid)

---

## 1. Executive Summary

A forensic codebase inspection was conducted across the **Gujarat Police Sentinel Grid** CCTV & AI Intelligence Platform (v0.7.2). Sentinel Grid is a hybrid edge-cloud video intelligence and Automated Number Plate Recognition (ANPR) platform designed for the Gujarat State Police.

### Critical Truth Baseline
- **Current Active Hardware Fleet:** The system connects to an authoritative **30-camera testbed** (`cam01` through `cam30`) hosted on `cctv.corp8.cloud` across major Gujarat police jurisdictions (Ahmedabad, Gandhinagar, Surat, Rajkot, Junagadh, Navsari, Patan, Banaskantha, Gandhidham, Kutch).
- **Scale Target vs. Reality:** The **80,000+ camera figure is a long-term statewide vision and architectural capacity target**, NOT the current live camera count. The application never claims or hallucinates live access to 80,000 cameras.
- **Truth Invariant:** When camera feeds, metadata, license plates, or vehicle trajectories are unverified or absent, the platform strictly emits deterministic status tags: `NO_DATA`, `OFFLINE`, `UNAVAILABLE`, `NOT_CONFIGURED`, `TEST_FEED`, `UNCERTAIN`, or `NOT_AVAILABLE`. Under no circumstances are live sightings fabricated.

---

## 2. Current Architecture Topology

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DISTRICT EDGE LAYER (Gujarat)                              │
│                                                                                        │
│  [30 CCTV Cameras: RTSP/H.264/HLS] ──► [Edge Ingestion & VideoStreamService]          │
│                                              │                                         │
│                                              ▼                                         │
│                                   [Local Frame Decoders]                               │
│                                              │                                         │
│                      ┌───────────────────────┴───────────────────────┐                 │
│                      ▼                                               ▼                 │
│        [YOLOv8n Vehicle Detector]                       [Tesseract ANPR OCR Engine]    │
│        (Local ONNX Runtime / CPU)                       (Local OCR Worker Pool)        │
│                      │                                               │                 │
│                      └───────────────────────┬───────────────────────┘                 │
│                                              │                                         │
│                                              ▼                                         │
│                            [BSA 2023 Section 63 Evidence Vault]                        │
│                            - Raw frame SHA-256 seal                                    │
│                            - Enhanced frame segregation                                │
│                            - Tamper-evident electronic record                          │
│                                              │                                         │
│                                              ▼                                         │
│                                   [CloudEvent Outbox Engine]                           │
│                                   - Idempotency Key (SHA-256)                          │
│                                   - Offline Spool Buffer (Zero-loss)                   │
└──────────────────────────────────────────────┼─────────────────────────────────────────┘
                                               │
                                               ▼ TLS / mTLS
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE CLOUD CONTROL PLANE (dns1-c27a5)                        │
│                                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐   ┌───────────────────────────┐  │
│  │   Cloud Run Backend   │   │   Cloud Pub/Sub      │   │   BigQuery Analytics      │  │
│  │   (Express + React)   │   │   Topic:             │   │   Dataset: sentinel_poc   │  │
│  │   Port: 3000          │   │   sentinel-poc-      │   │   Tables: Day-partitioned │  │
│  │   Region: asia-south1 │   │   observations       │   │   Cluster: camera_id      │  │
│  └───────────────────────┘   └──────────┬───────────┘   └─────────────▲─────────────┘  │
│                                         │                             │                │
│                                         ▼                             │                │
│                              ┌──────────────────────┐                 │                │
│                              │ Dataflow Streaming   ├─────────────────┘                │
│                              │ Enrich & Deduplicate │                                  │
│                              └──────────────────────┘                                  │
│                                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐   ┌───────────────────────────┐  │
│  │  Cloud Storage (GCS)  │   │   Secret Manager     │   │   Vertex AI / Gemini      │  │
│  │  Bucket:              │   │   corp8-credentials  │   │   Model: gemini-3.8-flash │  │
│  │  sentinel-evidence-   │   │   api-keys           │   │   Server-side only        │  │
│  │  dns1-c27a5           │   │   jwt-secrets        │   │   Safe Fallback Engine    │  │
│  └───────────────────────┘   └──────────────────────┘   └───────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Actual Dependencies vs. Configured Services

| Subsystem | Intended Cloud Service | Current Runtime State | Runtime Fallback Mechanism |
|---|---|---|---|
| **Event Bus** | Google Cloud Pub/Sub | Active Local Outbox & Bus | In-memory `LocalEventBus` + Persistent Outbox Spool |
| **Analytical Store** | Google Cloud BigQuery | DDLs Defined / Local In-Memory Store | `BigQueryAdapter` (Partitioned schemas + analytical querying) |
| **Evidence Repository** | Google Cloud Storage (GCS) | Local File Vault + GCS Adapter | `EvidenceStore` filesystem directory with SHA-256 integrity |
| **AI Reasoning** | Vertex AI (Gemini 3.8 Flash) | Server-Side @google/genai SDK | `LocalReasoningProvider` (deterministic rule-based fallback) |
| **Edge Vision Inference**| Local Edge TPU/GPU | ONNX Runtime (`yolov8n.onnx`) | Tesseract.js ANPR OCR + Sharp/JPEG image crops |
| **Streaming Pipeline** | Apache Beam on Cloud Dataflow | Direct Runner Emulation | `DataflowPipeline` (10s sliding window + deduplication) |
| **Application Hosting** | Cloud Run (asia-south1) | Express 4.21 + Vite 6 Container | Runs on Node 22 / Port 3000 |
| **Secrets Management** | Cloud Secret Manager | Environment Variables (`.env`) | Dynamic Credential Provider (`SentinelServerService`) |

---

## 4. Google Cloud Dependencies Forensic Findings

1. **Authentication Context (`Application Default Credentials`):**
   - The development runtime executes inside Google Cloud container sandbox `ais-sandbox@ais-asia-southeast1-9e118291d7.iam.gserviceaccount.com`.
   - Access token generation via `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token` is functional.
   - When calling `dns1-c27a5` resource endpoints directly, Google Cloud IAM rejects requests with `403 PERMISSION_DENIED` unless `dns1-c27a5` grants the `ais-sandbox` service account access, or service account key credentials for `dns1-c27a5` (`sentinel-runtime-sa@dns1-c27a5.iam.gserviceaccount.com`) are supplied in `GOOGLE_APPLICATION_CREDENTIALS`.

2. **Vertex AI & Gemini Integration:**
   - Client library: `@google/genai` (v2.4.0) with server-side proxying.
   - The deprecated `models/gemini-2.5-flash` and `models/gemini-2.5-flash-lite` endpoints return HTTP 404 with upstream deprecation notice.
   - Active available models confirmed via API discovery: `models/gemini-3.8-flash`, `models/gemini-3.5-flash-lite`, `models/gemini-flash-latest`.
   - Zero-AI-cost invariant: Gemini reasoning is off by default (`GEMINI_REASONING_ENABLED=false`), ensuring zero unintended API charges during standard 24/7 video ingestion.

3. **Cloud Storage (GCS):**
   - Bucket target: `sentinel-evidence-dns1-c27a5`.
   - Storage API is reachable (returns HTTP 404 bucket not found rather than network failure), indicating network egress to `storage.googleapis.com` is intact.

4. **Pub/Sub and BigQuery:**
   - Pub/Sub topics: `projects/dns1-c27a5/topics/sentinel-poc-observations`
   - Dead-Letter Topic: `projects/dns1-c27a5/topics/sentinel-poc-observations-dlq`
   - BigQuery Dataset: `dns1-c27a5.sentinel_poc`
   - Day-partitioned table definitions: `camera_observations`, `vehicle_observations`, `plate_observations`, `alerts`.

---

## 5. Security & Reliability Risks Analysis

| Risk Category | Risk Description | Severity | Current Mitigation |
|---|---|---|---|
| **Credential Exposure** | Operator passwords or API keys leaking into client UI bundle | HIGH | Client bundle uses zero GCP secrets. All external calls routed via backend Express endpoints (`/api/*`). |
| **Network Partition** | Disconnection between Gujarat district edge nodes and Cloud Run | MEDIUM | Edge outbox buffer spools events locally and flushes with SHA-256 deduplication on reconnection. |
| **API Quota Exceedance** | Rapid CCTV polling triggering HTTP 429 upstream rate limits | MEDIUM | `ErrorBoundary` with Connection Throttled recovery UI, SingleFlight request coalescing, and circuit breaker backoff. |
| **Evidence Tampering** | Evidence alteration under Section 63 Bharatiya Sakshya Adhiniyam, 2023 | CRITICAL | Immutable raw frame capture with mandatory SHA-256 hash calculated prior to any AI or enhancement. |
| **AI Hallucination** | Generative models inventing non-existent vehicle plates or suspects | HIGH | Anti-hallucination guardrails: Plates with glare/blur are stamped `NOT_READABLE`; no generative completion allowed. |

---

## 6. Audit Verdict

The repository architecture demonstrates high forensic discipline. Local offline fallbacks are fully decoupled, ensuring the Gujarat Police Command Center operates 24/7 even during total cloud disconnects. Real diagnostics tooling (`CloudHealthService`) must now be integrated to allow operators and SREs to probe and verify individual cloud services in real-time.
