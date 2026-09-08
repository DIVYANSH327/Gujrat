# Government On-Premise AI CCTV & Operational Intelligence Fabric
## Architectural Specification & Enterprise Deployment Blueprint

**Document Version:** 2.3.0  
**Classification:** GOVERNMENT RESTRICTED / INTERNAL ON-PREMISE  
**Jurisdiction:** Gujarat Police State Intelligence & Traffic Management Grid  
**Legal Framework:** Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)  

---

## 1. Executive Overview & Guiding Directives

The **Government On-Premise AI CCTV + Person + Vehicle Intelligence Fabric** is an enterprise-grade, distributed edge-to-central intelligence platform engineered specifically for air-gapped and sovereign government network installations. 

### Core Architectural Mandates:
1. **Zero Cloud Dependency:** All video ingestion, computer vision inference, biometric matching, vehicle tracking, and forensic storage operate strictly within government-owned, physical on-premise hardware or secure State Wide Area Network (SWAN) intranets. No external cloud endpoints, proprietary third-party APIs, or telemetry beacons are permitted.
2. **Deterministic Governance & Provenance:** Every piece of intelligence processed by the system exposes its strict provenance:
   - `CAMERA_OBSERVED`: Ground-truth raw sensor optical capture.
   - `AI_INFERRED`: Computer vision model inference (never conflated with verified fact).
   - `HUMAN_VERIFIED`: Sworn law enforcement officer confirmation.
   - `HUMAN_DISPUTED`: Disputed or rejected candidate.
   - `EXTERNAL_AUTHORIZED`: Lawfully integrated departmental databases (e.g., eGujCop, VAHAN, eChallan).
   - `SIMULATED`: Clearly demarcated simulation or test telemetry.
3. **Strict Biometric Restraint:** "A face detection is NOT an identity. A similarity score is NOT identity certainty. A watchlist candidate is NOT confirmation." AI identity candidates never trigger automatic arrest, detention, or enforcement dispatch.

---

## 2. Hierarchical Deployment Topology

The fabric operates across a three-tier physical topology designed to scale to over 80,000 CCTV cameras across all 33 districts and 4 major municipal corporations (Ahmedabad, Surat, Vadodara, Rajkot).

```
+-----------------------------------------------------------------------------+
| TIER 1: STATE POLICE HEADQUARTERS CENTRAL COMMAND & HPC CLUSTER             |
| - High-Availability Application Server Containers (Podman / Docker EE)     |
| - State Forensic WORM NAS Vault (Ceph Replicated 3x / ZFS RAID-Z2)          |
| - Vector Search Index & Unified Intelligence Graph (Vehicle + Person)       |
| - Human Review Queue Dispatch & High-Priority Job Scheduler                 |
+---------------------------------------^-------------------------------------+
                                        | (Secure State SWAN Intranet / mTLS)
+---------------------------------------v-------------------------------------+
| TIER 2: DISTRICT COMMAND & CONTROL CENTERS (DCCC / NETRAM)                  |
| - Regional Agent Orchestrators & Edge Cluster Supervisors                   |
| - Local High-Resolution Best-Frame Caches (15-30 Days Raw Video)             |
| - Secondary WORM Storage Nodes & Officer Verification Workstations          |
+---------------------------------------^-------------------------------------+
                                        | (Local Optical Fiber Rings / RTSP / ONVIF)
+---------------------------------------v-------------------------------------+
| TIER 3: EDGE INGRESS GATEWAYS & FIELD JUNCTION OUTPOSTS                     |
| - Edge Ingestion Nodes (50 Cameras per Edge Unit, e.g. NVIDIA Orin / L4)   |
| - Hardware-Accelerated Decoding, H.264/H.265 Stream Parsing                |
| - Real-Time Optical Quality Filtering & Best-Frame Selector                 |
| - On-Edge ANPR & Facial Landmark Feature Extraction                         |
+-----------------------------------------------------------------------------+
```

---

## 3. Ingress & Edge Processing Architecture

### Edge Ingestion Node Specification
- **Hardware Profile:** Industrial fanless edge server (e.g., NVIDIA Jetson AGX Orin 64GB or 1U Rackmount with NVIDIA L4/A2).
- **Stream Ingress Protocol:** Direct ONVIF Profile S/G/T and RTSP streams from junction DVRs, NVRs, and IP cameras over isolated VLANs.
- **Hardware Decoding:** NVDEC hardware-accelerated decoding handling up to 50 concurrent 1080p @ 15–25 FPS video streams per edge appliance.
- **Edge Filtering Pipeline:**
  1. Optical Quality Evaluation (Sharpness index, illumination, motion blur).
  2. Bounding Box & Trajectory Association (Camera-local tracking).
  3. Best-Frame Extraction (Top 1–3 composite scored frames per target crossing).
  4. Vector Embedding & Normalization (512-dimension biometric features; normalized alphanumeric plates).
  5. **Bandwidth Optimization:** Instead of streaming 80,000 raw video feeds over the WAN (requiring ~160 Gbps), edge nodes transmit structured metadata events and cryptographic thumbnails, reducing statewide WAN bandwidth requirements to under 32 Mbps (**99.98% bandwidth savings**).

---

## 4. Compute & Container Runtime Environment

- **Container Runtime:** Rootless Podman (`podman-rootless-gov`) or Docker Enterprise Engine on hardened Linux distributions (Red Hat Enterprise Linux 9 / Ubuntu 24.04 LTS CIS Level 2 hardened).
- **Inference Runtime:** NVIDIA Triton Inference Server with TensorRT-LLM and ONNX Runtime backends.
- **Isolation Policy:** All container namespaces utilize read-only root filesystems, disabled host networking (except designated edge gateways), and dropped Linux capabilities (`CAP_NET_RAW`, `CAP_SYS_ADMIN` removed).
- **Offline / Air-Gapped Operation:** All container images, model weights, and application bundles are pre-compiled and signed using internal government cryptographic keys. No external registry lookups or package downloads occur during deployment or execution.

---

## 5. Network Security & Intrusion Containment

1. **Air-Gapped Intranet Operation:** Zero default internet gateways. Ingress and egress occur solely across private fiber routes within the Gujarat SWAN infrastructure.
2. **Mutual TLS (mTLS):** All inter-service communications between Edge Gateways, District Servers, and State Central Command enforce TLS 1.3 with AES-256-GCM cipher suites and internal Government PKI x509 certificates.
3. **Database Security & Secrets Management:** Secrets, encryption keys, and credentials are provided via secure hardware security modules (HSM) or system environment injection at container startup. No credentials or keys are hardcoded in application source code.
4. **Audit Logging & Tamper Evidence:** Every query, lookup, watchlist enrollment, and verification decision is recorded in an append-only audit stream with SHA-256 sequence linking.
