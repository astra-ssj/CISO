import { hashCanonical } from './hash';
import { SKILL_IDS, type SkillRunResult } from './types';

export const EVIDENCE_EXPIRY_VERSION = '1.0.0';

export interface EvidenceExpiryItem {
    id: string;
    title: string;
    status: string;
    expiresAt: string | null;
}

export interface EvidenceExpiryInput {
    asOf: string;
    windowDays: number;
    items: EvidenceExpiryItem[];
}

export interface EvidenceExpiryHit {
    id: string;
    title: string;
    status: string;
    expiresAt: string;
    daysUntil: number;
}

export interface EvidenceExpiryOutput {
    asOf: string;
    windowDays: number;
    expired: EvidenceExpiryHit[];
    expiring: EvidenceExpiryHit[];
    current: number;
    unscored: number;
}

function utcDay(iso: string): number {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return NaN;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function daysBetween(asOfIso: string, expiresIso: string): number {
    const a = utcDay(asOfIso);
    const b = utcDay(expiresIso);
    if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
    return Math.round((b - a) / 86_400_000);
}

/**
 * Deterministic evidence expiry. Clock is an input (`asOf`), never Date.now().
 * Same asOf + same items + same window → same lists.
 */
export function scoreEvidenceExpiry(input: EvidenceExpiryInput): EvidenceExpiryOutput {
    const windowDays = Number.isFinite(input.windowDays) ? Math.max(0, Math.round(input.windowDays)) : 0;
    const expired: EvidenceExpiryHit[] = [];
    const expiring: EvidenceExpiryHit[] = [];
    let current = 0;
    let unscored = 0;

    for (const item of input.items) {
        if (!item.expiresAt) {
            unscored += 1;
            continue;
        }
        const daysUntil = daysBetween(input.asOf, item.expiresAt);
        if (Number.isNaN(daysUntil)) {
            unscored += 1;
            continue;
        }
        const hit: EvidenceExpiryHit = {
            id: item.id,
            title: item.title,
            status: item.status,
            expiresAt: item.expiresAt,
            daysUntil,
        };
        if (daysUntil < 0) expired.push(hit);
        else if (daysUntil <= windowDays) expiring.push(hit);
        else current += 1;
    }

    expired.sort((a, b) => a.daysUntil - b.daysUntil || a.id.localeCompare(b.id));
    expiring.sort((a, b) => a.daysUntil - b.daysUntil || a.id.localeCompare(b.id));

    return {
        asOf: input.asOf,
        windowDays,
        expired,
        expiring,
        current,
        unscored,
    };
}

export function runEvidenceExpiry(input: EvidenceExpiryInput, asOf: string = input.asOf): SkillRunResult<EvidenceExpiryOutput> {
    const output = scoreEvidenceExpiry(input);
    return {
        skillId: SKILL_IDS.EVIDENCE_EXPIRY,
        skillVersion: EVIDENCE_EXPIRY_VERSION,
        inputHash: hashCanonical({
            skillVersion: EVIDENCE_EXPIRY_VERSION,
            asOf: input.asOf,
            windowDays: Number.isFinite(input.windowDays) ? Math.max(0, Math.round(input.windowDays)) : 0,
            items: [...input.items]
                .map((i) => ({
                    id: i.id,
                    title: i.title,
                    status: i.status,
                    expiresAt: i.expiresAt,
                }))
                .sort((a, b) => a.id.localeCompare(b.id)),
        }),
        output,
        asOf,
    };
}
