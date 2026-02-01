import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('astra-auth');
    const isAuthPage = request.nextUrl.pathname.startsWith('/login');

    // Define public paths that don't satisfy the matcher exclusion but should be public
    // (Everything else is protected by default config.matcher)

    // If not authenticated and not on login page, redirect to login
    if (!authCookie && !isAuthPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If authenticated and on login page, redirect to home
    if (authCookie && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Protect all routes except api, static files, and favicon
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
