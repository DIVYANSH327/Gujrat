# Scale Simulation & On-Premise Deployment Runbook
## 80,000-Camera Statewide Grid Capacity Planning & Operational Guide

**Document Version:** 2.3.0  
**Classification:** INFRASTRUCTURE & DEPLOYMENT RUNBOOK / RESTRICTED  
**Target Scale:** 80,000 Concurrent CCTV Feeds across 33 Districts  
**Infrastructure Model:** Distributed Edge Clusters with Centralized WORM Vault  

---

## 1. Scale Simulation & Capacity Planning Matrix

| Metric Parameter | Raw Central Ingestion (Without Edge Grid) | Distributed Edge Architecture (Actual Grid Model) | Efficiency Gain |
| :--- | :---: | :---: | :---: |
| **Total Ingested Streams** | 80,000 Cameras @ 1080p 25 FPS | 80,000 Cameras across 1,600 Edge Nodes | 100% Complete Fleet Coverage |
| **Network WAN Bandwidth** | ~160.00 Gbps required on SWAN | **~32.00 Mbps** structured metadata & best-frames | **99.98% Bandwidth Savings** |
| **Edge Compute Clustering** | Single point of failure | 1,600 Edge Units (50 Cameras / Appliance) | Distributed, resilient fault zones |
| **Central Ingest Workload** | 2,000,000 FPS decoding at HQ | Pre-decoded & analyzed at edge; metadata only | Zero bottleneck at Central Command |
| **7-Year Statutory Storage** | ~483,840 TB (Uncompressed Video) | **~19.20 TB** (Sealed crops, vectors & metadata) | **99.99% Storage Savings** |

---

## 2. Hardware Specification Matrix

### Tier 1: State Central Command HPC (Gandhinagar / Ahmedabad)
- **Application Servers:** 4x High-Availability Enterprise Nodes (Dual AMD EPYC 9654 96-core, 1.5 TB DDR5 ECC RAM).
- **GPU Inference Accelerator Pool:** 8x NVIDIA H100 NVL or L40S for centralized heavy mission queries and re-ranking.
- **Forensic NAS Storage Cluster:** 
  - Ceph-based distributed WORM storage or TrueNAS Enterprise ZFS cluster.
  - Primary ingest tier: 192 TB NVMe flash pool.
  - Secondary archive tier: 1.2 PB SAS HDD enterprise enclosure (RAID-Z2 / 3x replication).

### Tier 2: District Command Netram Nodes (33 Districts)
- **District Workstation Servers:** 2x Enterprise 2U Servers per district (64 cores, 256 GB RAM, 2x NVIDIA L4).
- **Local Short-Term DVR Cache:** 48 TB usable per district for 15-day raw circular ring buffer.

### Tier 3: Edge Ingestion Gateways (1,600 Field Units Statewide)
- **Form Factor:** Ruggedized IP67 / DIN-rail industrial units placed at traffic junction cabinets and toll plazas.
- **Hardware:** NVIDIA Jetson AGX Orin Industrial (64GB, 275 TOPS) or 1U compact edge box with NVIDIA L4 GPU.
- **Capacity:** Handles 50 RTSP/ONVIF 1080p camera feeds concurrently with local NVDEC decoding and real-time inference.

---

## 3. High Availability, Failover & Degraded Mode Resilience

1. **Edge Autonomous Operation (Offline Survival):**
   - If an edge appliance loses connectivity to the State SWAN intranet, it continues local vehicle tracking, optical filtering, and local SSD buffering.
   - Upon network restoration, the edge agent initiates a chronological burst resynchronization with deduplication.
2. **Supervisor Heartbeat & Failover:**
   - The `AgentSupervisorService` queries each regional agent every 5,000 ms.
   - If 3 consecutive heartbeats are missed, the supervisor dynamically shifts downstream camera tracking jobs to adjacent standby nodes.
3. **Storage Failover:**
   - The Government NAS cluster maintains primary ingest (`NAS-NODE-01`), real-time secondary replication (`NAS-NODE-02`), and offline archive vault (`NAS-NODE-03`).
   - If `NAS-NODE-01` becomes degraded, write operations automatically fail over to `NAS-NODE-02` with zero packet or frame loss.

---

## 4. Step-by-Step On-Premise Installation Runbook

### Step 1: Base Operating System & Kernel Hardening
```bash
# Verify Linux kernel and hardware modules
uname -r
nvidia-smi

# Set up dedicated non-root service account
sudo useradd -r -s /bin/false gov_cctv_service
```

### Step 2: Storage Volume Mount & Permissions
```bash
# Create local or NAS forensic mount directories
sudo mkdir -p /var/data/gov_nas_evidence/{evidence,thumbnails,crops,video_refs,audit_trails}
sudo chown -R gov_cctv_service:gov_cctv_service /var/data/gov_nas_evidence
sudo chmod 750 /var/data/gov_nas_evidence
```

### Step 3: Container Runtime Setup (Rootless Podman or Docker EE)
```bash
# Launch application container in on-premise air-gapped mode
podman run -d \
  --name gujarat-cctv-intelligence \
  --restart always \
  -p 3000:3000 \
  -v /var/data/gov_nas_evidence:/var/data/gov_nas_evidence:Z \
  -e GOV_NAS_STORAGE_ROOT=/var/data/gov_nas_evidence \
  -e EVIDENCE_STORAGE_ENDPOINT=https://nas.forensic.gujaratpolice.internal/v1 \
  -e NODE_ENV=production \
  registry.gujaratpolice.internal/cctv/intelligence-grid:v2.3.0
```

### Step 4: Health Check & Self-Test Verification
```bash
# Verify container is actively listening on local port 3000
curl -s http://localhost:3000/api/health | jq .
```
Expected output:
```json
{
  "status": "ok"
}
```
