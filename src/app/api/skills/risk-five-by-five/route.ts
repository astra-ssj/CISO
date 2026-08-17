import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionOrInternal } from '@/lib/api/require-session';
import { runFiveByFive } from '@/lib/skills/risk-five-by-five';
import { persistSkillRun } from '@/lib/skills/persist';

const cell = z.number().min(1).max(5);
const bodySchema = z.object({
    likelihood: cell,
    impact: cell,
    residualLikelihood: cell.optional(),
    residualImpact: cell.optional(),
});

/** POST /api/skills/risk-five-by-five — 5×5 inherent/residual. No LLM. */
export async function POST(req: Request) {
    const { error } = await requireSessionOrInternal(req);
    if (error) return error;

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const run = runFiveByFive(parsed.data, new Date().toISOString());
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
