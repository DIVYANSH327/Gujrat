/**
 * scripts/cloud-ping.ts
 * Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
 * 
 * CLI Diagnostic Tool: npm run cloud:ping
 * Executes machine-readable health verification across all Google Cloud services.
 */

import { cloudHealthService } from '../src/services/cloud/CloudHealthService.js';

async function main() {
  const serviceArg = process.argv[2];
  
  if (serviceArg && serviceArg !== 'all') {
    process.stdout.write(`\n🔍 Probing Google Cloud Service: ${serviceArg}...\n`);
    const result = await cloudHealthService.pingService(serviceArg);
    console.log(JSON.stringify(result, null, 2));
    if (result.status === 'FAIL') {
      process.exit(1);
    }
    return;
  }

  process.stdout.write(`\n========================================================================\n`);
  process.stdout.write(`🛡️ GUJARAT POLICE SENTINEL GRID — GOOGLE CLOUD PING DIAGNOSTICS\n`);
  process.stdout.write(`Target Project: dns1-c27a5 | Region: asia-south1\n`);
  process.stdout.write(`========================================================================\n\n`);

  const summary = await cloudHealthService.pingAll();
  console.log(JSON.stringify(summary, null, 2));

  process.stdout.write(`\n========================================================================\n`);
  process.stdout.write(`📊 Summary: ${summary.passed} Passed, ${summary.warnings} Warnings, ${summary.failures} Failures, ${summary.notConfigured} Not Configured, ${summary.skipped} Skipped\n`);
  process.stdout.write(`Overall Status: ${summary.overallStatus}\n`);
  process.stdout.write(`========================================================================\n`);

  if (summary.failures > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal CLI Error in cloud:ping:', err);
  process.exit(1);
});
