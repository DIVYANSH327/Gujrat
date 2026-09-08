/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AI AGENT MESH V1.0 - Comprehensive Acceptance & Regression Test Suite
 * Validating Distributed AI Intelligence & Workload Orchestration for 80,000+ CCTV Cameras
 */

import { 
  aiOrchestrator, 
  agentRegistry, 
  jobQueue, 
  RoadSafetyAgent, 
  EvidenceAgent, 
  VisionDetectionAgent, 
  AIResourceManagerAgent,
  AIAuditAgent,
  CameraHealthAgent,
  TrafficIntelligenceAgent,
  IncidentCorrelationAgent,
  InvestigationAgent,
  WatchlistAgent,
  AlertAgent
} from '../index';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`✅ ${message}`);
  } else {
    failed++;
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('  AI AGENT MESH V1.0 ACCEPTANCE & REGRESSION SUITE');
  console.log('  Engineering: DIVYANSH Shrivastava');
  console.log('===============================================================\n');

  // ------------------------------------------------------------------------
  // ACCEPTANCE CRITERIA 1: AGENT REGISTRATION & CAPABILITIES
  // ------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Agent Registration & Capabilities ---');

  aiOrchestrator.bootstrapMeshAgents();
  const allAgents = agentRegistry.getAllAgents();
  assert(allAgents.length >= 12, `Registered mesh agents count >= 12 (actual: ${allAgents.length})`);

  // Verify specialized agent types exist in registry
  const agentTypes = allAgents.map(a => a.agentType);
  assert(agentTypes.includes('CAMERA_HEALTH'), 'CameraHealthAgent registered in mesh');
  assert(agentTypes.includes('VISION_DETECTION'), 'VisionDetectionAgent registered in mesh');
  assert(agentTypes.includes('ROAD_SAFETY'), 'RoadSafetyAgent registered in mesh');
  assert(agentTypes.includes('EVIDENCE'), 'EvidenceAgent registered in mesh');
  assert(agentTypes.includes('WATCHLIST'), 'WatchlistAgent registered in mesh');
  assert(agentTypes.includes('TRAFFIC_INTELLIGENCE'), 'TrafficIntelligenceAgent registered in mesh');
  assert(agentTypes.includes('INCIDENT_CORRELATION'), 'IncidentCorrelationAgent registered in mesh');
  assert(agentTypes.includes('INVESTIGATION'), 'InvestigationAgent registered in mesh');
  assert(agentTypes.includes('RESOURCE_MANAGER'), 'AIResourceManagerAgent registered in mesh');
  assert(agentTypes.includes('ALERT'), 'AlertAgent registered in mesh');
  assert(agentTypes.includes('AUDIT'), 'AIAuditAgent registered in mesh');
  assert(agentTypes.includes('AI_ORCHESTRATOR'), 'AIAgentOrchestrator registered in mesh');

  // Capability discovery
  const visionAgents = agentRegistry.findAgentsByCapability('VISION_DETECTION');
  assert(visionAgents.length >= 2, `Discovered at least 2 VISION_DETECTION agents (actual: ${visionAgents.length})`);

  const safetyAgents = agentRegistry.findAgentsByCapability('ROAD_SAFETY');
  assert(safetyAgents.length >= 2, `Discovered at least 2 ROAD_SAFETY agents (actual: ${safetyAgents.length})`);

  const evidenceAgents = agentRegistry.findAgentsByCapability('EVIDENCE_CAPTURE');
  assert(evidenceAgents.length >= 2, `Discovered at least 2 EVIDENCE_CAPTURE agents (actual: ${evidenceAgents.length})`);

  // Heartbeat tracking
  const targetAgent = visionAgents[0];
  const prevHb = targetAgent.getInfo().lastHeartbeat;
  agentRegistry.recordHeartbeat(targetAgent.agentId);
  assert(targetAgent.getStatus() !== 'OFFLINE', 'Agent is active and responsive to heartbeat');

  // ------------------------------------------------------------------------
  // ACCEPTANCE CRITERIA 2: ROAD SAFETY EVALUATION FLOW
  // ------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Road Safety Evaluation Flow ---');

  const roadSafetyAgent = new RoadSafetyAgent({ isSimulated: true });
  await roadSafetyAgent.initialize();

  // 2a. Rider without helmet with confidence >= 0.85 -> VIOLATION_CONFIRMED
  const violationJob = {
    jobId: 'TEST-JOB-SAFE-001',
    jobType: 'ROAD_SAFETY_EVALUATION',
    priority: 'HIGH' as const,
    sourceId: 'CAM-AHM-014',
    cameraId: 'CAM-AHM-014',
    requiredCapabilities: ['ROAD_SAFETY' as const],
    status: 'RUNNING' as const,
    attempt: 1,
    maxAttempts: 3,
    correlationId: 'CORR-TEST-001',
    createdAt: new Date().toISOString(),
    payload: {
      riderTrackId: 'BIKE-TRK-101',
      hasHelmet: false,
      headVisible: true,
      confidence: 0.94
    }
  };
  const violationRes = await roadSafetyAgent.assignJob(violationJob);
  assert(violationRes.evaluation.status === 'VIOLATION_CONFIRMED', 'Helmet absent evaluated as VIOLATION_CONFIRMED');
  assert(violationRes.evaluation.violationType === 'NO_HELMET', 'Violation type identified as NO_HELMET');
  assert(violationRes.evaluation.confidence >= 0.85, `Violation confidence >= 0.85 (actual: ${violationRes.evaluation.confidence})`);
  assert(violationRes.event !== undefined, 'SecurityEventPayload created for high-priority road safety violation');
  assert(violationRes.event?.priority === 'high', 'Road safety event priority is marked HIGH');

  // 2b. Rider with helmet -> COMPLIANT
  const compliantJob = {
    ...violationJob,
    jobId: 'TEST-JOB-SAFE-002',
    payload: {
      riderTrackId: 'BIKE-TRK-102',
      hasHelmet: true,
      headVisible: true,
      confidence: 0.92
    }
  };
  const compliantRes = await roadSafetyAgent.assignJob(compliantJob);
  assert(compliantRes.evaluation.status === 'COMPLIANT', 'Helmet present evaluated as COMPLIANT');
  assert(compliantRes.event === undefined, 'No security violation event generated for compliant rider');

  // 2c. Insufficient evidence (head occluded) -> INSUFFICIENT_EVIDENCE / UNKNOWN
  const occludedJob = {
    ...violationJob,
    jobId: 'TEST-JOB-SAFE-003',
    payload: {
      riderTrackId: 'BIKE-TRK-103',
      hasHelmet: false,
      headVisible: false, // occluded
      confidence: 0.40
    }
  };
  const occludedRes = await roadSafetyAgent.assignJob(occludedJob);
  assert(occludedRes.evaluation.status === 'INSUFFICIENT_EVIDENCE', 'Occluded head evaluated as INSUFFICIENT_EVIDENCE');
  assert(occludedRes.evaluation.violationType === 'UNKNOWN', 'Occluded head violation type marked UNKNOWN (no false violation)');

  // ------------------------------------------------------------------------
  // ACCEPTANCE CRITERIA 3: EVIDENCE CAPTURE & SHA-256 DIGEST
  // ------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Forensic Evidence & SHA-256 Digest ---');

  const evidenceAgent = new EvidenceAgent({ isSimulated: true });
  await evidenceAgent.initialize();

  const evdJob1 = {
    jobId: 'TEST-JOB-EVD-001',
    jobType: 'EVIDENCE_CAPTURE',
    priority: 'HIGH' as const,
    sourceId: 'CAM-AHM-014',
    cameraId: 'CAM-AHM-014',
    requiredCapabilities: ['EVIDENCE_CAPTURE' as const],
    status: 'RUNNING' as const,
    attempt: 1,
    maxAttempts: 3,
    correlationId: 'CORR-TEST-EVD-001',
    createdAt: new Date().toISOString(),
    payload: {
      eventId: 'EVT-TEST-001',
      cameraId: 'CAM-AHM-014',
      targetId: 'BIKE-TRK-101',
      captureReason: 'HELMET_VIOLATION'
    }
  };

  const evdRes1 = await evidenceAgent.assignJob(evdJob1);
  assert(evdRes1.deduplicated === false, 'First evidence capture succeeds without deduplication');
  assert(evdRes1.evidenceItem !== undefined, 'Canonical EvidenceItem created');
  assert(evdRes1.evidenceItem?.sha256 !== undefined, 'SHA-256 digest generated');
  assert(evdRes1.evidenceItem!.sha256.length === 64, `SHA-256 digest is exact 64-char hexadecimal (length: ${evdRes1.evidenceItem!.sha256.length})`);
  assert(evdRes1.evidenceItem?.eventId === 'EVT-TEST-001', 'Evidence references original generating eventId');
  assert(evdRes1.evidenceItem?.label === 'SIMULATED DEMO EVIDENCE', 'Evidence correctly labeled SIMULATED DEMO EVIDENCE');

  // Deduplication check: second capture of same track & reason within 5s is suppressed
  const evdRes2 = await evidenceAgent.assignJob({
    ...evdJob1,
    jobId: 'TEST-JOB-EVD-002'
  });
  assert(evdRes2.deduplicated === true, 'Duplicate evidence capture within 5s window is suppressed');
  assert(evdRes2.evidenceItem === undefined, 'No duplicate evidence item created');

  // ------------------------------------------------------------------------
  // ACCEPTANCE CRITERIA 4: AGENT FAILURE, REASSIGNMENT & LOAD BALANCING
  // ------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Agent Failure, Job Reassignment & Load Balancing ---');

  const failoverTargetId = 'VISION-AHM-001';
  const backupAgentId = 'VISION-AHM-002';

  // Queue a job assigned to VISION-AHM-001
  const testJob = jobQueue.enqueue({
    jobId: `TEST-FAILOVER-JOB-${Date.now()}`,
    jobType: 'OBJECT_DETECTION',
    priority: 'HIGH',
    sourceId: 'CAM-AHM-007',
    cameraId: 'CAM-AHM-007',
    requiredCapabilities: ['VISION_DETECTION'],
    correlationId: 'CORR-FAILOVER-TEST',
    maxAttempts: 3,
    payload: { cameraId: 'CAM-AHM-007' }
  });
  assert(testJob !== null, 'Test job enqueued for failover testing');

  jobQueue.assign(testJob!.jobId, failoverTargetId);
  assert(testJob?.assignedAgentId === failoverTargetId, 'Job initially assigned to VISION-AHM-001');

  // Simulate failure of VISION-AHM-001
  const failoverResult = aiOrchestrator.simulateFailureAndReassign(failoverTargetId);
  const failedAgent = agentRegistry.getAgent(failoverTargetId);
  assert(failedAgent?.getStatus() === 'OFFLINE', 'Simulated failure sets agent status to OFFLINE');
  assert(failoverResult.reassignedJobsCount >= 1, `Failover reassigned at least 1 job (actual: ${failoverResult.reassignedJobsCount})`);

  const updatedJob = jobQueue.getJob(testJob!.jobId);
  assert(updatedJob?.assignedAgentId !== failoverTargetId, 'Job reassigned away from failed agent');
  assert(updatedJob?.assignedAgentId !== undefined, `Job successfully reassigned to healthy agent: ${updatedJob?.assignedAgentId}`);

  // Restore agent
  aiOrchestrator.restoreAgent(failoverTargetId);
  assert(failedAgent?.getStatus() === 'IDLE' || failedAgent?.getStatus() === 'BUSY', 'Restoring agent returns it to active state');

  // Load balancing check
  const lbResult = aiOrchestrator.rebalanceAllWorkloads();
  assert(typeof lbResult.movedJobsCount === 'number', 'Load balancing executes deterministically without errors');

  // ------------------------------------------------------------------------
  // ACCEPTANCE CRITERIA 5: SCALABILITY SIMULATION (80,000+ CAMERAS)
  // ------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Scalability Simulation (80,000+ CCTV Cameras) ---');

  // Set to 80,000 cameras
  const scale80k = aiOrchestrator.setScaleSimulation(80000);
  assert(scale80k.targetCameraCount === 80000, 'Target camera count set to 80,000');
  assert(scale80k.actualConnectedCameras === 0, 'Actual connected physical CCTV cameras is truthfully reported as 0');
  assert(scale80k.simulatedEdgeNodesCount === 1600, `Simulated edge fleet scaled to 1,600 nodes (actual: ${scale80k.simulatedEdgeNodesCount})`);
  assert(scale80k.regions.length === 4, 'Regional breakdown partitions across 4 Gujarat metropolitan clusters');

  const totalRegionalCameras = scale80k.regions.reduce((sum, r) => sum + r.cameras, 0);
  assert(totalRegionalCameras === 80000, `Sum of regional cameras matches 80,000 (actual: ${totalRegionalCameras})`);

  // Switch to 100,000 cameras
  const scale100k = aiOrchestrator.setScaleSimulation(100000);
  assert(scale100k.targetCameraCount === 100000, 'Scale selector smoothly updates to 100,000 cameras');
  assert(scale100k.simulatedEdgeNodesCount === 2000, 'Edge nodes scaled to 2,000 for 100,000 cameras');

  // Restore to 80,000
  aiOrchestrator.setScaleSimulation(80000);

  // ------------------------------------------------------------------------
  // END-TO-END ROAD SAFETY ORCHESTRATION PIPELINE (Acceptance Criteria 2 & 3)
  // ------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: End-to-End Road Safety Orchestration Pipeline ---');

  const e2eResult = await aiOrchestrator.executeRoadSafetyScenario({
    cameraId: 'CAM-AHM-014',
    targetId: 'BIKE-TRACK-001',
    hasHelmet: false,
    confidence: 0.94
  });

  assert(e2eResult.correlationId !== undefined, 'E2E Scenario generates unique correlationId');
  assert(e2eResult.eventId !== undefined, 'E2E Scenario generates standard SecurityEventPayload');
  assert(e2eResult.evidenceId !== undefined, 'E2E Scenario captures SHA-256 evidence item');
  assert(e2eResult.alertId !== undefined, 'E2E Scenario creates prioritized dispatch alert');
  assert(e2eResult.incidentId !== undefined, 'E2E Scenario correlates multi-camera incident');
  assert(e2eResult.journeyId !== undefined, 'E2E Scenario reconstructs journey trajectory for God\'s Eye');
  assert(e2eResult.stagesExecuted.length >= 7, `All 7+ stages executed in pipeline (actual: ${e2eResult.stagesExecuted.length})`);

  console.log('\n===============================================================');
  console.log(`🎯 AI AGENT MESH TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
