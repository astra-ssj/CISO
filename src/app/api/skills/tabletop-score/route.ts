import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionOrInternal } from '@/lib/api/require-session';
import { runTabletopScore } from '@/lib/skills/tabletop-score';
import { persistSkillRun } from '@/lib/skills/persist';

const bodySchema = z.object({
    scenario: z.object({ id: z.string(), slug: z.string(), title: z.string() }),
    state: z.object({
        sessionId: z.string(),
        scenarioSlug: z.string(),
        mode: z.enum(['decision', 'discussion']),
        currentStep: z.number(),
        dollars: z.number(),
        repInternal: z.number(),
        repExternal: z.number(),
        decisions: z.record(z.string(), z.unknown()),
        responses: z.record(z.string(), z.string()),
        commsDrafts: z.record(z.string(), z.string()),
        history: z.array(z.object({
            stepId: z.number(),
            time: z.string(),
            title: z.string(),
            choiceId: z.string(),
            choiceLabel: z.string(),
            role: z.string(),
            dollars: z.number(),
            repInt: z.number(),
            repExt: z.number(),
            consequence: z.string(),
            confidence: z.enum(['low', 'medium', 'high']),
        })),
    }),
});

export async function POST(req: Request) {
    const { error } = await requireSessionOrInternal(req);
    if (error) return error;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    const run = runTabletopScore(parsed.data as Parameters<typeof runTabletopScore>[0], new Date().toISOString());
    const runId = await persistSkillRun(run);
    return NextResponse.json({ skillId: run.skillId, skillVersion: run.skillVersion, inputHash: run.inputHash, asOf: run.asOf, runId, score: run.output });
}
