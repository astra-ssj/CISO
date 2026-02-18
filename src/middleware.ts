import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { canAccessRoute, UserRole } from '@/lib/auth/rbac';

const SECRET_KEY = process.env.JWT_SECRET || 'astra-local-dev-secret-key-change-in-prod-at-least-32-chars-long';
const key = new TextEncoder().encode(SECRET_KEY);

async function verify(token: string) {
    try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        return payload as unknown as { role: UserRole };
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    // 1. Secured Edge Node: IP Blocklist & Rate Limiting (Mock)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const response = NextResponse.next();

    // 2. Authentication & Authorization
    const authCookie = request.cookies.get('astra-session'); // Note: changed cookie name
    const token = authCookie?.value;

    let userRole: UserRole | null = null;

    if (token) {
        const payload = await verify(token);
        if (payload) {
            userRole = payload.role;
        }
    }

    const path = request.nextUrl.pathname;
    const isPublicPath =
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path === '/login' ||
        path === '/manifest.json' ||
        path.startsWith('/api/auth') || // Allow login/logout endpoints
        path.match(/\.(png|jpg|jpeg|gif|ico|svg)$/);

    if (!isPublicPath) {
        // A. Unauthenticated User -> Login
        if (!userRole) {
            if (path.startsWith('/api')) {
                return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
            }
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        // B. RBAC Check
        if (!canAccessRoute(userRole, path)) {
            if (path.startsWith('/api')) {
                return NextResponse.json({ error: 'Forbidden: Insufficient Permissions' }, { status: 403 });
            }
            // For UI routes, maybe redirect to dashboard with a query param?
            // For now, just rewrite to a 403 page or dashboard
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    // 3. Security Headers
    response.headers.set('X-Frame-Options', 'DENY'); // Stricter
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;");

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
