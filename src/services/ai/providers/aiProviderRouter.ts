/**
 * AI Provider Router & Health Telemetry Engine
 * Gujarat Police AI CCTV Intelligence Platform
 * Author: DIVYANSH Shrivastava
 */

import {
  AIProviderType,
  AIRoutingMode,
  AIProviderStatus,
  IAIProvider,
  ProviderFrameRequest,
  NormalizedAIResponse,
  ProviderDiagnosticResult
} from "./aiProvider.js";
import { GeminiProvider } from "./geminiProvider.js";
import { OmniRouteProvider } from "./omniRouteProvider.js";
import { applicationLifecycleManager } from "../../server/ApplicationLifecycleManager.js";

export interface ProviderRouterTelemetry {
  provider: AIProviderType;
  model: string;
  status: AIProviderStatus;
  lastInferenceAt: number | null;
  latencyMs: number | null;
  fallbackUsed: boolean;
  errorCode: string | null;
  routingMode: AIRoutingMode;
  primaryConfiguredProvider: AIProviderType;
  totalInferences: number;
  totalFallbacks: number;
  gemini: ProviderDiagnosticResult;
  omniRoute: ProviderDiagnosticResult;
}

export class AIProviderRouter {
  private geminiProvider: GeminiProvider;
  private omniRouteProvider: OmniRouteProvider;

  private lastProviderUsed: AIProviderType = 'NONE';
  private lastModelUsed: string = 'none';
  private lastInferenceAt: number | null = null;
  private lastLatencyMs: number | null = null;
  private lastFallbackUsed: boolean = false;
  private lastErrorCode: string | null = null;
  private totalInferences: number = 0;
  private totalFallbacks: number = 0;
  private lastWarningLogMessage: string | null = null;
  private lastWarningLogTime: number = 0;

  private logWarnThrottled(tag: string, message: string) {
    const key = `${tag}:${message}`;
    const now = Date.now();
    if (this.lastWarningLogMessage !== key || now - this.lastWarningLogTime > 300000) {
      console.info(`[${tag}] ${message}`);
      this.lastWarningLogMessage = key;
      this.lastWarningLogTime = now;
    }
  }

  constructor(
    geminiOrOptions?: GeminiProvider | { geminiProvider?: GeminiProvider; omniRouteProvider?: OmniRouteProvider },
    omniRoute?: OmniRouteProvider
  ) {
    if (geminiOrOptions && typeof geminiOrOptions === 'object' && ('geminiProvider' in geminiOrOptions || 'omniRouteProvider' in geminiOrOptions)) {
      this.geminiProvider = (geminiOrOptions as any).geminiProvider || new GeminiProvider();
      this.omniRouteProvider = (geminiOrOptions as any).omniRouteProvider || new OmniRouteProvider();
    } else {
      this.geminiProvider = (geminiOrOptions as GeminiProvider) || new GeminiProvider();
      this.omniRouteProvider = omniRoute || new OmniRouteProvider();
    }
  }

  resolveActiveProvider(): AIProviderType {
    const mode = this.getRoutingMode();
    if (mode === 'OMNIROUTE_ONLY') return 'OMNIROUTE';
    if (mode === 'GEMINI_ONLY') return 'GEMINI';

    const explicit = (process.env.AI_PROVIDER || '').toUpperCase().trim();
    if (explicit === 'OMNIROUTE') return 'OMNIROUTE';
    if (explicit === 'GEMINI') return 'GEMINI';

    // In AUTO mode: If OmniRoute is configured and not degraded, select OMNIROUTE, otherwise fallback to GEMINI
    const isOmniDegraded = typeof (this.omniRouteProvider as any).isDegraded === 'function' 
      ? (this.omniRouteProvider as any).isDegraded() 
      : false;
    if (this.omniRouteProvider.isConfigured() && !isOmniDegraded) {
      return 'OMNIROUTE';
    }
    if (this.geminiProvider.isConfigured()) {
      return 'GEMINI';
    }
    if (this.omniRouteProvider.isConfigured()) {
      return 'OMNIROUTE';
    }
    return 'NONE';
  }

  getPrimaryProviderType(): AIProviderType {
    return this.resolveActiveProvider();
  }

  getRoutingMode(): AIRoutingMode {
    const raw = (process.env.AI_ROUTING_MODE || 'AUTO').toUpperCase().trim();
    if (raw === 'OMNIROUTE_ONLY') return 'OMNIROUTE_ONLY';
    if (raw === 'GEMINI_ONLY') return 'GEMINI_ONLY';
    return 'AUTO';
  }

  getProviderInstance(type: AIProviderType): IAIProvider | null {
    if (type === 'GEMINI') return this.geminiProvider;
    if (type === 'OMNIROUTE') return this.omniRouteProvider;
    return null;
  }

  /**
   * Main router entry point conforming strictly to Phase 5
   */
  async routeFrameAnalysis(request: ProviderFrameRequest): Promise<NormalizedAIResponse> {
    const startTime = Date.now();

    if (!request || !request.frameBase64 || typeof request.frameBase64 !== 'string') {
      const err: any = new Error('No frameBase64 payload provided for analysis.');
      err.code = 'INVALID_REQUEST';
      err.statusCode = 400;
      throw err;
    }

    const cleanBase64 = request.frameBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '').trim();
    if (cleanBase64.length === 0) {
      const err: any = new Error('Empty image payload.');
      err.code = 'INVALID_FRAME_DATA';
      err.statusCode = 400;
      throw err;
    }

    const sanitizedRequest = { ...request, frameBase64: cleanBase64 };

    const primaryType = this.getPrimaryProviderType();
    const mode = this.getRoutingMode();

    if (primaryType === 'NONE') {
      const latency = Date.now() - startTime;
      const isOmniDegraded = typeof (this.omniRouteProvider as any).isDegraded === 'function' && (this.omniRouteProvider as any).isDegraded();
      const omniReason = typeof (this.omniRouteProvider as any).getLastResolutionError === 'function' 
        ? (this.omniRouteProvider as any).getLastResolutionError() 
        : null;
      const msg = isOmniDegraded 
        ? (omniReason || 'OmniRoute endpoint is unreachable (Offline). Autonomous Edge CV active.')
        : 'All configured AI providers are offline or require API keys. Autonomous Edge CV active.';
      
      this.recordInference('NONE', 'none', latency, false, 'AI_PROVIDER_OFFLINE');
      const err: any = new Error(msg);
      err.code = 'AI_PROVIDER_OFFLINE';
      err.statusCode = 503;
      err.primaryProvider = 'NONE';
      err.fallbackAttempted = false;
      throw err;
    }

    let primary: IAIProvider;
    let fallback: IAIProvider | null = null;

    if (primaryType === 'OMNIROUTE') {
      primary = this.omniRouteProvider;
      fallback = mode === 'AUTO' ? this.geminiProvider : null;
    } else {
      primary = this.geminiProvider;
      fallback = mode === 'AUTO' ? this.omniRouteProvider : null;
    }

    // Single-provider strict enforcement
    if (mode === 'GEMINI_ONLY') {
      primary = this.geminiProvider;
      fallback = null;
    } else if (mode === 'OMNIROUTE_ONLY') {
      primary = this.omniRouteProvider;
      fallback = null;
    }

    let lastError: any = null;

    // 1. Try Primary Provider if configured
    if (primary.isConfigured()) {
      try {
        const response = await primary.analyzeFrame(request);
        this.recordInference(primary.name, response.model, Date.now() - startTime, false, null);
        return response;
      } catch (err: any) {
        lastError = err;
        if (typeof (primary as any).markDegraded === 'function') {
          (primary as any).markDegraded(err?.message || 'Inference failed', 300000);
        }
        if (fallback && fallback.isConfigured()) {
          this.logWarnThrottled('AI Router', `Provider ${primary.name} unavailable (${err?.message || 'offline'}). Routing to active fallback provider ${fallback.name}.`);
        } else {
          this.logWarnThrottled('AI Router', `Provider ${primary.name} unavailable (${err?.message || 'offline'}). Autonomous Edge CV active.`);
        }
      }
    } else {
      const msg = `Primary provider ${primary.name} is not configured/authenticated.`;
      lastError = new Error(msg);
      lastError.code = 'AI_KEY_REQUIRED';
    }

    // 2. If fallback available in AUTO mode, attempt fallback
    if (fallback && fallback.isConfigured()) {
      try {
        const response = await fallback.analyzeFrame(request);
        const latency = Date.now() - startTime;
        this.recordInference(fallback.name, response.model, latency, true, null);

        // Explicitly record truthful provider and fallback attribution
        return {
          ...response,
          fallbackUsed: true,
          primaryProvider: primary.name,
          warning: `Inference served via fallback provider ${fallback.name} (Primary ${primary.name} was unavailable).`
        };
      } catch (fallbackErr: any) {
        this.logWarnThrottled('AI Router', `Fallback provider ${fallback.name} unavailable (${fallbackErr?.message || 'offline'}). Autonomous Edge CV active.`);
        lastError = fallbackErr;
      }
    }

    // 3. Both failed or no provider configured
    const latency = Date.now() - startTime;
    const errCode = lastError?.code || (lastError?.statusCode === 504 ? 'AI_TIMEOUT' : 'AI_PROVIDER_OFFLINE');
    this.recordInference('NONE', 'none', latency, false, errCode);

    const errorObj: any = new Error(lastError?.message || 'All configured AI providers are offline or failed.');
    errorObj.code = errCode;
    errorObj.statusCode = lastError?.statusCode || 503;
    errorObj.primaryProvider = primary.name;
    errorObj.fallbackAttempted = !!fallback;
    throw errorObj;
  }

  private recordInference(
    provider: AIProviderType,
    model: string,
    latencyMs: number,
    fallbackUsed: boolean,
    errorCode: string | null
  ) {
    this.lastProviderUsed = provider;
    this.lastModelUsed = model;
    this.lastInferenceAt = Date.now();
    this.lastLatencyMs = latencyMs;
    this.lastFallbackUsed = fallbackUsed;
    this.lastErrorCode = errorCode;
    this.totalInferences++;
    if (fallbackUsed) {
      this.totalFallbacks++;
    }
    if (!errorCode && provider !== 'NONE') {
      applicationLifecycleManager.recordInferenceSuccess();
      applicationLifecycleManager.setSubsystemState('AI_PROVIDER_ROUTER', 'RUNNING');
    } else if (errorCode) {
      applicationLifecycleManager.setSubsystemState('AI_PROVIDER_ROUTER', 'DEGRADED', errorCode);
    }
  }

  /**
   * Diagnostic summary across providers
   */
  async getDiagnostics(): Promise<ProviderRouterTelemetry> {
    const [geminiStatus, omniRouteStatus] = await Promise.all([
      this.geminiProvider.getStatus(),
      this.omniRouteProvider.getStatus()
    ]);

    const primaryType = this.getPrimaryProviderType();
    const mode = this.getRoutingMode();

    let overallStatus: AIProviderStatus = 'OFFLINE';
    let activeModel = 'none';
    let activeProvider: AIProviderType = 'NONE';

    if (primaryType === 'OMNIROUTE' && omniRouteStatus.status === 'READY') {
      overallStatus = 'READY';
      activeProvider = 'OMNIROUTE';
      activeModel = omniRouteStatus.model;
    } else if (primaryType === 'GEMINI' && geminiStatus.status === 'READY') {
      overallStatus = 'READY';
      activeProvider = 'GEMINI';
      activeModel = geminiStatus.model;
    } else if (mode === 'AUTO') {
      if (omniRouteStatus.status === 'READY') {
        overallStatus = 'READY';
        activeProvider = 'OMNIROUTE';
        activeModel = omniRouteStatus.model;
      } else if (geminiStatus.status === 'READY') {
        overallStatus = 'READY';
        activeProvider = 'GEMINI';
        activeModel = geminiStatus.model;
      } else {
        overallStatus = (geminiStatus.status !== 'OFFLINE' ? geminiStatus.status : omniRouteStatus.status) as AIProviderStatus;
      }
    } else {
      const primStatus = primaryType === 'OMNIROUTE' ? omniRouteStatus.status : geminiStatus.status;
      overallStatus = primStatus as AIProviderStatus;
    }

    return {
      provider: activeProvider,
      model: activeModel,
      status: overallStatus,
      lastInferenceAt: this.lastInferenceAt,
      latencyMs: this.lastLatencyMs,
      fallbackUsed: this.lastFallbackUsed,
      errorCode: this.lastErrorCode,
      routingMode: mode,
      primaryConfiguredProvider: primaryType,
      totalInferences: this.totalInferences,
      totalFallbacks: this.totalFallbacks,
      gemini: geminiStatus,
      omniRoute: omniRouteStatus
    };
  }
}

// Global Singleton Router Export
export const aiProviderRouter = new AIProviderRouter();
