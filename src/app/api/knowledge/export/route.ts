import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const format = searchParams.get('format') || 'xlsx';
        const companyId = searchParams.get('companyId');
        const productId = searchParams.get('productId');

        // Fetch common knowledge entries
        const entries = await prisma.knowledgeEntry.findMany({
            orderBy: { domain: 'asc' }
        });

        // Fetch overrides if context is specified
        let companyOverrides: any[] = [];
        let productOverrides: any[] = [];

        if (companyId) {
            companyOverrides = await (prisma as any).knowledgeOverride.findMany({
                where: { scope: 'COMPANY', companyId },
            });
        }
        if (productId) {
            productOverrides = await (prisma as any).knowledgeOverride.findMany({
                where: { scope: 'PRODUCT', productId },
            });
        }

        // ─── JSON Format ─────────────────────────
        if (format === 'json') {
            const exportData = {
                version: '2.0',
                exportedAt: new Date().toISOString(),
                scope: {
                    companyId: companyId || null,
                    productId: productId || null,
                },
                stats: {
                    commonEntries: entries.length,
                    companyOverrides: companyOverrides.length,
                    productOverrides: productOverrides.length,
                },
                commonEntries: entries.map(e => ({
                    id: e.id,
                    domain: e.domain,
                    category: e.category,
                    questionText: e.questionText,
                    questionNormalized: e.questionNormalized,
                    answerType: e.answerType,
                    answerText: e.answerText,
                    evidence: e.evidence,
                    keywords: e.keywords,
                    confidence: e.confidence,
                    usageCount: e.usageCount,
                    source: e.source,
                    frameworks: e.frameworks,
                    jurisdiction: e.jurisdiction,
                    tags: e.tags,
                    approvedBy: e.approvedBy,
                })),
                companyOverrides: companyOverrides.map((o: any) => ({
                    id: o.id,
                    knowledgeEntryId: o.knowledgeEntryId,
                    scope: o.scope,
                    companyId: o.companyId,
                    questionText: o.questionText,
                    answerType: o.answerType,
                    answerText: o.answerText,
                    notes: o.notes,
                })),
                productOverrides: productOverrides.map((o: any) => ({
                    id: o.id,
                    knowledgeEntryId: o.knowledgeEntryId,
                    scope: o.scope,
                    productId: o.productId,
                    questionText: o.questionText,
                    answerType: o.answerType,
                    answerText: o.answerText,
                    notes: o.notes,
                })),
            };

            const json = JSON.stringify(exportData, null, 2);
            return new NextResponse(json, {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': 'attachment; filename="koso_knowledge_base.json"',
                },
            });
        }

        // ─── Excel Format (Default) ──────────────
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Kōsō Intelligence';
        const sheet = workbook.addWorksheet('Knowledge Base');

        sheet.columns = [
            { header: 'ID', key: 'id', width: 36 },
            { header: 'Domain', key: 'domain', width: 15 },
            { header: 'Category', key: 'category', width: 25 },
            { header: 'Question', key: 'questionText', width: 60 },
            { header: 'Answer', key: 'answerText', width: 80 },
            { header: 'Answer Type', key: 'answerType', width: 15 },
            { header: 'Evidence', key: 'evidence', width: 30 },
            { header: 'Keywords', key: 'keywords', width: 40 },
            { header: 'Confidence', key: 'confidence', width: 15 },
            { header: 'Usage Count', key: 'usageCount', width: 15 },
            { header: 'Source', key: 'source', width: 25 },
        ];

        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

        for (const entry of entries) {
            sheet.addRow({
                id: entry.id,
                domain: entry.domain,
                category: entry.category,
                questionText: entry.questionText,
                answerText: entry.answerText,
                answerType: entry.answerType || 'N/A',
                evidence: entry.evidence || '',
                keywords: entry.keywords || '',
                confidence: entry.confidence,
                usageCount: entry.usageCount,
                source: entry.source
            });
        }

        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.getCell('questionText').alignment = { wrapText: true, vertical: 'top' };
                row.getCell('answerText').alignment = { wrapText: true, vertical: 'top' };
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="koso_knowledge_base.xlsx"',
            }
        });
    } catch (error) {
        console.error('[Knowledge Export API]', error);
        return NextResponse.json({ error: 'Failed to export knowledge base' }, { status: 500 });
    }
}
