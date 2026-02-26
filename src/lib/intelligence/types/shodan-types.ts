/**
 * Shodan API Types — Attack Surface Intelligence
 */

export interface ShodanService {
    port: number;
    transport: 'tcp' | 'udp';
    product: string | null;
    version: string | null;
    banner: string;
    ssl?: {
        cert: {
            subject: { CN: string };
            issuer: { O: string };
            expires: string;
            expired: boolean;
        };
        versions: string[];
        cipher: { name: string; version: string };
    };
    vulns?: Record<string, {
        cvss: number;
        summary: string;
        references: string[];
    }>;
}

export interface ShodanHostResult {
    ip: string;
    hostnames: string[];
    org: string;
    isp: string;
    asn: string;
    os: string | null;
    country: string;
    city: string | null;
    latitude: number;
    longitude: number;
    ports: number[];
    vulns: string[];
    lastUpdate: string;
    services: ShodanService[];
}

export interface ShodanHostMinimal {
    ip: string;
    hostnames: string[];
    org: string;
    country: string;
    ports: number[];
    vulns: string[];
    lastUpdate: string;
}

export interface ShodanSearchResult {
    total: number;
    matches: ShodanHostResult[];
    facets: Record<string, { value: string; count: number }[]>;
}

export interface ShodanDomainResult {
    domain: string;
    subdomains: string[];
    records: { type: string; value: string; subdomain: string }[];
}

export interface ShodanCVEResult {
    cve: string;
    affectedHosts: number;
    topCountries: { country: string; count: number }[];
    topOrgs: { org: string; count: number }[];
}

export interface ShodanAccountInfo {
    plan: string;
    queryCredits: number;
    scanCredits: number;
    monitoredIPs: number;
    usage: { queryCreditsUsed: number };
}

export interface AttackSurfaceReport {
    scanDate: string;
    totalAssets: number;
    totalServices: number;
    totalVulnerabilities: number;
    criticalVulns: string[];
    highVulns: string[];
    exposedServices: {
        service: string;
        port: number;
        host: string;
        risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        reason: string;
    }[];
    sslIssues: {
        host: string;
        issue: string;
        severity: 'HIGH' | 'MEDIUM';
    }[];
    geoMismatches: {
        ip: string;
        expectedCountry: string;
        actualCountry: string;
        hostname: string;
    }[];
    assets: ShodanHostMinimal[];
    riskScore: number;
}

export interface VendorScanResult {
    domain: string;
    subdomains: string[];
    totalHosts: number;
    exposedServices: number;
    vulnerabilities: { cve: string; cvss: number; host: string }[];
    sslIssues: number;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    scanDate: string;
    summary: string;
}

export interface ShodanHealthCheck {
    connected: boolean;
    plan: string;
    credits: number;
    error?: string;
}
