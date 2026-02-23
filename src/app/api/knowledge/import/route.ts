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

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.getWorksheet(1); // Assume first sheet
        if (!sheet) {
            return NextResponse.json({ error: 'Excel file is empty or invalid' }, { status: 400 });
        }

        // Get headers mapping
        const headerRow = sheet.getRow(1);
        const headers: Record<string, number> = {};
        headerRow.eachCell((cell, colNumber) => {
            const val = cell.value?.toString().trim().toLowerCase();
            if (val) headers[val] = colNumber;
        });

        // Identify necessary columns
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

        // Iterate through rows starting from index 2
        for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
            const row = sheet.getRow(rowNumber);
            const questionRaw = row.getCell(qIdx).value?.toString()?.trim();
            const answerRaw = row.getCell(aIdx).value?.toString()?.trim();

            if (!questionRaw || !answerRaw) continue;

            const domainRaw = domIdx ? row.getCell(domIdx).value?.toString()?.trim() : 'CUSTOM';
            const catRaw = catIdx ? row.getCell(catIdx).value?.toString()?.trim() : 'Imported';
            const sourceRaw = srcIdx ? row.getCell(srcIdx).value?.toString()?.trim() : `Imported: ${file.name}`;

            const normalized = normalizeQuestion(questionRaw);

            // Dedup
            const existing = await prisma.knowledgeEntry.findFirst({
                where: { questionNormalized: normalized }
            });

            if (existing) {
                // If exists, maybe we just skip or update? We will skip to prevent overwriting validated data.
                skippedCount++;
                continue;
            }

            // Create new entry
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

    } catch (error) {
        console.error('[Knowledge Import API]', error);
        return NextResponse.json({ error: 'Failed to process import file' }, { status: 500 });
    }
}
