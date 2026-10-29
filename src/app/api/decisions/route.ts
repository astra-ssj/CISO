import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requirePermission, requireSession } from '@/lib/api/require-session';

const createDecisionSchema = z.object({
    pillar: z.string().min(1).max(64),
    urgency: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
    title: z.string().min(1).max(512),
    question: z.string().min(1).max(2048),
    context: z.string().max(32000).optional(),
    recommendationAction: z.string().min(1).max(128),
    recommendationSummary: z.string().min(1).max(4096),
    recommendationRationale: z.string().max(16000).optional(),
    confidenceValue: z.number().int().min(0).max(100).optional(),
    confidenceLabel: z.string().max(64).optional(),
    source: z.enum(['SKILL', 'AI_DRAFT', 'HUMAN']).optional(),
    skillRunId: z.string().optional(),
    sourceResourceType: z.string().max(64).optional(),
    sourceResourceId: z.string().max(256).optional(),
    evidenceIds: z.array(z.string()).max(1000).optional(),
    executionType: z.string().max(64).optional(),
    executionPayload: z.record(z.string(), z.unknown()).optional(),
    expiresAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
    const { error } = await requireSession();
    if (error) return error;

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 100), 1), 500);

    const decisions = await prisma.decision.findMany({
        where: status ? { status } : undefined,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: limit,
    });

    return NextResponse.json({ decisions });
}

export async function POST(req: Request) {
    const { error } = await requirePermission('decision:create');
    if (error) return error;

    const parsed = createDecisionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid decision body', details: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data;
    const decision = await prisma.decision.create({
        data: {
            pillar: input.pillar,
            urgency: input.urgency,
            title: input.title,
            question: input.question,
            context: input.context ?? '',
            recommendationAction: input.recommendationAction,
            recommendationSummary: input.recommendationSummary,
            recommendationRationale: input.recommendationRationale ?? '',
            confidenceValue: input.confidenceValue ?? 0,
            confidenceLabel: input.confidenceLabel ?? 'UNSCORED',
            source: input.source ?? 'HUMAN',
            skillRunId: input.skillRunId ?? null,
            sourceResourceType: input.sourceResourceType ?? null,
            sourceResourceId: input.sourceResourceId ?? null,
            evidenceIds: JSON.stringify(input.evidenceIds ?? []),
            executionType: input.executionType ?? null,
            executionPayload: input.executionPayload ? JSON.stringify(input.executionPayload) : null,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
    });

    return NextResponse.json(decision, { status: 201 });
}
