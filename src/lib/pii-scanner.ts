export interface PIIMatch {
    type: 'EMAIL' | 'PHONE' | 'CREDIT_CARD' | 'SSN' | 'IP_ADDRESS' | 'DATE' | 'IBAN';
    value: string;
    sensitivity: 'HIGH' | 'MEDIUM' | 'LOW';
    gdprArticle?: string; // e.g. "Art. 4(1) Personal Data"
    index: number;
}

export interface ScanResult {
    matches: PIIMatch[];
    riskScore: number;
    totalPII: number;
    sensitiveCount: number;
    redactedText: string;
}

const PATTERNS = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    PHONE: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
    CREDIT_CARD: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
    IP_ADDRESS: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    DATE: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
    IBAN: /[A-Z]{2}\d{2}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{0,2}|[A-Z]{2}\d{22}/g,
};

export const scanContent = (text: string): ScanResult => {
    let matches: PIIMatch[] = [];
    let redacted = text;

    // Helper to process regex
    const processPattern = (type: PIIMatch['type'], regex: RegExp, sensitivity: PIIMatch['sensitivity'], article: string) => {
        let match;
        // reset lastIndex
        regex.lastIndex = 0;

        // We use a new regex with 'g' to find all matches
        const allMatches = [...text.matchAll(regex)];

        allMatches.forEach(m => {
            matches.push({
                type,
                value: m[0],
                sensitivity,
                gdprArticle: article,
                index: m.index || 0
            });
            // Simple redaction (replace with [TYPE])
            redacted = redacted.replace(m[0], `[${type}]`);
        });
    };

    processPattern('CREDIT_CARD', PATTERNS.CREDIT_CARD, 'HIGH', 'Art. 9 Special Category (Financial Context)');
    processPattern('SSN', PATTERNS.SSN, 'HIGH', 'Art. 9 / National ID');
    processPattern('IBAN', PATTERNS.IBAN, 'HIGH', 'Art. 9 Financial');
    processPattern('EMAIL', PATTERNS.EMAIL, 'MEDIUM', 'Art. 4(1) Personal Data');
    processPattern('PHONE', PATTERNS.PHONE, 'MEDIUM', 'Art. 4(1) Personal Data');
    processPattern('IP_ADDRESS', PATTERNS.IP_ADDRESS, 'LOW', 'Art. 4(1) Online Identifier');
    processPattern('DATE', PATTERNS.DATE, 'LOW', 'Potential DOB context');

    // Calculate Risk Score (0-100)
    const highRiskWeight = 15;
    const mediumRiskWeight = 5;
    const lowRiskWeight = 1;

    let rawScore = 0;
    matches.forEach(m => {
        if (m.sensitivity === 'HIGH') rawScore += highRiskWeight;
        else if (m.sensitivity === 'MEDIUM') rawScore += mediumRiskWeight;
        else rawScore += lowRiskWeight;
    });

    // Cap at 100, log scaleish
    const normalizedScore = Math.min(100, Math.ceil(rawScore));

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    return {
        matches,
        riskScore: normalizedScore,
        totalPII: matches.length,
        sensitiveCount: matches.filter(m => m.sensitivity === 'HIGH').length,
        redactedText: redacted
    };
};
