/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Firestore User Persistence Service
 * 
 * Persists authenticated user profiles, login timestamps, and access audit records
 * into Cloud Firestore with non-blocking resilience for offline / edge fallback.
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '../FirebaseService';
import { SentinelUser } from '../../types/auth';

export interface FirestoreUserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  status: string;
  department: string;
  district: string;
  badgeId?: string;
  lastLogin: string;
  updatedAt: string;
  createdAt: string;
  loginProvider: 'google.com' | 'demo' | 'guest';
}

/**
 * Saves or updates an authenticated officer/user profile in Cloud Firestore.
 */
export async function syncUserProfileToFirestore(
  user: SentinelUser,
  provider: 'google.com' | 'demo' | 'guest' = 'google.com'
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    // Firestore not initialized or in local fallback mode
    return false;
  }

  // Use firebaseUid or user.id as document key (must be valid chars [a-zA-Z0-9_-]+)
  const docId = (user.firebaseUid || user.id).replace(/[^a-zA-Z0-9_\-]/g, '_');

  try {
    const userDocRef = doc(db, 'users', docId);
    const existingSnap = await getDoc(userDocRef).catch(() => null);

    const now = new Date().toISOString();

    const profileData: FirestoreUserProfile = {
      id: user.id || docId,
      email: user.email || 'officer@gujaratpolice.gov.in',
      displayName: user.displayName || 'Authorized Officer',
      photoURL: user.photoURL || '',
      role: user.role || 'COMMANDER',
      status: user.status || 'ACTIVE',
      department: user.department || 'Gujarat Police Surveillance Grid',
      district: user.district || 'Statewide Command',
      badgeId: user.badgeId || 'GP-OFFICER-7922',
      lastLogin: now,
      updatedAt: now,
      createdAt: existingSnap?.exists() ? existingSnap.data()?.createdAt || now : now,
      loginProvider: provider
    };

    await setDoc(userDocRef, profileData, { merge: true });
    return true;
  } catch (error) {
    // Graceful non-blocking degradation if network or rules temporarily block
    console.warn('[FirestoreUserPersistence] Profile sync note:', error);
    return false;
  }
}

/**
 * Retrieves an existing user profile from Cloud Firestore.
 */
export async function getUserProfileFromFirestore(userId: string): Promise<FirestoreUserProfile | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const docId = userId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const userDocRef = doc(db, 'users', docId);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data() as FirestoreUserProfile;
    }
    return null;
  } catch (error) {
    console.warn('[FirestoreUserPersistence] Get user note:', error);
    return null;
  }
}
