export interface PIIMatch {
    type: 'EMAIL' | 'PHONE' | 'CREDIT_CARD' | 'SSN' | 'IP_ADDRESS' | 'DATE' | 'IBAN' | 'PASSPORT_US' | 'API_KEY' | 'UUID';
    value: string;
    sensitivity: 'HIGH' | 'MEDIUM' | 'LOW';
    gdprArticle?: string;
    index: number;
    context?: string;
}

export interface ScanResult {
    matches: PIIMatch[];
    riskScore: number;
    totalPII: number;
    sensitiveCount: number;
    redactedText: string;
    piiBreakdown: Record<string, number>;
}

const PATTERNS = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    PHONE: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
    CREDIT_CARD: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
    IP_ADDRESS: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    DATE: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
    IBAN: /[A-Z]{2}\d{2}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{0,2}|[A-Z]{2}\d{22}/g,
    PASSPORT_US: /\b[0-9]{9}\b/g, // Simplified US Passport (9 digits)
    API_KEY: /\b(sk_live_|pk_live_|AIza|eyJh)[a-zA-Z0-9_\-]{20,}\b/g, // Common prefixes + high entropy
    UUID: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
};

const CONTEXT_KEYWORDS = {
    PASSPORT_US: ['passport', 'document', 'travel', 'id'],
    API_KEY: ['key', 'secret', 'token', 'auth', 'api'],
    SSN: ['ssn', 'social', 'security', 'tax'],
    CREDIT_CARD: ['card', 'cc', 'visa', 'amex', 'mastercard', 'payment']
};

export const scanContent = (text: string): ScanResult => {
    const matches: PIIMatch[] = [];
    let redacted = text;

    // Helper to find context words nearby
    const findContext = (index: number, type: keyof typeof CONTEXT_KEYWORDS): string | undefined => {
        if (!CONTEXT_KEYWORDS[type]) return undefined;

        const windowSize = 50;
        const start = Math.max(0, index - windowSize);
        const end = Math.min(text.length, index + windowSize);
        const surroundingText = text.slice(start, end).toLowerCase();

        const foundKeyword = CONTEXT_KEYWORDS[type].find(keyword => surroundingText.includes(keyword));
        return foundKeyword ? `Context detected: "${foundKeyword}"` : undefined;
    };

    // Helper to process regex
    const processPattern = (type: PIIMatch['type'], regex: RegExp, sensitivity: PIIMatch['sensitivity'], article: string, checkContext = false) => {
        regex.lastIndex = 0;
        const allMatches = [...text.matchAll(regex)];

        allMatches.forEach(m => {
            const index = m.index || 0;
            let context = undefined;

            // For certain types like simplified Passport regex, strict context is needed to avoid false positives
            if (checkContext) {
                // @ts-ignore
                context = findContext(index, type as any);
                if (!context && type === 'PASSPORT_US') return; // Skip 9-digit numbers if no passport context
            }

            matches.push({
                type,
                value: m[0],
                sensitivity,
                gdprArticle: article,
                index,
                context
            });
            redacted = redacted.replace(m[0], `[${type}]`);
        });
    };

    processPattern('CREDIT_CARD', PATTERNS.CREDIT_CARD, 'HIGH', 'Art. 9 Special Category (Financial Context)', true);
    processPattern('SSN', PATTERNS.SSN, 'HIGH', 'Art. 9 / National ID', true);
    processPattern('IBAN', PATTERNS.IBAN, 'HIGH', 'Art. 9 Financial');
    processPattern('PASSPORT_US', PATTERNS.PASSPORT_US, 'HIGH', 'Art. 9 / National ID', true);
    processPattern('API_KEY', PATTERNS.API_KEY, 'HIGH', 'Security Critical / Technical PII', true);

    processPattern('EMAIL', PATTERNS.EMAIL, 'MEDIUM', 'Art. 4(1) Personal Data');
    processPattern('PHONE', PATTERNS.PHONE, 'MEDIUM', 'Art. 4(1) Personal Data');

    processPattern('IP_ADDRESS', PATTERNS.IP_ADDRESS, 'LOW', 'Art. 4(1) Online Identifier');
    processPattern('DATE', PATTERNS.DATE, 'LOW', 'Potential DOB context');
    processPattern('UUID', PATTERNS.UUID, 'LOW', 'Technical Identifier');

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

    // Multiplier for combination of sensitive data type
    const uniqueTypes = new Set(matches.map(m => m.type)).size;
    if (uniqueTypes > 2) rawScore *= 1.2; // 20% boost if multiple types found (correlation risk)

    const normalizedScore = Math.min(100, Math.ceil(rawScore));
    matches.sort((a, b) => a.index - b.index);

    const piiBreakdown: Record<string, number> = {};
    matches.forEach(m => {
        piiBreakdown[m.type] = (piiBreakdown[m.type] || 0) + 1;
    });

    return {
        matches,
        riskScore: normalizedScore,
        totalPII: matches.length,
        sensitiveCount: matches.filter(m => m.sensitivity === 'HIGH').length,
        redactedText: redacted,
        piiBreakdown
    };
};
