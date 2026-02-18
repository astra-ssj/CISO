// Jira Cloud REST API v3 Connector
// Supports both online (real Jira) and offline (local queue) modes

export interface JiraConfig {
    baseUrl: string;        // e.g., https://your-org.atlassian.net
    email: string;          // Jira account email
    apiToken: string;       // Jira API token
    projectKey: string;     // e.g., SEC
}

export interface JiraIssue {
    key?: string;           // Jira issue key (e.g., SEC-123) — set after creation
    summary: string;
    description: string;
    issueType: string;
    priority: string;
    labels: string[];
    assignee?: string;
    customFields?: Record<string, unknown>;
}

export interface JiraCreateResponse {
    id: string;
    key: string;
    self: string;
}

export class JiraConnector {
    private config: JiraConfig | null = null;

    configure(config: JiraConfig) {
        this.config = config;
    }

    isConfigured(): boolean {
        return !!(this.config?.baseUrl && this.config?.email && this.config?.apiToken);
    }

    private getAuthHeader(): string {
        if (!this.config) throw new Error('Jira not configured');
        return 'Basic ' + btoa(`${this.config.email}:${this.config.apiToken}`);
    }

    async testConnection(): Promise<{ ok: boolean; message: string }> {
        if (!this.isConfigured()) {
            return { ok: false, message: 'Jira credentials not configured' };
        }
        try {
            const res = await fetch(`${this.config!.baseUrl}/rest/api/3/myself`, {
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Accept': 'application/json',
                },
            });
            if (res.ok) {
                const user = await res.json();
                return { ok: true, message: `Connected as ${user.displayName}` };
            }
            return { ok: false, message: `Auth failed: ${res.status} ${res.statusText}` };
        } catch (error) {
            return { ok: false, message: `Connection error: ${(error as Error).message}` };
        }
    }

    async createIssue(issue: JiraIssue): Promise<JiraCreateResponse> {
        if (!this.isConfigured()) {
            throw new Error('Jira not configured. Tickets are saved locally.');
        }

        const body = {
            fields: {
                project: { key: this.config!.projectKey },
                summary: issue.summary,
                description: {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: issue.description }],
                        },
                    ],
                },
                issuetype: { name: issue.issueType },
                priority: { name: this.mapPriority(issue.priority) },
                labels: issue.labels,
            },
        };

        const res = await fetch(`${this.config!.baseUrl}/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                'Authorization': this.getAuthHeader(),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Jira API error: ${res.status} — ${err}`);
        }

        return res.json();
    }

    async getIssue(issueKey: string): Promise<unknown> {
        if (!this.isConfigured()) throw new Error('Jira not configured');

        const res = await fetch(`${this.config!.baseUrl}/rest/api/3/issue/${issueKey}`, {
            headers: {
                'Authorization': this.getAuthHeader(),
                'Accept': 'application/json',
            },
        });

        if (!res.ok) throw new Error(`Failed to fetch issue: ${res.status}`);
        return res.json();
    }

    async listProjects(): Promise<{ key: string; name: string }[]> {
        if (!this.isConfigured()) return [];

        try {
            const res = await fetch(`${this.config!.baseUrl}/rest/api/3/project`, {
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Accept': 'application/json',
                },
            });
            if (!res.ok) return [];
            const projects = await res.json();
            return projects.map((p: any) => ({ key: p.key, name: p.name }));
        } catch {
            return [];
        }
    }

    private mapPriority(priority: string): string {
        const map: Record<string, string> = {
            'CRITICAL': 'Highest',
            'HIGH': 'High',
            'MEDIUM': 'Medium',
            'LOW': 'Low',
        };
        return map[priority] || 'Medium';
    }
}

// Singleton instance
export const jiraConnector = new JiraConnector();
