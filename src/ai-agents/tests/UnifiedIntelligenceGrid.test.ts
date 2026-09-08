/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * UnifiedIntelligenceGrid.test.ts
 * Comprehensive Acceptance & Regression Suite for V1.1 Unified CCTV Intelligence Grid
 */

import { 
  normalizeLicensePlate, 
  SafeMockVehicleDataProvider 
} from '../../types';
import { 
  VehicleIntelligenceAgent 
} from '../vehicle/VehicleIntelligenceAgent';
import { 
  federatedCctvService, 
  SMART_CAMERA_INTELLIGENCE_STEPS 
} from '../../services/FederatedCctvService';
import { 
  aiOrchestrator 
} from '../orchestrator/AIAgentOrchestrator';
import { 
  agentRegistry 
} from '../registry/AIAgentRegistry';

async function runGridTests() {
  console.log('\n===============================================================');
  console.log('  GUJARAT UNIFIED CCTV INTELLIGENCE GRID V1.1 TEST SUITE');
  console.log('  Engineering: DIVYANSH Shrivastava');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, name: string) {
    if (cond) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${name}`);
      failed++;
    }
  }

  // --- GROUP 1: Plate Normalization & Safe Lookup Abstraction ---
  console.log('--- TEST GROUP 1: Plate Normalization & Vehicle Provider ---');
  
  assert(normalizeLicensePlate('gj-05-ab-1234') === 'GJ05AB1234', 'Normalizes dashes in lowercase license plate');
  assert(normalizeLicensePlate('GJ 01 CD 5678') === 'GJ01CD5678', 'Normalizes multiple spaces in license plate');
  assert(normalizeLicensePlate('GJ.27.EF.9999') === 'GJ27EF9999', 'Normalizes dots/punctuation in license plate');
  assert(normalizeLicensePlate('GJ#03$AA%1111') === 'GJ03AA1111', 'Strips special characters from plate string');

  const provider = new SafeMockVehicleDataProvider();
  const lookup = await provider.lookupVehicle('GJ05AB1234');
  assert(lookup.lookupStatus === 'NOT_CONNECTED', 'Vehicle data provider explicitly marks result as lookupStatus=NOT_CONNECTED');
  assert(lookup.disclaimer.includes('DATABASE LOOKUP: NOT CONNECTED'), 'Vehicle data lookup contains explicit disclaimer');
  assert(!lookup.disclaimer.includes('LIVE VAHAN CONNECTED'), 'Does not falsely claim unauthorized live VAHAN connection');

  // --- GROUP 2: Vehicle Intelligence Agent Registration & Execution ---
  console.log('\n--- TEST GROUP 2: Vehicle Intelligence Agent ---');
  const vehicleAgent = agentRegistry.getAgent('VEHICLE-INTEL-CENTRAL-001') as VehicleIntelligenceAgent;
  assert(!!vehicleAgent, 'VehicleIntelligenceAgent registered in agentRegistry');
  assert(vehicleAgent?.getCapabilities().includes('VEHICLE_INTELLIGENCE' as any), 'Agent advertises VEHICLE_INTELLIGENCE capability');

  const processResult = await vehicleAgent.processVehicleFrame({
    cameraId: 'CAM-AHM-007',
    siteId: 'SITE-AHM-01',
    timestamp: new Date().toISOString(),
    rawPlate: 'GJ-05-AB-1234',
    plateConfidence: 0.96,
    vehicleClass: 'SEDAN',
    sourceEdgeNode: 'EDGE-AHM-001'
  });

  assert(processResult.normalizedPlate === 'GJ05AB1234', 'Vehicle agent correctly normalizes detected plate');
  assert(processResult.isWatchlistMatch === true, 'Flagged known wanted target plate as watchlist match');
  assert(processResult.status === 'WATCHLIST_MATCH', 'Status classified as WATCHLIST_MATCH');

  const journey = vehicleAgent.reconstructJourney('GJ05AB1234');
  assert(journey.vehicleNumber === 'GJ05AB1234', 'Journey reconstruction anchors on normalized target plate');
  assert(journey.sightings.length >= 1, 'Journey contains at least one recorded sighting');

  // --- GROUP 3: Federated CCTV Department Sources & Retention Logic ---
  console.log('\n--- TEST GROUP 3: Federated Department Sources & Storage Retention ---');
  const sources = federatedCctvService.getAllSources();
  assert(sources.length === 4, 'Configured exactly 4 statewide federated department sources');

  const trafficDept = federatedCctvService.getSourceById('DEPT-TRAFFIC-01');
  assert(trafficDept?.departmentType === 'TRAFFIC', 'Traffic ITMS department source typed as TRAFFIC');
  assert(trafficDept?.retentionPolicy.rawVideoRetentionDays === 15, 'Traffic raw video retention set to 15 days');
  assert(trafficDept?.retentionPolicy.evidenceRetentionYears === 7, 'Traffic statutory evidence retention set to 7 years');

  const highwayDept = federatedCctvService.getSourceById('DEPT-HIGHWAY-02');
  assert(highwayDept?.departmentType === 'HIGHWAY', 'Highway corridor source typed as HIGHWAY');
  assert(highwayDept?.retentionPolicy.rawVideoRetentionDays === 30, 'Highway corridor raw video retention set to 30 days');

  const transitDept = federatedCctvService.getSourceById('DEPT-OTHER-GOVT-04');
  assert(transitDept?.retentionPolicy.isRawVideoExpired === true, 'Expired raw video retention identified with isRawVideoExpired=true');

  const targetCapacitySum = federatedCctvService.getTargetCapacitySum();
  assert(targetCapacitySum === 80000, `Target capacity sums to 80,000 cameras (actual: ${targetCapacitySum})`);

  const actualConnected = federatedCctvService.getActualConnectedCameras();
  assert(actualConnected === 0, `Truthful connected cameras reported as 0 (actual: ${actualConnected})`);

  // --- GROUP 4: Smart Camera Intelligence Steps ---
  console.log('\n--- TEST GROUP 4: Smart Camera Edge AI Architecture ---');
  assert(SMART_CAMERA_INTELLIGENCE_STEPS.length === 6, 'Smart camera architecture defined in 6 distinct steps');
  assert(SMART_CAMERA_INTELLIGENCE_STEPS[0].label.includes('Standard CCTV'), 'Step 1 anchors on standard CCTV without requiring onboard AI hardware');
  assert(SMART_CAMERA_INTELLIGENCE_STEPS[1].label.includes('Edge Compute Node'), 'Step 2 routes RTSP to Edge Node Appliance');
  assert(SMART_CAMERA_INTELLIGENCE_STEPS[2].isEdgeAiEnabled === true, 'Step 3 flags Edge AI enabled vision pipeline');

  // --- GROUP 5: End-to-End Wanted Vehicle Orchestration Pipeline ---
  console.log('\n--- TEST GROUP 5: Deterministic Wanted Vehicle Scenario Pipeline ---');
  const scenarioResult = await aiOrchestrator.triggerWantedVehicleScenario('GJ05AB1234');
  
  assert(!!scenarioResult.correlationId, 'Scenario returns unique correlationId');
  assert(scenarioResult.targetPlate === 'GJ05AB1234', 'Scenario targets requested normalized plate');
  assert(scenarioResult.sightingsCount === 4, `Corridor journey logged across 4 cameras (actual: ${scenarioResult.sightingsCount})`);
  assert(scenarioResult.stagesExecuted.length >= 8, `All 8 pipeline stages executed (actual: ${scenarioResult.stagesExecuted.length})`);
  assert(!!scenarioResult.evidenceId, 'Generated SHA-256 evidence item during scenario');
  assert(!!scenarioResult.alertId, 'Generated high-priority alert during scenario');
  assert(!!scenarioResult.incidentId, 'Clustered multi-camera incident during scenario');

  // --- GROUP 6: Unified Vehicle Investigation & Retention-Aware Sighting Logic ---
  console.log('\n--- TEST GROUP 6: Retention-Aware Investigation & Sighting Logic ---');
  
  // Camera department resolution
  const trafficCamDept = federatedCctvService.resolveDepartmentForCamera('CAM-007');
  assert(trafficCamDept.departmentType === 'TRAFFIC', 'CAM-007 resolves to TRAFFIC department');
  assert(trafficCamDept.retentionPolicy.rawVideoRetentionDays === 15, 'Traffic camera has 15-day raw video quota');

  const highwayCamDept = federatedCctvService.resolveDepartmentForCamera('CAM-023');
  assert(highwayCamDept.departmentType === 'HIGHWAY', 'CAM-023 resolves to HIGHWAY department');
  assert(highwayCamDept.retentionPolicy.rawVideoRetentionDays === 30, 'Highway camera has 30-day raw video quota');

  // Active retention check
  const freshIso = new Date().toISOString();
  const freshStatus = federatedCctvService.getRetentionStatusForSighting('CAM-007', freshIso);
  assert(freshStatus.isRawVideoExpired === false, 'Recent video sighting has isRawVideoExpired=false');
  assert(freshStatus.rawRetentionDays === 15, 'Fresh sighting reflects 15-day raw video policy');
  assert(freshStatus.evidenceRetentionYears === 7, 'Fresh sighting reflects 7-year statutory evidence retention');

  // Differential retention expiration comparison (20 days old)
  const twentyDaysAgoIso = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
  
  // Traffic camera (15 day quota) -> MUST BE EXPIRED
  const trafficExpired = federatedCctvService.getRetentionStatusForSighting('CAM-007', twentyDaysAgoIso);
  assert(trafficExpired.isRawVideoExpired === true, '20-day old sighting on Traffic camera (15-day quota) evaluates isRawVideoExpired=true');

  // Highway camera (30 day quota) -> MUST STILL BE ACTIVE
  const highwayActive = federatedCctvService.getRetentionStatusForSighting('CAM-023', twentyDaysAgoIso);
  assert(highwayActive.isRawVideoExpired === false, '20-day old sighting on Highway camera (30-day quota) evaluates isRawVideoExpired=false');
  assert(highwayActive.daysRemaining >= 9 && highwayActive.daysRemaining <= 11, 'Highway camera correctly calculates remaining retention days (approx 10 days)');

  console.log('\n===============================================================');
  console.log(`🎯 UNIFIED CCTV INTELLIGENCE GRID TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runGridTests().catch(err => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
