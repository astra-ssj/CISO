/**
 * CAIQ Export API — Write answers back to CAIQ v4 Excel and return file.
 * POST /api/vendors/caiq/export
 * Body: formData with "file" (original Excel) and "answers" (JSON string of CAIQAnswer[]).
 */

import { NextRequest, NextResponse } from 'next/server';
import { CAIQExcelParser } from '@/lib/caiq/caiq-excel-parser';
import type { CAIQAnswer } from '@/lib/caiq/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const answersRaw = formData.get('answers') as string | null;

    if (!file || !answersRaw) {
      return NextResponse.json(
        { error: 'Missing file or answers. Send "file" (Excel) and "answers" (JSON array).' },
        { status: 400 }
      );
    }

    let answers: CAIQAnswer[];
    try {
      answers = JSON.parse(answersRaw) as CAIQAnswer[];
    } catch {
      return NextResponse.json(
        { error: 'Invalid "answers" JSON.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new CAIQExcelParser();
    const workbook = await parser.parseIncoming(buffer, file.name);
    const outBuffer = await parser.writeAnswers(buffer, answers, workbook.columnMap);

    const fileName = file.name.replace(/\.xlsx?$/i, '') + '_CAIQ_Answered.xlsx';
    return new NextResponse(outBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message || 'Export failed.' },
      { status: 500 }
    );
  }
}
