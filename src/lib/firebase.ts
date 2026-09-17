/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Official Firebase Client Authentication SDK Initialization
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

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
  
  // Set browser local persistence so authenticated officer session remains active on refresh
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[SentinelAuth] Could not set local persistence:', err?.message);
  });

  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
} catch (error) {
  console.warn('[SentinelAuth] Firebase Client initialization note:', error);
  app = initializeApp(firebaseConfig, 'sentinel-fallback');
  auth = getAuth(app);
  db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}

/**
 * Validates active connection to Firestore database instance.
 */
export async function testFirestoreConnection(): Promise<boolean> {
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

export { app, auth, db, googleProvider, firebaseConfig };

