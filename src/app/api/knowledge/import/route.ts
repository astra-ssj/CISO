import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { normalizeQuestion, extractKeywords } from '@/lib/knowledge/repository';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const fileName = file.name.toLowerCase();

        // ─── JSON Import ─────────────────────────
        if (fileName.endsWith('.json')) {
            return handleJsonImport(file);
        }

        // ─── Excel Import (Default) ──────────────
        return handleExcelImport(file);

    } catch (error) {
        console.error('[Knowledge Import API]', error);
        return NextResponse.json({ error: 'Failed to process import file' }, { status: 500 });
    }
}

// ════════════════════════════════════════════
// JSON Import Handler
// ════════════════════════════════════════════

async function handleJsonImport(file: File) {
    const text = await file.text();
    let data: any;

    try {
        data = JSON.parse(text);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
    }

    // Validate schema version
    if (!data.version || !data.commonEntries) {
        return NextResponse.json({ error: 'Invalid JSON format. Expected v2.0 schema with commonEntries array.' }, { status: 400 });
    }

    let importedCount = 0;
    let skippedCount = 0;
    let overrideCount = 0;

    // Import common entries
    for (const entry of data.commonEntries) {
        if (!entry.questionText || !entry.answerText) continue;

        const normalized = normalizeQuestion(entry.questionText);

        // Dedup check
        const existing = await prisma.knowledgeEntry.findFirst({
            where: { questionNormalized: normalized }
        });

        if (existing) {
            skippedCount++;
            continue;
        }

        await prisma.knowledgeEntry.create({
            data: {
                questionText: entry.questionText,
                questionNormalized: normalized,
                keywords: entry.keywords || extractKeywords(entry.questionText),
                domain: entry.domain || 'CUSTOM',
                category: entry.category || 'Imported',
                answerType: entry.answerType || 'CONDITIONAL',
                answerText: entry.answerText,
                evidence: entry.evidence || null,
                source: entry.source || 'JSON Import',
                frameworks: entry.frameworks || null,
                jurisdiction: entry.jurisdiction || null,
                tags: entry.tags || null,
                confidence: entry.confidence ?? 1.0,
                approvedBy: entry.approvedBy || 'SYSTEM',
                approvedAt: new Date(),
            }
        });
        importedCount++;
    }

    // Import company overrides
    if (data.companyOverrides && Array.isArray(data.companyOverrides)) {
        for (const override of data.companyOverrides) {
            if (!override.questionText || !override.answerText) continue;
            try {
                await (prisma as any).knowledgeOverride.create({
                    data: {
                        knowledgeEntryId: override.knowledgeEntryId || null,
                        scope: 'COMPANY',
                        companyId: override.companyId || data.scope?.companyId || null,
                        questionText: override.questionText,
                        answerType: override.answerType || 'CONDITIONAL',
                        answerText: override.answerText,
                        notes: override.notes || null,
                    }
                });
                overrideCount++;
            } catch { /* skip on error - may have FK issues */ }
        }
    }

    // Import product overrides
    if (data.productOverrides && Array.isArray(data.productOverrides)) {
        for (const override of data.productOverrides) {
            if (!override.questionText || !override.answerText) continue;
            try {
                await (prisma as any).knowledgeOverride.create({
                    data: {
                        knowledgeEntryId: override.knowledgeEntryId || null,
                        scope: 'PRODUCT',
                        productId: override.productId || data.scope?.productId || null,
                        questionText: override.questionText,
                        answerType: override.answerType || 'CONDITIONAL',
                        answerText: override.answerText,
                        notes: override.notes || null,
                    }
                });
                overrideCount++;
            } catch { /* skip on error */ }
        }
    }

    return NextResponse.json({
        success: true,
        message: `JSON Import complete. ${importedCount} entries imported, ${skippedCount} skipped, ${overrideCount} overrides created.`,
        importedCount,
        skippedCount,
        overrideCount,
    });
}

// ════════════════════════════════════════════
// Excel Import Handler
// ════════════════════════════════════════════

async function handleExcelImport(file: File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
        return NextResponse.json({ error: 'Excel file is empty or invalid' }, { status: 400 });
    }

    const headerRow = sheet.getRow(1);
    const headers: Record<string, number> = {};
    headerRow.eachCell((cell, colNumber) => {
        const val = cell.value?.toString().trim().toLowerCase();
        if (val) headers[val] = colNumber;
    });

    const qIdx = headers['question'] || headers['questiontext'];
    const aIdx = headers['answer'] || headers['answertext'];

    if (!qIdx || !aIdx) {
        return NextResponse.json({ error: 'Missing Required Columns: Question and Answer' }, { status: 400 });
    }

    const domIdx = headers['domain'];
    const catIdx = headers['category'];
    const srcIdx = headers['source'];

    let importedCount = 0;
    let skippedCount = 0;

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
        const row = sheet.getRow(rowNumber);
        const questionRaw = row.getCell(qIdx).value?.toString()?.trim();
        const answerRaw = row.getCell(aIdx).value?.toString()?.trim();

        if (!questionRaw || !answerRaw) continue;

        const domainRaw = domIdx ? row.getCell(domIdx).value?.toString()?.trim() : 'CUSTOM';
        const catRaw = catIdx ? row.getCell(catIdx).value?.toString()?.trim() : 'Imported';
        const sourceRaw = srcIdx ? row.getCell(srcIdx).value?.toString()?.trim() : `Imported: ${file.name}`;

        const normalized = normalizeQuestion(questionRaw);

        const existing = await prisma.knowledgeEntry.findFirst({
            where: { questionNormalized: normalized }
        });

        if (existing) {
            skippedCount++;
            continue;
        }

        await prisma.knowledgeEntry.create({
            data: {
                questionText: questionRaw,
                questionNormalized: normalized,
                keywords: extractKeywords(questionRaw),
                domain: domainRaw || 'CUSTOM',
                category: catRaw || 'Imported',
                answerType: answerRaw.toLowerCase().startsWith('yes') ? 'YES' : 'CONDITIONAL',
                answerText: answerRaw,
                source: sourceRaw || 'Manual Import',
                confidence: 1.0,
                approvedBy: 'SYSTEM',
                approvedAt: new Date(),
            }
        });
        importedCount++;
    }

    return NextResponse.json({
        success: true,
        message: `Import complete. Imported ${importedCount} entries. Skipped ${skippedCount} duplicates.`,
        importedCount,
        skippedCount
    });
}
