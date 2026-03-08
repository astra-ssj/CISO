/**
 * Knowledge Entry API — Update & Delete
 *
 * PATCH  /api/knowledge/[id] — Update entry (edit, approve)
 * DELETE /api/knowledge/[id] — Remove entry
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KnowledgeRepository } from '@/lib/knowledge/repository';
import { parseBodyWithZod, knowledgePatchBodySchema, log } from '@/lib/api-validation';

const repo = new KnowledgeRepository(prisma);


// ─── PATCH — Update / Approve ───────────────

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id || Array.isArray(id)) throw new Error('Invalid ID');
        const raw = await request.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, knowledgePatchBodySchema);
        if ('error' in parsed) return parsed.error;
        const body = parsed.data as Record<string, unknown>;

        // Special mode: approve
        if (body.action === 'approve') {
            const entry = await repo.approveEntry(id as string, String(body.approvedBy || 'admin'));
            return NextResponse.json({ success: true, entry });
        }

        // Special mode: record usage
        if (body.action === 'recordUsage') {
            const entry = await repo.recordUsage(id as string);
            return NextResponse.json({ success: true, entry });
        }

        // General update
        const entry = await repo.updateEntry(id as string, body);
        return NextResponse.json({ success: true, entry });
    } catch (error: unknown) {
        const err = error as Error;
        log('error', 'knowledge/[id]/PATCH', 'Failed to update entry', err);
        return NextResponse.json(
            { error: err.message || 'Failed to update entry' },
            { status: 500 }
        );
    }
}


// ─── DELETE — Remove ────────────────────────

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id || Array.isArray(id)) throw new Error('Invalid ID');
        await repo.deleteEntry(id as string);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const err = error as Error;
        console.error('[Knowledge API] DELETE error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to delete entry' },
            { status: 500 }
        );
    }
}
