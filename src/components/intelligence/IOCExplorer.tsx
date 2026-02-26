'use client';

/**
 * IOCExplorer — Combined OpenCTI + MISP indicator view.
 * Search, filter by type/source, stats bar, enrichment detail.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
    Search, Activity, ExternalLink, Eye, X, Download,
    AlertTriangle, ShieldAlert, Clock,
} from 'lucide-react';

interface Indicator {
    id: string;
    name: string;
    value?: string;
    type?: string;
    source: 'OPENCTI' | 'MISP';
    category?: string;
    timestamp?: string;
    created?: string;
    confidence?: number;
    to_ids?: boolean;
    comment?: string;
}

interface Stats {
    total: number;
    byType: Record<string, number>;
    last24h: number;
}

function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-muted/40 rounded ${className}`} />;
}

function sourceColor(source: string) {
    return source === 'OPENCTI' ? 'text-blue-400 bg-blue-500/10' : 'text-green-400 bg-green-500/10';
}

function typeIcon(type?: string) {
    if (!type) return '📋';
    const t = type.toLowerCase();
    if (t.includes('ip') || t === 'ipv4' || t === 'ipv6') return '🌐';
    if (t.includes('domain') || t.includes('hostname')) return '🔗';
    if (t.includes('hash') || t.includes('md5') || t.includes('sha')) return '#️⃣';
    if (t.includes('url')) return '🔗';
    if (t.includes('email')) return '📧';
    return '📋';
}

export function IOCExplorer() {
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [selected, setSelected] = useState<Indicator | null>(null);

    const fetchIndicators = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ limit: '100' });
            if (sourceFilter) params.set('source', sourceFilter);
            const res = await fetch(`/api/intelligence/indicators?${params}`);
            if (!res.ok) throw new Error('API error');
            const json = await res.json();
            setIndicators(json.indicators);
            setConnected(true);
        } catch {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    }, [sourceFilter]);

    useEffect(() => { fetchIndicators(); }, [fetchIndicators]);

    const filtered = useMemo(() => {
        return indicators.filter(i => {
            const matchSearch = !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.value?.toLowerCase().includes(search.toLowerCase());
            const matchType = !typeFilter || i.type?.toLowerCase().includes(typeFilter.toLowerCase());
            return matchSearch && matchType;
        });
    }, [indicators, search, typeFilter]);

    const stats: Stats = useMemo(() => {
        const byType: Record<string, number> = {};
        let last24h = 0;
        const cutoff = Date.now() - 86_400_000;
        for (const i of indicators) {
            const t = i.type || 'unknown';
            byType[t] = (byType[t] || 0) + 1;
            const ts = i.timestamp || i.created;
            if (ts && new Date(ts).getTime() > cutoff) last24h++;
        }
        return { total: indicators.length, byType, last24h };
    }, [indicators]);

    if (!connected && !loading) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                    <Activity className="h-10 w-10 text-muted-foreground/30" />
                    <div>
                        <h3 className="text-lg font-semibold">Connect intelligence platforms to explore IOCs</h3>
                        <p className="text-sm text-muted-foreground mt-1">Deploy OpenCTI and MISP to get combined indicator intelligence.</p>
                    </div>
                    <Link href="/integrations"><Button variant="outline" className="gap-2"><ExternalLink className="h-4 w-4" /> Open Integration Hub</Button></Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-card/50">
                    <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Total IOCs</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{stats.last24h}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">New (24h)</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{Object.keys(stats.byType).length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Types</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{indicators.filter(i => i.source === 'OPENCTI').length}/{indicators.filter(i => i.source === 'MISP').length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">OpenCTI / MISP</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search or paste IOC..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">All Types</option>
                    <option value="ipv4">IPv4</option>
                    <option value="domain">Domain</option>
                    <option value="hash">Hash</option>
                    <option value="url">URL</option>
                    <option value="email">Email</option>
                </select>
                <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">All Sources</option>
                    <option value="OPENCTI">OpenCTI</option>
                    <option value="MISP">MISP</option>
                </select>
                <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => {
                    const csv = ['Value,Type,Source,Category,Timestamp', ...filtered.map(i => `"${i.value || i.name}","${i.type || ''}","${i.source}","${i.category || ''}","${i.timestamp || i.created || ''}"`)].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'iocs-export.csv' }).click();
                }}>
                    <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
            </div>

            {/* Table + Detail */}
            <div className="flex gap-4">
                <div className={`${selected ? 'flex-1' : 'w-full'}`}>
                    {loading ? (
                        <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}</div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-background z-10">
                                    <tr className="border-b bg-muted/30">
                                        <th className="text-left px-3 py-2 font-medium text-muted-foreground w-8"></th>
                                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Value</th>
                                        <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                                        <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Source</th>
                                        <th className="px-3 py-2 w-8" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.slice(0, 100).map(ioc => (
                                        <tr key={ioc.id} className={`border-b hover:bg-muted/20 cursor-pointer transition-colors ${selected?.id === ioc.id ? 'bg-primary/5' : ''}`} onClick={() => setSelected(ioc)}>
                                            <td className="px-3 py-2">{typeIcon(ioc.type)}</td>
                                            <td className="px-3 py-2 font-mono text-xs truncate max-w-[300px]">{ioc.value || ioc.name}</td>
                                            <td className="px-3 py-2 text-xs text-muted-foreground hidden md:table-cell">{ioc.type || '—'}</td>
                                            <td className="px-3 py-2 hidden lg:table-cell">
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sourceColor(ioc.source)}`}>{ioc.source}</span>
                                            </td>
                                            <td className="px-3 py-2"><Eye className="h-3.5 w-3.5 text-muted-foreground" /></td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No indicators found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail panel */}
                {selected && (
                    <Card className="w-80 shrink-0 hidden lg:block">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-1">
                                <ShieldAlert className="h-4 w-4 text-red-400" /> IOC Detail
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelected(null)}><X className="h-3.5 w-3.5" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                            <div>
                                <p className="text-muted-foreground mb-0.5">Value</p>
                                <p className="font-mono text-xs break-all">{selected.value || selected.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><p className="text-muted-foreground mb-0.5">Type</p><p>{selected.type || '—'}</p></div>
                                <div><p className="text-muted-foreground mb-0.5">Source</p><span className={`text-[10px] px-1.5 py-0.5 rounded ${sourceColor(selected.source)}`}>{selected.source}</span></div>
                            </div>
                            {selected.category && <div><p className="text-muted-foreground mb-0.5">Category</p><p>{selected.category}</p></div>}
                            {selected.comment && <div><p className="text-muted-foreground mb-0.5">Comment</p><p className="text-muted-foreground">{selected.comment}</p></div>}
                            {(selected.timestamp || selected.created) && (
                                <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{new Date(selected.timestamp || selected.created || '').toLocaleString()}</div>
                            )}
                            <div className="pt-2 flex flex-col gap-1.5">
                                <Link href="/intelligence?tab=enrichment">
                                    <Button variant="outline" size="sm" className="w-full gap-1.5 h-7 text-xs"><AlertTriangle className="h-3 w-3" /> Enrich</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
