import React from 'react';
import { Camera, ShieldCheck, AlertCircle, AlertTriangle, FlaskConical, ShieldAlert } from 'lucide-react';

export type AlertImageProvenanceType = 
  | 'CAMERA_FRAME' 
  | 'EVIDENCE_FRAME' 
  | 'UNVERIFIED' 
  | 'DEMO_ASSET' 
  | 'TEST_FIXTURE' 
  | 'UNKNOWN';

export interface AlertImageProvenanceBadgeProps {
  provenance?: AlertImageProvenanceType | string;
  sourceType?: string;
  truthStatus?: string;
  evidenceUrl?: string;
  size?: 'xs' | 'sm' | 'md';
  showDetails?: boolean;
  className?: string;
}

/**
 * Visual Status Indicator for Alert UI Image Provenance.
 * Enforces strict distinction between:
 *  - CAMERA_FRAME (Live operational edge CCTV capture)
 *  - EVIDENCE_FRAME (Immutable vault-stored court record)
 *  - UNVERIFIED (Missing cryptographic seal or indeterminate features)
 *  - DEMO_ASSET (Non-operational simulation/staged asset)
 *  - TEST_FIXTURE (Non-operational benchmark/synthetic lab test)
 */
export const AlertImageProvenanceBadge: React.FC<AlertImageProvenanceBadgeProps> = ({
  provenance,
  sourceType,
  truthStatus,
  evidenceUrl,
  size = 'sm',
  showDetails = false,
  className = ''
}) => {
  // Determine normalized provenance classification
  const isDemo = 
    provenance === 'DEMO_ASSET' || 
    truthStatus === 'DEMO' || 
    sourceType === 'DEMO_ASSET' ||
    sourceType === 'SIMULATION' ||
    (typeof evidenceUrl === 'string' && (evidenceUrl.includes('unsplash.com') || evidenceUrl.includes('placeholder')));

  const isTest = 
    provenance === 'TEST_FIXTURE' || 
    truthStatus === 'TEST' || 
    sourceType === 'TEST_FIXTURE' ||
    sourceType === 'LAB_BENCHMARK';

  const isEvidence = !isDemo && !isTest && (provenance === 'EVIDENCE_FRAME' || sourceType === 'EVIDENCE_VAULT');
  const isCamera = !isDemo && !isTest && !isEvidence && (provenance === 'CAMERA_FRAME' || truthStatus === 'OBSERVED');
  const isUnverified = !isDemo && !isTest && !isEvidence && !isCamera;

  const resolvedType: AlertImageProvenanceType = isDemo 
    ? 'DEMO_ASSET' 
    : isTest 
    ? 'TEST_FIXTURE' 
    : isEvidence 
    ? 'EVIDENCE_FRAME' 
    : isCamera 
    ? 'CAMERA_FRAME' 
    : 'UNVERIFIED';

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14
  };

  if (resolvedType === 'CAMERA_FRAME') {
    return (
      <div className={`inline-flex items-center rounded font-mono font-bold tracking-wider uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 backdrop-blur-md shadow-xs ${sizeClasses[size]} ${className}`}>
        <Camera size={iconSizes[size]} className="text-emerald-400 shrink-0" />
        <span>CAMERA_FRAME</span>
        {showDetails && <span className="opacity-75 font-sans font-normal lowercase">• live cctv</span>}
      </div>
    );
  }

  if (resolvedType === 'EVIDENCE_FRAME') {
    return (
      <div className={`inline-flex items-center rounded font-mono font-bold tracking-wider uppercase bg-cyan-950/90 text-cyan-300 border border-cyan-500/60 backdrop-blur-md shadow-xs ${sizeClasses[size]} ${className}`}>
        <ShieldCheck size={iconSizes[size]} className="text-cyan-400 shrink-0" />
        <span>EVIDENCE_FRAME</span>
        {showDetails && <span className="opacity-75 font-sans font-normal lowercase">• vault seal</span>}
      </div>
    );
  }

  if (resolvedType === 'DEMO_ASSET') {
    return (
      <div className={`inline-flex items-center rounded font-mono font-black tracking-wider uppercase bg-amber-950/95 text-amber-300 border border-amber-500/70 backdrop-blur-md shadow-sm ${sizeClasses[size]} ${className}`}>
        <AlertTriangle size={iconSizes[size]} className="text-amber-400 shrink-0 animate-pulse" />
        <span>DEMO_ASSET</span>
        <span className="bg-amber-500/20 text-amber-200 px-1 rounded text-[8px] font-sans font-extrabold ml-0.5">
          NON-OPERATIONAL
        </span>
      </div>
    );
  }

  if (resolvedType === 'TEST_FIXTURE') {
    return (
      <div className={`inline-flex items-center rounded font-mono font-black tracking-wider uppercase bg-purple-950/95 text-purple-300 border border-purple-500/70 backdrop-blur-md shadow-sm ${sizeClasses[size]} ${className}`}>
        <FlaskConical size={iconSizes[size]} className="text-purple-400 shrink-0" />
        <span>TEST_FIXTURE</span>
        <span className="bg-purple-500/20 text-purple-200 px-1 rounded text-[8px] font-sans font-extrabold ml-0.5">
          NON-OPERATIONAL
        </span>
      </div>
    );
  }

  // UNVERIFIED
  return (
    <div className={`inline-flex items-center rounded font-mono font-bold tracking-wider uppercase bg-slate-900/90 text-slate-300 border border-slate-600/70 backdrop-blur-md shadow-xs ${sizeClasses[size]} ${className}`}>
      <AlertCircle size={iconSizes[size]} className="text-slate-400 shrink-0" />
      <span>UNVERIFIED</span>
      {showDetails && <span className="opacity-75 font-sans font-normal lowercase">• no seal</span>}
    </div>
  );
};

/**
 * Non-Operational Warning Banner for DEMO or TEST source alerts.
 */
export const NonOperationalAlertBanner: React.FC<{
  sourceType?: string;
  provenance?: string;
  truthStatus?: string;
  evidenceUrl?: string;
  className?: string;
}> = ({ sourceType, provenance, truthStatus, evidenceUrl, className = '' }) => {
  const isDemo = 
    provenance === 'DEMO_ASSET' || 
    truthStatus === 'DEMO' || 
    sourceType === 'DEMO_ASSET' ||
    sourceType === 'SIMULATION' ||
    (typeof evidenceUrl === 'string' && (evidenceUrl.includes('unsplash.com') || evidenceUrl.includes('placeholder')));

  const isTest = 
    provenance === 'TEST_FIXTURE' || 
    truthStatus === 'TEST' || 
    sourceType === 'TEST_FIXTURE';

  if (!isDemo && !isTest) return null;

  return (
    <div className={`p-2.5 rounded-lg border font-mono text-xs flex items-center justify-between gap-2 ${
      isDemo 
        ? 'bg-amber-950/40 text-amber-300 border-amber-600/60' 
        : 'bg-purple-950/40 text-purple-300 border-purple-600/60'
    } ${className}`}>
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className={isDemo ? 'text-amber-400 shrink-0' : 'text-purple-400 shrink-0'} />
        <div>
          <strong className="font-extrabold tracking-wide">
            {isDemo ? 'NON-OPERATIONAL DEMO ASSET' : 'NON-OPERATIONAL TEST FIXTURE'}:
          </strong>{' '}
          <span className="font-sans text-slate-300 text-[11px]">
            Simulated / reference data. Do NOT use for legal enforcement or automated challan dispatch.
          </span>
        </div>
      </div>
      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
        NON-OPERATIONAL
      </span>
    </div>
  );
};
