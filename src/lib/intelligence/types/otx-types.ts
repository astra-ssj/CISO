/**
 * AlienVault OTX Type Definitions
 * Used by the OTX client to type API responses.
 * Docs: https://otx.alienvault.com/assets/static/external_api.html
 */

// ── Pulses (Threat Intelligence Reports) ───────────────────────

export interface OTXPulse {
    id: string;
    name: string;
    description: string;
    author_name: string;
    created: string;
    modified: string;
    /** ISO 3166-1 alpha-2 country codes */
    targeted_countries: string[];
    malware_families: string[];
    /** MITRE ATT&CK IDs (e.g. "T1566") */
    attack_ids: string[];
    tags: string[];
    /** Number of IOCs in this pulse */
    indicator_count: number;
    indicators: OTXIndicator[];
    /** TLP level */
    tlp: 'white' | 'green' | 'amber' | 'red';
    references: string[];
    revision: number;
}

export interface OTXIndicator {
    id: number;
    indicator: string;
    type: OTXIndicatorType;
    created: string;
    title: string;
    description: string;
    /** Content extracted during enrichment */
    content: string;
    is_active: number; // 0 or 1
    role: string | null;
    expiration: string | null;
}

export type OTXIndicatorType =
    | 'IPv4'
    | 'IPv6'
    | 'domain'
    | 'hostname'
    | 'URL'
    | 'FileHash-MD5'
    | 'FileHash-SHA1'
    | 'FileHash-SHA256'
    | 'email'
    | 'CVE'
    | 'CIDR'
    | 'Mutex'
    | 'YARA';

// ── Enrichment Reports ─────────────────────────────────────────

export interface OTXIPReport {
    whois: string;
    reputation: number;
    indicator: string;
    type: 'IPv4' | 'IPv6';
    type_title: string;
    asn: string;
    country_code: string;
    country_name: string;
    city: string;
    region: string;
    latitude: number;
    longitude: number;
    pulse_info: { count: number; pulses: OTXPulse[] };
    sections: string[];
    validation: OTXValidation[];
}

export interface OTXDomainReport {
    indicator: string;
    type: 'domain';
    type_title: string;
    whois: string;
    alexa: string;
    pulse_info: { count: number; pulses: OTXPulse[] };
    validation: OTXValidation[];
}

export interface OTXHashReport {
    indicator: string;
    type: 'file';
    type_title: string;
    pulse_info: { count: number; pulses: OTXPulse[] };
    analysis: {
        malware: boolean;
        has_flash: boolean;
        plugins: Record<string, unknown>;
    } | null;
    validation: OTXValidation[];
}

export interface OTXURLReport {
    indicator: string;
    type: 'url';
    type_title: string;
    /** URL scan result */
    alexa: string;
    whois: string;
    pulse_info: { count: number; pulses: OTXPulse[] };
    url_list: Array<{
        url: string;
        date: string;
        result: { urlworker: { ip: string; http_code: number } };
    }>;
    validation: OTXValidation[];
}

export interface OTXValidation {
    source: string;
    message: string;
    name: string;
}

// ── Stats & Health ─────────────────────────────────────────────

export interface OTXStats {
    pulses: number;
    indicators: number;
    subscribers: number;
}

export interface OTXHealthCheck {
    connected: boolean;
    version: string;
}
