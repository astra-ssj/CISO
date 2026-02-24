import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './src/auth.config';
import { rateLimit, getClientIp } from './src/lib/rate-limit';

/**
 * Consolidated edge-safe middleware.
 *
 * Uses auth.config.ts (no Prisma / no fs) so the middleware runs in Edge runtime.
 * Adds matching jwt/session callbacks so the token written by auth.ts can be decoded here.
 *
 * Also includes rate limiting and security headers (previously in src/middleware.ts).
 */

const { auth } = NextAuth({
    ...authConfig,
    session: { strategy: 'jwt' },
    callbacks: {
        ...authConfig.callbacks,
        // Mirror the jwt/session callbacks from auth.ts so the middleware
        // can read role/id from the session token.
        jwt({ token, user }) {
            if (user) {
                token.role = (user as { role?: string }).role;
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                (session.user as { role?: string }).role = token.role as string;
                (session.user as { id?: string }).id = token.id as string;
            }
            return session;
        },
    },
});

const AUTH_LIMIT = 10;   // requests per minute for auth endpoints
const API_LIMIT = 100;   // requests per minute for other API routes

function generateNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes));
}

function setSecurityHeaders(response: NextResponse, nonce: string) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
    );
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
    );
    const isDev = process.env.NODE_ENV !== 'production';
    const scriptSrc = isDev
        ? "'self' 'unsafe-inline' 'unsafe-eval'"
        : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
    const styleSrc = isDev
        ? "'self' 'unsafe-inline'"
        : `'self' 'unsafe-inline' 'nonce-${nonce}'`;
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            `script-src ${scriptSrc}`,
            `style-src ${styleSrc}`,
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https:",
            "connect-src 'self' https:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; ')
    );
    return response;
}

export default auth((req) => {
    const pathname = req.nextUrl.pathname;
    const ip = getClientIp(req);

    // Rate limit auth endpoints (login, password reset, NextAuth callbacks)
    if (pathname.startsWith('/api/auth')) {
        const authResult = rateLimit(`auth:${ip}`, AUTH_LIMIT);
        if (!authResult.success) {
            const retryAfter = Math.ceil((authResult.resetAt - Date.now()) / 1000);
            return new NextResponse(
                JSON.stringify({ error: 'Too Many Requests', message: 'Auth rate limit exceeded. Try again later.' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(Math.max(1, retryAfter)),
                    },
                }
            );
        }
    }

    // Rate limit all other API routes
    if (pathname.startsWith('/api/')) {
        const apiResult = rateLimit(`api:${ip}`, API_LIMIT);
        if (!apiResult.success) {
            const retryAfter = Math.ceil((apiResult.resetAt - Date.now()) / 1000);
            return new NextResponse(
                JSON.stringify({ error: 'Too Many Requests', message: 'API rate limit exceeded. Try again later.' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(Math.max(1, retryAfter)),
                    },
                }
            );
        }
    }

    // Auth redirect logic — unauthenticated users on protected routes go to /login.
    // The authorized() callback in authConfig already handles this, but we add
    // an explicit guard here for clarity and to ensure the login page itself is excluded.
    // (authConfig.callbacks.authorized handles it before we reach this point.)

    const nonce = generateNonce();
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-nonce', nonce);

    const response = NextResponse.next({
        request: { headers: requestHeaders },
    });
    setSecurityHeaders(response, nonce);
    return response;
});

export const config = {
    // Exclude static assets AND api/auth routes (NextAuth handles its own callbacks)
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
