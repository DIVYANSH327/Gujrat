# Gujarat Police Sentinel Grid — Firestore Schema Design Document
## Incident Reports & Camera Metadata Architecture

**Version:** 1.0.0  
**Authority:** Gujarat Police State Crime Records Bureau (SCRB) — Gandhinagar HQ  
**Target Database:** Cloud Firestore (`ai-studio-gujrat-217890ee-4c63-4e61-90de-a0dc591996f6`)  
**Regulatory Standard:** Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023) Section 63  

---

## 1. Executive Summary

This document defines the production Cloud Firestore database schema for the **Gujarat Police Sentinel Grid (CCTV AI Intelligence Platform)**. The schema is purposefully structured to store:
1. **Incident Reports & Operational Command Records** (`/incidents`)
2. **Camera Hardware, Stream Topology & Intelligence Profiles** (`/cameras`)

The architecture integrates seamlessly with the existing frontend components (`IncidentCommandView`, `Cameras`, `CctvSiteRegistryView`, `GodsEyeWorkspace`, `PlateIntelligenceMapView`), backend services (`server.ts`, `SentinelAuthService.ts`), and security policies (`firestore.rules`).

---

## 2. Collection Hierarchy Overview

```
firestore-root/
│
├── users/                          # User accounts, badges & RBAC clearances
│   └── {userId}
│
├── incidents/                      # Primary Incident Reports
│   └── {incidentId}/
│       ├── timeline/               # Chronological investigation event stream
│       │   └── {eventId}
│       ├── decisions/              # Officer HITL adjudications & authorizations
│       │   └── {decisionId}
│       └── evidence_links/         # References to SHA-256 hashed media items
│           └── {linkId}
│
├── cameras/                        # Surveillance Camera Matrix & Device Metadata
│   └── {cameraId}/
│       ├── telemetry/              # Periodic stream health & frame-drop logs
│       │   └── {telemetryId}
│       ├── outages/                # Stream gap & buffer interruption records
│       │   └── {outageId}
│       └── intelligence_profile/   # YOLOv8 / ANPR capability and detector config
│           └── default             # Singleton document per camera
│
├── alerts/                         # Real-time multi-agent rule alerts
│   └── {alertId}
│
├── challans/                       # e-Challan enforcement violation cases
│   └── {challanId}
│
└── evidence/                       # BSA Section 63 cryptographic evidence records
    └── {evidenceId}
```

---

## 3. Incident Reports Schema (`/incidents`)

### 3.1 Document ID Convention
* **Format:** `INC-{YYYYMMDD}-{DISTRICT_CODE}-{UUID}`
* **Example:** `INC-20260927-GND-7841A9B2`

### 3.2 Root Document Structure (`/incidents/{incidentId}`)

| Field Name | Firestore Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `incidentId` | `string` | Yes | Unique canonical incident identifier | `"INC-20260927-GND-7841A9B2"` |
| `title` | `string` | Yes | Brief operational summary of the event | `"Stolen White Sedan Corroborated on SG Highway"` |
| `type` | `string` | Yes | Standardized incident classification | `"VEHICLE_THEFT"` (See Enums) |
| `severity` | `string` | Yes | Priority triage level | `"CRITICAL"` \| `"HIGH"` \| `"MEDIUM"` \| `"LOW"` |
| `status` | `string` | Yes | Current lifecycle state | `"ASSIGNED"` (See Enums) |
| `location` | `string` | Yes | Physical landmark or junction description | `"SG Highway - Chimanbhai Bridge Junction"` |
| `district` | `string` | Yes | Gujarat Police administrative district | `"Ahmedabad City"` \| `"Gandhinagar"` |
| `geoPoint` | `geopoint` | No | Exact WGS84 GPS coordinate | `[23.0784, 72.5076]` |
| `cameraIds` | `array<string>` | Yes | Array of CCTV cameras capturing the incident | `["CAM-GND-001", "CAM-GND-002"]` |
| `vehiclePlates` | `array<string>` | Yes | Normalized candidate registration plates | `["GJ01AB1234"]` |
| `assignedAgentIds`| `array<string>` | Yes | Autonomous AI agents analyzing this event | `["cross-camera-correlator", "anpr-agent"]` |
| `assignedOfficer` | `string` | No | Badge ID / Email of presiding duty officer | `"GP-CMD-7922"` |
| `assignedOfficerEmail` | `string` | No | Email of responsible officer | `"raut.neha6008@gmail.com"` |
| `detectedAt` | `timestamp` | Yes | Ingestion timestamp of first detection | `2026-09-27T10:15:30.000Z` |
| `updatedAt` | `timestamp` | Yes | Last state modification timestamp | `2026-09-27T10:22:15.000Z` |
| `resolvedAt` | `timestamp` | No | Resolution/closure timestamp | `null` |
| `evidenceIds` | `array<string>` | Yes | Cryptographic SHA-256 evidence record links | `["EVD-2026-0927-0112"]` |
| `metadata` | `map` | No | Extensible domain attributes | `{ "speedKmph": 78, "vehicleColor": "White" }` |

### 3.3 Subcollection: `/incidents/{incidentId}/timeline/{eventId}`
Tracks immutable chronological actions taken by human operators and autonomous neural agents.

```json
{
  "eventId": "EVT-001",
  "timestamp": "2026-09-27T10:15:32.100Z",
  "actor": "CrossCameraVehicleCorrelationAgent",
  "actorType": "AI_AGENT",
  "action": "CORRELATED_NEXT_HOP",
  "notes": "Vehicle identified passing CAM-GND-002 traveling north at 74 km/h with 94.2% visual confidence."
}
```

### 3.4 Subcollection: `/incidents/{incidentId}/decisions/{decisionId}`
Preserves Human-in-the-Loop (HITL) audit logs under statutory BSA Section 63 evidentiary requirements.

```json
{
  "decisionId": "DEC-982",
  "timestamp": "2026-09-27T10:20:00.000Z",
  "officerBadge": "GP-CMD-7922",
  "officerName": "Commander Neha Raut",
  "decision": "DISPATCH_INTERCEPT_TEAM",
  "justification": "Plate GJ01AB1234 matched wanted FIR #442/2026 with dual-camera positive trajectory corridor."
}
```

---

## 4. Camera Metadata & Stream Topology Schema (`/cameras`)

### 4.1 Document ID Convention
* **Format:** `CAM-{DISTRICT}-{3DIGIT_NUMBER}`
* **Example:** `CAM-GND-012`, `CAM-AMD-004`

### 4.2 Root Document Structure (`/cameras/{cameraId}`)

| Field Name | Firestore Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Canonical CCTV camera identifier | `"CAM-GND-012"` |
| `name` | `string` | Yes | Operational deployment title | `"Sector 11 Junction North-West ANPR"` |
| `location` | `string` | Yes | Readable placement description | `"Near Mahatma Mandir Main Gate"` |
| `district` | `string` | Yes | District administrative division | `"Gandhinagar"` |
| `status` | `string` | Yes | Operational state | `"online"` \| `"offline"` \| `"warning"` |
| `sourceClassification` | `string` | Yes | Single source of truth connector state | `"REAL_CONNECTED"` \| `"YOUTUBE_DEMO"` |
| `sourceType` | `string` | Yes | Ingestion protocol / vendor connector | `"RTSP"` \| `"ONVIF"` \| `"VMS"` \| `"YOUTUBE_LIVE"` |
| `streamUrl` | `string` | No | Encrypted endpoint or stream channel | `"rtsp://edge-node-04.internal/stream1"` |
| `latitude` | `number` | Yes | Latitude in decimal degrees | `23.2156` |
| `longitude` | `number` | Yes | Longitude in decimal degrees | `72.6369` |
| `geoPoint` | `geopoint` | Yes | Firestore native spatial coordinate | `[23.2156, 72.6369]` |
| `fps` | `number` | Yes | Native configured frames-per-second | `25` |
| `resolution` | `string` | Yes | Frame pixel dimensions | `"1920x1080"` |
| `vendor` | `string` | No | Hardware device manufacturer | `"Hikvision"` \| `"Dahua"` \| `"CP Plus"` \| `"Axis"` |
| `model` | `string` | No | Hardware device model | `"DS-2CD7A26G0/P-IZHS"` |
| `vms` | `string` | No | Upstream Video Management System | `"Milestone XProtect"` \| `"Genetec"` |
| `edgeNodeId` | `string` | Yes | Edge computing unit executing inference | `"EDGE-GND-ZONE-02"` |
| `direction` | `string` | No | Compass field-of-view facing | `"North-East"` |
| `roadSegment` | `string` | No | Roadway classification | `"CH-Road Corridor"` |
| `lane` | `string` | No | Traffic lane assignment | `"Lane 1 - Fast Track"` |
| `lastActive` | `timestamp` | Yes | Last received frame heartbeat | `2026-09-27T10:45:00.000Z` |
| `alertCount` | `number` | Yes | Total active operational triggers today | `4` |

### 4.3 Subcollection: `/cameras/{cameraId}/telemetry/{telemetryId}`
Stores rolling diagnostic snapshots sampled every 60 seconds for health trends.

```json
{
  "timestamp": "2026-09-27T10:44:00.000Z",
  "state": "CONNECTED",
  "fps": 24.8,
  "bitrateKbps": 4200,
  "latencyMs": 142,
  "packetLossRate": 0.002,
  "reconnectCount": 0,
  "uptimeSeconds": 864000,
  "isSimulated": false
}
```

### 4.4 Subdocument: `/cameras/{cameraId}/intelligence_profile/default`
Maps the camera to the 13 specialized neural agents in the Sentinel Vision Fabric.

```json
{
  "cameraClass": "AI_SMART",
  "preferredDetector": "ANPR",
  "supportsANPR": true,
  "supportsHSRP": true,
  "supportsAdvancedVision": true,
  "aiEnabled": true,
  "processingPriority": "P0",
  "frameQuality": "HIGH",
  "totalDetectionsToday": 1482,
  "lastReadablePlate": "GJ01AB1234",
  "updatedAt": "2026-09-27T10:45:00.000Z"
}
```

---

## 5. Security Rules Definition (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOfficer() {
      return isSignedIn() && request.auth.token.role != null;
    }

    function isCommanderOrAdmin() {
      return isSignedIn() && (
        request.auth.token.role == 'ADMIN' || 
        request.auth.token.role == 'COMMANDER'
      );
    }

    function isValidIncident(data) {
      return data.incidentId is string && data.incidentId.size() <= 64 &&
             data.title is string && data.title.size() <= 256 &&
             data.type is string && data.type.size() <= 64 &&
             data.severity is string && data.severity.size() <= 32 &&
             data.status is string && data.status.size() <= 32 &&
             data.district is string && data.district.size() <= 64;
    }

    function isValidCamera(data) {
      return data.id is string && data.id.size() <= 64 &&
             data.name is string && data.name.size() <= 128 &&
             data.district is string && data.district.size() <= 64 &&
             data.status is string && data.status.size() <= 32;
    }

    // Incidents Collection
    match /incidents/{incidentId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isValidIncident(request.resource.data);
      allow update: if isSignedIn() && isValidIncident(request.resource.data);
      allow delete: if isCommanderOrAdmin();

      match /timeline/{eventId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
      }

      match /decisions/{decisionId} {
        allow read: if isSignedIn();
        allow create: if isCommanderOrAdmin();
      }

      match /evidence_links/{linkId} {
        allow read: if isSignedIn();
        allow write: if isCommanderOrAdmin();
      }
    }

    // Cameras Matrix Collection
    match /cameras/{cameraId} {
      allow read: if isSignedIn();
      allow create, update: if isCommanderOrAdmin() && isValidCamera(request.resource.data);
      allow delete: if isCommanderOrAdmin();

      match /telemetry/{telemetryId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
      }

      match /outages/{outageId} {
        allow read: if isSignedIn();
        allow write: if isCommanderOrAdmin();
      }

      match /intelligence_profile/{docId} {
        allow read: if isSignedIn();
        allow write: if isCommanderOrAdmin();
      }
    }
  }
}
```

---

## 6. Query Optimization & Indexing Plan

### 6.1 Critical Composite Indexes Required

| Collection | Fields Indexed | Query Use Case |
| :--- | :--- | :--- |
| `incidents` | `district` (ASC) + `status` (ASC) + `detectedAt` (DESC) | District-level live command triage board |
| `incidents` | `severity` (ASC) + `status` (ASC) + `detectedAt` (DESC) | High-priority statewide emergency escalation |
| `incidents` | `vehiclePlates` (ARRAY-CONTAINS) + `detectedAt` (DESC) | Cross-camera plate investigation search |
| `cameras` | `district` (ASC) + `status` (ASC) | District camera grid health status matrix |
| `cameras` | `sourceClassification` (ASC) + `status` (ASC) | Genuine live vs demo stream filter |

---

## 7. TypeScript Integration Mapping

All Firestore document structures directly correlate to existing TypeScript definitions:
* `/incidents/{id}` ↔ `IncidentRecord` (`src/types/operationalCommandTypes.ts`)
* `/cameras/{id}` ↔ `Camera` (`src/types.ts`)
* `/cameras/{id}/intelligence_profile/default` ↔ `CameraIntelligenceProfile` (`src/types.ts`)
* Access clearance queries ↔ `useSentinelAuth` (`src/hooks/useSentinelAuth.ts`)
