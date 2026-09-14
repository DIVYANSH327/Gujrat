/**
 * GoogleCloudAdaptersAndSpecializedAgents.test.ts
 * Comprehensive Verification of Cloud Scale Adapters and the 6 Specialized Agents
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

import {
  LocalEventBus,
  CloudEventOutbox,
  GooglePubSubEventBus,
  LocalEvidenceStore,
  GoogleCloudStorageEvidenceStore,
  BigQueryIntelligenceAdapter,
  LocalReasoningProvider,
  GoogleGeminiReasoningProvider,
  LocalVisionProvider,
  GoogleVisionProvider,
  IncidentIntelligenceAgent,
  VehicleInvestigationAgent,
  CameraHealthAgent,
  EvidenceIntegrityAgent,
  OfficerReportAgent,
  WatchlistIntelligenceAgent,
  IntelligenceOrchestrator,
  GoogleMapsAdapter
} from '../../services/cloud/index.js';

describe('Google Cloud Scale Adapters & Specialized Agents Suite', () => {

  // 1. EventBus & CloudEventOutbox
  describe('1. EventBus & Outbox Engine', () => {
    it('should publish events to LocalEventBus and receive on subscriber', async () => {
      const bus = new LocalEventBus();
      let received = false;

      bus.subscribe('VEHICLE_DETECTED', (evt) => {
        if (evt.eventId === 'EVT-TEST-001') received = true;
      });

      await bus.publish({
        eventId: 'EVT-TEST-001',
        schemaVersion: '1.0',
        eventType: 'VEHICLE_DETECTED',
        cameraId: 'cam12',
        sourceId: 'EDGE-GANDHINAGAR-01',
        timestamp: new Date().toISOString(),
        correlationId: 'CORR-001',
        idempotencyKey: 'IDEMP-001',
        payload: { vehicleType: 'car' }
      });

      assert.strictEqual(received, true, 'LocalEventBus subscriber should receive event');
    });

    it('should deduplicate events with identical idempotencyKey in CloudEventOutbox', () => {
      const outbox = new CloudEventOutbox(100);
      const testEvent = {
        eventId: 'EVT-DUP-001',
        schemaVersion: '1.0' as const,
        eventType: 'PLATE_OBSERVATION' as const,
        cameraId: 'cam01',
        sourceId: 'EDGE-01',
        timestamp: new Date().toISOString(),
        correlationId: 'CORR-002',
        idempotencyKey: 'IDEMP-UNIQUE-ABC',
        payload: { plate: 'GJ01AB1234' }
      };

      const res1 = outbox.enqueue(testEvent);
      assert.strictEqual(res1.deduplicated, false, 'First event must not be marked deduplicated');
      assert.strictEqual(outbox.getDepth(), 1);

      const res2 = outbox.enqueue(testEvent);
      assert.strictEqual(res2.deduplicated, true, 'Duplicate idempotency key must be deduplicated');
      assert.strictEqual(outbox.getDepth(), 1, 'Queue depth must not increase on duplicate');
    });

    it('should handle retry failures and move to dead-letter queue after max attempts', () => {
      const outbox = new CloudEventOutbox(50);
      const testEvent = {
        eventId: 'EVT-FAIL-001',
        schemaVersion: '1.0' as const,
        eventType: 'INCIDENT_DETECTED' as const,
        cameraId: 'cam12',
        sourceId: 'EDGE-01',
        timestamp: new Date().toISOString(),
        correlationId: 'CORR-003',
        idempotencyKey: 'IDEMP-FAIL-001',
        payload: {}
      };

      outbox.enqueue(testEvent);
      assert.strictEqual(outbox.getDepth(), 1);

      // Simulate 5 failures
      for (let i = 0; i < 5; i++) {
        outbox.markFailure('EVT-FAIL-001', 'Simulated Network Error');
      }

      assert.strictEqual(outbox.getDepth(), 0, 'Item should be removed from active queue');
      assert.strictEqual(outbox.getDeadLetterCount(), 1, 'Item should be moved to dead-letter queue');
    });
  });

  // 2. Evidence Storage & Section 63 BSA 2023 Compliance
  describe('2. Evidence Store (BSA 2023 Vault)', () => {
    it('should store original evidence without alteration and calculate valid SHA-256', async () => {
      const store = new LocalEvidenceStore();
      const rawBuffer = Buffer.from('FAKE_RAW_CAMERA_FRAME_DATA_FOR_FORENSIC_TEST');
      const expectedHash = crypto.createHash('sha256').update(rawBuffer).digest('hex');

      const result = await store.putOriginalEvidence({
        buffer: rawBuffer,
        cameraId: 'cam12',
        timestamp: Date.now(),
        incidentId: 'INC-2026-001'
      });

      assert.strictEqual(result.sha256, expectedHash);
      assert.strictEqual(result.isOriginal, true);
      assert.strictEqual(result.statutoryCompliance, 'Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023) Section 63');

      // Verify integrity
      const verify = await store.verifyIntegrity(result.evidenceId, expectedHash);
      assert.strictEqual(verify.verified, true);
    });

    it('should segregate derived enhanced evidence from original raw evidence', async () => {
      const store = new LocalEvidenceStore();
      const rawBuffer = Buffer.from('RAW_FRAME');
      const rawHash = crypto.createHash('sha256').update(rawBuffer).digest('hex');
      const enhancedBuffer = Buffer.from('ENHANCED_SUPER_RESOLUTION_FRAME');

      const origRes = await store.putOriginalEvidence({
        buffer: rawBuffer,
        cameraId: 'cam01',
        timestamp: Date.now()
      });

      const derivedRes = await store.putDerivedEvidence({
        buffer: enhancedBuffer,
        originalSha256: rawHash,
        enhancementType: 'OPTICAL_ENHANCEMENT',
        cameraId: 'cam01',
        timestamp: Date.now()
      });

      assert.strictEqual(origRes.isOriginal, true);
      assert.strictEqual(derivedRes.isOriginal, false);
      assert.notStrictEqual(origRes.storageUri, derivedRes.storageUri);
      assert(derivedRes.storageUri.includes('/derived/optical_enhancement/'));
    });
  });

  // 3. BigQuery Schemas & Query Adapter
  describe('3. BigQuery Intelligence Adapter', () => {
    it('should define schemas for all required tables with day partitioning', () => {
      const bq = new BigQueryIntelligenceAdapter('test_dataset');
      const tables = bq.getAllTableDefinitions();

      const expected = [
        'camera_events',
        'camera_health',
        'vehicle_observations',
        'plate_observations',
        'incidents',
        'watchlist_matches',
        'audit_events'
      ];

      for (const t of expected) {
        assert(tables[t], `Table definition for ${t} must exist`);
        assert(tables[t].ddl.includes('PARTITION BY'), `Table ${t} must have PARTITION BY in DDL`);
        assert(tables[t].ddl.includes('CLUSTER BY'), `Table ${t} must have CLUSTER BY in DDL`);
      }
    });

    it('should generate valid vehicle trace SQL query', () => {
      const bq = new BigQueryIntelligenceAdapter('police_dataset');
      const sql = bq.generateVehicleTraceQuery('GJ01AB1234', '2026-09-01T00:00:00Z', '2026-09-01T23:59:59Z');
      assert(sql.includes('SELECT'));
      assert(sql.includes('FROM `police_dataset.vehicle_observations`'));
      assert(sql.includes('LEFT JOIN `police_dataset.plate_observations`'));
    });
  });

  // 4. Reasoning Provider
  describe('4. Reasoning Provider & Local Fallback', () => {
    it('should provide structured incident analysis with truth categorization', async () => {
      const provider = new LocalReasoningProvider();
      const result = await provider.analyzeIncident({
        incidentId: 'INC-TEST-100',
        description: 'Wrong way driving on SG Highway',
        observations: [
          { cameraId: 'cam12', vehicleType: 'car', ocrStatus: 'VERIFIED', frameSha256: 'abc12345' }
        ],
        timestamps: [new Date().toISOString()],
        cameraIds: ['cam12']
      });

      assert.strictEqual(result.incidentId, 'INC-TEST-100');
      assert.strictEqual(result.evidenceTimeline.length, 1);
      assert.strictEqual(result.evidenceTimeline[0].certainty, 'OBSERVED');
      assert.strictEqual(result.provider, 'LOCAL_DETERMINISTIC');
    });
  });

  // 5. Vision Provider
  describe('5. Vision Provider', () => {
    it('should reject unprocessable/empty buffers gracefully', async () => {
      const vision = new LocalVisionProvider();
      const res = await vision.analyzeFrame({
        imageBuffer: Buffer.alloc(10), // Too small
        cameraId: 'cam01',
        timestamp: Date.now()
      });

      assert.strictEqual(res.status, 'LOW_QUALITY_REJECTED');
      assert.strictEqual(res.detections.length, 0);
    });

    it('should report candidate detections on valid image buffers', async () => {
      const vision = new LocalVisionProvider();
      const validBuf = Buffer.alloc(500, 255); // Valid size
      const res = await vision.analyzeFrame({
        imageBuffer: validBuf,
        cameraId: 'cam12',
        timestamp: Date.now()
      });

      assert.strictEqual(res.status, 'SUCCESS');
      assert(res.detections.length > 0);
      assert.strictEqual(res.provider, 'DETERMINISTIC_CV');
    });
  });

  // 6. The 6 Specialized Intelligence Agents
  describe('6. Specialized Intelligence Agents', () => {
    it('Agent 1: IncidentIntelligenceAgent should generate BSA Section 63 integrity-preserved incident output', async () => {
      const agent = new IncidentIntelligenceAgent();
      const out = await agent.analyze({
        incidentId: 'INC-001',
        incidentType: 'SPEEDING',
        description: 'High speed vehicle near Toll Plaza',
        location: 'Tri Mandir Adalaj Tollnaka',
        cameraIds: ['cam12'],
        observations: [{ cameraId: 'cam12', vehicleType: 'car', ocrStatus: 'VERIFIED' }],
        timestamps: [new Date().toISOString()]
      });

      assert.strictEqual(out.incidentId, 'INC-001');
      assert.strictEqual(out.statutoryAdmissibility, 'BSA_2023_SECTION_63_INTEGRITY_PRESERVED');
    });

    it('Agent 2: VehicleInvestigationAgent should correlate matching sightings without hallucination', async () => {
      const agent = new VehicleInvestigationAgent();
      const out = await agent.investigate({
        targetPlateOrTrack: 'GJ01AB1234',
        existingObservations: [
          { cameraId: 'cam12', location: 'Tollnaka', ocrResult: 'GJ01AB1234', vehicleType: 'car', frameSha256: 'hash1' },
          { cameraId: 'cam01', location: 'Bridge', ocrResult: 'GJ01XY9999', vehicleType: 'truck', frameSha256: 'hash2' }
        ]
      });

      assert.strictEqual(out.target, 'GJ01AB1234');
      assert.strictEqual(out.sightingsCount, 1);
      assert.strictEqual(out.chronologicalSightings[0].cameraId, 'cam12');
    });

    it('Agent 3: CameraHealthAgent should accurately classify stale, offline, and healthy states', () => {
      const agent = new CameraHealthAgent();

      // Healthy camera
      const hReport = agent.evaluate({
        cameraId: 'cam01',
        name: 'Bridge Node',
        status: 'online',
        lastFrameTimestampMs: Date.now() - 1000,
        fps: 25
      });
      assert.strictEqual(hReport.operationalStatus, 'HEALTHY');

      // Offline camera
      const oReport = agent.evaluate({
        cameraId: 'cam12',
        name: 'Tollnaka Node',
        status: 'offline',
        lastFrameTimestampMs: Date.now() - 120000,
        fps: 0
      });
      assert.strictEqual(oReport.operationalStatus, 'OFFLINE');
      assert(oReport.explanation.includes('no fresh frame'));
    });

    it('Agent 4: EvidenceIntegrityAgent should verify valid SHA-256 and fail invalid hash', async () => {
      const agent = new EvidenceIntegrityAgent();
      const buf = Buffer.from('FORENSIC_RAW_VIDEO_PAYLOAD');
      const correctHash = crypto.createHash('sha256').update(buf).digest('hex');

      const validCheck = await agent.verifyEvidence('EVID-001', correctHash, buf);
      assert.strictEqual(validCheck.status, 'VERIFIED');

      const invalidCheck = await agent.verifyEvidence('EVID-001', 'corrupted_hash_value_123', buf);
      assert.strictEqual(invalidCheck.status, 'FAILED');
    });

    it('Agent 5: OfficerReportAgent should compile full Section 63 BSA legal report', async () => {
      const agent = new OfficerReportAgent();
      const report = await agent.generateReport({
        incident: { id: 'INC-2026-99', title: 'Adalaj Toll Incident', location: 'Gandhinagar' },
        observations: [{ cameraId: 'cam12', vehicleType: 'car', ocrResult: 'GJ01AB1234', ocrStatus: 'VERIFIED' }],
        evidence: [{ id: 'EVID-01', sha256: 'abc123hash', type: 'RAW_CCTV_FRAME' }],
        officerNotes: 'Vehicle intercepted at check post.'
      });

      assert(report.reportId.startsWith('REP-BSA-'));
      assert(report.observedFacts.length > 0);
      assert.strictEqual(report.forensicEvidenceList[0].admissibility, 'BSA_2023_COMPLIANT');
    });

    it('Agent 6: WatchlistIntelligenceAgent should match candidate plates and ignore unreadable OCR', () => {
      const agent = new WatchlistIntelligenceAgent();
      const watchlists = [
        { id: 'WL-001', plateNumber: 'GJ01AB1234', category: 'STOLEN_VEHICLE' }
      ];

      // Readable match
      const match = agent.evaluateSighting('GJ 01 AB 1234', watchlists, 'cam12');
      assert(match !== null);
      assert.strictEqual(match?.reviewStatus, 'MATCH_CANDIDATE');
      assert.strictEqual(match?.targetPlate, 'GJ01AB1234');

      // Unreadable OCR returns null
      const unreadable = agent.evaluateSighting('NOT_READABLE', watchlists, 'cam12');
      assert.strictEqual(unreadable, null);
    });
  });

  // 7. Google Maps Adapter
  describe('7. Google Maps Platform Adapter', () => {
    it('should transform camera registry into map markers without coordinate fabrication', () => {
      const maps = new GoogleMapsAdapter();
      const markers = maps.transformCamerasToMarkers([
        { id: 'cam01', name: 'Bridge', latitude: 23.0225, longitude: 72.5714, status: 'online', district: 'Ahmedabad' },
        { id: 'cam02', name: 'No Geo Cam', status: 'online' } // Missing coordinates
      ]);

      assert.strictEqual(markers.length, 1);
      assert.strictEqual(markers[0].id, 'cam01');
      assert.strictEqual(markers[0].latitude, 23.0225);
    });

    it('should calculate authentic distance along verified CCTV path', () => {
      const maps = new GoogleMapsAdapter();
      const route = maps.buildVerifiableRoute('TRK-001', [
        { cameraId: 'cam01', location: 'Point A', latitude: 23.0225, longitude: 72.5714, timestamp: '2026-09-01T10:00:00Z' },
        { cameraId: 'cam12', location: 'Point B', latitude: 23.1670, longitude: 72.5850, timestamp: '2026-09-01T10:15:00Z' }
      ]);

      assert.strictEqual(route.points.length, 2);
      assert(route.totalDistanceKm > 10, 'Distance between Ahmedabad and Adalaj should be > 10km');
    });
  });

  // 8. Intelligence Orchestrator (Investigation Assistance)
  describe('8. Intelligence Orchestrator', () => {
    it('should coordinate all 6 agents and produce structured dossier with guardrails', async () => {
      const orchestrator = new IntelligenceOrchestrator();
      const dossier = await orchestrator.orchestrateInvestigation({
        incidentId: 'INC-ORCH-001',
        incidentType: 'SPEEDING',
        description: 'Over-speeding vehicle at Toll Plaza',
        location: 'Tri Mandir Adalaj Tollnaka',
        cameraIds: ['cam12'],
        targetPlate: 'GJ01AB1234',
        observations: [
          { cameraId: 'cam12', location: 'Tollnaka', ocrResult: 'GJ01AB1234', vehicleType: 'car', ocrStatus: 'VERIFIED', frameSha256: 'abc12345' }
        ],
        timestamps: [new Date().toISOString()],
        watchlists: [{ id: 'WL-01', plateNumber: 'GJ01AB1234', category: 'SUSPECT_SURVEILLANCE' }],
        officerId: 'OFFICER-007',
        officerNotes: 'Assigned for follow-up.'
      });

      assert.strictEqual(dossier.incidentId, 'INC-ORCH-001');
      assert(dossier.investigationId.startsWith('INV-'));
      assert(dossier.cameraHealthSummary.length > 0);
      assert(dossier.watchlistCandidates.length === 1);
      assert.strictEqual(dossier.watchlistCandidates[0].reviewStatus, 'MATCH_CANDIDATE');
      assert(dossier.assistiveGuardrailNotice.includes('AI ASSISTANCE DISCLOSURE'));
      assert(dossier.statutoryIntegrityNotice.includes('BSA 2023'));
    });
  });
});
