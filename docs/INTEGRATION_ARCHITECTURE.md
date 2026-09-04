# Gujarat Police CCTV / AI Platform — V0.7 Integration Architecture

## 1. Architectural Principles & Ownership

### 1.1 Edge-Authoritative Ingestion
In this architecture, **the Edge Agent — not the browser — owns camera and DVR/NVR integration**.

```
+------------------------+        +--------------------------+        +-------------------------+
| Physical Hardware Grid |        | Edge Agent Node          |        | Central Event Platform  |
| - ONVIF Profile S/T    | -----> | - Adapter Engine         | -----> | - Central Event Store   |
| - Raw RTSP Streams     | (LAN)  | - Local CV Inference     | (WAN)  | - God's Eye Service     |
| - Vendor VMS Gateways  |        | - Cryptographic Signer   |        | - Investigation Manager |
+------------------------+        +--------------------------+        +-------------------------+
                                                                                   |
                                                                                   v
                                                                      +-------------------------+
                                                                      | Web Operations Center   |
                                                                      | - Challenge Mode UI     |
                                                                      | - God's Eye Trajectory  |
                                                                      | - Fleet Health Monitor  |
                                                                      +-------------------------+
```

1. **Zero Browser Ingestion**: Browser clients NEVER directly connect to raw RTSP sockets, initiate ONVIF SOAP requests, or access proprietary camera APIs.
2. **Normalized Ingestion Boundary**: The Edge Agent ingests physical video streams, decodes keyframes, executes on-premises computer vision models, and dispatches cryptographically verified metadata events to Central.
3. **Bandwidth Efficiency**: Only telemetry, metadata alerts (ANPR, helmet violations, trajectory sightings), and forensic snapshot evidence traverse the edge-to-cloud link. High-bandwidth raw pixel transport is strictly localized to the edge local network.

---

## 2. Vendor-Agnostic Connector Layer

The platform standardizes heterogeneous video equipment across Gujarat's municipal surveillance infrastructure through a strict adapter abstraction layer:

### 2.1 Supported Adapter Contracts
- **`OnvifDVRAdapter`** (`IDVRAdapter`, `IOnvifDiscovery`):
  - Standardizes ONVIF Profile S (Live streaming) and Profile T (Advanced streaming / H.265 / analytics).
  - Handles WS-Discovery, PTZ token discovery, channel enumerations, and snapshot URL retrieval.
  - Formally isolates device communication behind `INTEGRATION READY / IMPLEMENTATION BOUNDARY`.
- **`RtspStreamAdapter`** (`ICameraStreamAdapter`):
  - Manages real-time streaming protocol (RTSP) session lifecycles over TCP/UDP transport.
  - Tracks frame timestamp arrival, jitter, packet loss rate, and connection health states (`CONNECTED`, `DEGRADED`, `DISCONNECTED`, `NO_STREAM`, `STALE`).
  - Enforces the architectural distinction: **RTSP URL Configured** vs. **RTSP Stream Actively Connected**.
- **`MockVendorVMSAdapter`** (`IVendorVMSAdapter`):
  - Multi-vendor gateway abstraction supporting integration with enterprise Video Management Systems (e.g., Milestone XProtect, Genetec Security Center, HikCentral, Dahua DSS).
  - Explicitly classified as `MOCK VMS ADAPTER — DEMONSTRATION ONLY` to clearly demarcate prototype code from hardened field adapters.

---

## 3. Discovery, Normalization & Registration Pipeline

### 3.1 Device Discovery (`EdgeDiscoveryService`)
- Network probes (WS-Discovery multicast, RTSP OPTIONS ping, VMS REST endpoints) yield raw hardware descriptors.
- Descriptors are canonically normalized into `DiscoveredVideoDevice`:
  - `deviceId`: Deterministic identifier (e.g., `DVR-GJ-AHM-001`)
  - `protocol`: `ONVIF` | `RTSP` | `VMS` | `SIMULATED`
  - `discoveryMethod`: `WS_DISCOVERY` | `RTSP_PROBE` | `VMS_API` | `MANUAL_CONFIG`
  - `channelsCount`: Total addressable video channels
  - `status`: `CONNECTED` | `DEGRADED` | `DISCONNECTED`
  - `integrationStatus`: `INTEGRATION_READY` | `SIMULATED` | `CONNECTED`

### 3.2 Channel Canonicalization & Deduplication
- Physical device channels are mapped directly into the system-wide `Camera` interface without state or location loss.
- Ingestion properties populated on every camera:
  - `sourceType`: Physical ingestion protocol (`ONVIF`, `RTSP`, `VMS`, `SIMULATED`)
  - `adapterType`: Concrete adapter binding (`OnvifDVRAdapter`, `RtspStreamAdapter`, etc.)
  - `streamState`: Real-time transport status
  - `protocolState`: Handshake negotiation state (`NEGOTIATED`, `DISCONNECTED`)
  - `discoveryMethod`: Ingress method used to catalog the camera
  - `integrationStatus`: Readiness classification
- **Idempotent Registration**: The registry strictly prohibits duplicate camera registration; repeated discovery scans preserve persistent identifiers and existing configuration overrides.

---

## 4. Safe Credential & Security Architecture

### 4.1 Strict Absence of Hardcoded Secrets
- **Zero Embedded Credentials**: No passwords, API secrets, private keys, or DVR access tokens exist in source code or client-side bundles.
- **Runtime Ingestion**: Device authentication credentials must be supplied at runtime via encrypted local environment variables or secure edge hardware keyrings (e.g., TPM / KMS).
- **Sanitized Telemetry**: Stream URLs containing basic authentication credentials (`rtsp://user:pass@host:port/`) are immediately sanitized to `rtsp://[REDACTED_CREDENTIALS]@host:port/` before logging or dispatching to central management layers.

### 4.2 Local CV Inference Provider Independence (`IAIInferenceProvider`)
- Optical inference (ANPR, vehicle classification, person tracking, helmet violation detection) is strictly decoupled from video stream ingestion.
- The `IAIInferenceProvider` contract allows swapping between:
  - Production on-premises acceleration (TensorRT, YOLOv8, OpenCV CUDA pipelines)
  - Synthetic simulation providers (`SyntheticAIProvider`)
- **Important**: Cloud LLMs (such as Gemini) are **never** utilized as per-frame CCTV edge computer vision detectors; edge nodes operate autonomously with zero cloud dependency during active monitoring.

---

## 5. System Readiness Classifications

The user interface and backend telemetry explicitly categorize all subsystems to ensure transparent operational truth:

| Status Badge | Meaning | Operational Scope |
| :--- | :--- | :--- |
| **IMPLEMENTED** | Fully operational, tested, and active in the current build. | Core Challenge Mode, God's Eye investigation pipeline, event store, deduplication, deterministic reset. |
| **INTEGRATION READY** | Formal interfaces, adapter contracts, and normalization pipelines complete; ready for live hardware deployment without architectural changes. | ONVIF Profile S/T adapter, RTSP transport client, Edge discovery registry, device normalization. |
| **SIMULATED** | Functional demonstration powered by deterministic synthetic datasets. | Synthetic AI inference, demo video playback, synthetic person trajectories (`P-DEMO-001`). |
| **FUTURE DEPLOYMENT** | Architecture designed and bounded; requires field infrastructure deployment. | Hardware TPM cryptographic key storage, physical GPU acceleration clusters, live municipal VMS interconnects. |

---

## 6. Safety, Privacy & Compliance Mandates

1. **Synthetic Identifiers**: All demonstration targets use synthetic identifiers (e.g., vehicle plate `GJ01AB1234`, synthetic person `P-DEMO-001`, edge node `GJ-AHMEDABAD-001`).
2. **No Real Surveillance Claims**: The platform strictly refrains from claiming live biometric recognition or real-world citizen tracking in demo mode.
3. **Forensic Evidence Verification**: All generated evidence snapshots are watermarked `SIMULATED DEMO EVIDENCE` and accompanied by a deterministic 64-character SHA-256 cryptographic digest for chain-of-custody verification.
4. **Deterministic Scenario Stability**: In Challenge Mode Scenario A, the system strictly reproduces the progression `CAM-007` -> `CAM-014` -> `CAM-023` -> `CAM-031`, with `CAM-014` remaining the sole rule-triggered alert.
