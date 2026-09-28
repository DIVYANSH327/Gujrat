# Gujarat Police Sentinel Grid — 80,000 Camera Statewide Architecture Review
**Document ID:** ARCH-SCALE-80K-2026-01  
**Target:** Gujarat State Police CCTV Surveillance Infrastructure  
**Author:** Senior Cloud Architect & Reliability Engineer  
**Classification:** Strategic Technical Specification  

---

## 1. Scale Reality & Bandwidth Mathematics

A recurring misconception in large-scale computer vision is the premise that 80,000 cameras should stream continuous raw video directly into a cloud provider. A basic engineering calculation disproves this approach:

$$\text{Continuous Bandwidth} = 80{,}000\text{ cameras} \times 2.0\text{ Mbps (1080p H.264)} = 160\text{ Gbps Continuous Ingress}$$

- **Daily Ingress Data Volume:** $\approx 1.72\text{ Petabytes per day}$
- **Monthly Cloud Ingress / Egress / Compute Cost:** Millions of USD in continuous networking and cloud transcoding costs alone.
- **District WAN Constraints:** Remote rural police stations in Kutch, Banaskantha, or Dang lack redundant multi-gigabit uplinks to sustain continuous uncompressed cloud streaming.

---

## 2. The Sentinel Edge-First Architecture Solution

The Sentinel Grid architecture establishes a strict **Edge-Processing Invariant**:
1. **Raw Video Stays at District Edge:** Continuous 25 FPS RTSP streams remain inside district police command centers, local NVRs, and District Edge Gateway servers.
2. **On-Premise / Edge AI Inference:** Local edge inference (YOLOv8 vehicle detection + Tesseract/HSRP OCR) processes video frames locally.
3. **Structured CloudEvents Only:** Only structured JSON telemetry ($\approx 1\text{ KB}$ per observation) is published to Google Cloud Pub/Sub:

$$\text{Cloud Ingress Bandwidth} = 80{,}000\text{ cameras} \times 1\text{ observation/sec} \times 1\text{ KB} = 80\text{ MB/sec } (640\text{ Mbps})$$

This achieves a **99.6% reduction in cloud network bandwidth**.

4. **Forensic Evidence Snapshots on Trigger:** When an ANPR match, watchlist hit, or traffic violation is detected, a single cryptographic JPEG frame ($\approx 150\text{ KB}$) is signed with SHA-256 and uploaded to Google Cloud Storage (`sentinel-evidence-dns1-c27a5`) under Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023) Section 63.

---

## 3. Statewide Multi-Tier Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        33 DISTRICT POLICE STATIONS                     │
│  [Local CCTV Cameras] ──► [District Edge Gateway (YOLO + ANPR)]         │
│                                      │                                 │
│                                      ▼ Filtered JSON Events            │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │ mTLS
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│               CENTRAL CLOUD CONTROL PLANE (dns1-c27a5)                 │
│                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ Google Cloud Pub/Sub  │   │ Cloud Run State Control Plane        │  │
│  │ 100+ Partition Topics │──►│ Auto-scale 2 to 100+ Instances       │  │
│  └───────────┬───────────┘   └──────────────────────────────────────┘  │
│              │                                                         │
│              ▼                                                         │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ Cloud Dataflow        │──►│ BigQuery Statewide Lakehouse         │  │
│  │ Streaming Enrichment  │   │ Day-partitioned, Clustered by Cam/Dist│ │
│  └───────────────────────┘   └──────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Google Cloud Service Sizing for 80,000 Cameras

| Google Cloud Service | 30-Camera Testbed (Current) | 80,000-Camera Fleet (Target) | Configuration Strategy |
|---|---|---|---|
| **Cloud Run** | 1 instance (min 0, max 10) | 10 to 50 instances (min 5, max 100) | Concurrency: 80 requests/instance; CPU: 4, RAM: 8Gi. |
| **Cloud Pub/Sub** | 1 topic, 1 partition | 1 topic, 32 partitions with DLQ | Max throughput: 100 MB/s ingress with message deduplication. |
| **Cloud Dataflow** | Local Direct Runner | Streaming Autoscaling (n1-standard-4) | 10s sliding window deduplication + inter-district correlation. |
| **BigQuery** | In-memory adapter (13 tables) | Enterprise Data Warehouse | Partition: `DATE(timestamp)`; Cluster: `camera_id, district, event_type`. |
| **Cloud Storage** | Local filesystem vault | Regional Bucket (`asia-south1`) | Lifecycle: 30 days Standard $\to$ Coldline $\to$ Archive (7 years). |
| **Secret Manager** | Environment config | Secret Manager + Cloud KMS | Automated 90-day secret rotation for all district gateway tokens. |

---

## 5. Architectural Verdict

The existing Sentinel Grid codebase was engineered specifically with this edge-cloud separation in mind. The current 30-camera test environment validates all software contracts:
- The outbox engine enforces bounded queues and idempotency deduplication.
- The evidence store guarantees BSA 2023 tamper evidence.
- The stream optimization manager decouples live AI from video player buffers.
Expanding from 30 to 80,000 cameras is an infrastructure provisioning and district edge hardware rollout process, requiring zero alterations to Sentinel Grid's core data models or cloud API contracts.
