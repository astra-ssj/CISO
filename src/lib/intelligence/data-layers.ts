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
    color: string;
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
        refreshInterval: 300,
        source: 'ACLED+GDELT',
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
        color: '#fbbf24',
    },
    {
        id: 'sanctions',
        name: 'Sanctions Regimes',
        category: 'GEOPOLITICAL',
        description: 'Countries under active sanctions programs',
        icon: '🚫',
        enabled: false,
        refreshInterval: 3600,
        source: 'static',
        color: '#a855f7',
    },
    {
        id: 'intelligence_hotspots',
        name: 'Intelligence Hotspots',
        category: 'GEOPOLITICAL',
        description: 'Areas with elevated intelligence activity',
        icon: '🎯',
        enabled: true,
        refreshInterval: 120,
        source: 'aggregated',
        color: '#ef4444',
    },

    // ─── MILITARY ────────────────────────────────────
    {
        id: 'military_bases',
        name: 'Military Bases (220+)',
        category: 'MILITARY',
        description: 'Known military installations globally',
        icon: '🏗️',
        enabled: false,
        zoomThreshold: 5,
        refreshInterval: 86400,
        source: 'static',
        color: '#dc2626',
    },
    {
        id: 'military_flights',
        name: 'Military Flights',
        category: 'MILITARY',
        description: 'Real-time military aircraft ADS-B tracking',
        icon: '✈️',
        enabled: true,
        refreshInterval: 30,
        source: 'OpenSky ADS-B',
        color: '#f97316',
    },
    {
        id: 'naval_vessels',
        name: 'Naval Vessels',
        category: 'MILITARY',
        description: 'AIS-tracked military and naval vessels',
        icon: '🚢',
        enabled: false,
        refreshInterval: 60,
        source: 'AIS',
        color: '#3b82f6',
    },

    // ─── INFRASTRUCTURE ──────────────────────────────
    {
        id: 'undersea_cables',
        name: 'Undersea Cables',
        category: 'INFRASTRUCTURE',
        description: 'Submarine telecommunications cable routes',
        icon: '🔌',
        enabled: false,
        zoomThreshold: 3,
        refreshInterval: 86400,
        source: 'TeleGeography',
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
        source: 'static',
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
        source: 'static',
        color: '#8b5cf6',
    },
    {
        id: 'nuclear',
        name: 'Nuclear Facilities',
        category: 'INFRASTRUCTURE',
        description: 'Nuclear power plants and research reactors',
        icon: '☢️',
        enabled: false,
        zoomThreshold: 5,
        refreshInterval: 86400,
        source: 'static',
        color: '#eab308',
    },
    {
        id: 'internet_outages',
        name: 'Internet Outages',
        category: 'INFRASTRUCTURE',
        description: 'Real-time internet connectivity disruptions',
        icon: '🌐',
        enabled: true,
        refreshInterval: 60,
        source: 'Cloudflare Radar',
        color: '#ef4444',
    },

    // ─── ENVIRONMENTAL ───────────────────────────────
    {
        id: 'satellite_fires',
        name: 'Satellite Fire Detection',
        category: 'ENVIRONMENTAL',
        description: 'NASA VIIRS satellite fire hotspots',
        icon: '🔥',
        enabled: false,
        refreshInterval: 300,
        source: 'NASA FIRMS VIIRS',
        color: '#f97316',
    },
    {
        id: 'earthquakes',
        name: 'Earthquakes',
        category: 'ENVIRONMENTAL',
        description: 'USGS seismic event monitoring',
        icon: '🌍',
        enabled: true,
        refreshInterval: 300,
        source: 'USGS',
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
        color: '#38bdf8',
    },

    // ─── CYBER ───────────────────────────────────────
    {
        id: 'apt_threats',
        name: 'APT Threat Actors',
        category: 'CYBER',
        description: 'Known APT group activity mapped by origin',
        icon: '🕵️',
        enabled: false,
        refreshInterval: 3600,
        source: 'MITRE ATT&CK',
        color: '#f43f5e',
    },
    {
        id: 'ransomware',
        name: 'Ransomware Groups',
        category: 'CYBER',
        description: 'Active ransomware group geolocation',
        icon: '💀',
        enabled: false,
        refreshInterval: 1800,
        source: 'ransomware feed',
        color: '#dc2626',
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
