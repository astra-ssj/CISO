/**
 * Integration tests — Abuse.ch API (ThreatFox / URLhaus / MalwareBazaar)
 * Tests the threat normalization pipeline with mocked AbuseCH client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────
const mockGetRecentIOCs = vi.fn().mockResolvedValue([]);
const mockGetRecentMaliciousURLs = vi.fn().mockResolvedValue([]);
const mockGetRecentMalware = vi.fn().mockResolvedValue([]);

vi.mock('@/lib/intelligence/clients/abusech-client', () => {
    class MockAbuseCHClient {
        getRecentIOCs = mockGetRecentIOCs;
        getRecentMaliciousURLs = mockGetRecentMaliciousURLs;
        getRecentMalware = mockGetRecentMalware;
        searchIOC = vi.fn().mockResolvedValue([]);
        lookupURL = vi.fn().mockResolvedValue({ query_status: 'no_results' });
        lookupHash = vi.fn().mockResolvedValue({ query_status: 'no_results' });
    }
    return { AbuseCHClient: MockAbuseCHClient };
});

vi.mock('@/lib/intelligence/data-freshness', () => ({
    recordUpdate: vi.fn(),
    recordError: vi.fn(),
}));

// ── Fixtures ────────────────────────────────────────────────────
const threatfoxIOC = {
    id: '12345', ioc: '192.168.1.100:4443', ioc_type: 'ip:port',
    threat_type: 'botnet_cc', threat_type_desc: 'Botnet C&C',
    malware_printable: 'Emotet', confidence_level: 90,
    first_seen: '2026-02-20T10:00:00Z', last_seen: '2026-02-27T10:00:00Z',
    tags: ['emotet', 'botnet'], reference: 'https://example.com/report',
};

const urlhausEntry = {
    id: '67890', url: 'http://evil.example.com/payload.exe',
    url_status: 'online', host: 'evil.example.com',
    threat: 'malware_download', tags: ['exe', 'trojan'],
    urlhaus_reference: 'https://urlhaus.abuse.ch/url/67890/',
    date_added: '2026-02-25T08:30:00Z',
};

const malwareSample = {
    sha256_hash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1',
    file_type: 'exe', file_name: 'trojan.exe', file_size: 524288,
    signature: 'TrickBot', tags: ['trickbot', 'banking'],
    first_seen: '2026-02-24T14:00:00Z', last_seen: '2026-02-26T14:00:00Z',
    intelligence: { downloads: '15' }, origin_country: 'RU',
};

// ── Tests ───────────────────────────────────────────────────────
describe('Integration: Abuse.ch threat intelligence', () => {
    beforeEach(() => { vi.clearAllMocks(); vi.resetModules(); });

    it('normalizes ThreatFox IOCs into unified format with CRITICAL severity', async () => {
        mockGetRecentIOCs.mockResolvedValue([threatfoxIOC]);
        mockGetRecentMaliciousURLs.mockResolvedValue([]);
        mockGetRecentMalware.mockResolvedValue([]);

        const { GET } = await import('@/app/api/intelligence/threats/route');
        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.sources.threatfox).toBe(true);

        const tf = body.data.find((t: { id: string }) => t.id === 'tf-12345');
        expect(tf).toBeDefined();
        expect(tf.severity).toBe('CRITICAL');
        expect(tf.source).toBe('ThreatFox');
        expect(tf.category).toBe('botnet');
    });

    it('normalizes URLhaus entries with HIGH severity for online URLs', async () => {
        mockGetRecentIOCs.mockResolvedValue([]);
        mockGetRecentMaliciousURLs.mockResolvedValue([urlhausEntry]);
        mockGetRecentMalware.mockResolvedValue([]);

        const { GET } = await import('@/app/api/intelligence/threats/route');
        const body = await (await GET()).json();

        const uh = body.data.find((t: { id: string }) => t.id === 'uh-67890');
        expect(uh).toBeDefined();
        expect(uh.severity).toBe('HIGH');
        expect(uh.source).toBe('URLhaus');
    });

    it('normalizes MalwareBazaar samples', async () => {
        mockGetRecentIOCs.mockResolvedValue([]);
        mockGetRecentMaliciousURLs.mockResolvedValue([]);
        mockGetRecentMalware.mockResolvedValue([malwareSample]);

        const { GET } = await import('@/app/api/intelligence/threats/route');
        const body = await (await GET()).json();

        const mb = body.data.find((t: { id: string }) => t.id.startsWith('mb-'));
        expect(mb).toBeDefined();
        expect(mb.source).toBe('MalwareBazaar');
    });

    it('handles partial source failures gracefully', async () => {
        mockGetRecentIOCs.mockRejectedValue(new Error('ThreatFox down'));
        mockGetRecentMaliciousURLs.mockResolvedValue([urlhausEntry]);
        mockGetRecentMalware.mockRejectedValue(new Error('MB down'));

        const { GET } = await import('@/app/api/intelligence/threats/route');
        const body = await (await GET()).json();

        expect(body.sources.threatfox).toBe(false);
        expect(body.sources.urlhaus).toBe(true);
        expect(body.sources.malwarebazaar).toBe(false);
        expect(body.data.length).toBeGreaterThan(0);
    });

    it('deduplicates identical indicators', async () => {
        const dup = { ...threatfoxIOC, id: '99999' };
        mockGetRecentIOCs.mockResolvedValue([threatfoxIOC, dup]);
        mockGetRecentMaliciousURLs.mockResolvedValue([]);
        mockGetRecentMalware.mockResolvedValue([]);

        const { GET } = await import('@/app/api/intelligence/threats/route');
        const body = await (await GET()).json();

        expect(body.count).toBe(1);
    });
});
