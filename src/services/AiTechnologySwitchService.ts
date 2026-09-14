/**
 * AI Technology Switch & Multi-Pipeline Routing Controller
 * Gujarat Police CCTV & AI Intelligence Platform (SCRB)
 *
 * Implements Technology Switches & Capability-Driven Pipeline Enforcement:
 * - YOLO: Vehicle & Person spatial bounding box detection [ON/OFF]
 * - ANPR: High-speed plate localization [ON/OFF]
 * - HSRP: Statutory CMVR Rule 50 hologram & laser PIN compliance [ON/OFF]
 * - OCR: Optical Character Recognition on cropped plate regions [ON/OFF]
 * - OmniRoute: High-throughput on-premise / edge AI model router [ON/OFF]
 * - Gemini: Multimodal cloud vision verifier [ON/OFF]
 * - Advanced Vision: Contextual scene & behavioral analytics [ON/OFF]
 *
 * Enforces:
 * - Deterministic baseline execution (YOLO + ANPR + HSRP + OCR only) vs AI-augmented execution
 * - Truthful reporting when switches are toggled OFF (no synthetic fallback)
 * - Traceable metadata logging for audit compliance
 */

export interface TechnologySwitches {
  yoloEnabled: boolean;
  anprEnabled: boolean;
  hsrpEnabled: boolean;
  ocrEnabled: boolean;
  omniRouteEnabled: boolean;
  geminiEnabled: boolean;
  advancedVisionEnabled: boolean;
  routingMode: 'AUTO' | 'DETERMINISTIC_BASELINE' | 'OMNIROUTE_PREFERENCE' | 'GEMINI_PREFERENCE' | 'CUSTOM';
  updatedAt: number;
}

export type SwitchChangeListener = (switches: TechnologySwitches) => void;

export class AiTechnologySwitchService {
  private static instance: AiTechnologySwitchService;
  private listeners: Set<SwitchChangeListener> = new Set();

  private switches: TechnologySwitches = {
    yoloEnabled: true,
    anprEnabled: true,
    hsrpEnabled: true,
    ocrEnabled: true,
    omniRouteEnabled: false, // Baseline starts with deterministic CV; can be toggled by operator
    geminiEnabled: false,
    advancedVisionEnabled: true,
    routingMode: 'AUTO',
    updatedAt: Date.now()
  };

  private constructor() {
    // Respect environment variables if provided
    if (process.env.YOLO_ENABLED !== undefined) {
      this.switches.yoloEnabled = process.env.YOLO_ENABLED === 'true' || process.env.YOLO_ENABLED === '1';
    }
    if (process.env.ANPR_ENABLED !== undefined) {
      this.switches.anprEnabled = process.env.ANPR_ENABLED === 'true' || process.env.ANPR_ENABLED === '1';
    }
    if (process.env.HSRP_ENABLED !== undefined) {
      this.switches.hsrpEnabled = process.env.HSRP_ENABLED === 'true' || process.env.HSRP_ENABLED === '1';
    }
    if (process.env.OCR_ENABLED !== undefined) {
      this.switches.ocrEnabled = process.env.OCR_ENABLED === 'true' || process.env.OCR_ENABLED === '1';
    }
    if (process.env.OMNIROUTE_ENABLED !== undefined) {
      this.switches.omniRouteEnabled = process.env.OMNIROUTE_ENABLED === 'true' || process.env.OMNIROUTE_ENABLED === '1';
    }
    if (process.env.GEMINI_ENABLED !== undefined) {
      this.switches.geminiEnabled = process.env.GEMINI_ENABLED === 'true' || process.env.GEMINI_ENABLED === '1';
    }
  }

  public static getInstance(): AiTechnologySwitchService {
    if (!AiTechnologySwitchService.instance) {
      AiTechnologySwitchService.instance = new AiTechnologySwitchService();
    }
    return AiTechnologySwitchService.instance;
  }

  public getSwitches(): TechnologySwitches {
    return { ...this.switches };
  }

  public updateSwitches(updates: Partial<TechnologySwitches>): TechnologySwitches {
    this.switches = {
      ...this.switches,
      ...updates,
      updatedAt: Date.now()
    };
    this.notifyListeners();
    return { ...this.switches };
  }

  public isEnabled(tech: 'YOLO' | 'ANPR' | 'HSRP' | 'OCR' | 'OMNIROUTE' | 'GEMINI' | 'ADVANCED_VISION'): boolean {
    switch (tech) {
      case 'YOLO':
        return this.switches.yoloEnabled;
      case 'ANPR':
        return this.switches.anprEnabled;
      case 'HSRP':
        return this.switches.hsrpEnabled;
      case 'OCR':
        return this.switches.ocrEnabled;
      case 'OMNIROUTE':
        return this.switches.omniRouteEnabled;
      case 'GEMINI':
        return this.switches.geminiEnabled;
      case 'ADVANCED_VISION':
        return this.switches.advancedVisionEnabled;
      default:
        return false;
    }
  }

  public setDeterministicBaseline(): TechnologySwitches {
    return this.updateSwitches({
      yoloEnabled: true,
      anprEnabled: true,
      hsrpEnabled: true,
      ocrEnabled: true,
      omniRouteEnabled: false,
      geminiEnabled: false,
      advancedVisionEnabled: false,
      routingMode: 'DETERMINISTIC_BASELINE'
    });
  }

  public enableOmniRouteComparison(): TechnologySwitches {
    return this.updateSwitches({
      yoloEnabled: true,
      anprEnabled: true,
      hsrpEnabled: true,
      ocrEnabled: true,
      omniRouteEnabled: true,
      geminiEnabled: false,
      advancedVisionEnabled: true,
      routingMode: 'OMNIROUTE_PREFERENCE'
    });
  }

  public enableFullAIStack(): TechnologySwitches {
    return this.updateSwitches({
      yoloEnabled: true,
      anprEnabled: true,
      hsrpEnabled: true,
      ocrEnabled: true,
      omniRouteEnabled: true,
      geminiEnabled: true,
      advancedVisionEnabled: true,
      routingMode: 'AUTO'
    });
  }

  public subscribe(listener: SwitchChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const copy = this.getSwitches();
    for (const listener of this.listeners) {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error in SwitchChangeListener:', err);
      }
    }
  }
}

export const aiTechnologySwitchService = AiTechnologySwitchService.getInstance();
