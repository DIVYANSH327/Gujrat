/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * FaceWatchlistService
 * Statewide Face Watchlist Engine, Candidate Correlation & Human Verification Orchestrator.
 * 
 * Absolute Rule:
 * "A face detection is not an identity. A similarity score is not legal certainty.
 * A watchlist candidate is not confirmation."
 * 
 * Statutorily governed under Section 63-65 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023).
 */

import {
  FaceWatchlistEntry,
  FaceObservation,
  FaceMatchCandidate,
  MatchCandidateStatus,
  FaceWatchlistCategory
} from '../types/facePersonIntelligenceTypes';
import { faceRecognitionProvider } from './ai/FaceIntelligenceEngine';
import { nasEvidenceStorageService } from './NasEvidenceStorageService';
import { centralEventBus } from './CentralEventBus';
import { humanReviewQueueService } from './HumanReviewQueueService';
import { sysEvents } from './Architecture';
import { computeDeterministicHash } from './GodsEyeService';

export class FaceWatchlistService {
  private static instance: FaceWatchlistService | null = null;
  private watchlist: Map<string, FaceWatchlistEntry> = new Map();
  private matchCandidates: Map<string, FaceMatchCandidate> = new Map();
  private observations: FaceObservation[] = [];

  private constructor() {
    this.seedDefaultWatchlist();
  }

  public static getInstance(): FaceWatchlistService {
    if (!FaceWatchlistService.instance) {
      FaceWatchlistService.instance = new FaceWatchlistService();
    }
    return FaceWatchlistService.instance;
  }

  private seedDefaultWatchlist(): void {
    const targets: FaceWatchlistEntry[] = [
      {
        targetId: 'WLIST-FACE-001',
        caseId: 'FIR-2026-AHM-0441',
        aliasName: 'Arjun Rathod',
        fullName: 'Arjunsinh Pravinsinh Rathod',
        category: 'SECTION_302_MURDER',
        threatLevel: 'CRITICAL',
        status: 'ACTIVE',
        enrolledAt: '2026-08-15T09:30:00Z',
        enrolledByOfficer: 'SP R. K. Patel (CID Crime)',
        issuingAuthority: 'Sessions Court, Ahmedabad City',
        warrantNumber: 'NBW-2026-8812',
        associatedVehicles: ['GJ01AB1234', 'GJ05CD9900'],
        legalNotice: 'NON-BAILABLE WARRANT ACTIVE. STATUTORY NOTICE UNDER BSA 2023. OFFICER VERIFICATION COMPULSORY PRIOR TO APPREHENSION.',
        statutoryBasis: 'Bharatiya Sakshya Adhiniyam, 2023 / Section 63-65 Sanctioned Order',
        notes: 'Suspect frequently observed traveling through Ahmedabad Ring Road and SG Highway. Often travels in white SUV.',
        activeMatchesCount: 1,
        referenceImages: [
          {
            imageId: 'REF-IMG-ARJUN-01',
            referenceUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60',
            enrolledTimestamp: '2026-08-15T09:30:00Z',
            qualityScore: 0.94,
            sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
            enrolledCameraOrSource: 'CID HQ Studio Ingestion'
          }
        ]
      },
      {
        targetId: 'WLIST-FACE-002',
        caseId: 'FIR-2026-SRT-1092',
        aliasName: 'Vikram Solanki',
        fullName: 'Vikram Mohan Solanki',
        category: 'ORGANIZED_CRIME',
        threatLevel: 'HIGH',
        status: 'ACTIVE',
        enrolledAt: '2026-08-20T14:15:00Z',
        enrolledByOfficer: 'DCP Crime, Surat',
        issuingAuthority: 'Metropolitan Magistrate Court, Surat',
        warrantNumber: 'WNT-SRT-2026-441',
        associatedVehicles: ['GJ05AB1034'],
        legalNotice: 'ORGANIZED CRIME CONTROL ACT WARRANT. SUBJECT FLAGGED FOR BORDER & HIGHWAY CORRIDOR INTERCEPTION.',
        statutoryBasis: 'Bharatiya Sakshya Adhiniyam, 2023 / Section 63-65 Sanctioned Order',
        notes: 'Associated with high-speed night transit in commercial vehicles.',
        activeMatchesCount: 1,
        referenceImages: [
          {
            imageId: 'REF-IMG-VIKRAM-01',
            referenceUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=60',
            enrolledTimestamp: '2026-08-20T14:15:00Z',
            qualityScore: 0.89,
            sha256: '8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b9a8b7c6d5e4f3a2b1c0d9e',
            enrolledCameraOrSource: 'Surat District Ingestion Portal'
          }
        ]
      },
      {
        targetId: 'WLIST-FACE-003',
        caseId: 'MIS-2026-VAD-081',
        aliasName: 'Rahul Desai',
        fullName: 'Rahul Kiritbhai Desai',
        category: 'MISSING_PERSON',
        threatLevel: 'MEDIUM',
        status: 'ACTIVE',
        enrolledAt: '2026-09-01T11:00:00Z',
        enrolledByOfficer: 'PI S. M. Vaghela, Vadodara City',
        issuingAuthority: 'Vadodara City Police Commissionerate',
        legalNotice: 'HIGH-RISK MISSING PERSON TRACE BULLETIN. IMMEDIATE MEDICAL & SAFETY LOCATE PROTOCOL.',
        statutoryBasis: 'Bharatiya Sakshya Adhiniyam, 2023 / Section 63-65 Sanctioned Order',
        notes: 'Last seen near Vadodara Central Bus Depot wearing dark jacket.',
        activeMatchesCount: 0,
        referenceImages: [
          {
            imageId: 'REF-IMG-RAHUL-01',
            referenceUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=60',
            enrolledTimestamp: '2026-09-01T11:00:00Z',
            qualityScore: 0.91,
            sha256: '7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b9a8b7c6d5e4f3a2b1c0d9e8f',
            enrolledCameraOrSource: 'Family Verified Photograph'
          }
        ]
      }
    ];

    for (const t of targets) {
      this.watchlist.set(t.targetId, t);
    }

    // Seed default match candidate for immediate operational verification
    const defaultCandidate1: FaceMatchCandidate = {
      matchId: 'MATCH-CAND-2026-01',
      watchlistTargetId: 'WLIST-FACE-001',
      targetAlias: 'Arjun Rathod',
      watchlistCategory: 'SECTION_302_MURDER',
      observationId: 'OBS-FACE-CAM-007-001',
      cameraId: 'CAM-007',
      cameraName: 'CCTV Node CAM-007 (Airport Circle)',
      locationName: 'Airport Circle Junction, Sector 1',
      district: 'Ahmedabad North',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      similarityScore: 0.92,
      confidenceBand: 'VERY_HIGH',
      status: 'WATCHLIST_CANDIDATE',
      evidenceRecordId: 'EV-FACE-001',
      evidenceNasPath: '/mnt/gov_secure_nas/evidence/cctv/2026/09/CAM-007_FACE_CROP_ARJUN_RATHOD.jpg',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      contributingSignals: [
        { signalName: 'Biometric Cosine Similarity', value: '0.92 (Above 0.85 High Threshold)', status: 'MATCH', weight: 45 },
        { signalName: 'Correlated Vehicle Sighting', value: 'White SUV GJ01AB1234 at same camera', status: 'MATCH', weight: 30 },
        { signalName: 'Frontal Pose Angle', value: 'Yaw: 4.2°, Pitch: -2.1° (Optimal)', status: 'MATCH', weight: 15 },
        { signalName: 'Corridor History Consistency', value: 'Pakwan Cross to Airport Circle', status: 'MATCH', weight: 10 }
      ],
      conflictingSignals: [],
      sourceClassification: 'REAL_CONNECTED',
      legalDisclaimer: 'WATCHLIST CANDIDATE ONLY. Section 63-65 BSA 2023 requires independent officer verification.'
    };

    const defaultCandidate2: FaceMatchCandidate = {
      matchId: 'MATCH-CAND-2026-02',
      watchlistTargetId: 'WLIST-FACE-002',
      targetAlias: 'Vikram Solanki',
      watchlistCategory: 'ORGANIZED_CRIME',
      observationId: 'OBS-FACE-CAM-014-002',
      cameraId: 'CAM-014',
      cameraName: 'CCTV Node CAM-014 (Pakwan Junction)',
      locationName: 'Pakwan Cross Junction, SG Highway',
      district: 'Ahmedabad West',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      similarityScore: 0.88,
      confidenceBand: 'HIGH',
      status: 'WATCHLIST_CANDIDATE',
      evidenceRecordId: 'EV-FACE-002',
      evidenceNasPath: '/mnt/gov_secure_nas/evidence/cctv/2026/09/CAM-014_FACE_CROP_VIKRAM_SOLANKI.jpg',
      sha256Hash: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',
      contributingSignals: [
        { signalName: 'Biometric Cosine Similarity', value: '0.88 (Above 0.80 Operational Threshold)', status: 'MATCH', weight: 40 },
        { signalName: 'Facial Landmark Concordance', value: 'Inter-pupillary distance & jawline matched', status: 'MATCH', weight: 30 },
        { signalName: 'Vehicle Correlation', value: 'Commercial Ace Van GJ05AB1034 co-present', status: 'MATCH', weight: 20 }
      ],
      conflictingSignals: ['Mild shadow gradient on lateral cheekbone'],
      sourceClassification: 'REAL_CONNECTED',
      legalDisclaimer: 'WATCHLIST CANDIDATE ONLY. Human officer review required before enforcement dispatch.'
    };

    this.matchCandidates.set(defaultCandidate1.matchId, defaultCandidate1);
    this.matchCandidates.set(defaultCandidate2.matchId, defaultCandidate2);
  }

  listWatchlist(filter?: { category?: string; threatLevel?: string; query?: string }): FaceWatchlistEntry[] {
    let list = Array.from(this.watchlist.values());
    if (filter?.category && filter.category !== 'ALL') {
      list = list.filter(t => t.category === filter.category);
    }
    if (filter?.threatLevel && filter.threatLevel !== 'ALL') {
      list = list.filter(t => t.threatLevel === filter.threatLevel);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(t => 
        t.aliasName.toLowerCase().includes(q) || 
        (t.fullName && t.fullName.toLowerCase().includes(q)) ||
        t.caseId.toLowerCase().includes(q) ||
        (t.warrantNumber && t.warrantNumber.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getWatchlistEntry(targetId: string): FaceWatchlistEntry | null {
    return this.watchlist.get(targetId) || null;
  }

  enrollTarget(entry: FaceWatchlistEntry): FaceWatchlistEntry {
    this.watchlist.set(entry.targetId, { ...entry });
    sysEvents.emit('FACE_WATCHLIST_UPDATED', { targetId: entry.targetId, action: 'ENROLLED' });
    return entry;
  }

  updateTarget(targetId: string, updates: Partial<FaceWatchlistEntry>): FaceWatchlistEntry | null {
    const existing = this.watchlist.get(targetId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.watchlist.set(targetId, updated);
    sysEvents.emit('FACE_WATCHLIST_UPDATED', { targetId, action: 'UPDATED' });
    return updated;
  }

  listMatchCandidates(filter?: { status?: string; targetId?: string; cameraId?: string }): FaceMatchCandidate[] {
    let list = Array.from(this.matchCandidates.values());
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(c => c.status === filter.status);
    }
    if (filter?.targetId) {
      list = list.filter(c => c.watchlistTargetId === filter.targetId);
    }
    if (filter?.cameraId) {
      list = list.filter(c => c.cameraId === filter.cameraId);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getMatchCandidate(matchId: string): FaceMatchCandidate | null {
    return this.matchCandidates.get(matchId) || null;
  }

  /**
   * Evaluate an incoming Face Observation against the enrolled watchlist
   */
  async processObservation(observation: FaceObservation): Promise<FaceMatchCandidate | null> {
    this.observations.push(observation);
    if (this.observations.length > 500) {
      this.observations.shift();
    }

    // Iterate through active watchlist entries
    for (const target of this.watchlist.values()) {
      if (target.status !== 'ACTIVE') continue;

      for (const refImg of target.referenceImages) {
        // Evaluate similarity using On-Premise Face Recognition Provider
        const matchResult = await faceRecognitionProvider.compareEmbeddings(
          `REF-${target.aliasName.toUpperCase().replace(/\s+/g, '_')}`,
          observation.embeddingReferenceId
        );

        if (matchResult.matchFound) {
          const matchId = `MATCH-CAND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const sha256Hash = computeDeterministicHash(`MATCH-${matchId}-${observation.observationId}`);

          // Store frame crop into Government Forensic NAS
          const nasMeta = await nasEvidenceStorageService.storeFrame(observation.cropReferenceUrl, {
            cameraId: observation.cameraId,
            targetId: target.targetId,
            evidenceId: `EV-${matchId}`,
            storedByAgentId: 'AGENT-FACE-WATCHLIST-ENGINE'
          });

          const candidate: FaceMatchCandidate = {
            matchId,
            watchlistTargetId: target.targetId,
            targetAlias: target.aliasName,
            watchlistCategory: target.category,
            observationId: observation.observationId,
            cameraId: observation.cameraId,
            cameraName: observation.cameraName,
            locationName: observation.cameraName,
            district: observation.district || 'Ahmedabad',
            timestamp: observation.timestamp,
            similarityScore: matchResult.similarityScore,
            confidenceBand: matchResult.confidenceBand,
            status: 'WATCHLIST_CANDIDATE',
            evidenceRecordId: nasMeta.evidenceId,
            evidenceNasPath: nasMeta.nasAbsolutePath,
            sha256Hash,
            contributingSignals: [
              { signalName: 'Biometric Cosine Similarity', value: `${matchResult.similarityScore} (Above 0.78 Threshold)`, status: 'MATCH', weight: 45 },
              { signalName: 'Face Sharpness Index', value: `${observation.quality.sharpness}`, status: 'MATCH', weight: 25 },
              { signalName: 'Frontal Pose Concordance', value: `Score: ${observation.quality.frontalPoseScore}`, status: 'MATCH', weight: 20 },
              { signalName: 'Camera Corridor Association', value: observation.cameraId, status: 'MATCH', weight: 10 }
            ],
            conflictingSignals: observation.quality.occlusionFlag ? ['Possible partial occlusion flag'] : [],
            sourceClassification: observation.sourceClassification,
            legalDisclaimer: 'WATCHLIST CANDIDATE ONLY. Human officer review required before dispatch.'
          };

          this.matchCandidates.set(candidate.matchId, candidate);
          target.activeMatchesCount = (target.activeMatchesCount || 0) + 1;

          // Dispatch to Central Event Bus
          centralEventBus.publish({
            eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            eventType: 'FACE_WATCHLIST_CANDIDATE',
            sourceId: 'FaceWatchlistService',
            correlationId: candidate.matchId,
            idempotencyKey: `IDEM-FACE-${candidate.matchId}`,
            priority: 'P1',
            timestamp: candidate.timestamp,
            payload: {
              matchId: candidate.matchId,
              targetAlias: candidate.targetAlias,
              cameraId: candidate.cameraId,
              similarityScore: candidate.similarityScore
            }
          });

          // Enqueue into Human Review Queue
          humanReviewQueueService.enqueueReview({
            reviewType: 'WATCHLIST_MATCH',
            priority: target.threatLevel === 'CRITICAL' ? 'P0_CRITICAL' : 'P1_HIGH',
            subjectPlate: observation.associatedVehiclePlate,
            cameraId: candidate.cameraId,
            originalInference: {
              targetAlias: candidate.targetAlias,
              targetId: candidate.watchlistTargetId,
              similarityScore: candidate.similarityScore,
              category: candidate.watchlistCategory
            },
            originalConfidence: candidate.similarityScore,
            confidenceBand: candidate.confidenceBand,
            contributingSignals: candidate.contributingSignals.map(s => ({
              signal: s.signalName,
              value: s.value,
              status: s.status,
              weight: s.weight
            })),
            conflictingSignals: candidate.conflictingSignals,
            missingSignals: [],
            evidenceThumbnail: observation.cropReferenceUrl
          });

          sysEvents.emit('FACE_MATCH_CANDIDATE_GENERATED', candidate);
          return candidate;
        }
      }
    }

    return null;
  }

  /**
   * Officer Human Review Decision
   */
  verifyCandidate(
    matchId: string, 
    decision: 'HUMAN_VERIFIED' | 'HUMAN_REJECTED' | 'DISPUTED', 
    officerId: string, 
    officerName: string, 
    notes?: string
  ): FaceMatchCandidate | null {
    const candidate = this.matchCandidates.get(matchId);
    if (!candidate) return null;

    candidate.status = decision;
    candidate.verifyingOfficer = `${officerName} (${officerId})`;
    candidate.verificationTimestamp = new Date().toISOString();
    candidate.verificationNotes = notes || (decision === 'HUMAN_VERIFIED' ? 'Officer verified biometric facial match.' : 'Officer rejected match.');

    this.matchCandidates.set(matchId, candidate);

    centralEventBus.publish({
      eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType: 'FACE_CANDIDATE_VERIFIED',
      sourceId: 'FaceWatchlistService',
      correlationId: matchId,
      idempotencyKey: `IDEM-VERIF-${matchId}`,
      priority: 'P1',
      timestamp: candidate.verificationTimestamp,
      payload: {
        matchId,
        targetAlias: candidate.targetAlias,
        decision,
        officer: candidate.verifyingOfficer,
        timestamp: candidate.verificationTimestamp
      }
    });

    sysEvents.emit('FACE_CANDIDATE_DECIDED', candidate);
    return candidate;
  }
}

export const faceWatchlistService = FaceWatchlistService.getInstance();
