import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionOrInternal } from '@/lib/api/require-session';
import { runPlaybookNextStep } from '@/lib/skills/playbook-next-step';
import { persistSkillRun } from '@/lib/skills/persist';

const bodySchema = z.object({
    playbookId: z.string(),
    phases: z.array(z.object({
        id: z.string(),
        title: z.string(),
        steps: z.array(z.object({
            id: z.string(),
            instruction: z.string(),
            isCompleted: z.boolean(),
        })),
    })),
});

export async function POST(req: Request) {
    const { error } = await requireSessionOrInternal(req);
    if (error) return error;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    const run = runPlaybookNextStep(parsed.data, new Date().toISOString());
    const runId = await persistSkillRun(run);
    return NextResponse.json({ skillId: run.skillId, skillVersion: run.skillVersion, inputHash: run.inputHash, asOf: run.asOf, runId, next: run.output });
}
