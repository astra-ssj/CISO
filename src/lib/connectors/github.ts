import { logAction } from '@/lib/auth/audit';

export interface SecurityVulnerability {
    id: string;
    repository: string;
    severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    package: string;
    version: string;
    fixedIn: string;
    alertDate: string;
    url: string;
}

export interface GitHubStats {
    totalRepos: number;
    openAlerts: number;
    criticalCount: number;
    dependabotActive: boolean;
}

// Simulated "Real" Data - In production this uses fetch('https://api.github.com/...')
const MOCK_GITHUB_DATA: SecurityVulnerability[] = [
    {
        id: 'GHSA-234-567',
        repository: 'astra-frontend',
        severity: 'CRITICAL',
        package: 'next-auth',
        version: '4.20.1',
        fixedIn: '4.22.1',
        alertDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        url: 'https://github.com/advisories/GHSA-123'
    },
    {
        id: 'GHSA-890-123',
        repository: 'astra-backend',
        severity: 'HIGH',
        package: 'axios',
        version: '0.21.1',
        fixedIn: '0.21.2',
        alertDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        url: 'https://github.com/advisories/GHSA-456'
    },
    {
        id: 'GHSA-456-789',
        repository: 'ops-scripts',
        severity: 'MODERATE',
        package: 'lodash',
        version: '4.17.15',
        fixedIn: '4.17.21',
        alertDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        url: 'https://github.com/advisories/GHSA-789'
    }
];

export class GitHubConnector {
    private token: string | null = null;

    constructor(token?: string) {
        this.token = token || process.env.GITHUB_TOKEN || null;
    }

    async isConnected(): Promise<boolean> {
        // Return true if token exists or if we are in "Demo Mode" (which we are)
        return true;
    }

    async getVulnerabilities(): Promise<SecurityVulnerability[]> {
        // In real impl: 
        // if (!this.token) throw new Error("No Token");
        // const res = await fetch('api.github.com/orgs/astra/dependabot/alerts', ...);

        // Brief simulated delay (keep UI responsive)
        await new Promise(resolve => setTimeout(resolve, 150));

        return MOCK_GITHUB_DATA;
    }

    async getStats(): Promise<GitHubStats> {
        const vulns = await this.getVulnerabilities();
        return {
            totalRepos: 12,
            openAlerts: vulns.length,
            criticalCount: vulns.filter(v => v.severity === 'CRITICAL').length,
            dependabotActive: true
        };
    }

    async syncNow(userId: string) {
        // Log the sync action
        // We can't import user profile here easily without context, so we just take ID
        console.log(`[GitHub] Sync triggered by ${userId}`);
        return true;
    }
}
