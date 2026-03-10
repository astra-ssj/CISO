export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type FindingType = 'SAST' | 'SCA' | 'SECRET' | 'CONTAINER';

export interface AppSecFinding {
    id: string;             // Unique identifier (hash of finding or native ID)
    type: FindingType;        // Which tab it belongs to
    severity: Severity;       // Normalized severity
    title: string;          // Short summary of vulnerability
    description: string;    // Detailed description
    file?: string;          // File path where found
    line?: number | string; // Line number or range
    tool: string;           // "Semgrep", "Trivy", "Dependabot", "Gitleaks"
    cwe?: string;           // CWE identifier
    detectedAt: string;     // ISO timestamp
    remediation?: string;   // Suggested fix or solution
    match?: string;         // The matched code snippet/secret
}
