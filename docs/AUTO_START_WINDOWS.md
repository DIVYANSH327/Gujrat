# Automatic Server Startup & Self-Recovery Guide (Windows & Linux)
## Gujarat Police AI CCTV Intelligence Platform (SCRB)

This operational document describes how to configure the Gujarat Police CCTV & AI Intelligence Platform to automatically start on computer boot, recover automatically from process crashes, and run uninterrupted as an autonomous background service without requiring operator intervention or an open browser tab.

---

## 1. Architecture Overview

The system includes a central `ApplicationLifecycleManager` that coordinates 9 deterministic startup phases:

1. **Phase 1: Configuration Validation** (`.env`, RTSP credentials, port bindings)
2. **Phase 2: Logging & Recovery Telemetry** (generates unique `bootId`, resets in-flight markers)
3. **Phase 3: Persistent Storage & Forensic Evidence Integrity** (`BSA 2023` compliant SHA-256 vault)
4. **Phase 4: Sentinel Camera Registry Discovery** (30 CCTV nodes synchronized)
5. **Phase 5: Camera Connectivity & Staggered Recovery Workers** (anti-thundering-herd backoff)
6. **Phase 6: AI Provider Diagnostics & Router Resolution** (Gemini / OmniRoute)
7. **Phase 7: Autonomous Background Vehicle Intelligence Engine** (scans priority and round-robin streams)
8. **Phase 8: API Server & Health Probes** (`/api/system/health`, `/api/system/liveness`, `/api/system/readiness`)
9. **Phase 9: Operator UI & Live Reconnaissance Availability**

---

## 2. Option A: Windows Service Installation via NSSM (Recommended for Production)

NSSM (Non-Sucking Service Manager) runs the Node.js platform as a true native Windows Service with automatic restart on process crash.

### Step 1: Download & Install NSSM
1. Download NSSM from `https://nssm.cc/download` (or `choco install nssm` via Chocolatey).
2. Place `nssm.exe` in `C:\nssm\` or ensure it is in your system `PATH`.

### Step 2: Install Gujarat Police CCTV Service
Open an **Administrative Command Prompt (cmd.exe as Administrator)** and run:

```cmd
nssm install GujaratPoliceCctv "C:\Program Files\nodejs\node.exe" "C:\gujarat-police-cctv\dist\server.cjs"
nssm set GujaratPoliceCctv AppDirectory "C:\gujarat-police-cctv"
nssm set GujaratPoliceCctv Description "Gujarat Police CCTV & AI Intelligence Platform Self-Recovery Service"
nssm set GujaratPoliceCctv Start SERVICE_AUTO_START
nssm set GujaratPoliceCctv AppRestartDelay 3000
nssm set GujaratPoliceCctv AppThrottle 1500
nssm set GujaratPoliceCctv AppStdout "C:\gujarat-police-cctv\logs\service-stdout.log"
nssm set GujaratPoliceCctv AppStderr "C:\gujarat-police-cctv\logs\service-stderr.log"
```

### Step 3: Start the Service
```cmd
nssm start GujaratPoliceCctv
```

The service will now:
- Start immediately when Windows boots (before user logon).
- Automatically restart within 3 seconds if the Node process crashes.
- Maintain immutable evidence logs in `logs\service-stdout.log`.

---

## 3. Option B: Windows Task Scheduler (At System Startup)

If you cannot install third-party service wrappers, configure Windows Task Scheduler:

1. Open `taskschd.msc` (Task Scheduler).
2. Click **Create Task** (not Basic Task).
3. Under **General**:
   - Name: `GujaratPolice_AI_CCTV_Platform`
   - Select **Run whether user is logged on or not**
   - Check **Run with highest privileges**
   - Configure for: **Windows 10 / Windows 11 / Windows Server**
4. Under **Triggers**:
   - New Trigger: **At startup**
   - Delay task: 10 seconds (allows network stack to initialize)
   - Enabled: Checked
5. Under **Actions**:
   - Action: **Start a program**
   - Program/script: `C:\Program Files\nodejs\npm.cmd`
   - Add arguments: `run start`
   - Start in: `C:\gujarat-police-cctv`
6. Under **Settings**:
   - Check **If the task fails, restart every: 1 minute**
   - Attempt to restart up to: **99 times**
   - Uncheck **Stop the task if it runs longer than**

---

## 4. Option C: PM2 Process Supervisor (Cross-Platform)

The repository provides `ecosystem.config.cjs` configured for PM2.

### Install & Start with PM2:
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

### Enable Windows Startup Hook:
```cmd
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

### Enable Linux/Systemd Startup Hook:
```bash
pm2 startup systemd
pm2 save
```

---

## 5. Health & Recovery Verification Endpoints

Verify that the platform is operational and self-recovering:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/system/liveness` | GET | Validates process is alive (returns HTTP 200) |
| `/api/system/readiness` | GET | Validates subsystem readiness (returns 200 or 503 DEGRADED) |
| `/api/system/health` | GET | Full breakdown of cameras, background AI, evidence storage & telemetry |
| `/api/system/recovery-events` | GET | Chronological structured log of camera reconnects & subsystem recoveries |

---

## 6. Self-Recovery Characteristics

- **Zero-Operator Recovery:** When the laptop or server reboots, the background engine automatically resumes sampling and analyzing all 30 CCTV feeds without requiring an operator to open the browser.
- **Camera Stale Feed Isolation:** If an individual RTSP stream stolls, the platform marks only that node `STALE`, isolates the worker, applies exponential backoff (1s, 2s, 4s, 8s, 15s, 30s, max 60s) with +/-25% jitter to prevent network thundering herds, and transitions back to `LIVE` strictly when a valid new JPEG frame is received and verified with SHA-256.
- **Graceful Degradation:** If Gemini or OmniRoute becomes temporarily unavailable, CCTV frame acquisition continues unimpeded, local forensic evidence storage continues, and AI inference resumes automatically when the external network or tunnel reconnects.
- **Evidence Immutability:** Pre-restart evidence records remain permanent and unmodified in the cryptographic evidence vault.
