import { NextResponse, NextRequest } from 'next/server';
import { getProvider } from '@/lib/ai';

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
        // In a real app, rely on specific headers or strictly validated cookies
        const authCookie = request.cookies.get('astra-auth');
        const authHeader = request.headers.get('Authorization');

        if (authCookie?.value !== 'true' && !authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized Access to Neural Core" }, { status: 401 });
        }

        const provider = getProvider();

        // Construct Context Block
        const contextBlock = `
### CURRENT SYSTEM CONTEXT:
- **User Role**: ${context?.userRole || 'Unknown'}
- **Current Page**: ${context?.page || 'Dashboard'}
- **System Status**: ${context?.systemStatus || 'NOMINAL'}
- **Active Threats**: ${context?.activeThreats || 0}
`;

        const messages = [
            ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: message + contextBlock }
        ];

        // Streaming is preferred for chat, but starting with simple request/response for stability in V1 integration
        const response = await provider.complete({
            systemPrompt: ASTRA_SYSTEM_PROMPT,
            messages: messages,
            maxTokens: 1000,
            temperature: 0.7
        });

        // Simple Tool Parsing Logic (for V1 Mock/Simulation)
        // In a real agent, this would be a loop or recursive call
        let finalContent = response.content;
        let toolExecution = null;

        // Attempt to detect tool call
        try {
            const toolMatch = finalContent.match(/```json\n([\s\S]*?)\n```/);
            if (toolMatch) {
                const toolJson = JSON.parse(toolMatch[1]);
                if (toolJson.tool) {
                    toolExecution = toolJson;
                    // Execute "Tool" (Mock Logic)
                    const toolResult = executeMockTool(toolJson.tool, toolJson.params);
                    // Append result to content for the user to see (or for a 2nd LLM pass - keeping simple for now)
                    finalContent = `*[ASTRA executing ${toolJson.tool}...]*\n\n> **Tool Output**: ${toolResult}\n\n`;

                    // Optional: Do a second pass to interpret the result? 
                    // For now, return the result directly as part of the answer.
                    const followUp = await provider.complete({
                        systemPrompt: ASTRA_SYSTEM_PROMPT,
                        messages: [
                            ...messages,
                            { role: 'assistant', content: finalContent },
                            { role: 'user', content: "Interpret this tool output and give me the bottom line." }
                        ]
                    });
                    finalContent += followUp.content;
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
