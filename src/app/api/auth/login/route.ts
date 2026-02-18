import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { logAction } from '@/lib/auth/audit';
import { UserProfile, UserRole } from '@/lib/auth/rbac';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Mock User Database for Demo
        let user: UserProfile | null = null;

        if (username === 'ciso@astra.ai' && password === 'admin123') {
            user = {
                id: 'u-ciso-001',
                email: 'ciso@astra.ai',
                name: 'System Administrator',
                role: 'CISO',
                lastLogin: new Date().toISOString()
            };
        } else if (username === 'analyst@astra.ai' && password === 'user123') {
            user = {
                id: 'u-sec-002',
                email: 'analyst@astra.ai',
                name: 'Security Analyst',
                role: 'SEC_ENGINEER', // Correct role mapping
                lastLogin: new Date().toISOString()
            };
        } else if (username === 'auditor@astra.ai') {
            user = {
                id: 'u-audit-003',
                email: 'auditor@astra.ai',
                name: 'External Auditor',
                role: 'AUDITOR',
                lastLogin: new Date().toISOString()
            };
        }

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 1. Create Secure Session
        await createSession(user);

        // 2. Audit Log
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await logAction(user, 'LOGIN', 'User logged in successfully', { ip });

        return NextResponse.json({ success: true, user });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
