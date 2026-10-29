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

    // Try to send invite email if SMTP is connected
    try {
        const smtpRow = await prisma.integration.findUnique({
            where: { integrationId: 'email-smtp' },
        });
        if (smtpRow && smtpRow.status === 'connected' && smtpRow.config) {
            const { decrypt } = await import('@/lib/crypto');
            const smtpConfig = JSON.parse(decrypt(smtpRow.config)) as Record<string, string>;
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.default.createTransport({
                host: smtpConfig.host,
                port: parseInt(smtpConfig.port, 10),
                secure: smtpConfig.tls === 'true',
                auth: { user: smtpConfig.user, pass: smtpConfig.password },
            });
            const inviteUrl = `${process.env.NEXTAUTH_URL}/invite?token=${token}`;
            await transporter.sendMail({
                from: `"${smtpConfig.fromName ?? 'Astra CISO'}" <${smtpConfig.fromEmail}>`,
                to: email,
                subject: `You've been invited to Astra CISO`,
                html: `<p>You've been invited to join Astra CISO as <strong>${role}</strong>.</p><p><a href="${inviteUrl}">Accept Invitation</a></p><p>This link expires in 7 days.</p>`,
            });
        }
    } catch {
        // Email failure is non-fatal; invite still created
    }

    return NextResponse.json({ success: true, inviteId: invite.id });
}
