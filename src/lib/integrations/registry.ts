/**
 * Integration Registry — source of truth for all 24 integrations.
 * Defines categories, metadata, config schemas, and setup steps.
 * Phase 1 integrations have full connect/test functionality.
 * Others show "Coming Soon" state.
 */

import { z } from 'zod';

export type IntegrationCategory =
    | 'identity'
    | 'collaboration'
    | 'ticketing'
    | 'cloud'
    | 'cicd'
    | 'scanning'
    | 'email'
    | 'grc'
    | 'threat-intel'
    | 'other';

export interface IntegrationField {
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'password' | 'url' | 'email' | 'select';
    required?: boolean;
    options?: { label: string; value: string }[]; // for select type
    hint?: string;
}

export interface IntegrationStep {
    title: string;
    description: string;
    fields?: IntegrationField[];
    copyValue?: { label: string; value: string }; // e.g., callback URL to copy
    action?: {
        label: string;
        url?: string; // for external_link
        actionType: 'external_link' | 'test' | 'none';
    };
}

export interface IntegrationDefinition {
    id: string;
    name: string;
    description: string;
    category: IntegrationCategory;
    logo: string;   // emoji
    popular?: boolean;
    phase1: boolean; // full functionality in v2.1
    configSchema: z.ZodObject<z.ZodRawShape>;
    steps: IntegrationStep[];
    docsUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY & SSO (4)
// ─────────────────────────────────────────────────────────────────────────────

const azureAd: IntegrationDefinition = {
    id: 'azure-ad',
    name: 'Azure AD / Entra ID',
    description: 'SSO via SAML 2.0 / OIDC + SCIM user provisioning',
    category: 'identity',
    logo: '🔷',
    popular: true,
    phase1: true,
    configSchema: z.object({
        tenantId: z.string().min(1, 'Tenant ID is required'),
        clientId: z.string().min(1, 'Client ID is required'),
        clientSecret: z.string().min(1, 'Client Secret is required'),
    }),
    steps: [
        {
            title: 'Register App in Azure',
            description:
                'In Azure Portal → Azure Active Directory → App registrations, create a new app registration for Astra CISO.',
            action: {
                label: 'Open Azure Portal',
                url: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
                actionType: 'external_link',
            },
        },
        {
            title: 'Configure Redirect URI',
            description: 'In your app registration → Authentication, add the following Redirect URI:',
            copyValue: {
                label: 'Redirect URI',
                value: `${process.env.NEXTAUTH_URL || 'https://your-domain.com'}/api/auth/callback/azure-ad`,
            },
        },
        {
            title: 'Enter Credentials',
            description: 'Copy your Tenant ID, Client ID, and Client Secret from the Azure app registration.',
            fields: [
                { key: 'tenantId', label: 'Tenant ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text', required: true },
                { key: 'clientId', label: 'Client ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text', required: true },
                { key: 'clientSecret', label: 'Client Secret', placeholder: 'Enter client secret value', type: 'password', required: true },
            ],
        },
        {
            title: 'Test Connection',
            description: 'Verify that Astra CISO can reach the Azure AD token endpoint.',
            action: { label: 'Test Connection', actionType: 'test' },
        },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/entra/identity/app-provisioning',
};

const okta: IntegrationDefinition = {
    id: 'okta',
    name: 'Okta',
    description: 'SSO via SAML 2.0 / OIDC + lifecycle management',
    category: 'identity',
    logo: '🔵',
    popular: true,
    phase1: true,
    configSchema: z.object({
        domain: z.string().min(1, 'Okta domain is required'),
        clientId: z.string().min(1, 'Client ID is required'),
        clientSecret: z.string().min(1, 'Client Secret is required'),
    }),
    steps: [
        {
            title: 'Create Okta Application',
            description: 'In your Okta Admin Console → Applications → Create App Integration → OIDC Web Application.',
            action: { label: 'Open Okta Admin', url: 'https://developer.okta.com/login', actionType: 'external_link' },
        },
        {
            title: 'Configure Redirect',
            description: 'Set the Sign-in redirect URI to:',
            copyValue: {
                label: 'Sign-in Redirect URI',
                value: `${process.env.NEXTAUTH_URL || 'https://your-domain.com'}/api/auth/callback/okta`,
            },
        },
        {
            title: 'Enter Credentials',
            description: 'Enter your Okta domain and OIDC application credentials.',
            fields: [
                { key: 'domain', label: 'Okta Domain', placeholder: 'yourorg.okta.com', type: 'text', required: true },
                { key: 'clientId', label: 'Client ID', placeholder: 'Your OIDC Client ID', type: 'text', required: true },
                { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your Client Secret', type: 'password', required: true },
            ],
        },
        {
            title: 'Test Connection',
            description: 'Verify connectivity to the Okta OIDC discovery endpoint.',
            action: { label: 'Test Connection', actionType: 'test' },
        },
    ],
};

const google: IntegrationDefinition = {
    id: 'google',
    name: 'Google Workspace',
    description: 'SSO via OAuth 2.0, domain-restricted login',
    category: 'identity',
    logo: '🔴',
    popular: true,
    phase1: true,
    configSchema: z.object({
        clientId: z.string().min(1, 'Client ID is required'),
        clientSecret: z.string().min(1, 'Client Secret is required'),
        allowedDomain: z.string().optional(),
    }),
    steps: [
        {
            title: 'Create Google OAuth Client',
            description: 'In Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID.',
            action: { label: 'Open Google Cloud Console', url: 'https://console.cloud.google.com/apis/credentials', actionType: 'external_link' },
        },
        {
            title: 'Configure Redirect URI',
            description: 'Add the following Authorized Redirect URI in your OAuth client:',
            copyValue: {
                label: 'Redirect URI',
                value: `${process.env.NEXTAUTH_URL || 'https://your-domain.com'}/api/auth/callback/google`,
            },
        },
        {
            title: 'Enter Credentials',
            description: 'Paste your Google OAuth credentials. Optionally restrict login to your company domain.',
            fields: [
                { key: 'clientId', label: 'Client ID', placeholder: '123456789-xxx.apps.googleusercontent.com', type: 'text', required: true },
                { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your client secret', type: 'password', required: true },
                { key: 'allowedDomain', label: 'Allowed Domain', placeholder: 'yourcompany.com (leave blank for any)', type: 'text', required: false, hint: 'Restrict SSO to this domain' },
            ],
        },
        {
            title: 'Test Connection',
            description: 'Verify that the Google OAuth client ID is valid.',
            action: { label: 'Test Connection', actionType: 'test' },
        },
    ],
};

const jumpcloud: IntegrationDefinition = {
    id: 'jumpcloud',
    name: 'JumpCloud',
    description: 'Directory, SSO, and SCIM user lifecycle',
    category: 'identity',
    logo: '🟠',
    phase1: false,
    configSchema: z.object({ apiKey: z.string() }),
    steps: [
        { title: 'Configure JumpCloud', description: 'Full support coming in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATION (4)
// ─────────────────────────────────────────────────────────────────────────────

const slack: IntegrationDefinition = {
    id: 'slack',
    name: 'Slack',
    description: 'Security alerts, digests, and slash commands',
    category: 'collaboration',
    logo: '💬',
    popular: true,
    phase1: true,
    configSchema: z.object({
        webhookUrl: z.string().url('Must be a valid Slack Webhook URL'),
        channel: z.string().optional(),
    }),
    steps: [
        {
            title: 'Create Incoming Webhook',
            description: 'In your Slack workspace, create an Incoming Webhook for the channel where Astra CISO should post alerts.',
            action: { label: 'Create Slack Webhook', url: 'https://api.slack.com/messaging/webhooks', actionType: 'external_link' },
        },
        {
            title: 'Enter Webhook URL',
            description: 'Paste the webhook URL generated by Slack.',
            fields: [
                { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/T.../B.../...', type: 'url', required: true },
                { key: 'channel', label: 'Channel Name', placeholder: '#security-alerts (optional display reference)', type: 'text', required: false },
            ],
        },
        {
            title: 'Test Connection',
            description: 'Send a test message to verify the webhook is working.',
            action: { label: 'Send Test Message', actionType: 'test' },
        },
    ],
};

const teams: IntegrationDefinition = {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Adaptive cards and security notifications',
    category: 'collaboration',
    logo: '🟣',
    phase1: false,
    configSchema: z.object({ webhookUrl: z.string().url() }),
    steps: [{ title: 'Configure Teams', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

const emailSmtp: IntegrationDefinition = {
    id: 'email-smtp',
    name: 'Email (SMTP)',
    description: 'Custom SMTP server for security alerts and reports',
    category: 'collaboration',
    logo: '📧',
    popular: true,
    phase1: true,
    configSchema: z.object({
        host: z.string().min(1),
        port: z.number().int().min(1).max(65535),
        user: z.string().min(1),
        password: z.string().min(1),
        fromName: z.string().optional(),
        fromEmail: z.string().email(),
        tls: z.boolean().optional(),
    }),
    steps: [
        {
            title: 'SMTP Server Details',
            description: 'Enter your outgoing email server credentials. These will be used for alerts, invite emails, and policy reminders.',
            fields: [
                { key: 'host', label: 'SMTP Host', placeholder: 'smtp.yourprovider.com', type: 'text', required: true },
                { key: 'port', label: 'Port', placeholder: '587', type: 'text', required: true, hint: '587 (TLS), 465 (SSL), 25 (plain)' },
                { key: 'user', label: 'Username', placeholder: 'you@yourcompany.com', type: 'email', required: true },
                { key: 'password', label: 'Password', placeholder: 'SMTP password', type: 'password', required: true },
                { key: 'fromName', label: 'From Name', placeholder: 'Astra CISO', type: 'text', required: false },
                { key: 'fromEmail', label: 'From Email', placeholder: 'security@yourcompany.com', type: 'email', required: true },
            ],
        },
        {
            title: 'Test Connection',
            description: 'Send a test email to verify SMTP connectivity.',
            action: { label: 'Send Test Email', actionType: 'test' },
        },
    ],
};

const pagerduty: IntegrationDefinition = {
    id: 'pagerduty',
    name: 'PagerDuty',
    description: 'On-call escalation and incident routing',
    category: 'collaboration',
    logo: '🚨',
    phase1: false,
    configSchema: z.object({ apiKey: z.string(), serviceKey: z.string() }),
    steps: [{ title: 'Configure PagerDuty', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

// ─────────────────────────────────────────────────────────────────────────────
// TICKETING & ITSM (3)
// ─────────────────────────────────────────────────────────────────────────────

const jira: IntegrationDefinition = {
    id: 'jira',
    name: 'Jira Cloud',
    description: 'Bi-directional incident and vulnerability ticket sync',
    category: 'ticketing',
    logo: '🔷',
    popular: true,
    phase1: true,
    configSchema: z.object({
        domain: z.string().min(1, 'Jira domain is required (e.g. yourorg.atlassian.net)'),
        email: z.string().email('Must be a valid email'),
        apiToken: z.string().min(1, 'API token is required'),
        project: z.string().optional(),
    }),
    steps: [
        {
            title: 'Create API Token',
            description: 'Create a Jira API token from your Atlassian account settings.',
            action: { label: 'Create Jira API Token', url: 'https://id.atlassian.com/manage-profile/security/api-tokens', actionType: 'external_link' },
        },
        {
            title: 'Enter Credentials',
            description: 'Enter your Jira Cloud domain and API token.',
            fields: [
                { key: 'domain', label: 'Jira Domain', placeholder: 'yourorg.atlassian.net', type: 'text', required: true },
                { key: 'email', label: 'Account Email', placeholder: 'you@yourcompany.com', type: 'email', required: true },
                { key: 'apiToken', label: 'API Token', placeholder: 'Your Jira API token', type: 'password', required: true },
                { key: 'project', label: 'Default Project', placeholder: 'PROJ (optional)', type: 'text', required: false, hint: 'Issues will be created in this project by default' },
            ],
        },
        {
            title: 'Test Connection',
            description: 'Verify that Astra CISO can reach your Jira instance.',
            action: { label: 'Test Connection', actionType: 'test' },
        },
    ],
};

const servicenow: IntegrationDefinition = {
    id: 'servicenow',
    name: 'ServiceNow',
    description: 'ITSM, CMDB sync, and change management',
    category: 'ticketing',
    logo: '🟢',
    phase1: false,
    configSchema: z.object({ instance: z.string(), username: z.string(), password: z.string() }),
    steps: [{ title: 'Configure ServiceNow', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

const linear: IntegrationDefinition = {
    id: 'linear',
    name: 'Linear',
    description: 'Modern issue tracking for engineering teams',
    category: 'ticketing',
    logo: '⚡',
    phase1: false,
    configSchema: z.object({ apiKey: z.string() }),
    steps: [{ title: 'Configure Linear', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

// ─────────────────────────────────────────────────────────────────────────────
// CLOUD SECURITY (3)
// ─────────────────────────────────────────────────────────────────────────────

const aws: IntegrationDefinition = {
    id: 'aws',
    name: 'AWS SecurityHub',
    description: 'Findings from GuardDuty, Inspector, and IAM',
    category: 'cloud',
    logo: '🟡',
    phase1: false,
    configSchema: z.object({ accessKeyId: z.string(), secretAccessKey: z.string(), region: z.string() }),
    steps: [{ title: 'Configure AWS', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

const azureSentinel: IntegrationDefinition = {
    id: 'azure-sentinel',
    name: 'Azure Sentinel',
    description: 'SIEM alerts and incident correlation',
    category: 'cloud',
    logo: '🔷',
    phase1: false,
    configSchema: z.object({ tenantId: z.string(), clientId: z.string(), clientSecret: z.string(), workspaceId: z.string() }),
    steps: [{ title: 'Configure Azure Sentinel', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

const gcpScc: IntegrationDefinition = {
    id: 'gcp-scc',
    name: 'GCP Security Command Center',
    description: 'Google Cloud security findings and asset inventory',
    category: 'cloud',
    logo: '🔴',
    phase1: false,
    configSchema: z.object({ projectId: z.string(), serviceAccountKey: z.string() }),
    steps: [{ title: 'Configure GCP SCC', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

// ─────────────────────────────────────────────────────────────────────────────
// CI/CD & DEVOPS (3)
// ─────────────────────────────────────────────────────────────────────────────

const github: IntegrationDefinition = {
    id: 'github',
    name: 'GitHub',
    description: 'Dependabot alerts, CodeQL, secret scanning, SBOM',
    category: 'cicd',
    logo: '🐙',
    popular: true,
    phase1: true,
    configSchema: z.object({
        personalAccessToken: z.string().min(1, 'Personal Access Token is required'),
        organization: z.string().optional(),
        repository: z.string().optional(),
    }),
    steps: [
        {
            title: 'Create Personal Access Token',
            description: 'Create a GitHub PAT with read access to repository security alerts.',
            action: { label: 'Create GitHub PAT', url: 'https://github.com/settings/tokens/new?scopes=security_events,read:org', actionType: 'external_link' },
        },
        {
            title: 'Enter Token',
            description: 'Enter your GitHub PAT and optionally scope it to a specific org or repo.',
            fields: [
                { key: 'personalAccessToken', label: 'Personal Access Token', placeholder: 'ghp_xxxxxxxxxxxx', type: 'password', required: true },
                { key: 'organization', label: 'Organization', placeholder: 'your-org (optional)', type: 'text', required: false },
                { key: 'repository', label: 'Repository', placeholder: 'your-org/repo (optional — use for specific repo)', type: 'text', required: false },
            ],
        },
        {
            title: 'Test Connection',
            description: 'Verify that the token has access to the GitHub API.',
            action: { label: 'Test Connection', actionType: 'test' },
        },
    ],
};

const gitlab: IntegrationDefinition = {
    id: 'gitlab',
    name: 'GitLab',
    description: 'SAST/DAST, dependency scanning, pipeline security',
    category: 'cicd',
    logo: '🦊',
    phase1: false,
    configSchema: z.object({ token: z.string(), projectId: z.string() }),
    steps: [{ title: 'Configure GitLab', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

const jenkins: IntegrationDefinition = {
    id: 'jenkins',
    name: 'Jenkins',
    description: 'Build gates and pipeline security integration',
    category: 'cicd',
    logo: '🤖',
    phase1: false,
    configSchema: z.object({ url: z.string().url(), username: z.string(), apiToken: z.string() }),
    steps: [{ title: 'Configure Jenkins', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

// ─────────────────────────────────────────────────────────────────────────────
// VULNERABILITY SCANNING (3)
// ─────────────────────────────────────────────────────────────────────────────

const trivy: IntegrationDefinition = {
    id: 'trivy',
    name: 'Trivy',
    description: 'Container and filesystem vulnerability scanning',
    category: 'scanning',
    logo: '🔍',
    popular: true,
    phase1: true,
    configSchema: z.object({
        scanTarget: z.string().optional(),
        severityLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    }),
    steps: [
        {
            title: 'Install Trivy',
            description: 'Trivy must be installed on the server running Astra CISO.',
            action: { label: 'Trivy Installation Guide', url: 'https://trivy.dev/latest/getting-started/installation/', actionType: 'external_link' },
        },
        {
            title: 'Configure Scan Target',
            description: 'Set a default scan target (container image or filesystem path). You can override this per scan.',
            fields: [
                { key: 'scanTarget', label: 'Default Scan Target', placeholder: 'nginx:latest or /app', type: 'text', required: false },
                {
                    key: 'severityLevel', label: 'Minimum Severity', placeholder: 'HIGH', type: 'select', required: false,
                    options: [
                        { label: 'CRITICAL only', value: 'CRITICAL' },
                        { label: 'HIGH and above', value: 'HIGH' },
                        { label: 'MEDIUM and above', value: 'MEDIUM' },
                        { label: 'LOW and above', value: 'LOW' },
                    ]
                },
            ],
        },
        {
            title: 'Test Connection',
            description: 'Verify that the trivy binary is installed and accessible.',
            action: { label: 'Check Trivy Binary', actionType: 'test' },
        },
    ],
};

const nessus: IntegrationDefinition = {
    id: 'nessus',
    name: 'Nessus / Tenable',
    description: 'Network vulnerability scanning and CVSS prioritization',
    category: 'scanning',
    logo: '🛡️',
    phase1: false,
    configSchema: z.object({ apiKey: z.string(), secretKey: z.string(), url: z.string().url() }),
    steps: [{ title: 'Configure Nessus', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

const qualys: IntegrationDefinition = {
    id: 'qualys',
    name: 'Qualys',
    description: 'Cloud agent, VMDR, and compliance scanning',
    category: 'scanning',
    logo: '🔴',
    phase1: false,
    configSchema: z.object({ username: z.string(), password: z.string(), platform: z.string() }),
    steps: [{ title: 'Configure Qualys', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL & NOTIFICATIONS (2)
// ─────────────────────────────────────────────────────────────────────────────

const sendgrid: IntegrationDefinition = {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional email for alerts and reports',
    category: 'email',
    logo: '📨',
    phase1: false,
    configSchema: z.object({ apiKey: z.string(), fromEmail: z.string().email() }),
    steps: [{ title: 'Configure SendGrid', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

const ses: IntegrationDefinition = {
    id: 'ses',
    name: 'AWS SES',
    description: 'High-volume alert emails via Amazon SES',
    category: 'email',
    logo: '📮',
    phase1: false,
    configSchema: z.object({ region: z.string(), accessKeyId: z.string(), secretAccessKey: z.string(), fromEmail: z.string().email() }),
    steps: [{ title: 'Configure AWS SES', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

// ─────────────────────────────────────────────────────────────────────────────
// GRC & COMPLIANCE (2)
// ─────────────────────────────────────────────────────────────────────────────

const vanta: IntegrationDefinition = {
    id: 'vanta',
    name: 'Vanta',
    description: 'Evidence sync and control mapping for SOC 2, ISO 27001',
    category: 'grc',
    logo: '✅',
    phase1: false,
    configSchema: z.object({ apiToken: z.string() }),
    steps: [{ title: 'Configure Vanta', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

const drata: IntegrationDefinition = {
    id: 'drata',
    name: 'Drata',
    description: 'Automated evidence collection and compliance monitoring',
    category: 'grc',
    logo: '🏆',
    phase1: false,
    configSchema: z.object({ apiKey: z.string() }),
    steps: [{ title: 'Configure Drata', description: 'Coming soon in v2.2.', action: { label: 'Request This Integration', actionType: 'none' } }],
};

// ─────────────────────────────────────────────────────────────────────────────
// THREAT INTELLIGENCE PLATFORMS (2)
// ─────────────────────────────────────────────────────────────────────────────

const opencti: IntegrationDefinition = {
    id: 'opencti',
    name: 'OpenCTI',
    description: 'Cyber threat intelligence platform — campaigns, actors, IOCs, MITRE ATT&CK',
    category: 'threat-intel',
    logo: '🔷',
    popular: true,
    phase1: true,
    configSchema: z.object({
        url: z.string().url('Must be a valid URL'),
        apiToken: z.string().min(1, 'API Token is required'),
    }),
    steps: [
        {
            title: 'Deploy OpenCTI',
            description: 'Run docker compose -f docker-compose.yml -f docker-compose.intel.yml up -d to start the OpenCTI stack.',
            action: { label: 'View Docker Guide', actionType: 'none' },
        },
        {
            title: 'Get API Token',
            description: 'Open http://localhost:8080, login as admin (admin@opencti.io / changeme), go to Settings → Parameters → API Access → Copy token.',
            fields: [
                { key: 'url', label: 'OpenCTI URL', placeholder: 'http://localhost:8080', type: 'url', required: true },
                { key: 'apiToken', label: 'API Token', placeholder: 'your-opencti-token', type: 'password', required: true },
            ],
        },
        {
            title: 'Verify Connectors',
            description: 'Check that MITRE ATT&CK, CVE, and AlienVault connectors are running in OpenCTI → Data → Connectors.',
            action: { label: 'Open Connectors', url: 'http://localhost:8080/dashboard/data/connectors', actionType: 'external_link' },
        },
        {
            title: 'Test Connection',
            description: 'Verify that Astra CISO can reach the OpenCTI GraphQL API and data is flowing.',
            action: { label: 'Test Connection', actionType: 'test' },
        },
    ],
    docsUrl: 'https://docs.opencti.io/latest/',
};

const misp: IntegrationDefinition = {
    id: 'misp',
    name: 'MISP',
    description: 'Threat intelligence sharing platform — IOC feeds, community events, STIX/TAXII',
    category: 'threat-intel',
    logo: '🟢',
    popular: true,
    phase1: true,
    configSchema: z.object({
        url: z.string().url('Must be a valid URL'),
        apiKey: z.string().min(1, 'API Key is required'),
    }),
    steps: [
        {
            title: 'Deploy MISP',
            description: 'MISP is included in docker-compose.intel.yml and should already be running on port 8443.',
            action: { label: 'Open MISP', url: 'https://localhost:8443', actionType: 'external_link' },
        },
        {
            title: 'Get API Key',
            description: 'Login to MISP (admin@admin.test / admin), go to Administration → Auth Keys → Add Authentication Key.',
            fields: [
                { key: 'url', label: 'MISP URL', placeholder: 'https://localhost:8443', type: 'url', required: true },
                { key: 'apiKey', label: 'API Key', placeholder: 'your-misp-api-key', type: 'password', required: true },
            ],
        },
        {
            title: 'Enable Feeds',
            description: 'Go to Sync Actions → Feeds → Enable recommended feeds (CIRCL, abuse.ch, AlienVault OTX).',
            action: { label: 'Open Feed Manager', url: 'https://localhost:8443/feeds/index', actionType: 'external_link' },
        },
        {
            title: 'Test Connection',
            description: 'Verify that feeds are being ingested and events are visible.',
            action: { label: 'Test Connection', actionType: 'test' },
        },
    ],
    docsUrl: 'https://www.misp-project.org/documentation/',
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const INTEGRATIONS_REGISTRY: IntegrationDefinition[] = [
    // Identity & SSO
    azureAd, okta, google, jumpcloud,
    // Collaboration
    slack, teams, emailSmtp, pagerduty,
    // Ticketing & ITSM
    jira, servicenow, linear,
    // Cloud Security
    aws, azureSentinel, gcpScc,
    // CI/CD & DevOps
    github, gitlab, jenkins,
    // Vulnerability Scanning
    trivy, nessus, qualys,
    // Email & Notifications
    sendgrid, ses,
    // GRC & Compliance
    vanta, drata,
    // Threat Intelligence Platforms
    opencti, misp,
];

export interface CategoryMeta {
    id: IntegrationCategory;
    label: string;
    icon: string;
}

export const INTEGRATION_CATEGORIES: CategoryMeta[] = [
    { id: 'identity', label: 'Identity & SSO', icon: '🔐' },
    { id: 'collaboration', label: 'Collaboration', icon: '💬' },
    { id: 'ticketing', label: 'Ticketing & ITSM', icon: '🎫' },
    { id: 'cloud', label: 'Cloud Security', icon: '☁️' },
    { id: 'cicd', label: 'CI/CD & DevOps', icon: '🔄' },
    { id: 'scanning', label: 'Vulnerability Scanning', icon: '🔍' },
    { id: 'email', label: 'Email & Notifications', icon: '📧' },
    { id: 'grc', label: 'GRC & Compliance', icon: '✅' },
    { id: 'threat-intel', label: 'Threat Intelligence', icon: '🛡️' },
];

export function getIntegration(id: string): IntegrationDefinition | undefined {
    return INTEGRATIONS_REGISTRY.find((i) => i.id === id);
}
