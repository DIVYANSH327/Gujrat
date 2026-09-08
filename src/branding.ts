/**
 * Copyright © 2026 DIVYANSH Shrivastava.
 * All Rights Reserved.
 * 
 * Centralized Project Identity, Authorship & Integrity Configuration
 * Single Source of Truth for attribution, licensing, build, and integrity metadata.
 */

export const PROJECT_IDENTITY = {
  // Identity
  id: "DIVYANSH-CCTV-AI",
  name: "Gujarat Police CCTV & AI Intelligence Platform",
  systemName: "Gujarat Police AI CCTV Command Center",
  shortName: "Gujarat Police AI CCTV",
  tagline: "Vendor-agnostic edge-to-central CCTV integration and AI intelligence platform.",
  
  // Authorship & Role
  author: "DIVYANSH Shrivastava",
  role: "Concept & Engineering",
  madeBy: "Made by DIVYANSH Shrivastava",
  conceptAndEngineering: "Concept & Engineering: DIVYANSH Shrivastava",
  
  // Ownership & Copyright
  copyright: "© 2026 DIVYANSH Shrivastava — All Rights Reserved",
  copyrightNotice: "© 2026 DIVYANSH Shrivastava — All Rights Reserved",
  ownershipNotice: "© 2026 DIVYANSH Shrivastava",
  year: 2026,
  sourceCodeCopyright: "Copyright (c) 2026 DIVYANSH Shrivastava. All rights reserved.",
  
  // Licensing & Status
  license: "Proprietary",
  licenseNotice: "Proprietary Demonstration Software — See LICENSE.txt",
  projectStatus: "Proprietary Demonstration Software",
  
  // Build & Versioning
  version: "v0.7.2-PROD",
  buildId: "BUILD-20260905-072-REL",
  buildTimestamp: "2026-09-05T04:20:00Z",
  
  // Tamper-Evident Integrity
  integrityAlgorithm: "SHA-256",
  releaseIntegrityHash: "9b12a86df70b92e35a1cb5d6e2e283ca462886f4a3bfec6c646efbbdfce747c3",
  releaseHashStatus: "AVAILABLE IN RELEASE MANIFEST",
  releaseManifestPath: "/release-manifest.json",
  integrityLabel: "Release Integrity Hash",
  integrityPurpose: "Tamper-evident release verification and artifact modification detection",
  
  // Demonstration Notices
  demonstrationNotice: "The project contains synthetic/demo components. YouTube sources are demonstration video sources only. Synthetic AI detections, synthetic investigation subjects, synthetic evidence, and simulated integrations must not be represented as real police surveillance or real biometric identification.",
  
  // Third-Party Notice
  thirdPartyNotice: "Third-party libraries (React, Vite, Express, Lucide, Tailwind CSS) and specifications (ONVIF, RTSP) are the property of their respective copyright holders and are utilized under their applicable licenses."
} as const;

export const PROJECT_BRANDING = PROJECT_IDENTITY;
