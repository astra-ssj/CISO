/**
 * CAIQ Source-to-Target Knowledge Transfer Engine
 *
 * 3-tier matching pipeline:
 *   Tier 1: Direct ID + high text-overlap match
 *   Tier 2: AI semantic matching & answer adaptation
 *   Tier 3: AI-generated answers from source context
 *
 * Target: 95% auto-fill accuracy with HITL review.
 */

import ExcelJS from 'exceljs';

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
    matchedSourceId: string;     // Source question ID that was matched
    matchedSourceQuestion: string;
    isAdapted: boolean;          // Was the answer rephrased?
    isAmbiguous: boolean;        // Flagged for review
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

// ────────────────────────────────────────────
// Source File Parser
// ────────────────────────────────────────────

/**
 * Parse an answered Excel file and extract all Q&A pairs.
 * Scans for question + answer columns using header detection
 * and text-length heuristics.
 */
/** Row of cells (string or empty); from Excel 1-based values slice(1). */
type ExcelCellRow = (string | number | null | undefined)[];

export async function parseSourceFile(buffer: ArrayBuffer): Promise<SourceQA[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(buffer) as unknown as Parameters<ExcelJS.Workbook['xlsx']['load']>[0]);

    for (const worksheet of workbook.worksheets) {
        const rows: ExcelCellRow[] = [];
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            const raw = row.values as unknown;
            const arr = Array.isArray(raw) ? raw.slice(1) : [];
            rows.push(
                arr.map((c: unknown): string | number | null | undefined =>
                    c === null || c === undefined ? '' : (c as string | number)
                )
            );
        });

        if (rows.length < 2) continue;
        const result = extractSourceQAs(rows);
        if (result.length > 0) return result;
    }

    return [];
}

function extractSourceQAs(rows: ExcelCellRow[]): SourceQA[] {
    const questionKw = ['question', 'control question', 'caiq', 'requirement', 'description',
        'security question', 'assessment question', 'control specification',
        'control objective', 'control activity', 'criteria', 'query'];
    const answerKw = ['answer', 'response', 'reply', 'implementation', 'details',
        'explanation', 'notes', 'comments', 'description of implementation',
        'control response', 'csp response', 'organization response'];
    const idKw = ['id', 'control id', 'question id', 'ref', 'reference', '#', 'ccm', 'number'];
    const yesNoKw = ['yes/no', 'y/n', 'yes / no', 'applicable', 'compliance', 'status', 'conform'];

    // Scan first 15 rows for header row
    const maxScan = Math.min(rows.length, 15);
    for (let h = 0; h < maxScan; h++) {
        const cells = rows[h].map((c: string | number | null | undefined) => String(c ?? '').toLowerCase().trim());
        const nonEmpty = cells.filter(c => c.length > 0);
        if (nonEmpty.length < 2) continue;

        let qCol = -1, aCol = -1, idCol = -1, ynCol = -1;

        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            if (!c) continue;
            if (qCol === -1 && questionKw.some(kw => c.includes(kw))) qCol = i;
            if (aCol === -1 && answerKw.some(kw => c.includes(kw))) aCol = i;
            if (idCol === -1 && idKw.some(kw => c === kw || c.includes(kw))) idCol = i;
            if (ynCol === -1 && yesNoKw.some(kw => c.includes(kw))) ynCol = i;
        }

        // If we found question + answer columns — extract
        if (qCol !== -1 && aCol !== -1) {
            return collectSourceQAs(rows, h + 1, qCol, aCol, idCol, ynCol);
        }

        // If we only found question header, use the next wide-text column as answer
        if (qCol !== -1) {
            aCol = findWideTextColumn(rows, h + 1, qCol);
            if (aCol !== -1) return collectSourceQAs(rows, h + 1, qCol, aCol, idCol, ynCol);
        }
    }

    // Fallback: heuristic — find 2 columns with long text
    return heuristicExtractQAs(rows);
}

function collectSourceQAs(
    rows: ExcelCellRow[],
    startRow: number,
    qCol: number,
    aCol: number,
    idCol: number,
    ynCol: number
): SourceQA[] {
    const results: SourceQA[] = [];
    for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const questionText = String(row[qCol] ?? '').trim();
        const answer = String(row[aCol] ?? '').trim();
        if (questionText.length < 5 || answer.length < 3) continue;

        results.push({
            rowIndex: i,
            questionId: idCol >= 0 ? String(row[idCol] ?? '').trim() : `SRC-${i}`,
            questionText,
            answer,
            yesNo: ynCol >= 0 ? String(row[ynCol] ?? '').trim() : inferYesNo(answer),
        });
    }
    return results;
}

function findWideTextColumn(rows: ExcelCellRow[], startRow: number, excludeCol: number): number {
    const sampleEnd = Math.min(rows.length, startRow + 20);
    const colCount = Math.max(...rows.slice(startRow, sampleEnd).map(r => r.length));
    let bestCol = -1, bestAvg = 0;

    for (let col = 0; col < colCount; col++) {
        if (col === excludeCol) continue;
        const sample = rows.slice(startRow, sampleEnd);
        const lengths = sample.map(r => String(r?.[col] ?? '').trim().length);
        const nonZero = lengths.filter(l => l > 0);
        const avg = nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
        if (avg > bestAvg) { bestAvg = avg; bestCol = col; }
    }

    return bestAvg > 15 ? bestCol : -1;
}

function heuristicExtractQAs(rows: ExcelCellRow[]): SourceQA[] {
    const colCount = Math.max(...rows.slice(0, 30).map(r => r?.length || 0));
    const avgLengths: { col: number; avg: number }[] = [];

    for (let col = 0; col < colCount; col++) {
        const sample = rows.slice(1, 30);
        const lengths = sample.map(r => String(r?.[col] ?? '').trim().length).filter(l => l > 0);
        const avg = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
        avgLengths.push({ col, avg });
    }

    avgLengths.sort((a, b) => b.avg - a.avg);
    if (avgLengths.length < 2 || avgLengths[0].avg < 20) return [];

    const qCol = avgLengths[0].col;
    const aCol = avgLengths[1].col;

    return collectSourceQAs(rows, 1, qCol, aCol, -1, -1);
}

function inferYesNo(answer: string): string {
    const lower = answer.toLowerCase().trim();
    if (lower.startsWith('yes')) return 'Yes';
    if (lower.startsWith('no')) return 'No';
    if (lower.includes('not applicable') || lower.includes('n/a')) return 'N/A';
    return 'Yes'; // Default for detailed answers
}

// ────────────────────────────────────────────
// Target File Parser
// ────────────────────────────────────────────

/**
 * Parse an empty/unanswered questionnaire to extract questions.
 * Reuses the same parsing logic from caiq-answer-engine.
 */
export async function parseTargetFile(buffer: ArrayBuffer): Promise<TargetQuestion[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(buffer) as unknown as Parameters<ExcelJS.Workbook['xlsx']['load']>[0]);

    for (const worksheet of workbook.worksheets) {
        const rows: ExcelCellRow[] = [];
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            const raw = row.values as unknown;
            const arr = Array.isArray(raw) ? raw.slice(1) : [];
            rows.push(
                arr.map((c: unknown): string | number | null | undefined =>
                    c === null || c === undefined ? '' : (c as string | number)
                )
            );
        });

        if (rows.length < 2) continue;
        const result = extractTargetQuestions(rows);
        if (result.length > 0) return result;
    }

    return [];
}

function extractTargetQuestions(rows: ExcelCellRow[]): TargetQuestion[] {
    const questionKw = ['question', 'control question', 'caiq', 'requirement', 'description',
        'security question', 'assessment question', 'control specification',
        'control objective', 'control activity', 'criteria', 'query'];
    const idKw = ['id', 'control id', 'question id', 'ref', 'reference', '#', 'ccm', 'number'];

    const maxScan = Math.min(rows.length, 15);
    for (let h = 0; h < maxScan; h++) {
        const cells = rows[h].map((c: string | number | null | undefined) => String(c ?? '').toLowerCase().trim());
        const nonEmpty = cells.filter(c => c.length > 0);
        if (nonEmpty.length < 2) continue;

        let qCol = -1, idCol = -1;

        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            if (!c) continue;
            if (qCol === -1 && questionKw.some(kw => c.includes(kw))) qCol = i;
            if (idCol === -1 && idKw.some(kw => c === kw || c.includes(kw))) idCol = i;
        }

        if (qCol !== -1) {
            const qs: TargetQuestion[] = [];
            for (let i = h + 1; i < rows.length; i++) {
                const text = String(rows[i]?.[qCol] ?? '').trim();
                if (text.length < 5) continue;
                qs.push({
                    rowIndex: i,
                    questionId: idCol >= 0 ? String(rows[i][idCol] ?? '').trim() : `TRG-${i}`,
                    questionText: text,
                });
            }
            if (qs.length > 0) return qs;
        }
    }

    // Fallback: longest-text column
    const colCount = Math.max(...rows.slice(0, 30).map(r => r?.length || 0));
    let bestCol = 0, bestAvg = 0;
    for (let col = 0; col < colCount; col++) {
        const sample = rows.slice(1, 30);
        const lengths = sample.map(r => String(r?.[col] ?? '').trim().length).filter(l => l > 0);
        const avg = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
        if (avg > bestAvg) { bestAvg = avg; bestCol = col; }
    }

    if (bestAvg > 20) {
        const qs: TargetQuestion[] = [];
        for (let i = 1; i < rows.length; i++) {
            const text = String(rows[i]?.[bestCol] ?? '').trim();
            if (text.length < 10) continue;
            qs.push({ rowIndex: i, questionId: `TRG-${i}`, questionText: text });
        }
        return qs;
    }

    return [];
}

// ────────────────────────────────────────────
// Tier 1: Direct ID + Text Overlap Match
// ────────────────────────────────────────────

interface SourceIndex {
    byId: Map<string, SourceQA>;
    all: SourceQA[];
}

function buildSourceIndex(sources: SourceQA[]): SourceIndex {
    const byId = new Map<string, SourceQA>();
    for (const s of sources) {
        if (s.questionId) byId.set(s.questionId.toLowerCase().trim(), s);
    }
    return { byId, all: sources };
}

function textOverlapScore(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let overlap = 0;
    for (const w of wordsA) {
        if (wordsB.has(w)) overlap++;
    }
    return (overlap / Math.max(wordsA.size, wordsB.size)) * 100;
}

function tier1Match(
    index: SourceIndex,
    targets: TargetQuestion[]
): { matched: TransferredAnswer[]; unmatched: TargetQuestion[] } {
    const matched: TransferredAnswer[] = [];
    const unmatched: TargetQuestion[] = [];

    for (const t of targets) {
        // Try exact ID match first
        const idKey = t.questionId.toLowerCase().trim();
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
            continue;
        }

        // Try text overlap
        let bestSource: SourceQA | null = null;
        let bestScore = 0;

        for (const s of index.all) {
            const score = textOverlapScore(t.questionText, s.questionText);
            if (score > bestScore) { bestScore = score; bestSource = s; }
        }

        if (bestSource && bestScore >= 65) {
            matched.push({
                targetRowIndex: t.rowIndex,
                targetQuestionId: t.questionId,
                targetQuestionText: t.questionText,
                answer: bestSource.answer,
                yesNo: bestSource.yesNo,
                tier: 'tier1',
                confidence: Math.round(bestScore),
                matchedSourceId: bestSource.questionId,
                matchedSourceQuestion: bestSource.questionText,
                isAdapted: false,
                isAmbiguous: bestScore < 80,
                reviewStatus: bestScore >= 80 ? 'approved' : 'pending',
                evidenceRef: '',
            });
        } else {
            unmatched.push(t);
        }
    }

    return { matched, unmatched };
}

// ────────────────────────────────────────────
// Tier 2: AI Semantic Matching & Adaptation
// ────────────────────────────────────────────

async function tier2Match(
    sourceQAs: SourceQA[],
    unmatchedTargets: TargetQuestion[],
    aiGenerate: (prompt: string) => Promise<string>,
): Promise<{ matched: TransferredAnswer[]; unmatched: TargetQuestion[] }> {
    if (unmatchedTargets.length === 0) return { matched: [], unmatched: [] };

    const matched: TransferredAnswer[] = [];
    const stillUnmatched: TargetQuestion[] = [];

    // Process in batches of 10
    const batches: TargetQuestion[][] = [];
    for (let i = 0; i < unmatchedTargets.length; i += 10) {
        batches.push(unmatchedTargets.slice(i, i + 10));
    }

    // Build condensed source reference (max 50 entries to stay within context)
    const sourceRef = sourceQAs.slice(0, 50).map(s =>
        `[${s.questionId}] Q: ${s.questionText}\nA: ${s.answer}`
    ).join('\n---\n');

    for (const batch of batches) {
        const targetList = batch.map(t =>
            `[TARGET:${t.rowIndex}|${t.questionId}] ${t.questionText}`
        ).join('\n');

        const prompt = `You are a cybersecurity compliance expert. You have a SOURCE questionnaire with answered questions and a TARGET questionnaire with unanswered questions.

Your task: For each TARGET question, find the most semantically similar SOURCE question and ADAPT the answer to fit the TARGET question. If the answer needs rephrasing to match the target's specific wording, do so while preserving accuracy and detail.

SOURCE QUESTIONS & ANSWERS (your knowledge base):
${sourceRef}

TARGET QUESTIONS TO ANSWER:
${targetList}

Rules:
1. Match each target to the BEST source question by meaning (not just keywords)
2. ADAPT the answer to directly address the target question's specific wording
3. If no source question is relevant (confidence < 40%), set matchedSourceId to "NONE"
4. Set isAmbiguous to true if the match is uncertain or the adaptation is significant

Respond ONLY with this JSON array:
[
  {
    "targetRowIndex": <number>,
    "targetQuestionId": "<string>",
    "matchedSourceId": "<source question ID or NONE>",
    "yesNo": "Yes" | "No" | "N/A",
    "answer": "<adapted answer>",
    "confidence": <0-100>,
    "isAmbiguous": <boolean>
  }
]`;

        try {
            const response = await aiGenerate(prompt);
            const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleaned) as Array<{
                targetRowIndex: number;
                targetQuestionId: string;
                matchedSourceId: string;
                yesNo: string;
                answer: string;
                confidence: number;
                isAmbiguous: boolean;
            }>;

            for (const item of parsed) {
                const target = batch.find(t => t.rowIndex === item.targetRowIndex);
                if (!target) continue;

                if (item.matchedSourceId === 'NONE' || item.confidence < 40) {
                    stillUnmatched.push(target);
                    continue;
                }

                const source = sourceQAs.find(s => s.questionId === item.matchedSourceId);
                matched.push({
                    targetRowIndex: target.rowIndex,
                    targetQuestionId: target.questionId,
                    targetQuestionText: target.questionText,
                    answer: item.answer,
                    yesNo: item.yesNo || 'Yes',
                    tier: 'tier2',
                    confidence: item.confidence,
                    matchedSourceId: item.matchedSourceId,
                    matchedSourceQuestion: source?.questionText || '',
                    isAdapted: true,
                    isAmbiguous: item.isAmbiguous || item.confidence < 70,
                    reviewStatus: 'pending',
                    evidenceRef: '',
                });
            }
        } catch (error) {
            console.error('[CAIQ Transfer] Tier 2 batch error:', error);
            stillUnmatched.push(...batch);
        }
    }

    return { matched, unmatched: stillUnmatched };
}

// ────────────────────────────────────────────
// Tier 3: AI-Generated Answers from Context
// ────────────────────────────────────────────

async function tier3Generate(
    sourceQAs: SourceQA[],
    remainingTargets: TargetQuestion[],
    aiGenerate: (prompt: string) => Promise<string>,
): Promise<TransferredAnswer[]> {
    if (remainingTargets.length === 0) return [];

    const results: TransferredAnswer[] = [];

    // Build a summary of what the source organization looks like
    const orgSummary = sourceQAs.slice(0, 20).map(s => `${s.questionId}: ${s.answer.slice(0, 150)}`).join('\n');

    const targetList = remainingTargets.map(t =>
        `[TARGET:${t.rowIndex}|${t.questionId}] ${t.questionText}`
    ).join('\n');

    const prompt = `You are a cybersecurity compliance expert. A questionnaire needs to be completed but no direct source answer exists for these questions.

Here is context about how the organization operates, based on their answers to similar questions:
${orgSummary}

Using this organizational context, generate professional, detailed answers for these questions. Each answer should be 2-4 sentences, specific, and reference concrete controls/processes consistent with the organization's maturity level shown above.

QUESTIONS TO ANSWER:
${targetList}

Respond ONLY with this JSON array:
[
  {
    "targetRowIndex": <number>,
    "targetQuestionId": "<string>",
    "yesNo": "Yes" | "No" | "N/A",
    "answer": "<generated answer>",
    "confidence": <0-100, typically 30-60 for generated answers>
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

        for (const item of parsed) {
            const target = remainingTargets.find(t => t.rowIndex === item.targetRowIndex);
            if (!target) continue;

            results.push({
                targetRowIndex: target.rowIndex,
                targetQuestionId: target.questionId,
                targetQuestionText: target.questionText,
                answer: item.answer,
                yesNo: item.yesNo || 'Yes',
                tier: 'tier3',
                confidence: item.confidence || 40,
                matchedSourceId: '',
                matchedSourceQuestion: '',
                isAdapted: false,
                isAmbiguous: true, // Always flag tier3 for review
                reviewStatus: 'flagged',
                evidenceRef: '',
            });
        }
    } catch (error) {
        console.error('[CAIQ Transfer] Tier 3 generation error:', error);
        // Return unmatched placeholders
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
// Orchestrator
// ────────────────────────────────────────────

export async function processTransfer(
    sourceBuffer: ArrayBuffer,
    targetBuffer: ArrayBuffer,
    aiGenerate?: (prompt: string) => Promise<string>,
): Promise<TransferResult> {
    // Step 1: Parse both files
    const sourceQAs = await parseSourceFile(sourceBuffer);
    const targetQs = await parseTargetFile(targetBuffer);

    if (sourceQAs.length === 0) throw new Error('No Q&A pairs found in the source file. Ensure it contains answered questions.');
    if (targetQs.length === 0) throw new Error('No questions found in the target file.');

    console.log(`[CAIQ Transfer] Source: ${sourceQAs.length} Q&As, Target: ${targetQs.length} questions`);

    // Step 2: Build source index
    const index = buildSourceIndex(sourceQAs);

    // Step 3: Tier 1 — Direct matching
    const t1 = tier1Match(index, targetQs);
    console.log(`[CAIQ Transfer] Tier 1: ${t1.matched.length} matched, ${t1.unmatched.length} remaining`);

    const allAnswers = [...t1.matched];
    let remaining = t1.unmatched;

    // Step 4: Tier 2 — AI Semantic (if AI available)
    if (aiGenerate && remaining.length > 0) {
        const t2 = await tier2Match(sourceQAs, remaining, aiGenerate);
        console.log(`[CAIQ Transfer] Tier 2: ${t2.matched.length} matched, ${t2.unmatched.length} remaining`);
        allAnswers.push(...t2.matched);
        remaining = t2.unmatched;

        // Step 5: Tier 3 — AI Generate (remaining)
        if (remaining.length > 0) {
            const t3 = await tier3Generate(sourceQAs, remaining, aiGenerate);
            console.log(`[CAIQ Transfer] Tier 3: ${t3.length} generated`);
            allAnswers.push(...t3);
            remaining = [];
        }
    } else if (remaining.length > 0) {
        // No AI — mark remaining as unmatched
        for (const t of remaining) {
            allAnswers.push({
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

    // Sort by original target row order
    allAnswers.sort((a, b) => a.targetRowIndex - b.targetRowIndex);

    const tier1Count = allAnswers.filter(a => a.tier === 'tier1').length;
    const tier2Count = allAnswers.filter(a => a.tier === 'tier2').length;
    const tier3Count = allAnswers.filter(a => a.tier === 'tier3').length;
    const unmatchedCount = allAnswers.filter(a => a.tier === 'unmatched').length;
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
// Excel Export
// ────────────────────────────────────────────

export async function exportTransferToExcel(result: TransferResult): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();

    // Answers sheet
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

    // Style header
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

        // Color-code by tier
        const fillColor = a.tier === 'tier1' ? 'FFC6F6D5' // green
            : a.tier === 'tier2' ? 'FFFEFCBF' // amber
                : a.tier === 'tier3' ? 'FFFED7AA' // orange
                    : 'FFFED7D7'; // red (unmatched)

        row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        });
    }

    // Summary sheet
    const wsSummary = wb.addWorksheet('Summary');
    wsSummary.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 15 },
    ];
    wsSummary.addRow({ metric: 'Source Questions', value: result.sourceCount });
    wsSummary.addRow({ metric: 'Target Questions', value: result.targetCount });
    wsSummary.addRow({ metric: 'Tier 1 (Direct Match)', value: result.tier1Matches });
    wsSummary.addRow({ metric: 'Tier 2 (AI Semantic)', value: result.tier2Matches });
    wsSummary.addRow({ metric: 'Tier 3 (AI Generated)', value: result.tier3Matches });
    wsSummary.addRow({ metric: 'Unmatched', value: result.unmatched });
    wsSummary.addRow({ metric: 'Coverage %', value: `${result.coveragePct}%` });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
}
