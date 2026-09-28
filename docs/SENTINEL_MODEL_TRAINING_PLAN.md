# Sentinel Grid — Master Model Training & Customization Plan

**Project:** Gujarat Police Sentinel Grid  
**Author:** Principal AI/ML & Google Cloud Architect  
**Version:** 1.0  
**Date:** 2026-09-24  

---

## 1. Executive Summary & Training Principles

This document defines the comprehensive training, fine-tuning, and evaluation roadmap for the Sentinel Grid AI Fabric.

### Strict Governance Principles:
1. **Never fabricate training results or metrics:** No model is claimed as trained unless a real Google Cloud Vertex AI or local PyTorch/ONNX training run successfully converges and completes with verifiable evaluation artifacts.
2. **Prioritize Edge Efficiency:** High-throughput CCTV tasks (vehicle detection, plate localization, OCR) must train models capable of INT8 quantization for sub-20ms edge execution.
3. **Preserve Truth Semantics:** Model predictions must always include calibrated confidence intervals and map into canonical truth states (`OBSERVED`, `INFERRED`, `UNCERTAIN`, `NOT_AVAILABLE`, `NOT_READABLE`).
4. **Zero Cloud Lock-In for Critical Safety:** Edge nodes must function continuously offline with local model checkpoints.

---

## 2. Priority Candidate Analysis

### Candidate 1: `YOLOv8-Gujarat-Traffic` (Object Detection & Indian Vehicle Classification)
- **Target Component:** `VisionDetectionAgent` (`src/ai-agents/vision/VisionDetectionAgent.ts`)
- **Current Implementation:** Generic pre-trained COCO YOLOv8n (`/models/yolov8n.onnx`) routing with heuristic sub-class filtering.
- **Why Training is Needed:** Standard COCO models frequently misclassify Indian traffic modalities (e.g. auto-rickshaws as cars, scooters as bicycles, overloaded tractors as trucks, multi-rider two-wheelers).
- **Proposed Architecture:** YOLOv8m / YOLOv11m fine-tuned with 16 custom classes:
  - `CAR`, `SUV`, `SEDAN`, `MOTORCYCLE`, `SCOOTER`, `BUS`, `TRUCK`, `AUTO_RICKSHAW`, `AMBULANCE`, `POLICE_VEHICLE`, `PERSON`, `NUMBER_PLATE`, `HELMET`, `NO_HELMET`, `WRONG_WAY`, `RED_LIGHT_CROSSING`.
- **Google Cloud Service:** Vertex AI Custom Training Job (NVIDIA L4 / A100 GPU instance) with Artifact Registry container.
- **Training Data Required:** 25,000+ annotated Gujarat CCTV frames across varied lighting (day, dusk, night infrared, heavy monsoon rain, headlight glare).
- **Evaluation Metrics:** mAP@0.5, mAP@0.5:0.95, per-class Precision/Recall, inference latency on edge hardware (< 20ms per 1080p frame).
- **Integration Point:** Export to ONNX (`/models/sentinel_yolov8_gujarat.onnx`) and replace base YOLOv8n in `src/services/vision/fabric/engines/YoloVisionEngine.ts`.
- **Risk:** Class imbalance on emergency vehicles (`AMBULANCE`, `POLICE_VEHICLE`).
- **Mitigation:** Focal Loss weighting + synthetic data augmentation for rare classes.
- **Recommendation:** **PRIORITY 1** — Immediate candidate for dataset aggregation and cloud training.

---

### Candidate 2: `Indian-Plate-CRNN-OCR` (High Security & Damaged Plate OCR)
- **Target Component:** `PlateOcrAgent` (`src/services/vision/plateOcrAgent.ts`)
- **Current Implementation:** Tesseract LSTM with fallback to Cloud Vision OCR and Gemini Flash.
- **Why Training is Needed:** Tesseract has high error rates on embossed Indian font characters, skewed angle plates, dirty commercial plates, and high-speed motion blur. Cloud Vision API adds ~250ms network round-trip latency.
- **Proposed Architecture:** Convolutional Recurrent Neural Network (CRNN with Bi-LSTM & Connectionist Temporal Classification / CTC Loss) or lightweight Vision Transformer (TrOCR-Small).
- **Google Cloud Service:** Vertex AI Custom Training Job using PyTorch PyTorch Lightning.
- **Training Data Required:** 50,000+ synthetic and real cropped Indian license plates (all 38 Gujarat RTO series + other Indian states).
- **Evaluation Metrics:** Exact Plate Match Accuracy (%), Character Error Rate (CER), Unreadable Detection Precision (>99%).
- **Integration Point:** Integrated into `LocalPlateOcrService.ts` via ONNX WebAssembly / Native C++ bindings.
- **Risk:** Extreme visual degradation in unlit rural cameras.
- **Mitigation:** Multi-frame agreement voting in `TemporalPlateConsensusEngine.ts` remains active as deterministic arbiter.
- **Recommendation:** **PRIORITY 1** — Eliminates cloud API dependency and achieves 10x throughput.

---

### Candidate 3: `Vehicle-ReID-Metric-Net` (Cross-Camera Appearance Embeddings)
- **Target Component:** `CrossCameraVehicleCorrelationAgent` (`src/ai-agents/vehicle/CrossCameraVehicleCorrelationAgent.ts`)
- **Current Implementation:** Deterministic time-distance road graph calculations; basic color histogram matching.
- **Why Training is Needed:** In hit-and-run, stolen vehicle, or fake plate investigations, vehicles must be matched across camera networks even when plates are masked or unreadable.
- **Proposed Architecture:** ResNet50-IBN / OSNet backbone trained with Triplet Loss & Cross-Entropy Loss outputting normalized 512-dimensional visual embeddings.
- **Google Cloud Service:** Vertex AI Custom Training + Vertex AI Vector Search (Index Deployment) for sub-5ms nearest-neighbor search across 10,000,000+ vehicle sightings.
- **Training Data Required:** 15,000 vehicle identity tracks captured across multiple camera angles and lighting conditions (VeRi-776 / CityFlow style dataset tailored to Indian vehicles).
- **Evaluation Metrics:** Rank-1 Accuracy, Mean Average Precision (mAP@Rank-10), False Match Rate under camera viewpoint variations.
- **Integration Point:** `VehicleAttributeCorrelationService.ts` & `CrossCameraVehicleCorrelationAgent.ts`.
- **Risk:** Visual similarities between identical white hatchback models.
- **Mitigation:** Spatio-temporal road graph filters restrict candidate space to physically reachable corridors.
- **Recommendation:** **PRIORITY 2** — High forensic value for CID Crime and Special Operations Group (SOG).

---

### Candidate 4: `Gemini-SOP-Tuned-Reasoner` (Autonomous Police Dossier & Legal Grounding)
- **Target Component:** `InvestigationAgent` (`src/ai-agents/investigation/InvestigationAgent.ts`)
- **Current Implementation:** Few-shot prompt engineered Gemini 2.5 Flash / Pro.
- **Why Training is Needed:** General-purpose LLMs occasionally use non-statutory terminology or fail to cite exact Gujarat Police SOPs and Bharatiya Sakshya Adhiniyam (BSA 2023) / Bharatiya Nyaya Sanhita (BNS 2023) section numbers.
- **Proposed Architecture:** Vertex AI Supervised Fine-Tuning (SFT) on Gemini 2.5 Flash using curated Gujarat Police investigation case studies and legal statutes.
- **Google Cloud Service:** Vertex AI Model Garden & Gemini Supervised Fine-Tuning Service.
- **Training Data Required:** 1,500+ curated and verified (Input Evidence -> Output Officer Dossier) pairs approved by SCRB legal officers.
- **Evaluation Metrics:** Legal Citation Accuracy (>99.5%), Structured JSON-LD Schema Adherence (100%), Hallucination Rate (<0.1%), Uncertainty Adherence (explicitly outputting `NOT_AVAILABLE` when evidence is missing).
- **Integration Point:** `ReasoningProvider.ts` in `src/services/cloud/ReasoningProvider.ts`.
- **Risk:** Model overconfidence on ambiguous evidence.
- **Mitigation:** Strict schema enforcement requiring field-level truth status tags.
- **Recommendation:** **PRIORITY 2** — Elevates autonomous dossier quality without modifying backend plumbing.

---

## 3. Google Cloud Training Architecture & Pipeline

```text
 [Cloud Storage: Raw Video/Images]
               |
               v
 [Cloud Dataflow: Preprocessing & Frame Extraction]
               |
               v
 [Vertex AI Datasets: Managed Annotations (Train/Val/Test)]
               |
               v
 [Vertex AI Pipelines (Kubeflow / Custom Jobs)]
    - GPU: NVIDIA L4 / A100
    - Hyperparameter Tuning: Vizier
    - Experiment Tracking: Vertex AI Experiments
               |
               v
 [Vertex AI Model Registry]
    - Automated Evaluation Gate (Precision, Recall, Latency)
    - Metadata & Lineage Tracking (Section 63 BSA Compliance)
               |
    +----------+----------+
    |                     |
    v                     v
 [Edge Deployment]    [Cloud Endpoints]
 - INT8 ONNX Engine   - Vertex AI Endpoint
 - On-Prem Nodes      - Heavy Forensic Re-ID
```

---

## 4. Phase-Wise Execution Timeline

1. **Phase 1 (Current):** Repository Forensics, Agent Inventory, Dataset Governance & Evaluation Architecture.
2. **Phase 2:** Dataset Aggregation in Cloud Storage, Label Verification in `AiTrainingLab`, Vertex AI Pipeline Setup.
3. **Phase 3:** Training Runs for Priority 1 Models (`YOLOv8-Gujarat` and `Indian-Plate-OCR`), Quantitative Evaluation Verification, and Controlled Shadow Deployment.
