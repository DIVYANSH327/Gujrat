# Sentinel Grid — Vertex AI Training & Deployment Runbook

**Project:** Gujarat Police Sentinel Grid  
**Author:** Principal AI/ML & Google Cloud Architect  
**Version:** 1.0  
**Date:** 2026-09-24  

---

## 1. Pre-Flight Checklist

Before initiating any Vertex AI custom training run:

1. **Verify Dataset Volume & Governance:**
   ```bash
   npm run ai:dataset:validate
   ```
   Ensure 100% of samples pass bounding box, label taxonomy, and leakage checks.

2. **Verify Google Cloud Permissions & Region:**
   ```bash
   npm run cloud:ping
   ```
   Ensure Vertex AI, Cloud Storage, and Artifact Registry are reachable in `asia-south1` (Mumbai).

3. **Verify Training Readiness:**
   ```bash
   npm run ai:train --dry-run
   ```

---

## 2. Vertex AI Custom Training Job Execution

### Track 1: `YOLOv8-Gujarat-Traffic` Training Job

```bash
# 1. Package training code into Artifact Registry container
gcloud builds submit --config=deploy/cloudbuild-trainer.yaml \
  --project=dns1-c27a5 \
  --substitutions=_IMAGE_NAME=asia-south1-docker.pkg.dev/dns1-c27a5/sentinel-repo/yolov8-trainer:v1.0

# 2. Launch Vertex AI Custom Job on NVIDIA L4 GPU
gcloud ai custom-jobs create \
  --region=asia-south1 \
  --project=dns1-c27a5 \
  --display-name="sentinel-yolov8-traffic-v1" \
  --worker-pool-spec=machine-type=g2-standard-8,accelerator-type=NVIDIA_L4,accelerator-count=1,container-image-uri=asia-south1-docker.pkg.dev/dns1-c27a5/sentinel-repo/yolov8-trainer:v1.0 \
  --args="--data=gs://sentinel-training-datasets-scrb/traffic_v1/dataset.yaml,--epochs=100,--batch=32,--imgsz=640"
```

---

## 3. Model Evaluation & Export Gate

1. **Download trained weights from Cloud Storage:**
   ```bash
   gcloud storage cp gs://sentinel-models/yolov8-gujarat/v1.0/best.pt ./models/best.pt
   ```

2. **Export to INT8 Quantized ONNX:**
   ```bash
   yolo export model=./models/best.pt format=onnx int8=True imgsz=640 simplify=True
   cp ./models/best.onnx ./models/yolov8_gujarat_int8.onnx
   ```

3. **Run Validation & Acceptance Gate:**
   ```bash
   npm run ai:evaluate
   ```
   Ensure mAP@0.5 $\ge 0.88$ and latency $\le 20\text{ms}$.

4. **Promote Model in Registry:**
   Update `docs/SENTINEL_MODEL_REGISTRY.md` to `MODEL_READY`.
