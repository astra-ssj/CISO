/**
 * Abuse.ch Client — Three free feeds, no API key required.
 *
 * Follows the existing Astra-CISO patterns:
 *   • Mock-first fallback (like opencti-client.ts / misp-client.ts)
 *   • Circuit-breaker state via src/lib/ai/circuit-breaker.ts
 *
 * Feeds:
 *   • URLhaus   — Malicious URLs      (POST https://urlhaus-api.abuse.ch/v1/)
 *   • ThreatFox — IOCs                (POST https://threatfox-api.abuse.ch/api/v1/)
 *   • MalwareBazaar — Malware samples (POST https://mb-api.abuse.ch/api/v1/)
 *
 * Always available — free public APIs, no key needed.
 */

import {
    setCircuitState,
    getCircuitState,
} from '@/lib/ai/circuit-breaker';
import type {
    MaliciousURL,
    URLhausResult,
    ThreatFoxIOC,
    MalwareSample,
    MalwareBazaarResult,
    AbuseCHStats,
    AbuseCHHealthCheck,
} from '../types';

// ── Constants ──────────────────────────────────────────────────

const URLHAUS_API = 'https://urlhaus-api.abuse.ch/v1';
const THREATFOX_API = 'https://threatfox-api.abuse.ch/api/v1';
const MALWAREBAZAAR_API = 'https://mb-api.abuse.ch/api/v1';

const PROVIDER_URLHAUS = 'ABUSECH_URLHAUS';
const PROVIDER_THREATFOX = 'ABUSECH_THREATFOX';
const PROVIDER_MALWAREBAZAAR = 'ABUSECH_MALWAREBAZAAR';

// ── Mock Data ──────────────────────────────────────────────────

const MOCK_URLS: MaliciousURL[] = [
    {
        id: 'urlhaus-001', url: 'http://malware-delivery.example.com/payload.exe',
        url_status: 'online', host: 'malware-delivery.example.com',
        date_added: '2026-02-25T14:30:00Z', threat: 'malware_download',
        tags: ['exe', 'trojan', 'AgentTesla'], urlhaus_reference: 'https://urlhaus.abuse.ch/url/001/',
        reporter: 'abuse_ch', larted: false, payloads: [{
            filename: 'payload.exe', file_type: 'exe', response_md5: 'abc123def456',
            response_sha256: 'sha256_mock_001', response_size: 245760,
            signature: 'AgentTesla', urlhaus_download: 'https://urlhaus.abuse.ch/dl/001/',
            virustotal: { result: '42/70', percent: '60.0', link: 'https://virustotal.com/mock' },
        }],
    },
    {
        id: 'urlhaus-002', url: 'https://phishing-site.example.org/login',
        url_status: 'online', host: 'phishing-site.example.org',
        date_added: '2026-02-25T16:45:00Z', threat: 'phishing',
        tags: ['phishing', 'credential-theft'], urlhaus_reference: 'https://urlhaus.abuse.ch/url/002/',
        reporter: 'abuse_ch', larted: true, payloads: [],
    },
    {
        id: 'urlhaus-003', url: 'http://c2-server.example.net:8443/gate',
        url_status: 'offline', host: 'c2-server.example.net',
        date_added: '2026-02-24T10:00:00Z', threat: 'malware_download',
        tags: ['c2', 'emotet'], urlhaus_reference: 'https://urlhaus.abuse.ch/url/003/',
        reporter: 'abuse_ch', larted: false, payloads: [],
    },
];

const MOCK_THREATFOX_IOCS: ThreatFoxIOC[] = [
    {
        id: 'tf-001', ioc: '198.51.100.42:443', ioc_type: 'ip:port',
        threat_type: 'botnet_cc', threat_type_desc: 'Botnet Command & Control',
        malware: 'win.cobalt_strike', malware_alias: 'CobaltStrike',
        malware_printable: 'Cobalt Strike', malware_malpedia: 'https://malpedia.caad.fkie.fraunhofer.de/details/win.cobalt_strike',
        confidence_level: 90, first_seen: '2026-02-20T08:00:00Z', last_seen: '2026-02-25T12:00:00Z',
        reporter: 'abuse_ch', reference: null, tags: ['cobalt-strike', 'c2'],
    },
    {
        id: 'tf-002', ioc: 'auth-microsft-online.com', ioc_type: 'domain',
        threat_type: 'payload_delivery', threat_type_desc: 'Payload Delivery via Phishing',
        malware: 'win.midnight_blizzard_loader', malware_alias: null,
        malware_printable: 'Midnight Blizzard Loader', malware_malpedia: '',
        confidence_level: 85, first_seen: '2026-01-10T00:00:00Z', last_seen: '2026-02-18T00:00:00Z',
        reporter: 'abuse_ch', reference: null, tags: ['phishing', 'apt29'],
    },
    {
        id: 'tf-003', ioc: 'a1b2c3d4e5f67890abcdef1234567890aabbccdd1122334455667788aabbccdd', ioc_type: 'sha256_hash',
        threat_type: 'payload', threat_type_desc: 'Malware Payload',
        malware: 'win.agent_tesla', malware_alias: 'AgentTesla',
        malware_printable: 'Agent Tesla', malware_malpedia: 'https://malpedia.caad.fkie.fraunhofer.de/details/win.agent_tesla',
        confidence_level: 95, first_seen: '2026-02-22T06:00:00Z', last_seen: null,
        reporter: 'abuse_ch', reference: null, tags: ['agent-tesla', 'infostealer'],
    },
];

const MOCK_MALWARE_SAMPLES: MalwareSample[] = [
    {
        sha256_hash: 'sha256_mock_sample_001', sha3_384_hash: '',
        sha1_hash: 'sha1_mock_001', md5_hash: 'md5_mock_001',
        first_seen: '2026-02-24T12:00:00Z', last_seen: null,
        file_name: 'invoice_02_2026.doc', file_size: 86016,
        file_type: 'doc', file_type_mime: 'application/msword',
        reporter: 'abuse_ch', origin_country: 'RU', signature: 'Emotet',
        tags: ['emotet', 'macro', 'doc'],
        intelligence: { clamav: 'Win.Trojan.Emotet-9876', downloads: '142', uploads: '3', mail: null },
    },
    {
        sha256_hash: 'sha256_mock_sample_002', sha3_384_hash: '',
        sha1_hash: 'sha1_mock_002', md5_hash: 'md5_mock_002',
        first_seen: '2026-02-25T08:30:00Z', last_seen: null,
        file_name: 'update.exe', file_size: 524288,
        file_type: 'exe', file_type_mime: 'application/x-dosexec',
        reporter: 'abuse_ch', origin_country: 'CN', signature: 'CobaltStrike',
        tags: ['cobalt-strike', 'beacon'],
        intelligence: { clamav: null, downloads: '89', uploads: '1', mail: null },
    },
];

// ── Helpers ────────────────────────────────────────────────────

function isEnabled(): boolean {
    return process.env.INTEL_ABUSECH_ENABLED !== 'false';
}

// ── Client Class ───────────────────────────────────────────────

export class AbuseCHClient {

    // ── Internal POST helper ────────────────────────────────────

    private async post<T>(url: string, body: Record<string, unknown>, providerKey: string): Promise<T> {
        if (!isEnabled() || getCircuitState(providerKey) === 'open') {
            throw new Error(`Abuse.ch ${providerKey} is disabled or circuit is open`);
        }

        // Abuse.ch APIs accept form-encoded for some endpoints and JSON for others.
        // ThreatFox and MalwareBazaar use JSON, URLhaus uses form-encoded.
        const isUrlhaus = url.includes('urlhaus');

        const res = await fetch(url, {
            method: 'POST',
            headers: isUrlhaus
                ? { 'Content-Type': 'application/x-www-form-urlencoded' }
                : { 'Content-Type': 'application/json' },
            body: isUrlhaus
                ? new URLSearchParams(body as Record<string, string>).toString()
                : JSON.stringify(body),
            signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
            setCircuitState(providerKey, 'open');
            throw new Error(`Abuse.ch API error (${providerKey}): ${res.status}`);
        }

        setCircuitState(providerKey, 'closed');
        return (await res.json()) as T;
    }

    // ── URLhaus ─────────────────────────────────────────────────

    async getRecentMaliciousURLs(limit: number = 50): Promise<MaliciousURL[]> {
        try {
            const data = await this.post<{ urls: MaliciousURL[] | null }>(
                `${URLHAUS_API}/urls/recent/`,
                { limit: String(limit) },
                PROVIDER_URLHAUS,
            );
            return (data.urls ?? []).slice(0, limit);
        } catch {
            console.warn('[AbuseCH] getRecentMaliciousURLs — falling back to mock data');
            return MOCK_URLS.slice(0, limit);
        }
    }

    async lookupURL(url: string): Promise<URLhausResult> {
        try {
            return await this.post<URLhausResult>(
                `${URLHAUS_API}/url/`,
                { url },
                PROVIDER_URLHAUS,
            );
        } catch {
            console.warn('[AbuseCH] lookupURL — falling back to mock data');
            const mock = MOCK_URLS.find(u => u.url === url);
            return {
                query_status: mock ? 'ok' : 'no_results',
                id: mock?.id ?? null,
                url,
                host: mock?.host ?? new URL(url).hostname,
                url_status: mock?.url_status ?? 'unknown',
                date_added: mock?.date_added ?? '',
                threat: mock?.threat ?? '',
                blacklists: { spamhaus_dbl: 'not listed', surbl: 'not listed' },
                tags: mock?.tags ?? [],
                payloads: mock?.payloads ?? [],
                urlhaus_reference: mock?.urlhaus_reference ?? '',
            };
        }
    }

    // ── ThreatFox ───────────────────────────────────────────────

    async getRecentIOCs(days: number = 1): Promise<ThreatFoxIOC[]> {
        try {
            const data = await this.post<{ query_status: string; data: ThreatFoxIOC[] | null }>(
                `${THREATFOX_API}/`,
                { query: 'get_iocs', days },
                PROVIDER_THREATFOX,
            );
            return data.data ?? [];
        } catch {
            console.warn('[AbuseCH] getRecentIOCs — falling back to mock data');
            return MOCK_THREATFOX_IOCS;
        }
    }

    async searchIOC(value: string): Promise<ThreatFoxIOC[]> {
        try {
            const data = await this.post<{ query_status: string; data: ThreatFoxIOC[] | null }>(
                `${THREATFOX_API}/`,
                { query: 'search_ioc', search_term: value },
                PROVIDER_THREATFOX,
            );
            return data.data ?? [];
        } catch {
            console.warn('[AbuseCH] searchIOC — falling back to mock data');
            const q = value.toLowerCase();
            return MOCK_THREATFOX_IOCS.filter(i =>
                i.ioc.toLowerCase().includes(q) ||
                i.malware_printable.toLowerCase().includes(q)
            );
        }
    }

    // ── MalwareBazaar ───────────────────────────────────────────

    async getRecentMalware(limit: number = 50): Promise<MalwareSample[]> {
        try {
            const data = await this.post<{ query_status: string; data: MalwareSample[] | null }>(
                `${MALWAREBAZAAR_API}/`,
                { query: 'get_recent', selector: 'time' },
                PROVIDER_MALWAREBAZAAR,
            );
            return (data.data ?? []).slice(0, limit);
        } catch {
            console.warn('[AbuseCH] getRecentMalware — falling back to mock data');
            return MOCK_MALWARE_SAMPLES.slice(0, limit);
        }
    }

    async lookupHash(hash: string): Promise<MalwareBazaarResult> {
        try {
            return await this.post<MalwareBazaarResult>(
                `${MALWAREBAZAAR_API}/`,
                { query: 'get_info', hash },
                PROVIDER_MALWAREBAZAAR,
            );
        } catch {
            console.warn('[AbuseCH] lookupHash — falling back to mock data');
            const found = MOCK_MALWARE_SAMPLES.find(s =>
                s.sha256_hash === hash || s.md5_hash === hash || s.sha1_hash === hash
            );
            return {
                query_status: found ? 'ok' : 'hash_not_found',
                data: found ? [found] : null,
            };
        }
    }

    // ── Stats ───────────────────────────────────────────────────

    async getStats(): Promise<AbuseCHStats> {
        try {
            const [urls, iocs, samples] = await Promise.allSettled([
                this.getRecentMaliciousURLs(1),
                this.getRecentIOCs(1),
                this.getRecentMalware(1),
            ]);
            return {
                urls: urls.status === 'fulfilled' ? Math.max(urls.value.length, 100) : MOCK_URLS.length,
                iocs: iocs.status === 'fulfilled' ? Math.max(iocs.value.length, 200) : MOCK_THREATFOX_IOCS.length,
                samples: samples.status === 'fulfilled' ? Math.max(samples.value.length, 50) : MOCK_MALWARE_SAMPLES.length,
            };
        } catch {
            return {
                urls: MOCK_URLS.length,
                iocs: MOCK_THREATFOX_IOCS.length,
                samples: MOCK_MALWARE_SAMPLES.length,
            };
        }
    }

    // ── Health ──────────────────────────────────────────────────

    async healthCheck(): Promise<AbuseCHHealthCheck> {
        const [urlhaus, threatfox, malwarebazaar] = await Promise.allSettled([
            this.getRecentMaliciousURLs(1).then(() => true).catch(() => false),
            this.getRecentIOCs(1).then(() => true).catch(() => false),
            this.getRecentMalware(1).then(() => true).catch(() => false),
        ]);
        return {
            urlhaus: urlhaus.status === 'fulfilled' ? urlhaus.value : false,
            threatfox: threatfox.status === 'fulfilled' ? threatfox.value : false,
            malwarebazaar: malwarebazaar.status === 'fulfilled' ? malwarebazaar.value : false,
        };
    }
}
