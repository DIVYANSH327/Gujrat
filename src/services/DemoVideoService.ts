import { DemoVideoSource, DemoVideoStatus, YouTubePlayerConfig } from '../video/types';

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
 * Curated Deterministic YouTube Live Stream Demonstration Sources for Hackathon Demonstration.
 * Used exclusively for presentation layer visualization in the Command Center.
 * 
 * NOTE: YouTube is strictly a demonstration presentation layer and is NOT connected
 * to the Edge Agent or physical DVR/NVR hardware.
 */
export const DEFAULT_DEMO_VIDEO_SOURCES: DemoVideoSource[] = [
  {
    id: 'YT-DEMO-001',
    name: 'YouTube Demo 01',
    youtubeVideoId: 'QhFYcPBmkcI',
    district: 'Public Stream',
    locationLabel: 'Public Livestream 01',
    sourceType: 'YOUTUBE_DEMO',
    status: 'AVAILABLE',
    department: 'Demo Presentation',
    description: 'Demonstration video feed 01. Not connected to police CCTV or Edge Agent.',
    channelNumber: 1,
    tags: ['DEMO_ONLY', 'PUBLIC_LIVESTREAM', 'YOUTUBE']
  },
  {
    id: 'YT-DEMO-002',
    name: 'YouTube Demo 02',
    youtubeVideoId: 'hXqjUfQJf9U',
    district: 'Public Stream',
    locationLabel: 'Public Livestream 02',
    sourceType: 'YOUTUBE_DEMO',
    status: 'AVAILABLE',
    department: 'Demo Presentation',
    description: 'Demonstration video feed 02. Not connected to police CCTV or Edge Agent.',
    channelNumber: 2,
    tags: ['DEMO_ONLY', 'PUBLIC_LIVESTREAM', 'YOUTUBE']
  },
  {
    id: 'YT-DEMO-003',
    name: 'YouTube Demo 03',
    youtubeVideoId: 'zMCea32gpmg',
    district: 'Public Stream',
    locationLabel: 'Public Livestream 03',
    sourceType: 'YOUTUBE_DEMO',
    status: 'AVAILABLE',
    department: 'Demo Presentation',
    description: 'Demonstration video feed 03. Not connected to police CCTV or Edge Agent.',
    channelNumber: 3,
    tags: ['DEMO_ONLY', 'PUBLIC_LIVESTREAM', 'YOUTUBE']
  },
  {
    id: 'YT-DEMO-004',
    name: 'YouTube Demo 04',
    youtubeVideoId: 'sTF-6_xinUU',
    district: 'Public Stream',
    locationLabel: 'Public Livestream 04',
    sourceType: 'YOUTUBE_DEMO',
    status: 'AVAILABLE',
    department: 'Demo Presentation',
    description: 'Demonstration video feed 04. Not connected to police CCTV or Edge Agent.',
    channelNumber: 4,
    tags: ['DEMO_ONLY', 'PUBLIC_LIVESTREAM', 'YOUTUBE']
  }
];

export class DemoVideoService {
  private sources: Map<string, DemoVideoSource> = new Map();

  constructor(initialSources: DemoVideoSource[] = DEFAULT_DEMO_VIDEO_SOURCES) {
    this.init(initialSources);
  }

  private init(sourcesList: DemoVideoSource[]) {
    this.sources.clear();
    for (const src of sourcesList) {
      this.sources.set(src.id, { ...src });
    }
  }

  public listSources(): DemoVideoSource[] {
    return Array.from(this.sources.values());
  }

  public getSource(id: string): DemoVideoSource | undefined {
    return this.sources.get(id);
  }

  public registerSource(source: DemoVideoSource): { success: boolean; error?: string } {
    if (!source.id || typeof source.id !== 'string') {
      return { success: false, error: 'Source ID is required.' };
    }
    if (!isValidYouTubeVideoId(source.youtubeVideoId)) {
      return { 
        success: false, 
        error: `Invalid YouTube Video ID "${source.youtubeVideoId}". Must be an 11-character alphanumeric identifier.` 
      };
    }

    this.sources.set(source.id, {
      ...source,
      sourceType: 'YOUTUBE_LIVE',
      status: source.status || 'AVAILABLE'
    });
    return { success: true };
  }

  public updateSourceStatus(id: string, status: DemoVideoStatus): boolean {
    const existing = this.sources.get(id);
    if (!existing) return false;
    existing.status = status;
    existing.lastChecked = new Date().toISOString();
    return true;
  }

  public resetToDefaults(): void {
    this.init(DEFAULT_DEMO_VIDEO_SOURCES);
  }
}

export const demoVideoService = new DemoVideoService();
