/**
 * Unit test — CAIQ matching algorithm
 * Tests the CAIQSemanticMatcher class (tokenization, TF-IDF, similarity).
 */

import { describe, it, expect } from 'vitest';
import { CAIQSemanticMatcher } from '@/lib/caiq/caiq-semantic-matcher';
import type { CAIQKnowledgeEntry } from '@/lib/caiq/types';

const entries = [
    {
        domain: 'AIS' as const,
        question: 'Are application security controls validated through testing?',
        baseAnswer: 'Yes, we perform regular application security testing including SAST, DAST, and penetration testing.',
        keywords: ['application security', 'testing', 'SAST', 'DAST', 'penetration'],
        questionId: 'AIS-01', evidenceRequired: ['No'], frameworkMappings: [], expectedAnswerType: 'YES',
    },
    {
        domain: 'DSP' as const,
        question: 'Is personal data classified and inventoried?',
        baseAnswer: 'Yes, we maintain a data classification inventory for personal data.',
        keywords: ['data classification', 'inventory', 'personal data'],
        questionId: 'DSP-01', evidenceRequired: ['No'], frameworkMappings: [], expectedAnswerType: 'YES',
    },
    {
        domain: 'IAM' as const,
        question: 'Are access controls implemented for identity management?',
        baseAnswer: 'Yes, role-based access control with least privilege principle.',
        keywords: ['access control', 'identity management', 'RBAC'],
        questionId: 'IAM-01', evidenceRequired: ['No'], frameworkMappings: [], expectedAnswerType: 'YES',
    },
] as CAIQKnowledgeEntry[];

describe('Unit: CAIQ semantic matcher — vocabulary', () => {
    it('builds vocabulary from KB entries', () => {
        const matcher = new CAIQSemanticMatcher(entries);
        expect(matcher.getVocabularySize()).toBeGreaterThan(0);
    });

    it('vocabulary shrinks with fewer entries', () => {
        const full = new CAIQSemanticMatcher(entries);
        const single = new CAIQSemanticMatcher([entries[0]]);
        expect(single.getVocabularySize()).toBeLessThanOrEqual(full.getVocabularySize());
    });
});

describe('Unit: CAIQ semantic matcher — findSimilar', () => {
    it('returns scored results for matching query', () => {
        const matcher = new CAIQSemanticMatcher(entries);
        const results = matcher.findSimilar('application security testing');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0]).toHaveProperty('score');
        expect(results[0]).toHaveProperty('entry');
        expect(results[0].score).toBeGreaterThan(0);
    });

    it('ranks best match first', () => {
        const matcher = new CAIQSemanticMatcher(entries);
        const results = matcher.findSimilar('penetration testing SAST DAST');
        expect((results[0]?.entry as { questionId: string }).questionId).toBe('AIS-01');
    });

    it('returns empty for gibberish (above threshold)', () => {
        const matcher = new CAIQSemanticMatcher(entries);
        const results = matcher.findSimilar('zzzzqqqqxxxx', undefined, { threshold: 0.3 });
        expect(results).toHaveLength(0);
    });

    it('respects maxResults limit', () => {
        const matcher = new CAIQSemanticMatcher(entries);
        const results = matcher.findSimilar('security', undefined, { maxResults: 1 });
        expect(results.length).toBeLessThanOrEqual(1);
    });

    it('scores are between 0 and 1', () => {
        const matcher = new CAIQSemanticMatcher(entries);
        const results = matcher.findSimilar('access control RBAC identity');
        for (const r of results) {
            expect(r.score).toBeGreaterThanOrEqual(0);
            expect(r.score).toBeLessThanOrEqual(1);
        }
    });
});

describe('Unit: CAIQ semantic matcher — rebuildIndex', () => {
    it('updates vocabulary when entries change', () => {
        const matcher = new CAIQSemanticMatcher(entries);
        const before = matcher.getVocabularySize();
        matcher.rebuildIndex([entries[0]]);
        const after = matcher.getVocabularySize();
        expect(after).not.toBe(before);
    });
});
