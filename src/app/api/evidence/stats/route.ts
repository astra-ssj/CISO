import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/evidence/stats
export async function GET() {
    try {
        const session = await auth();
        const role = (session?.user as { role?: string })?.role;
        if (!role || !['CISO', 'SEC_ENGINEER', 'AUDITOR'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const now = new Date();
        const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [total, active, expiringSoon, expired] = await Promise.all([
            prisma.evidence.count(),
            prisma.evidence.count({ where: { status: 'ACTIVE' } }),
            prisma.evidence.count({
                where: {
                    status: 'ACTIVE',
                    expiresAt: { lte: in30days, gte: now },
                },
            }),
            prisma.evidence.count({
                where: {
                    expiresAt: { lt: now },
                    status: { not: 'ARCHIVED' },
                },
            }),
        ]);

        const byCategory = await prisma.evidence.groupBy({
            by: ['category'],
            _count: { category: true },
            orderBy: { _count: { category: 'desc' } },
        });

        // Total file size — sum fileSize
        const sizeResult = await prisma.evidence.aggregate({
            _sum: { fileSize: true },
        });

        return NextResponse.json({
            total,
            active,
            expiringSoon,
            expired,
            byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.category })),
            totalSize: sizeResult._sum.fileSize ?? 0,
        });
    } catch (error: unknown) {
        console.error('Evidence stats:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
