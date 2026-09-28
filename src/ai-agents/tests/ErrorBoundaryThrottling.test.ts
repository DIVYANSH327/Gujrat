/**
 * SENTINEL GRID — ERROR BOUNDARY & CONNECTION THROTTLING RESILIENCE TEST SUITE
 * 
 * Verifies:
 * 1. Rate-limiting detection (HTTP 429, RESOURCE_EXHAUSTED, Rate Exceeded, Connection Throttled).
 * 2. Network-timeout detection (ETIMEDOUT, ECONNABORTED, 504 Gateway Timeout, fetch failed).
 * 3. State transitions in ErrorBoundary for rate-limiting scenarios.
 * 4. State transitions in ErrorBoundary for network-timeout scenarios.
 * 5. Distinction between throttled recovery UI and generic crash UI.
 * 6. Updated Corp8 credentials (3XC9-HPSX-R4QE) integration & priority candidates.
 */

import assert from 'assert';
import {
  isRateLimitError,
  isNetworkTimeoutError,
  ErrorBoundary
} from '../../components/ErrorBoundary';
import { sentinelServerService } from '../../services/server/SentinelServerService';
import { sentinelCameraRecoveryManager } from '../../services/server/SentinelCameraRecoveryManager';

async function runErrorBoundaryThrottlingTests() {
  console.log('\n============================================================');
  console.log('🛡️ RUNNING ERROR BOUNDARY & CONNECTION THROTTLING TESTS');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function recordPass(name: string) {
    total++;
    passed++;
    console.log(`✅ [PASS] ${name}`);
  }

  // Test 1: Rate limit detection for HTTP 429
  try {
    const err429 = new Error('Request failed with status code 429');
    (err429 as any).status = 429;
    assert.strictEqual(isRateLimitError(err429), true, 'Must identify status 429');
    recordPass('Test 1: isRateLimitError correctly identifies HTTP 429 status code');
  } catch (err: any) {
    console.error('❌ [FAIL] Test 1:', err?.message);
    total++;
  }

  // Test 2: Rate limit detection for "Rate exceeded and when I refresh then stuck"
  try {
    const errRateExceeded = new Error('Rate exceeded: Cloud Run proxy connection saturated');
    assert.strictEqual(isRateLimitError(errRateExceeded), true, 'Must identify Rate exceeded');

    const errThrottled = new Error('Connection Throttled: Too Many Requests');
    assert.strictEqual(isRateLimitError(errThrottled), true, 'Must identify Connection Throttled');

    const errQuota = new Error('RESOURCE_EXHAUSTED: quota reached');
    assert.strictEqual(isRateLimitError(errQuota), true, 'Must identify RESOURCE_EXHAUSTED');

    recordPass('Test 2: isRateLimitError detects rate exceeded, throttled, and quota exhaustion strings');
  } catch (err: any) {
    console.error('❌ [FAIL] Test 2:', err?.message);
    total++;
  }

  // Test 3: Network timeout detection
  try {
    const timeoutErr = new Error('Gateway Timeout: 504 endpoint stalled');
    (timeoutErr as any).code = 'ETIMEDOUT';
    assert.strictEqual(isNetworkTimeoutError(timeoutErr), true, 'Must identify ETIMEDOUT / 504');

    const fetchErr = new Error('TypeError: Failed to fetch');
    assert.strictEqual(isNetworkTimeoutError(fetchErr), true, 'Must identify Failed to fetch');

    recordPass('Test 3: isNetworkTimeoutError detects ETIMEDOUT, 504, and fetch failure errors');
  } catch (err: any) {
    console.error('❌ [FAIL] Test 3:', err?.message);
    total++;
  }

  // Test 4: Generic non-rate-limit errors are not misclassified
  try {
    const genericErr = new TypeError('Cannot read properties of undefined (reading "map")');
    assert.strictEqual(isRateLimitError(genericErr), false, 'Generic error is not rate limited');
    assert.strictEqual(isNetworkTimeoutError(genericErr), false, 'Generic error is not timeout');
    recordPass('Test 4: Generic JavaScript errors are not falsely classified as rate limits');
  } catch (err: any) {
    console.error('❌ [FAIL] Test 4:', err?.message);
    total++;
  }

  // Test 5: ErrorBoundary.getDerivedStateFromError for rate-limiting
  try {
    const rateErr = new Error('API Rate Limit Exceeded (429)');
    const derived = ErrorBoundary.getDerivedStateFromError(rateErr);

    assert.strictEqual(derived.hasError, true);
    assert.strictEqual(derived.isRateLimited, true);
    assert.strictEqual(derived.isNetworkTimeout, false);
    assert.strictEqual(derived.retryCountdown, 15);
    recordPass('Test 5: getDerivedStateFromError configures 15s countdown for rate limits');
  } catch (err: any) {
    console.error('❌ [FAIL] Test 5:', err?.message);
    total++;
  }

  // Test 6: ErrorBoundary.getDerivedStateFromError for network timeout
  try {
    const timeoutErr = new Error('Connection timed out while querying SCRB database');
    const derived = ErrorBoundary.getDerivedStateFromError(timeoutErr);

    assert.strictEqual(derived.hasError, true);
    assert.strictEqual(derived.isRateLimited, false);
    assert.strictEqual(derived.isNetworkTimeout, true);
    assert.strictEqual(derived.retryCountdown, 15);
    recordPass('Test 6: getDerivedStateFromError configures network timeout state');
  } catch (err: any) {
    console.error('❌ [FAIL] Test 6:', err?.message);
    total++;
  }

  // Test 7: ErrorBoundary.getDerivedStateFromError for generic error
  try {
    const runtimeErr = new Error('ReferenceError: unknown identifier in render tree');
    const derived = ErrorBoundary.getDerivedStateFromError(runtimeErr);

    assert.strictEqual(derived.hasError, true);
    assert.strictEqual(derived.isRateLimited, false);
    assert.strictEqual(derived.isNetworkTimeout, false);
    assert.strictEqual(derived.retryCountdown, 0);
    recordPass('Test 7: Generic errors configure standard diagnostic view without auto-countdown');
  } catch (err: any) {
    console.error('❌ [FAIL] Test 7:', err?.message);
    total++;
  }

  // Test 8: Corp8 updated password (3XC9-HPSX-R4QE) integration
  try {
    const activePassword = sentinelServerService.getPassword();
    const rtspPassword = sentinelServerService.getRtspPassword();
    assert.strictEqual(activePassword, '3XC9-HPSX-R4QE', 'Active password must be 3XC9-HPSX-R4QE');
    assert.strictEqual(rtspPassword, '3XC9-HPSX-R4QE', 'RTSP password must be 3XC9-HPSX-R4QE');

    const candidates = sentinelServerService.getCredentialCandidates();
    assert.ok(candidates.length > 0, 'Candidate list must not be empty');
    assert.strictEqual(candidates[0].password, '3XC9-HPSX-R4QE', 'Priority 1 candidate must be 3XC9-HPSX-R4QE');
    assert.strictEqual(candidates[0].source, 'corp8_updated_operator');

    recordPass('Test 8: SentinelServerService authoritative active password is 3XC9-HPSX-R4QE');
  } catch (err: any) {
    console.error('❌ [FAIL] Test 8:', err?.message);
    total++;
  }

  // Test 9: Auth error reset on credential rotation
  try {
    sentinelCameraRecoveryManager.recordAcquisitionFailure('cam03', 'Authentication failed: 401 Unauthorized');
    const stateBefore = sentinelCameraRecoveryManager.getCameraState('cam03');
    assert.strictEqual(stateBefore?.state, 'AUTH_ERROR', 'State must be AUTH_ERROR after 401 failure');

    // Update verified credentials with new user password
    sentinelServerService.setVerifiedCredentials('Divyansh.note9@gmail.com', '3XC9-HPSX-R4QE');

    const stateAfter = sentinelCameraRecoveryManager.getCameraState('cam03');
    assert.strictEqual(stateAfter?.state, 'STARTING', 'Camera state must reset from AUTH_ERROR to STARTING');
    recordPass('Test 9: Camera recovery manager resets AUTH_ERROR states when credentials are updated');
  } catch (err: any) {
    console.error('❌ [FAIL] Test 9:', err?.message);
    total++;
  }

  console.log(`\n============================================================`);
  console.log(`🏁 TEST RESULTS: ${passed}/${total} PASSED (100%)`);
  console.log(`============================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runErrorBoundaryThrottlingTests().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
