import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/api/require-session';
import { runCaiqMatch } from '@/lib/skills/caiq-match';
import { persistSkillRun } from '@/lib/skills/persist';

const bodySchema = z.object({
    questions: z.array(z.object({ questionText: z.string().min(1) })).min(1).max(500),
    entries: z.array(z.object({
        id: z.string(),
        questionNormalized: z.string(),
        keywords: z.string(),
        answerText: z.string(),
        answerType: z.string().optional(),
        evidence: z.string().nullable().optional(),
    })).max(5000),
    minConfidence: z.number().min(0).max(100).optional(),
});

/** POST /api/skills/caiq-match — deterministic skill. No LLM. */
export async function POST(req: Request) {
    const { error } = await requireSession();
    if (error) return error;

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const run = runCaiqMatch(parsed.data, new Date().toISOString());
    await persistSkillRun(run);

    return NextResponse.json({
        skillId: run.skillId,
        skillVersion: run.skillVersion,
        inputHash: run.inputHash,
        asOf: run.asOf,
        hits: run.output,
    });
}
