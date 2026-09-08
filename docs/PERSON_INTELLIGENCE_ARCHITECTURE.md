# Person Intelligence, Face Watchlist & Biometric Verification Architecture
## Statutory Governance & Multi-Modal Correlation Specification

**Document Version:** 2.3.0  
**Classification:** POLICE INVESTIGATION SPECIFICATION / RESTRICTED  
**Jurisdiction:** Gujarat Police State Intelligence Grid  
**Governing Statute:** Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)  

---

## 1. Fundamental Legal & Ethical Tenets

The person intelligence subsystem adheres to the strictest statutory and constitutional safeguards established under Indian jurisprudence:

> ### ⚠️ THE CARDINAL BIOMETRIC PRINCIPLES
> 1. **A face detection is NOT an identity.**
> 2. **A similarity score is NOT legal certainty.**
> 3. **A watchlist candidate is NOT confirmation.**
> 4. **AI-generated identity candidates must NEVER automatically trigger arrest, detention, interception, or punitive enforcement action.**

All biometric matching outputs are legally classified as **investigative leads** requiring sworn police officer corroboration and independent procedural justification under Sections 63–65 of the Bharatiya Sakshya Adhiniyam, 2023.

---

## 2. Person & Face Observation Pipeline

```
[Camera Optical Stream]
         |
         v
[YOLOv10 / RetinaFace Detector] ──> Extracts Person & Face Bounding Boxes
         |
         v
[Optical Quality Gate]
  - Sharpness (Laplacian Variance >= 0.65)
  - Illumination (Normalized Lumen 0.60 - 0.95)
  - Frontal Pose (Yaw <= +/-15°, Pitch <= +/-10°)
  - Resolution (Min 160x200 px Face Crop)
         |
         v (If Band is OPTIMAL or ACCEPTABLE)
[On-Premises ResNet-100 / FaceNet Feature Extractor]
  - Generates 512-dimensional vector embedding
  - Immediately converts to secure tokenized reference: `EMB-TOKEN-<hash>`
  - Raw floating-point vectors are NEVER logged or exposed to client UI
         |
         v
[Biometric Provenance Tagging]
  - Flagged strictly as `CAMERA_OBSERVED` & `AI_INFERRED`
  - SHA-256 integrity hash computed on canonical frame payload
  - Archived into Government Forensic WORM NAS Vault
```

---

## 3. Multi-Signal Candidate Correlation Engine

When an observed face observation is compared against an active, legally sanctioned watchlist target (e.g., Non-Bailable Warrant under Section 302 IPC / BNS, organized crime, missing person alert), the system evaluates a composite multi-signal matrix rather than relying solely on raw vector distance:

| Signal Identifier | Weight (%) | Description & Threshold |
| :--- | :---: | :--- |
| **Biometric Cosine Similarity** | 40%–45% | Tokenized vector match >= 0.78 (Operational threshold) / >= 0.88 (High confidence). |
| **Optical Quality & Sharpness** | 20%–25% | Guarantees match was not triggered by noisy, low-resolution artifacts. |
| **Frontal Pose Concordance** | 15%–20% | Penalizes oblique or extreme yaw angles where distortion occurs. |
| **Temporal Corridor Consistency** | 10%–15% | Evaluates whether physical speed between previous sightings is plausible. |
| **Correlated Vehicle Sighting** | 15%–20% | Boosts confidence if the person is detected co-incident with a known associated vehicle. |

### Conflicting Signal Detection:
The engine actively scans for and highlights contradictory data, such as:
- Physical impossibility (e.g., subject sighted in Surat 15 minutes after Ahmedabad sighting).
- Severe occlusion (sunglasses, masks, brimmed headgear covering >30% facial landmarks).
- Optical lighting mismatches (extreme backlight or harsh directional shadows).

---

## 4. Human-in-the-Loop Verification Queue (Mandatory Gateway)

```
[Candidate Match Generated]
            |
            v
[Auto-Flagged: WATCHLIST_CANDIDATE (No Police Action Permitted)]
            |
            v
[Dispatched to Central Human Review Queue]
            |
            v
[Reviewing Police Officer Evaluation]
  - Side-by-side comparison of enrolled reference vs. CCTV crop
  - Contextual inspection of multi-signal weights & conflicting flags
  - Examination of co-occurring vehicle telemetry and road corridor
            |
            +---------------------------+---------------------------+
            |                           |                           |
            v                           v                           v
   [HUMAN_VERIFIED]            [HUMAN_REJECTED]                 [DISPUTED]
(Officer signs review with   (Recorded as false match;    (Escalated to Senior SP /
 Badge ID & Case Notes;      Suppresses duplicate alerts; Inspector for secondary
 Enables advisory alert)     Improves model auditing)      forensic examination)
```

---

## 5. Master Person Investigation Dossier

The `UnifiedPersonInvestigationService` synthesizes a comprehensive investigation dossier for sanctioned subjects:
- **Chronological Sightings Timeline:** Detailed record of every camera node visited, district traversed, and transit speed.
- **Cross-Modal Vehicle Links:** Correlates observed license plates and vehicle models co-located with the subject across multiple junctions.
- **Cryptographic Evidence Chain:** Each sighting is bound to its immutable NAS storage path and SHA-256 hash.
- **Statutory Admissibility Notice:** Formal notice under Sections 61, 62, 63, and 65 of the Bharatiya Sakshya Adhiniyam, 2023.
