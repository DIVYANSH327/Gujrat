/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ConfidencePolicyService & AI Explainability Controller
 * Enforces strict false-confidence prevention, multi-signal evidence decomposition,
 * and transparent "Why did AI do this?" auditability.
 */

import { 
  ConfidenceBand, 
  ContributingSignal, 
  AIExplainabilityRecord, 
  OperationalDataLineageRecord 
} from '../types';

export class ConfidencePolicyService {
  private static instance: ConfidencePolicyService | null = null;
  private explainabilityRecords: Map<string, AIExplainabilityRecord> = new Map();
  private lineageRecords: Map<string, OperationalDataLineageRecord> = new Map();

  private constructor() {}

  public static getInstance(): ConfidencePolicyService {
    if (!ConfidencePolicyService.instance) {
      ConfidencePolicyService.instance = new ConfidencePolicyService();
    }
    return ConfidencePolicyService.instance;
  }

  /**
   * Translates a mathematical confidence probability [0.0 - 1.0] into an operational confidence band
   */
  public evaluateBand(confidence: number): ConfidenceBand {
    if (confidence >= 0.92) return 'VERY_HIGH';
    if (confidence >= 0.80) return 'HIGH';
    if (confidence >= 0.60) return 'MEDIUM';
    if (confidence >= 0.40) return 'LOW';
    return 'VERY_LOW';
  }

  /**
   * Generates a fully decomposed explainability record for an AI correlation or detection
   */
  public createExplainabilityRecord(params: {
    targetType: 'CORRELATION' | 'ANPR' | 'VIOLATION' | 'HANDOFF' | 'WATCHLIST';
    targetId: string;
    modelProvider?: string;
    modelVersion?: string;
    signals: { label: string; value: string; match: boolean; partial?: boolean; weight: number }[];
    conflictingSignals?: string[];
    missingSignals?: string[];
  }): AIExplainabilityRecord {
    const recordId = `EXP-${params.targetType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    let totalWeight = 0;
    let earnedWeight = 0;

    const contributingSignals: ContributingSignal[] = params.signals.map(s => {
      totalWeight += s.weight;
      const status = s.match ? 'MATCH' : s.partial ? 'PARTIAL' : 'MISMATCH';
      if (s.match) earnedWeight += s.weight;
      else if (s.partial) earnedWeight += s.weight * 0.5;

      return {
        signal: s.label,
        value: s.value,
        status,
        weight: s.weight
      };
    });

    const calculatedConfidence = totalWeight > 0 ? earnedWeight / totalWeight : 0.5;
    const band = this.evaluateBand(calculatedConfidence);

    let decisionSummary = `Decomposed inference based on ${contributingSignals.length} telemetry signals.`;
    if (params.conflictingSignals && params.conflictingSignals.length > 0) {
      decisionSummary += ` Notice: ${params.conflictingSignals.length} conflicting signal(s) detected.`;
    }
    if (band === 'VERY_LOW' || band === 'LOW') {
      decisionSummary += ' Flagged as INSUFFICIENT_EVIDENCE for autonomous action; human review required.';
    }

    const record: AIExplainabilityRecord = {
      recordId,
      targetType: params.targetType,
      targetId: params.targetId,
      modelProvider: params.modelProvider || 'Gujarat State Edge AI Framework',
      modelVersion: params.modelVersion || 'v2.4-edge-anpr',
      confidence: Math.round(calculatedConfidence * 100) / 100,
      confidenceBand: band,
      contributingSignals,
      conflictingSignals: params.conflictingSignals || [],
      missingSignals: params.missingSignals || [],
      decisionSummary,
      timestamp: new Date().toISOString()
    };

    this.explainabilityRecords.set(recordId, record);
    return record;
  }

  public getExplainability(recordId: string): AIExplainabilityRecord | undefined {
    return this.explainabilityRecords.get(recordId);
  }

  public getExplainabilityByTarget(targetId: string): AIExplainabilityRecord | undefined {
    for (const record of this.explainabilityRecords.values()) {
      if (record.targetId === targetId) return record;
    }
    return undefined;
  }

  /**
   * Tracks authoritative data lineage for evidence, observations, and decisions
   */
  public recordLineage(record: Omit<OperationalDataLineageRecord, 'lineageId' | 'createdAt'>): OperationalDataLineageRecord {
    const lineageId = `LIN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const fullRecord: OperationalDataLineageRecord = {
      ...record,
      lineageId,
      createdAt: new Date().toISOString()
    };
    this.lineageRecords.set(lineageId, fullRecord);
    return fullRecord;
  }

  public getLineage(lineageId: string): OperationalDataLineageRecord | undefined {
    return this.lineageRecords.get(lineageId);
  }
}

export const confidencePolicyService = ConfidencePolicyService.getInstance();
