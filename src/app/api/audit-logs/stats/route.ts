import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/audit-logs/stats
export async function GET() {
    try {
        const session = await auth();
        const role = (session?.user as { role?: string })?.role;
        if (!role || !['CISO', 'AUDITOR'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        const [total, today, thisWeek, critical] = await Promise.all([
            prisma.auditLog.count(),
            prisma.auditLog.count({ where: { timestamp: { gte: todayStart } } }),
            prisma.auditLog.count({ where: { timestamp: { gte: weekStart } } }),
            prisma.auditLog.count({ where: { severity: 'CRITICAL' } }),
        ]);

        // Category breakdown — use groupBy
        const byCategory = await prisma.auditLog.groupBy({
            by: ['category'],
            _count: { category: true },
            orderBy: { _count: { category: 'desc' } },
        });

        const byAction = await prisma.auditLog.groupBy({
            by: ['action'],
            _count: { action: true },
            orderBy: { _count: { action: 'desc' } },
        });

        return NextResponse.json({
            total,
            today,
            thisWeek,
            critical,
            byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.category })),
            byAction: byAction.map((a) => ({ action: a.action, count: a._count.action })),
        });
    } catch (error: unknown) {
        console.error('AuditLogs stats:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
