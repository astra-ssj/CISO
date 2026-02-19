/**
 * CAIQ Knowledge Transfer API
 *
 * POST /api/vendors/caiq/transfer
 * - Accepts two files: source (answered) + target (empty)
 * - Runs 3-tier matching pipeline
 * - Returns results for HITL review UI
 *
 * POST /api/vendors/caiq/transfer/export
 * - Accepts reviewed answers JSON
 * - Returns completed Excel file
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    processTransfer,
    exportTransferToExcel,
    type TransferResult,
    type TransferredAnswer,
} from '@/lib/caiq/caiq-transfer-engine';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const sourceFile = formData.get('source') as File | null;
        const targetFile = formData.get('target') as File | null;
        const action = formData.get('action') as string || 'process'; // 'process' | 'export'

        // ── Export action: receives reviewed answers JSON, returns Excel ──
        if (action === 'export') {
            const answersRaw = formData.get('answers') as string;
            if (!answersRaw) {
                return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
            }

            const answers: TransferredAnswer[] = JSON.parse(answersRaw);
            const result: TransferResult = {
                sourceCount: 0,
                targetCount: answers.length,
                tier1Matches: answers.filter(a => a.tier === 'tier1').length,
                tier2Matches: answers.filter(a => a.tier === 'tier2').length,
                tier3Matches: answers.filter(a => a.tier === 'tier3').length,
                unmatched: answers.filter(a => a.tier === 'unmatched').length,
                coveragePct: Math.round((answers.filter(a => a.answer).length / answers.length) * 100),
                answers,
            };

            const excelBuffer = await exportTransferToExcel(result);
            const base64 = excelBuffer.toString('base64');

            return NextResponse.json({ success: true, exportBase64: base64 });
        }

        // ── Process action: dual file upload → 3-tier matching ──
        if (!sourceFile || !targetFile) {
            return NextResponse.json(
                { error: 'Both source (answered) and target (empty) Excel files are required.' },
                { status: 400 }
            );
        }

        // Validate files
        for (const file of [sourceFile, targetFile]) {
            const name = file.name.toLowerCase();
            const validExt = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') || name.endsWith('.xlsm');
            const validType = file.type.includes('spreadsheet') || file.type.includes('excel')
                || file.type.includes('csv') || file.type === 'application/octet-stream' || file.type === '';
            if (!validExt && !validType) {
                return NextResponse.json(
                    { error: `Unsupported file: "${file.name}". Please upload .xlsx/.xls/.csv files.` },
                    { status: 400 }
                );
            }
        }

        console.log(`[CAIQ Transfer] Source: ${sourceFile.name} (${sourceFile.size}B), Target: ${targetFile.name} (${targetFile.size}B)`);

        const sourceBuffer = await sourceFile.arrayBuffer();
        const targetBuffer = await targetFile.arrayBuffer();

        // AI function (optional)
        let aiGenerate: ((prompt: string) => Promise<string>) | undefined;
        if (isAIConfigured()) {
            const provider = getAIProvider();
            aiGenerate = (prompt: string) => provider.generateContent(prompt);
        }

        const result = await processTransfer(sourceBuffer, targetBuffer, aiGenerate);

        console.log(`[CAIQ Transfer] Results: T1=${result.tier1Matches}, T2=${result.tier2Matches}, T3=${result.tier3Matches}, Unmatched=${result.unmatched}, Coverage=${result.coveragePct}%`);

        return NextResponse.json({
            success: true,
            aiAvailable: isAIConfigured(),
            stats: {
                sourceCount: result.sourceCount,
                targetCount: result.targetCount,
                tier1Matches: result.tier1Matches,
                tier2Matches: result.tier2Matches,
                tier3Matches: result.tier3Matches,
                unmatched: result.unmatched,
                coveragePct: result.coveragePct,
            },
            answers: result.answers,
        });
    } catch (error: any) {
        console.error('[CAIQ Transfer] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process knowledge transfer' },
            { status: 500 }
        );
    }
}
