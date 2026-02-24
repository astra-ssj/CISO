import { NextRequest, NextResponse } from 'next/server';

const THREAT_KEYWORDS: Record<string, string[]> = {
    ransomware: ['ransomware', 'ransom', 'lockbit', 'blackcat', 'clop', 'hive', 'conti'],
    apt: ['apt', 'nation-state', 'espionage', 'cozy bear', 'fancy bear', 'lazarus'],
    phishing: ['phishing', 'spear-phishing', 'credential', 'social engineering'],
    supply_chain: ['supply chain', 'solarwinds', 'dependency', 'npm', 'pypi'],
    zero_day: ['zero-day', '0-day', 'zero day', 'unpatched', 'exploit'],
    ddos: ['ddos', 'denial of service', 'botnet', 'amplification'],
    data_breach: ['breach', 'leak', 'exposed', 'exfiltration', 'data loss'],
};

function classifyByKeywords(text: string): { category: string; confidence: number; keywords: string[] }[] {
    const lower = text.toLowerCase();
    const results: { category: string; confidence: number; keywords: string[] }[] = [];

    for (const [category, keywords] of Object.entries(THREAT_KEYWORDS)) {
        const matched = keywords.filter((kw) => lower.includes(kw));
        if (matched.length > 0) {
            results.push({
                category,
                confidence: Math.min(0.5 + matched.length * 0.15, 0.95),
                keywords: matched,
            });
        }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
}

export async function POST(req: NextRequest) {
    try {
        const { text, enhanceWithAI } = await req.json();
        if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

        // Instant keyword classification
        const keywordResults = classifyByKeywords(text);

        // Optional AI enhancement via Groq
        let aiClassification = null;
        if (enhanceWithAI && process.env.GROQ_API_KEY) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'llama-3.1-8b-instant',
                        messages: [
                            { role: 'system', content: 'You are a cyber threat classifier. Classify the following text into threat categories and assign severity (low/medium/high/critical). Respond in JSON: { "categories": ["category1"], "severity": "high", "summary": "brief summary" }' },
                            { role: 'user', content: text.slice(0, 2000) },
                        ],
                        temperature: 0.1,
                        max_tokens: 200,
                    }),
                });
                clearTimeout(timeout);
                if (res.ok) {
                    const data = await res.json();
                    const content = data.choices?.[0]?.message?.content || '';
                    try { aiClassification = JSON.parse(content); } catch { /* ignore parse errors */ }
                }
            } catch { /* AI classification is optional */ }
        }

        return NextResponse.json({
            keywordClassification: keywordResults,
            aiClassification,
            text: text.slice(0, 100) + '...',
            classifiedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[CLASSIFY API] Error:', error);
        return NextResponse.json({ error: 'Classification failed' }, { status: 500 });
    }
}
