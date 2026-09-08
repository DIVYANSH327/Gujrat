/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * PersistentVehicleIntelligenceV13.test.ts
 * Comprehensive Acceptance & Regression Suite for V1.3 Persistent Vehicle Intelligence,
 * Vehicle Journey History, SHA-256 Evidence Hashing, and VAHAN RAG Knowledge Layer.
 */

import { normalizeLicensePlate, VehicleSighting } from '../../types';
import { vehicleHistoryRepository } from '../../services/VehicleHistoryRepository';
import { vehicleJourneyService } from '../../services/VehicleJourneyService';
import { vehicleRegistryKnowledgeService } from '../../services/VehicleRegistryKnowledgeService';
import { vehicleHistoryAgent } from '../vehicle/VehicleHistoryAgent';
import { aiOrchestrator } from '../orchestrator/AIAgentOrchestrator';

async function runV13Tests() {
  console.log('\n===============================================================');
  console.log('  GUJARAT CCTV INTELLIGENCE GRID V1.3 TEST SUITE');
  console.log('  Persistent Vehicle Intelligence + Vehicle Journey History');
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

  // --- GROUP 1: VehicleHistoryRepository & Persistence ---
  console.log('--- TEST GROUP 1: VehicleHistoryRepository & Sighting Persistence ---');

  const defaultSightings = await vehicleHistoryRepository.getVehicleHistory('GJ05AB1234');
  assert(defaultSightings.length >= 4, 'GJ05AB1234 has at least 4 deterministic corridor sightings in repository');
  assert(defaultSightings[0].cameraId === 'CAM-007', 'First sighting of GJ05AB1234 is at CAM-007 (Airport Circle)');
  assert(defaultSightings[defaultSightings.length - 1].cameraId === 'CAM-031', 'Last sighting of GJ05AB1234 is at CAM-031 (Ring Road Interchange)');

  // Test deterministic evidence generation
  const evidenceId = defaultSightings[0].evidenceId || 'EVD-GJ05AB1234-084200';
  const evidence = await vehicleHistoryRepository.getEvidenceRecord(evidenceId);
  assert(evidence !== null, 'Sighting evidence record is retrievable');
  assert(typeof evidence?.sha256 === 'string' && evidence.sha256.length === 64, 'Evidence SHA-256 hash is a valid 64-character hexadecimal string');
  assert(evidence?.integrityNotice?.includes('SHA-256') || evidence?.label?.includes('SIMULATED'), 'Evidence contains integrity notice or simulated label');

  // Test adding new sighting
  const newSighting: VehicleSighting = {
    sightingId: 'SGT-TEST-XX9999',
    vehicleId: 'GJ01XX9999',
    vehicleNumber: 'GJ-01-XX-9999',
    normalizedPlate: 'GJ01XX9999',
    rawPlate: 'GJ-01-XX-9999',
    cameraId: 'CAM-014',
    siteId: 'SITE-STATEWIDE',
    timestamp: new Date().toISOString(),
    direction: 'Northbound',
    plateConfidence: 0.99,
    vehicleTypeConfidence: 0.96,
    snapshotReference: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
    sourceEdgeNode: 'EDGE-00042',
    sourceType: 'SYNTHETIC_SIMULATION',
    dataClassification: 'SYNTHETIC_SIMULATION',
    createdAt: new Date().toISOString()
  };
  
  const saved = await vehicleHistoryRepository.saveSighting(newSighting);
  assert(saved.normalizedPlate === 'GJ01XX9999', 'Saved sighting automatically normalizes vehicle license plate number');

  const retrievedNew = await vehicleHistoryRepository.getVehicleHistory('gj 01 xx 9999');
  assert(retrievedNew.length === 1 && retrievedNew[0].sightingId === newSighting.sightingId, 'Querying normalized or formatted plate retrieves persisted sighting');

  // Search vehicles
  const searchResults = await vehicleHistoryRepository.searchVehicles({ query: 'GJ05' });
  assert(searchResults.length > 0, 'Search by plate prefix returns matching vehicles');
  assert(searchResults.some(r => r.normalizedPlate === 'GJ05AB1234'), 'GJ05AB1234 is found in search results');

  // --- GROUP 2: VehicleJourneyService & Trajectory Reconstruction ---
  console.log('\n--- TEST GROUP 2: VehicleJourneyService & Trajectory Engine ---');

  const journey = await vehicleJourneyService.buildJourney('GJ05AB1234');
  assert(journey.totalSightings >= 4, 'Journey reconstructs all sightings for vehicle');
  assert(journey.camerasVisited >= 4, 'Journey accurately counts unique cameras visited');
  assert(journey.durationMinutes > 0, 'Journey calculates transit duration in minutes');
  assert(journey.lastKnownLocation !== null && journey.lastKnownLocation !== undefined, 'Journey identifies last known location');
  assert(journey.lastKnownLocation?.lastCamera === 'CAM-031', 'Last known location camera is CAM-031');

  // Test corridor transit speed estimation
  assert(journey.segments !== undefined && journey.segments.length > 0, 'Journey generates corridor segments between consecutive camera sightings');
  const segment1 = journey.segments?.[0];
  assert(segment1?.fromCamera === 'CAM-007' && segment1?.toCamera === 'CAM-014', 'First segment is from CAM-007 to CAM-014');
  assert(typeof segment1?.estimatedSpeed === 'number' && (segment1.estimatedSpeed as number) > 0, 'Estimated transit speed between nodes is calculated');

  // --- GROUP 3: VehicleHistoryAgent & Mesh Integration ---
  console.log('\n--- TEST GROUP 3: VehicleHistoryAgent & Mesh Execution ---');

  const agentInfo = vehicleHistoryAgent.getInfo();
  assert(agentInfo.agentType === 'VEHICLE_HISTORY', 'VehicleHistoryAgent has correct AgentType VEHICLE_HISTORY');
  assert(agentInfo.capabilities.includes('STATE_HISTORY_INQUIRY'), 'VehicleHistoryAgent advertises STATE_HISTORY_INQUIRY capability');
  assert(agentInfo.capabilities.includes('TEMPORAL_CORRIDOR_MAPPING'), 'VehicleHistoryAgent advertises TEMPORAL_CORRIDOR_MAPPING capability');

  const dossierResponse = await vehicleHistoryAgent.synthesizeVehicleHistoryDossier('GJ05AB1234');
  assert(dossierResponse.success === true, 'VehicleHistoryAgent synthesizes vehicle history dossier successfully');
  assert(dossierResponse.dossier.vehicleNumber === 'GJ05AB1234', 'Synthesized dossier contains correct vehicle number');
  assert(dossierResponse.dossier.watchlistStatus.isFlagged === true, 'Synthesized dossier identifies watchlist flag status');
  assert(dossierResponse.dossier.journey.sightings.length >= 4, 'Synthesized dossier includes reconstructed journey');
  assert(dossierResponse.dossier.evidenceChain.length >= 4, 'Synthesized dossier includes SHA-256 evidence chain');

  // Mesh orchestrator integration
  const registeredAgent = aiOrchestrator.getAgent('VEHICLE-HISTORY-CENTRAL-001');
  assert(registeredAgent !== undefined, 'VehicleHistoryAgent is successfully registered in AIAgentOrchestrator');

  // --- GROUP 4: VehicleRegistryKnowledgeService (VAHAN RAG Layer) ---
  console.log('\n--- TEST GROUP 4: VehicleRegistryKnowledgeService (VAHAN RAG Layer) ---');

  const allDocs = vehicleRegistryKnowledgeService.getAllDocuments();
  assert(allDocs.length >= 6, 'VehicleRegistryKnowledgeService has comprehensive document corpus');

  const hsrpQuery = vehicleRegistryKnowledgeService.queryKnowledgeBase('HSRP rule 50');
  assert(hsrpQuery.matchedDocs.length > 0, 'RAG query finds HSRP Rule 50 documentation');
  assert(hsrpQuery.matchedDocs[0].authorityReference.includes('MoRTH'), 'Matched doc references MoRTH standards');

  const vinDoc = vehicleRegistryKnowledgeService.getDocByFieldName('chassis_number');
  assert(vinDoc !== undefined, 'Can lookup knowledge document by schema field name chassis_number');
  assert(vinDoc?.authorityReference.includes('ISO 3779'), 'Chassis number document cites ISO 3779 standard');

  // --- SUMMARY ---
  console.log('\n===============================================================');
  console.log(`  V1.3 TEST EXECUTION COMPLETED`);
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runV13Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
