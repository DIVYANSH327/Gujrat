/**
 * MOCK VMS ADAPTER — DEMONSTRATION ONLY
 * Status: INTEGRATION READY / DEMONSTRATION ONLY
 * 
 * Notice: Demonstrates how enterprise Video Management Systems (e.g., Milestone XProtect,
 * Genetec Security Center, HikCentral, Dahua DSS) plug into the unified Edge Agent architecture
 * without central server vendor lock-in.
 * 
 * CREDENTIAL SAFETY: Never hardcode credentials. In live deployment, session tokens or OAuth
 * credentials are exchanged securely at the Edge layer via configuration injection.
 */

import { IVendorVMSAdapter } from '../../types';

export interface VMSAdapterConfig {
  vmsEndpoint: string;
  vmsVendor: 'GENERIC-MOCK' | 'MILESTONE-SPEC' | 'GENETEC-SPEC' | 'HIKVISION-SPEC';
  siteId?: string;
  isDemoOnly?: boolean;
}

export class MockVendorVMSAdapter implements IVendorVMSAdapter {
  public readonly adapterClassification = 'MOCK VMS ADAPTER — DEMONSTRATION ONLY';
  public readonly vendorName = 'GENERIC-MOCK';
  private isAuthenticated: boolean = false;
  private config: VMSAdapterConfig;

  constructor(config: VMSAdapterConfig = { vmsEndpoint: 'https://vms.local:8443', vmsVendor: 'GENERIC-MOCK', isDemoOnly: true }) {
    this.config = config;
  }

  async authenticate(): Promise<boolean> {
    // Demonstrates secure handshake with VMS gateway
    this.isAuthenticated = true;
    return true;
  }

  async listDevices(): Promise<any[]> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
    return [
      {
        deviceId: 'VMS-DEV-001',
        name: 'Ahmedabad East Gateway NVR',
        vendor: this.config.vmsVendor,
        channelCount: 32,
        status: 'online',
        ipAddress: '10.14.20.5'
      },
      {
        deviceId: 'VMS-DEV-002',
        name: 'Surat Ring Road Junction NVR',
        vendor: this.config.vmsVendor,
        channelCount: 16,
        status: 'online',
        ipAddress: '10.14.30.12'
      }
    ];
  }

  async listChannels(deviceId: string): Promise<any[]> {
    return [
      {
        channelId: `${deviceId}-CH01`,
        channelNumber: 1,
        name: `${deviceId} Primary Optical`,
        status: 'online',
        streamUrl: `rtsp://vms.local:554/${deviceId}/ch1`,
        resolution: '1920x1080',
        fps: 25
      },
      {
        channelId: `${deviceId}-CH02`,
        channelNumber: 2,
        name: `${deviceId} Secondary Approach`,
        status: 'online',
        streamUrl: `rtsp://vms.local:554/${deviceId}/ch2`,
        resolution: '1920x1080',
        fps: 25
      }
    ];
  }

  async getCameraStatus(cameraId: string): Promise<'online' | 'offline' | 'degraded'> {
    return 'online';
  }

  async getSnapshot(cameraId: string): Promise<string> {
    return `https://vms.local/api/rest/v1/cameras/${cameraId}/snapshot`;
  }

  async getStream(cameraId: string): Promise<string> {
    return `rtsp://vms.local:554/live/${cameraId}`;
  }

  async queryRecordings(cameraId: string, timeRange?: any): Promise<any[]> {
    return [
      {
        recordingId: `REC-${cameraId}-001`,
        startTime: timeRange?.start || new Date(Date.now() - 7200000).toISOString(),
        endTime: timeRange?.end || new Date().toISOString(),
        durationSeconds: 7200,
        streamType: 'continuous'
      }
    ];
  }
}
