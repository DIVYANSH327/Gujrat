/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * MissionControlService
 * Master Autonomous Mission Orchestrator & State Store.
 * Coordinates AI Mission Planning, Step-by-Step Job Scheduling,
 * Human Approval Gates, and Real-time Execution Telemetry.
 */

import { 
  Mission, 
  MissionType, 
  MissionPriority, 
  MissionStatus, 
  MissionStep, 
  MissionApproval, 
  MissionEvidence, 
  MissionResult 
} from '../types';
import { aiMissionPlannerAgent } from './AIMissionPlannerAgent';
import { AIJobSchedulerService } from './AIJobSchedulerService';
import { centralEventBus } from './CentralEventBus';
import { predictiveCameraHandoffService } from './PredictiveCameraHandoffService';
import { confidencePolicyService } from './ConfidencePolicyService';
import { sysEvents } from './Architecture';

export class MissionControlService {
  private static instance: MissionControlService | null = null;
  private missions: Map<string, Mission> = new Map();
  private scheduler: AIJobSchedulerService;

  private constructor() {
    this.scheduler = AIJobSchedulerService.getInstance();
    this.seedDefaultMissions();
  }

  public static getInstance(): MissionControlService {
    if (!MissionControlService.instance) {
      MissionControlService.instance = new MissionControlService();
    }
    return MissionControlService.instance;
  }

  private seedDefaultMissions(): void {
    const now = Date.now();

    const msn1Id = 'MSN-2026-001';
    const msn1: Mission = {
      missionId: msn1Id,
      missionType: 'TRACK_VEHICLE',
      objective: 'Track target white SUV [GJ01AB1234] along SG Highway Corridor',
      requestedBy: 'Control Room Officer D. Shrivastava',
      priority: 'P0_CRITICAL',
      createdAt: new Date(now - 22 * 60000).toISOString(),
      updatedAt: new Date(now - 2 * 60000).toISOString(),
      startedAt: new Date(now - 20 * 60000).toISOString(),
      targetPlate: 'GJ01AB1234',
      startingCameraId: 'CAM-007',
      corridor: 'SG Highway Corridor Alpha',
      status: 'RUNNING',
      assignedAgents: ['InvestigationAgent', 'ANPRQualityAgent', 'CorrelationAgent', 'EvidenceAgent'],
      steps: [
        {
          stepId: `${msn1Id}-S1`,
          stepNumber: 1,
          name: 'Normalize License Plate',
          description: 'Verify and normalize target plate [GJ01AB1234] against standard HSRP formats',
          status: 'COMPLETED',
          assignedAgentType: 'ANPR',
          approvalRequired: false,
          startedAt: new Date(now - 20 * 60000).toISOString(),
          completedAt: new Date(now - 19 * 60000).toISOString(),
          outputSummary: 'Verified canonical HSRP format: GJ01AB1234 (Confidence: 0.98)'
        },
        {
          stepId: `${msn1Id}-S2`,
          stepNumber: 2,
          name: 'Historical Observation Search',
          description: 'Query statewide central repository for vehicle sightings across temporal windows',
          status: 'COMPLETED',
          assignedAgentType: 'VEHICLE_HISTORY',
          approvalRequired: false,
          startedAt: new Date(now - 19 * 60000).toISOString(),
          completedAt: new Date(now - 17 * 60000).toISOString(),
          outputSummary: 'Retrieved 6 historical observations across Ahmedabad North district'
        },
        {
          stepId: `${msn1Id}-S3`,
          stepNumber: 3,
          name: 'Last Confirmed Sighting Query',
          description: 'Locate most recent high-confidence observation node and active status',
          status: 'COMPLETED',
          assignedAgentType: 'VEHICLE_INTELLIGENCE',
          approvalRequired: false,
          startedAt: new Date(now - 17 * 60000).toISOString(),
          completedAt: new Date(now - 15 * 60000).toISOString(),
          outputSummary: 'Last confirmed at CAM-007 (Pakwan Cross Junction) with heading Northbound'
        },
        {
          stepId: `${msn1Id}-S4`,
          stepNumber: 4,
          name: 'Camera Corridor Topology Analysis',
          description: 'Inspect downstream nodes and adjacent camera connectivity along travel heading',
          status: 'COMPLETED',
          assignedAgentType: 'REGIONAL_AGENT',
          approvalRequired: false,
          startedAt: new Date(now - 15 * 60000).toISOString(),
          completedAt: new Date(now - 12 * 60000).toISOString(),
          outputSummary: 'Mapped downstream trajectory toward CAM-014 (Thaltej Underpass)'
        },
        {
          stepId: `${msn1Id}-S5`,
          stepNumber: 5,
          name: 'Cross-Camera Correlation',
          description: 'Execute multi-factor score breakdown matching plate, vehicle class, color and travel time',
          status: 'RUNNING',
          assignedAgentType: 'VEHICLE_CORRELATION',
          approvalRequired: false,
          startedAt: new Date(now - 12 * 60000).toISOString(),
          outputSummary: 'Correlated CAM-007 with CAM-014 sighting (Confidence: 0.91)'
        },
        {
          stepId: `${msn1Id}-S6`,
          stepNumber: 6,
          name: 'Forensic Evidence Packaging',
          description: 'Extract key frame, plate crop and SHA-256 integrity digest package',
          status: 'PENDING',
          assignedAgentType: 'EVIDENCE',
          approvalRequired: false
        },
        {
          stepId: `${msn1Id}-S7`,
          stepNumber: 7,
          name: 'Trajectory & God’s Eye Update',
          description: 'Project verified sightings onto spatiotemporal grid with predictive downstream corridors',
          status: 'PENDING',
          assignedAgentType: 'INVESTIGATION',
          approvalRequired: false
        },
        {
          stepId: `${msn1Id}-S8`,
          stepNumber: 8,
          name: 'Unified Dossier Assembly',
          description: 'Synthesize camera sightings, telemetry and external verification records into vehicle dossier',
          status: 'PENDING',
          assignedAgentType: 'VEHICLE_DATA_INTELLIGENCE',
          approvalRequired: false
        },
        {
          stepId: `${msn1Id}-S9`,
          stepNumber: 9,
          name: 'Investigator Operational Hand-off',
          description: 'Submit compiled mission summary for authorized officer review and action gate',
          status: 'WAITING_APPROVAL',
          assignedAgentType: 'INVESTIGATION',
          approvalRequired: true,
          approvalStatus: 'PENDING'
        }
      ],
      approvals: [
        {
          approvalId: `APP-${msn1Id}-01`,
          stepId: `${msn1Id}-S9`,
          missionId: msn1Id,
          actionTitle: 'Authorize Interception Protocol',
          reason: 'Target vehicle has traversed 2 consecutive corridor nodes with high correlation confidence.',
          confidence: 0.91,
          evidenceThumbnail: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=60',
          requiredRole: 'OFFICER',
          status: 'PENDING',
          requestedAt: new Date(now - 5 * 60000).toISOString()
        }
      ],
      evidence: [
        {
          evidenceId: 'EVD-MSN-01',
          type: 'KEY_FRAME',
          thumbnailUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=60',
          sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          sourceCameraId: 'CAM-007',
          capturedAt: new Date(now - 18 * 60000).toISOString(),
          sourceOfTruth: 'CAMERA_OBSERVED'
        },
        {
          evidenceId: 'EVD-MSN-02',
          type: 'PLATE_CROP',
          thumbnailUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&auto=format&fit=crop&q=60',
          sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          sourceCameraId: 'CAM-014',
          capturedAt: new Date(now - 11 * 60000).toISOString(),
          sourceOfTruth: 'CAMERA_OBSERVED'
        }
      ],
      executionLog: [
        { timestamp: new Date(now - 20 * 60000).toISOString(), agentId: 'InvestigationAgent', message: 'Mission initiated by Control Room' },
        { timestamp: new Date(now - 19 * 60000).toISOString(), agentId: 'ANPRQualityAgent', message: 'Normalized plate to GJ01AB1234' },
        { timestamp: new Date(now - 17 * 60000).toISOString(), agentId: 'VehicleIntelligenceAgent', message: 'Located 6 historical observations' },
        { timestamp: new Date(now - 12 * 60000).toISOString(), agentId: 'CorrelationAgent', message: 'Correlated node CAM-007 to CAM-014' },
        { timestamp: new Date(now - 5 * 60000).toISOString(), agentId: 'MissionControl', message: 'Generated supervisor approval requirement' }
      ]
    };

    const msn2Id = 'MSN-2026-002';
    const msn2: Mission = {
      missionId: msn2Id,
      missionType: 'CAMERA_HEALTH_SWEEP',
      objective: 'Statewide Video Ingestion Quality & RTSP Latency Sweep',
      requestedBy: 'System Watchdog Automated Daemon',
      priority: 'P2_OPERATIONAL',
      createdAt: new Date(now - 45 * 60000).toISOString(),
      updatedAt: new Date(now - 35 * 60000).toISOString(),
      startedAt: new Date(now - 45 * 60000).toISOString(),
      completedAt: new Date(now - 35 * 60000).toISOString(),
      status: 'COMPLETED',
      assignedAgents: ['CameraHealthAgent', 'ResourceManagerAgent'],
      steps: [
        {
          stepId: `${msn2Id}-S1`,
          stepNumber: 1,
          name: 'Statewide RTSP/ONVIF Ping Sweep',
          description: 'Query connection state, latency and packet drop rates across regional nodes',
          status: 'COMPLETED',
          assignedAgentType: 'CAMERA_HEALTH',
          approvalRequired: false,
          outputSummary: 'Scanned 50 cameras; 48 online, 2 offline'
        },
        {
          stepId: `${msn2Id}-S2`,
          stepNumber: 2,
          name: 'Degraded Feed Identification',
          description: 'Isolate cameras with FPS < 15, latency > 200ms or authentication errors',
          status: 'COMPLETED',
          assignedAgentType: 'CAMERA_HEALTH',
          approvalRequired: false,
          outputSummary: 'Isolated CAM-012 and CAM-028 for degraded latency'
        },
        {
          stepId: `${msn2Id}-S3`,
          stepNumber: 3,
          name: 'Edge Workload Rebalancing',
          description: 'Reassign processing pipelines to healthy neighboring edge nodes',
          status: 'COMPLETED',
          assignedAgentType: 'RESOURCE_MANAGER',
          approvalRequired: false,
          outputSummary: 'Successfully rebalanced 2 pipeline tasks to EDGE-02'
        },
        {
          stepId: `${msn2Id}-S4`,
          stepNumber: 4,
          name: 'Maintenance Ticket & Incident Creation',
          description: 'Create maintenance incidents for technician dispatch',
          status: 'COMPLETED',
          assignedAgentType: 'INVESTIGATION',
          approvalRequired: false,
          outputSummary: 'Logged Incident INC-2026-0843'
        }
      ],
      approvals: [],
      evidence: [],
      executionLog: [
        { timestamp: new Date(now - 45 * 60000).toISOString(), agentId: 'CameraHealthAgent', message: 'Initiated camera health sweep' },
        { timestamp: new Date(now - 35 * 60000).toISOString(), agentId: 'MissionControl', message: 'Sweep completed; 48/50 feeds healthy' }
      ],
      result: {
        summary: 'Statewide sweep concluded: 48 feeds healthy, 2 degraded feeds quarantined.',
        observationsFound: 50,
        camerasInvolved: ['CAM-012', 'CAM-028'],
        evidenceCount: 0,
        humanReviewsRequired: 0,
        completionRatePercent: 100
      }
    };

    this.missions.set(msn1Id, msn1);
    this.missions.set(msn2Id, msn2);
  }

  /**
   * Creates, plans, and queues a new mission
   */
  public createMission(params: {
    missionType: MissionType;
    objective: string;
    requestedBy: string;
    priority: MissionPriority;
    targetPlate?: string;
    startingCameraId?: string;
    corridor?: string;
    constraints?: Record<string, any>;
  }): Mission {
    const missionId = `MSN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const planned = aiMissionPlannerAgent.generatePlan({
      missionId,
      missionType: params.missionType,
      objective: params.objective,
      targetPlate: params.targetPlate,
      startingCameraId: params.startingCameraId,
      corridor: params.corridor,
      priority: params.priority
    });

    const mission: Mission = {
      missionId,
      missionType: params.missionType,
      objective: params.objective,
      requestedBy: params.requestedBy,
      priority: params.priority,
      createdAt: now,
      updatedAt: now,
      targetPlate: params.targetPlate,
      startingCameraId: params.startingCameraId || 'CAM-007',
      corridor: params.corridor || 'Statewide Surveillance Grid',
      constraints: params.constraints,
      steps: planned.steps,
      approvals: [],
      evidence: [],
      assignedAgents: ['InvestigationAgent', 'ANPRQualityAgent'],
      status: 'QUEUED',
      executionLog: [
        {
          timestamp: now,
          agentId: 'AIMissionPlannerAgent',
          message: `Mission planned with ${planned.steps.length} deterministic operational steps.`
        }
      ]
    };

    this.missions.set(missionId, mission);

    // Publish creation event
    centralEventBus.publish({
      eventType: 'MISSION_CREATED',
      sourceId: 'MissionControlService',
      correlationId: missionId,
      idempotencyKey: `MSN-PUB-${missionId}`,
      priority: params.priority.startsWith('P0') ? 'P0' : params.priority.startsWith('P1') ? 'P1' : 'P2',
      payload: mission
    });

    sysEvents.emit('MISSION_UPDATED', mission);
    return mission;
  }

  /**
   * Executes or advances a mission's active step
   */
  public async executeStep(missionId: string, stepId: string): Promise<boolean> {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    const step = mission.steps.find(s => s.stepId === stepId);
    if (!step) return false;

    step.status = 'RUNNING';
    step.startedAt = new Date().toISOString();
    mission.status = 'RUNNING';
    mission.updatedAt = step.startedAt;

    mission.executionLog.push({
      timestamp: step.startedAt,
      agentId: step.assignedAgentType,
      stepId,
      message: `Step [${step.name}] execution started.`
    });

    sysEvents.emit('MISSION_UPDATED', mission);

    // Simulate realistic sub-second agent processing
    await new Promise(res => setTimeout(res, 600));

    const completedAt = new Date().toISOString();
    step.status = 'COMPLETED';
    step.completedAt = completedAt;
    step.outputSummary = `Successfully resolved step requirements by ${step.assignedAgentType}`;

    // If target plate is set, trigger predictive handoff
    if (mission.targetPlate && (step.name.includes('Topology') || step.name.includes('Correlation'))) {
      predictiveCameraHandoffService.generateDownstreamHandoff({
        plate: mission.targetPlate,
        currentCameraId: mission.startingCameraId || 'CAM-007',
        vehicleClass: 'SUV',
        vehicleColor: 'White',
        observedSpeedKmh: 54
      });
    }

    mission.executionLog.push({
      timestamp: completedAt,
      agentId: step.assignedAgentType,
      stepId,
      message: `Step [${step.name}] completed.`
    });

    // Check next step
    const nextStep = mission.steps.find(s => s.status === 'PENDING');
    if (!nextStep) {
      mission.status = 'COMPLETED';
      mission.completedAt = completedAt;
      mission.result = {
        summary: `Mission successfully concluded: ${mission.objective}`,
        targetPlate: mission.targetPlate,
        observationsFound: 8,
        camerasInvolved: ['CAM-007', 'CAM-014', 'CAM-023'],
        evidenceCount: mission.evidence.length,
        humanReviewsRequired: mission.approvals.length,
        completionRatePercent: 100
      };
    } else if (nextStep.approvalRequired) {
      nextStep.status = 'WAITING_APPROVAL';
      mission.status = 'WAITING_FOR_APPROVAL';
      
      const approval: MissionApproval = {
        approvalId: `APP-${missionId}-${nextStep.stepNumber}`,
        stepId: nextStep.stepId,
        missionId,
        actionTitle: `Authorize ${nextStep.name}`,
        reason: `Officer authorization mandated by security policy before proceeding.`,
        confidence: 0.92,
        requiredRole: 'OFFICER',
        status: 'PENDING',
        requestedAt: completedAt
      };
      mission.approvals.push(approval);
    }

    centralEventBus.publish({
      eventType: 'MISSION_STEP_COMPLETED',
      sourceId: 'MissionControlService',
      correlationId: missionId,
      idempotencyKey: `MSN-STEP-${stepId}-${Date.now()}`,
      priority: 'P2',
      payload: { missionId, stepId, status: step.status }
    });

    sysEvents.emit('MISSION_UPDATED', mission);
    return true;
  }

  /**
   * Approves a gated mission step
   */
  public resolveApproval(approvalId: string, decision: 'APPROVED' | 'REJECTED', reviewerId: string, reviewerName: string, comments: string): boolean {
    for (const mission of this.missions.values()) {
      const approval = mission.approvals.find(a => a.approvalId === approvalId);
      if (approval) {
        approval.status = decision;
        approval.reviewerId = reviewerId;
        approval.reviewerName = reviewerName;
        approval.comments = comments;
        approval.decidedAt = new Date().toISOString();

        const step = mission.steps.find(s => s.stepId === approval.stepId);
        if (step) {
          step.approvalStatus = decision;
          if (decision === 'APPROVED') {
            step.status = 'PENDING';
            mission.status = 'RUNNING';
            // Auto advance
            this.executeStep(mission.missionId, step.stepId);
          } else {
            step.status = 'SKIPPED';
            step.error = `Rejected by reviewer: ${comments}`;
          }
        }

        mission.executionLog.push({
          timestamp: approval.decidedAt,
          agentId: reviewerId,
          message: `Approval [${approval.actionTitle}] was ${decision} by ${reviewerName}: ${comments}`
        });

        centralEventBus.publish({
          eventType: 'MISSION_APPROVAL_RESOLVED',
          sourceId: 'MissionControlService',
          correlationId: mission.missionId,
          idempotencyKey: `APP-RES-${approvalId}`,
          priority: 'P1',
          payload: approval
        });

        sysEvents.emit('MISSION_UPDATED', mission);
        return true;
      }
    }
    return false;
  }

  public getMission(missionId: string): Mission | undefined {
    return this.missions.get(missionId);
  }

  public listMissions(filter?: { status?: MissionStatus; missionType?: MissionType }): Mission[] {
    let list = Array.from(this.missions.values());
    if (filter) {
      if (filter.status) list = list.filter(m => m.status === filter.status);
      if (filter.missionType) list = list.filter(m => m.missionType === filter.missionType);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getActiveCount(): number {
    return Array.from(this.missions.values()).filter(m => m.status === 'RUNNING' || m.status === 'WAITING_FOR_APPROVAL' || m.status === 'QUEUED').length;
  }
}

export const missionControlService = MissionControlService.getInstance();
