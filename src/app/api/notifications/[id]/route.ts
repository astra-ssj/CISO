import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const n = await prisma.notification.update({
            where: { id },
            data: { ...(body.read !== undefined && { read: body.read }) },
        });
        return NextResponse.json({ id: n.id, read: n.read });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Notification PATCH:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.notification.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Notification DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
