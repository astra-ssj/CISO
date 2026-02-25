import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit/audit-service';

function mapPolicy(p: { id: string; title: string; content: string; version: string; status: string; type: string | null; owner: string | null; frameworks: string; controls: string; sections: string | null; mappings: string | null; dependencies: string | null; acknowledgment: string | null; changelog: string | null; lastUpdated: string | null; updatedAt?: Date }) {
    return {
        id: p.id,
        title: p.title,
        type: (p.type as 'ISMS' | 'PRIVACY' | 'AI_GOV' | 'ACCESS' | 'INCIDENT') || 'ISMS',
        version: p.version,
        status: p.status,
        owner: p.owner ?? '',
        lastUpdated: p.lastUpdated ?? (p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()),
        sections: p.sections ? JSON.parse(p.sections) : [],
        mappings: p.mappings ? JSON.parse(p.mappings) : [],
        dependencies: p.dependencies ? JSON.parse(p.dependencies) : [],
        acknowledgment: p.acknowledgment ? JSON.parse(p.acknowledgment) : { status: 'PENDING', totalUsers: 0, signedUsers: 0 },
        changelog: p.changelog ? JSON.parse(p.changelog) : [],
    };
}

export async function GET() {
    try {
        const list = await prisma.policy.findMany({ orderBy: { updatedAt: 'desc' } });
        return NextResponse.json(list.map(mapPolicy));
    } catch (error: unknown) {
        console.error('Policies GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const p = await prisma.policy.create({
            data: {
                title: body.title,
                content: body.content ?? (body.sections?.[0]?.content ?? ''),
                version: body.version ?? '1.0.0',
                status: body.status ?? 'DRAFT',
                type: body.type ?? null,
                owner: body.owner ?? null,
                authorId: body.authorId ?? null,
                frameworks: JSON.stringify(body.frameworks ?? []),
                controls: JSON.stringify(body.controls ?? []),
                sections: body.sections ? JSON.stringify(body.sections) : null,
                mappings: body.mappings ? JSON.stringify(body.mappings) : null,
                dependencies: body.dependencies ? JSON.stringify(body.dependencies) : null,
                acknowledgment: body.acknowledgment ? JSON.stringify(body.acknowledgment) : null,
                changelog: body.changelog ? JSON.stringify(body.changelog) : null,
                lastUpdated: body.lastUpdated ?? new Date().toISOString(),
            },
        });
        await logAudit({
            action: 'CREATE',
            category: 'POLICY',
            resource: 'Policy',
            resourceId: p.id,
            description: `Created policy: ${body.title} (v${body.version ?? '1.0.0'})`,
        });

        return NextResponse.json(mapPolicy(p), { status: 201 });
    } catch (error: unknown) {
        console.error('Policies POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
