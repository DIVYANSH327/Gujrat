/**
 * GoogleMapsAdapter.ts
 * Safe Google Maps Platform & Spatial Geometry Adapter for Sentinel Grid
 * 
 * Invariants:
 * 1. Safe Initialization: Works cleanly with or without a Google Maps Platform API key.
 * 2. Real Geo Grounding: Only plots real coordinates registered in CCTV metadata or GPS logs.
 * 3. Never Invent Intermediate Waypoints: Connects verified camera nodes chronologically.
 */

export interface MapMarkerItem {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: 'online' | 'offline' | 'incident' | 'alert';
  district: string;
  cameraCount?: number;
  metadata?: Record<string, any>;
}

export interface RoutePolyline {
  targetId: string;
  points: Array<{ lat: number; lng: number; timestamp: string; cameraId: string; locationName: string }>;
  totalDistanceKm: number;
}

export class GoogleMapsAdapter {
  private isConfigured: boolean;
  private apiKey: string | null;

  constructor() {
    this.apiKey = (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_API_KEY) || null;
    this.isConfigured = Boolean(this.apiKey && this.apiKey.length > 10 && this.apiKey !== 'mock');
  }

  public getStatus() {
    return {
      provider: 'GOOGLE_MAPS_PLATFORM',
      isConfigured: this.isConfigured,
      hasApiKey: Boolean(this.apiKey)
    };
  }

  /**
   * Transforms CCTV registry camera models into normalized Map markers
   */
  public transformCamerasToMarkers(cameras: Array<{
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    status: string;
    district?: string;
  }>): MapMarkerItem[] {
    return cameras
      .filter(c => typeof c.latitude === 'number' && typeof c.longitude === 'number')
      .map(c => ({
        id: c.id,
        title: c.name,
        latitude: c.latitude!,
        longitude: c.longitude!,
        status: (c.status === 'offline' ? 'offline' : 'online') as 'online' | 'offline',
        district: c.district || 'Gujarat'
      }));
  }

  /**
   * Builds an authentic vehicle journey route based strictly on confirmed camera coordinates
   */
  public buildVerifiableRoute(
    targetId: string,
    sightings: Array<{
      cameraId: string;
      location: string;
      latitude?: number;
      longitude?: number;
      timestamp: string;
    }>
  ): RoutePolyline {
    const validPoints = sightings
      .filter(s => typeof s.latitude === 'number' && typeof s.longitude === 'number')
      .map(s => ({
        lat: s.latitude!,
        lng: s.longitude!,
        timestamp: s.timestamp,
        cameraId: s.cameraId,
        locationName: s.location
      }));

    let dist = 0;
    for (let i = 1; i < validPoints.length; i++) {
      dist += this.haversineKm(
        validPoints[i - 1].lat,
        validPoints[i - 1].lng,
        validPoints[i].lat,
        validPoints[i].lng
      );
    }

    return {
      targetId,
      points: validPoints,
      totalDistanceKm: Math.round(dist * 100) / 100
    };
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const defaultGoogleMapsAdapter = new GoogleMapsAdapter();
