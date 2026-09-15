/**
 * Camera Profile Registry
 * Gujarat Police CCTV & AI Intelligence Platform
 * 
 * Maps camera nodes to authentic vision profiles:
 * - CAM-01: TRAFFIC_HIGHWAY (01 Chiman bhai Bridge, Ahmedabad)
 * - CAM-07: TRAFFIC_JUNCTION (Kalupur / Relief Road, Ahmedabad)
 * - CAM-14: TRANSIT_HUB (SVPI Airport Corridor, Ahmedabad)
 */

import { CameraVisionProfile, CameraVisionProfileType } from './VisionTypes.js';

export class CameraProfileRegistry {
  private profiles: Map<string, CameraVisionProfile> = new Map();

  constructor() {
    this.seedProfiles();
  }

  private seedProfiles(): void {
    // CAM-01: Chiman bhai Bridge Highway Corridor
    this.profiles.set('cam01', {
      cameraId: 'cam01',
      cameraName: '01 Chiman bhai Bridge (Corp8 Sentinel Live)',
      profileName: 'TRAFFIC_HIGHWAY',
      allowedCapabilities: {
        objectDetection: true,
        vehicleDetection: true,
        personDetection: false,
        trafficAnalysis: true,
        platePipeline: true,
        nightMode: true,
        thermalMode: false,
        ptzMode: false
      },
      preferredEngine: 'AUTO',
      frameSamplingRateHz: 2.0,
      confidenceThreshold: 0.35,
      location: 'Chiman bhai Patel Bridge, Sabarmati River Corridor, Ahmedabad',
      coordinates: {
        latitude: 23.0225,
        longitude: 72.5714
      }
    });

    // CAM-07: Kalupur Junction
    this.profiles.set('cam07', {
      cameraId: 'cam07',
      cameraName: '07 Kalupur Junction (Old City East)',
      profileName: 'TRAFFIC_JUNCTION',
      allowedCapabilities: {
        objectDetection: true,
        vehicleDetection: true,
        personDetection: true,
        trafficAnalysis: true,
        platePipeline: true,
        nightMode: true,
        thermalMode: false,
        ptzMode: true
      },
      preferredEngine: 'AUTO',
      frameSamplingRateHz: 3.0,
      confidenceThreshold: 0.40,
      location: 'Kalupur Railway Station Crossroad, Ahmedabad',
      coordinates: {
        latitude: 23.0300,
        longitude: 72.5950
      }
    });

    // CAM-14: Airport Corridor Transit Hub
    this.profiles.set('cam14', {
      cameraId: 'cam14',
      cameraName: '14 SVPI Airport Corridor (Hansol Expressway)',
      profileName: 'TRANSIT_HUB',
      allowedCapabilities: {
        objectDetection: true,
        vehicleDetection: true,
        personDetection: true,
        trafficAnalysis: true,
        platePipeline: true,
        nightMode: true,
        thermalMode: true,
        ptzMode: false
      },
      preferredEngine: 'AUTO',
      frameSamplingRateHz: 4.0,
      confidenceThreshold: 0.30,
      location: 'Airport Road Hansol Corridor, Ahmedabad',
      coordinates: {
        latitude: 23.0725,
        longitude: 72.6310
      }
    });
  }

  public getProfile(cameraId: string): CameraVisionProfile {
    const normalizedId = cameraId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = this.profiles.get(normalizedId) || this.profiles.get(cameraId);
    if (found) return found;

    // Default profile for any generic camera
    return {
      cameraId,
      cameraName: `Camera ${cameraId.toUpperCase()}`,
      profileName: 'GENERAL_SURVEILLANCE',
      allowedCapabilities: {
        objectDetection: true,
        vehicleDetection: true,
        personDetection: true,
        trafficAnalysis: true,
        platePipeline: true,
        nightMode: false,
        thermalMode: false,
        ptzMode: false
      },
      preferredEngine: 'AUTO',
      frameSamplingRateHz: 2.0,
      confidenceThreshold: 0.35,
      location: 'Ahmedabad Metro Surveillance Grid',
      coordinates: {
        latitude: 23.0225,
        longitude: 72.5714
      }
    };
  }

  public getAllProfiles(): CameraVisionProfile[] {
    return Array.from(this.profiles.values());
  }

  public updateProfile(cameraId: string, partial: Partial<CameraVisionProfile>): CameraVisionProfile {
    const current = this.getProfile(cameraId);
    const updated: CameraVisionProfile = {
      ...current,
      ...partial,
      allowedCapabilities: {
        ...current.allowedCapabilities,
        ...(partial.allowedCapabilities || {})
      }
    };
    this.profiles.set(cameraId, updated);
    return updated;
  }
}

export const cameraProfileRegistry = new CameraProfileRegistry();
