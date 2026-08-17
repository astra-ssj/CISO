/**
 * CAIQ Answer Engine — Dual-File 3-Tier Matching
 * 
 * Upload a SOURCE file (your answered Q&A) and a TARGET file (empty questionnaire).
 * Three-tier matching:
 *   Tier 1: A-to-A — exact/near-exact text matching
 *   Tier 2: AI Semantic — meaning-based matching via LLM
 *   Tier 3: AI Context — synthesize answers from source context
 */

import ExcelJS from 'exceljs';
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    CAIQ_KNOWLEDGE_BASE,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type CAIQEntry,
    type QuestionnaireQuestion,
    type AnsweredQuestion,
    type ConfidenceLevel,
} from './caiq-knowledge-base';
export type { AnsweredQuestion, QuestionnaireQuestion, ConfidenceLevel } from './caiq-knowledge-base';
import { AIResponse } from '@/lib/ai/engine';
import { TokenTracker, AIModel } from '@/lib/telemetry/token-tracker';
import { matchCaiq, type KnowledgeRecord } from '@/lib/skills/caiq-match';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface OrgProfile {
    industry: string;
    certifications: string[];
    orgSize: string;
    cloudProvider: string;
    additionalContext: string;
}

/** A Q&A pair extracted from the user's SOURCE file */
export interface SourceEntry {
    rowIndex: number;
    questionId?: string;
    questionText: string;
    answerText: string;
    yesNo: 'Yes' | 'No' | 'N/A' | '';
}

export interface CAIQProcessingResult {
    totalQuestions: number;
    answeredByA2A: number;
    answeredBySemantic: number;
    answeredByContext: number;
    unanswered: number;
    coveragePct: number;
    questions: AnsweredQuestion[];
    domainBreakdown: Record<string, { total: number; answered: number; pct: number }>;
}

// ────────────────────────────────────────────
// Excel Parsing — TARGET file (empty questionnaire)
// ────────────────────────────────────────────

/**
 * Parse an uploaded Excel buffer and extract questions.
 * Robust: scans multiple header rows, tries all sheets, uses
 * text-length heuristics when keyword matching fails.
 */
export async function parseQuestionnaire(buffer: ArrayBuffer): Promise<QuestionnaireQuestion[]> {
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(new Uint8Array(buffer) as any);

    // Try each sheet until we find questions
    for (const worksheet of workbook.worksheets) {
        const rows: Array<Array<unknown>> = [];
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            rows.push(row.values as Array<unknown>);
        });
        // ExcelJS row.values is 1-indexed (index 0 is undefined), normalize
        const normalizedRows = rows.map(r => {
            const arr = Array.isArray(r) ? r.slice(1) : [];
            return arr.map(cell => (cell === null || cell === undefined) ? '' : cell);
        });

        if (normalizedRows.length < 2) continue;

        const result = extractQuestionsFromRows(normalizedRows);
        if (result.length > 0) return result;
    }

    return [];
}

// ────────────────────────────────────────────
// Excel Parsing — SOURCE file (answered Q&A)
// ────────────────────────────────────────────

/**
 * Parse the user's SOURCE file — an already-answered questionnaire.
 * Extracts both questions AND their answers as SourceEntry[].
 */
export async function parseSourceFile(buffer: ArrayBuffer): Promise<SourceEntry[]> {
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(new Uint8Array(buffer) as any);

    for (const worksheet of workbook.worksheets) {
        const rows: Array<Array<unknown>> = [];
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            rows.push(row.values as Array<unknown>);
        });
        const normalizedRows = rows.map(r => {
            const arr = Array.isArray(r) ? r.slice(1) : [];
            return arr.map(cell => (cell === null || cell === undefined) ? '' : cell);
        });

        if (normalizedRows.length < 2) continue;

        const result = extractSourceEntries(normalizedRows);
        if (result.length > 0) return result;
    }

    return [];
}

/**
 * Extract Q&A pairs from the source file.
 * Detects question column AND answer column(s).
 */
function extractSourceEntries(rows: Array<Array<unknown>>): SourceEntry[] {
    const questionKeywords = [
        'question', 'control question', 'caiq', 'requirement',
        'description', 'query', 'control specification', 'security question',
        'assessment question', 'audit question', 'control objective',
        'control activity', 'questionnaire', 'criteria', 'control description',
    ];
    const answerKeywords = [
        'answer', 'response', 'reply', 'implementation', 'statement',
        'details', 'explanation', 'comment', 'notes', 'description of controls',
        'control implementation', 'your response', 'vendor response',
    ];
    const yesNoKeywords = [
        'yes/no', 'y/n', 'yes / no', 'compliance', 'status', 'met',
        'conform', 'applicable',
    ];
    const idKeywords = [
        'id', 'control id', 'question id', 'ref', 'reference',
        'number', '#', 'control #', 'ccm', 'domain',
    ];

    // Strategy 1: scan for header row with recognizable columns
    const maxHeaderScan = Math.min(rows.length, 15);
    for (let headerRow = 0; headerRow < maxHeaderScan; headerRow++) {
        const row = rows[headerRow];
        if (!row || !Array.isArray(row)) continue;

        const cells = row.map((c: unknown) => String(c ?? '').toLowerCase().trim());
        const nonEmpty = cells.filter(c => c.length > 0);
        if (nonEmpty.length < 2) continue;

        let questionCol = -1;
        let answerCol = -1;
        let yesNoCol = -1;
        let idCol = -1;

        for (let i = 0; i < cells.length; i++) {
            const h = cells[i];
            if (!h) continue;
            if (questionCol === -1 && questionKeywords.some(kw => h.includes(kw))) {
                questionCol = i;
            }
            if (answerCol === -1 && answerKeywords.some(kw => h.includes(kw))) {
                answerCol = i;
            }
            if (yesNoCol === -1 && yesNoKeywords.some(kw => h.includes(kw))) {
                yesNoCol = i;
            }
            if (idCol === -1 && idKeywords.some(kw => h === kw || h.includes(kw))) {
                idCol = i;
            }
        }

        if (questionCol !== -1 && answerCol !== -1) {
            return collectSourceEntries(rows, headerRow + 1, questionCol, answerCol, yesNoCol, idCol);
        }
    }

    // Strategy 2: heuristic — find the two longest-average-text columns
    const sampleEnd = Math.min(rows.length, 30);
    const colCount = Math.max(...rows.slice(0, sampleEnd).map(r => (r ? r.length : 0)));

    if (colCount >= 2) {
        const colStats: { col: number; avgLen: number; dataStart: number }[] = [];

        for (let col = 0; col < colCount; col++) {
            let dataStart = 0;
            for (let r = 0; r < Math.min(rows.length, 10); r++) {
                const val = String(rows[r]?.[col] ?? '').trim();
                if (val.length > 15) { dataStart = r; break; }
                dataStart = r + 1;
            }

            const sample = rows.slice(dataStart, dataStart + 20);
            const lengths = sample.map(r => String(r?.[col] ?? '').trim().length);
            const nonZero = lengths.filter(l => l > 0);
            const avgLen = nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;

            colStats.push({ col, avgLen, dataStart });
        }

        // Sort by average length descending — top 2 are likely question & answer
        colStats.sort((a, b) => b.avgLen - a.avgLen);

        if (colStats.length >= 2 && colStats[0].avgLen > 20 && colStats[1].avgLen > 10) {
            const [first, second] = colStats;
            // Question column is the one that starts earlier or has shorter entries
            const questionCol = first.col < second.col ? first.col : second.col;
            const answerCol = first.col < second.col ? second.col : first.col;
            const dataStart = Math.max(first.dataStart, second.dataStart);

            return collectSourceEntries(rows, dataStart, questionCol, answerCol, -1, -1);
        }
    }

    return [];
}

/**
 * Collect Q&A entries from the source starting at dataStartRow.
 */
function collectSourceEntries(
    rows: Array<Array<unknown>>,
    dataStartRow: number,
    questionCol: number,
    answerCol: number,
    yesNoCol: number,
    idCol: number,
): SourceEntry[] {
    const entries: SourceEntry[] = [];
    for (let i = dataStartRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const questionText = String(row[questionCol] ?? '').trim();
        const answerText = String(row[answerCol] ?? '').trim();
        if (questionText.length < 5) continue; // Skip non-question rows

        // Only include rows that have at least a question
        let yesNo: 'Yes' | 'No' | 'N/A' | '' = '';
        if (yesNoCol >= 0) {
            const v = String(row[yesNoCol] ?? '').trim().toLowerCase();
            if (v === 'yes' || v === 'y') yesNo = 'Yes';
            else if (v === 'no' || v === 'n') yesNo = 'No';
            else if (v === 'n/a' || v === 'na' || v === 'not applicable') yesNo = 'N/A';
        }

        entries.push({
            rowIndex: i,
            questionId: idCol >= 0 ? String(row[idCol] ?? '').trim() || undefined : undefined,
            questionText,
            answerText,
            yesNo,
        });
    }
    return entries;
}

// ────────────────────────────────────────────
// Inner question extraction (for TARGET file)
// ────────────────────────────────────────────

function extractQuestionsFromRows(rows: Array<Array<unknown>>): QuestionnaireQuestion[] {
    const questionKeywords = [
        'question', 'control question', 'caiq', 'requirement',
        'description', 'query', 'control specification', 'security question',
        'assessment question', 'audit question', 'control objective',
        'control activity', 'questionnaire', 'criteria', 'control description',
    ];
    const idKeywords = [
        'id', 'control id', 'question id', 'ref', 'reference',
        'number', '#', 'control #', 'ccm', 'domain',
    ];

    // Strategy 1: Scan rows 0-15 for a header row
    const maxHeaderScan = Math.min(rows.length, 15);
    for (let headerRow = 0; headerRow < maxHeaderScan; headerRow++) {
        const row = rows[headerRow];
        if (!row || !Array.isArray(row)) continue;

        const cells = row.map((c: unknown) => String(c ?? '').toLowerCase().trim());
        const nonEmpty = cells.filter(c => c.length > 0);
        if (nonEmpty.length < 2) continue;

        let questionCol = -1;
        let idCol = -1;

        for (let i = 0; i < cells.length; i++) {
            const h = cells[i];
            if (!h) continue;
            if (questionCol === -1 && questionKeywords.some(kw => h.includes(kw))) {
                questionCol = i;
            }
            if (idCol === -1 && idKeywords.some(kw => h === kw || h.includes(kw))) {
                idCol = i;
            }
        }

        if (questionCol !== -1) {
            const questions = collectQuestions(rows, headerRow + 1, questionCol, idCol);
            if (questions.length > 0) return questions;
        }
    }

    // Strategy 2: Find column with longest average text
    const sampleEnd = Math.min(rows.length, 30);
    const colCount = Math.max(...rows.slice(0, sampleEnd).map(r => (r ? r.length : 0)));

    if (colCount > 0) {
        let bestCol = 0;
        let bestAvgLen = 0;
        let bestHeaderRow = 0;

        for (let col = 0; col < colCount; col++) {
            let dataStart = 0;
            for (let r = 0; r < Math.min(rows.length, 10); r++) {
                const val = String(rows[r]?.[col] ?? '').trim();
                if (val.length > 15) { dataStart = r; break; }
                dataStart = r + 1;
            }

            const sample = rows.slice(dataStart, dataStart + 20);
            const lengths = sample.map(r => String(r?.[col] ?? '').trim().length);
            const nonZeroLengths = lengths.filter(l => l > 0);
            const avgLen = nonZeroLengths.length > 0
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
                const vals = sample.map(r => String(r?.[col] ?? '').trim());
                const looksLikeIds = vals.filter(v => v.length > 0 && v.length < 20).length;
                if (looksLikeIds >= 3) { idCol = col; break; }
            }

            const questions = collectQuestions(rows, bestHeaderRow, bestCol, idCol);
            if (questions.length > 0) return questions;
        }
    }

    // Strategy 3: Take any column with text > 30 chars
    for (let col = 0; col < colCount; col++) {
        const questions: QuestionnaireQuestion[] = [];
        for (let r = 0; r < rows.length; r++) {
            const text = String(rows[r]?.[col] ?? '').trim();
            if (text.length >= 30 && !text.toLowerCase().startsWith('copyright') && !text.toLowerCase().startsWith('disclaimer')) {
                questions.push({ rowIndex: r, questionId: undefined, questionText: text });
            }
        }
        if (questions.length >= 3) return questions;
    }

    return [];
}

function collectQuestions(
    rows: Array<Array<unknown>>,
    dataStartRow: number,
    questionCol: number,
    idCol: number,
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

// ────────────────────────────────────────────
// Tier 1: A-to-A Matching (instant, no AI)
// ────────────────────────────────────────────

/**
 * Score how well a target question matches a source entry.
 * Returns 0-100 similarity score based on token overlap.
 */
function a2aMatchScore(targetQuestion: string, sourceQuestion: string): number {
    const tLower = targetQuestion.toLowerCase();
    const sLower = sourceQuestion.toLowerCase();

    const tWords = tLower.split(/\s+/).filter(w => w.length > 3);
    const sWords = sLower.split(/\s+/).filter(w => w.length > 3);

    if (tWords.length === 0 || sWords.length === 0) return 0;

    let overlap = 0;
    for (const w of tWords) {
        if (sWords.some(sw => sw.includes(w) || w.includes(sw))) {
            overlap++;
        }
    }

    return Math.round((overlap / Math.max(tWords.length, sWords.length)) * 100);
}

/**
 * Tier 1: Match target questions against source entries using text overlap.
 * No AI calls — instant.
 */
export function matchToSource(
    targetQuestions: QuestionnaireQuestion[],
    sourceEntries: SourceEntry[],
    minConfidence: number = 40,
): AnsweredQuestion[] {
    return targetQuestions.map(tq => {
        let bestSource: SourceEntry | null = null;
        let bestScore = 0;

        for (const se of sourceEntries) {
            const score = a2aMatchScore(tq.questionText, se.questionText);
            if (score > bestScore) {
                bestScore = score;
                bestSource = se;
            }
        }

        if (bestSource && bestScore >= minConfidence && bestSource.answerText.length > 0) {
            const confidence: ConfidenceLevel =
                bestScore >= 75 ? 'high' : bestScore >= 55 ? 'medium' : 'low';

            return {
                ...tq,
                answer: bestSource.answerText,
                yesNo: bestSource.yesNo || '',
                confidence,
                matchedEntryId: bestSource.questionId,
                source: 'a2a' as const,
                evidenceRef: '',
            };
        }

        return {
            ...tq,
            answer: '',
            yesNo: '' as const,
            confidence: 'low' as const,
            source: 'manual' as const,
            evidenceRef: '',
        };
    });
}

/**
 * Match against the database-backed Knowledge Repository.
 * Queries all entries once, then scores each target question
 * using the same keyword/overlap algorithm as the legacy version.
 * Falls back to the hardcoded CAIQ_KNOWLEDGE_BASE if DB is unavailable.
 */
export async function matchToKnowledgeBase(
    questions: QuestionnaireQuestion[],
    minConfidence: number = 30
): Promise<AnsweredQuestion[]> {
    try {
        const prisma = (await import('@/lib/prisma')).default;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entries = await (prisma as any).knowledgeEntry.findMany();

        if (entries && entries.length > 0) {
            const records: KnowledgeRecord[] = entries.map((entry: {
                id: string;
                questionNormalized: string;
                keywords: string;
                answerText: string;
                answerType?: string;
                evidence?: string | null;
            }) => ({
                id: entry.id,
                questionNormalized: entry.questionNormalized,
                keywords: entry.keywords ?? '',
                answerText: entry.answerText,
                answerType: entry.answerType,
                evidence: entry.evidence,
            }));

            const hits = matchCaiq({
                questions: questions.map((q) => ({ questionText: q.questionText })),
                entries: records,
                minConfidence,
            });

            return questions.map((q, i) => {
                const hit = hits[i];
                if (!hit?.entryId || !hit.answer) {
                    return {
                        ...q,
                        answer: '',
                        yesNo: '' as const,
                        confidence: 'low' as const,
                        source: 'manual' as const,
                        evidenceRef: '',
                    };
                }

                (prisma as { knowledgeEntry: { update: (args: unknown) => Promise<unknown> } }).knowledgeEntry.update({
                    where: { id: hit.entryId },
                    data: { usageCount: { increment: 1 }, lastUsed: new Date() },
                }).catch(() => { });

                const yesNo = hit.answerType === 'YES' || hit.answerType === 'Yes' ? 'Yes'
                    : hit.answerType === 'NO' || hit.answerType === 'No' ? 'No'
                    : hit.answerType === 'NA' || hit.answerType === 'N/A' ? 'N/A'
                    : (hit.answerType as 'Yes' | 'No' | 'N/A' | '');

                return {
                    ...q,
                    answer: hit.answer,
                    yesNo,
                    confidence: hit.confidence,
                    matchedEntryId: hit.entryId,
                    source: 'a2a' as const,
                    evidenceRef: hit.evidence || '',
                };
            });
        }
    } catch (err) {
        console.warn('[CAIQ Engine] DB knowledge query failed, falling back to empty:', err);
    }

    // If DB fails, fallback to bare manual mapping
    return questions.map(q => ({
        ...q,
        answer: '',
        yesNo: '' as const,
        confidence: 'low' as const,
        source: 'manual' as const,
        evidenceRef: '',
    }));
}

// ────────────────────────────────────────────
// Tier 2: AI Semantic Matching
// ────────────────────────────────────────────

/**
 * Tier 2: Use AI to find semantically equivalent questions between
 * source and target where wording differs but meaning matches.
 */
export async function semanticMatch(
    unmatchedQuestions: AnsweredQuestion[],
    sourceEntries: SourceEntry[],
    orgProfile: OrgProfile,
    aiGenerateContent: (prompt: string) => Promise<AIResponse<string>>,
    userId: string = 'authenticated-user',
    modelName: string = 'gemini-1.5-pro',
    onProgress?: (processed: number, total: number) => void,
): Promise<AnsweredQuestion[]> {
    const toMatch = unmatchedQuestions.filter(q => q.source === 'manual');
    if (toMatch.length === 0) return unmatchedQuestions;

    // Batch for efficiency (max 10 per batch)
    const batches: AnsweredQuestion[][] = [];
    for (let i = 0; i < toMatch.length; i += 10) {
        batches.push(toMatch.slice(i, i + 10));
    }

    const matched = new Map<number, AnsweredQuestion>();
    let processedCount = 0;

    for (const batch of batches) {
        const prompt = buildSemanticPrompt(batch, sourceEntries, orgProfile);

        try {
            const response = await aiGenerateContent(prompt);

            if (response.usage) {
                await TokenTracker.trackUsage({
                    userId,
                    model: modelName as AIModel,
                    actionType: 'CAIQ_SCAN',
                    promptTokens: response.usage.promptTokens,
                    completionTokens: response.usage.completionTokens,
                });
            }

            const parsed = parseAIResponse(response.data);
            for (const item of parsed) {
                const original = batch.find(q => q.rowIndex === item.rowIndex);
                if (original && item.answer && item.answer.length > 5) {
                    matched.set(item.rowIndex, {
                        ...original,
                        answer: item.answer,
                        yesNo: item.yesNo,
                        confidence: 'medium',
                        source: 'semantic',
                        evidenceRef: item.evidenceRef || '',
                    });
                }
            }
        } catch (error) {
            console.error('[CAIQ Semantic] Batch error:', error);
        }

        processedCount += batch.length;
        if (onProgress) onProgress(processedCount, toMatch.length);
    }

    return unmatchedQuestions.map(q => matched.get(q.rowIndex) || q);
}

// ────────────────────────────────────────────
// Tier 3: AI Context Generation
// ────────────────────────────────────────────

/**
 * Tier 3: For remaining unanswered questions, synthesize answers
 * using the full source file as context material.
 */
export async function contextGenerate(
    unmatchedQuestions: AnsweredQuestion[],
    sourceEntries: SourceEntry[],
    orgProfile: OrgProfile,
    aiGenerateContent: (prompt: string) => Promise<AIResponse<string>>,
    userId: string = 'authenticated-user',
    modelName: string = 'gemini-1.5-pro',
    onProgress?: (processed: number, total: number) => void,
): Promise<AnsweredQuestion[]> {
    const toGenerate = unmatchedQuestions.filter(q => q.source === 'manual');
    if (toGenerate.length === 0) return unmatchedQuestions;

    // Batch (max 10 per batch)
    const batches: AnsweredQuestion[][] = [];
    for (let i = 0; i < toGenerate.length; i += 10) {
        batches.push(toGenerate.slice(i, i + 10));
    }

    const generated = new Map<number, AnsweredQuestion>();
    let processedCount = 0;

    for (const batch of batches) {
        const prompt = buildContextPrompt(batch, sourceEntries, orgProfile);

        try {
            const response = await aiGenerateContent(prompt);

            if (response.usage) {
                await TokenTracker.trackUsage({
                    userId,
                    model: modelName as AIModel,
                    actionType: 'CAIQ_SCAN',
                    promptTokens: response.usage.promptTokens,
                    completionTokens: response.usage.completionTokens,
                });
            }

            const parsed = parseAIResponse(response.data);
            for (const item of parsed) {
                const original = batch.find(q => q.rowIndex === item.rowIndex);
                if (original && item.answer && item.answer.length > 5) {
                    generated.set(item.rowIndex, {
                        ...original,
                        answer: item.answer,
                        yesNo: item.yesNo,
                        confidence: 'low',
                        source: 'context',
                        evidenceRef: item.evidenceRef || '',
                    });
                }
            }
        } catch (error) {
            console.error('[CAIQ Context] Batch error:', error);
        }

        processedCount += batch.length;
        if (onProgress) onProgress(processedCount, toGenerate.length);
    }

    return unmatchedQuestions.map(q => generated.get(q.rowIndex) || q);
}

// ────────────────────────────────────────────
// Legacy enhanceWithAI (kept for backward compat)
// ────────────────────────────────────────────

export async function enhanceWithAI(
    questions: AnsweredQuestion[],
    orgProfile: OrgProfile,
    aiGenerateContent: (prompt: string) => Promise<AIResponse<string>>,
    userId: string = 'authenticated-user',
    modelName: string = 'gemini-1.5-pro',
    onBatchProgress?: (batchIndex: number, totalBatches: number, processedCount: number) => void,
): Promise<AnsweredQuestion[]> {
    const toEnhance = questions.filter(q => q.source === 'manual' || q.confidence === 'low');
    if (toEnhance.length === 0) return questions;

    // Tier 4: Fetch Knowledge Repository Context dynamically for AI reference
    let repoContext = '';
    try {
        const prisma = (await import('@/lib/prisma')).default;
        // Fetch a broad cross-section of approved answers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entries = await (prisma as any).knowledgeEntry.findMany({
            where: { approvedAt: { not: null } },
            orderBy: { usageCount: 'desc' },
            take: 80 // enough for solid context without blowing up token limit
        });
         
        repoContext = entries.map((e: { questionText?: string, answerText?: string }) => `Q: ${e.questionText}\nA: ${e.answerText}`).join('\n\n');
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _e = e;
        console.warn('[CAIQ Engine] Failed to fetch repo context for Tier 4 AI synthesis');
    }

    const batches: AnsweredQuestion[][] = [];
    for (let i = 0; i < toEnhance.length; i += 15) {
        batches.push(toEnhance.slice(i, i + 15));
    }

    const enhanced = new Map<number, AnsweredQuestion>();
    let processedCount = 0;

    for (let bi = 0; bi < batches.length; bi++) {
        const batch = batches[bi];
        const prompt = buildDynamicAIPrompt(batch, orgProfile, repoContext);

        try {
            const response = await aiGenerateContent(prompt);
            if (response.usage) {
                await TokenTracker.trackUsage({
                    userId,
                    model: modelName as AIModel,
                    actionType: 'CAIQ_SCAN',
                    promptTokens: response.usage.promptTokens,
                    completionTokens: response.usage.completionTokens,
                });
            }

            const parsed = parseAIResponse(response.data);
            for (const item of parsed) {
                const original = batch.find(q => q.rowIndex === item.rowIndex);
                if (original) {
                    enhanced.set(item.rowIndex, {
                        ...original,
                        answer: item.answer,
                        yesNo: item.yesNo,
                        confidence: 'medium',
                        source: 'context', // Contextual generation
                        evidenceRef: item.evidenceRef || original.evidenceRef,
                    });
                }
            }
        } catch (error) {
            console.error('[CAIQ AI] Tier 4 Batch processing error:', error);
        }

        processedCount += batch.length;
        if (onBatchProgress) onBatchProgress(bi, batches.length, processedCount);
    }

    return questions.map(q => enhanced.get(q.rowIndex) || q);
}

// ────────────────────────────────────────────
// Prompt Builders
// ────────────────────────────────────────────

function buildSemanticPrompt(
    targetQuestions: AnsweredQuestion[],
    sourceEntries: SourceEntry[],
    profile: OrgProfile,
): string {
    // Include top 50 source Q&A pairs (or all if fewer)
    const sourceContext = sourceEntries.slice(0, 50).map(se =>
        `[SRC-${se.rowIndex}] Q: ${se.questionText}\n   A: ${se.answerText}${se.yesNo ? ` (${se.yesNo})` : ''}`
    ).join('\n\n');

    const targetText = targetQuestions.map(q =>
        `[ROW:${q.rowIndex}] ${q.questionText}`
    ).join('\n');

    return `You are a cybersecurity compliance expert. You have a SOURCE questionnaire with answered questions, and you need to find SEMANTIC MATCHES for target questions.

A semantic match means the source question asks about the SAME topic or control, even if worded differently.
Example: "Do you encrypt data at rest?" semantically matches "What encryption mechanisms protect stored data?"

ORGANIZATION PROFILE:
- Industry: ${profile.industry || 'Technology'}
- Certifications: ${profile.certifications.join(', ') || 'SOC 2 Type II, ISO 27001'}

SOURCE QUESTIONNAIRE (already answered):
${sourceContext}

TARGET QUESTIONS (need answers):
${targetText}

For each target question, find the best semantic match from the source. If a good match exists, ADAPT the source answer to fit the target question's specific wording. If no reasonable match exists, leave the answer empty.

RESPOND IN THIS EXACT JSON FORMAT (array of objects):
[
  {
    "rowIndex": <number>,
    "yesNo": "Yes" | "No" | "N/A",
    "answer": "<adapted answer from source, or empty string if no match>",
    "evidenceRef": "<evidence reference>"
  }
]

Respond ONLY with the JSON array. No explanation.`;
}

function buildContextPrompt(
    targetQuestions: AnsweredQuestion[],
    sourceEntries: SourceEntry[],
    profile: OrgProfile,
): string {
    // Use ALL source entries as context material
    const sourceContext = sourceEntries.map(se =>
        `Q: ${se.questionText}\nA: ${se.answerText}`
    ).join('\n\n');

    const targetText = targetQuestions.map(q =>
        `[ROW:${q.rowIndex}] ${q.questionText}`
    ).join('\n');

    return `You are a cybersecurity compliance expert. Using the REFERENCE MATERIAL below (from a completed questionnaire), synthesize professional answers for NEW questions that have no direct match.

Use the reference material to understand the organization's security posture, controls, and practices, then craft appropriate answers for the new questions.

ORGANIZATION PROFILE:
- Industry: ${profile.industry || 'Technology'}
- Certifications: ${profile.certifications.join(', ') || 'SOC 2 Type II, ISO 27001'}
- Size: ${profile.orgSize || 'Mid-size (500-5000 employees)'}
- Cloud: ${profile.cloudProvider || 'AWS/Azure'}
- Context: ${profile.additionalContext || 'N/A'}

REFERENCE MATERIAL (from completed questionnaire):
${sourceContext}

NEW QUESTIONS TO ANSWER:
${targetText}

For each question, provide a professional 2-4 sentence answer consistent with the organization's posture shown in the reference material. Reference specific controls, tools, or processes mentioned in the reference material.

RESPOND IN THIS EXACT JSON FORMAT (array of objects):
[
  {
    "rowIndex": <number>,
    "yesNo": "Yes" | "No" | "N/A",
    "answer": "<synthesized answer>",
    "evidenceRef": "<evidence document references>"
  }
]

Respond ONLY with the JSON array. No explanation.`;
}

function buildDynamicAIPrompt(questions: AnsweredQuestion[], profile: OrgProfile, repoContext: string): string {
    const questionsText = questions.map(q =>
        `[ROW:${q.rowIndex}] ${q.questionText}`
    ).join('\n');

    return `You are a Tier 4 AI Synthesizer completing a vendor risk questionnaire.
Your goal is to answer the target questions by synthesizing information from the Organization Profile and the existing Knowledge Repository Context.

ORGANIZATION PROFILE:
- Industry: ${profile.industry || 'Technology'}
- Certifications: ${profile.certifications.join(', ') || 'SOC 2 Type II, ISO 27001'}
- Cloud Provider: ${profile.cloudProvider || 'AWS/Azure'}

KNOWLEDGE REPOSITORY CONTEXT (use this to base your answers on actual company posture):
${repoContext ? repoContext : 'No specific context provided. Rely on standard enterprise best practices aligned to the certifications.'}

For each question below, provide a professional, detailed answer (2-4 sentences) that aligns with the organization's posture. 

QUESTIONS:
${questionsText}

RESPOND IN THIS EXACT JSON FORMAT (array of objects):
[
  {
    "rowIndex": <number>,
    "yesNo": "Yes" | "No" | "N/A",
    "answer": "<detailed answer>",
    "evidenceRef": "<evidence reference>"
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
        console.error('[CAIQ AI] Failed to parse AI response');
        return [];
    }
}

// ────────────────────────────────────────────
// Results Aggregation
// ────────────────────────────────────────────

export function computeResults(questions: AnsweredQuestion[]): CAIQProcessingResult {
    const answeredByA2A = questions.filter(q => q.source === 'a2a').length;
    const answeredBySemantic = questions.filter(q => q.source === 'semantic').length;
    const answeredByContext = questions.filter(q => q.source === 'context').length;
    const answered = answeredByA2A + answeredBySemantic + answeredByContext;
    const unanswered = questions.length - answered;

    // Domain breakdown
    const domainBreakdown: Record<string, { total: number; answered: number; pct: number }> = {};

    for (const q of questions) {
        // Infer domain from question ID or default to 'General'
        let domain = 'General';
        if (q.questionId) {
            const prefix = q.questionId.split('-')[0]?.toUpperCase();
            if (prefix) domain = prefix;
        }

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
        answeredByA2A,
        answeredBySemantic,
        answeredByContext,
        unanswered,
        coveragePct: questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0,
        questions,
        domainBreakdown,
    };
}

// ────────────────────────────────────────────
// Excel Export
// ────────────────────────────────────────────

export async function exportToExcel(result: CAIQProcessingResult): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();

    // Answers sheet
    const wsAnswers = wb.addWorksheet('Answers');
    wsAnswers.columns = [
        { header: 'Question ID', key: 'questionId', width: 12 },
        { header: 'Question', key: 'question', width: 60 },
        { header: 'Yes/No', key: 'yesNo', width: 8 },
        { header: 'Answer', key: 'answer', width: 80 },
        { header: 'Confidence', key: 'confidence', width: 12 },
        { header: 'Match Tier', key: 'source', width: 15 },
        { header: 'Evidence Reference', key: 'evidence', width: 40 },
    ];
    result.questions.forEach(q => {
        const tierLabel = q.source === 'a2a' ? 'A-to-A Match'
            : q.source === 'semantic' ? 'Semantic Match'
                : q.source === 'context' ? 'Context Synthesis'
                    : 'Manual';
        wsAnswers.addRow({
            questionId: q.questionId || '',
            question: q.questionText,
            yesNo: q.yesNo,
            answer: q.answer,
            confidence: q.confidence,
            source: tierLabel,
            evidence: q.evidenceRef || '',
        });
    });

    // Summary sheet
    const wsSummary = wb.addWorksheet('Summary');
    wsSummary.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 15 },
    ];
    wsSummary.addRow({ metric: 'Total Questions', value: result.totalQuestions });
    wsSummary.addRow({ metric: 'Tier 1: A-to-A Matched', value: result.answeredByA2A });
    wsSummary.addRow({ metric: 'Tier 2: Semantic Matched', value: result.answeredBySemantic });
    wsSummary.addRow({ metric: 'Tier 3: Context Synthesized', value: result.answeredByContext });
    wsSummary.addRow({ metric: 'Unanswered (Manual Required)', value: result.unanswered });
    wsSummary.addRow({ metric: 'Coverage %', value: `${result.coveragePct}%` });

    // Domain breakdown sheet
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

// ────────────────────────────────────────────
// CAIQAnswerEngine class wrapper (used by assess/route.ts)
// ────────────────────────────────────────────

import type {
    CAIQAnswer,
    CAIQAnswerSet,
    CAIQStats,
    CAIQDomain as TypesDomain,
    ConfidenceTier,
    CAIQGeneratedBy,
    CAIQAnswerType,
    OrganizationContext,
} from './types';
import { CAIQ_DOMAINS as DOMAIN_LIST } from './types';
import type { KBEntryView } from './caiq-knowledge-base';
import type { UnifiedAIProvider } from '@/lib/ai/engine';

interface EngineOptions {
    semanticMatchThreshold?: number;
    exactMatchConfidence?: number;
    aiTemperature?: number;
}

interface GenerateOptions {
    includeEvidence?: boolean;
    autoApproveThreshold?: number;
    flagThreshold?: number;
    onProgress?: (current: number, total: number, lastAnswer: CAIQAnswer) => void;
}

function toCAIQAnswer(aq: AnsweredQuestion, idx: number): CAIQAnswer {
    const tierMap: Record<string, ConfidenceTier> = {
        a2a: 'EXACT_MATCH',
        semantic: 'SEMANTIC_MATCH',
        context: 'AI_GENERATED',
        manual: 'FLAGGED',
    };
    const generatedByMap: Record<string, CAIQGeneratedBy> = {
        a2a: 'KB_EXACT',
        semantic: 'KB_SEMANTIC',
        context: 'AI_PRIMARY',
        manual: 'HUMAN',
    };
    const answerTypeMap: Record<string, CAIQAnswerType> = {
        Yes: 'YES',
        No: 'NO',
        'N/A': 'NOT_APPLICABLE',
        '': 'NOT_APPLICABLE',
    };

    const confidence =
        aq.confidence === 'high' ? 0.95 : aq.confidence === 'medium' ? 0.75 : 0.4;

    return {
        questionId: aq.questionId ?? `Q-${idx}`,
        answer: aq.answer || '',
        answerType: answerTypeMap[aq.yesNo] ?? 'NOT_APPLICABLE',
        confidence,
        tier: tierMap[aq.source] ?? 'FLAGGED',
        sources: aq.matchedEntryId ? [aq.matchedEntryId] : [],
        evidenceRefs: aq.evidenceRef ? [aq.evidenceRef] : [],
        frameworkRefs: [],
        needsReview: confidence < 0.6 || aq.source === 'manual',
        auditId: `audit-${Date.now()}-${idx}`,
        generatedAt: new Date().toISOString(),
        generatedBy: generatedByMap[aq.source] ?? 'HUMAN',
    };
}

export class CAIQAnswerEngine {
    private kb: KBEntryView[];
    private ai: UnifiedAIProvider;
    private orgContext: OrganizationContext;
    private options: EngineOptions;

    constructor(
        kb: KBEntryView[],
        ai: UnifiedAIProvider,
        orgContext: OrganizationContext,
        options: EngineOptions = {},
    ) {
        this.kb = kb;
        this.ai = ai;
        this.orgContext = orgContext;
        this.options = options;
    }

    async generateAnswers(
        questions: { id: string; domain: TypesDomain; text: string }[],
        opts: GenerateOptions = {},
    ): Promise<CAIQAnswerSet> {
        // Convert ParsedCAIQQuestion[] to QuestionnaireQuestion[] for existing matchers
        const qqList: QuestionnaireQuestion[] = questions.map((q, i) => ({
            rowIndex: i,
            questionId: q.id,
            questionText: q.text,
        }));

        // Tier 1: match against KB
        const kbEntries: SourceEntry[] = this.kb.map((e, i) => ({
            rowIndex: i,
            questionId: e.questionId,
            questionText: e.question,
            answerText: e.answer,
            yesNo: e.yesNo,
        }));

        const minConf = Math.round((this.options.semanticMatchThreshold ?? 0.4) * 100);
        const answered = matchToSource(qqList, kbEntries, minConf);

        // Convert to CAIQAnswer[]
        const caiqAnswers: CAIQAnswer[] = answered.map((aq, i) => toCAIQAnswer(aq, i));

        // Fire progress callbacks
        if (opts.onProgress) {
            for (let i = 0; i < caiqAnswers.length; i++) {
                opts.onProgress(i + 1, caiqAnswers.length, caiqAnswers[i]);
            }
        }

        const stats = this.computeStats(caiqAnswers, questions);
        return { answers: caiqAnswers, stats };
    }

    private computeStats(
        answers: CAIQAnswer[],
        questions: { id: string; domain: TypesDomain; text: string }[],
    ): CAIQStats {
        const high = answers.filter(a => a.confidence >= 0.8).length;
        const medium = answers.filter(a => a.confidence >= 0.5 && a.confidence < 0.8).length;
        const low = answers.filter(a => a.confidence < 0.5).length;
        const flagged = answers.filter(a => a.tier === 'FLAGGED').length;
        const answered = answers.filter(a => a.answer.length > 0 && a.tier !== 'FLAGGED').length;

        const coverageByDomain = {} as Record<TypesDomain, { answered: number; total: number }>;
        for (const d of DOMAIN_LIST) {
            const domainQs = questions.filter(q => q.domain === d);
            const domainAs = answers.filter(
                (a, i) => questions[i]?.domain === d && a.answer.length > 0 && a.tier !== 'FLAGGED',
            );
            coverageByDomain[d] = { answered: domainAs.length, total: domainQs.length };
        }

        return {
            total: answers.length,
            highConfidence: high,
            mediumConfidence: medium,
            lowConfidence: low,
            flagged,
            estimatedAccuracy: answers.length > 0 ? answered / answers.length : 0,
            coverageByDomain,
        };
    }
}
