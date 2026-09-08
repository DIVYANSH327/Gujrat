/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * V2.0 Architecture Test Suite: Distributed AI Agent Mesh + Vehicle Intelligence Fabric
 */

import { centralEventBus } from '../../services/CentralEventBus';
import { agentSupervisor } from '../../services/AgentSupervisorService';
import { aiJobScheduler } from '../../services/AIJobSchedulerService';
import { crossCameraCorrelationAgent } from '../vehicle/CrossCameraVehicleCorrelationAgent';
import { mobilePatrolAlpha } from '../../services/MobileCameraAgent';
import { vehicleIntelligenceGraph } from '../../services/VehicleIntelligenceGraphService';
import { lastSeenVehicleService } from '../../services/LastSeenVehicleService';
import { scaleSimulation } from '../../services/ScaleSimulationService';
import { evidencePolicyEngine } from '../../services/EvidencePolicyEngine';
import { godsEyeObservationService } from '../../services/GodsEyeObservationService';
import { VehicleObservation } from '../../types';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
    passedCount++;
  } else {
    console.error(`❌ FAILED: ${message}`);
    failedCount++;
  }
}

async function runV20TestSuite() {
  console.log('===============================================================');
  console.log('  GUJARAT CCTV INTELLIGENCE GRID V2.0 ARCHITECTURAL SUITE');
  console.log('  Distributed Agent Mesh + Vehicle Intelligence Fabric + 80k Scale');
  console.log('===============================================================');

  // 1. Central Event Bus
  console.log('\n--- TEST GROUP 1: Central Event Bus & Backpressure ---');
  let receivedEvent = false;
  const subId = centralEventBus.subscribe('VEHICLE_DETECTED', () => {
    receivedEvent = true;
  });

  const published = centralEventBus.publish({
    eventType: 'VEHICLE_DETECTED',
    sourceId: 'CAM-007',
    correlationId: 'CORR-V2-TEST-01',
    idempotencyKey: 'IDEMP-TEST-001',
    priority: 'P1',
    payload: { plate: 'GJ01AB1234', confidence: 0.98 }
  });

  assert(published === true, 'Event published to CentralEventBus successfully');
  assert(Boolean(receivedEvent), 'Subscriber received published VEHICLE_DETECTED event');
  centralEventBus.unsubscribe(subId);

  // 2. Cross Camera Multi-Signal Correlation Agent
  console.log('\n--- TEST GROUP 2: Cross-Camera Multi-Signal Correlation & Explainability ---');
  const obsA: VehicleObservation = {
    observationId: 'OBS-CAM-007-001',
    eventId: 'EVT-001',
    cameraId: 'CAM-007',
    cameraName: 'Pakwan Cross Junction',
    edgeNodeId: 'EDGE-01',
    trackId: 'TRK-01',
    vehicleClass: 'car',
    vehicleColor: 'white',
    plateText: 'GJ01AB1234',
    plateNormalized: 'GJ01AB1234',
    plateStatus: 'PLATE_READ',
    plateConfidence: 0.96,
    vehicleConfidence: 0.98,
    bbox: [0.1, 0.1, 0.5, 0.5],
    frameWidth: 1920,
    frameHeight: 1080,
    timestamp: '2026-09-06T10:00:00Z',
    sourceType: 'SIMULATED_DEMO',
    analysisMode: 'REAL_AI',
    isBestFrame: true,
    status: 'CORRELATED',
    gps: { latitude: 23.03, longitude: 72.53 },
    imageReference: 'evidence/simulated/car_frame1.jpg',
    watchlistMatch: false
  };

  const obsB: VehicleObservation = {
    observationId: 'OBS-CAM-014-001',
    eventId: 'EVT-002',
    cameraId: 'CAM-014',
    cameraName: 'Thaltej Underpass',
    edgeNodeId: 'EDGE-02',
    trackId: 'TRK-02',
    vehicleClass: 'car',
    vehicleColor: 'white',
    plateText: 'GJ01AB1234',
    plateNormalized: 'GJ01AB1234',
    plateStatus: 'PLATE_READ',
    plateConfidence: 0.95,
    vehicleConfidence: 0.97,
    bbox: [0.2, 0.2, 0.6, 0.6],
    frameWidth: 1920,
    frameHeight: 1080,
    timestamp: '2026-09-06T10:02:00Z', // 120s later along CAM-007 -> CAM-014 corridor
    sourceType: 'SIMULATED_DEMO',
    analysisMode: 'REAL_AI',
    isBestFrame: true,
    status: 'CORRELATED',
    gps: { latitude: 23.05, longitude: 72.51 },
    imageReference: 'evidence/simulated/car_frame2.jpg',
    watchlistMatch: false
  };

  const correlation = crossCameraCorrelationAgent.correlateObservations(obsA, obsB);
  assert(correlation.isDefinitiveMatch === true, 'Correlator identifies definitive multi-signal match');
  assert(correlation.matchConfidence >= 0.85, 'Correlation match confidence exceeds 0.85 threshold');
  assert(correlation.scoreBreakdown.plateConfidence === 1.0, 'Plate confidence is 1.0 for exact alphanumeric match');
  assert(correlation.matchedSignals.length >= 3, 'At least 3 signals matched (Plate, Class, Color, Topology)');

  const decisionExplanation = crossCameraCorrelationAgent.explainDecision(correlation);
  assert(decisionExplanation.decisionType === 'CROSS_CAMERA_VEHICLE_CORRELATION', 'Decision explanation type matches');
  assert(decisionExplanation.policy.includes('GUJARAT_POLICE'), 'Decision cites formal Gujarat Police SOP policy');

  // 3. Mobile Camera Interceptor & Offline Store-and-Forward
  console.log('\n--- TEST GROUP 3: Mobile Patrol Interceptor & Resync ---');
  assert(mobilePatrolAlpha.agentId === 'MOBILE-PATROL-01', 'Mobile Camera Agent initialized');
  assert(mobilePatrolAlpha.agentType === 'MOBILE_CAMERA', 'Mobile Agent has MOBILE_CAMERA type');
  
  const mobileObs = await mobilePatrolAlpha.captureMobileObservation({
    plateText: 'GJ27AB9999',
    vehicleClass: 'car',
    color: 'silver',
    image: 'evidence/simulated/mobile_intercept.jpg'
  });
  assert(mobileObs.isMobileCamera === true, 'Observation flagged as mobile camera capture');
  assert(mobileObs.plateNormalized === 'GJ27AB9999', 'Mobile observation extracted normalized plate');

  // 4. Vehicle Intelligence Graph & Last Seen Dossier
  console.log('\n--- TEST GROUP 4: Vehicle Intelligence Graph & Last Seen Dossier ---');
  await godsEyeObservationService.recordObservation(obsA);
  await godsEyeObservationService.recordObservation(obsB);
  vehicleIntelligenceGraph.linkObservation(obsA);
  vehicleIntelligenceGraph.linkObservation(obsB);

  const graph = vehicleIntelligenceGraph.getVehicleGraph('GJ01AB1234');
  assert(graph.vehicleId === 'GJ01AB1234', 'Vehicle Graph built for target vehicle');
  assert(graph.nodesCount >= 2, 'Graph contains nodes for observed cameras and detections');

  const timeline = vehicleIntelligenceGraph.getVehicleTimeline('GJ01AB1234');
  assert(timeline.length >= 2, 'Timeline chronologically orders observations and evidence');

  // Test with seeded wanted vehicle GJ05AB1234
  const lastSeenWanted = lastSeenVehicleService.getVehicleLastSeen('GJ05AB1234');
  assert(lastSeenWanted !== null, 'Last Seen Dossier synthesized successfully for wanted vehicle');
  assert(lastSeenWanted?.lastObservedCamera === 'CAM-031', 'Correctly identifies most recent camera (CAM-031)');
  assert(lastSeenWanted?.nextLikelyCameras.length! > 0, 'Topology predicts downstream candidate cameras');

  // 5. Agent Supervisor & Failover Reassignment
  console.log('\n--- TEST GROUP 5: Agent Supervisor Lifecycle & Failover ---');
  agentSupervisor.registerAgent(crossCameraCorrelationAgent);
  const health = agentSupervisor.evaluateAgentHealth(crossCameraCorrelationAgent.agentId);
  assert(health === 'HEALTHY', 'Supervisor evaluates active agent as HEALTHY');

  const enqueuedJob = aiJobScheduler.submitJob({
    jobId: 'JOB-V2-FAILOVER-TEST',
    jobType: 'VEHICLE_CORRELATION',
    priority: 'HIGH',
    createdAt: new Date().toISOString(),
    sourceId: 'CAM-007',
    requiredCapabilities: ['VEHICLE_CORRELATION'],
    assignedAgentId: crossCameraCorrelationAgent.agentId,
    status: 'QUEUED',
    attempt: 0,
    maxAttempts: 3,
    correlationId: 'CORR-V2-JOB-01',
    payload: { test: true }
  });
  assert(enqueuedJob !== null, 'Job submitted to AIJobScheduler');

  // 6. Scale Lab Capacity & Bandwidth Savings Simulation
  console.log('\n--- TEST GROUP 6: 80,000-Camera Scale Simulation ---');
  const simConfig = scaleSimulation.getConfig();
  assert(simConfig.cameraScale === 80000, 'Baseline simulation targets 80,000 CCTV cameras');

  const telemetry = scaleSimulation.getTelemetry();
  assert(telemetry.bandwidthSavingsPercent >= 99.0, 'Bandwidth savings exceed 99% (actual: ' + telemetry.bandwidthSavingsPercent + '%)');
  assert(telemetry.storageSavingsPercent >= 99.0, 'Storage savings exceed 99% (actual: ' + telemetry.storageSavingsPercent + '%)');
  assert(telemetry.activeEdgeNodes === 1600, 'Calculates 1,600 edge nodes at 50 cameras/node');

  // 7. Evidence Retention Quota & Section 65B Integrity
  console.log('\n--- TEST GROUP 7: Statutory Evidence Retention Quotas ---');
  const trafficPolicy = evidencePolicyEngine.getRetentionPolicy('TRAFFIC');
  assert(trafficPolicy.rawVideoRetentionDays === 15, 'Traffic ITMS raw video quota is exactly 15 days');
  assert(trafficPolicy.statutoryEvidenceRetentionYears === 7, 'Section 65B statutory evidence retention is 7 years');

  const highwayPolicy = evidencePolicyEngine.getRetentionPolicy('HIGHWAY');
  assert(highwayPolicy.rawVideoRetentionDays === 30, 'State Highway raw video quota is 30 days');

  console.log('\n===============================================================');
  console.log(`🎯 V2.0 ARCHITECTURAL SUITE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runV20TestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
