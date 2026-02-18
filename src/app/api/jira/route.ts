import { NextResponse } from 'next/server';
import { jiraConnector, JiraIssue } from '@/lib/jira/jira-connector';

// Initialize connector from env vars if available
function initConnector() {
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;
    const projectKey = process.env.JIRA_PROJECT_KEY || 'SEC';

    if (baseUrl && email && apiToken) {
        jiraConnector.configure({ baseUrl, email, apiToken, projectKey });
    }
}

// GET /api/jira — Check connection status
export async function GET() {
    initConnector();

    if (!jiraConnector.isConfigured()) {
        return NextResponse.json({
            connected: false,
            message: 'Jira not configured. Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN env vars.',
            mode: 'LOCAL',
        });
    }

    const result = await jiraConnector.testConnection();
    return NextResponse.json({
        connected: result.ok,
        message: result.message,
        mode: result.ok ? 'CONNECTED' : 'ERROR',
    });
}

// POST /api/jira — Create a Jira issue
export async function POST(request: Request) {
    initConnector();

    try {
        const body = await request.json() as JiraIssue;

        if (!jiraConnector.isConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Jira not configured. Ticket saved locally only.',
                mode: 'LOCAL',
            }, { status: 503 });
        }

        const result = await jiraConnector.createIssue(body);
        return NextResponse.json({
            success: true,
            key: result.key,
            id: result.id,
            self: result.self,
            mode: 'SYNCED',
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message,
            mode: 'FAILED',
        }, { status: 500 });
    }
}
