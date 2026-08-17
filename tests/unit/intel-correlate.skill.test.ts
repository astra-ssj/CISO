import { describe, expect, it } from 'vitest';
import { correlateIntel, runIntelCorrelate, INTEL_CORRELATE_VERSION } from '@/lib/skills/intel-correlate';

describe('skill intel.correlate@1.0.0', () => {
    it('intersects IOCs with vendor domains and asset hosts', () => {
        const out = correlateIntel({
            iocs: ['evil.vendor.example', '198.51.100.9', 'unrelated.io'],
            vendorDomains: ['vendor.example'],
            assetHosts: ['198.51.100.9', 'app.internal'],
        });
        expect(out.hits).toEqual([
            { ioc: '198.51.100.9', against: '198.51.100.9', kind: 'asset_host' },
            { ioc: 'evil.vendor.example', against: 'vendor.example', kind: 'vendor_domain' },
        ]);
    });

    it('is order-insensitive for hashing', () => {
        const a = runIntelCorrelate({
            iocs: ['b.com', 'a.com'],
            vendorDomains: ['a.com'],
            assetHosts: [],
        }, '2026-01-01T00:00:00.000Z');
        const b = runIntelCorrelate({
            iocs: ['a.com', 'b.com'],
            vendorDomains: ['a.com'],
            assetHosts: [],
        }, '2026-01-01T00:00:00.000Z');
        expect(a.skillId).toBe('intel.correlate');
        expect(a.skillVersion).toBe(INTEL_CORRELATE_VERSION);
        expect(a.inputHash).toBe(b.inputHash);
        expect(a.output.hits).toEqual(b.output.hits);
    });
});
