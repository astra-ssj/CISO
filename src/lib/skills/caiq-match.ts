import { hashCanonical } from './hash';
import { SKILL_IDS, type SkillConfidence, type SkillRunResult } from './types';

export const CAIQ_MATCH_VERSION = '1.0.0';

export interface KnowledgeRecord {
    id: string;
    questionNormalized: string;
    keywords: string;
    answerText: string;
    answerType?: string;
    evidence?: string | null;
}

export interface CaiqMatchQuestion {
    questionText: string;
}

export interface CaiqMatchHit {
    questionText: string;
    answer: string;
    answerType: string;
    evidence: string;
    score: number;
    matchTier: 0 | 1 | 2 | 3;
    confidence: SkillConfidence;
    entryId: string | null;
}

export interface CaiqMatchInput {
    questions: CaiqMatchQuestion[];
    entries: KnowledgeRecord[];
    minConfidence?: number;
}

function normalizeQuestion(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function confidenceFor(matchTier: number, bestScore: number): SkillConfidence {
    if (matchTier === 1) return 'high';
    if (matchTier === 2 && bestScore >= 80) return 'high';
    if (matchTier === 2 || (matchTier === 3 && bestScore >= 65)) return 'medium';
    return 'low';
}

/**
 * Deterministic CAIQ matcher (skill caiq.match@1.0.0).
 * No I/O, no clock, no LLM. Same questions + same KB → same hits.
 */
export function matchCaiq(input: CaiqMatchInput): CaiqMatchHit[] {
    const minConfidence = input.minConfidence ?? 30;
    const entries = input.entries;

    return input.questions.map((q) => {
        let bestMatch: KnowledgeRecord | null = null;
        let bestScore = 0;
        let matchTier: 0 | 1 | 2 | 3 = 0;

        const qNormRaw = q.questionText.toLowerCase();
        const qNorm = normalizeQuestion(q.questionText);
        const qWords = qNorm.split(/\s+/).filter((w) => w.length > 3);

        for (const entry of entries) {
            const eNorm = entry.questionNormalized;

            if (qNorm === eNorm && qNorm.length > 0) {
                bestScore = 97;
                bestMatch = entry;
                matchTier = 1;
                break;
            }

            const eWords = eNorm.split(/\s+/).filter((w) => w.length > 3);
            const entryKeywords = (entry.keywords || '')
                .split(',')
                .map((k) => k.trim().toLowerCase())
                .filter(Boolean);

            let keywordHits = 0;
            for (const kw of entryKeywords) {
                if (qNormRaw.includes(kw)) keywordHits++;
            }
            const keywordScore = entryKeywords.length > 0 ? (keywordHits / entryKeywords.length) * 100 : 0;

            let wordOverlap = 0;
            for (const w of qWords) {
                if (eWords.some((ew) => ew.includes(w) || w.includes(ew))) wordOverlap++;
            }
            const overlapScore = qWords.length > 0
                ? (wordOverlap / Math.max(qWords.length, eWords.length || 1)) * 100
                : 0;

            const t2Score = Math.round(keywordScore * 0.6 + overlapScore * 0.4);

            const intersection = qWords.filter((x) => eWords.includes(x));
            const union = new Set([...qWords, ...eWords]);
            const jaccard = union.size === 0 ? 0 : (intersection.length / union.size) * 100;
            const t3Score = Math.round(jaccard * 0.7 + overlapScore * 0.3);

            const currentScore = Math.max(t2Score, t3Score);
            const currentTier: 2 | 3 = t2Score >= t3Score ? 2 : 3;

            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestMatch = entry;
                matchTier = currentTier;
            }
        }

        if (bestMatch && bestScore >= minConfidence) {
            return {
                questionText: q.questionText,
                answer: bestMatch.answerText,
                answerType: bestMatch.answerType ?? '',
                evidence: bestMatch.evidence ?? '',
                score: bestScore,
                matchTier,
                confidence: confidenceFor(matchTier, bestScore),
                entryId: bestMatch.id,
            };
        }

        return {
            questionText: q.questionText,
            answer: '',
            answerType: '',
            evidence: '',
            score: bestScore,
            matchTier: 0,
            confidence: 'low',
            entryId: null,
        };
    });
}

export function runCaiqMatch(input: CaiqMatchInput, asOf: string = '1970-01-01T00:00:00.000Z'): SkillRunResult<CaiqMatchHit[]> {
    const output = matchCaiq(input);
    return {
        skillId: SKILL_IDS.CAIQ_MATCH,
        skillVersion: CAIQ_MATCH_VERSION,
        inputHash: hashCanonical({
            skillVersion: CAIQ_MATCH_VERSION,
            minConfidence: input.minConfidence ?? 30,
            questions: input.questions.map((q) => q.questionText),
            entries: input.entries.map((e) => ({
                id: e.id,
                questionNormalized: e.questionNormalized,
                keywords: e.keywords,
                answerText: e.answerText,
                answerType: e.answerType ?? '',
                evidence: e.evidence ?? '',
            })),
        }),
        output,
        asOf,
    };
}
