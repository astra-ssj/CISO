/**
 * Knowledge Answer Resolution — 3-Layer Priority
 *
 * Resolution order (highest priority first):
 *   1. Product override (scope=PRODUCT, matching productId)
 *   2. Company override (scope=COMPANY, matching companyId)
 *   3. Common KB entry (KnowledgeEntry)
 *   4. null → AI generates or flags for manual
 *
 * Used everywhere: Quick Answer, Knowledge Transfer, CAIQ export.
 */

import { PrismaClient } from '@prisma/client';
import { tokenOverlapScore, normalizeQuestion } from './repository';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type LayerSource = 'PRODUCT' | 'COMPANY' | 'COMMON' | 'NONE';

export interface ResolvedAnswer {
    questionText: string;
    answerType: string;
    answerText: string;
    evidence: string | null;
    frameworks: string | null;
    confidence: number;
    layer: LayerSource;
    sourceId: string;        // KnowledgeEntry.id or KnowledgeOverride.id
    sourceLabel: string;     // human-readable source description
    domain?: string;
    category?: string;
    keywords?: string;
}

export interface LayeredMatch {
    question: string;
    resolved: ResolvedAnswer | null;
    productMatch: ResolvedAnswer | null;
    companyMatch: ResolvedAnswer | null;
    commonMatch: ResolvedAnswer | null;
    score: number;           // best match confidence
}

// ────────────────────────────────────────────
// Resolution Functions
// ────────────────────────────────────────────

/**
 * Resolve the best answer for a question given the company+product context.
 * Uses exact question matching (normalized) plus token-overlap fuzzy matching.
 */
export async function resolveAnswer(
    prisma: PrismaClient,
    questionText: string,
    companyId?: string | null,
    productId?: string | null,
    minScore: number = 40, // 0-100 scale (matches tokenOverlapScore)
): Promise<LayeredMatch> {
    const normalized = normalizeQuestion(questionText);

    // Layer 1: Product override
    let productMatch: ResolvedAnswer | null = null;
    if (productId) {
        productMatch = await findBestOverride(prisma, normalized, questionText, 'PRODUCT', undefined, productId, minScore);
    }

    // Layer 2: Company override
    let companyMatch: ResolvedAnswer | null = null;
    if (companyId) {
        companyMatch = await findBestOverride(prisma, normalized, questionText, 'COMPANY', companyId, undefined, minScore);
    }

    // Layer 3: Common KB
    const commonMatch = await findBestCommon(prisma, normalized, questionText, minScore);

    // Resolution: highest-priority non-null
    const resolved = productMatch || companyMatch || commonMatch || null;
    const score = resolved?.confidence ?? 0;

    return {
        question: questionText,
        resolved,
        productMatch,
        companyMatch,
        commonMatch,
        score,
    };
}

/**
 * Bulk-resolve an array of questions.
 */
export async function resolveAnswerBulk(
    prisma: PrismaClient,
    questions: string[],
    companyId?: string | null,
    productId?: string | null,
    minScore: number = 40,
): Promise<LayeredMatch[]> {
    const results: LayeredMatch[] = [];
    for (const q of questions) {
        results.push(await resolveAnswer(prisma, q, companyId, productId, minScore));
    }
    return results;
}

// ────────────────────────────────────────────
// Internal Helpers
// ────────────────────────────────────────────

async function findBestOverride(
    prisma: PrismaClient,
    normalized: string,
    rawQuestion: string,
    scope: 'COMPANY' | 'PRODUCT',
    companyId?: string,
    productId?: string,
    minScore: number = 40,
): Promise<ResolvedAnswer | null> {
    const where: Record<string, unknown> = { scope };
    if (scope === 'PRODUCT' && productId) where.productId = productId;
    if (scope === 'COMPANY' && companyId) where.companyId = companyId;

    const overrides = await prisma.knowledgeOverride.findMany({
        where: where as any,
        include: { knowledgeEntry: true, product: { include: { company: true } } },
    });

    if (overrides.length === 0) return null;

    // Exact match first
    const exact = overrides.find(o =>
        normalizeQuestion(o.questionText) === normalized
    );
    if (exact) {
        return overrideToResolved(exact, scope, 1.0);
    }

    // Fuzzy match
    let best: typeof overrides[0] | null = null;
    let bestScore = 0;
    for (const o of overrides) {
        const score = tokenOverlapScore(normalized, normalizeQuestion(o.questionText));
        if (score > bestScore) {
            bestScore = score;
            best = o;
        }
    }

    if (best && bestScore >= minScore) {
        return overrideToResolved(best, scope, bestScore);
    }

    return null;
}

async function findBestCommon(
    prisma: PrismaClient,
    normalized: string,
    rawQuestion: string,
    minScore: number = 40,
): Promise<ResolvedAnswer | null> {
    // Exact match
    const exact = await prisma.knowledgeEntry.findFirst({
        where: { questionNormalized: normalized },
    });
    if (exact) {
        return commonToResolved(exact, 1.0);
    }

    // Fuzzy: load all entries (in production, this should use vector search)
    const entries = await prisma.knowledgeEntry.findMany({
        select: {
            id: true, questionText: true, questionNormalized: true,
            answerType: true, answerText: true, evidence: true,
            frameworks: true, confidence: true, domain: true,
            category: true, keywords: true, source: true,
        },
    });

    let best: typeof entries[0] | null = null;
    let bestScore = 0;
    for (const e of entries) {
        const score = tokenOverlapScore(normalized, e.questionNormalized);
        if (score > bestScore) {
            bestScore = score;
            best = e;
        }
    }

    if (best && bestScore >= minScore) {
        return {
            questionText: best.questionText,
            answerType: best.answerType,
            answerText: best.answerText,
            evidence: best.evidence,
            frameworks: best.frameworks,
            confidence: bestScore,
            layer: 'COMMON',
            sourceId: best.id,
            sourceLabel: `Common KB (${best.source})`,
            domain: best.domain,
            category: best.category,
            keywords: best.keywords,
        };
    }

    return null;
}

function overrideToResolved(
    override: any,
    scope: 'COMPANY' | 'PRODUCT',
    confidence: number,
): ResolvedAnswer {
    const layer: LayerSource = scope === 'PRODUCT' ? 'PRODUCT' : 'COMPANY';
    let sourceLabel = scope === 'COMPANY' ? 'Company Override' : 'Product Override';
    if (override.product?.company?.name) {
        sourceLabel = scope === 'PRODUCT'
            ? `${override.product.name} (${override.product.company.name})`
            : override.product.company.name;
    }

    return {
        questionText: override.questionText,
        answerType: override.answerType,
        answerText: override.answerText,
        evidence: override.evidence,
        frameworks: override.frameworks,
        confidence,
        layer,
        sourceId: override.id,
        sourceLabel,
        domain: override.knowledgeEntry?.domain,
        category: override.knowledgeEntry?.category,
        keywords: override.knowledgeEntry?.keywords,
    };
}

function commonToResolved(
    entry: any,
    confidence: number,
): ResolvedAnswer {
    return {
        questionText: entry.questionText,
        answerType: entry.answerType,
        answerText: entry.answerText,
        evidence: entry.evidence,
        frameworks: entry.frameworks,
        confidence,
        layer: 'COMMON',
        sourceId: entry.id,
        sourceLabel: `Common KB (${entry.source})`,
        domain: entry.domain,
        category: entry.category,
        keywords: entry.keywords,
    };
}
