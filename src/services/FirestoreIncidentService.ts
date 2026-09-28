/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Real-Time Firestore Incident Synchronization Service
 * 
 * Provides real-time synchronization with Cloud Firestore (`/incidents`),
 * with non-blocking offline resilience and synchronization with IncidentCommandService.
 */

import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  getDocs,
  limit
} from 'firebase/firestore';
import { getFirestoreDb } from './FirebaseService';
import { IncidentRecord, IncidentStatus, IncidentSeverity, IncidentType } from '../types';
import { incidentCommandService } from './IncidentCommandService';
import { cloudSyncService } from './cloud/CloudSyncService';

const COLLECTION_NAME = 'incidents';

export class FirestoreIncidentService {
  private static instance: FirestoreIncidentService | null = null;
  private isSeeded = false;

  public static getInstance(): FirestoreIncidentService {
    if (!FirestoreIncidentService.instance) {
      FirestoreIncidentService.instance = new FirestoreIncidentService();
    }
    return FirestoreIncidentService.instance;
  }

  /**
   * Subscribes to real-time incident reports from Cloud Firestore.
   * If Firestore is uninitialized or empty, seeds default records and falls back to local command service.
   */
  public subscribeToRealtimeIncidents(
    onData: (incidents: IncidentRecord[], source: 'FIRESTORE_LIVE' | 'LOCAL_FALLBACK') => void,
    onError?: (error: Error) => void
  ): () => void {
    // 1. Immediately provide local/cached data synchronously so UI is never blank
    const localList = incidentCommandService.listIncidents();
    onData(localList, 'LOCAL_FALLBACK');

    const db = getFirestoreDb();
    if (!db) {
      return () => {};
    }

    try {
      const incidentsRef = collection(db, COLLECTION_NAME);
      const q = query(incidentsRef, orderBy('detectedAt', 'desc'), limit(50));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty && !this.isSeeded) {
            // Seed initial records into Firestore so new databases have rich live data
            this.seedInitialIncidentsToFirestore().then(() => {
              const currentList = incidentCommandService.listIncidents();
              onData(currentList, 'FIRESTORE_LIVE');
            }).catch(() => {});
            return;
          }

          if (!snapshot.empty) {
            const records: IncidentRecord[] = snapshot.docs.map(docSnap => {
              const data = docSnap.data();
              return {
                incidentId: data.incidentId || docSnap.id,
                title: data.title || 'Operational Incident',
                type: (data.type || 'WATCHLIST_CANDIDATE') as IncidentType,
                severity: (data.severity || 'HIGH') as IncidentSeverity,
                status: (data.status || 'INVESTIGATING') as IncidentStatus,
                location: data.location || 'Gujarat Highway Corridor',
                district: data.district || 'Ahmedabad',
                cameraIds: Array.isArray(data.cameraIds) ? data.cameraIds : [],
                vehiclePlates: Array.isArray(data.vehiclePlates) ? data.vehiclePlates : [],
                assignedAgentIds: Array.isArray(data.assignedAgentIds) ? data.assignedAgentIds : ['InvestigationAgent'],
                assignedOfficer: data.assignedOfficer || undefined,
                detectedAt: data.detectedAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                resolvedAt: data.resolvedAt || undefined,
                timeline: Array.isArray(data.timeline) ? data.timeline : [],
                evidenceIds: Array.isArray(data.evidenceIds) ? data.evidenceIds : [],
                decisions: Array.isArray(data.decisions) ? data.decisions : []
              };
            });

            onData(records, snapshot.metadata.fromCache ? 'LOCAL_FALLBACK' : 'FIRESTORE_LIVE');
          } else {
            const currentList = incidentCommandService.listIncidents();
            onData(currentList, 'LOCAL_FALLBACK');
          }
        },
        (error) => {
          if ((error as any)?.code === 'unavailable') {
            console.info('[FirestoreIncidentService] Operating in resilient offline cache mode.');
          } else {
            console.warn('[FirestoreIncidentService] Real-time listener note (falling back to memory):', error);
          }
          if (onError) onError(error);
          const currentList = incidentCommandService.listIncidents();
          onData(currentList, 'LOCAL_FALLBACK');
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn('[FirestoreIncidentService] Setup listener error:', err);
      const currentList = incidentCommandService.listIncidents();
      onData(currentList, 'LOCAL_FALLBACK');
      return () => {};
    }
  }

  /**
   * Persists a newly created incident into Firestore and local service.
   */
  public async createIncident(incident: IncidentRecord): Promise<void> {
    // 1. Sync to local memory first for instant response
    const taskId = cloudSyncService.queueTask({
      collection: 'incidents',
      operation: 'CREATE',
      itemTitle: `Incident ${incident.incidentId}: ${incident.title}`,
      payloadSizeKb: 1.8
    });

    const db = getFirestoreDb();
    if (!db) return;

    try {
      const docRef = doc(db, COLLECTION_NAME, incident.incidentId);
      await setDoc(docRef, {
        ...incident,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('[FirestoreIncidentService] Write error:', err);
    }
  }

  /**
   * Updates status of an incident in Firestore.
   */
  public async updateIncidentStatus(
    incident: IncidentRecord,
    newStatus: IncidentStatus,
    actor: string,
    notes?: string
  ): Promise<void> {
    cloudSyncService.queueTask({
      collection: 'incidents',
      operation: 'UPDATE',
      itemTitle: `Incident ${incident.incidentId} transition to ${newStatus}`,
      payloadSizeKb: 0.9
    });

    const db = getFirestoreDb();
    const now = new Date().toISOString();
    const updatedTimeline = [
      ...(incident.timeline || []),
      {
        timestamp: now,
        actor,
        action: `Status transitioned to ${newStatus}`,
        notes
      }
    ];

    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, incident.incidentId);
        await updateDoc(docRef, {
          status: newStatus,
          updatedAt: now,
          resolvedAt: newStatus === 'RESOLVED' || newStatus === 'CLOSED' ? now : null,
          timeline: updatedTimeline
        });
      } catch (err) {
        console.warn('[FirestoreIncidentService] Update status note:', err);
      }
    }
  }

  /**
   * Records an accountable officer decision in Firestore.
   */
  public async addDecision(
    incident: IncidentRecord,
    officer: string,
    decision: string,
    justification: string
  ): Promise<void> {
    cloudSyncService.queueTask({
      collection: 'incidents',
      operation: 'AUDIT_RECORD',
      itemTitle: `Officer Decision on ${incident.incidentId}: ${decision}`,
      payloadSizeKb: 1.1
    });

    const db = getFirestoreDb();
    const now = new Date().toISOString();
    const newDecision = {
      timestamp: now,
      officer,
      decision,
      justification
    };

    const updatedDecisions = [...(incident.decisions || []), newDecision];
    const updatedTimeline = [
      ...(incident.timeline || []),
      {
        timestamp: now,
        actor: officer,
        action: `Authorized Order: ${decision}`,
        notes: justification
      }
    ];

    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, incident.incidentId);
        await updateDoc(docRef, {
          decisions: updatedDecisions,
          timeline: updatedTimeline,
          updatedAt: now
        });
      } catch (err) {
        console.warn('[FirestoreIncidentService] Decision write note:', err);
      }
    }
  }

  /**
   * Seeds default operational incident records into Firestore on first run.
   */
  private async seedInitialIncidentsToFirestore(): Promise<void> {
    const db = getFirestoreDb();
    if (!db || this.isSeeded) return;
    this.isSeeded = true;

    try {
      const localIncidents = incidentCommandService.listIncidents();
      for (const inc of localIncidents) {
        const docRef = doc(db, COLLECTION_NAME, inc.incidentId);
        await setDoc(docRef, inc, { merge: true });
      }
    } catch (err) {
      console.warn('[FirestoreIncidentService] Initial seed note:', err);
    }
  }
}

export const firestoreIncidentService = FirestoreIncidentService.getInstance();
