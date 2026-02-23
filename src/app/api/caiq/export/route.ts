/**
 * CAIQ Export API Route
 *
 * POST /api/caiq/export
 * Body: { questions: AnsweredQuestion[], fileName?: string }
 * Returns: .xlsx file download populated with questions and answers.
 */

import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import type { AnsweredQuestion } from '@/lib/caiq/caiq-knowledge-base';

const CONFIDENCE_LABEL: Record<string, string> = {
    a2a: 'Direct Match (KB)',
    kb: 'KB Match',
    semantic: 'Semantic Match',
    context: 'AI Generated',
    manual: 'Not Answered',
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as {
            questions: AnsweredQuestion[];
            fileName?: string;
        };

        const { questions, fileName = 'questionnaire-answers' } = body;

        if (!questions || questions.length === 0) {
            return NextResponse.json({ error: 'No questions provided' }, { status: 400 });
        }

        // Build the workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Aegis CISO — Knowledge Base';
        workbook.created = new Date();

        const ws = workbook.addWorksheet('Questionnaire Answers', {
            views: [{ state: 'frozen', ySplit: 1 }],
        });

        // Header row
        ws.columns = [
            { header: '#', key: 'num', width: 6 },
            { header: 'Question ID', key: 'id', width: 14 },
            { header: 'Question', key: 'question', width: 55 },
            { header: 'Answer', key: 'answer', width: 60 },
            { header: 'Yes / No', key: 'yesNo', width: 12 },
            { header: 'Confidence', key: 'confidence', width: 13 },
            { header: 'Source', key: 'source', width: 20 },
            { header: 'Domain', key: 'domain', width: 16 },
        ];

        // Style header
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
        headerRow.height = 20;

        // Data rows
        questions.forEach((q, idx) => {
            const confLabel = q.confidence;
            const confPct = confLabel === 'high' ? 95 : confLabel === 'medium' ? 70 : 45;
            const row = ws.addRow({
                num: idx + 1,
                id: q.questionId || `Q${idx + 1}`,
                question: q.questionText,
                answer: q.answer || '',
                yesNo: q.yesNo || '',
                confidence: q.source === 'manual' ? 'N/A' : `${confLabel} (${confPct}%)`,
                source: CONFIDENCE_LABEL[q.source] || q.source,
                domain: (q as unknown as { domain?: string }).domain || '',
            });

            row.alignment = { wrapText: true, vertical: 'top' };
            row.height = 36;

            // Colour-code by confidence
            const confCell = row.getCell('confidence');
            if (q.source === 'manual') {
                confCell.font = { color: { argb: 'FFF87171' } };
            } else if (confLabel === 'high') {
                confCell.font = { color: { argb: 'FF34D399' } };
            } else if (confLabel === 'medium') {
                confCell.font = { color: { argb: 'FFFBBF24' } };
            } else {
                confCell.font = { color: { argb: 'FFFB923C' } };
            }
        });

        // Borders on all cells
        ws.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FF27272A' } },
                };
            });
        });

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${fileName.replace(/\.xlsx?$/, '')}.xlsx"`,
                'Content-Length': buffer.byteLength.toString(),
            },
        });

    } catch (error) {
        console.error('[CAIQ Export]', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Export failed' },
            { status: 500 }
        );
    }
}
