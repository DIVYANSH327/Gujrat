# Gujarat Police AI CCTV Command Center & Intelligence Fabric

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald.svg)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Statutory Standard](https://img.shields.io/badge/Statutory-BSA%202023%20Sec%2063-purple.svg)](https://indiacode.nic.in)
[![Cloud Scale](https://img.shields.io/badge/GCP-80k%2B%20CCTV%20Grid-orange.svg)](https://cloud.google.com)

## Authorship & Ownership

**Authored & Engineered by:** DIVYANSH Shrivastava  
© 2026 DIVYANSH Shrivastava — All Rights Reserved.  
*Gujarat Police On-Premise AI CCTV + Person + Vehicle Operational Intelligence Fabric.*

---

## Executive Overview

A high-throughput, vendor-agnostic edge-to-cloud CCTV intelligence platform architected for statewide deployment across 33 districts (80,000+ camera nodes). The system incorporates:

- **24/7 Autonomous Server-Side Inference**: Continuous background vehicle & person intelligence running independently of browser sessions.
- **Statewide ANPR & HSRP Rule 50 Analysis**: Anti-hallucination optical character recognition, font standard validation, and high-security registration plate verification.
- **God's Eye Multi-Camera Correlation**: Real-time cross-camera journey tracking, time-space graph analysis, and velocity estimation.
- **BSA 2023 Section 63 Evidence Vault**: Cryptographic SHA-256 tamper-evident sealing, RFC-3339 microsecond timestamps, and court-admissible certificate generation.
- **Google Cloud Platform (GCP) Scale Adapters**: Pub/Sub ingestion bus, Apache Beam Dataflow deduplication, BigQuery partitioned analytics, Cloud Storage (GCS) vault, and Cost Guard protection (~₹28,662 balance safe, ₹0.00 compute runaways).
- **Rule 16 Cleanup & Statutory Audit Protocol**: Automated teardown procedure for ephemeral POC resources with complete judicial record retention and certified audit reporting.

---

## System Architecture

```
[ CCTV Nodes / RTSP / ONVIF / VMS ]
                │
                ▼
┌───────────────────────────────────────────────────────────┐
│           Regional Edge Gateways (33 Districts)           │
│  • Frame Quality Scoring (Laplacian Blur Filter)         │
│  • Edge YOLOv8 & Plate Candidate Extraction               │
│  • Local SHA-256 Digest Sealing                           │
└───────────────────────────────┬───────────────────────────┘
                                │ CloudEvents (HMAC-SHA256)
                                ▼
┌───────────────────────────────────────────────────────────┐
│            Google Cloud Event Fabric & Scale Bus          │
│  • Google Cloud Pub/Sub (Asynchronous Ingestion)          │
│  • Apache Beam Dataflow (30s Sliding Window Deduplication)│
│  • Gemini Multimodal Vision & OmniRoute Dispatcher       │
│  • BigQuery Partitioned Dataset (sentinel_poc.events)     │
│  • Cloud Storage Vault (gs://sentinel-poc-evidence)       │
└───────────────────────────────┬───────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────┐
│             SCRB Central Command & Officer UI             │
│  • Live Geospatial Operations Grid                        │
│  • Vehicle & Person Investigation Dossier                 │
│  • System Health & Readiness Matrix                       │
│  • Rule 16 Cleanup & Statutory Audit Engine               │
└───────────────────────────────────────────────────────────┘
```

---

## Quickstart & Local Setup

### Prerequisites
- Node.js `v20.x` or `v22.x`
- npm `v10.x`+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/gujarat-police-cctv-ai-platform.git
cd gujarat-police-cctv-ai-platform
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*Note: API keys are handled server-side. For Google Gemini AI features, configure `GEMINI_API_KEY`.*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production & Cloud Run
```bash
npm run build
npm start
```

### 5. Run Automated Test Suite
Execute the full test suite (38 test assertions covering forensic alert truthfulness, visual alert status indicators, and Google Cloud scale adapters):
```bash
npm test
```

---

## Statutory Compliance (BSA 2023 Section 63)

Under **Section 63 of the Bharatiya Sakshya Adhiniyam, 2023**, electronic records submitted as judicial evidence must prove:
1. **Unbroken Chain of Custody**: Cryptographically logged from camera sensor to judicial vault.
2. **Cryptographic Integrity**: SHA-256 hash computed at edge capture time and verified against archive.
3. **Audit Trails**: Every review, enhancement, and export generates an immutable audit entry.
4. **Separation of Raw and Enhanced Frames**: Raw original evidence is preserved permanently without modification; AI overlays are segregated as derived artifacts.

---

## Rule 16: POC Cleanup & Final Audit Protocol

The platform implements the **Rule 16 Cleanup & Audit Protocol**:
- **Trigger**: Accessible via the **"Cleanup & Audit (Rule 16)"** button in the System Readiness View.
- **Teardown**: Purges ephemeral in-memory event spools, dead-letter retry queues, temporary Pub/Sub subscriptions, and Dataflow DirectRunner scratch memory.
- **Preservation**: Retains 100% of verified court evidence and SHA-256 root digests.
- **Settlement**: Confirms financial settlement (₹0.00 runaway compute) and generates an exportable/printable legal certificate.

---

## License & Intellectual Property

Proprietary Software — Authored and engineered by DIVYANSH Shrivastava. All rights reserved. Refer to `LICENSE.txt` for terms.
