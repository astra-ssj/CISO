import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check for the auth cookie
    const authCookie = request.cookies.get('astra-auth');
    const isAuthenticated = authCookie?.value === 'true';

    // Define protected paths
    const isLoginPage = request.nextUrl.pathname === '/login';
    const isDashboard = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/(dashboard)'); // Note: Group routes like (dashboard) are not in the URL

    // Real check: If it's NOT login, NOT static, and NOT api (unless specific api protection needed here)
    // For this app, essentially everything at root '/' is protected except login.

    // Exclude static assets, api, and login from default protection if needed, 
    // OR explicitly protect root and sub-routes.

    // Simplified logic: Protect everything except /login, /api (optional, handled separately or here), and static assets.
    const path = request.nextUrl.pathname;

    // Public paths
    if (
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path === '/login' ||
        path.match(/\.(png|jpg|jpeg|gif|ico|svg)$/)
    ) {
        return NextResponse.next();
    }

    // API Routes - we can also protect them here or in the route handler. 
    // Let's protect sensitive agent APIs here too for double safety.
    if (path.startsWith('/api/agent')) {
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
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
