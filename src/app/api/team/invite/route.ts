import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/require-session';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
    const { user, error } = await requirePermission('team:invite');
    if (error) return error;

    const body = await req.json() as { email: string; role: string };
    const { email, role } = body;

    const validRoles = ['CISO', 'SEC_ENGINEER', 'AUDITOR', 'VIEWER'];
    if (!email || !validRoles.includes(role)) {
        return NextResponse.json({ error: 'email and valid role are required' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Expire any existing pending invite for this email
    await prisma.teamInvite.updateMany({
        where: { email, status: 'pending' },
        data: { status: 'expired' },
    });

    const token = randomBytes(32).toString('hex');
    const actorId = user?.id ?? 'unknown';

    const invite = await prisma.teamInvite.create({
        data: {
            email,
            role,
            token,
            invitedBy: actorId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });

    // Community Preview does not send invitation email directly. Delivery is
    // intentionally deferred to a future notification connector so the core
    // product does not carry an SMTP library into the trusted runtime.

    return NextResponse.json({ success: true, inviteId: invite.id });
}
