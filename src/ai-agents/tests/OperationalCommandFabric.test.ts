/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * OPERATIONAL AI COMMAND & AUTONOMOUS COORDINATION FABRIC - TEST SUITE
 * Comprehensive verification of Mission Control, Objective Decomposition,
 * Predictive Camera Handoff, Incident Command, Human Review Gates,
 * Explainability Decomposers, and Operational Digital Twin.
 */

import { missionControlService } from '../../services/MissionControlService';
import { aiMissionPlannerAgent } from '../../services/AIMissionPlannerAgent';
import { predictiveCameraHandoffService } from '../../services/PredictiveCameraHandoffService';
import { incidentCommandService } from '../../services/IncidentCommandService';
import { humanReviewQueueService } from '../../services/HumanReviewQueueService';
import { confidencePolicyService } from '../../services/ConfidencePolicyService';
import { operationalDigitalTwinService } from '../../services/OperationalDigitalTwinService';
import { cameraHealthCommandService } from '../../services/CameraHealthCommandService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('OPERATIONAL AI COMMAND & AUTONOMOUS FABRIC VERIFICATION');
  console.log('================================================================');

  // TEST 1: Mission Planner
  console.log('\n[TEST GROUP 1]: AIMissionPlannerAgent Objective Decomposition');
  const plan = aiMissionPlannerAgent.generatePlan({
    missionId: 'MSN-TEST-001',
    missionType: 'TRACK_VEHICLE',
    objective: 'Track white SUV along SG Highway corridor to Thaltej',
    targetPlate: 'GJ01AB1234',
    startingCameraId: 'CAM-007',
    priority: 'P0_CRITICAL'
  });
  assert(plan.steps.length >= 7, 'Mission Planner decomposed objective into sequential typed steps');
  assert(plan.steps[0].assignedAgentType === 'ANPR', 'First step assigned to ANPR normalization');
  assert(plan.steps.some(s => s.approvalRequired), 'Plan includes supervisory human approval gate');
  assert(plan.initialJobs.length > 0, 'Plan generated executable initial jobs');

  // TEST 2: Mission Control Lifecycle & Step Execution
  console.log('\n[TEST GROUP 2]: MissionControlService State Machine & Step Execution');
  const mission = missionControlService.createMission({
    missionType: 'LOCATE_WATCHLIST_CANDIDATE',
    objective: 'Locate Section 302 Wanted target along SG Highway',
    requestedBy: 'Command Center Inspector',
    priority: 'P0_CRITICAL',
    targetPlate: 'GJ01AB1234'
  });
  assert(mission.missionId.startsWith('MSN-'), 'Mission initialized with canonical ID');
  assert(mission.status === 'QUEUED', 'Mission initialized in QUEUED state');

  const step1 = mission.steps[0];
  const stepExecSuccess = await missionControlService.executeStep(mission.missionId, step1.stepId);
  assert(stepExecSuccess, 'Executed step 1 successfully');
  const updatedMission = missionControlService.getMission(mission.missionId);
  assert(updatedMission?.steps[0].status === 'COMPLETED', 'Step 1 transitioned to COMPLETED');
  assert(updatedMission?.executionLog.length! >= 2, 'Execution log captures agent start & completion entries');

  // TEST 3: Supervisory Approval Gate
  console.log('\n[TEST GROUP 3]: Human Supervisory Approval Gate Resolution');
  const approvalTargetMission = missionControlService.getMission('MSN-2026-001');
  assert(!!approvalTargetMission, 'Retrieved default tracking mission');
  const pendingApproval = approvalTargetMission?.approvals.find(a => a.status === 'PENDING');
  if (pendingApproval) {
    const resSuccess = missionControlService.resolveApproval(
      pendingApproval.approvalId,
      'APPROVED',
      'OFFICER-TEST',
      'Inspector Test',
      'Verified physical vehicle match'
    );
    assert(resSuccess, 'Supervisory approval gate resolved with APPROVED decision');
    assert(pendingApproval.status === 'APPROVED', 'Approval item status updated');
  }

  // TEST 4: Predictive Camera Handoff
  console.log('\n[TEST GROUP 4]: PredictiveCameraHandoffService Corridor Handoff');
  const handoffPoints = predictiveCameraHandoffService.generateDownstreamHandoff({
    plate: 'GJ01AB1234',
    currentCameraId: 'CAM-007',
    vehicleClass: 'SUV',
    vehicleColor: 'White',
    observedSpeedKmh: 55
  });
  assert(handoffPoints.length > 0, 'Generated downstream corridor prediction points');
  const predictedPoint = handoffPoints.find(p => p.handoffState === 'PREDICTED');
  assert(!!predictedPoint, 'Corridor contains PREDICTED state point');
  assert(predictedPoint?.predictionConfidence! >= 0.70, 'Prediction confidence evaluated above operational threshold');

  // Confirm arrival at downstream node
  const confirmed = predictiveCameraHandoffService.confirmHandoff('GJ01AB1234', predictedPoint?.toCameraId || 'CAM-014');
  assert(confirmed, 'Confirmed handoff upon arrival at destination node');

  // TEST 5: Incident Command & Officer Decisions
  console.log('\n[TEST GROUP 5]: IncidentCommandService Triaging & Accountable Decisions');
  const incident = incidentCommandService.createIncident({
    title: 'Test Corridor Wrong-Way Movement',
    type: 'DANGEROUS_DRIVING',
    severity: 'HIGH',
    location: 'Pakwan Cross Junction (CAM-007)',
    cameraIds: ['CAM-007'],
    vehiclePlates: ['GJ01AB1234']
  });
  assert(incident.status === 'DETECTED', 'Incident initialized in DETECTED status');
  
  const statusUpdated = incidentCommandService.updateIncidentStatus(incident.incidentId, 'INVESTIGATING', 'Officer Test', 'Claimed for review');
  assert(statusUpdated, 'Incident status progressed to INVESTIGATING');

  const decisionAdded = incidentCommandService.addDecision(
    incident.incidentId,
    'Inspector Test',
    'DISPATCH_INTERCEPTION',
    'High visual confidence on camera CAM-007'
  );
  assert(decisionAdded, 'Accountable officer decision recorded with formal justification');
  assert(incident.decisions.length === 1, 'Decision stored in immutable incident record');

  // TEST 6: Human Review Queue & Data Lineage
  console.log('\n[TEST GROUP 6]: HumanReviewQueueService & Constitutional Oversight');
  const reviewItem = humanReviewQueueService.enqueueReview({
    reviewType: 'WATCHLIST_MATCH',
    priority: 'P0_CRITICAL',
    subjectPlate: 'GJ01AB1234',
    cameraId: 'CAM-007',
    originalInference: { rawOcr: 'GJ01AB1234', matchScore: 0.94 },
    originalConfidence: 0.94,
    confidenceBand: 'VERY_HIGH',
    contributingSignals: [
      { signal: 'Plate OCR', value: 'GJ01AB1234', status: 'MATCH', weight: 40 },
      { signal: 'Color', value: 'White', status: 'MATCH', weight: 30 }
    ],
    conflictingSignals: [],
    missingSignals: []
  });
  assert(reviewItem.status === 'PENDING', 'Review candidate enqueued as PENDING');
  assert(reviewItem.sourceOfTruth === 'AI_INFERRED', 'Initial sourceOfTruth marked AI_INFERRED');

  const reviewed = humanReviewQueueService.submitDecision({
    reviewId: reviewItem.reviewId,
    decision: 'APPROVED',
    reviewerId: 'OFFICER-88',
    reviewerName: 'Superintendent K. Patel',
    comment: 'Target confirmed by SP'
  });
  assert(reviewed?.status === 'APPROVED', 'Review decision recorded as APPROVED');
  assert(reviewed?.sourceOfTruth === 'HUMAN_VERIFIED', 'Source of truth transitioned to HUMAN_VERIFIED');
  assert(reviewed?.originalInference.rawOcr === 'GJ01AB1234', 'Original AI inference was NOT overwritten or mutated');

  // TEST 7: Confidence Policy & Explainability Decomposition
  console.log('\n[TEST GROUP 7]: ConfidencePolicyService Explainability Decomposer');
  const explain = confidencePolicyService.createExplainabilityRecord({
    targetType: 'CORRELATION',
    targetId: 'CORR-TEST-99',
    signals: [
      { label: 'Plate', value: 'GJ01AB1234', match: true, weight: 50 },
      { label: 'Color', value: 'White', match: true, weight: 30 },
      { label: 'Speed', value: '55 km/h', match: true, weight: 20 }
    ]
  });
  assert(explain.confidenceBand === 'VERY_HIGH', 'Confidence evaluated into VERY_HIGH band');
  assert(explain.contributingSignals.length === 3, 'All 3 signals decomposed with explicit weights');

  // TEST 8: Operational Digital Twin & Fault Injection
  console.log('\n[TEST GROUP 8]: OperationalDigitalTwinService & Dynamic Fault Injection');
  operationalDigitalTwinService.setScale(80000);
  assert(operationalDigitalTwinService.getScale() === 80000, 'Scale configured to 80,000 cameras');
  const metricsNominal = operationalDigitalTwinService.getMetrics();
  assert(metricsNominal.eventsPerSec > 5000, 'Events per sec modeled appropriately for 80K cameras');

  // Inject fault
  operationalDigitalTwinService.triggerFault('LATENCY_BURST');
  const metricsFault = operationalDigitalTwinService.getMetrics();
  assert(metricsFault.faultInjectionState.latencyBurstActive, 'Latency burst fault injected');
  assert(metricsFault.avgLatencyMs > metricsNominal.avgLatencyMs, 'System latency spiked in response to fault');
  assert(metricsFault.backpressureActive, 'Backpressure flow control activated');

  // Restore
  operationalDigitalTwinService.restoreSystem();
  const metricsRestored = operationalDigitalTwinService.getMetrics();
  assert(!metricsRestored.faultInjectionState.latencyBurstActive, 'System restored to nominal operating state');
  assert(!metricsRestored.backpressureActive, 'Backpressure throttles cleared');

  console.log('\n================================================================');
  console.log('✅ ALL OPERATIONAL AI COMMAND FABRIC TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
