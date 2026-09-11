/**
 * Vehicle Detection Agent
 * Detects vehicles and occupants in real CCTV frames with normalized bounding boxes.
 * Interfaces with Google GenAI with model failover and latency tracking.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { AgentResult, VehicleClass, VehicleDetection, VisionFrame } from './visionTypes.js';

export class VehicleDetectionAgent {
  private static instance: VehicleDetectionAgent;
  private candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];

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

    if (!process.env.GEMINI_API_KEY) {
      return {
        agentName: 'VehicleDetectionAgent',
        status: 'KEY_REQUIRED',
        data: [],
        confidence: 0,
        execution: {
          provider: 'gemini',
          model: this.candidateModels[0],
          latencyMs: 0,
          status: 'KEY_REQUIRED',
          retryCount: 0,
          failureReason: 'GEMINI_API_KEY is not configured in server environment.'
        },
        disclaimer: 'AI inference requires a configured GEMINI_API_KEY.'
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const base64Data = frame.imageBuffer.toString('base64');

    const prompt = `You are an expert traffic surveillance vehicle detector for the Gujarat Police Command Center.
Analyze this single frame from camera ${frame.cameraId}.
Identify all visible vehicles (cars, motorcycles, scooters, auto rickshaws, buses, trucks, vans) and people.
For each vehicle:
1. Provide normalized bounding box coordinates [0.0 to 1.0] where (0,0) is top-left: x, y, width, height.
2. If a license plate or registration plate area is visible on the vehicle, provide its normalized bounding box: plateBox.
3. If plate text is decipherable, provide plateText.
4. Estimate detection confidence between 0.0 and 1.0.

Return ONLY valid JSON matching the schema. Do not output markdown code blocks.`;

    const generateConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                class: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                box: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER }
                  },
                  required: ['x', 'y', 'width', 'height']
                },
                plateBox: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER }
                  }
                },
                plateText: { type: Type.STRING },
                attributes: {
                  type: Type.OBJECT,
                  properties: {
                    helmet: { type: Type.STRING },
                    vehicleType: { type: Type.STRING },
                    color: { type: Type.STRING }
                  }
                }
              },
              required: ['class', 'confidence', 'box']
            }
          }
        },
        required: ['detections']
      }
    };

    let usedModel = this.candidateModels[0];
    let retries = 0;
    let lastError: any = null;

    for (const modelCandidate of this.candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelCandidate,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data
                }
              },
              { text: prompt }
            ]
          },
          config: generateConfig
        });

        usedModel = modelCandidate;
        const text = response.text?.trim() || '{}';
        const parsed = JSON.parse(text);
        const rawDetections = Array.isArray(parsed.detections) ? parsed.detections : [];

        const detections: VehicleDetection[] = [];
        for (let i = 0; i < rawDetections.length; i++) {
          const item = rawDetections[i];
          if (!item.box) continue;

          // Clamp bounding boxes
          const box = {
            x: Math.max(0, Math.min(1, Number(item.box.x) || 0)),
            y: Math.max(0, Math.min(1, Number(item.box.y) || 0)),
            width: Math.max(0.01, Math.min(1, Number(item.box.width) || 0.1)),
            height: Math.max(0.01, Math.min(1, Number(item.box.height) || 0.1))
          };

          let plateBox: any = undefined;
          if (item.plateBox && typeof item.plateBox.x === 'number') {
            plateBox = {
              x: Math.max(0, Math.min(1, Number(item.plateBox.x) || 0)),
              y: Math.max(0, Math.min(1, Number(item.plateBox.y) || 0)),
              width: Math.max(0.005, Math.min(1, Number(item.plateBox.width) || 0.05)),
              height: Math.max(0.005, Math.min(1, Number(item.plateBox.height) || 0.05))
            };
          }

          detections.push({
            id: `DET-${frame.frameId}-${i + 1}`,
            class: this.normalizeVehicleClass(item.class),
            box,
            confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.85)),
            frameId: frame.frameId,
            plateBox,
            plateText: item.plateText ? String(item.plateText).trim() : undefined,
            attributes: item.attributes
          });
        }

        const avgConfidence = detections.length > 0
          ? detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length
          : 0;

        return {
          agentName: 'VehicleDetectionAgent',
          status: 'SUCCESS',
          data: detections,
          confidence: avgConfidence,
          execution: {
            provider: 'gemini',
            model: usedModel,
            latencyMs: Date.now() - startTime,
            status: 'SUCCESS',
            retryCount: retries
          }
        };
      } catch (err: any) {
        retries++;
        lastError = err;
        console.warn(`[VehicleDetectionAgent] Model ${modelCandidate} failed:`, err?.message || err);
      }
    }

    return {
      agentName: 'VehicleDetectionAgent',
      status: 'FAILED',
      data: [],
      confidence: 0,
      execution: {
        provider: 'gemini',
        model: usedModel,
        latencyMs: Date.now() - startTime,
        status: 'FAILED',
        retryCount: retries,
        failureReason: lastError?.message || 'All candidate vision models failed'
      }
    };
  }
}

export const vehicleDetectionAgent = VehicleDetectionAgent.getInstance();
