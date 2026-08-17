import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/api/require-session';
import { runCaiqScore } from '@/lib/skills/caiq-score';
import { persistSkillRun } from '@/lib/skills/persist';

const bodySchema = z.object({
    hits: z.array(z.object({
        entryId: z.string().nullable(),
        confidence: z.enum(['high', 'medium', 'low']),
        matchTier: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    })).max(5000),
});

/** POST /api/skills/caiq-score — coverage from caiq.match hits. No LLM. */
export async function POST(req: Request) {
    const { error } = await requireSession();
    if (error) return error;

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const run = runCaiqScore(parsed.data, new Date().toISOString());
    const runId = await persistSkillRun(run);

    return NextResponse.json({
        skillId: run.skillId,
        skillVersion: run.skillVersion,
        inputHash: run.inputHash,
        asOf: run.asOf,
        runId,
        score: run.output,
    });
}
