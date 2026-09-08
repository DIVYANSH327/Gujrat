import { DemoVideoStatus, YouTubePlayerConfig } from '../video/types';

export interface YouTubeDemoCamera {
  id: string;
  videoId: string;
  youtubeVideoId: string;
  name: string;
  locationLabel: string;
  district?: string;
  description?: string;
  sourceType: 'YOUTUBE' | 'YOUTUBE_DEMO' | 'YOUTUBE LIVESTREAM';
  demoOnly: true;
  status: DemoVideoStatus;
  integrationType: 'YOUTUBE EMBED';
  isPoliceCctv: false;
  isDvrNvr: false;
  isEdgeAgent: false;
  department?: string;
  channelNumber?: number;
  tags?: string[];
  lastChecked?: string;
}

/**
 * Validates a YouTube video ID format.
 * Standard YouTube video IDs are strictly 11 alphanumeric characters, dashes, or underscores.
 * Any full URLs, non-alphanumeric characters, or malformed strings are rejected.
 */
export function isValidYouTubeVideoId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
  return YOUTUBE_ID_REGEX.test(trimmed);
}

/**
 * Helper to extract 11-character video ID from a YouTube URL or direct video ID.
 * Supports /live/, watch?v=, youtu.be/, and raw IDs.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (isValidYouTubeVideoId(trimmed)) {
    return trimmed;
  }
  
  // Try matching live or watch or short URLs
  const liveMatch = trimmed.match(/(?:youtube\.com\/live\/|youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (liveMatch && liveMatch[1]) {
    return liveMatch[1];
  }

  return null;
}

/**
 * Generates the standard YouTube embed URL from a video ID.
 * Standard format: https://www.youtube.com/embed/${videoId}
 * Rejects invalid IDs to prevent injection or malformed iframe loading.
 */
export function getYouTubeEmbedUrl(videoId: string, _config: YouTubePlayerConfig = {}): string {
  if (!isValidYouTubeVideoId(videoId)) {
    return '';
  }

  return `https://www.youtube.com/embed/${encodeURIComponent(videoId.trim())}`;
}

/**
 * Generates the direct public YouTube watch URL for manual verification.
 */
export function getYouTubeWatchUrl(videoId: string): string {
  if (!isValidYouTubeVideoId(videoId)) {
    return 'https://www.youtube.com';
  }
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId.trim())}`;
}

/**
 * Deduplicates raw list of YouTube video URLs/IDs into unique demo sources.
 */
export function deduplicateYouTubeSources(
  rawInputs: string[]
): { videoId: string; rawInput: string }[] {
  const seen = new Set<string>();
  const deduplicated: { videoId: string; rawInput: string }[] = [];

  for (const input of rawInputs) {
    const videoId = extractYouTubeVideoId(input);
    if (videoId && !seen.has(videoId)) {
      seen.add(videoId);
      deduplicated.push({ videoId, rawInput: input });
    }
  }

  return deduplicated;
}

/**
 * Raw input URLs from specification:
 * 1. https://www.youtube.com/live/QhFYcPBmkcI?si=hHz5GvVAvBnX0W2k
 * 2. https://www.youtube.com/live/hXqjUfQJf9U?si=cb9ctD5w7qIwdA7X
 * 3. https://www.youtube.com/live/QhFYcPBmkcI?si=eqzVrQLJ2U3kjScU (Duplicate of #1)
 * 4. https://www.youtube.com/live/zMCea32gpmg?si=LUDk0JF-1T-_B0Dg
 * 5. https://www.youtube.com/live/sTF-6_xinUU?si=s0vqkx852aY_Ro0C
 * 
 * Resulting 4 Unique Sources:
 * YT-DEMO-001 -> QhFYcPBmkcI
 * YT-DEMO-002 -> hXqjUfQJf9U
 * YT-DEMO-003 -> zMCea32gpmg
 * YT-DEMO-004 -> sTF-6_xinUU
 */
export const DEFAULT_YOUTUBE_DEMO_CAMERAS: YouTubeDemoCamera[] = [
  {
    id: 'YT-DEMO-001',
    videoId: 'QhFYcPBmkcI',
    youtubeVideoId: 'QhFYcPBmkcI',
    name: 'YouTube Demo 01',
    locationLabel: 'Public Livestream 01',
    district: 'Public Stream',
    sourceType: 'YOUTUBE',
    demoOnly: true,
    status: 'AVAILABLE',
    integrationType: 'YOUTUBE EMBED',
    isPoliceCctv: false,
    isDvrNvr: false,
    isEdgeAgent: false,
    department: 'Demo Presentation',
    description: 'Public YouTube livestream demonstration source 01. Not connected to police CCTV or Edge Agent.',
    channelNumber: 1,
    tags: ['DEMO_ONLY', 'PUBLIC_LIVESTREAM', 'YOUTUBE']
  },
  {
    id: 'YT-DEMO-002',
    videoId: 'hXqjUfQJf9U',
    youtubeVideoId: 'hXqjUfQJf9U',
    name: 'YouTube Demo 02',
    locationLabel: 'Public Livestream 02',
    district: 'Public Stream',
    sourceType: 'YOUTUBE',
    demoOnly: true,
    status: 'AVAILABLE',
    integrationType: 'YOUTUBE EMBED',
    isPoliceCctv: false,
    isDvrNvr: false,
    isEdgeAgent: false,
    department: 'Demo Presentation',
    description: 'Public YouTube livestream demonstration source 02. Not connected to police CCTV or Edge Agent.',
    channelNumber: 2,
    tags: ['DEMO_ONLY', 'PUBLIC_LIVESTREAM', 'YOUTUBE']
  },
  {
    id: 'YT-DEMO-003',
    videoId: 'zMCea32gpmg',
    youtubeVideoId: 'zMCea32gpmg',
    name: 'YouTube Demo 03',
    locationLabel: 'Public Livestream 03',
    district: 'Public Stream',
    sourceType: 'YOUTUBE',
    demoOnly: true,
    status: 'AVAILABLE',
    integrationType: 'YOUTUBE EMBED',
    isPoliceCctv: false,
    isDvrNvr: false,
    isEdgeAgent: false,
    department: 'Demo Presentation',
    description: 'Public YouTube livestream demonstration source 03. Not connected to police CCTV or Edge Agent.',
    channelNumber: 3,
    tags: ['DEMO_ONLY', 'PUBLIC_LIVESTREAM', 'YOUTUBE']
  },
  {
    id: 'YT-DEMO-004',
    videoId: 'sTF-6_xinUU',
    youtubeVideoId: 'sTF-6_xinUU',
    name: 'YouTube Demo 04',
    locationLabel: 'Public Livestream 04',
    district: 'Public Stream',
    sourceType: 'YOUTUBE',
    demoOnly: true,
    status: 'AVAILABLE',
    integrationType: 'YOUTUBE EMBED',
    isPoliceCctv: false,
    isDvrNvr: false,
    isEdgeAgent: false,
    department: 'Demo Presentation',
    description: 'Public YouTube livestream demonstration source 04. Not connected to police CCTV or Edge Agent.',
    channelNumber: 4,
    tags: ['DEMO_ONLY', 'PUBLIC_LIVESTREAM', 'YOUTUBE']
  }
];

class YouTubeDemoRegistry {
  private sources: Map<string, YouTubeDemoCamera> = new Map();

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.sources.clear();
    DEFAULT_YOUTUBE_DEMO_CAMERAS.forEach((source) => {
      this.sources.set(source.id, { ...source });
    });
  }

  public listSources(): YouTubeDemoCamera[] {
    return Array.from(this.sources.values());
  }

  public getSource(id: string): YouTubeDemoCamera | undefined {
    return this.sources.get(id);
  }

  /**
   * Registers a source with deduplication validation.
   * If a source with the exact same YouTube video ID already exists,
   * returns the existing source instead of creating a duplicate entry.
   */
  public registerSource(source: YouTubeDemoCamera): { registered: YouTubeDemoCamera; isDuplicate: boolean } {
    const videoId = source.videoId || source.youtubeVideoId;
    if (!isValidYouTubeVideoId(videoId)) {
      throw new Error(`Invalid YouTube Video ID: ${videoId}`);
    }

    // Check for existing source with same video ID (deduplication)
    for (const existing of this.sources.values()) {
      if (existing.videoId === videoId || existing.youtubeVideoId === videoId) {
        return { registered: existing, isDuplicate: true };
      }
    }

    const newSource: YouTubeDemoCamera = {
      ...source,
      videoId: videoId.trim(),
      youtubeVideoId: videoId.trim(),
      sourceType: 'YOUTUBE',
      demoOnly: true,
      integrationType: 'YOUTUBE EMBED',
      isPoliceCctv: false,
      isDvrNvr: false,
      isEdgeAgent: false,
      lastChecked: new Date().toISOString()
    };
    this.sources.set(source.id, newSource);
    return { registered: newSource, isDuplicate: false };
  }

  public updateVideoId(id: string, newVideoId: string): boolean {
    const existing = this.sources.get(id);
    if (!existing) return false;
    if (!isValidYouTubeVideoId(newVideoId)) {
      throw new Error(`Invalid YouTube Video ID: ${newVideoId}`);
    }
    const cleanId = newVideoId.trim();
    this.sources.set(id, {
      ...existing,
      videoId: cleanId,
      youtubeVideoId: cleanId,
      status: 'AVAILABLE',
      lastChecked: new Date().toISOString()
    });
    return true;
  }

  public getSourcesCount(): number {
    return this.sources.size;
  }
}

export const youtubeDemoService = new YouTubeDemoRegistry();

