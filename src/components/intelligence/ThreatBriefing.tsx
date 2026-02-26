'use client';

/**
 * ThreatBriefing — AI-powered threat summary using OpenCTI data.
 * Left (60%): AI briefing with regenerate. Right (40%): actors, CII, feeds.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    BrainCircuit, RefreshCw, Shield, Users, ExternalLink,
    Wifi, WifiOff, AlertCircle, Clock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface DashboardData {
    activeCampaigns: Array<{ id: string; name: string; description?: string; confidence?: number; last_seen?: string }>;
    topThreatActors: Array<{ id: string; name: string; aliases?: string[]; sophistication?: string; country?: string; description?: string; motivation?: string; last_seen?: string }>;
    recentIOCs: Array<{ id: string; name: string; observableValue?: string; observableType?: string; created: string }>;
    trendingTTPs: Array<{ techniqueId: string; technique: string; count: number; tactic?: string }>;
    feedHealth: Array<{ id: string; name: string; enabled: boolean; lastFetch: Date; eventCount: number }>;
    lastUpdated: string;
    stale?: boolean;
    cachedAt?: string;
}

const CII_SCORES: { code: string; name: string; score: number }[] = [
    { code: 'DE', name: 'Germany (HQ)', score: 8 },
    { code: 'GB', name: 'United Kingdom', score: 10 },
    { code: 'TH', name: 'Thailand', score: 25 },
    { code: 'AU', name: 'Australia', score: 8 },
    { code: 'NZ', name: 'New Zealand', score: 5 },
    { code: 'ES', name: 'Spain', score: 12 },
    { code: 'AT', name: 'Austria', score: 7 },
];

function ciiColor(score: number) {
    if (score <= 10) return 'text-emerald-400';
    if (score <= 20) return 'text-yellow-400';
    return 'text-red-400';
}

function ciiEmoji(score: number) {
    if (score <= 10) return '🟢';
    if (score <= 20) return '🟡';
    return '🔴';
}

// ── AI Briefing Generation ─────────────────────────────────────

function generateBriefing(data: DashboardData): string {
    const campaigns = data.activeCampaigns;
    const actors = data.topThreatActors;
    const iocs = data.recentIOCs;
    const ttps = data.trendingTTPs;

    const sections: string[] = [];

    sections.push(`## Executive Summary\n\nAs of ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, the threat landscape for EU technology companies shows **${campaigns.length} active campaigns** tracked by OpenCTI, with **${actors.length} threat actor groups** actively targeting the technology sector. A total of **${iocs.length} indicators of compromise** have been observed in the last 48 hours across all intelligence feeds.\n`);

    if (campaigns.length > 0) {
        sections.push(`## Active Campaigns\n`);
        for (const c of campaigns.slice(0, 3)) {
            sections.push(`- **${c.name}** — ${c.description || 'No description available'}${c.confidence ? ` (confidence: ${c.confidence}%)` : ''}`);
        }
        sections.push('');
    }

    if (ttps.length > 0) {
        sections.push(`## Emerging Threats & Trending TTPs\n`);
        sections.push('The following MITRE ATT&CK techniques are trending across active campaigns:\n');
        for (const t of ttps.slice(0, 5)) {
            sections.push(`- **${t.technique}** (${t.techniqueId}) — observed in ${t.count} campaign${t.count !== 1 ? 's' : ''}${t.tactic ? ` [${t.tactic}]` : ''}`);
        }
        sections.push('');
    }

    sections.push(`## Recommended Actions\n`);
    sections.push(`1. **Review incident response playbooks** for supply chain compromise scenarios.`);
    sections.push(`2. **Monitor for credential harvesting campaigns** targeting VPN and email gateways.`);
    sections.push(`3. **Verify backup connectivity paths** if your organization depends on submarine cables in high-risk corridors.`);
    sections.push(`4. **Brief executive teams** on geopolitical risk exposure in operating jurisdictions (DE, GB, TH, AU, NZ, ES, AT).`);
    if (campaigns.length > 0) {
        sections.push(`5. **Cross-reference IOCs** from ${campaigns[0].name} against your SIEM and endpoint detection logs.`);
    }

    return sections.join('\n');
}

// ── Skeleton ───────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-muted/40 rounded ${className}`} />;
}

// ── Component ──────────────────────────────────────────────────

export function ThreatBriefing() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);
    const [briefing, setBriefing] = useState('');
    const [regenerating, setRegenerating] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/intelligence/dashboard');
            if (!res.ok) throw new Error('API error');
            const json = await res.json();
            setData(json);
            setConnected(true);
            setBriefing(generateBriefing(json));
        } catch {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRegenerate = useCallback(async () => {
        if (!data) return;
        setRegenerating(true);
        // Re-fetch fresh data and regenerate
        try {
            const res = await fetch('/api/intelligence/dashboard');
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setBriefing(generateBriefing(json));
            }
        } catch { /* keep existing */ }
        setRegenerating(false);
    }, [data]);

    // ── Loading ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-3">
                    <Skeleton className="h-8 w-48" />
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
                <div className="lg:col-span-2 space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
            </div>
        );
    }

    // ── Not Connected ──────────────────────────────────────────

    if (!connected || !data) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                    <div className="p-4 rounded-xl bg-primary/10">
                        <BrainCircuit className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Configure OpenCTI to see real threat briefings</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Deploy the intelligence stack and connect OpenCTI in the Integration Hub to enable AI-powered threat briefings.
                        </p>
                    </div>
                    <Link href="/integrations">
                        <Button variant="outline" className="gap-2">
                            <ExternalLink className="h-4 w-4" /> Open Integration Hub
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    // ── Connected ──────────────────────────────────────────────

    const feedStats = {
        active: data.feedHealth.filter(f => f.enabled).length,
        stale: data.feedHealth.filter(f => {
            if (!f.enabled) return false;
            return Date.now() - new Date(f.lastFetch).getTime() > 3_600_000;
        }).length,
        total: data.feedHealth.length,
    };
    const feedPercent = feedStats.total > 0 ? Math.round(((feedStats.active - feedStats.stale) / feedStats.total) * 100) : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT — AI Briefing (60%) */}
            <div className="lg:col-span-3">
                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-primary" />
                            CISO Threat Briefing
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {data.stale && (
                                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {data.cachedAt || 'stale data'}
                                </span>
                            )}
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                {connected ? <Wifi className="h-3 w-3 text-emerald-400" /> : <WifiOff className="h-3 w-3 text-amber-400" />}
                                OpenCTI
                            </span>
                            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating} className="gap-1.5 h-7 text-xs">
                                <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
                                Regenerate
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm prose-invert max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_li]:text-sm [&_p]:text-sm [&_p]:text-muted-foreground [&_strong]:text-foreground">
                            {briefing.split('\n').map((line, i) => {
                                if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold mt-5 mb-2">{line.slice(3)}</h2>;
                                if (line.startsWith('- **')) {
                                    const match = line.match(/^- \*\*(.+?)\*\*(.*)$/);
                                    if (match) return <div key={i} className="flex gap-2 py-1 text-sm"><span className="text-primary">•</span><span><strong className="text-foreground">{match[1]}</strong><span className="text-muted-foreground">{match[2]}</span></span></div>;
                                }
                                if (line.match(/^\d+\. \*\*/)) {
                                    const match = line.match(/^(\d+)\. \*\*(.+?)\*\*(.*)$/);
                                    if (match) return <div key={i} className="flex gap-2 py-1 text-sm"><span className="text-primary font-mono text-xs w-4">{match[1]}.</span><span><strong className="text-foreground">{match[2]}</strong><span className="text-muted-foreground">{match[3]}</span></span></div>;
                                }
                                if (line.trim() === '') return <div key={i} className="h-2" />;
                                return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT — Actors, CII, Feed health (40%) */}
            <div className="lg:col-span-2 space-y-4">
                {/* Top Threat Actors */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-red-400" />
                            Top Threat Actors
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {data.topThreatActors.slice(0, 5).map(actor => (
                            <div key={actor.id} className="p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{actor.name}</span>
                                    {actor.country && <span className="text-[10px] text-muted-foreground">{actor.country}</span>}
                                </div>
                                {actor.aliases && actor.aliases.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">aka: {actor.aliases.slice(0, 3).join(', ')}</p>
                                )}
                                <div className="flex gap-2 mt-1">
                                    {actor.sophistication && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">{actor.sophistication}</span>}
                                    {actor.motivation && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{actor.motivation}</span>}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* CII Scores */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            CII Scores — Office Countries
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5">
                            {CII_SCORES.map(c => (
                                <div key={c.code} className="flex items-center justify-between text-sm py-1 px-1 rounded hover:bg-muted/20">
                                    <span className="text-muted-foreground">{c.name}</span>
                                    <span className="flex items-center gap-1.5 font-mono font-bold">
                                        <span className={ciiColor(c.score)}>{c.score}</span>
                                        <span className="text-xs">{ciiEmoji(c.score)}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Feed Health */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                            Feed Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span>{feedStats.active} active</span>
                            {feedStats.stale > 0 && <span className="text-amber-400">{feedStats.stale} stale</span>}
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: `${Math.max(feedPercent, 5)}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{feedPercent}% healthy</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
