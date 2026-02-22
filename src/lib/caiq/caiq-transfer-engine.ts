/**
 * CAIQ Source-to-Target Knowledge Transfer Engine
 *
 * 4-tier matching pipeline (Golden Source = organization's source file answers):
 *   Tier 1: Same question ID in source → copy answer directly. Confidence 0.95+.
 *   Tier 2: Question ID doesn't match but question TEXT semantically similar →
 *           caiq-semantic-matcher on Golden Source; adapt wording if needed. Confidence 0.80-0.95.
 *   Tier 3: Low semantic match but related topic → AI generate from source answers + org context.
 *           KB only as fallback. Confidence 0.60-0.80.
 *   Tier 4: No match found → flag for manual. Confidence <0.60.
 *
 * Source file answers are the PRIMARY source; generic KB is only fallback for Tier 3 AI context.
 * Export writes answers back into the TARGET file's original format via caiq-excel-parser.
 */

import type { ColumnMap, ExistingAnswer, ParsedCAIQQuestion } from './types';
import type { CAIQAnswer, CAIQAnswerType, CAIQDomain, ConfidenceTier, CAIQGeneratedBy } from './types';
import { CAIQ_DOMAINS } from './types';
import { CAIQExcelParser } from './caiq-excel-parser';
import { CAIQSemanticMatcher } from './caiq-semantic-matcher';
import type { CAIQKnowledgeEntry } from './types';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface SourceQA {
  rowIndex: number;
  questionId: string;
  questionText: string;
  answer: string;
  yesNo: string;
}

export interface TargetQuestion {
  rowIndex: number;
  questionId: string;
  questionText: string;
  /** 1-based row number for write-back (from parser) */
  rowNumber?: number;
  sheetName?: string;
}

export type MatchTier = 'tier1' | 'tier2' | 'tier3' | 'unmatched';
export type ReviewStatus = 'approved' | 'pending' | 'flagged' | 'edited';

export interface TransferredAnswer {
  targetRowIndex: number;
  targetQuestionId: string;
  targetQuestionText: string;
  answer: string;
  yesNo: string;
  tier: MatchTier;
  confidence: number;          // 0-100
  matchedSourceId: string;
  matchedSourceQuestion: string;
  isAdapted: boolean;
  isAmbiguous: boolean;
  reviewStatus: ReviewStatus;
  evidenceRef: string;
}

export interface TransferResult {
  sourceCount: number;
  targetCount: number;
  tier1Matches: number;
  tier2Matches: number;
  tier3Matches: number;
  unmatched: number;
  coveragePct: number;
  answers: TransferredAnswer[];
}

/** Result of parsing target file (for export we need columnMap + buffer). */
export interface TargetParseResult {
  questions: TargetQuestion[];
  columnMap: ColumnMap;
}

// ────────────────────────────────────────────
// Source: Parse with caiq-excel-parser → Golden Source
// ────────────────────────────────────────────

/**
 * Parse source file with caiq-excel-parser and index ALL existing answers as Golden Source.
 */
export async function parseSourceWithParser(buffer: ArrayBuffer): Promise<SourceQA[]> {
  const parser = new CAIQExcelParser();
  const workbook = await parser.parseIncoming(
    Buffer.from(buffer),
    'source.xlsx'
  );

  const golden: SourceQA[] = [];
  const questionById = new Map<string, ParsedCAIQQuestion>();
  for (const q of workbook.questions) {
    questionById.set(q.id, q);
  }

  workbook.existingAnswers.forEach((existing: ExistingAnswer, questionId: string) => {
    const q = questionById.get(questionId);
    const questionText = q?.text ?? '';
    const answer = existing.detail ?? (existing.answerType === 'YES' ? 'Yes' : existing.answerType === 'NO' ? 'No' : 'N/A');
    const yesNo = existing.answerType === 'YES' ? 'Yes' : existing.answerType === 'NO' ? 'No' : existing.answerType === 'NOT_APPLICABLE' ? 'N/A' : 'Yes';
    golden.push({
      rowIndex: existing.rowNumber - 1,
      questionId,
      questionText,
      answer,
      yesNo,
    });
  });

  return golden;
}

// ────────────────────────────────────────────
// Target: Parse with caiq-excel-parser → questions + columnMap
// ────────────────────────────────────────────

/**
 * Parse target file with caiq-excel-parser; returns questions and columnMap for write-back.
 */
export async function parseTargetWithParser(buffer: ArrayBuffer): Promise<TargetParseResult> {
  const parser = new CAIQExcelParser();
  const workbook = await parser.parseIncoming(
    Buffer.from(buffer),
    'target.xlsx'
  );

  const questions: TargetQuestion[] = workbook.questions.map((q) => ({
    rowIndex: (q.rowNumber ?? 0) - 1,
    questionId: q.id,
    questionText: q.text,
    rowNumber: q.rowNumber,
    sheetName: q.sheetName,
  }));

  return {
    questions,
    columnMap: workbook.columnMap,
  };
}

// ────────────────────────────────────────────
// Tier 1: Direct ID match only (confidence 0.95+)
// ────────────────────────────────────────────

interface SourceIndex {
  byId: Map<string, SourceQA>;
  all: SourceQA[];
}

function buildSourceIndex(sources: SourceQA[]): SourceIndex {
  const byId = new Map<string, SourceQA>();
  for (const s of sources) {
    if (s.questionId) {
      const key = normalizeId(s.questionId);
      byId.set(key, s);
    }
  }
  return { byId, all: sources };
}

function normalizeId(id: string): string {
  return id.toLowerCase().trim().replace(/\s+/g, ' ');
}

function tier1Match(
  index: SourceIndex,
  targets: TargetQuestion[]
): { matched: TransferredAnswer[]; unmatched: TargetQuestion[] } {
  const matched: TransferredAnswer[] = [];
  const unmatched: TargetQuestion[] = [];

  for (const t of targets) {
    const idKey = normalizeId(t.questionId);
    const idMatch = index.byId.get(idKey);

    if (idMatch) {
      matched.push({
        targetRowIndex: t.rowIndex,
        targetQuestionId: t.questionId,
        targetQuestionText: t.questionText,
        answer: idMatch.answer,
        yesNo: idMatch.yesNo,
        tier: 'tier1',
        confidence: 95,
        matchedSourceId: idMatch.questionId,
        matchedSourceQuestion: idMatch.questionText,
        isAdapted: false,
        isAmbiguous: false,
        reviewStatus: 'approved',
        evidenceRef: '',
      });
    } else {
      unmatched.push(t);
    }
  }

  return { matched, unmatched };
}

// ────────────────────────────────────────────
// Tier 2: Semantic match via caiq-semantic-matcher (0.80–0.95)
// ────────────────────────────────────────────

function answerTypeFromYesNo(yesNo: string): CAIQAnswerType {
  const v = (yesNo || '').toLowerCase().trim();
  if (v === 'no') return 'NO';
  if (v === 'n/a' || v === 'na' || v === 'not applicable') return 'NOT_APPLICABLE';
  if (v.includes('conditional')) return 'CONDITIONAL';
  return 'YES';
}

/** Build KB entries from Golden Source for semantic matcher. */
function goldenToKnowledgeEntries(sources: SourceQA[]): CAIQKnowledgeEntry[] {
  return sources.map((s) => {
    const m = s.questionId.match(/^([A-Za-z]{3})/i);
    const domain = (m && m[1] ? m[1].toUpperCase() : 'AIS') as string;
    const validDomain = CAIQ_DOMAINS.includes(domain as CAIQDomain) ? (domain as CAIQDomain) : 'AIS';
    return {
      questionId: s.questionId,
      domain: validDomain,
      question: s.questionText,
      keywords: [],
      baseAnswer: s.answer,
      evidenceRequired: [],
      frameworkMappings: [],
      expectedAnswerType: answerTypeFromYesNo(s.yesNo),
    };
  });
}

const TIER2_MIN_SCORE = 0.8;
const TIER2_MAX_SCORE = 0.95;

function tier2Match(
  sourceQAs: SourceQA[],
  unmatchedTargets: TargetQuestion[]
): { matched: TransferredAnswer[]; unmatched: TargetQuestion[] } {
  if (unmatchedTargets.length === 0) return { matched: [], unmatched: [] };

  const entries = goldenToKnowledgeEntries(sourceQAs);
  if (entries.length === 0) return { matched: [], unmatched: [...unmatchedTargets] };

  const matcher = new CAIQSemanticMatcher(entries);
  const byId = new Map<string, SourceQA>();
  for (const s of sourceQAs) byId.set(s.questionId, s);

  const matched: TransferredAnswer[] = [];
  const stillUnmatched: TargetQuestion[] = [];

  for (const t of unmatchedTargets) {
    const results = matcher.findSimilar(t.questionText, undefined, {
      threshold: TIER2_MIN_SCORE,
      maxResults: 1,
    });

    const best = results[0];
    if (best && best.score >= TIER2_MIN_SCORE && best.score <= TIER2_MAX_SCORE) {
      const source = byId.get(best.questionId);
      if (source) {
        const confidencePct = Math.round(Math.min(95, Math.max(80, best.score * 100)));
        matched.push({
          targetRowIndex: t.rowIndex,
          targetQuestionId: t.questionId,
          targetQuestionText: t.questionText,
          answer: source.answer,
          yesNo: source.yesNo,
          tier: 'tier2',
          confidence: confidencePct,
          matchedSourceId: source.questionId,
          matchedSourceQuestion: source.questionText,
          isAdapted: true,
          isAmbiguous: best.score < 0.9,
          reviewStatus: 'pending',
          evidenceRef: '',
        });
        continue;
      }
    }
    stillUnmatched.push(t);
  }

  return { matched, unmatched: stillUnmatched };
}

// ────────────────────────────────────────────
// Tier 3: AI from source answers + org context (0.60–0.80)
// ────────────────────────────────────────────

async function tier3Generate(
  sourceQAs: SourceQA[],
  remainingTargets: TargetQuestion[],
  aiGenerate: (prompt: string) => Promise<string>,
): Promise<TransferredAnswer[]> {
  if (remainingTargets.length === 0) return [];

  const results: TransferredAnswer[] = [];
  const orgSummary = sourceQAs.slice(0, 30).map((s) => `[${s.questionId}] ${s.answer.slice(0, 200)}`).join('\n');
  const targetList = remainingTargets.map((t) => `[TARGET:${t.rowIndex}|${t.questionId}] ${t.questionText}`).join('\n');

  const prompt = `You are a cybersecurity compliance expert. The ORGANIZATION'S SOURCE QUESTIONNAIRE ANSWERS below are the primary truth. Use them to generate answers for the target questions. Do not use generic knowledge base content except as fallback when the source does not cover the topic.

ORGANIZATION'S SOURCE ANSWERS (primary source):
${orgSummary}

TARGET QUESTIONS TO ANSWER (generate from source context above; if no relevant source answer, infer from related source answers and org maturity level):
${targetList}

Respond ONLY with this JSON array (one object per target question):
[
  {
    "targetRowIndex": <number>,
    "targetQuestionId": "<string>",
    "yesNo": "Yes" | "No" | "N/A",
    "answer": "<generated answer, 2-4 sentences>",
    "confidence": <number 60-80>
  }
]`;

  try {
    const response = await aiGenerate(prompt);
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as Array<{
      targetRowIndex: number;
      targetQuestionId: string;
      yesNo: string;
      answer: string;
      confidence: number;
    }>;

    const covered = new Set<string>();
    for (const item of parsed) {
      const target = remainingTargets.find((t) => t.rowIndex === item.targetRowIndex || t.questionId === item.targetQuestionId);
      if (!target || covered.has(target.questionId)) continue;
      covered.add(target.questionId);

      const conf = Math.min(80, Math.max(60, item.confidence || 65));
      results.push({
        targetRowIndex: target.rowIndex,
        targetQuestionId: target.questionId,
        targetQuestionText: target.questionText,
        answer: item.answer || '',
        yesNo: item.yesNo || 'Yes',
        tier: 'tier3',
        confidence: conf,
        matchedSourceId: '',
        matchedSourceQuestion: '',
        isAdapted: false,
        isAmbiguous: true,
        reviewStatus: 'flagged',
        evidenceRef: '',
      });
    }

    for (const t of remainingTargets) {
      if (covered.has(t.questionId)) continue;
      results.push({
        targetRowIndex: t.rowIndex,
        targetQuestionId: t.questionId,
        targetQuestionText: t.questionText,
        answer: '',
        yesNo: '',
        tier: 'unmatched',
        confidence: 0,
        matchedSourceId: '',
        matchedSourceQuestion: '',
        isAdapted: false,
        isAmbiguous: true,
        reviewStatus: 'flagged',
        evidenceRef: '',
      });
    }
  } catch (error) {
    console.error('[CAIQ Transfer] Tier 3 generation error:', error);
    for (const t of remainingTargets) {
      results.push({
        targetRowIndex: t.rowIndex,
        targetQuestionId: t.questionId,
        targetQuestionText: t.questionText,
        answer: '',
        yesNo: '',
        tier: 'unmatched',
        confidence: 0,
        matchedSourceId: '',
        matchedSourceQuestion: '',
        isAdapted: false,
        isAmbiguous: true,
        reviewStatus: 'flagged',
        evidenceRef: '',
      });
    }
  }

  return results;
}

// ────────────────────────────────────────────
// Tier 4: Flag remaining (confidence < 0.60)
// ────────────────────────────────────────────

function tier4Flag(targets: TargetQuestion[]): TransferredAnswer[] {
  return targets.map((t) => ({
    targetRowIndex: t.rowIndex,
    targetQuestionId: t.questionId,
    targetQuestionText: t.questionText,
    answer: '',
    yesNo: '',
    tier: 'unmatched' as MatchTier,
    confidence: 0,
    matchedSourceId: '',
    matchedSourceQuestion: '',
    isAdapted: false,
    isAmbiguous: true,
    reviewStatus: 'flagged' as ReviewStatus,
    evidenceRef: '',
  }));
}

// ────────────────────────────────────────────
// Orchestrator
// ────────────────────────────────────────────

export async function processTransfer(
  sourceBuffer: ArrayBuffer,
  targetBuffer: ArrayBuffer,
  aiGenerate?: (prompt: string) => Promise<string>,
): Promise<TransferResult> {
  const parser = new CAIQExcelParser();

  let sourceQAs: SourceQA[];
  let targetParse: TargetParseResult;

  try {
    sourceQAs = await parseSourceWithParser(sourceBuffer);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Source file: ${msg}. Ensure it is a CAIQ Excel file with answered questions.`);
  }

  try {
    targetParse = await parseTargetWithParser(targetBuffer);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Target file: ${msg}. Ensure it is a CAIQ Excel file with question IDs and question text.`);
  }

  const targetQs = targetParse.questions;

  if (sourceQAs.length === 0) {
    throw new Error('No answered questions found in the source file. Index ALL existing answers as Golden Source.');
  }
  if (targetQs.length === 0) {
    throw new Error('No questions found in the target file.');
  }

  const index = buildSourceIndex(sourceQAs);

  const t1 = tier1Match(index, targetQs);
  const allAnswers = [...t1.matched];
  let remaining = t1.unmatched;

  const t2 = tier2Match(sourceQAs, remaining);
  allAnswers.push(...t2.matched);
  remaining = t2.unmatched;

  if (aiGenerate && remaining.length > 0) {
    const t3 = await tier3Generate(sourceQAs, remaining, aiGenerate);
    allAnswers.push(...t3);
  } else if (remaining.length > 0) {
    allAnswers.push(...tier4Flag(remaining));
  }

  allAnswers.sort((a, b) => a.targetRowIndex - b.targetRowIndex);

  const tier1Count = allAnswers.filter((a) => a.tier === 'tier1').length;
  const tier2Count = allAnswers.filter((a) => a.tier === 'tier2').length;
  const tier3Count = allAnswers.filter((a) => a.tier === 'tier3').length;
  const unmatchedCount = allAnswers.filter((a) => a.tier === 'unmatched').length;
  const answeredCount = tier1Count + tier2Count + tier3Count;

  return {
    sourceCount: sourceQAs.length,
    targetCount: targetQs.length,
    tier1Matches: tier1Count,
    tier2Matches: tier2Count,
    tier3Matches: tier3Count,
    unmatched: unmatchedCount,
    coveragePct: targetQs.length > 0 ? Math.round((answeredCount / targetQs.length) * 100) : 0,
    answers: allAnswers,
  };
}

// ────────────────────────────────────────────
// Export to target file format (via caiq-excel-parser)
// ────────────────────────────────────────────

function matchTierToConfidenceTier(tier: MatchTier): ConfidenceTier {
  if (tier === 'tier1') return 'EXACT_MATCH';
  if (tier === 'tier2') return 'SEMANTIC_MATCH';
  if (tier === 'tier3') return 'AI_GENERATED';
  return 'FLAGGED';
}

function matchTierToGeneratedBy(tier: MatchTier): CAIQGeneratedBy {
  if (tier === 'tier1') return 'KB_EXACT';
  if (tier === 'tier2') return 'KB_SEMANTIC';
  if (tier === 'tier3') return 'AI_PRIMARY';
  return 'AI_FALLBACK';
}

/**
 * Convert TransferredAnswer[] to CAIQAnswer[] for parser.writeAnswers.
 */
function transferredToCAIQAnswers(answers: TransferredAnswer[]): CAIQAnswer[] {
  const now = new Date().toISOString();
  return answers.map((a, i) => ({
    questionId: a.targetQuestionId,
    answer: a.answer,
    answerType: answerTypeFromYesNo(a.yesNo),
    confidence: a.confidence / 100,
    tier: matchTierToConfidenceTier(a.tier),
    sources: a.matchedSourceId ? ['Golden Source'] : [],
    evidenceRefs: a.evidenceRef ? [a.evidenceRef] : [],
    frameworkRefs: [],
    needsReview: a.confidence < 60,
    auditId: `transfer-${i + 1}`,
    generatedAt: now,
    generatedBy: matchTierToGeneratedBy(a.tier),
  }));
}

/**
 * Write transferred answers back into the TARGET file's original format using caiq-excel-parser.
 */
export async function exportTransferToTargetFile(
  targetBuffer: Buffer,
  answers: TransferredAnswer[],
  columnMap: ColumnMap
): Promise<Buffer> {
  const parser = new CAIQExcelParser();
  const caiqAnswers = transferredToCAIQAnswers(answers);
  return parser.writeAnswers(targetBuffer, caiqAnswers, columnMap);
}

// ────────────────────────────────────────────
// Legacy Excel export (new workbook) — kept for backward compatibility
// ────────────────────────────────────────────

import ExcelJS from 'exceljs';

export async function exportTransferToExcel(result: TransferResult): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet('Completed Answers');
  ws.columns = [
    { header: 'Question ID', key: 'qid', width: 14 },
    { header: 'Question', key: 'question', width: 65 },
    { header: 'Yes/No', key: 'yesNo', width: 8 },
    { header: 'Answer', key: 'answer', width: 85 },
    { header: 'Match Tier', key: 'tier', width: 12 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Adapted', key: 'adapted', width: 10 },
    { header: 'Source Match', key: 'sourceMatch', width: 14 },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  for (const a of result.answers) {
    const row = ws.addRow({
      qid: a.targetQuestionId,
      question: a.targetQuestionText,
      yesNo: a.yesNo,
      answer: a.answer,
      tier: a.tier.toUpperCase(),
      confidence: `${a.confidence}%`,
      adapted: a.isAdapted ? 'Yes' : 'No',
      sourceMatch: a.matchedSourceId,
    });

    const fillColor = a.tier === 'tier1' ? 'FFC6F6D5' : a.tier === 'tier2' ? 'FFFEFCBF' : a.tier === 'tier3' ? 'FFFED7AA' : 'FFFED7D7';
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    });
  }

  const wsSummary = wb.addWorksheet('Summary');
  wsSummary.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 15 },
  ];
  wsSummary.addRow({ metric: 'Source Questions', value: result.sourceCount });
  wsSummary.addRow({ metric: 'Target Questions', value: result.targetCount });
  wsSummary.addRow({ metric: 'Tier 1 (Direct Match)', value: result.tier1Matches });
  wsSummary.addRow({ metric: 'Tier 2 (Semantic)', value: result.tier2Matches });
  wsSummary.addRow({ metric: 'Tier 3 (AI Generated)', value: result.tier3Matches });
  wsSummary.addRow({ metric: 'Tier 4 (Flagged)', value: result.unmatched });
  wsSummary.addRow({ metric: 'Coverage %', value: `${result.coveragePct}%` });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
