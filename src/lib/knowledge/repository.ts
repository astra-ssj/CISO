/**
 * Organizational Knowledge Repository — Service Layer
 *
 * CRUD, search, match, ingest, and governance for the permanent
 * Q&A knowledge base used by the CAIQ answer engine.
 */

import { PrismaClient, KnowledgeEntry } from '@prisma/client';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface KnowledgeSearchFilters {
    query?: string;
    domain?: string;
    category?: string;
    answerType?: string;
    source?: string;
    approvedOnly?: boolean;
    jurisdiction?: string;
    tag?: string;
    page?: number;
    pageSize?: number;
}

export interface KnowledgeStats {
    total: number;
    approved: number;
    domainBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    avgConfidence: number;
    totalUsage: number;
    topUsed: Pick<KnowledgeEntry, 'id' | 'questionText' | 'usageCount' | 'domain'>[];
    growthBreakdown?: Record<string, number>;
}

export interface KnowledgeMatchResult {
    entry: KnowledgeEntry;
    score: number; // 0–100
}

export interface IngestEntry {
    questionText: string;
    answerText: string;
    answerType: string; // YES, NO, NA, CONDITIONAL
    evidence?: string;
    domain?: string;
    category?: string;
    keywords?: string;
    confidence?: number;
}

// ────────────────────────────────────────────
// Text Normalization
// ────────────────────────────────────────────

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
    'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each',
    'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
    'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because',
    'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'this',
    'that', 'these', 'those', 'it', 'its', 'your', 'their', 'our',
]);

export function normalizeQuestion(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS.has(w))
        .join(' ')
        .trim();
}

export function extractKeywords(text: string): string {
    const normalized = normalizeQuestion(text);
    const words = normalized.split(/\s+/);
    // Deduplicate and keep meaningful words (3+ chars)
    const unique = [...new Set(words.filter(w => w.length >= 3))];
    return unique.join(',');
}

function tokenOverlapScore(a: string, b: string): number {
    const tokensA = new Set(a.split(/[\s,]+/).filter(Boolean));
    const tokensB = new Set(b.split(/[\s,]+/).filter(Boolean));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;
    let overlap = 0;
    for (const t of tokensA) {
        if (tokensB.has(t)) overlap++;
    }
    const maxLen = Math.max(tokensA.size, tokensB.size);
    return Math.round((overlap / maxLen) * 100);
}

// ────────────────────────────────────────────
// Repository Service
// ────────────────────────────────────────────

export class KnowledgeRepository {
    constructor(private prisma: PrismaClient) { }

    // ─── SEARCH & LIST ───────────────────────

    async searchEntries(filters: KnowledgeSearchFilters = {}) {
        const {
            query,
            domain,
            category,
            answerType,
            source,
            approvedOnly,
            jurisdiction,
            tag,
            page = 1,
            pageSize = 50,
        } = filters;

        const where: any = {};

        if (domain) where.domain = domain;
        if (category) where.category = category;
        if (answerType) where.answerType = answerType;
        if (source) where.source = source;
        if (jurisdiction) where.jurisdiction = jurisdiction;
        if (approvedOnly) where.approvedAt = { not: null };

        if (query) {
            const normalized = normalizeQuestion(query);
            where.OR = [
                { questionNormalized: { contains: normalized } },
                { keywords: { contains: normalized } },
                { answerText: { contains: query } },
            ];
        }

        if (tag) {
            where.tags = { contains: tag };
        }

        const [entries, total] = await Promise.all([
            this.prisma.knowledgeEntry.findMany({
                where,
                orderBy: [{ usageCount: 'desc' }, { confidence: 'desc' }, { updatedAt: 'desc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.knowledgeEntry.count({ where }),
        ]);

        return {
            entries,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── FIND BEST MATCH ─────────────────────

    async findBestMatch(
        questionText: string,
        minConfidence: number = 40,
    ): Promise<KnowledgeMatchResult | null> {
        const normalized = normalizeQuestion(questionText);
        const queryKeywords = normalized.split(/\s+/).filter(Boolean);

        if (queryKeywords.length === 0) return null;

        // Fetch candidates – search entries whose keywords overlap
        // We use a broad OR search then score in-memory for accuracy
        const candidates = await this.prisma.knowledgeEntry.findMany({
            where: {
                OR: queryKeywords.slice(0, 6).map(kw => ({
                    keywords: { contains: kw },
                })),
            },
            take: 200,
        });

        let best: KnowledgeMatchResult | null = null;
        for (const entry of candidates) {
            const score = tokenOverlapScore(normalized, entry.questionNormalized);
            if (score >= minConfidence && (!best || score > best.score)) {
                best = { entry, score };
            }
        }

        return best;
    }

    /**
     * Match an array of questions against the repo in bulk.
     * Returns Map<questionIndex, MatchResult>
     */
    async matchQuestions(
        questions: { index: number; text: string }[],
        minConfidence: number = 40,
    ): Promise<Map<number, KnowledgeMatchResult>> {
        // Prefetch ALL entries for in-memory matching (fast for <5000 entries)
        const allEntries = await this.prisma.knowledgeEntry.findMany();

        const results = new Map<number, KnowledgeMatchResult>();

        for (const q of questions) {
            const normalized = normalizeQuestion(q.text);
            let best: KnowledgeMatchResult | null = null;

            for (const entry of allEntries) {
                const score = tokenOverlapScore(normalized, entry.questionNormalized);
                if (score >= minConfidence && (!best || score > best.score)) {
                    best = { entry, score };
                }
            }

            if (best) {
                results.set(q.index, best);
            }
        }

        return results;
    }

    // ─── CRUD ────────────────────────────────

    async createEntry(data: Omit<IngestEntry, 'keywords'> & { keywords?: string; source: string; frameworks?: string; jurisdiction?: string; tags?: string }) {
        const questionNormalized = normalizeQuestion(data.questionText);
        const keywords = data.keywords || extractKeywords(data.questionText);

        return this.prisma.knowledgeEntry.create({
            data: {
                questionText: data.questionText,
                questionNormalized,
                keywords,
                domain: data.domain || 'CUSTOM',
                category: data.category || 'General',
                answerType: data.answerType,
                answerText: data.answerText,
                evidence: data.evidence,
                frameworks: data.frameworks,
                source: data.source,
                confidence: data.confidence ?? 1.0,
                jurisdiction: data.jurisdiction,
                tags: data.tags,
            },
        });
    }

    async updateEntry(id: string, data: Partial<KnowledgeEntry>) {
        // Re-normalize if question text changed
        const update: any = { ...data };
        if (data.questionText) {
            update.questionNormalized = normalizeQuestion(data.questionText);
            update.keywords = extractKeywords(data.questionText);
        }
        return this.prisma.knowledgeEntry.update({
            where: { id },
            data: update,
        });
    }

    async deleteEntry(id: string) {
        return this.prisma.knowledgeEntry.delete({ where: { id } });
    }

    async getEntry(id: string) {
        return this.prisma.knowledgeEntry.findUnique({ where: { id } });
    }

    // ─── APPROVE ─────────────────────────────

    async approveEntry(id: string, approvedBy: string) {
        return this.prisma.knowledgeEntry.update({
            where: { id },
            data: { approvedBy, approvedAt: new Date() },
        });
    }

    // ─── RECORD USAGE ────────────────────────

    async recordUsage(id: string) {
        return this.prisma.knowledgeEntry.update({
            where: { id },
            data: {
                usageCount: { increment: 1 },
                lastUsed: new Date(),
            },
        });
    }

    async recordUsageBulk(ids: string[]) {
        if (ids.length === 0) return;
        await this.prisma.knowledgeEntry.updateMany({
            where: { id: { in: ids } },
            data: { lastUsed: new Date() },
        });
        // Individual increments need per-row update
        for (const id of ids) {
            await this.prisma.knowledgeEntry.update({
                where: { id },
                data: { usageCount: { increment: 1 } },
            });
        }
    }

    // ─── BULK INGEST ─────────────────────────

    async bulkIngest(entries: IngestEntry[], source: string): Promise<{ created: number; skipped: number }> {
        let created = 0;
        let skipped = 0;

        for (const entry of entries) {
            const normalized = normalizeQuestion(entry.questionText);
            if (!normalized || normalized.length < 5) {
                skipped++;
                continue;
            }

            // Dedup: check if a very similar question already exists
            const existing = await this.prisma.knowledgeEntry.findFirst({
                where: { questionNormalized: normalized },
            });

            if (existing) {
                // Update confidence if new entry has higher confidence
                if ((entry.confidence || 0.7) > existing.confidence) {
                    await this.prisma.knowledgeEntry.update({
                        where: { id: existing.id },
                        data: {
                            answerText: entry.answerText,
                            confidence: entry.confidence || 0.7,
                            evidence: entry.evidence || existing.evidence,
                        },
                    });
                }
                skipped++;
                continue;
            }

            await this.prisma.knowledgeEntry.create({
                data: {
                    questionText: entry.questionText,
                    questionNormalized: normalized,
                    keywords: entry.keywords || extractKeywords(entry.questionText),
                    domain: entry.domain || 'CUSTOM',
                    category: entry.category || 'General',
                    answerType: entry.answerType,
                    answerText: entry.answerText,
                    evidence: entry.evidence,
                    source,
                    confidence: entry.confidence ?? 0.7,
                },
            });
            created++;
        }

        return { created, skipped };
    }

    // ─── STATS ───────────────────────────────

    async getStats(): Promise<KnowledgeStats> {
        const [allEntries, total] = await Promise.all([
            this.prisma.knowledgeEntry.findMany({
                select: {
                    id: true,
                    questionText: true,
                    domain: true,
                    category: true,
                    confidence: true,
                    usageCount: true,
                    approvedAt: true,
                    createdAt: true,
                },
            }),
            this.prisma.knowledgeEntry.count(),
        ]);

        const domainBreakdown: Record<string, number> = {};
        const categoryBreakdown: Record<string, number> = {};
        const growthBreakdown: Record<string, number> = {};
        let totalConfidence = 0;
        let totalUsage = 0;
        let approved = 0;

        for (const e of allEntries) {
            domainBreakdown[e.domain] = (domainBreakdown[e.domain] || 0) + 1;
            categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
            totalConfidence += e.confidence;
            totalUsage += e.usageCount;
            if (e.approvedAt) approved++;

            // Growth by YYYY-MM
            if (e.createdAt) {
                const date = new Date(e.createdAt);
                const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                growthBreakdown[month] = (growthBreakdown[month] || 0) + 1;
            }
        }

        const topUsed = [...allEntries]
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 20)
            .map(e => ({ id: e.id, questionText: e.questionText, usageCount: e.usageCount, domain: e.domain }));

        return {
            total,
            approved,
            domainBreakdown,
            categoryBreakdown,
            avgConfidence: total > 0 ? Math.round((totalConfidence / total) * 100) / 100 : 0,
            totalUsage,
            topUsed: topUsed as any,
            growthBreakdown,
        };
    }

    // ─── GET DISTINCT VALUES (for filter dropdowns) ───

    async getDistinctDomains(): Promise<string[]> {
        const results = await this.prisma.knowledgeEntry.findMany({
            select: { domain: true },
            distinct: ['domain'],
            orderBy: { domain: 'asc' },
        });
        return results.map(r => r.domain);
    }

    async getDistinctCategories(): Promise<string[]> {
        const results = await this.prisma.knowledgeEntry.findMany({
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
        });
        return results.map(r => r.category);
    }

    async getDistinctSources(): Promise<string[]> {
        const results = await this.prisma.knowledgeEntry.findMany({
            select: { source: true },
            distinct: ['source'],
            orderBy: { source: 'asc' },
        });
        return results.map(r => r.source);
    }
}
