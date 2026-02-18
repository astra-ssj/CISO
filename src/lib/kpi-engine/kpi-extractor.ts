/**
 * KPI Extractor — Regex + Heuristic Engine
 * 
 * Scans extracted text from PPTX/DOCX files and identifies KPI-like metrics
 * by matching numeric values near known security/business keywords.
 * Includes a generic fallback for any "Label: Number" or "Number Unit" patterns.
 */

import type { KPICategory, KPIHealth, KPITrend } from './kpi-engine';

export interface ExtractedKPI {
    id: string;
    name: string;
    value: number;
    unit: string;
    target?: number;
    category: KPICategory;
    confidence: number;
    sourceText: string;
    health?: KPIHealth;
    trend?: KPITrend;
}

// ────────────────────────────────────────────
// Keyword → Category mapping
// ────────────────────────────────────────────

interface KPIPattern {
    keywords: RegExp;
    category: KPICategory;
    defaultUnit: string;
    defaultName: string;
    higherIsBetter: boolean;
    typicalTarget?: number;
}

const KPI_PATTERNS: KPIPattern[] = [
    // INCIDENT — broad
    { keywords: /MTTD|mean\s*time\s*to\s*detect|detection\s*time/i, category: 'INCIDENT', defaultUnit: 'hours', defaultName: 'Mean Time to Detect', higherIsBetter: false, typicalTarget: 2 },
    { keywords: /MTTR|mean\s*time\s*to\s*respon|response\s*time|remediation\s*time|time\s*to\s*respon/i, category: 'INCIDENT', defaultUnit: 'hours', defaultName: 'Mean Time to Respond', higherIsBetter: false, typicalTarget: 4 },
    { keywords: /incident|breach|security\s*event|cyber\s*event/i, category: 'INCIDENT', defaultUnit: 'count', defaultName: 'Security Incidents', higherIsBetter: false, typicalTarget: 5 },
    { keywords: /dwell\s*time|attacker\s*dwell/i, category: 'INCIDENT', defaultUnit: 'days', defaultName: 'Attacker Dwell Time', higherIsBetter: false, typicalTarget: 7 },
    { keywords: /alert|false\s*positive|true\s*positive/i, category: 'INCIDENT', defaultUnit: 'count', defaultName: 'Alert Volume', higherIsBetter: false },
    { keywords: /ransomware|malware|threat/i, category: 'INCIDENT', defaultUnit: 'count', defaultName: 'Threat Events', higherIsBetter: false },

    // COMPLIANCE — broad
    { keywords: /compliance|SOC\s*2|ISO\s*27001|NIST|GDPR|HIPAA|PCI|framework|regulation/i, category: 'COMPLIANCE', defaultUnit: '%', defaultName: 'Compliance Score', higherIsBetter: true, typicalTarget: 90 },
    { keywords: /audit|finding|observation|non.?conform/i, category: 'COMPLIANCE', defaultUnit: 'count', defaultName: 'Audit Findings', higherIsBetter: false, typicalTarget: 0 },
    { keywords: /control|safeguard|countermeasure/i, category: 'COMPLIANCE', defaultUnit: '%', defaultName: 'Control Coverage', higherIsBetter: true, typicalTarget: 95 },
    { keywords: /certif|accredit|attestation/i, category: 'COMPLIANCE', defaultUnit: 'count', defaultName: 'Active Certifications', higherIsBetter: true },

    // VULNERABILITY — broad
    { keywords: /patch|patching|update|fix|remediat/i, category: 'VULNERABILITY', defaultUnit: '%', defaultName: 'Patch Compliance', higherIsBetter: true, typicalTarget: 95 },
    { keywords: /vuln|CVE|critical\s*vuln|exploit|weakness/i, category: 'VULNERABILITY', defaultUnit: 'count', defaultName: 'Open Vulnerabilities', higherIsBetter: false, typicalTarget: 10 },
    { keywords: /attack\s*surface|expos|external\s*footprint/i, category: 'VULNERABILITY', defaultUnit: 'count', defaultName: 'Attack Surface', higherIsBetter: false, typicalTarget: 200 },
    { keywords: /penetration|pen\s*test|red\s*team/i, category: 'VULNERABILITY', defaultUnit: 'count', defaultName: 'Pen Test Findings', higherIsBetter: false },

    // VENDOR — broad
    { keywords: /vendor|third.?party|supplier|partner|TPRM|supply\s*chain/i, category: 'VENDOR', defaultUnit: 'score', defaultName: 'Vendor Risk Score', higherIsBetter: true, typicalTarget: 75 },
    { keywords: /overdue|delinquent|past\s*due|late/i, category: 'VENDOR', defaultUnit: 'count', defaultName: 'Overdue Items', higherIsBetter: false, typicalTarget: 0 },
    { keywords: /SLA|service\s*level|uptime/i, category: 'POSTURE', defaultUnit: '%', defaultName: 'SLA Compliance', higherIsBetter: true, typicalTarget: 99 },

    // PEOPLE — broad
    { keywords: /training|awareness|education|onboard/i, category: 'PEOPLE', defaultUnit: '%', defaultName: 'Training Completion', higherIsBetter: true, typicalTarget: 95 },
    { keywords: /phishing|social\s*engineer|click\s*rate|simul/i, category: 'PEOPLE', defaultUnit: '%', defaultName: 'Phishing Click Rate', higherIsBetter: false, typicalTarget: 5 },
    { keywords: /headcount|FTE|staff|team\s*size|hire|open\s*role/i, category: 'PEOPLE', defaultUnit: 'count', defaultName: 'Security Headcount', higherIsBetter: true },
    { keywords: /turnover|retention|attrition/i, category: 'PEOPLE', defaultUnit: '%', defaultName: 'Staff Retention', higherIsBetter: true, typicalTarget: 90 },

    // BUDGET — broad
    { keywords: /budget|spend|investment|cost|expenditure|funding|capex|opex/i, category: 'BUDGET', defaultUnit: '$', defaultName: 'Security Budget', higherIsBetter: true },
    { keywords: /ROI|return\s*on|cost\s*per|savings|TCO|cost\s*reduction/i, category: 'BUDGET', defaultUnit: '%', defaultName: 'Security ROI', higherIsBetter: true, typicalTarget: 80 },

    // RISK — broad
    { keywords: /ALE|annual.*loss|loss\s*expectancy|risk\s*exposure/i, category: 'RISK', defaultUnit: '$', defaultName: 'Annualized Loss', higherIsBetter: false, typicalTarget: 3000000 },
    { keywords: /risk\s*(score|rat|level|index|register|appetite|posture|heat|assessment|matrix)/i, category: 'RISK', defaultUnit: 'score', defaultName: 'Risk Score', higherIsBetter: false, typicalTarget: 30 },
    { keywords: /residual\s*risk|inherent\s*risk|risk\s*treatment|mitigat/i, category: 'RISK', defaultUnit: 'count', defaultName: 'Risk Items', higherIsBetter: false },

    // POSTURE — broad
    { keywords: /security\s*posture|posture\s*score|security\s*score|overall\s*score|maturity/i, category: 'POSTURE', defaultUnit: 'score', defaultName: 'Security Posture', higherIsBetter: true, typicalTarget: 85 },
    { keywords: /availability|uptime|downtime|reliability/i, category: 'POSTURE', defaultUnit: '%', defaultName: 'System Availability', higherIsBetter: true, typicalTarget: 99.9 },
    { keywords: /coverage|deploy|rollout|adoption/i, category: 'POSTURE', defaultUnit: '%', defaultName: 'Coverage Rate', higherIsBetter: true, typicalTarget: 95 },
    { keywords: /MFA|multi.?factor|2FA|password|access\s*control|identity/i, category: 'POSTURE', defaultUnit: '%', defaultName: 'MFA Adoption', higherIsBetter: true, typicalTarget: 100 },
    { keywords: /encrypt|TLS|SSL|certificate|key\s*management/i, category: 'POSTURE', defaultUnit: '%', defaultName: 'Encryption Coverage', higherIsBetter: true, typicalTarget: 100 },
    { keywords: /endpoint|EDR|antivirus|agent|device/i, category: 'POSTURE', defaultUnit: '%', defaultName: 'Endpoint Protection', higherIsBetter: true, typicalTarget: 100 },
    { keywords: /backup|recovery|RPO|RTO|DR|disaster/i, category: 'POSTURE', defaultUnit: 'hours', defaultName: 'Recovery Objective', higherIsBetter: false, typicalTarget: 4 },
];

// ────────────────────────────────────────────
// Number extraction helpers
// ────────────────────────────────────────────

function extractNumbers(text: string): number[] {
    const results: number[] = [];

    // $4.2M, $500K, $1.2B
    const money = text.matchAll(/\$\s*([\d,]+\.?\d*)\s*([MmBbKk])?(?:illion|ilo)?/g);
    for (const m of money) {
        let val = parseFloat(m[1].replace(/,/g, ''));
        if (m[2] && /[Mm]/.test(m[2])) val *= 1_000_000;
        if (m[2] && /[Bb]/.test(m[2])) val *= 1_000_000_000;
        if (m[2] && /[Kk]/.test(m[2])) val *= 1_000;
        results.push(val);
    }

    // 92%, 4.2 hours, 12 days
    const units = text.matchAll(/([\d,]+\.?\d*)\s*(%|hours?|hrs?|days?|minutes?|mins?|points?|pts?|score|x)\b/gi);
    for (const m of units) {
        results.push(parseFloat(m[1].replace(/,/g, '')));
    }

    // Plain numbers preceded by colon, dash, equals
    const plain = text.matchAll(/(?:[:=\-–—\s])\s*([\d,]+\.?\d+)\b/g);
    for (const m of plain) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (val > 0 && val < 10_000_000_000) results.push(val);
    }

    // Standalone integers (2-digit or more)
    if (results.length === 0) {
        const standalone = text.matchAll(/\b(\d{2,}\.?\d*)\b/g);
        for (const m of standalone) {
            const val = parseFloat(m[1]);
            if (val > 0) results.push(val);
        }
    }

    return [...new Set(results)];
}

function extractTarget(text: string): number | null {
    const patterns = [
        /(?:target|goal|objective|threshold|SLA|benchmark|standard)[:\s\-–=]+\$?([\d,]+\.?\d*)/i,
        /(?:should\s+be|must\s+be|aim|expected)[:\s\-–=]+\$?([\d,]+\.?\d*)/i,
        /\$?([\d,]+\.?\d*)\s*(?:target|goal|threshold)/i,
    ];
    for (const p of patterns) {
        const match = text.match(p);
        if (match) return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
}

function detectUnit(text: string, defaultUnit: string): string {
    if (/%/.test(text)) return '%';
    if (/\$|dollar|USD|cost|spend|budget|revenue/i.test(text)) return '$';
    if (/\bhours?\b|\bhrs?\b/i.test(text)) return 'hours';
    if (/\bdays?\b/i.test(text)) return 'days';
    if (/\bminutes?\b|\bmins?\b/i.test(text)) return 'minutes';
    if (/\bscore\b|\bpoints?\b|\brating\b|\bindex\b|\blevel\b/i.test(text)) return 'score';
    if (/\bcount\b|\btotal\b|\bnumber\b|\b#\b/i.test(text)) return 'count';
    return defaultUnit;
}

// ────────────────────────────────────────────
// Main extraction function
// ────────────────────────────────────────────

export function extractKPIsFromText(rawText: string): ExtractedKPI[] {
    const results: ExtractedKPI[] = [];
    const seen = new Set<string>();

    // Split into lines/sentences. Try various delimiters.
    const fragments = rawText
        .split(/[\n\r]+/)
        .flatMap(line => line.split(/[.;](?=\s)/))
        .filter(f => f.trim().length > 5);

    // Phase 1: Match against known KPI patterns
    for (const fragment of fragments) {
        for (const pattern of KPI_PATTERNS) {
            if (!pattern.keywords.test(fragment)) continue;

            const numbers = extractNumbers(fragment);
            if (numbers.length === 0) continue;

            const value = numbers[0];

            // Deduplicate
            const key = `${pattern.defaultName}-${value}`;
            if (seen.has(key)) continue;
            seen.add(key);

            const unit = detectUnit(fragment, pattern.defaultUnit);
            const target = extractTarget(fragment) || pattern.typicalTarget;

            // Confidence scoring
            let confidence = 60;
            if (target) confidence += 10;
            if (fragment.length < 150) confidence += 5;
            if (/\b(KPI|metric|measure|target|goal|objective|score|rate)\b/i.test(fragment)) confidence += 10;
            if (numbers.length > 1) confidence += 5; // Likely has value + target
            confidence = Math.min(95, confidence);

            // Auto health
            let health: KPIHealth = 'AMBER';
            if (target) {
                const ratio = pattern.higherIsBetter ? value / target : target / value;
                if (ratio >= 0.95) health = 'GREEN';
                else if (ratio < 0.7) health = 'RED';
            }

            results.push({
                id: `uploaded-${Date.now()}-${results.length}`,
                name: pattern.defaultName,
                value,
                unit,
                target,
                category: pattern.category,
                confidence,
                sourceText: fragment.trim().slice(0, 250),
                health,
                trend: 'STABLE',
            });
        }
    }

    // Phase 2: Generic fallback — find "Label: Number" or "Number%" patterns not already matched
    if (results.length < 3) {
        const genericPatterns = [
            // "Some Label: 42%" or "Some Label - 42"
            /([A-Z][A-Za-z\s&/]{3,30})\s*[:=\-–]\s*\$?([\d,]+\.?\d*)\s*(%|hours?|days?|score|[MmKk])?/g,
            // "42% compliance" or "92% completion"  
            /([\d,]+\.?\d*)\s*(%)\s+([A-Za-z\s]{3,25})/g,
        ];

        for (const p of genericPatterns) {
            for (const match of rawText.matchAll(p)) {
                const fullMatch = match[0];
                let name: string;
                let value: number;
                let unit: string;

                if (match[0].match(/^[A-Z]/)) {
                    // "Label: Number" pattern
                    name = match[1].trim();
                    value = parseFloat(match[2].replace(/,/g, ''));
                    unit = match[3] || 'count';
                    if (/[Mm]/.test(match[3] || '')) { value *= 1_000_000; unit = '$'; }
                    if (/[Kk]/.test(match[3] || '')) { value *= 1_000; unit = '$'; }
                } else {
                    // "Number% label" pattern
                    value = parseFloat(match[1].replace(/,/g, ''));
                    unit = match[2] || '%';
                    name = match[3]?.trim() || 'Metric';
                }

                if (isNaN(value) || value === 0) continue;

                const key = `generic-${name}-${value}`;
                if (seen.has(key)) continue;
                seen.add(key);

                // Try to guess category from name
                let category: KPICategory = 'POSTURE';
                const lowName = (name + ' ' + fullMatch).toLowerCase();
                if (/risk|threat|loss/i.test(lowName)) category = 'RISK';
                else if (/compli|audit|certif|framework/i.test(lowName)) category = 'COMPLIANCE';
                else if (/incident|detect|respond|alert|breach/i.test(lowName)) category = 'INCIDENT';
                else if (/vuln|patch|CVE|exposure/i.test(lowName)) category = 'VULNERABILITY';
                else if (/vendor|third|partner|supplier/i.test(lowName)) category = 'VENDOR';
                else if (/train|phish|staff|team|hire/i.test(lowName)) category = 'PEOPLE';
                else if (/budget|spend|cost|\$/i.test(lowName)) category = 'BUDGET';

                results.push({
                    id: `uploaded-${Date.now()}-${results.length}`,
                    name: name.replace(/\s+/g, ' ').trim(),
                    value,
                    unit: unit === '%' ? '%' : unit,
                    category,
                    confidence: 35,
                    sourceText: fullMatch.trim().slice(0, 250),
                    health: 'AMBER',
                    trend: 'STABLE',
                });
            }
        }
    }

    // Sort by confidence descending
    results.sort((a, b) => b.confidence - a.confidence);
    return results;
}
