import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserProfile } from './rbac';

const SECRET_KEY = process.env.JWT_SECRET || 'astra-local-dev-secret-key-change-in-prod-at-least-32-chars-long';
const key = new TextEncoder().encode(SECRET_KEY);

export async function createSession(user: UserProfile) {
    // 1. Create JWT
    const token = await new SignJWT({ ...user })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);

    // 2. Set Secure Cookie
    const cookieStore = await cookies();
    cookieStore.set('astra-session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    });

    return token;
}

export async function getSession(): Promise<UserProfile | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('astra-session')?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload as unknown as UserProfile;
    } catch (error) {
        return null;
    }
}

export async function destroySession() {
    const cookieStore = await cookies();
    cookieStore.delete('astra-session');
}
