# Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023) Compliance Guide
## Technical Procedures for Electronic Evidence Packages & Chain-of-Custody

**Document Version:** 2.3.0  
**Statutory Framework:** Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023)  
**Superseded Framework:** Indian Evidence Act, 1872 (Section 65B repealed)  
**Applicable Sections:** Sections 61, 62, 63, 65, 66, 73  

---

## 1. Statutory Transition: From Section 65B to BSA 2023

On 1 July 2024, the Indian Evidence Act, 1872 was repealed and replaced by the **Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)**. 

Under BSA 2023, electronic records are recognized as primary and secondary evidence under modernized statutory parameters:
- **Section 61:** Admissibility of electronic or digital records.
- **Section 62:** Primary electronic evidence (original media, simultaneous storage outputs).
- **Section 63:** Admissibility of electronic records produced by computers and computerized devices.
- **Section 65:** Formal conditions and certificate requirements for electronic evidence admissibility.

> ### 🛑 MANDATORY NOMENCLATURE DIRECTIVE
> Modern police and prosecution submissions must **NOT** refer to electronic evidence certificates merely as "Section 65B Certificates". All system exports, interfaces, and documentation must utilize the following legally accurate standard terminology:
> - **`ELECTRONIC EVIDENCE INTEGRITY PACKAGE`**
> - **`SHA-256 INTEGRITY VERIFICATION`**
> - **`EVIDENCE PROVENANCE`**
> - **`AUDIT METADATA`**

---

## 2. Standard Legal Statement of Technical Capability

The software platform asserts the following certified statutory compliance statement across all vehicle dossiers, person investigation packages, and forensic exports:

> **"The system produces technical electronic-evidence packages with SHA-256 verification digests and audit metadata designed for integration with applicable electronic-evidence procedures under the Bharatiya Sakshya Adhiniyam, 2023."**

---

## 3. Electronic Evidence Integrity Package Structure

When an investigator exports an Electronic Evidence Integrity Package for judicial submission, the system compiles a multi-layered evidentiary bundle containing:

```
[Electronic Evidence Integrity Package]
  ├── manifest.json
  │   ├── packageId: "PKG-BSA-2026-AHM-00891"
  │   ├── statutoryBasis: "Bharatiya Sakshya Adhiniyam, 2023 (Sections 61-65)"
  │   ├── compilationTimestamp: "2026-09-07T11:45:00.000Z"
  │   └── responsibleCustodian: "Inspector V. K. Jadeja (GP-CID-7842)"
  │
  ├── evidence_chain/
  │   ├── EVD-001.jpg (Raw Optical Frame) ──> sha256: e3b0c442...
  │   ├── EVD-001_crop.jpg (Plate / Face Crop) ──> sha256: 7a11956e...
  │   └── EVD-001_meta.json (Camera & Ingress Metadata) ──> sha256: b5d4045c...
  │
  ├── audit_lineage/
  │   ├── capture_device_info (Camera serial, IP, firmware version, calibration)
  │   ├── edge_processing_log (Inference engine version, model hash, timestamps)
  │   └── human_verification_records (Officer badge, decision timestamp, notes)
  │
  └── integrity_digest/
      ├── master_manifest_sha256: "8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c..."
      └── legal_custody_disclaimer: "SHA-256 is an integrity digest..."
```

---

## 4. Evidentiary Chain-of-Custody Requirements

To support lawful admission before a court of competent jurisdiction under Section 65 of BSA 2023, the software architecture guarantees that:

1. **Hardware & Sensor Provenance:** Every evidence record logs the physical camera identifier, geographic GPS coordinates, and edge ingress appliance ID that captured the image.
2. **Clock Synchronization:** All edge nodes and central servers synchronize clocks via an on-premise Stratum-1/Stratum-2 Network Time Protocol (NTP) server referenced to the National Physical Laboratory (NPL) standard.
3. **Continuous Audit Trail:** Every operator interaction—including search queries, candidate reviews, dossier views, and legal hold applications—is recorded immutably in the audit log.
4. **Separation of Fact and Inference:** The judicial package explicitly separates raw optical sensor observations (`CAMERA_OBSERVED`) from automated AI detections (`AI_INFERRED`) and human verification (`HUMAN_VERIFIED`).
5. **Physical Custodian Endorsement:** The automated package provides the technical foundation; it is accompanied by the physical signature and statutory declaration of the officer having lawful control of the computerized camera system during the period in question.
