/**
 * Defensive Cybersecurity Agent Mesh Types
 * Gujarat Police CCTV & AI Intelligence Platform
 * Inspired by yaklang/hack-skills offensive research, inverted into defensive vigilance
 */

export type CyberSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type CyberActionCategory = 
  | 'OBSERVE' 
  | 'ANALYZE' 
  | 'RECOMMEND' 
  | 'CONTAIN' 
  | 'REMEDIATE';

export type CyberApprovalState = 
  | 'NOT_REQUIRED' 
  | 'PENDING_HUMAN_APPROVAL' 
  | 'APPROVED' 
  | 'REJECTED';

export type CyberAgentState = 'ONLINE' | 'STANDBY' | 'DEGRADED' | 'OFFLINE';

export interface CyberActionItem {
  actionId: string;
  category: CyberActionCategory;
  title: string;
  description: string;
  target: string;
  impactLevel: 'SAFE_READONLY' | 'LOW_IMPACT' | 'HIGH_IMPACT_CONTAINMENT';
  requiresHumanApproval: boolean;
  approvalState: CyberApprovalState;
  executed: boolean;
  executedAt?: string;
  remediationCommand?: string;
}

export interface CyberSecurityFinding {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  title: string;
  description: string;
  category: 'NETWORK' | 'AUTH' | 'STREAM' | 'API' | 'SECRET' | 'DEPENDENCY' | 'CLOUD' | 'LOG' | 'EVIDENCE';
  severity: CyberSeverity;
  confidence: number; // 0.0 - 1.0
  target: string;
  evidenceSnippet?: string;
  recommendedActions: CyberActionItem[];
  status: 'ACTIVE' | 'RESOLVED' | 'SUPPRESSED';
}

export interface CyberAgentMetadata {
  id: string;
  name: string;
  category: string;
  status: CyberAgentState;
  capabilities: string[];
  lastRun: string;
  findingsCount: number;
  criticalCount: number;
  description: string;
}

export interface CyberAuditRecord {
  id: string;
  agent: string;
  timestamp: string;
  target: string;
  action: string;
  category: CyberActionCategory;
  reason: string;
  result: 'SUCCESS' | 'CONTAINED' | 'BLOCKED' | 'FLAGGED' | 'APPROVAL_PENDING';
  severity: CyberSeverity;
  approvalState: CyberApprovalState;
  authorizedBy?: string;
}

export interface CyberSecurityPosture {
  overallStatus: 'PROTECTED' | 'ATTENTION_REQUIRED' | 'DEGRADED';
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  pendingApprovals: number;
  agentsOnlineCount: number;
  totalAgentsCount: number;
  lastFullAudit: string;
  complianceState: {
    section63Bsa2023: 'COMPLIANT' | 'VERIFYING' | 'NON_COMPLIANT';
    certInGuidelines: 'COMPLIANT' | 'NEEDS_REVIEW';
    streamEncryption: 'TLS_ENFORCED' | 'PARTIAL';
    secretHygiene: 'VERIFIED_SECURE' | 'EXPOSURE_DETECTED';
  };
}
