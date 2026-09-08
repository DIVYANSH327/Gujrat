/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * OperationalDigitalTwinService
 * Architectural Scale Simulation & Dynamic Fault-Injection Twin.
 * Models 1,000 to 100,000 cameras and tests failover, backpressure, and rebalancing.
 */

import { 
  DigitalTwinFleetScale, 
  DigitalTwinMetrics, 
  RegionalFleetLoad 
} from '../types';
import { centralEventBus } from './CentralEventBus';
import { AgentSupervisorService } from './AgentSupervisorService';
import { sysEvents } from './Architecture';

export class OperationalDigitalTwinService {
  private static instance: OperationalDigitalTwinService | null = null;
  private currentScale: DigitalTwinFleetScale = 80000;
  private supervisor: AgentSupervisorService;
  
  private faultState = {
    cameraFailureActive: false,
    edgeFailureActive: false,
    regionalFailureActive: false,
    latencyBurstActive: false,
    agentOverloadActive: false
  };

  private constructor() {
    this.supervisor = AgentSupervisorService.getInstance();
  }

  public static getInstance(): OperationalDigitalTwinService {
    if (!OperationalDigitalTwinService.instance) {
      OperationalDigitalTwinService.instance = new OperationalDigitalTwinService();
    }
    return OperationalDigitalTwinService.instance;
  }

  public setScale(scale: DigitalTwinFleetScale): void {
    this.currentScale = scale;
    sysEvents.emit('DIGITAL_TWIN_SCALE_CHANGED', scale);
  }

  public getScale(): DigitalTwinFleetScale {
    return this.currentScale;
  }

  public getMetrics(): DigitalTwinMetrics {
    const scale = this.currentScale;
    const baseEventsPerSec = Math.round(scale * 0.12);
    const activeAgents = Math.min(64, Math.max(8, Math.round(scale / 1250)));
    
    // Calculate multiplier from active faults
    let latencyMultiplier = 1.0;
    let droppedMultiplier = 0.0001;
    let backpressure = false;
    let rebalancing = false;

    if (this.faultState.cameraFailureActive) {
      droppedMultiplier += 0.02;
      rebalancing = true;
    }
    if (this.faultState.edgeFailureActive) {
      latencyMultiplier += 1.8;
      droppedMultiplier += 0.04;
      rebalancing = true;
    }
    if (this.faultState.regionalFailureActive) {
      latencyMultiplier += 2.5;
      backpressure = true;
      rebalancing = true;
    }
    if (this.faultState.latencyBurstActive) {
      latencyMultiplier += 3.2;
      backpressure = true;
    }
    if (this.faultState.agentOverloadActive) {
      latencyMultiplier += 2.1;
      backpressure = true;
      rebalancing = true;
    }

    const regionalLoads: RegionalFleetLoad[] = [
      {
        region: 'Ahmedabad Metropolis',
        camerasCount: Math.round(scale * 0.35),
        activeAgents: Math.round(activeAgents * 0.35),
        loadPercent: this.faultState.regionalFailureActive ? 98 : 64,
        bandwidthMbps: Math.round(scale * 0.08),
        status: this.faultState.regionalFailureActive ? 'OVERLOADED' : 'NORMAL'
      },
      {
        region: 'Surat Industrial Corridor',
        camerasCount: Math.round(scale * 0.28),
        activeAgents: Math.round(activeAgents * 0.28),
        loadPercent: 58,
        bandwidthMbps: Math.round(scale * 0.06),
        status: 'NORMAL'
      },
      {
        region: 'Vadodara Zone',
        camerasCount: Math.round(scale * 0.20),
        activeAgents: Math.round(activeAgents * 0.20),
        loadPercent: this.faultState.agentOverloadActive ? 92 : 52,
        bandwidthMbps: Math.round(scale * 0.04),
        status: this.faultState.agentOverloadActive ? 'ELEVATED' : 'NORMAL'
      },
      {
        region: 'Rajkot & Saurashtra Gateway',
        camerasCount: Math.round(scale * 0.17),
        activeAgents: Math.round(activeAgents * 0.17),
        loadPercent: 46,
        bandwidthMbps: Math.round(scale * 0.03),
        status: 'NORMAL'
      }
    ];

    return {
      fleetScale: scale,
      eventsPerSec: Math.round(baseEventsPerSec * (this.faultState.latencyBurstActive ? 2.8 : 1.0)),
      activeCameras: this.faultState.cameraFailureActive ? Math.round(scale * 0.88) : scale,
      activeAgents: this.faultState.agentOverloadActive ? Math.round(activeAgents * 0.75) : activeAgents,
      queuedJobs: Math.round(28 * (backpressure ? 6 : 1)),
      processingJobs: Math.round(activeAgents * 1.5),
      failedJobs: this.faultState.edgeFailureActive ? 14 : 1,
      avgLatencyMs: Math.round(35 * latencyMultiplier),
      p95LatencyMs: Math.round(110 * latencyMultiplier),
      p99LatencyMs: Math.round(240 * latencyMultiplier),
      droppedEvents: Math.round(baseEventsPerSec * droppedMultiplier),
      backpressureActive: backpressure,
      rebalancingActive: rebalancing,
      regionalLoads,
      faultInjectionState: { ...this.faultState },
      lastUpdateTimestamp: new Date().toISOString()
    };
  }

  /**
   * Fault Injection Controls
   */
  public triggerFault(faultType: 'CAMERA_FAILURE' | 'EDGE_FAILURE' | 'REGIONAL_FAILURE' | 'LATENCY_BURST' | 'AGENT_OVERLOAD'): void {
    switch (faultType) {
      case 'CAMERA_FAILURE':
        this.faultState.cameraFailureActive = true;
        break;
      case 'EDGE_FAILURE':
        this.faultState.edgeFailureActive = true;
        break;
      case 'REGIONAL_FAILURE':
        this.faultState.regionalFailureActive = true;
        break;
      case 'LATENCY_BURST':
        this.faultState.latencyBurstActive = true;
        break;
      case 'AGENT_OVERLOAD':
        this.faultState.agentOverloadActive = true;
        break;
    }

    centralEventBus.publish({
      eventType: 'FAULT_INJECTION_TRIGGERED',
      sourceId: 'OperationalDigitalTwin',
      correlationId: `FAULT-${faultType}`,
      idempotencyKey: `FLT-TRIG-${faultType}-${Date.now()}`,
      priority: 'P0',
      payload: { faultType, timestamp: new Date().toISOString() }
    });

    sysEvents.emit('DIGITAL_TWIN_FAULT_INJECTED', faultType);
  }

  public restoreSystem(): void {
    this.faultState = {
      cameraFailureActive: false,
      edgeFailureActive: false,
      regionalFailureActive: false,
      latencyBurstActive: false,
      agentOverloadActive: false
    };

    centralEventBus.publish({
      eventType: 'FAULT_INJECTION_RECOVERED',
      sourceId: 'OperationalDigitalTwin',
      correlationId: 'FAULT-RESTORE',
      idempotencyKey: `FLT-RESTORE-${Date.now()}`,
      priority: 'P1',
      payload: { status: 'ALL_FAULTS_CLEARED', timestamp: new Date().toISOString() }
    });

    sysEvents.emit('DIGITAL_TWIN_RESTORED');
  }
}

export const operationalDigitalTwinService = OperationalDigitalTwinService.getInstance();
