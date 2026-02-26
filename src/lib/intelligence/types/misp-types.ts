/**
 * MISP Type Definitions
 * Used by the MISP client to type API responses.
 */

// ── Events ─────────────────────────────────────────────────────

export interface MISPEvent {
    id: string;
    uuid: string;
    org_id: string;
    orgc_id: string;
    info: string;
    date: string;
    /** ISO 8601 timestamp */
    timestamp: string;
    published: boolean;
    publish_timestamp?: string;
    threat_level_id: '1' | '2' | '3' | '4'; // 1=High, 2=Medium, 3=Low, 4=Undefined
    analysis: '0' | '1' | '2';              // 0=Initial, 1=Ongoing, 2=Complete
    distribution: '0' | '1' | '2' | '3' | '4';
    attribute_count: number;
    /** Organisation that created the event */
    Orgc?: { id: string; name: string; uuid: string };
    /** Tags attached to this event */
    Tag?: MISPTag[];
    /** Attributes (IOCs) belonging to this event */
    Attribute?: MISPAttribute[];
    /** Galaxies linked to this event */
    Galaxy?: MISPGalaxy[];
}

export interface MISPEventFilters {
    /** ISO date string — events published after this date */
    from?: string;
    /** ISO date string — events published before this date */
    to?: string;
    /** Free-text search */
    searchall?: string;
    /** Threat level filter */
    threat_level_id?: '1' | '2' | '3' | '4';
    /** Published status */
    published?: boolean;
    /** Tag filter */
    tags?: string[];
    /** Limit */
    limit?: number;
    /** Page */
    page?: number;
}

// ── Attributes (IOCs) ──────────────────────────────────────────

export type MISPAttributeCategory =
    | 'Network activity'
    | 'Payload delivery'
    | 'Payload installation'
    | 'External analysis'
    | 'Persistence mechanism'
    | 'Artifacts dropped'
    | 'Attribution'
    | 'Antivirus detection'
    | 'Other';

export type MISPAttributeType =
    | 'ip-src'
    | 'ip-dst'
    | 'domain'
    | 'hostname'
    | 'url'
    | 'md5'
    | 'sha1'
    | 'sha256'
    | 'filename'
    | 'email-src'
    | 'email-dst'
    | 'mutex'
    | 'regkey'
    | 'pattern-in-traffic'
    | 'user-agent'
    | string; // MISP allows custom types

export interface MISPAttribute {
    id: string;
    uuid: string;
    event_id: string;
    category: MISPAttributeCategory | string;
    type: MISPAttributeType;
    value: string;
    /** Free-text comment */
    comment?: string;
    /** ISO 8601 timestamp */
    timestamp: string;
    to_ids: boolean;
    distribution: string;
    /** Tags on this attribute */
    Tag?: MISPTag[];
}

export interface MISPAttributeFilters {
    type?: MISPAttributeType;
    category?: MISPAttributeCategory | string;
    value?: string;
    tags?: string[];
    to_ids?: boolean;
    limit?: number;
    page?: number;
}

// ── Feeds ──────────────────────────────────────────────────────

export interface MISPFeed {
    id: string;
    name: string;
    provider: string;
    url: string;
    enabled: boolean;
    source_format: 'misp' | 'freetext' | 'csv';
    /** ISO 8601 — last time events were pulled */
    last_fetched?: string;
    event_count?: number;
}

export interface MISPFeedStatus {
    id: string;
    name: string;
    enabled: boolean;
    lastFetch: Date;
    eventCount: number;
}

// ── Tags ───────────────────────────────────────────────────────

export interface MISPTag {
    id: string;
    name: string;
    colour: string;
    exportable: boolean;
    /** TLP / PAP / admiralty code etc. */
    is_galaxy?: boolean;
}

// ── Galaxies ───────────────────────────────────────────────────

export interface MISPGalaxy {
    id: string;
    uuid: string;
    name: string;
    type: string;
    description: string;
    namespace: string;
    /** Galaxy clusters (entries within the galaxy) */
    GalaxyCluster?: MISPGalaxyCluster[];
}

export interface MISPGalaxyCluster {
    id: string;
    uuid: string;
    value: string;
    description: string;
    source: string;
    tag_name: string;
}

// ── Stats & Health ─────────────────────────────────────────────

export interface MISPStats {
    events: number;
    attributes: number;
    feeds: number;
    organizations: number;
}

export interface MISPHealthCheck {
    connected: boolean;
    version: string;
    lastSync: Date;
}
