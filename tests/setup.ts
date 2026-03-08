/**
 * Global test setup for Astra-CISO v2.0
 * Loaded by vitest before every test file.
 */

import { vi } from 'vitest';

// ─── DOM matchers (toBeInTheDocument, etc.) ─────────────────────────
import '@testing-library/jest-dom/vitest';

// ─── Mock next/navigation ───────────────────────────────────────────
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
}));

// ─── Mock next/headers ──────────────────────────────────────────────
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(() => false),
        getAll: vi.fn(() => []),
    }),
    headers: () => new Map(),
}));

// ─── Mock @/auth ────────────────────────────────────────────────────
vi.mock('@/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@astra.local',
            role: 'admin',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
    }),
    signIn: vi.fn(),
    signOut: vi.fn(),
}));

// ─── Mock @/lib/prisma ──────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
    default: {
        $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
        $executeRaw: vi.fn().mockResolvedValue(0),
        $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
        user: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        risk: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        policy: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        evidence: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        auditLog: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        notification: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        vendor: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        vendorAssessment: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        playbook: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        company: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        product: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        knowledgeEntry: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        knowledgeOverride: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
        alertRule: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
    },
}));

// ─── Mock audit service ─────────────────────────────────────────────
vi.mock('@/lib/audit/audit-service', () => ({
    logAudit: vi.fn().mockResolvedValue(undefined),
    getRequestIp: vi.fn(() => '127.0.0.1'),
    getRequestUserAgent: vi.fn(() => 'vitest'),
}));

// ─── Mock AI circuit breaker ────────────────────────────────────────
vi.mock('@/lib/ai/circuit-breaker', () => ({
    getAllCircuitBreakerMetrics: vi.fn(() => [
        { provider: 'mock', state: 'closed', failures: 0, lastFailure: null },
    ]),
}));

// ─── Env defaults for testing ───────────────────────────────────────
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-key-for-vitest';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
