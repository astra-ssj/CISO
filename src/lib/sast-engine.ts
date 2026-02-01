export interface SASTFinding {
    id: string;
    type: 'SAST' | 'SCA' | 'SECRET'; // Added SCA and SECRET
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    line: number;
    description: string;
    match: string;
    suggestion: string;
    cwe?: string; // Added CWE support
    package?: string; // For SCA
    version?: string; // For SCA
}

const SAST_RULES = [
    {
        regex: /dangerouslySetInnerHTML/,
        severity: 'CRITICAL',
        description: 'Direct DOM manipulation detected. High risk of XSS attacks.',
        suggestion: 'Use safe React rendering or sanitize input with DOMPurify.',
        cwe: 'CWE-79'
    },
    {
        regex: /eval\(/,
        severity: 'CRITICAL',
        description: 'Use of eval() detected. Code injection risk.',
        suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse() or specific algorithms.',
        cwe: 'CWE-95'
    },
    {
        regex: /localStorage\.getItem/,
        severity: 'LOW',
        description: 'Sensitive data might be stored in localStorage.',
        suggestion: 'Ensure no PII/Secrets are stored. Use secure cookies for auth tokens.',
        cwe: 'CWE-922'
    },
    {
        regex: /apikey|password|secret|token/i,
        severity: 'HIGH',
        description: 'Potential hardcoded secret detected in variable name.',
        suggestion: 'Use environment variables (process.env) for secrets.',
        cwe: 'CWE-798'
    },
    {
        regex: /console\.log/,
        severity: 'LOW',
        description: 'Console log found. Information leakage risk in production.',
        suggestion: 'Remove console logs or use a logger that disables in production.',
        cwe: 'CWE-532'
    },
    {
        regex: /http:\/\//,
        severity: 'MEDIUM',
        description: 'Insecure HTTP URL detected.',
        suggestion: 'Use HTTPS for all external communications.',
        cwe: 'CWE-319'
    }
];

const SECRET_PATTERNS = [
    {
        regex: /AKIA[0-9A-Z]{16}/,
        type: 'AWS Access Key',
        severity: 'CRITICAL'
    },
    {
        regex: /AIza[0-9A-Za-z-_]{35}/,
        type: 'Google API Key',
        severity: 'HIGH'
    },
    {
        regex: /sk_live_[0-9a-zA-Z]{24}/,
        type: 'Stripe Secret Key',
        severity: 'CRITICAL'
    },
    {
        regex: /ghp_[0-9a-zA-Z]{36}/,
        type: 'GitHub Personal Access Token',
        severity: 'CRITICAL'
    }
];

const SCA_DATABASE: Record<string, { severity: string, description: string, fixedIn: string }> = {
    "react-scripts": {
        severity: "HIGH",
        description: "Vulnerable to cross-site scripting in development server.",
        fixedIn: "5.0.1"
    },
    "lodash": {
        severity: "MEDIUM",
        description: "Prototype pollution vulnerability in defaultsDeep.",
        fixedIn: "4.17.21"
    },
    "axios": {
        severity: "HIGH",
        description: "Server-Side Request Forgery (SSRF) in node.js environments.",
        fixedIn: "1.6.0"
    },
    "express": {
        severity: "MEDIUM",
        description: "QS parameter parsing vulnerability.",
        fixedIn: "4.18.2"
    },
    "log4j": {
        severity: "CRITICAL",
        description: "Remote Code Execution (RCE) via JNDI injection (Log4Shell).",
        fixedIn: "2.17.0"
    }
};

export const scanCode = (code: string): SASTFinding[] => {
    const findings: SASTFinding[] = [];
    const lines = code.split('\n');

    lines.forEach((lineContent, index) => {
        const lineNum = index + 1;

        // 1. Run SAST Rules
        SAST_RULES.forEach(rule => {
            if (rule.regex.test(lineContent)) {
                findings.push({
                    id: `SAST-${Date.now()}-${Math.random()}`,
                    type: 'SAST',
                    severity: rule.severity as any,
                    line: lineNum,
                    description: rule.description,
                    match: lineContent.trim().substring(0, 100),
                    suggestion: rule.suggestion,
                    cwe: rule.cwe
                });
            }
        });

        // 2. Run Secret Detection
        SECRET_PATTERNS.forEach(pattern => {
            const match = lineContent.match(pattern.regex);
            if (match) {
                findings.push({
                    id: `SEC-${Date.now()}-${Math.random()}`,
                    type: 'SECRET',
                    severity: pattern.severity as any,
                    line: lineNum,
                    description: `Hardcoded ${pattern.type} detected.`,
                    match: match[0], // Only show the key itself (in real app, redact this!)
                    suggestion: 'Revoke this key immediately and rotate secrets.',
                    cwe: 'CWE-798'
                });
            }
        });
    });

    return findings;
};

export const scanDependencies = (packageJson: string): SASTFinding[] => {
    const findings: SASTFinding[] = [];
    try {
        const parsed = JSON.parse(packageJson);
        const allDeps = { ...parsed.dependencies, ...parsed.devDependencies };

        Object.entries(allDeps).forEach(([pkg, ver]) => {
            // Very basic version check simulation
            // In reality, would parse semver string
            if (SCA_DATABASE[pkg]) {
                findings.push({
                    id: `SCA-${Date.now()}-${Math.random()}`,
                    type: 'SCA',
                    severity: SCA_DATABASE[pkg].severity as any,
                    line: 0,
                    description: SCA_DATABASE[pkg].description,
                    match: `${pkg}: ${ver}`,
                    suggestion: `Upgrade to version ${SCA_DATABASE[pkg].fixedIn} or later.`,
                    package: pkg,
                    version: ver as string,
                    cwe: 'CWE-1395'
                });
            }
        });

    } catch (e) {
        console.error("Invalid JSON for SCA scan", e);
    }
    return findings;
};
