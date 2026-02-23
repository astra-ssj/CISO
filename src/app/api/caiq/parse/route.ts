/**
 * CAIQ Parse API Route — Step 2: Parse & Match
 * 
 * Accepts two files: SOURCE (answered Q&A) + TARGET (empty questionnaire).
 * Runs Tier 1 A-to-A matching instantly (no AI).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    parseQuestionnaire,
    parseSourceFile,
    matchToSource,
    matchToKnowledgeBase,
    computeResults,
} from '@/lib/caiq/caiq-answer-engine';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const targetFile = formData.get('target') as File | null;
        const sourceFile = formData.get('source') as File | null;

        if (!targetFile) {
            return NextResponse.json(
                { error: 'Target questionnaire file is required' },
                { status: 400 }
            );
        }

        // Parse TARGET file (empty questionnaire)
        const targetBuffer = await targetFile.arrayBuffer();
        const targetQuestions = await parseQuestionnaire(targetBuffer);

        if (targetQuestions.length === 0) {
            return NextResponse.json(
                { error: 'No questions found in the target file. Ensure it contains a recognizable questionnaire.' },
                { status: 400 }
            );
        }

        let result;

        if (sourceFile) {
            // ── Dual-file mode: match target against uploaded source ──
            const sourceBuffer = await sourceFile.arrayBuffer();
            const sourceEntries = await parseSourceFile(sourceBuffer);

            if (sourceEntries.length === 0) {
                return NextResponse.json(
                    { error: 'No Q&A pairs found in the source file. Ensure it contains questions and answers.' },
                    { status: 400 }
                );
            }

            // Tier 1: A-to-A matching
            const answeredQuestions = matchToSource(targetQuestions, sourceEntries);
            result = computeResults(answeredQuestions);

            return NextResponse.json({
                result,
                sourceStats: {
                    totalSourceEntries: sourceEntries.length,
                    answeredSourceEntries: sourceEntries.filter(e => e.answerText.length > 0).length,
                },
                mode: 'dual-file',
            });
        } else {
            // ── Fallback: match against built-in CAIQ Knowledge Base ──
            const answeredQuestions = matchToKnowledgeBase(targetQuestions);
            result = computeResults(answeredQuestions);

            return NextResponse.json({
                result,
                sourceStats: null,
                mode: 'knowledge-base',
            });
        }
    } catch (error) {
        console.error('[CAIQ Parse] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to parse questionnaire' },
            { status: 500 }
        );
    }
}
