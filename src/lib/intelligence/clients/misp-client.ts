/**
 * MISP Client — REST API wrapper with circuit-breaker + mock fallback.
 *
 * Follows the existing Astra-CISO patterns:
 *   • Mock-first fallback (like ransomware-client.ts / GitHubConnector)
 *   • Circuit-breaker state via src/lib/ai/circuit-breaker.ts
 *
 * All real API calls hit the MISP REST API (/events, /attributes, etc.).
 * When the server is unreachable the client transparently returns realistic
 * mock data so the Intelligence UI always has content.
 */

import {
    setCircuitState,
    getCircuitState,
} from '@/lib/ai/circuit-breaker';
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

// ── Constants ──────────────────────────────────────────────────

const PROVIDER_KEY = 'MISP';
const DEFAULT_URL = 'https://localhost:8443';

// ── Mock Data ──────────────────────────────────────────────────

const MOCK_EVENTS: MISPEvent[] = [
    {
        id: '1', uuid: '550e8400-e29b-41d4-a716-446655440001',
        org_id: '1', orgc_id: '1',
        info: 'SolarStorm 2.0 — Supply Chain Indicators',
        date: '2026-01-15', timestamp: '2026-01-15T10:00:00Z',
        published: true, publish_timestamp: '2026-01-15T12:00:00Z',
        threat_level_id: '1', analysis: '2', distribution: '3',
        attribute_count: 24,
        Orgc: { id: '1', name: 'AstraLabs CERT', uuid: '550e8400-e29b-41d4-a716-446655440010' },
        Tag: [
            { id: '1', name: 'tlp:amber', colour: '#FFC000', exportable: true },
            { id: '2', name: 'misp-galaxy:mitre-attack-pattern="Supply Chain Compromise - T1195"', colour: '#0088CC', exportable: true, is_galaxy: true },
        ],
    },
    {
        id: '2', uuid: '550e8400-e29b-41d4-a716-446655440002',
        org_id: '1', orgc_id: '1',
        info: 'Volt Typhoon — Critical Infrastructure Targeting IOCs',
        date: '2026-02-01', timestamp: '2026-02-01T08:00:00Z',
        published: true, publish_timestamp: '2026-02-01T09:00:00Z',
        threat_level_id: '1', analysis: '1', distribution: '3',
        attribute_count: 38,
        Orgc: { id: '1', name: 'AstraLabs CERT', uuid: '550e8400-e29b-41d4-a716-446655440010' },
        Tag: [
            { id: '3', name: 'tlp:red', colour: '#FF2B2B', exportable: false },
        ],
    },
    {
        id: '3', uuid: '550e8400-e29b-41d4-a716-446655440003',
        org_id: '1', orgc_id: '2',
        info: 'Scattered Spider — Social-Engineering Playbook',
        date: '2026-01-25', timestamp: '2026-01-25T14:30:00Z',
        published: true, publish_timestamp: '2026-01-25T15:00:00Z',
        threat_level_id: '2', analysis: '2', distribution: '2',
        attribute_count: 15,
        Orgc: { id: '2', name: 'CIRCL', uuid: '550e8400-e29b-41d4-a716-446655440020' },
        Tag: [
            { id: '4', name: 'tlp:green', colour: '#33FF00', exportable: true },
        ],
    },
];

const MOCK_ATTRIBUTES: MISPAttribute[] = [
    {
        id: '101', uuid: 'a1b2c3d4-0001', event_id: '1',
        category: 'Network activity', type: 'ip-dst', value: '198.51.100.42',
        comment: 'C2 callback IP', timestamp: '2026-01-15T10:00:00Z',
        to_ids: true, distribution: '3',
        Tag: [{ id: '1', name: 'tlp:amber', colour: '#FFC000', exportable: true }],
    },
    {
        id: '102', uuid: 'a1b2c3d4-0002', event_id: '1',
        category: 'Payload delivery', type: 'domain', value: 'update-cdn-service.com',
        comment: 'Malicious update domain', timestamp: '2026-01-15T10:05:00Z',
        to_ids: true, distribution: '3',
    },
    {
        id: '103', uuid: 'a1b2c3d4-0003', event_id: '1',
        category: 'Payload delivery', type: 'sha256',
        value: '7d2c8f1a3b9e0d4c5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
        comment: 'Trojanized DLL hash', timestamp: '2026-01-15T10:10:00Z',
        to_ids: true, distribution: '3',
    },
    {
        id: '104', uuid: 'a1b2c3d4-0004', event_id: '2',
        category: 'Network activity', type: 'ip-dst', value: '203.0.113.17',
        comment: 'Volt Typhoon staging server', timestamp: '2026-02-01T08:15:00Z',
        to_ids: true, distribution: '3',
    },
    {
        id: '105', uuid: 'a1b2c3d4-0005', event_id: '2',
        category: 'Network activity', type: 'url',
        value: 'https://data-analytics-cdn.io/collect',
        comment: 'Exfiltration endpoint', timestamp: '2026-02-01T08:20:00Z',
        to_ids: true, distribution: '3',
    },
];

const MOCK_FEEDS: MISPFeed[] = [
    { id: '1', name: 'CIRCL OSINT Feed', provider: 'CIRCL', url: 'https://www.circl.lu/doc/misp/feed-osint/', enabled: true, source_format: 'misp', last_fetched: '2026-02-25T12:00:00Z', event_count: 1240 },
    { id: '2', name: 'Botvrij.eu', provider: 'Botvrij', url: 'https://www.botvrij.eu/data/feed-osint/', enabled: true, source_format: 'misp', last_fetched: '2026-02-25T11:00:00Z', event_count: 890 },
    { id: '3', name: 'abuse.ch URLhaus', provider: 'abuse.ch', url: 'https://urlhaus.abuse.ch/feeds/', enabled: false, source_format: 'csv', event_count: 0 },
];

const MOCK_TAGS: MISPTag[] = [
    { id: '1', name: 'tlp:white', colour: '#FFFFFF', exportable: true },
    { id: '2', name: 'tlp:green', colour: '#33FF00', exportable: true },
    { id: '3', name: 'tlp:amber', colour: '#FFC000', exportable: true },
    { id: '4', name: 'tlp:red', colour: '#FF2B2B', exportable: false },
    { id: '5', name: 'type:OSINT', colour: '#0088CC', exportable: true },
    { id: '6', name: 'adversary:APT29', colour: '#9C27B0', exportable: true },
];

const MOCK_GALAXIES: MISPGalaxy[] = [
    {
        id: '1', uuid: 'gal-001', name: 'MITRE ATT&CK', type: 'mitre-attack-pattern',
        description: 'ATT&CK techniques mapped to MISP events', namespace: 'mitre',
        GalaxyCluster: [
            { id: '1', uuid: 'gc-001', value: 'Phishing - T1566', description: 'Phishing techniques', source: 'MITRE', tag_name: 'misp-galaxy:mitre-attack-pattern="Phishing - T1566"' },
            { id: '2', uuid: 'gc-002', value: 'Supply Chain Compromise - T1195', description: 'Supply chain attack', source: 'MITRE', tag_name: 'misp-galaxy:mitre-attack-pattern="Supply Chain Compromise - T1195"' },
        ],
    },
    {
        id: '2', uuid: 'gal-002', name: 'Threat Actor', type: 'threat-actor',
        description: 'Known threat actor groups', namespace: 'misp',
        GalaxyCluster: [
            { id: '3', uuid: 'gc-003', value: 'APT29', description: 'Russian state-sponsored group', source: 'MISP', tag_name: 'misp-galaxy:threat-actor="APT29"' },
        ],
    },
];

// ── Helpers ────────────────────────────────────────────────────

function isEnabled(): boolean {
    return process.env.INTEL_MISP_ENABLED !== 'false';
}

// ── Client Class ───────────────────────────────────────────────

export class MISPClient {
    private url: string;
    private apiKey: string;

    constructor(url?: string, apiKey?: string) {
        this.url = url || process.env.MISP_URL || DEFAULT_URL;
        this.apiKey = apiKey || process.env.MISP_API_KEY || '';
    }

    // ── Internal REST helper ────────────────────────────────────

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        if (!isEnabled() || getCircuitState(PROVIDER_KEY) === 'open') {
            throw new Error('MISP is disabled or circuit is open');
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

    // ── Events ──────────────────────────────────────────────────

    async getEvents(_filters?: MISPEventFilters): Promise<MISPEvent[]> {
        try {
            const data = await this.request<{ response: MISPEvent[] }>('/events/index');
            return data.response ?? [];
        } catch {
            console.warn('[MISP] getEvents — falling back to mock data');
            return MOCK_EVENTS;
        }
    }

    async getRecentEvents(hours: number): Promise<MISPEvent[]> {
        const events = await this.getEvents();
        const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
        return events.filter(e => e.timestamp >= cutoff);
    }

    async getEventById(id: string): Promise<MISPEvent> {
        try {
            const data = await this.request<{ Event: MISPEvent }>(`/events/view/${id}`);
            return data.Event;
        } catch {
            console.warn(`[MISP] getEventById(${id}) — falling back to mock data`);
            return MOCK_EVENTS.find(e => e.id === id) || MOCK_EVENTS[0];
        }
    }

    // ── Attributes (IOCs) ──────────────────────────────────────

    async getAttributes(_filters?: MISPAttributeFilters): Promise<MISPAttribute[]> {
        try {
            const data = await this.request<{ response: { Attribute: MISPAttribute[] } }>(
                '/attributes/restSearch', { method: 'POST', body: JSON.stringify({ limit: 100 }) },
            );
            return data.response?.Attribute ?? [];
        } catch {
            console.warn('[MISP] getAttributes — falling back to mock data');
            return MOCK_ATTRIBUTES;
        }
    }

    async getAttributesByType(type: string): Promise<MISPAttribute[]> {
        const attrs = await this.getAttributes();
        return attrs.filter(a => a.type === type);
    }

    async searchAttributes(value: string): Promise<MISPAttribute[]> {
        try {
            const data = await this.request<{ response: { Attribute: MISPAttribute[] } }>(
                '/attributes/restSearch', { method: 'POST', body: JSON.stringify({ value, limit: 50 }) },
            );
            return data.response?.Attribute ?? [];
        } catch {
            console.warn('[MISP] searchAttributes — falling back to mock data');
            const q = value.toLowerCase();
            return MOCK_ATTRIBUTES.filter(a => a.value.toLowerCase().includes(q));
        }
    }

    // ── Feeds ───────────────────────────────────────────────────

    async getFeeds(): Promise<MISPFeed[]> {
        try {
            const data = await this.request<{ Feed: MISPFeed[] }>('/feeds/index');
            return data.Feed ?? [];
        } catch {
            console.warn('[MISP] getFeeds — falling back to mock data');
            return MOCK_FEEDS;
        }
    }

    async getFeedStatus(): Promise<MISPFeedStatus[]> {
        const feeds = await this.getFeeds();
        return feeds.map(f => ({
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
        } catch {
            console.warn(`[MISP] enableFeed(${feedId}) — call failed (mock mode)`);
        }
    }

    // ── Tags & Galaxies ─────────────────────────────────────────

    async getTags(): Promise<MISPTag[]> {
        try {
            const data = await this.request<{ Tag: MISPTag[] }>('/tags');
            return data.Tag ?? [];
        } catch {
            console.warn('[MISP] getTags — falling back to mock data');
            return MOCK_TAGS;
        }
    }

    async getGalaxies(): Promise<MISPGalaxy[]> {
        try {
            const data = await this.request<MISPGalaxy[]>('/galaxies');
            return data;
        } catch {
            console.warn('[MISP] getGalaxies — falling back to mock data');
            return MOCK_GALAXIES;
        }
    }

    // ── Sharing ─────────────────────────────────────────────────

    async publishEvent(event: MISPEvent): Promise<void> {
        try {
            await this.request(`/events/publish/${event.id}`, { method: 'POST' });
        } catch {
            console.warn(`[MISP] publishEvent(${event.id}) — call failed (mock mode)`);
        }
    }

    // ── Stats ───────────────────────────────────────────────────

    async getStats(): Promise<MISPStats> {
        try {
            const [events, attributes, feeds] = await Promise.all([
                this.getEvents(),
                this.getAttributes(),
                this.getFeeds(),
            ]);
            return {
                events: events.length,
                attributes: attributes.length,
                feeds: feeds.length,
                organizations: 1, // Default org
            };
        } catch {
            return {
                events: MOCK_EVENTS.length,
                attributes: MOCK_ATTRIBUTES.length,
                feeds: MOCK_FEEDS.length,
                organizations: 1,
            };
        }
    }

    // ── Health ──────────────────────────────────────────────────

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
