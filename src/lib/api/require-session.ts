import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Session gate for App Router handlers.
 * Middleware already blocks anonymous /api (except health + NextAuth + internal).
 */
export async function requireSession() {
    const session = await auth();
    if (!session?.user) {
        return {
            session: null,
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }
    return { session, error: null };
}

/**
 * Shared secret for OpenNeko watchers / GraphJin sidecars.
 * Not a public API — the header must match ASTRA_INTERNAL_SECRET.
 */
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
        return { session: null, error: null as NextResponse | null, via: 'internal' as const };
    }
    const { session, error } = await requireSession();
    if (error) return { session: null, error, via: 'none' as const };
    return { session, error: null, via: 'session' as const };
}
