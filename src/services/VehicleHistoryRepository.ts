/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleHistoryRepository: Persistent Domain Storage Abstraction for Vehicle Sightings,
 * Trajectories, and Historical Correlated Intelligence.
 * 
 * Storage Layer: DEMO PERSISTENT STORAGE (In-Memory with LocalStorage sync)
 * Unified CCTV Intelligence Grid V1.3
 */

import {
  VehicleSighting,
  VehicleIdentity,
  VehicleJourney,
  VehicleJourneySegment,
  LastKnownSightingInfo,
  VehicleSearchFilter,
  IVehicleHistoryRepository,
  VehicleEvidenceRecord,
  normalizeLicensePlate
} from '../types';
import { CameraTopologyService } from './CameraTopologyService';
import { computeDeterministicHash } from './GodsEyeService';

const STORAGE_KEY = 'gujarat_cctv_vehicle_sightings_v13';

export class VehicleHistoryRepository implements IVehicleHistoryRepository {
  private static instance: VehicleHistoryRepository;
  private sightings: Map<string, VehicleSighting[]> = new Map(); // Key = normalizedPlate
  private evidenceRecords: Map<string, VehicleEvidenceRecord> = new Map(); // Key = evidenceId
  private topologyService = CameraTopologyService.getInstance();

  private constructor() {
    this.initializeRepository();
  }

  public static getInstance(): VehicleHistoryRepository {
    if (!VehicleHistoryRepository.instance) {
      VehicleHistoryRepository.instance = new VehicleHistoryRepository();
    }
    return VehicleHistoryRepository.instance;
  }

  /**
   * Initializes the repository with stored demo data or seeds deterministic demo scenario.
   */
  private initializeRepository(): void {
    let loaded = false;
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: VehicleSighting[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const s of parsed) {
              const norm = normalizeLicensePlate(s.normalizedPlate || s.vehicleNumber || '');
              if (norm) {
                const list = this.sightings.get(norm) || [];
                list.push(s);
                this.sightings.set(norm, list);
              }
            }
            loaded = true;
          }
        }
      }
    } catch {
      // Fallback to in-memory seeding if localStorage is restricted
    }

    if (!loaded || this.sightings.size === 0) {
      this.seedDeterministicDemoData();
    }
  }

  private persistToStorage(): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        const allSightings: VehicleSighting[] = [];
        for (const list of this.sightings.values()) {
          allSightings.push(...list);
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allSightings));
      }
    } catch {
      // Ignore quota or restricted storage in iframe
    }
  }

  /**
   * Seeds deterministic demo scenario for GJ05AB1234 and other demonstration vehicles.
   */
  public seedDeterministicDemoData(): void {
    this.sightings.clear();
    this.evidenceRecords.clear();

    const todayStr = new Date().toISOString().split('T')[0];

    // --- SCENARIO 1: GJ05AB1234 (Primary Wanted Target Corridor Scenario) ---
    // Journey: CAM-007 (08:42) -> CAM-014 (08:47 Watchlist BOLO) -> CAM-023 (08:55) -> CAM-031 (09:03 Last Known)
    const targetPlate = 'GJ05AB1234';

    const s1: VehicleSighting = {
      sightingId: 'SGT-DEMO-GJ05AB1234-01',
      vehicleId: targetPlate,
      vehicleNumber: targetPlate,
      normalizedPlate: targetPlate,
      rawPlate: 'GJ-05-AB-1234',
      plateConfidence: 0.96,
      vehicleType: 'SUV',
      vehicleTypeConfidence: 0.94,
      makeEstimate: 'Mahindra / Tata',
      modelEstimate: 'Scorpio / Safari',
      colorEstimate: 'WHITE',
      vehicleBoundingBox: { xmin: 0.22, ymin: 0.38, xmax: 0.78, ymax: 0.88 },
      plateBoundingBox: { xmin: 0.44, ymin: 0.71, xmax: 0.58, ymax: 0.77 },
      cameraId: 'CAM-007',
      cameraName: 'SG Highway - Pakwan Cross Junction (Eastbound)',
      siteId: 'SITE-AHM-SGH-01',
      edgeNodeId: 'EDGE-00042',
      sourceEdgeNode: 'EDGE-00042',
      timestamp: `${todayStr}T08:42:15.000Z`,
      latitude: 23.0372,
      longitude: 72.5123,
      heading: 90,
      direction: 'Eastbound',
      sourceType: 'SYNTHETIC_SIMULATION',
      evidenceId: 'EVD-GJ05AB1234-084215',
      snapshotReference: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60',
      watchlistStatus: 'CLEAR',
      policeDataStatus: 'RECORD_FOUND',
      correlationId: 'CORR-V13-TARGET-001',
      createdAt: `${todayStr}T08:42:16.000Z`,
      eventId: 'EVT-ANPR-084215-101',
      dataClassification: 'SYNTHETIC_SIMULATION'
    };

    const s2: VehicleSighting = {
      sightingId: 'SGT-DEMO-GJ05AB1234-02',
      vehicleId: targetPlate,
      vehicleNumber: targetPlate,
      normalizedPlate: targetPlate,
      rawPlate: 'GJ-05-AB-1234',
      plateConfidence: 0.96,
      vehicleType: 'SUV',
      vehicleTypeConfidence: 0.96,
      makeEstimate: 'Mahindra / Tata',
      modelEstimate: 'Scorpio / Safari',
      colorEstimate: 'WHITE',
      vehicleBoundingBox: { xmin: 0.18, ymin: 0.32, xmax: 0.82, ymax: 0.90 },
      plateBoundingBox: { xmin: 0.42, ymin: 0.73, xmax: 0.59, ymax: 0.79 },
      cameraId: 'CAM-014',
      cameraName: 'SG Highway - Thaltej Underpass North Entrance',
      siteId: 'SITE-AHM-SGH-02',
      edgeNodeId: 'EDGE-00045',
      sourceEdgeNode: 'EDGE-00045',
      timestamp: `${todayStr}T08:47:30.000Z`,
      latitude: 23.0515,
      longitude: 72.5189,
      heading: 15,
      direction: 'Northbound',
      sourceType: 'SYNTHETIC_SIMULATION',
      evidenceId: 'EVD-GJ05AB1234-084730',
      snapshotReference: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=60',
      watchlistStatus: 'MATCH',
      policeDataStatus: 'RECORD_FOUND',
      correlationId: 'CORR-V13-TARGET-001',
      createdAt: `${todayStr}T08:47:31.000Z`,
      eventId: 'EVT-ANPR-084730-102',
      dataClassification: 'SYNTHETIC_SIMULATION'
    };

    const s3: VehicleSighting = {
      sightingId: 'SGT-DEMO-GJ05AB1234-03',
      vehicleId: targetPlate,
      vehicleNumber: targetPlate,
      normalizedPlate: targetPlate,
      rawPlate: 'GJ-05-AB-1234',
      plateConfidence: 0.95,
      vehicleType: 'SUV',
      vehicleTypeConfidence: 0.95,
      makeEstimate: 'Mahindra / Tata',
      modelEstimate: 'Scorpio / Safari',
      colorEstimate: 'WHITE',
      vehicleBoundingBox: { xmin: 0.20, ymin: 0.35, xmax: 0.80, ymax: 0.88 },
      plateBoundingBox: { xmin: 0.43, ymin: 0.72, xmax: 0.58, ymax: 0.78 },
      cameraId: 'CAM-023',
      cameraName: 'SG Highway - Vaishnodevi Circle Intercept',
      siteId: 'SITE-AHM-SGH-03',
      edgeNodeId: 'EDGE-00048',
      sourceEdgeNode: 'EDGE-00048',
      timestamp: `${todayStr}T08:55:10.000Z`,
      latitude: 23.1189,
      longitude: 72.5421,
      heading: 10,
      direction: 'Northbound',
      sourceType: 'SYNTHETIC_SIMULATION',
      evidenceId: 'EVD-GJ05AB1234-085510',
      snapshotReference: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=60',
      watchlistStatus: 'MATCH',
      policeDataStatus: 'RECORD_FOUND',
      correlationId: 'CORR-V13-TARGET-001',
      createdAt: `${todayStr}T08:55:11.000Z`,
      eventId: 'EVT-ANPR-085510-103',
      dataClassification: 'SYNTHETIC_SIMULATION'
    };

    const s4: VehicleSighting = {
      sightingId: 'SGT-DEMO-GJ05AB1234-04',
      vehicleId: targetPlate,
      vehicleNumber: targetPlate,
      normalizedPlate: targetPlate,
      rawPlate: 'GJ-05-AB-1234',
      plateConfidence: 0.94,
      vehicleType: 'SUV',
      vehicleTypeConfidence: 0.95,
      makeEstimate: 'Mahindra / Tata',
      modelEstimate: 'Scorpio / Safari',
      colorEstimate: 'WHITE',
      vehicleBoundingBox: { xmin: 0.25, ymin: 0.38, xmax: 0.75, ymax: 0.86 },
      plateBoundingBox: { xmin: 0.45, ymin: 0.71, xmax: 0.57, ymax: 0.77 },
      cameraId: 'CAM-031',
      cameraName: 'Gandhinagar Access Toll Approach (NH-147)',
      siteId: 'SITE-GNR-NH147-01',
      edgeNodeId: 'EDGE-00052',
      sourceEdgeNode: 'EDGE-00052',
      timestamp: `${todayStr}T09:03:21.000Z`,
      latitude: 23.1892,
      longitude: 72.5834,
      heading: 25,
      direction: 'NORTHBOUND',
      sourceType: 'SYNTHETIC_SIMULATION',
      evidenceId: 'EVD-GJ05AB1234-090321',
      snapshotReference: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60',
      watchlistStatus: 'MATCH',
      policeDataStatus: 'RECORD_FOUND',
      correlationId: 'CORR-V13-TARGET-001',
      createdAt: `${todayStr}T09:03:22.000Z`,
      eventId: 'EVT-ANPR-090321-104',
      dataClassification: 'SYNTHETIC_SIMULATION'
    };

    this.sightings.set(targetPlate, [s1, s2, s3, s4]);

    // Create evidence records with deterministic SHA-256 hashes
    for (const s of [s1, s2, s3, s4]) {
      if (s.evidenceId) {
        const canonical = JSON.stringify({
          evidenceId: s.evidenceId,
          sightingId: s.sightingId,
          cameraId: s.cameraId,
          plate: s.normalizedPlate,
          timestamp: s.timestamp
        });
        this.evidenceRecords.set(s.evidenceId, {
          evidenceId: s.evidenceId,
          sightingId: s.sightingId,
          cameraId: s.cameraId,
          timestamp: s.timestamp,
          snapshotReference: s.snapshotReference || '',
          vehicleBoundingBox: s.vehicleBoundingBox,
          plateBoundingBox: s.plateBoundingBox,
          plateConfidence: s.plateConfidence,
          vehicleConfidence: s.vehicleTypeConfidence || 0.90,
          sha256: computeDeterministicHash(canonical),
          capturePolicy: 'ONE_BEST_FRAME',
          status: 'VERIFIED',
          isSimulation: true,
          label: 'SIMULATED VEHICLE EVIDENCE',
          integrityNotice: 'Evidence Integrity Hash — DEMO (Calculated via SHA-256 over canonical metadata)'
        });
      }
    }

    // --- SCENARIO 2: GJ01AB1234 (Clear Sedan) ---
    const plate2 = 'GJ01AB1234';
    this.sightings.set(plate2, [
      {
        sightingId: 'SGT-DEMO-GJ01AB1234-01',
        vehicleId: plate2,
        vehicleNumber: plate2,
        normalizedPlate: plate2,
        rawPlate: 'GJ-01-AB-1234',
        plateConfidence: 0.97,
        vehicleType: 'SEDAN',
        vehicleTypeConfidence: 0.95,
        makeEstimate: 'Honda',
        modelEstimate: 'City',
        colorEstimate: 'SILVER',
        cameraId: 'CAM-008',
        cameraName: 'Sindhu Bhavan Road Westward Branch',
        siteId: 'SITE-AHM-SBR-01',
        edgeNodeId: 'EDGE-00043',
        sourceEdgeNode: 'EDGE-00043',
        timestamp: `${todayStr}T07:15:00.000Z`,
        latitude: 23.0410,
        longitude: 72.5050,
        direction: 'Westbound',
        sourceType: 'SYNTHETIC_SIMULATION',
        snapshotReference: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format&fit=crop&q=60',
        watchlistStatus: 'CLEAR',
        policeDataStatus: 'RECORD_FOUND',
        correlationId: 'CORR-V13-REG-002',
        createdAt: `${todayStr}T07:15:01.000Z`,
        eventId: 'EVT-ANPR-071500-201',
        dataClassification: 'SYNTHETIC_SIMULATION'
      }
    ]);

    // --- SCENARIO 3: GJ27EF9012 (Traffic Alert Motorcycle) ---
    const plate3 = 'GJ27EF9012';
    this.sightings.set(plate3, [
      {
        sightingId: 'SGT-DEMO-GJ27EF9012-01',
        vehicleId: plate3,
        vehicleNumber: plate3,
        normalizedPlate: plate3,
        rawPlate: 'GJ-27-EF-9012',
        plateConfidence: 0.98,
        vehicleType: 'MOTORCYCLE',
        vehicleTypeConfidence: 0.96,
        makeEstimate: 'Hero',
        modelEstimate: 'Splendor',
        colorEstimate: 'BLACK',
        cameraId: 'CAM-007',
        cameraName: 'SG Highway - Pakwan Cross Junction (Eastbound)',
        siteId: 'SITE-AHM-SGH-01',
        edgeNodeId: 'EDGE-00042',
        sourceEdgeNode: 'EDGE-00042',
        timestamp: `${todayStr}T08:10:00.000Z`,
        latitude: 23.0372,
        longitude: 72.5123,
        direction: 'Eastbound',
        sourceType: 'SYNTHETIC_SIMULATION',
        snapshotReference: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=60',
        watchlistStatus: 'WATCHLIST_CANDIDATE',
        policeDataStatus: 'RECORD_FOUND',
        correlationId: 'CORR-V13-REG-003',
        createdAt: `${todayStr}T08:10:01.000Z`,
        eventId: 'EVT-ANPR-081000-301',
        dataClassification: 'SYNTHETIC_SIMULATION'
      }
    ]);

    this.persistToStorage();
  }

  public async saveSighting(sighting: VehicleSighting): Promise<VehicleSighting> {
    const normalized = normalizeLicensePlate(sighting.normalizedPlate || sighting.vehicleNumber || sighting.rawPlate || '');
    if (!normalized) {
      throw new Error('Cannot save vehicle sighting: Missing valid registration plate number');
    }

    const cleanSighting: VehicleSighting = {
      ...sighting,
      normalizedPlate: normalized,
      vehicleId: normalized,
      vehicleNumber: normalized,
      createdAt: sighting.createdAt || new Date().toISOString()
    };

    const existing = this.sightings.get(normalized) || [];
    // Deduplicate by sightingId or eventId
    const idx = existing.findIndex(s => s.sightingId === cleanSighting.sightingId || (s.eventId && s.eventId === cleanSighting.eventId));
    if (idx >= 0) {
      existing[idx] = cleanSighting;
    } else {
      existing.push(cleanSighting);
    }
    this.sightings.set(normalized, existing);
    this.persistToStorage();

    return cleanSighting;
  }

  public async getVehicleHistory(normalizedPlate: string): Promise<VehicleSighting[]> {
    const norm = normalizeLicensePlate(normalizedPlate);
    if (!norm) return [];
    const list = this.sightings.get(norm) || [];
    return [...list].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public async getLastKnownSighting(normalizedPlate: string): Promise<VehicleSighting | null> {
    const history = await this.getVehicleHistory(normalizedPlate);
    if (history.length === 0) return null;
    return history[history.length - 1];
  }

  public async getSightingsByCamera(cameraId: string, limit = 50): Promise<VehicleSighting[]> {
    const matched: VehicleSighting[] = [];
    for (const list of this.sightings.values()) {
      for (const s of list) {
        if (s.cameraId === cameraId) {
          matched.push(s);
        }
      }
    }
    matched.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return matched.slice(0, limit);
  }

  public async getSightingsByTimeRange(startTime: string, endTime: string): Promise<VehicleSighting[]> {
    const startTs = new Date(startTime).getTime();
    const endTs = new Date(endTime).getTime();
    const matched: VehicleSighting[] = [];

    for (const list of this.sightings.values()) {
      for (const s of list) {
        const sTs = new Date(s.timestamp).getTime();
        if (sTs >= startTs && sTs <= endTs) {
          matched.push(s);
        }
      }
    }
    matched.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return matched;
  }

  public async getVehicleJourney(normalizedPlate: string): Promise<VehicleJourney> {
    const norm = normalizeLicensePlate(normalizedPlate);
    const sightings = await this.getVehicleHistory(norm);

    if (sightings.length === 0) {
      return {
        vehicleNumber: norm,
        normalizedPlate: norm,
        sightings: [],
        totalSightings: 0,
        segments: [],
        lastKnownLocation: null,
        totalDistanceMeters: 0,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        camerasVisited: 0,
        districtsVisited: 0,
        durationMinutes: 0,
        dataClassification: 'SYNTHETIC_SIMULATION'
      };
    }

    const segments: VehicleJourneySegment[] = [];
    let totalDist = 0;

    for (let i = 0; i < sightings.length - 1; i++) {
      const from = sightings[i];
      const to = sightings[i + 1];

      const t1 = new Date(from.timestamp).getTime();
      const t2 = new Date(to.timestamp).getTime();
      const timeDeltaSec = Math.max(1, Math.round((t2 - t1) / 1000));

      let distanceMeters: number | 'UNKNOWN' = 'UNKNOWN';
      let speedKmh: number | 'UNKNOWN' = 'UNKNOWN';

      if (from.latitude && from.longitude && to.latitude && to.longitude) {
        const dist = this.calculateHaversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
        distanceMeters = Math.round(dist);
        totalDist += dist;

        if (timeDeltaSec > 0) {
          const speed = (dist / timeDeltaSec) * 3.6; // m/s to km/h
          speedKmh = Math.min(150, Math.max(5, Math.round(speed * 10) / 10));
        }
      }

      segments.push({
        fromCamera: from.cameraId,
        fromCameraName: from.cameraName || from.cameraId,
        toCamera: to.cameraId,
        toCameraName: to.cameraName || to.cameraId,
        departureTime: from.timestamp,
        arrivalTime: to.timestamp,
        distance: distanceMeters,
        estimatedTravelTime: timeDeltaSec,
        estimatedSpeed: speedKmh,
        confidence: Math.min(from.plateConfidence, to.plateConfidence),
        fromGps: from.latitude && from.longitude ? { lat: from.latitude, lng: from.longitude } : undefined,
        toGps: to.latitude && to.longitude ? { lat: to.latitude, lng: to.longitude } : undefined,
        direction: to.direction || from.direction || 'Northbound'
      });
    }

    const last = sightings[sightings.length - 1];
    const first = sightings[0];

    const firstSeen = first.timestamp;
    const lastSeen = last.timestamp;
    const durationMinutes = Math.max(
      0.5,
      Math.round(((new Date(lastSeen).getTime() - new Date(firstSeen).getTime()) / 60000) * 10) / 10
    );

    const camerasVisited = new Set(sightings.map(s => s.cameraId)).size;

    const lastKnownInfo: LastKnownSightingInfo = {
      vehicleNumber: norm,
      normalizedPlate: norm,
      lastCamera: last.cameraId,
      lastCameraName: last.cameraName || last.cameraId,
      lastTimestamp: last.timestamp,
      lastLocation: last.cameraName || `Camera ${last.cameraId} Sector`,
      lastDirection: last.direction || 'NORTHBOUND',
      lastSnapshot: last.snapshotReference || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60',
      lastConfidence: last.plateConfidence,
      latitude: last.latitude || 23.1892,
      longitude: last.longitude || 72.5834,
      vehicleType: last.vehicleType || 'SUV',
      color: last.colorEstimate || 'WHITE',
      evidenceId: last.evidenceId,
      watchlistStatus: last.watchlistStatus || 'CLEAR',
      sourceType: last.sourceType || 'SYNTHETIC_SIMULATION',
      dataClassification: last.dataClassification || 'SYNTHETIC_SIMULATION'
    };

    return {
      vehicleNumber: norm,
      normalizedPlate: norm,
      sightings,
      totalSightings: sightings.length,
      segments,
      lastKnownLocation: lastKnownInfo,
      totalDistanceMeters: Math.round(totalDist),
      firstSeen,
      lastSeen,
      camerasVisited,
      districtsVisited: 1,
      durationMinutes,
      dataClassification: last.dataClassification || 'SYNTHETIC_SIMULATION'
    };
  }

  public async searchVehicles(filter: VehicleSearchFilter): Promise<VehicleSighting[]> {
    const q = (filter.query || filter.plate || '').trim().toUpperCase();
    const typeFilter = (filter.vehicleType || '').trim().toUpperCase();
    const camFilter = filter.cameraId?.trim();
    const watchlistOnly = filter.watchlistOnly;

    const results: VehicleSighting[] = [];

    for (const [plate, list] of this.sightings.entries()) {
      if (q && !plate.includes(normalizeLicensePlate(q)) && !list.some(s => s.rawPlate.toUpperCase().includes(q))) {
        continue;
      }

      for (const s of list) {
        if (typeFilter && typeFilter !== 'ALL' && !s.vehicleType?.toUpperCase().includes(typeFilter)) {
          continue;
        }
        if (camFilter && camFilter !== 'ALL' && s.cameraId !== camFilter) {
          continue;
        }
        if (watchlistOnly && s.watchlistStatus !== 'MATCH' && s.watchlistStatus !== 'WATCHLIST_CANDIDATE') {
          continue;
        }
        if (filter.timeRange?.start && new Date(s.timestamp).getTime() < new Date(filter.timeRange.start).getTime()) {
          continue;
        }
        if (filter.timeRange?.end && new Date(s.timestamp).getTime() > new Date(filter.timeRange.end).getTime()) {
          continue;
        }
        results.push(s);
      }
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return filter.limit ? results.slice(0, filter.limit) : results;
  }

  public async getEvidenceRecord(evidenceId: string): Promise<VehicleEvidenceRecord | null> {
    return this.evidenceRecords.get(evidenceId) || null;
  }

  public async deleteDemoData(): Promise<void> {
    this.sightings.clear();
    this.evidenceRecords.clear();
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }

  public async clearDemoHistory(): Promise<void> {
    this.seedDeterministicDemoData();
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const vehicleHistoryRepository = VehicleHistoryRepository.getInstance();
