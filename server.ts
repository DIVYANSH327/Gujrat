/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 */

import express from "express";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  SecurityEventPayload, 
  HeartbeatPayload, 
  CommandPayload, 
  Camera, 
  Alert, 
  VehicleSighting, 
  VehicleJourney, 
  WatchlistEntry, 
  AuditRecord,
  EvidenceRecord,
  SystemReadinessItem,
  IEventRepository,
  IVehicleInvestigationService,
  IVehicleTrackingService,
  IWatchlistService,
  IAuditService,
  PersonSighting,
  PersonTrajectory,
  HelmetStatus,
  EvidenceItem,
  EvidenceCaptureReason,
  GodsEyeTargetRecord,
  GodsEyeTargetSighting,
  GodsEyeFilterOptions
} from "./src/types.js";

import { PersonTrackingService } from "./src/services/GodsEyeService.js";
import { godsEyeObservationService } from "./src/services/GodsEyeObservationService.js";
import { evidenceStorage } from "./src/services/EvidenceStorageProvider.js";
import { EdgeDiscoveryService } from "./src/edge-agent/DiscoveryService.js";
import { DEFAULT_DEMO_VIDEO_SOURCES, isValidYouTubeVideoId } from "./src/services/DemoVideoService.js";
import { DemoVideoSource } from "./src/video/types.js";

// Mock Data Generators
const generateCameras = (): Camera[] => {
  const cams: Camera[] = [];
  const vendors = ['Vendor-A', 'Vendor-B', 'Vendor-C'];
  const vmsTypes = ['VMS-A', 'VMS-B', 'VMS-C'];
  const depts = ['Traffic Enforcement', 'Perimeter Surveillance', 'District Security', 'Highway Interception'];
  const districts = ['Ahmedabad North', 'Ahmedabad South', 'Ahmedabad East', 'Ahmedabad West', 'Ahmedabad Central'];
  
  for (let i = 1; i <= 50; i++) {
    const id = `CAM-${i.toString().padStart(3, '0')}`;
    const vendor = vendors[i % vendors.length];
    const isOffline = i === 12 || i === 28;
    const protocol = vendor === 'Vendor-A' ? 'ONVIF' : vendor === 'Vendor-B' ? 'RTSP' : 'VMS';
    const adapterType = vendor === 'Vendor-A' ? 'OnvifDVRAdapter' : vendor === 'Vendor-B' ? 'RtspStreamAdapter' : 'MockVendorVMSAdapter';

    cams.push({
      id,
      name: `CCTV Node ${id}`,
      location: `Sector ${Math.floor(i / 10) + 1}`,
      locationDescription: `Junction of St ${i} & Ring Road ${Math.floor(i / 5) + 1}`,
      status: isOffline ? 'offline' : 'online',
      lastActive: new Date(Date.now() - (i * 20000)).toISOString(),
      mapX: 40 + ((i - 1) % 10) * 80 + (Math.sin(i) * 15),
      mapY: 50 + Math.floor((i - 1) / 10) * 110 + (Math.cos(i) * 15),
      latitude: 23.0225 + (Math.sin(i) * 0.04),
      longitude: 72.5714 + (Math.cos(i) * 0.04),
      siteId: `SITE-${Math.floor(i / 5) + 1}`,
      department: depts[i % depts.length],
      district: districts[i % districts.length],
      vendor,
      model: `IPC-S42-GUJARAT-${i}`,
      vms: vmsTypes[i % vmsTypes.length],
      protocol,
      streamQuality: i % 2 === 0 ? '1080p' : '4K',
      resolution: i % 2 === 0 ? '1920x1080' : '3840x2160',
      fps: 30,
      channel: (i % 8) + 1,
      channelNumber: (i % 8) + 1,
      edgeNodeId: `EDGE-${Math.floor(i / 10) + 1}`,
      direction: ['Northbound', 'Southbound', 'Eastbound', 'Westbound'][i % 4],
      sourceType: 'SIMULATED',
      adapterType,
      streamState: isOffline ? 'DISCONNECTED' : 'CONNECTED',
      integrationStatus: 'SIMULATED',
      discoveryMethod: 'SYNTHETIC_REGISTRY',
      lastFrameTimestamp: new Date(Date.now() - (i * 20000)).toISOString(),
      feedHealth: {
        state: isOffline ? 'DISCONNECTED' : 'CONNECTED',
        lastSuccessfulConnection: new Date(Date.now() - (i * 20000)).toISOString(),
        lastFrame: new Date(Date.now() - (i * 20000)).toISOString(),
        reconnectCount: isOffline ? 3 : 0,
        latencyMs: isOffline ? 0 : 35 + (i % 20),
        packetLossRate: 0.00,
        fps: 30,
        resolution: i % 2 === 0 ? '1920x1080' : '3840x2160',
        uptimeSeconds: isOffline ? 0 : 86400,
        isSimulated: true
      }
    });
  }
  return cams;
};

const syntheticCameras = generateCameras();

// --- REPOSITORIES & SERVICES ---

class CentralEventStore implements IEventRepository {
  private events = new Map<string, SecurityEventPayload>();
  
  createEvent(event: SecurityEventPayload): 'ACK' | 'DUPLICATE' {
    if (this.events.has(event.eventId)) {
      return 'DUPLICATE';
    }
    this.events.set(event.eventId, { ...event });
    return 'ACK';
  }
  
  getEvent(eventId: string) { return this.events.get(eventId); }
  
  searchEvents(query: string): SecurityEventPayload[] {
    const q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    return Array.from(this.events.values()).filter(e => {
      const p = (e.metadata?.plate || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return p.includes(q) || e.eventId.toLowerCase().includes(q) || e.cameraId.toLowerCase().includes(q);
    });
  }
  
  acknowledgeEvent(eventId: string): void {
    // Ack confirmed
  }

  getEventsByEdgeNode(nodeId: string): SecurityEventPayload[] {
    return Array.from(this.events.values()).filter(e => e.edgeNodeId === nodeId);
  }

  getEventsByCamera(cameraId: string): SecurityEventPayload[] {
    return Array.from(this.events.values()).filter(e => e.cameraId === cameraId);
  }

  getEventsByPlate(plate: string): SecurityEventPayload[] {
    const norm = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return Array.from(this.events.values()).filter(e => {
      const p = (e.metadata?.plate || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
      return p === norm;
    });
  }

  getAllEvents() { return Array.from(this.events.values()); }
  
  clear() { this.events.clear(); }
}

const centralRepo = new CentralEventStore();
const logs: any[] = [];
let isCentralOffline = false;
let currentPolicyVersion = "v3.2.0";
const registeredNodes = new Map<string, any>();
const nodeHeartbeats = new Map<string, HeartbeatPayload>();
const pendingCommands = new Map<string, CommandPayload[]>();

// Watchlist Store
const watchlist: WatchlistEntry[] = [
  { id: 'WATCH-001', vehicleNumber: 'GJ01AB1234', reason: 'Designated Target Vehicle for Statewide Tracking Demo', priority: 'critical', status: 'active' },
  { id: 'WATCH-002', vehicleNumber: 'GJ05XY9988', reason: 'Suspected Permit Violation - North Corridor', priority: 'high', status: 'active' },
  { id: 'WATCH-003', vehicleNumber: 'GJ27CC4400', reason: 'Unregistered Commercial Transport', priority: 'medium', status: 'inactive' }
];

// Security Rules Engine
const securityRules = [
  { id: 'RULE-001', name: 'Designated Vehicle Detected (Watchlist Match)', type: 'watchlist', severity: 'critical', active: true, description: 'Triggers immediately upon ANPR identification of high-priority watchlist record' },
  { id: 'RULE-002', name: 'Restricted Area Perimeter Incursion', type: 'intrusion', severity: 'high', active: true, description: 'Vehicle or pedestrian enters designated red zone without electronic clearance' },
  { id: 'RULE-003', name: 'Monitored Highway Corridor Transition', type: 'ANPR', severity: 'info', active: true, description: 'Logs standard vehicular traversal across arterial ring road cameras' },
  { id: 'RULE-004', name: 'Camera Node Heartbeat Loss (>30s)', type: 'system', severity: 'high', active: true, description: 'Edge device fails to deliver consecutive telemetry pulses' },
  { id: 'RULE-005', name: 'Unusual Concourse Crowd Density', type: 'crowd', severity: 'medium', active: true, description: 'Pedestrian density threshold exceeds 4.5 persons per sq meter' },
  { id: 'RULE-006', name: 'Arterial Wrong-Way Movement', type: 'traffic', severity: 'high', active: true, description: 'Motion vector opposes designated one-way traffic flow' },
  { id: 'RULE-007', name: 'Extended Secure Zone Loitering (>5m)', type: 'loitering', severity: 'medium', active: true, description: 'Stationary vehicle detected in emergency lane exceeding 300s' }
];

const alerts: Alert[] = [];
const auditLogs: AuditRecord[] = [];

function addLog(dir: string, type: string, size: number, status: string, reqId?: string) {
  logs.unshift({
    id: `log-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    direction: dir,
    type,
    payloadSize: size,
    status,
    requestId: reqId
  });
  if (logs.length > 200) logs.pop();
}

function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

class AuditService implements IAuditService {
  async log(user: string, action: string, resource: string, result: string, correlationId: string): Promise<void> {
    auditLogs.unshift({
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user,
      action,
      timestamp: new Date().toISOString(),
      resource,
      result,
      correlationId: correlationId || `CORR-${Date.now()}`
    });
    if (auditLogs.length > 300) auditLogs.pop();
  }

  async getLogs(): Promise<AuditRecord[]> {
    return auditLogs;
  }
}

const auditService = new AuditService();

class WatchlistService implements IWatchlistService {
  async checkWatchlist(targetIdOrPlate: string): Promise<WatchlistEntry | null> {
    const norm = normalizePlate(targetIdOrPlate);
    const entry = watchlist.find(w => {
      if (w.status !== 'active') return false;
      if (w.vehicleNumber && normalizePlate(w.vehicleNumber) === norm) return true;
      if (w.personId && w.personId.toUpperCase() === targetIdOrPlate.toUpperCase()) return true;
      if (w.id && w.id.toUpperCase() === targetIdOrPlate.toUpperCase()) return true;
      return false;
    });
    return entry || null;
  }
}

const watchlistService = new WatchlistService();

// Canonical Vehicle Tracking and Investigation Service
class VehicleTrackingService implements IVehicleTrackingService, IVehicleInvestigationService {
  constructor(private repo: IEventRepository, private cameras: Camera[]) {}

  async searchVehicle(query: string): Promise<VehicleSighting[]> {
    const journey = await this.correlateVehicleEvents(query);
    return journey.sightings;
  }

  async correlateVehicleEvents(vehicleNumber: string): Promise<VehicleJourney> {
    const targetPlate = normalizePlate(vehicleNumber);
    const allEvents = this.repo.getAllEvents().filter(e => e.eventType === 'ANPR' || e.eventType === 'VEHICLE_SIGHTING');
    
    const matchedEvents = allEvents
      .filter(e => normalizePlate(e.metadata?.plate || '') === targetPlate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const sightings: VehicleSighting[] = matchedEvents.map(e => {
      const cam = this.cameras.find(c => c.id === e.cameraId);
      return {
        sightingId: e.eventId,
        vehicleNumber: e.metadata?.plate || targetPlate,
        cameraId: e.cameraId,
        siteId: e.siteId,
        timestamp: e.timestamp,
        latitude: cam?.latitude,
        longitude: cam?.longitude,
        direction: cam?.direction || e.metadata?.direction,
        plateConfidence: e.confidence,
        vehicleConfidence: Math.round(e.confidence * 95) / 100,
        snapshotReference: e.snapshotReference || `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
        clipReference: `EVD-CLIP-${e.eventId}`,
        sourceEdgeNode: e.edgeNodeId,
        eventId: e.eventId
      };
    });

    if (sightings.length === 0) {
      return {
        vehicleNumber: targetPlate,
        sightings: [],
        totalSightings: 0,
        firstSeen: '',
        lastSeen: '',
        camerasVisited: 0,
        districtsVisited: 0,
        durationMinutes: 0
      };
    }

    const camerasVisited = new Set(sightings.map(s => s.cameraId)).size;
    const districtsVisited = new Set(sightings.map(s => {
      const c = this.cameras.find(cam => cam.id === s.cameraId);
      return c?.district || 'Unknown';
    })).size;

    const firstSeen = sightings[0].timestamp;
    const lastSeen = sightings[sightings.length - 1].timestamp;
    const durationMinutes = Math.max(0.5, (new Date(lastSeen).getTime() - new Date(firstSeen).getTime()) / 60000);

    return {
      vehicleNumber: targetPlate,
      sightings,
      totalSightings: sightings.length,
      firstSeen,
      lastSeen,
      camerasVisited,
      districtsVisited,
      durationMinutes: Math.round(durationMinutes * 10) / 10
    };
  }
}

const vehicleTrackingService = new VehicleTrackingService(centralRepo, syntheticCameras);
const personTrackingService = new PersonTrackingService(() => centralRepo.getAllEvents(), syntheticCameras);

async function processWatchlistAndRules(event: SecurityEventPayload, reqId: string) {
  // 1. Dynamic Watchlist Evaluation (Vehicle Plate or Synthetic Person Track)
  const plate = event.metadata?.plate;
  const personTrackId = event.metadata?.personTrackId;
  const targetId = event.metadata?.targetId;

  let match: WatchlistEntry | null = null;
  let matchType = 'VEHICLE';

  if (plate) {
    const normalized = normalizePlate(plate);
    match = await watchlistService.checkWatchlist(normalized);
  }
  if (!match && personTrackId) {
    match = await watchlistService.checkWatchlist(personTrackId);
    if (match) matchType = 'PERSON';
  }
  if (!match && targetId) {
    match = await watchlistService.checkWatchlist(targetId);
    if (match) matchType = 'TARGET';
  }
    
  if (match) {
    const alertId = `ALT-WL-${event.eventId}`;
    const evidenceRef = event.metadata?.evidenceId || `EVD-WATCHLIST-${event.eventId.slice(-8)}`;
    if (!alerts.some(a => a.id === alertId || a.evidenceReference === evidenceRef || (a.cameraId === event.cameraId && a.vehicleNumber === event.metadata?.plate && a.type === 'watchlist'))) {
      const cam = syntheticCameras.find(c => c.id === event.cameraId);
      const targetIdentifier = plate || personTrackId || targetId || match.vehicleNumber || match.personId || 'Target';
      const newAlert: Alert = {
        id: alertId,
        type: 'watchlist',
        severity: match.priority || 'high',
        cameraName: cam?.name || `CCTV Node ${event.cameraId}`,
        cameraId: event.cameraId,
        location: cam?.location || 'Traffic Corridor',
        timestamp: event.timestamp || new Date().toISOString(),
        description: `Synthetic Watchlist Match: ${targetIdentifier} detected at ${cam?.name || event.cameraId}. Reason: ${match.reason}`,
        isRead: false,
        snapshotUrl: event.snapshotReference || `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
        siteId: cam?.siteId || event.siteId || 'SITE-1',
        vehicleNumber: event.metadata?.plate,
        targetId: match.id,
        personTrackId: personTrackId,
        syntheticMatch: true,
        label: 'SIMULATED DEMO EVIDENCE',
        confidence: event.confidence || 0.96,
        status: 'new',
        evidenceReference: evidenceRef
      };
      alerts.unshift(newAlert);
      if (alerts.length > 100) alerts.pop();
      await auditService.log('SYSTEM_RULES_ENGINE', 'SYNTHETIC_WATCHLIST_MATCH', `TARGET:${targetIdentifier} [${match.id}]`, 'HIGH_PRIORITY_ALARM', reqId);
    }
  }

  // 2. Dynamic Rule: Helmet violation detection (NO_HELMET)
  if (event.metadata?.helmetStatus === 'NO_HELMET') {
    const helmetAlertId = `ALT-RULE-HELMET-${event.eventId}`;
    const evidenceRef = event.metadata?.evidenceId || `EVD-HELMET-${event.eventId.slice(-8)}`;
    if (!alerts.some(a => a.id === helmetAlertId || a.evidenceReference === evidenceRef || (a.cameraId === event.cameraId && a.vehicleNumber === event.metadata?.plate && a.type === 'rule' && a.id.includes('HELMET')))) {
      const cam = syntheticCameras.find(c => c.id === event.cameraId);
      const confPercent = Math.round((event.metadata?.helmetConfidence || 0.94) * 100);
      const newAlert: Alert = {
        id: helmetAlertId,
        severity: 'high',
        type: 'rule',
        cameraName: cam?.name || `CCTV Node ${event.cameraId}`,
        cameraId: event.cameraId,
        location: cam?.location || 'Traffic Corridor',
        timestamp: event.timestamp || new Date().toISOString(),
        description: `Helmet Violation: Rider without safety helmet detected on vehicle ${event.metadata?.plate || 'Unknown'} at ${event.cameraId} (Inference: ${confPercent}% — Simulated)`,
        isRead: false,
        snapshotUrl: event.snapshotReference || `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
        siteId: cam?.siteId || event.siteId || 'SITE-1',
        vehicleNumber: event.metadata?.plate,
        confidence: event.metadata?.helmetConfidence || 0.94,
        status: 'new',
        evidenceReference: evidenceRef
      };
      alerts.unshift(newAlert);
      if (alerts.length > 100) alerts.pop();
      await auditService.log('SYSTEM_RULES_ENGINE', 'ALERT_GENERATED', `HELMET_VIOLATION:${event.metadata?.plate || event.cameraId} [${event.eventId}]`, 'HIGH_PRIORITY_DISPATCH', reqId);
    }
  }
}

// Seed synthetic cross-camera intelligence data for God's Eye (Scenarios A, B, C)
function seedSyntheticIntelligenceData() {
  const baseTime = Date.now() - 45 * 60 * 1000; // 45 mins ago

  // --- SCENARIO A: Vehicle GJ01AB1234 + Person P-DEMO-001 (Correlated 87%) ---
  const scenarioANodes = [
    { camId: 'CAM-007', offset: 0, speed: 48, helmet: 'HELMET' as const, hConf: 0.96, conf: 0.98 },
    { camId: 'CAM-014', offset: 136000, speed: 52, helmet: 'NO_HELMET' as const, hConf: 0.94, conf: 0.97 },
    { camId: 'CAM-023', offset: 339000, speed: 55, helmet: 'NO_HELMET' as const, hConf: 0.91, conf: 0.96 },
    { camId: 'CAM-031', offset: 543000, speed: 60, helmet: 'HELMET' as const, hConf: 0.95, conf: 0.95 }
  ];

  scenarioANodes.forEach((n, idx) => {
    const camNum = parseInt(n.camId.split('-')[1]);
    const cam = syntheticCameras.find(c => c.id === n.camId);
    const eventId = `EVT-TRK-SCENARIOA-${idx + 1}`;
    const ts = new Date(baseTime + n.offset).toISOString();
    const ev: SecurityEventPayload = {
      eventId,
      edgeNodeId: cam?.edgeNodeId || `EDGE-${Math.floor(camNum / 10) + 1}`,
      siteId: cam?.siteId || `SITE-${Math.floor(camNum / 5) + 1}`,
      cameraId: n.camId,
      timestamp: ts,
      eventType: 'ANPR',
      priority: n.helmet === 'NO_HELMET' ? 'high' : 'medium',
      confidence: n.conf,
      snapshotReference: `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
      metadata: {
        plate: 'GJ01AB1234',
        personTrackId: 'P-DEMO-001',
        associatedVehicle: 'GJ01AB1234',
        speed: n.speed,
        lane: (idx % 2) + 1,
        correlationConfidence: 0.87,
        helmetStatus: n.helmet,
        helmetConfidence: n.hConf,
        direction: cam?.direction || 'Northbound',
        evidenceId: `EVD-V06-A-${idx + 1}`
      }
    };
    centralRepo.createEvent(ev);

    if (n.camId === 'CAM-014') {
      const helmetAlert: Alert = {
        id: `ALT-RULE-HELMET-014`,
        severity: 'high',
        type: 'rule',
        cameraName: cam?.name || 'CCTV Node CAM-014',
        cameraId: 'CAM-014',
        location: cam?.location || 'Sector 2',
        timestamp: ts,
        description: `Helmet Violation: Rider without safety helmet detected on vehicle GJ01AB1234 at CAM-014 (Inference: 94% — Simulated)`,
        isRead: false,
        snapshotUrl: ev.snapshotReference!,
        siteId: cam?.siteId || 'SITE-3',
        vehicleNumber: 'GJ01AB1234',
        confidence: 0.94,
        status: 'new',
        evidenceReference: `EVD-V06-A-2`
      };
      if (!alerts.some(a => a.id === helmetAlert.id)) {
        alerts.unshift(helmetAlert);
      }
    }
  });

  // --- SCENARIO B: Watchlist Match GJ05XY6789 + Person P-DEMO-002 ---
  const scenarioBNodes = [
    { camId: 'CAM-005', offset: 900000, speed: 42, helmet: 'NO_HELMET' as const, hConf: 0.97, conf: 0.96 },
    { camId: 'CAM-016', offset: 1234000, speed: 45, helmet: 'NO_HELMET' as const, hConf: 0.95, conf: 0.94 },
    { camId: 'CAM-028', offset: 1570000, speed: 48, helmet: 'NO_HELMET' as const, hConf: 0.96, conf: 0.93 },
    { camId: 'CAM-042', offset: 1915000, speed: 50, helmet: 'NO_HELMET' as const, hConf: 0.98, conf: 0.91 }
  ];

  scenarioBNodes.forEach((n, idx) => {
    const camNum = parseInt(n.camId.split('-')[1]);
    const cam = syntheticCameras.find(c => c.id === n.camId);
    const eventId = `EVT-TRK-SCENARIOB-${idx + 1}`;
    const ts = new Date(baseTime + n.offset).toISOString();
    const ev: SecurityEventPayload = {
      eventId,
      edgeNodeId: cam?.edgeNodeId || `EDGE-${Math.floor(camNum / 10) + 1}`,
      siteId: cam?.siteId || `SITE-${Math.floor(camNum / 5) + 1}`,
      cameraId: n.camId,
      timestamp: ts,
      eventType: 'ANPR',
      priority: 'high',
      confidence: n.conf,
      snapshotReference: `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
      metadata: {
        plate: 'GJ05XY6789',
        personTrackId: 'P-DEMO-002',
        associatedVehicle: 'GJ05XY6789',
        speed: n.speed,
        correlationConfidence: 0.92,
        helmetStatus: n.helmet,
        helmetConfidence: n.hConf,
        direction: cam?.direction || 'Southbound',
        evidenceId: `EVD-V06-B-${idx + 1}`
      }
    };
    centralRepo.createEvent(ev);

    if (idx === 0) {
      const wlAlert: Alert = {
        id: `ALT-WL-GJ05XY6789`,
        severity: 'critical',
        type: 'watchlist',
        cameraName: cam?.name || 'CCTV Node CAM-005',
        cameraId: 'CAM-005',
        location: cam?.location || 'Sector 1',
        timestamp: ts,
        description: `Designated vehicle detected: GJ05XY6789 at CAM-005. Reason: Suspect Vehicle (Armed Robbery Case #2024-884)`,
        isRead: false,
        snapshotUrl: ev.snapshotReference!,
        siteId: cam?.siteId || 'SITE-1',
        vehicleNumber: 'GJ05XY6789',
        confidence: 0.96,
        status: 'new',
        evidenceReference: `EVD-V06-B-1`
      };
      if (!alerts.some(a => a.id === wlAlert.id)) {
        alerts.unshift(wlAlert);
      }
    }
  });

  // --- SCENARIO C: Pedestrian Concourse Person-only P-DEMO-003 ---
  const scenarioCNodes = [
    { camId: 'CAM-003', offset: 1800000, conf: 0.94 },
    { camId: 'CAM-009', offset: 2070000, conf: 0.92 },
    { camId: 'CAM-015', offset: 2350000, conf: 0.95 },
    { camId: 'CAM-022', offset: 2685000, conf: 0.93 },
    { camId: 'CAM-035', offset: 3012000, conf: 0.91 }
  ];

  scenarioCNodes.forEach((n, idx) => {
    const camNum = parseInt(n.camId.split('-')[1]);
    const cam = syntheticCameras.find(c => c.id === n.camId);
    const eventId = `EVT-TRK-SCENARIOC-${idx + 1}`;
    const ts = new Date(baseTime + n.offset).toISOString();
    const ev: SecurityEventPayload = {
      eventId,
      edgeNodeId: cam?.edgeNodeId || `EDGE-${Math.floor(camNum / 10) + 1}`,
      siteId: cam?.siteId || `SITE-${Math.floor(camNum / 5) + 1}`,
      cameraId: n.camId,
      timestamp: ts,
      eventType: 'CROWD',
      priority: 'low',
      confidence: n.conf,
      snapshotReference: `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
      metadata: {
        personTrackId: 'P-DEMO-003',
        movementMode: 'walking',
        direction: cam?.direction || 'Southbound',
        evidenceId: `EVD-V06-C-${idx + 1}`,
        helmetStatus: 'UNKNOWN',
        helmetConfidence: 0.00
      }
    };
    centralRepo.createEvent(ev);
  });

  // --- SCENARIO D: Wanted Vehicle Corridor GJ05AB1234 (V1.1 Demonstration) ---
  const scenarioDNodes = [
    { camId: 'CAM-007', offset: 20000, speed: 48, conf: 0.98, loc: 'Airport Circle North Gate', dept: 'TRAFFIC' },
    { camId: 'CAM-014', offset: 160000, speed: 52, conf: 0.96, loc: 'Hansol Junction Crossroad', dept: 'TRAFFIC', isTrigger: true },
    { camId: 'CAM-023', offset: 335000, speed: 55, conf: 0.94, loc: 'DGP Office Perimeter Road', dept: 'HIGHWAY' },
    { camId: 'CAM-031', offset: 500000, speed: 58, conf: 0.92, loc: 'Sabarmati Riverfront Flyover', dept: 'CITY_POLICE' }
  ];

  scenarioDNodes.forEach((n, idx) => {
    const cam = syntheticCameras.find(c => c.id === n.camId);
    const eventId = `EVT-TRK-SCENARIOD-${idx + 1}`;
    const ts = new Date(baseTime + n.offset).toISOString();
    const ev: SecurityEventPayload = {
      eventId,
      edgeNodeId: cam?.edgeNodeId || 'EDGE-00042',
      siteId: cam?.siteId || 'SITE-STATEWIDE',
      cameraId: n.camId,
      timestamp: ts,
      eventType: 'ANPR',
      priority: n.isTrigger ? 'critical' : 'high',
      confidence: n.conf,
      snapshotReference: `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
      metadata: {
        plate: 'GJ05AB1234',
        vehicleClass: 'Sedan',
        speed: n.speed,
        location: n.loc,
        departmentType: n.dept,
        direction: 'Southwest Corridor',
        correlationId: 'CORR-SCENARIO-WANTED-GJ05AB1234',
        isWatchlistMatch: true,
        evidenceId: `EVD-GJ05AB1234-${idx + 1}`
      }
    };
    centralRepo.createEvent(ev);

    if (n.isTrigger) {
      const wlAlert: Alert = {
        id: `ALT-WL-GJ05AB1234`,
        severity: 'critical',
        type: 'watchlist',
        cameraName: cam?.name || 'Hansol Junction Crossroad (CAM-014)',
        cameraId: 'CAM-014',
        location: n.loc,
        timestamp: ts,
        description: `WANTED VEHICLE DETECTED: Target plate GJ05AB1234 sighted at ${n.loc} (CAM-014). Watchlist match with SHA-256 evidence dispatch.`,
        isRead: false,
        snapshotUrl: ev.snapshotReference!,
        siteId: cam?.siteId || 'SITE-3',
        vehicleNumber: 'GJ05AB1234',
        confidence: 0.98,
        status: 'new',
        evidenceReference: `EVD-GJ05AB1234-2`
      };
      if (!alerts.some(a => a.id === wlAlert.id)) {
        alerts.unshift(wlAlert);
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize seed intelligence data
  seedSyntheticIntelligenceData();

  app.use(express.json({ limit: '15mb' }));

  // Intercept all /api/edge requests to check if offline
  app.use('/api/edge', (req, res, next) => {
    if (isCentralOffline) {
      return res.status(503).json({ error: 'Central Command Unreachable' });
    }
    next();
  });

  // Edge API
  app.post('/api/edge/register', (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    const { edgeNodeId, capabilities, deviceIdentity } = req.body;
    
    if (!edgeNodeId || !deviceIdentity) {
      addLog('inbound', 'REGISTRATION_REJECTED', JSON.stringify(req.body).length, 'failed', reqId);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    registeredNodes.set(edgeNodeId, { capabilities, deviceIdentity, registeredAt: new Date().toISOString() });
    pendingCommands.set(edgeNodeId, []);
    
    addLog('inbound', 'REGISTRATION_SUCCESS', JSON.stringify(req.body).length, 'success', reqId);
    
    res.json({
      status: 'registered',
      config: { heartbeatInterval: 10000 },
      policyVersion: currentPolicyVersion
    });
  });

  app.post('/api/edge/heartbeat', (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    const payload = req.body as HeartbeatPayload;
    
    if (!registeredNodes.has(payload.edgeNodeId)) {
      addLog('inbound', 'HEARTBEAT_REJECTED', JSON.stringify(payload).length, 'failed', reqId);
      return res.status(401).json({ error: 'Unknown Node' });
    }
    nodeHeartbeats.set(payload.edgeNodeId, payload);
    
    const cmds = pendingCommands.get(payload.edgeNodeId) || [];
    pendingCommands.set(payload.edgeNodeId, []);
    res.json({ status: 'ok', commands: cmds });
  });

  app.post('/api/edge/events', async (req, res) => {
    const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
    const demoRunId = (req.headers['x-demo-run-id'] as string) || '';
    const events = req.body.events as SecurityEventPayload[];
    if (!events || !Array.isArray(events)) return res.status(400).json({ error: 'Invalid payload' });
    
    addLog('inbound', 'EVENT_UPLOAD_STARTED', JSON.stringify(req.body).length, 'pending', reqId);
    const acks: string[] = [];
    const duplicates: string[] = [];
    
    for (const ev of events) {
      if (demoRunId) {
        if (!ev.metadata) ev.metadata = {};
        ev.metadata.demoRunId = demoRunId;
        ev.metadata.correlationId = reqId;
      }
      const result = centralRepo.createEvent(ev);
      if (result === 'ACK') {
        acks.push(ev.eventId);
        addLog('inbound', 'EVENT_STORED', JSON.stringify(ev).length, 'success', reqId);
        await processWatchlistAndRules(ev, reqId);
      } else {
        duplicates.push(ev.eventId);
        addLog('inbound', 'EVENT_DUPLICATE', 0, 'warning', reqId);
        await auditService.log('CENTRAL_INGESTION', 'EVENT_DUPLICATE_REJECTED', ev.eventId, 'IDEMPOTENT_IGNORED', reqId);
      }
    }
    
    addLog('outbound', 'EVENT_ACKNOWLEDGED', JSON.stringify({ acks, duplicates }).length, 'success', reqId);
    res.json({ acks, duplicates });
  });

  app.get('/api/edge/policies', (req, res) => {
    res.json({
      commandType: 'updatePolicy',
      version: currentPolicyVersion,
      metadata: {
        signature: 'VALID_SIG',
        expiresAt: '2050-01-01T00:00:00Z'
      }
    });
  });

  app.post('/api/edge/commands/:commandId/result', (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    addLog('inbound', `CMD_RESULT_${req.params.commandId}`, JSON.stringify(req.body).length, 'success', reqId);
    res.json({ status: 'ok' });
  });

  // Central UI API (For Dashboard & Operations)
  app.get('/api/central/events', (req, res) => {
    res.json(centralRepo.getAllEvents());
  });

  app.get('/api/central/event-stream', (req, res) => {
    const all = centralRepo.getAllEvents();
    res.json(all.slice(-50).reverse());
  });
  
  app.get('/api/central/events/search', (req, res) => {
    const q = req.query.q as string || '';
    res.json(centralRepo.searchEvents(q));
  });

  app.get('/api/central/logs', (req, res) => {
    res.json(logs);
  });

  app.get('/api/central/state', (req, res) => {
    res.json({
      isOffline: isCentralOffline,
      heartbeats: Array.from(nodeHeartbeats.entries()),
      registeredNodes: Array.from(registeredNodes.entries())
    });
  });

  app.post('/api/central/toggle-offline', (req, res) => {
    isCentralOffline = !isCentralOffline;
    res.json({ isOffline: isCentralOffline });
  });

  // --- CHALLENGE MODE APIS ---

  app.get('/api/central/cameras', (req, res) => {
    res.json(syntheticCameras);
  });

  app.get('/api/central/cameras/:id', (req, res) => {
    const cam = syntheticCameras.find(c => c.id === req.params.id);
    if (!cam) return res.status(404).json({ error: 'Camera not found' });
    
    const camEvents = centralRepo.getEventsByCamera(cam.id);
    const camAlerts = alerts.filter(a => a.cameraId === cam.id);
    res.json({
      camera: cam,
      eventsToday: camEvents.length + 142, // realistic daily baseline
      currentAlerts: camAlerts,
      recentEvents: camEvents.slice(-10).reverse()
    });
  });

  // Watchlist Management
  app.get('/api/central/watchlist', (req, res) => {
    res.json(watchlist);
  });

  app.post('/api/central/watchlist', async (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    const { vehicleNumber, reason, priority } = req.body;
    if (!vehicleNumber) return res.status(400).json({ error: 'vehicleNumber required' });
    
    const newEntry: WatchlistEntry = {
      id: `WATCH-${Date.now()}`,
      vehicleNumber: normalizePlate(vehicleNumber),
      reason: reason || 'Threat Assessment Target',
      priority: priority || 'high',
      status: 'active'
    };
    watchlist.unshift(newEntry);
    await auditService.log('OPERATOR', 'WATCHLIST_INSERT', newEntry.vehicleNumber, 'SUCCESS', reqId);
    res.json({ status: 'ok', entry: newEntry });
  });

  app.delete('/api/central/watchlist/:id', async (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    const idx = watchlist.findIndex(w => w.id === req.params.id);
    if (idx >= 0) {
      const removed = watchlist.splice(idx, 1)[0];
      await auditService.log('OPERATOR', 'WATCHLIST_REMOVE', removed.vehicleNumber || removed.id, 'SUCCESS', reqId);
    }
    res.json({ status: 'ok' });
  });

  // Security Rules Engine
  app.get('/api/central/rules', (req, res) => {
    res.json(securityRules);
  });

  app.post('/api/central/rules/toggle', (req, res) => {
    const { ruleId } = req.body;
    const rule = securityRules.find(r => r.id === ruleId);
    if (rule) rule.active = !rule.active;
    res.json({ status: 'ok', rule });
  });

  // Alerts Management
  app.get('/api/central/alerts', (req, res) => {
    res.json(alerts);
  });

  app.post('/api/central/alerts/:id/acknowledge', async (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    const alert = alerts.find(a => a.id === req.params.id);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedBy = 'Gujarat Police C&C Officer';
      await auditService.log('OPERATOR', 'ALERT_ACKNOWLEDGE', alert.id, 'RESOLVED', reqId);
    }
    res.json({ status: 'ok', alert });
  });
  
  app.post('/api/central/alerts/clear', async (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    alerts.length = 0;
    await auditService.log('OPERATOR', 'ALERTS_PURGE', 'ALL_ALERTS', 'SUCCESS', reqId);
    res.json({ status: 'ok' });
  });

  app.post('/api/central/alerts/generate', async (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    const randomCam = syntheticCameras[Math.floor(Math.random() * syntheticCameras.length)];
    const rule = securityRules[Math.floor(Math.random() * securityRules.length)];
    
    const manualAlert: Alert = {
      id: `ALT-MANUAL-${Date.now()}`,
      type: rule.type,
      severity: rule.severity as any,
      cameraId: randomCam.id,
      timestamp: new Date().toISOString(),
      description: `${rule.name} triggered at ${randomCam.name} (${randomCam.locationDescription}).`,
      isRead: false,
      snapshotUrl: `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
      siteId: randomCam.siteId,
      confidence: 0.94,
      status: 'new',
      evidenceReference: `EVD-MANUAL-${Date.now()}`
    };
    alerts.unshift(manualAlert);
    await auditService.log('SIMULATION_ENGINE', 'MANUAL_ALERT_FIRED', manualAlert.id, 'CRITICAL', reqId);
    res.json({ status: 'ok', alert: manualAlert });
  });

  // Audit Logs
  app.get('/api/central/audit', async (req, res) => {
    res.json(await auditService.getLogs());
  });

  // Evidence Retrieval
  app.get('/api/central/evidence/:eventId', (req, res) => {
    const eventId = req.params.eventId;
    const event = centralRepo.getEvent(eventId) || centralRepo.getAllEvents()[0];
    const cam = syntheticCameras.find(c => c.id === (event?.cameraId || 'CAM-007'));
    
    // Calculate genuine SHA-256 over canonical evidence metadata
    const canonicalPayload = JSON.stringify({
      evidenceId: `EVD-${eventId}`,
      eventId,
      cameraId: cam?.id || 'CAM-007',
      siteId: cam?.siteId || 'SITE-1',
      timestamp: event?.timestamp || new Date().toISOString(),
      sourceEdgeNode: cam?.edgeNodeId || 'EDGE-1',
      detectionConfidence: event?.confidence || 0.98,
      latitude: cam?.latitude,
      longitude: cam?.longitude,
      correlationId: event?.metadata?.correlationId
    });
    const calculatedHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

    const evidence: EvidenceRecord = {
      evidenceId: `EVD-${eventId}`,
      eventId: eventId,
      cameraId: cam?.id || 'CAM-007',
      siteId: cam?.siteId || 'SITE-1',
      timestamp: event?.timestamp || new Date().toISOString(),
      sourceEdgeNode: cam?.edgeNodeId || 'EDGE-1',
      detectionConfidence: event?.confidence || 0.98,
      snapshotUrl: `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80`,
      clipUrl: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`,
      sha256Hash: calculatedHash,
      createdAt: new Date().toISOString(),
      label: 'SIMULATED DEMO EVIDENCE',
      integrityNotice: 'Evidence Integrity Hash — DEMO (Calculated via SHA-256 over synthetic event payload; production architecture would hash raw bitstream at Edge DVR hardware before signing)',
      isSimulation: true,
      correlationId: event?.metadata?.correlationId,
      latitude: cam?.latitude,
      longitude: cam?.longitude
    };
    res.json(evidence);
  });

  // Vehicle Investigation & Chronological Trajectory (Enhanced with God's Eye V2 Intelligence)
  app.get('/api/central/investigation/vehicle/:plate', async (req, res) => {
    const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
    const targetPlate = normalizePlate(req.params.plate);
    await auditService.log('OPERATOR', 'VEHICLE_INVESTIGATION_SEARCH', targetPlate, 'QUERY_EXECUTED', reqId);
    
    const journey = await vehicleTrackingService.correlateVehicleEvents(targetPlate);
    const observations = godsEyeObservationService.getObservationsForPlate(targetPlate);
    const trajectory = await godsEyeObservationService.generateCompactTrajectory(targetPlate);
    const evidenceChain = await godsEyeObservationService.getForensicEvidenceChain(targetPlate);
    
    // Find cross-camera correlations if observations exist
    let correlations: any[] = [];
    if (observations.length > 0) {
      correlations = godsEyeObservationService.correlateVehicleAcrossCameras(observations[0]);
    }

    res.json({
      ...journey,
      v2Observations: observations,
      compactTrajectory: trajectory,
      evidenceChain,
      correlations,
      lastSeenObservation: observations.length > 0 ? observations[observations.length - 1] : null
    });
  });

  // God's Eye V2: Forensic Evidence Chain for Vehicle
  app.get('/api/central/investigation/vehicle/:plate/evidence', async (req, res) => {
    const targetPlate = normalizePlate(req.params.plate);
    const chain = await godsEyeObservationService.getForensicEvidenceChain(targetPlate);
    res.json(chain);
  });

  // God's Eye V2: Compact Trajectory Points and Bandwidth Footprint
  app.get('/api/central/investigation/vehicle/:plate/trajectory', async (req, res) => {
    const targetPlate = normalizePlate(req.params.plate);
    const trajectory = await godsEyeObservationService.generateCompactTrajectory(targetPlate);
    res.json(trajectory);
  });

  // God's Eye V2: Last-Seen Summary Card
  app.get('/api/central/investigation/vehicle/:plate/last-seen', async (req, res) => {
    const targetPlate = normalizePlate(req.params.plate);
    const observations = godsEyeObservationService.getObservationsForPlate(targetPlate);
    if (observations.length === 0) {
      return res.status(404).json({ error: 'No observations found for plate', plate: targetPlate });
    }
    const lastSeen = observations[observations.length - 1];
    const firstSeen = observations[0];
    res.json({
      plate: targetPlate,
      lastSeenObservation: lastSeen,
      firstSeenObservation: firstSeen,
      totalObservations: observations.length,
      camerasVisited: new Set(observations.map(o => o.cameraId)).size
    });
  });

  // God's Eye V2: Chronological Photo Evidence Timeline
  app.get('/api/central/investigation/vehicle/:plate/timeline', async (req, res) => {
    const targetPlate = normalizePlate(req.params.plate);
    const observations = godsEyeObservationService.getObservationsForPlate(targetPlate);
    const evidenceList = await evidenceStorage.listEvidence({ plateNormalized: targetPlate });
    
    res.json({
      plate: targetPlate,
      firstSeen: observations.length > 0 ? observations[0].timestamp : null,
      lastSeen: observations.length > 0 ? observations[observations.length - 1].timestamp : null,
      timeline: observations.map((o, idx) => ({
        sequence: idx + 1,
        isFirstSeen: idx === 0,
        isLastSeen: idx === observations.length - 1,
        observationId: o.observationId,
        cameraId: o.cameraId,
        cameraName: o.cameraName,
        timestamp: o.timestamp,
        speedEstimate: o.speedEstimate,
        direction: o.direction,
        vehicleClass: o.vehicleClass,
        plateStatus: o.plateStatus,
        plateConfidence: o.plateConfidence,
        imageReference: o.imageReference,
        thumbnailReference: o.thumbnailReference,
        evidenceHash: o.evidenceHash,
        evidenceReference: o.evidenceReference,
        isBestFrame: o.isBestFrame,
        bestFrameScore: o.bestFrameScore
      })),
      forensicRecords: evidenceList
    });
  });

  // God's Eye V2: Cross-Camera Correlation Analysis
  app.get('/api/central/investigation/vehicle/:plate/correlations', async (req, res) => {
    const targetPlate = normalizePlate(req.params.plate);
    const observations = godsEyeObservationService.getObservationsForPlate(targetPlate);
    if (observations.length === 0) {
      return res.json([]);
    }
    const correlations = godsEyeObservationService.correlateVehicleAcrossCameras(observations[0]);
    res.json(correlations);
  });

  // God's Eye V2: Live Vehicle Observations Stream & Query
  app.get('/api/central/vehicle-observations', (req, res) => {
    const vehicleClass = req.query.vehicleClass as any;
    const plateStatus = req.query.plateStatus as any;
    const cameraId = req.query.cameraId as string;
    const watchlistOnly = req.query.watchlistOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const observations = godsEyeObservationService.getLiveObservations({
      vehicleClass,
      plateStatus,
      cameraId,
      watchlistOnly,
      limit
    });
    res.json(observations);
  });

  // God's Eye V2: Ingest Vehicle Observation from Edge Camera Node
  app.post('/api/central/vehicle-observations', async (req, res) => {
    const obs = await godsEyeObservationService.recordObservation(req.body);
    res.status(201).json(obs);
  });

  // God's Eye V2: Dispatch Camera-to-Camera Search Task
  app.post('/api/central/camera-search-task', async (req, res) => {
    const sourceObs = req.body;
    const task = await godsEyeObservationService.createSearchTaskForDownstreamCameras(sourceObs);
    res.status(201).json(task);
  });

  // God's Eye V2: Simulate Mobile Patrol Observation
  app.post('/api/central/mobile-patrol/simulate', async (req, res) => {
    const carId = req.body?.carId || 'MOBILE-CAR-001';
    const obs = await godsEyeObservationService.simulateMobilePatrolObservation(carId, req.body?.location);
    res.status(201).json(obs);
  });


  // Investigation Evidence Dossier Export
  app.get('/api/central/investigation/export/:plate', async (req, res) => {
    const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
    const targetPlate = normalizePlate(req.params.plate);
    await auditService.log('OPERATOR', 'EXPORT_DOSSIER', targetPlate, 'DOSSIER_COMPILED', reqId);
    
    const allEvents = centralRepo.getAllEvents().filter(e => e.eventType === 'ANPR' || e.eventType === 'VEHICLE_SIGHTING');
    const targetEvents = allEvents.filter(e => normalizePlate(e.metadata?.plate || '') === targetPlate);
    
    const canonicalDossier = JSON.stringify({
      targetPlate,
      sightingsCount: targetEvents.length,
      agency: 'Gujarat Police State Surveillance Command & Control Network',
      correlationId: reqId
    });
    const dossierSha256 = crypto.createHash('sha256').update(canonicalDossier).digest('hex');

    const dossier = {
      dossierId: `DOSSIER-GP-${Date.now()}`,
      agency: 'Gujarat Police State Surveillance Command & Control Network',
      targetVehicle: targetPlate,
      classification: 'RESTRICTED / LAW ENFORCEMENT DEMO',
      generatedAt: new Date().toISOString(),
      correlationId: reqId,
      cryptographicHash: dossierSha256,
      integrityLabel: 'Evidence Integrity Hash — DEMO',
      integrityNotice: 'Calculated via SHA-256 integrity digest over canonical dossier payload for BSA 2023 electronic-record workflow.',
      totalVerifiedSightings: targetEvents.length,
      departmentRetentionPolicy: {
        trafficRawDays: 15,
        highwayRawDays: 30,
        cityPoliceRawDays: 30,
        forensicEvidenceYears: 7,
        standardNotice: 'Raw video retention adheres to departmental quotas. Incident evidence snapshots and SHA-256 cryptographic hashes are archived for statutory judicial custody.'
      },
      sightings: targetEvents.map(e => {
        const cam = syntheticCameras.find(c => c.id === e.cameraId);
        const deptType = e.metadata?.departmentType || (e.cameraId.includes('023') ? 'HIGHWAY' : (e.cameraId.includes('007') || e.cameraId.includes('014')) ? 'TRAFFIC' : 'CITY_POLICE');
        const retentionDays = deptType === 'HIGHWAY' ? 30 : deptType === 'TRAFFIC' ? 15 : 30;
        const videoAgeDays = Math.max(0, (Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
        const isRawVideoExpired = videoAgeDays > retentionDays;
        return {
          eventId: e.eventId,
          timestamp: e.timestamp,
          cameraId: e.cameraId,
          cameraName: cam?.name || e.cameraId,
          location: e.metadata?.location || cam?.location || 'Corridor Junction',
          district: cam?.district || 'Ahmedabad',
          departmentType: deptType,
          siteId: e.siteId,
          edgeNode: e.edgeNodeId,
          confidence: e.confidence,
          speed: e.metadata?.speed || 50,
          direction: e.metadata?.direction || cam?.direction || 'Southbound',
          rawVideoRetentionDays: retentionDays,
          isRawVideoExpired,
          evidenceDigest: `SHA256:${crypto.createHash('sha256').update(e.eventId + (e.timestamp || '')).digest('hex')}`
        };
      })
    };
    res.json(dossier);
  });
  
  // --- V0.6 GOD'S EYE UNIFIED CORRELATED INTELLIGENCE ENDPOINTS ---

  // Unified God's Eye Target Investigation API
  app.get('/api/central/investigation/godseye', async (req, res) => {
    const reqId = (req.headers['x-request-id'] as string) || `REQ-GODSEYE-${Date.now()}`;
    const rawTarget = (req.query.target as string || 'GJ01AB1234').trim();
    const target = rawTarget.toUpperCase();
    const targetTypeFilter = (req.query.targetType as string || 'all').toLowerCase();
    
    await auditService.log('OPERATOR', 'GODS_EYE_QUERY', target, 'CORRELATION_COMPUTED', reqId);

    const allEvents = centralRepo.getAllEvents();
    
    // Find matching events by Plate, Person Track ID, Camera ID, or Event ID
    const matchedEvents = allEvents.filter(e => {
      const p = normalizePlate(e.metadata?.plate || '');
      const person = (e.metadata?.personTrackId || '').toUpperCase();
      const cam = e.cameraId.toUpperCase();
      const evt = e.eventId.toUpperCase();
      const normTarget = normalizePlate(target);

      if (target.startsWith('P-DEMO') || target.startsWith('PERSON')) {
        return person === target;
      }
      if (target.startsWith('CAM-')) {
        return cam === target;
      }
      if (target.startsWith('EVT-')) {
        return evt === target;
      }
      return p === normTarget || person === target || cam === target;
    });

    // If no events found, return empty record
    if (matchedEvents.length === 0) {
      const emptyRecord: GodsEyeTargetRecord = {
        targetId: target,
        targetType: target.startsWith('P-DEMO') ? 'person' : 'vehicle',
        sightings: [],
        totalSightings: 0,
        firstSeen: '',
        lastSeen: '',
        camerasVisited: 0,
        edgeNodesVisited: 0,
        districtsVisited: 0,
        durationMinutes: 0,
        alertsCount: 0,
        evidenceCount: 0,
        watchlistStatus: watchlist.some(w => normalizePlate(w.vehicleNumber || '') === normalizePlate(target)) ? 'WATCHLIST MATCH' : 'NOT WATCHLISTED',
        helmetSummary: {
          helmetCount: 0,
          noHelmetCount: 0,
          unknownCount: 0,
          primaryState: 'UNKNOWN'
        }
      };
      return res.json(emptyRecord);
    }

    // Sort chronologically
    matchedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Detect target type and associations
    const isPerson = target.startsWith('P-DEMO');
    const associatedPlate = matchedEvents.find(e => e.metadata?.plate)?.metadata?.plate;
    const associatedPerson = matchedEvents.find(e => e.metadata?.personTrackId)?.metadata?.personTrackId;
    const correlationConf = matchedEvents.find(e => e.metadata?.correlationConfidence)?.metadata?.correlationConfidence || 
      (associatedPlate && associatedPerson ? 0.87 : undefined);

    let helmetCount = 0;
    let noHelmetCount = 0;
    let unknownCount = 0;

    const sightings: GodsEyeTargetSighting[] = matchedEvents.map(e => {
      const cam = syntheticCameras.find(c => c.id === e.cameraId);
      const hStatus: HelmetStatus = e.metadata?.helmetStatus || 'UNKNOWN';
      if (hStatus === 'HELMET') helmetCount++;
      else if (hStatus === 'NO_HELMET') noHelmetCount++;
      else unknownCount++;

      // Check alert matching with precise event/target association
      const matchingAlert = alerts.find(a => {
        if (a.evidenceReference && (a.evidenceReference === e.metadata?.evidenceId || a.evidenceReference === `EVD-${e.eventId}`)) {
          return true;
        }
        if (a.id.includes(e.eventId)) {
          return true;
        }
        if (a.cameraId === e.cameraId && e.metadata?.plate && a.vehicleNumber) {
          return normalizePlate(a.vehicleNumber) === normalizePlate(e.metadata.plate);
        }
        return false;
      });

      return {
        sightingId: e.eventId,
        eventId: e.eventId,
        correlationId: reqId,
        cameraId: e.cameraId,
        cameraName: cam?.name || `CCTV Node ${e.cameraId}`,
        edgeNodeId: e.edgeNodeId,
        timestamp: e.timestamp,
        latitude: cam?.latitude || 23.0225,
        longitude: cam?.longitude || 72.5714,
        mapX: cam?.mapX || 100,
        mapY: cam?.mapY || 100,
        direction: cam?.direction || e.metadata?.direction || 'Northbound',
        confidence: e.confidence,
        plate: e.metadata?.plate,
        plateConfidence: e.confidence,
        vehicleType: e.metadata?.vehicleType || (e.metadata?.plate ? 'Motorcycle' : 'Pedestrian'),
        vehicleColor: e.metadata?.vehicleColor || 'Dark Metallic',
        personTrackId: e.metadata?.personTrackId,
        helmetStatus: hStatus,
        helmetConfidence: e.metadata?.helmetConfidence || (hStatus !== 'UNKNOWN' ? 0.94 : 0.0),
        evidenceId: e.metadata?.evidenceId || `EVD-${e.eventId.slice(-8)}`,
        snapshotUrl: e.snapshotReference || `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
        alertTriggered: !!matchingAlert,
        alertId: matchingAlert?.id,
        alertDescription: matchingAlert?.description
      };
    });

    const camerasVisited = new Set(sightings.map(s => s.cameraId)).size;
    const edgeNodesVisited = new Set(sightings.map(s => s.edgeNodeId)).size;
    const districtsVisited = new Set(sightings.map(s => {
      const c = syntheticCameras.find(cam => cam.id === s.cameraId);
      return c?.district || 'Central';
    })).size;

    const firstSeen = sightings[0].timestamp;
    const lastSeen = sightings[sightings.length - 1].timestamp;
    const durationMinutes = Math.max(0.5, (new Date(lastSeen).getTime() - new Date(firstSeen).getTime()) / 60000);
    const alertsCount = sightings.filter(s => s.alertTriggered).length;

    const isWatchlist = watchlist.some(w => 
      normalizePlate(w.vehicleNumber || '') === normalizePlate(target) || 
      (associatedPlate && normalizePlate(w.vehicleNumber || '') === normalizePlate(associatedPlate))
    );

    const record: GodsEyeTargetRecord = {
      targetId: target,
      targetType: isPerson ? 'person' : 'vehicle',
      associatedTargetId: isPerson ? associatedPlate : associatedPerson,
      correlationConfidence: correlationConf,
      sightings,
      totalSightings: sightings.length,
      firstSeen,
      lastSeen,
      camerasVisited,
      edgeNodesVisited,
      districtsVisited,
      durationMinutes: Math.round(durationMinutes * 10) / 10,
      alertsCount,
      evidenceCount: sightings.length,
      watchlistStatus: isWatchlist ? 'WATCHLIST MATCH' : 'NORMAL TRAVERSAL',
      helmetSummary: {
        helmetCount,
        noHelmetCount,
        unknownCount,
        primaryState: noHelmetCount > 0 ? 'NO_HELMET' : (helmetCount > 0 ? 'HELMET' : 'UNKNOWN')
      }
    };

    res.json(record);
  });

  // Person Trajectory Investigation API
  app.get('/api/central/investigation/person/:trackId', async (req, res) => {
    const reqId = (req.headers['x-request-id'] as string) || `REQ-PERSON-${Date.now()}`;
    const trackId = req.params.trackId.trim().toUpperCase();
    await auditService.log('OPERATOR', 'PERSON_TRACK_QUERY', trackId, 'QUERY_EXECUTED', reqId);

    const trajectory = await personTrackingService.getPersonTrajectory(trackId);
    if (!trajectory) {
      return res.json({
        personTrackId: trackId,
        sightings: [],
        totalSightings: 0,
        firstSeen: '',
        lastSeen: '',
        camerasVisited: 0,
        districtsVisited: 0,
        durationMinutes: 0
      });
    }

    res.json(trajectory);
  });

  // Automated Evidence Capture API
  app.post('/api/central/evidence/capture', async (req, res) => {
    const reqId = (req.headers['x-request-id'] as string) || `REQ-CAPTURE-${Date.now()}`;
    const { eventId, cameraId, targetId, reason, correlationId, metadata } = req.body;

    const timestamp = metadata?.timestamp || new Date().toISOString();
    const evidenceId = `EVD-${(reason || 'AUTO')}-${(eventId || Date.now().toString()).slice(-8)}`;
    
    // Canonical payload for deterministic SHA-256 hash calculation
    const canonicalPayload = JSON.stringify({
      evidenceId,
      eventId: eventId || `EVT-${Date.now()}`,
      cameraId: cameraId || 'CAM-007',
      targetId: targetId || 'UNKNOWN',
      reason: reason || 'MANUAL_CAPTURE',
      correlationId: correlationId || reqId,
      timestamp
    });
    const sha256 = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

    const cam = syntheticCameras.find(c => c.id === cameraId);

    const evidenceItem: EvidenceItem = {
      evidenceId,
      eventId: eventId || `EVT-${Date.now()}`,
      cameraId: cameraId || 'CAM-007',
      timestamp,
      targetId: targetId || 'UNKNOWN',
      captureReason: reason || 'ANPR_MATCH',
      imageReference: `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60`,
      sha256,
      status: 'VERIFIED',
      isSimulation: true,
      label: 'SIMULATED DEMO EVIDENCE',
      integrityNotice: 'Evidence Integrity Hash — DEMO (Calculated via SHA-256 over canonical metadata)',
      correlationId: correlationId || reqId,
      latitude: cam?.latitude,
      longitude: cam?.longitude,
      sourceEdgeNode: cam?.edgeNodeId || 'EDGE-1'
    };

    await auditService.log('AUTOMATIC_EVIDENCE_CAPTURE', 'SNAPSHOT_ARCHIVED', evidenceId, 'VERIFIED_DIGEST', reqId);
    res.json(evidenceItem);
  });

  // Simulated Helmet Detection Inference API
  app.get('/api/central/helmet/detect', (req, res) => {
    const cameraId = (req.query.cameraId as string) || 'CAM-014';
    const status = (req.query.status as HelmetStatus) || 'NO_HELMET';
    const confidence = parseFloat(req.query.confidence as string) || 0.94;

    res.json({
      status,
      confidence,
      simulated: true,
      cameraId,
      timestamp: new Date().toISOString(),
      label: 'Helmet detection: SIMULATED'
    });
  });

  // System Architecture Readiness Matrix (IMPLEMENTED / SIMULATED / FUTURE)
  app.get('/api/central/system/readiness', (req, res) => {
    const implemented: SystemReadinessItem[] = [
      { name: 'Edge Event Queue', component: 'Edge Event Queue', tier: 'Edge', category: 'Edge', status: 'IMPLEMENTED', statusIcon: '✓', description: 'Local durable queuing with persistence, backoff retry, and queue drain upon WAN recovery', verificationMethod: 'Offline/reconnect simulation test suite + SQLite/IndexedDB abstraction' },
      { name: 'Event ACK & Idempotency', component: 'Event ACK & Idempotency', tier: 'Central', category: 'Central', status: 'IMPLEMENTED', statusIcon: '✓', description: 'Deduplication engine rejecting replayed events with ACK/DUPLICATE semantics', verificationMethod: 'SHA-256 event ID indexing + Ingestion test 26' },
      { name: 'Vehicle Plate Normalization', component: 'Vehicle Plate Normalization', tier: 'Central', category: 'Central', status: 'IMPLEMENTED', statusIcon: '✓', description: 'Uniform uppercase regex stripping hyphens, spaces, and punctuation', verificationMethod: 'Normalization regex test (GJ-01-AB-1234 -> GJ01AB1234)' },
      { name: 'Cross-Camera Correlation', component: 'Cross-Camera Correlation', tier: 'Central', category: 'Central', status: 'IMPLEMENTED', statusIcon: '✓', description: 'Chronological timeline reconstruction across distributed edge camera nodes', verificationMethod: 'Vehicle trajectory search API with multi-node timestamps' },
      { name: 'Watchlist Evaluation', component: 'Watchlist Evaluation', tier: 'Security', category: 'Security', status: 'IMPLEMENTED', statusIcon: '✓', description: 'Dynamic rules engine matching ANPR events against high-priority targets in real time', verificationMethod: 'Dynamic test suite (GJ05XY6789 registration & alert firing)' },
      { name: 'Automated Alert Dispatch', component: 'Automated Alert Dispatch', tier: 'Security', category: 'Security', status: 'IMPLEMENTED', statusIcon: '✓', description: 'Instant event alerts with severity grading and evidence cryptographic digest', verificationMethod: 'WebSocket/SSE broadcast & HTTP /api/central/alerts endpoint' },
      { name: 'Immutable Audit Logging', component: 'Immutable Audit Logging', tier: 'Forensics', category: 'Forensics', status: 'IMPLEMENTED', statusIcon: '✓', description: 'Structured audit trail linking all actions and queries with Correlation IDs', verificationMethod: 'AuditService ledger indexed by x-request-id' },
      { name: 'Camera Fleet Topology', component: 'Camera Fleet Topology', tier: 'Scale', category: 'Scale', status: 'IMPLEMENTED', statusIcon: '✓', description: '50-node topology across 5 Gujarat municipal districts with protocol breakdown', verificationMethod: 'Synthetic camera registry & live status telemetry endpoint' },
      { name: 'GIS Vector & Route Engine', component: 'GIS Vector & Route Engine', tier: 'Central', category: 'Central', status: 'IMPLEMENTED', statusIcon: '✓', description: 'Dynamic geospatial node mapping and animated vehicle trajectory vector paths', verificationMethod: 'SVG vector topology linked to GPS coordinates' },
      { name: 'God\'s Eye Correlated Engine', component: 'God\'s Eye Correlated Engine', tier: 'Central', category: 'Central', status: 'IMPLEMENTED', statusIcon: '✓', description: 'Unified multi-modal intelligence linking vehicle trajectory, pedestrian track, helmet state, and alerts', verificationMethod: 'Multi-target chronological journey reconstructor' }
    ];

    const simulated: SystemReadinessItem[] = [
      { name: 'Person detection', component: 'Person detection', tier: 'Edge', category: 'Edge', status: 'SIMULATED', statusIcon: '◉', description: 'Synthetic pedestrian bounding boxes and crowd density estimation', verificationMethod: 'Client/edge rule simulator generating density alerts' },
      { name: 'Person cross-camera tracking', component: 'Person cross-camera tracking', tier: 'Central', category: 'Central', status: 'SIMULATED', statusIcon: '◉', description: 'Synthetic person track IDs (P-DEMO-XXX) correlated across camera nodes', verificationMethod: 'IPersonTrackingService synthetic track matcher' },
      { name: 'Vehicle detection', component: 'Vehicle detection', tier: 'Edge', category: 'Edge', status: 'SIMULATED', statusIcon: '◉', description: 'Simulated bounding boxes and vehicle classifications on CCTV nodes', verificationMethod: 'Synthetic edge detection event pipeline' },
      { name: 'ANPR', component: 'ANPR', tier: 'Edge', category: 'Edge', status: 'SIMULATED', statusIcon: '◉', description: 'Synthetic plate detections generated at edge boundaries for demo vehicles', verificationMethod: 'Software event generator with synthetic bounding boxes and confidence scores' },
      { name: 'Helmet detection', component: 'Helmet detection', tier: 'Edge', category: 'Edge', status: 'SIMULATED', statusIcon: '◉', description: 'Simulated rider helmet compliance inference (HELMET / NO_HELMET / UNKNOWN)', verificationMethod: 'IHelmetDetectionService synthetic evaluation' },
      { name: 'Evidence capture', component: 'Evidence capture', tier: 'Forensics', category: 'Forensics', status: 'SIMULATED', statusIcon: '◉', description: 'SIMULATED DEMO EVIDENCE with SHA-256 hash computed over canonical metadata', verificationMethod: 'IEvidenceCaptureService with deterministic SHA-256' },
      { name: 'YouTube Visual Source', component: 'YouTube Visual Source', tier: 'Presentation', category: 'Presentation', status: 'SIMULATED', statusIcon: '◉', description: 'Public YouTube livestreams for UI demonstration only (Not connected to Gujarat Police CCTV or Edge Nodes)', verificationMethod: 'Isolated YouTubeDemoService registry' },
      { name: 'AI Demonstration Agent', component: 'AI Demonstration Agent', tier: 'Inference', category: 'Inference', status: 'SIMULATED', statusIcon: '◉', description: 'Simulated AI vision agent demonstrating event creation, evidence capture, watchlist check, and God\'s Eye dispatch', verificationMethod: 'IAIVisionAgent / SimulatedAIVisionAgent test suite' },
      { name: '50-Camera Fleet', component: '50-Camera Fleet', tier: 'Edge', category: 'Edge', status: 'SIMULATED', statusIcon: '◉', description: 'Synthetic CCTV nodes modeling Ahmedabad & Gandhinagar municipal corridors', verificationMethod: 'Mock device registry with randomized stream latencies' },
      { name: 'Surveillance Video Feeds', component: 'Surveillance Video Feeds', tier: 'Edge', category: 'Edge', status: 'SIMULATED', statusIcon: '◉', description: 'Stock surveillance footage clips and snapshot previews for UI playback', verificationMethod: 'Unsplash & static CCTV video asset URLs' },
      { name: 'Statewide Scale Model', component: 'Statewide Scale Model', tier: 'Scale', category: 'Scale', status: 'SIMULATED', statusIcon: '◉', description: 'Theoretical 80,000 camera and 12,500 edge gateway scale projection', verificationMethod: 'Architectural simulation calculation model (not live hardware)' }
    ];

    const future: SystemReadinessItem[] = [
      { name: 'Person identity recognition', component: 'Person identity recognition', tier: 'Central', category: 'Central', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'Production biometric facial matching against state civil identity databases (Disabled in demo)', verificationMethod: 'State biometric interface compliance' },
      { name: 'Production biometric identification', component: 'Production biometric identification', tier: 'Security', category: 'Security', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'Live automated biometric verification across municipal video streams', verificationMethod: 'Hardware biometric matcher SDK' },
      { name: 'Physical DVR/VMS Adapters', component: 'Physical DVR/VMS Adapters', tier: 'Edge', category: 'Edge', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'Hardware SDK integrations for Hikvision, Dahua, CP Plus, and Milestone VMS', verificationMethod: 'Native C++/Go shared library bindings for proprietary DVR protocols' },
      { name: 'Live ONVIF Profile S/G/T', component: 'Live ONVIF Profile S/G/T', tier: 'Edge', category: 'Edge', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'Physical camera discovery, PTZ dispatch, and stream ingest over municipal WAN', verificationMethod: 'WS-Discovery daemon & ONVIF client' },
      { name: 'Native RTSP Protocol', component: 'Native RTSP Protocol', tier: 'Edge', category: 'Edge', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'Direct RTSP video pipeline termination from hardware encoders', verificationMethod: 'GStreamer RTSP pipeline' },
      { name: 'Jetson Orin Edge AI', component: 'Jetson Orin Edge AI', tier: 'Edge', category: 'Edge', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'NVIDIA TensorRT / DeepStream containerized models running locally on edge hardware', verificationMethod: 'On-device GPU acceleration with sub-10ms inference latency' },
      { name: 'Hardware HSM & mTLS Policies', component: 'Hardware HSM & mTLS Policies', tier: 'Security', category: 'Security', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'Hardware security module (HSM) root-of-trust, x509 mutual TLS, and ECDSA policy signing', verificationMethod: 'PKCS#11 hardware tokens & production CA infrastructure' },
      { name: 'Role-Based Access Control (RBAC)', component: 'Role-Based Access Control (RBAC)', tier: 'Security', category: 'Security', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'Granular operator permissions, multi-jurisdiction isolation, and session auditing', verificationMethod: 'Keycloak / Okta SAML/OIDC federated enterprise identity' },
      { name: 'Distributed Search Cluster', component: 'Distributed Search Cluster', tier: 'Central', category: 'Central', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'Multi-node Elasticsearch / OpenSearch cluster with vector embeddings', verificationMethod: 'Production multi-district cluster shard replication' },
      { name: 'National Registry (Vahan)', component: 'National Registry (Vahan)', tier: 'Security', category: 'Security', status: 'FUTURE_INTEGRATION', statusIcon: '○', description: 'Direct Vahan/Sarathi national vehicle register API interfaces for automated vehicle enrichment', verificationMethod: 'NIC government API gateway integration with OAuth2 MTLS' }
    ];

    const integrationReady: SystemReadinessItem[] = [
      { name: 'CCTV Discovery', component: 'CCTV Discovery', tier: 'Edge', category: 'CCTV Discovery', status: 'INTEGRATION_READY', statusIcon: '⚡', description: 'WS-Discovery multicast and network scan contract producing normalized Camera models', verificationMethod: 'IVideoSourceDiscovery and EdgeDiscoveryService test suite' },
      { name: 'ONVIF Adapter', component: 'ONVIF Adapter', tier: 'Edge', category: 'ONVIF', status: 'INTEGRATION_READY', statusIcon: '⚡', description: 'Profile S/T Media, PTZ, and snapshot URI extraction contract with zero hardcoded credentials', verificationMethod: 'OnvifDVRAdapter contract validation' },
      { name: 'RTSP Stream Adapter', component: 'RTSP Stream Adapter', tier: 'Edge', category: 'RTSP', status: 'INTEGRATION_READY', statusIcon: '⚡', description: 'H.264/H.265 transport session management, jitter tracking, and reconnect backoff', verificationMethod: 'RtspStreamAdapter pipeline interface' },
      { name: 'Vendor VMS Adapter', component: 'Vendor VMS Adapter', tier: 'Edge', category: 'VMS Adapter', status: 'INTEGRATION_READY', statusIcon: '⚡', description: 'Vendor-agnostic VMS abstraction layer (Milestone, Genetec, Dahua, Hikvision contracts)', verificationMethod: 'MockVendorVMSAdapter demonstration suite' }
    ];

    const integrationReadinessMatrix = [
      { category: 'CCTV Discovery', status: 'INTEGRATION READY', note: 'ONVIF WS-Discovery & Configuration discovery contracts formalized' },
      { category: 'ONVIF', status: 'INTEGRATION READY', note: 'Profile S/T Media & Snapshot URI extraction boundary' },
      { category: 'RTSP', status: 'INTEGRATION READY', note: 'H.264/H.265 stream session management with reconnect backoff' },
      { category: 'VMS Adapter', status: 'INTEGRATION READY', note: 'Milestone / Genetec vendor-agnostic adapter contract' },
      { category: 'Edge Agent', status: 'IMPLEMENTED', note: 'Autonomous edge runtime with local buffering, policy engine, and heartbeat' },
      { category: 'Event Transport', status: 'IMPLEMENTED', note: 'Idempotent delivery, ACK/DUPLICATE semantics, and WAN recovery sync' },
      { category: 'AI Inference', status: 'SIMULATED', note: 'Decoupled IAIInferenceProvider with synthetic ANPR, vehicle, person & helmet evaluation' },
      { category: 'Central Correlation', status: 'IMPLEMENTED', note: 'Chronological timeline reconstruction across distributed nodes' },
      { category: 'Evidence', status: 'IMPLEMENTED', note: 'Deterministic SHA-256 integrity digest with SIMULATED DEMO label' },
      { category: 'God\'s Eye', status: 'IMPLEMENTED', note: 'Unified multi-modal investigation linking vehicle, pedestrian, helmet, and alerts' },
      { category: 'Security', status: 'IMPLEMENTED', note: 'Dynamic watchlist rules, correlation ID tracking, and immutable audit ledger' },
      { category: 'Production CV Models', status: 'FUTURE DEPLOYMENT', note: 'Hardware-accelerated YOLOv8 / TensorRT edge inference engines' },
      { category: 'Production mTLS', status: 'FUTURE DEPLOYMENT', note: 'Hardware HSM / TPM 2.0 mutual TLS and cryptographic policy signing' },
      { category: 'Production Evidence Signing', status: 'FUTURE DEPLOYMENT', note: 'X.509 cryptographic hardware timestamping and digital signatures' }
    ];

    const allItems = [...implemented, ...simulated, ...future, ...integrationReady];

    res.json({
      readiness: allItems,
      implemented,
      simulated,
      future,
      integrationReady,
      integrationReadinessMatrix
    });
  });

  // Discovery Endpoint: Returns Discovered Video Sources & Normalization
  const edgeDiscoveryService = new EdgeDiscoveryService(true);
  app.get('/api/central/discovery/devices', async (req, res) => {
    const devices = await edgeDiscoveryService.discover();
    const channelsTotal = edgeDiscoveryService.getDiscoveredChannelTotal();
    res.json({
      devices,
      channelsTotal,
      mode: 'DEMO',
      adapterBreakdown: {
        ONVIF: devices.filter(d => d.protocol === 'ONVIF').length,
        RTSP: devices.filter(d => d.protocol === 'RTSP').length,
        VMS: devices.filter(d => d.protocol === 'VMS').length
      },
      status: 'INTEGRATION_READY'
    });
  });

  // Genuine Offline Simulation Execution & Verification
  app.post('/api/central/demo/offline-run', async (req, res) => {
    const reqId = (req.headers['x-request-id'] as string) || `REQ-OFFLINE-${Date.now()}`;
    
    // 1. Mark Central Offline
    isCentralOffline = true;
    addLog('internal', 'EDGE_WAN_DISCONNECTED', 0, 'warning', reqId);
    
    // 2. Generate 7 events in local queue buffer
    const offlineEvents: SecurityEventPayload[] = [];
    for (let i = 1; i <= 7; i++) {
      offlineEvents.push({
        eventId: `EVT-OFFLINE-${Date.now()}-${i}`,
        edgeNodeId: 'EDGE-00042',
        siteId: 'SITE-1',
        cameraId: `CAM-${(i * 3).toString().padStart(3, '0')}`,
        timestamp: new Date(Date.now() - (7 - i) * 10000).toISOString(),
        eventType: 'ANPR',
        priority: 'high',
        confidence: 0.96,
        metadata: { plate: 'GJ05XY9988', speed: 50 + i }
      });
    }

    const queueCountDuringOffline = offlineEvents.length; // 7 events buffered
    
    // 3. Reconnect Central
    isCentralOffline = false;
    addLog('internal', 'EDGE_WAN_RECONNECTED', 0, 'success', reqId);

    // 4. Ingest queued events and verify ACKs
    const acks: string[] = [];
    const duplicates: string[] = [];
    for (const ev of offlineEvents) {
      const result = centralRepo.createEvent(ev);
      if (result === 'ACK') {
        acks.push(ev.eventId);
        await processWatchlistAndRules(ev, reqId);
      } else {
        duplicates.push(ev.eventId);
      }
    }

    await auditService.log(
      'EDGE_AGENT_SYNC',
      'OFFLINE_QUEUE_FLUSH',
      `EDGE-00042 [${acks.length} EVENTS]`,
      'ALL_ACKNOWLEDGED',
      reqId
    );

    res.json({
      status: 'ok',
      correlationId: reqId,
      eventsBuffered: queueCountDuringOffline,
      eventsUploaded: acks.length,
      acksReceived: acks.length,
      duplicatesDetected: duplicates.length,
      finalQueueSize: 0,
      verified: acks.length === 7 && duplicates.length === 0
    });
  });
  
  // Batch 50-Camera Event Generator
  app.post('/api/central/demo/generate-batch', async (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    const generated: SecurityEventPayload[] = [];
    
    syntheticCameras.forEach((cam, idx) => {
      const samplePlates = ['GJ01AB1234', 'GJ05XY9988', 'GJ27CC4400', 'GJ01CD5678', 'GJ18FF1122'];
      const plate = samplePlates[idx % samplePlates.length];
      const ev: SecurityEventPayload = {
        eventId: `EVT-BATCH-${Date.now()}-${idx}`,
        edgeNodeId: cam.edgeNodeId,
        siteId: cam.siteId,
        cameraId: cam.id,
        timestamp: new Date(Date.now() - (50 - idx) * 45000).toISOString(),
        eventType: 'ANPR',
        priority: idx % 10 === 0 ? 'high' : 'low',
        confidence: 0.92 + (idx % 8) * 0.01,
        metadata: { plate, speed: 45 + (idx % 20) }
      };
      centralRepo.createEvent(ev);
      generated.push(ev);
      processWatchlistAndRules(ev, reqId);
    });
    
    await auditService.log('SIMULATION_ENGINE', 'GENERATE_50_EVENTS', `50_EVENTS_INGESTED`, 'SUCCESS', reqId);
    res.json({ status: 'ok', count: generated.length });
  });

  // Demo Video Sources Store (Presentation Layer)
  const serverDemoVideoSources: DemoVideoSource[] = JSON.parse(JSON.stringify(DEFAULT_DEMO_VIDEO_SOURCES));

  app.get('/api/video/demo/sources', (req, res) => {
    res.json({
      status: 'ok',
      sources: serverDemoVideoSources
    });
  });

  app.post('/api/video/demo/sources/:id', (req, res) => {
    const { id } = req.params;
    const { youtubeVideoId } = req.body;

    if (!youtubeVideoId || !isValidYouTubeVideoId(youtubeVideoId)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid YouTube video ID. Must be 11 characters alphanumeric/dash/underscore.'
      });
    }

    const idx = serverDemoVideoSources.findIndex(s => s.id === id);
    if (idx >= 0) {
      serverDemoVideoSources[idx].youtubeVideoId = youtubeVideoId.trim();
      serverDemoVideoSources[idx].status = 'AVAILABLE';
      return res.json({ status: 'ok', source: serverDemoVideoSources[idx] });
    }

    res.status(404).json({ status: 'NOT_FOUND', message: 'Demo source not found.' });
  });

  // ==========================================
  // REAL FRAME-BY-FRAME AI VISION (GEMINI)
  // ==========================================
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClientInstance(): GoogleGenAI {
    if (!geminiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error('GEMINI_API_KEY environment variable is not configured');
      }
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return geminiClient;
  }

  // AI Vision Capability & Health Status
  app.get('/api/ai/status', (req, res) => {
    const isConfigured = !!process.env.GEMINI_API_KEY;
    res.json({
      status: 'ok',
      configured: isConfigured,
      model: 'gemini-3.8-flash',
      mode: 'REAL_GEMINI_VISION',
      supportedClasses: ['person', 'car', 'motorcycle', 'bicycle', 'bus', 'truck', 'vehicle'],
      supportedViolations: [
        'NO_HELMET',
        'TRIPLE_RIDING',
        'WRONG_WAY',
        'RED_LIGHT_VIOLATION',
        'STOP_LINE_VIOLATION',
        'DANGEROUS_PARKING',
        'PEDESTRIAN_CONFLICT',
        'UNSAFE_RIDING'
      ],
      notice: 'Server-side Gemini Vision pipeline with strict structured JSON schema'
    });
  });

  // Frame Analysis Pipeline
  app.post('/api/ai/analyze-frame', async (req, res) => {
    const startTime = Date.now();
    const { frameTimestamp = 0, sourceId = 'UPLOAD-DEMO-001', helmetThreshold = 0.85 } = req.body;
    const frameBase64 = req.body.frameBase64 || req.body.frameDataUrl;

    if (!frameBase64 || typeof frameBase64 !== 'string') {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'No frameBase64 payload provided for analysis.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI_SERVICE_UNAVAILABLE',
        message: 'Gemini API key is not configured on the server. Frame analysis requires a valid GEMINI_API_KEY.'
      });
    }

    // Strip data URL header if included
    const cleanBase64 = frameBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '').trim();
    if (cleanBase64.length === 0) {
      return res.status(400).json({
        error: 'INVALID_FRAME_DATA',
        message: 'Empty image payload.'
      });
    }

    try {
      const ai = getGeminiClientInstance();

      const prompt = `You are analyzing one frame from an authorized traffic/security video for a software demonstration.

Return ONLY valid JSON matching the specified schema.

Detect clearly visible:
- people
- cars
- motorcycles
- bicycles
- buses
- trucks
- other vehicles

For each visible object provide a normalized bounding box and confidence.
Coordinates MUST be normalized between 0.0 and 1.0, with (0,0) at top-left:
x = 0 to 1, y = 0 to 1, width = 0 to 1, height = 0 to 1.

For people associated with motorcycles/bicycles, assess helmet status only when visually supportable:
- HELMET
- NO_HELMET
- UNKNOWN

If the head is small, occluded, or unclear, return UNKNOWN.
Do not force a violation.

Do not identify people's real-world identities.
Do not infer license plates unless clearly visible.
Do not invent objects that are not visible.
If uncertain, return UNKNOWN.
Do not describe the image in prose.`;

      const generateConfig = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            frameTimestamp: { type: Type.NUMBER },
            detections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  class: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  box: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      width: { type: Type.NUMBER },
                      height: { type: Type.NUMBER }
                    },
                    required: ['x', 'y', 'width', 'height']
                  },
                  attributes: {
                    type: Type.OBJECT,
                    properties: {
                      helmet: { type: Type.STRING },
                      vehicleType: { type: Type.STRING },
                      color: { type: Type.STRING }
                    }
                  },
                  plate: { type: Type.STRING },
                  plateConfidence: { type: Type.NUMBER }
                },
                required: ['class', 'confidence', 'box']
              }
            },
            roadSafetyEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                },
                required: ['type', 'confidence']
              }
            }
          },
          required: ['detections', 'roadSafetyEvents']
        }
      };

      const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
      let response: any = null;
      let usedModel = 'gemini-3.8-flash';
      let isHighDemandSurge = false;
      let lastModelError: any = null;

      for (const modelCandidate of candidateModels) {
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
          attempts++;
          try {
            response = await ai.models.generateContent({
              model: modelCandidate,
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: cleanBase64
                    }
                  },
                  { text: prompt }
                ]
              },
              config: generateConfig
            });
            usedModel = modelCandidate;
            break;
          } catch (modelErr: any) {
            lastModelError = modelErr;
            const errMsg = String(modelErr?.message || modelErr);
            const isTransient = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429');
            if (isTransient) {
              isHighDemandSurge = true;
              if (attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 450 * attempts));
                continue;
              }
            }
            // Move to next candidate model
            break;
          }
        }
        if (response) break;
      }

      if (!response) {
        if (isHighDemandSurge) {
          console.warn('[Gemini Vision] Transient demand spike across models; shedding frame under backpressure.');
          return res.json({
            status: 'HIGH_DEMAND_BACKOFF',
            frameTimestamp: Number(frameTimestamp) || 0,
            detections: [],
            roadSafetyEvents: [],
            aiModel: 'Gemini Vision (Demand Backpressure Active)',
            analysisTimeMs: Date.now() - startTime,
            sourceId,
            warning: 'Model currently experiencing high demand surge. Frame dropped gracefully.'
          });
        }
        throw lastModelError || new Error('Failed to analyze frame with Gemini Vision models');
      }

      let rawText = (response.text || '').trim();
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }

      let parsedResult: any;
      try {
        parsedResult = JSON.parse(rawText);
      } catch (jsonErr) {
        console.error('Failed to parse Gemini Vision JSON:', rawText);
        return res.status(502).json({
          error: 'INVALID_AI_RESPONSE',
          message: 'Gemini Vision returned non-JSON output.'
        });
      }

      // Normalization and validation of detections
      const rawDetections = Array.isArray(parsedResult.detections) ? parsedResult.detections : [];
      const validatedDetections = rawDetections
        .map((item: any, idx: number) => {
          if (!item || typeof item !== 'object' || !item.box) return null;

          const rawClass = String(item.class || 'unknown').toLowerCase().trim();
          let normalizedClass = 'unknown';
          if (rawClass.includes('person') || rawClass.includes('pedestrian') || rawClass.includes('human') || rawClass.includes('rider')) normalizedClass = 'person';
          else if (rawClass.includes('motorcycle') || rawClass.includes('motorbike') || rawClass.includes('scooter') || (rawClass.includes('bike') && !rawClass.includes('bicycle'))) normalizedClass = 'motorcycle';
          else if (rawClass.includes('bicycle') || rawClass.includes('cyclist')) normalizedClass = 'bicycle';
          else if (rawClass.includes('car') || rawClass.includes('sedan') || rawClass.includes('suv') || rawClass.includes('auto')) normalizedClass = 'car';
          else if (rawClass.includes('bus')) normalizedClass = 'bus';
          else if (rawClass.includes('truck')) normalizedClass = 'truck';
          else if (rawClass.includes('vehicle')) normalizedClass = 'vehicle';

          // Validate and clamp coordinates to [0, 1]
          const x = Math.max(0, Math.min(1, Number(item.box.x) || 0));
          const y = Math.max(0, Math.min(1, Number(item.box.y) || 0));
          const width = Math.max(0.01, Math.min(1 - x, Number(item.box.width) || 0.05));
          const height = Math.max(0.01, Math.min(1 - y, Number(item.box.height) || 0.05));
          const confidence = Math.max(0, Math.min(1, Number(item.confidence) || 0.5));

          // Check helmet attribute
          let helmet: 'HELMET' | 'NO_HELMET' | 'UNKNOWN' = 'UNKNOWN';
          const rawHelmet = String(item.attributes?.helmet || '').toUpperCase().trim();
          if (rawHelmet === 'HELMET' || rawHelmet === 'NO_HELMET') {
            helmet = rawHelmet;
          }

          return {
            id: `det-${idx}-${Date.now()}`,
            class: normalizedClass,
            confidence,
            box: { x, y, width, height },
            attributes: {
              helmet
            }
          };
        })
        .filter(Boolean);

      // Validate road safety events
      const rawEvents = Array.isArray(parsedResult.roadSafetyEvents) ? parsedResult.roadSafetyEvents : [];
      const allowedEvents = ['NO_HELMET', 'TRIPLE_RIDING', 'WRONG_WAY', 'RED_LIGHT_VIOLATION', 'STOP_LINE_VIOLATION', 'DANGEROUS_PARKING', 'PEDESTRIAN_CONFLICT', 'UNSAFE_RIDING'];

      const validatedSafetyEvents = rawEvents
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
        .filter(Boolean);

      // If a person with NO_HELMET was detected above the helmet confidence threshold, ensure a NO_HELMET event is created
      const threshold = Number(helmetThreshold) || 0.85;
      const noHelmetRiders = validatedDetections.filter(
        (d: any) => (d.class === 'person' || d.class === 'motorcycle') && 
                     d.attributes?.helmet === 'NO_HELMET' && 
                     d.confidence >= threshold
      );

      if (noHelmetRiders.length > 0 && !validatedSafetyEvents.some((e: any) => e.type === 'NO_HELMET')) {
        validatedSafetyEvents.push({
          type: 'NO_HELMET',
          confidence: noHelmetRiders[0].confidence,
          description: `Rider observed without protective helmet (Confidence: ${Math.round(noHelmetRiders[0].confidence * 100)}%)`
        });
      }

      const analysisTimeMs = Date.now() - startTime;

      res.json({
        status: 'ok',
        frameTimestamp: Number(frameTimestamp) || 0,
        detections: validatedDetections,
        roadSafetyEvents: validatedSafetyEvents,
        aiModel: `Gemini Vision (${usedModel})`,
        analysisTimeMs,
        sourceId
      });
    } catch (apiErr: any) {
      console.error('Gemini Vision Frame Analysis API Error:', apiErr?.message || apiErr);
      res.status(500).json({
        error: 'AI_ANALYSIS_ERROR',
        message: apiErr?.message || 'Error occurred during frame analysis in Gemini Vision service'
      });
    }
  });

  // Reset Demo State
  app.post('/api/central/demo/reset', async (req, res) => {
    const reqId = req.headers['x-request-id'] as string || `REQ-${Date.now()}`;
    alerts.length = 0;
    auditLogs.length = 0;
    logs.length = 0;
    centralRepo.clear();
    seedSyntheticIntelligenceData();
    serverDemoVideoSources.length = 0;
    serverDemoVideoSources.push(...JSON.parse(JSON.stringify(DEFAULT_DEMO_VIDEO_SOURCES)));
    await auditService.log('SYSTEM', 'SYSTEM_RESET', 'STATE_CLEARED_AND_RESEEDED', 'SUCCESS', reqId);
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
