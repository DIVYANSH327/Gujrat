/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * FederatedCctvService: Federated Department Source Normalization,
 * Multi-Cloud/Local Deployment Abstractions & Retention Policy Engine
 * 
 * Gujarat Unified CCTV Intelligence Grid V1.1
 */

import { 
  FederatedDepartmentSource, 
  DepartmentVideoRetentionPolicy,
  FederatedDepartmentType,
  IntegrationInfrastructureModel,
  FederatedIntegrationStatus
} from '../types';

export interface SmartCameraIntelligenceStep {
  stepNumber: number;
  label: string;
  subLabel: string;
  description: string;
  hardwareRole: 'LEGACY_OR_SMART_CCTV' | 'EDGE_COMPUTE' | 'LOCAL_AI' | 'TRANSPORT' | 'CENTRAL_INTELLIGENCE';
  isEdgeAiEnabled: boolean;
}

export const SMART_CAMERA_INTELLIGENCE_STEPS: SmartCameraIntelligenceStep[] = [
  {
    stepNumber: 1,
    label: 'Standard CCTV Camera',
    subLabel: 'RTSP / ONVIF Video Stream',
    description: 'Existing physical camera infrastructure (fixed dome, bullet, or PTZ). Does not require an embedded AI chipset.',
    hardwareRole: 'LEGACY_OR_SMART_CCTV',
    isEdgeAiEnabled: false
  },
  {
    stepNumber: 2,
    label: 'Edge Compute Node',
    subLabel: 'District / Substation Appliance',
    description: 'Hardware node running containerized Edge Agent software directly on site, substation, or municipal rack.',
    hardwareRole: 'EDGE_COMPUTE',
    isEdgeAiEnabled: true
  },
  {
    stepNumber: 3,
    label: 'Edge AI / Vision Inference',
    subLabel: 'ANPR / Vision / Safety Pipeline',
    description: 'Localized neural inference performs plate OCR, helmet classification, and vehicle telemetry without transmitting raw video across WAN.',
    hardwareRole: 'LOCAL_AI',
    isEdgeAiEnabled: true
  },
  {
    stepNumber: 4,
    label: 'Unified Event Standardization',
    subLabel: 'Lightweight JSON Telemetry',
    description: 'Normalizes diverse VMS/DVR payloads into standard SecurityEventPayload and StandardAnprEvent models.',
    hardwareRole: 'TRANSPORT',
    isEdgeAiEnabled: true
  },
  {
    stepNumber: 5,
    label: 'Central AI Agent Mesh',
    subLabel: 'Orchestrated Multi-Agent Fabric',
    description: 'Coordinates specialized micro-agents: VisionDetection, VehicleIntelligence, RoadSafety, Evidence, Watchlist, Alerts.',
    hardwareRole: 'CENTRAL_INTELLIGENCE',
    isEdgeAiEnabled: false
  },
  {
    stepNumber: 6,
    label: 'Prioritized Alert & God\'s Eye',
    subLabel: 'Human-in-the-Loop Operations',
    description: 'Presents verified detections, cryptographic SHA-256 evidence, and cross-camera corridor trajectories to command dispatchers.',
    hardwareRole: 'CENTRAL_INTELLIGENCE',
    isEdgeAiEnabled: false
  }
];

export const FEDERATED_DEPARTMENT_SOURCES: FederatedDepartmentSource[] = [
  {
    id: 'DEPT-TRAFFIC-01',
    name: 'Gujarat Municipal Traffic Police & ITMS',
    departmentType: 'TRAFFIC',
    jurisdiction: 'Ahmedabad, Surat, Vadodara, Rajkot Urban Intersections',
    infrastructureModel: 'HYBRID_INFRASTRUCTURE',
    integrationStatus: 'INTEGRATION_READY',
    targetCameraCapacity: 22400,
    actualConnectedCameras: 0,
    simulatedCameras: 22400,
    vmsType: 'Milestone XProtect / Qognify / Pelco VMS',
    retentionPolicy: {
      departmentType: 'TRAFFIC',
      departmentName: 'Gujarat Municipal Traffic Police',
      rawVideoRetentionDays: 15,
      isRawVideoExpired: false,
      eventMetadataRetentionYears: 3,
      evidenceRetentionYears: 7,
      policyNotes: 'Raw high-bitrate video purged after 15 days per departmental storage mandate. Standardized event metadata, vehicle sighting logs, and SHA-256 sealed evidence snapshots are retained for 3 to 7 years in immutable forensic cold storage.'
    },
    edgeAdaptersCount: 448,
    normalizationProtocol: 'EDGE_AGENT_NORMALIZED_EVENT_V1',
    disclaimer: 'Federated source model — Platform normalizes edge events over authorized adapters. Does not alter local storage or retention quotas.'
  },
  {
    id: 'DEPT-HIGHWAY-02',
    name: 'State Highway Authority & National Expressway Corridor',
    departmentType: 'HIGHWAY',
    jurisdiction: 'NE-1 (Ahmedabad-Vadodara Expressway), SH-41, Golden Corridor Toll Plazas',
    infrastructureModel: 'HYBRID_INFRASTRUCTURE',
    integrationStatus: 'CONFIGURED',
    targetCameraCapacity: 14800,
    actualConnectedCameras: 0,
    simulatedCameras: 14800,
    vmsType: 'Hikvision iVMS-5200 / Dahua DSS Pro / Toll Plaza NVRs',
    retentionPolicy: {
      departmentType: 'HIGHWAY',
      departmentName: 'State Highway Corridor Authority',
      rawVideoRetentionDays: 30,
      isRawVideoExpired: false,
      eventMetadataRetentionYears: 5,
      evidenceRetentionYears: 10,
      policyNotes: 'Highway toll and corridor raw video preserved for 30 days. Event metadata, ANPR optical logs, and incident evidence retained for 5 years.'
    },
    edgeAdaptersCount: 296,
    normalizationProtocol: 'EDGE_AGENT_NORMALIZED_EVENT_V1',
    disclaimer: 'Toll plaza & highway feeds federate via Edge Agents at local interchanges; raw video remains on highway authority storage.'
  },
  {
    id: 'DEPT-CITY-POLICE-03',
    name: 'City Police Commissionerate Surveillance Grid',
    departmentType: 'CITY_POLICE',
    jurisdiction: 'Ahmedabad City Police, Surat City Police, Vadodara & Rajkot Commissionerates',
    infrastructureModel: 'LOCAL_INFRASTRUCTURE',
    integrationStatus: 'INTEGRATION_READY',
    targetCameraCapacity: 34200,
    actualConnectedCameras: 0,
    simulatedCameras: 34200,
    vmsType: 'Smart City ICCC / Honeywell DVM / Genetec Omnicast',
    retentionPolicy: {
      departmentType: 'CITY_POLICE',
      departmentName: 'City Police Commissionerates',
      rawVideoRetentionDays: 30,
      isRawVideoExpired: false,
      eventMetadataRetentionYears: 5,
      evidenceRetentionYears: 10,
      policyNotes: 'Raw surveillance video stored on local SAN/NAS arrays for 30 days before automated overwriting. Detections matching active investigations receive permanent evidence preservation.'
    },
    edgeAdaptersCount: 684,
    normalizationProtocol: 'EDGE_AGENT_NORMALIZED_EVENT_V1',
    disclaimer: 'Police jurisdiction systems remain autonomous. Edge Agents capture structured visual events without centralizing multi-gigabit video feeds.'
  },
  {
    id: 'DEPT-OTHER-GOVT-04',
    name: 'Ports, Metrorail & Critical Infrastructure Authorities',
    departmentType: 'OTHER_GOVERNMENT',
    jurisdiction: 'Gujarat Maritime Board Ports, Metro Rail Terminals, GIDC Corridors',
    infrastructureModel: 'CLOUD_INFRASTRUCTURE',
    integrationStatus: 'FUTURE_INTEGRATION',
    targetCameraCapacity: 8600,
    actualConnectedCameras: 0,
    simulatedCameras: 8600,
    vmsType: 'Axis Camera Station / Bosch BVMS / Cloud VMS',
    retentionPolicy: {
      departmentType: 'OTHER_GOVERNMENT',
      departmentName: 'Transit & Maritime Infrastructure',
      rawVideoRetentionDays: 15,
      isRawVideoExpired: true,
      eventMetadataRetentionYears: 2,
      evidenceRetentionYears: 5,
      policyNotes: 'Transit terminal raw video retention expired (15-day limit reached). Pre-archived vehicle sighting metadata and evidence hashes remain cryptographically verifiable.'
    },
    edgeAdaptersCount: 172,
    normalizationProtocol: 'EDGE_AGENT_NORMALIZED_EVENT_V1',
    disclaimer: 'Future integration interface. All statistics represent architectural capacity allocation.'
  }
];

export class FederatedCctvService {
  private sources: FederatedDepartmentSource[] = [...FEDERATED_DEPARTMENT_SOURCES];

  public getAllSources(): FederatedDepartmentSource[] {
    return [...this.sources];
  }

  public getSourceById(id: string): FederatedDepartmentSource | undefined {
    return this.sources.find(s => s.id === id);
  }

  public getSourcesByType(type: FederatedDepartmentType): FederatedDepartmentSource[] {
    return this.sources.filter(s => s.departmentType === type);
  }

  public getTargetCapacitySum(): number {
    return this.sources.reduce((sum, s) => sum + s.targetCameraCapacity, 0);
  }

  public getActualConnectedCameras(): number {
    return this.sources.reduce((sum, s) => sum + s.actualConnectedCameras, 0);
  }

  public checkRawVideoRetention(
    departmentId: string, 
    videoTimestampIso: string
  ): { isExpired: boolean; daysRemaining: number; statusText: string } {
    const source = this.getSourceById(departmentId);
    const retentionDays = source?.retentionPolicy.rawVideoRetentionDays || 15;
    const videoAgeDays = (Date.now() - new Date(videoTimestampIso).getTime()) / (1000 * 60 * 60 * 24);

    if (videoAgeDays > retentionDays) {
      return {
        isExpired: true,
        daysRemaining: 0,
        statusText: 'RAW VIDEO: RETENTION EXPIRED'
      };
    }

    const daysRemaining = Math.max(0, Math.round(retentionDays - videoAgeDays));
    return {
      isExpired: false,
      daysRemaining,
      statusText: `RAW VIDEO RETENTION: ${daysRemaining} DAYS REMAINING (${retentionDays} DAY POLICY)`
    };
  }

  public resolveDepartmentForCamera(cameraId: string): FederatedDepartmentSource {
    const upper = (cameraId || '').toUpperCase();
    if (upper.includes('023') || upper.includes('HIGHWAY') || upper.includes('TOLL')) {
      return this.getSourceById('DEPT-HIGHWAY-02') || this.sources[1];
    }
    if (upper.includes('007') || upper.includes('014') || upper.includes('TRAFFIC') || upper.includes('ITMS')) {
      return this.getSourceById('DEPT-TRAFFIC-01') || this.sources[0];
    }
    if (upper.includes('042') || upper.includes('PORT') || upper.includes('METRO') || upper.includes('TRANSIT')) {
      return this.getSourceById('DEPT-OTHER-GOVT-04') || this.sources[3];
    }
    return this.getSourceById('DEPT-CITY-POLICE-03') || this.sources[2];
  }

  public getRetentionStatusForSighting(
    cameraId: string, 
    videoTimestampIso: string
  ): {
    department: FederatedDepartmentSource;
    isRawVideoExpired: boolean;
    daysRemaining: number;
    rawRetentionDays: number;
    evidenceRetentionYears: number;
    statusText: string;
    isEvidenceArchived: boolean;
  } {
    const department = this.resolveDepartmentForCamera(cameraId);
    const retentionDays = department.retentionPolicy.rawVideoRetentionDays;
    const videoAgeDays = Math.max(0, (Date.now() - new Date(videoTimestampIso).getTime()) / (1000 * 60 * 60 * 24));
    const isRawVideoExpired = videoAgeDays > retentionDays;
    const daysRemaining = Math.max(0, Math.round(retentionDays - videoAgeDays));

    return {
      department,
      isRawVideoExpired,
      daysRemaining,
      rawRetentionDays: retentionDays,
      evidenceRetentionYears: department.retentionPolicy.evidenceRetentionYears,
      statusText: isRawVideoExpired 
        ? `RAW EXPIRED (${retentionDays}d policy) • FORENSIC SEALS PRESERVED`
        : `RAW AVAILABLE (${daysRemaining}d of ${retentionDays}d remaining)`,
      isEvidenceArchived: true
    };
  }

  /**
   * 26-Department Statewide Integration Registry
   * Reflects autonomous department source ownership and integration readiness.
   */
  public get26DepartmentIntegrations() {
    return [
      { id: 'DEP-01', name: 'Ahmedabad City Police Commissionerate', tech: 'Milestone / ICCC', cameras: 12400, status: 'INTEGRATION_READY', rawDays: 30 },
      { id: 'DEP-02', name: 'Surat City Police Commissionerate', tech: 'Honeywell DVM', cameras: 8900, status: 'INTEGRATION_READY', rawDays: 30 },
      { id: 'DEP-03', name: 'Vadodara City Police Commissionerate', tech: 'Genetec Omnicast', cameras: 5400, status: 'INTEGRATION_READY', rawDays: 30 },
      { id: 'DEP-04', name: 'Rajkot City Police Commissionerate', tech: 'Hikvision iVMS', cameras: 4200, status: 'INTEGRATION_READY', rawDays: 30 },
      { id: 'DEP-05', name: 'Gandhinagar Capital Zone Police', tech: 'Qognify VMS', cameras: 3300, status: 'INTEGRATION_READY', rawDays: 30 },
      { id: 'DEP-06', name: 'Gujarat State Highway Police Patrol', tech: 'Dahua DSS Pro', cameras: 6200, status: 'INTEGRATION_READY', rawDays: 30 },
      { id: 'DEP-07', name: 'Ahmedabad Municipal Corporation ITMS', tech: 'Pelco VideoXpert', cameras: 7800, status: 'INTEGRATION_READY', rawDays: 15 },
      { id: 'DEP-08', name: 'Surat Municipal Corporation ITMS', tech: 'Siemens Siveillance', cameras: 5100, status: 'INTEGRATION_READY', rawDays: 15 },
      { id: 'DEP-09', name: 'Vadodara Municipal Corporation ITMS', tech: 'Hikvision Central', cameras: 3100, status: 'INTEGRATION_READY', rawDays: 15 },
      { id: 'DEP-10', name: 'Rajkot Municipal Corporation ITMS', tech: 'Dahua Central', cameras: 2600, status: 'INTEGRATION_READY', rawDays: 15 },
      { id: 'DEP-11', name: 'GSRTC Central Bus Terminal Grid', tech: 'Bosch BVMS', cameras: 2900, status: 'SIMULATED', rawDays: 15 },
      { id: 'DEP-12', name: 'Gujarat Maritime Board (GMB) Ports', tech: 'Axis Camera Station', cameras: 3400, status: 'SIMULATED', rawDays: 30 },
      { id: 'DEP-13', name: 'Gujarat Metro Rail Corporation (GMRC)', tech: 'Genetec Security Center', cameras: 1800, status: 'SIMULATED', rawDays: 15 },
      { id: 'DEP-14', name: 'NHAI Gujarat Highway Corridors', tech: 'Toll Plaza VMS/ANPR', cameras: 4100, status: 'INTEGRATION_READY', rawDays: 30 },
      { id: 'DEP-15', name: 'Gujarat Forest & Gir Wildlife Grid', tech: 'Solar Edge PTZ / Thermal', cameras: 950, status: 'FUTURE', rawDays: 15 },
      { id: 'DEP-16', name: 'GIDC Industrial Corridor Surveillance', tech: 'CP Plus UVR Edge', cameras: 2200, status: 'SIMULATED', rawDays: 15 },
      { id: 'DEP-17', name: 'SVPI Airport Perimeter & Approach Grid', tech: 'Honeywell Enterprise', cameras: 1400, status: 'INTEGRATION_READY', rawDays: 30 },
      { id: 'DEP-18', name: 'GSDMA Disaster Command Network', tech: 'Disaster Emergency VMS', cameras: 1100, status: 'FUTURE', rawDays: 15 },
      { id: 'DEP-19', name: 'Western Railway Gujarat Division', tech: 'RailTel Integrated VMS', cameras: 2400, status: 'FUTURE', rawDays: 30 },
      { id: 'DEP-20', name: 'Mines & Minerals Checkpost Grid', tech: 'ANPR Border Checkposts', cameras: 850, status: 'FUTURE', rawDays: 15 },
      { id: 'DEP-21', name: 'Prohibition & Excise Border Checkposts', tech: 'ANPR Barrier Grid', cameras: 680, status: 'INTEGRATION_READY', rawDays: 30 },
      { id: 'DEP-22', name: 'Coastal Security Gujarat Police Command', tech: 'Radar/Long-range Electro-Optic', cameras: 520, status: 'FUTURE', rawDays: 30 },
      { id: 'DEP-23', name: 'Pilgrimage & Heritage Tourism Surveillance', tech: 'Crowd VMS (Somnath/Dwarka/SoU)', cameras: 1950, status: 'SIMULATED', rawDays: 15 },
      { id: 'DEP-24', name: 'GSEB Exam Center Monitoring Cell', tech: 'Encrypted Streaming NVR', cameras: 3100, status: 'FUTURE', rawDays: 15 },
      { id: 'DEP-25', name: 'Civil Hospital Perimeter Network', tech: 'CP Plus HD DVRs', cameras: 1750, status: 'FUTURE', rawDays: 15 },
      { id: 'DEP-26', name: 'State Revenue & Registration Bhavan Grid', tech: 'Standard ONVIF NVR', cameras: 900, status: 'FUTURE', rawDays: 15 },
    ];
  }
}

export const federatedCctvService = new FederatedCctvService();
