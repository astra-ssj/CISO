/**
 * Threat Classifier — Two-stage pipeline for intelligence items.
 *
 * Stage 1: Instant keyword matching (~120 patterns, 5 severity tiers)
 * Stage 2: Optional Groq Llama 3.1 AI enrichment (async, cached)
 */

import type { Severity } from './signal-aggregator';

// ── Types ─────────────────────────────────────────────────────

export type ThreatCategory =
    | 'conflict'
    | 'terrorism'
    | 'cyber'
    | 'disaster'
    | 'geopolitical'
    | 'economic'
    | 'infrastructure'
    | 'environmental';

export interface ClassificationResult {
    severity: Severity;
    categories: ThreatCategory[];
    confidence: number;
    keywords: string[];
    bcdrImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    aiEnhanced: boolean;
}

// ── Keyword Database (~120 patterns) ──────────────────────────

const KEYWORD_DB: Record<Severity, { keywords: string[]; categories: ThreatCategory[] }[]> = {
    CRITICAL: [
        { keywords: ['war', 'invasion', 'nuclear strike', 'nuclear attack', 'nuclear weapon', 'wmd', 'declared war'], categories: ['conflict'] },
        { keywords: ['coup', 'coup d\'etat', 'overthrow', 'seize power', 'topple government'], categories: ['geopolitical'] },
        { keywords: ['terror attack', 'terrorism', 'mass casualty', 'bomb blast', 'suicide bomb', 'hostage'], categories: ['terrorism'] },
        { keywords: ['infrastructure destroyed', 'dam collapse', 'grid collapse', 'total blackout'], categories: ['infrastructure'] },
        { keywords: ['pandemic', 'biological weapon', 'bioweapon'], categories: ['disaster'] },
        { keywords: ['critical vulnerability', 'zero-day exploit', 'nation-state attack', 'wiper malware', 'scada attack'], categories: ['cyber'] },
    ],
    HIGH: [
        { keywords: ['military operation', 'airstrike', 'bombardment', 'troop deployment', 'mobilization', 'escalation', 'armed conflict'], categories: ['conflict'] },
        { keywords: ['sanctions', 'embargo', 'trade war', 'asset freeze', 'economic warfare'], categories: ['economic', 'geopolitical'] },
        { keywords: ['ransomware attack', 'data breach', 'apt group', 'state-sponsored', 'cyber espionage', 'supply chain attack'], categories: ['cyber'] },
        { keywords: ['earthquake magnitude 7', 'category 5', 'tsunami warning', 'volcanic eruption'], categories: ['disaster'] },
        { keywords: ['pipeline sabotage', 'cable cut', 'submarine cable', 'power grid attack', 'internet shutdown'], categories: ['infrastructure'] },
        { keywords: ['mass protest', 'martial law', 'state of emergency', 'curfew', 'crackdown'], categories: ['geopolitical'] },
    ],
    MEDIUM: [
        { keywords: ['protest', 'demonstration', 'unrest', 'riot', 'civil unrest', 'strike action'], categories: ['geopolitical'] },
        { keywords: ['earthquake', 'flood', 'wildfire', 'hurricane', 'typhoon', 'cyclone', 'drought'], categories: ['disaster', 'environmental'] },
        { keywords: ['outage', 'service disruption', 'connectivity issue', 'bgp hijack', 'dns attack'], categories: ['infrastructure', 'cyber'] },
        { keywords: ['vulnerability', 'cve', 'patch', 'exploit', 'malware', 'phishing campaign'], categories: ['cyber'] },
        { keywords: ['military exercise', 'naval drill', 'air patrol', 'reconnaissance', 'surveillance flight'], categories: ['conflict'] },
        { keywords: ['refugee', 'displacement', 'humanitarian crisis', 'food shortage', 'famine'], categories: ['disaster'] },
        { keywords: ['nuclear test', 'missile launch', 'missile test', 'ballistic missile', 'hypersonic'], categories: ['conflict', 'geopolitical'] },
    ],
    LOW: [
        { keywords: ['election', 'vote', 'referendum', 'polling', 'campaign'], categories: ['geopolitical'] },
        { keywords: ['policy change', 'legislation', 'regulation', 'regulatory change', 'compliance'], categories: ['geopolitical', 'economic'] },
        { keywords: ['economic downturn', 'inflation', 'recession', 'unemployment', 'market volatility'], categories: ['economic'] },
        { keywords: ['migration', 'border security', 'visa restriction'], categories: ['geopolitical'] },
        { keywords: ['minor earthquake', 'tropical storm', 'weather advisory'], categories: ['environmental'] },
        { keywords: ['data leak', 'credential exposure', 'misconfiguration'], categories: ['cyber'] },
    ],
    INFO: [
        { keywords: ['summit', 'bilateral talks', 'agreement', 'treaty', 'ceasefire', 'peace talks'], categories: ['geopolitical'] },
        { keywords: ['trade deal', 'investment', 'partnership', 'economic growth', 'gdp'], categories: ['economic'] },
        { keywords: ['infrastructure project', 'construction', 'expansion', 'upgrade'], categories: ['infrastructure'] },
        { keywords: ['security advisory', 'patch release', 'firmware update', 'security bulletin'], categories: ['cyber'] },
        { keywords: ['training exercise', 'joint exercise', 'port visit', 'diplomatic visit'], categories: ['geopolitical'] },
    ],
};

// ── Stage 1: Keyword Classifier ───────────────────────────────

export function classifyByKeywords(text: string): ClassificationResult {
    const lower = text.toLowerCase();
    let bestSeverity: Severity = 'INFO';
    const allCategories = new Set<ThreatCategory>();
    const matchedKeywords: string[] = [];

    const SEVERITY_PRIORITY: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

    for (const severity of SEVERITY_PRIORITY) {
        for (const group of KEYWORD_DB[severity]) {
            for (const keyword of group.keywords) {
                if (lower.includes(keyword)) {
                    if (SEVERITY_PRIORITY.indexOf(severity) < SEVERITY_PRIORITY.indexOf(bestSeverity)) {
                        bestSeverity = severity;
                    }
                    for (const cat of group.categories) allCategories.add(cat);
                    matchedKeywords.push(keyword);
                }
            }
        }
    }

    const confidence = matchedKeywords.length === 0
        ? 0.1
        : Math.min(0.95, 0.3 + matchedKeywords.length * 0.1);

    return {
        severity: bestSeverity,
        categories: Array.from(allCategories),
        confidence,
        keywords: matchedKeywords,
        bcdrImpact: severityToBcdr(bestSeverity),
        aiEnhanced: false,
    };
}

function severityToBcdr(s: Severity): ClassificationResult['bcdrImpact'] {
    const map: Record<Severity, ClassificationResult['bcdrImpact']> = {
        CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low', INFO: 'none',
    };
    return map[s];
}

// ── Stage 2: AI Classifier (lazy, optional) ───────────────────

const aiCache = new Map<string, ClassificationResult>();

function hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return String(hash);
}

export async function classifyWithAI(
    text: string,
    groqApiKey: string
): Promise<ClassificationResult | null> {
    const cacheKey = hashText(text);
    if (aiCache.has(cacheKey)) return aiCache.get(cacheKey)!;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: `You are a threat intelligence classifier for a CISO platform. Classify the text into:
- severity: INFO, LOW, MEDIUM, HIGH, or CRITICAL
- categories: conflict, terrorism, cyber, disaster, geopolitical, economic, infrastructure, environmental
- bcdrImpact: none, low, medium, high, critical
- confidence: 0-1
Respond ONLY with valid JSON: {"severity":"...","categories":["..."],"bcdrImpact":"...","confidence":0.X}`,
                    },
                    { role: 'user', content: text.slice(0, 2000) },
                ],
                temperature: 0.1,
                max_tokens: 150,
            }),
        });
        clearTimeout(timeout);

        if (!res.ok) return null;

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        const parsed = JSON.parse(content);

        const result: ClassificationResult = {
            severity: parsed.severity || 'INFO',
            categories: parsed.categories || [],
            confidence: parsed.confidence || 0.5,
            keywords: [],
            bcdrImpact: parsed.bcdrImpact || 'none',
            aiEnhanced: true,
        };

        aiCache.set(cacheKey, result);
        return result;
    } catch {
        return null;
    }
}

// ── Combined Pipeline ─────────────────────────────────────────

export async function classifyThreat(
    text: string,
    groqApiKey?: string
): Promise<ClassificationResult> {
    const keywordResult = classifyByKeywords(text);

    if (groqApiKey) {
        const aiResult = await classifyWithAI(text, groqApiKey);
        if (aiResult && aiResult.confidence > keywordResult.confidence) {
            return { ...aiResult, keywords: keywordResult.keywords };
        }
    }

    return keywordResult;
}
