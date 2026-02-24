/**
 * Knowledge Repository API — List & Create
 *
 * GET  /api/knowledge — Search/list entries with pagination & filters
 * POST /api/knowledge — Create single entry or bulk import
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KnowledgeRepository } from '@/lib/knowledge/repository';
import { parseBodyWithZod, knowledgeCreateBodySchema, log } from '@/lib/api-validation';

const repo = new KnowledgeRepository(prisma as any);


// ─── GET — Search & List ────────────────────

export async function GET(request: NextRequest) {
    try {
        const url = request.nextUrl;
        const filters = {
            query: url.searchParams.get('q') || undefined,
            domain: url.searchParams.get('domain') || undefined,
            category: url.searchParams.get('category') || undefined,
            answerType: url.searchParams.get('answerType') || undefined,
            source: url.searchParams.get('source') || undefined,
            approvedOnly: url.searchParams.get('approved') === 'true',
            jurisdiction: url.searchParams.get('jurisdiction') || undefined,
            tag: url.searchParams.get('tag') || undefined,
            page: parseInt(url.searchParams.get('page') || '1', 10),
            pageSize: Math.min(parseInt(url.searchParams.get('pageSize') || '50', 10), 200),
        };

        // Special mode: stats only
        if (url.searchParams.get('stats') === 'true') {
            const stats = await repo.getStats();
            return NextResponse.json(stats);
        }

        // Special mode: filter options
        if (url.searchParams.get('filters') === 'true') {
            const [domains, categories, sources] = await Promise.all([
                repo.getDistinctDomains(),
                repo.getDistinctCategories(),
                repo.getDistinctSources(),
            ]);
            return NextResponse.json({ domains, categories, sources });
        }

        const result = await repo.searchEntries(filters);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Knowledge API] GET error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch knowledge entries' },
            { status: 500 }
        );
    }
}

// ─── POST — Create / Bulk Import ────────────

export async function POST(request: NextRequest) {
    try {
        const raw = await request.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, knowledgeCreateBodySchema);
        if ('error' in parsed) return parsed.error;
        const body = parsed.data as any;

        // Bulk import mode
        if (Array.isArray(body.entries)) {
            const source = body.source || 'Manual Import';
            const result = await repo.bulkIngest(body.entries, source);
            return NextResponse.json({
                success: true,
                created: result.created,
                skipped: result.skipped,
            });
        }

        // Single entry creation
        const entry = await repo.createEntry({
            questionText: body.questionText,
            answerText: body.answerText,
            answerType: body.answerType || 'YES',
            domain: body.domain || 'CUSTOM',
            category: body.category || 'General',
            evidence: body.evidence,
            source: body.source || 'Manual Entry',
            confidence: body.confidence,
            frameworks: body.frameworks,
            jurisdiction: body.jurisdiction,
            tags: body.tags,
        });

        return NextResponse.json({ success: true, entry }, { status: 201 });
    } catch (error: any) {
        log('error', 'knowledge/POST', 'Failed to create knowledge entry', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create knowledge entry' },
            { status: 500 }
        );
    }
}

