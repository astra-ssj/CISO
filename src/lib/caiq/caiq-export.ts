/**
 * CAIQ Export — Excel (CAIQ v4 format) and PDF audit report generation.
 * Uses ExcelJS for Excel, jsPDF + jspdf-autotable for PDF.
 */

import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  CAIQAnswer,
  CAIQAnswerSet,
  CAIQAnswerType,
  CAIQDomain,
  FrameworkMapping,
  OrganizationContext,
} from './types';
import { CAIQ_DOMAINS } from './types';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  AIS: 'Application & Interface Security',
  AAC: 'Audit Assurance & Compliance',
  BCR: 'Business Continuity & Resilience',
  CCC: 'Change Control & Configuration Management',
  CEK: 'Cryptography, Encryption & Key Management',
  DSP: 'Data Security & Privacy Lifecycle Management',
  GRC: 'Governance, Risk & Compliance',
  HRS: 'Human Resources Security',
  IAM: 'Identity & Access Management',
  IPY: 'Interoperability & Portability',
  IVS: 'Infrastructure & Virtualization Security',
  LOG: 'Logging & Monitoring',
  SEF: 'Security Incident Management, E-Discovery & Cloud Forensics',
  STA: 'Supply Chain Management, Transparency & Accountability',
  TVM: 'Threat & Vulnerability Management',
  UEM: 'Universal Endpoint Management',
};

function answerTypeLabel(t: CAIQAnswerType): string {
  switch (t) {
    case 'YES': return 'Yes';
    case 'NO': return 'No';
    case 'NOT_APPLICABLE': return 'N/A';
    case 'CONDITIONAL': return 'Conditional';
    default: return String(t);
  }
}

function formatFrameworkMappings(refs: FrameworkMapping[]): string {
  return refs.map((r) => `${r.framework}: ${r.controlId}${r.description ? ` — ${r.description}` : ''}`).join('; ') || '—';
}

/** Confidence tier for row color: Green 0.95+, Yellow 0.60–0.95, Red <0.60 */
function confidenceTier(confidence: number): 'green' | 'yellow' | 'red' {
  if (confidence >= 0.95) return 'green';
  if (confidence >= 0.6) return 'yellow';
  return 'red';
}

const EXCEL_FILL = {
  green: 'FFE8F5E9' as const,   // light green
  yellow: 'FFFFF9C4' as const,  // light yellow
  red: 'FFFFEBEE' as const,     // light red
};

/**
 * Optional map of questionId to question text for Excel "Question" column.
 * If omitted, a truncated answer is used as placeholder.
 */
export type QuestionTextMap = Record<string, string>;

// -----------------------------------------------------------------------------
// Excel Export (CAIQ v4 format)
// -----------------------------------------------------------------------------

/**
 * Exports a completed CAIQ assessment to CSA CAIQ v4 Excel format.
 * Main sheet: Control ID, Question, Answer, Answer Details, Evidence References, Framework Mappings (color by confidence).
 * Metadata sheet: assessment date, org name, assessor, stats, AI provider, confidence distribution.
 * Audit Trail sheet: per-answer tier, generatedBy, confidence, reviewer, timestamps.
 * @param answerSet - Full answer set with stats
 * @param orgContext - Organization context for metadata
 * @param options - Optional question text map, assessor name, AI provider label
 * @returns Excel file as Buffer
 */
export async function exportToCAIQExcel(
  answerSet: CAIQAnswerSet,
  orgContext: OrganizationContext,
  options?: { questionTextMap?: QuestionTextMap; assessor?: string; aiProvider?: string }
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const { answers, stats } = answerSet;
  const questionTextMap = options?.questionTextMap ?? {};
  const assessor = options?.assessor ?? '—';
  const aiProvider = options?.aiProvider ?? (typeof process !== 'undefined' && process.env?.AI_PROVIDER) ?? '—';
  const assessmentDate = new Date().toISOString().slice(0, 10);

  // —— Main sheet: CAIQ v4 answers ——
  const mainSheet = wb.addWorksheet('CAIQ v4 Assessment', { views: [{ state: 'frozen', ySplit: 1 }] });
  const mainHeaders = ['Control ID', 'Question', 'Answer', 'Answer Details', 'Evidence References', 'Framework Mappings'];
  mainSheet.addRow(mainHeaders);
  mainSheet.getRow(1).font = { bold: true };
  mainSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF374151' },
  };
  mainSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  for (const a of answers) {
    const questionText = questionTextMap[a.questionId] ?? (a.answer ? a.answer.slice(0, 200) + (a.answer.length > 200 ? '…' : '') : '—');
    const row = mainSheet.addRow([
      a.questionId,
      questionText,
      answerTypeLabel(a.answerType),
      a.answer || '—',
      (a.evidenceRefs && a.evidenceRefs.length) ? a.evidenceRefs.join('; ') : '—',
      formatFrameworkMappings(a.frameworkRefs),
    ]);
    const tier = confidenceTier(a.confidence);
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_FILL[tier] },
    };
  }

  mainSheet.columns = [
    { width: 14 },
    { width: 50 },
    { width: 14 },
    { width: 45 },
    { width: 35 },
    { width: 40 },
  ];

  // —— Metadata sheet ——
  const metaSheet = wb.addWorksheet('Metadata');
  const highPct = stats.total ? Math.round((stats.highConfidence / stats.total) * 100) : 0;
  const medPct = stats.total ? Math.round((stats.mediumConfidence / stats.total) * 100) : 0;
  const lowPct = stats.total ? Math.round((stats.lowConfidence / stats.total) * 100) : 0;
  const flaggedPct = stats.total ? Math.round((stats.flagged / stats.total) * 100) : 0;
  metaSheet.addRows([
    ['CAIQ v4 Assessment — Metadata', ''],
    ['Assessment Date', assessmentDate],
    ['Organization', orgContext.name],
    ['Assessor', assessor],
    ['AI Provider', aiProvider],
    ['', ''],
    ['Overall statistics', ''],
    ['Total questions', stats.total],
    ['High confidence (≥0.95)', `${stats.highConfidence} (${highPct}%)`],
    ['Medium confidence (0.60–0.95)', `${stats.mediumConfidence} (${medPct}%)`],
    ['Low confidence (<0.60)', `${stats.lowConfidence} (${lowPct}%)`],
    ['Flagged for review', `${stats.flagged} (${flaggedPct}%)`],
    ['Estimated accuracy', `${Math.round(stats.estimatedAccuracy * 100)}%`],
    ['', ''],
    ['Confidence distribution', 'Green: ≥0.95 | Yellow: 0.60–0.95 | Red: <0.60'],
  ]);
  metaSheet.getRow(1).font = { bold: true };
  metaSheet.getRow(7).font = { bold: true };
  metaSheet.getColumn(1).width = 28;
  metaSheet.getColumn(2).width = 24;

  // —— Audit Trail sheet ——
  const auditSheet = wb.addWorksheet('Audit Trail');
  const auditHeaders = ['Control ID', 'Tier', 'Generated by (model)', 'Confidence', 'Reviewer', 'Timestamp', 'Reviewed at'];
  auditSheet.addRow(auditHeaders);
  auditSheet.getRow(1).font = { bold: true };
  auditSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF374151' },
  };
  auditSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  for (const a of answers) {
    auditSheet.addRow([
      a.questionId,
      a.tier,
      a.generatedBy,
      a.confidence >= 0 ? (Math.round(a.confidence * 100) + '%') : '—',
      a.reviewedBy ?? '—',
      a.generatedAt ?? '—',
      a.reviewedAt ?? '—',
    ]);
  }
  auditSheet.getColumn(1).width = 14;
  auditSheet.getColumn(2).width = 18;
  auditSheet.getColumn(3).width = 22;
  auditSheet.getColumn(4).width = 12;
  auditSheet.getColumn(5).width = 18;
  auditSheet.getColumn(6).width = 24;
  auditSheet.getColumn(7).width = 24;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

// -----------------------------------------------------------------------------
// PDF Audit Report
// -----------------------------------------------------------------------------

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

function getDomainFromQuestionId(questionId: string): CAIQDomain | null {
  const prefix = questionId.replace(/[-.\s].*$/, '').toUpperCase();
  return CAIQ_DOMAINS.includes(prefix as CAIQDomain) ? (prefix as CAIQDomain) : null;
}

function groupAnswersByDomain(answers: CAIQAnswer[]): Map<CAIQDomain, CAIQAnswer[]> {
  const map = new Map<CAIQDomain, CAIQAnswer[]>();
  for (const a of answers) {
    const domain = getDomainFromQuestionId(a.questionId) ?? ('GRC' as CAIQDomain);
    if (!map.has(domain)) map.set(domain, []);
    map.get(domain)!.push(a);
  }
  for (const d of CAIQ_DOMAINS) {
    if (!map.has(d)) map.set(d, []);
  }
  return map;
}

/**
 * Exports a completed CAIQ assessment to a PDF audit report.
 * Cover: title, org name, date, assessor. Executive summary: totals, answer distribution, confidence.
 * Per-domain sections with answers; Appendix A (audit trail), Appendix B (methodology).
 * Footer on all pages: Generated by Astra-CISO | Assessment ID.
 * @param answerSet - Full answer set with stats
 * @param orgContext - Organization context for cover
 * @param options - Optional assessor and question text map
 * @returns PDF file as Buffer
 */
export async function exportToAuditPDF(
  answerSet: CAIQAnswerSet,
  orgContext: OrganizationContext,
  options?: { assessor?: string; questionTextMap?: QuestionTextMap }
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const { answers, stats } = answerSet;
  const assessor = options?.assessor ?? '—';
  const questionTextMap = options?.questionTextMap ?? {};
  const assessmentDate = new Date().toISOString().slice(0, 10);
  const auditId = answers.length ? answers[0].auditId : '—';
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 40;

  // —— Cover ——
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CAIQ v4 Assessment Report', margin, y);
  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Organization: ${orgContext.name}`, margin, y);
  y += 18;
  doc.text(`Date: ${assessmentDate}`, margin, y);
  y += 18;
  doc.text(`Assessor: ${assessor}`, margin, y);
  y += 36;

  // —— Executive summary ——
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, y);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const total = stats.total;
  const yesCount = answers.filter((a) => a.answerType === 'YES').length;
  const noCount = answers.filter((a) => a.answerType === 'NO').length;
  const naCount = answers.filter((a) => a.answerType === 'NOT_APPLICABLE').length;
  const condCount = answers.filter((a) => a.answerType === 'CONDITIONAL').length;
  const lines = [
    `Total questions: ${total}`,
    `Answer distribution: Yes ${yesCount}, No ${noCount}, N/A ${naCount}, Conditional ${condCount}.`,
    `High confidence (≥0.95): ${stats.highConfidence}; Medium (0.60–0.95): ${stats.mediumConfidence}; Low (<0.60): ${stats.lowConfidence}; Flagged: ${stats.flagged}.`,
    `Estimated accuracy: ${Math.round(stats.estimatedAccuracy * 100)}%.`,
  ];
  for (const line of lines) {
    const split = doc.splitTextToSize(line, contentWidth);
    for (const s of split) {
      doc.text(s, margin, y);
      y += 14;
    }
  }
  y += 14;

  // —— Per-domain sections ——
  const byDomain = groupAnswersByDomain(answers);
  const orderedDomains = CAIQ_DOMAINS.filter((d) => (byDomain.get(d)?.length ?? 0) > 0);
  for (const domain of orderedDomains) {
    const domainAnswers = byDomain.get(domain) ?? [];
    if (domainAnswers.length === 0) continue;

    if (y > 680) {
      doc.addPage();
      y = 40;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const domainTitle = `${domain} — ${DOMAIN_DISPLAY_NAMES[domain] ?? domain}`;
    doc.text(domainTitle, margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const body = domainAnswers.map((a) => {
      const qText = questionTextMap[a.questionId] ?? a.questionId;
      const qShort = qText.length > 48 ? qText.slice(0, 48) + '…' : qText;
      const detail = a.answer == null ? '—' : a.answer.slice(0, 40) + (a.answer.length > 40 ? '…' : '');
      return [a.questionId, qShort, answerTypeLabel(a.answerType), `${Math.round(a.confidence * 100)}%`, detail];
    });
    autoTable(doc, {
      startY: y,
      head: [['Control ID', 'Question', 'Answer', 'Conf.', 'Details']],
      body,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [55, 65, 81] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = doc.lastAutoTable.finalY + 18;
  }

  // —— Appendix: Audit trail ——
  if (y > 620) {
    doc.addPage();
    y = 40;
  }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Appendix A — Audit Trail', margin, y);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const auditBody = answers.map((a) => [
    a.questionId,
    a.tier,
    a.generatedBy,
    `${Math.round(a.confidence * 100)}%`,
    a.reviewedBy ?? '—',
    a.generatedAt?.slice(0, 19) ?? '—',
  ]);
  autoTable(doc, {
    startY: y,
    head: [['Control ID', 'Tier', 'Source', 'Conf.', 'Reviewer', 'Generated']],
    body: auditBody,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [55, 65, 81] },
  });
  y = doc.lastAutoTable.finalY + 20;

  // —— Appendix: Methodology ——
  if (y > 650) {
    doc.addPage();
    y = 40;
  }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Appendix B — Methodology', margin, y);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const methodText = 'This assessment was generated by Astra-CISO using a 4-tier confidence pipeline: (1) Exact knowledge-base match, (2) Semantic KB match, (3) AI-generated answers, (4) Flagged for human review. Row colors in the Excel export indicate confidence: green ≥0.95, yellow 0.60–0.95, red <0.60.';
  const methodLines = doc.splitTextToSize(methodText, contentWidth);
  for (const line of methodLines) {
    doc.text(line, margin, y);
    y += 14;
  }

  // —— Footer on all pages ——
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated by Astra-CISO | Assessment ID: ${auditId} | Page ${p} of ${totalPages}`,
      margin,
      doc.internal.pageSize.getHeight() - 20
    );
    doc.setTextColor(0, 0, 0);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
