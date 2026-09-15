/**
 * VisionModelRouter: Deterministic Routing Engine
 * Gujarat Police CCTV & AI Intelligence Platform
 * 
 * Routing Policies:
 * - Real-time Object Detection & Spatial Tracking -> Local Edge YOLOv8 (18ms target)
 * - Complex Scene Reasoning / Violation Adjudication -> Gemini / Google Cloud AI
 * - Vehicle License Plate Verification -> Dedicated ANPR / HSRP Optical Pipeline
 * - Network / Stream Anomalies -> Defensive Cybersecurity Agent Mesh
 */

import { VisionEngine } from './VisionEngine.js';
import { TruthStatus, VisionEngineType } from './VisionTypes.js';
import { yoloVisionEngine } from './engines/YoloVisionEngine.js';
import { googleCloudVisionEngine } from './engines/GoogleCloudVisionEngine.js';
import { geminiVisionEngine } from './engines/GeminiVisionEngine.js';
import { unavailableVisionEngine } from './engines/UnavailableVisionEngine.js';

export interface RoutingTask {
  taskType: 'OBJECT_DETECTION' | 'SCENE_REASONING' | 'PLATE_OCR' | 'CYBER_EVENT';
  cameraId: string;
  isHighValueIncident?: boolean;
  frameQualityScore?: number;
  userEnginePreference?: 'AUTO' | 'YOLO' | 'CLOUD' | 'GEMINI';
}

export interface RoutingDecision {
  selectedEngine: VisionEngine;
  engineType: VisionEngineType;
  reason: string;
  latencyEstimateMs: number;
  availability: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
  truthStatus: TruthStatus;
}

export class VisionModelRouter {
  public async route(task: RoutingTask): Promise<RoutingDecision> {
    const pref = task.userEnginePreference || 'AUTO';

    // Explicit override checks
    if (pref === 'YOLO') {
      const isAvail = await yoloVisionEngine.isAvailable();
      return {
        selectedEngine: yoloVisionEngine,
        engineType: 'YOLO',
        reason: 'Officer manual preference: Edge YOLOv8 selected.',
        latencyEstimateMs: yoloVisionEngine.getStatus().latencyMs,
        availability: isAvail ? 'AVAILABLE' : 'DEGRADED',
        truthStatus: 'OBSERVED'
      };
    }

    if (pref === 'GEMINI') {
      const isAvail = await geminiVisionEngine.isAvailable();
      return {
        selectedEngine: isAvail ? geminiVisionEngine : unavailableVisionEngine,
        engineType: isAvail ? 'GEMINI' : 'UNAVAILABLE',
        reason: isAvail ? 'Officer manual preference: Google Gemini Multimodal Vision selected.' : 'Gemini requested but GEMINI_API_KEY is not configured.',
        latencyEstimateMs: isAvail ? geminiVisionEngine.getStatus().latencyMs : 0,
        availability: isAvail ? 'AVAILABLE' : 'UNAVAILABLE',
        truthStatus: isAvail ? 'OBSERVED' : 'UNAVAILABLE'
      };
    }

    if (pref === 'CLOUD') {
      const isAvail = await googleCloudVisionEngine.isAvailable();
      return {
        selectedEngine: isAvail ? googleCloudVisionEngine : unavailableVisionEngine,
        engineType: isAvail ? 'GOOGLE_CLOUD_VISION' : 'UNAVAILABLE',
        reason: isAvail ? 'Officer manual preference: Google Cloud Vision API selected.' : 'Google Cloud Vision requested but GCP credentials not set.',
        latencyEstimateMs: isAvail ? googleCloudVisionEngine.getStatus().latencyMs : 0,
        availability: isAvail ? 'AVAILABLE' : 'UNAVAILABLE',
        truthStatus: isAvail ? 'OBSERVED' : 'UNAVAILABLE'
      };
    }

    // AUTO DETERMINISTIC ROUTING
    switch (task.taskType) {
      case 'OBJECT_DETECTION': {
        const isYoloReady = await yoloVisionEngine.isAvailable();
        if (isYoloReady) {
          return {
            selectedEngine: yoloVisionEngine,
            engineType: 'YOLO',
            reason: 'Real-time vehicle detection routed to Local Edge YOLOv8 (low-latency edge path).',
            latencyEstimateMs: yoloVisionEngine.getStatus().latencyMs,
            availability: 'AVAILABLE',
            truthStatus: 'OBSERVED'
          };
        }
        return {
          selectedEngine: unavailableVisionEngine,
          engineType: 'UNAVAILABLE',
          reason: 'Local YOLO engine is disabled or unavailable.',
          latencyEstimateMs: 0,
          availability: 'UNAVAILABLE',
          truthStatus: 'UNAVAILABLE'
        };
      }

      case 'SCENE_REASONING': {
        const isGeminiReady = await geminiVisionEngine.isAvailable();
        if (isGeminiReady) {
          return {
            selectedEngine: geminiVisionEngine,
            engineType: 'GEMINI',
            reason: 'Complex scene narrative and safety verification routed to Google Gemini Flash.',
            latencyEstimateMs: geminiVisionEngine.getStatus().latencyMs,
            availability: 'AVAILABLE',
            truthStatus: 'OBSERVED'
          };
        }
        return {
          selectedEngine: yoloVisionEngine,
          engineType: 'YOLO',
          reason: 'Cloud Gemini not configured; falling back gracefully to edge object detection.',
          latencyEstimateMs: yoloVisionEngine.getStatus().latencyMs,
          availability: 'DEGRADED',
          truthStatus: 'OBSERVED'
        };
      }

      case 'PLATE_OCR': {
        // Dedicated plate pipeline is handled by PlateDetectionAgent + PlateOcrAgent
        return {
          selectedEngine: yoloVisionEngine,
          engineType: 'YOLO',
          reason: 'Bounding box candidate generated via Edge YOLOv8, followed by dedicated optical OCR pipeline.',
          latencyEstimateMs: yoloVisionEngine.getStatus().latencyMs,
          availability: 'AVAILABLE',
          truthStatus: 'OBSERVED'
        };
      }

      case 'CYBER_EVENT': {
        return {
          selectedEngine: unavailableVisionEngine,
          engineType: 'UNAVAILABLE',
          reason: 'Security anomaly routed to Defensive Cybersecurity Mesh.',
          latencyEstimateMs: 12,
          availability: 'AVAILABLE',
          truthStatus: 'OBSERVED'
        };
      }

      default:
        return {
          selectedEngine: yoloVisionEngine,
          engineType: 'YOLO',
          reason: 'Default edge vision pipeline selected.',
          latencyEstimateMs: 18,
          availability: 'AVAILABLE',
          truthStatus: 'OBSERVED'
        };
    }
  }
}

export const visionModelRouter = new VisionModelRouter();
