/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Transparent Data Access Audit Service
 * Unified CCTV Intelligence Grid V1.2 — Vehicle + Police Data Intelligence Mesh
 */

import { ExternalDataAuditRecord } from '../types';

export interface DataAccessAuditRecord {
  id: string;
  timestamp: string;
  agent: string;
  action: 'VAHAN_REGISTRY_LOOKUP' | 'ECHALLAN_QUERY' | 'EGUJCOP_FIR_SEARCH' | 'AFIS_CORRELATION_REQUEST' | 'ANPR_OCR_QUERY' | 'INVESTIGATION_DOSSIER_ACCESS' | 'WATCHLIST_CROSS_MATCH';
  identifier: string; // e.g. Plate number 'GJ05AB1234'
  correlationId: string;
  result: 'RECORD_FOUND' | 'NO_RECORD' | 'NOT_CONNECTED' | 'DISCREPANCY_FLAGGED' | 'SUCCESS';
  source: string; // e.g. 'VAHAN_SIMULATED_ADAPTER' or 'NOT_CONNECTED_GATEWAY'
  operator: string;
  details: string;
  securityHash?: string;
}

class DataAccessAuditService {
  private auditLog: DataAccessAuditRecord[] = [];
  private externalAuditLog: ExternalDataAuditRecord[] = [];

  constructor() {
    this.seedInitialAuditLogs();
  }

  private seedInitialAuditLogs(): void {
    const now = Date.now();
    this.auditLog = [
      {
        id: `AUD-POLICE-001`,
        timestamp: new Date(now - 1200000).toISOString(),
        agent: 'ANPRAgent',
        action: 'ANPR_OCR_QUERY',
        identifier: 'GJ05AB1234',
        correlationId: 'CORR-INIT-901',
        result: 'RECORD_FOUND',
        source: 'EdgeNode-007 OCR Pipeline',
        operator: 'System Orchestrator',
        details: 'High-confidence plate OCR normalization (96% confidence) at CAM-007'
      },
      {
        id: `AUD-POLICE-002`,
        timestamp: new Date(now - 900000).toISOString(),
        agent: 'VahanIntelligenceAgent',
        action: 'VAHAN_REGISTRY_LOOKUP',
        identifier: 'GJ05AB1234',
        correlationId: 'CORR-INIT-902',
        result: 'RECORD_FOUND',
        source: 'VAHAN Adapter (DEMO DATA)',
        operator: 'Inspector R. K. Patel',
        details: 'Vehicle registry lookup verified: Mahindra Scorpio-N (WHITE SUV)'
      },
      {
        id: `AUD-POLICE-003`,
        timestamp: new Date(now - 600000).toISOString(),
        agent: 'EChallanIntelligenceAgent',
        action: 'ECHALLAN_QUERY',
        identifier: 'GJ05AB1234',
        correlationId: 'CORR-INIT-903',
        result: 'RECORD_FOUND',
        source: 'eChallan Adapter (DEMO DATA)',
        operator: 'Inspector R. K. Patel',
        details: 'Found 3 pending violations (Total amount: ₹3,500)'
      },
      {
        id: `AUD-POLICE-004`,
        timestamp: new Date(now - 300000).toISOString(),
        agent: 'PoliceRecordsIntelligenceAgent',
        action: 'EGUJCOP_FIR_SEARCH',
        identifier: 'GJ05AB1234',
        correlationId: 'CORR-INIT-904',
        result: 'RECORD_FOUND',
        source: 'eGujCop Adapter (DEMO DATA)',
        operator: 'Inspector R. K. Patel',
        details: 'Active FIR flag: FIR-104/2026 Airport Police Station'
      }
    ];
  }

  public logAccess(
    agentOrOptions: string | any,
    action?: DataAccessAuditRecord['action'],
    identifier?: string,
    result?: DataAccessAuditRecord['result'],
    source?: string,
    operator: string = 'System Orchestrator',
    details: string = '',
    correlationId?: string
  ): DataAccessAuditRecord {
    if (typeof agentOrOptions === 'object' && agentOrOptions !== null) {
      const opts = agentOrOptions;
      const record: DataAccessAuditRecord = {
        id: `AUD-POLICE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        agent: opts.agent || opts.officerName || 'GeospatialAgent',
        action: opts.action || 'INVESTIGATION_DOSSIER_ACCESS',
        identifier: opts.targetIdentifier || opts.identifier || 'GEOSPATIAL-EVD',
        correlationId: opts.correlationId || `CORR-${Date.now()}`,
        result: opts.result || 'SUCCESS',
        source: opts.source || opts.officerBadge || 'GeospatialEvidenceService',
        operator: opts.officerName || opts.officerId || operator,
        details: opts.justification || opts.details || ''
      };
      this.auditLog.unshift(record);
      if (this.auditLog.length > 200) this.auditLog.pop();
      return record;
    }

    const record: DataAccessAuditRecord = {
      id: `AUD-POLICE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      agent: agentOrOptions,
      action: action || 'INVESTIGATION_DOSSIER_ACCESS',
      identifier: identifier || 'UNKNOWN',
      correlationId: correlationId || `CORR-${Date.now()}`,
      result: result || 'SUCCESS',
      source: source || 'SYSTEM',
      operator,
      details
    };

    this.auditLog.unshift(record);
    // Keep max 200 items in memory
    if (this.auditLog.length > 200) {
      this.auditLog.pop();
    }
    return record;
  }

  public getLogs(): DataAccessAuditRecord[] {
    return [...this.auditLog];
  }

  public getLogsForIdentifier(identifier: string): DataAccessAuditRecord[] {
    return this.auditLog.filter(l => l.identifier.toUpperCase().includes(identifier.toUpperCase()));
  }

  public clearLogs(): void {
    this.auditLog = [];
  }

  public recordExternalAudit(record: ExternalDataAuditRecord): ExternalDataAuditRecord {
    this.externalAuditLog.unshift(record);
    if (this.externalAuditLog.length > 500) {
      this.externalAuditLog.pop();
    }
    return record;
  }

  public getExternalAuditRecords(filter?: { plate?: string; provider?: string }): ExternalDataAuditRecord[] {
    let list = [...this.externalAuditLog];
    if (filter?.plate) {
      const p = filter.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
      list = list.filter(r => r.plate.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(p));
    }
    if (filter?.provider) {
      list = list.filter(r => r.provider.toUpperCase() === filter.provider?.toUpperCase());
    }
    return list;
  }
}

export const dataAccessAuditService = new DataAccessAuditService();
