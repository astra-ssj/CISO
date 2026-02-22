import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const list = await prisma.evidence.findMany({ orderBy: { createdAt: 'desc' } });
        const items = list.map((e) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            fileName: e.fileName,
            fileSize: e.fileSize,
            controlIds: JSON.parse(e.controlIds || '[]') as string[],
            framework: e.framework,
            status: e.status,
            uploadDate: e.uploadDate,
            expiryDate: e.expiryDate ?? undefined,
            uploadedBy: e.uploadedBy,
            notes: e.notes,
        }));
        return NextResponse.json(items);
    } catch (error: unknown) {
        console.error('Evidence GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const e = await prisma.evidence.create({
            data: {
                name: body.name,
                type: body.type ?? 'OTHER',
                fileName: body.fileName ?? '',
                fileSize: body.fileSize ?? 0,
                controlIds: JSON.stringify(body.controlIds ?? []),
                framework: body.framework ?? '',
                status: body.status ?? 'UPLOADED',
                uploadDate: body.uploadDate ?? new Date().toISOString().split('T')[0],
                expiryDate: body.expiryDate ?? null,
                uploadedBy: body.uploadedBy ?? '',
                notes: body.notes ?? '',
            },
        });
        return NextResponse.json(
            {
                id: e.id,
                name: e.name,
                type: e.type,
                fileName: e.fileName,
                fileSize: e.fileSize,
                controlIds: JSON.parse(e.controlIds || '[]'),
                framework: e.framework,
                status: e.status,
                uploadDate: e.uploadDate,
                expiryDate: e.expiryDate ?? undefined,
                uploadedBy: e.uploadedBy,
                notes: e.notes,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Evidence POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
