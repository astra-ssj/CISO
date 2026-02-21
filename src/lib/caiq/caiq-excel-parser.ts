/**
 * CAIQ Excel Parser — Handles real-world CAIQ Excel files from customers
 * regardless of column layout. Detects sheets, maps columns by header keywords,
 * extracts questions with normalized control IDs, and writes answers back in-place.
 */

import ExcelJS from 'exceljs';
import type {
  CAIQAnswer,
  CAIQAnswerType,
  CAIQDomain,
  ColumnMap,
  ExistingAnswer,
  ParsedCAIQQuestion,
  ParsedCAIQSheet,
  ParsedCAIQWorkbook,
  CAIQExcelFormat,
} from './types';
import { CAIQ_DOMAINS } from './types';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Control ID pattern: 3-letter domain, optional dash, digits, optional .digit (e.g. AIS-01, AIS-01.1, AIS01.1, CEK-03) */
const CAIQ_CONTROL_ID_REGEX = new RegExp(
  `^(${CAIQ_DOMAINS.join('|')})[-]?\\s*(\\d+)(?:\\.(\\d+))?$`,
  'i'
);

const MAX_HEADER_SCAN_ROWS = 5;
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

// -----------------------------------------------------------------------------
// Column detection keywords (lowercase)
// -----------------------------------------------------------------------------

const CONTROL_ID_KEYWORDS = ['control', 'id', 'question id', 'caiq id', 'reference', 'ref', '#'];
const QUESTION_TEXT_KEYWORDS = ['question', 'requirement', 'description', 'control specification', 'control description'];
const YES_KEYWORDS = ['yes', 'y'];
const NO_KEYWORDS = ['no', 'n'];
const NA_KEYWORDS = ['n/a', 'na', 'not applicable'];
const CONDITIONAL_KEYWORDS = ['conditional', 'partial'];
const ANSWER_DETAIL_KEYWORDS = ['answer', 'response', 'detail', 'description', 'implementation', 'csp', 'explanation', 'response detail', 'implementation description'];
const EVIDENCE_KEYWORDS = ['evidence', 'reference', 'artifact', 'documentation', 'attachment'];
const SINGLE_RESPONSE_KEYWORDS = ['yes/no', 'y/n', 'response', 'compliance', 'applicable', 'status', 'conform'];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function normalizeControlId(raw: string): string {
  const s = String(raw).trim();
  const m = s.match(CAIQ_CONTROL_ID_REGEX);
  if (m) {
    const domain = (m[1] ?? '').toUpperCase();
    const num = (m[2] ?? '').replace(/^0+/, '') || '0';
    const sub = m[3] ?? '';
    return sub ? `${domain}-${num}.${sub}` : `${domain}-${num}`;
  }
  return s;
}

function parseDomainFromControlId(id: string): CAIQDomain | undefined {
  const m = String(id).trim().match(/^([A-Za-z]{3})/);
  if (!m) return undefined;
  const code = (m[1] ?? '').toUpperCase();
  return CAIQ_DOMAINS.includes(code as CAIQDomain) ? (code as CAIQDomain) : undefined;
}

function getCellText(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'object' && 'text' in value) return String((value as { text: string }).text ?? '');
  return String(value).trim();
}

/** Get row as 0-based array of cell values (ExcelJS row.values is 1-based, index 0 unused). */
function rowToValues(row: ExcelJS.Row): string[] {
  const out: string[] = [];
  const len = row.cellCount;
  for (let c = 1; c <= len; c++) {
    const cell = row.getCell(c);
    out.push(getCellText(cell.value));
  }
  return out;
}

/** Parse A1-style cell reference to 1-based row and column. */
function parseCellRef(a1: string): { row: number; col: number } {
  const match = String(a1).match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: 0, col: 0 };
  const colLetters = (match[1] ?? '').toUpperCase();
  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 64);
  }
  return { row: parseInt(match[2] ?? '0', 10), col };
}

/** Expand merged header cells so the top-left value is repeated across the merge (for keyword matching). */
function expandHeaderRowWithMerges(
  worksheet: ExcelJS.Worksheet,
  rows: string[][],
  headerRowIndex: number
): string[] {
  const rowValues = [...(rows[headerRowIndex] ?? [])];
  const model = (worksheet as { model?: { merges?: string[] } }).model;
  const merges = model?.merges;
  if (!merges?.length) return rowValues;
  const headerRow1 = headerRowIndex + 1;
  for (const range of merges) {
    const parts = range.split(':');
    const tl = parseCellRef(parts[0] ?? '');
    const br = parseCellRef(parts[1] ?? parts[0] ?? '');
    if (tl.row <= headerRow1 && headerRow1 <= br.row) {
      const masterVal = rowValues[tl.col - 1] ?? '';
      for (let col = tl.col; col <= br.col; col++) {
        rowValues[col - 1] = masterVal;
      }
    }
  }
  return rowValues;
}

/** Detect which row has headers by checking for keyword matches. */
function findHeaderRow(rows: string[][], maxScan: number): number {
  for (let r = 0; r < maxScan && r < rows.length; r++) {
    const row = rows[r] ?? [];
    const lower = row.map((c) => c.toLowerCase().trim());
    const hasControl = lower.some((c) => CONTROL_ID_KEYWORDS.some((kw) => c.includes(kw)));
    const hasQuestion = lower.some((c) => QUESTION_TEXT_KEYWORDS.some((kw) => c.includes(kw)));
    if (hasControl && hasQuestion) return r;
  }
  return 0;
}

function buildColumnMap(rows: string[][], headerRow: number): ColumnMap | null {
  const header = rows[headerRow] ?? [];
  const lower = header.map((c) => c.toLowerCase().trim());

  let controlId = -1;
  let questionText = -1;
  let yesColumn: number | undefined;
  let noColumn: number | undefined;
  let naColumn: number | undefined;
  let conditionalColumn: number | undefined;
  let answerDetail: number | undefined;
  let evidenceColumn: number | undefined;
  let singleResponse: number | undefined;

  for (let i = 0; i < lower.length; i++) {
    const h = lower[i] ?? '';
    if (!h) continue;

    if (controlId === -1 && CONTROL_ID_KEYWORDS.some((kw) => h.includes(kw))) controlId = i;
    if (questionText === -1 && QUESTION_TEXT_KEYWORDS.some((kw) => h.includes(kw))) questionText = i;

    if (YES_KEYWORDS.some((kw) => h === kw || h.includes('yes'))) yesColumn = i;
    if (NO_KEYWORDS.some((kw) => h === kw || h.includes('no'))) noColumn = i;
    if (NA_KEYWORDS.some((kw) => h.includes(kw))) naColumn = i;
    if (CONDITIONAL_KEYWORDS.some((kw) => h.includes(kw))) conditionalColumn = i;
    if (ANSWER_DETAIL_KEYWORDS.some((kw) => h.includes(kw))) answerDetail = i;
    if (EVIDENCE_KEYWORDS.some((kw) => h.includes(kw))) evidenceColumn = i;
    if (SINGLE_RESPONSE_KEYWORDS.some((kw) => h.includes(kw))) singleResponse = i;
  }

  const hasSeparate = yesColumn !== undefined || noColumn !== undefined || naColumn !== undefined;
  if (singleResponse !== undefined && !hasSeparate) {
    // Prefer single dropdown when no separate Y/N/NA columns
  }

  if (controlId < 0 || questionText < 0) return null;

  const dataStartRow = headerRow + 1;
  return {
    controlId,
    questionText,
    yesColumn,
    noColumn,
    naColumn,
    conditionalColumn,
    answerDetail,
    evidenceColumn,
    singleResponse: singleResponse !== undefined ? singleResponse : undefined,
    headerRow,
    dataStartRow,
  };
}

function inferAnswerTypeFromCell(value: string): CAIQAnswerType | undefined {
  const v = value.toLowerCase().trim();
  if (v === 'x' || v === 'yes' || v === 'y') return 'YES';
  if (v === 'no' || v === 'n') return 'NO';
  if (v === 'n/a' || v === 'na' || v === 'not applicable') return 'NOT_APPLICABLE';
  if (v.includes('conditional') || v.includes('partial')) return 'CONDITIONAL';
  return undefined;
}

function detectFormat(map: ColumnMap): CAIQExcelFormat {
  const hasSeparate = map.yesColumn !== undefined || map.noColumn !== undefined || map.naColumn !== undefined;
  const hasSingle = map.singleResponse !== undefined;
  if (hasSeparate && hasSingle) return 'MIXED';
  if (hasSingle && !hasSeparate) return 'SINGLE_DROPDOWN';
  return 'SEPARATE_COLUMNS';
}

// -----------------------------------------------------------------------------
// CAIQExcelParser
// -----------------------------------------------------------------------------

export class CAIQExcelParser {
  /**
   * Parse an incoming CAIQ Excel buffer into a structured workbook with
   * sheet detection, column mapping, and question extraction.
   */
  async parseIncoming(
    buffer: Buffer,
    fileName: string = 'workbook.xlsx'
  ): Promise<ParsedCAIQWorkbook> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as Parameters<ExcelJS.Workbook['xlsx']['load']>[0]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/password|protected|encrypt/i.test(msg)) {
        throw new Error('This workbook appears to be password-protected. Please remove protection and try again.');
      }
      throw new Error(`Failed to load Excel file: ${msg}`);
    }

    const allQuestions: ParsedCAIQQuestion[] = [];
    const existingAnswers = new Map<string, ExistingAnswer>();
    const sheets: ParsedCAIQSheet[] = [];
    let columnMap: ColumnMap | null = null;
    let format: CAIQExcelFormat = 'SEPARATE_COLUMNS';

    for (let sheetIndex = 0; sheetIndex < workbook.worksheets.length; sheetIndex++) {
      const sheet = workbook.worksheets[sheetIndex];
      if (!sheet) continue;

      const rows: string[][] = [];
      sheet.eachRow({ includeEmpty: true }, (row) => {
        rows.push(rowToValues(row));
      });

      if (rows.length < 2) continue;

      const headerRow = findHeaderRow(rows, MAX_HEADER_SCAN_ROWS);
      rows[headerRow] = expandHeaderRowWithMerges(sheet, rows, headerRow);
      const map = buildColumnMap(rows, headerRow);
      if (!map) continue;

      const controlIdCol = map.controlId;
      const questionCol = map.questionText;
      const dataStart = map.dataStartRow;
      let caiqRowCount = 0;

      for (let r = dataStart; r < rows.length; r++) {
        const rowValues = rows[r] ?? [];
        const controlIdRaw = rowValues[controlIdCol] ?? '';
        const controlId = normalizeControlId(controlIdRaw);
        if (!controlId || !CAIQ_CONTROL_ID_REGEX.test(controlIdRaw.trim())) continue;

        caiqRowCount++;
        const domain = parseDomainFromControlId(controlId) ?? ('AIS' as CAIQDomain);
        const domainName = DOMAIN_DISPLAY_NAMES[domain] ?? domain;
        const text = (rowValues[questionCol] ?? '').trim() || '';

        const q: ParsedCAIQQuestion = {
          id: controlId,
          domain,
          domainName,
          text,
          rowNumber: r + 1,
          sheetName: sheet.name,
        };
        allQuestions.push(q);

        const existing = readExistingAnswer(rowValues, map, r + 1);
        if (existing) {
          existingAnswers.set(controlId, existing);
        }
      }

      if (caiqRowCount > 0) {
        if (!columnMap) {
          columnMap = map;
          format = detectFormat(map);
        }
        sheets.push({
          name: sheet.name,
          index: sheetIndex,
          questions: allQuestions.filter((qu) => qu.sheetName === sheet.name),
        });
      }
    }

    if (!columnMap) {
      throw new Error(
        'CAIQ column detection failed. Could not find a sheet with CAIQ questions (control IDs like AIS-01, CEK-03, IAM-12). ' +
          'Ensure the file contains at least one sheet with headers for "control id" (or "question id", "reference") and "question" (or "requirement", "description").'
      );
    }

    const unanswered = allQuestions.filter((q) => !existingAnswers.has(q.id));

    return {
      fileName,
      sheets,
      columnMap,
      questions: allQuestions,
      existingAnswers,
      unanswered,
      format,
    };
  }

  /**
   * Write answers back into the original Excel buffer, preserving all
   * customer formatting and adding an Astra-CISO metadata sheet.
   */
  async writeAnswers(
    originalBuffer: Buffer,
    answers: CAIQAnswer[],
    columnMap: ColumnMap
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(originalBuffer as unknown as Parameters<ExcelJS.Workbook['xlsx']['load']>[0]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/password|protected|encrypt/i.test(msg)) {
        throw new Error('Cannot write to a password-protected workbook. Please remove protection first.');
      }
      throw new Error(`Failed to load Excel file: ${msg}`);
    }

    const answerByQuestionId = new Map<string, CAIQAnswer>();
    for (const a of answers) answerByQuestionId.set(a.questionId, a);

    const yesNoStyle = detectYesNoStyle(workbook, columnMap);

    for (const sheet of workbook.worksheets) {
      const dataStartRow = columnMap.dataStartRow;
      const lastRow = sheet.rowCount ?? dataStartRow + 500;
      for (let r = dataStartRow; r <= lastRow; r++) {
        const row = sheet.getRow(r);
        const controlIdCell = row.getCell(columnMap.controlId + 1);
        const controlIdRaw = getCellText(controlIdCell.value);
        const controlId = normalizeControlId(controlIdRaw);
        if (!controlId || !CAIQ_CONTROL_ID_REGEX.test(controlIdRaw.trim())) continue;

        const answer = answerByQuestionId.get(controlId);
        if (!answer) continue;

        if (columnMap.singleResponse !== undefined) {
          const cell = row.getCell(columnMap.singleResponse + 1);
          const value = answerTypeToDisplay(answer.answerType, true);
          cell.value = value;
          applyConfidenceTint(cell, answer.confidence);
        } else {
          if (columnMap.yesColumn !== undefined) {
            const cell = row.getCell(columnMap.yesColumn + 1);
            if (answer.answerType === 'YES') {
              cell.value = yesNoStyle.mark;
              applyConfidenceTint(cell, answer.confidence);
            }
          }
          if (columnMap.noColumn !== undefined) {
            const cell = row.getCell(columnMap.noColumn + 1);
            if (answer.answerType === 'NO') {
              cell.value = yesNoStyle.mark;
              applyConfidenceTint(cell, answer.confidence);
            }
          }
          if (columnMap.naColumn !== undefined) {
            const cell = row.getCell(columnMap.naColumn + 1);
            if (answer.answerType === 'NOT_APPLICABLE') {
              cell.value = yesNoStyle.mark;
              applyConfidenceTint(cell, answer.confidence);
            }
          }
          if (columnMap.conditionalColumn !== undefined && answer.answerType === 'CONDITIONAL') {
            const cell = row.getCell(columnMap.conditionalColumn + 1);
            cell.value = yesNoStyle.mark;
            applyConfidenceTint(cell, answer.confidence);
          }
        }

        if (columnMap.answerDetail !== undefined) {
          const cell = row.getCell(columnMap.answerDetail + 1);
          cell.value = answer.answer;
          cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'top' };
          row.height = Math.max(row.height ?? 15, Math.min(200, 15 + (answer.answer.length / 80) * 15));
          applyConfidenceTint(cell, answer.confidence);
        }

        if (columnMap.evidenceColumn !== undefined && answer.evidenceRefs?.length) {
          const cell = row.getCell(columnMap.evidenceColumn + 1);
          cell.value = answer.evidenceRefs.join('; ');
          cell.alignment = { ...cell.alignment, wrapText: true };
        }
      }
    }

    addAstraCISOMetadataSheet(workbook, answers);

    const outBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(outBuffer);
  }
}

// -----------------------------------------------------------------------------
// Read existing answer from a row (for delta assessments)
// -----------------------------------------------------------------------------

function readExistingAnswer(
  rowValues: string[],
  map: ColumnMap,
  rowNumber: number
): ExistingAnswer | null {
  let answerType: CAIQAnswerType | undefined;
  let detail: string | undefined;
  let evidence: string | undefined;

  if (map.singleResponse !== undefined) {
    const v = (rowValues[map.singleResponse] ?? '').trim();
    answerType = inferAnswerTypeFromCell(v);
  } else {
    if (map.yesColumn !== undefined) {
      const v = (rowValues[map.yesColumn] ?? '').trim().toLowerCase();
      if (v === 'x' || v === 'yes' || v === 'y') answerType = 'YES';
    }
    if (answerType === undefined && map.noColumn !== undefined) {
      const v = (rowValues[map.noColumn] ?? '').trim().toLowerCase();
      if (v === 'x' || v === 'no' || v === 'n') answerType = 'NO';
    }
    if (answerType === undefined && map.naColumn !== undefined) {
      const v = (rowValues[map.naColumn] ?? '').trim().toLowerCase();
      if (v === 'x' || v === 'n/a' || v === 'na') answerType = 'NOT_APPLICABLE';
    }
    if (answerType === undefined && map.conditionalColumn !== undefined) {
      const v = (rowValues[map.conditionalColumn] ?? '').trim().toLowerCase();
      if (v === 'x' || v.includes('conditional')) answerType = 'CONDITIONAL';
    }
  }

  if (map.answerDetail !== undefined) detail = (rowValues[map.answerDetail] ?? '').trim();
  if (map.evidenceColumn !== undefined) evidence = (rowValues[map.evidenceColumn] ?? '').trim();

  const controlId = normalizeControlId(rowValues[map.controlId] ?? '');
  if (!controlId || !answerType) return null;

  return {
    questionId: controlId,
    answerType,
    detail,
    evidence,
    rowNumber,
  };
}

// -----------------------------------------------------------------------------
// Write-back: detect customer's Yes/No style
// -----------------------------------------------------------------------------

/** Detect whether customer uses "X" or "Yes" etc. in Yes/No columns so we match their style. */
function detectYesNoStyle(workbook: ExcelJS.Workbook, columnMap: ColumnMap): { mark: string } {
  let mark = 'X';
  const checked = new Set<string>();

  for (const sheet of workbook.worksheets) {
    const dataStart = columnMap.dataStartRow;
    const lastRow = Math.min((sheet.rowCount ?? dataStart + 100), dataStart + 50);
    for (let r = dataStart; r <= lastRow; r++) {
      const row = sheet.getRow(r);
      if (columnMap.yesColumn !== undefined) {
        const v = getCellText(row.getCell(columnMap.yesColumn + 1).value);
        if (v && !checked.has(`y:${v}`)) {
          checked.add(`y:${v}`);
          if (['x', 'X', 'yes', 'Yes', 'Y'].includes(v)) mark = v.length <= 2 ? v : 'Yes';
        }
      }
    }
  }
  return { mark };
}

/** For single-dropdown column use standard "Yes"/"No"/"N/A"/"Conditional". For separate columns use customer's mark (e.g. "X" or "Yes"). */
function answerTypeToDisplay(answerType: CAIQAnswerType, forSingleDropdown: boolean): string {
  if (forSingleDropdown) {
    switch (answerType) {
      case 'YES': return 'Yes';
      case 'NO': return 'No';
      case 'NOT_APPLICABLE': return 'N/A';
      case 'CONDITIONAL': return 'Conditional';
      default: return 'Yes';
    }
  }
  switch (answerType) {
    case 'YES': return 'Yes'; // fallback; separate columns use mark (X) in their own cell
    case 'NO': return 'No';
    case 'NOT_APPLICABLE': return 'N/A';
    case 'CONDITIONAL': return 'Conditional';
    default: return 'Yes';
  }
}

// -----------------------------------------------------------------------------
// Confidence tint (only on cells we fill)
// -----------------------------------------------------------------------------

function applyConfidenceTint(cell: ExcelJS.Cell, confidence: number): void {
  if (confidence >= 0.95) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
  } else if (confidence >= 0.6) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
  }
}

// -----------------------------------------------------------------------------
// Astra-CISO metadata sheet
// -----------------------------------------------------------------------------

function addAstraCISOMetadataSheet(
  workbook: ExcelJS.Workbook,
  answers: CAIQAnswer[]
): void {
  const name = 'Astra-CISO Metadata';
  let sheet = workbook.getWorksheet(name);
  if (!sheet) sheet = workbook.addWorksheet(name, { headerFooter: { differentFirst: false } });

  const date = new Date().toISOString().slice(0, 10);
  const high = answers.filter((a) => a.confidence >= 0.95).length;
  const medium = answers.filter((a) => a.confidence >= 0.6 && a.confidence < 0.95).length;
  const low = answers.filter((a) => a.confidence < 0.6).length;
  const tierCounts: Record<string, number> = {};
  for (const a of answers) {
    tierCounts[a.tier] = (tierCounts[a.tier] ?? 0) + 1;
  }

  sheet.getCell(1, 1).value = 'Astra-CISO CAIQ Assessment Metadata';
  sheet.getCell(1, 1).font = { bold: true, size: 14 };
  sheet.getCell(2, 1).value = `Assessment date: ${date}`;
  sheet.getCell(3, 1).value = `Total answers: ${answers.length}`;
  sheet.getCell(4, 1).value = `High confidence (≥0.95): ${high}`;
  sheet.getCell(5, 1).value = `Medium confidence (0.60–0.95): ${medium}`;
  sheet.getCell(6, 1).value = `Low confidence (<0.60): ${low}`;
  sheet.getCell(7, 1).value = `Tier breakdown: ${JSON.stringify(tierCounts)}`;
  sheet.getCell(9, 1).value = 'Per-answer audit trail';
  sheet.getCell(9, 1).font = { bold: true };
  sheet.getCell(10, 1).value = 'Question ID';
  sheet.getCell(10, 2).value = 'Confidence';
  sheet.getCell(10, 3).value = 'Tier';
  sheet.getCell(10, 4).value = 'Source';
  sheet.getCell(10, 5).value = 'Generated at';
  for (let i = 1; i <= 5; i++) sheet.getCell(10, i).font = { bold: true };

  answers.forEach((a, i) => {
    const row = 11 + i;
    sheet!.getCell(row, 1).value = a.questionId;
    sheet!.getCell(row, 2).value = a.confidence;
    sheet!.getCell(row, 3).value = a.tier;
    sheet!.getCell(row, 4).value = a.generatedBy;
    sheet!.getCell(row, 5).value = a.generatedAt;
  });
}
