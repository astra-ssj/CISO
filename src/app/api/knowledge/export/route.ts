import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET() {
    try {
        const entries = await prisma.knowledgeEntry.findMany({
            orderBy: { domain: 'asc' }
        });

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

        // Style the header row
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

        // Add rows
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

        // Enable wrapping for long text
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
