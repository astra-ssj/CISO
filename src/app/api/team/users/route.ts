import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            ssoProvider: true,
            mfaEnabled: true,
            lastActiveAt: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    const invites = await prisma.teamInvite.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users, invites });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { userId: string; role: string };
    const { userId, role } = body;

    const validRoles = ['CISO', 'SEC_ENGINEER', 'AUDITOR', 'VIEWER'];
    if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role },
    });

    const actorId = (session.user as { id?: string }).id ?? 'unknown';
    await prisma.auditLog.create({
        data: {
            actor: actorId,
            action: 'team.role_changed',
            resource: `user:${userId}`,
            metadata: JSON.stringify({ newRole: role }),
        },
    });

    return NextResponse.json({ success: true });
}
