/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Police Mobile Vision Unit Fleet Registry & Unified Grid
 */

import { 
  MobileVisionUnit, 
  PatrolCameraMode,
  PatrolEventCategory,
  PatrolEventEvidence
} from '../../types/mobilePatrolTypes';
import { mobilePatrolNodeService } from './MobilePatrolNodeService';

class MobileVisionUnitRegistry {
  private static instance: MobileVisionUnitRegistry;

  private units: Map<string, MobileVisionUnit> = new Map();
  private subscribers: Set<(units: MobileVisionUnit[]) => void> = new Set();

  private constructor() {
    this.seedCanonicalUnits();
  }

  public static getInstance(): MobileVisionUnitRegistry {
    if (!MobileVisionUnitRegistry.instance) {
      MobileVisionUnitRegistry.instance = new MobileVisionUnitRegistry();
    }
    return MobileVisionUnitRegistry.instance;
  }

  public getAllUnits(): MobileVisionUnit[] {
    return Array.from(this.units.values());
  }

  public getUnitById(unitId: string): MobileVisionUnit | undefined {
    return this.units.get(unitId);
  }

  public getActiveUnit(): MobileVisionUnit {
    return this.units.get('MVU-001') || Array.from(this.units.values())[0];
  }

  public updateUnitStatus(unitId: string, status: MobileVisionUnit['status'], gps?: MobileVisionUnit['gps']): void {
    const unit = this.units.get(unitId);
    if (unit) {
      unit.status = status;
      unit.lastHeartbeat = new Date().toISOString();
      if (gps) {
        unit.gps = gps;
        unit.heading = gps.heading;
        unit.speed = gps.speedKmH;
      }
      this.notifySubscribers();
    }
  }

  public setUnitCameraMode(unitId: string, mode: PatrolCameraMode): void {
    const unit = this.units.get(unitId);
    if (unit) {
      unit.cameraType = mode;
      unit.cameraCapabilities = {
        ...unit.cameraCapabilities,
        anpr: mode === 'ANPR' || mode === 'PATROL_ANPR_CAMERA' || mode === 'MULTI_CAMERA',
        '4k': mode === 'NORMAL_4K' || mode === 'PATROL_4K_CAMERA' || mode === 'MULTI_CAMERA',
        ptz: mode === 'PTZ'
      };
      this.notifySubscribers();
    }
  }

  /**
   * Unified search across vehicles, unit IDs, camera IDs, event types, and HSRP status
   */
  public searchObservations(query: {
    term?: string;
    unitId?: string;
    eventType?: PatrolEventCategory;
    startDate?: string;
    endDate?: string;
    hsrpOnly?: boolean;
    noPlateOnly?: boolean;
  }): {
    units: MobileVisionUnit[];
    events: PatrolEventEvidence[];
    trajectoryMatches: Array<{
      nodeType: 'FIXED_CCTV' | 'MOBILE_UNIT';
      nodeId: string;
      plateText: string;
      timestamp: string;
      gps: { lat: number; lng: number };
      status: 'OBSERVED' | 'VERIFIED';
    }>;
  } {
    const term = (query.term || '').trim().toUpperCase();
    const allEvents = mobilePatrolNodeService.getEvents();

    const matchedUnits = Array.from(this.units.values()).filter(u => {
      if (!term) return true;
      return (
        u.unitId.toUpperCase().includes(term) ||
        u.vehicleId.toUpperCase().includes(term) ||
        u.registrationNumber.toUpperCase().includes(term) ||
        u.assignedSector.toUpperCase().includes(term)
      );
    });

    const matchedEvents = allEvents.filter(evt => {
      if (query.unitId && evt.vehicleId !== query.unitId && evt.cameraId !== query.unitId) {
        return false;
      }
      if (query.eventType && evt.category !== query.eventType) {
        return false;
      }
      if (query.noPlateOnly && evt.category !== 'NO_PLATE' && evt.category !== 'NO_PLATE_CANDIDATE') {
        return false;
      }
      if (query.hsrpOnly && evt.hsrpStatus !== 'HSRP_VERIFIED' && evt.category !== 'HSRP_VERIFIED') {
        return false;
      }
      if (term) {
        return (
          evt.plateText.toUpperCase().includes(term) ||
          evt.eventId.toUpperCase().includes(term) ||
          evt.cameraId.toUpperCase().includes(term) ||
          evt.category.toUpperCase().includes(term)
        );
      }
      return true;
    });

    // Simulated multi-point journey correlation (e.g. CAM-014 -> MVU-007 -> CAM-023)
    const trajectoryMatches: Array<{
      nodeType: 'FIXED_CCTV' | 'MOBILE_UNIT';
      nodeId: string;
      plateText: string;
      timestamp: string;
      gps: { lat: number; lng: number };
      status: 'OBSERVED' | 'VERIFIED';
    }> = [];

    if (term) {
      trajectoryMatches.push(
        {
          nodeType: 'FIXED_CCTV',
          nodeId: 'CAM-014 (SG Highway Junction)',
          plateText: term,
          timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
          gps: { lat: 23.0338, lng: 72.5467 },
          status: 'OBSERVED'
        },
        {
          nodeType: 'MOBILE_UNIT',
          nodeId: 'MVU-001 (Eagle Delta 04)',
          plateText: term,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          gps: { lat: 23.0225, lng: 72.5714 },
          status: 'VERIFIED'
        },
        {
          nodeType: 'FIXED_CCTV',
          nodeId: 'CAM-023 (Prahlad Nagar Flyover)',
          plateText: term,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          gps: { lat: 23.0112, lng: 72.5028 },
          status: 'OBSERVED'
        }
      );
    }

    return {
      units: matchedUnits,
      events: matchedEvents,
      trajectoryMatches
    };
  }

  public subscribe(cb: (units: MobileVisionUnit[]) => void): () => void {
    this.subscribers.add(cb);
    cb(this.getAllUnits());
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notifySubscribers(): void {
    const list = this.getAllUnits();
    this.subscribers.forEach(cb => cb(list));
  }

  private seedCanonicalUnits(): void {
    const now = new Date().toISOString();

    const unit1: MobileVisionUnit = {
      unitId: 'MVU-001',
      vehicleId: 'GJ-01-G-9988',
      registrationNumber: 'GJ01G9988',
      cameraIds: ['PATROL-CAM-04-4K', 'PATROL-CAM-04-ANPR'],
      cameraType: 'NORMAL_4K',
      cameraCapabilities: {
        objectDetection: true,
        vehicleDetection: true,
        plateDetection: true,
        plateOCR: true,
        gps: true,
        '4k': true,
        anpr: true
      },
      resolution: '3840x2160 (4K UHD) + ANPR 1080p',
      fps: 30,
      gps: {
        status: 'AVAILABLE',
        latitude: 23.0225,
        longitude: 72.5714,
        heading: 315,
        speedKmH: 42,
        accuracyMeters: 3.8,
        timestamp: now
      },
      heading: 315,
      speed: 42,
      edgeDevice: 'NVIDIA Jetson AGX Orin 64GB',
      gpu: 'Ampere 2048-Core GPU (68% Load)',
      cpu: '12-Core ARM Cortex-A78AE (42% Load)',
      memory: '32GB LPDDR5',
      storage: '1TB NVMe PCIe 4.0 SSD (82% Free)',
      connectivity: 'ONLINE',
      status: 'ACTIVE_PATROL',
      lastHeartbeat: now,
      assignedSector: 'Ahmedabad SG Highway Corridor',
      district: 'Ahmedabad',
      driverOfficerName: 'Insp. V. K. Jadeja',
      callSign: 'EAGLE-DELTA-04'
    };

    const unit2: MobileVisionUnit = {
      unitId: 'MVU-004',
      vehicleId: 'GJ-01-G-5512',
      registrationNumber: 'GJ01G5512',
      cameraIds: ['PATROL-CAM-08-ANPR'],
      cameraType: 'ANPR',
      cameraCapabilities: {
        objectDetection: true,
        vehicleDetection: true,
        plateDetection: true,
        plateOCR: true,
        gps: true,
        '4k': false,
        anpr: true
      },
      resolution: '1920x1080 (ANPR 60FPS High-Shutter)',
      fps: 60,
      gps: {
        status: 'AVAILABLE',
        latitude: 23.0545,
        longitude: 72.5112,
        heading: 180,
        speedKmH: 35,
        accuracyMeters: 4.1,
        timestamp: now
      },
      heading: 180,
      speed: 35,
      edgeDevice: 'NVIDIA Jetson Orin Nano 8GB',
      gpu: 'Ampere 1024-Core GPU (54% Load)',
      cpu: '6-Core ARM Cortex-A78AE (38% Load)',
      memory: '8GB LPDDR5',
      storage: '512GB NVMe SSD (90% Free)',
      connectivity: 'ONLINE',
      status: 'ACTIVE_PATROL',
      lastHeartbeat: now,
      assignedSector: 'Sarkhej Gandhinagar Highway Sector 2',
      district: 'Ahmedabad',
      driverOfficerName: 'Sub-Insp. M. B. Patel',
      callSign: 'EAGLE-ALPHA-01'
    };

    const unit3: MobileVisionUnit = {
      unitId: 'MVU-007',
      vehicleId: 'GJ-06-G-1100',
      registrationNumber: 'GJ06G1100',
      cameraIds: ['PATROL-CAM-12-PTZ', 'PATROL-CAM-12-THERMAL'],
      cameraType: 'MULTI_CAMERA',
      cameraCapabilities: {
        objectDetection: true,
        vehicleDetection: true,
        plateDetection: true,
        plateOCR: true,
        gps: true,
        '4k': true,
        thermal: true,
        ptz: true
      },
      resolution: '4K Overview + Long-Range Thermal',
      fps: 30,
      gps: {
        status: 'AVAILABLE',
        latitude: 22.3072,
        longitude: 73.1812,
        heading: 90,
        speedKmH: 50,
        accuracyMeters: 3.2,
        timestamp: now
      },
      heading: 90,
      speed: 50,
      edgeDevice: 'NVIDIA IGX Orin Industrial AI',
      gpu: 'Ampere Enterprise GPU (45% Load)',
      cpu: '12-Core ARM Cortex-A78AE (30% Load)',
      memory: '64GB LPDDR5',
      storage: '2TB Ruggedized NVMe SSD (94% Free)',
      connectivity: 'ONLINE',
      status: 'STANDBY',
      lastHeartbeat: now,
      assignedSector: 'Vadodara Express Corridor',
      district: 'Vadodara',
      driverOfficerName: 'Officer R. S. Rathod',
      callSign: 'CHETAK-ECHO-07'
    };

    this.units.set(unit1.unitId, unit1);
    this.units.set(unit2.unitId, unit2);
    this.units.set(unit3.unitId, unit3);
  }
}

export const mobileVisionUnitRegistry = MobileVisionUnitRegistry.getInstance();
