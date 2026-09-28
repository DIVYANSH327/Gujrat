# Sentinel Grid — AI Agent Forensics & Training Design: Part 1 Final Report

**Project:** Gujarat Police Sentinel Grid (AI CCTV Command & Intelligence Fabric)  
**Author:** Principal AI/ML & Google Cloud Architect  
**Submission:** Part 1 of 3 (Forensic Repository Audit & Training Architecture)  
**Date:** 2026-09-24  

---

## 1. Executive Summary & Component Breakdown

A comprehensive forensic audit of the entire Sentinel Grid repository was conducted. All 42+ AI agents, vision services, orchestrators, deterministic validation engines, data pipelines, and UI workbenches were traced, evaluated, and classified according to their actual runtime implementation.

### Comprehensive Classification Breakdown:

| Primary Classification | Total Count | Discovered Components |
|---|---|---|
| **`TRAINABLE_MODEL`** | **4** | Custom YOLOv8-Gujarat Object Detector, Indian-Plate-CRNN OCR Model, Vehicle-ReID Metric Network, Gemini-SOP Tuned Reasoner. |
| **`MODEL_CONSUMER`** | **9** | `VisionDetectionAgent`, `VehicleClassificationAgent`, `PlateDetectionAgent`, `PlateOcrAgent`, `HSRPAnalysisAgent`, `FaceDetectionAgent`, `InvestigationAgent`, `GCPVisionRecognitionService`, `AIVisionAgent`. |
| **`RULE_BASED`** | **5** | `RoadSafetyAgent`, `TrafficViolationRuleEngine`, `EvidencePolicyEngine`, `ConfidencePolicyService`, `ANPRQualityService`. |
| **`DETERMINISTIC_ENGINE`** | **9** | `MultiFrameAgreementAgent`, `TemporalPlateConsensusEngine`, `EvidenceAgent` (BSA 2023 SHA-256), `EvidenceIntegrityAgent`, `CrossCameraVehicleCorrelationAgent`, `TrafficIntelligenceAgent`, `TrafficFlowAgent`, `FrameQualityEngine`, `SingleFlight`. |
| **`ORCHESTRATOR`** | **6** | `AIAgentOrchestrator`, `SentinelAgentMeshOrchestrator`, `VehicleIntelligenceAgent`, `AIAuditAgent`, `RegionalAgent`, `AgentSupervisorService`. |
| **`DATA_PIPELINE`** | **5** | `VehicleHistoryAgent`, `VehicleDataIntelligenceAgent`, `GoogleCloudPlateEventPipeline`, `BigQueryAdapter`, `DataflowPipeline`. |
| **`HUMAN_REVIEW_COMPONENT`** | **2** | `HumanReviewQueueService`, `ChallanReviewService`. |
| **`UI_ONLY`** | **2** | `AiTrainingLab.tsx`, `LiveStreamBackgroundAiPanel.tsx`. |
| **`LEGACY_DEMO`** | **2** | `SampleVideoGenerator.ts`, `DemoVideoService.ts`. |
| **TOTAL** | **44** | Complete System Coverage |

---

## 2. Discovered Trainable Candidates & Existing Models

### 2.1 Existing Models in Codebase:
1. `/models/yolov8n.onnx` — Baseline pre-trained generic COCO object detector (80 classes, float32/int8).
2. `eng.traineddata` — Tesseract LSTM character recognition language model.
3. `gemini-2.5-flash` / `gemini-3.8-flash` / `gemini-2.5-pro` — Google Cloud Vertex AI multimodal reasoning models.
4. Google Cloud Vision API OCR & Face Annotation models.

### 2.2 Discovered Trainable Candidates:
1. **`YOLOv8-Gujarat-Traffic`:** Custom 16-class Indian traffic and vehicle detector (Auto-rickshaws, customized two-wheelers, police/emergency vehicles, helmets).
2. **`Indian-Plate-CRNN-OCR`:** Specialized character recognition network trained on Indian high-security registration plates under high-glare and dirty conditions.
3. **`Vehicle-ReID-Metric-Net`:** 512-dimensional visual embedding model for tracking unreadable/fake-plated vehicles across city camera networks.
4. **`Gemini-SOP-Tuned-Reasoner`:** Supervised fine-tuning of Gemini Flash on Gujarat Police investigation SOPs, BSA 2023 Section 63 evidence rules, and statutory BNS/IPC penal codes.

---

## 3. Deterministic & Non-Trainable Invariants

The following components **must remain strictly deterministic** and should NOT be replaced with probabilistic ML:
- **`EvidenceAgent` / `EvidenceIntegrityAgent`:** Computes SHA-256 cryptographic hashes and KMS signatures for court admissibility under Section 63 BSA 2023.
- **`MultiFrameAgreementAgent` / `TemporalPlateConsensusEngine`:** Deterministic positional majority voting across consecutive video frames.
- **`CrossCameraVehicleCorrelationAgent`:** Physical road graph geometry, distance matrices, and maximum speed feasibility constraints.
- **`HumanReviewQueueService`:** Mandatory constitutional and statutory requirement for human officer sign-off before legal citations or field interdictions.

---

## 4. Dataset Status

### 4.1 Datasets Currently Available in Workspace:
- Annotation taxonomy definitions and test frames (`data_test_cam04.jpg`, `snap_cam*.jpg`, `enh_*.jpg`).
- Preset CCTV video descriptors and annotation schema in `AiTrainingLab.tsx`.
- Real-time live RTSP camera streams across 30 Gujarat city camera locations.

### 4.2 Missing Datasets Required for Production Training:
- Large-scale curated dataset of 25,000+ labeled frames for `YOLOv8-Gujarat-Traffic` across Gujarat road conditions.
- 50,000+ cropped Indian license plates representing all 38 Gujarat RTO districts (`GJ-01` through `GJ-38`).
- 15,000+ multi-camera vehicle identity tracks for Vehicle Re-ID training.
- 1,500+ verified police case study pairs for Gemini Supervised Fine-Tuning.

---

## 5. Google Cloud Capabilities & Prerequisites

The existing Google Cloud project (`gen-lang-client-0567918419` / `ai-studio-gujrat-217890ee-4c63-4e61-90de-a0dc591996f6`) supports:
- **Vertex AI Custom Training & Model Garden** (NVIDIA L4 / A100 GPU compute).
- **Google Cloud Storage (GCS)** for raw dataset hosting and versioned manifests.
- **Google BigQuery** for high-velocity plate event warehousing.
- **Cloud Pub/Sub** for streaming event ingestion.
- **Firebase Firestore** (`ai-studio-gujrat-217890ee-4c63-4e61-90de-a0dc591996f6`) for real-time applet state sync.

### Current Blockers:
- Raw CCTV training video archives require secure ingest and staging into designated Cloud Storage buckets (`gs://sentinel-training-datasets-scrb/`).
- Dataset annotation labeling must be completed via `AiTrainingLab` and exported with strict Train/Val/Test partitioning.

---

## 6. Recommended Training Order (Phased Execution)

1. **Phase 2 (Immediate):**
   - Ingest and structure dataset partitions in Cloud Storage with strict data governance (`SENTINEL_DATASET_GOVERNANCE.md`).
   - Setup Vertex AI Training pipeline configs and evaluation harnesses (`SENTINEL_AI_EVALUATION_PLAN.md`).
2. **Phase 3 (Training & Integration):**
   - Train `YOLOv8-Gujarat-Traffic` and `Indian-Plate-CRNN-OCR`.
   - Export INT8 quantized ONNX models to `/models/`.
   - Wire ONNX checkpoints into `VisionDetectionAgent` and `PlateOcrAgent` with zero breaking changes to existing APIs, truth statuses, or tests.
3. **Phase 4 (Advanced Forensics):**
   - Train `Vehicle-ReID-Metric-Net` with Vertex AI Vector Search integration.
   - Execute Supervised Fine-Tuning for `Gemini-SOP-Reasoner`.

---

## 7. Compliance Statement

- **No code was broken or deleted.**
- **No tests were invalidated.**
- **No fake training runs or artificial metrics were fabricated.**
- **All existing truth semantics (`OBSERVED`, `INFERRED`, `UNCERTAIN`, `NOT_AVAILABLE`, `NOT_READABLE`, `OFFLINE`) are 100% preserved.**

*Ready for user instructions on Part 2.*
