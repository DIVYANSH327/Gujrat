/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleClassificationAgent: Visual Vehicle Type, Body Style, & Color Classification
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { BaseAgent } from '../base/BaseAgent';
import { AIAgentJob } from '../types';

export type VehicleClassType = 
  | 'CAR' 
  | 'SUV' 
  | 'SEDAN' 
  | 'HATCHBACK' 
  | 'MOTORCYCLE' 
  | 'SCOOTER' 
  | 'AUTO_RICKSHAW' 
  | 'BUS' 
  | 'TRUCK' 
  | 'VAN' 
  | 'AMBULANCE' 
  | 'POLICE_VEHICLE' 
  | 'FIRE_VEHICLE' 
  | 'UNKNOWN';

export interface VehicleClassificationResult {
  vehicleType: VehicleClassType;
  confidence: number;
  color: string;
  colorConfidence: number;
  estimatedMake: string;
  estimatedModel: string;
  isCommercial: boolean;
  isEmergency: boolean;
  sourceFrameId?: string;
  cameraId: string;
  timestamp: string;
  disclaimer: string;
}

export class VehicleClassificationAgent extends BaseAgent {
  constructor(params?: { agentId?: string; region?: string; isSimulated?: boolean }) {
    super({
      agentId: params?.agentId || 'VEHICLE-CLASS-CENTRAL-001',
      agentType: 'VEHICLE_CLASSIFICATION',
      region: params?.region || 'CENTRAL',
      assignedScope: 'STATEWIDE_VEHICLE_VISUAL_CLASSIFICATION',
      capabilities: ['VEHICLE_CLASSIFICATION', 'VISION_DETECTION'],
      isSimulated: params?.isSimulated ?? true
    });
  }

  public async handleEvent(event: any): Promise<void> {
    this.eventsProcessedCount += 1;
    this.recordHeartbeat();
  }

  public async classifyVehicle(params: {
    frameUrl?: string;
    cameraId: string;
    detectedBBox?: { x: number; y: number; w: number; h: number };
    hintClass?: string;
    hintColor?: string;
    timestamp?: string;
  }): Promise<VehicleClassificationResult> {
    const job: AIAgentJob = {
      jobId: `job-vclass-${Date.now()}`,
      jobType: 'VEHICLE_VISUAL_CLASSIFICATION',
      priority: 'NORMAL',
      status: 'RUNNING',
      assignedAgentId: this.agentId,
      sourceId: params.cameraId,
      requiredCapabilities: ['VEHICLE_CLASSIFICATION'],
      attempt: 1,
      maxAttempts: 2,
      createdAt: new Date().toISOString(),
      correlationId: `corr-vclass-${Date.now()}`,
      payload: params
    };

    return this.assignJob(job);
  }

  public async assignJob(job: AIAgentJob): Promise<VehicleClassificationResult> {
    const start = Date.now();
    this.activeJobsCount += 1;
    try {
      const payload = job.payload || {};
      const hintClass = (payload.hintClass || '').toUpperCase();
      const hintColor = (payload.hintColor || '').toUpperCase();
      const cameraId = payload.cameraId || 'CAM-001';
      const timestamp = payload.timestamp || new Date().toISOString();

      let vehicleType: VehicleClassType = 'CAR';
      let confidence = 0.94;
      let color = hintColor || 'WHITE';
      let colorConfidence = 0.92;
      let estimatedMake = 'UNKNOWN';
      let estimatedModel = 'UNKNOWN';
      let isCommercial = false;
      let isEmergency = false;

      if (hintClass.includes('SUV')) {
        vehicleType = 'SUV';
        confidence = 0.96;
        estimatedMake = 'Mahindra / Tata';
        estimatedModel = 'Scorpio / Safari';
      } else if (hintClass.includes('SEDAN')) {
        vehicleType = 'SEDAN';
        confidence = 0.95;
        estimatedMake = 'Honda / Maruti';
        estimatedModel = 'City / Dzire';
      } else if (hintClass.includes('MOTORCYCLE') || hintClass.includes('BIKE')) {
        vehicleType = 'MOTORCYCLE';
        confidence = 0.97;
        color = hintColor || 'BLACK';
        estimatedMake = 'Hero / Bajaj';
      } else if (hintClass.includes('SCOOTER')) {
        vehicleType = 'SCOOTER';
        confidence = 0.95;
        estimatedMake = 'Honda Activa';
      } else if (hintClass.includes('AUTO') || hintClass.includes('RICKSHAW')) {
        vehicleType = 'AUTO_RICKSHAW';
        confidence = 0.98;
        color = 'YELLOW_GREEN';
        isCommercial = true;
      } else if (hintClass.includes('BUS')) {
        vehicleType = 'BUS';
        confidence = 0.97;
        isCommercial = true;
        estimatedMake = 'Ashok Leyland / Tata';
      } else if (hintClass.includes('TRUCK')) {
        vehicleType = 'TRUCK';
        confidence = 0.96;
        isCommercial = true;
        estimatedMake = 'Tata / BharatBenz';
      } else if (hintClass.includes('AMBULANCE')) {
        vehicleType = 'AMBULANCE';
        confidence = 0.99;
        isEmergency = true;
      } else if (hintClass.includes('POLICE')) {
        vehicleType = 'POLICE_VEHICLE';
        confidence = 0.98;
        isEmergency = true;
      }

      const result: VehicleClassificationResult = {
        vehicleType,
        confidence,
        color,
        colorConfidence,
        estimatedMake,
        estimatedModel,
        isCommercial,
        isEmergency,
        sourceFrameId: payload.frameUrl,
        cameraId,
        timestamp,
        disclaimer: 'AI VISION ESTIMATE (Probabilistic Visual Classification — Always requires officer verification)'
      };

      this.eventsProcessedCount += 1;
      this.completedJobsCount += 1;
      this.totalLatencyMs += (Date.now() - start);
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.recordHeartbeat();

      return result;
    } catch (err) {
      this.failedJobsCount += 1;
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      throw err;
    }
  }
}

export const vehicleClassificationAgent = new VehicleClassificationAgent();
