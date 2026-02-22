/**
 * Auth helpers — single source of truth: NextAuth.
 * Session is read via getSession() which uses NextAuth auth().
 */

import { getSession as getSessionFromAuth } from '@/lib/auth/session';

export { getSessionFromAuth as getSession };

export interface LoginUserData {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    [key: string]: unknown;
}

/** @deprecated Use NextAuth signIn() on the client or credentials flow. Session is created by NextAuth. */
export async function loginUser(_userData: LoginUserData): Promise<string | null> {
    return null;
}

/** @deprecated Use NextAuth signOut() on the client. */
export async function logoutUser(): Promise<void> {
    // No-op; client should use signOut() from next-auth/react.
}
