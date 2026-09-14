import { 
  CameraIntelligenceProfile, 
  CameraClass, 
  PreferredDetector, 
  ProcessingPriority, 
  FrameQualityRating 
} from '../types';
import { aiTechnologySwitchService } from './AiTechnologySwitchService';

export interface RoutingDecision {
  eligible: boolean;
  activeDetector: PreferredDetector;
  processingPriority: ProcessingPriority;
  supportsANPR: boolean;
  supportsHSRP: boolean;
  supportsAdvancedVision: boolean;
  reason?: string;
  suggestedAction: 'RUN_ANPR_PIPELINE' | 'RUN_YOLO_PIPELINE' | 'RUN_ADVANCED_VISION' | 'SKIP_PROCESSING';
}

export type ProfileChangeListener = (profiles: CameraIntelligenceProfile[]) => void;

export class CameraIntelligenceProfileService {
  private static instance: CameraIntelligenceProfileService;
  private profiles: Map<string, CameraIntelligenceProfile> = new Map();
  private listeners: Set<ProfileChangeListener> = new Set();

  private constructor() {
    this.seedDefaultProfiles();
  }

  public static getInstance(): CameraIntelligenceProfileService {
    if (!CameraIntelligenceProfileService.instance) {
      CameraIntelligenceProfileService.instance = new CameraIntelligenceProfileService();
    }
    return CameraIntelligenceProfileService.instance;
  }

  /**
   * Seed camera intelligence profiles for known junction and highway nodes.
   * Do not assume any camera is AI-capable without explicit capability assignment.
   */
  private seedDefaultProfiles(): void {
    const defaultProfiles: CameraIntelligenceProfile[] = [
      // ANPR Specialized Node
      {
        cameraId: 'CAM-007',
        cameraName: 'SG Highway Junction North',
        status: 'ONLINE',
        cameraClass: 'ANPR',
        resolution: '3840x2160 (4K)',
        fps: 30,
        supportsANPR: true,
        supportsHSRP: true,
        supportsAdvancedVision: true,
        aiEnabled: true,
        preferredDetector: 'ANPR',
        processingPriority: 'P1',
        district: 'Ahmedabad',
        location: 'SG Highway Corridor • Pakwan Cross',
        edgeNodeId: 'EDGE-GJ-001',
        activeDetector: 'ANPR',
        frameQuality: 'HIGH',
        lastFrameTimestamp: Date.now(),
        lastFrameAge: 250,
        notes: 'Dedicated high-speed ANPR optical zoom lane camera with retro-reflective plate calibration.'
      },
      // ANPR City Transit Node
      {
        cameraId: 'CAM-014',
        cameraName: 'Ashram Road Transit Hub',
        status: 'ONLINE',
        cameraClass: 'ANPR',
        resolution: '1920x1080 (FHD)',
        fps: 25,
        supportsANPR: true,
        supportsHSRP: true,
        supportsAdvancedVision: true,
        aiEnabled: true,
        preferredDetector: 'ANPR',
        processingPriority: 'P1',
        district: 'Ahmedabad',
        location: 'Ashram Road • Usmanpura Cross',
        edgeNodeId: 'EDGE-GJ-001',
        activeDetector: 'ANPR',
        frameQuality: 'HIGH',
        lastFrameTimestamp: Date.now(),
        lastFrameAge: 420,
        notes: 'Multi-lane ANPR intersection sensor with synchronized IR strobe.'
      },
      // AI-Smart Traffic & Crowd Node
      {
        cameraId: 'CAM-023',
        cameraName: 'Sindhu Bhavan Toll Plaza',
        status: 'ONLINE',
        cameraClass: 'AI_SMART',
        resolution: '1920x1080 (FHD)',
        fps: 25,
        supportsANPR: false,
        supportsHSRP: false,
        supportsAdvancedVision: true,
        aiEnabled: true,
        preferredDetector: 'YOLO',
        processingPriority: 'P2',
        district: 'Ahmedabad',
        location: 'Sindhu Bhavan Road • Toll Gates',
        edgeNodeId: 'EDGE-GJ-001',
        activeDetector: 'YOLO',
        frameQuality: 'MEDIUM',
        lastFrameTimestamp: Date.now() - 3000,
        lastFrameAge: 3000,
        notes: 'Wide-angle contextual AI sensor for congestion & helmet/seatbelt behavioral analysis.'
      },
      // AI-Smart High-Speed Interchange Node
      {
        cameraId: 'CAM-031',
        cameraName: 'Ring Road Express Interchange',
        status: 'ONLINE',
        cameraClass: 'AI_SMART',
        resolution: '2560x1440 (2K)',
        fps: 30,
        supportsANPR: true,
        supportsHSRP: true,
        supportsAdvancedVision: true,
        aiEnabled: true,
        preferredDetector: 'ANPR',
        processingPriority: 'P1',
        district: 'Ahmedabad',
        location: 'Sardar Patel Ring Road • Bopal Flyover',
        edgeNodeId: 'EDGE-GJ-001',
        activeDetector: 'ANPR',
        frameQuality: 'HIGH',
        lastFrameTimestamp: Date.now() - 500,
        lastFrameAge: 500,
        notes: 'Dual-capability speed enforcement and optical plate acquisition unit.'
      },
      // Normal CCTV Node (Lightweight YOLO only)
      {
        cameraId: 'CAM-042',
        cameraName: 'Surat Textile Market Gate 1',
        status: 'ONLINE',
        cameraClass: 'NORMAL',
        resolution: '1920x1080 (FHD)',
        fps: 15,
        supportsANPR: false,
        supportsHSRP: false,
        supportsAdvancedVision: false,
        aiEnabled: true,
        preferredDetector: 'YOLO',
        processingPriority: 'P3',
        district: 'Surat',
        location: 'Ring Road • Textile Market Hub',
        edgeNodeId: 'EDGE-GJ-002',
        activeDetector: 'YOLO',
        frameQuality: 'MEDIUM',
        lastFrameTimestamp: Date.now() - 1200,
        lastFrameAge: 1200,
        notes: 'Standard overview fixed dome; filtered to lightweight YOLO vehicle/person counts.'
      },
      // Offline Node
      {
        cameraId: 'CAM-048',
        cameraName: 'Vadodara Alkapuri Circle',
        status: 'OFFLINE',
        cameraClass: 'OFFLINE',
        resolution: '1280x720 (HD)',
        fps: 0,
        supportsANPR: false,
        supportsHSRP: false,
        supportsAdvancedVision: false,
        aiEnabled: false,
        preferredDetector: 'NONE',
        processingPriority: 'P4',
        district: 'Vadodara',
        location: 'Alkapuri • Station Circle',
        edgeNodeId: 'EDGE-GJ-003',
        activeDetector: 'NONE',
        frameQuality: 'INSUFFICIENT',
        lastFrameTimestamp: Date.now() - 1000 * 60 * 45,
        lastFrameAge: 1000 * 60 * 45,
        notes: 'Power/Switch failure reported. AI processing suspended per safety policy.'
      },
      // Sentinel Canonical Nodes
      {
        cameraId: 'cam01',
        cameraName: 'Sentinel Road Node 01 (SG Highway)',
        status: 'ONLINE',
        cameraClass: 'ANPR',
        resolution: '1920x1080 (FHD)',
        fps: 30,
        supportsANPR: true,
        supportsHSRP: true,
        supportsAdvancedVision: true,
        aiEnabled: true,
        preferredDetector: 'ANPR',
        processingPriority: 'P1',
        district: 'Ahmedabad',
        location: 'SG Highway Section 01',
        edgeNodeId: 'EDGE-SENTINEL-01',
        activeDetector: 'ANPR',
        frameQuality: 'HIGH',
        lastFrameTimestamp: Date.now(),
        lastFrameAge: 180,
        notes: 'Primary real road test camera node for HSRP and ANPR verification.'
      },
      {
        cameraId: 'cam12',
        cameraName: 'Sentinel Road Node 12 (Express Corridor)',
        status: 'ONLINE',
        cameraClass: 'ANPR',
        resolution: '1920x1080 (FHD)',
        fps: 30,
        supportsANPR: true,
        supportsHSRP: true,
        supportsAdvancedVision: true,
        aiEnabled: true,
        preferredDetector: 'ANPR',
        processingPriority: 'P1',
        district: 'Ahmedabad',
        location: 'Ahmedabad - Vadodara Expressway Entry',
        edgeNodeId: 'EDGE-SENTINEL-02',
        activeDetector: 'ANPR',
        frameQuality: 'HIGH',
        lastFrameTimestamp: Date.now(),
        lastFrameAge: 150,
        notes: 'Toll plaza high-speed ANPR and HSRP optical sensor.'
      }
    ];

    // Populate the internal map
    for (const p of defaultProfiles) {
      this.profiles.set(p.cameraId, p);
    }
  }

  /**
   * Retrieves an intelligence profile for a specific camera ID.
   * If not found, initializes a defensive default profile (UNKNOWN class).
   */
  public getProfile(cameraId: string): CameraIntelligenceProfile {
    const existing = this.profiles.get(cameraId);
    if (existing) {
      return { ...existing };
    }

    // Defensive fallback: Never assume AI capabilities
    const fallbackProfile: CameraIntelligenceProfile = {
      cameraId,
      cameraName: `Camera ${cameraId}`,
      status: 'ONLINE',
      cameraClass: 'UNKNOWN',
      resolution: '1920x1080',
      fps: 15,
      supportsANPR: false,
      supportsHSRP: false,
      supportsAdvancedVision: false,
      aiEnabled: true,
      preferredDetector: 'YOLO',
      processingPriority: 'P3',
      frameQuality: 'MEDIUM',
      notes: 'Auto-registered node profile with defensive capability defaults.'
    };

    this.profiles.set(cameraId, fallbackProfile);
    this.notifyListeners();
    return { ...fallbackProfile };
  }

  /**
   * Returns all registered camera intelligence profiles.
   */
  public getAllProfiles(): CameraIntelligenceProfile[] {
    return Array.from(this.profiles.values()).map(p => ({ ...p }));
  }

  /**
   * Returns profiles filtered by camera class.
   */
  public getProfilesByClass(cameraClass: CameraClass): CameraIntelligenceProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => p.cameraClass === cameraClass)
      .map(p => ({ ...p }));
  }

  /**
   * Returns profiles filtered by processing priority.
   */
  public getProfilesByPriority(priority: ProcessingPriority): CameraIntelligenceProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => p.processingPriority === priority)
      .map(p => ({ ...p }));
  }

  /**
   * Updates an existing profile or creates a new entry.
   */
  public updateProfile(
    cameraId: string, 
    updates: Partial<CameraIntelligenceProfile>
  ): CameraIntelligenceProfile {
    const current = this.getProfile(cameraId);
    const updated: CameraIntelligenceProfile = {
      ...current,
      ...updates,
      cameraId // maintain immutable ID
    };

    // Keep cameraClass consistent with status if explicitly marked OFFLINE
    if (updated.status === 'OFFLINE') {
      updated.cameraClass = 'OFFLINE';
      updated.preferredDetector = 'NONE';
      updated.processingPriority = 'P4';
      updated.aiEnabled = false;
    }

    this.profiles.set(cameraId, updated);
    this.notifyListeners();
    return { ...updated };
  }

  /**
   * Toggle AI processing for a specific camera.
   */
  public setAiEnabled(cameraId: string, aiEnabled: boolean): CameraIntelligenceProfile {
    return this.updateProfile(cameraId, { aiEnabled });
  }

  /**
   * Set preferred detector for a specific camera.
   */
  public setPreferredDetector(
    cameraId: string, 
    preferredDetector: PreferredDetector
  ): CameraIntelligenceProfile {
    return this.updateProfile(cameraId, { preferredDetector });
  }

  /**
   * Update real-time frame telemetry and frame quality score.
   */
  public updateFrameTelemetry(
    cameraId: string,
    telemetry: {
      lastFrameTimestamp?: number | string;
      lastFrameAge?: number;
      frameQuality?: FrameQualityRating | number;
      status?: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'BUFFERING' | 'STALE';
    }
  ): CameraIntelligenceProfile {
    return this.updateProfile(cameraId, telemetry);
  }

  /**
   * Camera-Aware AI Routing Decision Engine (Sections 3 & 5)
   * Evaluates camera health, capability profile, quality gate, and task requirement.
   */
  public evaluateRoutingDecision(
    cameraId: string,
    requestedTask?: 'ANPR' | 'HSRP' | 'VEHICLE_YOLO' | 'ADVANCED_VISION' | 'AUTO',
    systemLoad?: 'NORMAL' | 'HIGH' | 'CRITICAL'
  ): RoutingDecision {
    const profile = this.getProfile(cameraId);

    // 1. Camera Online / Offline & Stale Gate
    if (profile.status === 'OFFLINE' || profile.cameraClass === 'OFFLINE') {
      return {
        eligible: false,
        activeDetector: 'NONE',
        processingPriority: 'P4',
        supportsANPR: false,
        supportsHSRP: false,
        supportsAdvancedVision: false,
        reason: 'CAMERA_OFFLINE',
        suggestedAction: 'SKIP_PROCESSING'
      };
    }

    // 2. Operator AI Disabled Gate
    if (!profile.aiEnabled) {
      return {
        eligible: false,
        activeDetector: 'NONE',
        processingPriority: profile.processingPriority,
        supportsANPR: profile.supportsANPR,
        supportsHSRP: profile.supportsHSRP,
        supportsAdvancedVision: profile.supportsAdvancedVision,
        reason: 'AI_DISABLED_BY_OPERATOR',
        suggestedAction: 'SKIP_PROCESSING'
      };
    }

    // 3. Image Quality Gate
    if (profile.frameQuality === 'INSUFFICIENT' || profile.status === 'DEGRADED') {
      return {
        eligible: false,
        activeDetector: 'NONE',
        processingPriority: 'P4',
        supportsANPR: profile.supportsANPR,
        supportsHSRP: profile.supportsHSRP,
        supportsAdvancedVision: profile.supportsAdvancedVision,
        reason: 'IMAGE_QUALITY_INSUFFICIENT',
        suggestedAction: 'SKIP_PROCESSING'
      };
    }

    // 4. Stale Frame Threshold Gate (> 15 seconds without fresh frame)
    if (profile.lastFrameAge && profile.lastFrameAge > 15000) {
      return {
        eligible: false,
        activeDetector: 'NONE',
        processingPriority: 'P4',
        supportsANPR: profile.supportsANPR,
        supportsHSRP: profile.supportsHSRP,
        supportsAdvancedVision: profile.supportsAdvancedVision,
        reason: 'CAMERA_FRAME_UNAVAILABLE',
        suggestedAction: 'SKIP_PROCESSING'
      };
    }

    const task = requestedTask || 'AUTO';
    const switches = aiTechnologySwitchService.getSwitches();

    // 5. Global Technology Switch Gate
    if (task === 'VEHICLE_YOLO' && !switches.yoloEnabled) {
      return {
        eligible: false,
        activeDetector: 'NONE',
        processingPriority: profile.processingPriority,
        supportsANPR: profile.supportsANPR,
        supportsHSRP: profile.supportsHSRP,
        supportsAdvancedVision: profile.supportsAdvancedVision,
        reason: 'YOLO_DISABLED_BY_SWITCH',
        suggestedAction: 'SKIP_PROCESSING'
      };
    }

    if (task === 'ANPR' && !switches.anprEnabled) {
      return {
        eligible: false,
        activeDetector: 'NONE',
        processingPriority: profile.processingPriority,
        supportsANPR: false,
        supportsHSRP: profile.supportsHSRP,
        supportsAdvancedVision: profile.supportsAdvancedVision,
        reason: 'ANPR_DISABLED_BY_SWITCH',
        suggestedAction: 'SKIP_PROCESSING'
      };
    }

    if (task === 'HSRP' && !switches.hsrpEnabled) {
      return {
        eligible: false,
        activeDetector: 'NONE',
        processingPriority: profile.processingPriority,
        supportsANPR: profile.supportsANPR,
        supportsHSRP: false,
        supportsAdvancedVision: profile.supportsAdvancedVision,
        reason: 'HSRP_DISABLED_BY_SWITCH',
        suggestedAction: 'SKIP_PROCESSING'
      };
    }

    // 6. Capability Match Routing
    if (task === 'ANPR' || (task === 'AUTO' && profile.cameraClass === 'ANPR')) {
      if (profile.supportsANPR && switches.anprEnabled) {
        return {
          eligible: true,
          activeDetector: 'ANPR',
          processingPriority: 'P1',
          supportsANPR: true,
          supportsHSRP: profile.supportsHSRP && switches.hsrpEnabled,
          supportsAdvancedVision: profile.supportsAdvancedVision && switches.advancedVisionEnabled,
          suggestedAction: 'RUN_ANPR_PIPELINE'
        };
      } else if (switches.yoloEnabled) {
        // Fallback to YOLO if ANPR not supported or disabled
        return {
          eligible: true,
          activeDetector: 'YOLO',
          processingPriority: 'P3',
          supportsANPR: false,
          supportsHSRP: false,
          supportsAdvancedVision: profile.supportsAdvancedVision && switches.advancedVisionEnabled,
          reason: !profile.supportsANPR ? 'ANPR_UNSUPPORTED_FALLBACK_YOLO' : 'ANPR_DISABLED_FALLBACK_YOLO',
          suggestedAction: 'RUN_YOLO_PIPELINE'
        };
      } else {
        return {
          eligible: false,
          activeDetector: 'NONE',
          processingPriority: 'P4',
          supportsANPR: false,
          supportsHSRP: false,
          supportsAdvancedVision: false,
          reason: 'ALL_DETECTORS_DISABLED',
          suggestedAction: 'SKIP_PROCESSING'
        };
      }
    }

    if (task === 'HSRP') {
      if (profile.supportsHSRP && profile.supportsANPR) {
        return {
          eligible: true,
          activeDetector: 'ANPR',
          processingPriority: 'P1',
          supportsANPR: true,
          supportsHSRP: true,
          supportsAdvancedVision: profile.supportsAdvancedVision,
          suggestedAction: 'RUN_ANPR_PIPELINE'
        };
      } else {
        return {
          eligible: false,
          activeDetector: 'NONE',
          processingPriority: profile.processingPriority,
          supportsANPR: profile.supportsANPR,
          supportsHSRP: false,
          supportsAdvancedVision: profile.supportsAdvancedVision,
          reason: 'HSRP_NOT_SUPPORTED_ON_CAMERA',
          suggestedAction: 'SKIP_PROCESSING'
        };
      }
    }

    if (task === 'ADVANCED_VISION') {
      if (profile.supportsAdvancedVision && systemLoad !== 'CRITICAL') {
        return {
          eligible: true,
          activeDetector: 'ADVANCED_VISION',
          processingPriority: 'P2',
          supportsANPR: profile.supportsANPR,
          supportsHSRP: profile.supportsHSRP,
          supportsAdvancedVision: true,
          suggestedAction: 'RUN_ADVANCED_VISION'
        };
      } else {
        return {
          eligible: true,
          activeDetector: 'YOLO',
          processingPriority: 'P3',
          supportsANPR: profile.supportsANPR,
          supportsHSRP: profile.supportsHSRP,
          supportsAdvancedVision: profile.supportsAdvancedVision,
          reason: systemLoad === 'CRITICAL' ? 'LOAD_SHED_TO_YOLO' : 'ADVANCED_VISION_UNSUPPORTED_FALLBACK_YOLO',
          suggestedAction: 'RUN_YOLO_PIPELINE'
        };
      }
    }

    // Default YOLO for AI_SMART and NORMAL cameras
    return {
      eligible: true,
      activeDetector: profile.preferredDetector !== 'NONE' ? profile.preferredDetector : 'YOLO',
      processingPriority: profile.processingPriority,
      supportsANPR: profile.supportsANPR,
      supportsHSRP: profile.supportsHSRP,
      supportsAdvancedVision: profile.supportsAdvancedVision,
      suggestedAction: profile.preferredDetector === 'ANPR' && profile.supportsANPR 
        ? 'RUN_ANPR_PIPELINE' 
        : 'RUN_YOLO_PIPELINE'
    };
  }

  /**
   * Reset profiles to initial baseline seed data.
   */
  public resetToDefaults(): void {
    this.profiles.clear();
    this.seedDefaultProfiles();
    this.notifyListeners();
  }

  public subscribe(listener: ProfileChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const list = this.getAllProfiles();
    for (const listener of this.listeners) {
      try {
        listener(list);
      } catch (e) {
        console.error('Error in CameraIntelligenceProfile listener:', e);
      }
    }
  }
}

export const cameraIntelligenceProfileService = CameraIntelligenceProfileService.getInstance();
