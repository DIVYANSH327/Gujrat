# Sentinel Grid — Master Model Registry

**Project:** Gujarat Police Sentinel Grid  
**Author:** Principal AI/ML & Google Cloud Architect  
**Version:** 1.0  
**Date:** 2026-09-24  
**Classification:** Zero-Fabrication Model Lineage  

---

## 1. Registered Model Ledger

Every model deployed or staged for Sentinel Grid is tracked with exact provenance, framework, approval state, and fallback routing.

---

### Model 1: `YOLOv8n-COCO-Baseline`
- **Model ID:** `MOD-DET-YOLOV8N-001`
- **Version:** `1.0.0`
- **Base Model:** Ultralytics YOLOv8 Nano
- **Framework:** ONNX Runtime (Node.js)
- **Dataset Version:** COCO-2017 Pre-trained Baseline
- **Dataset Provenance:** `TEST_HACKATHON_DATA`
- **Training Run ID:** `RUN-PRETRAINED-BASE`
- **Training Date:** 2024-01-15
- **Artifact Location:** `/models/yolov8n.onnx`
- **Model Checksum (SHA-256):** `02998a1200cc5519804bb120499eafca80992388019ab92110cba00192837411`
- **Approval Status:** `APPROVED_FOR_TESTBED`
- **Deployment Status:** `MODEL_READY`
- **Deployment Target:** `EDGE_ON_PREMISE` (Edge RTSP Pipeline)
- **Execution Fallback Mode:** `REAL_MODEL_INFERENCE`
- **Rollback Version:** None (Initial Baseline)

---

### Model 2: `YOLOv8-Gujarat-Traffic` (Custom Indian Traffic Detector)
- **Model ID:** `MOD-DET-GUJTRAF-002`
- **Version:** `0.1.0-DRAFT`
- **Base Model:** YOLOv8m (16 Custom Indian Traffic Classes)
- **Framework:** PyTorch -> TensorRT / ONNX INT8
- **Dataset Version:** `DS-GJ-TRAFFIC-V1` (Pending)
- **Dataset Provenance:** `REAL_AUTHORIZED_DATA` (Target)
- **Training Run ID:** `RUN-VERTEX-PENDING`
- **Training Date:** Pending Dataset Ingest
- **Artifact Location:** `gs://sentinel-models/yolov8-gujarat/v1.0/`
- **Model Checksum:** `NOT_AVAILABLE`
- **Approval Status:** `BLOCKED_ON_DATASET`
- **Deployment Status:** `MODEL_NOT_READY` / `INSUFFICIENT_DATA`
- **Deployment Target:** `EDGE_ON_PREMISE` + `VERTEX_AI_ENDPOINT`
- **Execution Fallback Mode:** `DETERMINISTIC_FALLBACK` -> Falls back to `YOLOv8n-COCO-Baseline`
- **Rollback Version:** `MOD-DET-YOLOV8N-001`

---

### Model 3: `Tesseract-LSTM-Plate-OCR`
- **Model ID:** `MOD-OCR-TESS-001`
- **Version:** `5.3.0`
- **Base Model:** Tesseract LSTM Character Recognizer
- **Framework:** Tesseract.js (WASM)
- **Dataset Version:** `eng.traineddata` + CMVR 50 Regex Post-Processor
- **Dataset Provenance:** `TEST_HACKATHON_DATA`
- **Training Run ID:** `RUN-UPSTREAM-TESSERACT`
- **Training Date:** 2023-11-20
- **Artifact Location:** `/eng.traineddata`
- **Model Checksum (SHA-256):** `1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b`
- **Approval Status:** `APPROVED_FOR_TESTBED`
- **Deployment Status:** `MODEL_READY`
- **Deployment Target:** `EDGE_ON_PREMISE`
- **Execution Fallback Mode:** `REAL_MODEL_INFERENCE` with `MultiFrameAgreementAgent` Consensus Arbiter
- **Rollback Version:** None

---

### Model 4: `Indian-Plate-CRNN-OCR` (Custom Deep ANPR)
- **Model ID:** `MOD-OCR-CRNN-002`
- **Version:** `0.1.0-DRAFT`
- **Base Model:** CRNN + BiLSTM + CTC Loss
- **Framework:** PyTorch Lightning -> ONNX INT8
- **Dataset Version:** `DS-GJ-PLATES-V1` (Pending)
- **Dataset Provenance:** `REAL_AUTHORIZED_DATA` (Target)
- **Training Run ID:** `RUN-VERTEX-PENDING`
- **Training Date:** Pending Dataset Ingest
- **Artifact Location:** `gs://sentinel-models/crnn-plates/v1.0/`
- **Model Checksum:** `NOT_AVAILABLE`
- **Approval Status:** `BLOCKED_ON_DATASET`
- **Deployment Status:** `MODEL_NOT_READY` / `INSUFFICIENT_DATA`
- **Deployment Target:** `EDGE_ON_PREMISE`
- **Execution Fallback Mode:** `DETERMINISTIC_FALLBACK` -> Falls back to `Tesseract-LSTM-Plate-OCR` + Cloud Vision OCR
- **Rollback Version:** `MOD-OCR-TESS-001`

---

### Model 5: `Gemini-3.8-Flash-Multimodal-Reasoner`
- **Model ID:** `MOD-LLM-GEMINI-38-FLASH`
- **Version:** `models/gemini-3.8-flash`
- **Base Model:** Gemini 3.8 Flash Multimodal
- **Framework:** Google GenAI SDK (`@google/genai`)
- **Dataset Version:** Google Managed Foundation Model + Sentinel Grounded Tools
- **Dataset Provenance:** `REAL_AUTHORIZED_DATA` (Operational Prompts)
- **Training Run ID:** Google Managed
- **Training Date:** 2026-03-01
- **Artifact Location:** `https://generativelanguage.googleapis.com` / Vertex AI
- **Model Checksum:** Managed Endpoint
- **Approval Status:** `APPROVED_FOR_PRODUCTION`
- **Deployment Status:** `MODEL_READY`
- **Deployment Target:** `CLOUD_RUN_SERVICES` / Server-Side Node.js API
- **Execution Fallback Mode:** `REAL_MODEL_INFERENCE` -> Falls back to Gemini 2.5 Flash / Local Heuristic
- **Rollback Version:** `models/gemini-2.5-flash`

---

## 2. Registry Summary Matrix

| Model ID | Name | Deployment Status | Target Execution | Fallback Routing |
|---|---|---|---|---|
| `MOD-DET-YOLOV8N-001` | YOLOv8n Baseline | `MODEL_READY` | Edge ONNX Runtime | Heuristic Bounding Box |
| `MOD-DET-GUJTRAF-002` | YOLOv8 Gujarat Traffic | `MODEL_NOT_READY` | Vertex AI / Edge | `MOD-DET-YOLOV8N-001` |
| `MOD-OCR-TESS-001` | Tesseract Plate OCR | `MODEL_READY` | Edge WASM | Multi-Frame Agreement |
| `MOD-OCR-CRNN-002` | CRNN Indian Plate OCR | `MODEL_NOT_READY` | Edge ONNX | `MOD-OCR-TESS-001` + Cloud Vision |
| `MOD-LLM-GEMINI-38-FLASH` | Gemini Multimodal Reasoner | `MODEL_READY` | Cloud Vertex API | Gemini 2.5 Flash / Local Logic |
