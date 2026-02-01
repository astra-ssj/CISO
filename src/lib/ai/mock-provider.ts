import { AIProvider, AICompletionOptions, AICompletionResult, registerProvider } from './ai-provider';

/**
 * Mock Provider - Used for demos, testing, and when no API keys are configured
 */
class MockProvider implements AIProvider {
    name = 'MOCK';

    isAvailable(): boolean {
        return true; // Always available as fallback
    }

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const lastMessage = options.messages[options.messages.length - 1]?.content.toLowerCase() || '';

        // Context-aware mock responses
        let response = this.generateContextualResponse(lastMessage);

        return {
            content: response,
            provider: this.name,
            model: 'mock-v1',
            tokensUsed: 0
        };
    }

    private generateContextualResponse(input: string): string {
        // Policy Generation
        if (input.includes('policy') || input.includes('draft')) {
            return `# Security Policy Draft

## 1. Purpose
This policy establishes security requirements to protect organizational assets.

## 2. Scope
Applies to all employees, contractors, and third-party vendors.

## 3. Policy Statements
- All access must be authenticated via MFA
- Data must be encrypted at rest and in transit
- Annual security awareness training is mandatory

## 4. Compliance
Violations may result in disciplinary action up to termination.

*[SIMULATION MODE: This is a mock response. Connect a real LLM for dynamic generation.]*`;
        }

        // Risk Analysis
        if (input.includes('risk') || input.includes('threat') || input.includes('vulnerability')) {
            return `## Risk Assessment Summary

**Risk Level**: MEDIUM-HIGH

### Identified Threats
1. **Unauthorized Access** - Probability: High, Impact: Critical
2. **Data Exfiltration** - Probability: Medium, Impact: High
3. **Insider Threat** - Probability: Low, Impact: Critical

### Recommended Controls
- Implement Zero Trust Architecture
- Enable DLP on all egress points
- Conduct quarterly access reviews

*[SIMULATION MODE: Connect a real LLM for context-aware analysis.]*`;
        }

        // Wargame / Scenario
        if (input.includes('wargame') || input.includes('scenario') || input.includes('attack')) {
            return `## 🎮 Wargame Scenario: Operation Shadow Breach

**Threat Actor**: APT-29 (Cozy Bear)
**Attack Vector**: Spear Phishing → Credential Theft → Lateral Movement

### Turn 1: Initial Compromise
An employee in Finance clicked a malicious link. The attacker now has valid credentials.

**Your Move**: What action do you take?
1. Isolate the compromised endpoint
2. Reset all Finance department passwords
3. Enable enhanced monitoring
4. Do nothing (observe)

*[SIMULATION MODE: In real mode, the AI would adapt to your choices.]*`;
        }

        // Default fallback
        return `I've analyzed your request regarding: "${input.slice(0, 50)}..."

As your CISO advisor, I recommend:
1. Document the current state
2. Identify gaps against ISO 27001 controls
3. Prioritize remediation by risk score
4. Implement continuous monitoring

Would you like me to elaborate on any of these points?

*[SIMULATION MODE: Connect an LLM provider for real analysis.]*`;
    }
}

// Auto-register on import
registerProvider(new MockProvider());

export { MockProvider };
