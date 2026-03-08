/**
 * Test utilities for Astra-CISO v2.0 smoke tests.
 */

import React, { type ReactElement } from 'react';
import { NextRequest } from 'next/server';

// ─── API Test Helpers ───────────────────────────────────────────────

/**
 * Create a mock NextRequest for API route testing.
 */
export function mockNextRequest(
    url: string,
    options: {
        method?: string;
        body?: unknown;
        headers?: Record<string, string>;
        searchParams?: Record<string, string>;
    } = {},
): NextRequest {
    const { method = 'GET', body, headers = {}, searchParams } = options;
    const fullUrl = new URL(url, 'http://localhost:3000');
    if (searchParams) {
        for (const [k, v] of Object.entries(searchParams)) {
            fullUrl.searchParams.set(k, v);
        }
    }

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
        init.body = JSON.stringify(body);
    }

    return new NextRequest(fullUrl, init as any);
}

/**
 * Create a plain Request object for simpler route handlers that expect Request.
 */
export function mockRequest(
    url: string,
    options: {
        method?: string;
        body?: unknown;
        headers?: Record<string, string>;
    } = {},
): Request {
    const { method = 'GET', body, headers = {} } = options;
    const fullUrl = new URL(url, 'http://localhost:3000').toString();

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
        init.body = JSON.stringify(body);
    }

    return new Request(fullUrl, init);
}

/**
 * Parse a NextResponse body to JSON.
 */
export async function parseResponse<T = unknown>(response: Response): Promise<{ status: number; body: T }> {
    const status = response.status;
    const text = await response.text();
    let body: T;
    try {
        body = JSON.parse(text) as T;
    } catch {
        body = text as unknown as T;
    }
    return { status, body };
}

// ─── UI Test Helpers ────────────────────────────────────────────────

/**
 * Wrapper component for rendering with providers.
 * Extend this as needed with theme/store providers.
 */
export function TestWrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

/**
 * Custom render function that wraps components with TestWrapper.
 * Only available in jsdom environment.
 */
export async function renderWithProviders(ui: ReactElement) {
    const { render } = await import('@testing-library/react');
    return render(ui, { wrapper: TestWrapper });
}
