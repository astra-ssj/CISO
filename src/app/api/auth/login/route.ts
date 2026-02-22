import { NextResponse } from 'next/server';
import { signIn } from '@/auth';
import { logAction } from '@/lib/auth/audit';
import type { UserProfile } from '@/lib/auth/rbac';
import type { UserRole } from '@/lib/auth/rbac';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { parseBodyWithZod, loginBodySchema } from '@/lib/api-validation';

const VALID_ROLES: UserRole[] = ['CISO', 'SEC_ENGINEER', 'AUDITOR', 'VIEWER'];

function toUserProfile(user: { id: string; email: string; name: string | null; role: string }): UserProfile {
    const role = VALID_ROLES.includes(user.role as UserRole) ? (user.role as UserRole) : 'VIEWER';
    return {
        id: user.id,
        email: user.email,
        name: user.name ?? 'User',
        role,
        lastLogin: new Date().toISOString(),
    };
}

export async function POST(request: Request) {
    try {
        const raw = await request.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, loginBodySchema);
        if ('error' in parsed) return parsed.error;
        const { password } = parsed.data;
        const email = (parsed.data.email ?? parsed.data.username)?.trim();
        if (!email) {
            return NextResponse.json({ error: 'Email or username is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Establish NextAuth session (single source of truth)
        const result = await signIn('credentials', {
            email: user.email,
            password,
            redirect: false,
        });

        if (result?.error || !result?.ok) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const profile = toUserProfile(user);

        const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
        await logAction(profile, 'LOGIN', 'User logged in successfully', { ip });

        return NextResponse.json({ success: true, user: profile });
    } catch (e) {
        console.error('[auth/login]', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
