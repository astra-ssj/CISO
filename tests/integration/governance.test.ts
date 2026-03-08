/**
 * Integration tests — Governance (compliance & risk management)
 * Tests governance API route handlers: policies, risks, playbooks.
 */

import { describe, it, expect } from 'vitest';

// ── Route exports ───────────────────────────────────────────────
describe('Integration: Governance — Policies', () => {
    it('/api/policies exports GET and POST', async () => {
        const mod = await import('@/app/api/policies/route');
        expect(mod.GET).toBeDefined();
        expect(mod.POST).toBeDefined();
    });

    it('/api/policies/[id] exports handlers', async () => {
        const mod = (await import('@/app/api/policies/[id]/route')) as any;
        const hasHandler = mod.GET || mod.PUT || mod.PATCH || mod.DELETE;
        expect(hasHandler).toBeTruthy();
    });
});

describe('Integration: Governance — Risks', () => {
    it('/api/risks exports GET and POST', async () => {
        const mod = await import('@/app/api/risks/route');
        expect(mod.GET).toBeDefined();
        expect(mod.POST).toBeDefined();
    });

    it('/api/risks/[id] exports handlers', async () => {
        const mod = (await import('@/app/api/risks/[id]/route')) as any;
        const hasHandler = mod.GET || mod.PUT || mod.PATCH || mod.DELETE;
        expect(hasHandler).toBeTruthy();
    });
});

describe('Integration: Governance — Playbooks', () => {
    it('/api/playbooks exports GET and POST', async () => {
        const mod = await import('@/app/api/playbooks/route');
        expect(mod.GET).toBeDefined();
        expect(mod.POST).toBeDefined();
    });

    it('/api/playbooks/[id] exports handlers', async () => {
        const mod = (await import('@/app/api/playbooks/[id]/route')) as any;
        const hasHandler = mod.GET || mod.PUT || mod.PATCH || mod.DELETE;
        expect(hasHandler).toBeTruthy();
    });
});

describe('Integration: Governance — OKR', () => {
    it('/api/okr exports GET', async () => {
        const mod = await import('@/app/api/okr/route');
        expect(mod.GET).toBeDefined();
    });

    it('/api/okr/objectives/[id] exports handlers', async () => {
        const mod = (await import('@/app/api/okr/objectives/[id]/route')) as any;
        const hasHandler = mod.GET || mod.PUT || mod.PATCH || mod.DELETE;
        expect(hasHandler).toBeTruthy();
    });
});

describe('Integration: Governance — Knowledge', () => {
    it('/api/knowledge exports GET', async () => {
        const mod = await import('@/app/api/knowledge/route');
        expect(mod.GET).toBeDefined();
    });

    it('/api/knowledge/import exports POST', async () => {
        const mod = await import('@/app/api/knowledge/import/route');
        expect(mod.POST).toBeDefined();
    });

    it('/api/knowledge/ingest exports POST', async () => {
        const mod = await import('@/app/api/knowledge/ingest/route');
        expect(mod.POST).toBeDefined();
    });
});

describe('Integration: Governance — Notifications', () => {
    it('/api/notifications exports GET', async () => {
        const mod = await import('@/app/api/notifications/route');
        expect(mod.GET).toBeDefined();
    });

    it('/api/notifications/alert-rules/[id] exports PATCH', async () => {
        const mod = await import('@/app/api/notifications/alert-rules/[id]/route');
        expect(mod.PATCH).toBeDefined();
    });
});

describe('Integration: Governance — Audit Logs', () => {
    it('/api/audit-logs exports GET', async () => {
        const mod = await import('@/app/api/audit-logs/route');
        expect(mod.GET).toBeDefined();
    });

    it('/api/audit-logs/stats exports GET', async () => {
        const mod = await import('@/app/api/audit-logs/stats/route');
        expect(mod.GET).toBeDefined();
    });

    it('/api/audit-logs/export exports handler', async () => {
        const mod = (await import('@/app/api/audit-logs/export/route')) as any;
        const hasHandler = mod.GET || mod.POST;
        expect(hasHandler).toBeTruthy();
    });
});
