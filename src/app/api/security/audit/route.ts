import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/auth/audit';

export async function GET() {
    const logs = await getAuditLogs();
    return NextResponse.json(logs);
}
