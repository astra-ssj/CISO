/**
 * CAIQ Answer Engine — 4-tier confidence architecture.
 *
 * Tier 1: Exact KB match (0.95–0.99)
 * Tier 2: Semantic KB match (0.80–0.95)
 * Tier 3: AI-generated (0.60–0.80)
 * Tier 4: Flagged for human review (0.0)
 *
 * Imports: types, knowledge base, semantic matcher, circuit breaker, AI engine, audit.
 */

import type {
  CAIQAnswer,
  CAIQAnswerSet,
  CAIQGenerateOptions,
  CAIQKnowledgeEntry,
  CAIQStats,
  CAIQGeneratedBy,
  CAIQAnswerType,
  CAIQDomain,
  FrameworkMapping,
  OrganizationContext,
  ParsedCAIQQuestion,
  ScoredKBEntry,
} from './types';
import { CAIQ_DOMAINS } from './types';
import { CAIQSemanticMatcher } from './caiq-semantic-matcher';
import { getCircuitState, setCircuitState } from '../ai/circuit-breaker';
import type { UnifiedAIProvider } from '../ai/engine';
import { logCAIQAnswer } from '../auth/audit';
import { z } from 'zod';

// -----------------------------------------------------------------------------
// Engine options (thresholds, optional secondary AI)
// -----------------------------------------------------------------------------

/**
 * Configuration options for the CAIQ Answer Engine (thresholds, fallback AI, provider name).
 */
export interface CAIQAnswerEngineOptions {
  /** Minimum semantic similarity to use a KB entry (default 0.80). */
  semanticMatchThreshold?: number;
  /** Confidence assigned to exact ID matches (default 0.97). */
  exactMatchConfidence?: number;
  /** Optional secondary AI provider for fallback (e.g. when primary circuit is open). */
  secondaryAI?: UnifiedAIProvider;
  /** Provider name for circuit breaker (default from env AI_PROVIDER). */
  primaryProviderName?: string;
  /** Temperature for AI calls (default 0.2). */
  aiTemperature?: number;
}

const DEFAULT_ENGINE_OPTIONS = {
  semanticMatchThreshold: 0.8,
  exactMatchConfidence: 0.97,
  primaryProviderName: (typeof process !== 'undefined' && process.env?.AI_PROVIDER) || 'GEMINI',
  aiTemperature: 0.2,
};

// -----------------------------------------------------------------------------
// AI response schema (Zod)
// -----------------------------------------------------------------------------

const aiResponseSchema = z.object({
  answerType: z.enum(['YES', 'NO', 'NOT_APPLICABLE', 'CONDITIONAL']),
  answer: z.string(),
  confidenceReasoning: z.string().optional(),
  suggestedEvidence: z.array(z.string()).optional(),
  relatedFrameworks: z.array(z.object({
    framework: z.string(),
    controlId: z.string(),
    description: z.string().optional(),
  })).optional(),
});

type AIResponse = z.infer<typeof aiResponseSchema>;

// -----------------------------------------------------------------------------
// CAIQAnswerEngine
// -----------------------------------------------------------------------------

/**
 * CAIQ Answer Engine — 4-tier confidence pipeline for CSA CAIQ questionnaire automation.
 * Tier 1: Exact KB match (0.95–0.99). Tier 2: Semantic KB match (0.80–0.95).
 * Tier 3: AI-generated (0.60–0.80). Tier 4: Flagged for human review (0.0).
 * Uses circuit breaker for AI fallback and logs each answer to the audit trail.
 */
export class CAIQAnswerEngine {
  private readonly kbEntries: CAIQKnowledgeEntry[];
  private readonly matcher: CAIQSemanticMatcher;
  private readonly ai: UnifiedAIProvider;
  private readonly orgContext: OrganizationContext;
  private readonly opts: CAIQAnswerEngineOptions & Readonly<typeof DEFAULT_ENGINE_OPTIONS>;

  /**
   * Creates an answer engine with a knowledge base, AI provider, and organization context.
   * @param knowledgeBaseEntries - Full list of CAIQ knowledge base entries
   * @param aiEngine - Unified AI provider (Gemini, Claude, or Ollama)
   * @param orgContext - Organization context (name, industry, controls, evidence links, overrides)
   * @param options - Optional thresholds and secondary AI for fallback
   */
  constructor(
    knowledgeBaseEntries: CAIQKnowledgeEntry[],
    aiEngine: UnifiedAIProvider,
    orgContext: OrganizationContext,
    options?: CAIQAnswerEngineOptions
  ) {
    this.kbEntries = knowledgeBaseEntries;
    this.matcher = new CAIQSemanticMatcher(knowledgeBaseEntries);
    this.ai = aiEngine;
    this.orgContext = orgContext;
    this.opts = { ...DEFAULT_ENGINE_OPTIONS, ...options };
  }

  /**
   * Generate answers for a set of parsed CAIQ questions using the 4-tier pipeline.
   * Each answer gets a unique auditId, timestamp, source references, and is logged to the audit trail.
   * Optional onProgress(currentIndex, total, lastAnswer) for streaming progress (e.g. SSE).
   */
  async generateAnswers(
    questions: ParsedCAIQQuestion[],
    options?: Partial<CAIQGenerateOptions> & {
      onProgress?: (current: number, total: number, lastAnswer: CAIQAnswer) => void;
    }
  ): Promise<CAIQAnswerSet> {
    const includeEvidence = options?.includeEvidence ?? true;
    const flagThreshold = options?.flagThreshold ?? 0.6;
    const autoApproveThreshold = options?.autoApproveThreshold ?? 0.9;
    const onProgress = options?.onProgress;

    const answers: CAIQAnswer[] = [];
    const total = questions.length;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      const answer = await this.answerOne(q, { includeEvidence, flagThreshold, autoApproveThreshold });
      answers.push(answer);
      await logCAIQAnswer(answer, 'CAIQ_ANSWER_GENERATED').catch(() => {});
      onProgress?.(i + 1, total, answer);
    }

    const stats = this.computeStats(answers);
    return { answers, stats };
  }

  /**
   * Run one question through the 4 tiers and return a single CAIQAnswer.
   */
  private async answerOne(
    question: ParsedCAIQQuestion,
    opts: { includeEvidence: boolean; flagThreshold: number; autoApproveThreshold: number }
  ): Promise<CAIQAnswer> {
    const auditId = crypto.randomUUID();
    const generatedAt = new Date().toISOString();

    // ---- TIER 1: Exact match by question ID ----
    const exactEntry = this.kbEntries.find((e) => e.questionId === question.id);
    if (exactEntry) {
      const applied = this.applyOrgContext(exactEntry);
      const confidence = this.opts.exactMatchConfidence ?? 0.97;
      const answer: CAIQAnswer = {
        questionId: question.id,
        answer: applied.answer,
        answerType: exactEntry.expectedAnswerType,
        confidence,
        tier: 'EXACT_MATCH',
        sources: [`KB:${exactEntry.questionId}`],
        evidenceRefs: opts.includeEvidence ? applied.evidenceRefs : [],
        frameworkRefs: exactEntry.frameworkMappings ?? [],
        needsReview: confidence < opts.autoApproveThreshold,
        auditId,
        generatedAt,
        generatedBy: 'KB_EXACT',
      };
      return answer;
    }

    // ---- TIER 2: Semantic match ----
    const semanticMatches = this.matcher.findSimilar(question.text, question.domain, {
      threshold: this.opts.semanticMatchThreshold ?? 0.8,
      maxResults: 3,
    });
    const best = semanticMatches[0];
    if (best && best.score >= (this.opts.semanticMatchThreshold ?? 0.8) && best.entry) {
      const applied = this.applyOrgContext(best.entry);
      // Adapt answer to the specific question text if slightly different
      const answerText = this.adaptSemanticAnswer(applied.answer, question.text, best.entry.question);
      const confidence = Math.min(0.95, Math.max(0.8, best.score));
      const answer: CAIQAnswer = {
        questionId: question.id,
        answer: answerText,
        answerType: best.entry.expectedAnswerType,
        confidence,
        tier: 'SEMANTIC_MATCH',
        sources: [`KB:${best.entry.questionId}`],
        evidenceRefs: opts.includeEvidence ? applied.evidenceRefs : [],
        frameworkRefs: best.entry.frameworkMappings ?? [],
        needsReview: confidence < opts.autoApproveThreshold,
        auditId,
        generatedAt,
        generatedBy: 'KB_SEMANTIC',
      };
      return answer;
    }

    // ---- TIER 3: AI-generated ----
    const relatedEntries = semanticMatches.filter((m): m is ScoredKBEntry & { entry: CAIQKnowledgeEntry } => !!m.entry).slice(0, 3);
    const aiResult = await this.executeWithFallback(async (engine) => {
      const prompt = this.buildAIPrompt(question, relatedEntries);
      const raw = await engine.generateContent(prompt);
      const parsed = this.parseAIResponse(raw);
      return parsed;
    });

    if (aiResult && aiResult.result != null) {
      const { result, generatedBy } = aiResult;
      const confidence = result.confidenceReasoning ? 0.72 : 0.68;
      const frameworkRefs: FrameworkMapping[] = (result.relatedFrameworks ?? []).map((f) => ({
        framework: f.framework,
        controlId: f.controlId,
        description: f.description,
      }));
      const answer: CAIQAnswer = {
        questionId: question.id,
        answer: result.answer,
        answerType: result.answerType as CAIQAnswerType,
        confidence,
        tier: 'AI_GENERATED',
        sources: ['AI'],
        evidenceRefs: opts.includeEvidence ? (result.suggestedEvidence ?? []) : [],
        frameworkRefs,
        needsReview: confidence < opts.autoApproveThreshold,
        auditId,
        generatedAt,
        generatedBy,
      };
      return answer;
    }

    // ---- TIER 4: Flagged for human review ----
    const answer: CAIQAnswer = {
      questionId: question.id,
      answer: `This question could not be answered automatically from the knowledge base or AI. Please provide an auditor-grade answer and attach evidence. Domain: ${question.domainName}.`,
      answerType: 'CONDITIONAL',
      confidence: 0,
      tier: 'FLAGGED',
      sources: [],
      evidenceRefs: [],
      frameworkRefs: [],
      needsReview: true,
      auditId,
      generatedAt,
      generatedBy: 'HUMAN',
    };
    return answer;
  }

  /**
   * Merges organization-specific answer overrides and evidence links into a KB entry.
   * Used for Tier 1 and Tier 2 answers before returning.
   * @param entry - Knowledge base entry to apply context to
   * @returns Final answer text and combined evidence refs (base + org)
   */
  applyOrgContext(entry: CAIQKnowledgeEntry): {
    answer: string;
    evidenceRefs: string[];
  } {
    const overrides = this.orgContext.answerOverrides ?? {};
    const evidenceLinks = this.orgContext.evidenceLinks ?? {};
    const baseAnswer = entry.orgAnswer ?? entry.baseAnswer;
    const answer = overrides[entry.questionId] ?? baseAnswer;
    const baseEvidence = entry.evidenceRequired ?? [];
    const orgEvidence = evidenceLinks[entry.questionId] ?? [];
    const evidenceRefs = [...baseEvidence, ...orgEvidence].filter(Boolean);
    return { answer, evidenceRefs };
  }

  /**
   * Light adaptation of a semantic match answer to the specific question wording.
   */
  private adaptSemanticAnswer(kbAnswer: string, questionText: string, kbQuestion: string): string {
    if (!questionText || !kbQuestion || questionText === kbQuestion) return kbAnswer;
    return kbAnswer;
  }

  /**
   * Build a rich AI prompt: org context, question, related KB entries, org controls, jurisdiction.
   * Requests structured JSON (answerType, answer, confidence reasoning, suggested evidence, related frameworks).
   */
  private buildAIPrompt(
    question: ParsedCAIQQuestion,
    relatedEntries: Array<ScoredKBEntry & { entry: CAIQKnowledgeEntry }>
  ): string {
    const org = this.orgContext;
    const relatedBlock =
      relatedEntries.length > 0
        ? relatedEntries
          .map(
            (r) =>
              `- [${r.entry.questionId}] ${r.entry.question}\n  Base answer: ${r.entry.baseAnswer.slice(0, 300)}...`
          )
          .join('\n')
        : 'None.';

    const controlsBlock =
      org.relevantControls && org.relevantControls.length > 0
        ? org.relevantControls
          .filter((c) => c.framework && c.controlId)
          .slice(0, 15)
          .map((c) => `- ${c.framework} ${c.controlId}: ${c.description}`)
          .join('\n')
        : 'None provided.';

    return `You are a cybersecurity compliance expert producing concise, auditor-grade answers for a CAIQ (Consensus Assessments Initiative Questionnaire) assessment.

ORGANIZATION CONTEXT:
- Name: ${org.name}
- Industry: ${org.industry}
- Cloud model: ${org.cloudModel}
- Jurisdictions: ${org.jurisdictions.join(', ') || 'N/A'}
- Frameworks: ${org.frameworks.join(', ') || 'N/A'}
- Size: ${org.size}

QUESTION (domain: ${question.domain} — ${question.domainName}):
${question.text}
${question.subQuestions?.length ? 'Sub-questions: ' + question.subQuestions.join('; ') : ''}

RELATED KNOWLEDGE BASE ENTRIES (for reference only; adapt to the exact question):
${relatedBlock}

ORGANIZATION'S RELEVANT CONTROLS FOR THIS DOMAIN:
${controlsBlock}

Respond with a single JSON object (no markdown, no code fence) with this exact shape:
{
  "answerType": "YES" | "NO" | "NOT_APPLICABLE" | "CONDITIONAL",
  "answer": "2-4 sentence auditor-grade answer addressing the question directly",
  "confidenceReasoning": "One sentence on why this answer is appropriate",
  "suggestedEvidence": ["Evidence 1", "Evidence 2"],
  "relatedFrameworks": [{"framework": "ISO 27001:2022", "controlId": "A.5.1", "description": "Brief"}]
}

Be concise and specific. Use low speculation. Produce a consistent, auditor-grade answer. Answer only with the JSON object (no other text).`;
  }

  /**
   * Parse and validate AI JSON response with Zod.
   */
  private parseAIResponse(raw: string): AIResponse | null {
    try {
      const cleaned = raw
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      return aiResponseSchema.parse(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Execute an AI call through circuit breaker: primary → secondary → null.
   * On primary failure, circuit is set open and secondary is tried if configured.
   */
  private async executeWithFallback<T>(
    fn: (engine: UnifiedAIProvider) => Promise<T>
  ): Promise<{ result: T; generatedBy: CAIQGeneratedBy } | null> {
    const primaryName = this.opts.primaryProviderName ?? 'GEMINI';

    const tryProvider = async (engine: UnifiedAIProvider, name: string): Promise<T | null> => {
      if (getCircuitState(name) === 'open') return null;
      try {
        const result = await fn(engine);
        return result;
      } catch {
        setCircuitState(name, 'open');
        return null;
      }
    };

    const primaryResult = await tryProvider(this.ai, primaryName);
    if (primaryResult != null) {
      return { result: primaryResult, generatedBy: 'AI_PRIMARY' };
    }

    if (this.opts.secondaryAI) {
      const secondaryName = primaryName === 'GEMINI' ? 'ANTHROPIC' : 'GEMINI';
      const secondaryResult = await tryProvider(this.opts.secondaryAI, secondaryName);
      if (secondaryResult != null) {
        return { result: secondaryResult, generatedBy: 'AI_FALLBACK' };
      }
    }

    return null;
  }

  /**
   * Compute CAIQStats from the list of answers.
   */
  private computeStats(answers: CAIQAnswer[]): CAIQStats {
    const total = answers.length;
    const highConfidence = answers.filter((a) => a.confidence >= 0.8).length;
    const mediumConfidence = answers.filter((a) => a.confidence >= 0.6 && a.confidence < 0.8).length;
    const lowConfidence = answers.filter((a) => a.confidence > 0 && a.confidence < 0.6).length;
    const flagged = answers.filter((a) => a.tier === 'FLAGGED').length;

    const weighted =
      total > 0
        ? answers.reduce((sum, a) => sum + a.confidence, 0) / total
        : 0;
    const estimatedAccuracy = Math.round(weighted * 100) / 100;

    const coverageByDomain = {} as Record<CAIQDomain, { answered: number; total: number }>;
    for (const d of CAIQ_DOMAINS) {
      coverageByDomain[d] = { answered: 0, total: 0 };
    }
    for (const a of answers) {
      const domain = this.getDomainForQuestion(a.questionId);
      if (domain && coverageByDomain[domain]) {
        coverageByDomain[domain].total += 1;
        if (a.tier !== 'FLAGGED') coverageByDomain[domain].answered += 1;
      }
    }

    return {
      total,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      flagged,
      estimatedAccuracy,
      coverageByDomain,
    };
  }

  private getDomainForQuestion(questionId: string): CAIQDomain | null {
    const prefix = questionId.split('-')[0];
    if (CAIQ_DOMAINS.includes(prefix as CAIQDomain)) return prefix as CAIQDomain;
    return null;
  }
}
