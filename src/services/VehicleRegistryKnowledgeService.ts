/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * VehicleRegistryKnowledgeService: Retrieval-Augmented Generation (RAG) Reference Layer
 * for Authorized VAHAN Schema Definitions, Technical Integration Specs, Field Semantics,
 * and Approved Vehicle Metadata Standards.
 * 
 * CRITICAL ARCHITECTURAL DISTINCTION:
 * - VehicleRegistryKnowledgeService (RAG): Provides authoritative documentation, schemas,
 *   legal definitions, and integration guides. Never fabricates live vehicle status.
 * - VahanAdapter: Hardware/API transport interface for live vehicle registration querying
 *   against authorized MoRTH / State Transport endpoints (currently marked NOT CONNECTED / SIMULATED).
 * 
 * Unified CCTV Intelligence Grid V1.3
 */

export interface VahanKnowledgeDoc {
  docId: string;
  category: 'SCHEMA' | 'FIELD_DEFINITION' | 'INTEGRATION_SPEC' | 'LEGAL_FRAMEWORK' | 'DATA_GOVERNANCE';
  title: string;
  fieldName?: string;
  description: string;
  dataType?: string;
  exampleValue?: string;
  authorityReference: string;
  securityClearanceRequired: 'PUBLIC_SPEC' | 'POLICE_OFFICER' | 'TRANSPORT_ADMIN';
  tags: string[];
}

export interface VahanKnowledgeQueryResult {
  query: string;
  matchedDocs: VahanKnowledgeDoc[];
  explanation: string;
  sourceType: 'AUTHORITATIVE_DOCUMENTATION_RAG';
  disclaimer: string;
}

export class VehicleRegistryKnowledgeService {
  private static instance: VehicleRegistryKnowledgeService;
  private knowledgeBase: VahanKnowledgeDoc[] = [];

  private constructor() {
    this.seedKnowledgeBase();
  }

  public static getInstance(): VehicleRegistryKnowledgeService {
    if (!VehicleRegistryKnowledgeService.instance) {
      VehicleRegistryKnowledgeService.instance = new VehicleRegistryKnowledgeService();
    }
    return VehicleRegistryKnowledgeService.instance;
  }

  private seedKnowledgeBase(): void {
    this.knowledgeBase = [
      {
        docId: 'VAHAN-DOC-001',
        category: 'FIELD_DEFINITION',
        title: 'Registration Number / HSRP (High Security Registration Plate)',
        fieldName: 'regn_no',
        description: 'Standard alphanumeric vehicle registration identifier mandated under CMV Rule 50. In Gujarat, prefixes represent state code (GJ) followed by 2-digit RTO district code (01 for Ahmedabad, 05 for Surat, 06 for Vadodara, 18 for Gandhinagar), 2-letter series, and 4-digit numeric code.',
        dataType: 'VARCHAR(10)',
        exampleValue: 'GJ05AB1234',
        authorityReference: 'MoRTH Central Motor Vehicles Rules 1989, Rule 50',
        securityClearanceRequired: 'PUBLIC_SPEC',
        tags: ['plate', 'hsrp', 'registration', 'rto', 'identifier']
      },
      {
        docId: 'VAHAN-DOC-002',
        category: 'FIELD_DEFINITION',
        title: 'Chassis / VIN (Vehicle Identification Number)',
        fieldName: 'chasi_no',
        description: '17-character unique structural identifier stamped onto vehicle frame by manufacturer under ISO 3779 standard. Characters 1-3 indicate World Manufacturer Identifier (WMI), 4-9 describe vehicle attributes, 10 is model year, 11 is plant code, and 12-17 is serial production number.',
        dataType: 'VARCHAR(30)',
        exampleValue: 'MA1TA2BK5L1234567',
        authorityReference: 'ISO 3779 / CMVR Rule 122',
        securityClearanceRequired: 'POLICE_OFFICER',
        tags: ['vin', 'chassis', 'manufacturer', 'forensic', 'engine']
      },
      {
        docId: 'VAHAN-DOC-003',
        category: 'FIELD_DEFINITION',
        title: 'Engine / Motor Serial Number',
        fieldName: 'eng_no',
        description: 'Unique internal combustion engine block or electric motor serial number stamped by manufacturer. Used for physical forensic anti-tampering verification during vehicle seizure or theft recovery.',
        dataType: 'VARCHAR(30)',
        exampleValue: '2.2L-MHAWK-987654',
        authorityReference: 'State Transport Registration Guidelines',
        securityClearanceRequired: 'POLICE_OFFICER',
        tags: ['engine', 'motor', 'serial', 'forensic', 'theft']
      },
      {
        docId: 'VAHAN-DOC-004',
        category: 'FIELD_DEFINITION',
        title: 'RC Status (Registration Certificate Lifecycle State)',
        fieldName: 'rc_status',
        description: 'Operational lifecycle of the registration record. Values include: ACTIVE (valid registration), EXPIRED (past 15-year renewal window), SUSPENDED (court or RTO order), CANCELLED (total loss / scrap), or BLACKLISTED (police alert / finance default).',
        dataType: 'ENUM',
        exampleValue: 'ACTIVE | BLACKLISTED | SUSPENDED',
        authorityReference: 'VAHAN 4.0 Standard Operating Procedure',
        securityClearanceRequired: 'PUBLIC_SPEC',
        tags: ['rc', 'status', 'blacklisted', 'active', 'suspended', 'fitness']
      },
      {
        docId: 'VAHAN-DOC-005',
        category: 'FIELD_DEFINITION',
        title: 'Fitness Certificate Validity',
        fieldName: 'fit_upto',
        description: 'Statutory expiration date for vehicle mechanical roadworthiness. For private non-transport vehicles, valid for 15 years from initial registration and 5 years thereafter upon re-inspection. For commercial transport vehicles, requires mandatory annual/bi-annual inspection.',
        dataType: 'DATE',
        exampleValue: '2031-08-15',
        authorityReference: 'Motor Vehicles Act Section 56',
        securityClearanceRequired: 'PUBLIC_SPEC',
        tags: ['fitness', 'inspection', 'roadworthiness', 'commercial']
      },
      {
        docId: 'VAHAN-DOC-006',
        category: 'FIELD_DEFINITION',
        title: 'Hypothecation / Financier Ownership Lien',
        fieldName: 'hypth_details',
        description: 'Financial lien recorded under Section 51 of MV Act. Identifies bank, NBFC, or financing institution holding equitable mortgage on the vehicle until loan clearance certificate (Form 35) is endorsed by RTO.',
        dataType: 'VARCHAR(100)',
        exampleValue: 'STATE BANK OF INDIA / HDFC BANK LTD',
        authorityReference: 'Motor Vehicles Act 1988, Section 51',
        securityClearanceRequired: 'POLICE_OFFICER',
        tags: ['finance', 'hypothecation', 'loan', 'lien', 'bank']
      },
      {
        docId: 'VAHAN-DOC-007',
        category: 'SCHEMA',
        title: 'VAHAN 4.0 National Vehicle Register Data Schema',
        description: 'Standard JSON REST API response schema defined by National Informatics Centre (NIC) for state transport department integration. Covers owner metadata, technical specs, tax validity, insurance validity, PUCC (Pollution), and permit status.',
        dataType: 'JSON Schema v7',
        authorityReference: 'NIC Technical Integration Specification v4.2.1',
        securityClearanceRequired: 'TRANSPORT_ADMIN',
        tags: ['schema', 'nic', 'vahan4', 'api', 'json', 'endpoints']
      },
      {
        docId: 'VAHAN-DOC-008',
        category: 'DATA_GOVERNANCE',
        title: 'Data Privacy & Access Control Protocol (DPDP Act Compliance)',
        description: 'Access to citizen owner PII (personal names, residential addresses, phone numbers) through VAHAN/CCTNS interfaces is strictly restricted to authorized investigating officers with documented GD/FIR correlation number. Audit logging is mandatory on every lookup.',
        dataType: 'POLICY_SPEC',
        authorityReference: 'Digital Personal Data Protection Act 2023 / Gujarat Police IT Guidelines',
        securityClearanceRequired: 'PUBLIC_SPEC',
        tags: ['privacy', 'dpdp', 'audit', 'pii', 'gd', 'fir', 'security']
      }
    ];
  }

  /**
   * Performs semantic / keyword query over VAHAN technical and schema documentation.
   */
  public queryKnowledgeBase(query: string): VahanKnowledgeQueryResult {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        query,
        matchedDocs: this.knowledgeBase.slice(0, 4),
        explanation: 'Providing overview of core VAHAN schema definitions and standards.',
        sourceType: 'AUTHORITATIVE_DOCUMENTATION_RAG',
        disclaimer: 'RAG KNOWLEDGE LAYER: Documentation and specification reference only. Does not query live vehicle registration status.'
      };
    }

    const matched = this.knowledgeBase.filter(doc => {
      const inTitle = doc.title.toLowerCase().includes(q);
      const inDesc = doc.description.toLowerCase().includes(q);
      const inField = doc.fieldName?.toLowerCase().includes(q);
      const inTags = doc.tags.some(t => t.toLowerCase().includes(q));
      return inTitle || inDesc || inField || inTags;
    });

    const explanation = matched.length > 0
      ? `Retrieved ${matched.length} authorized reference document(s) matching "${query}".`
      : `No direct documentation match found for "${query}". Displaying core technical standards.`;

    return {
      query,
      matchedDocs: matched.length > 0 ? matched : this.knowledgeBase.slice(0, 3),
      explanation,
      sourceType: 'AUTHORITATIVE_DOCUMENTATION_RAG',
      disclaimer: 'RAG KNOWLEDGE LAYER: Authorized documentation and schema reference only. Live registration status requires authorized VahanAdapter API transport credentials.'
    };
  }

  /**
   * Retrieves specific field definition by field name.
   */
  public getFieldDefinition(fieldName: string): VahanKnowledgeDoc | null {
    const fn = fieldName.toLowerCase().trim();
    return this.knowledgeBase.find(d => 
      d.fieldName?.toLowerCase() === fn ||
      d.tags.some(t => t.toLowerCase() === fn) ||
      (fn.includes('chassis') && (d.fieldName === 'chasi_no' || d.tags.includes('chassis'))) ||
      (fn.includes('reg') && (d.fieldName === 'regn_no' || d.tags.includes('registration')))
    ) || null;
  }

  public getDocByFieldName(fieldName: string): VahanKnowledgeDoc | null {
    return this.getFieldDefinition(fieldName);
  }

  /**
   * Returns all available knowledge base documents.
   */
  public getAllDocuments(): VahanKnowledgeDoc[] {
    return [...this.knowledgeBase];
  }
}

export const vehicleRegistryKnowledgeService = VehicleRegistryKnowledgeService.getInstance();
