import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const e = await prisma.evidence.update({
            where: { id },
            data: {
                ...(body.name != null && { name: body.name }),
                ...(body.type != null && { type: body.type }),
                ...(body.fileName != null && { fileName: body.fileName }),
                ...(body.fileSize != null && { fileSize: body.fileSize }),
                ...(body.controlIds != null && { controlIds: JSON.stringify(body.controlIds) }),
                ...(body.framework != null && { framework: body.framework }),
                ...(body.status != null && { status: body.status }),
                ...(body.uploadDate != null && { uploadDate: body.uploadDate }),
                ...(body.expiryDate !== undefined && { expiryDate: body.expiryDate || null }),
                ...(body.uploadedBy != null && { uploadedBy: body.uploadedBy }),
                ...(body.notes != null && { notes: body.notes }),
            },
        });
        return NextResponse.json({
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
        });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Evidence PUT:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.evidence.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Evidence DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
