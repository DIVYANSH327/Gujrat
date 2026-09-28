# Sentinel Grid — Quantitative AI Evaluation & Benchmarking Plan

**Project:** Gujarat Police Sentinel Grid  
**Author:** Principal AI/ML & Google Cloud Architect  
**Document Version:** 1.0  
**Date:** 2026-09-24  

---

## 1. Evaluation Methodology & Hard Acceptance Gates

In mission-critical law enforcement and road safety applications, automated systems cannot rely on single aggregate metrics. Sentinel Grid enforces multi-dimensional quantitative evaluation across specialized evaluation dimensions.

No trained model may be promoted to production without passing every statutory acceptance gate on the strictly held-out `REAL_AUTHORIZED_DATA` test set.

---

## 2. Metric Specifications by Domain

### 2.1 Object Detection (`VisionDetectionAgent` / `YOLOv8-Gujarat`)
- **Mean Average Precision (mAP@0.5):** Overall bounding box localization accuracy across all 16 Indian traffic classes at 50% IoU threshold. **Acceptance Threshold:** $\ge 0.880$.
- **mAP@0.5:0.95:** Strict localization precision across IoU thresholds from 0.50 to 0.95 in steps of 0.05. **Acceptance Threshold:** $\ge 0.650$.
- **Per-Class Recall on Vulnerable Road Users (VRUs):** Recall for `PERSON`, `MOTORCYCLE`, and `SCOOTER`. **Acceptance Threshold:** $\ge 0.920$.
- **False Positive Rate per Frame:** False object detection rate on empty/sparse road conditions. **Acceptance Threshold:** $\le 0.03$ detections/frame.
- **Edge Inference Latency:** 1080p frame processing latency on on-premise hardware. **Acceptance Threshold:** $\le 20\text{ ms}$.

---

### 2.2 License Plate Recognition & OCR (`PlateOcrAgent`)
- **Exact 10-Digit Plate Match Accuracy:** Percentage of plates where every single alphanumeric character matches ground truth identically ($100\%$ character match). **Acceptance Threshold:** $\ge 96.5\%$ on clean plates; $\ge 88.0\%$ on damaged/obscured plates.
- **Character Error Rate (CER):** Levenshtein character edit distance normalized by string length:
  $$\text{CER} = \frac{\text{Insertions} + \text{Deletions} + \text{Substitutions}}{\text{Total Characters}}$$
  **Acceptance Threshold:** $\le 0.015$ (less than 1.5 errors per 100 characters).
- **Unreadable / Obscured Detection Rate:** Accuracy in classifying a severely damaged or defaced plate as `NOT_READABLE` rather than hallucinating plausible characters. **Acceptance Threshold:** $\ge 99.0\%$.
- **Confidence Calibration (Expected Calibration Error - ECE):** Evaluates if model confidence matches empirical probability of correctness. **Acceptance Threshold:** $\text{ECE} \le 0.05$.

---

### 2.3 Vehicle Classification (`VehicleClassificationAgent`)
- **Macro-Averaged Precision & Recall:** Balanced metric across all 10 vehicle types. **Acceptance Threshold:** $\ge 0.910$.
- **Two-Wheeler Sub-Class Disambiguation (Motorcycle vs Scooter):** Confusion rate between motorcycles and step-through scooters. **Acceptance Threshold:** $\text{Error} \le 5.0\%$.
- **Commercial & Heavy Vehicle Precision (Truck vs Bus vs Tractor):** Critical for automated tolling and corridor restriction enforcement. **Acceptance Threshold:** $\ge 0.940$.

---

### 2.4 Vehicle Re-Identification (`CrossCameraVehicleCorrelationAgent`)
- **Rank-1 Identification Accuracy:** Target vehicle is ranked #1 match in gallery across different camera angles. **Acceptance Threshold:** $\ge 82.0\%$.
- **Rank-5 Identification Accuracy:** Target vehicle is within top 5 matches. **Acceptance Threshold:** $\ge 94.0\%$.
- **Mean Average Precision (mAP@Rank-10):** Precision across multi-camera search galleries. **Acceptance Threshold:** $\ge 76.0\%$.
- **False Match Rate (FMR):** Rate of incorrectly asserting two distinct vehicles are the same identity. **Acceptance Threshold:** $\le 0.005$ ($0.5\%$).

---

### 2.5 Road Safety & Violation Detection (`RoadSafetyAgent`)
- **Red Light Violation Precision (RLVD):** Precision in detecting stop-line breach during red signal phase. **Acceptance Threshold:** $\ge 99.5\%$ (Zero false citations).
- **Wrong-Way Driving Detection Latency:** Time elapsed between vehicle wrong-way entry and alert generation. **Acceptance Threshold:** $\le 1.2\text{ seconds}$.
- **Helmet Compliance Precision:** Accurate classification of `HELMET` vs `NO_HELMET` on moving two-wheelers. **Acceptance Threshold:** $\ge 93.0\%$.

---

### 2.6 LLM & Autonomous Reasoning (`InvestigationAgent` / `Gemini-SFT`)
- **Factual Grounding Rate:** Percentage of claims in generated police dossiers directly backed by cryptographic evidence timestamps and camera IDs. **Acceptance Threshold:** $100.0\%$.
- **Hallucination Rate:** Frequency of ungrounded names, license plates, or events not present in input telemetry. **Acceptance Threshold:** $\le 0.05\%$.
- **Statutory Section Citation Accuracy:** Exact mapping to correct IPC / BNS and Motor Vehicles Act sections. **Acceptance Threshold:** $\ge 99.8\%$.
- **Structured JSON-LD Schema Validity:** Rate of successfully parsing generated JSON against Sentinel Schema. **Acceptance Threshold:** $100.0\%$.
- **Canonical Uncertainty Adherence:** Proper tagging of missing or partial information as `NOT_AVAILABLE` or `UNCERTAIN`. **Acceptance Threshold:** $100.0\%$.

---

## 3. Continuous Evaluation & Model Drift Monitoring

- **Weekly Automated Regression Testing:** Run evaluation harness on 5,000 newly acquired verified frames.
- **Population Stability Index (PSI):** Monitor embedding drift in camera feeds due to seasonal lighting and infrastructure changes ($\text{PSI} > 0.25$ triggers automated retraining alert).
- **Human Disagreement Rate:** Track frequency of officer overrides during adjudication in `HumanReviewQueueService.ts`.
