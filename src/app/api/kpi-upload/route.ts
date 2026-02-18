import { NextResponse } from 'next/server';
import { OfficeParser } from 'officeparser';
import { extractKPIsFromText } from '@/lib/kpi-engine/kpi-extractor';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    let tempPath: string | null = null;

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const validExtensions = ['.pptx', '.docx'];
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

        if (!validExtensions.includes(ext)) {
            return NextResponse.json(
                { error: `Unsupported file type: ${ext}. Upload .pptx or .docx files.` },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Write to temp file with correct extension so officeparser can detect type
        const tempDir = mkdtempSync(join(tmpdir(), 'kpi-upload-'));
        tempPath = join(tempDir, `upload${ext}`);
        writeFileSync(tempPath, buffer);

        // Parse using file path (not buffer) so extension is auto-detected
        const ast = await OfficeParser.parseOffice(tempPath);
        const extractedText = ast.toText();

        // Clean up temp file
        try { unlinkSync(tempPath); tempPath = null; } catch { /* ignore */ }

        if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json({
                error: 'No text content found in file. The document may be empty or image-only.',
                debug: { fileSize: buffer.length, fileName: file.name }
            }, { status: 422 });
        }

        // Run KPI extraction
        const extractedKPIs = extractKPIsFromText(extractedText);

        return NextResponse.json({
            success: true,
            fileName: file.name,
            textLength: extractedText.length,
            extractedText: extractedText.slice(0, 3000),
            kpis: extractedKPIs,
            kpiCount: extractedKPIs.length,
        });
    } catch (error) {
        console.error('[KPI Upload] Parse error:', error);
        return NextResponse.json(
            { error: `Failed to parse file: ${(error as Error).message}` },
            { status: 500 }
        );
    } finally {
        // Clean up temp file on any exit
        if (tempPath) {
            try { unlinkSync(tempPath); } catch { /* ignore */ }
        }
    }
}
