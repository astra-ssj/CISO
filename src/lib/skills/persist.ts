import prisma from '@/lib/prisma';
import type { SkillRunResult } from './types';

export async function persistSkillRun<T>(run: SkillRunResult<T>, observationIds: string[] = []): Promise<string | null> {
    try {
        const row = await prisma.skillRun.create({
            data: {
                skillId: run.skillId,
                skillVersion: run.skillVersion,
                inputHash: run.inputHash,
                outputJson: JSON.stringify(run.output),
                asOf: new Date(run.asOf),
                observationIds: JSON.stringify(observationIds),
            },
        });
        return row.id;
    } catch (err) {
        console.error('[SkillRun] persist failed', err);
        return null;
    }
}
