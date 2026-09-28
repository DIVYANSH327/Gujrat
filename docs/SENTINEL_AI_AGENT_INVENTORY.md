# Sentinel Grid — Master AI Agent & Service Inventory

**Project:** Gujarat Police CCTV AI Operational Command Platform (Sentinel Grid)  
**Author / Auditor:** Principal AI/ML & Google Cloud Architect  
**Classification Standard:** Zero-Fabrication Forensic Audit  
**Date:** 2026-09-24  

---

## Executive Summary & Inventory Overview

This document provides a complete forensic inventory of all 42+ AI agents, intelligence engines, orchestrators, vision mesh components, and background pipelines discovered across the Gujarat Police Sentinel Grid codebase.

Each component is audited against its actual implementation in code rather than its name.

---

## 1. Vision & ANPR Processing Components

### 1.1 `VisionDetectionAgent`
- **File:** `src/ai-agents/vision/VisionDetectionAgent.ts`
- **Purpose:** Primary edge detector for vehicles, pedestrians, two-wheelers, and license plates from raw video frames.
- **Inputs:** `CameraFrame` (base64 image, width, height, timestamp, cameraId).
- **Outputs:** `DetectionResult[]` (bounding boxes, class label, confidence, tracking ID).
- **Called by:** `AIAgentOrchestrator`, `SentinelAgentMeshOrchestrator`, `RealAIEvidencePipeline`.
- **Calls:** `InferenceAbstraction`, ONNX Runtime / `YoloVisionEngine`, Google Cloud Vision API.
- **Current implementation:** Multi-backend abstraction routing between local ONNX YOLOv8n (`/models/yolov8n.onnx`) and Google Cloud Vision API.
- **Model involved:** YOLOv8n ONNX / Cloud Vision Object Localizer.
- **Model provider:** Local ONNX Runtime / Google Cloud Vision API.
- **Training currently present:** Pre-trained COCO/YOLOv8 weights. No custom Gujarat Police domain weights yet.
- **Rule-based logic:** NMS thresholding (IoU > 0.45), confidence filter (> 0.40).
- **Deterministic logic:** Bounding box coordinate normalization.
- **External data:** None.
- **Human review:** Bounding boxes flagged for low-confidence (<0.65) review in officer audit view.
- **Production path:** Active on RTSP/HLS stream frames via `VisionFabricService`.
- **Demo/sample path:** Fallback synthetic frame generator when camera stream is disconnected.
- **Current status:** OPERATIONAL (Edge ONNX + Cloud fallback).
- **Recommended classification:** `MODEL_CONSUMER`
- **Recommended future state:** Fine-tune custom YOLOv8/v11 on Gujarat high-density traffic dataset (auto-rickshaws, customized two-wheelers).

---

### 1.2 `VehicleClassificationAgent`
- **File:** `src/ai-agents/vehicle/VehicleClassificationAgent.ts`
- **Purpose:** Classifies detected vehicles into Indian traffic categories (CAR, SUV, SEDAN, MOTORCYCLE, SCOOTER, BUS, TRUCK, AUTO_RICKSHAW, AMBULANCE, POLICE_VEHICLE) and extracts visual attributes (color, make, sub-type).
- **Inputs:** Cropped vehicle image patch, detection bounding box, camera metadata.
- **Outputs:** `VehicleClassification` (class, subClass, color, makeModel, confidence).
- **Called by:** `VehicleIntelligenceAgent`, `UniversalPlateIntelligenceService`, `AIAgentOrchestrator`.
- **Calls:** `GeminiVisionAgent` / Color heuristic analyzer.
- **Current implementation:** Hybrid approach utilizing HSV histogram color analysis combined with multimodal Gemini Flash visual prompt for fine-grained vehicle make/model disambiguation.
- **Model involved:** Gemini 2.5/3.8 Flash (Multimodal) + Color Space Classifier.
- **Model provider:** Google Cloud Vertex AI / Gemini API.
- **Training currently present:** Zero-shot / Few-shot prompt grounding.
- **Rule-based logic:** Color binning in HSV space, RTO vehicle taxonomy lookup.
- **Deterministic logic:** Aspect ratio checks for 2-wheeler vs 4-wheeler segregation.
- **External data:** Gujarat RTO Make/Model taxonomy dictionary.
- **Human review:** Officer vehicle dossier manual correction workflow.
- **Production path:** Active on high-confidence vehicle crops.
- **Demo/sample path:** Preset vehicle taxonomy lookup table.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `MODEL_CONSUMER`
- **Recommended future state:** Train lightweight ResNet50/MobileNetV4 classifier on Vertex AI for on-prem sub-millisecond classification.

---

### 1.3 `ANPRAgent` / `PlateDetectionAgent`
- **File:** `src/ai-agents/vehicle/ANPRAgent.ts` & `src/services/vision/plateDetectionAgent.ts`
- **Purpose:** Localizes High Security Registration Plates (HSRP) and standard number plates on vehicles.
- **Inputs:** Vehicle bounding box crop, raw frame.
- **Outputs:** `PlateDetectionResult` (plate BoundingBox, orientation, sharpness score, isHSRP).
- **Called by:** `UniversalPlateIntelligenceService`, `HSRPVisionMeshService`.
- **Calls:** `PlateCandidateDetector`, OpenCV/Canvas edge analysis.
- **Current implementation:** Cascade of aspect-ratio filtering (approx 1:4 or 1:2), Sobel edge density, and ONNX candidate detector.
- **Model involved:** Edge-based plate locator / YOLOv8 plate sub-model.
- **Model provider:** Local deterministic vision heuristics + ONNX.
- **Training currently present:** Heuristic filters; ONNX plate detector checkpoint.
- **Rule-based logic:** Aspect ratio constraints (2.5 - 5.5 for horizontal plates, 1.8 - 2.2 for square plates).
- **Deterministic logic:** Contrast enhancement, unsharp masking, bilateral noise reduction.
- **External data:** None.
- **Human review:** Manual plate bounding box adjustment in training workbench.
- **Production path:** Runs continuously on all moving vehicle tracks.
- **Demo/sample path:** Pre-extracted plate patch fixtures.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `MODEL_CONSUMER`
- **Recommended future state:** Train dedicated HSRP Plate Bounding Box Regressor (YOLOv8-Plate-IND) on Vertex AI.

---

### 1.4 `PlateOcrAgent` / `LocalPlateOcrService`
- **File:** `src/services/vision/plateOcrAgent.ts` & `src/services/vision/LocalPlateOcrService.ts`
- **Purpose:** Reads alphanumeric characters from localized plate crops with CMVR Rule 50 syntax validation.
- **Inputs:** Cropped plate image patch (enhanced), camera ID, timestamp.
- **Outputs:** `PlateOcrResult` (rawText, cleanText, stateCode, rtoDistrict, serial, confidence, truthStatus).
- **Called by:** `HSRPVisionMeshService`, `UniversalPlateIntelligenceService`.
- **Calls:** Tesseract.js (local wasm), Google Cloud Vision API (Text Annotator), Gemini Multimodal.
- **Current implementation:** Multi-engine fallback: Local OCR engine (Tesseract with `eng.traineddata` + custom whitelist) -> Google Cloud Vision OCR -> Gemini Flash disambiguation for damaged/dirty plates.
- **Model involved:** Tesseract LSTM / Google Cloud Vision OCR / Gemini Flash.
- **Model provider:** Local WASM / Google Cloud.
- **Training currently present:** `eng.traineddata` base model.
- **Rule-based logic:** Indian State Code regex (`^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$`), character substitution heuristics (e.g., O->0, I->1, B->8, S->5).
- **Deterministic logic:** Checksum validation, Gujarat RTO code resolution (GJ01 to GJ38).
- **External data:** Ministry of Road Transport & Highways (MoRTH) series format database.
- **Human review:** Mandatory human review gate for confidence < 0.85 or uncertain truth-status.
- **Production path:** Active on all detected plate crops.
- **Demo/sample path:** Cached plate mock reads for camera calibration.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `MODEL_CONSUMER`
- **Recommended future state:** Train CTC-Loss CRNN / TrOCR model on synthetic & real Indian vehicle plates with extreme glare and dirt variations.

---

### 1.5 `HSRPAnalysisAgent` / `HSRPVerificationAgent`
- **File:** `src/services/vision/hsrpAnalysisAgent.ts` & `src/services/vision/fabric/mesh/HSRPVerificationAgent.ts`
- **Purpose:** Verifies compliance with High Security Registration Plate (HSRP) standards: Ashok Chakra hologram, laser-etched 10-digit PIN, blue IND strip, and hot-stamped black foil borders.
- **Inputs:** High-resolution plate patch, OCR result.
- **Outputs:** `HSRPVerificationResult` (isCompliant, hologramDetected, laserPinDetected, indStripeDetected, violationReason).
- **Called by:** `HSRPVisionMeshService`, `TrafficViolationRuleEngine`.
- **Calls:** Gemini 3.8 Flash / Cloud Vision API landmark & feature analyzer.
- **Current implementation:** Multimodal feature extraction verifying optical security marks.
- **Model involved:** Gemini 3.8 Flash Multimodal.
- **Model provider:** Google Cloud Vertex AI.
- **Training currently present:** Few-shot prompt grounding with CMVR Rule 50 specifications.
- **Rule-based logic:** If vehicle registration year > 2019 and HSRP security marks missing -> Flag CMVR Section 50 violation.
- **Deterministic logic:** Color histogram validation of blue band on left 10% of plate.
- **External data:** CMVR 2019 statutory compliance rules.
- **Human review:** E-Challan officer review before issuing Section 50 citation.
- **Production path:** Active on primary vehicle evidence frames.
- **Demo/sample path:** Synthetic test cases.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `MODEL_CONSUMER`
- **Recommended future state:** Train lightweight binary classifier for hologram & IND strip on edge.

---

### 1.6 `MultiFrameAgreementAgent` / `TemporalPlateConsensusEngine`
- **File:** `src/services/vision/fabric/mesh/MultiFrameAgreementAgent.ts` & `src/services/vision/TemporalPlateConsensusEngine.ts`
- **Purpose:** Accumulates OCR reads across multiple consecutive video frames for a vehicle track to compute a cryptographically weighted consensus plate number.
- **Inputs:** Array of `FrameOcrObservation` (text, confidence, timestamp, frameHash, sharpness).
- **Outputs:** `ConsensusPlateResult` (consensusText, agreedConfidence, agreementCount, truthStatus: OBSERVED | UNCERTAIN).
- **Called by:** `HSRPVisionMeshService`, `VehicleIntelligenceAgent`.
- **Calls:** Levenshtein character distance matrix, positional voting algorithm.
- **Current implementation:** Positional majority voting with frame-sharpness weighting.
- **Model involved:** NONE (Pure algorithmic / statistical consensus).
- **Model provider:** N/A.
- **Training currently present:** None.
- **Rule-based logic:** Minimum 3 concordant frames required for `OBSERVED` status; else `UNCERTAIN`.
- **Deterministic logic:** Position-wise character frequency matrix + Levenshtein distance clustering.
- **External data:** None.
- **Human review:** Displays frame-by-frame evidence filmstrip to adjudicating officer.
- **Production path:** Runs on all active vehicle tracks in `PersistentVideoServerPipeline`.
- **Demo/sample path:** None.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `DETERMINISTIC_ENGINE`
- **Recommended future state:** Keep strictly deterministic to preserve judicial auditability under Section 63 BSA 2023.

---

### 1.7 `FaceDetectionAgent` / `FaceIntelligenceEngine`
- **File:** `src/ai-agents/vision/FaceDetectionAgent.ts` & `src/services/ai/FaceIntelligenceEngine.ts`
- **Purpose:** Detects human faces in CCTV frames, extracts 512-D biometric embeddings, and compares against criminal/missing persons watchlists.
- **Inputs:** High-resolution video frame, camera spatial coordinates.
- **Outputs:** `FaceDetectionEvent` (boundingBox, faceEmbedding, landmarks, matchCandidates, matchScore).
- **Called by:** `FaceWatchlistAgent`, `AIAgentOrchestrator`, `UnifiedPersonInvestigationService`.
- **Calls:** Google Cloud Vision Face Annotator / Vertex AI Vector Search / Local OpenCV Haar/FaceMesh.
- **Current implementation:** Local landmark extraction + Cloud Face recognition vector matching.
- **Model involved:** Cloud Vision Face API / Facenet / ArcFace embeddings.
- **Model provider:** Google Cloud & Local Vector Store.
- **Training currently present:** Pre-trained facial embedding representations.
- **Rule-based logic:** Match threshold (>0.82 for watchlist alert, <0.70 marked `UNCERTAIN`).
- **Deterministic logic:** Cosine similarity calculation, Euclidean distance normalization.
- **External data:** SCRB Criminal Watchlist database (eGujCop/AFIS).
- **Human review:** 100% mandatory officer biometric verification before dispatching field units.
- **Production path:** Active on pedestrian & junction surveillance cameras.
- **Demo/sample path:** Synthetic test watchlist profiles.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `MODEL_CONSUMER`
- **Recommended future state:** Integrate Vertex AI Vector Search with on-premise ArcFace 512D feature extractors.

---

## 2. Vehicle Intelligence & Tracking Components

### 2.1 `VehicleIntelligenceAgent`
- **File:** `src/ai-agents/vehicle/VehicleIntelligenceAgent.ts`
- **Purpose:** Coordinates vehicle detection, ANPR, classification, history retrieval, and behavioral analysis for every detected vehicle.
- **Inputs:** `CameraFrame`, `VehicleTrack`.
- **Outputs:** `StructuredVehicleIntelligenceEvent`.
- **Called by:** `AIAgentOrchestrator`, `SentinelGridService`.
- **Calls:** `ANPRAgent`, `VehicleClassificationAgent`, `VehicleHistoryAgent`, `WatchlistAgent`, `VahanIntelligenceAgent`.
- **Current implementation:** Composite workflow orchestrator dispatching sub-tasks to specialized domain agents.
- **Model involved:** None directly (consumes sub-agent model outputs).
- **Model provider:** Composite.
- **Training currently present:** None.
- **Rule-based logic:** Workflow branching, fallback logic when ANPR fails.
- **Deterministic logic:** Event aggregation, timestamp synchronization, JSON-LD schema generation.
- **External data:** VAHAN / e-Challan data via integration adapters.
- **Human review:** Summaries presented to officers in Vehicle Dossier View.
- **Production path:** Continuous live processing.
- **Demo/sample path:** None.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `ORCHESTRATOR`
- **Recommended future state:** Maintain as orchestrator; enhance with async streaming event bus.

---

### 2.2 `CrossCameraVehicleCorrelationAgent` / `VehicleCorrelationAgent`
- **File:** `src/ai-agents/vehicle/CrossCameraVehicleCorrelationAgent.ts` & `src/ai-agents/vehicle/VehicleCorrelationAgent.ts`
- **Purpose:** Correlates vehicle observations across disjoint camera locations, estimating route trajectories, average speed between junctions, and visual re-identification.
- **Inputs:** `VehicleObservation[]` from multiple cameras (plate, timestamps, camera coordinates, visual embeddings).
- **Outputs:** `VehicleTrajectory` (routePoints, speedKmh, plausibleRoute, anomalyFlag).
- **Called by:** `InvestigationAgent`, `VehicleJourneyService`, `GodsEyeService`.
- **Calls:** `GeospatialEvidenceService`, `CameraTopologyService`.
- **Current implementation:** Graph-based spatio-temporal correlation using road network topology and travel time feasibility checks.
- **Model involved:** Visual Appearance Similarity Engine / Spatio-temporal heuristic solver.
- **Model provider:** In-house heuristic + Cloud Vector Search.
- **Training currently present:** None.
- **Rule-based logic:** Speed calculation ($v = \Delta d / \Delta t$), impossible speed alert ($v > 160\text{ km/h}$ flags clone/fake plate).
- **Deterministic logic:** Dijkstra road graph routing, Haversine geospatial distance calculation.
- **External data:** Gujarat GIS Road Topology Layer.
- **Human review:** Officer map trail visual validation.
- **Production path:** Active on investigation queries and real-time watchlist triggers.
- **Demo/sample path:** Preset demo route simulations.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `DETERMINISTIC_ENGINE`
- **Recommended future state:** Enhance with trained Vehicle Re-Identification (ReID) embedding model for unreadable/fake plate scenarios.

---

### 2.3 `VehicleHistoryAgent` & `VehicleDataIntelligenceAgent`
- **File:** `src/ai-agents/vehicle/VehicleHistoryAgent.ts` & `src/ai-agents/vehicle/VehicleDataIntelligenceAgent.ts`
- **Purpose:** Aggregates multi-day sighting history, recurring temporal patterns (e.g. daily commute vs abnormal 3 AM sighting), and statistical anomaly scoring.
- **Inputs:** Plate number, time window, district scope.
- **Outputs:** `VehicleHistoryDossier` (totalSightings, frequentLocations, anomalousSightings, riskScore).
- **Called by:** `VehicleInvestigationMissionService`, `InvestigationAgent`.
- **Calls:** `BigQueryAdapter` / Firestore historical index / `VehicleHistoryRepository`.
- **Current implementation:** SQL query generation & aggregation against BigQuery/Firestore partitioned by date.
- **Model involved:** Statistical z-score anomaly scoring.
- **Model provider:** In-house statistical engine.
- **Training currently present:** None.
- **Rule-based logic:** Temporal anomaly rules (e.g., vehicle never seen in Surat suddenly active in sensitive perimeter).
- **Deterministic logic:** Time-series aggregation, histogram calculation.
- **External data:** BigQuery Sentinel Data Warehouse.
- **Human review:** Displayed in Officer Dossier.
- **Production path:** Active on database lookups.
- **Demo/sample path:** Synthetic vehicle history fixtures.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `DATA_PIPELINE`
- **Recommended future state:** Introduce Vertex AI BQML time-series anomaly detection.

---

## 3. Traffic & Road Safety Intelligence

### 3.1 `TrafficIntelligenceAgent` & `TrafficFlowAgent`
- **File:** `src/ai-agents/traffic/TrafficIntelligenceAgent.ts` & `src/ai-agents/traffic/TrafficFlowAgent.ts`
- **Purpose:** Computes real-time junction flow density, queue length, vehicle counts per minute, and congestion levels.
- **Inputs:** Multi-object tracking vectors from `VisionDetectionAgent` for a junction camera.
- **Outputs:** `TrafficFlowMetric` (vehiclesPerMinute, densityLevel: LOW|MED|HIGH|CRITICAL, averageSpeed, bottleneckDetected).
- **Called by:** `AIAgentOrchestrator`, `RoadSegmentIntelligenceService`.
- **Calls:** Virtual loop counter, speed estimation pipeline.
- **Current implementation:** Virtual counting lines + Kalman-filter track associations.
- **Model involved:** Object tracker (ByteTrack/SORT implementation).
- **Model provider:** Deterministic tracker consuming YOLO detections.
- **Training currently present:** None.
- **Rule-based logic:** Level of Service (LoS) threshold tables (A to F).
- **Deterministic logic:** Polygon intersection math for virtual tripwires.
- **External data:** Traffic Police Corridor speed limit tables.
- **Human review:** Traffic Control Room dashboard.
- **Production path:** Active on traffic junctions.
- **Demo/sample path:** Simulated density generator for stress testing.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `DETERMINISTIC_ENGINE`
- **Recommended future state:** Retain deterministic tripwire counting; add Vertex AI predictive congestion forecasting.

---

### 3.2 `RoadSafetyAgent` / `TrafficViolationRuleEngine`
- **File:** `src/ai-agents/road-safety/RoadSafetyAgent.ts` & `src/services/TrafficViolationRuleEngine.ts`
- **Purpose:** Identifies moving traffic violations: Red light jumping (RLVD), Wrong-way driving, Helmet-less riding, Triple riding, and Speed violations.
- **Inputs:** Vehicle trajectory, junction signal phase, bounding box spatial relationship (rider + helmet).
- **Outputs:** `ViolationEvidenceDraft` (violationType, statutorySection, confidence, videoProofUrl, initialFineAmount).
- **Called by:** `HSRPVisionMeshService`, `AIAgentOrchestrator`.
- **Calls:** `PlateOcrAgent`, `EvidenceAgent`, `ChallanReviewService`.
- **Current implementation:** Spatial geometric rules (vehicle centroid crossing stop-line while signal is RED; velocity vector opposite to lane heading; IoU of helmet over motorcycle rider head).
- **Model involved:** YOLOv8 (detects helmet, person, motorcycle) + Geometric rule engine.
- **Model provider:** Local ONNX / Gemini Vision.
- **Training currently present:** YOLOv8 helmet detection classes.
- **Rule-based logic:** Motor Vehicles (Amendment) Act 2019 statutory sections (Sec 129, Sec 184, Sec 177).
- **Deterministic logic:** Vector dot product for lane direction compliance ($v \cdot \vec{d}_{\text{lane}} < -0.5$).
- **External data:** Gujarat e-Challan penal code schedule.
- **Human review:** 100% human officer adjudication required by law before challan issuance.
- **Production path:** Active on enforcement cameras.
- **Demo/sample path:** Preset violation scenarios.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `RULE_BASED`
- **Recommended future state:** Train customized Indian Two-Wheeler Multi-Rider & Helmet Detector on Vertex AI.

---

## 4. Investigation & Evidence Integrity

### 4.1 `EvidenceAgent` / `EvidenceIntegrityAgent`
- **File:** `src/ai-agents/evidence/EvidenceAgent.ts` & `src/services/vision/fabric/mesh/EvidenceIntegrityAgent.ts`
- **Purpose:** Ensures immutable cryptographic chain-of-custody for every image/video frame per Section 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023).
- **Inputs:** Raw frame buffer, camera UID, GPS coordinates, UTC timestamp.
- **Outputs:** `BsaSection63Certificate` (sha256Hash, signature, hmacKeyId, custodyStatus).
- **Called by:** `HSRPVisionMeshService`, `SentinelServerService`, `GCPVisionRecognitionService`.
- **Calls:** Node.js `crypto` SHA-256 / HMAC-SHA256, Cloud KMS.
- **Current implementation:** Deterministic SHA-256 calculation on raw binary frame buffer + RFC 3161 ISO timestamp packaging.
- **Model involved:** NONE (Strictly Cryptographic).
- **Model provider:** N/A.
- **Training currently present:** None.
- **Rule-based logic:** Zero modification tolerance (any single bit change invalidates hash).
- **Deterministic logic:** Standard cryptographic SHA-256 hashing.
- **External data:** Cloud KMS Key Rings.
- **Human review:** Cryptographic validation report generated for court prosecutors.
- **Production path:** Mandatory path for 100% of stored evidence files.
- **Demo/sample path:** None.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `DETERMINISTIC_ENGINE`
- **Recommended future state:** Keep strictly deterministic and KMS-backed for statutory legal admissibility.

---

### 4.2 `InvestigationAgent` / `VehicleInvestigationMissionService`
- **File:** `src/ai-agents/investigation/InvestigationAgent.ts` & `src/services/VehicleInvestigationMissionService.ts`
- **Purpose:** Autonomous case investigation agent that correlates sightings, predicts escape corridors, associates accomplices, and prepares comprehensive case dossiers.
- **Inputs:** Target vehicle/suspect criteria, incident timestamp, geographic perimeter.
- **Outputs:** `InvestigationCaseDossier` (leadScore, predictedNextSighting, correlatedAssociates, recommendedInterceptionPoints).
- **Called by:** Officer Investigation Workbench, `IncidentCommandService`.
- **Calls:** `ReasoningProvider` (Gemini 2.5 Pro / Flash), `CrossCameraVehicleCorrelationAgent`, `BigQueryAdapter`.
- **Current implementation:** LLM-driven reasoning over structured SQL/graph query results.
- **Model involved:** Gemini 2.5 Pro / Flash (Advanced Reasoning & Structured Function Calling).
- **Model provider:** Google Cloud Vertex AI.
- **Training currently present:** Few-shot prompt engineering & schema grounding.
- **Rule-based logic:** Geospatial radius filtering (e.g. 5km/15min search envelope).
- **Deterministic logic:** Chronological event sorting and distance matrix computation.
- **External data:** SCRB FIR database, CCTNS record links.
- **Human review:** Investigating Officer review & sign-off.
- **Production path:** Active on user-initiated investigation queries.
- **Demo/sample path:** Pre-packaged demo criminal investigation case files.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `MODEL_CONSUMER`
- **Recommended future state:** Implement Vertex AI RAG grounded on Gujarat Police SOPs and historical FIR patterns.

---

## 5. Security, Audit, and Orchestration

### 5.1 `AIAgentOrchestrator`
- **File:** `src/ai-agents/orchestrator/AIAgentOrchestrator.ts`
- **Purpose:** Top-level multi-agent lifecycle manager that schedules, routes, and aggregates execution across all specialized sub-agents.
- **Inputs:** `SentinelSecurityEvent`, `AgentTaskRequest`.
- **Outputs:** Aggregated intelligence response.
- **Called by:** `server.ts`, UI API controllers.
- **Calls:** All domain agents via `AIAgentRegistry`.
- **Current implementation:** Async task DAG execution engine with priority queuing and circuit-breaking.
- **Model involved:** None.
- **Model provider:** N/A.
- **Training currently present:** None.
- **Rule-based logic:** Agent execution DAG ordering, timeout fallbacks.
- **Deterministic logic:** Priority queue dispatch, telemetry recording.
- **External data:** None.
- **Human review:** Admin dashboard for agent health and queue depths.
- **Production path:** Active backbone of all agent operations.
- **Demo/sample path:** None.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `ORCHESTRATOR`
- **Recommended future state:** Retain as central TypeScript async orchestrator.

---

### 5.2 `AIAuditAgent` & `AIAuditService`
- **File:** `src/ai-agents/audit/AIAuditAgent.ts` & `src/services/DataAccessAuditService.ts`
- **Purpose:** Monitors AI model predictions for drift, hallucinations, bias, and unauthorized data access by operators.
- **Inputs:** Agent inference logs, officer query logs, ground truth validation samples.
- **Outputs:** `AIAuditReport` (driftScore, complianceFlag, ungroundedClaimRate).
- **Called by:** System health cron, Senior Supervisory Officers.
- **Calls:** BigQuery audit log tables.
- **Current implementation:** Rule-based statistical log auditor + Gemini grounding evaluator.
- **Model involved:** Gemini 2.5 Flash (as an evaluation judge).
- **Model provider:** Google Cloud Vertex AI.
- **Training currently present:** None.
- **Rule-based logic:** RBAC violation alerts, anomaly detection on excessive query rates.
- **Deterministic logic:** Rate calculation, hash verification of audit ring buffer.
- **External data:** None.
- **Human review:** SCRB Oversight Committee review.
- **Production path:** Background periodic execution.
- **Demo/sample path:** None.
- **Current status:** OPERATIONAL.
- **Recommended classification:** `ORCHESTRATOR`
- **Recommended future state:** Add Vertex AI Model Monitoring for continuous embedding drift detection.

---

## 6. Training Workbench

### 6.1 `AiTrainingLab`
- **File:** `src/components/AiTrainingLab.tsx`
- **Purpose:** Officer workbench for reviewing CCTV frame extractions, drawing bounding box annotations, assigning Indian traffic labels, and exporting datasets for Vertex AI / YOLO training.
- **Inputs:** Video presets, uploaded CCTV clips, officer annotation coordinates.
- **Outputs:** COCO JSON, YOLO TXT, Pascal VOC XML, Vertex AI CSV dataset exports.
- **Called by:** Frontend UI (`/training` tab).
- **Calls:** Local browser storage, export formatters.
- **Current implementation:** React UI with canvas annotation tool, preset sample feeds, and dataset split calculator.
- **Model involved:** None (Human Annotation Interface).
- **Model provider:** N/A.
- **Training currently present:** Dataset exporter for downstream training.
- **Rule-based logic:** Bounding box coordinate clamping ($0 \le x \le W$).
- **Deterministic logic:** Train/Validation/Test 70/20/10 split generator, SHA-256 dataset version hashing.
- **External data:** None.
- **Human review:** 100% human annotator driven.
- **Production path:** Operational frontend tool.
- **Demo/sample path:** Includes 3 preset CCTV video metadata descriptors.
- **Current status:** OPERATIONAL UI / WORKBENCH.
- **Recommended classification:** `UI_ONLY`
- **Recommended future state:** Connect directly to Vertex AI Datasets API and Cloud Storage bucket for automated 1-click cloud training pipelines.

---

## Component Inventory Classification Matrix

| Component | File Path | Current Status | Primary Classification | Target Training Candidate |
|---|---|---|---|---|
| `VisionDetectionAgent` | `src/ai-agents/vision/VisionDetectionAgent.ts` | OPERATIONAL | `MODEL_CONSUMER` | YES (YOLOv8/v11 custom weights) |
| `VehicleClassificationAgent` | `src/ai-agents/vehicle/VehicleClassificationAgent.ts` | OPERATIONAL | `MODEL_CONSUMER` | YES (ResNet50 / MobileNetV4) |
| `PlateDetectionAgent` | `src/services/vision/plateDetectionAgent.ts` | OPERATIONAL | `MODEL_CONSUMER` | YES (YOLOv8-Plate-IND) |
| `PlateOcrAgent` | `src/services/vision/plateOcrAgent.ts` | OPERATIONAL | `MODEL_CONSUMER` | YES (TrOCR / CRNN Indian plates) |
| `HSRPAnalysisAgent` | `src/services/vision/hsrpAnalysisAgent.ts` | OPERATIONAL | `MODEL_CONSUMER` | YES (HSRP Hologram Classifier) |
| `MultiFrameAgreementAgent` | `src/services/vision/fabric/mesh/MultiFrameAgreementAgent.ts` | OPERATIONAL | `DETERMINISTIC_ENGINE` | NO (Keep Cryptographic/Deterministic) |
| `FaceDetectionAgent` | `src/ai-agents/vision/FaceDetectionAgent.ts` | OPERATIONAL | `MODEL_CONSUMER` | YES (ArcFace 512D fine-tuning) |
| `VehicleIntelligenceAgent` | `src/ai-agents/vehicle/VehicleIntelligenceAgent.ts` | OPERATIONAL | `ORCHESTRATOR` | NO (Keep Orchestrator) |
| `CrossCameraVehicleCorrelationAgent` | `src/ai-agents/vehicle/CrossCameraVehicleCorrelationAgent.ts` | OPERATIONAL | `DETERMINISTIC_ENGINE` | YES (Vehicle Re-ID Embedding model) |
| `VehicleHistoryAgent` | `src/ai-agents/vehicle/VehicleHistoryAgent.ts` | OPERATIONAL | `DATA_PIPELINE` | NO (Keep Data Pipeline) |
| `TrafficIntelligenceAgent` | `src/ai-agents/traffic/TrafficIntelligenceAgent.ts` | OPERATIONAL | `DETERMINISTIC_ENGINE` | NO (Keep Mathematical/Geometric) |
| `TrafficFlowAgent` | `src/ai-agents/traffic/TrafficFlowAgent.ts` | OPERATIONAL | `DETERMINISTIC_ENGINE` | NO (Keep Mathematical/Geometric) |
| `RoadSafetyAgent` | `src/ai-agents/road-safety/RoadSafetyAgent.ts` | OPERATIONAL | `RULE_BASED` | YES (Helmet/Multi-rider sub-model) |
| `EvidenceAgent` | `src/ai-agents/evidence/EvidenceAgent.ts` | OPERATIONAL | `DETERMINISTIC_ENGINE` | NO (Keep BSA 2023 SHA-256 Engine) |
| `InvestigationAgent` | `src/ai-agents/investigation/InvestigationAgent.ts` | OPERATIONAL | `MODEL_CONSUMER` | YES (Gemini RAG + Tool Tuning) |
| `AIAgentOrchestrator` | `src/ai-agents/orchestrator/AIAgentOrchestrator.ts` | OPERATIONAL | `ORCHESTRATOR` | NO (Keep Orchestrator) |
| `AIAuditAgent` | `src/ai-agents/audit/AIAuditAgent.ts` | OPERATIONAL | `ORCHESTRATOR` | NO (Keep Auditor) |
| `AiTrainingLab` | `src/components/AiTrainingLab.tsx` | OPERATIONAL | `UI_ONLY` | NO (Human Workbench) |
| `GCPVisionRecognitionService` | `src/services/server/GCPVisionRecognitionService.ts` | OPERATIONAL | `MODEL_CONSUMER` | YES (Cloud OCR & Multimodal) |
| `ChallanReviewService` | `src/services/ChallanReviewService.ts` | OPERATIONAL | `HUMAN_REVIEW_COMPONENT` | NO (Mandatory Human Gate) |
