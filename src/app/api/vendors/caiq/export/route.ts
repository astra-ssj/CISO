/**
 * CAIQ Export API
 *
 * Two modes:
 *
 * 1) Export to CAIQ Excel or PDF (completed assessment)
 *    POST with JSON body: { format: 'excel' | 'pdf', answerSet: CAIQAnswerSet, orgContext: OrganizationContext }
 *    Optional: assessor, questionTextMap, aiProvider (for Excel metadata).
 *    Returns file for download.
 *
 * 2) Write answers back to uploaded Excel (legacy)
 *    POST with formData: "file" (Excel), "answers" (JSON string of CAIQAnswer[]).
 *    Returns modified Excel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CAIQExcelParser } from '@/lib/caiq/caiq-excel-parser';
import { exportToCAIQExcel, exportToAuditPDF } from '@/lib/caiq/caiq-export';
import type { CAIQAnswer, CAIQAnswerSet, OrganizationContext } from '@/lib/caiq/types';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    // —— Mode 1: JSON body — format + answerSet + orgContext ——
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const format = body?.format as string | undefined;
      const answerSet = body?.answerSet as CAIQAnswerSet | undefined;
      const orgContext = body?.orgContext as OrganizationContext | undefined;

      if (!format || !answerSet?.answers || !orgContext?.name) {
        return NextResponse.json(
          {
            error:
              'Missing or invalid body. Send JSON: { format: "excel" | "pdf", answerSet: { answers, stats }, orgContext: { name, ... } }.',
          },
          { status: 400 }
        );
      }

      if (format !== 'excel' && format !== 'pdf') {
        return NextResponse.json(
          { error: 'Invalid format. Use "excel" or "pdf".' },
          { status: 400 }
        );
      }

      const assessor = body.assessor as string | undefined;
      const questionTextMap = body.questionTextMap as Record<string, string> | undefined;
      const aiProvider = body.aiProvider as string | undefined;

      if (format === 'excel') {
        const buffer = await exportToCAIQExcel(answerSet, orgContext, {
          assessor,
          questionTextMap,
          aiProvider,
        });
        const fileName = `CAIQ_v4_${orgContext.name.replace(/[^\w\s-]/g, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }

      const buffer = await exportToAuditPDF(answerSet, orgContext, { assessor, questionTextMap });
      const fileName = `CAIQ_Audit_Report_${orgContext.name.replace(/[^\w\s-]/g, '')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // —— Mode 2: formData — file + answers (write back to Excel) ——
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
    return new NextResponse(new Uint8Array(outBuffer), {
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
