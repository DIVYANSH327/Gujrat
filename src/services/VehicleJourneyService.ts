/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleJourneyService: Reconstructs vehicle trajectory graphs, cross-camera corridors,
 * estimated transit metrics, and last known locations from authoritative stored sightings.
 * 
 * Unified CCTV Intelligence Grid V1.3
 */

import {
  VehicleJourney,
  VehicleJourneySegment,
  LastKnownSightingInfo,
  VehicleSighting,
  normalizeLicensePlate
} from '../types';
import { vehicleHistoryRepository } from './VehicleHistoryRepository';

export class VehicleJourneyService {
  private static instance: VehicleJourneyService;

  private constructor() {}

  public static getInstance(): VehicleJourneyService {
    if (!VehicleJourneyService.instance) {
      VehicleJourneyService.instance = new VehicleJourneyService();
    }
    return VehicleJourneyService.instance;
  }

  /**
   * Builds the complete chronological journey for a vehicle.
   */
  public async buildJourney(vehicleNumber: string): Promise<VehicleJourney> {
    const normalized = normalizeLicensePlate(vehicleNumber);
    return vehicleHistoryRepository.getVehicleJourney(normalized);
  }

  /**
   * Retrieves the precise last known sighting and camera location.
   */
  public async getLastKnownLocation(vehicleNumber: string): Promise<LastKnownSightingInfo | null> {
    const journey = await this.buildJourney(vehicleNumber);
    return journey.lastKnownLocation || null;
  }

  /**
   * Retrieves journey segments and sightings filtered within a specific time window.
   */
  public async getJourneyBetween(
    vehicleNumber: string,
    startTime: string,
    endTime: string
  ): Promise<VehicleJourney> {
    const normalized = normalizeLicensePlate(vehicleNumber);
    const fullJourney = await this.buildJourney(normalized);
    const startTs = new Date(startTime).getTime();
    const endTs = new Date(endTime).getTime();

    const filteredSightings = fullJourney.sightings.filter(s => {
      const ts = new Date(s.timestamp).getTime();
      return ts >= startTs && ts <= endTs;
    });

    if (filteredSightings.length === 0) {
      return {
        vehicleNumber: normalized,
        normalizedPlate: normalized,
        sightings: [],
        totalSightings: 0,
        segments: [],
        lastKnownLocation: null,
        totalDistanceMeters: 0,
        firstSeen: startTime,
        lastSeen: endTime,
        camerasVisited: 0,
        districtsVisited: 0,
        durationMinutes: 0,
        dataClassification: fullJourney.dataClassification
      };
    }

    const filteredSegments = (fullJourney.segments || []).filter(seg => {
      const depTs = new Date(seg.departureTime).getTime();
      return depTs >= startTs && depTs <= endTs;
    });

    const last = filteredSightings[filteredSightings.length - 1];
    const first = filteredSightings[0];

    const lastKnown: LastKnownSightingInfo = {
      vehicleNumber: normalized,
      normalizedPlate: normalized,
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
      vehicleNumber: normalized,
      normalizedPlate: normalized,
      sightings: filteredSightings,
      totalSightings: filteredSightings.length,
      segments: filteredSegments,
      lastKnownLocation: lastKnown,
      totalDistanceMeters: fullJourney.totalDistanceMeters || 0,
      firstSeen: first.timestamp,
      lastSeen: last.timestamp,
      camerasVisited: new Set(filteredSightings.map(s => s.cameraId)).size,
      districtsVisited: 1,
      durationMinutes: Math.max(0.5, Math.round(((new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) / 60000) * 10) / 10),
      dataClassification: fullJourney.dataClassification
    };
  }

  /**
   * Retrieves all historical sightings for a vehicle.
   */
  public async getVehicleSightings(vehicleNumber: string): Promise<VehicleSighting[]> {
    const normalized = normalizeLicensePlate(vehicleNumber);
    return vehicleHistoryRepository.getVehicleHistory(normalized);
  }

  /**
   * Retrieves estimated transitions between consecutive camera sightings.
   */
  public async getEstimatedTransitions(vehicleNumber: string): Promise<VehicleJourneySegment[]> {
    const journey = await this.buildJourney(vehicleNumber);
    return journey.segments || [];
  }
}

export const vehicleJourneyService = VehicleJourneyService.getInstance();
