export interface SASTFinding {
    id: string;
    line: number;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    type: string;
    description: string;
    suggestion: string;
    match: string;
}

const SAST_RULES = [
    {
        id: 'SEC-001',
        pattern: /(?:api_key|apikey|secret|token|password)['"]?\s*[:=]\s*['"][a-zA-Z0-9-_\.]+['"]/i,
        type: 'Hardcoded Secret',
        severity: 'CRITICAL',
        description: 'Potential hardcoded secret or API key detected.',
        suggestion: 'Move secrets to environment variables.'
    },
    {
        id: 'SEC-002',
        pattern: /eval\s*\(/i,
        type: 'Dangerous Function',
        severity: 'HIGH',
        description: 'Use of eval() can lead to Remote Code Execution.',
        suggestion: 'Refactor to avoid dynamic code execution.'
    },
    {
        id: 'SEC-003',
        pattern: /dangerouslySetInnerHTML/i,
        type: 'XSS Risk',
        severity: 'HIGH',
        description: 'Direct HTML injection can lead to XSS attacks.',
        suggestion: 'Sanitize input or use safer alternatives.'
    },
    {
        id: 'SEC-004',
        pattern: /http:\/\//i,
        type: 'Insecure Protocol',
        severity: 'MEDIUM',
        description: 'Usage of unencrypted HTTP protocol.',
        suggestion: 'Use HTTPS.'
    },
    {
        id: 'SEC-005',
        pattern: /SELECT\s+\*\s+FROM/i,
        type: 'SQL Injection Risk',
        severity: 'MEDIUM',
        description: 'Unfiltered SQL query detected.',
        suggestion: 'Use parameterized queries.'
    },
    {
        id: 'SEC-006',
        pattern: /console\.log/i,
        type: 'Information Leakage',
        severity: 'LOW',
        description: 'Console logging in production can leak sensitive info.',
        suggestion: 'Remove debug logs.'
    }
];

export function scanCode(code: string): SASTFinding[] {
    const lines = code.split('\n');
    const findings: SASTFinding[] = [];

    lines.forEach((lineContent, index) => {
        const lineNumber = index + 1;

        SAST_RULES.forEach(rule => {
            const match = lineContent.match(rule.pattern); // @ts-ignore
            if (match) {
                findings.push({
                    id: `${rule.id}-${lineNumber}`,
                    line: lineNumber,
                    // @ts-ignore
                    severity: rule.severity,
                    type: rule.type,
                    description: rule.description,
                    suggestion: rule.suggestion,
                    match: lineContent.trim().substring(0, 50) + (lineContent.trim().length > 50 ? '...' : '')
                });
            }
        });
    });

    return findings;
}
