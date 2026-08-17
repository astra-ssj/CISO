/**
 * Abuse.ch Client — Three free feeds, no API key required.
 *
 * Follows Astra v3 deterministic intel:
 *   • Live fetch or empty — never silent mock IOCs
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
            console.warn('[AbuseCH] getRecentMaliciousURLs — empty (live fetch failed, no mock)');
            return [];
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
            console.warn('[AbuseCH] lookupURL — empty (live fetch failed, no mock)');
            return {
                query_status: 'no_results',
                id: null,
                url,
                host: '',
                url_status: 'unknown',
                date_added: '',
                threat: '',
                blacklists: { spamhaus_dbl: 'not listed', surbl: 'not listed' },
                tags: [],
                payloads: [],
                urlhaus_reference: '',
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
            console.warn('[AbuseCH] getRecentIOCs — empty (live fetch failed, no mock)');
            return [];
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
            console.warn('[AbuseCH] searchIOC — empty (live fetch failed, no mock)');
            return [];
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
            console.warn('[AbuseCH] getRecentMalware — empty (live fetch failed, no mock)');
            return [];
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
            console.warn('[AbuseCH] lookupHash — empty (live fetch failed, no mock)');
            return {
                query_status: 'hash_not_found',
                data: null,
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
                urls: urls.status === 'fulfilled' ? urls.value.length : 0,
                iocs: iocs.status === 'fulfilled' ? iocs.value.length : 0,
                samples: samples.status === 'fulfilled' ? samples.value.length : 0,
            };
        } catch {
            return {
                urls: 0,
                iocs: 0,
                samples: 0,
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
