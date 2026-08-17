import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/api/require-session';
import prisma from '@/lib/prisma';

/** GET /api/skills/runs — recent SkillRun rows. Append-only audit of skill compute. */
export async function GET(req: Request) {
    const { error } = await requireSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get('skillId') ?? undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));

    const rows = await prisma.skillRun.findMany({
        where: skillId ? { skillId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    return NextResponse.json({
        runs: rows.map((r) => {
            let output: unknown = null;
            try {
                output = JSON.parse(r.outputJson) as unknown;
            } catch {
                output = null;
            }
            return {
                id: r.id,
                skillId: r.skillId,
                skillVersion: r.skillVersion,
                inputHash: r.inputHash,
                asOf: r.asOf.toISOString(),
                createdAt: r.createdAt.toISOString(),
                output,
            };
        }),
    });
}
