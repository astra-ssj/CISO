import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'astra-local-dev-secret-key-change-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

async function verify(token: string) {
    try {
        await jwtVerify(token, key, { algorithms: ['HS256'] });
        return true;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    // Check for the auth cookie
    const authCookie = request.cookies.get('astra-auth');
    const token = authCookie?.value;

    // Verify Token
    let isAuthenticated = false;
    if (token) {
        isAuthenticated = await verify(token);
    }

    // Define protected paths
    const isLoginPage = request.nextUrl.pathname === '/login';
    const path = request.nextUrl.pathname;

    // Public paths
    if (
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path === '/login' ||
        path.startsWith('/api/auth') || // Allow login API
        path.match(/\.(png|jpg|jpeg|gif|ico|svg)$/)
    ) {
        return NextResponse.next();
    }

    // API Routes protection
    if (path.startsWith('/api')) {
        if (!isAuthenticated) {
            return NextResponse.json(
                { error: 'Unauthorized: Session required' },
                { status: 401 }
            );
        }
        return NextResponse.next();
    }

    // Dashboard / App Protection
    if (!isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
