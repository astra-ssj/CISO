/**
 * Shodan Client — Attack surface intelligence via Shodan API.
 *
 * Follows existing Astra-CISO patterns:
 *   • Circuit-breaker state via src/lib/ai/circuit-breaker.ts
 *   • In-memory TTL cache
 *   • Rate-limited batch processing (1 req/sec for free tier)
 *
 * Base URL: https://api.shodan.io
 * Docs: https://developer.shodan.io/api
 */

import {
    setCircuitState,
    getCircuitState,
} from '@/lib/ai/circuit-breaker';
import type {
    ShodanHostResult,
    ShodanHostMinimal,
    ShodanSearchResult,
    ShodanDomainResult,
    ShodanCVEResult,
    ShodanAccountInfo,
    ShodanHealthCheck,
    AttackSurfaceReport,
    VendorScanResult,
    ShodanService,
} from '../types';

// ── Constants ──────────────────────────────────────────────────

const BASE_URL = 'https://api.shodan.io';
const PROVIDER_KEY = 'SHODAN';
const TIMEOUT_MS = 15_000;

// Dangerous services that should be flagged when internet-facing
const DANGEROUS_PORTS: Record<number, { service: string; reason: string; risk: 'CRITICAL' | 'HIGH' }> = {
    3389: { service: 'RDP', reason: 'Remote Desktop exposed to internet', risk: 'CRITICAL' },
    23: { service: 'Telnet', reason: 'Telnet exposed — unencrypted protocol', risk: 'CRITICAL' },
    21: { service: 'FTP', reason: 'FTP exposed — credentials sent in cleartext', risk: 'HIGH' },
    445: { service: 'SMB', reason: 'SMB exposed — ransomware attack vector', risk: 'CRITICAL' },
    1433: { service: 'MSSQL', reason: 'Database exposed to internet', risk: 'HIGH' },
    3306: { service: 'MySQL', reason: 'Database exposed to internet', risk: 'HIGH' },
    5432: { service: 'PostgreSQL', reason: 'Database exposed to internet', risk: 'HIGH' },
    27017: { service: 'MongoDB', reason: 'Database exposed — often misconfigured', risk: 'HIGH' },
    6379: { service: 'Redis', reason: 'Redis exposed — no auth by default', risk: 'CRITICAL' },
    9200: { service: 'Elasticsearch', reason: 'Elasticsearch exposed', risk: 'HIGH' },
};

// ── Client Class ───────────────────────────────────────────────

export class ShodanClient {
    private apiKey: string | undefined;
    private cache: Map<string, { data: unknown; expiry: number }> = new Map();

    constructor() {
        this.apiKey = process.env.SHODAN_API_KEY;
    }

    isConfigured(): boolean {
        return !!this.apiKey && process.env.SHODAN_ENABLED !== 'false';
    }

    // ══════════════════════════════════════════
    // HOST INTELLIGENCE
    // ══════════════════════════════════════════

    async lookupIP(ip: string): Promise<ShodanHostResult> {
        return this.fetchWithCache(`host:${ip}`, 3600, () =>
            this.get<Record<string, unknown>>(`/shodan/host/${ip}`).then((raw) =>
                this.mapHostResult(raw),
            ),
        );
    }

    async lookupIPMinimal(ip: string): Promise<ShodanHostMinimal> {
        return this.fetchWithCache(`host-min:${ip}`, 3600, () =>
            this.get<Record<string, unknown>>(`/shodan/host/${ip}`, { minify: 'true' }).then((raw) => ({
                ip: String(raw.ip_str ?? ip),
                hostnames: Array.isArray(raw.hostnames) ? raw.hostnames as string[] : [],
                org: String(raw.org ?? ''),
                country: String(raw.country_code ?? ''),
                ports: Array.isArray(raw.ports) ? raw.ports as number[] : [],
                vulns: Array.isArray(raw.vulns) ? raw.vulns as string[] : [],
                lastUpdate: String(raw.last_update ?? ''),
            })),
        );
    }

    // ══════════════════════════════════════════
    // SEARCH
    // ══════════════════════════════════════════

    async search(query: string, page: number = 1): Promise<ShodanSearchResult> {
        return this.fetchWithCache(`search:${query}:${page}`, 900, () =>
            this.get<Record<string, unknown>>('/shodan/host/search', { query, page: String(page) }).then((raw) => ({
                total: Number(raw.total ?? 0),
                matches: Array.isArray(raw.matches)
                    ? (raw.matches as Record<string, unknown>[]).map((m) => this.mapHostResult(m))
                    : [],
                facets: (raw.facets ?? {}) as Record<string, { value: string; count: number }[]>,
            })),
        );
    }

    async searchCount(query: string): Promise<number> {
        return this.fetchWithCache(`count:${query}`, 900, () =>
            this.get<{ total?: number }>('/shodan/host/count', { query }).then((r) => r.total ?? 0),
        );
    }

    // ══════════════════════════════════════════
    // DNS
    // ══════════════════════════════════════════

    async resolveDomains(domains: string[]): Promise<Record<string, string>> {
        const key = `dns-resolve:${domains.sort().join(',')}`;
        return this.fetchWithCache(key, 3600, () =>
            this.get<Record<string, string>>('/dns/resolve', { hostnames: domains.join(',') }),
        );
    }

    async reverseDNS(ips: string[]): Promise<Record<string, string[]>> {
        const key = `dns-reverse:${ips.sort().join(',')}`;
        return this.fetchWithCache(key, 3600, () =>
            this.get<Record<string, string[]>>('/dns/reverse', { ips: ips.join(',') }),
        );
    }

    async getDomainInfo(domain: string): Promise<ShodanDomainResult> {
        return this.fetchWithCache(`domain:${domain}`, 3600, () =>
            this.get<Record<string, unknown>>(`/dns/domain/${domain}`).then((raw) => ({
                domain,
                subdomains: Array.isArray(raw.subdomains) ? raw.subdomains as string[] : [],
                records: Array.isArray(raw.data)
                    ? (raw.data as Record<string, unknown>[]).map((r) => ({
                        type: String(r.type ?? ''),
                        value: String(r.value ?? ''),
                        subdomain: String(r.subdomain ?? ''),
                    }))
                    : [],
            })),
        );
    }

    // ══════════════════════════════════════════
    // VULNERABILITIES
    // ══════════════════════════════════════════

    async getCVEInfo(cve: string): Promise<ShodanCVEResult> {
        return this.fetchWithCache(`cve:${cve}`, 1800, async () => {
            const result = await this.search(`vuln:${cve}`);
            const countryCounts: Record<string, number> = {};
            const orgCounts: Record<string, number> = {};
            for (const host of result.matches) {
                countryCounts[host.country] = (countryCounts[host.country] ?? 0) + 1;
                orgCounts[host.org] = (orgCounts[host.org] ?? 0) + 1;
            }
            return {
                cve,
                affectedHosts: result.total,
                topCountries: Object.entries(countryCounts)
                    .map(([country, count]) => ({ country, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10),
                topOrgs: Object.entries(orgCounts)
                    .map(([org, count]) => ({ org, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10),
            };
        });
    }

    // ══════════════════════════════════════════
    // ATTACK SURFACE MONITORING
    // ══════════════════════════════════════════

    async scanOrgAssets(orgIPs: string[], orgDomains: string[]): Promise<AttackSurfaceReport> {
        // 1. Resolve all domains to IPs
        let resolvedIPs: Record<string, string> = {};
        if (orgDomains.length > 0) {
            resolvedIPs = await this.resolveDomains(orgDomains);
        }

        // 2. Deduplicate IPs
        const allIPs = new Set([
            ...orgIPs,
            ...Object.values(resolvedIPs).filter(Boolean),
        ]);

        // 3. Lookup each IP with rate limiting
        const ips = Array.from(allIPs);
        const hosts = await this.rateLimitedBatch(ips, (ip) => this.lookupIPMinimal(ip));

        // 4. Aggregate findings
        const allVulns: string[] = [];
        const exposedServices: AttackSurfaceReport['exposedServices'] = [];
        const sslIssues: AttackSurfaceReport['sslIssues'] = [];
        let totalServices = 0;

        for (const host of hosts) {
            allVulns.push(...host.vulns);
            totalServices += host.ports.length;

            // Check for dangerous exposed services
            for (const port of host.ports) {
                const danger = DANGEROUS_PORTS[port];
                if (danger) {
                    exposedServices.push({
                        service: danger.service,
                        port,
                        host: host.ip,
                        risk: danger.risk,
                        reason: danger.reason,
                    });
                }
            }
        }

        // Deduplicate vulns
        const uniqueVulns = [...new Set(allVulns)];

        const riskScore = this.computeRiskScore(uniqueVulns.length, exposedServices.length, sslIssues.length, hosts.length);

        return {
            scanDate: new Date().toISOString(),
            totalAssets: hosts.length,
            totalServices,
            totalVulnerabilities: uniqueVulns.length,
            criticalVulns: [],   // Would need CVSS data from full lookups
            highVulns: [],       // Would need CVSS data from full lookups
            exposedServices,
            sslIssues,
            geoMismatches: [],   // Would need expected country config
            assets: hosts,
            riskScore,
        };
    }

    // ══════════════════════════════════════════
    // VENDOR RISK SCANNING
    // ══════════════════════════════════════════

    async scanVendor(domain: string): Promise<VendorScanResult> {
        return this.fetchWithCache(`vendor:${domain}`, 7200, async () => {
            // 1. Get domain info
            const domainInfo = await this.getDomainInfo(domain);

            // 2. Resolve to IPs
            const domainsToResolve = [domain, ...domainInfo.subdomains.slice(0, 20).map((s) => `${s}.${domain}`)];
            const resolved = await this.resolveDomains(domainsToResolve);

            // 3. Lookup top 10 IPs (rate limited)
            const uniqueIPs = [...new Set(Object.values(resolved).filter(Boolean))].slice(0, 10);
            const hosts = await this.rateLimitedBatch(uniqueIPs, (ip) => this.lookupIPMinimal(ip));

            // 4. Build result
            const allVulns: { cve: string; cvss: number; host: string }[] = [];
            let totalExposed = 0;
            let sslIssueCount = 0;

            for (const host of hosts) {
                totalExposed += host.ports.length;
                for (const vuln of host.vulns) {
                    allVulns.push({ cve: vuln, cvss: 0, host: host.ip });
                }
                // Check for dangerous ports
                for (const port of host.ports) {
                    if (DANGEROUS_PORTS[port]) totalExposed++;
                }
            }

            const riskScore = this.computeRiskScore(allVulns.length, totalExposed, sslIssueCount, hosts.length);
            const riskLevel = riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';

            const topFindings = allVulns.slice(0, 5).map((v) => `${v.cve} on ${v.host}`);
            const summary = topFindings.length > 0
                ? `Found ${allVulns.length} vulnerabilities across ${hosts.length} hosts. Top findings: ${topFindings.join('; ')}`
                : `Scanned ${hosts.length} hosts with ${totalExposed} services. No critical vulnerabilities found.`;

            return {
                domain,
                subdomains: domainInfo.subdomains,
                totalHosts: hosts.length,
                exposedServices: totalExposed,
                vulnerabilities: allVulns,
                sslIssues: sslIssueCount,
                riskScore,
                riskLevel,
                scanDate: new Date().toISOString(),
                summary,
            };
        });
    }

    // ══════════════════════════════════════════
    // ACCOUNT & HEALTH
    // ══════════════════════════════════════════

    async getAccountInfo(): Promise<ShodanAccountInfo> {
        return this.fetchWithCache('account', 300, () =>
            this.get<Record<string, unknown>>('/api-info').then((raw) => ({
                plan: String(raw.plan ?? 'unknown'),
                queryCredits: Number(raw.query_credits ?? 0),
                scanCredits: Number(raw.scan_credits ?? 0),
                monitoredIPs: Number(raw.monitored_ips ?? 0),
                usage: {
                    queryCreditsUsed: Number(
                        typeof raw.usage_limits === 'object' && raw.usage_limits !== null
                            ? (raw.usage_limits as Record<string, unknown>).query_credits ?? 0
                            : 0,
                    ),
                },
            })),
        );
    }

    async healthCheck(): Promise<ShodanHealthCheck> {
        if (!this.isConfigured()) {
            return { connected: false, plan: '', credits: 0, error: 'Shodan API key not configured' };
        }
        try {
            const info = await this.getAccountInfo();
            return { connected: true, plan: info.plan, credits: info.queryCredits };
        } catch {
            return { connected: false, plan: '', credits: 0, error: 'Failed to connect to Shodan' };
        }
    }

    // ══════════════════════════════════════════
    // INTERNAL HELPERS
    // ══════════════════════════════════════════

    private async get<T>(path: string, params?: Record<string, string>): Promise<T> {
        if (!this.isConfigured() || getCircuitState(PROVIDER_KEY) === 'open') {
            throw new Error('Shodan is disabled or circuit is open');
        }

        const url = new URL(`${BASE_URL}${path}`);
        url.searchParams.set('key', this.apiKey!);
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                url.searchParams.set(k, v);
            }
        }

        const res = await fetch(url.toString(), {
            method: 'GET',
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (res.status === 401) {
            setCircuitState(PROVIDER_KEY, 'open');
            throw new Error('Invalid Shodan API key');
        }

        if (res.status === 429) {
            // Rate limited — return cached data if available
            const cacheKey = `${path}:${JSON.stringify(params ?? {})}`;
            const cached = this.cache.get(cacheKey);
            if (cached) return cached.data as T;
            throw new Error('Shodan rate limited');
        }

        if (!res.ok) {
            setCircuitState(PROVIDER_KEY, 'open');
            throw new Error(`Shodan API error: ${res.status}`);
        }

        setCircuitState(PROVIDER_KEY, 'closed');
        return (await res.json()) as T;
    }

    private async fetchWithCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
        const cached = this.cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data as T;
        }

        const data = await fetcher();
        this.cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
        return data;
    }

    private async rateLimitedBatch<T>(items: string[], fetcher: (item: string) => Promise<T>, delayMs: number = 1000): Promise<T[]> {
        const results: T[] = [];
        for (let i = 0; i < items.length; i++) {
            try {
                results.push(await fetcher(items[i]));
            } catch (err) {
                console.warn(`[Shodan] Batch item ${items[i]} failed:`, err);
            }
            // Add delay between calls (skip after last item)
            if (i < items.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
        return results;
    }

    private mapHostResult(raw: Record<string, unknown>): ShodanHostResult {
        const services: ShodanService[] = [];
        if (Array.isArray(raw.data)) {
            for (const svc of raw.data as Record<string, unknown>[]) {
                const sslRaw = svc.ssl as Record<string, unknown> | undefined;
                services.push({
                    port: Number(svc.port ?? 0),
                    transport: String(svc.transport ?? 'tcp') as 'tcp' | 'udp',
                    product: svc.product ? String(svc.product) : null,
                    version: svc.version ? String(svc.version) : null,
                    banner: String(svc.data ?? ''),
                    ...(sslRaw ? {
                        ssl: {
                            cert: {
                                subject: { CN: String((sslRaw.cert as Record<string, unknown>)?.subject?.toString() ?? '') },
                                issuer: { O: String((sslRaw.cert as Record<string, unknown>)?.issuer?.toString() ?? '') },
                                expires: String((sslRaw.cert as Record<string, unknown>)?.expires ?? ''),
                                expired: Boolean((sslRaw.cert as Record<string, unknown>)?.expired),
                            },
                            versions: Array.isArray(sslRaw.versions) ? sslRaw.versions as string[] : [],
                            cipher: {
                                name: String((sslRaw.cipher as Record<string, unknown>)?.name ?? ''),
                                version: String((sslRaw.cipher as Record<string, unknown>)?.version ?? ''),
                            },
                        },
                    } : {}),
                    ...(svc.vulns ? {
                        vulns: svc.vulns as Record<string, { cvss: number; summary: string; references: string[] }>,
                    } : {}),
                });
            }
        }

        return {
            ip: String(raw.ip_str ?? ''),
            hostnames: Array.isArray(raw.hostnames) ? raw.hostnames as string[] : [],
            org: String(raw.org ?? ''),
            isp: String(raw.isp ?? ''),
            asn: String(raw.asn ?? ''),
            os: raw.os ? String(raw.os) : null,
            country: String(raw.country_code ?? ''),
            city: raw.city ? String(raw.city) : null,
            latitude: Number(raw.latitude ?? 0),
            longitude: Number(raw.longitude ?? 0),
            ports: Array.isArray(raw.ports) ? raw.ports as number[] : [],
            vulns: Array.isArray(raw.vulns) ? raw.vulns as string[] : [],
            lastUpdate: String(raw.last_update ?? ''),
            services,
        };
    }

    private computeRiskScore(vulnCount: number, exposedCount: number, sslIssueCount: number, assetCount: number): number {
        if (assetCount === 0) return 0;
        // Weighted formula: vulns carry most weight
        const vulnScore = Math.min(vulnCount * 8, 50);
        const exposedScore = Math.min(exposedCount * 10, 35);
        const sslScore = Math.min(sslIssueCount * 5, 15);
        return Math.min(vulnScore + exposedScore + sslScore, 100);
    }
}

export const shodanClient = new ShodanClient();
