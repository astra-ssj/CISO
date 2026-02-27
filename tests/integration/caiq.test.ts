/**
 * Integration tests — CAIQ Knowledge Transfer
 * Tests the CAIQ semantic matcher and knowledge base pipeline.
 */

import { describe, it, expect } from 'vitest';
import { CAIQSemanticMatcher } from '@/lib/caiq/caiq-semantic-matcher';

// ── Fixtures ────────────────────────────────────────────────────
const sampleKBEntries = [
    {
        id: 'AIS-01',
        domain: 'Application & Interface Security' as const,
        question: 'Are application security controls validated through testing?',
        baseAnswer: 'Yes, we perform regular application security testing including SAST, DAST, and penetration testing.',
        keywords: ['application security', 'testing', 'SAST', 'DAST', 'penetration'],
    },
    {
        id: 'DSP-01',
        domain: 'Data Security & Privacy' as const,
        question: 'Is personal data classified and inventoried?',
        baseAnswer: 'Yes, we maintain a data classification inventory and apply appropriate controls based on data sensitivity levels.',
        keywords: ['data classification', 'inventory', 'personal data', 'sensitivity'],
    },
    {
        id: 'IAM-01',
        domain: 'Identity & Access Management' as const,
        question: 'Are access controls implemented for identity management?',
        baseAnswer: 'Yes, we implement role-based access control with least privilege principle.',
        keywords: ['access control', 'identity management', 'RBAC', 'least privilege'],
    },
    {
        id: 'IVS-01',
        domain: 'Infrastructure & Virtualization Security' as const,
        question: 'Are infrastructure components secured and monitored?',
        baseAnswer: 'Yes, we deploy firewalls, IDS, and continuous monitoring across all infrastructure.',
        keywords: ['infrastructure', 'firewalls', 'IDS', 'monitoring'],
    },
    {
        id: 'BCR-01',
        domain: 'Business Continuity Management & Operational Resilience' as const,
        question: 'Is there a business continuity plan in place?',
        baseAnswer: 'Yes, we maintain and test business continuity and disaster recovery plans.',
        keywords: ['business continuity', 'disaster recovery', 'BCP', 'DRP'],
    },
];

describe('Integration: CAIQ Knowledge Transfer', () => {
    it('builds matcher from KB entries without error', () => {
        const matcher = new CAIQSemanticMatcher(sampleKBEntries);
        expect(matcher).toBeDefined();
        expect(matcher.getVocabularySize()).toBeGreaterThan(0);
    });

    it('finds similar entries for an application security query', () => {
        const matcher = new CAIQSemanticMatcher(sampleKBEntries);
        const results = matcher.findSimilar('How do you test application security?');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].entry.id).toBe('AIS-01');
        expect(results[0].score).toBeGreaterThan(0);
    });

    it('returns data privacy entry for PII-related queries', () => {
        const matcher = new CAIQSemanticMatcher(sampleKBEntries);
        const results = matcher.findSimilar('How is personal data classified?');

        expect(results.length).toBeGreaterThan(0);
        const topIds = results.slice(0, 2).map(r => r.entry.id);
        expect(topIds).toContain('DSP-01');
    });

    it('returns access control entry for RBAC queries', () => {
        const matcher = new CAIQSemanticMatcher(sampleKBEntries);
        const results = matcher.findSimilar('RBAC least privilege identity');

        expect(results.length).toBeGreaterThan(0);
        const topIds = results.slice(0, 3).map(r => r.entry.id);
        expect(topIds).toContain('IAM-01');
    });

    it('respects maxResults option', () => {
        const matcher = new CAIQSemanticMatcher(sampleKBEntries);
        const results = matcher.findSimilar('security testing', undefined, { maxResults: 2 });

        expect(results.length).toBeLessThanOrEqual(2);
    });

    it('respects threshold option', () => {
        const matcher = new CAIQSemanticMatcher(sampleKBEntries);
        const high = matcher.findSimilar('application security testing', undefined, { threshold: 0.5 });
        const low = matcher.findSimilar('application security testing', undefined, { threshold: 0.01 });

        expect(low.length).toBeGreaterThanOrEqual(high.length);
    });

    it('returns empty results for unrelated queries', () => {
        const matcher = new CAIQSemanticMatcher(sampleKBEntries);
        const results = matcher.findSimilar('How many cups of coffee per day?', undefined, { threshold: 0.3 });

        expect(results.length).toBe(0);
    });

    it('rebuildIndex clears and rebuilds from new entries', () => {
        const matcher = new CAIQSemanticMatcher(sampleKBEntries);
        const sizeBefore = matcher.getVocabularySize();

        matcher.rebuildIndex([sampleKBEntries[0]]);
        const sizeAfter = matcher.getVocabularySize();

        expect(sizeAfter).toBeLessThan(sizeBefore);
    });
});
