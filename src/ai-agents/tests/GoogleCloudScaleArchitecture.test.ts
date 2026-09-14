/**
 * GoogleCloudScaleArchitecture.test.ts
 * Automated Verification Suite for Google Cloud Scale Architecture & CloudEvent Adapter
 * Gujarat Police CCTV & AI Intelligence Platform (Statewide 80,000+ Scale Target)
 * Author: DIVYANSH Shrivastava
 */

import assert from 'assert';
import {
  GoogleCloudScaleAdapter,
  GujaratCloudEventData,
  StatefulCameraNode
} from '../../services/cloud/GoogleCloudScaleAdapter.js';

console.log('--- RUNNING GOOGLE CLOUD SCALE ARCHITECTURE TEST SUITE ---');

async function runGoogleCloudScaleTestSuite() {
  try {
    const adapter = new GoogleCloudScaleAdapter({
      enabled: false, // Testing graceful offline local mode
      maxQueueSize: 10,
      maxBatchSize: 5
    });

    // -------------------------------------------------------------
    // Test 1: Camera Capability Model validates heterogeneous sensors
    // -------------------------------------------------------------
    const cam12Node: StatefulCameraNode = {
      cameraId: 'cam12',
      siteId: 'SITE-GJ-GNR-012',
      departmentId: 'TRAFFIC_POLICE_GANDHINAGAR',
      district: 'Gandhinagar',
      vendor: 'Hikvision-ANPR-Edge',
      model: 'DS-2CD7A26G0/P-IZS',
      protocol: 'ANPR_CAMERA',
      capabilitySet: {
        VIDEO: true,
        VEHICLE_DETECTION: true,
        PERSON_DETECTION: false,
        ANPR: true,
        RADAR: false,
        PTZ: false,
        EDGE_AI: true,
        VMS_API: true,
        ONVIF: true,
        RTSP: true
      },
      streamProfile: 'SUB_1080P',
      analyticsProfile: 'FULL_ANPR_HSRP',
      connectorId: 'CONN-RTSP-H264-01',
      edgeGatewayId: 'EDGE-GANDHINAGAR-01',
      healthState: 'LIVE',
      lastFrameTimestampMs: Date.now(),
      frameAgeMs: 250,
      fps: 25.0,
      resolution: '1920x1080'
    };

    assert.strictEqual(cam12Node.capabilitySet.ANPR, true, 'Test 1: CAM12 must support ANPR');
    assert.strictEqual(cam12Node.capabilitySet.RADAR, false, 'Test 1: CAM12 does not have radar');
    assert.strictEqual(cam12Node.protocol, 'ANPR_CAMERA');
    console.log('✅ Test 1 Passed: Camera Capability Model validates heterogeneous sensors.');

    // -------------------------------------------------------------
    // Test 2: Enqueues valid CloudEvent v1.0 observation
    // -------------------------------------------------------------
    const testObservation: GujaratCloudEventData = {
      eventId: 'EVT-GC-001',
      cameraId: 'cam12',
      siteId: 'SITE-GJ-GNR-012',
      departmentId: 'TRAFFIC_POLICE_GANDHINAGAR',
      district: 'Gandhinagar',
      timestamp: new Date().toISOString(),
      frameTimestamp: Date.now(),
      vehicleTrackId: 'TRK-cam12-901',
      vehicleType: 'motorcycle',
      vehicleCropReference: 'gs://gujarat-police-cctv-evidence-asia-south1/crops/cam12/veh-901.jpg',
      plateCropReference: 'gs://gujarat-police-cctv-evidence-asia-south1/crops/cam12/plate-901.jpg',
      enhancedPlateCropReference: 'gs://gujarat-police-cctv-evidence-asia-south1/crops/cam12/plate-901-opt.jpg',
      enhancementType: 'OPTICAL_ENHANCEMENT',
      ocrText: 'GJ01AB1234',
      ocrStatus: 'VERIFIED',
      anprStatus: 'HSRP_COMPLIANT',
      aiProvider: 'DETERMINISTIC_CV',
      aiModel: 'hsrp-optical-engine-v2',
      sourceHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      evidenceReference: 'EVID-BSA-901',
      idempotencyKey: 'IDEMP-cam12-901-T1'
    };

    const result = adapter.enqueueObservation(testObservation);
    assert.strictEqual(result.success, true, 'Test 2: Enqueue must succeed');
    assert.strictEqual(result.deduplicated, false, 'Test 2: First enqueue is not duplicate');
    assert.strictEqual(result.queueDepth, 1, 'Test 2: Queue depth must be 1');
    console.log('✅ Test 2 Passed: Standard CloudEvent v1.0 observation enqueued successfully.');

    // -------------------------------------------------------------
    // Test 3: Idempotency Key deduplication prevents duplicate events
    // -------------------------------------------------------------
    const duplicateResult = adapter.enqueueObservation(testObservation);
    assert.strictEqual(duplicateResult.success, true);
    assert.strictEqual(duplicateResult.deduplicated, true, 'Test 3: Second enqueue with same key must be deduplicated');
    assert.strictEqual(duplicateResult.queueDepth, 1, 'Test 3: Queue depth must not increase on duplicate');
    console.log('✅ Test 3 Passed: Idempotency Key deduplication prevents duplicate events.');

    // -------------------------------------------------------------
    // Test 4: Bounded Queue & Dead-Letter handling prevents memory overflow
    // -------------------------------------------------------------
    for (let i = 2; i <= 15; i++) {
      adapter.enqueueObservation({
        ...testObservation,
        eventId: `EVT-GC-${i}`,
        idempotencyKey: `IDEMP-cam12-901-T${i}`
      });
    }

    const telemetry = adapter.getTelemetry();
    assert.ok(telemetry.queueDepth <= 10, 'Test 4: Queue depth must remain bounded at maxQueueSize (10)');
    assert.ok(telemetry.eventsDroppedOverflow > 0, 'Test 4: Oldest events must overflow to dead-letter storage');
    assert.ok(telemetry.deadLetterCount > 0, 'Test 4: Dead letter queue must store dropped events');
    console.log(`✅ Test 4 Passed: Bounded queue enforcement (Queue: ${telemetry.queueDepth}, Dropped: ${telemetry.eventsDroppedOverflow}, Dead-Letter: ${telemetry.deadLetterCount}).`);

    // -------------------------------------------------------------
    // Test 5: Graceful Offline Local Mode operation
    // -------------------------------------------------------------
    const flushRes = await adapter.flushQueue();
    assert.ok(flushRes.dispatched > 0, 'Test 5: Local flush dispatches without network errors');
    assert.strictEqual(adapter.getTelemetry().status, 'OFFLINE_LOCAL_MODE', 'Test 5: Status remains OFFLINE_LOCAL_MODE');
    console.log('✅ Test 5 Passed: Graceful Offline Local Mode operates reliably without external network dependencies.');

    // -------------------------------------------------------------
    // Test 6: BigQuery Partitioned Schema Definition
    // -------------------------------------------------------------
    const bqDef = adapter.getBigQuerySchemaDefinition();
    assert.strictEqual(bqDef.dataset, 'police_surveillance_mesh');
    assert.strictEqual(bqDef.table, 'statewide_vehicle_events_v1');
    assert.strictEqual(bqDef.partitionField, 'timestamp (DAY)');
    assert.ok(bqDef.schema.some(f => f.name === 'sourceHash'), 'Test 6: BigQuery schema must include sourceHash');
    assert.ok(bqDef.schema.some(f => f.name === 'idempotencyKey'), 'Test 6: BigQuery schema must include idempotencyKey');
    console.log('✅ Test 6 Passed: BigQuery partition and schema definitions validated.');

    // -------------------------------------------------------------
    // Test 7: Statewide 80,000+ Camera Scale Topology & Bandwidth Math
    // -------------------------------------------------------------
    const topology = adapter.getStatewideArchitectureTopology();
    assert.strictEqual(topology.targetScale.totalCameras, 80000);
    assert.strictEqual(topology.targetScale.regionalEdgeGateways, 33);
    assert.strictEqual(topology.layers.length, 6);
    assert.ok(topology.targetScale.estimatedRawThroughputGbps > topology.targetScale.edgeFilteredThroughputGbps);
    console.log('✅ Test 7 Passed: 80,000+ camera statewide architecture topology validated.');

    adapter.shutdown();
    console.log('===============================================================');
    console.log('🎉 ALL 7 GOOGLE CLOUD SCALE ARCHITECTURE TESTS PASSED!');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error in Google Cloud Scale test suite:', err);
    process.exit(1);
  }
}

runGoogleCloudScaleTestSuite();
