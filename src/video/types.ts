export type DemoVideoSourceType = 'YOUTUBE_LIVE' | 'YOUTUBE_DEMO';

export type DemoVideoStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';

export interface DemoVideoSource {
  id: string;
  name: string;
  youtubeVideoId: string;
  district: string;
  locationLabel: string;
  sourceType: DemoVideoSourceType;
  status: DemoVideoStatus;
  department?: string;
  description?: string;
  channelNumber?: number;
  tags?: string[];
  lastChecked?: string;
}

export interface YouTubePlayerConfig {
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
  rel?: boolean;
  loop?: boolean;
}
