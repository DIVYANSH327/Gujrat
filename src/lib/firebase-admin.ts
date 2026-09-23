import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const isLocalOnly = () => {
  return process.env.SENTINEL_RUNTIME_MODE === 'LOCAL_ONLY' || 
         process.env.CLOUD_MODE === 'LOCAL_ONLY' ||
         process.env.ENABLE_GOOGLE_CLOUD_SYNC !== 'true';
};

if (!getApps().length && !isLocalOnly()) {
  try {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (e) {
    console.warn('[FirebaseAdmin] Initialization note:', e);
  }
}

export const adminAuth = !isLocalOnly() && getApps().length ? getAuth() : null;

let _adminDb: ReturnType<typeof getFirestore> | null = null;
export function getAdminDb() {
  // Authoritative Guard: 0 Firestore requests, 0 Firestore connections during LOCAL_ONLY operation
  if (isLocalOnly()) {
    return null;
  }

  if (!_adminDb && getApps().length > 0) {
    try {
      _adminDb = firebaseConfig.firestoreDatabaseId
        ? getFirestore(firebaseConfig.firestoreDatabaseId)
        : getFirestore();
    } catch (e) {
      console.warn('[FirebaseAdmin] Firestore initialization deferred or failed:', e);
      return null;
    }
  }
  return _adminDb;
}

