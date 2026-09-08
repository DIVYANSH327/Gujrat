/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * LastSeenVehicleService: Authoritative Sighting vs Predictive Corridor Engine
 * Distinguishes Confirmed Physical Observations from Downstream Probability Predictions.
 */

import { 
  DownstreamPrediction, 
  VehicleObservation 
} from '../types';
import { godsEyeObservationService } from './GodsEyeObservationService';
import { cameraTopologyService } from './CameraTopologyService';

export interface LastSeenDossier {
  vehicleId: string;
  plateNormalized?: string;
  // Authoritative physical observation
  lastObservedCamera: string;
  lastObservedCameraName: string;
  lastObservedTime: string;
  lastKnownLocation: string;
  lastKnownDirection: string;
  lastEstimatedSpeedKmh: number;
  lastEvidenceReference?: string;
  observationSource: string;
  observationConfidence: number;
  
  // Historical predecessor
  previousCamera?: string;
  previousObservedTime?: string;
  
  // Predictive forward corridor (Labeled PROBABILISTIC)
  nextLikelyCameras: DownstreamPrediction[];
  corridorPredictionConfidence: number;
  searchStatus: 'ACQUIRED' | 'TRACKING_ACTIVE' | 'LOST_SIGHT' | 'TARGET_INTERCEPTED';
}

export class LastSeenVehicleService {
  private static instance: LastSeenVehicleService | null = null;

  private constructor() {}

  public static getInstance(): LastSeenVehicleService {
    if (!LastSeenVehicleService.instance) {
      LastSeenVehicleService.instance = new LastSeenVehicleService();
    }
    return LastSeenVehicleService.instance;
  }

  public getVehicleLastSeen(vehicleQuery: string): LastSeenDossier | null {
    const observations = godsEyeObservationService.getObservationsForPlate(vehicleQuery);
    if (observations.length === 0) return null;

    // Sort observations chronologically
    observations.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const latest = observations[observations.length - 1];
    const previous = observations.length > 1 ? observations[observations.length - 2] : undefined;

    // Retrieve downstream predictions from topology
    const predictions = cameraTopologyService.predictDownstreamCameras(latest.cameraId, latest.direction, latest.timestamp);

    return {
      vehicleId: vehicleQuery,
      plateNormalized: latest.plateNormalized,
      lastObservedCamera: latest.cameraId,
      lastObservedCameraName: latest.cameraName || `CCTV Camera ${latest.cameraId}`,
      lastObservedTime: latest.timestamp,
      lastKnownLocation: latest.cameraName || `Junction Corridor (${latest.cameraId})`,
      lastKnownDirection: latest.direction || 'Northbound',
      lastEstimatedSpeedKmh: latest.speedEstimate || 48,
      lastEvidenceReference: latest.evidenceReference,
      observationSource: latest.sourceType,
      observationConfidence: latest.vehicleConfidence,
      previousCamera: previous?.cameraId,
      previousObservedTime: previous?.timestamp,
      nextLikelyCameras: predictions,
      corridorPredictionConfidence: predictions.length > 0 ? predictions[0].likelihood : 0.0,
      searchStatus: latest.watchlistMatch ? 'TRACKING_ACTIVE' : 'ACQUIRED'
    };
  }
}

export const lastSeenVehicleService = LastSeenVehicleService.getInstance();
