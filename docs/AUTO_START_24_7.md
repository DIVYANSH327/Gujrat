# 24/7 Continuous Background Intelligence & Windows Auto-Start Guide
## Gujarat Police AI CCTV Intelligence Platform (SCRB)

This document provides official operational instructions for configuring the Gujarat Police CCTV & AI Intelligence Platform to operate continuously 24 hours/day, 7 days/week as an autonomous server-side service on Windows and Linux hosts.

---

## 1. Important Host Power Limitations

A computer that is powered off or suspended cannot execute the Node.js server or the Background Vehicle Intelligence Engine.

| Host Operating State | System Behavior |
| :--- | :--- |
| **SERVER RUNNING** | **24/7 continuous background CCTV intelligence operates normally.** All 30 cameras are continuously scheduled, audited, and analyzed without requiring any browser or operator interaction. |
| **SERVER SLEEPING / HIBERNATED** | **Background processing is suspended.** Operating system sleep stops CPU execution and network sockets. Host systems must have sleep/standby disabled. |
| **SERVER POWERED OFF** | **Background processing is halted.** No hardware or software execution occurs while power is off. |
| **HOST REBOOT / RESTART** | **Platform starts automatically** provided the OS-level auto-start service (NSSM, Windows Task Scheduler, or systemd) documented below has been configured. |

> **Note on Police Station Laptops/Workstations:** Ensure Windows Power & Sleep settings are configured to **"Never"** sleep on AC power, and set **"When I close the lid"** to **"Do nothing"** in the Windows Control Panel.

---

## 2. 24/7 Service Architecture

The system operates independently of any client UI:

```
Host Boot (Windows / Linux)
      ↓
OS Service Supervisor (NSSM / Task Scheduler / systemd)
      ↓
Node.js Runtime (server.ts / dist/server.cjs)
      ↓
ApplicationLifecycleManager (Orchestrates startup sequence)
      ↓
BackgroundVehicleIntelligenceEngine (Singleton 24/7 Service)
      ├── Continuous 30-Camera Scheduler (with exponential backoff for offline nodes)
      ├── Frame Quality Engine & Lanczos Optical Enhancement
      ├── Statutory BSA 2023 Forensic Evidence Vault (Local disk / NAS)
      └── Health Watchdog & Stuck Engine Recovery (15s audit interval)
```

The system does **NOT** require:
- A browser tab to be open
- Camera grid to be open
- Operator mouse/keyboard interaction
- React components to be mounted
- Mobile phone connectivity

---

## 3. Windows Service Setup via NSSM (Recommended for Production)

NSSM (Non-Sucking Service Manager) runs the platform as a true Windows background service running under the `LocalSystem` or dedicated police service account. It restarts automatically upon system reboot and handles process crashes within 3 seconds.

### Step 1: Obtain NSSM
1. Download NSSM from `https://nssm.cc/download` (or execute `choco install nssm` in Chocolatey).
2. Ensure `nssm.exe` is available in `C:\nssm\` or added to your system `PATH`.

### Step 2: Install Gujarat Police CCTV Service
Open an **Administrative Command Prompt (cmd.exe as Administrator)**:

```cmd
:: 1. Define application directories
set APP_DIR=C:\gujarat-police-cctv
set NODE_EXE=C:\Program Files\nodejs\node.exe

:: 2. Create dedicated logs directory
if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"

:: 3. Install the Windows Service
nssm install GujaratPoliceCctv "%NODE_EXE%" "%APP_DIR%\dist\server.cjs"

:: 4. Configure working directory & service parameters
nssm set GujaratPoliceCctv AppDirectory "%APP_DIR%"
nssm set GujaratPoliceCctv Description "Gujarat Police 24/7 Autonomous CCTV & AI Intelligence Platform"
nssm set GujaratPoliceCctv Start SERVICE_AUTO_START

:: 5. Configure Automatic Crash Recovery (3 second restart delay)
nssm set GujaratPoliceCctv AppRestartDelay 3000
nssm set GujaratPoliceCctv AppThrottle 1500

:: 6. Configure Immutable Log Rotation (stdout & stderr)
nssm set GujaratPoliceCctv AppStdout "%APP_DIR%\logs\cctv-service-stdout.log"
nssm set GujaratPoliceCctv AppStderr "%APP_DIR%\logs\cctv-service-stderr.log"
nssm set GujaratPoliceCctv AppStdoutCreationDisposition 4
nssm set GujaratPoliceCctv AppStderrCreationDisposition 4
nssm set GujaratPoliceCctv AppRotateFiles 1
nssm set GujaratPoliceCctv AppRotateBytes 52428800

:: 7. Start the Service
nssm start GujaratPoliceCctv
```

### Step 3: Verify Running Status
```cmd
nssm status GujaratPoliceCctv
```
You should see: `SERVICE_RUNNING`.

---

## 4. Option B: Windows Task Scheduler (No Third-Party Tools)

If installation of third-party software like NSSM is restricted on your police network:

1. Press **Win + R**, type `taskschd.msc`, and press Enter.
2. In the Actions panel, select **Create Task...** (do not use Basic Task).
3. **General Tab:**
   - Name: `GujaratPolice_24_7_CCTV_Intelligence`
   - Security options: Select **Run whether user is logged on or not**
   - Check **Run with highest privileges**
   - Configure for: **Windows 10 / Windows Server 2019/2022**
4. **Triggers Tab:**
   - Click **New...**
   - Begin the task: **At startup**
   - Delay task for: **15 seconds** (ensures network interface is initialized)
   - Enabled: **Checked**
5. **Actions Tab:**
   - Click **New...**
   - Action: **Start a program**
   - Program/script: `C:\Program Files\nodejs\npm.cmd`
   - Add arguments: `run start`
   - Start in: `C:\gujarat-police-cctv`
6. **Conditions Tab:**
   - Uncheck **Start the task only if the computer is on AC power** (allows uninterrupted battery fallback on UPS)
   - Uncheck **Stop if the computer switches to battery power**
7. **Settings Tab:**
   - Check **If the task fails, restart every:** `1 minute`
   - Attempt to restart up to: `99 times`
   - Uncheck **Stop the task if it runs longer than**

---

## 5. Linux Host Service Configuration (systemd)

For deployment on Linux edge appliances or command center servers:

1. Create the systemd service file:
```bash
sudo nano /etc/systemd/system/gujarat-police-cctv.service
```

2. Add the following unit configuration:
```ini
[Unit]
Description=Gujarat Police 24/7 Autonomous CCTV & AI Intelligence Platform
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=police-admin
WorkingDirectory=/opt/gujarat-police-cctv
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3
Environment=NODE_ENV=production
StandardOutput=append:/var/log/gujarat-police-cctv.stdout.log
StandardError=append:/var/log/gujarat-police-cctv.stderr.log

# Resource limits
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

3. Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable gujarat-police-cctv
sudo systemctl start gujarat-police-cctv
sudo systemctl status gujarat-police-cctv
```

---

## 6. Environment Variables & Secrets Management

All secrets, camera credentials, and port assignments remain strictly isolated in the `.env` file at the application root and are **never** logged to stdout/stderr.

Key configuration flags:
- `PORT=3000`: Primary HTTP API & Surveillance Reverse Proxy port
- `BACKGROUND_SAMPLE_INTERVAL_MS=5000`: Cadence between intelligence cycles (5 seconds)
- `BACKGROUND_STUCK_THRESHOLD_MS=60000`: Watchdog stall trigger threshold (60 seconds)
- `EVIDENCE_STORAGE_PATH=./data/evidence`: Storage path for BSA 2023 tamper-evident logs
- `GEMINI_API_KEY`: Server-side only Gemini Vision API key (optional; if unconfigured, optical fallback operates)

---

## 7. Operational Health Verification Commands

To check the continuous background engine status without opening a browser:

### PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/system/health" | Select-Object applicationState, engineState, processUptime, engineUptime, cameraCounts
```

### cURL / Bash:
```bash
curl -s http://localhost:3000/api/system/health | jq '{status, applicationState, engineState, processUptime, engineUptime, cameraCounts, aiState}'
```

Expected output:
```json
{
  "status": "HEALTHY",
  "applicationState": "RUNNING",
  "engineState": "ENGINE_RUNNING",
  "processUptime": 3840,
  "engineUptime": 3840,
  "cameraCounts": {
    "total": 30,
    "live": 30,
    "stale": 0,
    "offline": 0,
    "reconnecting": 0,
    "authError": 0,
    "starting": 0,
    "degraded": 0
  },
  "aiState": "READY"
}
```
