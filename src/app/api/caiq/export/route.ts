/**
 * CAIQ Export API (Binary Excel download)
 *
 * POST /api/caiq/export
 * Step 4: Accepts reviewed answers as JSON → returns binary .xlsx file
 * with proper Content-Disposition header for native browser download.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    computeResults,
    exportToExcel,
    type AnsweredQuestion,
} from '@/lib/caiq/caiq-answer-engine';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const questions: AnsweredQuestion[] = body.questions || [];

        if (questions.length === 0) {
            return NextResponse.json(
                { error: 'No questions provided for export.' },
                { status: 400 }
            );
        }

        const result = computeResults(questions);
        const excelBuffer = await exportToExcel(result);
        const filename = `CAIQ_Completed_${new Date().toISOString().slice(0, 10)}.xlsx`;

        return new NextResponse(new Uint8Array(excelBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(excelBuffer.length),
            },
        });
    } catch (error: any) {
        console.error('[CAIQ Export] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate Excel export' },
            { status: 500 }
        );
    }
}
