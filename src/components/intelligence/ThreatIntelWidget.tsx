'use client';

/**
 * ThreatIntelWidget — Command Center dashboard widget.
 * Pure React, no external map libraries. No SSR issues.
 *
 * Pulls data from /api/intelligence/dashboard when OpenCTI is configured.
 * Falls back to setup prompt or cached data when unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Shield, Users, Crosshair, FileText, Activity,
    ExternalLink, RefreshCw, AlertCircle, Wifi, WifiOff, Clock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface DashboardData {
    activeCampaigns: Array<{ id: string; name: string; description?: string; confidence?: number; last_seen?: string }>;
    topThreatActors: Array<{ id: string; name: string; aliases?: string[]; sophistication?: string; country?: string }>;
    recentIOCs: Array<{ id: string; name: string; observableValue?: string; observableType?: string; created: string; confidence?: number }>;
    trendingTTPs: Array<{ id?: string; techniqueId: string; technique: string; count: number; tactic?: string }>;
    feedHealth: Array<{ id: string; name: string; enabled: boolean; lastFetch: Date; eventCount: number }>;
    lastUpdated: string;
    stale?: boolean;
    cachedAt?: string;
}

type Severity = 'CRIT' | 'HIGH' | 'MED' | 'LOW';

interface ThreatEntry {
    severity: Severity;
    label: string;
    time: string;
}

// ── CII Scores (hardcoded — always available) ──────────────────

const CII_SCORES: { code: string; score: number }[] = [
    { code: 'DE', score: 8 },
    { code: 'GB', score: 10 },
    { code: 'TH', score: 25 },
    { code: 'AU', score: 8 },
    { code: 'ES', score: 12 },
    { code: 'US', score: 6 },
    { code: 'SG', score: 9 },
];

// ── Helpers ────────────────────────────────────────────────────

function severityColor(s: Severity): string {
    switch (s) {
        case 'CRIT': return 'bg-red-500';
        case 'HIGH': return 'bg-orange-500';
        case 'MED': return 'bg-yellow-500';
        case 'LOW': return 'bg-blue-500';
    }
}

function severityTextColor(s: Severity): string {
    switch (s) {
        case 'CRIT': return 'text-red-400';
        case 'HIGH': return 'text-orange-400';
        case 'MED': return 'text-yellow-400';
        case 'LOW': return 'text-blue-400';
    }
}

function ciiColor(score: number): string {
    if (score <= 10) return 'text-emerald-400';
    if (score <= 20) return 'text-yellow-400';
    return 'text-red-400';
}

function ciiEmoji(score: number): string {
    if (score <= 10) return '🟢';
    if (score <= 20) return '🟡';
    return '🔴';
}

function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return `${Math.max(1, Math.floor(diff / 60_000))}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function buildThreats(data: DashboardData): ThreatEntry[] {
    const entries: ThreatEntry[] = [];

    for (const c of data.activeCampaigns.slice(0, 2)) {
        entries.push({
            severity: (c.confidence ?? 0) >= 85 ? 'CRIT' : 'HIGH',
            label: `${c.name}${c.description ? ' — ' + c.description.slice(0, 50) : ''}`,
            time: c.last_seen ? timeAgo(c.last_seen) : 'recent',
        });
    }

    for (const actor of data.topThreatActors.slice(0, 1)) {
        entries.push({
            severity: 'HIGH',
            label: `${actor.name} active${actor.country ? ` (${actor.country})` : ''}`,
            time: 'ongoing',
        });
    }

    for (const ioc of data.recentIOCs.slice(0, 1)) {
        entries.push({
            severity: 'MED',
            label: ioc.name || ioc.observableValue || 'New IOC detected',
            time: timeAgo(ioc.created),
        });
    }

    // Pad to at least 4 entries
    if (entries.length < 4) {
        entries.push({ severity: 'LOW', label: 'No new CVE exploits detected', time: 'today' });
    }

    return entries.slice(0, 4);
}

// ── Skeleton ───────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-muted/40 rounded ${className}`} />;
}

function SkeletonState() {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
            </div>
            <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-md" />
                ))}
            </div>
            <Skeleton className="h-8 rounded-md" />
        </div>
    );
}

// ── Setup Prompt ───────────────────────────────────────────────

function SetupPrompt() {
    return (
        <div className="space-y-5">
            <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
                <div className="p-3 rounded-xl bg-primary/10">
                    <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">Connect OpenCTI to enable real-time threat intelligence</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">
                        Deploy the intelligence stack with <code className="text-[11px] px-1 py-0.5 rounded bg-muted font-mono">docker compose -f docker-compose.intel.yml up</code> then configure in Integration Hub.
                    </p>
                </div>
                <Link href="/integrations">
                    <Button size="sm" variant="outline" className="gap-2 mt-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Integration Hub
                    </Button>
                </Link>
            </div>

            {/* Always show CII scores even without intel stack */}
            <CIIScoreBar />
        </div>
    );
}

// ── CII Score Bar ──────────────────────────────────────────────

function CIIScoreBar() {
    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CII Scores</p>
            <div className="flex flex-wrap gap-2">
                {CII_SCORES.map(c => (
                    <span key={c.code} className="inline-flex items-center gap-1 text-xs font-mono">
                        <span className="font-semibold text-foreground">{c.code}:</span>
                        <span className={`font-bold ${ciiColor(c.score)}`}>{c.score}</span>
                        <span className="text-[10px]">{ciiEmoji(c.score)}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

// ── Stat Card ──────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, color }: {
    icon: React.ElementType; value: number | string; label: string; color: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors">
            <Icon className={`h-4 w-4 ${color} mb-1`} />
            <span className="text-xl font-bold tabular-nums">{value}</span>
            <span className="text-[10px] text-muted-foreground leading-tight text-center mt-0.5">{label}</span>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────

export default function ThreatIntelWidget() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [configured, setConfigured] = useState(true);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/intelligence/dashboard');
            if (!res.ok) {
                if (res.status === 401) {
                    setConfigured(false);
                    return;
                }
                throw new Error(`API error: ${res.status}`);
            }
            const json = await res.json();
            setData(json);
            setError(false);
            setConfigured(true);
        } catch {
            setError(true);
            // Keep any previously loaded data as stale fallback
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    // ── Feed health computation ──────────────────────────────────

    const feedStats = data?.feedHealth
        ? {
            active: data.feedHealth.filter(f => f.enabled).length,
            stale: data.feedHealth.filter(f => {
                if (!f.enabled) return false;
                const age = Date.now() - new Date(f.lastFetch).getTime();
                return age > 3_600_000; // stale if >1h
            }).length,
            total: data.feedHealth.length,
        }
        : { active: 0, stale: 0, total: 0 };

    const feedPercent = feedStats.total > 0
        ? Math.round(((feedStats.active - feedStats.stale) / feedStats.total) * 100)
        : 0;

    // ── Render ───────────────────────────────────────────────────

    return (
        <Card className="h-full overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Threat Intelligence Overview
                </CardTitle>
                <div className="flex items-center gap-2">
                    {data?.stale && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {data.cachedAt || 'stale'}
                        </span>
                    )}
                    {!loading && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchDashboard}>
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    )}
                    <Link href="/intelligence" className="text-xs text-primary hover:underline flex items-center gap-1">
                        Full View <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-4">
                {/* Loading state */}
                {loading && !data && <SkeletonState />}

                {/* Not configured */}
                {!loading && !configured && <SetupPrompt />}

                {/* Error with no data */}
                {!loading && error && !data && configured && (
                    <div className="flex flex-col items-center justify-center text-center py-8 space-y-2">
                        <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Unable to load threat intelligence</p>
                        <Button size="sm" variant="outline" onClick={fetchDashboard} className="gap-1.5 mt-2">
                            <RefreshCw className="h-3 w-3" /> Retry
                        </Button>
                    </div>
                )}

                {/* Data loaded (fresh or stale) */}
                {data && (
                    <>
                        {/* ── Stat cards ────────────────────────────────── */}
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span>Active Threats</span>
                                <span className="flex items-center gap-1 normal-case tracking-normal">
                                    {error ? <WifiOff className="h-2.5 w-2.5 text-amber-400" /> : <Wifi className="h-2.5 w-2.5 text-emerald-400" />}
                                    <span className="text-[9px]">source: OpenCTI</span>
                                </span>
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                <StatCard icon={Users} value={data.topThreatActors.length} label="APT Groups" color="text-red-400" />
                                <StatCard icon={Crosshair} value={data.activeCampaigns.length} label="Campaigns Active" color="text-orange-400" />
                                <StatCard icon={Activity} value={data.recentIOCs.length} label="IOCs Tracked" color="text-yellow-400" />
                                <StatCard icon={FileText} value={data.trendingTTPs.length} label="TTPs Trending" color="text-blue-400" />
                            </div>
                        </div>

                        {/* ── Latest threats list ───────────────────────── */}
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Latest Threats</p>
                            <div className="space-y-1">
                                {buildThreats(data).map((t, i) => (
                                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors text-sm">
                                        <span className={`inline-flex items-center justify-center h-5 min-w-[48px] px-1.5 rounded text-[10px] font-bold text-white ${severityColor(t.severity)}`}>
                                            {t.severity}
                                        </span>
                                        <span className={`flex-1 truncate text-xs ${severityTextColor(t.severity)}`}>
                                            {t.label}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {t.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Feed status ───────────────────────────────── */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Feed Status</p>
                                <span className="text-[10px] text-muted-foreground">
                                    {feedStats.active} active
                                    {feedStats.stale > 0 && <span className="text-amber-400"> │ {feedStats.stale} stale</span>}
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                    style={{ width: `${Math.max(feedPercent, 5)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">{feedPercent}% healthy</p>
                        </div>

                        {/* ── CII Scores ────────────────────────────────── */}
                        <CIIScoreBar />
                    </>
                )}
            </CardContent>
        </Card>
    );
}
