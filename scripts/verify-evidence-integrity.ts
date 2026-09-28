import crypto from 'node:crypto';
import { defaultCloudEvidenceStore } from '../src/services/cloud/EvidenceStore.js';
import { TARGET_GCP_CONFIG } from '../src/services/cloud/TargetProjectConfig.js';

async function verifyEvidenceIntegrity() {
  console.log('========================================================================');
  console.log('🔒 VERIFYING EVIDENCE INTEGRITY (BSA 2023 Section 63 Compliant Vault)');
  console.log('========================================================================\n');

  // 1. Raw synthetic frame
  const rawBytes = Buffer.from('RAW_UNCOMPRESSED_FORENSIC_FRAME_PIXELS_' + Date.now());
  const rawSha256 = crypto.createHash('sha256').update(rawBytes).digest('hex');
  console.log('1. Raw Frame Buffer created (Byte Length:', rawBytes.length, '| SHA-256:', rawSha256, ')');

  // 2. Put Original Evidence
  console.log('\n2. Storing Original Evidence in Vault...');
  const original = await defaultCloudEvidenceStore.putOriginalEvidence({
    buffer: rawBytes,
    cameraId: 'cam01',
    timestamp: Date.now()
  });
  console.log(`  Original Evidence ID: ${original.evidenceId}`);
  console.log(`  Original Storage URI: ${original.storageUri}`);
  console.log(`  SHA-256 Integrity Metadata: ${original.sha256}`);
  console.log(`  Classification: ${original.isOriginal ? 'RAW_ORIGINAL_EVIDENCE' : 'DERIVED'}`);
  console.log(`  Statutory Notice: integrity-preserved electronic evidence record`);

  // 3. Put Derived Evidence (e.g. contrast-enhanced or cropped plate)
  console.log('\n3. Storing Derived (Enhanced) Evidence with Parent Provenance...');
  const derivedBytes = Buffer.from('DERIVED_CONTRAST_BOOSTED_CROP_' + Date.now());
  const derivedSha256 = crypto.createHash('sha256').update(derivedBytes).digest('hex');
  const derived = await defaultCloudEvidenceStore.putDerivedEvidence({
    buffer: derivedBytes,
    originalSha256: original.sha256,
    enhancementType: 'OPTICAL_ENHANCEMENT',
    cameraId: 'cam01',
    timestamp: Date.now()
  });
  console.log(`  Derived Evidence ID: ${derived.evidenceId}`);
  console.log(`  Derived Storage URI: ${derived.storageUri}`);
  console.log(`  Derived SHA-256: ${derived.sha256}`);
  console.log(`  Parent SHA-256: ${original.sha256}`);

  // 4. Verify Original vs Derived Separation
  const isSeparated = original.isOriginal === true && 
                      derived.isOriginal === false && 
                      original.storageUri.includes('/original/') && 
                      derived.storageUri.includes('/derived/') &&
                      original.sha256 !== derived.sha256;
  console.log(`\n4. Original / Derived Segregation: ${isSeparated ? '✅ VERIFIED' : '❌ FAILED'}`);

  // 5. Vault Read-back:
  console.log('\n5. Vault Read-back:');
  const retrievedOrig = await defaultCloudEvidenceStore.getEvidence(original.evidenceId);
  const readBackSuccess = retrievedOrig && retrievedOrig.sha256 === original.sha256;
  console.log(`  Retrieved Original: ${readBackSuccess ? '✅ MATCH' : '❌ MISMATCH'} (Length: ${retrievedOrig?.buffer.length} bytes)`);

  // 6. Cryptographic Integrity Verification
  console.log('\n6. Cryptographic Integrity Check:');
  const checkValid = await defaultCloudEvidenceStore.verifyIntegrity(original.evidenceId, original.sha256);
  console.log(`  Valid Hash Check: ${checkValid.verified ? '✅ PASS (Authentic)' : '❌ FAIL'}`);

  const checkTampered = await defaultCloudEvidenceStore.verifyIntegrity(original.evidenceId, '0000000000000000000000000000000000000000000000000000000000000000');
  console.log(`  Tampered Hash Check: ${!checkTampered.verified ? '✅ TAMPER_DETECTED (Tampered Hash Rejected)' : '❌ FAIL'}`);

  // 7. Retention Configuration Audit
  console.log('\n7. Retention Configuration Audit:');
  console.log(`  Target Bucket: gs://${TARGET_GCP_CONFIG.gcsBucket}`);
  console.log(`  Configured Retention Period: ${TARGET_GCP_CONFIG.gcsRetentionPolicy.configuredRetentionPolicyYears * 365} days (${TARGET_GCP_CONFIG.gcsRetentionPolicy.configuredRetentionPolicyYears} Years for Law Enforcement Compliance)`);
  console.log(`  Bucket Retention Lock Status: UNLOCKED (Retention policy defined in config, not locked automatically)`);
  console.log(`  Legal Claim Standard: "integrity-preserved electronic evidence record" with "SHA-256 integrity metadata"`);

  if (isSeparated && readBackSuccess && checkValid.verified && !checkTampered.verified) {
    console.log('\n🎉 EVIDENCE INTEGRITY VERIFICATION SUITE PASSED PERFECTLY');
  } else {
    console.error('\n❌ EVIDENCE INTEGRITY CHECKS FAILED');
    process.exit(1);
  }
}

verifyEvidenceIntegrity().catch(console.error);
