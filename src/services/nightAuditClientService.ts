/**
 * Night Audit Client Service
 * Gujarat Police AI CCTV Intelligence Platform
 */

import {
  AuditSessionStatus,
  CameraAuditMetric,
  NightAuditConfig,
  NightAuditEvidenceItem,
  NightAuditReport
} from '../types.js';

export interface NightAuditStatusResponse {
  auditId: string;
  status: AuditSessionStatus;
  startTimeUtc: string;
  endTimeUtc: string;
  timezone: string;
  operator: string;
  totalCameras: number;
  onlineCameras: number;
  offlineCameras: number;
  bufferingCameras: number;
  averageCoveragePercent: number;
  totalFramesExpected: number;
  totalFramesReceived: number;
  totalFramesAnalyzed: number;
  totalFramesRejected: number;
  totalPersonsDetected: number;
  totalVehiclesDetected: number;
  totalPlatesDetected: number;
  totalPlatesRead: number;
  totalHsrpVerified: number;
  totalHsrpNonCompliant: number;
  totalHsrpUnverified: number;
  totalEvidenceSnapshots: number;
  aiSuccessCount: number;
  aiFailureCount: number;
  aiProvider: string;
  aiModel: string;
}

export class NightAuditClientService {
  private static instance: NightAuditClientService;

  public static getInstance(): NightAuditClientService {
    if (!NightAuditClientService.instance) {
      NightAuditClientService.instance = new NightAuditClientService();
    }
    return NightAuditClientService.instance;
  }

  public async getStatus(): Promise<NightAuditStatusResponse> {
    const res = await fetch('/api/night-audit/status');
    if (!res.ok) throw new Error('Failed to fetch Night Audit status');
    return res.json();
  }

  public async startAudit(auditId?: string, config?: Partial<NightAuditConfig>): Promise<{ success: boolean; auditId: string; status: AuditSessionStatus; startedAt: string }> {
    const res = await fetch('/api/night-audit/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId, config })
    });
    if (!res.ok) throw new Error('Failed to start Night Audit');
    return res.json();
  }

  public async pauseAudit(): Promise<{ success: boolean; status: AuditSessionStatus }> {
    const res = await fetch('/api/night-audit/pause', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause Night Audit');
    return res.json();
  }

  public async resumeAudit(): Promise<{ success: boolean; status: AuditSessionStatus }> {
    const res = await fetch('/api/night-audit/resume', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resume Night Audit');
    return res.json();
  }

  public async stopAudit(): Promise<{ success: boolean; auditId: string; status: AuditSessionStatus; endedAt: string }> {
    const res = await fetch('/api/night-audit/stop', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop Night Audit');
    return res.json();
  }

  public async triggerCycle(cameraId?: string): Promise<{ success: boolean; status: NightAuditStatusResponse }> {
    const res = await fetch('/api/night-audit/cycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cameraId })
    });
    if (!res.ok) throw new Error('Failed to trigger audit cycle');
    return res.json();
  }

  public async getCameras(): Promise<CameraAuditMetric[]> {
    const res = await fetch('/api/night-audit/cameras');
    if (!res.ok) throw new Error('Failed to fetch camera matrix');
    return res.json();
  }

  public async getCameraDetail(cameraId: string): Promise<CameraAuditMetric> {
    const res = await fetch(`/api/night-audit/camera/${encodeURIComponent(cameraId)}`);
    if (!res.ok) throw new Error(`Failed to fetch camera details for ${cameraId}`);
    return res.json();
  }

  public async getEvidence(filters?: {
    cameraId?: string;
    plateText?: string;
    hsrpStatus?: string;
    eventType?: string;
    vehicleClass?: string;
    evidenceId?: string;
  }): Promise<NightAuditEvidenceItem[]> {
    const params = new URLSearchParams();
    if (filters?.cameraId) params.set('cameraId', filters.cameraId);
    if (filters?.plateText) params.set('plateText', filters.plateText);
    if (filters?.hsrpStatus) params.set('hsrpStatus', filters.hsrpStatus);
    if (filters?.eventType) params.set('eventType', filters.eventType);
    if (filters?.vehicleClass) params.set('vehicleClass', filters.vehicleClass);
    if (filters?.evidenceId) params.set('evidenceId', filters.evidenceId);

    const res = await fetch(`/api/night-audit/evidence?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch evidence list');
    return res.json();
  }

  public async getReport(): Promise<NightAuditReport> {
    const res = await fetch('/api/night-audit/report');
    if (!res.ok) throw new Error('Failed to fetch Night Audit report');
    return res.json();
  }

  public async getConfig(): Promise<NightAuditConfig> {
    const res = await fetch('/api/night-audit/config');
    if (!res.ok) throw new Error('Failed to fetch Night Audit configuration');
    return res.json();
  }

  public async updateConfig(config: Partial<NightAuditConfig>): Promise<NightAuditConfig> {
    const res = await fetch('/api/night-audit/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update configuration');
    return res.json();
  }

  // RESTful Session Helpers
  public async getAuditSession(sessionId: string): Promise<any> {
    const res = await fetch(`/api/audit/night/${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error(`Failed to fetch audit session ${sessionId}`);
    return res.json();
  }

  public async stopAuditSession(sessionId: string): Promise<any> {
    const res = await fetch(`/api/audit/night/${encodeURIComponent(sessionId)}/stop`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to stop audit session ${sessionId}`);
    return res.json();
  }

  public async getSessionEvents(sessionId: string, limit: number = 100): Promise<any> {
    const res = await fetch(`/api/audit/night/${encodeURIComponent(sessionId)}/events?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch events for session ${sessionId}`);
    return res.json();
  }

  public async getSessionEvidence(sessionId: string, filters?: any): Promise<any> {
    const params = new URLSearchParams(filters || {});
    const res = await fetch(`/api/audit/night/${encodeURIComponent(sessionId)}/evidence?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch evidence for session ${sessionId}`);
    return res.json();
  }
}

export const nightAuditClientService = NightAuditClientService.getInstance();
