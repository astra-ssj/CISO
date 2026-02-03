import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'astra-local-dev-secret-key-change-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

export async function signToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function loginUser(userData: any) {
    const token = await signToken(userData);
    const cookieStore = await cookies();
    cookieStore.set('astra-auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    });
    return token;
}

export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete('astra-auth');
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('astra-auth')?.value;
    if (!token) return null;
    return await verifyToken(token);
}
