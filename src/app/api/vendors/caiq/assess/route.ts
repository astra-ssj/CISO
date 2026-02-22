/**
 * CAIQ Assess API — Run tiered CAIQ assessment on uploaded Excel.
 * POST /api/vendors/caiq/assess
 * - Accepts: file (Excel), orgContext overrides, options (thresholds, includeEvidence).
 * - Instantiates CAIQAnswerEngine, runs generateAnswers, runs validation.
 * - Returns CAIQAnswerSet + validationResults.
 * - Optional ?stream=true or Accept: text/event-stream for SSE progress.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CAIQExcelParser } from '@/lib/caiq/caiq-excel-parser';
import { buildOrgContext } from '@/lib/caiq/caiq-org-context';
import { CAIQAnswerEngine } from '@/lib/caiq/caiq-answer-engine';
import { CAIQValidator } from '@/lib/caiq/caiq-validator';
import { getKnowledgeBase } from '@/lib/caiq/caiq-knowledge-base';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';
import { getAllCircuitBreakerMetrics } from '@/lib/ai/circuit-breaker';
import { setCAIQMetrics } from '@/lib/caiq/caiq-metrics';
import type { OrganizationContext, CAIQAnswerSet } from '@/lib/caiq/types';
import type { ValidationResult } from '@/lib/caiq/types';
import { validateFileSize } from '@/lib/api-validation';

const DEFAULT_AUTO_APPROVE = 0.9;
const DEFAULT_FLAG_THRESHOLD = 0.6;

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const stream = url.searchParams.get('stream') === 'true' || request.headers.get('accept')?.includes('text/event-stream');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const orgOverridesRaw = formData.get('orgContext') as string | null;
    const autoApproveThreshold = parseFloat((formData.get('autoApproveThreshold') as string) || '') || DEFAULT_AUTO_APPROVE;
    const flagThreshold = parseFloat((formData.get('flagThreshold') as string) || '') || DEFAULT_FLAG_THRESHOLD;
    const includeEvidence = formData.get('includeEvidence') !== 'false';

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
        { error: 'Unsupported file type. Please upload .xlsx or .xls.' },
        { status: 400 }
      );
    }

    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'No AI provider configured. Set GOOGLE_API_KEY or ANTHROPIC_API_KEY.' },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new CAIQExcelParser();
    const workbook = await parser.parseIncoming(buffer, file.name);
    const questions = workbook.questions;

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No CAIQ questions found in the uploaded file.' },
        { status: 400 }
      );
    }

    let orgContext: OrganizationContext = await buildOrgContext();
    if (orgOverridesRaw) {
      try {
        const overrides = JSON.parse(orgOverridesRaw) as Partial<OrganizationContext>;
        orgContext = { ...orgContext, ...overrides };
      } catch {
        // ignore invalid JSON
      }
    }

    const kb = getKnowledgeBase();
    const ai = getAIProvider();
    const engine = new CAIQAnswerEngine(kb, ai, orgContext, {
      semanticMatchThreshold: 0.8,
      exactMatchConfidence: 0.97,
      aiTemperature: 0.2,
    });

    const encoder = new TextEncoder();

    if (stream) {
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`event: circuit\ndata: ${JSON.stringify(getAllCircuitBreakerMetrics())}\n\n`)
          );

          (async () => {
            const progressCounts = { EXACT_MATCH: 0, SEMANTIC_MATCH: 0, AI_GENERATED: 0, FLAGGED: 0 };
            const result = await engine.generateAnswers(questions, {
              includeEvidence,
              flagThreshold,
              autoApproveThreshold,
              onProgress(current, total, lastAnswer) {
                progressCounts[lastAnswer.tier] = (progressCounts[lastAnswer.tier] ?? 0) + 1;
                try {
                  controller.enqueue(
                    encoder.encode(
                      `event: progress\ndata: ${JSON.stringify({
                        current,
                        total,
                        tier: lastAnswer.tier,
                        questionId: lastAnswer.questionId,
                        exactMatch: progressCounts.EXACT_MATCH ?? 0,
                        semanticMatch: progressCounts.SEMANTIC_MATCH ?? 0,
                        aiGenerated: progressCounts.AI_GENERATED ?? 0,
                        flagged: progressCounts.FLAGGED ?? 0,
                      })}\n\n`
                    )
                  );
                } catch {}
              },
            });
            const validator = new CAIQValidator();
            const validationResults: ValidationResult[] = await validator.validateBatch(
              result.answers,
              orgContext
            );
            setCAIQMetrics({
              lastAssessmentAt: new Date().toISOString(),
              coveragePercent: Math.round(result.stats.estimatedAccuracy * 100),
              answersPendingReview: result.answers.filter((a) => a.needsReview).length,
            });
            controller.enqueue(
              encoder.encode(
                `event: result\ndata: ${JSON.stringify({
                  answers: result.answers,
                  stats: result.stats,
                  validationResults,
                  questionSummaries: questions.map((q) => ({ id: q.id, text: q.text, domain: q.domain })),
                })}\n\n`
              )
            );
            controller.close();
          })().catch((err) => {
            try {
              controller.enqueue(
                encoder.encode(
                  `event: error\ndata: ${JSON.stringify({ error: err instanceof Error ? err.message : String(err) })}\n\n`
                )
              );
            } catch {}
            controller.close();
          });
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-store',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming: run synchronously and return JSON
    const result: CAIQAnswerSet = await engine.generateAnswers(questions, {
      includeEvidence,
      flagThreshold,
      autoApproveThreshold,
    });
    const validator = new CAIQValidator();
    const validationResults: ValidationResult[] = await validator.validateBatch(
      result.answers,
      orgContext
    );

    setCAIQMetrics({
      lastAssessmentAt: new Date().toISOString(),
      coveragePercent: Math.round(result.stats.estimatedAccuracy * 100),
      answersPendingReview: result.answers.filter((a) => a.needsReview).length,
    });

    return NextResponse.json({
      answers: result.answers,
      stats: result.stats,
      validationResults,
      questionSummaries: questions.map((q) => ({ id: q.id, text: q.text, domain: q.domain })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message || 'CAIQ assessment failed.' },
      { status: 500 }
    );
  }
}
