/**
 * AlienVault OTX Client — REST API wrapper with circuit-breaker + mock fallback.
 *
 * Follows the existing Astra-CISO patterns:
 *   • Mock-first fallback (like opencti-client.ts / misp-client.ts)
 *   • Circuit-breaker state via src/lib/ai/circuit-breaker.ts
 *
 * Base URL: https://otx.alienvault.com/api/v1
 * Docs: https://otx.alienvault.com/assets/static/external_api.html
 *
 * When ALIENVAULT_OTX_KEY is not set, all methods return mock data.
 */

import {
    setCircuitState,
    getCircuitState,
} from '@/lib/ai/circuit-breaker';
import type {
    OTXPulse,
    OTXIPReport,
    OTXDomainReport,
    OTXHashReport,
    OTXURLReport,
    OTXStats,
    OTXHealthCheck,
} from '../types';

// ── Constants ──────────────────────────────────────────────────

const PROVIDER_KEY = 'OTX';
const BASE_URL = 'https://otx.alienvault.com/api/v1';

// ── Mock Data ──────────────────────────────────────────────────

const MOCK_PULSES: OTXPulse[] = [
    {
        id: 'pulse-001', name: 'Volt Typhoon Infrastructure Tracker',
        description: 'Tracking C2 infrastructure used by Volt Typhoon in living-off-the-land campaigns.',
        author_name: 'AlienVault', created: '2026-01-15T10:00:00Z', modified: '2026-02-20T08:00:00Z',
        targeted_countries: ['US', 'JP', 'AU'], malware_families: [],
        attack_ids: ['T1059', 'T1078', 'T1190'], tags: ['apt', 'china', 'critical-infrastructure'],
        indicator_count: 24, indicators: [], tlp: 'white', references: ['https://www.cisa.gov/volt-typhoon'], revision: 3,
    },
    {
        id: 'pulse-002', name: 'BlackCat/ALPHV Ransomware IOCs',
        description: 'Indicators associated with BlackCat ransomware-as-a-service operations.',
        author_name: 'AlienVault', created: '2026-02-01T14:30:00Z', modified: '2026-02-18T11:00:00Z',
        targeted_countries: ['US', 'DE', 'GB'], malware_families: ['BlackCat', 'ALPHV'],
        attack_ids: ['T1486', 'T1490', 'T1027'], tags: ['ransomware', 'raas', 'alphv'],
        indicator_count: 38, indicators: [], tlp: 'green', references: [], revision: 2,
    },
    {
        id: 'pulse-003', name: 'SolarStorm 2.0 — Supply Chain Indicators',
        description: 'Follow-up campaign targeting CI/CD pipelines with trojanized npm packages.',
        author_name: 'AlienVault', created: '2025-12-01T09:00:00Z', modified: '2026-02-10T16:00:00Z',
        targeted_countries: ['US', 'EU'], malware_families: ['SUNBURST'],
        attack_ids: ['T1195', 'T1059'], tags: ['supply-chain', 'apt29', 'cicd'],
        indicator_count: 15, indicators: [], tlp: 'amber', references: [], revision: 4,
    },
];

const MOCK_IP_REPORT: OTXIPReport = {
    whois: 'OrgName: Example Hosting LLC',
    reputation: -42,
    indicator: '198.51.100.42',
    type: 'IPv4',
    type_title: 'IPv4',
    asn: 'AS12345',
    country_code: 'RU',
    country_name: 'Russia',
    city: 'Moscow',
    region: 'Moscow',
    latitude: 55.7558,
    longitude: 37.6173,
    pulse_info: { count: 3, pulses: MOCK_PULSES.slice(0, 1) },
    sections: ['general', 'geo', 'malware', 'url_list', 'passive_dns'],
    validation: [],
};

// ── Helpers ────────────────────────────────────────────────────

function isEnabled(): boolean {
    return process.env.INTEL_OTX_ENABLED === 'true';
}

function getApiKey(): string {
    return process.env.ALIENVAULT_OTX_KEY || '';
}

// ── Client Class ───────────────────────────────────────────────

export class OTXClient {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || getApiKey();
    }

    // ── Internal REST helper ────────────────────────────────────

    private async request<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
        if (!isEnabled() || !this.apiKey || getCircuitState(PROVIDER_KEY) === 'open') {
            throw new Error('OTX is disabled, no API key, or circuit is open');
        }

        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                'X-OTX-API-KEY': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
            setCircuitState(PROVIDER_KEY, 'open');
            throw new Error(`OTX API error: ${res.status}`);
        }

        setCircuitState(PROVIDER_KEY, 'closed');
        return (await res.json()) as T;
    }

    // ── Pulses ──────────────────────────────────────────────────

    async getSubscribedPulses(limit: number = 20): Promise<OTXPulse[]> {
        try {
            const data = await this.request<{ results: OTXPulse[] }>(
                `/pulses/subscribed?limit=${limit}&modified_since=2025-01-01T00:00:00Z`,
            );
            return data.results;
        } catch {
            console.warn('[OTX] getSubscribedPulses — falling back to mock data');
            return MOCK_PULSES.slice(0, limit);
        }
    }

    async getPulseDetails(pulseId: string): Promise<OTXPulse> {
        try {
            return await this.request<OTXPulse>(`/pulses/${pulseId}`);
        } catch {
            console.warn('[OTX] getPulseDetails — falling back to mock data');
            return MOCK_PULSES.find(p => p.id === pulseId) || MOCK_PULSES[0];
        }
    }

    async searchPulses(query: string): Promise<OTXPulse[]> {
        try {
            const data = await this.request<{ results: OTXPulse[] }>(
                `/search/pulses?q=${encodeURIComponent(query)}&limit=20`,
            );
            return data.results;
        } catch {
            console.warn('[OTX] searchPulses — falling back to mock data');
            const q = query.toLowerCase();
            return MOCK_PULSES.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.tags.some(t => t.toLowerCase().includes(q))
            );
        }
    }

    // ── IOC Enrichment ──────────────────────────────────────────

    async enrichIP(ip: string): Promise<OTXIPReport> {
        try {
            return await this.request<OTXIPReport>(`/indicators/IPv4/${ip}/general`);
        } catch {
            console.warn('[OTX] enrichIP — falling back to mock data');
            return { ...MOCK_IP_REPORT, indicator: ip };
        }
    }

    async enrichDomain(domain: string): Promise<OTXDomainReport> {
        try {
            return await this.request<OTXDomainReport>(`/indicators/domain/${domain}/general`);
        } catch {
            console.warn('[OTX] enrichDomain — falling back to mock data');
            return {
                indicator: domain, type: 'domain', type_title: 'Domain',
                whois: 'Registrar: Example Registrar', alexa: '',
                pulse_info: { count: 1, pulses: MOCK_PULSES.slice(0, 1) },
                validation: [],
            };
        }
    }

    async enrichHash(hash: string): Promise<OTXHashReport> {
        try {
            return await this.request<OTXHashReport>(`/indicators/file/${hash}/general`);
        } catch {
            console.warn('[OTX] enrichHash — falling back to mock data');
            return {
                indicator: hash, type: 'file', type_title: 'File Hash',
                pulse_info: { count: 1, pulses: MOCK_PULSES.slice(1, 2) },
                analysis: { malware: true, has_flash: false, plugins: {} },
                validation: [],
            };
        }
    }

    async enrichURL(url: string): Promise<OTXURLReport> {
        try {
            return await this.request<OTXURLReport>(
                `/indicators/url/${encodeURIComponent(url)}/general`,
            );
        } catch {
            console.warn('[OTX] enrichURL — falling back to mock data');
            return {
                indicator: url, type: 'url', type_title: 'URL',
                alexa: '', whois: '',
                pulse_info: { count: 1, pulses: MOCK_PULSES.slice(0, 1) },
                url_list: [], validation: [],
            };
        }
    }

    // ── Stats ───────────────────────────────────────────────────

    async getStats(): Promise<OTXStats> {
        try {
            const pulses = await this.getSubscribedPulses(1);
            return {
                pulses: pulses.length > 0 ? 50 : 0,   // Approximation
                indicators: pulses.reduce((s, p) => s + p.indicator_count, 0),
                subscribers: 0,
            };
        } catch {
            return {
                pulses: MOCK_PULSES.length,
                indicators: MOCK_PULSES.reduce((s, p) => s + p.indicator_count, 0),
                subscribers: 0,
            };
        }
    }

    // ── Health ──────────────────────────────────────────────────

    async healthCheck(): Promise<OTXHealthCheck> {
        try {
            // Use a lightweight endpoint to check connectivity
            await this.request<unknown>('/pulses/subscribed?limit=1');
            return { connected: true, version: 'v1' };
        } catch {
            return { connected: false, version: 'unknown' };
        }
    }
}
