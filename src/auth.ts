import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit/audit-service';

async function getUser(email: string) {
    try {
        return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return null;
    }
}

export function isGoogleOAuthConfigured(): boolean {
    return Boolean(
        process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
    );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,

        async signIn({ user, account }) {
            // ── Google SSO: auto-provision or update user ──────────────
            if (account?.provider === 'google' && user.email) {
                try {
                    const existing = await prisma.user.findUnique({
                        where: { email: user.email },
                    });

                    if (existing) {
                        // Returning user — update lastActiveAt & ssoProvider
                        await prisma.user.update({
                            where: { email: user.email },
                            data: {
                                lastActiveAt: new Date(),
                                ssoProvider: 'google',
                                name: user.name ?? existing.name,
                                image: user.image ?? existing.image,
                            },
                        });
                        user.id = existing.id;
                        (user as { role?: string }).role = existing.role;
                    } else {
                        // First-time Google user — auto-provision with VIEWER role
                        const newUser = await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name ?? user.email.split('@')[0],
                                image: user.image,
                                role: 'VIEWER',
                                ssoProvider: 'google',
                                lastActiveAt: new Date(),
                            },
                        });
                        user.id = newUser.id;
                        (user as { role?: string }).role = newUser.role;

                        // Audit: auto-provisioned
                        await logAudit({
                            userId: newUser.id,
                            userName: newUser.name ?? undefined,
                            action: 'CREATE',
                            category: 'AUTH',
                            resource: 'User',
                            resourceId: newUser.id,
                            description: `User auto-provisioned from Google SSO: ${newUser.email}`,
                            severity: 'INFO',
                        });
                    }

                    // Auto-connect Google integration in Integration Hub
                    try {
                        await prisma.integration.upsert({
                            where: { integrationId: 'google' },
                            create: {
                                integrationId: 'google',
                                category: 'identity',
                                status: 'connected',
                                connectedBy: user.id,
                                connectedAt: new Date(),
                            },
                            update: {
                                status: 'connected',
                                connectedBy: user.id,
                                connectedAt: new Date(),
                            },
                        });
                    } catch (err) {
                        console.error('[Auth] Failed to auto-connect Google integration:', err);
                    }
                } catch (error) {
                    console.error('[Auth] Google SSO provisioning error:', error);
                    return false;
                }
            }

            // ── Audit log for all sign-ins ─────────────────────────────
            try {
                await logAudit({
                    userId: user.id ?? undefined,
                    userName: user.name ?? undefined,
                    action: 'LOGIN',
                    category: 'AUTH',
                    resource: 'User',
                    resourceId: user.id ?? undefined,
                    description: `User signed in via ${account?.provider || 'credentials'}`,
                    severity: 'INFO',
                });
            } catch (err) {
                // Never block sign-in due to audit failure
                console.error('[Auth] Audit log error:', err);
            }

            return true;
        },

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
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (!parsedCredentials.success) {
                    return null;
                }

                const { email, password } = parsedCredentials.data;
                const user = await getUser(email);
                if (!user?.password) return null;

                const passwordsMatch = await bcrypt.compare(password, user.password);
                if (!passwordsMatch) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                };
            },
        }),
        // Google SSO — optional. Credentials login always works without it.
        ...(isGoogleOAuthConfigured()
            ? [
                Google({
                    clientId: process.env.GOOGLE_CLIENT_ID as string,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
                }),
            ]
            : []),
    ],
});
