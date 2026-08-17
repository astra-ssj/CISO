import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireInternalSecret } from '@/lib/api/require-session';
import { recordApproval, executeApprovedPlugin } from '@/lib/approvals/record';

const bodySchema = z.object({
    skillRunId: z.string().min(1),
    observationIds: z.array(z.string()).optional(),
    decision: z.enum(['APPROVE', 'REJECT']),
    actorId: z.string().optional(),
    actorName: z.string().optional(),
    plugin: z.string().optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
    notes: z.string().optional(),
    executePlugin: z.boolean().optional(),
});

/** POST /api/internal/approvals — dual-write AuditLog + Approval (+ OpenNeko memory). */
export async function POST(req: Request) {
    const denied = requireInternalSecret(req);
    if (denied) return denied;

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    try {
        const id = await recordApproval(parsed.data);
        let plugin: { ok: boolean; reason: string } | null = null;
        if (parsed.data.executePlugin && parsed.data.decision === 'APPROVE') {
            plugin = await executeApprovedPlugin(id);
        }
        return NextResponse.json({ id, plugin });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Approval failed' }, { status: 400 });
    }
}
