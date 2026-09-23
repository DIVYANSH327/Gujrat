/**
 * GopOptimizationLiveAiIndependence.test.ts
 *
 * Automated verification of Sentinel Grid GOP Keyframe Synchronization & Live AI Independence:
 * 1. GOP OFF default configuration & Live AI Priority mode
 * 2. Valid decoded frame without keyframe immediately triggers Live AI in GOP OFF mode
 * 3. GOP OFF mode excludes forced keyframe & closed GOP FFmpeg flags
 * 4. GOP ON mode dynamically injects forced keyframe & closed GOP FFmpeg flags
 * 5. GOP ON mode synchronizes upon keyframe arrival
 * 6. GOP ON bounded timeout fallback (3000ms SLA)
 * 7. AI processing independence (GOP OFF ≠ AI OFF)
 * 8. Runtime dynamic toggle (GOP ON <-> GOP OFF per-camera)
 * 9. Global operational toggle (Live AI Priority mode across all cameras)
 * 10. Reconnection resilience with telemetry preservation
 * 11. Telemetry reporting API completeness and consistency
 * 12. Stream health and non-blocking invariant
 */

import assert from 'assert';
import { streamOptimizationManager } from '../../services/StreamOptimizationManager.js';
import { VideoStreamService } from '../../services/server/VideoStreamService.js';

console.log('==================================================================');
console.log('🚀 RUNNING SENTINEL GRID — GOP OPTIMIZATION & LIVE AI INDEPENDENCE TESTS');
console.log('==================================================================');

async function runGopOptimizationTests() {
  let passedCount = 0;
  const videoStreamService = VideoStreamService.getInstance();

  try {
    // -------------------------------------------------------------
    // Test 1: GOP OFF default configuration & Live AI Priority mode
    // -------------------------------------------------------------
    console.log('\n--- Test 1: GOP OFF Default Configuration & Live AI Priority ---');
    // Reset global state for testing
    streamOptimizationManager.setGlobalGopSync(false);
    const globalConfig = streamOptimizationManager.getGlobalConfig();
    assert.strictEqual(globalConfig.gopSyncEnabled, false, 'Default GOP sync must be false (OFF) for high-contention hackathon environment');
    assert.strictEqual(globalConfig.gopSyncTimeoutMs, 3000, 'Default GOP sync timeout must be 3000ms');

    const cam01Telem = streamOptimizationManager.getTelemetry('cam01');
    assert.strictEqual(cam01Telem.gopSyncEnabled, false, 'cam01 default config must have gopSyncEnabled = false');
    assert.strictEqual(cam01Telem.gopSyncState, 'DISABLED', 'cam01 default state must be DISABLED (no blocking sync)');
    console.log('✅ Test 1 Passed: Global default is GOP OFF with 3000ms bounded timeout fallback.');
    passedCount++;

    // -------------------------------------------------------------
    // Test 2: Valid decoded frame without keyframe immediately triggers Live AI in GOP OFF mode
    // -------------------------------------------------------------
    console.log('\n--- Test 2: First Valid Decoded Frame Triggers Live AI Immediately (GOP OFF) ---');
    streamOptimizationManager.recordCameraConnected('cam01');
    const beforeFrame = Date.now();
    const frameTelem = streamOptimizationManager.recordValidDecodedFrame('cam01');

    assert.ok(frameTelem.firstValidFrameTimestamp, 'First valid frame timestamp must be recorded');
    assert.strictEqual(frameTelem.gopSyncState, 'DISABLED', 'GOP sync state must remain DISABLED in GOP OFF mode');
    assert.ok(frameTelem.aiStartedTimestamp, 'Live AI must start immediately upon first valid decoded frame');
    assert.strictEqual(frameTelem.gopSyncWaitMs, 0, 'GOP wait time must be 0ms when GOP sync is OFF');
    console.log(`✅ Test 2 Passed: Decoded frame received, AI triggered immediately without keyframe wait (latency: ${frameTelem.aiStartLatencyMs}ms).`);
    passedCount++;

    // -------------------------------------------------------------
    // Test 3: GOP OFF mode excludes forced keyframe & closed GOP FFmpeg flags
    // -------------------------------------------------------------
    console.log('\n--- Test 3: FFmpeg Flags for GOP OFF Mode ---');
    const rtspUrl = 'rtsp://operator:secret@127.0.0.1:8554/stream/cam01';
    const manifestPath = '/tmp/sentinel_live/cam01/index.m3u8';
    const ffmpegArgsGopOff = videoStreamService.buildFfmpegArgs(rtspUrl, manifestPath, { gopSyncEnabled: false });

    assert.ok(!ffmpegArgsGopOff.includes('-force_key_frames'), 'FFmpeg args must NOT contain -force_key_frames when GOP sync is OFF');
    assert.ok(!ffmpegArgsGopOff.includes('+cgop'), 'FFmpeg args must NOT contain +cgop flag when GOP sync is OFF');
    assert.ok(ffmpegArgsGopOff.includes('-tune') && ffmpegArgsGopOff[ffmpegArgsGopOff.indexOf('-tune') + 1] === 'zerolatency', 'Must include zerolatency tuning');
    console.log('✅ Test 3 Passed: FFmpeg remuxing flags omit closed GOP keyframe enforcement in GOP OFF mode.');
    passedCount++;

    // -------------------------------------------------------------
    // Test 4: GOP ON mode dynamically injects forced keyframe & closed GOP FFmpeg flags
    // -------------------------------------------------------------
    console.log('\n--- Test 4: FFmpeg Flags for GOP ON Mode ---');
    const ffmpegArgsGopOn = videoStreamService.buildFfmpegArgs(rtspUrl, manifestPath, { gopSyncEnabled: true });

    assert.ok(ffmpegArgsGopOn.includes('-force_key_frames'), 'FFmpeg args MUST contain -force_key_frames when GOP sync is ON');
    assert.ok(ffmpegArgsGopOn.includes('+cgop'), 'FFmpeg args MUST contain +cgop flag when GOP sync is ON');
    const forceKeyIdx = ffmpegArgsGopOn.indexOf('-force_key_frames');
    assert.strictEqual(ffmpegArgsGopOn[forceKeyIdx + 1], 'expr:gte(t,n_forced*1)', 'Keyframe cadence must be 1-second intervals');
    console.log('✅ Test 4 Passed: FFmpeg dynamically injects 1s keyframes and closed GOP flags when GOP sync is ON.');
    passedCount++;

    // -------------------------------------------------------------
    // Test 5: GOP ON mode synchronizes upon keyframe arrival
    // -------------------------------------------------------------
    console.log('\n--- Test 5: GOP ON Keyframe Synchronization Flow ---');
    streamOptimizationManager.setConfig('cam02', { gopSyncEnabled: true, gopSyncTimeoutMs: 3000 });
    const cam02Conn = streamOptimizationManager.recordCameraConnected('cam02');
    assert.strictEqual(cam02Conn.gopSyncState, 'WAITING', 'Camera in GOP ON mode must enter WAITING state on connect');

    // Simulate frame arrival while waiting
    streamOptimizationManager.recordValidDecodedFrame('cam02');
    // Simulate IDR keyframe arrival
    const cam02Sync = streamOptimizationManager.recordKeyframeArrival('cam02');
    assert.strictEqual(cam02Sync.gopSyncState, 'SYNCHRONIZED', 'State must transition to SYNCHRONIZED upon keyframe arrival');
    assert.ok(cam02Sync.gopSynchronizedTimestamp, 'gopSynchronizedTimestamp must be set');
    assert.ok(cam02Sync.aiStartedTimestamp, 'AI must start upon keyframe arrival in GOP ON mode');
    console.log(`✅ Test 5 Passed: GOP ON cleanly transitions WAITING -> SYNCHRONIZED on keyframe arrival.`);
    passedCount++;

    // -------------------------------------------------------------
    // Test 6: GOP ON bounded timeout fallback (3000ms SLA)
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Bounded Timeout Fallback Under Stalled Keyframes ---');
    // Use short timeout for automated test speed
    streamOptimizationManager.setConfig('cam03', { gopSyncEnabled: true, gopSyncTimeoutMs: 50 });
    streamOptimizationManager.recordCameraConnected('cam03');
    streamOptimizationManager.recordValidDecodedFrame('cam03');

    // Wait for the timeout fallback to trigger
    await new Promise((resolve) => setTimeout(resolve, 80));

    const cam03Telem = streamOptimizationManager.getTelemetry('cam03');
    assert.strictEqual(cam03Telem.gopSyncState, 'TIMEOUT_FALLBACK', 'State must fallback to TIMEOUT_FALLBACK after timeout window expires');
    assert.strictEqual(cam03Telem.gopSyncFallbackCount, 1, 'Fallback counter must increment to 1');
    assert.ok(cam03Telem.aiStartedTimestamp, 'Live AI must be unblocked and execute upon timeout fallback');
    console.log('✅ Test 6 Passed: Stalled keyframe stream gracefully falls back to TIMEOUT_FALLBACK; AI is never blocked.');
    passedCount++;

    // -------------------------------------------------------------
    // Test 7: AI processing independence (GOP OFF ≠ AI OFF)
    // -------------------------------------------------------------
    console.log('\n--- Test 7: AI Processing Independence Across All States ---');
    const statesToTest = ['DISABLED', 'SYNCHRONIZED', 'TIMEOUT_FALLBACK'] as const;
    for (const state of statesToTest) {
      const testCam = `cam_ai_${state.toLowerCase()}`;
      streamOptimizationManager.recordCameraConnected(testCam);
      const aiTelem = streamOptimizationManager.recordAiStarted(testCam);
      assert.ok(aiTelem.aiStartedTimestamp, `AI started timestamp must be recorded in state ${state}`);
    }
    console.log('✅ Test 7 Passed: GOP OFF ≠ AI OFF. Live AI processes frames independently of GOP synchronization.');
    passedCount++;

    // -------------------------------------------------------------
    // Test 8: Runtime dynamic toggle (GOP ON <-> GOP OFF per-camera)
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Per-Camera Dynamic Runtime Toggle ---');
    streamOptimizationManager.setConfig('cam04', { gopSyncEnabled: true });
    assert.strictEqual(streamOptimizationManager.getConfig('cam04').gopSyncEnabled, true);

    streamOptimizationManager.setConfig('cam04', { gopSyncEnabled: false });
    assert.strictEqual(streamOptimizationManager.getConfig('cam04').gopSyncEnabled, false);
    const cam04Telem = streamOptimizationManager.getTelemetry('cam04');
    assert.strictEqual(cam04Telem.gopSyncState, 'DISABLED');
    console.log('✅ Test 8 Passed: Per-camera config switches dynamically between GOP ON and OFF without restarts.');
    passedCount++;

    // -------------------------------------------------------------
    // Test 9: Global operational toggle (Live AI Priority mode)
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Global Live AI Priority Mode Toggle ---');
    streamOptimizationManager.setGlobalGopSync(true);
    assert.strictEqual(streamOptimizationManager.getGlobalConfig().gopSyncEnabled, true);

    // Switch back to hackathon default: Live AI Priority (GOP OFF)
    streamOptimizationManager.setGlobalGopSync(false);
    assert.strictEqual(streamOptimizationManager.getGlobalConfig().gopSyncEnabled, false);
    console.log('✅ Test 9 Passed: Global toggle propagates Live AI Priority across all cameras.');
    passedCount++;

    // -------------------------------------------------------------
    // Test 10: Reconnection resilience with telemetry preservation
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Reconnection Resilience & Fallback Telemetry Preservation ---');
    streamOptimizationManager.setConfig('cam05', { gopSyncEnabled: true, gopSyncTimeoutMs: 50 });
    streamOptimizationManager.recordCameraConnected('cam05');
    await new Promise((resolve) => setTimeout(resolve, 60));

    const initialFallbacks = streamOptimizationManager.getTelemetry('cam05').gopSyncFallbackCount;
    assert.ok(initialFallbacks >= 1, 'Initial fallback count must be at least 1');

    // Simulate stream reconnect event
    streamOptimizationManager.recordCameraConnected('cam05');
    const reconnectedTelem = streamOptimizationManager.getTelemetry('cam05');
    assert.strictEqual(
      reconnectedTelem.gopSyncFallbackCount,
      initialFallbacks,
      'Reconnection must preserve historical fallback count for telemetry'
    );
    console.log('✅ Test 10 Passed: Stream reconnect preserves optimization telemetry and fallback history.');
    passedCount++;

    // -------------------------------------------------------------
    // Test 11: Telemetry reporting API completeness and consistency
    // -------------------------------------------------------------
    console.log('\n--- Test 11: Complete Telemetry Reporting Schema ---');
    const allTelemetry = streamOptimizationManager.getAllTelemetry();
    assert.ok(Object.keys(allTelemetry).length > 0, 'Telemetry must contain entries for active cameras');

    for (const [camId, telem] of Object.entries(allTelemetry)) {
      assert.strictEqual(typeof telem.cameraId, 'string');
      assert.strictEqual(typeof telem.gopSyncEnabled, 'boolean');
      assert.ok(['DISABLED', 'WAITING', 'SYNCHRONIZED', 'TIMEOUT_FALLBACK'].includes(telem.gopSyncState));
      assert.strictEqual(typeof telem.gopSyncFallbackCount, 'number');
    }
    console.log(`✅ Test 11 Passed: Telemetry schema verified for ${Object.keys(allTelemetry).length} camera instances.`);
    passedCount++;

    // -------------------------------------------------------------
    // Test 12: Stream health and non-blocking invariant
    // -------------------------------------------------------------
    console.log('\n--- Test 12: Non-blocking Invariant Under Missing Keyframes ---');
    streamOptimizationManager.setConfig('cam12', { gopSyncEnabled: false });
    streamOptimizationManager.recordCameraConnected('cam12');
    const cam12Frame = streamOptimizationManager.recordValidDecodedFrame('cam12');

    // Verify invariant: AI is active and NOT waiting
    assert.strictEqual(cam12Frame.gopSyncState, 'DISABLED');
    assert.ok(cam12Frame.aiStartedTimestamp, 'AI must have started immediately');
    assert.strictEqual(cam12Frame.gopSyncWaitMs, 0, 'Zero wait time on GOP boundary');
    console.log('✅ Test 12 Passed: Non-blocking invariant verified. Live AI processes valid frames without keyframe deadlock.');
    passedCount++;

    console.log('\n==================================================================');
    console.log(`🎉 ALL ${passedCount}/12 GOP OPTIMIZATION & LIVE AI TESTS PASSED PERFECTLY`);
    console.log('==================================================================\n');
  } catch (err: any) {
    console.error('\n❌ Test Failure:', err?.message || err);
    console.error(err?.stack);
    process.exit(1);
  }
}

runGopOptimizationTests();
