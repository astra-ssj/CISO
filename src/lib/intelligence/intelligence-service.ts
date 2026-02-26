/**
 * Unified Intelligence Service — single entry point for all threat intel providers.
 *
 * Aggregates data from OpenCTI, AlienVault OTX, and Abuse.ch.
 * Uses Promise.allSettled everywhere — a failed provider never breaks the others.
 *
 * Usage:
 *   import { intelligenceService } from '@/lib/intelligence/intelligence-service';
 *   const dashboard = await intelligenceService.getDashboard();
 */

import { OpenCTIClient } from './clients/opencti-client';
import { OTXClient } from './clients/otx-client';
import { AbuseCHClient } from './clients/abusech-client';
import { cacheGet, cacheSet } from './cache';
import type {
    UnifiedIOC,
    IOCType,
    IOCSeverity,
    EnrichmentResult,
    EnrichmentSourceResult,
    EnrichmentVerdict,
    IntelDashboard,
    IntelThreatSummary,
    IntelProviderStatus,
    IntelHealth,
    ThreatIntelProvider,
} from './types';

// ── Cache TTLs (seconds) ───────────────────────────────────────

const DASHBOARD_TTL = 300;   // 5 min
const IOCS_TTL = 300;        // 5 min
const ENRICHMENT_TTL = 900;  // 15 min

// ── Helpers ────────────────────────────────────────────────────

function mapConfidenceToSeverity(confidence: number): IOCSeverity {
    if (confidence >= 90) return 'CRITICAL';
    if (confidence >= 70) return 'HIGH';
    if (confidence >= 50) return 'MEDIUM';
    if (confidence >= 30) return 'LOW';
    return 'INFO';
}

function fulfilled<T>(r: PromiseSettledResult<T>): r is PromiseFulfilledResult<T> {
    return r.status === 'fulfilled';
}

// ── Service Class ──────────────────────────────────────────────

class IntelligenceService {
    private opencti: OpenCTIClient;
    private otx: OTXClient;
    private abusech: AbuseCHClient;

    constructor() {
        this.opencti = new OpenCTIClient();
        this.otx = new OTXClient();
        this.abusech = new AbuseCHClient();
    }

    // ── Dashboard ───────────────────────────────────────────────

    async getDashboard(): Promise<IntelDashboard> {
        const cacheKey = 'intel:dashboard';
        const cached = cacheGet<IntelDashboard>(cacheKey, DASHBOARD_TTL);
        if (cached.hit && !cached.stale) return cached.data;

        const [
            openctiStatsR,
            openctiCampaignsR,
            openctiActorsR,
            openctiReportsR,
            otxPulsesR,
            abusechStatsR,
            openctiHealthR,
            otxHealthR,
            abusechHealthR,
        ] = await Promise.allSettled([
            this.opencti.getStats(),
            this.opencti.getActiveCampaigns(),
            this.opencti.getThreatActors(),
            this.opencti.getRecentReports(30),
            this.otx.getSubscribedPulses(5),
            this.abusech.getStats(),
            this.opencti.healthCheck(),
            this.otx.healthCheck(),
            this.abusech.healthCheck(),
        ]);

        // Aggregate IOC counts
        const openctiIOCs = fulfilled(openctiStatsR) ? openctiStatsR.value.indicators : 0;
        const abusechIOCs = fulfilled(abusechStatsR) ? (abusechStatsR.value.urls + abusechStatsR.value.iocs) : 0;
        const otxIOCs = fulfilled(otxPulsesR)
            ? otxPulsesR.value.reduce((s, p) => s + p.indicator_count, 0)
            : 0;

        // Build top threats
        const topThreats: IntelThreatSummary[] = [];

        if (fulfilled(openctiCampaignsR)) {
            for (const c of openctiCampaignsR.value.slice(0, 3)) {
                topThreats.push({
                    title: c.name,
                    severity: mapConfidenceToSeverity(c.confidence ?? 50),
                    source: 'OpenCTI',
                    time: c.modified || c.created,
                });
            }
        }

        if (fulfilled(otxPulsesR)) {
            for (const p of otxPulsesR.value.slice(0, 2)) {
                topThreats.push({
                    title: p.name,
                    severity: p.tlp === 'red' ? 'CRITICAL' : p.tlp === 'amber' ? 'HIGH' : 'MEDIUM',
                    source: 'AlienVault OTX',
                    time: p.modified || p.created,
                });
            }
        }

        // Provider statuses
        const providers: IntelProviderStatus[] = [
            {
                name: 'OpenCTI',
                connected: fulfilled(openctiHealthR) ? openctiHealthR.value.connected : false,
                lastSync: fulfilled(openctiHealthR) ? openctiHealthR.value.lastSync.toISOString() : null,
            },
            {
                name: 'AlienVault OTX',
                connected: fulfilled(otxHealthR) ? otxHealthR.value.connected : false,
                lastSync: fulfilled(otxHealthR) && otxHealthR.value.connected ? new Date().toISOString() : null,
            },
            {
                name: 'Abuse.ch URLhaus',
                connected: fulfilled(abusechHealthR) ? abusechHealthR.value.urlhaus : false,
                lastSync: fulfilled(abusechHealthR) && abusechHealthR.value.urlhaus ? new Date().toISOString() : null,
            },
            {
                name: 'Abuse.ch ThreatFox',
                connected: fulfilled(abusechHealthR) ? abusechHealthR.value.threatfox : false,
                lastSync: fulfilled(abusechHealthR) && abusechHealthR.value.threatfox ? new Date().toISOString() : null,
            },
            {
                name: 'Abuse.ch MalwareBazaar',
                connected: fulfilled(abusechHealthR) ? abusechHealthR.value.malwarebazaar : false,
                lastSync: fulfilled(abusechHealthR) && abusechHealthR.value.malwarebazaar ? new Date().toISOString() : null,
            },
        ];

        const activeProviders = providers.filter(p => p.connected).length;

        const dashboard: IntelDashboard = {
            activeCampaigns: fulfilled(openctiCampaignsR) ? openctiCampaignsR.value.length : 0,
            threatActors: fulfilled(openctiActorsR) ? openctiActorsR.value.length : 0,
            totalIOCs: openctiIOCs + abusechIOCs + otxIOCs,
            recentReports: fulfilled(openctiReportsR) ? openctiReportsR.value.length : 0,
            topThreats: topThreats.sort((a, b) => {
                const sevOrder: Record<IOCSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
                return sevOrder[a.severity as IOCSeverity] - sevOrder[b.severity as IOCSeverity];
            }),
            feedHealth: {
                total: providers.length,
                active: activeProviders,
                stale: providers.length - activeProviders,
            },
            providers,
        };

        cacheSet(cacheKey, dashboard);
        return dashboard;
    }

    // ── Enrich IOC ──────────────────────────────────────────────

    async enrichIOC(value: string, type: string): Promise<EnrichmentResult> {
        const cacheKey = `intel:enrich:${type}:${value}`;
        const cached = cacheGet<EnrichmentResult>(cacheKey, ENRICHMENT_TTL);
        if (cached.hit && !cached.stale) return cached.data;

        // Fire all enrichment calls in parallel
        const [openctiR, otxR, abusechR] = await Promise.allSettled([
            this.opencti.enrichIndicator(value, type),
            this.enrichOTX(value, type),
            this.enrichAbuseCH(value, type),
        ]);

        const sources: EnrichmentSourceResult[] = [];
        const campaigns: string[] = [];
        const malwareFamilies: string[] = [];
        const tags: string[] = [];
        let maxConfidence = 0;

        // Process OpenCTI result
        if (fulfilled(openctiR)) {
            const r = openctiR.value;
            sources.push({ name: 'OPENCTI' as ThreatIntelProvider, found: r.found, data: r as unknown as Record<string, unknown> });
            if (r.found) {
                campaigns.push(...r.relatedCampaigns);
                malwareFamilies.push(...r.relatedMalware);
                tags.push(...r.tags);
                maxConfidence = Math.max(maxConfidence, r.indicator?.confidence ?? 0);
            }
        }

        // Process OTX result
        if (fulfilled(otxR)) {
            const r = otxR.value;
            sources.push({ name: 'OTX' as ThreatIntelProvider, found: r.found, data: r.data });
            if (r.found) {
                malwareFamilies.push(...r.malwareFamilies);
                tags.push(...r.tags);
                maxConfidence = Math.max(maxConfidence, r.confidence);
            }
        }

        // Process Abuse.ch result
        if (fulfilled(abusechR) && abusechR.value) {
            const r = abusechR.value;
            sources.push({ name: r.source as ThreatIntelProvider, found: r.found, data: r.data });
            if (r.found) {
                malwareFamilies.push(...r.malwareFamilies);
                tags.push(...r.tags);
                maxConfidence = Math.max(maxConfidence, r.confidence);
            }
        }

        // Determine verdict
        const foundCount = sources.filter(s => s.found).length;
        let verdict: EnrichmentVerdict = 'UNKNOWN';
        if (foundCount >= 2) verdict = 'MALICIOUS';
        else if (foundCount === 1 && maxConfidence >= 70) verdict = 'MALICIOUS';
        else if (foundCount === 1) verdict = 'SUSPICIOUS';

        const uniqueTags = [...new Set(tags)];
        const uniqueMalware = [...new Set(malwareFamilies)];
        const uniqueCampaigns = [...new Set(campaigns)];

        const result: EnrichmentResult = {
            value,
            type,
            verdict,
            confidence: maxConfidence,
            sources,
            campaigns: uniqueCampaigns,
            malwareFamilies: uniqueMalware,
            tags: uniqueTags,
            context: this.buildContext(value, type, verdict, uniqueMalware, uniqueCampaigns, sources),
        };

        cacheSet(cacheKey, result);
        return result;
    }

    private async enrichOTX(value: string, type: string): Promise<{ found: boolean; data: Record<string, unknown>; malwareFamilies: string[]; tags: string[]; confidence: number }> {
        try {
            let report: Record<string, unknown>;
            if (type === 'ipv4' || type === 'ip') {
                report = await this.otx.enrichIP(value) as unknown as Record<string, unknown>;
            } else if (type === 'domain') {
                report = await this.otx.enrichDomain(value) as unknown as Record<string, unknown>;
            } else if (type === 'hash' || type === 'hash-md5' || type === 'hash-sha1' || type === 'hash-sha256') {
                report = await this.otx.enrichHash(value) as unknown as Record<string, unknown>;
            } else if (type === 'url') {
                report = await this.otx.enrichURL(value) as unknown as Record<string, unknown>;
            } else {
                return { found: false, data: {}, malwareFamilies: [], tags: [], confidence: 0 };
            }

            const pulseInfo = report.pulse_info as { count: number; pulses: Array<{ tags: string[]; malware_families: string[] }> } | undefined;
            const found = (pulseInfo?.count ?? 0) > 0;
            const malwareFamilies = pulseInfo?.pulses?.flatMap(p => p.malware_families || []) ?? [];
            const tags = pulseInfo?.pulses?.flatMap(p => p.tags || []) ?? [];

            return {
                found,
                data: report,
                malwareFamilies: [...new Set(malwareFamilies)],
                tags: [...new Set(tags)].slice(0, 10),
                confidence: found ? Math.min(90, (pulseInfo?.count ?? 0) * 15) : 0,
            };
        } catch {
            return { found: false, data: {}, malwareFamilies: [], tags: [], confidence: 0 };
        }
    }

    private async enrichAbuseCH(value: string, type: string): Promise<{ found: boolean; source: string; data: Record<string, unknown>; malwareFamilies: string[]; tags: string[]; confidence: number } | null> {
        try {
            if (type === 'url') {
                const result = await this.abusech.lookupURL(value);
                const found = result.query_status === 'ok';
                return {
                    found,
                    source: 'ABUSECH_URLHAUS',
                    data: result as unknown as Record<string, unknown>,
                    malwareFamilies: [],
                    tags: result.tags ?? [],
                    confidence: found ? 80 : 0,
                };
            }

            if (type === 'hash' || type === 'hash-md5' || type === 'hash-sha1' || type === 'hash-sha256') {
                const result = await this.abusech.lookupHash(value);
                const found = result.query_status === 'ok' && (result.data?.length ?? 0) > 0;
                const sample = result.data?.[0];
                return {
                    found,
                    source: 'ABUSECH_MALWAREBAZAAR',
                    data: result as unknown as Record<string, unknown>,
                    malwareFamilies: sample?.signature ? [sample.signature] : [],
                    tags: sample?.tags ?? [],
                    confidence: found ? 85 : 0,
                };
            }

            // For IPs and domains, check ThreatFox
            if (type === 'ipv4' || type === 'ip' || type === 'domain') {
                const results = await this.abusech.searchIOC(value);
                const found = results.length > 0;
                return {
                    found,
                    source: 'ABUSECH_THREATFOX',
                    data: { results } as unknown as Record<string, unknown>,
                    malwareFamilies: [...new Set(results.map(r => r.malware_printable))],
                    tags: [...new Set(results.flatMap(r => r.tags))],
                    confidence: found ? Math.min(95, results[0]?.confidence_level ?? 0) : 0,
                };
            }

            return null;
        } catch {
            return null;
        }
    }

    // ── Get All IOCs ────────────────────────────────────────────

    async getIOCs(hours: number = 24, limit: number = 100): Promise<UnifiedIOC[]> {
        const cacheKey = `intel:iocs:${hours}:${limit}`;
        const cached = cacheGet<UnifiedIOC[]>(cacheKey, IOCS_TTL);
        if (cached.hit && !cached.stale) return cached.data;

        const [openctiR, threatfoxR, urlhausR] = await Promise.allSettled([
            this.opencti.getRecentIndicators(hours),
            this.abusech.getRecentIOCs(Math.max(1, Math.ceil(hours / 24))),
            this.abusech.getRecentMaliciousURLs(limit),
        ]);

        const iocs: UnifiedIOC[] = [];
        const seen = new Set<string>();

        // Process OpenCTI indicators
        if (fulfilled(openctiR)) {
            for (const ind of openctiR.value) {
                const value = ind.observableValue ?? ind.pattern;
                if (seen.has(value)) continue;
                seen.add(value);
                iocs.push({
                    value,
                    type: this.mapOpenCTIType(ind.observableType),
                    severity: mapConfidenceToSeverity(ind.confidence ?? 50),
                    sources: ['OPENCTI'],
                    firstSeen: ind.valid_from || ind.created,
                    lastSeen: ind.modified,
                    campaigns: [],
                    malwareFamilies: [],
                    tags: ind.indicator_types ?? [],
                    confidence: ind.confidence ?? 50,
                    context: `OpenCTI: ${ind.name}`,
                });
            }
        }

        // Process ThreatFox IOCs
        if (fulfilled(threatfoxR)) {
            for (const tf of threatfoxR.value) {
                if (seen.has(tf.ioc)) continue;
                seen.add(tf.ioc);
                iocs.push({
                    value: tf.ioc,
                    type: this.mapThreatFoxType(tf.ioc_type),
                    severity: mapConfidenceToSeverity(tf.confidence_level),
                    sources: ['ABUSECH_THREATFOX'],
                    firstSeen: tf.first_seen,
                    lastSeen: tf.last_seen || tf.first_seen,
                    campaigns: [],
                    malwareFamilies: [tf.malware_printable],
                    tags: tf.tags,
                    confidence: tf.confidence_level,
                    context: `ThreatFox: ${tf.threat_type_desc} — ${tf.malware_printable}`,
                });
            }
        }

        // Process URLhaus URLs
        if (fulfilled(urlhausR)) {
            for (const u of urlhausR.value) {
                if (seen.has(u.url)) continue;
                seen.add(u.url);
                iocs.push({
                    value: u.url,
                    type: 'url',
                    severity: u.url_status === 'online' ? 'HIGH' : 'MEDIUM',
                    sources: ['ABUSECH_URLHAUS'],
                    firstSeen: u.date_added,
                    lastSeen: u.date_added,
                    campaigns: [],
                    malwareFamilies: [],
                    tags: u.tags,
                    confidence: u.url_status === 'online' ? 80 : 50,
                    context: `URLhaus: ${u.threat} — ${u.host}`,
                });
            }
        }

        // Sort by confidence desc, then severity
        const sevOrder: Record<IOCSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
        iocs.sort((a, b) => {
            const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
            if (sevDiff !== 0) return sevDiff;
            return b.confidence - a.confidence;
        });

        const result = iocs.slice(0, limit);
        cacheSet(cacheKey, result);
        return result;
    }

    // ── Health ──────────────────────────────────────────────────

    async getHealth(): Promise<IntelHealth> {
        const [openctiR, otxR, abusechR] = await Promise.allSettled([
            this.opencti.healthCheck(),
            this.otx.healthCheck(),
            this.abusech.healthCheck(),
        ]);

        const now = new Date().toISOString();
        const providers: IntelHealth['providers'] = [];

        if (fulfilled(openctiR)) {
            providers.push({
                name: 'OpenCTI',
                status: openctiR.value.connected ? 'up' : 'down',
                lastCheck: now,
                details: `v${openctiR.value.version}`,
            });
        } else {
            providers.push({ name: 'OpenCTI', status: 'down', lastCheck: now, details: 'Unreachable' });
        }

        if (fulfilled(otxR)) {
            providers.push({
                name: 'AlienVault OTX',
                status: otxR.value.connected ? 'up' : 'down',
                lastCheck: now,
            });
        } else {
            providers.push({ name: 'AlienVault OTX', status: 'down', lastCheck: now });
        }

        if (fulfilled(abusechR)) {
            const ac = abusechR.value;
            const feeds = [
                { name: 'URLhaus', up: ac.urlhaus },
                { name: 'ThreatFox', up: ac.threatfox },
                { name: 'MalwareBazaar', up: ac.malwarebazaar },
            ];
            for (const f of feeds) {
                providers.push({
                    name: `Abuse.ch ${f.name}`,
                    status: f.up ? 'up' : 'down',
                    lastCheck: now,
                });
            }
        } else {
            for (const n of ['URLhaus', 'ThreatFox', 'MalwareBazaar']) {
                providers.push({ name: `Abuse.ch ${n}`, status: 'down', lastCheck: now });
            }
        }

        const upCount = providers.filter(p => p.status === 'up').length;
        const overall: IntelHealth['overall'] = upCount === providers.length ? 'healthy' : upCount > 0 ? 'degraded' : 'down';

        return { overall, providers };
    }

    // ── Private Helpers ─────────────────────────────────────────

    private mapOpenCTIType(obsType?: string): IOCType {
        const map: Record<string, IOCType> = {
            'ipv4-addr': 'ipv4', 'ipv6-addr': 'ipv6',
            'domain-name': 'domain', 'url': 'url',
            'file': 'hash-sha256', 'email-addr': 'email',
        };
        return map[obsType ?? ''] ?? 'domain';
    }

    private mapThreatFoxType(iocType: string): IOCType {
        if (iocType.startsWith('ip')) return 'ipv4';
        if (iocType === 'domain') return 'domain';
        if (iocType === 'url') return 'url';
        if (iocType.includes('md5')) return 'hash-md5';
        if (iocType.includes('sha256')) return 'hash-sha256';
        if (iocType.includes('sha1')) return 'hash-sha1';
        return 'domain';
    }

    private buildContext(
        value: string,
        type: string,
        verdict: EnrichmentVerdict,
        malware: string[],
        campaigns: string[],
        sources: EnrichmentSourceResult[],
    ): string {
        const parts: string[] = [`${type.toUpperCase()} indicator "${value}" assessed as ${verdict}.`];
        const foundSources = sources.filter(s => s.found).map(s => s.name);
        if (foundSources.length > 0) parts.push(`Found in: ${foundSources.join(', ')}.`);
        if (malware.length > 0) parts.push(`Associated malware: ${malware.join(', ')}.`);
        if (campaigns.length > 0) parts.push(`Related campaigns: ${campaigns.join(', ')}.`);
        return parts.join(' ');
    }
}

// ── Singleton Export ────────────────────────────────────────────

export const intelligenceService = new IntelligenceService();
