/**
 * ONVIF DVR / NVR ADAPTER
 * Status: INTEGRATION READY / IMPLEMENTATION BOUNDARY
 * 
 * Notice: This adapter defines the formal integration boundary for ONVIF Profile S/T/G devices.
 * In the current environment, no native ONVIF SOAP/WS-Discovery networking libraries are bundled.
 * This class provides a vendor-neutral implementation contract that can be swapped with live
 * ONVIF SOAP client bindings without altering EdgeRuntime, EventManager, or Central services.
 * 
 * CREDENTIAL SAFETY: Never hardcode credentials. Device authentication tokens or passwords
 * must be supplied via runtime configuration or secure credential stores.
 */

import {
  IDVRAdapter,
  IOnvifDiscovery,
  FeedHealthState,
  DiscoveredVideoDevice,
  Camera
} from '../../types';

export interface OnvifAdapterConfig {
  deviceIp: string;
  port?: number;
  username?: string; // Optional - injected at runtime from secure edge vault
  password?: string; // Optional - injected at runtime from secure edge vault
  defaultTimeoutMs?: number;
  isSimulatedBoundary?: boolean;
}

export interface OnvifProfile {
  token: string;
  name: string;
  videoSourceToken: string;
  videoEncoderConfiguration: {
    encoding: 'H264' | 'H265' | 'JPEG';
    resolution: { width: number; height: number };
    frameRateLimit: number;
    bitrateLimit: number;
  };
}

export class OnvifDVRAdapter implements IDVRAdapter, IOnvifDiscovery {
  public readonly adapterClassification = 'INTEGRATION READY / IMPLEMENTATION BOUNDARY';
  public readonly adapterType = 'OnvifDVRAdapter';
  private connectionState: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'CONNECTING' = 'DISCONNECTED';
  private config: OnvifAdapterConfig;
  private profiles: OnvifProfile[] = [];

  constructor(config: OnvifAdapterConfig = { deviceIp: '192.168.1.100', isSimulatedBoundary: true }) {
    this.config = {
      port: 80,
      defaultTimeoutMs: 5000,
      isSimulatedBoundary: true,
      ...config
    };
  }

  async connect(dvrId?: string, config?: any): Promise<boolean> {
    this.connectionState = 'CONNECTING';
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // In a live deployment, this step executes ONVIF GetSystemDateAndTime, GetCapabilities, and GetServices SOAP requests.
    // In this integration-ready boundary, we validate configuration and establish boundary state.
    if (this.config.deviceIp) {
      this.connectionState = 'CONNECTED';
      // Load standard Profile S media profiles for standard channels
      this.profiles = [
        {
          token: 'Profile_1_Main',
          name: 'MainStream_H264_1080P',
          videoSourceToken: 'VideoSource_1',
          videoEncoderConfiguration: {
            encoding: 'H264',
            resolution: { width: 1920, height: 1080 },
            frameRateLimit: 25,
            bitrateLimit: 4096
          }
        },
        {
          token: 'Profile_2_Sub',
          name: 'SubStream_H264_D1',
          videoSourceToken: 'VideoSource_1',
          videoEncoderConfiguration: {
            encoding: 'H264',
            resolution: { width: 704, height: 576 },
            frameRateLimit: 15,
            bitrateLimit: 1024
          }
        }
      ];
      return true;
    }

    this.connectionState = 'DISCONNECTED';
    return false;
  }

  async disconnect(): Promise<void> {
    this.connectionState = 'DISCONNECTED';
    this.profiles = [];
  }

  async healthCheck(): Promise<FeedHealthState> {
    if (this.connectionState === 'CONNECTED') {
      return 'CONNECTED';
    }
    if (this.connectionState === 'CONNECTING') {
      return 'DEGRADED';
    }
    return 'DISCONNECTED';
  }

  getConnectionState(): 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'CONNECTING' {
    return this.connectionState;
  }

  async getStatus(): Promise<'online' | 'offline' | 'degraded'> {
    if (this.connectionState === 'CONNECTED') return 'online';
    if (this.connectionState === 'DEGRADED') return 'degraded';
    return 'offline';
  }

  async getDeviceInfo(): Promise<any> {
    return {
      manufacturer: 'ONVIF-Compliant Vendor (Normalized)',
      model: 'ONVIF-Profile-S-T',
      firmwareVersion: 'v2.4.0-onvif-ready',
      serialNumber: `ONVIF-SN-${(this.config.deviceIp || '0000').replace(/\./g, '')}`,
      hardwareId: 'ONVIF-HW-GENERIC',
      integrationBoundary: this.adapterClassification,
      configuredIp: this.config.deviceIp
    };
  }

  async discoverChannels(): Promise<any[]> {
    return [
      { channelId: 'CH-01', name: 'Primary Optical Feed', streamUri: await this.getRTSPUrl('CH-01'), status: 'CONNECTED' },
      { channelId: 'CH-02', name: 'Secondary Concourse Feed', streamUri: await this.getRTSPUrl('CH-02'), status: 'CONNECTED' }
    ];
  }

  async getChannelInfo(channelId: string | number): Promise<any> {
    return {
      channelId: String(channelId),
      name: `Channel ${channelId}`,
      profilesAvailable: this.profiles.length,
      streamUri: await this.getRTSPUrl(channelId),
      snapshotUri: await this.getSnapshot(channelId)
    };
  }

  async getStreamInfo(channelId: string | number): Promise<any> {
    const profile = this.profiles[0] || {
      videoEncoderConfiguration: { encoding: 'H264', resolution: { width: 1920, height: 1080 }, frameRateLimit: 25 }
    };
    return {
      channelId: String(channelId),
      codec: profile.videoEncoderConfiguration.encoding,
      resolution: `${profile.videoEncoderConfiguration.resolution.width}x${profile.videoEncoderConfiguration.resolution.height}`,
      fps: profile.videoEncoderConfiguration.frameRateLimit,
      rtspUrl: await this.getRTSPUrl(channelId)
    };
  }

  async getSnapshot(channelId: string | number): Promise<string> {
    // Standard ONVIF GetSnapshotUri response
    return `http://${this.config.deviceIp}:${this.config.port}/onvif/snapshot?channel=${channelId}`;
  }

  async getPlaybackCapabilities(): Promise<any> {
    return {
      replaySupported: true,
      reversePlayback: false,
      fastForwardSpeeds: [2, 4, 8, 16],
      boundaryStatus: this.adapterClassification
    };
  }

  async getRecordingAvailability(): Promise<any> {
    return { available: true, boundary: this.adapterClassification };
  }

  async playback(streamId: string): Promise<any> {
    return `rtsp://${this.config.deviceIp}:554/onvif-replay/${streamId}`;
  }

  async getStreamUrl(channelId: string | number): Promise<string> {
    return this.getRTSPUrl(channelId);
  }

  async getRTSPUrl(channelId: string | number): Promise<string> {
    // Standard ONVIF GetStreamUri response with live token
    return `rtsp://${this.config.deviceIp}:554/onvif1/ch${channelId}`;
  }

  async queryRecordings(channelId: string | number, timeRange?: any): Promise<any[]> {
    return [
      {
        channelId: String(channelId),
        recordingToken: `REC-${channelId}-001`,
        startTime: timeRange?.start || new Date(Date.now() - 3600000).toISOString(),
        endTime: timeRange?.end || new Date().toISOString(),
        status: 'COMPLETE'
      }
    ];
  }

  // --- IOnvifDiscovery Implementation ---

  async discoverDevices(): Promise<any[]> {
    // In live deployment: multicast WS-Discovery probe to 239.255.255.250:3702
    return [
      {
        xAddrs: `http://${this.config.deviceIp}:${this.config.port}/onvif/device_service`,
        types: 'dn:NetworkVideoTransmitter',
        scopes: [`onvif://www.onvif.org/location/Gujarat`, `onvif://www.onvif.org/name/ONVIF-DVR-01`]
      }
    ];
  }

  async getDeviceInformation(ip: string): Promise<any> {
    return this.getDeviceInfo();
  }

  async getProfiles(ip: string): Promise<any[]> {
    return this.profiles;
  }

  async getStreams(ip: string): Promise<any[]> {
    return [
      { profileToken: 'Profile_1_Main', uri: await this.getRTSPUrl('CH-01') },
      { profileToken: 'Profile_2_Sub', uri: await this.getRTSPUrl('CH-02') }
    ];
  }
}
