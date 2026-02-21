/**
 * CAIQ Parse API — Parse CAIQ v4 Excel and return question count + domain breakdown.
 * POST /api/vendors/caiq/parse
 */

import { NextRequest, NextResponse } from 'next/server';
import { CAIQExcelParser } from '@/lib/caiq/caiq-excel-parser';
import type { CAIQDomain } from '@/lib/caiq/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please upload a CAIQ v4 Excel (.xlsx) file.' },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    const isAcceptable =
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      name.endsWith('.xlsm') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel') ||
      file.type === 'application/octet-stream' ||
      file.type === '';

    if (!isAcceptable) {
      return NextResponse.json(
        { error: `Unsupported file type. Please upload .xlsx or .xls.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new CAIQExcelParser();
    const workbook = await parser.parseIncoming(buffer, file.name);

    const domainBreakdown: Record<string, { count: number; name: string }> = {};
    const domainNames: Record<string, string> = {
      AIS: 'Application & Interface Security',
      AAC: 'Audit Assurance & Compliance',
      BCR: 'Business Continuity & Resilience',
      CCC: 'Change Control & Configuration Management',
      CEK: 'Cryptography, Encryption & Key Management',
      DSP: 'Data Security & Privacy Lifecycle Management',
      GRC: 'Governance, Risk & Compliance',
      HRS: 'Human Resources Security',
      IAM: 'Identity & Access Management',
      IPY: 'Interoperability & Portability',
      IVS: 'Infrastructure & Virtualization Security',
      LOG: 'Logging & Monitoring',
      SEF: 'Security Incident Management, E-Discovery & Cloud Forensics',
      STA: 'Supply Chain Management, Transparency & Accountability',
      TVM: 'Threat & Vulnerability Management',
      UEM: 'Universal Endpoint Management',
    };

    for (const q of workbook.questions) {
      const d = q.domain as CAIQDomain;
      if (!domainBreakdown[d]) {
        domainBreakdown[d] = { count: 0, name: domainNames[d] ?? d };
      }
      domainBreakdown[d].count += 1;
    }

    return NextResponse.json({
      questionCount: workbook.questions.length,
      domainBreakdown,
      sheets: workbook.sheets.map((s) => ({ name: s.name, questionCount: s.questions.length })),
      fileName: workbook.fileName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message || 'Failed to parse CAIQ Excel file.' },
      { status: 500 }
    );
  }
}
