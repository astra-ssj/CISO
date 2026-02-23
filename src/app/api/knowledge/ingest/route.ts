/**
 * Knowledge Ingest API — Feed completed assessments into the repository
 *
 * POST /api/knowledge/ingest — Bulk ingest from completed CAIQ assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KnowledgeRepository } from '@/lib/knowledge/repository';

const repo = new KnowledgeRepository(prisma as any);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!Array.isArray(body.questions) || body.questions.length === 0) {
            return NextResponse.json(
                { error: 'questions array is required and must not be empty' },
                { status: 400 }
            );
        }

        const source = body.source || body.assessmentName || 'Assessment Import';

        // Transform AnsweredQuestion[] to IngestEntry[]
        const entries = body.questions
            .filter((q: any) => q.answer && q.answer.length > 5 && q.source !== 'manual')
            .map((q: any) => ({
                questionText: q.questionText,
                answerText: q.answer,
                answerType: q.yesNo || 'YES',
                evidence: q.evidenceRef || '',
                domain: q.domain || 'CUSTOM',
                category: q.category || 'General',
                confidence: q.confidence === 'high' ? 1.0
                    : q.confidence === 'medium' ? 0.7
                        : q.confidence === 'low' ? 0.4
                            : typeof q.confidence === 'number' ? q.confidence : 0.7,
            }));

        const result = await repo.bulkIngest(entries, source);

        return NextResponse.json({
            success: true,
            source,
            totalProcessed: body.questions.length,
            created: result.created,
            skipped: result.skipped,
        });
    } catch (error: any) {
        console.error('[Knowledge Ingest API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to ingest knowledge entries' },
            { status: 500 }
        );
    }
}
