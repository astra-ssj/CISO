/**
 * OpenCTI Client — GraphQL API with circuit-breaker.
 *
 * Astra v3: live fetch, last Observation, or empty. Never silent mock intel.
 */

import {
    setCircuitState,
    getCircuitState,
} from '@/lib/ai/circuit-breaker';
import { liveOrEmpty } from '@/lib/observations/record';
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

const PROVIDER_KEY = 'OPENCTI';
const DEFAULT_URL = 'https://demo.opencti.io';

function isEnabled(): boolean {
    return process.env.INTEL_OPENCTI_ENABLED !== 'false';
}

export class OpenCTIClient {
    private url: string;
    private token: string;

    constructor(url?: string, token?: string) {
        this.url = url || process.env.OPENCTI_URL || DEFAULT_URL;
        this.token = token || process.env.OPENCTI_TOKEN || process.env.OPENCTI_ADMIN_TOKEN || '';
    }

    private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
        if (!isEnabled() || getCircuitState(PROVIDER_KEY) === 'open') {
            throw new Error('OpenCTI is disabled or circuit is open');
        }
        if (!this.token) {
            throw new Error('OpenCTI token missing');
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

        const json = await res.json() as { errors?: unknown[]; data: T };
        if (json.errors?.length) {
            throw new Error(`OpenCTI GraphQL errors: ${JSON.stringify(json.errors)}`);
        }

        setCircuitState(PROVIDER_KEY, 'closed');
        return json.data;
    }

    private envelope<T>(operation: string, requestKey: string, fetchFn: () => Promise<T>, empty: T): Promise<T> {
        return liveOrEmpty(
            { integrationId: 'opencti', operation, requestKey, ttlMs: 60 * 60 * 1000 },
            fetchFn,
            empty,
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getCampaigns(_filters?: OpenCTIFilters): Promise<Campaign[]> {
        return this.envelope('getCampaigns', 'first:50', async () => {
            const data = await this.graphql<{ campaigns: { edges: Array<{ node: Campaign }> } }>(
                `query { campaigns(first: 50) { edges { node { id standard_id entity_type name description first_seen last_seen confidence created modified } } } }`,
            );
            return data.campaigns.edges.map((e) => e.node);
        }, []);
    }

    async getCampaignsByRegion(region: string): Promise<Campaign[]> {
        const campaigns = await this.getCampaigns();
        return campaigns.filter((c) => c.targetedRegions?.some((r) => r.toLowerCase().includes(region.toLowerCase())));
    }

    async getActiveCampaigns(): Promise<Campaign[]> {
        const campaigns = await this.getCampaigns();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
        return campaigns.filter((c) => !c.last_seen || c.last_seen >= thirtyDaysAgo);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getThreatActors(_filters?: OpenCTIFilters): Promise<ThreatActor[]> {
        return this.envelope('getThreatActors', 'first:50', async () => {
            const data = await this.graphql<{ threatActorsIndividuals: { edges: Array<{ node: ThreatActor }> } }>(
                `query { threatActorsIndividuals(first: 50) { edges { node { id standard_id entity_type name description aliases threat_actor_types sophistication primary_motivation confidence created modified } } } }`,
            );
            return data.threatActorsIndividuals.edges.map((e) => e.node);
        }, []);
    }

    async getThreatActorsByTargetSector(sector: string): Promise<ThreatActor[]> {
        const actors = await this.getThreatActors();
        return actors.filter((a) => a.targetedSectors?.some((s) => s.toLowerCase().includes(sector.toLowerCase())));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getIndicators(_filters?: OpenCTIFilters): Promise<Indicator[]> {
        return this.envelope('getIndicators', 'first:100', async () => {
            const data = await this.graphql<{ indicators: { edges: Array<{ node: Indicator }> } }>(
                `query { indicators(first: 100) { edges { node { id standard_id entity_type name pattern pattern_type indicator_types valid_from valid_until confidence created modified } } } }`,
            );
            return data.indicators.edges.map((e) => e.node);
        }, []);
    }

    async getRecentIndicators(hours: number): Promise<Indicator[]> {
        const indicators = await this.getIndicators();
        const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
        return indicators.filter((i) => i.created >= cutoff);
    }

    async getIndicatorsByType(type: IndicatorTypeShort): Promise<Indicator[]> {
        const typeMap: Record<IndicatorTypeShort, string> = {
            ipv4: 'ipv4-addr', domain: 'domain-name', hash: 'file', url: 'url',
        };
        const indicators = await this.getIndicators();
        return indicators.filter((i) => i.observableType === typeMap[type]);
    }

    async getAttackPatterns(): Promise<AttackPattern[]> {
        return this.envelope('getAttackPatterns', 'first:200', async () => {
            const data = await this.graphql<{ attackPatterns: { edges: Array<{ node: AttackPattern }> } }>(
                `query { attackPatterns(first: 200) { edges { node { id standard_id entity_type name description x_mitre_id created modified } } } }`,
            );
            return data.attackPatterns.edges.map((e) => e.node);
        }, []);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getTTPsByCampaign(_campaignId: string): Promise<AttackPattern[]> {
        return this.getAttackPatterns();
    }

    async getAttackHeatmap(): Promise<AttackHeatmapEntry[]> {
        const patterns = await this.getAttackPatterns();
        return patterns.map((p) => ({
            technique: p.name,
            techniqueId: p.x_mitre_id,
            count: 0,
            tactic: p.kill_chain_phases?.[0]?.phase_name,
        }));
    }

    async getMalwareFamilies(): Promise<Malware[]> {
        return this.envelope('getMalwareFamilies', 'first:50', async () => {
            const data = await this.graphql<{ malwares: { edges: Array<{ node: Malware }> } }>(
                `query { malwares(first: 50) { edges { node { id standard_id entity_type name description malware_types is_family first_seen last_seen created modified } } } }`,
            );
            return data.malwares.edges.map((e) => e.node);
        }, []);
    }

    async getActiveMalware(): Promise<Malware[]> {
        const malware = await this.getMalwareFamilies();
        const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString();
        return malware.filter((m) => !m.last_seen || m.last_seen >= ninetyDaysAgo);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getReports(_filters?: OpenCTIFilters): Promise<Report[]> {
        return this.envelope('getReports', 'first:50', async () => {
            const data = await this.graphql<{ reports: { edges: Array<{ node: Report }> } }>(
                `query { reports(first: 50, orderBy: published, orderMode: desc) { edges { node { id standard_id entity_type name description published report_types created modified } } } }`,
            );
            return data.reports.edges.map((e) => e.node);
        }, []);
    }

    async getRecentReports(days: number): Promise<Report[]> {
        const reports = await this.getReports();
        const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
        return reports.filter((r) => r.published >= cutoff);
    }

    async getStats(): Promise<OpenCTIStats> {
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
    }

    async search(query: string): Promise<SearchResult[]> {
        return this.envelope('search', query.toLowerCase().slice(0, 200), async () => {
            const data = await this.graphql<{ stixCoreObjects: { edges: Array<{ node: SearchResult }> } }>(
                `query($search: String) { stixCoreObjects(search: $search, first: 20) { edges { node { id entity_type ... on StixDomainObject { name description created modified } } } } }`,
                { search: query },
            );
            return data.stixCoreObjects.edges.map((e) => e.node);
        }, []);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async enrichIndicator(value: string, type: string): Promise<{
        found: boolean;
        indicator: Indicator | null;
        relatedCampaigns: string[];
        relatedMalware: string[];
        tags: string[];
    }> {
        const empty = { found: false, indicator: null, relatedCampaigns: [], relatedMalware: [], tags: [] };
        return this.envelope('enrichIndicator', value.toLowerCase(), async () => {
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
            if (!obs) return empty;
            const indicator = obs.indicators?.edges[0]?.node ?? null;
            return {
                found: true,
                indicator,
                relatedCampaigns: [],
                relatedMalware: [],
                tags: indicator?.indicator_types ?? [],
            };
        }, empty);
    }

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
