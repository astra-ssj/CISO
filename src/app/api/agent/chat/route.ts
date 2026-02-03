import { NextResponse, NextRequest } from 'next/server';
import { ax } from '@/lib/ai/engine';

// System Prompt Definition
const ASTRA_SYSTEM_PROMPT = `You are ASTRA (Authorized Security & Threat Response Agent), an advanced CISO AI assistant.
Your goal is to assist the Chief Information Security Officer (CISO) in managing governance, risk, compliance, and offensive security operations.

### CORE DIRECTIVES:
1.  **Offensive Mindset**: When analyzing assets or vulnerabilities, always think like an attacker. Explain *how* something could be exploited (Exploitability Analysis).
2.  **Governance & Compliance**: You are deeply knowledgeable about ISO 27001, NIST CSF, SOC2, and GDPR. Always map findings to these standards.
3.  **Context Aware**: You have access to the platform's current state. Use the provided context to tailor your answers.
4.  **Operational Maturity**: Be concise, professional, and actionable. Avoid generic fluff.

### AVAILABLE VIRTUAL TOOLS:
You can simulate the execution of the following security tools. To use a tool, generate a JSON object in your response with the following format:
\`\`\`json
{
  "tool": "tool_name",
  "params": { ... }
}
\`\`\`

1.  \`scan_asset(target: string)\`: Simulates an Nmap/Vuln scan on an IP or Host.
2.  \`check_exploitability(cve_id: string, asset_context: string)\`: Returns analysis of a CVE's exploitability (PoC availability, actively exploited in wild).
3.  \`query_compliance(standard: string)\`: Checks current compliance status for a standard.

### RESPONSE FORMAT:
-   If using a tool, output ONLY the tool JSON.
-   Otherwise, answer the user normally.
-   Be helpful and proactive.
`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, history, context } = body;

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Security Check: Verify Auth
        const authCookie = request.cookies.get('astra-auth');
        const authHeader = request.headers.get('Authorization');

        if (authCookie?.value !== 'true' && !authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized Access to Neural Core" }, { status: 401 });
        }

        // Construct Context Block
        const contextBlock = `
### CURRENT SYSTEM CONTEXT:
- **User Role**: ${context?.userRole || 'Unknown'}
- **Current Page**: ${context?.page || 'Dashboard'}
- **System Status**: ${context?.systemStatus || 'NOMINAL'}
- **Active Threats**: ${context?.activeThreats || 0}
`;

        // Using Ax AI
        const chatPrompt = [
            { role: 'system', content: ASTRA_SYSTEM_PROMPT },
            ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: message + contextBlock }
        ];

        const response = await ax.chat({
            chatPrompt
        });

        // Parse Response (Ax returns structured object or string based on config, but here standard chat)
        // With Ax standard chat, it might return a simple string or an object depending on version.
        // The previous code handled string. Let's normalize.
        let finalContent = "";

        if (typeof response === 'string') {
            finalContent = response;
        } else if ('content' in (response as any)) {
            finalContent = (response as any).content;
        } else if ('results' in (response as any)) {
            finalContent = (response as any).results[0].content;
        } else {
            finalContent = JSON.stringify(response);
        }

        // Tool execution logic (Mock for now, similar to before)
        // Ax has advanced tool support, but for V1 migration we keep the prompt-based parsing 
        // to minimize regression risk on the specific internal tool syntax.
        let toolExecution = null;

        try {
            const toolMatch = finalContent.match(/```json\n([\s\S]*?)\n```/);
            if (toolMatch) {
                const toolJson = JSON.parse(toolMatch[1]);
                if (toolJson.tool) {
                    toolExecution = toolJson;
                    const toolResult = executeMockTool(toolJson.tool, toolJson.params);
                    finalContent = `*[ASTRA executing ${toolJson.tool}...]*\n\n> **Tool Output**: ${toolResult}\n\n`;

                    // Simple follow-up
                    const followUp = await ax.chat({
                        chatPrompt: [
                            ...chatPrompt,
                            { role: 'assistant', content: finalContent },
                            { role: 'user', content: "Interpret this tool output and give me the bottom line." }
                        ]
                    });

                    let followUpContent = "";
                    if (typeof followUp === 'string') followUpContent = followUp;
                    else if ('content' in (followUp as any)) followUpContent = (followUp as any).content;

                    finalContent += followUpContent;
                }
            }
        } catch (e) {
            console.log("Tool parsing failed or no tool used", e);
        }

        return NextResponse.json({
            role: 'assistant',
            content: finalContent,
            toolExecution
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Mock Tool Execution Logic
function executeMockTool(tool: string, params: any): string {
    switch (tool) {
        case 'scan_asset':
            return `Nmap Scan Report for ${params.target}:
Host is up (0.002s latency).
PORT    STATE SERVICE VERSION
22/tcp  open  ssh     OpenSSH 8.2p1
80/tcp  open  http    nginx 1.18.0
443/tcp open  https   nginx 1.18.0
Mac Address: AA:BB:CC:DD:EE:FF
OS Details: Linux 5.4.0-150-generic`;

        case 'check_exploitability':
            return `Exploitability Analysis for ${params.cve_id}:
- **PoC Available**: YES (GitHub, ExploitDB)
- **Active Exploitation**: HIGH (Observed in wild by CISA)
- **Attack Vector**: Network (Remote Code Execution)
- **Complexity**: LOW (Script kiddie level)
- **Recommendation**: PATCH IMMEDIATELY. Isolate asset ${params.asset_context} if patching is impossible.`;

        case 'query_compliance':
            return `Compliance Status for ${params.standard}:
- **Overall Score**: 85%
- **Critical Gaps**: 
  1. MFA not enforced on all admin accounts (Identity)
  2. Data at rest encryption inconsistent (S3 Buckets)
- **Status**: AT RISK`;

        default:
            return `Tool ${tool} not found or failed to execute.`;
    }
}
