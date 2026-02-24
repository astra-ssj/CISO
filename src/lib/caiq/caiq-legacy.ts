/**
 * Legacy CAIQ flow: Excel parsing, KB matching, AI enhancement, and export.
 * For the 4-tier answer pipeline use CAIQAnswerEngine from ./caiq-answer-engine.
 */

import ExcelJS from 'exceljs';
import {
  CAIQ_KNOWLEDGE_BASE,
  type CAIQEntry,
  type QuestionnaireQuestion,
  type AnsweredQuestion,
  type ConfidenceLevel,
} from './caiq-knowledge-base';

export interface OrgProfile {
  industry: string;
  certifications: string[];
  orgSize: string;
  cloudProvider: string;
  additionalContext: string;
}

export interface CAIQProcessingResult {
  totalQuestions: number;
  answeredByKB: number;
  answeredByAI: number;
  unanswered: number;
  coveragePct: number;
  questions: AnsweredQuestion[];
  domainBreakdown: Record<string, { total: number; answered: number; pct: number }>;
}

/** Excel row: 1-based index 0 is often empty; cells are string/number/date/null. */
type ExcelRow = (string | number | null | undefined)[];

export async function parseQuestionnaire(buffer: ArrayBuffer): Promise<QuestionnaireQuestion[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(buffer) as unknown as Parameters<ExcelJS.Workbook['xlsx']['load']>[0]);

  for (const worksheet of workbook.worksheets) {
    const rows: ExcelRow[] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const raw = row.values as unknown;
      const arr = Array.isArray(raw) ? raw.slice(1) : [];
      rows.push(
        arr.map((cell: unknown): string | number | null | undefined =>
          cell === null || cell === undefined ? '' : (cell as string | number)
        )
      );
    });
    const normalizedRows = rows.map((r) => {
      const arr = Array.isArray(r) ? r.slice(1) : [];
      return arr.map((cell) => (cell === null || cell === undefined ? '' : String(cell)));
    });

    if (normalizedRows.length < 2) continue;

    const result = extractQuestionsFromRows(normalizedRows);
    if (result.length > 0) return result;
  }

  return [];
}

function extractQuestionsFromRows(rows: string[][]): QuestionnaireQuestion[] {
  const questionKeywords = [
    'question', 'control question', 'caiq', 'requirement', 'description', 'query',
    'control specification', 'security question', 'assessment question', 'audit question',
    'control objective', 'control activity', 'questionnaire', 'criteria', 'control description',
  ];
  const idKeywords = [
    'id', 'control id', 'question id', 'ref', 'reference', 'number', '#', 'control #', 'ccm', 'domain',
  ];

  const maxHeaderScan = Math.min(rows.length, 15);
  for (let headerRow = 0; headerRow < maxHeaderScan; headerRow++) {
    const row = rows[headerRow];
    if (!row || !Array.isArray(row)) continue;

    const cells = row.map((c: string) => c.toLowerCase().trim());
    const nonEmpty = cells.filter((c) => c.length > 0);
    if (nonEmpty.length < 2) continue;

    let questionCol = -1;
    let idCol = -1;

    for (let i = 0; i < cells.length; i++) {
      const h = cells[i];
      if (!h) continue;
      if (questionCol === -1 && questionKeywords.some((kw) => h.includes(kw))) questionCol = i;
      if (idCol === -1 && idKeywords.some((kw) => h === kw || h.includes(kw))) idCol = i;
    }

    if (questionCol !== -1) {
      const questions = collectQuestions(rows, headerRow + 1, questionCol, idCol);
      if (questions.length > 0) return questions;
    }
  }

  const sampleEnd = Math.min(rows.length, 30);
  const colCount = Math.max(...rows.slice(0, sampleEnd).map((r) => (r ? r.length : 0)));

  if (colCount > 0) {
    let bestCol = 0;
    let bestAvgLen = 0;
    let bestHeaderRow = 0;

    for (let col = 0; col < colCount; col++) {
      let dataStart = 0;
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const val = String(rows[r]?.[col] ?? '').trim();
        if (val.length > 15) {
          dataStart = r;
          break;
        }
        dataStart = r + 1;
      }

      const sample = rows.slice(dataStart, dataStart + 20);
      const lengths = sample.map((r) => String(r?.[col] ?? '').trim().length);
      const nonZeroLengths = lengths.filter((l) => l > 0);
      const avgLen =
        nonZeroLengths.length > 0
          ? nonZeroLengths.reduce((a, b) => a + b, 0) / nonZeroLengths.length
          : 0;

      if (avgLen > bestAvgLen) {
        bestAvgLen = avgLen;
        bestCol = col;
        bestHeaderRow = dataStart;
      }
    }

    if (bestAvgLen > 20) {
      let idCol = -1;
      for (let col = 0; col < colCount; col++) {
        if (col === bestCol) continue;
        const sample = rows.slice(bestHeaderRow, bestHeaderRow + 5);
        const vals = sample.map((r) => String(r?.[col] ?? '').trim());
        const looksLikeIds = vals.filter((v) => v.length > 0 && v.length < 20).length;
        if (looksLikeIds >= 3) {
          idCol = col;
          break;
        }
      }

      const questions = collectQuestions(rows, bestHeaderRow, bestCol, idCol);
      if (questions.length > 0) return questions;
    }
  }

  for (let col = 0; col < colCount; col++) {
    const questions: QuestionnaireQuestion[] = [];
    for (let r = 0; r < rows.length; r++) {
      const text = String(rows[r]?.[col] ?? '').trim();
      if (
        text.length >= 30 &&
        !text.toLowerCase().startsWith('copyright') &&
        !text.toLowerCase().startsWith('disclaimer')
      ) {
        questions.push({
          rowIndex: r,
          questionId: undefined,
          questionText: text,
        });
      }
    }
    if (questions.length >= 3) return questions;
  }

  return [];
}

function collectQuestions(
  rows: string[][],
  dataStartRow: number,
  questionCol: number,
  idCol: number
): QuestionnaireQuestion[] {
  const questions: QuestionnaireQuestion[] = [];
  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const questionText = String(row[questionCol] ?? '').trim();
    if (questionText.length < 5) continue;

    questions.push({
      rowIndex: i,
      questionId: idCol >= 0 ? String(row[idCol] ?? '').trim() || undefined : undefined,
      questionText,
    });
  }
  return questions;
}

function matchScore(question: string, entry: CAIQEntry): number {
  const qLower = question.toLowerCase();
  const words = qLower.split(/\s+/).filter((w) => w.length > 3);

  let keywordHits = 0;
  for (const kw of entry.keywords) {
    if (qLower.includes(kw.toLowerCase())) keywordHits++;
  }
  const keywordScore =
    entry.keywords.length > 0 ? (keywordHits / entry.keywords.length) * 100 : 0;

  const entryWords = entry.question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  let wordOverlap = 0;
  for (const w of words) {
    if (entryWords.some((ew) => ew.includes(w) || w.includes(ew))) wordOverlap++;
  }
  const overlapScore =
    words.length > 0 ? (wordOverlap / Math.max(words.length, entryWords.length)) * 100 : 0;

  return Math.round(keywordScore * 0.6 + overlapScore * 0.4);
}

export function matchToKnowledgeBase(
  questions: QuestionnaireQuestion[],
  minConfidence: number = 30
): AnsweredQuestion[] {
  return questions.map((q) => {
    let bestMatch: CAIQEntry | null = null;
    let bestScore = 0;

    for (const entry of CAIQ_KNOWLEDGE_BASE) {
      const score = matchScore(q.questionText, entry);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && bestScore >= minConfidence) {
      const confidence: ConfidenceLevel =
        bestScore >= 70 ? 'high' : bestScore >= 50 ? 'medium' : 'low';

      return {
        ...q,
        answer: bestMatch.answer,
        yesNo: bestMatch.yesNo,
        confidence,
        matchedEntryId: bestMatch.id,
        source: 'a2a' as const,
        evidenceRef: bestMatch.evidenceRef,
      };
    }

    return {
      ...q,
      answer: '',
      yesNo: '' as const,
      confidence: 'low' as const,
      source: 'manual' as const,
      evidenceRef: '',
    };
  });
}

function buildAIPrompt(questions: AnsweredQuestion[], profile: OrgProfile): string {
  const questionsText = questions.map((q) => `[ROW:${q.rowIndex}] ${q.questionText}`).join('\n');

  return `You are a cybersecurity compliance expert completing a vendor risk questionnaire (CAIQ/SIG style).

ORGANIZATION PROFILE:
- Industry: ${profile.industry || 'Technology'}
- Certifications: ${profile.certifications.join(', ') || 'SOC 2 Type II, ISO 27001'}
- Organization Size: ${profile.orgSize || 'Mid-size (500-5000 employees)'}
- Cloud Provider: ${profile.cloudProvider || 'AWS/Azure'}
- Additional Context: ${profile.additionalContext || 'N/A'}

For each question below, provide a professional, detailed answer from the perspective of a mature, compliant organization. Each answer should be 2-4 sentences and reference specific controls, tools, or processes.

QUESTIONS:
${questionsText}

RESPOND IN THIS EXACT JSON FORMAT (array of objects):
[
  {
    "rowIndex": <number>,
    "yesNo": "Yes" | "No" | "N/A",
    "answer": "<detailed answer>",
    "evidenceRef": "<evidence document reference>"
  }
]

Respond ONLY with the JSON array. No explanation.`;
}

function parseAIResponse(response: string): Array<{
  rowIndex: number;
  yesNo: 'Yes' | 'No' | 'N/A';
  answer: string;
  evidenceRef: string;
}> {
  try {
    const cleaned = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

export async function enhanceWithAI(
  questions: AnsweredQuestion[],
  orgProfile: OrgProfile,
  aiGenerateContent: (prompt: string) => Promise<string>
): Promise<AnsweredQuestion[]> {
  const toEnhance = questions.filter((q) => q.source === 'manual' || q.confidence === 'low');

  if (toEnhance.length === 0) return questions;

  const batches: AnsweredQuestion[][] = [];
  for (let i = 0; i < toEnhance.length; i += 15) {
    batches.push(toEnhance.slice(i, i + 15));
  }

  const enhanced = new Map<number, AnsweredQuestion>();

  for (const batch of batches) {
    const prompt = buildAIPrompt(batch, orgProfile);

    try {
      const response = await aiGenerateContent(prompt);
      const parsed = parseAIResponse(response);

      for (const item of parsed) {
        const original = batch.find((q) => q.rowIndex === item.rowIndex);
        if (original) {
          enhanced.set(item.rowIndex, {
            ...original,
            answer: item.answer,
            yesNo: item.yesNo,
            confidence: 'medium',
            source: 'context' as const,
            evidenceRef: item.evidenceRef || original.evidenceRef,
          });
        }
      }
    } catch (error) {
      console.error('[CAIQ AI] Batch processing error:', error);
    }
  }

  return questions.map((q) => enhanced.get(q.rowIndex) || q);
}

export function computeResults(questions: AnsweredQuestion[]): CAIQProcessingResult {
  const answeredByKB = questions.filter((q) => q.source === 'a2a').length;
  const answeredByAI = questions.filter((q) => q.source === 'context' || q.source === 'semantic').length;
  const answered = answeredByKB + answeredByAI;
  const unanswered = questions.length - answered;

  const domainBreakdown: Record<string, { total: number; answered: number; pct: number }> = {};

  for (const q of questions) {
    const entry = q.matchedEntryId
      ? CAIQ_KNOWLEDGE_BASE.find((e) => e.id === q.matchedEntryId)
      : null;
    const domain = entry?.domainName || 'Other';

    if (!domainBreakdown[domain]) {
      domainBreakdown[domain] = { total: 0, answered: 0, pct: 0 };
    }
    domainBreakdown[domain].total++;
    if (q.source !== 'manual') {
      domainBreakdown[domain].answered++;
    }
  }

  for (const domain of Object.keys(domainBreakdown)) {
    const d = domainBreakdown[domain];
    d.pct = d.total > 0 ? Math.round((d.answered / d.total) * 100) : 0;
  }

  return {
    totalQuestions: questions.length,
    answeredByKB,
    answeredByAI,
    unanswered,
    coveragePct: questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0,
    questions,
    domainBreakdown,
  };
}

export async function exportToExcel(result: CAIQProcessingResult): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  const wsAnswers = wb.addWorksheet('Answers');
  wsAnswers.columns = [
    { header: 'Question ID', key: 'questionId', width: 12 },
    { header: 'Question', key: 'question', width: 60 },
    { header: 'Yes/No', key: 'yesNo', width: 8 },
    { header: 'Answer', key: 'answer', width: 80 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Source', key: 'source', width: 15 },
    { header: 'Evidence Reference', key: 'evidence', width: 40 },
  ];
  result.questions.forEach((q) => {
    wsAnswers.addRow({
      questionId: q.questionId || '',
      question: q.questionText,
      yesNo: q.yesNo,
      answer: q.answer,
      confidence: q.confidence,
      source: q.source || '',
      evidence: q.evidenceRef || '',
    });
  });

  const wsSummary = wb.addWorksheet('Summary');
  wsSummary.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 15 },
  ];
  wsSummary.addRow({ metric: 'Total Questions', value: result.totalQuestions });
  wsSummary.addRow({ metric: 'Answered by Knowledge Base', value: result.answeredByKB });
  wsSummary.addRow({ metric: 'Answered by AI', value: result.answeredByAI });
  wsSummary.addRow({ metric: 'Unanswered (Manual Required)', value: result.unanswered });
  wsSummary.addRow({ metric: 'Coverage %', value: `${result.coveragePct}%` });

  const wsDomains = wb.addWorksheet('Domain Breakdown');
  wsDomains.columns = [
    { header: 'Domain', key: 'domain', width: 40 },
    { header: 'Total Questions', key: 'total', width: 15 },
    { header: 'Answered', key: 'answered', width: 12 },
    { header: 'Coverage %', key: 'coverage', width: 12 },
  ];
  Object.entries(result.domainBreakdown).forEach(([domain, data]) => {
    wsDomains.addRow({
      domain,
      total: data.total,
      answered: data.answered,
      coverage: `${data.pct}%`,
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
