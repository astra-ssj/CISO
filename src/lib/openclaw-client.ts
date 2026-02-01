

export type AgentRole = 'user' | 'assistant' | 'system';

export interface ToolExecution {
    tool: string;
    input: string;
    output: string;
    status: 'running' | 'completed' | 'failed';
}

export interface ThinkingStep {
    description: string;
    status: 'pending' | 'active' | 'completed';
}

export interface AgentMessage {
    id: string;
    role: AgentRole;
    content: string;
    thinking?: ThinkingStep[];
    toolExecutions?: ToolExecution[];
    timestamp: number;
}

export class OpenClawClient {
    private mockDelay = 1000;

    /**
     * Mocks sending a message to the OpenClaw agent.
     * Returns a stream of updates (Thinking -> Tool -> Response).
     */
    async *sendMessage(query: string): AsyncGenerator<AgentMessage> {
        const messageId = crypto.randomUUID();
        const timestamp = Date.now();

        // 1. Initial "Thinking" State
        let currentMessage: AgentMessage = {
            id: messageId,
            role: 'assistant',
            content: '',
            thinking: [{ description: 'Analyzing request...', status: 'active' }],
            toolExecutions: [],
            timestamp
        };
        yield { ...currentMessage };
        await this.delay(800);

        // 2. Decide to use a tool (Mock logic based on keywords)
        const isScan = query.toLowerCase().includes('scan') || query.toLowerCase().includes('port');

        if (isScan) {
            // Update thinking
            currentMessage.thinking = [
                { description: 'Analyzing request...', status: 'completed' },
                { description: 'Identified request for network scanning', status: 'active' }
            ];
            yield { ...currentMessage };
            await this.delay(800);

            currentMessage.thinking = [
                { description: 'Analyzing request...', status: 'completed' },
                { description: 'Identified request for network scanning', status: 'completed' },
                { description: 'Selecting tool: Nmap Scanner', status: 'active' }
            ];
            yield { ...currentMessage };
            await this.delay(600);

            // 3. Tool Execution Start
            currentMessage.thinking[2].status = 'completed';
            currentMessage.toolExecutions = [{
                tool: 'nmap',
                input: 'nmap -sV -p 22,80,443 192.168.1.0/24',
                output: '',
                status: 'running'
            }];
            yield { ...currentMessage };
            await this.delay(1500);

            // 4. Tool Execution Complete
            currentMessage.toolExecutions[0].status = 'completed';
            currentMessage.toolExecutions[0].output = `
Starting Nmap 7.94 ( https://nmap.org ) at 2026-02-01 11:05
Nmap scan report for 192.168.1.10
Host is up (0.0023s latency).

PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 8.2p1 Ubuntu
80/tcp  open  http     nginx 1.18.0
443/tcp open  ssl/http nginx 1.18.0

Nmap done: 256 IP addresses (1 host up) scanned in 2.45 seconds
            `.trim();
            yield { ...currentMessage };
            await this.delay(500);

            // 5. Final Response
            currentMessage.content = "I've completed the network scan on the local subnet. One host (192.168.1.10) was found active with ports 22, 80, and 443 open. This appears to be a web server.";
            yield { ...currentMessage };

        } else {
            // Generic response logic
            currentMessage.thinking = [
                { description: 'Analyzing request...', status: 'completed' },
                { description: 'Formulating response', status: 'active' }
            ];
            yield { ...currentMessage };
            await this.delay(1000);

            currentMessage.thinking[1].status = 'completed';
            currentMessage.content = "I can currently help you with network scanning tasks. Try asking me to 'scan the network'.";
            yield { ...currentMessage };
        }
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Agentic Policy Analysis
     * Simulates scanning a policy against active standards.
     */
    async analyzePolicy(policyContent: string, standards: string[]): Promise<{
        riskScore: number;
        gaps: string[];
        recommendations: string[];
    }> {
        await this.delay(2000); // Simulate processing

        const gaps: string[] = [];
        const recommendations: string[] = [];
        let riskScore = 15; // Baseline risk

        // Mock Analysis Logic based on content keywords
        if (!policyContent.toLowerCase().includes('password complexity')) {
            gaps.push('Missing Password Complexity Requirements');
            recommendations.push('Add clause: "Passwords must be 12+ chars with mixed case/symbols"');
            riskScore += 20;
        }

        if (standards.includes('GDPR') && !policyContent.toLowerCase().includes('data breach')) {
            gaps.push('GDPR Art. 33: Missing Data Breach Notification procedure');
            riskScore += 30;
        }

        if (standards.includes('ISO_27001') && !policyContent.toLowerCase().includes('asset inventory')) {
            gaps.push('ISO A.8: Missing Asset Inventory requirements');
            riskScore += 15;
        }

        return {
            riskScore: Math.min(riskScore, 100),
            gaps,
            recommendations
        };
    }
}

export const openClaw = new OpenClawClient();
