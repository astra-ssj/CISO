import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function mapPolicy(p: { id: string; title: string; content: string; version: string; status: string; type: string | null; owner: string | null; frameworks: string; controls: string; sections: string | null; mappings: string | null; dependencies: string | null; acknowledgment: string | null; changelog: string | null; lastUpdated: string | null; updatedAt: Date }) {
    return {
        id: p.id,
        title: p.title,
        type: (p.type as 'ISMS' | 'PRIVACY' | 'AI_GOV' | 'ACCESS' | 'INCIDENT') || 'ISMS',
        version: p.version,
        status: p.status,
        owner: p.owner ?? '',
        lastUpdated: p.lastUpdated ?? (p.updatedAt && new Date(p.updatedAt).toISOString()) ?? new Date().toISOString(),
        sections: p.sections ? JSON.parse(p.sections) : [],
        mappings: p.mappings ? JSON.parse(p.mappings) : [],
        dependencies: p.dependencies ? JSON.parse(p.dependencies) : [],
        acknowledgment: p.acknowledgment ? JSON.parse(p.acknowledgment) : { status: 'PENDING', totalUsers: 0, signedUsers: 0 },
        changelog: p.changelog ? JSON.parse(p.changelog) : [],
    };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const p = await prisma.policy.update({
            where: { id },
            data: {
                ...(body.title != null && { title: body.title }),
                ...(body.content != null && { content: body.content }),
                ...(body.version != null && { version: body.version }),
                ...(body.status != null && { status: body.status }),
                ...(body.type != null && { type: body.type }),
                ...(body.owner != null && { owner: body.owner }),
                ...(body.frameworks != null && { frameworks: JSON.stringify(body.frameworks) }),
                ...(body.controls != null && { controls: JSON.stringify(body.controls) }),
                ...(body.sections != null && { sections: JSON.stringify(body.sections) }),
                ...(body.mappings != null && { mappings: JSON.stringify(body.mappings) }),
                ...(body.dependencies != null && { dependencies: JSON.stringify(body.dependencies) }),
                ...(body.acknowledgment != null && { acknowledgment: JSON.stringify(body.acknowledgment) }),
                ...(body.changelog != null && { changelog: JSON.stringify(body.changelog) }),
                ...(body.lastUpdated != null && { lastUpdated: body.lastUpdated }),
            },
        });
        return NextResponse.json(mapPolicy(p));
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Policies PUT:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.policy.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Policies DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
