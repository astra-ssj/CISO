import { hashCanonical } from './hash';
import { SKILL_IDS, type SkillRunResult } from './types';

export const INTEL_CORRELATE_VERSION = '1.0.0';

export interface IntelCorrelateInput {
    iocs: string[];
    vendorDomains: string[];
    assetHosts: string[];
}

export interface IntelCorrelateHit {
    ioc: string;
    against: string;
    kind: 'vendor_domain' | 'asset_host';
}

export interface IntelCorrelateOutput {
    hits: IntelCorrelateHit[];
    iocCount: number;
    vendorCount: number;
    assetCount: number;
}

function norm(value: string): string {
    return value.trim().toLowerCase();
}

function matches(ioc: string, target: string): boolean {
    const a = norm(ioc);
    const b = norm(target);
    if (!a || !b) return false;
    return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`) || a.includes(b) || b.includes(a);
}

/**
 * Set intersection of snapshot IOCs against vendor domains / attack-surface hosts.
 * No live fetch. Same lists → same hits.
 */
export function correlateIntel(input: IntelCorrelateInput): IntelCorrelateOutput {
    const iocs = [...new Set(input.iocs.map(norm).filter(Boolean))].sort();
    const vendors = [...new Set(input.vendorDomains.map(norm).filter(Boolean))].sort();
    const assets = [...new Set(input.assetHosts.map(norm).filter(Boolean))].sort();
    const hits: IntelCorrelateHit[] = [];

    for (const ioc of iocs) {
        for (const domain of vendors) {
            if (matches(ioc, domain)) {
                hits.push({ ioc, against: domain, kind: 'vendor_domain' });
            }
        }
        for (const host of assets) {
            if (matches(ioc, host)) {
                hits.push({ ioc, against: host, kind: 'asset_host' });
            }
        }
    }

    hits.sort((a, b) => a.ioc.localeCompare(b.ioc) || a.against.localeCompare(b.against) || a.kind.localeCompare(b.kind));

    return {
        hits,
        iocCount: iocs.length,
        vendorCount: vendors.length,
        assetCount: assets.length,
    };
}

export function runIntelCorrelate(input: IntelCorrelateInput, asOf: string = '1970-01-01T00:00:00.000Z'): SkillRunResult<IntelCorrelateOutput> {
    const output = correlateIntel(input);
    return {
        skillId: SKILL_IDS.INTEL_CORRELATE,
        skillVersion: INTEL_CORRELATE_VERSION,
        inputHash: hashCanonical({
            skillVersion: INTEL_CORRELATE_VERSION,
            iocs: [...input.iocs].map(norm).filter(Boolean).sort(),
            vendorDomains: [...input.vendorDomains].map(norm).filter(Boolean).sort(),
            assetHosts: [...input.assetHosts].map(norm).filter(Boolean).sort(),
        }),
        output,
        asOf,
    };
}
