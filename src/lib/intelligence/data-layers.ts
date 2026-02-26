/**
 * Intelligence Data Layer Registry
 * Typed registry of all map data layers available in the World Monitor.
 */

export type DataLayerCategory =
    | 'GEOPOLITICAL'
    | 'MILITARY'
    | 'INFRASTRUCTURE'
    | 'ENVIRONMENTAL'
    | 'CYBER';

export type DataLayerSourceType = 'static' | 'free-api' | 'api-key';

export interface DataLayer {
    id: string;
    name: string;
    category: DataLayerCategory;
    description: string;
    icon: string;
    enabled: boolean;
    zoomThreshold?: number;
    refreshInterval: number; // seconds
    source: string;
    sourceType: DataLayerSourceType;
    color: string;
    envKey?: string; // env var required for api-key sources
}

export const DATA_LAYERS: DataLayer[] = [
    // ─── GEOPOLITICAL ────────────────────────────────
    {
        id: 'conflicts',
        name: 'Active Conflicts',
        category: 'GEOPOLITICAL',
        description: 'Armed conflicts and violence events worldwide',
        icon: '⚔️',
        enabled: true,
        refreshInterval: 86400,
        source: 'Static JSON',
        sourceType: 'static',
        color: '#f43f5e',
    },
    {
        id: 'protests',
        name: 'Social Unrest',
        category: 'GEOPOLITICAL',
        description: 'Protests, riots, and civil disturbances',
        icon: '📢',
        enabled: false,
        refreshInterval: 300,
        source: 'ACLED',
        sourceType: 'api-key',
        color: '#fbbf24',
    },
    {
        id: 'sanctions',
        name: 'Sanctions Regimes',
        category: 'GEOPOLITICAL',
        description: 'Countries under active sanctions programs',
        icon: '🚫',
        enabled: false,
        refreshInterval: 86400,
        source: 'Static JSON',
        sourceType: 'static',
        color: '#a855f7',
    },
    {
        id: 'intelligence_hotspots',
        name: 'Intelligence Hotspots',
        category: 'GEOPOLITICAL',
        description: 'News-based intelligence activity from GDELT',
        icon: '🎯',
        enabled: true,
        refreshInterval: 600,
        source: 'GDELT',
        sourceType: 'free-api',
        color: '#ef4444',
    },

    // ─── MILITARY ────────────────────────────────────
    {
        id: 'military_bases',
        name: 'Military Bases (60+)',
        category: 'MILITARY',
        description: 'Known military installations globally',
        icon: '🏗️',
        enabled: false,
        zoomThreshold: 4,
        refreshInterval: 86400,
        source: 'Static JSON',
        sourceType: 'static',
        color: '#f97316',
    },
    {
        id: 'military_flights',
        name: 'Military Flights',
        category: 'MILITARY',
        description: 'Live military aircraft tracking',
        icon: '✈️',
        enabled: false,
        refreshInterval: 30,
        source: 'OpenSky Network',
        sourceType: 'api-key',
        envKey: 'OPENSKY_USERNAME',
        color: '#facc15',
    },

    // ─── INFRASTRUCTURE ──────────────────────────────
    {
        id: 'offices',
        name: 'AstraLabs Offices',
        category: 'INFRASTRUCTURE',
        description: 'Company office locations across the globe',
        icon: '🏢',
        enabled: true,
        refreshInterval: 86400,
        source: 'Static JSON',
        sourceType: 'static',
        color: '#22d3ee',
    },
    {
        id: 'undersea_cables',
        name: 'Undersea Cables',
        category: 'INFRASTRUCTURE',
        description: 'Submarine telecommunications cable routes',
        icon: '🔌',
        enabled: false,
        zoomThreshold: 3,
        refreshInterval: 86400,
        source: 'Static JSON',
        sourceType: 'static',
        color: '#06b6d4',
    },
    {
        id: 'pipelines',
        name: 'Oil & Gas Pipelines',
        category: 'INFRASTRUCTURE',
        description: 'Major energy pipeline infrastructure',
        icon: '🛢️',
        enabled: false,
        zoomThreshold: 4,
        refreshInterval: 86400,
        source: 'Static JSON',
        sourceType: 'static',
        color: '#84cc16',
    },
    {
        id: 'datacenters',
        name: 'AI Datacenters',
        category: 'INFRASTRUCTURE',
        description: 'Major cloud and AI datacenter locations',
        icon: '🖥️',
        enabled: false,
        zoomThreshold: 5,
        refreshInterval: 86400,
        source: 'Static JSON',
        sourceType: 'static',
        color: '#8b5cf6',
    },
    {
        id: 'nuclear',
        name: 'Nuclear Facilities',
        category: 'INFRASTRUCTURE',
        description: 'Nuclear power plants and research reactors',
        icon: '☢️',
        enabled: false,
        zoomThreshold: 4,
        refreshInterval: 86400,
        source: 'Static JSON',
        sourceType: 'static',
        color: '#eab308',
    },
    {
        id: 'internet_outages',
        name: 'Internet Outages',
        category: 'INFRASTRUCTURE',
        description: 'Real-time internet connectivity disruptions',
        icon: '🌐',
        enabled: false,
        refreshInterval: 60,
        source: 'Cloudflare Radar',
        sourceType: 'api-key',
        color: '#ef4444',
    },

    // ─── ENVIRONMENTAL ───────────────────────────────
    {
        id: 'earthquakes',
        name: 'Earthquakes',
        category: 'ENVIRONMENTAL',
        description: 'USGS seismic event monitoring (M2.5+)',
        icon: '🌍',
        enabled: true,
        refreshInterval: 300,
        source: 'USGS',
        sourceType: 'free-api',
        color: '#a3e635',
    },
    {
        id: 'weather_alerts',
        name: 'Severe Weather',
        category: 'ENVIRONMENTAL',
        description: 'NOAA severe weather alerts',
        icon: '⛈️',
        enabled: false,
        refreshInterval: 600,
        source: 'NOAA',
        sourceType: 'api-key',
        color: '#38bdf8',
    },

    // ─── CYBER ───────────────────────────────────────
    {
        id: 'apt_threats',
        name: 'APT Threat Actors',
        category: 'CYBER',
        description: 'Active APT IOCs from ThreatFox',
        icon: '🕵️',
        enabled: false,
        refreshInterval: 1800,
        source: 'Abuse.ch ThreatFox',
        sourceType: 'free-api',
        color: '#f43f5e',
    },
    {
        id: 'ransomware',
        name: 'Ransomware Groups',
        category: 'CYBER',
        description: 'Recent malware samples & ransomware families',
        icon: '💀',
        enabled: false,
        refreshInterval: 1800,
        source: 'Abuse.ch MalwareBazaar',
        sourceType: 'free-api',
        color: '#dc2626',
    },
    {
        id: 'malicious_urls',
        name: 'Malicious URLs',
        category: 'CYBER',
        description: 'Recently reported malicious URLs',
        icon: '🔗',
        enabled: false,
        refreshInterval: 900,
        source: 'Abuse.ch URLhaus',
        sourceType: 'free-api',
        color: '#fb923c',
    },
    {
        id: 'otx_pulses',
        name: 'OTX Threat Pulses',
        category: 'CYBER',
        description: 'AlienVault OTX community threat intelligence',
        icon: '📡',
        enabled: false,
        refreshInterval: 3600,
        source: 'AlienVault OTX',
        sourceType: 'api-key',
        envKey: 'ALIENVAULT_OTX_KEY',
        color: '#a78bfa',
    },
    {
        id: 'attack_surface',
        name: 'Your Attack Surface',
        category: 'CYBER',
        description: 'Your discovered internet-facing assets from Shodan scans',
        icon: '🛡️',
        enabled: false,
        zoomThreshold: 4,
        refreshInterval: 3600,
        source: 'Shodan',
        sourceType: 'api-key',
        envKey: 'SHODAN_API_KEY',
        color: '#06b6d4',
    },
];

/** Get layers filtered by category */
export function getLayersByCategory(category: DataLayerCategory): DataLayer[] {
    return DATA_LAYERS.filter((l) => l.category === category);
}

/** Get all enabled layers (default state) */
export function getDefaultEnabledLayers(): DataLayer[] {
    return DATA_LAYERS.filter((l) => l.enabled);
}

/** Get all static layers (always active) */
export function getStaticLayers(): DataLayer[] {
    return DATA_LAYERS.filter((l) => l.sourceType === 'static');
}

/** Category metadata for UI rendering */
export const LAYER_CATEGORIES: {
    id: DataLayerCategory;
    label: string;
    icon: string;
    color: string;
}[] = [
        { id: 'GEOPOLITICAL', label: 'Geopolitical', icon: '🌍', color: '#f43f5e' },
        { id: 'MILITARY', label: 'Military', icon: '⚔️', color: '#f97316' },
        { id: 'INFRASTRUCTURE', label: 'Infrastructure', icon: '🏗️', color: '#06b6d4' },
        { id: 'ENVIRONMENTAL', label: 'Environmental', icon: '🌿', color: '#84cc16' },
        { id: 'CYBER', label: 'Cyber', icon: '💻', color: '#a855f7' },
    ];
