/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Police Data Integration Registry Service
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { vahanAdapter, VahanIntegrationStatus } from './integrations/VahanAdapter';
import { echallanAdapter, EChallanIntegrationStatus } from './integrations/EChallanAdapter';
import { egujcopAdapter, EGujCopIntegrationStatus } from './integrations/EGujCopAdapter';
import { afisAdapter, AFISIntegrationStatus } from './integrations/AFISAdapter';

export interface PoliceIntegrationNode {
  id: string;
  name: string;
  code: 'VAHAN' | 'ECHALLAN' | 'EGUJCOP' | 'AFIS' | 'CP_PLUS' | 'ONVIF';
  purpose: string;
  category: 'VEHICLE_REGISTRY' | 'TRAFFIC_ENFORCEMENT' | 'POLICE_RECORDS' | 'FORENSIC_BIOMETRICS' | 'CCTV_HARDWARE';
  status: 'CONNECTED' | 'INTEGRATION_READY' | 'FUTURE_AUTHORIZED_INTEGRATION' | 'SIMULATED' | 'NOT_CONNECTED';
  lastHealthCheck: string;
  authenticationState: 'MUTUAL_TLS_READY' | 'API_KEY_CONFIGURED' | 'NOT_CONFIGURED' | 'MOCK_SANDBOX';
  dataClassification: 'RESTRICTED_GOVERNMENT' | 'LAW_ENFORCEMENT_SENSITIVE' | 'PUBLIC_METADATA';
  availableOperations: string[];
  disclaimer: string;
  endpointUrl?: string;
  protocol: string;
  department: string;
}

class PoliceDataIntegrationRegistry {
  private integrations: PoliceIntegrationNode[] = [
    {
      id: 'INT-VAHAN-01',
      name: 'VAHAN 4.0 National Vehicle Registry',
      code: 'VAHAN',
      purpose: 'Retrieves authorized vehicle registration status, make, model, color, fuel type, and RTO authority.',
      category: 'VEHICLE_REGISTRY',
      status: 'FUTURE_AUTHORIZED_INTEGRATION',
      lastHealthCheck: new Date().toISOString(),
      authenticationState: 'NOT_CONFIGURED',
      dataClassification: 'RESTRICTED_GOVERNMENT',
      availableOperations: ['lookupVehicleRegistration', 'verifyPlateMatch', 'getRtoJurisdiction'],
      disclaimer: 'FUTURE AUTHORIZED INTEGRATION — Strictly requires State Transport Department authentication certificate.',
      endpointUrl: 'https://vahan.parivahan.gov.in/api/v4 (Abstracted)',
      protocol: 'REST / JSON + mTLS',
      department: 'Gujarat State Transport Department / MoRTH'
    },
    {
      id: 'INT-ECHALLAN-02',
      name: 'Gujarat eChallan Traffic Enforcement Gateway',
      code: 'ECHALLAN',
      purpose: 'Correlates outstanding traffic violations, pending fines, red light crossings, and speed infractions with detected plates.',
      category: 'TRAFFIC_ENFORCEMENT',
      status: 'FUTURE_AUTHORIZED_INTEGRATION',
      lastHealthCheck: new Date().toISOString(),
      authenticationState: 'NOT_CONFIGURED',
      dataClassification: 'LAW_ENFORCEMENT_SENSITIVE',
      availableOperations: ['lookupChallansByVehicle', 'getViolationHistory', 'verifyPendingFines'],
      disclaimer: 'DEMO CONNECTOR AVAILABLE — Simulated traffic challan lookup enabled for prototype evaluation.',
      endpointUrl: 'https://echallan.gujarat.gov.in/api/v2 (Abstracted)',
      protocol: 'REST / HTTPS + API Token',
      department: 'Gujarat Traffic Police'
    },
    {
      id: 'INT-EGUJCOP-03',
      name: 'eGujCop / CCTNS Core Police Records Integration',
      code: 'EGUJCOP',
      purpose: 'Correlates active First Information Reports (FIRs), judicial warrants, BOLO interception bulletins, and missing vehicle alerts.',
      category: 'POLICE_RECORDS',
      status: 'FUTURE_AUTHORIZED_INTEGRATION',
      lastHealthCheck: new Date().toISOString(),
      authenticationState: 'NOT_CONFIGURED',
      dataClassification: 'RESTRICTED_GOVERNMENT',
      availableOperations: ['lookupVehicle', 'lookupIncident', 'lookupWatchlist', 'getFirSummary'],
      disclaimer: 'FUTURE AUTHORIZED INTEGRATION — Direct connectivity requires State Crime Records Bureau (SCRB) security clearance.',
      endpointUrl: 'https://egujcop.gujarat.gov.in/cctns/api/v1 (Abstracted)',
      protocol: 'Secure GovNet / SOAP + REST',
      department: 'Gujarat Police / State Crime Records Bureau (SCRB)'
    },
    {
      id: 'INT-AFIS-04',
      name: 'Automated Fingerprint / Forensic Biometrics Adapter (AFIS)',
      code: 'AFIS',
      purpose: 'Isolated forensic candidate reference comparison for post-incident investigation. Strictly non-autonomous.',
      category: 'FORENSIC_BIOMETRICS',
      status: 'FUTURE_AUTHORIZED_INTEGRATION',
      lastHealthCheck: new Date().toISOString(),
      authenticationState: 'NOT_CONFIGURED',
      dataClassification: 'RESTRICTED_GOVERNMENT',
      availableOperations: ['requestCandidateVisualCorrelation'],
      disclaimer: 'ISOLATED FORENSIC INTERFACE — Person visual correlation only; autonomous identity determination strictly prohibited.',
      endpointUrl: 'https://afis.police.gov.in/forensic (Isolated)',
      protocol: 'Air-Gapped / Isolated RPC',
      department: 'Directorate of Forensic Sciences (DFS), Gandhinagar'
    },
    {
      id: 'INT-CPPLUS-05',
      name: 'CP PLUS DVR / NVR Hardware Adapter',
      code: 'CP_PLUS',
      purpose: 'Direct hardware adapter for CP PLUS Orange and Indigo series multi-channel DVRs/NVRs across Gujarat police stations.',
      category: 'CCTV_HARDWARE',
      status: 'SIMULATED',
      lastHealthCheck: new Date().toISOString(),
      authenticationState: 'MOCK_SANDBOX',
      dataClassification: 'PUBLIC_METADATA',
      availableOperations: ['discoverChannels', 'getSnapshot', 'getStreamUrl', 'healthCheck'],
      disclaimer: 'INTEGRATION READY / SIMULATED — Interoperable with CP PLUS SDK and RTSP fallback.',
      endpointUrl: 'tcp://192.168.1.100:37777',
      protocol: 'CP-PLUS Private Protocol / RTSP',
      department: 'Police Station Local Infrastructure'
    },
    {
      id: 'INT-ONVIF-06',
      name: 'ONVIF Profile S/G/T Standard Interoperability Adapter',
      code: 'ONVIF',
      purpose: 'Universal open camera standard for multi-vendor PTZ, fixed dome, and bullet cameras.',
      category: 'CCTV_HARDWARE',
      status: 'SIMULATED',
      lastHealthCheck: new Date().toISOString(),
      authenticationState: 'MOCK_SANDBOX',
      dataClassification: 'PUBLIC_METADATA',
      availableOperations: ['discoverDevices', 'getProfiles', 'getStreams', 'healthCheck'],
      disclaimer: 'SIMULATED ADAPTER — Compliant with ONVIF Core Specification 2.0+.',
      endpointUrl: 'http://192.168.1.200:80/onvif/device_service',
      protocol: 'ONVIF / WS-Discovery / RTSP',
      department: 'Smart City & Highway Surveillance Infrastructure'
    }
  ];

  public getAllIntegrations(): PoliceIntegrationNode[] {
    return [...this.integrations];
  }

  public getIntegrationByCode(code: string): PoliceIntegrationNode | undefined {
    return this.integrations.find(i => i.code === code);
  }

  public toggleSimulationMode(code: 'VAHAN' | 'ECHALLAN' | 'EGUJCOP' | 'AFIS', enableSimulation: boolean): void {
    const node = this.integrations.find(i => i.code === code);
    if (!node) return;

    if (enableSimulation) {
      node.status = 'SIMULATED';
      node.authenticationState = 'MOCK_SANDBOX';
      if (code === 'VAHAN') vahanAdapter.setStatus('SIMULATED');
      if (code === 'ECHALLAN') echallanAdapter.setStatus('SIMULATED');
      if (code === 'EGUJCOP') egujcopAdapter.setStatus('SIMULATED');
    } else {
      node.status = 'FUTURE_AUTHORIZED_INTEGRATION';
      node.authenticationState = 'NOT_CONFIGURED';
      if (code === 'VAHAN') vahanAdapter.setStatus('FUTURE');
      if (code === 'ECHALLAN') echallanAdapter.setStatus('FUTURE');
      if (code === 'EGUJCOP') egujcopAdapter.setStatus('FUTURE');
    }
    node.lastHealthCheck = new Date().toISOString();
  }
}

export const policeDataIntegrationRegistry = new PoliceDataIntegrationRegistry();
