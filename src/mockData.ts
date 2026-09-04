import { Camera, Alert, DetectionEvent, WatchlistTarget, EdgeNode, SecurityRule, CommLogEntry } from './types';

export const mockNodes: EdgeNode[] = [
  { 
    id: 'EDGE-GJ-001', 
    siteId: 'GJ-AHMEDABAD-001', 
    status: 'online', 
    ipAddress: '10.14.20.101', 
    camerasConnected: 16, 
    dvrCount: 2,
    lastHeartbeat: new Date().toISOString(), 
    version: 'v0.7.2',
    deviceCertificateId: 'cert-8f92a-ahmedabad-01',
    capabilities: ['anpr', 'person_tracking', 'helmet_detection', 'local_recording'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    lastSeenAt: new Date().toISOString(),
    queuedEvents: 0,
    syncState: 'synchronized',
    lastConfigUpdate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    policyVersion: 'pol-v2.1.4',
    securityState: 'secure'
  },
  { 
    id: 'EDGE-GJ-002', 
    siteId: 'GJ-SURAT-002', 
    status: 'online', 
    ipAddress: '10.14.22.45', 
    camerasConnected: 14, 
    dvrCount: 2,
    lastHeartbeat: new Date().toISOString(), 
    version: 'v0.7.2',
    deviceCertificateId: 'cert-2c49b-surat-02',
    capabilities: ['anpr', 'helmet_detection', 'local_recording'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    lastSeenAt: new Date().toISOString(),
    queuedEvents: 2,
    syncState: 'synchronized',
    lastConfigUpdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    policyVersion: 'pol-v2.1.3',
    securityState: 'secure'
  },
  { 
    id: 'EDGE-GJ-003', 
    siteId: 'GJ-VADODARA-003', 
    status: 'online', 
    ipAddress: '10.14.24.88', 
    camerasConnected: 12, 
    dvrCount: 2,
    lastHeartbeat: new Date().toISOString(), 
    version: 'v0.7.2',
    deviceCertificateId: 'cert-77a1d-vadodara-03',
    capabilities: ['anpr', 'person_tracking', 'local_recording'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    lastSeenAt: new Date().toISOString(),
    queuedEvents: 0,
    syncState: 'synchronized',
    lastConfigUpdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    policyVersion: 'pol-v2.1.4',
    securityState: 'secure'
  },
  { 
    id: 'EDGE-GJ-004', 
    siteId: 'GJ-RAJKOT-004', 
    status: 'online', 
    ipAddress: '10.14.26.12', 
    camerasConnected: 8, 
    dvrCount: 1,
    lastHeartbeat: new Date().toISOString(), 
    version: 'v0.7.1',
    deviceCertificateId: 'cert-99b3c-rajkot-04',
    capabilities: ['anpr', 'local_recording'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    lastSeenAt: new Date().toISOString(),
    queuedEvents: 0,
    syncState: 'synchronized',
    lastConfigUpdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    policyVersion: 'pol-v2.1.2',
    securityState: 'secure'
  },
];

export const mockCommLogs: CommLogEntry[] = [
  { id: 'log-1', timestamp: new Date(Date.now() - 1000 * 2).toISOString(), direction: 'inbound', type: 'Heartbeat', payloadSize: 256, status: 'success' },
  { id: 'log-2', timestamp: new Date(Date.now() - 1000 * 15).toISOString(), direction: 'inbound', type: 'SecurityEvent', payloadSize: 1024, status: 'success' },
  { id: 'log-3', timestamp: new Date(Date.now() - 1000 * 45).toISOString(), direction: 'outbound', type: 'Command', payloadSize: 512, status: 'success' },
  { id: 'log-4', timestamp: new Date(Date.now() - 1000 * 120).toISOString(), direction: 'inbound', type: 'Heartbeat', payloadSize: 256, status: 'success' },
  { id: 'log-5', timestamp: new Date(Date.now() - 1000 * 180).toISOString(), direction: 'outbound', type: 'PolicyDeployment', payloadSize: 4096, status: 'failed' },
  { id: 'log-6', timestamp: new Date(Date.now() - 1000 * 240).toISOString(), direction: 'inbound', type: 'Heartbeat', payloadSize: 256, status: 'success' },
];

export const mockRules: SecurityRule[] = [
  {
    id: 'R-1042',
    name: 'Nighttime Restricted Vehicle Corridor',
    targetNode: 'EDGE-GJ-001',
    condition: {
      object: 'vehicle',
      zone: 'sg_highway_corridor',
      time: '22:00-06:00'
    },
    action: {
      event: 'restricted_vehicle',
      priority: 'high'
    }
  },
  {
    id: 'R-1043',
    name: 'Critical Infrastructure Perimeter Breach',
    targetNode: 'ALL',
    condition: {
      object: 'person',
      zone: 'control_center_entrance',
      time: '00:00-23:59'
    },
    action: {
      event: 'critical_intrusion',
      priority: 'critical'
    }
  }
];

export const mockCameras: Camera[] = [
  { id: 'CAM-007', name: 'SG Highway Junction North', location: 'Ahmedabad - SG Highway', status: 'online', lastActive: new Date().toISOString(), mapX: 25, mapY: 35, district: 'Ahmedabad', edgeNodeId: 'EDGE-GJ-001' },
  { id: 'CAM-014', name: 'Ashram Road Transit Hub', location: 'Ahmedabad - Ashram Road', status: 'online', lastActive: new Date().toISOString(), mapX: 45, mapY: 40, district: 'Ahmedabad', edgeNodeId: 'EDGE-GJ-001' },
  { id: 'CAM-023', name: 'Sindhu Bhavan Toll Plaza', location: 'Ahmedabad - Sindhu Bhavan', status: 'warning', lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(), mapX: 65, mapY: 55, district: 'Ahmedabad', edgeNodeId: 'EDGE-GJ-001' },
  { id: 'CAM-031', name: 'Ring Road Express Interchange', location: 'Ahmedabad - Ring Road', status: 'online', lastActive: new Date().toISOString(), mapX: 80, mapY: 70, district: 'Ahmedabad', edgeNodeId: 'EDGE-GJ-001' },
  { id: 'CAM-042', name: 'Surat Textile Market Gate 1', location: 'Surat - Ring Road', status: 'online', lastActive: new Date().toISOString(), mapX: 30, mapY: 80, district: 'Surat', edgeNodeId: 'EDGE-GJ-002' },
  { id: 'CAM-048', name: 'Vadodara Alkapuri Circle', location: 'Vadodara - Alkapuri', status: 'offline', lastActive: new Date(Date.now() - 1000 * 60 * 45).toISOString(), mapX: 75, mapY: 25, district: 'Vadodara', edgeNodeId: 'EDGE-GJ-003' },
];

export const mockWatchlist: WatchlistTarget[] = [
  {
    id: 'tgt-01',
    name: 'Synthetic Subject Bravo (GJ05XY6789)',
    imageUrl: 'https://images.unsplash.com/photo-1549424888-c92eb295ff68?auto=format&fit=crop&q=80&w=200&h=200',
    threatLevel: 'high',
    associatedPlate: 'GJ05XY6789',
    lastKnownAttire: 'Dark jacket, helmet violation flag',
    dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'tgt-02',
    name: 'Synthetic Subject Alpha (GJ01AB1234)',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    threatLevel: 'critical',
    associatedPlate: 'GJ01AB1234',
    lastKnownAttire: 'Black hoodie, tracked trajectory P-DEMO-001',
    dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  }
];

export const mockAlerts: Alert[] = [
  {
    id: 'alt-01',
    type: 'watchlist',
    severity: 'critical',
    cameraId: 'CAM-014',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    description: 'Synthetic Watchlist Vehicle GJ01AB1234 matched on CAM-014 (Ashram Road).',
    isRead: false,
    snapshotUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=400&h=250'
  },
  {
    id: 'alt-02',
    type: 'helmet_violation',
    severity: 'medium',
    cameraId: 'CAM-023',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    description: 'No helmet detected on two-wheeler rider at Sindhu Bhavan Toll.',
    isRead: false,
    snapshotUrl: 'https://images.unsplash.com/photo-1549424888-c92eb295ff68?auto=format&fit=crop&q=80&w=400&h=250'
  },
  {
    id: 'alt-03',
    type: 'speed_violation',
    severity: 'high',
    cameraId: 'CAM-007',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    description: 'Vehicle GJ05XY6789 exceeded arterial limit (88 km/h in 60 km/h zone).',
    isRead: true,
    snapshotUrl: 'https://images.unsplash.com/photo-1517026575980-3e1e2dedeab4?auto=format&fit=crop&q=80&w=400&h=250'
  }
];

export const mockDetections: DetectionEvent[] = [
  {
    id: 'det-001',
    cameraId: 'CAM-007',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    objectType: 'vehicle',
    confidence: 0.98,
    metadata: {
      plate: 'GJ01AB1234',
      vehicleType: 'Sedan',
      vehicleColor: 'White'
    },
    snapshotUrl: 'https://images.unsplash.com/photo-1517026575980-3e1e2dedeab4?auto=format&fit=crop&q=80&w=400&h=250'
  },
  {
    id: 'det-002',
    cameraId: 'CAM-014',
    timestamp: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    objectType: 'vehicle',
    confidence: 0.96,
    metadata: {
      plate: 'GJ01AB1234',
      vehicleType: 'Sedan',
      vehicleColor: 'White'
    },
    snapshotUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=400&h=250'
  },
  {
    id: 'det-003',
    cameraId: 'CAM-023',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    objectType: 'vehicle',
    confidence: 0.94,
    metadata: {
      plate: 'GJ01AB1234',
      vehicleType: 'Sedan',
      vehicleColor: 'White'
    },
    snapshotUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=400&h=250'
  },
  {
    id: 'det-004',
    cameraId: 'CAM-031',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    objectType: 'vehicle',
    confidence: 0.97,
    metadata: {
      plate: 'GJ01AB1234',
      vehicleType: 'Sedan',
      vehicleColor: 'White'
    },
    snapshotUrl: 'https://images.unsplash.com/photo-1549424888-c92eb295ff68?auto=format&fit=crop&q=80&w=400&h=250'
  },
];
