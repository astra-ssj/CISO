/**
 * Unified Threat Intelligence types — provider-agnostic.
 * Used by IntelligenceService to normalise data across
 * OpenCTI, AlienVault OTX, and Abuse.ch feeds.
 */

// ── Source Enum ─────────────────────────────────────────────────

export type ThreatIntelProvider =
    | 'OPENCTI'
    | 'OTX'
    | 'ABUSECH_URLHAUS'
    | 'ABUSECH_THREATFOX'
    | 'ABUSECH_MALWAREBAZAAR';

// ── Unified IOC ────────────────────────────────────────────────

export type IOCType =
    | 'ipv4'
    | 'ipv6'
    | 'domain'
    | 'url'
    | 'hash-md5'
    | 'hash-sha1'
    | 'hash-sha256'
    | 'email'
    | 'cve';

export type IOCSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface UnifiedIOC {
    value: string;
    type: IOCType;
    severity: IOCSeverity;
    sources: ThreatIntelProvider[];
    firstSeen: string;
    lastSeen: string;
    campaigns: string[];
    malwareFamilies: string[];
    tags: string[];
    confidence: number; // 0-100
    context: string;    // human-readable summary
}

// ── Enrichment ─────────────────────────────────────────────────

export type EnrichmentVerdict = 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';

export interface EnrichmentSourceResult {
    name: ThreatIntelProvider;
    found: boolean;
    data: Record<string, unknown>;
}

export interface EnrichmentResult {
    value: string;
    type: string;
    verdict: EnrichmentVerdict;
    confidence: number;
    sources: EnrichmentSourceResult[];
    campaigns: string[];
    malwareFamilies: string[];
    tags: string[];
    context: string;
}

// ── Dashboard ──────────────────────────────────────────────────

export interface IntelDashboard {
    activeCampaigns: number;
    threatActors: number;
    totalIOCs: number;
    recentReports: number;
    topThreats: IntelThreatSummary[];
    feedHealth: { total: number; active: number; stale: number };
    providers: IntelProviderStatus[];
}

export interface IntelThreatSummary {
    title: string;
    severity: IOCSeverity;
    source: string;
    time: string;
}

export interface IntelProviderStatus {
    name: string;
    connected: boolean;
    lastSync: string | null;
}

// ── Health ──────────────────────────────────────────────────────

export interface IntelHealth {
    overall: 'healthy' | 'degraded' | 'down';
    providers: {
        name: string;
        status: 'up' | 'down';
        lastCheck: string;
        details?: string;
    }[];
}
