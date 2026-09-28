# Sentinel Grid — AI Architecture & Event Flow Map

**Project:** Gujarat Police Sentinel Grid  
**Author:** Principal AI/ML & Google Cloud Architect  
**Document Version:** 1.0 (Forensic Mapping)  
**Date:** 2026-09-24  

---

## 1. High-Level Pipeline Overview

The Sentinel Grid architecture processes live RTSP/HLS feeds from city surveillance cameras across Gujarat, extracts visual evidence, validates high security registration plates (HSRP), verifies chain-of-custody under BSA 2023 Section 63, publishes structured events to Google Cloud, and enables autonomous investigation missions.

Below is the concrete mapping of the **REAL CURRENT PATH** discovered in the codebase compared against the **PROPOSED FUTURE PATH** for enterprise Google Cloud ML training and inference.

---

## 2. Real Current Path (As Discovered in Codebase)

```text
+---------------------------------------------------------------------------------------------------+
|                                      REAL CURRENT PIPELINE                                        |
+---------------------------------------------------------------------------------------------------+

 [Camera RTSP / HLS Stream] (30 City Cameras: Ahmedabad, Gandhinagar, Surat, Vadodara, Rajkot)
            |
            v
 [Frame Acquisition & Sampling] (PersistentVideoServerPipeline.ts / MobileFrameSampler.ts)
            |
            v
 [Edge Object Detection] (VisionDetectionAgent.ts -> Local ONNX YOLOv8n /models/yolov8n.onnx)
            |
            +---> Bounding Boxes (Vehicles, Persons, Plates)
            |
            v
 [Vehicle Patch Crop & Enhancement] (imageCropUtil.ts / FrameQualityEngine.ts)
            |
            v
 [Plate Candidate Detection] (PlateCandidateDetector.ts & Sobel Edge Aspect Filters)
            |
            v
 [Multi-Tier OCR Pipeline] (plateOcrAgent.ts)
            |
            +---> Tier 1: Local Tesseract.js WASM (eng.traineddata)
            +---> Tier 2: Google Cloud Vision API OCR (Text Annotations)
            +---> Tier 3: Gemini 2.5/3.8 Flash Multimodal Disambiguation (Damaged/Obscured Plates)
            |
            v
 [HSRP Verification Mesh] (HSRPAnalysisAgent.ts -> Ind Stripe + Hologram + Laser PIN checks)
            |
            v
 [Multi-Frame Consensus Engine] (TemporalPlateConsensusEngine.ts -> Positional Majority Voting)
            |
            v
 [Truth Status Tagging] (OBSERVED | INFERRED | UNCERTAIN | NOT_READABLE | NOT_AVAILABLE)
            |
            v
 [Cryptographic SHA-256 Vaulting] (EvidenceAgent.ts / GCPVisionRecognitionService.ts)
            |
            +---> BSA 2023 Section 63 Electronic Evidence Certificate Generated
            |
            v
 [Centralized Cloud Sync & Event Bus] (GoogleCloudPlateEventPipeline.ts / Cloud Pub/Sub)
            |
            +---> Google Cloud Storage (GCS) Immutable Evidence Vault (gs://sentinel-evidence-vault-...)
            +---> Google BigQuery Partitioned Analytics Table (sentinel_cctv_analytics.plate_events)
            +---> Firebase Firestore Operational State (ai-studio-gujrat-217890ee-4c63-4e61-90de-a0dc591996f6)
            |
            v
 [Autonomous Intelligence & Investigation] (InvestigationAgent.ts / VehicleInvestigationMissionService.ts)
            |
            +---> Gemini 2.5 Pro / Flash Reasoning Provider (Escape Route Prediction & Correlation)
            +---> Cross-Camera Spatio-Temporal Graph Correlation (VehicleCorrelationAgent.ts)
            +---> SCRB Criminal & Vehicle Watchlist Engine (WatchlistAgent.ts)
            |
            v
 [Officer Command Review Gate] (HumanReviewQueueService.ts / ChallanReviewService.ts)
            |
            +---> 100% Mandatory Human Officer Adjudication Before Action
            +---> E-Challan / Interception Dispatch to Field Patrol Units
```

---

## 3. Proposed Future Path (Enterprise Google Cloud ML & Training Integration)

```text
+---------------------------------------------------------------------------------------------------+
|                                  PROPOSED FUTURE ML PATHWAY                                       |
+---------------------------------------------------------------------------------------------------+

 [Authorized CCTV Video Archives] (City Surveillance Feeds with SCRB Authorization)
            |
            v
 [Cloud Storage Training Bucket] (gs://sentinel-training-datasets-scrb/raw_videos/)
            |
            v
 [Dataset Annotation & Governance] (AiTrainingLab.tsx + Vertex AI Dataset Annotations)
            |
            +---> Strict Train (70%) / Validation (20%) / Test (10%) Splits with Leakage Prevention
            +---> Versioned Metadata (dataset_v1.0_2026_09, SHA-256 Checksums)
            |
            v
 [Google Cloud Vertex AI Training Pipeline]
            |
            +--- [Track A: Custom YOLOv8/v11-Gujarat-Traffic] (Object Detection & Indian Vehicle Classes)
            |         |--> Trained on NVIDIA L4 / A100 GPUs via Vertex Custom Job
            |         |--> Exported to INT8 Quantized ONNX for Sub-15ms Edge Inference
            |
            +--- [Track B: Indian HSRP CRNN / TrOCR OCR Model] (Plate Character Recognition)
            |         |--> Trained with CTC Loss on 50,000+ Indian License Plates (Night, Rain, Glare)
            |         |--> Exported to ONNX & TensorRT for Zero-Cloud Latency
            |
            +--- [Track C: Vehicle Re-Identification (ReID) Metric Learning] (Cross-Camera Trajectory)
            |         |--> 512-D Triplet Loss Embedding Network for Vehicle Tracking across cameras
            |         |--> Integrated with Vertex AI Vector Search (ScaNN)
            |
            +--- [Track D: Supervised Fine-Tuned Gemini / Vertex RAG] (Police Dossiers & Legal Grounding)
                      |--> Vertex AI Gemini Tuning on Gujarat Police SOPs & IPC/BNS Law Sections
            |
            v
 [Vertex AI Model Registry] (Versioned, Metric-Gated Model Artifacts with Provenance)
            |
            v
 [Continuous Quantitative Evaluation Gate] (mAP@0.5 > 0.88, Plate Acc > 96.5%, No Fabrications)
            |
            v
 [Dual Deployment Target]:
            |
            +---> [Target 1: Edge / On-Prem Nodes] (Quantized ONNX Engines for Real-Time RTSP Streams)
            +---> [Target 2: Cloud Endpoints] (Vertex AI Endpoints for Complex Forensic Re-Analysis)
            |
            v
 [Integrated Sentinel Agent Mesh] (Zero disruption to existing truth semantics or officer workflows)
```

---

## 4. Key Architectural Guarantees Preserved

1. **Section 63 BSA 2023 Compliance:** Cryptographic SHA-256 evidence hashing and KMS verification are 100% isolated from ML uncertainty.
2. **Canonical Truth Statuses:** Every model output is tagged with standard truth markers (`OBSERVED`, `INFERRED`, `UNCERTAIN`, `NOT_AVAILABLE`, `NOT_READABLE`, `OFFLINE`).
3. **Mandatory Human Gate:** ML models only propose structured drafts; final legal and operational authority rests exclusively with verified officers.
4. **Resilience & Fallback:** If cloud connections or GPU endpoints are unavailable, edge heuristics seamlessly fallback to local deterministic baselines.
