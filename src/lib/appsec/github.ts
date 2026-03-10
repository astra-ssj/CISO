"use server";

import { AppSecFinding, Severity } from './types';

const GITHUB_API_URL = 'https://api.github.com';

function getHeaders() {
    const token = process.env.NEXT_PUBLIC_GITHUB_PAT || process.env.GITHUB_PAT;
    if (!token) {
        throw new Error("GitHub PAT (Personal Access Token) is not configured in .env.local");
    }
    return {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
    };
}

interface DependabotAlert {
    number: number;
    created_at: string;
    security_advisory?: {
        summary?: string;
        description?: string;
        severity?: string;
        cwe_ids?: string[];
        patched_versions?: string;
    };
    dependency?: {
        package?: { name?: string };
        manifest_path?: string;
    };
}

export async function fetchDependabotAlerts(owner: string, repo: string): Promise<AppSecFinding[]> {
    try {
        const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=100`;
        const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });

        if (!res.ok) {
            console.error(`Dependabot API Error: ${res.status} ${res.statusText}`);
            return [];
        }

        const alerts = await res.json();

        return alerts.map((alert: DependabotAlert) => {
            let severity: Severity = 'LOW';
            const ghSeverity = alert.security_advisory?.severity || 'low';
            if (ghSeverity === 'critical') severity = 'CRITICAL';
            if (ghSeverity === 'high') severity = 'HIGH';
            if (ghSeverity === 'medium') severity = 'MEDIUM';

            return {
                id: `dependabot-${alert.number}`,
                type: 'SCA' as const,
                severity,
                title: alert.security_advisory?.summary || 'Dependabot Alert',
                description: alert.security_advisory?.description || 'A dependency vulnerability was found.',
                tool: 'Dependabot',
                cwe: alert.security_advisory?.cwe_ids?.[0], // e.g. "CWE-400"
                detectedAt: alert.created_at,
                remediation: `Upgrade ${alert.dependency?.package?.name} to ${alert.security_advisory?.patched_versions || 'latest'}`,
                file: alert.dependency?.manifest_path
            };
        });

    } catch (e) {
        console.error("Failed to fetch Dependabot alerts", e);
        return [];
    }
}

interface SecretAlert {
    number: number;
    secret_type?: string;
    created_at: string;
}

export async function fetchSecretScanningAlerts(owner: string, repo: string): Promise<AppSecFinding[]> {
    try {
        const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/secret-scanning/alerts?state=open&per_page=100`;
        const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });

        if (!res.ok) {
            console.error(`Secret Scanning API Error: ${res.status} ${res.statusText}`);
            return [];
        }

        const alerts = await res.json();

        return alerts.map((alert: SecretAlert) => ({
            id: `github-secret-${alert.number}`,
            type: 'SECRET' as const,
            severity: 'CRITICAL', // GitHub secrets are universally critical
            title: `Exposed ${alert.secret_type || 'Secret'}`,
            description: `GitHub detected an exposed ${alert.secret_type} in the repository.`,
            tool: 'GitHub Secret Scanning',
            detectedAt: alert.created_at,
            remediation: "Revoke the secret immediately and rotate credentials."
        }));

    } catch (e) {
        console.error("Failed to fetch Secret Scanning alerts", e);
        return [];
    }
}
