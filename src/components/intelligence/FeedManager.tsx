'use client';

/**
 * FeedManager — MISP feed status, health, recommended feeds.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Rss, ExternalLink, RefreshCw, CheckCircle2,
    AlertTriangle, XCircle, Clock,
} from 'lucide-react';

interface Feed {
    id: string;
    name: string;
    provider: string;
    url: string;
    enabled: boolean;
    lastFetch?: string;
    eventCount?: number;
}

interface FeedStatus {
    total: number;
    enabled: number;
    stale: number;
}

const RECOMMENDED_FEEDS = [
    { name: 'CIRCL OSINT Feed', provider: 'CIRCL', desc: 'Curated OSINT intelligence from CIRCL MISP community' },
    { name: 'Abuse.ch URLhaus', provider: 'abuse.ch', desc: 'Malicious URLs used for malware distribution' },
    { name: 'Abuse.ch MalwareBazaar', provider: 'abuse.ch', desc: 'Malware sample hashes and metadata' },
    { name: 'AlienVault OTX', provider: 'AT&T Cybersecurity', desc: 'Crowd-sourced threat intelligence pulses' },
    { name: 'Botvrij.eu', provider: 'Botvrij', desc: 'Dutch CERT botnet and malware indicators' },
    { name: 'BlocklistDE', provider: 'BlocklistDE', desc: 'IP blacklists from brute-force and attack reports' },
];

function feedStatusBadge(feed: Feed): { icon: React.ElementType; color: string; label: string } {
    if (!feed.enabled) return { icon: XCircle, color: 'text-muted-foreground', label: 'Disabled' };
    if (!feed.lastFetch) return { icon: AlertTriangle, color: 'text-red-400', label: 'Unknown' };
    const age = Date.now() - new Date(feed.lastFetch).getTime();
    if (age < 300_000) return { icon: CheckCircle2, color: 'text-emerald-400', label: 'Fresh' };
    if (age < 3_600_000) return { icon: Clock, color: 'text-yellow-400', label: 'Stale' };
    return { icon: AlertTriangle, color: 'text-red-400', label: 'Error' };
}

function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-muted/40 rounded ${className}`} />;
}

export function FeedManager() {
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [feedStatus, setFeedStatus] = useState<FeedStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);

    const fetchFeeds = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/intelligence/feeds');
            if (!res.ok) throw new Error('API error');
            const json = await res.json();
            setFeeds(json.feeds || []);
            setFeedStatus(json.feedStatus || null);
            setConnected(true);
        } catch {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFeeds(); }, [fetchFeeds]);

    if (!connected && !loading) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                    <Rss className="h-10 w-10 text-muted-foreground/30" />
                    <div>
                        <h3 className="text-lg font-semibold">Connect MISP to manage intelligence feeds</h3>
                        <p className="text-sm text-muted-foreground mt-1">Deploy MISP and enable community feeds for threat indicator ingestion.</p>
                    </div>
                    <Link href="/integrations"><Button variant="outline" className="gap-2"><ExternalLink className="h-4 w-4" /> Open Integration Hub</Button></Link>
                </CardContent>
            </Card>
        );
    }

    const totalEvents = feeds.reduce((acc, f) => acc + (f.eventCount ?? 0), 0);

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-card/50">
                    <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{feeds.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Total Feeds</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{feeds.filter(f => f.enabled).length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Enabled</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{totalEvents.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Events Ingested</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{feedStatus?.stale || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase text-amber-400">Stale Feeds</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Feeds */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Rss className="h-4 w-4 text-primary" /> Active Feeds
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={fetchFeeds}><RefreshCw className="h-3 w-3" /> Refresh</Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>
                        ) : feeds.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No feeds configured. Enable recommended feeds below.</p>
                        ) : (
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                {feeds.map(feed => {
                                    const status = feedStatusBadge(feed);
                                    const StatusIcon = status.icon;
                                    return (
                                        <div key={feed.id} className="flex items-center justify-between p-2.5 rounded-md bg-muted/10 hover:bg-muted/20 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium truncate">{feed.name}</span>
                                                    <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${status.color}`} />
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                                                    <span>{feed.provider}</span>
                                                    <span>{(feed.eventCount ?? 0).toLocaleString()} events</span>
                                                    <span>{feed.lastFetch ? new Date(feed.lastFetch).toLocaleString() : 'Never'}</span>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${feed.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                                {feed.enabled ? 'ON' : 'OFF'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recommended Feeds */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Recommended Free Feeds
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {RECOMMENDED_FEEDS.map(feed => (
                                <div key={feed.name} className="p-2.5 rounded-md bg-muted/10 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{feed.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{feed.provider}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{feed.desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-3 text-center">
                            Enable feeds in MISP → Sync Actions → Feeds
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Intelligence Gaps */}
            <Card className="border-amber-500/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" /> Intelligence Gaps
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        {feeds.filter(f => !f.enabled).length > 0
                            ? `${feeds.filter(f => !f.enabled).length} feeds are disabled. You may be missing indicators from these sources.`
                            : feedStatus && feedStatus.stale > 0
                                ? `${feedStatus.stale} feeds are stale (>1 hour since last fetch). Check MISP sync status.`
                                : 'All enabled feeds are healthy. No known intelligence gaps.'}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
