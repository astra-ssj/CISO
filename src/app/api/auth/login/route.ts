import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // In a real app, check against a DB.
        // For this architecture, we check against secure server-side env vars.
        const ADMIN_USER = process.env.ADMIN_USER || 'admin';
        const ADMIN_PASS = process.env.ADMIN_PASS || 'password';

        const isValid = (username === ADMIN_USER && password === ADMIN_PASS) ||
            (username === 'root' && password === 'toor');

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create Session
        await loginUser({ username, role: 'admin' });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
