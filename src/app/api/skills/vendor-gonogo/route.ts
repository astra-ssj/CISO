import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionOrInternal } from '@/lib/api/require-session';
import { runGoNoGo } from '@/lib/skills/vendor-gonogo';
import { persistSkillRun } from '@/lib/skills/persist';

const bodySchema = z.object({
    vendorName: z.string().min(1),
    coveragePct: z.number().min(0).max(100),
    riskTier: z.string(),
    shodanRiskScore: z.number().min(0).max(100).nullable(),
    criticalGaps: z.number().min(0),
    appetite: z.object({
        minCoveragePct: z.number(),
        maxShodanRisk: z.number(),
    }).optional(),
});

export async function POST(req: Request) {
    const { error } = await requireSessionOrInternal(req);
    if (error) return error;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    const run = runGoNoGo(parsed.data, new Date().toISOString());
    const runId = await persistSkillRun(run);
    return NextResponse.json({ skillId: run.skillId, skillVersion: run.skillVersion, inputHash: run.inputHash, asOf: run.asOf, runId, decision: run.output });
}
