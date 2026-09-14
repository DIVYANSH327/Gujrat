/**
 * Core Provider Abstraction & Data Contracts
 * Gujarat Police AI CCTV Intelligence Platform
 * Author: DIVYANSH Shrivastava
 */

export type AIProviderType = 'GEMINI' | 'OMNIROUTE' | 'EDGE_VISION' | 'NONE';

export type AIRoutingMode = 'GEMINI_ONLY' | 'OMNIROUTE_ONLY' | 'AUTO';

export type AIProviderStatus =
  | 'READY'
  | 'PROCESSING'
  | 'ERROR'
  | 'DISABLED'
  | 'OFFLINE'
  | 'UNREACHABLE'
  | 'AUTHENTICATION_FAILED'
  | 'MODEL_UNAVAILABLE'
  | 'MODEL_NOT_VISION_CAPABLE'
  | 'VISION_UNAVAILABLE'
  | 'AI_KEY_REQUIRED'
  | 'AI_PROVIDER_DISABLED'
  | 'AI_PROVIDER_OFFLINE'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_AUTH_ERROR'
  | 'AI_TIMEOUT'
  | 'MODEL_UNSUPPORTED'
  | 'AI_RATE_LIMITED'
  | 'AI_INVALID_RESPONSE';

export interface ProviderFrameRequest {
  frameBase64: string;
  frameTimestamp?: number;
  sourceId?: string;
  helmetThreshold?: number;
  timeoutMs?: number;
}

export interface NormalizedDetection {
  id: string;
  class: string;
  confidence: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes?: {
    helmet?: 'HELMET' | 'NO_HELMET' | 'UNKNOWN';
    vehicleType?: string;
    color?: string;
    [key: string]: any;
  };
  plate?: string | null;
  plateConfidence?: number | null;
}

export interface NormalizedSafetyEvent {
  type: string;
  confidence: number;
  description?: string;
}

export interface NormalizedAIResponse {
  status: 'ok' | 'SUCCESS' | 'HIGH_DEMAND_BACKOFF' | 'ERROR' | 'FALLBACK';
  provider: AIProviderType;
  model: string;
  frameTimestamp: number;
  sourceId: string;
  detections: NormalizedDetection[];
  roadSafetyEvents: NormalizedSafetyEvent[];
  aiModel: string;
  analysisTimeMs: number;
  fallbackUsed: boolean;
  primaryProvider?: AIProviderType;
  warning?: string;
  errorCode?: AIProviderStatus | string;
  rawProviderMetadata?: any;
}

export interface ProviderDiagnosticResult {
  provider: AIProviderType;
  configured: boolean;
  authenticated: boolean;
  reachable: boolean;
  model: string;
  status: AIProviderStatus;
  latencyMs?: number;
  error?: string;

  // Explicit OmniRoute Diagnostic Fields
  OMNIROUTE_REACHABLE?: boolean;
  OMNIROUTE_AUTHENTICATED?: boolean;
  OMNIROUTE_MODEL_AVAILABLE?: boolean;
  modelAvailable?: boolean;
  visionAvailable?: boolean;
  visionCapable?: boolean;
  visionTested?: boolean;
  actualEndpoint?: string;
  actualModel?: string;
  endpoint?: string;
  availableModels?: string[];
  actualModelResponse?: {
    model?: string;
    reply?: string;
    latencyMs?: number;
    usage?: any;
    raw?: any;
  } | null;
  networkTopology?: {
    client: string;
    backend: string;
    targetHost: string;
    description: string;
  };
}

export interface IAIProvider {
  readonly name: AIProviderType;
  isConfigured(): boolean;
  getStatus(): Promise<ProviderDiagnosticResult>;
  analyzeFrame(request: ProviderFrameRequest): Promise<NormalizedAIResponse>;
  testText?(prompt: string): Promise<{ success: boolean; reply?: string; latencyMs: number; error?: string }>;
  testVision?(imageJpegBase64?: string): Promise<{ success: boolean; model?: string; reply?: string; latencyMs: number; error?: string; status?: string }>;
}
