import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth.js uses encrypted JWTs (JWE), not signed (JWS), so we cannot verify the session in Edge
// without pulling in Node. Let the dashboard layout and API routes enforce auth via auth().
function setSecurityHeaders(response: NextResponse) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;");
    return response;
}

export function middleware(req: NextRequest) {
    const response = NextResponse.next();
    setSecurityHeaders(response);
    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
