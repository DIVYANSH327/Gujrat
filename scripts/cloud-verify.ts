/**
 * scripts/cloud-verify.ts
 * Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
 * 
 * CLI Verification Tool: npm run cloud:verify
 * Runs full end-to-end verification and prints human-readable + JSON reports.
 */

import { cloudHealthService } from '../src/services/cloud/CloudHealthService.js';
import { TARGET_GCP_CONFIG } from '../src/services/cloud/TargetProjectConfig.js';

async function main() {
  console.log('\n========================================================================');
  console.log('🏛️ GUJARAT POLICE SENTINEL GRID — COMPREHENSIVE CLOUD VERIFICATION');
  console.log(`Target: ${TARGET_GCP_CONFIG.projectName} (${TARGET_GCP_CONFIG.projectId})`);
  console.log(`Region: ${TARGET_GCP_CONFIG.region} (Primary Command Center Hub)`);
  console.log('========================================================================\n');

  const summary = await cloudHealthService.pingAll();

  console.log('┌──────────────────────┬──────────────────────┬──────────────┬─────────────┐');
  console.log('│ SERVICE              │ OPERATION            │ STATUS       │ LATENCY     │');
  console.log('├──────────────────────┼──────────────────────┼──────────────┼─────────────┤');

  for (const c of summary.checks) {
    const sName = c.service.padEnd(20).slice(0, 20);
    const op = c.operation.padEnd(20).slice(0, 20);
    const stat = (c.status === 'PASS' ? '✅ PASS' : c.status === 'WARN' ? '⚠️ WARN' : c.status === 'FAIL' ? '❌ FAIL' : '⚪ ' + c.status).padEnd(12).slice(0, 12);
    const lat = `${c.latencyMs}ms`.padStart(11);
    console.log(`│ ${sName} │ ${op} │ ${stat} │ ${lat} │`);
  }
  console.log('└──────────────────────┴──────────────────────┴──────────────┴─────────────┘\n');

  console.log(`Overall Health Status: ${summary.overallStatus}`);
  console.log(`Passed: ${summary.passed} | Warnings: ${summary.warnings} | Failures: ${summary.failures} | Local/Config: ${summary.notConfigured + summary.skipped}\n`);

  if (summary.failures > 0) {
    console.error('❌ Cloud verification detected critical failures.');
    process.exit(1);
  } else {
    console.log('✅ Cloud verification completed successfully.');
  }
}

main().catch(err => {
  console.error('Fatal CLI Error in cloud:verify:', err);
  process.exit(1);
});
