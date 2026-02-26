/**
 * OpenCTI Type Definitions — STIX 2.1 aligned
 * Used by the OpenCTI client to type API responses.
 */

// ── Shared Primitives ──────────────────────────────────────────

export interface StixCoreObject {
    id: string;
    standard_id: string;
    entity_type: string;
    created: string;
    modified: string;
    created_by_ref?: string;
    confidence?: number;
    revoked?: boolean;
    labels?: string[];
    object_marking_refs?: string[];
}

export interface OpenCTIFilters {
    search?: string;
    first?: number;
    after?: string;
    orderBy?: string;
    orderMode?: 'asc' | 'desc';
    filters?: Array<{
        key: string;
        values: string[];
        operator?: 'eq' | 'match' | 'lt' | 'gt' | 'lte' | 'gte';
        mode?: 'and' | 'or';
    }>;
}

export interface PaginatedResponse<T> {
    edges: Array<{ node: T; cursor: string }>;
    pageInfo: {
        startCursor: string;
        endCursor: string;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        globalCount: number;
    };
}

// ── Campaigns ──────────────────────────────────────────────────

export interface Campaign extends StixCoreObject {
    entity_type: 'Campaign';
    name: string;
    description?: string;
    aliases?: string[];
    first_seen?: string;
    last_seen?: string;
    objective?: string;
    /** Regions / countries targeted (relationship-derived) */
    targetedRegions?: string[];
    /** Associated threat actor names */
    threatActors?: string[];
}

// ── Threat Actors ──────────────────────────────────────────────

export interface ThreatActor extends StixCoreObject {
    entity_type: 'Threat-Actor';
    name: string;
    description?: string;
    aliases?: string[];
    threat_actor_types?: string[];
    first_seen?: string;
    last_seen?: string;
    sophistication?: string;
    resource_level?: string;
    primary_motivation?: string;
    goals?: string[];
    /** Sectors this actor targets (relationship-derived) */
    targetedSectors?: string[];
    /** Countries of origin */
    country?: string;
}

// ── Indicators (IOCs) ──────────────────────────────────────────

export type IndicatorType = 'ipv4-addr' | 'ipv6-addr' | 'domain-name' | 'file' | 'url' | 'email-addr';
export type IndicatorTypeShort = 'ipv4' | 'domain' | 'hash' | 'url';

export interface Indicator extends StixCoreObject {
    entity_type: 'Indicator';
    name: string;
    description?: string;
    pattern: string;
    pattern_type: 'stix' | 'pcre' | 'sigma' | 'snort' | 'suricata' | 'yara';
    indicator_types?: string[];
    valid_from: string;
    valid_until?: string;
    /** Resolved observable value (e.g. "192.168.1.1") */
    observableValue?: string;
    observableType?: IndicatorType;
    /** Kill chain phases linked to this indicator */
    killChainPhases?: string[];
}

// ── MITRE ATT&CK Patterns ─────────────────────────────────────

export interface AttackPattern extends StixCoreObject {
    entity_type: 'Attack-Pattern';
    name: string;
    description?: string;
    /** MITRE ATT&CK external reference ID (e.g. "T1059") */
    x_mitre_id: string;
    kill_chain_phases?: Array<{
        kill_chain_name: string;
        phase_name: string;
    }>;
    /** MITRE platforms (e.g. "Windows", "Linux") */
    x_mitre_platforms?: string[];
    /** Sub-techniques */
    subAttackPatterns?: AttackPattern[];
}

export interface AttackHeatmapEntry {
    technique: string;
    techniqueId: string;
    count: number;
    tactic?: string;
}

// ── Malware & Tools ────────────────────────────────────────────

export interface Malware extends StixCoreObject {
    entity_type: 'Malware';
    name: string;
    description?: string;
    malware_types?: string[];
    is_family: boolean;
    aliases?: string[];
    first_seen?: string;
    last_seen?: string;
    /** Kill chain phases */
    killChainPhases?: string[];
    /** Associated architecture / OS */
    operatingSystemRefs?: string[];
}

// ── Reports ────────────────────────────────────────────────────

export interface Report extends StixCoreObject {
    entity_type: 'Report';
    name: string;
    description?: string;
    report_types?: string[];
    published: string;
    /** Number of STIX objects referenced */
    objectCount?: number;
    /** Source (connector name) */
    createdBy?: string;
}

// ── Search ─────────────────────────────────────────────────────

export interface SearchResult {
    id: string;
    entity_type: string;
    name: string;
    description?: string;
    /** Relevance score from OpenCTI */
    score?: number;
    created: string;
    modified: string;
}

// ── Stats & Health ─────────────────────────────────────────────

export interface OpenCTIStats {
    campaigns: number;
    actors: number;
    indicators: number;
    malware: number;
    reports: number;
}

export interface OpenCTIHealthCheck {
    connected: boolean;
    version: string;
    lastSync: Date;
}
