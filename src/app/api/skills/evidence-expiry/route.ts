import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/api/require-session';
import { runEvidenceExpiry } from '@/lib/skills/evidence-expiry';
import { persistSkillRun } from '@/lib/skills/persist';

const bodySchema = z.object({
    asOf: z.string().min(1),
    windowDays: z.number().min(0).max(3650),
    items: z.array(z.object({
        id: z.string(),
        title: z.string(),
        status: z.string(),
        expiresAt: z.string().nullable(),
    })).max(5000),
});

/** POST /api/skills/evidence-expiry — expiry vs asOf. Clock is an input. */
export async function POST(req: Request) {
    const { error } = await requireSession();
    if (error) return error;

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const run = runEvidenceExpiry(parsed.data, parsed.data.asOf);
    const runId = await persistSkillRun(run);

    return NextResponse.json({
        skillId: run.skillId,
        skillVersion: run.skillVersion,
        inputHash: run.inputHash,
        asOf: run.asOf,
        runId,
        expiry: run.output,
    });
}
