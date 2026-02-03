

export type AgentRole = 'user' | 'assistant' | 'system';

export interface ToolExecution {
    tool: string;
    input: string;
    output: string;
    status: 'running' | 'completed' | 'failed';
}

export interface ThinkingStep {
    description: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
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
    async *sendMessage(query: string, context: any = {}): AsyncGenerator<AgentMessage> {
        const messageId = crypto.randomUUID();
        const timestamp = Date.now();

        // 1. Initial "Thinking" State
        const currentMessage: AgentMessage = {
            id: messageId,
            role: 'assistant',
            content: '',
            thinking: [{ description: 'Analyzing request...', status: 'active' }],
            toolExecutions: [],
            timestamp
        };
        yield { ...currentMessage };

        try {
            // Call the Server-Side Agent API
            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: query,
                    history: [], // In V2 send full history
                    context: {
                        page: window.location.pathname,
                        userRole: 'CISO',
                        systemStatus: 'NOMINAL', // In real app, get from store
                        ...context
                    }
                })
            });

            if (!response.ok) throw new Error('Agent API failed');

            const data = await response.json();

            // Simulate "Thinking" completion
            currentMessage.thinking = [
                { description: 'Analyzing request...', status: 'completed' },
                { description: 'Consulting Knowledge Base', status: 'completed' }
            ];
            yield { ...currentMessage };

            // Handle Tool Execution if present in response
            if (data.toolExecution) {
                currentMessage.thinking.push({
                    description: `Executing tool: ${data.toolExecution.tool}`,
                    status: 'active'
                });
                yield { ...currentMessage };
                await this.delay(1000); // UI visual delay

                currentMessage.thinking[2].status = 'completed';
                currentMessage.toolExecutions = [{
                    tool: data.toolExecution.tool,
                    input: JSON.stringify(data.toolExecution.params),
                    output: "Detailed output processed by Agent.",
                    status: 'completed'
                }];
                yield { ...currentMessage };
            }

            // Final Response
            currentMessage.content = data.content;
            yield { ...currentMessage };

        } catch (error) {
            console.error("Agent Error:", error);
            currentMessage.thinking?.push({ description: 'Error connecting to ASTRA Core', status: 'failed' });
            currentMessage.content = "I'm having trouble connecting to my core intelligence. Please try again.";
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
