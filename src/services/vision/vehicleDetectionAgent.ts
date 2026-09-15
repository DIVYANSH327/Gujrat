/**
 * Vehicle Detection Agent
 * Detects vehicles and occupants in real CCTV frames with normalized bounding boxes.
 * Powered by Sentinel Vision Fabric (Edge YOLOv8 + Google Cloud AI routing).
 * Enforces zero fake detections, authentic latency metrics, and persistent tracking IDs.
 */

import { AgentResult, VehicleClass, VehicleDetection, VisionFrame } from './visionTypes.js';
import { visionFabricService } from './fabric/VisionFabricService.js';

export class VehicleDetectionAgent {
  private static instance: VehicleDetectionAgent;

  public static getInstance(): VehicleDetectionAgent {
    if (!VehicleDetectionAgent.instance) {
      VehicleDetectionAgent.instance = new VehicleDetectionAgent();
    }
    return VehicleDetectionAgent.instance;
  }

  private normalizeVehicleClass(cls: string): VehicleClass {
    const lower = (cls || '').toLowerCase().trim();
    if (lower.includes('motorcycle') || lower.includes('bike')) return 'motorcycle';
    if (lower.includes('scooter')) return 'scooter';
    if (lower.includes('rickshaw') || lower.includes('auto')) return 'auto_rickshaw';
    if (lower.includes('bus')) return 'bus';
    if (lower.includes('truck') || lower.includes('lorry')) return 'truck';
    if (lower.includes('van')) return 'van';
    if (lower.includes('suv')) return 'suv';
    if (lower.includes('car') || lower.includes('sedan') || lower.includes('hatchback')) return 'car';
    return 'other_vehicle';
  }

  public async detectVehicles(frame: VisionFrame): Promise<AgentResult<VehicleDetection[]>> {
    const startTime = Date.now();

    try {
      // Process through Sentinel Vision Fabric multi-engine pipeline
      const observation = await visionFabricService.processFrame(
        frame.cameraId,
        frame.imageBuffer,
        frame.mimeType || 'image/jpeg',
        frame.sha256
      );

      // If frame is unreadable or corrupted, never fabricate detections
      if (observation.frameQuality === 'UNREADABLE') {
        return {
          agentName: 'VehicleDetectionAgent',
          status: 'SUCCESS',
          data: [],
          confidence: 0,
          execution: {
            provider: observation.engine as any,
            model: observation.model,
            latencyMs: observation.latencyMs,
            status: 'SUCCESS',
            retryCount: 0
          },
          disclaimer: 'Frame quality unreadable. Zero artificial detections generated.'
        };
      }

      // Map vision fabric detections to VehicleDetection[]
      const detections: VehicleDetection[] = observation.detections.map((det) => ({
        id: det.id,
        class: this.normalizeVehicleClass(det.className),
        box: det.bbox,
        confidence: det.confidence,
        frameId: frame.frameId,
        trackId: det.trackId,
        plateBox: undefined,
        plateText: undefined
      }));

      const avgConfidence = detections.length > 0
        ? detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length
        : 0;

      return {
        agentName: 'VehicleDetectionAgent',
        status: 'SUCCESS',
        data: detections,
        confidence: avgConfidence,
        execution: {
          provider: observation.engine as any,
          model: observation.model,
          latencyMs: observation.latencyMs,
          status: 'SUCCESS',
          retryCount: 0
        },
        disclaimer: `Sentinel Vision Fabric (${observation.engine}) inference complete.`
      };
    } catch (err: any) {
      console.warn('[VehicleDetectionAgent] Vision Fabric inference error:', err?.message || err);
      return {
        agentName: 'VehicleDetectionAgent',
        status: 'FAILED',
        data: [],
        confidence: 0,
        execution: {
          provider: 'NONE' as any,
          model: 'none',
          latencyMs: Date.now() - startTime,
          status: 'AI_PROVIDER_UNAVAILABLE' as any,
          retryCount: 0,
          failureReason: err?.message || 'Vision Fabric inference error'
        },
        disclaimer: 'Inference engine unavailable. Zero artificial detections produced.'
      };
    }
  }
}

export const vehicleDetectionAgent = VehicleDetectionAgent.getInstance();
