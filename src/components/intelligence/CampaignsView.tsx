'use client';

/**
 * CampaignsView — OpenCTI campaigns table with detail panel.
 * Filters: region, severity. Sortable columns.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
    Crosshair, Search, X, ExternalLink, ChevronRight,
    Calendar, MapPin, Shield, BrainCircuit,
} from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    description?: string;
    confidence?: number;
    first_seen?: string;
    last_seen?: string;
    targetSectors?: string[];
    targetRegions?: string[];
    attackPatterns?: Array<{ id: string; name: string; mitre_id?: string }>;
    indicators?: Array<{ id: string; name: string }>;
}

function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-muted/40 rounded ${className}`} />;
}

function severityFromConfidence(confidence?: number): { label: string; color: string; bg: string } {
    if (!confidence || confidence >= 85) return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (confidence >= 60) return { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    if (confidence >= 40) return { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    return { label: 'LOW', color: 'text-blue-400', bg: 'bg-blue-500/10' };
}

function formatDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function CampaignsView() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Campaign | null>(null);
    const [regionFilter, setRegionFilter] = useState('');

    const fetchCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ limit: '50' });
            if (regionFilter) params.set('region', regionFilter);
            const res = await fetch(`/api/intelligence/campaigns?${params}`);
            if (!res.ok) throw new Error('API error');
            const json = await res.json();
            setCampaigns(json.campaigns);
            setConnected(true);
        } catch {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    }, [regionFilter]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const filtered = campaigns.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
    );

    if (!connected && !loading) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                    <Crosshair className="h-10 w-10 text-muted-foreground/30" />
                    <div>
                        <h3 className="text-lg font-semibold">Connect OpenCTI to view active campaigns</h3>
                        <p className="text-sm text-muted-foreground mt-1">Deploy the intelligence stack and configure OpenCTI to track threat campaigns.</p>
                    </div>
                    <Link href="/integrations"><Button variant="outline" className="gap-2"><ExternalLink className="h-4 w-4" /> Open Integration Hub</Button></Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex gap-4">
            {/* Table */}
            <div className={`${selected ? 'flex-1' : 'w-full'} space-y-4`}>
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
                    </div>
                    <select
                        value={regionFilter}
                        onChange={e => setRegionFilter(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="">All Regions</option>
                        <option value="europe">Europe</option>
                        <option value="asia">Asia-Pacific</option>
                        <option value="americas">Americas</option>
                        <option value="middle-east">Middle East</option>
                    </select>
                </div>

                {loading ? (
                    <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Campaign</th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">Severity</th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">First Seen</th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Last Seen</th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => {
                                    const sev = severityFromConfidence(c.confidence);
                                    return (
                                        <tr
                                            key={c.id}
                                            className={`border-b hover:bg-muted/20 cursor-pointer transition-colors ${selected?.id === c.id ? 'bg-primary/5' : ''}`}
                                            onClick={() => setSelected(c)}
                                        >
                                            <td className="px-3 py-2.5">
                                                <div className="font-medium">{c.name}</div>
                                                {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                                            </td>
                                            <td className="px-3 py-2.5 hidden md:table-cell">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sev.bg} ${sev.color}`}>{sev.label}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{formatDate(c.first_seen)}</td>
                                            <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{formatDate(c.last_seen)}</td>
                                            <td className="px-3 py-2.5"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No campaigns found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            {selected && (
                <Card className="w-96 shrink-0 hidden lg:block">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">{selected.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelected(null)}><X className="h-3.5 w-3.5" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        {selected.description && <p className="text-muted-foreground text-xs">{selected.description}</p>}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(selected.first_seen)} → {formatDate(selected.last_seen)}</span>
                        </div>

                        {selected.targetRegions && selected.targetRegions.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Target Regions</p>
                                <div className="flex flex-wrap gap-1">
                                    {selected.targetRegions.map(r => (
                                        <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"><MapPin className="inline h-2.5 w-2.5 mr-0.5" />{r}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selected.attackPatterns && selected.attackPatterns.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><BrainCircuit className="h-3 w-3" /> ATT&CK Techniques</p>
                                <div className="flex flex-wrap gap-1">
                                    {selected.attackPatterns.map(ap => (
                                        <span key={ap.id} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">{ap.mitre_id || ap.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selected.indicators && selected.indicators.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Shield className="h-3 w-3" /> IOCs ({selected.indicators.length})</p>
                                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                                    {selected.indicators.slice(0, 10).map(ind => (
                                        <p key={ind.id} className="text-[10px] text-muted-foreground font-mono truncate">{ind.name}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selected.confidence !== undefined && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Confidence:</span>
                                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${selected.confidence}%` }} />
                                </div>
                                <span className="text-xs font-mono">{selected.confidence}%</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
