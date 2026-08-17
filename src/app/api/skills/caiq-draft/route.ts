import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionOrInternal } from '@/lib/api/require-session';
import { runCaiqDraft } from '@/lib/skills/caiq-draft';
import { persistSkillRun } from '@/lib/skills/persist';

const bodySchema = z.object({
    questionText: z.string().min(1),
    draftText: z.string(),
});

/** Labels an LLM paragraph. Never canonical. */
export async function POST(req: Request) {
    const { error } = await requireSessionOrInternal(req);
    if (error) return error;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    const run = runCaiqDraft(parsed.data, new Date().toISOString());
    const runId = await persistSkillRun(run);
    return NextResponse.json({ skillId: run.skillId, skillVersion: run.skillVersion, inputHash: run.inputHash, asOf: run.asOf, runId, draft: run.output });
}
