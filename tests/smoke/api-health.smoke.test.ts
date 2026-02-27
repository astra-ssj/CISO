/**
 * Smoke test — All API endpoints respond
 * Verifies every API route handler exists and exports expected HTTP methods.
 */

import { describe, it, expect, vi } from 'vitest';

// ── Mock intelligence clients ───────────────────────────────────
vi.mock('@/lib/intelligence/clients/opencti-client', () => {
    class M { getActiveCampaigns = vi.fn().mockResolvedValue([]); getThreatActors = vi.fn().mockResolvedValue([]); getRecentIndicators = vi.fn().mockResolvedValue([]); getAttackHeatmap = vi.fn().mockResolvedValue([]); search = vi.fn().mockResolvedValue([]); healthCheck = vi.fn().mockResolvedValue({}); getStats = vi.fn().mockResolvedValue({}); }
    return { OpenCTIClient: M };
});
vi.mock('@/lib/intelligence/clients/misp-client', () => {
    class M { getFeedStatus = vi.fn().mockResolvedValue({ feeds: [], active: 0 }); getFeeds = vi.fn().mockResolvedValue([]); searchAttributes = vi.fn().mockResolvedValue([]); healthCheck = vi.fn().mockResolvedValue({}); getStats = vi.fn().mockResolvedValue({}); }
    return { MISPClient: M };
});
vi.mock('@/lib/intelligence/clients/abusech-client', () => {
    class M { getRecentIOCs = vi.fn().mockResolvedValue([]); getRecentMaliciousURLs = vi.fn().mockResolvedValue([]); getRecentMalware = vi.fn().mockResolvedValue([]); searchIOC = vi.fn().mockResolvedValue([]); lookupURL = vi.fn().mockResolvedValue({ query_status: 'no_results' }); lookupHash = vi.fn().mockResolvedValue({ query_status: 'no_results' }); }
    return { AbuseCHClient: M };
});
vi.mock('@/lib/intelligence/clients/shodan-client', () => ({ shodanClient: { isConfigured: vi.fn(() => false), lookupIP: vi.fn().mockResolvedValue({}), resolveDomains: vi.fn().mockResolvedValue({}), getOrgExposure: vi.fn().mockResolvedValue({ hosts: [], total: 0 }), checkHealth: vi.fn().mockResolvedValue({ configured: false }) } }));
vi.mock('@/lib/intelligence/cache', () => ({ cacheGet: vi.fn(() => ({ hit: false, data: null, stale: false })), cacheSet: vi.fn(), cacheAge: vi.fn(() => 0) }));
vi.mock('@/lib/intelligence/data-freshness', () => ({ recordUpdate: vi.fn(), recordError: vi.fn(), getSourceStatus: vi.fn(() => ({})), getAllSourceStatuses: vi.fn(() => ({})) }));

// ── Route definitions ───────────────────────────────────────────
const apiRoutes = [
    // Health & Admin
    { path: '@/app/api/health/route', methods: ['GET'] },
    { path: '@/app/api/admin/metrics/route', methods: ['GET'] },
    // Auth
    { path: '@/app/api/auth/login/route', methods: ['POST'] },
    // CAIQ
    { path: '@/app/api/caiq/parse/route', methods: ['POST'] },
    { path: '@/app/api/caiq/enhance/route', methods: ['POST'] },
    { path: '@/app/api/caiq/export/route', methods: ['POST'] },
    // Evidence
    { path: '@/app/api/evidence/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/evidence/stats/route', methods: ['GET'] },
    // Intelligence
    { path: '@/app/api/intelligence/dashboard/route', methods: ['GET'] },
    { path: '@/app/api/intelligence/threats/route', methods: ['GET'] },
    { path: '@/app/api/intelligence/enrich/route', methods: ['POST'] },
    { path: '@/app/api/intelligence/feeds/route', methods: ['GET'] },
    { path: '@/app/api/intelligence/health/route', methods: ['GET'] },
    { path: '@/app/api/intelligence/stats/route', methods: ['GET'] },
    { path: '@/app/api/intelligence/threatfox/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/intelligence/urlhaus/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/intelligence/malware/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/intelligence/shodan/route', methods: ['POST'] },
    { path: '@/app/api/intelligence/threats/classify/route', methods: ['POST'] },
    // Governance
    { path: '@/app/api/policies/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/risks/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/playbooks/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/okr/route', methods: ['GET'] },
    { path: '@/app/api/knowledge/route', methods: ['GET'] },
    { path: '@/app/api/notifications/route', methods: ['GET'] },
    { path: '@/app/api/audit-logs/route', methods: ['GET'] },
    // Vendor & Admin
    { path: '@/app/api/vendor-list/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/vendor-risk/route', methods: ['GET'] },
    { path: '@/app/api/team/users/route', methods: ['GET'] },
    { path: '@/app/api/team/invite/route', methods: ['POST'] },
    { path: '@/app/api/companies/route', methods: ['GET', 'POST'] },
    { path: '@/app/api/products/route', methods: ['GET', 'POST'] },
    // Agent
    { path: '@/app/api/agent/analyze/route', methods: ['POST'] },
    { path: '@/app/api/agent/chat/route', methods: ['POST'] },
    { path: '@/app/api/agent/generate-policy/route', methods: ['POST'] },
];

describe('Smoke: All API endpoints respond', () => {
    for (const route of apiRoutes) {
        const label = route.path.replace('@/app/api/', '/api/').replace('/route', '');
        it(`${label} exports ${route.methods.join('/')}`, async () => {
            const mod = await import(/* @vite-ignore */ route.path);
            for (const method of route.methods) {
                expect(mod[method], `Missing ${method} at ${label}`).toBeDefined();
            }
        });
    }
});
