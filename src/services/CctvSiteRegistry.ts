import { CctvSite, GatewayStatus, CctvIntegrationStatus, SourceClassification, RetentionPolicy } from '../types';

export interface ChannelRegistration {
  channelId: string;
  siteId: string;
  channelNumber: number;
  name: string;
  protocol: string;
  sourceClassification: SourceClassification;
  isConnected: boolean;
  discoveredAt: string;
}

export class CctvSiteRegistry {
  private static instance: CctvSiteRegistry;
  private sites: Map<string, CctvSite> = new Map();
  private channels: Map<string, ChannelRegistration> = new Map();

  private constructor() {
    this.seedDefaultSites();
  }

  public static getInstance(): CctvSiteRegistry {
    if (!CctvSiteRegistry.instance) {
      CctvSiteRegistry.instance = new CctvSiteRegistry();
    }
    return CctvSiteRegistry.instance;
  }

  private seedDefaultSites(): void {
    const defaultRetention: RetentionPolicy = {
      rawVideoRetentionDays: 15,
      eventRetentionYears: 3,
      evidenceRetentionYears: 7,
      isRawVideoExpired: false,
    };

    const seedData: CctvSite[] = [
      {
        siteId: 'SITE-AHM-001',
        siteName: 'Ahmedabad SG Highway Command Junction',
        district: 'Ahmedabad',
        location: 'SG Highway Corridor (Pakwan - Iscon)',
        department: 'Traffic ITMS',
        gatewayId: 'GW-AHM-EDGE-01',
        gatewayStatus: 'CONNECTED',
        dvrVendor: 'CP Plus',
        dvrModel: 'CP-UVR-1601E-V3 (16-Ch HD/IP)',
        dvrAddress: '192.168.10.50',
        protocol: 'CP_PLUS / ONVIF Profile S',
        channelCount: 16,
        discoveredChannelCount: 16,
        connectedChannelCount: 0, // Real stream connectivity must be verified
        lastHeartbeat: new Date().toISOString(),
        integrationStatus: 'INTEGRATION_READY',
        retentionPolicy: { ...defaultRetention, rawVideoRetentionDays: 15 },
        networkStatus: 'ONLINE',
        securityStatus: 'SECURE',
        sourceClassification: 'SYNTHETIC_SIMULATION',
        notes: 'Simulated site profile for SG Highway Edge node corridor.',
      },
      {
        siteId: 'SITE-AHM-002',
        siteName: 'Ashram Road Junction Control Node',
        district: 'Ahmedabad',
        location: 'Ashram Road / Usmanpura Cross',
        department: 'City Police CCTV Command',
        gatewayId: 'GW-AHM-EDGE-02',
        gatewayStatus: 'CONNECTED',
        dvrVendor: 'Hikvision',
        dvrModel: 'DS-7616NI-K2/16P NVR',
        dvrAddress: '192.168.12.30',
        protocol: 'ISAPI / ONVIF Profile T',
        channelCount: 16,
        discoveredChannelCount: 16,
        connectedChannelCount: 0,
        lastHeartbeat: new Date().toISOString(),
        integrationStatus: 'INTEGRATION_READY',
        retentionPolicy: { ...defaultRetention, rawVideoRetentionDays: 30 },
        networkStatus: 'ONLINE',
        securityStatus: 'SECURE',
        sourceClassification: 'SYNTHETIC_SIMULATION',
        notes: 'Simulated Ashram road traffic junction.',
      },
      {
        siteId: 'SITE-SUR-001',
        siteName: 'Surat Ring Road Toll & Traffic Hub',
        district: 'Surat',
        location: 'Majura Gate - Ring Road Crossing',
        department: 'Surat Smart City ITMS',
        gatewayId: 'GW-SUR-EDGE-01',
        gatewayStatus: 'CONNECTED',
        dvrVendor: 'Dahua',
        dvrModel: 'NVR5216-4KS2 Pro Series',
        dvrAddress: '192.168.20.100',
        protocol: 'Dahua RPC / RTSP',
        channelCount: 16,
        discoveredChannelCount: 16,
        connectedChannelCount: 0,
        lastHeartbeat: new Date().toISOString(),
        integrationStatus: 'INTEGRATION_READY',
        retentionPolicy: { ...defaultRetention, rawVideoRetentionDays: 15 },
        networkStatus: 'ONLINE',
        securityStatus: 'SECURE',
        sourceClassification: 'SYNTHETIC_SIMULATION',
        notes: 'Simulated Surat Smart City surveillance junction.',
      },
      {
        siteId: 'SITE-VAD-001',
        siteName: 'Vadodara Express Corridor Post',
        district: 'Vadodara',
        location: 'Sayajigunj Circle Intercept',
        department: 'Highway Patrol Grid',
        gatewayId: 'GW-VAD-EDGE-01',
        gatewayStatus: 'CONNECTED',
        dvrVendor: 'CP Plus',
        dvrModel: 'CP-UVR-0801E-V2',
        dvrAddress: '192.168.30.40',
        protocol: 'CP_PLUS / RTSP Stream Adapter',
        channelCount: 8,
        discoveredChannelCount: 8,
        connectedChannelCount: 0,
        lastHeartbeat: new Date().toISOString(),
        integrationStatus: 'INTEGRATION_READY',
        retentionPolicy: { ...defaultRetention, rawVideoRetentionDays: 30 },
        networkStatus: 'ONLINE',
        securityStatus: 'SECURE',
        sourceClassification: 'SYNTHETIC_SIMULATION',
        notes: 'Simulated highway corridor station.',
      },
    ];

    for (const site of seedData) {
      this.sites.set(site.siteId, site);
    }
  }

  public registerSite(site: CctvSite): { success: boolean; message: string } {
    if (!site.siteId || !site.siteName) {
      return { success: false, message: 'Invalid site payload: siteId and siteName are required' };
    }

    // Enforce source classification rule:
    if (!site.sourceClassification) {
      site.sourceClassification = 'SYNTHETIC_SIMULATION';
    }

    // Never infer REAL_CONNECTED from config alone
    if (site.sourceClassification === 'REAL_CONNECTED' && site.connectedChannelCount === 0) {
      site.sourceClassification = 'REAL_CONFIGURED_NOT_CONNECTED';
    }

    this.sites.set(site.siteId, {
      ...site,
      lastHeartbeat: site.lastHeartbeat || new Date().toISOString(),
    });

    return { success: true, message: `Site ${site.siteId} registered successfully.` };
  }

  public getSite(siteId: string): CctvSite | undefined {
    return this.sites.get(siteId);
  }

  public listSites(): CctvSite[] {
    return Array.from(this.sites.values());
  }

  public updateGatewayStatus(siteId: string, gatewayStatus: GatewayStatus): boolean {
    const site = this.sites.get(siteId);
    if (!site) return false;
    site.gatewayStatus = gatewayStatus;
    site.lastHeartbeat = new Date().toISOString();
    return true;
  }

  public updateDiscoveryStatus(
    siteId: string, 
    discoveredCount: number, 
    integrationStatus?: CctvIntegrationStatus
  ): boolean {
    const site = this.sites.get(siteId);
    if (!site) return false;
    site.discoveredChannelCount = discoveredCount;
    if (integrationStatus) {
      site.integrationStatus = integrationStatus;
    }
    site.lastHeartbeat = new Date().toISOString();
    return true;
  }

  public registerDiscoveredChannel(channel: ChannelRegistration): void {
    this.channels.set(channel.channelId, channel);
    const site = this.sites.get(channel.siteId);
    if (site) {
      site.discoveredChannelCount = this.getChannelsForSite(channel.siteId).length;
    }
  }

  public markChannelConnected(channelId: string, siteId: string): boolean {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.isConnected = true;
      channel.sourceClassification = 'REAL_CONNECTED';
    }

    const site = this.sites.get(siteId);
    if (site) {
      const connected = Array.from(this.channels.values()).filter(c => c.siteId === siteId && c.isConnected).length;
      site.connectedChannelCount = connected;
      if (connected > 0) {
        site.sourceClassification = 'REAL_CONNECTED';
        site.integrationStatus = 'CONNECTED';
      }
      return true;
    }
    return false;
  }

  public markChannelDisconnected(channelId: string, siteId: string): boolean {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.isConnected = false;
      channel.sourceClassification = 'REAL_CONFIGURED_NOT_CONNECTED';
    }

    const site = this.sites.get(siteId);
    if (site) {
      const connected = Array.from(this.channels.values()).filter(c => c.siteId === siteId && c.isConnected).length;
      site.connectedChannelCount = connected;
      if (connected === 0 && site.sourceClassification === 'REAL_CONNECTED') {
        site.sourceClassification = 'REAL_CONFIGURED_NOT_CONNECTED';
        site.integrationStatus = 'INTEGRATION_READY';
      }
      return true;
    }
    return false;
  }

  public getChannelsForSite(siteId: string): ChannelRegistration[] {
    return Array.from(this.channels.values()).filter(c => c.siteId === siteId);
  }

  public resetToDefault(): void {
    this.sites.clear();
    this.channels.clear();
    this.seedDefaultSites();
  }
}

export const cctvSiteRegistry = CctvSiteRegistry.getInstance();
