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

/**
 * GitHub Dependabot connector.
 * Without GITHUB_TOKEN this returns empty — never demo GHSA rows.
 */
export class GitHubConnector {
    private token: string | null = null;

    constructor(token?: string) {
        this.token = token || process.env.GITHUB_TOKEN || null;
    }

    async isConnected(): Promise<boolean> {
        return Boolean(this.token);
    }

    async getVulnerabilities(): Promise<SecurityVulnerability[]> {
        if (!this.token) return [];
        try {
            const res = await fetch('https://api.github.com/orgs/astra/dependabot/alerts?state=open&per_page=50', {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
                signal: AbortSignal.timeout(15_000),
            });
            if (!res.ok) return [];
            const data = await res.json() as Array<{
                number: number;
                html_url: string;
                created_at: string;
                security_advisory?: { ghsa_id?: string; severity?: string };
                security_vulnerability?: {
                    package?: { name?: string };
                    vulnerable_version_range?: string;
                    first_patched_version?: { identifier?: string };
                };
                dependency?: { manifest_path?: string };
            }>;
            return data.map((alert) => ({
                id: alert.security_advisory?.ghsa_id || `GHSA-${alert.number}`,
                repository: alert.dependency?.manifest_path || 'unknown',
                severity: (alert.security_advisory?.severity?.toUpperCase() || 'LOW') as SecurityVulnerability['severity'],
                package: alert.security_vulnerability?.package?.name || 'unknown',
                version: alert.security_vulnerability?.vulnerable_version_range || '',
                fixedIn: alert.security_vulnerability?.first_patched_version?.identifier || '',
                alertDate: alert.created_at,
                url: alert.html_url,
            }));
        } catch {
            console.warn('[GitHub] getVulnerabilities — empty (live fetch failed, no mock)');
            return [];
        }
    }

    async getStats(): Promise<GitHubStats> {
        const vulns = await this.getVulnerabilities();
        return {
            totalRepos: 0,
            openAlerts: vulns.length,
            criticalCount: vulns.filter((v) => v.severity === 'CRITICAL').length,
            dependabotActive: Boolean(this.token),
        };
    }

    async syncNow(userId: string) {
        console.log(`[GitHub] Sync triggered by ${userId}`);
        return this.getVulnerabilities();
    }
}
