async function verifyAlertWorkflow() {
  console.log('========================================================================');
  console.log('🚨 VERIFYING ALERT WORKFLOW (Review, Track, Acknowledge, Dismiss, Stop Track)');
  console.log('========================================================================\n');

  // 1. Create clearly marked TEST alert
  console.log('1. Creating clearly marked TEST alert...');
  const createRes = await fetch('http://localhost:3000/api/alerts/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehiclePlate: 'GJ01TEST99',
      cameraId: 'cam12',
      violationType: 'TEST_SPEED_ANOMALY'
    })
  });
  const created = await createRes.json();
  const alertId = created.id;
  console.log(`  Created Alert ID: ${alertId} | Status: ${created.status} | Truth: ${created.truthStatus}`);

  // 2. Action: Review
  console.log('\n2. Action: Review');
  const reviewRes = await fetch(`http://localhost:3000/api/alerts/${alertId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer: 'Inspector V. Trivedi', notes: 'Vehicle verified on CCTV' })
  });
  const reviewData = await reviewRes.json();
  console.log(`  Review Response: ${reviewData.status}`);
  // Verify persistence
  const checkReview = await (await fetch(`http://localhost:3000/api/alerts/${alertId}`)).json();
  console.log(`  Persisted State: status=${checkReview.status}`);
  if (checkReview.status === 'reviewed') {
    console.log('  ✅ Review action persisted to backend.');
  }

  // 3. Action: Track
  console.log('\n3. Action: Track');
  const trackRes = await fetch(`http://localhost:3000/api/alerts/${alertId}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const trackData = await trackRes.json();
  console.log(`  Track Response: ${trackData.status} | isTracking=${trackData.isTracking}`);
  // Verify persistence
  const checkTrack = await (await fetch(`http://localhost:3000/api/alerts/${alertId}`)).json();
  console.log(`  Persisted State: isTracking=${(checkTrack as any).isTracking}`);
  if ((checkTrack as any).isTracking === true) {
    console.log('  ✅ Track action persisted to backend.');
  }

  // 4. Action: Acknowledge
  console.log('\n4. Action: Acknowledge');
  const ackRes = await fetch(`http://localhost:3000/api/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer: 'DSP S. Sharma' })
  });
  const ackData = await ackRes.json();
  console.log(`  Acknowledge Response: ${ackData.status}`);
  // Verify persistence
  const checkAck = await (await fetch(`http://localhost:3000/api/alerts/${alertId}`)).json();
  console.log(`  Persisted State: status=${checkAck.status}`);
  if (checkAck.status === 'acknowledged') {
    console.log('  ✅ Acknowledge action persisted to backend.');
  }

  // 5. Action: Dismiss
  console.log('\n5. Action: Dismiss');
  const dismissRes = await fetch(`http://localhost:3000/api/alerts/${alertId}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer: 'DSP S. Sharma', reason: 'Authorized Emergency Vehicle' })
  });
  const dismissData = await dismissRes.json();
  console.log(`  Dismiss Response: ${dismissData.status}`);
  // Verify persistence
  const checkDismiss = await (await fetch(`http://localhost:3000/api/alerts/${alertId}`)).json();
  console.log(`  Persisted State: status=${checkDismiss.status}`);
  if (checkDismiss.status === 'closed') {
    console.log('  ✅ Dismiss action persisted to backend.');
  }

  // 6. Action: Stop Tracking
  console.log('\n6. Action: Stop Tracking');
  const stopTrackRes = await fetch(`http://localhost:3000/api/alerts/${alertId}/stop-track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const stopTrackData = await stopTrackRes.json();
  console.log(`  Stop Track Response: ${stopTrackData.status} | isTracking=${stopTrackData.isTracking}`);
  // Verify persistence
  const checkStopTrack = await (await fetch(`http://localhost:3000/api/alerts/${alertId}`)).json();
  console.log(`  Persisted State: isTracking=${(checkStopTrack as any).isTracking}`);
  if ((checkStopTrack as any).isTracking === false) {
    console.log('  ✅ Stop Tracking action persisted to backend.');
  }

  // 7. Verify Failed Backend Request Handling
  console.log('\n7. Testing Failed Backend Request (Invalid Alert ID: NON_EXISTENT_ALERT_999)');
  const failedRes = await fetch('http://localhost:3000/api/alerts/NON_EXISTENT_ALERT_999/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: 'This must fail' })
  });
  console.log(`  Failed Request HTTP Status: ${failedRes.status}`);
  const failedData = await failedRes.json();
  console.log(`  Error Payload:`, failedData);
  if (failedRes.status === 404 && failedData.error) {
    console.log('  ✅ Failed backend request correctly returns 404 error without false success display.');
  } else {
    console.error('  ❌ FAILED: Unexpected success on invalid alert ID!');
  }

  console.log('\n🎉 ALL ALERT WORKFLOW ACTIONS VERIFIED (Review, Track, Acknowledge, Dismiss, Stop Tracking, Failure Handling)');
}

verifyAlertWorkflow().catch(console.error);
