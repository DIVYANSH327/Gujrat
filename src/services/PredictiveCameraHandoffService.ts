/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * PredictiveCameraHandoffService
 * Autonomous Predictive Vehicle Corridor and Camera Handoff Engine.
 * Strictly separates OBSERVED vs PREDICTED vs CONFIRMED data points.
 */

import { 
  PredictiveHandoffPoint, 
  HandoffState 
} from '../types';
import { CameraTopologyService } from './CameraTopologyService';
import { centralEventBus } from './CentralEventBus';
import { confidencePolicyService } from './ConfidencePolicyService';
import { sysEvents } from './Architecture';

export class PredictiveCameraHandoffService {
  private static instance: PredictiveCameraHandoffService | null = null;
  private handoffPoints: Map<string, PredictiveHandoffPoint[]> = new Map(); // plate -> points[]
  private topologyService: CameraTopologyService;

  private constructor() {
    this.topologyService = CameraTopologyService.getInstance();
    this.seedDefaultHandoffScenarios();
  }

  public static getInstance(): PredictiveCameraHandoffService {
    if (!PredictiveCameraHandoffService.instance) {
      PredictiveCameraHandoffService.instance = new PredictiveCameraHandoffService();
    }
    return PredictiveCameraHandoffService.instance;
  }

  /**
   * Seed realistic corridor transitions for demonstration and test workflows
   */
  private seedDefaultHandoffScenarios(): void {
    const demoPlate = 'GJ01AB1234';
    const now = Date.now();

    const points: PredictiveHandoffPoint[] = [
      {
        pointId: `HND-001`,
        vehiclePlate: demoPlate,
        fromCameraId: 'CAM-007',
        toCameraId: 'CAM-007',
        corridorName: 'SG Highway Corridor Alpha',
        handoffState: 'OBSERVED',
        predictionConfidence: 1.0,
        predictionReason: 'Physical observation captured on SG Highway - Pakwan Cross Junction',
        expectedArrivalWindowStart: new Date(now - 12 * 60000).toISOString(),
        expectedArrivalWindowEnd: new Date(now - 10 * 60000).toISOString(),
        actualArrivalTimestamp: new Date(now - 11 * 60000).toISOString(),
        travelDistanceMeters: 0,
        expectedTravelDurationSec: 0,
        actualTravelDurationSec: 0,
        accuracyScore: 1.0,
        vehicleClass: 'SUV',
        vehicleColor: 'White'
      },
      {
        pointId: `HND-002`,
        vehiclePlate: demoPlate,
        fromCameraId: 'CAM-007',
        toCameraId: 'CAM-014',
        corridorName: 'SG Highway Corridor Alpha',
        handoffState: 'CONFIRMED',
        predictionConfidence: 0.89,
        predictionReason: 'Downstream topological corridor match with heading 15° at 48 km/h',
        expectedArrivalWindowStart: new Date(now - 8 * 60000).toISOString(),
        expectedArrivalWindowEnd: new Date(now - 5 * 60000).toISOString(),
        actualArrivalTimestamp: new Date(now - 6 * 60000).toISOString(),
        travelDistanceMeters: 1800,
        expectedTravelDurationSec: 180,
        actualTravelDurationSec: 165,
        accuracyScore: 0.94,
        vehicleClass: 'SUV',
        vehicleColor: 'White'
      },
      {
        pointId: `HND-003`,
        vehiclePlate: demoPlate,
        fromCameraId: 'CAM-014',
        toCameraId: 'CAM-023',
        corridorName: 'SG Highway Corridor Alpha',
        handoffState: 'PREDICTED',
        predictionConfidence: 0.84,
        predictionReason: 'Predicted arrival based on current SG Highway northbound velocity and lane progression',
        expectedArrivalWindowStart: new Date(now + 2 * 60000).toISOString(),
        expectedArrivalWindowEnd: new Date(now + 5 * 60000).toISOString(),
        travelDistanceMeters: 3200,
        expectedTravelDurationSec: 280,
        vehicleClass: 'SUV',
        vehicleColor: 'White'
      }
    ];

    this.handoffPoints.set(demoPlate, points);
  }

  /**
   * Generates predictive handoff downstream points from an actual observation
   */
  public generateDownstreamHandoff(params: {
    plate: string;
    currentCameraId: string;
    vehicleClass?: string;
    vehicleColor?: string;
    headingDeg?: number;
    observedSpeedKmh?: number;
  }): PredictiveHandoffPoint[] {
    const { plate, currentCameraId, vehicleClass = 'Vehicle', vehicleColor = 'Unknown' } = params;
    const existing = this.handoffPoints.get(plate) || [];

    // Query topology for connected downstream nodes
    const currentNode = this.topologyService.getNode(currentCameraId);
    const downstreamIds = currentNode?.outgoingConnections || ['CAM-014', 'CAM-023'];
    const nextCameraId = downstreamIds[0] || 'CAM-014';
    const nextNode = this.topologyService.getNode(nextCameraId);

    const now = Date.now();
    const distanceMeters = 2200;
    const speedKmh = params.observedSpeedKmh || 50;
    const travelTimeSec = Math.round((distanceMeters / (speedKmh * (1000 / 3600))));

    // Record explainability breakdown
    const explainability = confidencePolicyService.createExplainabilityRecord({
      targetType: 'HANDOFF',
      targetId: `${plate}-${nextCameraId}`,
      signals: [
        { label: 'Topology Corridor', value: `${currentCameraId} -> ${nextCameraId}`, match: true, weight: 35 },
        { label: 'Vehicle Direction', value: `Heading ~${currentNode?.heading || 90}°`, match: true, weight: 25 },
        { label: 'Travel Feasibility', value: `${distanceMeters}m @ ${speedKmh} km/h`, match: true, weight: 20 },
        { label: 'Road Segment Free Flow', value: 'Traffic Level: LIGHT', match: true, weight: 10 }
      ]
    });

    const newPoint: PredictiveHandoffPoint = {
      pointId: `HND-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      vehiclePlate: plate,
      fromCameraId: currentCameraId,
      toCameraId: nextCameraId,
      corridorName: nextNode?.junctionName || 'Gujarat Arterial Corridor',
      handoffState: 'PREDICTED',
      predictionConfidence: explainability.confidence,
      predictionReason: `Predicted traversal along ${currentNode?.direction || 'Northbound'} vector with expected arrival in ~${Math.round(travelTimeSec / 60)} min.`,
      expectedArrivalWindowStart: new Date(now + (travelTimeSec - 60) * 1000).toISOString(),
      expectedArrivalWindowEnd: new Date(now + (travelTimeSec + 90) * 1000).toISOString(),
      travelDistanceMeters: distanceMeters,
      expectedTravelDurationSec: travelTimeSec,
      vehicleClass,
      vehicleColor
    };

    const updated = [...existing, newPoint];
    this.handoffPoints.set(plate, updated);

    // Publish event
    centralEventBus.publish({
      eventType: 'PREDICTIVE_HANDOFF_UPDATED',
      sourceId: 'PredictiveCameraHandoffService',
      correlationId: `HND-${plate}`,
      idempotencyKey: `HND-PUB-${newPoint.pointId}`,
      priority: 'P2',
      payload: newPoint
    });

    sysEvents.emit('HANDOFF_UPDATED', newPoint);
    return updated;
  }

  /**
   * Confirms a previously predicted handoff when actual observation arrives at destination camera
   */
  public confirmHandoff(plate: string, actualCameraId: string, arrivalTime: string = new Date().toISOString()): boolean {
    const points = this.handoffPoints.get(plate);
    if (!points) return false;

    let confirmed = false;
    for (const pt of points) {
      if (pt.toCameraId === actualCameraId && pt.handoffState === 'PREDICTED') {
        pt.handoffState = 'CONFIRMED';
        pt.actualArrivalTimestamp = arrivalTime;
        const actualDuration = Math.round((new Date(arrivalTime).getTime() - new Date(pt.expectedArrivalWindowStart).getTime()) / 1000);
        pt.actualTravelDurationSec = Math.max(10, actualDuration);
        pt.accuracyScore = 0.92;
        confirmed = true;
      }
    }

    if (confirmed) {
      centralEventBus.publish({
        eventType: 'PREDICTIVE_HANDOFF_UPDATED',
        sourceId: 'PredictiveCameraHandoffService',
        correlationId: `HND-CONFIRM-${plate}`,
        idempotencyKey: `HND-CONF-${plate}-${actualCameraId}`,
        priority: 'P1',
        payload: { plate, actualCameraId, status: 'CONFIRMED' }
      });
    }

    return confirmed;
  }

  public getHandoffTimeline(plate: string): PredictiveHandoffPoint[] {
    return this.handoffPoints.get(plate) || [];
  }

  public getAllActiveHandoffs(): PredictiveHandoffPoint[] {
    const all: PredictiveHandoffPoint[] = [];
    for (const list of this.handoffPoints.values()) {
      all.push(...list);
    }
    return all.sort((a, b) => b.pointId.localeCompare(a.pointId));
  }
}

export const predictiveCameraHandoffService = PredictiveCameraHandoffService.getInstance();
