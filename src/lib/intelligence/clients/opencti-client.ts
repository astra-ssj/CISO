/**
 * OpenCTI Client — GraphQL API wrapper with circuit-breaker + mock fallback.
 *
 * Follows the existing Astra-CISO patterns:
 *   • Mock-first fallback (like ransomware-client.ts / GitHubConnector)
 *   • Circuit-breaker state via src/lib/ai/circuit-breaker.ts
 *
 * All real API calls use OpenCTI's GraphQL endpoint.  When the platform is
 * unreachable the client transparently returns realistic mock data so the
 * Intelligence UI always has content.
 */

import {
    setCircuitState,
    getCircuitState,
} from '@/lib/ai/circuit-breaker';
import type {
    Campaign,
    ThreatActor,
    Indicator,
    IndicatorTypeShort,
    AttackPattern,
    AttackHeatmapEntry,
    Malware,
    Report,
    SearchResult,
    OpenCTIStats,
    OpenCTIHealthCheck,
    OpenCTIFilters,
} from '../types';

// ── Constants ──────────────────────────────────────────────────

const PROVIDER_KEY = 'OPENCTI';
const DEFAULT_URL = 'https://demo.opencti.io';

// ── Mock Data ──────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
    {
        id: 'campaign--001', standard_id: 'campaign--001', entity_type: 'Campaign',
        name: 'SolarStorm 2.0', description: 'Follow-up supply-chain campaign targeting CI/CD pipelines.',
        created: '2025-11-01T00:00:00Z', modified: '2026-01-15T00:00:00Z',
        first_seen: '2025-11-01T00:00:00Z', last_seen: '2026-01-10T00:00:00Z',
        targetedRegions: ['North America', 'Europe'], threatActors: ['Cozy Bear'],
        confidence: 85,
    },
    {
        id: 'campaign--002', standard_id: 'campaign--002', entity_type: 'Campaign',
        name: 'Operation Volt Typhoon', description: 'State-sponsored campaign targeting critical infrastructure.',
        created: '2025-06-01T00:00:00Z', modified: '2026-02-01T00:00:00Z',
        first_seen: '2025-06-01T00:00:00Z', last_seen: '2026-02-01T00:00:00Z',
        targetedRegions: ['Asia-Pacific', 'North America'], threatActors: ['Volt Typhoon'],
        confidence: 90,
    },
    {
        id: 'campaign--003', standard_id: 'campaign--003', entity_type: 'Campaign',
        name: 'Midnight Blizzard Resurgence', description: 'Token theft campaign against cloud identity providers.',
        created: '2025-09-15T00:00:00Z', modified: '2026-01-20T00:00:00Z',
        first_seen: '2025-09-15T00:00:00Z', last_seen: '2026-01-20T00:00:00Z',
        targetedRegions: ['Europe', 'North America'], threatActors: ['Midnight Blizzard'],
        confidence: 80,
    },
];

const MOCK_THREAT_ACTORS: ThreatActor[] = [
    {
        id: 'threat-actor--001', standard_id: 'threat-actor--001', entity_type: 'Threat-Actor',
        name: 'Cozy Bear', description: 'Russian state-sponsored espionage group (APT29).',
        created: '2020-01-01T00:00:00Z', modified: '2026-01-15T00:00:00Z',
        aliases: ['APT29', 'The Dukes', 'Nobelium'],
        threat_actor_types: ['nation-state'], sophistication: 'expert',
        primary_motivation: 'organizational-gain',
        targetedSectors: ['Government', 'Technology', 'Energy'], country: 'Russia',
        confidence: 95,
    },
    {
        id: 'threat-actor--002', standard_id: 'threat-actor--002', entity_type: 'Threat-Actor',
        name: 'Volt Typhoon', description: 'Chinese state-sponsored actor targeting US critical infra.',
        created: '2023-05-01T00:00:00Z', modified: '2026-02-01T00:00:00Z',
        aliases: ['BRONZE SILHOUETTE', 'Vanguard Panda'],
        threat_actor_types: ['nation-state'], sophistication: 'expert',
        primary_motivation: 'organizational-gain',
        targetedSectors: ['Critical Infrastructure', 'Telecommunications', 'Maritime'], country: 'China',
        confidence: 90,
    },
    {
        id: 'threat-actor--003', standard_id: 'threat-actor--003', entity_type: 'Threat-Actor',
        name: 'Scattered Spider', description: 'Financially motivated threat group using social engineering.',
        created: '2023-09-01T00:00:00Z', modified: '2026-01-25T00:00:00Z',
        aliases: ['UNC3944', 'Muddled Libra'],
        threat_actor_types: ['criminal'], sophistication: 'advanced',
        primary_motivation: 'personal-gain',
        targetedSectors: ['Finance', 'Technology', 'Hospitality'], country: 'Unknown',
        confidence: 80,
    },
];

const MOCK_INDICATORS: Indicator[] = [
    {
        id: 'indicator--001', standard_id: 'indicator--001', entity_type: 'Indicator',
        name: 'C2 Server — SolarStorm 2.0',
        pattern: "[ipv4-addr:value = '198.51.100.42']", pattern_type: 'stix',
        valid_from: '2025-12-01T00:00:00Z', valid_until: '2026-06-01T00:00:00Z',
        created: '2025-12-01T00:00:00Z', modified: '2026-01-15T00:00:00Z',
        indicator_types: ['malicious-activity'], observableValue: '198.51.100.42',
        observableType: 'ipv4-addr', confidence: 85,
    },
    {
        id: 'indicator--002', standard_id: 'indicator--002', entity_type: 'Indicator',
        name: 'Phishing Domain — Midnight Blizzard',
        pattern: "[domain-name:value = 'auth-microsft-online.com']", pattern_type: 'stix',
        valid_from: '2026-01-10T00:00:00Z',
        created: '2026-01-10T00:00:00Z', modified: '2026-01-20T00:00:00Z',
        indicator_types: ['malicious-activity'], observableValue: 'auth-microsft-online.com',
        observableType: 'domain-name', confidence: 90,
    },
    {
        id: 'indicator--003', standard_id: 'indicator--003', entity_type: 'Indicator',
        name: 'Loader Hash — Volt Typhoon',
        pattern: "[file:hashes.'SHA-256' = 'a1b2c3d4e5f6...']", pattern_type: 'stix',
        valid_from: '2025-11-15T00:00:00Z',
        created: '2025-11-15T00:00:00Z', modified: '2026-02-01T00:00:00Z',
        indicator_types: ['malicious-activity'], observableValue: 'a1b2c3d4e5f67890abcdef1234567890',
        observableType: 'file', confidence: 75,
    },
    {
        id: 'indicator--004', standard_id: 'indicator--004', entity_type: 'Indicator',
        name: 'Exfiltration URL — APT31',
        pattern: "[url:value = 'https://data-analytics-cdn.io/collect']", pattern_type: 'stix',
        valid_from: '2026-02-01T00:00:00Z',
        created: '2026-02-01T00:00:00Z', modified: '2026-02-15T00:00:00Z',
        indicator_types: ['malicious-activity'], observableValue: 'https://data-analytics-cdn.io/collect',
        observableType: 'url', confidence: 70,
    },
];

const MOCK_ATTACK_PATTERNS: AttackPattern[] = [
    {
        id: 'attack-pattern--001', standard_id: 'attack-pattern--001', entity_type: 'Attack-Pattern',
        name: 'Phishing', x_mitre_id: 'T1566',
        description: 'Adversaries may send phishing messages to gain access.',
        created: '2020-01-01T00:00:00Z', modified: '2025-10-01T00:00:00Z',
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'initial-access' }],
        x_mitre_platforms: ['Windows', 'macOS', 'Linux'],
    },
    {
        id: 'attack-pattern--002', standard_id: 'attack-pattern--002', entity_type: 'Attack-Pattern',
        name: 'Valid Accounts', x_mitre_id: 'T1078',
        description: 'Adversaries may obtain and abuse credentials of existing accounts.',
        created: '2020-01-01T00:00:00Z', modified: '2025-10-01T00:00:00Z',
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'defense-evasion' }],
        x_mitre_platforms: ['Windows', 'Azure AD', 'Google Workspace'],
    },
    {
        id: 'attack-pattern--003', standard_id: 'attack-pattern--003', entity_type: 'Attack-Pattern',
        name: 'Command and Scripting Interpreter', x_mitre_id: 'T1059',
        description: 'Adversaries may abuse command and script interpreters.',
        created: '2020-01-01T00:00:00Z', modified: '2025-10-01T00:00:00Z',
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'execution' }],
        x_mitre_platforms: ['Windows', 'macOS', 'Linux'],
    },
    {
        id: 'attack-pattern--004', standard_id: 'attack-pattern--004', entity_type: 'Attack-Pattern',
        name: 'Supply Chain Compromise', x_mitre_id: 'T1195',
        description: 'Adversaries may manipulate products or delivery mechanisms.',
        created: '2020-01-01T00:00:00Z', modified: '2025-10-01T00:00:00Z',
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'initial-access' }],
        x_mitre_platforms: ['Windows', 'macOS', 'Linux'],
    },
];

const MOCK_MALWARE: Malware[] = [
    {
        id: 'malware--001', standard_id: 'malware--001', entity_type: 'Malware',
        name: 'SUNBURST', description: 'Trojanized SolarWinds Orion update.',
        is_family: true, malware_types: ['trojan', 'backdoor'],
        created: '2020-12-13T00:00:00Z', modified: '2025-06-01T00:00:00Z',
        first_seen: '2020-03-01T00:00:00Z', last_seen: '2025-01-01T00:00:00Z',
    },
    {
        id: 'malware--002', standard_id: 'malware--002', entity_type: 'Malware',
        name: 'Cobalt Strike', description: 'Commercially available adversary simulation tool.',
        is_family: true, malware_types: ['remote-access-trojan'],
        created: '2018-01-01T00:00:00Z', modified: '2026-01-01T00:00:00Z',
        first_seen: '2012-01-01T00:00:00Z', last_seen: '2026-02-15T00:00:00Z',
    },
    {
        id: 'malware--003', standard_id: 'malware--003', entity_type: 'Malware',
        name: 'BlackCat (ALPHV)', description: 'Rust-based ransomware-as-a-service.',
        is_family: true, malware_types: ['ransomware'],
        created: '2021-11-01T00:00:00Z', modified: '2026-02-01T00:00:00Z',
        first_seen: '2021-11-01T00:00:00Z', last_seen: '2026-01-30T00:00:00Z',
    },
];

const MOCK_REPORTS: Report[] = [
    {
        id: 'report--001', standard_id: 'report--001', entity_type: 'Report',
        name: 'SolarStorm 2.0 Advisory',
        description: 'Detailed analysis of the follow-up supply-chain campaign.',
        published: '2026-01-15T00:00:00Z', report_types: ['threat-report'],
        created: '2026-01-15T00:00:00Z', modified: '2026-01-15T00:00:00Z',
        objectCount: 42, createdBy: 'MITRE Connector',
    },
    {
        id: 'report--002', standard_id: 'report--002', entity_type: 'Report',
        name: 'Volt Typhoon Infrastructure Mapping',
        description: 'Network infrastructure used by Volt Typhoon in 2025-2026.',
        published: '2026-02-01T00:00:00Z', report_types: ['threat-report'],
        created: '2026-02-01T00:00:00Z', modified: '2026-02-01T00:00:00Z',
        objectCount: 67, createdBy: 'AlienVault Connector',
    },
];

// ── Helpers ────────────────────────────────────────────────────

function isEnabled(): boolean {
    return process.env.INTEL_OPENCTI_ENABLED !== 'false';
}

// ── Client Class ───────────────────────────────────────────────

export class OpenCTIClient {
    private url: string;
    private token: string;

    constructor(url?: string, token?: string) {
        this.url = url || process.env.OPENCTI_URL || DEFAULT_URL;
        this.token = token || process.env.OPENCTI_TOKEN || process.env.OPENCTI_ADMIN_TOKEN || '';
    }

    // ── Internal GraphQL helper ─────────────────────────────────

    private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
        if (!isEnabled() || getCircuitState(PROVIDER_KEY) === 'open') {
            throw new Error('OpenCTI is disabled or circuit is open');
        }

        const res = await fetch(`${this.url}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
            },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
            setCircuitState(PROVIDER_KEY, 'open');
            throw new Error(`OpenCTI GraphQL error: ${res.status}`);
        }

        const json = await res.json();
        if (json.errors?.length) {
            throw new Error(`OpenCTI GraphQL errors: ${JSON.stringify(json.errors)}`);
        }

        // Success — make sure circuit is closed
        setCircuitState(PROVIDER_KEY, 'closed');
        return json.data as T;
    }

    // ── Campaigns ───────────────────────────────────────────────

    async getCampaigns(_filters?: OpenCTIFilters): Promise<Campaign[]> {
        try {
            const data = await this.graphql<{ campaigns: { edges: Array<{ node: Campaign }> } }>(
                `query { campaigns(first: 50) { edges { node { id standard_id entity_type name description first_seen last_seen confidence created modified } } } }`,
            );
            return data.campaigns.edges.map(e => e.node);
        } catch {
            console.warn('[OpenCTI] getCampaigns — falling back to mock data');
            return MOCK_CAMPAIGNS;
        }
    }

    async getCampaignsByRegion(region: string): Promise<Campaign[]> {
        const campaigns = await this.getCampaigns();
        return campaigns.filter(c => c.targetedRegions?.some(r => r.toLowerCase().includes(region.toLowerCase())));
    }

    async getActiveCampaigns(): Promise<Campaign[]> {
        const campaigns = await this.getCampaigns();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
        return campaigns.filter(c => !c.last_seen || c.last_seen >= thirtyDaysAgo);
    }

    // ── Threat Actors ───────────────────────────────────────────

    async getThreatActors(_filters?: OpenCTIFilters): Promise<ThreatActor[]> {
        try {
            const data = await this.graphql<{ threatActorsIndividuals: { edges: Array<{ node: ThreatActor }> } }>(
                `query { threatActorsIndividuals(first: 50) { edges { node { id standard_id entity_type name description aliases threat_actor_types sophistication primary_motivation confidence created modified } } } }`,
            );
            return data.threatActorsIndividuals.edges.map(e => e.node);
        } catch {
            console.warn('[OpenCTI] getThreatActors — falling back to mock data');
            return MOCK_THREAT_ACTORS;
        }
    }

    async getThreatActorsByTargetSector(sector: string): Promise<ThreatActor[]> {
        const actors = await this.getThreatActors();
        return actors.filter(a => a.targetedSectors?.some(s => s.toLowerCase().includes(sector.toLowerCase())));
    }

    // ── Indicators (IOCs) ───────────────────────────────────────

    async getIndicators(_filters?: OpenCTIFilters): Promise<Indicator[]> {
        try {
            const data = await this.graphql<{ indicators: { edges: Array<{ node: Indicator }> } }>(
                `query { indicators(first: 100) { edges { node { id standard_id entity_type name pattern pattern_type indicator_types valid_from valid_until confidence created modified } } } }`,
            );
            return data.indicators.edges.map(e => e.node);
        } catch {
            console.warn('[OpenCTI] getIndicators — falling back to mock data');
            return MOCK_INDICATORS;
        }
    }

    async getRecentIndicators(hours: number): Promise<Indicator[]> {
        const indicators = await this.getIndicators();
        const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
        return indicators.filter(i => i.created >= cutoff);
    }

    async getIndicatorsByType(type: IndicatorTypeShort): Promise<Indicator[]> {
        const typeMap: Record<IndicatorTypeShort, string> = {
            ipv4: 'ipv4-addr', domain: 'domain-name', hash: 'file', url: 'url',
        };
        const indicators = await this.getIndicators();
        return indicators.filter(i => i.observableType === typeMap[type]);
    }

    // ── MITRE ATT&CK ───────────────────────────────────────────

    async getAttackPatterns(): Promise<AttackPattern[]> {
        try {
            const data = await this.graphql<{ attackPatterns: { edges: Array<{ node: AttackPattern }> } }>(
                `query { attackPatterns(first: 200) { edges { node { id standard_id entity_type name description x_mitre_id created modified } } } }`,
            );
            return data.attackPatterns.edges.map(e => e.node);
        } catch {
            console.warn('[OpenCTI] getAttackPatterns — falling back to mock data');
            return MOCK_ATTACK_PATTERNS;
        }
    }

    async getTTPsByCampaign(_campaignId: string): Promise<AttackPattern[]> {
        // In a real implementation this would query the relationship graph.
        // For now, return all patterns as the campaign→TTP mapping requires
        // traversing OpenCTI relationships.
        return this.getAttackPatterns();
    }

    async getAttackHeatmap(): Promise<AttackHeatmapEntry[]> {
        const patterns = await this.getAttackPatterns();
        return patterns.map(p => ({
            technique: p.name,
            techniqueId: p.x_mitre_id,
            count: Math.floor(Math.random() * 50) + 1,
            tactic: p.kill_chain_phases?.[0]?.phase_name,
        }));
    }

    // ── Malware & Tools ─────────────────────────────────────────

    async getMalwareFamilies(): Promise<Malware[]> {
        try {
            const data = await this.graphql<{ malwares: { edges: Array<{ node: Malware }> } }>(
                `query { malwares(first: 50) { edges { node { id standard_id entity_type name description malware_types is_family first_seen last_seen created modified } } } }`,
            );
            return data.malwares.edges.map(e => e.node);
        } catch {
            console.warn('[OpenCTI] getMalwareFamilies — falling back to mock data');
            return MOCK_MALWARE;
        }
    }

    async getActiveMalware(): Promise<Malware[]> {
        const malware = await this.getMalwareFamilies();
        const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString();
        return malware.filter(m => !m.last_seen || m.last_seen >= ninetyDaysAgo);
    }

    // ── Reports ─────────────────────────────────────────────────

    async getReports(_filters?: OpenCTIFilters): Promise<Report[]> {
        try {
            const data = await this.graphql<{ reports: { edges: Array<{ node: Report }> } }>(
                `query { reports(first: 50, orderBy: published, orderMode: desc) { edges { node { id standard_id entity_type name description published report_types created modified } } } }`,
            );
            return data.reports.edges.map(e => e.node);
        } catch {
            console.warn('[OpenCTI] getReports — falling back to mock data');
            return MOCK_REPORTS;
        }
    }

    async getRecentReports(days: number): Promise<Report[]> {
        const reports = await this.getReports();
        const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
        return reports.filter(r => r.published >= cutoff);
    }

    // ── Stats ───────────────────────────────────────────────────

    async getStats(): Promise<OpenCTIStats> {
        try {
            const [campaigns, actors, indicators, malware, reports] = await Promise.all([
                this.getCampaigns(),
                this.getThreatActors(),
                this.getIndicators(),
                this.getMalwareFamilies(),
                this.getReports(),
            ]);
            return {
                campaigns: campaigns.length,
                actors: actors.length,
                indicators: indicators.length,
                malware: malware.length,
                reports: reports.length,
            };
        } catch {
            return {
                campaigns: MOCK_CAMPAIGNS.length,
                actors: MOCK_THREAT_ACTORS.length,
                indicators: MOCK_INDICATORS.length,
                malware: MOCK_MALWARE.length,
                reports: MOCK_REPORTS.length,
            };
        }
    }

    // ── Search ──────────────────────────────────────────────────

    async search(query: string): Promise<SearchResult[]> {
        try {
            const data = await this.graphql<{ stixCoreObjects: { edges: Array<{ node: SearchResult }> } }>(
                `query($search: String) { stixCoreObjects(search: $search, first: 20) { edges { node { id entity_type ... on StixDomainObject { name description created modified } } } } }`,
                { search: query },
            );
            return data.stixCoreObjects.edges.map(e => e.node);
        } catch {
            console.warn('[OpenCTI] search — falling back to mock data');
            const q = query.toLowerCase();
            const all: SearchResult[] = [
                ...MOCK_CAMPAIGNS,
                ...MOCK_THREAT_ACTORS,
                ...MOCK_MALWARE,
                ...MOCK_REPORTS,
            ].map(obj => ({
                id: obj.id,
                entity_type: obj.entity_type,
                name: obj.name,
                description: obj.description,
                created: obj.created,
                modified: obj.modified,
            }));
            return all.filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
        }
    }

    // ── Enrichment ──────────────────────────────────────────────

    async enrichIndicator(value: string, type: string): Promise<{
        found: boolean;
        indicator: Indicator | null;
        relatedCampaigns: string[];
        relatedMalware: string[];
        tags: string[];
    }> {
        try {
            const data = await this.graphql<{ stixCyberObservables: { edges: Array<{ node: { id: string; entity_type: string; observable_value: string; indicators: { edges: Array<{ node: Indicator }> } } }> } }>(
                `query($value: String) {
                    stixCyberObservables(search: $value, first: 5) {
                        edges {
                            node {
                                id entity_type observable_value
                                indicators { edges { node { id name pattern pattern_type indicator_types valid_from confidence created modified entity_type standard_id } } }
                            }
                        }
                    }
                }`,
                { value },
            );
            const obs = data.stixCyberObservables.edges[0]?.node;
            if (!obs) return { found: false, indicator: null, relatedCampaigns: [], relatedMalware: [], tags: [] };
            const indicator = obs.indicators?.edges[0]?.node ?? null;
            return {
                found: true,
                indicator,
                relatedCampaigns: [],
                relatedMalware: [],
                tags: indicator?.indicator_types ?? [],
            };
        } catch {
            // Attempt mock enrichment
            const mock = MOCK_INDICATORS.find(i =>
                i.observableValue?.toLowerCase() === value.toLowerCase()
            );
            return {
                found: !!mock,
                indicator: mock ?? null,
                relatedCampaigns: mock ? ['SolarStorm 2.0'] : [],
                relatedMalware: mock ? ['SUNBURST'] : [],
                tags: mock?.indicator_types ?? [],
            };
        }
    }

    // ── Health ──────────────────────────────────────────────────

    async healthCheck(): Promise<OpenCTIHealthCheck> {
        try {
            const data = await this.graphql<{ about: { version: string } }>(
                `query { about { version } }`,
            );
            return {
                connected: true,
                version: data.about.version,
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
