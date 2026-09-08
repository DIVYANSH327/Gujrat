/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ScaleSimulationService: Mathematical Capacity & Workload Simulator
 * Models 80,000+ CCTV Cameras and 1,000,000+ Vehicle Observations / Day.
 * Principle: Architectural simulation based on queuing theory & network math.
 */

export interface ScaleConfig {
  cameraScale: number; // 1000, 5000, 10000, 25000, 50000, 80000
  vehicleScaleDaily: number; // 100000, 250000, 500000, 1000000
  burstMultiplier: number; // 1x (normal), 4x (rush hour), 10x (incident surge), 50x (statewide emergency)
  edgeFilterEnabled: boolean;
  prioritySchedulerEnabled: boolean;
  topologyAssistedEnabled: boolean;
}

export interface ScaleTelemetry {
  cameraCount: number;
  activeEdgeNodes: number;
  regionalControllersCount: number;
  totalMeshAgents: number;
  averageVehicleObsPerSec: number;
  currentPeakObsPerSec: number;
  eventsPerSec: number;
  anprReadsPerSec: number;
  evidenceEventsPerSec: number;
  aiJobsPerSec: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  queueDepth: number;
  gpuUtilizationPercent: number;
  cpuUtilizationPercent: number;
  rawBandwidthWithoutEdgeFilterGbps: number;
  actualNetworkBandwidthMbps: number;
  bandwidthSavingsPercent: number;
  rawDailyStorageTb: number;
  actualDailyStorageGb: number;
  storageSavingsPercent: number;
  failedJobs: number;
  reassignedJobs: number;
  backpressureState: 'NORMAL' | 'HIGH_LOAD' | 'BACKPRESSURE_ACTIVE';
  isSimulated: true;
}

export class ScaleSimulationService {
  private static instance: ScaleSimulationService | null = null;
  private config: ScaleConfig = {
    cameraScale: 80000,
    vehicleScaleDaily: 1000000,
    burstMultiplier: 1.0,
    edgeFilterEnabled: true,
    prioritySchedulerEnabled: true,
    topologyAssistedEnabled: true
  };

  private constructor() {}

  public static getInstance(): ScaleSimulationService {
    if (!ScaleSimulationService.instance) {
      ScaleSimulationService.instance = new ScaleSimulationService();
    }
    return ScaleSimulationService.instance;
  }

  public setConfig(newConfig: Partial<ScaleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): ScaleConfig {
    return { ...this.config };
  }

  /**
   * Calculate deterministic mathematical telemetry based on current configuration
   */
  public getTelemetry(): ScaleTelemetry {
    const { cameraScale, vehicleScaleDaily, burstMultiplier, edgeFilterEnabled, prioritySchedulerEnabled, topologyAssistedEnabled } = this.config;

    // 1. Edge nodes topology: 1 edge node per 50 cameras
    const activeEdgeNodes = Math.ceil(cameraScale / 50);
    const regionalControllersCount = Math.max(4, Math.ceil(cameraScale / 20000));
    const totalMeshAgents = activeEdgeNodes * 4 + regionalControllersCount * 6 + 12;

    // 2. Average rate: daily / 86400 seconds
    const baseObsPerSec = vehicleScaleDaily / 86400; // ~11.57/sec for 1M
    const currentPeakObsPerSec = Math.round(baseObsPerSec * burstMultiplier * 10) / 10;
    const eventsPerSec = Math.round(currentPeakObsPerSec * 2.4);
    const anprReadsPerSec = Math.round(currentPeakObsPerSec * 0.92);
    const evidenceEventsPerSec = Math.round(currentPeakObsPerSec * 0.15); // Best-frame policy filters 85% of redundant frames!

    // 3. AI Jobs rate
    const aiJobsPerSec = Math.round(currentPeakObsPerSec * 1.8);

    // 4. Latency and Queues
    // Without priority scheduler or under massive burst, latency grows
    let baseLatency = 38; // ms
    if (!prioritySchedulerEnabled) baseLatency += 45;
    if (burstMultiplier > 5) baseLatency += (burstMultiplier * 4);
    if (!topologyAssistedEnabled) baseLatency += 15;

    const averageLatencyMs = Math.round(baseLatency);
    const p95LatencyMs = Math.round(averageLatencyMs * 1.65);
    const queueDepth = Math.round(Math.max(12, currentPeakObsPerSec * (burstMultiplier > 4 ? 3.5 : 0.8)));

    // 5. Hardware Load
    let cpu = 28 + (burstMultiplier * 4.5);
    let gpu = 34 + (burstMultiplier * 5.2);
    if (!edgeFilterEnabled) {
      cpu += 40;
      gpu += 35;
    }
    const cpuUtilizationPercent = Math.min(99, Math.round(cpu));
    const gpuUtilizationPercent = Math.min(98, Math.round(gpu));

    // 6. Network math:
    // Without edge filter: 80,000 cameras * 4 Mbps 1080p RTSP stream = 320,000 Mbps = 320 Gbps!
    const rawBandwidthGbps = Math.round((cameraScale * 4) / 1000);
    // With edge filter: metadata JSON (1.4 KB) + 0.15 keyframes (85 KB) = ~14 KB per observation = ~160 Kbps per node
    const actualNetworkBandwidthMbps = edgeFilterEnabled
      ? Math.round(currentPeakObsPerSec * 0.95 * 10) / 10
      : rawBandwidthGbps * 1000;
    const bandwidthSavingsPercent = edgeFilterEnabled ? 99.98 : 0.0;

    // 7. Storage math:
    // Raw 24/7 video: 80,000 cams * 40 GB/day = 3,200 TB/day = 3.2 PB/day!
    const rawDailyStorageTb = Math.round((cameraScale * 40) / 1000);
    // Policy-driven keyframes + metadata: 1,000,000 vehicles * 150 KB = 150 GB/day!
    const actualDailyStorageGb = edgeFilterEnabled ? Math.round((vehicleScaleDaily * 150) / (1024 * 1024)) : rawDailyStorageTb * 1024;
    const storageSavingsPercent = edgeFilterEnabled ? 99.99 : 0.0;

    // 8. Backpressure state
    let backpressureState: 'NORMAL' | 'HIGH_LOAD' | 'BACKPRESSURE_ACTIVE' = 'NORMAL';
    if (burstMultiplier >= 10 || currentPeakObsPerSec > 200) {
      backpressureState = 'BACKPRESSURE_ACTIVE';
    } else if (burstMultiplier >= 4 || currentPeakObsPerSec > 50) {
      backpressureState = 'HIGH_LOAD';
    }

    return {
      cameraCount: cameraScale,
      activeEdgeNodes,
      regionalControllersCount,
      totalMeshAgents,
      averageVehicleObsPerSec: Math.round(baseObsPerSec * 10) / 10,
      currentPeakObsPerSec,
      eventsPerSec,
      anprReadsPerSec,
      evidenceEventsPerSec,
      aiJobsPerSec,
      averageLatencyMs,
      p95LatencyMs,
      queueDepth,
      gpuUtilizationPercent,
      cpuUtilizationPercent,
      rawBandwidthWithoutEdgeFilterGbps: rawBandwidthGbps,
      actualNetworkBandwidthMbps,
      bandwidthSavingsPercent,
      rawDailyStorageTb,
      actualDailyStorageGb,
      storageSavingsPercent,
      failedJobs: burstMultiplier > 8 ? Math.round(burstMultiplier * 2) : 0,
      reassignedJobs: burstMultiplier > 4 ? Math.round(burstMultiplier * 3) : 1,
      backpressureState,
      isSimulated: true
    };
  }
}

export const scaleSimulation = ScaleSimulationService.getInstance();
