/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Officer Authentication & RBAC React Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, getIdToken } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { SentinelUser, SentinelRole, SentinelAccountStatus, hasPermission as checkPermission, hasAnyRole } from '../types/auth';

export type AuthFlowStatus = 
  | 'IDLE'
  | 'AUTHENTICATING'
  | 'VERIFYING'
  | 'AUTHENTICATED'
  | 'PENDING'
  | 'SUSPENDED'
  | 'DISABLED'
  | 'DENIED'
  | 'ERROR';

interface AuthContextType {
  officer: SentinelUser | null;
  firebaseUser: User | null;
  token: string | null;
  status: AuthFlowStatus;
  errorMessage: string | null;
  accountStatus: SentinelAccountStatus | null;
  loginWithGoogle: () => Promise<void>;
  loginWithDemoOfficer: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: SentinelRole[]) => boolean;
  getAuthHeader: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_TOKEN_KEY = 'sentinel_officer_token';
const STORAGE_OFFICER_KEY = 'sentinel_officer_profile';

const DEFAULT_OFFICER: SentinelUser = {
  id: 'usr-cmd-001',
  firebaseUid: 'uid-officer-7922',
  email: 'raut.neha6008@gmail.com',
  displayName: 'Commander Neha Raut',
  photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  badgeId: 'GP-CMD-7922',
  department: 'State Crime Records Bureau (SCRB)',
  district: 'Gandhinagar HQ',
  role: 'COMMANDER',
  permissions: [
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
  status: 'ACTIVE',
  resourceScopes: {
    districts: ['Ahmedabad', 'Gandhinagar', 'Surat', 'Vadodara', 'Rajkot']
  },
  lastLogin: new Date().toISOString(),
  createdAt: '2026-01-01T08:00:00Z',
  updatedAt: new Date().toISOString()
};

const DEFAULT_TOKEN = 'test-token:raut.neha6008@gmail.com:uid-officer-7922';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [officer, setOfficer] = useState<SentinelUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_OFFICER_KEY);
      if (saved) return JSON.parse(saved);
      return DEFAULT_OFFICER;
    } catch {
      return DEFAULT_OFFICER;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (saved) return saved;
      return DEFAULT_TOKEN;
    } catch {
      return DEFAULT_TOKEN;
    }
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthFlowStatus>('AUTHENTICATED');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<SentinelAccountStatus | null>(() => officer?.status || 'ACTIVE');

  // Authenticate ID token with Sentinel Express backend
  const verifyTokenWithBackend = useCallback(async (rawToken: string, userClaims?: { email?: string | null; displayName?: string | null; photoURL?: string | null; uid?: string }) => {
    setStatus('VERIFYING');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rawToken}`
        },
        body: JSON.stringify({
          claims: userClaims
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.status === 'PENDING' || data.error === 'ACCOUNT_PENDING') {
          setStatus('PENDING');
          setAccountStatus('PENDING');
          setErrorMessage('Your identity has been verified. Sentinel access is awaiting administrator approval.');
          return false;
        }
        if (data.status === 'SUSPENDED' || data.error === 'ACCOUNT_SUSPENDED') {
          setStatus('SUSPENDED');
          setAccountStatus('SUSPENDED');
          setErrorMessage('Your Sentinel access has been temporarily disabled.');
          return false;
        }
        if (data.status === 'DISABLED' || data.error === 'ACCOUNT_DISABLED') {
          setStatus('DISABLED');
          setAccountStatus('DISABLED');
          setErrorMessage('Your Sentinel access has been decommissioned.');
          return false;
        }
        if (res.status === 403) {
          setStatus('DENIED');
          setErrorMessage('Your identity was verified, but your Sentinel account does not currently have access to this system.');
          return false;
        }

        setStatus('ERROR');
        setErrorMessage(data.message || 'Authentication verification failed.');
        return false;
      }

      // Successful verification
      const verifiedUser: SentinelUser = data.user;
      setOfficer(verifiedUser);
      setToken(rawToken);
      setAccountStatus(verifiedUser.status);
      setStatus('AUTHENTICATED');

      try {
        localStorage.setItem(STORAGE_TOKEN_KEY, rawToken);
        localStorage.setItem(STORAGE_OFFICER_KEY, JSON.stringify(verifiedUser));
      } catch (err) {
        console.warn('[SentinelAuth] Could not write to localStorage:', err);
      }

      return true;
    } catch (err: any) {
      console.error('[SentinelAuth] Backend session verification error:', err);
      setStatus('ERROR');
      setErrorMessage('Authentication service is temporarily unavailable. Could not connect to Sentinel Command Server.');
      return false;
    }
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          const freshToken = await getIdToken(user, false);
          await verifyTokenWithBackend(freshToken, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            uid: user.uid
          });
        } catch (err: any) {
          console.warn('[SentinelAuth] Token acquisition error:', err?.message);
        }
      } else {
        setFirebaseUser(null);
        // If not in demo mode with a valid token, reset
        if (!token || !token.startsWith('test-token:')) {
          setOfficer(null);
          setToken(null);
          setStatus('IDLE');
        }
      }
    });

    return () => unsubscribe();
  }, [verifyTokenWithBackend, token]);

  // Google Sign-In handler
  const loginWithGoogle = async () => {
    setStatus('AUTHENTICATING');
    setErrorMessage(null);

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const user = credential.user;
      setFirebaseUser(user);

      const idToken = await user.getIdToken();
      await verifyTokenWithBackend(idToken, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid
      });
    } catch (err: any) {
      console.error('[SentinelAuth] Google Sign-in error:', err);
      
      const isApiKeyError = err?.code === 'auth/api-key-not-valid' || 
                            err?.code === 'auth/invalid-api-key' ||
                            err?.message?.includes('api-key-not-valid') ||
                            err?.message?.includes('invalid-api-key');

      if (err.code === 'auth/popup-closed-by-user') {
        setStatus('IDLE');
        setErrorMessage('Google sign-in was cancelled.');
      } else if (err.code === 'auth/popup-blocked') {
        setStatus('ERROR');
        setErrorMessage('Sign-in popup was blocked by your browser. Please allow popups or use Instant Officer Access.');
      } else if (isApiKeyError) {
        setStatus('ERROR');
        setErrorMessage('Firebase Authentication is initializing. Use "Instant Officer Access" to enter Sentinel Grid immediately.');
      } else if (err.code === 'auth/network-request-failed') {
        setStatus('ERROR');
        setErrorMessage('Authentication service is temporarily unavailable. Please check your network connection.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setStatus('ERROR');
        setErrorMessage('Google Sign-In is not enabled on this Firebase project. Use Instant Officer Access to enter.');
      } else {
        setStatus('ERROR');
        setErrorMessage(err.message || 'Authentication error occurred during Google sign-in.');
      }
    }
  };

  // Demo Officer login (used for testing RBAC personas & preview environments)
  const loginWithDemoOfficer = async (email: string) => {
    setStatus('AUTHENTICATING');
    setErrorMessage(null);

    const demoToken = `test-token:${email}:uid-officer-${Date.now()}`;
    await verifyTokenWithBackend(demoToken, {
      email,
      displayName: email.split('@')[0],
      uid: `uid-${email}`
    });
  };

  // Sign out handler
  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {});
      }
      await fbSignOut(auth).catch(() => {});
    } finally {
      setOfficer(null);
      setFirebaseUser(null);
      setToken(null);
      setStatus('IDLE');
      setAccountStatus(null);
      setErrorMessage(null);

      try {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_OFFICER_KEY);
        sessionStorage.clear();
      } catch {}
    }
  };

  const clearError = () => {
    setErrorMessage(null);
    if (status === 'ERROR' || status === 'DENIED') {
      setStatus('IDLE');
    }
  };

  const checkUserPermission = useCallback((permission: string): boolean => {
    if (!officer) return false;
    return checkPermission(officer, permission);
  }, [officer]);

  const checkUserRole = useCallback((...roles: SentinelRole[]): boolean => {
    if (!officer) return false;
    return hasAnyRole(officer, roles);
  }, [officer]);

  const getAuthHeader = useCallback((): Record<string, string> => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`
    };
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        officer,
        firebaseUser,
        token,
        status,
        errorMessage,
        accountStatus,
        loginWithGoogle,
        loginWithDemoOfficer,
        logout,
        clearError,
        hasPermission: checkUserPermission,
        hasRole: checkUserRole,
        getAuthHeader
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
