/**
 * Signal Aggregator — Central intelligence signal pipeline.
 *
 * Provides: IntelligenceSignal type, clustering by country/region,
 * geographic convergence detection, and utility functions.
 */

// ── Core Signal Type ──────────────────────────────────────────

export type SignalType =
    | 'NEWS'
    | 'MILITARY_FLIGHT'
    | 'NAVAL_VESSEL'
    | 'PROTEST'
    | 'EARTHQUAKE'
    | 'FIRE'
    | 'OUTAGE'
    | 'CYBER'
    | 'AIS_GAP';

export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IntelligenceSignal {
    id: string;
    type: SignalType;
    severity: Severity;
    latitude: number;
    longitude: number;
    country: string;
    region: string;
    title: string;
    description: string;
    source: string;
    timestamp: Date;
    metadata: Record<string, unknown>;
}

// ── Region Definitions ────────────────────────────────────────

export const REGIONS: Record<string, { countries: string[]; center: { lat: number; lng: number } }> = {
    'Europe': {
        countries: ['DE', 'GB', 'FR', 'NL', 'BE', 'AT', 'CH', 'IT', 'ES', 'PT', 'IE', 'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'RO', 'BG', 'GR', 'HR', 'HU', 'SK', 'LT', 'LV', 'EE', 'LU', 'UA', 'BY', 'RU'],
        center: { lat: 50, lng: 10 },
    },
    'MENA': {
        countries: ['AE', 'SA', 'IL', 'TR', 'EG', 'QA', 'BH', 'KW', 'OM', 'JO', 'IR', 'IQ', 'SY', 'YE', 'LB', 'LY'],
        center: { lat: 28, lng: 42 },
    },
    'Asia-Pacific': {
        countries: ['JP', 'KR', 'CN', 'TW', 'SG', 'AU', 'NZ', 'IN', 'TH', 'MY', 'ID', 'PH', 'VN', 'HK', 'PK', 'KP', 'MM', 'BD', 'LK'],
        center: { lat: 20, lng: 105 },
    },
    'Americas': {
        countries: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'CU', 'HT'],
        center: { lat: 20, lng: -80 },
    },
    'Africa': {
        countries: ['ZA', 'NG', 'KE', 'GH', 'MA', 'ET', 'EG', 'SD', 'SO', 'CD', 'CF', 'ML', 'BF', 'NE', 'MZ', 'TZ', 'UG'],
        center: { lat: 5, lng: 20 },
    },
};

/**
 * Get the region for a country code.
 */
export function getRegion(countryCode: string): string {
    const code = countryCode.toUpperCase();
    for (const [region, def] of Object.entries(REGIONS)) {
        if (def.countries.includes(code)) return region;
    }
    return 'Other';
}

// ── Clustering Functions ──────────────────────────────────────

export interface CountryCluster {
    country: string;
    signals: IntelligenceSignal[];
    count: number;
    highestSeverity: Severity;
    signalTypes: Set<SignalType>;
}

export interface RegionCluster {
    region: string;
    countries: CountryCluster[];
    totalCount: number;
    highestSeverity: Severity;
}

const SEVERITY_ORDER: Severity[] = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function maxSeverity(a: Severity, b: Severity): Severity {
    return SEVERITY_ORDER.indexOf(a) >= SEVERITY_ORDER.indexOf(b) ? a : b;
}

/**
 * Group signals by country with summary stats.
 */
export function clusterByCountry(signals: IntelligenceSignal[]): CountryCluster[] {
    const map = new Map<string, IntelligenceSignal[]>();
    for (const s of signals) {
        const code = s.country.toUpperCase();
        if (!map.has(code)) map.set(code, []);
        map.get(code)!.push(s);
    }

    return Array.from(map.entries())
        .map(([country, sigs]) => ({
            country,
            signals: sigs,
            count: sigs.length,
            highestSeverity: sigs.reduce<Severity>((max, s) => maxSeverity(max, s.severity), 'INFO'),
            signalTypes: new Set(sigs.map((s) => s.type)),
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Group signals by region.
 */
export function clusterByRegion(signals: IntelligenceSignal[]): RegionCluster[] {
    const countryClusters = clusterByCountry(signals);
    const regionMap = new Map<string, CountryCluster[]>();

    for (const cc of countryClusters) {
        const region = getRegion(cc.country);
        if (!regionMap.has(region)) regionMap.set(region, []);
        regionMap.get(region)!.push(cc);
    }

    return Array.from(regionMap.entries())
        .map(([region, clusters]) => ({
            region,
            countries: clusters,
            totalCount: clusters.reduce((sum, c) => sum + c.count, 0),
            highestSeverity: clusters.reduce<Severity>(
                (max, c) => maxSeverity(max, c.highestSeverity), 'INFO'
            ),
        }))
        .sort((a, b) => b.totalCount - a.totalCount);
}

// ── Convergence Detection ─────────────────────────────────────

export interface ConvergenceAlert {
    cellKey: string;
    latitude: number;
    longitude: number;
    signalTypes: SignalType[];
    signals: IntelligenceSignal[];
    riskScore: number;
    description: string;
}

/**
 * Detect geographic convergence: cells (1°×1°) where 3+ different
 * signal types co-occur within a time window.
 */
export function detectConvergence(
    signals: IntelligenceSignal[],
    options: { windowHours?: number; minTypes?: number } = {}
): ConvergenceAlert[] {
    const { windowHours = 24, minTypes = 3 } = options;
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    const recent = signals.filter((s) => s.timestamp.getTime() > cutoff);

    // Grid cells
    const cells = new Map<string, IntelligenceSignal[]>();
    for (const s of recent) {
        const latKey = Math.floor(s.latitude);
        const lngKey = Math.floor(s.longitude);
        const key = `${latKey},${lngKey}`;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key)!.push(s);
    }

    const alerts: ConvergenceAlert[] = [];
    for (const [key, cellSignals] of cells) {
        const types = new Set(cellSignals.map((s) => s.type));
        if (types.size >= minTypes) {
            const [latStr, lngStr] = key.split(',');
            const lat = Number(latStr) + 0.5;
            const lng = Number(lngStr) + 0.5;
            const severities = cellSignals.map((s) => SEVERITY_ORDER.indexOf(s.severity));
            const maxSev = Math.max(...severities);
            const riskScore = Math.min(100, types.size * 15 + maxSev * 10 + cellSignals.length * 2);

            alerts.push({
                cellKey: key,
                latitude: lat,
                longitude: lng,
                signalTypes: Array.from(types),
                signals: cellSignals,
                riskScore,
                description: `${types.size} signal types converging: ${Array.from(types).join(', ')}. ${cellSignals.length} total events.`,
            });
        }
    }

    return alerts.sort((a, b) => b.riskScore - a.riskScore);
}

// ── Severity Helpers ──────────────────────────────────────────

export function severityToNumber(s: Severity): number {
    return SEVERITY_ORDER.indexOf(s);
}

export function severityColor(s: Severity): string {
    const colors: Record<Severity, string> = {
        INFO: '#94a3b8',
        LOW: '#22c55e',
        MEDIUM: '#eab308',
        HIGH: '#f97316',
        CRITICAL: '#ef4444',
    };
    return colors[s];
}
