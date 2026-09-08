import {
  CameraTopologyNode,
  CameraTopologyEdge,
  TrajectoryTransition,
  DownstreamPrediction,
} from '../types';

export class CameraTopologyService {
  private static instance: CameraTopologyService;
  private nodes: Map<string, CameraTopologyNode> = new Map();
  private edges: Map<string, CameraTopologyEdge[]> = new Map();

  private constructor() {
    this.seedTopologyGraph();
  }

  public static getInstance(): CameraTopologyService {
    if (!CameraTopologyService.instance) {
      CameraTopologyService.instance = new CameraTopologyService();
    }
    return CameraTopologyService.instance;
  }

  private seedTopologyGraph(): void {
    const defaultNodes: CameraTopologyNode[] = [
      {
        cameraId: 'CAM-007',
        name: 'SG Highway - Pakwan Cross Junction (Eastbound)',
        latitude: 23.0372,
        longitude: 72.5123,
        heading: 90, // Eastbound
        roadSegmentId: 'SEG-SGH-01',
        junctionId: 'JNC-PAKWAN-01',
        junctionName: 'Pakwan Cross Junction',
        district: 'Ahmedabad',
        direction: 'Eastbound',
        speedLimitKmh: 60,
        roadType: 'ARTERIAL_CITY',
        incomingConnections: ['CAM-002', 'CAM-003'],
        outgoingConnections: ['CAM-014', 'CAM-008', 'CAM-011'],
      },
      {
        cameraId: 'CAM-014',
        name: 'SG Highway - Thaltej Underpass North Entrance',
        latitude: 23.0515,
        longitude: 72.5189,
        heading: 15, // North-Northeast
        roadSegmentId: 'SEG-SGH-02',
        junctionId: 'JNC-THALTEJ-01',
        junctionName: 'Thaltej Underpass Flyover',
        district: 'Ahmedabad',
        direction: 'Northbound',
        speedLimitKmh: 70,
        roadType: 'STATE_HIGHWAY',
        incomingConnections: ['CAM-007'],
        outgoingConnections: ['CAM-023', 'CAM-031', 'CAM-009'],
      },
      {
        cameraId: 'CAM-023',
        name: 'SG Highway - Vaishnodevi Circle Intercept',
        latitude: 23.1189,
        longitude: 72.5421,
        heading: 10, // North
        roadSegmentId: 'SEG-SGH-03',
        junctionId: 'JNC-VAISHNODEVI-01',
        junctionName: 'Vaishnodevi Circular Interchange',
        district: 'Ahmedabad',
        direction: 'Northbound',
        speedLimitKmh: 80,
        roadType: 'NATIONAL_HIGHWAY',
        incomingConnections: ['CAM-014'],
        outgoingConnections: ['CAM-031', 'CAM-025', 'CAM-027'],
      },
      {
        cameraId: 'CAM-031',
        name: 'Gandhinagar Access Toll Approach (NH-147)',
        latitude: 23.1892,
        longitude: 72.5834,
        heading: 25, // North-East
        roadSegmentId: 'SEG-GNR-01',
        junctionId: 'JNC-TOLL-01',
        junctionName: 'Gandhinagar Central Entry Plaza',
        district: 'Gandhinagar',
        direction: 'Northeast',
        speedLimitKmh: 80,
        roadType: 'NATIONAL_HIGHWAY',
        incomingConnections: ['CAM-023', 'CAM-014'],
        outgoingConnections: ['CAM-032', 'CAM-035'],
      },
      {
        cameraId: 'CAM-008',
        name: 'Sindhu Bhavan Road Westward Branch',
        latitude: 23.0410,
        longitude: 72.5050,
        heading: 270, // West
        roadSegmentId: 'SEG-SBR-01',
        junctionId: 'JNC-PAKWAN-01',
        junctionName: 'Pakwan Cross Junction',
        district: 'Ahmedabad',
        direction: 'Westbound',
        speedLimitKmh: 50,
        roadType: 'ARTERIAL_CITY',
        incomingConnections: ['CAM-007'],
        outgoingConnections: ['CAM-018'],
      },
      {
        cameraId: 'CAM-009',
        name: 'Science City Road Interchange East',
        latitude: 23.0720,
        longitude: 72.5110,
        heading: 310,
        roadSegmentId: 'SEG-SCI-01',
        junctionId: 'JNC-THALTEJ-01',
        junctionName: 'Science City Connector',
        district: 'Ahmedabad',
        direction: 'Northwest',
        speedLimitKmh: 60,
        roadType: 'ARTERIAL_CITY',
        incomingConnections: ['CAM-014'],
        outgoingConnections: ['CAM-021'],
      },
    ];

    for (const node of defaultNodes) {
      this.nodes.set(node.cameraId, node);
    }

    // Edges with realistic distances, speeds and deterministic route likelihoods
    const defaultEdges: Record<string, CameraTopologyEdge[]> = {
      'CAM-007': [
        {
          sourceCameraId: 'CAM-007',
          targetCameraId: 'CAM-014',
          distanceMeters: 1850,
          expectedTransitTimeSec: 120, // 2 mins at ~55 km/h
          averageSpeedKmh: 55.5,
          historicalRouteShare: 0.78,
        },
        {
          sourceCameraId: 'CAM-007',
          targetCameraId: 'CAM-008',
          distanceMeters: 920,
          expectedTransitTimeSec: 80,
          averageSpeedKmh: 41.4,
          historicalRouteShare: 0.22,
        },
      ],
      'CAM-014': [
        {
          sourceCameraId: 'CAM-014',
          targetCameraId: 'CAM-023',
          distanceMeters: 7800,
          expectedTransitTimeSec: 420, // 7 mins at ~67 km/h
          averageSpeedKmh: 66.8,
          historicalRouteShare: 0.72,
        },
        {
          sourceCameraId: 'CAM-014',
          targetCameraId: 'CAM-031',
          distanceMeters: 16200,
          expectedTransitTimeSec: 900, // direct express bypass
          averageSpeedKmh: 64.8,
          historicalRouteShare: 0.19,
        },
        {
          sourceCameraId: 'CAM-014',
          targetCameraId: 'CAM-009',
          distanceMeters: 2400,
          expectedTransitTimeSec: 180,
          averageSpeedKmh: 48.0,
          historicalRouteShare: 0.09,
        },
      ],
      'CAM-023': [
        {
          sourceCameraId: 'CAM-023',
          targetCameraId: 'CAM-031',
          distanceMeters: 8400,
          expectedTransitTimeSec: 450, // 7.5 mins at ~67 km/h
          averageSpeedKmh: 67.2,
          historicalRouteShare: 0.85,
        },
      ],
    };

    for (const [sourceId, edgeList] of Object.entries(defaultEdges)) {
      this.edges.set(sourceId, edgeList);
    }
  }

  public getNode(cameraId: string): CameraTopologyNode | undefined {
    return this.nodes.get(cameraId);
  }

  public getAllNodes(): CameraTopologyNode[] {
    return Array.from(this.nodes.values());
  }

  public getOutgoingEdges(cameraId: string): CameraTopologyEdge[] {
    return this.edges.get(cameraId) || [];
  }

  /**
   * Calculate deterministic transit physics and estimated speed between two cameras.
   */
  public calculateTransition(
    sourceCameraId: string,
    targetCameraId: string,
    timeDeltaSec: number,
    sourceTimestamp?: string,
    destinationTimestamp?: string
  ): TrajectoryTransition {
    const sourceNode = this.nodes.get(sourceCameraId);
    const targetNode = this.nodes.get(targetCameraId);

    // Look up edge or calculate Euclidean distance
    const outgoing = this.edges.get(sourceCameraId) || [];
    const edge = outgoing.find(e => e.targetCameraId === targetCameraId);

    let distanceMeters = edge ? edge.distanceMeters : 2500;
    if (!edge && sourceNode && targetNode) {
      // Rough distance from lat/long coordinates (Haversine approximation)
      const dLat = (targetNode.latitude - sourceNode.latitude) * 111320;
      const dLon = (targetNode.longitude - sourceNode.longitude) * 110574;
      distanceMeters = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));
    }

    const safeTimeDelta = Math.max(1, timeDeltaSec);
    // Speed = (distance in meters / time in seconds) * 3.6 km/h
    const estimatedSpeedKmh = Math.round(((distanceMeters / safeTimeDelta) * 3.6) * 10) / 10;

    const heading = targetNode?.direction || sourceNode?.direction || 'Northbound';

    return {
      sourceCamera: sourceCameraId,
      destinationCamera: targetCameraId,
      sourceTimestamp: sourceTimestamp || new Date(Date.now() - safeTimeDelta * 1000).toISOString(),
      destinationTimestamp: destinationTimestamp || new Date().toISOString(),
      timeDeltaSec: safeTimeDelta,
      distanceMeters,
      heading,
      estimatedSpeedKmh,
      confidence: 0.95,
    };
  }

  /**
   * Transparent Downstream Camera Prediction:
   * Deterministically ranks adjacent downstream cameras using road topology,
   * direction of travel, and historical branch shares.
   */
  public predictDownstreamCameras(
    currentCameraId: string,
    observedHeading?: string,
    currentTimestamp: string = new Date().toISOString()
  ): DownstreamPrediction[] {
    const currentNode = this.nodes.get(currentCameraId);
    const outgoing = this.edges.get(currentCameraId) || [];

    if (!outgoing || outgoing.length === 0) {
      // If no explicit edges, look at node's outgoingConnections
      if (currentNode && currentNode.outgoingConnections.length > 0) {
        const share = Math.round((1.0 / currentNode.outgoingConnections.length) * 100) / 100;
        return currentNode.outgoingConnections.map(targetId => {
          const targetNode = this.nodes.get(targetId);
          return {
            currentCameraId,
            candidateNextCameraId: targetId,
            candidateCameraName: targetNode?.name || `Camera ${targetId}`,
            likelihood: share,
            estimatedArrivalWindow: {
              earliest: new Date(Date.now() + 120000).toISOString(),
              latest: new Date(Date.now() + 360000).toISOString(),
              expectedTransitSec: 240,
            },
            reason: `Adjacent road topology branch from ${currentNode.name}`,
            roadSegment: currentNode.roadSegmentId,
          };
        });
      }
      return [];
    }

    const predictions: DownstreamPrediction[] = [];

    for (const edge of outgoing) {
      const targetNode = this.nodes.get(edge.targetCameraId);
      const targetName = targetNode?.name || `Camera ${edge.targetCameraId}`;
      const transitSec = edge.expectedTransitTimeSec;
      
      const currentTimeMs = new Date(currentTimestamp).getTime();
      const earliestMs = currentTimeMs + Math.round(transitSec * 0.75 * 1000);
      const latestMs = currentTimeMs + Math.round(transitSec * 1.5 * 1000);

      const segment = currentNode ? `${currentNode.roadSegmentId} -> ${targetNode?.roadSegmentId || 'NEXT'}` : 'CORRIDOR';
      const reason = `Direct road corridor from ${currentNode?.junctionName || currentCameraId} towards ${targetName} (${edge.distanceMeters}m @ ~${edge.averageSpeedKmh} km/h)`;

      predictions.push({
        currentCameraId,
        candidateNextCameraId: edge.targetCameraId,
        candidateCameraName: targetName,
        likelihood: edge.historicalRouteShare,
        estimatedArrivalWindow: {
          earliest: new Date(earliestMs).toISOString(),
          latest: new Date(latestMs).toISOString(),
          expectedTransitSec: transitSec,
        },
        reason,
        roadSegment: segment,
      });
    }

    // Sort descending by likelihood
    predictions.sort((a, b) => b.likelihood - a.likelihood);
    return predictions;
  }

  public getScenarioACorridor(): string[] {
    return ['CAM-007', 'CAM-014', 'CAM-023', 'CAM-031'];
  }
}

export const cameraTopologyService = CameraTopologyService.getInstance();
