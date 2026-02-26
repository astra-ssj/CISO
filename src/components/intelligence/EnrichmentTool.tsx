'use client';

/**
 * EnrichmentTool — IOC enrichment. Paste IP/domain/hash/URL → query both OpenCTI and MISP.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search, Shield, ShieldAlert, ShieldCheck, ShieldX,
    Loader2, ExternalLink, AlertTriangle,
} from 'lucide-react';

type IOCType = 'ip' | 'domain' | 'hash' | 'url';

interface EnrichmentResult {
    query: { value: string; type: IOCType };
    opencti: { found: boolean; results: unknown[]; count: number };
    misp: { found: boolean; results: unknown[]; count: number };
    abusech?: { found: boolean; results: unknown[]; count: number };
    shodan?: { found: boolean; configured?: boolean; ip?: string; ports?: number[]; vulns?: string[]; org?: string; country?: string; city?: string | null; services?: { port: number; product: string | null; transport: string }[]; lastUpdate?: string; error?: string };
    combined: { totalHits: number; sources: string[]; verdict: string };
    timestamp: string;
}

function detectType(value: string): IOCType {
    const trimmed = value.trim();
    if (/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(trimmed)) return 'ip';
    if (/^https?:\/\//i.test(trimmed)) return 'url';
    if (/^[a-f0-9]{32,128}$/i.test(trimmed)) return 'hash';
    if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/i.test(trimmed)) return 'domain';
    return 'domain'; // default fallback
}

function verdictBadge(verdict: string) {
    switch (verdict) {
        case 'KNOWN_MALICIOUS': return { icon: ShieldX, color: 'text-red-400 bg-red-500/10', label: 'MALICIOUS' };
        case 'SUSPICIOUS': return { icon: ShieldAlert, color: 'text-orange-400 bg-orange-500/10', label: 'SUSPICIOUS' };
        case 'NOT_FOUND': return { icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/10', label: 'NOT FOUND' };
        default: return { icon: Shield, color: 'text-muted-foreground bg-muted', label: verdict };
    }
}

function typeLabel(type: IOCType): string {
    switch (type) {
        case 'ip': return '🌐 IPv4 Address';
        case 'domain': return '🔗 Domain';
        case 'hash': return '#️⃣ Hash';
        case 'url': return '🔗 URL';
    }
}

export function EnrichmentTool() {
    const [input, setInput] = useState('');
    const [detectedType, setDetectedType] = useState<IOCType>('domain');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EnrichmentResult | null>(null);
    const [error, setError] = useState('');

    const handleInputChange = useCallback((value: string) => {
        setInput(value);
        if (value.trim().length > 2) {
            setDetectedType(detectType(value));
        }
    }, []);

    const handleEnrich = useCallback(async () => {
        const value = input.trim();
        if (!value) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/intelligence/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value, type: detectedType }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Enrichment failed');
            }

            const json = await res.json();
            setResult(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Enrichment failed');
        } finally {
            setLoading(false);
        }
    }, [input, detectedType]);

    const verdict = result ? verdictBadge(result.combined.verdict) : null;
    const VerdictIcon = verdict?.icon || Shield;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Search Box */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        IOC Enrichment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Paste IP, domain, hash, or URL..."
                                value={input}
                                onChange={e => handleInputChange(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleEnrich()}
                                className="h-11 text-base font-mono pr-24"
                            />
                            {input.trim().length > 2 && (
                                <span className="absolute right-3 top-3 text-[10px] text-muted-foreground">
                                    {typeLabel(detectedType)}
                                </span>
                            )}
                        </div>
                        <Button onClick={handleEnrich} disabled={loading || input.trim().length < 3} className="h-11 px-6 gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Enrich
                        </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                        {(['192.168.1.1', 'evil-domain.com', 'abc123def456', 'https://malware.test/payload'] as const).map(example => (
                            <button
                                key={example}
                                className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                                onClick={() => { handleInputChange(example); }}
                            >
                                {example.length > 20 ? example.slice(0, 20) + '...' : example}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <Card className="border-red-500/30">
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                        <p className="text-sm text-red-400">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Verdict */}
                    <Card className={`border-2 ${result.combined.verdict === 'KNOWN_MALICIOUS' ? 'border-red-500/30' : result.combined.verdict === 'NOT_FOUND' ? 'border-emerald-500/30' : 'border-orange-500/30'}`}>
                        <CardContent className="flex items-center justify-between py-5">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${verdict!.color}`}>
                                    <VerdictIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{verdict!.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {result.combined.totalHits} hit{result.combined.totalHits !== 1 ? 's' : ''} across {result.combined.sources.join(' + ') || 'no sources'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                                <p className="font-mono">{result.query.value}</p>
                                <p>{typeLabel(result.query.type)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Source Breakdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* OpenCTI */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <span className="text-blue-400">🔷</span> OpenCTI Results
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{result.opencti.count}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {result.opencti.found ? (
                                    <div className="space-y-1.5">
                                        {(result.opencti.results as Array<{ id: string; entity_type?: string; name?: string; description?: string }>).slice(0, 5).map((r, i) => (
                                            <div key={i} className="p-2 rounded-md bg-muted/10 text-xs">
                                                <span className="font-medium">{r.name || r.entity_type || 'Match'}</span>
                                                {r.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No matches in OpenCTI</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* MISP */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <span className="text-green-400">🟢</span> MISP Results
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{result.misp.count}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {result.misp.found ? (
                                    <div className="space-y-1.5">
                                        {(result.misp.results as Array<{ id: string; type?: string; value?: string; category?: string; comment?: string }>).slice(0, 5).map((r, i) => (
                                            <div key={i} className="p-2 rounded-md bg-muted/10 text-xs">
                                                <span className="font-medium">{r.type}: {r.value}</span>
                                                {r.comment && <p className="text-[10px] text-muted-foreground mt-0.5">{r.comment}</p>}
                                                {r.category && <span className="text-[10px] text-muted-foreground"> [{r.category}]</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No matches in MISP</p>
                                )}
                            </CardContent>
                        </Card>
                        {/* Abuse.ch */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <span className="text-orange-400">🟠</span> Abuse.ch Results
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">{result.abusech?.count ?? 0}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {result.abusech?.found ? (
                                    <div className="space-y-1.5">
                                        {(result.abusech.results as Array<{ source?: string; ioc?: string; malware?: string; confidence?: number; tags?: string[]; signature?: string; threat?: string; status?: string }>).slice(0, 5).map((r, i) => (
                                            <div key={i} className="p-2 rounded-md bg-muted/10 text-xs">
                                                <span className="font-medium">{r.source}: {r.malware || r.signature || r.ioc || 'Match'}</span>
                                                {r.confidence != null && <span className="text-[10px] text-muted-foreground ml-1">(conf: {r.confidence}%)</span>}
                                                {r.tags && r.tags.length > 0 && (
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.tags.join(', ')}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No matches in Abuse.ch</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Shodan Panel (full width under the grid) */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <span className="text-cyan-400">🌊</span> Shodan Intelligence
                                {result.shodan?.found && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">FOUND</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!result.shodan?.configured && !result.shodan?.found ? (
                                <p className="text-sm text-muted-foreground text-center py-4 opacity-50">
                                    Shodan not configured — add API key in Settings → Integrations
                                </p>
                            ) : result.shodan?.found ? (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        {[{ l: 'IP', v: result.shodan.ip }, { l: 'Org', v: result.shodan.org }, { l: 'Country', v: `${result.shodan.country}${result.shodan.city ? ` / ${result.shodan.city}` : ''}` }, { l: 'Last Seen', v: result.shodan.lastUpdate?.slice(0, 10) }].map(d => (
                                            <div key={d.l} className="p-2 rounded-md bg-muted/10">
                                                <span className="text-[10px] text-muted-foreground">{d.l}</span>
                                                <p className="font-mono text-sm">{d.v || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {(result.shodan.ports?.length ?? 0) > 0 && (
                                        <div className="p-2 rounded-md bg-muted/10">
                                            <span className="text-[10px] text-muted-foreground">Open Ports ({result.shodan.ports!.length})</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {result.shodan.ports!.map(p => (
                                                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyan-500/10 text-cyan-300">{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(result.shodan.vulns?.length ?? 0) > 0 && (
                                        <div className="p-2 rounded-md bg-red-500/5 border border-red-500/10">
                                            <span className="text-[10px] text-red-400">Vulnerabilities ({result.shodan.vulns!.length})</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {result.shodan.vulns!.slice(0, 12).map(v => (
                                                    <span key={v} className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-red-500/10 text-red-300">{v}</span>
                                                ))}
                                                {result.shodan.vulns!.length > 12 && <span className="text-[10px] text-muted-foreground">+{result.shodan.vulns!.length - 12} more</span>}
                                            </div>
                                        </div>
                                    )}
                                    {result.shodan.services && result.shodan.services.length > 0 && (
                                        <div className="p-2 rounded-md bg-muted/10">
                                            <span className="text-[10px] text-muted-foreground">Services</span>
                                            <div className="space-y-0.5 mt-1">
                                                {result.shodan.services.slice(0, 8).map((s, i) => (
                                                    <div key={i} className="text-xs flex items-center gap-2">
                                                        <span className="font-mono text-cyan-300 w-12">{s.port}/{s.transport}</span>
                                                        <span className="text-muted-foreground">{s.product || 'unknown'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {result.shodan?.ip && (
                                        <a
                                            href={`https://maps.shodan.io/#search/ip:${result.shodan.ip}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-1 transition-colors"
                                        >
                                            View on Shodan Maps →
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No Shodan results for this IOC</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardContent className="flex flex-wrap gap-2 py-3">
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <AlertTriangle className="h-3 w-3" /> Create Incident
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <Shield className="h-3 w-3" /> Add to Block List
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <ExternalLink className="h-3 w-3" /> Share to MISP
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
