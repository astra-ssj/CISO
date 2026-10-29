import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requirePermission, requireSession } from '@/lib/api/require-session';

const resolveSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'DEFERRED']),
    notes: z.string().max(8000).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const decision = await prisma.decision.findUnique({ where: { id } });
    if (!decision) return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    return NextResponse.json(decision);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { user, error } = await requirePermission('decision:approve');
    if (error) return error;

    const parsed = resolveSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid resolution body' }, { status: 400 });
    }

    const { id } = await params;
    const existing = await prisma.decision.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    if (existing.status !== 'PENDING') {
        return NextResponse.json({ error: 'Decision is already resolved' }, { status: 409 });
    }

    const resolved = await prisma.$transaction(async (tx) => {
        if (parsed.data.status === 'APPROVED' && existing.executionType) {
            if (existing.executionType === 'VENDOR_STATUS') {
                const payload = existing.executionPayload
                    ? JSON.parse(existing.executionPayload) as { vendorId?: string; status?: string }
                    : {};
                const allowedStatuses = ['Approved', 'Conditionally Approved', 'Requires Reassessment'];
                if (!payload.vendorId || !payload.status || !allowedStatuses.includes(payload.status)) {
                    throw new Error('Invalid vendor-status execution payload');
                }
                await tx.vendor.update({
                    where: { id: payload.vendorId },
                    data: { status: payload.status },
                });
            } else {
                throw new Error(`Unsupported execution type: ${existing.executionType}`);
            }
        }

        const decision = await tx.decision.update({
            where: { id },
            data: {
                status: parsed.data.status,
                decidedById: user?.id ?? null,
                decidedByName: user?.name ?? null,
                decidedAt: new Date(),
                decisionNotes: parsed.data.notes ?? null,
            },
        });

        if (existing.skillRunId && parsed.data.status !== 'DEFERRED') {
            await tx.approval.create({
                data: {
                    skillRunId: existing.skillRunId,
                    decision: parsed.data.status === 'APPROVED' ? 'APPROVE' : 'REJECT',
                    actorId: user?.id ?? null,
                    actorName: user?.name ?? null,
                    notes: parsed.data.notes ?? null,
                },
            });
        }

        await tx.auditLog.create({
            data: {
                userId: user?.id ?? null,
                userName: user?.name ?? null,
                userRole: user?.role ?? null,
                action: parsed.data.status === 'APPROVED' ? 'APPROVE' : parsed.data.status === 'REJECTED' ? 'REJECT' : 'UPDATE',
                category: 'DECISION',
                resource: 'Decision',
                resourceId: id,
                description: `Decision ${id} resolved as ${parsed.data.status}`,
                metadata: JSON.stringify({
                    sourceResourceType: existing.sourceResourceType,
                    sourceResourceId: existing.sourceResourceId,
                    executionType: existing.executionType,
                }),
            },
        });

        return decision;
    });

    return NextResponse.json(resolved);
}
