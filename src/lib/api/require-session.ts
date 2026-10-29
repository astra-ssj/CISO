import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { hasPermission, type UserProfile, type UserRole } from '@/lib/auth/rbac';

function sessionUserProfile(session: Session | null): UserProfile | null {
    if (!session?.user) return null;
    const user = session.user as typeof session.user & { id?: string; role?: string };
    const role = user.role as UserRole | undefined;
    if (!role || !['CISO', 'SEC_ENGINEER', 'AUDITOR', 'VIEWER'].includes(role)) return null;

    return {
        id: user.id ?? user.email ?? '',
        email: user.email ?? '',
        name: user.name ?? 'User',
        role,
        avatarUrl: user.image ?? undefined,
        lastLogin: new Date().toISOString(),
    };
}

export async function requireSession() {
    const session = await auth();
    if (!session?.user) {
        return {
            session: null,
            user: null,
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }
    return { session, user: sessionUserProfile(session), error: null };
}

export async function requirePermission(permission: string) {
    const result = await requireSession();
    if (result.error) return result;

    if (!result.user || !hasPermission(result.user, permission)) {
        return {
            session: result.session,
            user: result.user,
            error: NextResponse.json(
                { error: 'Forbidden', requiredPermission: permission },
                { status: 403 },
            ),
        };
    }
    return result;
}

export function requireInternalSecret(req: Request) {
    const expected = process.env.ASTRA_INTERNAL_SECRET;
    if (!expected) {
        return NextResponse.json({ error: 'Internal secret not configured' }, { status: 503 });
    }
    const got = req.headers.get('x-astra-internal-secret');
    if (got !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

export async function requireSessionOrInternal(req: Request) {
    const internal = requireInternalSecret(req);
    if (!internal) {
        return { session: null, user: null, error: null as NextResponse | null, via: 'internal' as const };
    }
    const result = await requireSession();
    if (result.error) return { session: null, user: null, error: result.error, via: 'none' as const };
    return { session: result.session, user: result.user, error: null, via: 'session' as const };
}
