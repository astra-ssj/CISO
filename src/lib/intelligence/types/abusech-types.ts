/**
 * Abuse.ch Type Definitions
 * Three free feeds: URLhaus, ThreatFox, MalwareBazaar.
 * No API key required.
 */

// ── URLhaus ────────────────────────────────────────────────────

export interface MaliciousURL {
    id: string;
    url: string;
    url_status: 'online' | 'offline' | 'unknown';
    host: string;
    date_added: string;
    threat: string;
    /** e.g. 'malware_download', 'phishing' */
    tags: string[];
    urlhaus_reference: string;
    reporter: string;
    larted: boolean;
    /** Malware payloads served by this URL */
    payloads: URLhausPayload[];
}

export interface URLhausPayload {
    filename: string | null;
    file_type: string | null;
    response_md5: string;
    response_sha256: string;
    response_size: number | null;
    signature: string | null;
    urlhaus_download: string;
    virustotal: { result: string; percent: string; link: string } | null;
}

export interface URLhausResult {
    query_status: 'ok' | 'no_results' | 'invalid_url';
    id: string | null;
    url: string;
    host: string;
    url_status: 'online' | 'offline' | 'unknown';
    date_added: string;
    threat: string;
    blacklists: {
        spamhaus_dbl: string;
        surbl: string;
    };
    tags: string[];
    payloads: URLhausPayload[];
    urlhaus_reference: string;
}

// ── ThreatFox ──────────────────────────────────────────────────

export interface ThreatFoxIOC {
    id: string;
    ioc: string;
    ioc_type: 'ip:port' | 'domain' | 'url' | 'md5_hash' | 'sha256_hash' | string;
    threat_type: 'botnet_cc' | 'payload_delivery' | 'payload' | string;
    threat_type_desc: string;
    malware: string;
    malware_alias: string | null;
    malware_printable: string;
    malware_malpedia: string;
    confidence_level: number; // 0-100
    first_seen: string;
    last_seen: string | null;
    reporter: string;
    reference: string | null;
    tags: string[];
}

// ── MalwareBazaar ──────────────────────────────────────────────

export interface MalwareSample {
    sha256_hash: string;
    sha3_384_hash: string;
    sha1_hash: string;
    md5_hash: string;
    first_seen: string;
    last_seen: string | null;
    file_name: string | null;
    file_size: number;
    file_type: string;
    file_type_mime: string;
    reporter: string;
    origin_country: string | null;
    signature: string | null;
    /** e.g. 'AgentTesla', 'Emotet' */
    tags: string[];
    intelligence: {
        clamav: string | null;
        downloads: string;
        uploads: string;
        mail: Record<string, unknown> | null;
    };
}

export interface MalwareBazaarResult {
    query_status: 'ok' | 'hash_not_found' | 'illegal_hash';
    data: MalwareSample[] | null;
}

// ── Combined Stats & Health ────────────────────────────────────

export interface AbuseCHStats {
    urls: number;
    iocs: number;
    samples: number;
}

export interface AbuseCHHealthCheck {
    urlhaus: boolean;
    threatfox: boolean;
    malwarebazaar: boolean;
}
