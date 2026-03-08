/**
 * Knowledge Ingest API — Feed completed assessments into the repository
 *
 * POST /api/knowledge/ingest — Bulk ingest from completed CAIQ assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KnowledgeRepository } from '@/lib/knowledge/repository';
import { parseBodyWithZod, knowledgeIngestBodySchema, log } from '@/lib/api-validation';

const repo = new KnowledgeRepository(prisma as import('@prisma/client').PrismaClient);


export async function POST(request: NextRequest) {
    try {
        const raw = await request.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, knowledgeIngestBodySchema);
        if ('error' in parsed) return parsed.error;
        const { questions, source, assessmentName } = parsed.data;

        const src = source || assessmentName || 'Assessment Import';

        // Transform AnsweredQuestion[] to IngestEntry[]
        const entries = questions
            .filter((q: Record<string, unknown>) => q.answer && typeof q.answer === 'string' && q.answer.length > 5 && q.source !== 'manual')
            .map((q: Record<string, unknown>) => ({
                questionText: q.questionText as string,
                answerText: q.answer as string,
                answerType: (q.yesNo as string) || 'YES',
                evidence: (q.evidenceRef as string) || '',
                domain: (q.domain as string) || 'CUSTOM',
                category: (q.category as string) || 'General',
                confidence: q.confidence === 'high' ? 1.0
                    : q.confidence === 'medium' ? 0.7
                        : q.confidence === 'low' ? 0.4
                            : typeof q.confidence === 'number' ? q.confidence : 0.7,
            }));

        const result = await repo.bulkIngest(entries, src);

        return NextResponse.json({
            success: true,
            source: src,
            totalProcessed: questions.length,
            created: result.created,
            skipped: result.skipped,
        });
    } catch (err: unknown) {
        const error = err as Error;
        log('error', 'knowledge/ingest/POST', 'Failed to ingest knowledge entries', error);
        return NextResponse.json(
            { error: error.message || 'Failed to ingest knowledge entries' },
            { status: 500 }
        );
    }
}

