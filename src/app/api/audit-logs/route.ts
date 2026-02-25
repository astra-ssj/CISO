import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/audit-logs — paginated, filterable, CISO/AUDITOR only
export async function GET(req: Request) {
    try {
        const session = await auth();
        const role = (session?.user as { role?: string })?.role;
        if (!role || !['CISO', 'AUDITOR'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Record<string, unknown> = {};

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        if (startDate || endDate) {
            const ts: Record<string, Date> = {};
            if (startDate) ts.gte = new Date(startDate);
            if (endDate) ts.lte = new Date(endDate);
            where.timestamp = ts;
        }

        const category = searchParams.get('category');
        if (category) {
            const cats = category.split(',');
            where.category = cats.length === 1 ? cats[0] : { in: cats };
        }

        const action = searchParams.get('action');
        if (action) {
            const acts = action.split(',');
            where.action = acts.length === 1 ? acts[0] : { in: acts };
        }

        const userId = searchParams.get('userId');
        if (userId) {
            const uids = userId.split(',');
            where.userId = uids.length === 1 ? uids[0] : { in: uids };
        }

        const severity = searchParams.get('severity');
        if (severity) {
            const sevs = severity.split(',');
            where.severity = sevs.length === 1 ? sevs[0] : { in: sevs };
        }

        const search = searchParams.get('search');
        if (search) {
            where.OR = [
                { description: { contains: search } },
                { resource: { contains: search } },
                { userName: { contains: search } },
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return NextResponse.json({ logs, total, page, limit });
    } catch (error: unknown) {
        console.error('AuditLogs GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
