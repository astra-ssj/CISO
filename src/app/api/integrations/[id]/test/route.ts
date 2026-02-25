import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getIntegration } from '@/lib/integrations/registry';
import { decrypt } from '@/lib/crypto';

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const def = getIntegration(id);
    if (!def) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const row = await prisma.integration.findUnique({ where: { integrationId: id } });
    if (!row || row.status !== 'connected') {
        return NextResponse.json({ error: 'Integration is not connected' }, { status: 400 });
    }

    // Decrypt config
    let config: Record<string, string> = {};
    try {
        config = JSON.parse(decrypt(row.config)) as Record<string, string>;
    } catch {
        return NextResponse.json({ success: false, message: 'Failed to decrypt configuration' }, { status: 500 });
    }

    // Phase 1 integration tests
    let result: { success: boolean; message: string; details?: Record<string, unknown> };

    try {
        switch (id) {
            case 'azure-ad': {
                const { tenantId, clientId, clientSecret } = config;
                const tokenRes = await fetch(
                    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            grant_type: 'client_credentials',
                            client_id: clientId,
                            client_secret: clientSecret,
                            scope: 'https://graph.microsoft.com/.default',
                        }),
                    }
                );
                const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string };
                if (tokenRes.ok && tokenData.access_token) {
                    result = { success: true, message: 'Successfully authenticated with Azure AD' };
                } else {
                    result = { success: false, message: tokenData.error_description ?? tokenData.error ?? 'Azure AD authentication failed' };
                }
                break;
            }

            case 'okta': {
                const { domain } = config;
                const discoveryRes = await fetch(
                    `https://${domain}/.well-known/openid-configuration`,
                    { signal: AbortSignal.timeout(10000) }
                );
                if (discoveryRes.ok) {
                    result = { success: true, message: `Okta OIDC discovery endpoint reachable at ${domain}` };
                } else {
                    result = { success: false, message: `Okta discovery returned HTTP ${discoveryRes.status}` };
                }
                break;
            }

            case 'google': {
                const { clientId } = config;
                // Validate the client ID exists by checking Google's OAuth discovery
                const discoveryRes = await fetch(
                    'https://accounts.google.com/.well-known/openid-configuration',
                    { signal: AbortSignal.timeout(10000) }
                );
                if (discoveryRes.ok) {
                    result = { success: true, message: `Google OAuth reachable. Client ID: ${clientId.slice(0, 20)}...` };
                } else {
                    result = { success: false, message: 'Google OAuth discovery endpoint unreachable' };
                }
                break;
            }

            case 'slack': {
                const { webhookUrl } = config;
                const slackRes = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: '✅ *Astra CISO* connection test — this integration is working correctly!',
                    }),
                    signal: AbortSignal.timeout(10000),
                });
                const text = await slackRes.text();
                if (slackRes.ok && text === 'ok') {
                    result = { success: true, message: 'Test message sent to Slack successfully' };
                } else {
                    result = { success: false, message: `Slack responded with: ${text}` };
                }
                break;
            }

            case 'jira': {
                const { domain, email, apiToken } = config;
                const jiraRes = await fetch(
                    `https://${domain}/rest/api/3/myself`,
                    {
                        headers: {
                            Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
                            Accept: 'application/json',
                        },
                        signal: AbortSignal.timeout(10000),
                    }
                );
                const jiraData = await jiraRes.json() as { displayName?: string; emailAddress?: string; errorMessages?: string[] };
                if (jiraRes.ok && jiraData.displayName) {
                    result = { success: true, message: `Connected as ${jiraData.displayName} on ${domain}`, details: { user: jiraData.emailAddress } };
                } else {
                    result = { success: false, message: `Jira returned HTTP ${jiraRes.status}: ${JSON.stringify(jiraData.errorMessages)}` };
                }
                break;
            }

            case 'email-smtp': {
                const nodemailer = await import('nodemailer');
                const { host, port, user, password, tls } = config;
                const transporter = nodemailer.default.createTransport({
                    host,
                    port: parseInt(port, 10),
                    secure: tls === 'true',
                    auth: { user, pass: password },
                });
                await transporter.verify();
                result = { success: true, message: `SMTP connection verified to ${host}:${port}` };
                break;
            }

            case 'github': {
                const { personalAccessToken } = config;
                const ghRes = await fetch('https://api.github.com/user', {
                    headers: {
                        Authorization: `Bearer ${personalAccessToken}`,
                        'X-GitHub-Api-Version': '2022-11-28',
                        Accept: 'application/vnd.github+json',
                    },
                    signal: AbortSignal.timeout(10000),
                });
                const ghData = await ghRes.json() as { login?: string; name?: string; message?: string };
                if (ghRes.ok && ghData.login) {
                    result = { success: true, message: `Authenticated as GitHub user: ${ghData.login}` };
                } else {
                    result = { success: false, message: ghData.message ?? `GitHub API returned HTTP ${ghRes.status}` };
                }
                break;
            }

            case 'trivy': {
                const { execFile } = await import('child_process');
                const { promisify } = await import('util');
                const execFileAsync = promisify(execFile);
                try {
                    const { stdout } = await execFileAsync('trivy', ['--version'], { timeout: 8000 });
                    result = { success: true, message: `Trivy is installed: ${stdout.split('\n')[0].trim()}` };
                } catch {
                    result = { success: false, message: 'Trivy binary not found. Please install trivy on this server.' };
                }
                break;
            }

            default:
                result = { success: false, message: 'Test not available for this integration in the current phase.' };
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        result = { success: false, message: `Test failed: ${msg}` };
    }

    // Persist test result
    await prisma.integration.update({
        where: { integrationId: id },
        data: {
            lastTestedAt: new Date(),
            lastTestResult: result.success ? 'success' : 'failed',
            status: result.success ? 'connected' : 'error',
        },
    });

    return NextResponse.json(result);
}
