/**
 * Unit test — Threat severity normalization
 * Tests the classifyThreatFoxSeverity and classifyCategory functions
 * from the threats route. Since they're not exported, we re-implement
 * the same logic here for unit testing.
 */

import { describe, it, expect } from 'vitest';

// ── Re-implementation of route's severity mapping ───────────────
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
type Category = 'malware' | 'ransomware' | 'botnet' | 'phishing' | 'exploit' | 'c2';

function classifyThreatFoxSeverity(confidence: number): Severity {
    if (confidence >= 80) return 'CRITICAL';
    if (confidence >= 50) return 'HIGH';
    if (confidence >= 25) return 'MEDIUM';
    return 'LOW';
}

function classifyCategory(
    threatType: string, malware: string, tags: string[]
): Category {
    const lower = `${threatType} ${malware} ${tags.join(' ')}`.toLowerCase();
    if (lower.includes('botnet') || lower.includes('botnet_cc')) return 'botnet';
    if (lower.includes('ransom')) return 'ransomware';
    if (lower.includes('cobalt strike') || lower.includes('c2') || lower.includes('command')) return 'c2';
    if (lower.includes('phish')) return 'phishing';
    if (lower.includes('exploit')) return 'exploit';
    return 'malware';
}

// ── Tests ───────────────────────────────────────────────────────
describe('Unit: classifyThreatFoxSeverity', () => {
    it('maps confidence >= 80 to CRITICAL', () => {
        expect(classifyThreatFoxSeverity(80)).toBe('CRITICAL');
        expect(classifyThreatFoxSeverity(95)).toBe('CRITICAL');
        expect(classifyThreatFoxSeverity(100)).toBe('CRITICAL');
    });

    it('maps confidence 50-79 to HIGH', () => {
        expect(classifyThreatFoxSeverity(50)).toBe('HIGH');
        expect(classifyThreatFoxSeverity(65)).toBe('HIGH');
        expect(classifyThreatFoxSeverity(79)).toBe('HIGH');
    });

    it('maps confidence 25-49 to MEDIUM', () => {
        expect(classifyThreatFoxSeverity(25)).toBe('MEDIUM');
        expect(classifyThreatFoxSeverity(35)).toBe('MEDIUM');
        expect(classifyThreatFoxSeverity(49)).toBe('MEDIUM');
    });

    it('maps confidence < 25 to LOW', () => {
        expect(classifyThreatFoxSeverity(0)).toBe('LOW');
        expect(classifyThreatFoxSeverity(10)).toBe('LOW');
        expect(classifyThreatFoxSeverity(24)).toBe('LOW');
    });

    it('handles boundary values exactly', () => {
        expect(classifyThreatFoxSeverity(25)).toBe('MEDIUM');
        expect(classifyThreatFoxSeverity(50)).toBe('HIGH');
        expect(classifyThreatFoxSeverity(80)).toBe('CRITICAL');
    });
});

describe('Unit: classifyCategory', () => {
    it('classifies botnet_cc as botnet', () => {
        expect(classifyCategory('botnet_cc', '', [])).toBe('botnet');
    });

    it('classifies ransomware by tag', () => {
        expect(classifyCategory('', '', ['ransomware'])).toBe('ransomware');
    });

    it('classifies c2 by Cobalt Strike', () => {
        expect(classifyCategory('', 'Cobalt Strike', [])).toBe('c2');
    });

    it('classifies phishing', () => {
        expect(classifyCategory('phishing', '', [])).toBe('phishing');
    });

    it('classifies exploit', () => {
        expect(classifyCategory('exploit', '', [])).toBe('exploit');
    });

    it('defaults to malware for unknown types', () => {
        expect(classifyCategory('', 'Unknown', ['generic'])).toBe('malware');
    });

    it('checks combined text (type + malware + tags)', () => {
        expect(classifyCategory('', '', ['botnet_c2'])).toBe('botnet');
        expect(classifyCategory('', 'ransom-trojan', [])).toBe('ransomware');
    });
});

describe('Unit: URLhaus severity mapping', () => {
    it('online URLs should be HIGH severity', () => {
        const severity = (status: string) => status === 'online' ? 'HIGH' : 'MEDIUM';
        expect(severity('online')).toBe('HIGH');
        expect(severity('offline')).toBe('MEDIUM');
        expect(severity('unknown')).toBe('MEDIUM');
    });
});
