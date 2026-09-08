# Forensic Evidence Storage Specification & NAS Abstraction Layer
## Government Network-Attached Storage, WORM Immutability & Lifecycle Specification

**Document Version:** 2.3.0  
**Classification:** FORENSIC EVIDENCE SPECIFICATION / RESTRICTED  
**Jurisdiction:** Gujarat Police Central & District Forensic Evidence Repositories  
**Governing Statute:** Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)  

---

## 1. Storage Abstraction Architecture

Forensic storage in the Gujarat Police CCTV Intelligence Grid is decoupled from the underlying physical storage mechanism via the `IEvidenceStorageProvider` interface. The platform does not hardcode static paths (such as `/mnt/gov_secure_nas`) as absolute truths; all paths and cluster nodes are dynamically resolved, environment-configurable, and verified for accessibility at runtime.

### Storage Provider Implementations:
1. **`LocalFilesystemEvidenceProvider` (`LOCAL_FILESYSTEM`):**
   - Designed for standalone edge nodes, test sandboxes, and district command staging drives.
   - Stores encrypted binary evidence and metadata files locally on ext4/XFS filesystems.
2. **`NasEvidenceProvider` (`GOVERNMENT_NAS`):**
   - Production on-premise implementation utilizing high-availability Ceph (3x replication) or ZFS (RAID-Z2) clusters.
   - Enforces hardware WORM (Write-Once-Read-Many) policies to guarantee physical immutability for statutory retention periods (7 years).
3. **`FutureObjectStorageEvidenceProvider` (`OBJECT_STORAGE`):**
   - High-throughput S3/GCS API-compatible provider for hybrid state cloud tiers or long-term cold archives.

---

## 2. Storage Directory Topology & Configuration

Storage paths are organized hierarchically under a configurable root (`storageRoot`):

```
${storageRoot}/
  ├── evidence/             # Cryptographically sealed master frames & candidate crops
  │   └── ${YEAR}/${MONTH}/ # Partitioned by capture date (e.g. 2026/09/)
  ├── thumbnails/           # Low-resolution preview thumbnails for rapid UI rendering
  ├── crops/
  │   ├── plates/           # High-resolution license plate optical crops
  │   └── persons/          # Face and person bounding box crops
  ├── video_refs/           # Pointer manifests to DVR/NVR raw video clips on edge servers
  └── audit_trails/         # Tamper-evident JSON logs of access, verifications, and holds
```

### Storage Configuration Schema (`EvidenceStorageConfig`):
```typescript
export interface EvidenceStorageConfig {
  storageProvider: string;
  storageRoot: string;
  evidenceRoot: string;
  thumbnailRoot: string;
  plateCropRoot: string;
  personCropRoot: string;
  videoReferenceRoot: string;
  auditRoot: string;
  retentionPolicy: {
    rawVideoDays: number;            // 15 days (Traffic ITMS) or 30 days (Highways)
    statutoryEvidenceYears: number;  // 7 years (Statutory Electronic Evidence under BSA 2023)
    isTamperSealed: boolean;
    department?: string;
  };
  legalHoldPolicy: {
    enabled: boolean;
    allowedRoles: string[];
    statutoryBasis: string;
  };
}
```

---

## 3. Evidence Lifecycle State Machine

Every electronic evidence artifact transitions through an explicit, auditable 8-stage lifecycle:

```
[CAPTURED] ──> Frame or optical crop acquired by CCTV edge ingress agent
    │
    v
 [HASHED]  ──> Canonical JSON payload hashed with SHA-256 integrity digest
    │
    v
 [STORED]  ──> Written to WORM storage volume with immutable read-only flags
    │
    v
[VERIFIED] ──> Hash verified on disk; linked to officer review or dossier
    │
    v
[RETAINED] ──> Standard statutory custody period active (up to 7 years)
    │
    ├─── [LEGAL HOLD] ──> Judicial or departmental order prevents expiration
    │         │
    │         v (Order lifted by authorized officer)
    │    [RETAINED]
    │
    v (Statutory retention period elapses without legal hold)
 [EXPIRED] ──> Flagged for secure cryptographic shredding or migration
    │
    v
[ARCHIVED] ──> Transferred to offline cold vault or securely decommissioned
```

---

## 4. Mandatory Evidence Object Contract

Every stored electronic evidence record must contain the following comprehensive metadata fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `evidenceId` | `string` | Unique immutable evidence identifier (e.g. `EVD-202609-001294`). |
| `storageProvider` | `string` | Active provider (`LOCAL_FILESYSTEM`, `GOVERNMENT_NAS`, `OBJECT_STORAGE`). |
| `storageReference`| `string` | Full filesystem or cluster URI where the file is stored. |
| `sourceCamera` | `string` | Camera identifier where optical capture occurred (e.g. `CAM-007`). |
| `sourceType` | `string` | Ingress source (`REAL_CAMERA`, `REAL_ONVIF`, `REAL_RTSP`, `MOBILE_CAMERA`). |
| `timestamp` | `string` | ISO-8601 UTC timestamp of frame capture. |
| `GPS` | `{lat, lng}` | Calibrated geographic coordinates of the camera node. |
| `frameReference` | `string` | Reference URI of the original uncropped frame. |
| `sha256` | `string` | 64-character hexadecimal SHA-256 integrity digest of canonical payload. |
| `createdAt` | `string` | ISO-8601 timestamp when evidence record was created. |
| `retentionUntil` | `string` | Date until which evidence must remain preserved before expiration. |
| `retentionPolicy`| `object` | Policy parameters (department, raw days, statutory years, tamper seal). |
| `legalHold` | `boolean`| Flag indicating active judicial or investigative preservation lock. |
| `sourceOfTruth` | `string` | Provenance classification (`CAMERA_OBSERVED`, `EXTERNAL_AUTHORIZED`, etc.). |
| `missionId` | `string?`| Optional association with an active AI Investigation Mission. |
| `correlationId` | `string` | Association with vehicle trajectory, incident, or match candidate. |

---

## 5. Critical Technical & Legal Disclaimers

> ### ⚖️ STATUTORY EVIDENCE INTEGRITY NOTICE
> 1. **SHA-256 is an integrity digest.** It proves that data has not changed since the digest was computed.
> 2. **SHA-256 is NOT a digital signature.** It does not prove the legal identity or authority of the creator.
> 3. **SHA-256 alone does NOT establish legal chain of custody.**
> 4. Hardware-backed signing (via physical HSMs, PKI device certificates, and FIPS 140-2 Level 3 cryptographic tokens) represents the production path for court-certified evidentiary custody under the Bharatiya Sakshya Adhiniyam, 2023. These capabilities must never be falsely claimed without corresponding deployed physical infrastructure.
