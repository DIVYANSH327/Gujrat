/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Secure Officer Authentication & Role-Based Access Control (RBAC)
 */

export type SentinelRole = 
  | 'ADMIN'
  | 'COMMANDER'
  | 'INVESTIGATOR'
  | 'OPERATOR'
  | 'REVIEWER'
  | 'AUDITOR';

export const SentinelRole = {
  ADMIN: 'ADMIN' as const,
  COMMANDER: 'COMMANDER' as const,
  INVESTIGATOR: 'INVESTIGATOR' as const,
  OPERATOR: 'OPERATOR' as const,
  REVIEWER: 'REVIEWER' as const,
  AUDITOR: 'AUDITOR' as const,
};

export type SentinelAccountStatus = 
  | 'ACTIVE'
  | 'PENDING'
  | 'SUSPENDED'
  | 'DISABLED';

export interface ResourceScopes {
  districts?: string[];
  cameraGroups?: string[];
  zones?: string[];
}

export interface SentinelUser {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  badgeId: string | null; // Never invent badge IDs. If unavailable: null / 'NOT_CONFIGURED'
  department: string;
  district: string;
  role: SentinelRole;
  permissions: string[];
  status: SentinelAccountStatus;
  resourceScopes?: ResourceScopes;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthAuditAction = 
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_expired'
  | 'access_denied'
  | 'role_denied'
  | 'permission_denied'
  | 'role_granted';

export interface AuthAuditEvent {
  id: string;
  userId?: string;
  firebaseUid?: string;
  email?: string;
  timestamp: string;
  route: string;
  action: AuthAuditAction;
  result: 'ALLOW' | 'DENY' | 'ERROR';
  reason?: string;
  requestId: string;
  ip?: string;
}

/**
 * Standard Role Permissions Mapping
 */
export const ROLE_PERMISSIONS: Record<SentinelRole, string[]> = {
  ADMIN: [
    '*' // Admin can access everything
  ],
  COMMANDER: [
    'dashboard:view',
    'cameras:view',
    'cameras:control',
    'sentinel_grid:view',
    'raw_video_audit:view',
    'night_audit:view',
    'investigation:view',
    'investigation:search',
    'watchlist:view',
    'godseye:view',
    'evidence_map:view',
    'alerts:view',
    'alerts:manage',
    'incidents:view',
    'incidents:manage',
    'missions:view',
    'missions:manage',
    'evidence:view',
    'challan:view',
    'sites:view',
    'system:view',
    'system:health'
  ],
  INVESTIGATOR: [
    'investigation:view',
    'investigation:search',
    'watchlist:view',
    'watchlist:manage',
    'godseye:view',
    'evidence_map:view',
    'evidence:view',
    'alerts:view'
  ],
  OPERATOR: [
    'dashboard:view',
    'cameras:view',
    'sentinel_grid:view',
    'alerts:view',
    'missions:view'
  ],
  REVIEWER: [
    'alerts:view',
    'evidence:view',
    'challan:view',
    'challan:review',
    'ai_verification:review'
  ],
  AUDITOR: [
    'audit:view',
    'evidence:view',
    'system:view',
    'system:health',
    'audit:export'
  ]
};

/**
 * Helper to check if a user has a specific permission
 */
export function hasPermission(user: SentinelUser, requiredPermission: string): boolean {
  if (user.status !== 'ACTIVE') return false;
  if (user.permissions.includes('*') || user.role === 'ADMIN') return true;
  return user.permissions.includes(requiredPermission);
}

/**
 * Helper to check if user has at least one of the required roles
 */
export function hasAnyRole(user: SentinelUser, allowedRoles: SentinelRole[]): boolean {
  if (user.status !== 'ACTIVE') return false;
  if (user.role === 'ADMIN') return true;
  return allowedRoles.includes(user.role);
}

/**
 * Maps frontend ViewMode to the required permission
 */
export function getRequiredPermissionForView(viewId: string): string {
  switch (viewId) {
    case 'command_center':
    case 'dashboard':
      return 'dashboard:view';
    case 'cameras':
    case 'gcp_vision_hub':
      return 'cameras:view';
    case 'sentinel_grid':
      return 'sentinel_grid:view';
    case 'raw_video_audit':
      return 'raw_video_audit:view';
    case 'search':
      return 'investigation:search';
    case 'watchlist':
      return 'watchlist:view';
    case 'challenge':
      return 'godseye:view';
    case 'geospatial_map':
      return 'evidence_map:view';
    case 'night_audit':
      return 'night_audit:view';
    case 'alerts':
      return 'alerts:view';
    case 'incidents':
      return 'incidents:view';
    case 'missions':
      return 'missions:view';
    case 'challan_mode':
      return 'challan:view';
    case 'tracking':
      return 'evidence:view';
    case 'sites':
      return 'sites:view';
    case 'system':
      return 'system:view';
    case 'police_intel':
      return 'audit:view';
    case 'ai_mesh':
    case 'nodes':
    case 'policies':
    case 'cyber_security':
    case 'system_brain':
    case 'scale_lab':
    case 'digital_twin':
    case 'gov_deployment':
    case 'mobile_camera':
    case 'real_ai_test_lab':
    case 'youtube_demo':
    case 'ai_training_lab':
    case 'review_queue':
    case 'federated':
      return 'admin:view';
    default:
      return 'dashboard:view';
  }
}
