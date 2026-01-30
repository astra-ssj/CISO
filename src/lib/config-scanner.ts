export interface ConfigFinding {
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    title: string;
    description: string;
    cisControl?: string;
}

export interface SecurityScore {
    score: number;
    findings: ConfigFinding[];
}

// Mock Logic for Microsoft Config
export function scanMicrosoftConfig(jsonString: string): SecurityScore {
    let findings: ConfigFinding[] = [];
    let score = 100;

    try {
        const config = JSON.parse(jsonString);

        // Check 1: MFA Enforcement
        if (config.mfaEnforced !== true && config.conditionalAccess?.requireMfa !== true) {
            findings.push({
                id: 'MS-001',
                severity: 'CRITICAL',
                title: 'MFA Not Enforced',
                description: 'Multi-Factor Authentication is not globally enforced for all admins.',
                cisControl: 'CIS 1.1'
            });
            score -= 30;
        }

        // Check 2: Legacy Auth
        if (config.allowLegacyAuth === true) {
            findings.push({
                id: 'MS-002',
                severity: 'HIGH',
                title: 'Legacy Authentication Enabled',
                description: 'Older protocols (POP3, IMAP, SMTP) bypass MFA and should be disabled.',
                cisControl: 'CIS 1.2'
            });
            score -= 20;
        }

        // Check 3: Guest Access
        if (config.guestAccess?.allowInvites === true && !config.guestAccess?.limitToDomains) {
            findings.push({
                id: 'MS-003',
                severity: 'MEDIUM',
                title: 'Unrestricted Guest Access',
                description: 'Guest users can invite other guests.',
                cisControl: 'CIS 1.3'
            });
            score -= 10;
        }

    } catch (e) {
        // Fallback for demo if invalid JSON or just to show results
        findings.push({
            id: 'ERR-001',
            severity: 'MEDIUM',
            title: 'Parse Warning',
            description: 'Could not fully parse config structure. Showing default checks.',
        });
    }

    return { score: Math.max(0, score), findings };
}

// Mock Logic for Firewall Config
export function scanFirewallConfig(configString: string): SecurityScore {
    let findings: ConfigFinding[] = [];
    let score = 100;
    const lower = configString.toLowerCase();

    try {
        // 1. Check for Any/Any Allow Rules (JSON or CLI)
        // JSON: Look for "action": "allow" combined with "any" source/dest
        const jsonAny = lower.includes('"action": "allow"') &&
            (lower.includes('"source": "any"') || lower.includes('"src": "any"') || lower.includes('"source": "*"'));

        // CLI: "permit ip any any" or "allow any any"
        const cliAny = /permit\s+\w+\s+any\s+any/.test(lower) ||
            /allow\s+\w+\s+any\s+any/.test(lower) ||
            /rule\s+.*\s+action\s+allow\s+.*\s+any/i.test(lower);

        if (jsonAny || cliAny) {
            findings.push({
                id: 'FW-001',
                severity: 'CRITICAL',
                title: 'Any/Any Allow Rule Detected',
                description: 'An overly permissive rule allows all traffic from any source to any destination.',
                cisControl: 'CIS 5.1'
            });
            score -= 40;
        }

        // 2. Check for Insecure Protocols
        if (lower.includes('telnet') || lower.includes(' port 23 ') || lower.includes(':23')) {
            findings.push({
                id: 'FW-002',
                severity: 'HIGH',
                title: 'Insecure Service (Telnet)',
                description: 'Telnet (Port 23) traffic is permitted. Use SSH instead.',
                cisControl: 'CIS 2.3'
            });
            score -= 20;
        }

        // 3. Check for SSH to Any (Management Exposure)
        if ((lower.includes('ssh') || lower.includes(' 22 ')) && (lower.includes('any') || lower.includes('0.0.0.0/0'))) {
            findings.push({
                id: 'FW-003',
                severity: 'MEDIUM',
                title: 'SSH Exposed to Internet',
                description: 'SSH management port open to the entire internet.',
                cisControl: 'CIS 4.1'
            });
            score -= 10;
        }

    } catch (e) { }

    return { score: Math.max(0, score), findings };
}

// Mock Logic for Network Switch (Cisco IOS)
export function scanSwitchConfig(configString: string): SecurityScore {
    let findings: ConfigFinding[] = [];
    let score = 100;
    const lower = configString.toLowerCase();

    // 1. Telnet Enabled
    if (lower.includes('transport input') && lower.includes('telnet')) {
        findings.push({
            id: 'NET-001',
            severity: 'HIGH',
            title: 'Telnet Enabled',
            description: 'Insecure management protocol detected. Use SSH only.',
            cisControl: 'CIS 2.3'
        });
        score -= 20;
    }

    // 2. HTTP Server Enabled
    if (!lower.includes('no ip http server') && (lower.includes('ip http server'))) {
        findings.push({
            id: 'NET-002',
            severity: 'MEDIUM',
            title: 'Insecure Web Management',
            description: 'HTTP management server is active. Use HTTPS.',
            cisControl: 'CIS 2.2'
        });
        score -= 15;
    }

    // 3. SNMP Default Community
    if (lower.includes('snmp-server community public') || lower.includes('snmp-server community private')) {
        findings.push({
            id: 'NET-003',
            severity: 'CRITICAL',
            title: 'Default SNMP Community',
            description: 'Default community strings "public/private" are widely known.',
            cisControl: 'CIS 3.1'
        });
        score -= 30;
    }

    return { score: Math.max(0, score), findings };
}

// Mock Logic for SIEM (Splunk inputs.conf)
export function scanSIEMConfig(configString: string): SecurityScore {
    let findings: ConfigFinding[] = [];
    let score = 100;
    const lower = configString.toLowerCase();

    // 1. SSL/TLS Disabled on Inputs
    if (lower.includes('[tcp://') && !lower.includes('sslenabled = true')) {
        findings.push({
            id: 'SIEM-001',
            severity: 'HIGH',
            title: 'Unencrypted Input',
            description: 'TCP input configuration lacks SSL enforcement.',
            cisControl: 'CIS 6.2'
        });
        score -= 25;
    }

    return { score: Math.max(0, score), findings };
}
