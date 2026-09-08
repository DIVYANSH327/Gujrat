/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Central AI Vision Agent Abstraction
 * 
 * Provides clear separation between:
 * 1. REAL AI FRAME-BY-FRAME ANALYSIS (GeminiVisionAgent)
 * 2. SIMULATED DEMO AGENT (SimulatedAIVisionAgent)
 */

export * from './types';
export * from './TemporalTracker';
export { GeminiVisionAgent, geminiVisionAgent } from './GeminiVisionAgent';
export { SimulatedAIVisionAgent, aiVisionAgent as simulatedAIVisionAgent } from '../AIVisionAgent';

import { GeminiVisionAgent, geminiVisionAgent } from './GeminiVisionAgent';
import { SimulatedAIVisionAgent, aiVisionAgent } from '../AIVisionAgent';

export type AIVisionMode = 'REAL' | 'SIMULATED';

export function getAIVisionAgent(mode: AIVisionMode = 'REAL'): GeminiVisionAgent | SimulatedAIVisionAgent {
  if (mode === 'REAL') {
    return geminiVisionAgent;
  }
  return aiVisionAgent;
}
