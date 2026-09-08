/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AI AGENT MESH V1.0 - Core Type Definitions & Agent Contracts
 * Distributed AI Intelligence and Workload Orchestration for 80,000+ CCTV Cameras
 */

import { SecurityEventPayload, EvidenceItem, Alert } from '../types';

export type AgentStatus = 
  | 'STARTING'
  | 'IDLE'
  | 'BUSY'
  | 'DEGRADED'
  | 'OFFLINE'
  | 'ERROR'
  | 'DRAINING'
  | 'STOPPED';

export type AgentType = 
  | 'CAMERA_HEALTH'
  | 'VISION_DETECTION'
  | 'ROAD_SAFETY'
  | 'VEHICLE_INTELLIGENCE'
  | 'VEHICLE_HISTORY'
  | 'VEHICLE_CLASSIFICATION'
  | 'ANPR'
  | 'VEHICLE_CORRELATION'
  | 'VAHAN_INTELLIGENCE'
  | 'ECHALLAN_INTELLIGENCE'
  | 'POLICE_RECORDS_INTELLIGENCE'
  | 'FORENSIC_BIOMETRICS'
  | 'EVIDENCE'
  | 'WATCHLIST'
  | 'TRAFFIC_INTELLIGENCE'
  | 'INCIDENT_CORRELATION'
  | 'INVESTIGATION'
  | 'RESOURCE_MANAGER'
  | 'ALERT'
  | 'AUDIT'
  | 'AI_ORCHESTRATOR'
  | 'REGIONAL_AGENT'
  | 'MOBILE_CAMERA'
  | 'CROSS_CAMERA_CORRELATION'
  | 'VEHICLE_DATA_INTELLIGENCE'
  | 'TRAFFIC_GROUP_CORRELATION'
  | 'TRAFFIC_FLOW'
  | 'CHALLAN_DETECTION'
  | 'VIOLATION_EVIDENCE'
  | 'CHALLAN_REVIEW'
  | 'CHALLAN_DISPATCH'
  | 'EVIDENCE_SUFFICIENCY'
  | 'TRAFFIC_VIOLATION_RULE'
  | 'FACE_DETECTION'
  | 'FACE_WATCHLIST';

export type AgentCapability = 
  | 'VISION_DETECTION'
  | 'ROAD_SAFETY'
  | 'VEHICLE_INTELLIGENCE'
  | 'VEHICLE_HISTORY'
  | 'VEHICLE_CLASSIFICATION'
  | 'ANPR_RECOGNITION'
  | 'VEHICLE_CORRELATION'
  | 'STATE_HISTORY_INQUIRY'
  | 'TEMPORAL_CORRIDOR_MAPPING'
  | 'VAHAN_INTEGRATION'
  | 'ECHALLAN_INTEGRATION'
  | 'POLICE_RECORDS_INTEGRATION'
  | 'FORENSIC_BIOMETRICS'
  | 'EVIDENCE_CAPTURE'
  | 'WATCHLIST'
  | 'TRAFFIC_ANALYSIS'
  | 'INCIDENT_CORRELATION'
  | 'INVESTIGATION'
  | 'CAMERA_HEALTH'
  | 'RESOURCE_SCHEDULING'
  | 'ALERT_DISPATCH'
  | 'AUDIT_COMPLIANCE'
  | 'ORCHESTRATION'
  | 'REGIONAL_AGGREGATION'
  | 'VEHICLE_DATA_INTELLIGENCE'
  | 'TRAFFIC_GROUP_CORRELATION'
  | 'TRAFFIC_FLOW_ANALYSIS'
  | 'CHALLAN_DETECTION'
  | 'VIOLATION_EVIDENCE_PACKAGING'
  | 'CHALLAN_REVIEW_ROUTING'
  | 'CHALLAN_DISPATCH_GATEWAY'
  | 'EVIDENCE_SUFFICIENCY_ANALYSIS'
  | 'TRAFFIC_RULE_EVALUATION'
  | 'FACE_DETECTION'
  | 'FACE_WATCHLIST_MATCHING'
  | 'PERSON_INVESTIGATION';

export type AgentPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type JobStatus = 
  | 'QUEUED'
  | 'ASSIGNED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED'
  | 'EXPIRED';

export interface AIAgentMetrics {
  activeJobs: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageLatencyMs: number;
  lastHeartbeat: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  gpuUsagePercent?: number;
  eventsProcessed: number;
  evidenceCaptured: number;
  alertsGenerated: number;
  isSimulatedHardwareTelemetry: boolean;
}

export interface AIAgentInfo {
  agentId: string;
  agentType: AgentType;
  version: string;
  status: AgentStatus;
  capabilities: AgentCapability[];
  assignedScope: string;
  region: string;
  edgeNodeId?: string;
  workloadPercent: number;
  priority: AgentPriority;
  lastHeartbeat: string;
  health: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  metrics: AIAgentMetrics;
  isSimulated: boolean;
}

export interface AIAgentJob {
  jobId: string;
  jobType: string;
  priority: AgentPriority;
  createdAt: string;
  sourceId: string;
  cameraId?: string;
  edgeNodeId?: string;
  requiredCapabilities: AgentCapability[];
  assignedAgentId?: string;
  status: JobStatus;
  attempt: number;
  maxAttempts: number;
  deadline?: string;
  correlationId: string;
  payload: any;
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  latencyMs?: number;
}

export type AIAgentMessageType = 
  | 'JOB_ASSIGNED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED'
  | 'EVENT_CREATED'
  | 'EVIDENCE_REQUESTED'
  | 'EVIDENCE_CREATED'
  | 'WATCHLIST_CHECK_REQUESTED'
  | 'WATCHLIST_MATCH'
  | 'ALERT_REQUESTED'
  | 'INCIDENT_UPDATED'
  | 'AGENT_HEARTBEAT'
  | 'AGENT_OFFLINE'
  | 'AGENT_RECOVERED'
  | 'SCALE_METRICS_UPDATE';

export interface AIAgentMessage {
  messageId: string;
  messageType: AIAgentMessageType;
  sourceAgentId: string;
  destinationAgentId?: string;
  eventId?: string;
  jobId?: string;
  correlationId: string;
  timestamp: string;
  priority: AgentPriority;
  payload: any;
}

export interface CorrelatedIncident {
  incidentId: string;
  title: string;
  severity: AgentPriority;
  startTime: string;
  lastUpdate: string;
  affectedCameras: string[];
  relatedEvents: string[];
  relatedEvidence: string[];
  relatedAlerts: string[];
  status: 'NEW' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';
  confidence: number;
  correlationId: string;
  summary: string;
  region: string;
  isSimulated: boolean;
}

export interface ScaleSimulationState {
  targetCameraCount: number; // 1,000 | 10,000 | 50,000 | 80,000 | 100,000
  actualConnectedCameras: number; // 0 in demo mode, derived from physical Camera Matrix
  simulatedEdgeNodesCount: number;
  simulatedDvrNvrCount: number;
  simulatedActiveJobs: number;
  simulatedEventsPerMin: number;
  isScaleSimActive: boolean;
  regions: {
    regionName: string;
    cameras: number;
    edgeNodes: number;
    activeAgents: number;
    eventsPerMin: number;
  }[];
}

export interface MeshMetrics {
  agentCount: number;
  onlineAgentCount: number;
  offlineAgentCount: number;
  activeJobs: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
  reassignedJobs: number;
  eventsProcessed: number;
  detections: number;
  evidenceCaptured: number;
  alertsCreated: number;
  incidentsCreated: number;
  averageLatencyMs: number;
  queueLatencyMs: number;
  targetCameraCount: number;
  actualConnectedCameras: number;
  lastOrchestrationCycle: string;
}

export interface AIAgentAuditRecord {
  auditId: string;
  timestamp: string;
  agentId: string;
  action: string;
  eventId?: string;
  jobId?: string;
  correlationId: string;
  result: 'SUCCESS' | 'FAILURE' | 'REASSIGNED' | 'BLOCKED_BY_POLICY';
  details: string;
}

/**
 * Common Agent Contract (IAIAgent)
 * All specialized mesh agents implement this interface.
 */
export interface IAIAgent {
  agentId: string;
  agentType: AgentType;
  version: string;
  
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  
  getStatus(): AgentStatus;
  getCapabilities(): AgentCapability[];
  getMetrics(): AIAgentMetrics;
  getInfo(): AIAgentInfo;
  
  handleEvent(event: SecurityEventPayload | any): Promise<void>;
  handleCommand(command: string, params: any): Promise<any>;
  healthCheck(): Promise<'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'>;
  
  // Workload and heartbeat
  recordHeartbeat(): void;
  assignJob(job: AIAgentJob): Promise<any>;
  cancelJob?(jobId: string): Promise<boolean>;
}

/**
 * Priority Hierarchy P0 to P5
 * P0 = Critical watchlist / active threat / emergency
 * P1 = Active incident / urgent investigation
 * P2 = Road safety / major traffic event
 * P3 = Vehicle intelligence / ANPR
 * P4 = General analytics
 * P5 = Background indexing / retrospective analysis
 */
export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface ICentralAgent extends IAIAgent {
  orchestrateGlobalWorkload(): Promise<void>;
  synchronizeRegionalControllers(): Promise<void>;
  enforceStatewidePolicies(): Promise<void>;
}

export interface IRegionalAgent extends IAIAgent {
  regionId: string;
  subordinateEdgeNodes: string[];
  aggregateRegionalMetrics(): Promise<any>;
  dispatchRegionalJob(job: AIAgentJob): Promise<boolean>;
  handleEdgeFailover(edgeNodeId: string): Promise<void>;
}

export interface IEdgeAgent extends IAIAgent {
  edgeNodeId: string;
  connectedCameras: string[];
  localQueueDepth: number;
  processLocalFrame(frame: any): Promise<any>;
  queueLocalEvent(event: any): void;
  flushLocalQueue(): Promise<void>;
}

export interface ICameraWorker {
  workerId: string;
  cameraId: string;
  edgeNodeId: string;
  sourceType: string;
  status: 'ACTIVE' | 'STREAMING' | 'DEGRADED' | 'DISCONNECTED';
  fps: number;
  captureFrame(): Promise<any>;
  heartbeat(): void;
}

export interface IAIAgentSupervisor {
  registerAgent(agent: IAIAgent): void;
  unregisterAgent(agentId: string): boolean;
  processHeartbeat(agentId: string): boolean;
  evaluateAgentHealth(agentId: string): 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  drainAgent(agentId: string): Promise<boolean>;
  handleAgentFailure(agentId: string): Promise<void>;
  recoverAgent(agentId: string): Promise<void>;
  reassignJobs(failedAgentId: string): Promise<number>;
}

export interface IAIJobScheduler {
  submitJob(job: AIAgentJob): AIAgentJob | null;
  dispatchNextJob(): Promise<AIAgentJob | null>;
  rebalanceWorkload(): Promise<number>;
  calculatePriorityScore(job: AIAgentJob, candidateAgent: IAIAgent): number;
}

export interface IAIResourceManager {
  trackCapacity(): any;
  requestAllocation(resourceType: string, amount: number): boolean;
  releaseAllocation(resourceType: string, amount: number): void;
  getLoadState(): 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOAD';
}

export interface IAgentHealthMonitor {
  startMonitoring(): void;
  stopMonitoring(): void;
  getDegradedAgents(): string[];
  getOfflineAgents(): string[];
}

export interface DecisionExplanation {
  decisionId: string;
  decisionType: string;
  confidence: number;
  signals: string[];
  negativeSignals?: string[];
  dataSources: string[];
  agent: string;
  model: string;
  timestamp: string;
  policy: string;
  humanReviewRequired: boolean;
}
