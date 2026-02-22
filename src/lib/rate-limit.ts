/**
 * In-memory rate limiter for single-instance deployment.
 * For multi-instance, use Redis (e.g. @upstash/ratelimit) instead.
 */

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

interface Entry {
    count: number;
    resetAt: number;
}

const store = new Map<string, Entry>();

const WINDOW_MS = 60_000; // 1 minute

function now(): number {
    return Date.now();
}

function prune(key: string, resetAt: number): void {
    if (now() >= resetAt) {
        store.delete(key);
    }
}

/**
 * Check and consume one request for the given key.
 * @param key - Identifier (e.g. IP address)
 * @param limit - Max requests per window
 * @returns success false if over limit; remaining count; resetAt timestamp
 */
export function rateLimit(key: string, limit: number): RateLimitResult {
    const n = now();
    let entry = store.get(key);

    if (!entry) {
        entry = { count: 1, resetAt: n + WINDOW_MS };
        store.set(key, entry);
        return {
            success: true,
            remaining: Math.max(0, limit - 1),
            resetAt: entry.resetAt,
        };
    }

    prune(key, entry.resetAt);
    entry = store.get(key);
    if (!entry) {
        entry = { count: 1, resetAt: n + WINDOW_MS };
        store.set(key, entry);
        return {
            success: true,
            remaining: Math.max(0, limit - 1),
            resetAt: entry.resetAt,
        };
    }

    if (entry.count >= limit) {
        return {
            success: false,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    entry.count += 1;
    return {
        success: true,
        remaining: Math.max(0, limit - entry.count),
        resetAt: entry.resetAt,
    };
}

export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;
    return '127.0.0.1';
}
