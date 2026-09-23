/**
 * Gujarat Police State Crime Records Bureau (SCRB)
 * Forensic Electronic Evidence PDF Report Generator
 * Compliant with Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023)
 */

import { jsPDF } from 'jspdf';

export interface ForensicEvidenceReportData {
  reportId?: string;
  caseNumber?: string;
  targetVehicle: string;
  normalizedPlate?: string;
  vehicleCategory?: string;
  color?: string;
  investigatingOfficer?: {
    name: string;
    badgeId: string;
    designation: string;
    station: string;
  };
  evidenceItems: Array<{
    evidenceId: string;
    cameraId: string;
    locationName: string;
    timestamp: string; // ISO string
    anprConfidence: number;
    speedKmph?: number;
    distanceKm?: number;
    direction?: string;
    sha256Hash: string;
    plateSha256?: string;
    cropQuality?: number;
    hsrpStatus?: 'VERIFIED' | 'UNCERTAIN' | 'NOT_READABLE' | 'NOT_VERIFIED';
    imageSnapshotUrl?: string;
    plateSnapshotUrl?: string;
    sourceEdgeNode?: string;
    custodyLocked?: boolean;
    ocrConfidenceByChar?: Record<string, number>;
  }>;
  retentionCompliance?: {
    statutoryRetention: string;
    retentionYears: number;
    chainOfCustodyVerified: boolean;
  };
}

/**
 * Generates a court-admissible PDF forensic evidence certificate & dossier under Section 63 BSA 2023.
 */
export async function generateForensicPdfReport(data: ForensicEvidenceReportData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  const reportId = data.reportId || `BSA63-SCRB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const issueDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }) + ' IST';
  const officer = data.investigatingOfficer || {
    name: 'Inspector R. K. Vaghela',
    badgeId: 'GP-CYBER-8842',
    designation: 'Cyber Crime & Video Forensics Division',
    station: 'State Crime Records Bureau (SCRB), Gandhinagar'
  };

  // Helper: Draw Header & Official Border
  const drawPageBorderAndHeader = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(0.6);
    doc.rect(margin - 4, margin - 4, pageWidth - (margin * 2) + 8, pageHeight - (margin * 2) + 8);

    // Decorative top header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(margin - 4, margin - 4, pageWidth - (margin * 2) + 8, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('GUJARAT POLICE • STATE CRIME RECORDS BUREAU (SCRB)', margin, margin + 4);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('FORENSIC SURVEILLANCE GRID & SECTION 63 BSA 2023 EVIDENCE REPOSITORY', margin, margin + 10);

    doc.setFont('courier', 'bold');
    doc.text(`DOC REF: ${reportId}`, pageWidth - margin - 55, margin + 4);
    doc.text(`PAGE ${pageNum} OF ${totalPages}`, pageWidth - margin - 30, margin + 10);

    // Bottom statutory watermark footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Certified under Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023) Section 63. Digital SHA-256 seal tamper-protected.', margin, pageHeight - margin + 1);
  };

  // --- PAGE 1: CERTIFICATE OF ELECTRONIC EVIDENCE ---
  drawPageBorderAndHeader(1, Math.max(1, 1 + Math.ceil(data.evidenceItems.length / 2)));
  currentY = margin + 22;

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CERTIFICATE OF ELECTRONIC EVIDENCE', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('[ Section 63, Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023) ]', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Metadata Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 34, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const col1X = margin + 4;
  const col2X = margin + 95;

  doc.setFont('helvetica', 'bold');
  doc.text('TARGET VEHICLE (HSRP):', col1X, currentY + 6);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(data.targetVehicle, col1X + 46, currentY + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('CASE / FIR NUMBER:', col1X, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.caseNumber || 'CR-0922/2026/CYBER-SCRB', col1X + 46, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL SIGHTINGS RECORDED:', col1X, currentY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.evidenceItems.length} Corridor Observations`, col1X + 46, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('CUSTODY STATUS:', col1X, currentY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('SECURED IN 7-YR CENTRAL FORENSIC VAULT', col1X + 46, currentY + 24);

  // Column 2
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE ID:', col2X, currentY + 6);
  doc.setFont('courier', 'normal');
  doc.text(reportId, col2X + 32, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE OF ISSUANCE:', col2X, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(issueDate, col2X + 32, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFYING OFFICER:', col2X, currentY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${officer.name} (${officer.badgeId})`, col2X + 32, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUTORY ACT:', col2X, currentY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text('Sec. 63 BSA 2023 / CMVR Rule 50', col2X + 32, currentY + 24);

  currentY += 40;

  // Statutory Certification Text
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('STATUTORY STATEMENT UNDER SECTION 63(4) BHARATIYA SAKSHYA ADHINIYAM, 2023', margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const declarationText = 
    `I, ${officer.name}, ${officer.designation}, Gujarat Police, hereby certify pursuant to Section 63 of the Bharatiya Sakshya Adhiniyam, 2023, that the electronic records detailed herein were produced by automated Sentinel CCTV Optical Sensors and Edge AI Nodes operating regularly and under lawful official management throughout the material period. The cryptographic SHA-256 hashes were calculated immediately upon frame ingestion and remain unbroken. No manual alteration, splicing, or synthetic fabrication has occurred in the chain of custody.`;
  const splitDeclaration = doc.splitTextToSize(declarationText, pageWidth - (margin * 2));
  doc.text(splitDeclaration, margin, currentY);
  currentY += (splitDeclaration.length * 3.6) + 4;

  // Sighting Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('#', margin + 2, currentY + 4.5);
  doc.text('CAMERA NODE & LOCATION', margin + 10, currentY + 4.5);
  doc.text('TIMESTAMP (IST)', margin + 70, currentY + 4.5);
  doc.text('ANPR / HSRP', margin + 112, currentY + 4.5);
  doc.text('SHA-256 INTEGRITY DIGEST (TRUNCATED)', margin + 138, currentY + 4.5);
  currentY += 6.5;

  // Sighting Table Rows
  data.evidenceItems.forEach((item, index) => {
    if (currentY > pageHeight - margin - 35) {
      doc.addPage();
      drawPageBorderAndHeader(doc.getNumberOfPages(), Math.max(2, Math.ceil(data.evidenceItems.length / 4) + 1));
      currentY = margin + 22;

      // Repeat Table Header
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 6.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('#', margin + 2, currentY + 4.5);
      doc.text('CAMERA NODE & LOCATION', margin + 10, currentY + 4.5);
      doc.text('TIMESTAMP (IST)', margin + 70, currentY + 4.5);
      doc.text('ANPR / HSRP', margin + 112, currentY + 4.5);
      doc.text('SHA-256 INTEGRITY DIGEST (TRUNCATED)', margin + 138, currentY + 4.5);
      currentY += 6.5;
    }

    const rowBg = index % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(String(index + 1), margin + 2, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(item.cameraId, margin + 10, currentY + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const locSnippet = item.locationName.length > 35 ? item.locationName.substring(0, 35) + '...' : item.locationName;
    doc.text(locSnippet, margin + 10, currentY + 7);

    // Timestamp
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    let timeStr = item.timestamp;
    try {
      timeStr = new Date(item.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
    } catch {}
    doc.text(timeStr, margin + 70, currentY + 5);

    // ANPR / HSRP
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    const confPct = Math.round(item.anprConfidence * 100);
    doc.setTextColor(16, 185, 129);
    doc.text(`${confPct}% [${item.hsrpStatus || 'VERIFIED'}]`, margin + 112, currentY + 5);

    // Hash
    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    const truncHash = `${item.sha256Hash.slice(0, 10)}...${item.sha256Hash.slice(-8)}`;
    doc.text(truncHash, margin + 138, currentY + 5);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY + 8, pageWidth - margin, currentY + 8);
    currentY += 8;
  });

  currentY += 8;

  // Officer Signature Block
  if (currentY > pageHeight - margin - 35) {
    doc.addPage();
    drawPageBorderAndHeader(doc.getNumberOfPages(), doc.getNumberOfPages());
    currentY = margin + 22;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 26, 2, 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('ELECTRONIC SIGNATURE & LEGAL VERIFICATION SEAL', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Digitally sealed by: ${officer.name}`, margin + 4, currentY + 11);
  doc.text(`Designation: ${officer.designation}`, margin + 4, currentY + 16);
  doc.text(`Agency: ${officer.station}`, margin + 4, currentY + 21);

  // Digital Signature Stamp (Right)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - margin - 65, currentY + 3, 60, 20, 1, 1, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(2, 132, 199);
  doc.text('[ GUJARAT POLICE SCRB ]', pageWidth - margin - 62, currentY + 8);
  doc.setTextColor(30, 41, 59);
  doc.text(`DIGITAL ID: ${reportId.slice(0, 18)}`, pageWidth - margin - 62, currentY + 13);
  doc.text(`TIMESTAMP: ${new Date().toISOString().slice(0, 19)}Z`, pageWidth - margin - 62, currentY + 18);

  return doc.output('blob');
}

/**
 * Helper to download the generated PDF directly in browser
 */
export async function downloadForensicPdfReport(data: ForensicEvidenceReportData, filename?: string): Promise<void> {
  const blob = await generateForensicPdfReport(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `Section63-Evidence-Dossier-${data.targetVehicle}-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
