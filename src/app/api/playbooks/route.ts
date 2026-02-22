import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const list = await prisma.playbook.findMany({ orderBy: { createdAt: 'desc' } });
        const items = list.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            severity: p.severity,
            status: p.status,
            phases: JSON.parse(p.phases || '[]'),
            startTime: p.startTime ?? undefined,
            endTime: p.endTime ?? undefined,
            evidenceLog: p.evidenceLog ? JSON.parse(p.evidenceLog) : [],
        }));
        return NextResponse.json(items);
    } catch (error: unknown) {
        console.error('Playbooks GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const p = await prisma.playbook.create({
            data: {
                title: body.title,
                description: body.description ?? '',
                severity: body.severity ?? 'MEDIUM',
                status: body.status ?? 'READY',
                phases: JSON.stringify(body.phases ?? []),
                startTime: body.startTime ?? null,
                endTime: body.endTime ?? null,
                evidenceLog: JSON.stringify(body.evidenceLog ?? []),
            },
        });
        return NextResponse.json(
            {
                id: p.id,
                title: p.title,
                description: p.description,
                severity: p.severity,
                status: p.status,
                phases: JSON.parse(p.phases || '[]'),
                startTime: p.startTime ?? undefined,
                endTime: p.endTime ?? undefined,
                evidenceLog: JSON.parse(p.evidenceLog || '[]'),
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Playbooks POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
