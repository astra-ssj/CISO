import { auth } from '@/auth';
import type { UserProfile } from './rbac';

/**
 * Single source of truth: NextAuth session.
 * Returns current user as UserProfile for RBAC and audit, or null if not authenticated.
 */
export async function getSession(): Promise<UserProfile | null> {
    const session = await auth();
    if (!session?.user) return null;

    const u = session.user;
    const role = (u as { role?: string }).role;
    if (!role) return null;

    return {
        id: (u as { id?: string }).id ?? u.email ?? '',
        email: u.email ?? '',
        name: u.name ?? 'User',
        role: role as UserProfile['role'],
        avatarUrl: u.image ?? undefined,
        lastLogin: new Date().toISOString(),
    };
}

/**
 * Session creation is handled by NextAuth signIn (e.g. credentials provider).
 * No-op for backward compatibility; clients should use signIn() and signOut() from next-auth/react.
 */
export async function createSession(_user: UserProfile): Promise<void> {
    // No-op: use NextAuth signIn('credentials', { email, password }) to establish session.
}

/**
 * Session destruction is handled by NextAuth signOut.
 * No-op for backward compatibility; clients should use signOut() from next-auth/react.
 */
export async function destroySession(): Promise<void> {
    // No-op: use NextAuth signOut() to clear session.
}
