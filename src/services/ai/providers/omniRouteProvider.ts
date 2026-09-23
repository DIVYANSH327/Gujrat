/**
 * OmniRoute AI Vision & Language Provider Implementation
 * Gujarat Police AI CCTV Intelligence Platform
 * Author: DIVYANSH Shrivastava
 */

import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import {
  IAIProvider,
  AIProviderType,
  ProviderFrameRequest,
  NormalizedAIResponse,
  ProviderDiagnosticResult,
  NormalizedDetection,
  NormalizedSafetyEvent,
  AIProviderStatus
} from "./aiProvider.js";

export interface OmniRouteConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export class OmniRouteProvider implements IAIProvider {
  readonly name: AIProviderType = 'OMNIROUTE';
  private verifiedVisionModel: string | null = null;
  private verifiedVisionModelExpiresAt = 0;
  private lastResolutionError: string | null = null;
  private lastResolutionErrorExpiresAt = 0;

  getNormalizedBaseUrl(): string {
    const raw = (process.env.OMNIROUTE_BASE_URL || '').trim().replace(/\/+$/, '');
    if (!raw) return '';
    if (!raw.endsWith('/v1') && !raw.includes('/v1/')) {
      return `${raw}/v1`;
    }
    return raw;
  }

  getConfig(): OmniRouteConfig {
    const enabledRaw = process.env.OMNIROUTE_ENABLED;
    const enabled = enabledRaw === 'true' || enabledRaw === '1';
    const baseUrl = this.getNormalizedBaseUrl();
    const apiKey = (process.env.OMNIROUTE_API_KEY || '').trim();
    const model = (process.env.OMNIROUTE_MODEL || 'auto').trim();
    const timeoutMs = Number(process.env.OMNIROUTE_TIMEOUT_MS) || 12000;

    return {
      enabled,
      baseUrl,
      apiKey,
      model,
      timeoutMs
    };
  }

  isConfigured(): boolean {
    const cfg = this.getConfig();
    return Boolean(cfg.enabled && cfg.baseUrl.length > 0 && cfg.apiKey.length > 0 && !this.isDegraded());
  }

  isDegraded(): boolean {
    return Boolean(this.lastResolutionError && Date.now() < this.lastResolutionErrorExpiresAt);
  }

  markDegraded(reason: string, durationMs = 120000): void {
    this.lastResolutionError = reason;
    this.lastResolutionErrorExpiresAt = Date.now() + durationMs;
    this.verifiedVisionModel = null;
    this.verifiedVisionModelExpiresAt = 0;
  }

  /**
   * Check if a model identifier is known to support image/vision input
   */
  isVisionCapableModel(modelName: string): boolean {
    const normalized = (modelName || '').toLowerCase().trim();
    if (!normalized) return false;
    
    // Explicit known text-only models
    const textOnlyPatterns = [
      'gpt-3.5',
      'text-embedding',
      'deepseek-r1',
      'deepseek-chat',
      'llama-3-',
      'llama-2',
      'mistral-7b',
      'mixtral-8x7b',
      'qwen-2.5-7b-instruct',
      'qwen-2.5-72b-instruct'
    ];
    for (const pattern of textOnlyPatterns) {
      if (normalized.includes(pattern) && !normalized.includes('vl') && !normalized.includes('vision')) {
        return false;
      }
    }

    // Vision indicators
    const visionPatterns = [
      'auto',
      'vision',
      'vl',
      '4o',
      'gemini',
      'claude',
      'sonnet',
      'opus',
      'haiku',
      'pixtral',
      'llava',
      'qwen',
      'flash',
      'pro',
      'omni',
      'minicpm',
      'internvl'
    ];

    return visionPatterns.some(p => normalized.includes(p));
  }

  /**
   * Probes a specific candidate model with a real JPEG vision chat completion request.
   */
  async probeModelVision(
    cleanBaseUrl: string,
    authHeaders: Record<string, string>,
    model: string
  ): Promise<{ ok: boolean; actualModel: string; error?: string; latencyMs: number }> {
    const minimalValidJpeg = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const start = Date.now();
    const rawRoot = cleanBaseUrl.replace(/\/+v1\/?$/, '').replace(/\/+api\/?$/, '');
    const tryUrls = [
      `${cleanBaseUrl}/chat/completions`,
      `${rawRoot}/v1/chat/completions`,
      `${rawRoot}/chat/completions`,
      `${rawRoot}/api/v1/chat/completions`,
      `${rawRoot}/api/chat/completions`
    ];

    // Deduplicate URLs while preserving order
    const uniqueTryUrls = Array.from(new Set(tryUrls));

    let lastProbeError = '';
    for (const url of uniqueTryUrls) {
      try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), Math.min(3000, Number(process.env.OMNIROUTE_TIMEOUT_MS) || 3000));
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'aistudio-gujarat-police-platform',
            ...authHeaders
          },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this image. Return JSON with: {"visible_scene":"surveillance_test","people_visible":false,"vehicles_visible":false}.'
                  },
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${minimalValidJpeg}` }
                  }
                ]
              }
            ],
            max_tokens: 40
          }),
          signal: controller.signal
        }).finally(() => clearTimeout(tId));

        const latencyMs = Date.now() - start;
        if (resp.ok) {
          const data = await resp.json().catch(() => null);
          const actualModel = data?.model || model;
          return { ok: true, actualModel, latencyMs };
        } else if (resp.status !== 404) {
          const text = await resp.text().catch(() => '');
          let json: any = null;
          try { json = JSON.parse(text); } catch {}
          const msg = json?.error?.message || json?.diagnostics?.terminalReason || text;
          return { ok: false, actualModel: model, error: `HTTP ${resp.status}: ${msg.slice(0, 150)}`, latencyMs };
        } else {
          lastProbeError = `HTTP ${resp.status}: Endpoint not found at ${url}`;
        }
      } catch (e: any) {
        const isTimeout = e?.name === 'AbortError' || String(e?.message || '').toLowerCase().includes('timeout');
        lastProbeError = isTimeout ? 'Vision probe timed out' : (e?.message || String(e));
        if (isTimeout || e?.code === 'ECONNREFUSED' || e?.code === 'ENOTFOUND' || String(e?.message || '').includes('fetch failed')) {
          break;
        }
      }
    }

    return {
      ok: false,
      actualModel: model,
      error: lastProbeError || 'Vision probe failed',
      latencyMs: Date.now() - start
    };
  }

  /**
   * Discovers and verifies a working vision-capable model from the OmniRoute catalogue.
   */
  async resolveWorkingVisionModel(forceRecheck: boolean = false): Promise<{
    model: string;
    verified: boolean;
    availableModels: string[];
    error?: string;
  }> {
    const cfg = this.getConfig();
    const cleanBaseUrl = cfg.baseUrl.replace(/\/+$/, '');
    if (!cleanBaseUrl) {
      return { model: 'none', verified: false, availableModels: [], error: 'OMNIROUTE_BASE_URL is not configured.' };
    }

    if (!forceRecheck && this.verifiedVisionModel && Date.now() < this.verifiedVisionModelExpiresAt) {
      return { model: this.verifiedVisionModel, verified: true, availableModels: [] };
    }

    if (!forceRecheck && this.lastResolutionError && Date.now() < this.lastResolutionErrorExpiresAt) {
      return { model: 'none', verified: false, availableModels: [], error: this.lastResolutionError };
    }

    const authHeaders: Record<string, string> = {
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'aistudio-gujarat-police-platform'
    };
    if (cfg.apiKey) {
      authHeaders['Authorization'] = `Bearer ${cfg.apiKey}`;
    }

    // Fast path: If an explicit non-auto model is configured, test vision directly
    if (cfg.model && cfg.model !== 'auto') {
      const directVisionCheck = await this.probeModelVision(cleanBaseUrl, authHeaders, cfg.model);
      if (directVisionCheck.ok) {
        this.verifiedVisionModel = directVisionCheck.actualModel;
        this.verifiedVisionModelExpiresAt = Date.now() + 60000;
        this.lastResolutionError = null;
        return { model: directVisionCheck.actualModel, verified: true, availableModels: [cfg.model] };
      }
    }

    let availableModels: string[] = [];
    let modelsFetchFailed = false;
    let modelsStatus: number | string = 'Offline';

    const rawRoot = cleanBaseUrl.replace(/\/+v1\/?$/, '').replace(/\/+api\/?$/, '');
    const modelUrls = Array.from(new Set([
      `${cleanBaseUrl}/models`,
      `${rawRoot}/v1/models`,
      `${rawRoot}/models`,
      `${rawRoot}/api/v1/models`,
      `${rawRoot}/api/models`,
      `${rawRoot}/api/tags`
    ]));

    try {
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), Math.min(3000, cfg.timeoutMs));
      let modelsResp: Response | null = null;

      for (const mUrl of modelUrls) {
        try {
          const resp = await fetch(mUrl, {
            method: 'GET',
            headers: authHeaders,
            signal: controller.signal
          });
          const ngrokErr = resp?.headers?.get('ngrok-error-code');
          const isHtml = (resp?.headers?.get('content-type') || '').includes('text/html');
          if (ngrokErr || (resp && resp.status === 404 && isHtml)) {
            modelsFetchFailed = true;
            modelsStatus = 'Offline';
            break;
          }
          if (resp && resp.ok) {
            modelsResp = resp;
            break;
          } else if (resp && resp.status !== 404) {
            modelsResp = resp;
            break;
          }
        } catch (e: any) {
          const isNetworkError = e?.name === 'AbortError' || e?.code === 'ECONNREFUSED' || e?.code === 'ENOTFOUND' || String(e?.message || '').includes('fetch failed');
          if (isNetworkError) {
            modelsFetchFailed = true;
            modelsStatus = e?.name === 'AbortError' ? 'Timeout' : 'Unreachable';
            break;
          }
        }
      }

      clearTimeout(tId);

      if (modelsResp && modelsResp.ok) {
        const body: any = await modelsResp.json().catch(() => null);
        if (Array.isArray(body?.data)) {
          availableModels = body.data.map((m: any) => m?.id || m?.name).filter(Boolean);
        } else if (Array.isArray(body?.models)) {
          availableModels = body.models.map((m: any) => m?.name || m?.id).filter(Boolean);
        }
      } else if (!modelsFetchFailed) {
        modelsFetchFailed = true;
        modelsStatus = modelsResp ? modelsResp.status : 'Offline';
      }
    } catch (e: any) {
      modelsFetchFailed = true;
      const isTimeout = e?.name === 'AbortError' || String(e?.message || '').toLowerCase().includes('timeout');
      modelsStatus = isTimeout ? 'Timeout' : 'Unreachable';
    }

    // Fallback direct candidate probe when /models is 404 or unsupported (only if host was reachable)
    if (availableModels.length === 0) {
      const isHostUnreachable = modelsStatus === 'Offline' || modelsStatus === 'Unreachable' || modelsStatus === 'Timeout' || (typeof modelsStatus === 'number' && modelsStatus >= 500);
      
      if (!isHostUnreachable) {
        const directCandidates = [
          cfg.model && cfg.model !== 'auto' ? cfg.model : '',
          'gemini-2.0-flash',
          'gpt-4o-mini',
          'gemini-1.5-flash',
          'claude-3-5-sonnet',
          'auto/pro-vision'
        ].filter(Boolean);

        for (const cand of directCandidates) {
          const probe = await this.probeModelVision(cleanBaseUrl, authHeaders, cand);
          if (probe.ok) {
            this.verifiedVisionModel = probe.actualModel;
            this.verifiedVisionModelExpiresAt = Date.now() + 60000;
            this.lastResolutionError = null;
            return { model: probe.actualModel, verified: true, availableModels: [probe.actualModel] };
          }
        }
      }

      const errorReason = modelsFetchFailed
        ? (typeof modelsStatus === 'number'
            ? `OmniRoute endpoint returned HTTP ${modelsStatus}. Check tunnel/base URL.`
            : `OmniRoute endpoint is unreachable (${modelsStatus}). Check tunnel/base URL.`)
        : `OmniRoute model catalogue returned 0 models from ${cleanBaseUrl}.`;
      this.markDegraded(errorReason, 300000);
      return { model: 'none', verified: false, availableModels: [], error: errorReason };
    }

    // Explicit model configured that is NOT "auto"
    if (cfg.model && cfg.model !== 'auto') {
      const visionCheck = await this.probeModelVision(cleanBaseUrl, authHeaders, cfg.model);
      if (visionCheck.ok) {
        this.verifiedVisionModel = visionCheck.actualModel;
        this.verifiedVisionModelExpiresAt = Date.now() + 60000;
        this.lastResolutionError = null;
        return { model: visionCheck.actualModel, verified: true, availableModels };
      }
      return { model: cfg.model, verified: false, availableModels, error: visionCheck.error };
    }

    // In AUTO mode: Test candidates dynamically from availableModels
    // Filter out known broken / text-only / unsupported models
    const excludedPatterns = [
      'minimax',
      'minimax-m3-free',
      'minimax-m2.5-free',
      'qwen3.6-plus-free',
      '-free',
      'free-',
      'gpt-3.5',
      'deepseek-r1',
      'deepseek-chat',
      'deepseek-v3',
      'deepseek',
      'coding',
      'reasoning',
      'build',
      'text-embedding',
      'embedding',
      'llama-2',
      'llama-3-8b',
      'mistral-7b',
      'mixtral-8x7b',
      'audio',
      'whisper',
      'tts',
      'moderation',
      'rerank',
      'bge-'
    ];

    const candidates = availableModels.filter(m => {
      const lower = m.toLowerCase();
      return !excludedPatterns.some(ex => lower.includes(ex));
    });

    // Prioritize direct top-tier vision models over virtual aggregator aliases
    const tier1Direct = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gpt-4o-mini',
      'gpt-4o',
      'claude-3-5-sonnet',
      'claude-3-haiku',
      'qwen-2.5-vl',
      'qwen-vl-plus',
      'qwen-vl-max',
      'pixtral',
      'minicpm-v',
      'internvl',
      'llava'
    ];

    const getCandidateScore = (cand: string): number => {
      const lower = cand.toLowerCase();
      let score = 0;

      // Penalize aggregator routes (like auto/pro-vision, auto/claude-sonnet) so reliable direct models are tested first
      if (lower.startsWith('auto/')) {
        score -= 25;
      }

      // High bonus for tier 1 multimodal leaders
      for (const t1 of tier1Direct) {
        if (lower.includes(t1)) {
          score += 60;
        }
      }

      // Vision and performance keywords
      if (lower.includes('vision') || lower.includes('vl')) score += 30;
      if (lower.includes('flash') || lower.includes('4o')) score += 25;
      if (lower.includes('gemini') || lower.includes('claude') || lower.includes('gpt-4')) score += 20;
      if (lower.includes('sonnet') || lower.includes('haiku') || lower.includes('qwen')) score += 15;
      if (lower.includes('multimodal') || lower.includes('omni')) score += 10;
      if (lower.includes('pro')) score += 5;

      return score;
    };

    candidates.sort((a, b) => getCandidateScore(b) - getCandidateScore(a));

    const probeErrors: string[] = [];
    const topCandidates = candidates.slice(0, 15);
    const batchSize = 3;

    // Test candidates in parallel batches of 3 for fast responsive resolution
    for (let i = 0; i < topCandidates.length; i += batchSize) {
      const batch = topCandidates.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(cand => this.probeModelVision(cleanBaseUrl, authHeaders, cand))
      );

      const successful = batchResults.find(r => r.ok);
      if (successful) {
        this.verifiedVisionModel = successful.actualModel;
        this.verifiedVisionModelExpiresAt = Date.now() + 60000;
        this.lastResolutionError = null;
        return { model: successful.actualModel, verified: true, availableModels };
      }

      for (const r of batchResults) {
        if (r.error) {
          probeErrors.push(`${r.actualModel}: ${r.error}`);
        }
      }
    }

    const lastErrDetail = probeErrors.length > 0 ? ` (${probeErrors.slice(0, 2).join('; ')})` : '';
    const failureReason = `No operational vision-capable model found in OmniRoute catalogue (${availableModels.length} models checked)${lastErrDetail}`;
    this.lastResolutionError = failureReason;
    this.lastResolutionErrorExpiresAt = Date.now() + 30000;

    return {
      model: 'none',
      verified: false,
      availableModels,
      error: failureReason
    };
  }

  /**
   * Diagnostic verification conforming strictly to network topology and reachability checks.
   * Reports OMNIROUTE_REACHABLE, OMNIROUTE_AUTHENTICATED, OMNIROUTE_MODEL_AVAILABLE, and visionAvailable.
   */
  async getStatus(forceRecheck = false): Promise<ProviderDiagnosticResult> {
    const cfg = this.getConfig();

    if (!cfg.enabled) {
      return {
        provider: 'OMNIROUTE',
        configured: false,
        authenticated: false,
        reachable: false,
        OMNIROUTE_REACHABLE: false,
        OMNIROUTE_AUTHENTICATED: false,
        OMNIROUTE_MODEL_AVAILABLE: false,
        modelAvailable: false,
        visionAvailable: false,
        model: cfg.model,
        actualModel: cfg.model,
        status: 'AI_PROVIDER_DISABLED',
        error: 'OMNIROUTE_ENABLED is not set to true in server environment.'
      };
    }

    if (!cfg.baseUrl) {
      return {
        provider: 'OMNIROUTE',
        configured: false,
        authenticated: false,
        reachable: false,
        OMNIROUTE_REACHABLE: false,
        OMNIROUTE_AUTHENTICATED: false,
        OMNIROUTE_MODEL_AVAILABLE: false,
        modelAvailable: false,
        visionAvailable: false,
        model: cfg.model,
        actualModel: cfg.model,
        status: 'AI_KEY_REQUIRED',
        error: 'OMNIROUTE_BASE_URL is not configured. Cloud Run cannot access PC LAN IPs directly; configure an externally reachable HTTPS tunnel endpoint.'
      };
    }

    if (!cfg.apiKey) {
      return {
        provider: 'OMNIROUTE',
        configured: false,
        authenticated: false,
        reachable: false,
        OMNIROUTE_REACHABLE: false,
        OMNIROUTE_AUTHENTICATED: false,
        OMNIROUTE_MODEL_AVAILABLE: false,
        modelAvailable: false,
        visionAvailable: false,
        model: cfg.model,
        actualModel: cfg.model,
        status: 'AI_KEY_REQUIRED',
        error: 'OMNIROUTE_API_KEY is not configured in server environment.'
      };
    }

    const cleanBaseUrl = cfg.baseUrl.replace(/\/+$/, '');

    if (!forceRecheck && this.isDegraded() && this.lastResolutionError) {
      const isTimeout = this.lastResolutionError.toLowerCase().includes('timeout');
      return {
        provider: 'OMNIROUTE',
        configured: Boolean(cfg.apiKey),
        authenticated: false,
        reachable: false,
        OMNIROUTE_REACHABLE: false,
        OMNIROUTE_AUTHENTICATED: false,
        OMNIROUTE_MODEL_AVAILABLE: false,
        modelAvailable: false,
        visionAvailable: false,
        endpoint: cleanBaseUrl,
        actualEndpoint: cleanBaseUrl,
        model: cfg.model,
        actualModel: cfg.model,
        status: isTimeout ? 'AI_TIMEOUT' : 'UNREACHABLE',
        latencyMs: 0,
        error: this.lastResolutionError
      };
    }

    const start = Date.now();

    // 1. Probe models endpoint to check reachability and auth
    let availableModels: string[] = [];
    const authHeaders: Record<string, string> = {};
    if (cfg.apiKey) {
      authHeaders['Authorization'] = `Bearer ${cfg.apiKey}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(cfg.timeoutMs, 5000));

      const modelsResp = await fetch(`${cleanBaseUrl}/models`, {
        method: 'GET',
        headers: authHeaders,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      const ngrokErr = modelsResp.headers.get('ngrok-error-code');
      const isHtml = (modelsResp.headers.get('content-type') || '').includes('text/html');
      if (ngrokErr || (modelsResp.status === 404 && isHtml)) {
        const errorMsg = `OmniRoute tunnel endpoint at ${cleanBaseUrl} is offline (${ngrokErr || 'HTTP 404 HTML'}). Check tunnel/base URL.`;
        this.markDegraded(errorMsg, 300000);
        return {
          provider: 'OMNIROUTE',
          configured: Boolean(cfg.apiKey),
          authenticated: false,
          reachable: false,
          OMNIROUTE_REACHABLE: false,
          OMNIROUTE_AUTHENTICATED: false,
          OMNIROUTE_MODEL_AVAILABLE: false,
          modelAvailable: false,
          visionAvailable: false,
          endpoint: cleanBaseUrl,
          actualEndpoint: cleanBaseUrl,
          model: cfg.model,
          actualModel: 'none',
          status: 'UNREACHABLE',
          latencyMs: Date.now() - start,
          error: errorMsg,
          networkTopology: {
            client: 'Phone / Remote Client',
            backend: 'Cloud Run Backend',
            targetHost: cleanBaseUrl,
            description: `Attempted path: Phone -> Cloud Run -> ${cleanBaseUrl.startsWith('https://') ? 'HTTPS Tunnel' : 'LAN'} (${cleanBaseUrl}) -> OmniRoute :20128`
          }
        };
      }

      if (modelsResp.status === 401 || modelsResp.status === 403) {
        this.markDegraded(`OmniRoute authentication failed (HTTP ${modelsResp.status})`, 300000);
        return {
          provider: 'OMNIROUTE',
          configured: true,
          authenticated: false,
          reachable: true,
          OMNIROUTE_REACHABLE: true,
          OMNIROUTE_AUTHENTICATED: false,
          OMNIROUTE_MODEL_AVAILABLE: false,
          modelAvailable: false,
          visionAvailable: false,
          endpoint: cleanBaseUrl,
          actualEndpoint: cleanBaseUrl,
          model: cfg.model,
          actualModel: cfg.model,
          status: 'AUTHENTICATION_FAILED',
          latencyMs: Date.now() - start,
          error: `OmniRoute endpoint at ${cleanBaseUrl} is reachable, but authentication failed (HTTP ${modelsResp.status}). Check OMNIROUTE_API_KEY.`
        };
      }

      if (modelsResp.ok) {
        const body: any = await modelsResp.json().catch(() => null);
        if (Array.isArray(body?.data)) {
          availableModels = body.data.map((m: any) => m?.id || m?.name).filter(Boolean);
        }
      }
    } catch (networkErr: any) {
      const isTimeout = networkErr?.name === 'AbortError' || String(networkErr?.message || '').toLowerCase().includes('timeout');
      const latencyMs = Date.now() - start;
      const isPrivateIp = /^(https?:\/\/)?(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(cleanBaseUrl);
      const errorMsg = isTimeout
        ? `Connection timed out connecting to OmniRoute endpoint at ${cleanBaseUrl} after ${Math.min(cfg.timeoutMs, 5000)}ms.`
        : `OmniRoute endpoint at ${cleanBaseUrl} is unreachable (${networkErr?.message || 'Connection refused or host unreachable'}).${isPrivateIp ? ' Note: Cloud Run cannot reach private LAN IP addresses directly without an external HTTPS tunnel.' : ''}`;

      this.markDegraded(errorMsg, isTimeout ? 60000 : 180000);

      return {
        provider: 'OMNIROUTE',
        configured: Boolean(cfg.apiKey),
        authenticated: false,
        reachable: false,
        OMNIROUTE_REACHABLE: false,
        OMNIROUTE_AUTHENTICATED: false,
        OMNIROUTE_MODEL_AVAILABLE: false,
        modelAvailable: false,
        visionAvailable: false,
        endpoint: cleanBaseUrl,
        actualEndpoint: cleanBaseUrl,
        model: cfg.model,
        actualModel: cfg.model,
        status: isTimeout ? 'AI_TIMEOUT' : 'UNREACHABLE',
        latencyMs,
        error: errorMsg,
        networkTopology: {
          client: 'Phone / Remote Client',
          backend: 'Cloud Run Backend',
          targetHost: cleanBaseUrl,
          description: `Attempted path: Phone -> Cloud Run -> ${cleanBaseUrl.startsWith('https://') ? 'HTTPS Tunnel' : 'LAN'} (${cleanBaseUrl}) -> OmniRoute :20128`
        }
      };
    }

    // 2. Discover and validate real working vision model
    const resolved = await this.resolveWorkingVisionModel(true);
    const latencyMs = Date.now() - start;

    if (!resolved.verified || resolved.model === 'none') {
      const isEndpointOffline = (resolved.error || '').toLowerCase().includes('offline') || (resolved.error || '').toLowerCase().includes('unreachable');
      return {
        provider: 'OMNIROUTE',
        configured: Boolean(cfg.apiKey),
        authenticated: !isEndpointOffline,
        reachable: !isEndpointOffline,
        OMNIROUTE_REACHABLE: !isEndpointOffline,
        OMNIROUTE_AUTHENTICATED: !isEndpointOffline,
        OMNIROUTE_MODEL_AVAILABLE: false,
        modelAvailable: false,
        visionAvailable: false,
        endpoint: cleanBaseUrl,
        actualEndpoint: cleanBaseUrl,
        model: cfg.model,
        actualModel: 'none',
        status: isEndpointOffline ? 'UNREACHABLE' : 'VISION_UNAVAILABLE',
        latencyMs,
        availableModels: resolved.availableModels.length > 0 ? resolved.availableModels : availableModels,
        error: resolved.error || 'No operational vision model available on OmniRoute.'
      };
    }

    return {
      provider: 'OMNIROUTE',
      configured: true,
      authenticated: true,
      reachable: true,
      OMNIROUTE_REACHABLE: true,
      OMNIROUTE_AUTHENTICATED: true,
      OMNIROUTE_MODEL_AVAILABLE: true,
      modelAvailable: true,
      visionAvailable: true,
      visionCapable: true,
      visionTested: true,
      endpoint: cleanBaseUrl,
      actualEndpoint: cleanBaseUrl,
      model: resolved.model,
      actualModel: resolved.model,
      status: 'READY',
      latencyMs,
      availableModels: resolved.availableModels.length > 0 ? resolved.availableModels : availableModels
    };
  }

  /**
   * Real vision request test with an actual JPEG payload
   */
  async testVision(imageJpegBase64?: string): Promise<{ success: boolean; model?: string; reply?: string; latencyMs: number; error?: string; status?: string }> {
    const cfg = this.getConfig();
    if (!cfg.enabled) {
      return {
        success: false,
        latencyMs: 0,
        status: 'AI_PROVIDER_DISABLED',
        error: 'OmniRoute is disabled in server environment.'
      };
    }
    if (!cfg.baseUrl) {
      return {
        success: false,
        latencyMs: 0,
        status: 'UNREACHABLE',
        error: 'OMNIROUTE_BASE_URL is not configured.'
      };
    }

    const minimalValidJpeg = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const cleanImage = imageJpegBase64
      ? imageJpegBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '').trim()
      : minimalValidJpeg;

    const start = Date.now();
    try {
      const cleanBaseUrl = cfg.baseUrl.replace(/\/+$/, '');
      const resolved = await this.resolveWorkingVisionModel();
      const targetModel = resolved.verified ? resolved.model : cfg.model;

      const endpoint = `${cleanBaseUrl}/chat/completions`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), cfg.timeoutMs);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cfg.apiKey) {
        headers['Authorization'] = `Bearer ${cfg.apiKey}`;
      }

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: targetModel,
          stream: false,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this image. Return JSON with: {"visible_scene":"surveillance_test","people_visible":false,"vehicles_visible":false}. Do not invent anything that is not visible.'
                },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanImage}` } }
              ]
            }
          ],
          max_tokens: 60
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      const latencyMs = Date.now() - start;
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        let jsonBody: any = null;
        try { jsonBody = JSON.parse(errText); } catch {}
        const errMsg = jsonBody?.error?.message || jsonBody?.diagnostics?.terminalReason || errText;
        return {
          success: false,
          latencyMs,
          status: 'VISION_UNAVAILABLE',
          error: `OmniRoute vision error HTTP ${resp.status}: ${errMsg.slice(0, 200)}`
        };
      }

      const data = await resp.json();
      const reply = data?.choices?.[0]?.message?.content || '';
      const actualModel = data?.model || targetModel;
      return {
        success: true,
        model: actualModel,
        reply,
        latencyMs,
        status: 'READY'
      };
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('timeout');
      return {
        success: false,
        latencyMs: Date.now() - start,
        status: isTimeout ? 'AI_TIMEOUT' : 'VISION_UNAVAILABLE',
        error: isTimeout ? 'OmniRoute vision request timed out' : String(err?.message || err)
      };
    }
  }

  /**
   * Minimal text request test
   */
  async testText(prompt: string): Promise<{ success: boolean; reply?: string; latencyMs: number; error?: string }> {
    const cfg = this.getConfig();
    if (!cfg.enabled || !cfg.apiKey) {
      return {
        success: false,
        latencyMs: 0,
        error: 'OmniRoute is disabled or OMNIROUTE_API_KEY is missing.'
      };
    }

    const start = Date.now();
    try {
      const endpoint = `${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), cfg.timeoutMs);

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      const latencyMs = Date.now() - start;
      if (!resp.ok) {
        return {
          success: false,
          latencyMs,
          error: `OmniRoute error HTTP ${resp.status}: ${resp.statusText}`
        };
      }

      const data = await resp.json();
      const reply = data?.choices?.[0]?.message?.content || '';
      return {
        success: true,
        reply,
        latencyMs
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        error: err?.name === 'AbortError' ? 'OmniRoute request timed out' : String(err?.message || err)
      };
    }
  }

  /**
   * Analyze image frame using OpenAI-compatible Vision API semantics
   */
  async analyzeFrame(request: ProviderFrameRequest): Promise<NormalizedAIResponse> {
    const startTime = Date.now();
    const cfg = this.getConfig();
    const {
      frameBase64,
      frameTimestamp = 0,
      sourceId = 'UNKNOWN-STREAM',
      helmetThreshold = 0.85,
      timeoutMs = cfg.timeoutMs
    } = request;

    if (!cfg.enabled) {
      const err: any = new Error('OmniRoute provider is disabled in environment configuration.');
      err.code = 'AI_PROVIDER_DISABLED';
      err.statusCode = 503;
      throw err;
    }

    if (!cfg.baseUrl) {
      const err: any = new Error('OMNIROUTE_BASE_URL is not configured.');
      err.code = 'CONFIG_REQUIRED';
      err.statusCode = 503;
      throw err;
    }

    const cleanBase64 = frameBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '').trim();
    if (cleanBase64.length === 0) {
      const err: any = new Error('Empty image payload provided to OmniRoute provider.');
      err.code = 'INVALID_FRAME_DATA';
      err.statusCode = 400;
      throw err;
    }

    // Resolve working vision model
    const resolved = await this.resolveWorkingVisionModel();
    if (!resolved.verified && cfg.model === 'auto') {
      const err: any = new Error(resolved.error || 'No operational vision-capable model found in OmniRoute catalogue.');
      err.code = 'AI_PROVIDER_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }

    const targetModel = resolved.verified ? resolved.model : cfg.model;

    const systemPrompt = `You are an expert real-time computer vision security agent for traffic and municipal surveillance.
Analyze the provided video frame with high precision.
Return ONLY valid JSON matching this exact structure:
{
  "detections": [
    {
      "class": "car" | "motorcycle" | "bicycle" | "bus" | "truck" | "person" | "vehicle",
      "confidence": 0.0 to 1.0,
      "box": { "x": 0.0 to 1.0, "y": 0.0 to 1.0, "width": 0.0 to 1.0, "height": 0.0 to 1.0 },
      "attributes": {
        "helmet": "HELMET" | "NO_HELMET" | "UNKNOWN",
        "vehicleType": "sedan" | "suv" | "motorcycle" | "bus" | "truck" | "unknown",
        "color": "string"
      },
      "plate": "string or null if unreadable",
      "plateConfidence": 0.0 to 1.0 or null
    }
  ],
  "roadSafetyEvents": [
    {
      "type": "NO_HELMET" | "TRIPLE_RIDING" | "WRONG_WAY" | "RED_LIGHT_VIOLATION" | "STOP_LINE_VIOLATION" | "DANGEROUS_PARKING" | "PEDESTRIAN_CONFLICT" | "UNSAFE_RIDING",
      "confidence": 0.0 to 1.0,
      "description": "brief description"
    }
  ]
}

Strict Rules:
- Output valid JSON only, no explanatory prose or conversational text.
- Normalized box coordinates: x, y, width, height must be numbers between 0.0 and 1.0.
- Do not invent license plates if not clearly legible (return null).
- Do not invent people or vehicles not present in the frame.
- Set helmet to UNKNOWN if head is occluded or cannot be confirmed visually.`;

    const userMessageContent: any[] = [
      {
        type: 'text',
        text: 'Analyze this surveillance frame for vehicles, riders, license plates, and traffic safety events. Output strict JSON.'
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${cleanBase64}`
        }
      }
    ];

    const baseClean = cfg.baseUrl.replace(/\/+$/, '');
    const endpointsToTry = [
      `${baseClean}/chat/completions`,
      baseClean.endsWith('/v1') ? `${baseClean.slice(0, -3)}/chat/completions` : `${baseClean}/v1/chat/completions`
    ];

    let httpResp: Response | null = null;
    let lastFetchError: any = null;

    for (const endpoint of endpointsToTry) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (cfg.apiKey) {
          reqHeaders['Authorization'] = `Bearer ${cfg.apiKey}`;
        }

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify({
            model: targetModel,
            stream: false,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessageContent }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (resp.ok || resp.status !== 404) {
          httpResp = resp;
          break;
        } else {
          httpResp = resp;
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        lastFetchError = fetchErr;
      }
    }

    if (!httpResp) {
      const isTimeout = lastFetchError?.name === 'AbortError' || String(lastFetchError?.message || '').toLowerCase().includes('timeout');
      const err: any = new Error(
        isTimeout
          ? `OmniRoute request timed out after ${timeoutMs}ms.`
          : `Failed to connect to OmniRoute endpoint: ${lastFetchError?.message || lastFetchError}`
      );
      err.code = isTimeout ? 'AI_TIMEOUT' : 'AI_PROVIDER_UNAVAILABLE';
      err.statusCode = isTimeout ? 504 : 503;
      throw err;
    }

    if (!httpResp.ok) {
      const bodyText = await httpResp.text().catch(() => '');
      let jsonBody: any = null;
      try {
        jsonBody = JSON.parse(bodyText);
      } catch {}

      const errMsg = jsonBody?.error?.message || jsonBody?.message || bodyText;
      const terminalReason = jsonBody?.diagnostics?.terminalReason || '';
      
      const isUpstreamProviderError = 
        Boolean(jsonBody?.diagnostics) || 
        errMsg.toLowerCase().includes('model') || 
        errMsg.toLowerCase().includes('supported') || 
        errMsg.toLowerCase().includes('not recognized') ||
        terminalReason.length > 0;

      if ((httpResp.status === 401 || httpResp.status === 403) && !isUpstreamProviderError) {
        const err: any = new Error('OmniRoute gateway authentication failed. Check OMNIROUTE_API_KEY.');
        err.code = 'AI_AUTH_ERROR';
        err.statusCode = 401;
        throw err;
      }

      if (httpResp.status === 429) {
        const err: any = new Error('OmniRoute rate limit exceeded.');
        err.code = 'AI_RATE_LIMITED';
        err.statusCode = 429;
        throw err;
      }

      if (isUpstreamProviderError || errMsg.toLowerCase().includes('not supported') || errMsg.toLowerCase().includes('model')) {
        this.verifiedVisionModel = null;
        this.verifiedVisionModelExpiresAt = 0;
      }

      const err: any = new Error(
        `OmniRoute upstream error (${httpResp.status}): ${terminalReason || errMsg || httpResp.statusText}`
      );
      err.code = isUpstreamProviderError ? 'AI_PROVIDER_UNAVAILABLE' : 'AI_INVALID_RESPONSE';
      err.statusCode = httpResp.status;
      throw err;
    }

    let completionData: any;
    try {
      completionData = await httpResp.json();
    } catch {
      const err: any = new Error('OmniRoute response is not valid JSON.');
      err.code = 'AI_INVALID_RESPONSE';
      err.statusCode = 502;
      throw err;
    }

    const choice = completionData?.choices?.[0];
    const rawContent = choice?.message?.content || '';
    const actualModel = completionData?.model || targetModel;

    // Cache successful operational vision model
    this.verifiedVisionModel = actualModel;
    this.verifiedVisionModelExpiresAt = Date.now() + 120000;
    this.lastResolutionError = null;

    // Parse structured JSON output
    let parsed: any;
    try {
      let cleaned = rawContent.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }
      parsed = JSON.parse(cleaned);
    } catch {
      const err: any = new Error('OmniRoute returned non-JSON structured content.');
      err.code = 'AI_INVALID_RESPONSE';
      err.statusCode = 502;
      throw err;
    }

    // Validate and normalize detections (truthful fields only)
    const rawDetections = Array.isArray(parsed?.detections) ? parsed.detections : [];
    const validatedDetections: NormalizedDetection[] = rawDetections
      .map((item: any, idx: number) => {
        if (!item || typeof item !== 'object' || !item.box) return null;

        const rawClass = String(item.class || 'unknown').toLowerCase().trim();
        let normalizedClass = 'unknown';
        if (rawClass.includes('person') || rawClass.includes('pedestrian') || rawClass.includes('rider')) {
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

        // Truthful plate handling: if not read or empty, null (never invent UNKNOWN as fake plate string)
        const rawPlate = item.plate ? String(item.plate).trim() : '';
        const plateVal = rawPlate && rawPlate !== 'null' && rawPlate !== 'UNKNOWN' ? rawPlate : null;

        return {
          id: `det-omni-${idx}-${Date.now()}`,
          class: normalizedClass,
          confidence,
          box: { x, y, width, height },
          attributes: {
            helmet,
            vehicleType: item.attributes?.vehicleType,
            color: item.attributes?.color
          },
          plate: plateVal,
          plateConfidence: plateVal && item.plateConfidence ? Number(item.plateConfidence) : null
        };
      })
      .filter((d): d is NormalizedDetection => d !== null);

    const rawEvents = Array.isArray(parsed?.roadSafetyEvents) ? parsed.roadSafetyEvents : [];
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
      provider: 'OMNIROUTE',
      model: actualModel,
      frameTimestamp: Number(frameTimestamp) || 0,
      detections: validatedDetections,
      roadSafetyEvents: validatedSafetyEvents,
      aiModel: `OmniRoute (${actualModel})`,
      analysisTimeMs,
      sourceId,
      fallbackUsed: false,
      rawProviderMetadata: {
        usage: completionData?.usage,
        id: completionData?.id
      }
    };
  }
}

