# Phase 1: Real Android Phone Camera as First Camera Source
**Gujarat Police Unified CCTV Intelligence Grid — Mobile Camera Adapter**
*Engineering Architecture & Field Testing Guide*
*Author: DIVYANSH Shrivastava*

---

> ### ⚠️ Mandatory Architectural Disclaimer
> **Mobile Camera Test Mode uses the device camera through the browser and is intended for development/testing. It does not by itself provide guaranteed background recording, continuous operation, or production field-camera capabilities.**

---

## 1. Executive Summary

In Phase 1, the Gujarat Police Unified CCTV Intelligence Grid introduces the **Mobile Camera Adapter** (`MobileBrowserCameraSource`). This adapter allows any modern Android smartphone running Chrome or Samsung Internet to act as the **first real physical camera source** feeding live frames directly into the CCTV Intelligence pipeline.

This capability is engineered specifically for developers, police field evaluators, and system architects who do not currently possess physical IP/ONVIF cameras, multi-channel DVRs, or NVR hardware, but need to validate real-time frame ingestion, canvas rendering, resolution negotiation, and event telemetry.

---

## 2. Architectural Principles & Isolation

### A. Strict Truthful Labeling
- **Real Camera vs Simulated Camera**: Frames ingested from `navigator.mediaDevices.getUserMedia` are tagged as `REAL_CAMERA` with source `MOBILE_CAMERA` and capture method `BROWSER_GET_USER_MEDIA`. They are never mislabeled as `SIMULATED` or synthetic.
- **Real Camera ≠ Real AI**: Connecting a real physical phone camera does **NOT** automatically mean that production AI/ML detection is running. In Phase 1, `analysisMode` is strictly and explicitly marked as `NONE` (`"AI: NOT STARTED"`).
- **No YouTube Conflation**: The YouTube demonstration camera player remains strictly confined to its visual demo layer and cannot inject frames into the Mobile Camera pipeline.
- **No Fake Violations**: In Phase 1, raw frame capture never generates synthetic challans or fake traffic violations.

### B. Ingestion Pipeline
```
+-------------------------------------------------------------+
|                     Android Phone Camera                    |
|                (Back/Environment Sensor: 1080p)             |
+-------------------------------------------------------------+
                               |
                               v (Browser getUserMedia API)
+-------------------------------------------------------------+
|                  MobileBrowserCameraSource                  |
|          - Implements ICameraSource interface               |
|          - Manages MediaStream & track lifecycle            |
|          - Handles permissions & hardware errors            |
|          - Samples GPS Telemetry via Geolocation API        |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     HTMLVideoElement                        |
|                  (playsInline, autoPlay)                    |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                    MobileFrameSampler                       |
|          - Controlled 1 FPS frame sampling interval         |
|          - Renders frame to off-screen HTMLCanvasElement    |
|          - Generates MobileCameraFrame metadata             |
|          - Dispatches to centralEventBus & sysEvents        |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|            Gujarat CCTV Intelligence Grid Mesh              |
|          - Camera Matrix (MOB-ANDROID-001)                  |
|          - Central Event Bus & Architecture Telemetry       |
|          - Camera Details Ingestion Inspector               |
+-------------------------------------------------------------+
```

---

## 3. Core Components

### 1. `MobileBrowserCameraSource` (`src/services/video/MobileBrowserCameraSource.ts`)
- Implements the common `ICameraSource` interface.
- Handles browser device enumeration and constraints:
  ```typescript
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }
  ```
- Graceful error mapping for browser exceptions:
  - `NotAllowedError` / `PermissionDeniedError`: User denied camera permission or browser blocked access.
  - `NotFoundError` / `DevicesNotFoundError`: Device has no usable optical camera hardware.
  - `NotReadableError` / `TrackStartError`: Camera is currently locked by another application.
  - `OverconstrainedError`: Hardware cannot satisfy target resolution constraints.
  - `SecurityError`: Origin is not HTTPS or localhost.

### 2. `MobileFrameSampler` (`src/services/video/MobileFrameSampler.ts`)
- Samples video frames at a controlled, battery-efficient rate (default: 1.0 FPS / 1000ms).
- Extracts pixel dimensions (`videoWidth`, `videoHeight`) from the live video element.
- Emits standardized `MobileCameraFrame` structures with monotonic sequence numbering and ISO-8601 timestamps.
- Integrates directly with `centralEventBus` (`event: 'mobile_camera_frame'`) and `sysEvents` (`event: 'mobile_camera_frame_captured'`).

### 3. `MobileCameraTest` UI (`src/components/MobileCameraTest.tsx`)
A dedicated tactical UI featuring:
- Live viewport preview with responsive HUD overlay (Resolution, FPS, Active Stream state, GPS coordinates).
- Connection status indicator (`DISCONNECTED`, `REQUESTING_PERMISSION`, `CONNECTED`, `PAUSED`, `ERROR`).
- Camera facing selector (`Back (Environment)` vs `Front (User)`).
- Resolution mode selector (`1080p Full HD`, `720p HD`, `480p SD`).
- Frame sampling controller (Start, Pause, Resume, Stop, Manual Snap).
- Live Frame Inspector displaying real captured frame metadata, data URLs, and aspect ratios.
- Real-time event log streaming telemetry events directly from the event bus.

---

## 4. How to Test on an Android Phone

### Step 1: Open the Application on Android
1. Open Google Chrome or Samsung Internet on your Android phone.
2. Navigate to the application URL (over HTTPS or via your local development host).
3. In the left navigation sidebar, tap **MOBILE CAMERA** (`REAL` badge).

### Step 2: Grant Camera Permission
1. Tap **START CAMERA**.
2. When the browser displays the permission prompt (`"ai.studio wants to use your camera"`), tap **Allow**.
3. The connection state will turn green: **`CONNECTED (REAL SENSOR)`**.

### Step 3: Verify Real Camera Stream
- Aim your phone at vehicles, objects, or your surroundings.
- Confirm the video preview displays your actual environment in real-time.
- Check the telemetry bar:
  - **Resolution**: Typically `1920×1080` or device native resolution.
  - **FPS**: Real-time display rendering ~30 FPS; Sampled Ingest at 1.0 FPS.
  - **GPS**: Real-time latitude, longitude, and accuracy if location permission was granted.

### Step 4: Verify Frame Sampler & Inspector
1. Observe the **Captured Frame Inspector** updating once every second (1 FPS).
2. Tap **CAPTURE SINGLE FRAME** to perform an on-demand snapshot with flash animation.
3. Tap **PAUSE** and **RESUME** to verify sampler lifecycle state transitions.
4. Check the **Telemetry & Event Stream** at the bottom of the screen to observe event bus dispatches.

### Step 5: Verify Camera Matrix Integration
1. Navigate to **CAMERA MATRIX** from the sidebar.
2. Under the top metrics panel, observe the **MOBILE CAMERAS** section.
3. Card `MOB-ANDROID-001` will show `CONNECTED` with the live resolution and timestamp.
4. Tap the card to inspect full ingestion metadata inside the `CameraDetailsModal`.

---

## 5. Running the Phase 1 Test Suite

The comprehensive 25-point test suite is located at:
`src/ai-agents/tests/MobileCameraTest.test.ts`

Run the test suite using `npx tsx`:
```bash
npx tsx src/ai-agents/tests/MobileCameraTest.test.ts
```

All 25 test cases must pass:
1. Mobile camera source type is `'MOBILE_CAMERA'`
2. Initial state is `'DISCONNECTED'`
3. Permission-requesting state changes appropriately
4. Successful camera connection updates state to `'CONNECTED'`
5. Camera permission denial triggers user-friendly error message
6. Camera hardware unavailable triggers user-friendly error message
7. Camera already in use triggers user-friendly error message
8. Video stream binds to `video.srcObject`
9. Actual frame capture produces valid `MobileCameraFrame`
10. Frame metadata includes width, height, timestamp, camera ID
11. Frame sequence numbers are strictly incremented
12. Sampler start begins 1 FPS sampling
13. Sampler stop halts frame sampling
14. Sampler pause pauses sampling
15. Sampler resume resumes sampling
16. Frame metrics accurately report captured and sampled frames
17. Cleanup releases tracks and resets video element
18. Media tracks stopped verifies `track.stop()` is executed
19. Source provenance is `MOBILE_CAMERA` / `REAL_CAMERA` / `BROWSER_GET_USER_MEDIA`
20. Real camera is not classified as `SIMULATED`
21. Real camera does NOT imply real AI (`analysisMode` is strictly `'NONE'`)
22. YouTube source cannot enter mobile camera pipeline
23. No fake violation is generated merely from frame capture
24. Camera Matrix retains physical CCTV sources alongside mobile camera
25. Mobile camera session is created with correct metadata and timestamps

---

## 6. Next Steps: Transition to Phase 2 (Challan Mode & AI Violation Enforcement)

With the Real Android Phone Camera source fully operational and verified, Phase 2 will introduce:
1. **AI Violation Engine**: Consuming live frames from `MobileFrameSampler` or physical CCTV feeds.
2. **Violation Evidence Capture**: Cropping vehicle plate, timestamping GPS telemetry, and generating cryptographic chain-of-custody hashes.
3. **Challan Human Review Workflow**: Pending queue, inspector approve/reject interface, and official notice dispatching.
