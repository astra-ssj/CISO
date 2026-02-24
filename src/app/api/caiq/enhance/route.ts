/**
 * CAIQ Enhance API Route — Step 3: AI Enhancement
 * 
 * Two-stage SSE streaming:
 *   Stage 1: Tier 2 AI Semantic Matching
 *   Stage 2: Tier 3 AI Context Synthesis
 * 
 * Accepts questions + source entries + org profile.
 * Streams progress events to the frontend.
 */

import { NextRequest } from 'next/server';
import {
    semanticMatch,
    contextGenerate,
    type OrgProfile,
} from '@/lib/caiq/caiq-answer-engine';
import type { AnsweredQuestion } from '@/lib/caiq/caiq-knowledge-base';
import type { SourceEntry } from '@/lib/caiq/caiq-answer-engine';
import { getAIProvider } from '@/lib/ai/engine';
import { parseBodyWithZod, caiqEnhanceBodySchema, log } from '@/lib/api-validation';

export async function POST(request: NextRequest) {
    try {
        const raw = await request.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, caiqEnhanceBodySchema);
        if ('error' in parsed) return parsed.error;

        const {
            questions,
            sourceEntries,
            profile,
        } = parsed.data as unknown as {
            questions: AnsweredQuestion[];
            sourceEntries: SourceEntry[];
            profile: OrgProfile;
        };

        const provider = getAIProvider();
        const aiGenerateContent = provider.generateContent.bind(provider);
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const send = (event: string, data: any) => {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    let currentQuestions = questions;
                    const unmatchedCount = questions.filter(q => q.source === 'manual').length;

                    // ── Stage 1: Tier 2 Semantic Matching ──
                    send('stage', { stage: 'semantic', message: 'Running AI semantic matching...', total: unmatchedCount });

                    if (sourceEntries && sourceEntries.length > 0) {
                        currentQuestions = await semanticMatch(
                            currentQuestions,
                            sourceEntries,
                            profile,
                            aiGenerateContent,
                            'authenticated-user',
                            'gemini-1.5-pro',
                            (processed, total) => {
                                send('progress', {
                                    stage: 'semantic',
                                    processed,
                                    total,
                                    message: `Semantic matching: ${processed}/${total} questions`,
                                });
                            },
                        );

                        const semanticMatched = currentQuestions.filter(q => q.source === 'semantic').length;
                        send('stage_complete', {
                            stage: 'semantic',
                            matched: semanticMatched,
                            message: `Semantic matching complete: ${semanticMatched} matches found`,
                        });
                    } else {
                        send('stage_complete', {
                            stage: 'semantic',
                            matched: 0,
                            message: 'No source entries — skipping semantic matching',
                        });
                    }

                    // ── Stage 2: Tier 3 Context Generation ──
                    const remainingUnmatched = currentQuestions.filter(q => q.source === 'manual').length;
                    send('stage', { stage: 'context', message: 'Running AI context generation...', total: remainingUnmatched });

                    if (remainingUnmatched > 0 && sourceEntries && sourceEntries.length > 0) {
                        currentQuestions = await contextGenerate(
                            currentQuestions,
                            sourceEntries,
                            profile,
                            aiGenerateContent,
                            'authenticated-user',
                            'gemini-1.5-pro',
                            (processed, total) => {
                                send('progress', {
                                    stage: 'context',
                                    processed,
                                    total,
                                    message: `Context synthesis: ${processed}/${total} questions`,
                                });
                            },
                        );

                        const contextGenerated = currentQuestions.filter(q => q.source === 'context').length;
                        send('stage_complete', {
                            stage: 'context',
                            matched: contextGenerated,
                            message: `Context synthesis complete: ${contextGenerated} answers generated`,
                        });
                    } else {
                        send('stage_complete', {
                            stage: 'context',
                            matched: 0,
                            message: remainingUnmatched === 0
                                ? 'All questions answered — no context generation needed'
                                : 'No source entries for context synthesis',
                        });
                    }

                    // ── Final result ──
                    send('complete', {
                        questions: currentQuestions,
                        stats: {
                            a2a: currentQuestions.filter(q => q.source === 'a2a').length,
                            semantic: currentQuestions.filter(q => q.source === 'semantic').length,
                            context: currentQuestions.filter(q => q.source === 'context').length,
                            manual: currentQuestions.filter(q => q.source === 'manual').length,
                        },
                    });

                } catch (error) {
                    console.error('[CAIQ Enhance] Stream error:', error);
                    send('error', {
                        message: error instanceof Error ? error.message : 'AI enhancement failed',
                    });
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('[CAIQ Enhance] Error:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Enhancement failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}
