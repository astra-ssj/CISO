/**
 * Data Freshness Monitor — Tracks all intelligence data sources.
 *
 * Categorizes each source as:
 * - FRESH: < 15 min since last update
 * - STALE: > 1h since last update
 * - VERY_STALE: > 6h since last update
 * - ERROR: source returned error
 * - DISABLED: API key not configured
 */

// ── Types ─────────────────────────────────────────────────────

export type FreshnessStatus = 'FRESH' | 'STALE' | 'VERY_STALE' | 'ERROR' | 'DISABLED';

export interface DataSource {
    id: string;
    name: string;
    category: string;
    status: FreshnessStatus;
    lastUpdate: Date | null;
    error?: string;
    configRequired?: string; // env var name if unconfigured
}

export interface FreshnessSummary {
    totalSources: number;
    active: number;
    stale: number;
    error: number;
    disabled: number;
    sources: DataSource[];
    gaps: string[]; // Intelligence gap warnings
}

// ── Source Registry ────────────────────────────────────────────

const SOURCE_DEFINITIONS = [
    { id: 'news_rss', name: 'RSS News Feeds', category: 'OSINT', configRequired: undefined },
    { id: 'earthquakes', name: 'USGS Earthquakes', category: 'Environmental', configRequired: undefined },
    { id: 'instability', name: 'Country Instability Index', category: 'Geopolitical', configRequired: undefined },
    { id: 'anomalies', name: 'Anomaly Detector', category: 'Signal Intelligence', configRequired: undefined },
    { id: 'convergence', name: 'Convergence Alerts', category: 'Signal Intelligence', configRequired: undefined },
    { id: 'world_brief', name: 'AI World Brief', category: 'AI Analysis', configRequired: undefined },

    { id: 'classify', name: 'AI Threat Classification', category: 'AI Analysis', configRequired: 'GROQ_API_KEY' },
    { id: 'outages', name: 'Internet Outages (Cloudflare)', category: 'Infrastructure', configRequired: undefined },
    { id: 'video', name: 'Live Video Streams', category: 'OSINT', configRequired: undefined },
    { id: 'osint', name: 'Existing OSINT Brief', category: 'AI Analysis', configRequired: undefined },
    { id: 'ransomware', name: 'Ransomware Dashboard', category: 'Cyber', configRequired: undefined },
];

// ── In-Memory State ───────────────────────────────────────────

const sourceState = new Map<string, { lastUpdate: Date | null; error?: string }>();

/**
 * Record a successful update for a data source.
 */
export function recordUpdate(sourceId: string): void {
    sourceState.set(sourceId, { lastUpdate: new Date() });
}

/**
 * Record an error for a data source.
 */
export function recordError(sourceId: string, error: string): void {
    const existing = sourceState.get(sourceId);
    sourceState.set(sourceId, { lastUpdate: existing?.lastUpdate ?? null, error });
}

/**
 * Get the freshness status for a source based on its last update time.
 */
function computeStatus(lastUpdate: Date | null, hasError: boolean, isDisabled: boolean): FreshnessStatus {
    if (isDisabled) return 'DISABLED';
    if (hasError) return 'ERROR';
    if (!lastUpdate) return 'STALE';

    const ageMs = Date.now() - lastUpdate.getTime();
    const ageMinutes = ageMs / 60_000;

    if (ageMinutes < 15) return 'FRESH';
    if (ageMinutes < 60) return 'STALE';
    return 'VERY_STALE';
}

// ── Public API ────────────────────────────────────────────────

/**
 * Get the current freshness summary for all sources.
 * Pass environment variable check function to detect disabled sources.
 */
export function getFreshnessSummary(
    envCheck?: (key: string) => boolean
): FreshnessSummary {
    const sources: DataSource[] = SOURCE_DEFINITIONS.map((def) => {
        const state = sourceState.get(def.id);
        const isDisabled = def.configRequired ? !(envCheck?.(def.configRequired) ?? false) : false;
        const hasError = !!state?.error;
        const status = computeStatus(state?.lastUpdate ?? null, hasError, isDisabled);

        return {
            id: def.id,
            name: def.name,
            category: def.category,
            status,
            lastUpdate: state?.lastUpdate ?? null,
            error: state?.error,
            configRequired: isDisabled ? def.configRequired : undefined,
        };
    });

    const active = sources.filter((s) => s.status === 'FRESH').length;
    const stale = sources.filter((s) => s.status === 'STALE' || s.status === 'VERY_STALE').length;
    const error = sources.filter((s) => s.status === 'ERROR').length;
    const disabled = sources.filter((s) => s.status === 'DISABLED').length;

    // Generate intelligence gap warnings
    const gaps: string[] = [];
    const disabledSources = sources.filter((s) => s.status === 'DISABLED');
    const errorSources = sources.filter((s) => s.status === 'ERROR');


    if (errorSources.length > 0) {
        gaps.push(`⚠️ ${errorSources.length} source(s) reporting errors — data may be incomplete`);
    }

    return {
        totalSources: sources.length,
        active,
        stale,
        error,
        disabled,
        sources,
        gaps,
    };
}

/**
 * Status color for UI.
 */
export function statusColor(status: FreshnessStatus): string {
    const colors: Record<FreshnessStatus, string> = {
        FRESH: '#22c55e',
        STALE: '#eab308',
        VERY_STALE: '#f97316',
        ERROR: '#ef4444',
        DISABLED: '#64748b',
    };
    return colors[status];
}

/**
 * Status icon character for compact display.
 */
export function statusIcon(status: FreshnessStatus): string {
    return { FRESH: '●', STALE: '◐', VERY_STALE: '◑', ERROR: '✕', DISABLED: '○' }[status];
}
