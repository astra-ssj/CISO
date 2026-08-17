/**
 * MISP Client — REST API with circuit-breaker.
 *
 * Astra v3: live fetch, last Observation, or empty. Never silent mock intel.
 */

import {
    setCircuitState,
    getCircuitState,
} from '@/lib/ai/circuit-breaker';
import { liveOrEmpty } from '@/lib/observations/record';
import type {
    MISPEvent,
    MISPEventFilters,
    MISPAttribute,
    MISPAttributeFilters,
    MISPFeed,
    MISPFeedStatus,
    MISPTag,
    MISPGalaxy,
    MISPStats,
    MISPHealthCheck,
} from '../types';

const PROVIDER_KEY = 'MISP';
const DEFAULT_URL = 'https://localhost:8443';

function isEnabled(): boolean {
    return process.env.INTEL_MISP_ENABLED !== 'false';
}

export class MISPClient {
    private url: string;
    private apiKey: string;

    constructor(url?: string, apiKey?: string) {
        this.url = url || process.env.MISP_URL || DEFAULT_URL;
        this.apiKey = apiKey || process.env.MISP_API_KEY || '';
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        if (!isEnabled() || getCircuitState(PROVIDER_KEY) === 'open') {
            throw new Error('MISP is disabled or circuit is open');
        }
        if (!this.apiKey) {
            throw new Error('MISP API key missing');
        }

        const res = await fetch(`${this.url}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: this.apiKey,
                ...(options.headers || {}),
            },
            signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
            setCircuitState(PROVIDER_KEY, 'open');
            throw new Error(`MISP API error: ${res.status}`);
        }

        setCircuitState(PROVIDER_KEY, 'closed');
        return res.json() as Promise<T>;
    }

    private envelope<T>(operation: string, requestKey: string, fetchFn: () => Promise<T>, empty: T): Promise<T> {
        return liveOrEmpty(
            { integrationId: 'misp', operation, requestKey, ttlMs: 60 * 60 * 1000 },
            fetchFn,
            empty,
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getEvents(_filters?: MISPEventFilters): Promise<MISPEvent[]> {
        return this.envelope('getEvents', 'index', async () => {
            const data = await this.request<{ response: MISPEvent[] }>('/events/index');
            return data.response ?? [];
        }, []);
    }

    async getRecentEvents(hours: number): Promise<MISPEvent[]> {
        const events = await this.getEvents();
        const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
        return events.filter((e) => e.timestamp >= cutoff);
    }

    async getEventById(id: string): Promise<MISPEvent | null> {
        return this.envelope('getEventById', id, async () => {
            const data = await this.request<{ Event: MISPEvent }>(`/events/view/${id}`);
            return data.Event ?? null;
        }, null);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getAttributes(_filters?: MISPAttributeFilters): Promise<MISPAttribute[]> {
        return this.envelope('getAttributes', 'restSearch:100', async () => {
            const data = await this.request<{ response: { Attribute: MISPAttribute[] } }>(
                '/attributes/restSearch', { method: 'POST', body: JSON.stringify({ limit: 100 }) },
            );
            return data.response?.Attribute ?? [];
        }, []);
    }

    async getAttributesByType(type: string): Promise<MISPAttribute[]> {
        const attrs = await this.getAttributes();
        return attrs.filter((a) => a.type === type);
    }

    async searchAttributes(value: string): Promise<MISPAttribute[]> {
        return this.envelope('searchAttributes', value.toLowerCase().slice(0, 200), async () => {
            const data = await this.request<{ response: { Attribute: MISPAttribute[] } }>(
                '/attributes/restSearch', { method: 'POST', body: JSON.stringify({ value, limit: 50 }) },
            );
            return data.response?.Attribute ?? [];
        }, []);
    }

    async getFeeds(): Promise<MISPFeed[]> {
        return this.envelope('getFeeds', 'index', async () => {
            const data = await this.request<{ Feed: MISPFeed[] }>('/feeds/index');
            return data.Feed ?? [];
        }, []);
    }

    async getFeedStatus(): Promise<MISPFeedStatus[]> {
        const feeds = await this.getFeeds();
        return feeds.map((f) => ({
            id: f.id,
            name: f.name,
            enabled: f.enabled,
            lastFetch: f.last_fetched ? new Date(f.last_fetched) : new Date(0),
            eventCount: f.event_count ?? 0,
        }));
    }

    async enableFeed(feedId: string): Promise<void> {
        try {
            await this.request(`/feeds/enable/${feedId}`, { method: 'POST' });
        } catch (err) {
            console.warn(`[MISP] enableFeed(${feedId}) failed`, err instanceof Error ? err.message : err);
        }
    }

    async getTags(): Promise<MISPTag[]> {
        return this.envelope('getTags', 'all', async () => {
            const data = await this.request<{ Tag: MISPTag[] }>('/tags');
            return data.Tag ?? [];
        }, []);
    }

    async getGalaxies(): Promise<MISPGalaxy[]> {
        return this.envelope('getGalaxies', 'all', async () => {
            return this.request<MISPGalaxy[]>('/galaxies');
        }, []);
    }

    async publishEvent(event: MISPEvent): Promise<void> {
        try {
            await this.request(`/events/publish/${event.id}`, { method: 'POST' });
        } catch (err) {
            console.warn(`[MISP] publishEvent(${event.id}) failed`, err instanceof Error ? err.message : err);
        }
    }

    async getStats(): Promise<MISPStats> {
        const [events, attributes, feeds] = await Promise.all([
            this.getEvents(),
            this.getAttributes(),
            this.getFeeds(),
        ]);
        return {
            events: events.length,
            attributes: attributes.length,
            feeds: feeds.length,
            organizations: 0,
        };
    }

    async healthCheck(): Promise<MISPHealthCheck> {
        try {
            const data = await this.request<{ version: string }>('/servers/getVersion');
            return {
                connected: true,
                version: data.version,
                lastSync: new Date(),
            };
        } catch {
            return {
                connected: false,
                version: 'unknown',
                lastSync: new Date(0),
            };
        }
    }
}
