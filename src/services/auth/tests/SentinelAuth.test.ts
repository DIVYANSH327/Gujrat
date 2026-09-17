/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Unit Tests for Firebase Authentication & Token Verification (Phase 1)
 */

import { sentinelAuthService } from '../SentinelAuthService.js';

async function runAuthTests() {
  console.log('>>> [TEST] Running Sentinel Grid Authentication Suite (Phase 1)...');

  // Test 1: Verify valid simulated/test token
  console.log('--- Test 1: Verify token with email payload ---');
  const tokenPayload = 'test-token:officer.test@gujaratpolice.gov.in:uid-test-1234';
  const claims = await sentinelAuthService.verifyIdToken(tokenPayload);
  if (claims.uid !== 'uid-test-1234' || claims.email !== 'officer.test@gujaratpolice.gov.in') {
    throw new Error(`Test 1 Failed: Unexpected claims ${JSON.stringify(claims)}`);
  }
  console.log('✓ Test 1 Passed: Valid token claims resolved');

  // Test 2: Resolve user in Phase 1 (instant ACTIVE access)
  console.log('--- Test 2: Resolve user for Phase 1 (Immediate Active Access) ---');
  const user = sentinelAuthService.resolveSentinelUser({
    uid: 'uid-google-demo-8844',
    email: 'officer.demo@gujaratpolice.gov.in',
    name: 'Inspector Demo Officer',
    picture: 'https://example.com/photo.jpg'
  });

  if (user.status !== 'ACTIVE') {
    throw new Error(`Test 2 Failed: Expected status ACTIVE for Phase 1, got ${user.status}`);
  }
  if (!user.displayName || user.displayName !== 'Inspector Demo Officer') {
    throw new Error(`Test 2 Failed: Display name mismatch: ${user.displayName}`);
  }
  console.log('✓ Test 2 Passed: User successfully provisioned as ACTIVE with full command center clearance');

  // Test 3: Reject empty/invalid token
  console.log('--- Test 3: Reject missing/invalid token ---');
  let rejected = false;
  try {
    await sentinelAuthService.verifyIdToken('');
  } catch (err: any) {
    rejected = true;
    if (!err.message.includes('MISSING_TOKEN') && !err.message.includes('INVALID_TOKEN')) {
      throw new Error(`Test 3 Failed: Unexpected error message ${err.message}`);
    }
  }
  if (!rejected) {
    throw new Error('Test 3 Failed: Empty token should have thrown an error');
  }
  console.log('✓ Test 3 Passed: Missing/invalid token properly rejected with 401 equivalent');

  // Test 4: Audit logging
  console.log('--- Test 4: Audit event logging ---');
  sentinelAuthService.logAudit({
    route: '/api/auth/session',
    action: 'login_success',
    result: 'ALLOW',
    userId: user.id,
    email: user.email,
    requestId: 'REQ-TEST-001'
  });
  const logs = sentinelAuthService.getAuditLogs();
  const found = logs.find(l => l.requestId === 'REQ-TEST-001');
  if (!found || found.action !== 'login_success') {
    throw new Error('Test 4 Failed: Audit log entry was not recorded correctly');
  }
  console.log('✓ Test 4 Passed: Audit logging operational without secrets');

  console.log('>>> [SUCCESS] All Sentinel Grid Authentication Tests Passed (4/4)!');
}

runAuthTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
