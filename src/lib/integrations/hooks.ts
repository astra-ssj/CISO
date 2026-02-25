'use client';

/**
 * Client-side hooks for the Integration Hub.
 * Used by modules throughout the app to check integration status
 * and conditionally show integration-specific actions.
 */

import { useState, useEffect, useCallback } from 'react';

export interface IntegrationStatus {
    id: string;
    name: string;
    category: string;
    status: 'available' | 'connected' | 'error';
    logo: string;
    popular: boolean;
    phase1: boolean;
    connectedAt: string | null;
    lastTestResult: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// useIntegrationStatus — overall status for all integrations
// ─────────────────────────────────────────────────────────────────────────────

export function useIntegrationStatus() {
    const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [connectedCount, setConnectedCount] = useState(0);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/integrations');
            if (!res.ok) return;
            const data = await res.json() as { integrations: IntegrationStatus[] };
            setIntegrations(data.integrations);
            setConnectedCount(data.integrations.filter((i) => i.status === 'connected').length);
        } catch {
            // silent
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { integrations, connectedCount, isLoading, refresh };
}

// ─────────────────────────────────────────────────────────────────────────────
// useIntegration — per-integration hook with connect/disconnect/test actions
// ─────────────────────────────────────────────────────────────────────────────

interface UseIntegrationReturn {
    status: 'available' | 'connected' | 'error';
    connected: boolean;
    isLoading: boolean;
    isTesting: boolean;
    testResult: { success: boolean; message: string } | null;
    connect: (config: Record<string, unknown>) => Promise<boolean>;
    disconnect: () => Promise<boolean>;
    test: () => Promise<{ success: boolean; message: string }>;
    refresh: () => void;
}

export function useIntegration(id: string): UseIntegrationReturn {
    const [status, setStatus] = useState<'available' | 'connected' | 'error'>('available');
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/integrations/${id}`);
            if (!res.ok) return;
            const data = await res.json() as { status: 'available' | 'connected' | 'error' };
            setStatus(data.status);
        } catch {
            // silent
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) void refresh();
    }, [id, refresh]);

    const connect = useCallback(async (config: Record<string, unknown>): Promise<boolean> => {
        try {
            const res = await fetch(`/api/integrations/${id}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config }),
            });
            if (res.ok) {
                setStatus('connected');
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [id]);

    const disconnect = useCallback(async (): Promise<boolean> => {
        try {
            const res = await fetch(`/api/integrations/${id}/disconnect`, { method: 'POST' });
            if (res.ok) {
                setStatus('available');
                setTestResult(null);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [id]);

    const test = useCallback(async (): Promise<{ success: boolean; message: string }> => {
        setIsTesting(true);
        try {
            const res = await fetch(`/api/integrations/${id}/test`, { method: 'POST' });
            const result = await res.json() as { success: boolean; message: string };
            setTestResult(result);
            setStatus(result.success ? 'connected' : 'error');
            return result;
        } catch (err) {
            const result = { success: false, message: err instanceof Error ? err.message : 'Test failed' };
            setTestResult(result);
            return result;
        } finally {
            setIsTesting(false);
        }
    }, [id]);

    return {
        status,
        connected: status === 'connected',
        isLoading,
        isTesting,
        testResult,
        connect,
        disconnect,
        test,
        refresh,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// isIntegrationConnected — simple synchronous check using cached status
// ─────────────────────────────────────────────────────────────────────────────

export function isIntegrationConnected(
    integrations: IntegrationStatus[],
    id: string
): boolean {
    return integrations.some((i) => i.id === id && i.status === 'connected');
}
