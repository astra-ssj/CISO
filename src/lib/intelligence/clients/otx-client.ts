/**
 * AlienVault OTX Client — REST API with circuit-breaker.
 *
 * Astra v3: live fetch, last Observation, or empty. Never silent mock intel.
 * Base URL: https://otx.alienvault.com/api/v1
 */

import {
    setCircuitState,
    getCircuitState,
} from '@/lib/ai/circuit-breaker';
import { liveOrEmpty } from '@/lib/observations/record';
import type {
    OTXPulse,
    OTXIPReport,
    OTXDomainReport,
    OTXHashReport,
    OTXURLReport,
    OTXStats,
    OTXHealthCheck,
} from '../types';

const PROVIDER_KEY = 'OTX';
const BASE_URL = 'https://otx.alienvault.com/api/v1';

function isEnabled(): boolean {
    return process.env.INTEL_OTX_ENABLED === 'true';
}

function getApiKey(): string {
    return process.env.ALIENVAULT_OTX_KEY || '';
}

const EMPTY_PULSE_INFO = { count: 0, pulses: [] as OTXPulse[] };

export class OTXClient {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || getApiKey();
    }

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

    private envelope<T>(operation: string, requestKey: string, fetchFn: () => Promise<T>, empty: T): Promise<T> {
        return liveOrEmpty(
            { integrationId: 'otx', operation, requestKey, ttlMs: 60 * 60 * 1000 },
            fetchFn,
            empty,
        );
    }

    async getSubscribedPulses(limit: number = 20): Promise<OTXPulse[]> {
        return this.envelope('getSubscribedPulses', `limit:${limit}`, async () => {
            const data = await this.request<{ results: OTXPulse[] }>(
                `/pulses/subscribed?limit=${limit}&modified_since=2025-01-01T00:00:00Z`,
            );
            return data.results ?? [];
        }, []);
    }

    async getPulseDetails(pulseId: string): Promise<OTXPulse | null> {
        return this.envelope('getPulseDetails', pulseId, async () => {
            return this.request<OTXPulse>(`/pulses/${pulseId}`);
        }, null);
    }

    async searchPulses(query: string): Promise<OTXPulse[]> {
        return this.envelope('searchPulses', query.toLowerCase().slice(0, 200), async () => {
            const data = await this.request<{ results: OTXPulse[] }>(
                `/search/pulses?q=${encodeURIComponent(query)}&limit=20`,
            );
            return data.results ?? [];
        }, []);
    }

    async enrichIP(ip: string): Promise<OTXIPReport> {
        const empty: OTXIPReport = {
            whois: '',
            reputation: 0,
            indicator: ip,
            type: 'IPv4',
            type_title: 'IPv4',
            asn: '',
            country_code: '',
            country_name: '',
            city: '',
            region: '',
            latitude: 0,
            longitude: 0,
            pulse_info: { ...EMPTY_PULSE_INFO },
            sections: [],
            validation: [],
        };
        return this.envelope('enrichIP', ip, () => this.request<OTXIPReport>(`/indicators/IPv4/${ip}/general`), empty);
    }

    async enrichDomain(domain: string): Promise<OTXDomainReport> {
        const empty: OTXDomainReport = {
            indicator: domain,
            type: 'domain',
            type_title: 'Domain',
            whois: '',
            alexa: '',
            pulse_info: { ...EMPTY_PULSE_INFO },
            validation: [],
        };
        return this.envelope('enrichDomain', domain.toLowerCase(), () => this.request<OTXDomainReport>(`/indicators/domain/${domain}/general`), empty);
    }

    async enrichHash(hash: string): Promise<OTXHashReport> {
        const empty: OTXHashReport = {
            indicator: hash,
            type: 'file',
            type_title: 'File Hash',
            pulse_info: { ...EMPTY_PULSE_INFO },
            analysis: null,
            validation: [],
        };
        return this.envelope('enrichHash', hash.toLowerCase(), () => this.request<OTXHashReport>(`/indicators/file/${hash}/general`), empty);
    }

    async enrichURL(url: string): Promise<OTXURLReport> {
        const empty: OTXURLReport = {
            indicator: url,
            type: 'url',
            type_title: 'URL',
            alexa: '',
            whois: '',
            pulse_info: { ...EMPTY_PULSE_INFO },
            url_list: [],
            validation: [],
        };
        return this.envelope('enrichURL', url, () => this.request<OTXURLReport>(
            `/indicators/url/${encodeURIComponent(url)}/general`,
        ), empty);
    }

    async getStats(): Promise<OTXStats> {
        const pulses = await this.getSubscribedPulses(20);
        return {
            pulses: pulses.length,
            indicators: pulses.reduce((s, p) => s + (p.indicator_count || 0), 0),
            subscribers: 0,
        };
    }

    async healthCheck(): Promise<OTXHealthCheck> {
        try {
            await this.request<unknown>('/pulses/subscribed?limit=1');
            return { connected: true, version: 'v1' };
        } catch {
            return { connected: false, version: 'unknown' };
        }
    }
}
