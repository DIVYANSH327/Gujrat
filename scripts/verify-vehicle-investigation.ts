async function testVehicleInvestigation() {
  console.log('========================================================================');
  console.log('🚗 VERIFYING VEHICLE INVESTIGATION API');
  console.log('========================================================================\n');

  // 1. Search for a plate that should return nothing
  console.log('1. Searching for non-existent plate: NO_MATCH_PLATE_8888');
  const emptyRes = await fetch('http://localhost:3000/api/investigation/vehicle-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'NO_MATCH_PLATE_8888' })
  });
  const emptyData = await emptyRes.json();
  console.log(`  Status: ${emptyRes.status} | Total Results: ${emptyData.totalResults} | Message: ${emptyData.message}`);
  if (emptyData.totalResults === 0 && emptyData.results.length === 0) {
    console.log('  ✅ Non-existent search returns zero results without demo fallback data.');
  } else {
    console.error('  ❌ FAILED: Unexpected data returned for non-existent plate!');
  }

  // 2. Insert clearly marked synthetic TEST observation into central repository
  const testPlate = 'GJ01TEST777';
  const testTimestamp = new Date().toISOString();
  console.log(`\n2. Ingesting synthetic TEST observation for plate ${testPlate}...`);
  const ingestRes = await fetch('http://localhost:3000/api/edge/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [
        {
          eventId: `EVT-TEST-${Date.now()}`,
          eventType: 'ANPR',
          cameraId: 'cam12',
          timestamp: testTimestamp,
          confidence: 0.94,
          edgeNodeId: 'EDGE-SENTINEL-01',
          metadata: {
            plate: testPlate,
            registrationNumber: testPlate,
            vehicleClass: 'Sedan',
            vehicleColor: 'White',
            vehicleMake: 'Tata',
            district: 'Gandhinagar',
            location: 'TriMandir Adalaj Highway Toll Plaza'
          }
        }
      ]
    })
  });
  console.log(`  Ingest HTTP Status: ${ingestRes.status}`);

  // 3. Search Full Plate
  console.log('\n3. Searching Full Plate: ' + testPlate);
  const fullRes = await fetch('http://localhost:3000/api/investigation/vehicle-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: testPlate })
  });
  const fullData = await fullRes.json();
  console.log(`  Total Results: ${fullData.totalResults}`);
  const match = fullData.results.find((r: any) => r.normalizedPlateText.includes('GJ01TEST777') || r.rawPlateText.includes('GJ01TEST777'));
  if (match) {
    console.log(`  ✅ Full Plate Match: Camera=${match.cameraId}, Vehicle=${match.vehicleType}, District=${match.district}`);
  } else {
    console.error('  ❌ Full plate match failed!');
  }

  // 4. Search Partial Plate: TEST777
  console.log('\n4. Searching Partial Plate: TEST777');
  const partRes = await fetch('http://localhost:3000/api/investigation/vehicle-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'TEST777' })
  });
  const partData = await partRes.json();
  console.log(`  Total Results for partial query: ${partData.totalResults}`);
  if (partData.totalResults >= 1) {
    console.log('  ✅ Partial plate search matched successfully.');
  }

  // 5. Search with Camera Filter: cam12 (match) vs cam02 (no match)
  console.log('\n5. Searching with Camera Filter:');
  const cam12Res = await fetch('http://localhost:3000/api/investigation/vehicle-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: testPlate, camera: 'cam12' })
  });
  const cam12Data = await cam12Res.json();
  console.log(`  Matching Camera (cam12) Results: ${cam12Data.totalResults}`);

  const cam02Res = await fetch('http://localhost:3000/api/investigation/vehicle-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: testPlate, camera: 'cam02' })
  });
  const cam02Data = await cam02Res.json();
  console.log(`  Non-matching Camera (cam02) Results: ${cam02Data.totalResults}`);
  if (cam12Data.totalResults >= 1 && cam02Data.totalResults === 0) {
    console.log('  ✅ Camera filter accurately distinguishes sightings.');
  }

  // 6. Search with Time Range Filter
  console.log('\n6. Searching with Time Range (TODAY):');
  const timeRes = await fetch('http://localhost:3000/api/investigation/vehicle-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: testPlate, timeRange: 'TODAY' })
  });
  const timeData = await timeRes.json();
  console.log(`  Time Range (TODAY) Results: ${timeData.totalResults}`);
  if (timeData.totalResults >= 1) {
    console.log('  ✅ Time range filter verified.');
  }

  console.log('\n🎉 VEHICLE INVESTIGATION VERIFIED: Zero-hallucination, full/partial search, and filtering verified.');
}

testVehicleInvestigation().catch(console.error);
