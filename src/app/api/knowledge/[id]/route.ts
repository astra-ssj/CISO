/**
 * Knowledge Entry API — Update & Delete
 *
 * PATCH  /api/knowledge/[id] — Update entry (edit, approve)
 * DELETE /api/knowledge/[id] — Remove entry
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KnowledgeRepository } from '@/lib/knowledge/repository';

const repo = new KnowledgeRepository(prisma as any);

// ─── PATCH — Update / Approve ───────────────

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Special mode: approve
        if (body.action === 'approve') {
            const entry = await repo.approveEntry(id, body.approvedBy || 'admin');
            return NextResponse.json({ success: true, entry });
        }

        // Special mode: record usage
        if (body.action === 'recordUsage') {
            const entry = await repo.recordUsage(id);
            return NextResponse.json({ success: true, entry });
        }

        // General update
        const entry = await repo.updateEntry(id, body);
        return NextResponse.json({ success: true, entry });
    } catch (error: any) {
        console.error('[Knowledge API] PATCH error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update entry' },
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
        await repo.deleteEntry(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Knowledge API] DELETE error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete entry' },
            { status: 500 }
        );
    }
}
