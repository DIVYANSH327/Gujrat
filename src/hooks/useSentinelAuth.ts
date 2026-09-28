/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Unified Sentinel Authentication & Access Hook
 * 
 * Provides a unified, ergonomic API over AuthProvider context, exposing simplified
 * access to user roles, granular permission queries, and operational clearance checks.
 */

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  SentinelUser, 
  SentinelRole, 
  SentinelAccountStatus, 
  getRequiredPermissionForView 
} from '../types/auth';
import { ViewMode } from '../types';

export interface UseSentinelAuthReturn {
  // Identity & Core State
  user: SentinelUser | null;
  officer: SentinelUser | null;
  firebaseUser: import('firebase/auth').User | null;
  token: string | null;
  status: import('../context/AuthContext').AuthFlowStatus;
  accountStatus: SentinelAccountStatus | null;
  errorMessage: string | null;

  // Status Booleans
  isAuthenticated: boolean;
  isLoading: boolean;
  isPending: boolean;
  isSuspended: boolean;
  isDisabled: boolean;

  // Role Checks
  role: SentinelRole | null;
  isAdmin: boolean;
  isCommander: boolean;
  isInvestigator: boolean;
  isOperator: boolean;
  isReviewer: boolean;
  isAuditor: boolean;
  hasRole: (...roles: SentinelRole[]) => boolean;

  // Granular Permission Checks
  hasPermission: (permission: string) => boolean;
  canView: (view: ViewMode | string) => boolean;

  // Domain-Specific Operational Clearances
  canManageIncidents: boolean;
  canManageAlerts: boolean;
  canControlCameras: boolean;
  canAdjudicateChallan: boolean;
  canAccessForensics: boolean;
  canExportAudit: boolean;

  // Authentication Handlers
  loginWithGoogle: () => Promise<void>;
  loginWithDemoOfficer: (email: string) => Promise<void>;
  loginAsGuest: (name?: string, email?: string) => Promise<void>;
  loginWithCustomCredentials: (name: string, email: string, role?: SentinelRole) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  getAuthHeader: () => Record<string, string>;
}

/**
 * Custom hook wrapping AuthContext to simplify role-based access control,
 * operational clearances, and user session management across Sentinel Grid.
 */
export function useSentinelAuth(): UseSentinelAuthReturn {
  const auth = useAuth();
  const { officer, status, accountStatus, hasRole, hasPermission } = auth;

  return useMemo(() => {
    const role = officer?.role || null;
    const isAuthenticated = status === 'AUTHENTICATED' && !!officer;
    const isLoading = status === 'AUTHENTICATING' || status === 'VERIFYING';
    const isPending = status === 'PENDING' || accountStatus === 'PENDING';
    const isSuspended = status === 'SUSPENDED' || accountStatus === 'SUSPENDED';
    const isDisabled = status === 'DISABLED' || accountStatus === 'DISABLED';

    // Role booleans
    const isAdmin = role === 'ADMIN';
    const isCommander = role === 'COMMANDER';
    const isInvestigator = role === 'INVESTIGATOR';
    const isOperator = role === 'OPERATOR';
    const isReviewer = role === 'REVIEWER';
    const isAuditor = role === 'AUDITOR';

    // Clearance for views
    const canView = (view: ViewMode | string): boolean => {
      if (!officer) return false;
      if (isAdmin) return true;
      const requiredPermission = getRequiredPermissionForView(view);
      return hasPermission(requiredPermission);
    };

    // Domain operational clearances
    const canManageIncidents = isAdmin || isCommander || hasPermission('incidents:manage');
    const canManageAlerts = isAdmin || isCommander || hasPermission('alerts:manage');
    const canControlCameras = isAdmin || isCommander || hasPermission('cameras:control');
    const canAdjudicateChallan = isAdmin || isCommander || isReviewer || hasPermission('challan:adjudicate') || hasPermission('challan:view');
    const canAccessForensics = isAdmin || isCommander || isInvestigator || hasPermission('evidence:view');
    const canExportAudit = isAdmin || isAuditor || hasPermission('audit:view');

    return {
      // Identity & Core State
      user: officer,
      officer,
      firebaseUser: auth.firebaseUser,
      token: auth.token,
      status,
      accountStatus,
      errorMessage: auth.errorMessage,

      // Status Booleans
      isAuthenticated,
      isLoading,
      isPending,
      isSuspended,
      isDisabled,

      // Role Checks
      role,
      isAdmin,
      isCommander,
      isInvestigator,
      isOperator,
      isReviewer,
      isAuditor,
      hasRole,

      // Granular Permission Checks
      hasPermission,
      canView,

      // Domain-Specific Operational Clearances
      canManageIncidents,
      canManageAlerts,
      canControlCameras,
      canAdjudicateChallan,
      canAccessForensics,
      canExportAudit,

      // Authentication Handlers
      loginWithGoogle: auth.loginWithGoogle,
      loginWithDemoOfficer: auth.loginWithDemoOfficer,
      loginAsGuest: auth.loginAsGuest,
      loginWithCustomCredentials: auth.loginWithCustomCredentials,
      logout: auth.logout,
      clearError: auth.clearError,
      getAuthHeader: auth.getAuthHeader,
    };
  }, [auth, officer, status, accountStatus, hasRole, hasPermission]);
}

export default useSentinelAuth;
