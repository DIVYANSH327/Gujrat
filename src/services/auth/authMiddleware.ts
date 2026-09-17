/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Backend Express Authentication & Authorization Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { sentinelAuthService } from './SentinelAuthService.js';
import { SentinelUser, SentinelRole, hasPermission } from '../../types/auth.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: SentinelUser;
      firebaseClaims?: { uid: string; email?: string; name?: string; picture?: string };
    }
  }
}

/**
 * Validates Firebase ID Token from Authorization header and attaches SentinelUser to req.user.
 * Rejects unauthenticated, expired, or non-ACTIVE accounts.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sentinelAuthService.logAudit({
      route: req.originalUrl || req.path,
      action: 'access_denied',
      result: 'DENY',
      reason: 'Missing or malformed Authorization header',
      requestId: reqId,
      ip: req.ip
    });
    return res.status(401).json({ 
      error: 'UNAUTHORIZED', 
      message: 'Authentication required. Please provide a valid Bearer token.',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  const token = authHeader.substring(7).trim();

  try {
    const claims = await sentinelAuthService.verifyIdToken(token);
    const user = sentinelAuthService.resolveSentinelUser(claims);

    // Enforce Sentinel Account Status
    if (user.status === 'PENDING') {
      sentinelAuthService.logAudit({
        route: req.originalUrl || req.path,
        action: 'access_denied',
        result: 'DENY',
        userId: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        reason: 'Account access pending administrator verification',
        requestId: reqId,
        ip: req.ip
      });
      return res.status(403).json({
        error: 'ACCOUNT_PENDING',
        status: 'PENDING',
        message: 'Your identity has been verified. Sentinel access is awaiting administrator approval.',
        code: 'ACCOUNT_PENDING_APPROVAL'
      });
    }

    if (user.status === 'SUSPENDED') {
      sentinelAuthService.logAudit({
        route: req.originalUrl || req.path,
        action: 'access_denied',
        result: 'DENY',
        userId: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        reason: 'Account suspended by departmental authority',
        requestId: reqId,
        ip: req.ip
      });
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        status: 'SUSPENDED',
        message: 'Your Sentinel access has been temporarily disabled.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    if (user.status === 'DISABLED') {
      sentinelAuthService.logAudit({
        route: req.originalUrl || req.path,
        action: 'access_denied',
        result: 'DENY',
        userId: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        reason: 'Account permanently deactivated',
        requestId: reqId,
        ip: req.ip
      });
      return res.status(403).json({
        error: 'ACCOUNT_DISABLED',
        status: 'DISABLED',
        message: 'Your Sentinel access has been decommissioned.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Attach validated officer state
    req.user = user;
    req.firebaseClaims = claims;
    next();
  } catch (err: any) {
    const isExpired = err?.message?.includes('TOKEN_EXPIRED');
    const action = isExpired ? 'session_expired' : 'login_failure';

    sentinelAuthService.logAudit({
      route: req.originalUrl || req.path,
      action,
      result: 'DENY',
      reason: err?.message || 'Token verification failed',
      requestId: reqId,
      ip: req.ip
    });

    return res.status(401).json({
      error: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: isExpired ? 'Your session token has expired. Please re-authenticate.' : 'Invalid or unverified authentication token.',
      code: isExpired ? 'SESSION_EXPIRED' : 'AUTH_TOKEN_INVALID'
    });
  }
}

/**
 * Enforces specific Sentinel RBAC Role(s)
 */
export function requireRole(...allowedRoles: SentinelRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;

    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    // ADMIN has bypass privileges
    if (user.role === 'ADMIN' || allowedRoles.includes(user.role)) {
      return next();
    }

    sentinelAuthService.logAudit({
      route: req.originalUrl || req.path,
      action: 'role_denied',
      result: 'DENY',
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      reason: `User role '${user.role}' is not in allowed roles [${allowedRoles.join(', ')}]`,
      requestId: reqId,
      ip: req.ip
    });

    return res.status(403).json({
      error: 'ROLE_FORBIDDEN',
      message: `Your officer role (${user.role}) is not authorized to access this operational resource. Required roles: ${allowedRoles.join(', ')}`,
      code: 'RBAC_ROLE_DENIED'
    });
  };
}

/**
 * Enforces specific fine-grained Sentinel Permission(s)
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const reqId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;

    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const hasAll = permissions.every(perm => hasPermission(user, perm));
    if (hasAll) {
      return next();
    }

    sentinelAuthService.logAudit({
      route: req.originalUrl || req.path,
      action: 'permission_denied',
      result: 'DENY',
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      reason: `User lacks required permission(s): [${permissions.join(', ')}]`,
      requestId: reqId,
      ip: req.ip
    });

    return res.status(403).json({
      error: 'PERMISSION_DENIED',
      message: `Access denied. Lacking operational permission: ${permissions.join(', ')}`,
      code: 'RBAC_PERMISSION_DENIED'
    });
  };
}
