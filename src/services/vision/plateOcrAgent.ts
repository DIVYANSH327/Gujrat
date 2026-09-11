/**
 * Plate OCR Agent
 * Reads registration plate characters using Gemini Vision optical analysis.
 * Normalizes syntax according to Indian Motor Vehicles Act (State-RTO-Series-Digits)
 * Never invents missing characters.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { AgentResult, PlateCandidate, PlateOCRResult, VisionFrame } from './visionTypes.js';

export class PlateOcrAgent {
  private static instance: PlateOcrAgent;
  private candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];

  public static getInstance(): PlateOcrAgent {
    if (!PlateOcrAgent.instance) {
      PlateOcrAgent.instance = new PlateOcrAgent();
    }
    return PlateOcrAgent.instance;
  }

  /**
   * Normalizes Indian registration plate string (e.g. "GJ 01 AB 1234" -> "GJ01AB1234")
   */
  public normalizeIndianPlate(rawText: string | null): {
    normalized: string | null;
    stateCode?: string;
    rtoCode?: string;
    series?: string;
    digits?: string;
    isValidFormat: boolean;
  } {
    if (!rawText) return { normalized: null, isValidFormat: false };
    const cleaned = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length < 6 || cleaned.length > 11) {
      return { normalized: cleaned || null, isValidFormat: false };
    }

    // Standard format: 2 letters (state) + 2 digits (RTO) + 1-3 letters (series) + 4 digits
    // e.g. GJ01AB1234, DL01C1234, MH12DE5678, BH22AA1234
    const match = cleaned.match(/^([A-Z]{2})(\d{2})([A-Z]{1,3})?(\d{1,4})$/);
    if (match) {
      return {
        normalized: cleaned,
        stateCode: match[1],
        rtoCode: match[2],
        series: match[3],
        digits: match[4],
        isValidFormat: true
      };
    }

    return { normalized: cleaned, isValidFormat: false };
  }

  public async readPlate(
    plateCandidate: PlateCandidate,
    contextualFrame?: VisionFrame
  ): Promise<AgentResult<PlateOCRResult>> {
    const startTime = Date.now();

    if (!process.env.GEMINI_API_KEY) {
      return {
        agentName: 'PlateOcrAgent',
        status: 'KEY_REQUIRED',
        data: {
          text: null,
          normalizedText: null,
          confidence: 0,
          readable: false,
          reason: 'GEMINI_API_KEY is not configured.'
        },
        confidence: 0,
        execution: {
          provider: 'gemini',
          model: this.candidateModels[0],
          latencyMs: 0,
          status: 'KEY_REQUIRED',
          retryCount: 0,
          failureReason: 'GEMINI_API_KEY missing'
        }
      };
    }

    if (!plateCandidate.cropBuffer || plateCandidate.cropBuffer.length === 0) {
      return {
        agentName: 'PlateOcrAgent',
        status: 'FAILED',
        data: {
          text: null,
          normalizedText: null,
          confidence: 0,
          readable: false,
          reason: 'Empty plate image crop.'
        },
        confidence: 0,
        execution: {
          provider: 'optical',
          model: 'rule_engine',
          latencyMs: 1,
          status: 'FAILED',
          retryCount: 0,
          failureReason: 'Empty crop'
        }
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const cropBase64 = plateCandidate.cropBuffer.toString('base64');

    const prompt = `You are a specialized Optical Character Recognition (OCR) agent for Indian vehicle registration plates.
Analyze this cropped license plate image.
Extract the alphanumeric registration number.
Guidelines:
1. Indian plates follow the standard pattern: 2 state letters (e.g. GJ, MH, DL), 2 digit RTO code, 1-3 series letters, and 4 digits (e.g. GJ01AB1234).
2. Read ONLY what is visibly present. DO NOT invent or guess missing characters.
3. If the characters are too blurry, obstructed, or dark to read reliably, set readable=false.
4. Output confidence between 0.0 and 1.0.

Return ONLY valid JSON matching schema.`;

    const generateConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          readable: { type: Type.BOOLEAN },
          reason: { type: Type.STRING }
        },
        required: ['confidence', 'readable']
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
                  data: cropBase64
                }
              },
              { text: prompt }
            ]
          },
          config: generateConfig
        });

        usedModel = modelCandidate;
        const resText = response.text?.trim() || '{}';
        const parsed = JSON.parse(resText);

        const rawText = parsed.text ? String(parsed.text).trim() : null;
        const normalized = this.normalizeIndianPlate(rawText);
        const readable = Boolean(parsed.readable && normalized.normalized);
        const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || (readable ? 0.8 : 0.2)));

        return {
          agentName: 'PlateOcrAgent',
          status: 'SUCCESS',
          data: {
            text: rawText,
            normalizedText: normalized.normalized,
            confidence,
            readable,
            reason: parsed.reason || (readable ? undefined : 'Characters obscured or unreadable'),
            stateCode: normalized.stateCode,
            rtoCode: normalized.rtoCode,
            series: normalized.series,
            digits: normalized.digits
          },
          confidence,
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
        console.warn(`[PlateOcrAgent] OCR with model ${modelCandidate} failed:`, err?.message || err);
      }
    }

    return {
      agentName: 'PlateOcrAgent',
      status: 'FAILED',
      data: {
        text: null,
        normalizedText: null,
        confidence: 0,
        readable: false,
        reason: lastError?.message || 'OCR failed across all vision models'
      },
      confidence: 0,
      execution: {
        provider: 'gemini',
        model: usedModel,
        latencyMs: Date.now() - startTime,
        status: 'FAILED',
        retryCount: retries,
        failureReason: lastError?.message
      }
    };
  }
}

export const plateOcrAgent = PlateOcrAgent.getInstance();
