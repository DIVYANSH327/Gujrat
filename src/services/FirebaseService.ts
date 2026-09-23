/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Centralized Firebase & Firestore Initialization Service
 * 
 * Invariants:
 * 1. ZERO FIRESTORE IN LOCAL_ONLY: When SENTINEL_RUNTIME_MODE === 'LOCAL_ONLY', Firestore is strictly DISABLED.
 * 2. NO DIRECT initializeApp CALLS: All components and services import Firebase from this centralized service.
 * 3. EXPLICIT LOCAL GUARD: Prevents unauthorized remote cloud connections during offline / local edge operations.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  Auth, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Evaluates whether the system is running in strict LOCAL_ONLY / offline mode.
 */
export function isLocalMode(): boolean {
  // Check process.env (Server/Node or SSR environment)
  if (typeof process !== 'undefined' && process.env) {
    if (
      process.env.SENTINEL_RUNTIME_MODE === 'LOCAL_ONLY' ||
      process.env.CLOUD_MODE === 'LOCAL_ONLY' ||
      process.env.ENABLE_GOOGLE_CLOUD_SYNC === 'false'
    ) {
      return true;
    }
  }

  // Check Vite client environment variables
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    if (
      metaEnv.VITE_SENTINEL_RUNTIME_MODE === 'LOCAL_ONLY' ||
      metaEnv.VITE_CLOUD_MODE === 'LOCAL_ONLY'
    ) {
      return true;
    }
  }

  return false;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let isFirestoreEnabled = false;

// Explicit initialization logic with LOCAL_ONLY guard
if (!isLocalMode()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Explicit check to stop Firestore if in local mode
    if (!isLocalMode()) {
      db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
      isFirestoreEnabled = true;
    } else {
      db = null;
      isFirestoreEnabled = false;
    }

    if (auth && typeof window !== 'undefined') {
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('[FirebaseService] Could not set local persistence:', err?.message);
      });
    }

    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
  } catch (error) {
    console.warn('[FirebaseService] Firebase Client initialization note:', error);
    try {
      app = initializeApp(firebaseConfig, 'sentinel-fallback');
      auth = getAuth(app);
      if (!isLocalMode()) {
        db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
        isFirestoreEnabled = true;
      } else {
        db = null;
        isFirestoreEnabled = false;
      }
      googleProvider = new GoogleAuthProvider();
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
    } catch {
      app = null;
      auth = null;
      db = null;
      isFirestoreEnabled = false;
    }
  }
} else {
  // In LOCAL_ONLY mode, explicitly stop Firestore and all remote network triggers
  app = null;
  auth = null;
  db = null;
  googleProvider = null;
  isFirestoreEnabled = false;
  console.log('[FirebaseService] SENTINEL_RUNTIME_MODE is LOCAL_ONLY. Firebase & Firestore are strictly DISABLED.');
}

/**
 * Validates active connection to Firestore database instance if cloud persistence is enabled.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  if (isLocalMode() || !db) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'system', 'health-probe'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline or database initializing.');
    }
    return false;
  }
}

/**
 * Safe accessor for Firestore instance.
 * Returns null if in LOCAL_ONLY mode or uninitialized.
 */
export function getFirestoreDb(): Firestore | null {
  if (isLocalMode()) {
    return null;
  }
  return db;
}

/**
 * Safe accessor for Firebase Auth instance.
 */
export function getFirebaseAuth(): Auth | null {
  return auth;
}

export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  firebaseConfig,
  isFirestoreEnabled 
};
