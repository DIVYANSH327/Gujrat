# Sentinel Grid — AI Model Integration & Fallback Report

**Project:** Gujarat Police Sentinel Grid  
**Author:** Principal AI/ML & Google Cloud Architect  
**Version:** 1.0  
**Date:** 2026-09-24  

---

## 1. Provider Abstraction Architecture

Sentinel Grid decouples all AI reasoning and computer vision agents from underlying model implementations via provider abstractions:

```text
[AIAgent / VisionDetectionAgent]
                |
                v
[Model Provider Interface] (InferenceAbstraction / Provider Router)
                |
    +-----------+-----------+----------------------+
    |                       |                      |
    v                       v                      v
[Edge ONNX Runtime]   [Google Cloud Vision]   [Vertex AI / Gemini]
(yolov8n.onnx)         (Cloud Vision API)     (gemini-3.8-flash)
```

---

## 2. Model Fallback Semantics

To guarantee continuous operational availability during network drops or cloud outages, every inference call returns an explicit execution state:

1. `REAL_MODEL_INFERENCE`: The request was successfully executed by an active machine learning model (e.g. ONNX YOLOv8n or Gemini API).
2. `DETERMINISTIC_FALLBACK`: The primary model was bypassed (due to latency/rate-limits/offline state) and handled by deterministic algorithms (e.g. Sobel edge plate localization or HSV color space binning).
3. `NOT_AVAILABLE`: The required feature cannot be computed and is explicitly marked as unavailable without hallucination.
4. `ERROR`: System exception occurred; captured in audit log ring buffer with stack trace.

---

## 3. Human Review Integration

All model-generated detections, classifications, and proposed violation citations are routed through the mandatory human review gate:

- **E-Challan Citations:** `ChallanReviewService.ts` requires officer review and cryptographic digital signature before citation dispatch.
- **Watchlist Alerts:** `HumanReviewQueueService.ts` displays side-by-side visual comparisons before field interdiction alerts are dispatched to patrol cars.
- **Review Labels Captured:** `CORRECT`, `INCORRECT`, `UNCERTAIN`, `NOT_READABLE`, `NOT_ENOUGH_DATA`.
- **Continuous Learning Loop:** Officer corrections are versioned and tagged as verified ground-truth candidates for future training releases.
