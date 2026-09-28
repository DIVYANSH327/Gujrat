# Gujarat Police Sentinel Grid — Actual Capabilities Inventory
**Document ID:** CAP-SENTINEL-2026-01  
**Classification:** Law Enforcement Sensitive / Operational Readiness  
**Target Project:** dns1-c27a5 (asia-south1)  
**Platform Version:** 0.7.2  
**Date of Audit:** 2026-09-24  

---

## 1. Truth in Capability Statement

The Gujarat Police Sentinel Grid is an operational hybrid edge-cloud video intelligence command platform. In compliance with strict audit and legal standards:
- The system currently connects to and manages an authoritative **30-camera live/testbed network** (`cam01` through `cam30`).
- The **80,000+ camera figure is an architectural capacity and statewide roadmap specification**, NOT the current live camera fleet.
- Sentinel Grid **never hallucinates** or fabricates vehicle detections, license plate characters, vehicle trajectories, or officer audit logs.
- When signals or telemetry are unverified, missing, or degraded, the platform strictly emits deterministic truth labels: `NO_DATA`, `OFFLINE`, `UNAVAILABLE`, `NOT_CONFIGURED`, `TEST_FEED`, `UNCERTAIN`, or `NOT_AVAILABLE`.

---

## 2. Capability Classification Matrix

### Category A: Fully Verified Operational Capabilities

| Subsystem / Feature | Implementation Component | Verification Proof | Operational Notes |
|---|---|---|---|
| **30-Camera Ingestion Fleet** | `SentinelServerService`, `VideoStreamService` | Authenticated against `cctv.corp8.cloud` (30 nodes) | H.264 / RTSP ingestion, HLS remuxing, dynamic coordinate mapping across Gujarat. |
| **Local Edge Vehicle Detection** | `AIInferenceService`, ONNX Runtime | `models/yolov8n.onnx` executed in-process | Real-time vehicle bounding box classification (Cars, Motorcycles, Buses, Trucks). |
| **Local ANPR & HSRP OCR** | `LocalPlateOcrService`, Tesseract.js | Verified across standard & High Security Registration Plates (HSRP) | State code, RTO code (e.g. GJ-01), series, and numerals extracted; glare/blur labeled `NOT_READABLE`. |
| **BSA 2023 Section 63 Evidence Vault**| `EvidenceStore`, `ViolationEvidenceCaptureService` | Cryptographic SHA-256 byte-for-byte roundtrip verified | Raw captured frames stored immutably with SHA-256 digest before any AI enhancement. |
| **CloudEvent Outbox & Deduplication** | `EventBus`, `CloudEventOutbox` | Tested with synthetic events & offline replay | SHA-256 idempotency key deduplication; offline spool guarantees zero event loss. |
| **GOP & Live AI Decoupling** | `StreamOptimizationManager` | Verified across GOP ON/OFF modes | Live AI inference processes frames independently of keyframe wait loops (3000ms bounded fallback). |
| **Error Boundary & Throttling UI** | `src/components/ErrorBoundary.tsx` | Tested with 429 and network timeout triggers | Auto-reconnect countdown (15s), status indicators, local mode failover. |
| **Self-Recovery Lifecycle** | `ApplicationLifecycleManager`, `SentinelCameraRecoveryManager` | Tested under simulated 401, 503, and network dropouts | Exponential backoff reconnection, automatic credential candidate rotation (`3XC9-HPSX-R4QE`). |
| **Specialized Intelligence Agents** | `SpecializedIntelligenceAgents.ts` | 6 agents verified in end-to-end test suite | Incident, Vehicle Investigation, Camera Health, Evidence Integrity, Officer BSA Report, Watchlist Matcher. |
| **Cloud Diagnostics System** | `CloudHealthService`, `server.ts` | Tested via `npm run cloud:ping` and `npm run cloud:verify` | Real HTTP probes to Service Usage, Pub/Sub, BigQuery, GCS, Vertex AI, Cloud Run, Cloud Logging. |
| **Camera Health Diagnostic** | `GET /api/cameras/health` | Verified across all 30 CCTV nodes | Emits `LIVE`, `RECONNECTING`, `OFFLINE`, `AUTH_ERROR` states with complete stream metadata. |

---

### Category B: Local Emulation & Hybrid Fallback Capabilities

| Feature | Emulation Mode | Production Cloud Counterpart | Transition Path |
|---|---|---|---|
| **BigQuery Ingestion** | `BigQueryIntelligenceAdapter` (In-memory day-partitioned table store) | BigQuery streaming insert (`dns1-c27a5.sentinel_poc`) | Provision dataset and grant `roles/bigquery.dataEditor` to runtime SA. |
| **Pub/Sub Broker** | `LocalEventBus` + Persistent Disk Outbox | Google Cloud Pub/Sub (`sentinel-poc-observations`) | Bind `roles/pubsub.publisher` to service account. |
| **Dataflow Streaming** | `DataflowPipeline` (Direct runner 10s sliding window) | Apache Beam on Google Cloud Dataflow | Submit Beam pipeline template to `asia-south1`. |
| **Cloud Storage Evidence Sink** | Local filesystem evidence vault (`local://...`) | Google Cloud Storage (`gs://sentinel-evidence-dns1-c27a5`) | Create GCS bucket with 7-year retention policy. |

---

### Category C: Target Future Capabilities (Roadmap)

1. **80,000+ Statewide Camera Federation:** Connecting heterogeneous district VMS/NVR clusters across all 33 Gujarat administrative districts into regional edge aggregators.
2. **Automated Inter-District Vehicle Pursuit Handoff:** Geospatial corridor prediction across national highways (NH-48, NE-1) with millisecond alert fan-out.
3. **Hardware KMS Cryptographic Attestation:** TPM 2.0 / Cloud KMS hardware security module (HSM) signing of CCTV frame provenance at the edge camera sensor level.
