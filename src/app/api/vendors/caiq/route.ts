/**
 * CAIQ Questionnaire Automation API
 *
 * POST /api/vendors/caiq — Upload Excel, process with CAIQAnswerEngine (4-tier pipeline).
 * Returns legacy-shaped result for backward compatibility with /vendors page.
 * Transfer engine remains at POST /api/vendors/caiq/transfer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CAIQExcelParser } from '@/lib/caiq/caiq-excel-parser';
import { buildOrgContext } from '@/lib/caiq/caiq-org-context';
import { CAIQAnswerEngine } from '@/lib/caiq/caiq-answer-engine';
import { getKnowledgeBase } from '@/lib/caiq/caiq-knowledge-base';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';
import { exportToCAIQExcel } from '@/lib/caiq/caiq-export';
import { setCAIQMetrics } from '@/lib/caiq/caiq-metrics';
import type { OrganizationContext } from '@/lib/caiq/types';
import type { CAIQAnswer, CAIQGeneratedBy } from '@/lib/caiq/types';
import type { ConfidenceLevel } from '@/lib/caiq/caiq-knowledge-base';
import type { AnsweredQuestion } from '@/lib/caiq/caiq-knowledge-base';
import { validateFileSize } from '@/lib/api-validation';

interface LegacyProfile {
  industry?: string;
  certifications?: string[];
  orgSize?: string;
  cloudProvider?: string;
  additionalContext?: string;
}

function confidenceFromNumber(c: number): ConfidenceLevel {
  if (c >= 0.8) return 'high';
  if (c >= 0.5) return 'medium';
  return 'low';
}

function sourceFromGeneratedBy(by: CAIQGeneratedBy): 'knowledge-base' | 'ai' | 'manual' {
  if (by === 'KB_EXACT' || by === 'KB_SEMANTIC') return 'knowledge-base';
  if (by === 'AI_PRIMARY' || by === 'AI_FALLBACK') return 'ai';
  return 'manual';
}

function yesNoFromAnswerType(answerType: string): 'Yes' | 'No' | 'N/A' | '' {
  switch (answerType) {
    case 'YES':
      return 'Yes';
    case 'NO':
      return 'No';
    case 'NOT_APPLICABLE':
      return 'N/A';
    case 'CONDITIONAL':
      return '';
    default:
      return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mode = (formData.get('mode') as string) || 'template';
    const profileRaw = (formData.get('profile') as string) || '{}';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please upload an Excel (.xlsx) file.' },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    const isAcceptable =
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      name.endsWith('.xlsm') ||
      name.endsWith('.csv') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel') ||
      file.type.includes('csv') ||
      file.type === 'application/octet-stream' ||
      file.type === '';

    if (!isAcceptable) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${file.type}" (${file.name}). Please upload .xlsx, .xls, or .csv files.`,
        },
        { status: 400 }
      );
    }

    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'No AI provider configured. Set GOOGLE_API_KEY or ANTHROPIC_API_KEY for CAIQ assessment.' },
        { status: 503 }
      );
    }

    let profile: LegacyProfile = {};
    try {
      profile = JSON.parse(profileRaw) as LegacyProfile;
    } catch {
      // use defaults
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new CAIQExcelParser();
    const workbook = await parser.parseIncoming(buffer, file.name);
    const questions = workbook.questions;

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            'No CAIQ questions found in the uploaded file. Ensure the file is a CAIQ v4 questionnaire (.xlsx).',
        },
        { status: 400 }
      );
    }

    let orgContext: OrganizationContext = await buildOrgContext();
    const sizeOverride =
      profile.orgSize === 'Enterprise' || profile.orgSize === 'Startup' || profile.orgSize === 'SMB'
        ? profile.orgSize
        : orgContext.size;
    orgContext = {
      ...orgContext,
      industry: profile.industry ?? orgContext.industry,
      frameworks:
        Array.isArray(profile.certifications) && profile.certifications.length > 0
          ? profile.certifications
          : orgContext.frameworks,
      size: sizeOverride,
    };

    const kb = getKnowledgeBase();
    const ai = getAIProvider();
    const engine = new CAIQAnswerEngine(kb, ai, orgContext, {
      semanticMatchThreshold: 0.8,
      exactMatchConfidence: 0.97,
      aiTemperature: 0.2,
    });

    const result = await engine.generateAnswers(questions, {
      includeEvidence: true,
      flagThreshold: 0.6,
      autoApproveThreshold: 0.9,
    });

    const answerById = new Map<string, CAIQAnswer>();
    for (const a of result.answers) {
      answerById.set(a.questionId, a);
    }

    const answeredByKB = result.answers.filter(
      (a) => a.generatedBy === 'KB_EXACT' || a.generatedBy === 'KB_SEMANTIC'
    ).length;
    const answeredByAI = result.answers.filter(
      (a) => a.generatedBy === 'AI_PRIMARY' || a.generatedBy === 'AI_FALLBACK'
    ).length;
    const unanswered = result.answers.filter((a) => a.generatedBy === 'HUMAN' || !a.answer).length;
    const coveragePct =
      result.answers.length > 0
        ? Math.round(
            (result.answers.filter((a) => a.answer && a.generatedBy !== 'HUMAN').length / result.answers.length) * 100
          )
        : 0;

    const domainBreakdown: Record<string, { total: number; answered: number; pct: number }> = {};
    for (const [domain, { total: t, answered: a }] of Object.entries(result.stats.coverageByDomain)) {
      domainBreakdown[domain] = {
        total: t,
        answered: a,
        pct: t > 0 ? Math.round((a / t) * 100) : 0,
      };
    }

    const legacyQuestions: AnsweredQuestion[] = questions.map((q, idx) => {
      const ans = answerById.get(q.id);
      return {
        rowIndex: q.rowNumber ?? idx,
        questionId: q.id,
        questionText: q.text,
        answer: ans?.answer ?? '',
        yesNo: ans ? yesNoFromAnswerType(ans.answerType) : '',
        confidence: ans ? confidenceFromNumber(ans.confidence) : 'low',
        source: ans ? sourceFromGeneratedBy(ans.generatedBy) : 'manual',
        evidenceRef: ans?.evidenceRefs?.[0] ?? '',
        matchedEntryId: undefined,
      };
    });

    setCAIQMetrics({
      lastAssessmentAt: new Date().toISOString(),
      coveragePercent: Math.round(result.stats.estimatedAccuracy * 100),
      answersPendingReview: result.answers.filter((a) => a.needsReview).length,
    });

    const questionTextMap: Record<string, string> = {};
    for (const q of questions) {
      questionTextMap[q.id] = q.text;
    }

    const exportBuffer = await exportToCAIQExcel(
      { answers: result.answers, stats: result.stats },
      orgContext,
      { questionTextMap }
    );
    const exportBase64 = exportBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      fileName: file.name,
      mode,
      aiAvailable: true,
      result: {
        totalQuestions: result.answers.length,
        answeredByKB,
        answeredByAI,
        unanswered,
        coveragePct,
        domainBreakdown,
        questions: legacyQuestions,
      },
      exportBase64,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process questionnaire';
    console.error('[CAIQ API] Processing error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
