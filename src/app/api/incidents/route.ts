import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/api/require-session';
import prisma from '@/lib/prisma';

/** GET /api/incidents — real Incident rows only. Empty is honest. */
export async function GET() {
    const { error } = await requireSession();
    if (error) return error;

    const incidents = await prisma.incident.findMany({
        orderBy: { startedAt: 'desc' },
        take: 50,
        include: { commander: { select: { name: true, email: true } } },
    });

    return NextResponse.json({
        incidents: incidents.map((i) => ({
            id: i.id,
            title: i.title,
            severity: i.severity,
            status: i.status,
            commander: i.commander.name || i.commander.email,
            startedAt: i.startedAt.toISOString(),
            resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : null,
        })),
    });
}
