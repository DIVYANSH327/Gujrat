/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIMissionPlannerAgent: High-Level Objective Decomposer & Structured Job Planner.
 * Converts operational police objectives into deterministic, typed execution plans.
 * Absolute Rule: Never executes arbitrary shell, code, or unstructured LLM strings.
 */

import { 
  MissionType, 
  MissionPriority, 
  MissionStep 
} from '../types';
import { AIAgentJob, AgentCapability } from '../ai-agents/types';

export class AIMissionPlannerAgent {
  private static instance: AIMissionPlannerAgent | null = null;

  private constructor() {}

  public static getInstance(): AIMissionPlannerAgent {
    if (!AIMissionPlannerAgent.instance) {
      AIMissionPlannerAgent.instance = new AIMissionPlannerAgent();
    }
    return AIMissionPlannerAgent.instance;
  }

  /**
   * Generates sequential typed steps for any mission type
   */
  public generatePlan(params: {
    missionId: string;
    missionType: MissionType;
    objective: string;
    targetPlate?: string;
    startingCameraId?: string;
    corridor?: string;
    priority: MissionPriority;
  }): { steps: MissionStep[]; initialJobs: Omit<AIAgentJob, 'jobId' | 'createdAt' | 'status' | 'attempt' | 'maxAttempts'>[] } {
    const { missionId, missionType, targetPlate, startingCameraId = 'CAM-007', priority } = params;

    let steps: MissionStep[] = [];
    let initialJobs: Omit<AIAgentJob, 'jobId' | 'createdAt' | 'status' | 'attempt' | 'maxAttempts'>[] = [];

    const mappedPriority = priority.startsWith('P0') ? 'CRITICAL' : priority.startsWith('P1') ? 'HIGH' : priority.startsWith('P2') ? 'NORMAL' : 'LOW';

    switch (missionType) {
      case 'TRACK_VEHICLE':
      case 'RECONSTRUCT_JOURNEY':
      case 'FIND_LAST_SEEN':
        steps = [
          {
            stepId: `${missionId}-S1`,
            stepNumber: 1,
            name: 'Normalize License Plate',
            description: `Verify and normalize target plate [${targetPlate || 'GJ01AB1234'}] against standard HSRP formats`,
            status: 'PENDING',
            assignedAgentType: 'ANPR',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S2`,
            stepNumber: 2,
            name: 'Historical Observation Search',
            description: 'Query statewide central repository for vehicle sightings across temporal windows',
            status: 'PENDING',
            assignedAgentType: 'VEHICLE_HISTORY',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S3`,
            stepNumber: 3,
            name: 'Last Confirmed Sighting Query',
            description: 'Locate most recent high-confidence observation node and active status',
            status: 'PENDING',
            assignedAgentType: 'VEHICLE_INTELLIGENCE',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S4`,
            stepNumber: 4,
            name: 'Camera Corridor Topology Analysis',
            description: 'Inspect downstream nodes and adjacent camera connectivity along travel heading',
            status: 'PENDING',
            assignedAgentType: 'REGIONAL_AGENT',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S5`,
            stepNumber: 5,
            name: 'Cross-Camera Correlation',
            description: 'Execute multi-factor score breakdown matching plate, vehicle class, color and travel time',
            status: 'PENDING',
            assignedAgentType: 'VEHICLE_CORRELATION',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S6`,
            stepNumber: 6,
            name: 'Forensic Evidence Packaging',
            description: 'Extract key frame, plate crop and SHA-256 integrity digest package',
            status: 'PENDING',
            assignedAgentType: 'EVIDENCE',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S7`,
            stepNumber: 7,
            name: 'Trajectory & God’s Eye Update',
            description: 'Project verified sightings onto spatiotemporal grid with predictive downstream corridors',
            status: 'PENDING',
            assignedAgentType: 'INVESTIGATION',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S8`,
            stepNumber: 8,
            name: 'Unified Dossier Assembly',
            description: 'Synthesize camera sightings, telemetry and external verification records into vehicle dossier',
            status: 'PENDING',
            assignedAgentType: 'VEHICLE_DATA_INTELLIGENCE',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S9`,
            stepNumber: 9,
            name: 'Investigator Operational Hand-off',
            description: 'Submit compiled mission summary for authorized officer review and action gate',
            status: 'PENDING',
            assignedAgentType: 'INVESTIGATION',
            approvalRequired: true,
            approvalStatus: 'PENDING'
          }
        ];
        break;

      case 'LOCATE_WATCHLIST_CANDIDATE':
        steps = [
          {
            stepId: `${missionId}-S1`,
            stepNumber: 1,
            name: 'Watchlist Database Search',
            description: 'Extract biometric and vehicle parameters for target subject',
            status: 'PENDING',
            assignedAgentType: 'WATCHLIST',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S2`,
            stepNumber: 2,
            name: 'Edge Node Filter Broadcast',
            description: 'Push active watchlist signature to regional edge nodes for prioritized ANPR filtering',
            status: 'PENDING',
            assignedAgentType: 'REGIONAL_AGENT',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S3`,
            stepNumber: 3,
            name: 'Candidate Verification & Explainability',
            description: 'Decompose signal weights and verify confidence threshold >= 0.85',
            status: 'PENDING',
            assignedAgentType: 'INVESTIGATION',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S4`,
            stepNumber: 4,
            name: 'Supervisor Interception Approval',
            description: 'Mandatory human approval gate before triggering field unit dispatch',
            status: 'PENDING',
            assignedAgentType: 'INVESTIGATION',
            approvalRequired: true,
            approvalStatus: 'PENDING'
          }
        ];
        break;

      case 'CAMERA_HEALTH_SWEEP':
        steps = [
          {
            stepId: `${missionId}-S1`,
            stepNumber: 1,
            name: 'Statewide RTSP/ONVIF Ping Sweep',
            description: 'Query connection state, latency and packet drop rates across regional nodes',
            status: 'PENDING',
            assignedAgentType: 'CAMERA_HEALTH',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S2`,
            stepNumber: 2,
            name: 'Degraded Feed Identification',
            description: 'Isolate cameras with FPS < 15, latency > 200ms or authentication errors',
            status: 'PENDING',
            assignedAgentType: 'CAMERA_HEALTH',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S3`,
            stepNumber: 3,
            name: 'Edge Workload Rebalancing',
            description: 'Reassign processing pipelines to healthy neighboring edge nodes',
            status: 'PENDING',
            assignedAgentType: 'RESOURCE_MANAGER',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S4`,
            stepNumber: 4,
            name: 'Maintenance Ticket & Incident Creation',
            description: 'Create maintenance incidents for technician dispatch',
            status: 'PENDING',
            assignedAgentType: 'INVESTIGATION',
            approvalRequired: false
          }
        ];
        break;

      case 'FOLLOW_MOBILE_CAMERA':
        steps = [
          {
            stepId: `${missionId}-S1`,
            stepNumber: 1,
            name: 'Verify Mobile Camera Telemetry',
            description: 'Check active GPS stream, camera resolution, and frame delivery pipeline',
            status: 'PENDING',
            assignedAgentType: 'MOBILE_CAMERA',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S2`,
            stepNumber: 2,
            name: 'Fixed-to-Mobile Corridor Ingestion',
            description: 'Correlate mobile patrol vehicle sightings with static CCTV grid along patrol vector',
            status: 'PENDING',
            assignedAgentType: 'VEHICLE_CORRELATION',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S3`,
            stepNumber: 3,
            name: 'Real-time Patrol Map Tracking',
            description: 'Stream mobile coordinates to God’s Eye and tactical incident command map',
            status: 'PENDING',
            assignedAgentType: 'INVESTIGATION',
            approvalRequired: false
          }
        ];
        break;

      default:
        steps = [
          {
            stepId: `${missionId}-S1`,
            stepNumber: 1,
            name: 'Corridor Search & Discovery',
            description: `Query active video nodes for objective parameters: ${params.objective}`,
            status: 'PENDING',
            assignedAgentType: 'VEHICLE_INTELLIGENCE',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S2`,
            stepNumber: 2,
            name: 'Spatiotemporal Correlation',
            description: 'Synthesize sightings across time windows and camera junctions',
            status: 'PENDING',
            assignedAgentType: 'VEHICLE_CORRELATION',
            approvalRequired: false
          },
          {
            stepId: `${missionId}-S3`,
            stepNumber: 3,
            name: 'Human Review Review Gate',
            description: 'Authorized officer review of operational recommendations',
            status: 'PENDING',
            assignedAgentType: 'INVESTIGATION',
            approvalRequired: true,
            approvalStatus: 'PENDING'
          }
        ];
        break;
    }

    // Convert step 1 into immediate initial job
    const firstStep = steps[0];
    initialJobs.push({
      jobType: firstStep.assignedAgentType,
      priority: mappedPriority,
      sourceId: missionId,
      cameraId: startingCameraId,
      requiredCapabilities: this.mapCapabilities(firstStep.assignedAgentType),
      correlationId: `MSN-${missionId}`,
      payload: {
        missionId,
        stepId: firstStep.stepId,
        targetPlate,
        objective: params.objective
      }
    });

    return { steps, initialJobs };
  }

  private mapCapabilities(agentType: string): AgentCapability[] {
    switch (agentType) {
      case 'ANPR': return ['ANPR_RECOGNITION'];
      case 'VEHICLE_HISTORY': return ['STATE_HISTORY_INQUIRY'];
      case 'VEHICLE_INTELLIGENCE': return ['VEHICLE_INTELLIGENCE', 'TEMPORAL_CORRIDOR_MAPPING'];
      case 'VEHICLE_CORRELATION': return ['VEHICLE_CORRELATION'];
      case 'EVIDENCE': return ['EVIDENCE_CAPTURE'];
      case 'WATCHLIST': return ['WATCHLIST'];
      case 'CAMERA_HEALTH': return ['CAMERA_HEALTH'];
      case 'RESOURCE_MANAGER': return ['RESOURCE_SCHEDULING'];
      case 'MOBILE_CAMERA': return ['VISION_DETECTION', 'ANPR_RECOGNITION'];
      default: return ['INVESTIGATION', 'ORCHESTRATION'];
    }
  }
}

export const aiMissionPlannerAgent = AIMissionPlannerAgent.getInstance();
