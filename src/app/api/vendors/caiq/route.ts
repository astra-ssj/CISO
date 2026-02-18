/**
 * CAIQ Questionnaire Automation API
 * 
 * POST /api/vendors/caiq — Upload Excel, process with KB + optional AI
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    parseQuestionnaire,
    matchToKnowledgeBase,
    enhanceWithAI,
    computeResults,
    exportToExcel,
    type OrgProfile,
} from '@/lib/caiq/caiq-answer-engine';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const mode = formData.get('mode') as string || 'template'; // 'template' | 'ai'
        const profileRaw = formData.get('profile') as string || '{}';

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded. Please upload an Excel (.xlsx) file.' },
                { status: 400 }
            );
        }

        // Validate file type — be very lenient, xlsx library handles most formats
        const name = file.name.toLowerCase();
        const isAcceptable = name.endsWith('.xlsx') || name.endsWith('.xls')
            || name.endsWith('.csv') || name.endsWith('.xlsm')
            || file.type.includes('spreadsheet') || file.type.includes('excel')
            || file.type.includes('csv') || file.type === 'application/octet-stream'
            || file.type === '';

        if (!isAcceptable) {
            return NextResponse.json(
                { error: `Unsupported file type "${file.type}" (${file.name}). Please upload .xlsx, .xls, or .csv files.` },
                { status: 400 }
            );
        }

        // Parse org profile
        let profile: OrgProfile;
        try {
            profile = JSON.parse(profileRaw);
        } catch {
            profile = {
                industry: 'Technology',
                certifications: ['SOC 2 Type II', 'ISO 27001'],
                orgSize: 'Mid-size',
                cloudProvider: 'AWS',
                additionalContext: '',
            };
        }

        // Step 1: Parse the Excel file
        const buffer = await file.arrayBuffer();
        console.log(`[CAIQ API] File: ${file.name}, Size: ${buffer.byteLength} bytes, Type: ${file.type}`);

        const questions = parseQuestionnaire(buffer);
        console.log(`[CAIQ API] Detected ${questions.length} questions`);

        if (questions.length === 0) {
            // Log more detail to help debug
            const XLSX = await import('xlsx');
            const wb = XLSX.read(buffer, { type: 'array' });
            const sheetInfo = wb.SheetNames.map(name => {
                const sheet = wb.Sheets[name];
                const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                const colCount = Math.max(0, ...rows.slice(0, 5).map(r => (r ? r.length : 0)));
                return `"${name}" (${rows.length} rows, ~${colCount} cols)`;
            }).join(', ');
            console.error(`[CAIQ API] No questions found. Sheets: [${sheetInfo}]`);

            return NextResponse.json(
                { error: `No questions detected. File has sheets: [${sheetInfo}]. Ensure the spreadsheet contains a column with questionnaire questions (text cells with 5+ characters).` },
                { status: 400 }
            );
        }

        // Step 2: Match to knowledge base
        let answered = matchToKnowledgeBase(questions);

        // Step 3: Optionally enhance with AI
        if (mode === 'ai' && isAIConfigured()) {
            try {
                const provider = getAIProvider();
                answered = await enhanceWithAI(
                    answered,
                    profile,
                    (prompt) => provider.generateContent(prompt)
                );
            } catch (error) {
                console.error('[CAIQ API] AI enhancement failed, returning KB-only results:', error);
                // Continue with KB results only
            }
        }

        // Step 4: Compute results
        const result = computeResults(answered);

        // Step 5: Generate export Excel
        const exportBuffer = exportToExcel(result);
        const exportBase64 = Buffer.from(exportBuffer).toString('base64');

        return NextResponse.json({
            success: true,
            fileName: file.name,
            mode,
            aiAvailable: isAIConfigured(),
            result: {
                totalQuestions: result.totalQuestions,
                answeredByKB: result.answeredByKB,
                answeredByAI: result.answeredByAI,
                unanswered: result.unanswered,
                coveragePct: result.coveragePct,
                domainBreakdown: result.domainBreakdown,
                questions: result.questions,
            },
            exportBase64,
        });
    } catch (error: any) {
        console.error('[CAIQ API] Processing error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process questionnaire' },
            { status: 500 }
        );
    }
}
