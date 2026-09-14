/**
 * Gemini AI Vision Provider Implementation
 * Gujarat Police AI CCTV Intelligence Platform
 * Author: DIVYANSH Shrivastava
 */

import { GoogleGenAI, Type } from "@google/genai";
import { isGeminiApiKeyValid, getGeminiKeyStatus } from "../../geminiAuth.js";
import {
  IAIProvider,
  AIProviderType,
  ProviderFrameRequest,
  NormalizedAIResponse,
  ProviderDiagnosticResult,
  NormalizedDetection,
  NormalizedSafetyEvent
} from "./aiProvider.js";

export class GeminiProvider implements IAIProvider {
  readonly name: AIProviderType = 'GEMINI';
  private client: GoogleGenAI | null = null;
  private primaryModel = 'gemini-2.5-flash';
  private candidateModels = ['gemini-3.1-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'];

  isConfigured(): boolean {
    return isGeminiApiKeyValid(process.env.GEMINI_API_KEY);
  }

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const key = process.env.GEMINI_API_KEY;
      if (!isGeminiApiKeyValid(key)) {
        throw new Error('Valid GEMINI_API_KEY (format AIza...) is required.');
      }
      this.client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-gujarat-police-platform'
          }
        }
      });
    }
    return this.client;
  }

  async getStatus(): Promise<ProviderDiagnosticResult> {
    const keyStatus = getGeminiKeyStatus();
    if (!keyStatus.configured) {
      return {
        provider: 'GEMINI',
        configured: false,
        authenticated: false,
        reachable: false,
        model: this.primaryModel,
        status: 'AI_KEY_REQUIRED',
        error: keyStatus.reason
      };
    }

    if (!keyStatus.valid) {
      return {
        provider: 'GEMINI',
        configured: true,
        authenticated: false,
        reachable: false,
        model: this.primaryModel,
        status: 'AI_AUTH_ERROR',
        error: keyStatus.reason
      };
    }

    // Verify minimal connectivity
    try {
      const start = Date.now();
      const client = this.getClient();
      const res = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'ping'
      });
      const latencyMs = Date.now() - start;
      return {
        provider: 'GEMINI',
        configured: true,
        authenticated: true,
        reachable: true,
        model: this.primaryModel,
        status: 'READY',
        latencyMs
      };
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isAuth = msg.includes('401') || msg.includes('403') || msg.includes('UNAUTHENTICATED');
      const isRateLimit = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
      return {
        provider: 'GEMINI',
        configured: true,
        authenticated: !isAuth,
        reachable: false,
        model: this.primaryModel,
        status: isAuth ? 'AI_AUTH_ERROR' : isRateLimit ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_OFFLINE',
        error: msg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
      };
    }
  }

  async testText(prompt: string): Promise<{ success: boolean; reply?: string; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      const res = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt
      });
      return {
        success: true,
        reply: res.text || '',
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        error: String(err?.message || err).replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]')
      };
    }
  }

  async analyzeFrame(request: ProviderFrameRequest): Promise<NormalizedAIResponse> {
    const startTime = Date.now();
    const { frameBase64, frameTimestamp = 0, sourceId = 'UNKNOWN-STREAM', helmetThreshold = 0.85 } = request;

    const cleanBase64 = frameBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '').trim();
    if (cleanBase64.length === 0) {
      const err: any = new Error('Empty image payload provided to GeminiProvider.');
      err.code = 'INVALID_FRAME_DATA';
      err.statusCode = 400;
      throw err;
    }

    if (!this.isConfigured()) {
      const err: any = new Error('GEMINI_API_KEY is not configured or invalid. Platform operating in offline camera mode.');
      err.code = 'AI_PROVIDER_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }

    const client = this.getClient();

    const prompt = `You are analyzing one frame from an authorized traffic/security video for a software demonstration.
Return ONLY valid JSON matching the specified schema.
Detect clearly visible:
- people
- cars
- motorcycles
- bicycles
- buses
- trucks
- other vehicles

For each visible object provide a normalized bounding box and confidence.
Coordinates MUST be normalized between 0.0 and 1.0, with (0,0) at top-left:
x = 0 to 1, y = 0 to 1, width = 0 to 1, height = 0 to 1.

For people associated with motorcycles/bicycles, assess helmet status only when visually supportable:
- HELMET
- NO_HELMET
- UNKNOWN

If the head is small, occluded, or unclear, return UNKNOWN.
Do not force a violation.
Do not identify people's real-world identities.
Do not infer license plates unless clearly visible.
Do not invent objects that are not visible.
If uncertain, return UNKNOWN.
Do not describe the image in prose.`;

    const generateConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          frameTimestamp: { type: Type.NUMBER },
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
                attributes: {
                  type: Type.OBJECT,
                  properties: {
                    helmet: { type: Type.STRING },
                    vehicleType: { type: Type.STRING },
                    color: { type: Type.STRING }
                  }
                },
                plate: { type: Type.STRING },
                plateConfidence: { type: Type.NUMBER }
              },
              required: ['class', 'confidence', 'box']
            }
          },
          roadSafetyEvents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ['type', 'confidence']
            }
          }
        },
        required: ['detections', 'roadSafetyEvents']
      }
    };

    let response: any = null;
    let usedModel = this.primaryModel;
    let isHighDemandSurge = false;
    let lastModelError: any = null;

    for (const modelCandidate of this.candidateModels) {
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts) {
        attempts++;
        try {
          response = await client.models.generateContent({
            model: modelCandidate,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanBase64
                  }
                },
                { text: prompt }
              ]
            },
            config: generateConfig
          });
          usedModel = modelCandidate;
          break;
        } catch (modelErr: any) {
          lastModelError = modelErr;
          const errMsg = String(modelErr?.message || modelErr);
          const isTransient =
            errMsg.includes('503') ||
            errMsg.includes('high demand') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('429');
          if (isTransient) {
            isHighDemandSurge = true;
            if (attempts < maxAttempts) {
              await new Promise(r => setTimeout(r, 400 * attempts));
              continue;
            }
          }
          break;
        }
      }
      if (response) break;
    }

    if (!response) {
      if (isHighDemandSurge) {
        return {
          status: 'HIGH_DEMAND_BACKOFF',
          provider: 'GEMINI',
          model: usedModel,
          frameTimestamp: Number(frameTimestamp) || 0,
          detections: [],
          roadSafetyEvents: [],
          aiModel: `Gemini Vision (Demand Backpressure Active)`,
          analysisTimeMs: Date.now() - startTime,
          sourceId,
          fallbackUsed: false,
          warning: 'Model currently experiencing high demand surge. Frame dropped gracefully.'
        };
      }
      throw lastModelError || new Error('Gemini Vision inference failed across candidate models.');
    }

    let rawText = (response.text || '').trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(rawText);
    } catch {
      throw new Error('Gemini Vision returned non-JSON output.');
    }

    const rawDetections = Array.isArray(parsedResult.detections) ? parsedResult.detections : [];
    const validatedDetections: NormalizedDetection[] = rawDetections
      .map((item: any, idx: number) => {
        if (!item || typeof item !== 'object' || !item.box) return null;

        const rawClass = String(item.class || 'unknown').toLowerCase().trim();
        let normalizedClass = 'unknown';
        if (rawClass.includes('person') || rawClass.includes('pedestrian') || rawClass.includes('human') || rawClass.includes('rider')) {
          normalizedClass = 'person';
        } else if (rawClass.includes('motorcycle') || rawClass.includes('motorbike') || rawClass.includes('scooter') || (rawClass.includes('bike') && !rawClass.includes('bicycle'))) {
          normalizedClass = 'motorcycle';
        } else if (rawClass.includes('bicycle') || rawClass.includes('cyclist')) {
          normalizedClass = 'bicycle';
        } else if (rawClass.includes('car') || rawClass.includes('sedan') || rawClass.includes('suv') || rawClass.includes('auto')) {
          normalizedClass = 'car';
        } else if (rawClass.includes('bus')) {
          normalizedClass = 'bus';
        } else if (rawClass.includes('truck')) {
          normalizedClass = 'truck';
        } else if (rawClass.includes('vehicle')) {
          normalizedClass = 'vehicle';
        }

        const x = Math.max(0, Math.min(1, Number(item.box.x) || 0));
        const y = Math.max(0, Math.min(1, Number(item.box.y) || 0));
        const width = Math.max(0.01, Math.min(1 - x, Number(item.box.width) || 0.05));
        const height = Math.max(0.01, Math.min(1 - y, Number(item.box.height) || 0.05));
        const confidence = Math.max(0, Math.min(1, Number(item.confidence) || 0.5));

        let helmet: 'HELMET' | 'NO_HELMET' | 'UNKNOWN' = 'UNKNOWN';
        const rawHelmet = String(item.attributes?.helmet || '').toUpperCase().trim();
        if (rawHelmet === 'HELMET' || rawHelmet === 'NO_HELMET') {
          helmet = rawHelmet;
        }

        const plateVal = item.plate && String(item.plate).trim() !== '' ? String(item.plate).trim() : null;

        return {
          id: `det-${idx}-${Date.now()}`,
          class: normalizedClass,
          confidence,
          box: { x, y, width, height },
          attributes: { helmet },
          plate: plateVal,
          plateConfidence: plateVal && item.plateConfidence ? Number(item.plateConfidence) : null
        };
      })
      .filter((d): d is NormalizedDetection => d !== null);

    const rawEvents = Array.isArray(parsedResult.roadSafetyEvents) ? parsedResult.roadSafetyEvents : [];
    const allowedEvents = [
      'NO_HELMET',
      'TRIPLE_RIDING',
      'WRONG_WAY',
      'RED_LIGHT_VIOLATION',
      'STOP_LINE_VIOLATION',
      'DANGEROUS_PARKING',
      'PEDESTRIAN_CONFLICT',
      'UNSAFE_RIDING'
    ];

    const validatedSafetyEvents: NormalizedSafetyEvent[] = rawEvents
      .map((evt: any) => {
        if (!evt || typeof evt !== 'object' || !evt.type) return null;
        const rawType = String(evt.type).toUpperCase().replace(/[\s-]/g, '_');
        const type = allowedEvents.includes(rawType) ? rawType : 'UNKNOWN';
        if (type === 'UNKNOWN') return null;

        const confidence = Math.max(0, Math.min(1, Number(evt.confidence) || 0.5));
        return {
          type,
          confidence,
          description: evt.description ? String(evt.description) : undefined
        };
      })
      .filter((e): e is NormalizedSafetyEvent => e !== null);

    const threshold = Number(helmetThreshold) || 0.85;
    const noHelmetRiders = validatedDetections.filter(
      d => (d.class === 'person' || d.class === 'motorcycle') &&
           d.attributes?.helmet === 'NO_HELMET' &&
           d.confidence >= threshold
    );

    if (noHelmetRiders.length > 0 && !validatedSafetyEvents.some(e => e.type === 'NO_HELMET')) {
      validatedSafetyEvents.push({
        type: 'NO_HELMET',
        confidence: noHelmetRiders[0].confidence,
        description: `Rider observed without protective helmet (Confidence: ${Math.round(noHelmetRiders[0].confidence * 100)}%)`
      });
    }

    const analysisTimeMs = Date.now() - startTime;

    return {
      status: 'ok',
      provider: 'GEMINI',
      model: usedModel,
      frameTimestamp: Number(frameTimestamp) || 0,
      detections: validatedDetections,
      roadSafetyEvents: validatedSafetyEvents,
      aiModel: `Gemini Vision (${usedModel})`,
      analysisTimeMs,
      sourceId,
      fallbackUsed: false
    };
  }
}
