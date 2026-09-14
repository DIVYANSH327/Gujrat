/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Mobile Patrol Unit Dashcam & Qwen AI Vision HSRP Types
 */

export type HsrpComplianceStatus = 
  | 'HSRP_COMPLIANT' 
  | 'SUSPECT_NON_HSRP' 
  | 'TAMPERED_HSRP' 
  | 'UNREADABLE';

export type MeshJudicialDecision = 
  | 'HSRP_VERIFIED' 
  | 'HSRP_NOT_VERIFIED' 
  | 'NEEDS_BETTER_CAPTURE' 
  | 'UNCERTAIN';

export interface HsrpSecurityFeatures {
  indBlueStrip: boolean;          // Left blue margin with 'IND'
  ashokaChakraHologram: boolean;  // 20mm x 20mm chromium hot-stamped Ashoka Chakra
  laserEtchedPin: boolean;        // 10-digit unique laser-etched alphanumeric code
  indiaHotStampFoil: boolean;     // 45-degree "INDIA" inscription on hot-stamped black foil
  snapLockRivets: boolean;        // Non-reusable snap-lock fasteners
  retroReflectiveBg: boolean;     // High retro-reflectivity sheeting (white/yellow/green)
}

export interface QwenHsrpDetection {
  id: string;
  vehicleClass: string;
  vehicleConfidence: number;
  vehicleBox: { x: number; y: number; width: number; height: number };
  plateBox: { x: number; y: number; width: number; height: number };
  plateText: string;
  plateConfidence: number;
  isHsrp: boolean;
  hsrpStatus: HsrpComplianceStatus;
  hsrpConfidence: number;
  features: HsrpSecurityFeatures;
  analysisSummary: string;
  plateCropBase64?: string;
}

export interface AgentDeliberationItem {
  agentName: string;
  role: string;
  verdict: string;
  confidence: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: Record<string, any>;
  notes: string[];
}

export interface AIMeshJudicialVerdict {
  verdictId: string;
  timestamp: string;
  unitId: string;
  officerCallSign: string;
  plateText: string;
  vehicleClass: string;
  decision: MeshJudicialDecision;
  confidence: number;
  qualityScore: number;
  fullSnapshotUrl: string;
  plateCropUrl: string;
  sha256: string;
  gps?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
  };
  speedKmH: number;
  aiEngineUsed: string;
  bsaCertificate: {
    statute: string;
    section: string;
    evidenceHash: string;
    custodyChain: string;
    timestampIso: string;
    certifiedBy: string;
  };
  agentDeliberations: {
    vehicleClassification: AgentDeliberationItem;
    evidenceQuality: AgentDeliberationItem;
    plateOcr: AgentDeliberationItem;
    hsrpForensics: AgentDeliberationItem;
    vehiclePlateConsistency: AgentDeliberationItem;
    finalMeshArbiter: {
      decision: MeshJudicialDecision;
      legalClause: string;
      challanEligible: boolean;
      suggestedPenalty: string;
      enforcementAction: string;
      summary: string;
    };
  };
  actionsTaken: {
    challanIssued: boolean;
    challanId?: string;
    watchlistFlagged: boolean;
    forensicArchived: boolean;
  };
}

export interface MobilePatrolSnapshot {
  id: string;
  timestamp: string;
  vehicleClass: string;
  plateText: string;
  snapshotDataUrl: string;
  plateCropDataUrl?: string;
  sha256: string;
  gps: {
    lat: number;
    lon: number;
    acc?: number;
  };
  speedKmH: number;
  unitId: string;
  aiEngine: 'Qwen 2.5-VL Vision' | 'Gemini 3.8 Flash';
  hsrpStatus: HsrpComplianceStatus;
  features: HsrpSecurityFeatures;
  meshStatus: 'UNASSIGNED' | 'ASSIGNED' | 'JUDGED';
  verdict?: AIMeshJudicialVerdict;
}
