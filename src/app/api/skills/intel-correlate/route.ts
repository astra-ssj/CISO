import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionOrInternal } from '@/lib/api/require-session';
import { runIntelCorrelate } from '@/lib/skills/intel-correlate';
import { persistSkillRun } from '@/lib/skills/persist';

const bodySchema = z.object({
    iocs: z.array(z.string()).max(5000),
    vendorDomains: z.array(z.string()).max(2000),
    assetHosts: z.array(z.string()).max(2000),
});

export async function POST(req: Request) {
    const { error } = await requireSessionOrInternal(req);
    if (error) return error;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    const run = runIntelCorrelate(parsed.data, new Date().toISOString());
    const runId = await persistSkillRun(run);
    return NextResponse.json({ skillId: run.skillId, skillVersion: run.skillVersion, inputHash: run.inputHash, asOf: run.asOf, runId, correlate: run.output });
}
