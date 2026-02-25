import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/audit-logs/export — CSV or JSON download
export async function GET(req: Request) {
    try {
        const session = await auth();
        const role = (session?.user as { role?: string })?.role;
        if (!role || !['CISO', 'AUDITOR'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const format = searchParams.get('format') || 'csv';

        // Build where clause (same filters as main route)
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
            ];
        }

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: 10000, // max export size
        });

        if (format === 'json') {
            const body = JSON.stringify(logs, null, 2);
            return new NextResponse(body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`,
                },
            });
        }

        // CSV format
        const headers = [
            'Timestamp', 'User ID', 'User Name', 'Role', 'Action', 'Category',
            'Resource', 'Resource ID', 'Description', 'Severity', 'IP Address', 'User Agent',
        ];
        const rows = logs.map((log) => [
            log.timestamp.toISOString(),
            log.userId ?? '',
            log.userName ?? '',
            log.userRole ?? '',
            log.action,
            log.category,
            log.resource,
            log.resourceId ?? '',
            `"${(log.description ?? '').replace(/"/g, '""')}"`,
            log.severity,
            log.ipAddress ?? '',
            `"${(log.userAgent ?? '').replace(/"/g, '""')}"`,
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error: unknown) {
        console.error('AuditLogs export:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
