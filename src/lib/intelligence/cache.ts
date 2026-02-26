/**
 * Simple in-memory cache for intelligence API responses.
 * Keys are route identifiers, values are { data, timestamp }.
 * Not shared across workers — acceptable for a single-server deployment.
 */

interface CacheEntry<T = unknown> {
    data: T;
    timestamp: number;
}

const store = new Map<string, CacheEntry>();

/**
 * Get a cached value if it exists and is within the ttl (seconds).
 * Returns `{ hit: true, data, stale: false }` on fresh hit,
 * `{ hit: true, data, stale: true }` if data exists but is expired,
 * `{ hit: false }` if no entry exists.
 */
export function cacheGet<T>(key: string, ttlSeconds: number): { hit: true; data: T; stale: boolean } | { hit: false } {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return { hit: false };
    const age = (Date.now() - entry.timestamp) / 1000;
    return { hit: true, data: entry.data, stale: age > ttlSeconds };
}

/** Store a value in the cache. */
export function cacheSet<T>(key: string, data: T): void {
    store.set(key, { data, timestamp: Date.now() });
}

/** Get the age string of a cached entry (for staleness warnings). */
export function cacheAge(key: string): string {
    const entry = store.get(key);
    if (!entry) return 'never';
    const seconds = Math.round((Date.now() - entry.timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    return `${Math.round(seconds / 3600)}h ago`;
}
