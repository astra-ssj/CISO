import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseBodyWithZod, notificationCreateSchema } from '@/lib/api-validation';

export async function GET() {
    try {
        const [notifications, alertRules] = await Promise.all([
            prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
            prisma.alertRule.findMany(),
        ]);
        const notifs = notifications.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            severity: n.severity,
            read: n.read,
            timestamp: Number(n.timestamp),
            actionUrl: n.actionUrl ?? undefined,
        }));
        const rules = alertRules.map((r) => ({
            id: r.id,
            name: r.name,
            condition: r.condition,
            threshold: r.threshold,
            enabled: r.enabled,
            notificationType: r.notificationType,
        }));
        return NextResponse.json({ notifications: notifs, alertRules: rules });
    } catch (error: unknown) {
        console.error('Notifications GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        if (body.markAllRead) {
            await prisma.notification.updateMany({ data: { read: true } });
            return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error: unknown) {
        console.error('Notifications PATCH:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        await prisma.notification.deleteMany({});
        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        console.error('Notifications DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const raw = await req.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, notificationCreateSchema);
        if ('error' in parsed) return parsed.error;
        const { notification: nIn } = parsed.data;
        const n = await prisma.notification.create({
            data: {
                type: nIn.type ?? 'SYSTEM',
                title: nIn.title ?? '',
                message: nIn.message ?? '',
                severity: nIn.severity ?? 'INFO',
                read: false,
                timestamp: BigInt(nIn.timestamp ?? Date.now()),
                actionUrl: nIn.actionUrl ?? null,
            },
        });
        return NextResponse.json({ id: n.id, type: n.type, title: n.title, message: n.message, severity: n.severity, read: n.read, timestamp: Number(n.timestamp), actionUrl: n.actionUrl ?? undefined }, { status: 201 });
    } catch (error: unknown) {
        console.error('Notifications POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
