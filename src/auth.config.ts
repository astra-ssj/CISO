import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    session: { strategy: 'jwt' as const },
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    providers: [
        // Added later in auth.ts
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname === '/login';

            // Public: login page, NextAuth handlers, health probes only.
            // All other /api/* require a session (v3 decision-loop).
            const publicPaths = ['/login', '/api/auth', '/api/health'];
            const isPublicRoute = publicPaths.some(path => nextUrl.pathname.startsWith(path));

            if (isPublicRoute) {
                // If logged in and trying to access login, redirect to dashboard
                if (isOnLogin && isLoggedIn) {
                    return Response.redirect(new URL('/', nextUrl));
                }
                return true;
            }

            // All other routes require authentication
            if (isLoggedIn) return true;
            return false; // Redirects to signIn page
        },
    },
} satisfies NextAuthConfig;
