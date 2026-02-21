/**
 * CAIQ Validator — Validation and self-check layer that catches errors before
 * answers reach human reviewers. Runs alignment, cross-consistency, evidence,
 * framework mapping, and optional AI self-check.
 */

import type {
  CAIQAnswer,
  CAIQDomain,
  FrameworkMapping,
  OrganizationContext,
  ValidationCheck,
  ValidationResult,
} from './types';
import { CAIQ_DOMAINS } from './types';
import { getEntryByQuestionId } from './caiq-knowledge-base';
import { getCircuitState, setCircuitState } from '../ai/circuit-breaker';
import type { UnifiedAIProvider } from '../ai/engine';

// -----------------------------------------------------------------------------
// Constants: review threshold, confidence cap, penalty per failed check
// -----------------------------------------------------------------------------

const REVIEW_THRESHOLD = 0.6;
const CRITICAL_CAP_CONFIDENCE = 0.59;
const PENALTY_PER_FAILED_CHECK = 0.1;
const AI_SELF_CHECK_PROVIDER = (typeof process !== 'undefined' && process?.env?.AI_PROVIDER) || 'GEMINI';

// -----------------------------------------------------------------------------
// Framework ID validation (ISO 27001:2022 Annex A, NIST CSF 2.0)
// -----------------------------------------------------------------------------

/** ISO 27001:2022 Annex A: A.5.x, A.6.x, A.7.x, A.8.x (93 controls). */
const ISO27001_CONTROL_ID_REGEX = /^A\.[5678]\.\d{1,2}$/;

/** NIST CSF 2.0: GOVERN (GV), IDENTIFY (ID), PROTECT (PR), DETECT (DE), RESPOND (RS), RECOVER (RC); e.g. GV.OC-01, PR.IP-01. */
const NIST_CSF_CONTROL_ID_REGEX = /^(GV|ID|PR|DE|RS|RC)\.[A-Z]{2,4}-\d{2,3}$/;

function isValidFrameworkControlId(framework: string, controlId: string): boolean {
  const normalized = framework.toUpperCase();
  if (normalized.includes('ISO') && normalized.includes('27001')) {
    return ISO27001_CONTROL_ID_REGEX.test(controlId.trim());
  }
  if (normalized.includes('NIST') && normalized.includes('CSF')) {
    return NIST_CSF_CONTROL_ID_REGEX.test(controlId.trim());
  }
  // Unknown framework: allow non-empty ID (no strict validation)
  return controlId.trim().length > 0;
}

// -----------------------------------------------------------------------------
// Consistency rule types and CONSISTENCY_RULES map
// -----------------------------------------------------------------------------

export interface ConsistencyRule {
  /** When any of these question IDs has a positive answer (YES/CONDITIONAL), others in domain are checked. */
  whenQuestionIds: string[];
  /** Other answers in the same domain must not contain these phrases (contradiction indicators). */
  contradictingPhrases: string[];
  /** Human-readable description for validation details. */
  description: string;
}

/** Domain-specific contradiction detection rules for cross-consistency check. */
export const CONSISTENCY_RULES: Record<string, ConsistencyRule[]> = {
  IAM: [
    {
      whenQuestionIds: ['IAM-01', 'IAM-01.1', 'IAM-01.2'],
      contradictingPhrases: ['do not have access controls', 'no access reviews', 'access reviews are not', 'not implemented', 'we do not'],
      description: 'If MFA/identity controls are YES, access review answers must not deny access controls.',
    },
    {
      whenQuestionIds: ['IAM-02', 'IAM-02.1'],
      contradictingPhrases: ['no access controls', 'no identity management', 'not implemented'],
      description: 'If access review is YES, other IAM answers must not state no access controls exist.',
    },
  ],
  DSP: [
    {
      whenQuestionIds: ['DSP-01', 'DSP-01.1', 'DSP-02'],
      contradictingPhrases: ['do not classify', 'no data classification', 'classification is not', 'not implemented'],
      description: 'If data classification is YES, other DSP answers must not deny classification.',
    },
    {
      whenQuestionIds: ['DSP-05', 'DSP-06'],
      contradictingPhrases: ['no retention policy', 'do not retain', 'retention is not', 'we do not retain'],
      description: 'If data lifecycle is YES, retention-related answers must be consistent.',
    },
  ],
  CEK: [
    {
      whenQuestionIds: ['CEK-01', 'CEK-01.1', 'CEK-02'],
      contradictingPhrases: ['encryption is not used', 'do not encrypt', 'no key management', 'not implemented'],
      description: 'If encryption/key management is YES, other CEK answers must not deny encryption.',
    },
    {
      whenQuestionIds: ['CEK-03', 'CEK-04'],
      contradictingPhrases: ['keys are not rotated', 'no key rotation', 'do not rotate'],
      description: 'If key lifecycle is YES, rotation answers must be consistent.',
    },
  ],
  LOG: [
    {
      whenQuestionIds: ['LOG-01', 'LOG-01.1', 'LOG-02'],
      contradictingPhrases: ['logging is not', 'do not log', 'no logging', 'not implemented', 'logs are not retained'],
      description: 'If logging/monitoring is YES, other LOG answers must not deny logging.',
    },
    {
      whenQuestionIds: ['LOG-03', 'LOG-04'],
      contradictingPhrases: ['no monitoring', 'monitoring is not', 'do not monitor'],
      description: 'If monitoring is YES, related LOG answers must be consistent.',
    },
  ],
  BCR: [
    {
      whenQuestionIds: ['BCR-01', 'BCR-01.1', 'BCR-02'],
      contradictingPhrases: ['no business continuity', 'BCP is not', 'do not have a plan', 'not implemented'],
      description: 'If BCP/DR is YES, other BCR answers must not deny continuity planning.',
    },
    {
      whenQuestionIds: ['BCR-03', 'BCR-04'],
      contradictingPhrases: ['tests are not conducted', 'do not test', 'no testing'],
      description: 'If BCR testing is YES, test-related answers must be consistent.',
    },
  ],
};

// -----------------------------------------------------------------------------
// Helper: derive domain from questionId (e.g. IAM-01.1 -> IAM)
// -----------------------------------------------------------------------------

function getDomainFromQuestionId(questionId: string): CAIQDomain | null {
  const prefix = questionId.split('-')[0];
  if (CAIQ_DOMAINS.includes(prefix as CAIQDomain)) return prefix as CAIQDomain;
  return null;
}

// -----------------------------------------------------------------------------
// CAIQValidator options
// -----------------------------------------------------------------------------

/**
 * Options for the CAIQ validator (review threshold, circuit breaker, AI provider).
 */
export interface CAIQValidatorOptions {
  /** Confidence below this value sets needsReview = true (default 0.6). */
  reviewThreshold?: number;
  /** Skip AI self-check when circuit is open (default true). */
  useCircuitBreakerForAI?: boolean;
  /** Optional AI provider for self-check; if not set, will be obtained via getAIProvider when needed. */
  aiProvider?: UnifiedAIProvider | null;
}

const DEFAULT_OPTIONS: Required<Omit<CAIQValidatorOptions, 'aiProvider'>> & { aiProvider?: UnifiedAIProvider | null } = {
  reviewThreshold: REVIEW_THRESHOLD,
  useCircuitBreakerForAI: true,
  aiProvider: undefined,
};

// -----------------------------------------------------------------------------
// CAIQValidator class
// -----------------------------------------------------------------------------

/**
 * CAIQ Validator — Runs alignment, cross-consistency, evidence completeness,
 * framework mapping, and optional AI self-check on CAIQ answers. Computes
 * validatedConfidence and sets needsReview when checks fail or confidence is low.
 */
export class CAIQValidator {
  private readonly opts: CAIQValidatorOptions & typeof DEFAULT_OPTIONS;

  /**
   * Creates a validator with optional thresholds and AI provider.
   * @param options - Review threshold, circuit breaker behavior, and optional AI for self-check
   */
  constructor(options?: CAIQValidatorOptions) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Runs all validation checks on a batch of answers and returns one ValidationResult per answer.
   * validatedConfidence = original confidence minus penalty per failed check; critical failures cap at 0.59.
   * @param answers - CAIQ answers to validate
   * @param orgContext - Organization context (used for evidence/control context if needed)
   * @returns Array of validation results with checks and needsReview flag
   */
  async validateBatch(
    answers: CAIQAnswer[],
    orgContext: OrganizationContext
  ): Promise<ValidationResult[]> {
    void orgContext; // reserved for future org-scoped validation
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));
    const byDomain = new Map<CAIQDomain, CAIQAnswer[]>();
    for (const a of answers) {
      const domain = getDomainFromQuestionId(a.questionId);
      if (domain) {
        const list = byDomain.get(domain) ?? [];
        list.push(a);
        byDomain.set(domain, list);
      }
    }

    const results: ValidationResult[] = [];
    for (const answer of answers) {
      const result = await this.validateOne(answer, answerMap, byDomain);
      results.push(result);
    }
    return results;
  }

  private async validateOne(
    answer: CAIQAnswer,
    answerMap: Map<string, CAIQAnswer>,
    byDomain: Map<CAIQDomain, CAIQAnswer[]>
  ): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];
    let failedCount = 0;
    let criticalFailed = false;

    // 1. Alignment check
    const alignment = this.runAlignmentCheck(answer);
    checks.push(alignment);
    if (!alignment.passed) {
      failedCount++;
      criticalFailed = true;
    }

    // 2. Cross-consistency check
    const consistency = this.runCrossConsistencyCheck(answer, byDomain);
    checks.push(consistency);
    if (!consistency.passed) {
      failedCount++;
      criticalFailed = true;
    }

    // 3. Evidence completeness check
    const evidence = this.runEvidenceCompletenessCheck(answer);
    checks.push(evidence);
    if (!evidence.passed) failedCount++;

    // 4. Framework mapping check
    const framework = this.runFrameworkMappingCheck(answer);
    checks.push(framework);
    if (!framework.passed) {
      failedCount++;
      criticalFailed = true;
    }

    // 5. AI self-check (only for AI_GENERATED tier, via circuit breaker)
    let aiCheck: ValidationCheck = {
      name: 'AI Self-Check',
      passed: true,
      details: 'Skipped (not AI_GENERATED tier).',
    };
    if (answer.tier === 'AI_GENERATED') {
      aiCheck = await this.runAISelfCheck(answer);
      if (!aiCheck.passed) failedCount++;
    }
    checks.push(aiCheck);

    // Compute validatedConfidence
    let validatedConfidence = answer.confidence - failedCount * PENALTY_PER_FAILED_CHECK;
    if (validatedConfidence < 0) validatedConfidence = 0;
    if (criticalFailed && validatedConfidence > CRITICAL_CAP_CONFIDENCE) {
      validatedConfidence = CRITICAL_CAP_CONFIDENCE;
    }
    if (validatedConfidence > 1) validatedConfidence = 1;

    const needsReview =
      validatedConfidence < this.opts.reviewThreshold || criticalFailed;

    return {
      questionId: answer.questionId,
      originalConfidence: answer.confidence,
      validatedConfidence,
      checks,
      needsReview,
    };
  }

  /** 1. Alignment: answer addresses question and answerType matches content. */
  private runAlignmentCheck(answer: CAIQAnswer): ValidationCheck {
    const entry = getEntryByQuestionId(answer.questionId);
    const questionText = entry?.question ?? '';
    const keywords = entry?.keywords ?? [];
    const answerLower = answer.answer.toLowerCase().trim();
    const type = answer.answerType;

    // Check answerType vs content (e.g. YES shouldn't contain "we do not" / "not implemented")
    const negativePhrases = [
      'we do not',
      'do not have',
      'not implemented',
      'not in place',
      'not applicable',
      'no we don\'t',
      'we don\'t',
      'not currently',
      'not yet',
    ];
    const hasNegative = negativePhrases.some((p) => answerLower.includes(p));

    if ((type === 'YES' || type === 'CONDITIONAL') && hasNegative) {
      return {
        name: 'Alignment Check',
        passed: false,
        details: `Answer type is ${type} but answer text contains negative phrasing (e.g. "we do not", "not implemented").`,
      };
    }

    if (type === 'NO' && !hasNegative && answerLower.length > 20) {
      const hasPositive = ['yes', 'we have', 'we use', 'implemented', 'in place'].some((p) =>
        answerLower.includes(p)
      );
      if (hasPositive) {
        return {
          name: 'Alignment Check',
          passed: false,
          details: 'Answer type is NO but answer text appears to describe affirmative controls.',
        };
      }
    }

    // Key terms from question: if we have question/keywords, check at least one is referenced
    if (questionText && keywords.length > 0) {
      const referenced = keywords.some((kw) => {
        const k = kw.toLowerCase();
        return answerLower.includes(k) || questionText.toLowerCase().includes(k);
      });
      if (!referenced && answerLower.length > 30) {
        return {
          name: 'Alignment Check',
          passed: false,
          details: `Answer does not reference key terms from the question (e.g. ${keywords.slice(0, 3).join(', ')}).`,
        };
      }
    }

    return {
      name: 'Alignment Check',
      passed: true,
      details: 'Answer type matches content and addresses the question.',
    };
  }

  /** 2. Cross-consistency: related questions in same domain don't contradict. */
  private runCrossConsistencyCheck(
    answer: CAIQAnswer,
    byDomain: Map<CAIQDomain, CAIQAnswer[]>
  ): ValidationCheck {
    const domain = getDomainFromQuestionId(answer.questionId);
    if (!domain) {
      return { name: 'Cross-Consistency Check', passed: true, details: 'No domain derived from questionId.' };
    }

    const rules = CONSISTENCY_RULES[domain];
    if (!rules || rules.length === 0) {
      return { name: 'Cross-Consistency Check', passed: true, details: `No consistency rules for domain ${domain}.` };
    }

    const domainAnswers = byDomain.get(domain) ?? [];
    const answerLower = answer.answer.toLowerCase();

    for (const rule of rules) {
      const whenIds = rule.whenQuestionIds;
      const triggerAnswers = domainAnswers.filter((a) => whenIds.includes(a.questionId));
      const anyTriggerYes = triggerAnswers.some(
        (a) => a.answerType === 'YES' || a.answerType === 'CONDITIONAL'
      );

      if (!anyTriggerYes) continue;

      // This answer (or another in domain) must not contain contradicting phrases
      const thisContradicts = rule.contradictingPhrases.some((p) => answerLower.includes(p.toLowerCase()));
      if (thisContradicts) {
        return {
          name: 'Cross-Consistency Check',
          passed: false,
          details: `${rule.description} Contradiction detected in answer text.`,
        };
      }
    }

    return {
      name: 'Cross-Consistency Check',
      passed: true,
      details: `No contradictions with other ${domain} answers.`,
    };
  }

  /** 3. Evidence completeness: YES answers should reference evidence. */
  private runEvidenceCompletenessCheck(answer: CAIQAnswer): ValidationCheck {
    if (answer.answerType !== 'YES' && answer.answerType !== 'CONDITIONAL') {
      return {
        name: 'Evidence Completeness Check',
        passed: true,
        details: 'Evidence not required for NO/NOT_APPLICABLE.',
      };
    }

    const hasEvidenceRefs = answer.evidenceRefs && answer.evidenceRefs.length > 0;
    const answerMentionsEvidence =
      /\b(policy|procedure|document|evidence|audit|report|control|standard)\b/i.test(answer.answer) ||
      /\.(pdf|docx?|xlsx?)\b/i.test(answer.answer) ||
      /https?:\/\//i.test(answer.answer);

    if (hasEvidenceRefs || answerMentionsEvidence) {
      return {
        name: 'Evidence Completeness Check',
        passed: true,
        details: 'Evidence or reference to evidence present.',
      };
    }

    return {
      name: 'Evidence Completeness Check',
      passed: false,
      details: 'Answer claims controls exist (YES/CONDITIONAL) but cites no evidence. Flag for evidence attachment.',
    };
  }

  /** 4. Framework mapping: referenced ISO/NIST control IDs are valid. */
  private runFrameworkMappingCheck(answer: CAIQAnswer): ValidationCheck {
    const refs = answer.frameworkRefs ?? [];
    if (refs.length === 0) {
      return {
        name: 'Framework Mapping Check',
        passed: true,
        details: 'No framework references to validate.',
      };
    }

    const invalid: FrameworkMapping[] = [];
    for (const ref of refs) {
      if (!isValidFrameworkControlId(ref.framework, ref.controlId)) {
        invalid.push(ref);
      }
    }

    if (invalid.length > 0) {
      return {
        name: 'Framework Mapping Check',
        passed: false,
        details: `Invalid or unrecognized framework control IDs: ${invalid.map((r) => `${r.framework}:${r.controlId}`).join(', ')}.`,
      };
    }

    return {
      name: 'Framework Mapping Check',
      passed: true,
      details: 'All referenced framework control IDs are valid.',
    };
  }

  /** 5. AI self-check: second AI call to review answer (only when circuit is closed). */
  private async runAISelfCheck(answer: CAIQAnswer): Promise<ValidationCheck> {
    if (this.opts.useCircuitBreakerForAI && getCircuitState(AI_SELF_CHECK_PROVIDER) === 'open') {
      return {
        name: 'AI Self-Check',
        passed: true,
        details: 'Skipped (circuit breaker open — AI unavailable).',
      };
    }

    let provider = this.opts.aiProvider;
    if (provider == null) {
      try {
        const { getAIProvider } = await import('../ai/engine');
        provider = getAIProvider();
      } catch {
        return {
          name: 'AI Self-Check',
          passed: true,
          details: 'Skipped (AI provider not available).',
        };
      }
    }

    const prompt = `You are a CAIQ auditor reviewing this answer. Is it aligned with the question? Is it specific enough? Any contradictions?

Question ID: ${answer.questionId}
Answer type: ${answer.answerType}
Answer text:
${answer.answer}

Respond in JSON only, with this shape:
{ "aligned": true|false, "specificEnough": true|false, "issues": ["issue1", "issue2"] or [] }

If aligned and specificEnough are true and issues is empty, the answer passes. Otherwise describe briefly what is wrong.`;

    try {
      const raw = await provider.generateContent(prompt);
      const parsed = this.parseAISelfCheckResponse(raw);
      if (!parsed) {
        return {
          name: 'AI Self-Check',
          passed: true,
          details: 'Skipped (could not parse AI review response).',
        };
      }
      const passed = parsed.aligned && parsed.specificEnough && (!parsed.issues || parsed.issues.length === 0);
      return {
        name: 'AI Self-Check',
        passed,
        details: passed
          ? 'AI reviewer found answer aligned and specific.'
          : `AI reviewer issues: ${(parsed.issues || []).join('; ') || 'aligned/specificEnough false'}.`,
      };
    } catch {
      setCircuitState(AI_SELF_CHECK_PROVIDER, 'open');
      return {
        name: 'AI Self-Check',
        passed: true,
        details: 'Skipped (AI call failed; circuit breaker opened).',
      };
    }
  }

  private parseAISelfCheckResponse(raw: string): { aligned: boolean; specificEnough: boolean; issues?: string[] } | null {
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        aligned: Boolean(parsed.aligned),
        specificEnough: Boolean(parsed.specificEnough),
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      };
    } catch {
      return null;
    }
  }
}
