import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { saveFile, getMimeType, isAllowedMimeType, isAllowedFileSize } from '@/lib/evidence/storage';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

// GET /api/evidence — paginated, filterable
export async function GET(req: Request) {
    try {
        const session = await auth();
        const role = (session?.user as { role?: string })?.role;
        if (!role || !['CISO', 'SEC_ENGINEER', 'AUDITOR'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        const category = searchParams.get('category');
        if (category) {
            const cats = category.split(',');
            where.category = cats.length === 1 ? cats[0] : { in: cats };
        }

        const status = searchParams.get('status');
        if (status) {
            const sts = status.split(',');
            where.status = sts.length === 1 ? sts[0] : { in: sts };
        }

        const framework = searchParams.get('framework');
        if (framework) {
            where.frameworks = { contains: framework };
        }

        const company = searchParams.get('company');
        if (company) where.companyId = company;

        const search = searchParams.get('search');
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { tags: { contains: search } },
            ];
        }

        const expiringBefore = searchParams.get('expiringBefore');
        if (expiringBefore) {
            where.expiresAt = { lte: new Date(expiringBefore) };
            where.status = 'ACTIVE';
        }

        const [evidence, total] = await Promise.all([
            prisma.evidence.findMany({
                where,
                include: { links: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.evidence.count({ where }),
        ]);

        return NextResponse.json({
            evidence: evidence.map((e) => ({
                ...e,
                tags: e.tags ? JSON.parse(e.tags) : [],
                frameworks: e.frameworks ? JSON.parse(e.frameworks) : [],
                metadata: e.metadata ? JSON.parse(e.metadata) : null,
            })),
            total,
            page,
            limit,
        });
    } catch (error: unknown) {
        console.error('Evidence GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// POST /api/evidence/upload — multipart file upload
export async function POST(req: Request) {
    try {
        const session = await auth();
        const user = session?.user as { id?: string; name?: string; role?: string };
        if (!user?.role || !['CISO', 'SEC_ENGINEER'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const metadataStr = formData.get('metadata') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!isAllowedFileSize(file.size)) {
            return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
        }

        const mimeType = getMimeType(file.name);
        if (!isAllowedMimeType(mimeType)) {
            return NextResponse.json(
                { error: 'File type not allowed. Accepted: PDF, DOCX, XLSX, PNG, JPG, CSV, TXT, ZIP' },
                { status: 400 }
            );
        }

        const metadata = metadataStr ? JSON.parse(metadataStr) : {};

        // Create evidence record first to get ID
        const evidence = await prisma.evidence.create({
            data: {
                title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
                description: metadata.description || null,
                fileName: file.name,
                fileSize: file.size,
                mimeType,
                filePath: '', // will update after saving
                category: metadata.category || 'OTHER',
                status: 'ACTIVE',
                expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : null,
                uploadedBy: user.id || 'unknown',
                uploadedByName: user.name || null,
                tags: metadata.tags ? JSON.stringify(metadata.tags) : null,
                frameworks: metadata.frameworks ? JSON.stringify(metadata.frameworks) : null,
                companyId: metadata.companyId || null,
                metadata: metadata.extra ? JSON.stringify(metadata.extra) : null,
            },
        });

        // Save file to disk
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = await saveFile(buffer, evidence.id, file.name);

        // Update with actual file path
        const updated = await prisma.evidence.update({
            where: { id: evidence.id },
            data: { filePath },
            include: { links: true },
        });

        // Audit log
        await logAudit({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'CREATE',
            category: 'EVIDENCE',
            resource: 'Evidence',
            resourceId: updated.id,
            description: `Uploaded evidence: ${updated.title} (${file.name}, ${(file.size / 1024).toFixed(1)}KB)`,
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json(
            {
                ...updated,
                tags: updated.tags ? JSON.parse(updated.tags) : [],
                frameworks: updated.frameworks ? JSON.parse(updated.frameworks) : [],
                metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
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
