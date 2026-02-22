import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { randomBytes } from 'crypto';

const AUTH_LIMIT = 10;   // requests per minute for auth endpoints
const API_LIMIT = 100;   // requests per minute for other API routes

function generateNonce(): string {
    return randomBytes(16).toString('base64');
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
    // CSP: nonce for scripts/styles; strict-dynamic allows scripts loaded by nonce-approved scripts.
    // In development, Next.js uses eval() so we allow unsafe-eval only then.
    const isDev = process.env.NODE_ENV !== 'production';
    const scriptSrc = [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        ...(isDev ? ["'unsafe-eval'"] : []),
    ].join(' ');
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            `script-src ${scriptSrc}`,
            `style-src 'self' 'nonce-${nonce}'`,
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; ')
    );
    return response;
}

// NextAuth auth() runs authorized() from auth.config; we add rate limiting and security headers.
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
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
