import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Session gate for App Router handlers.
 * Middleware already blocks anonymous /api (except health + NextAuth).
 * Call this on mutating routes for defense in depth.
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
