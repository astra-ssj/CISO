'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BrainCircuit, Globe, Loader2, Crosshair, Users, Shield,
    CheckCircle2, AlertTriangle, FileText, Sparkles,
} from 'lucide-react';
import type { ThreatBrief } from '@/lib/ai/osint-engine';

export function ThreatBriefingTab() {
    const [industry, setIndustry] = useState('Financial Services');
    const [region, setRegion] = useState('Global');
    const [focus, setFocus] = useState('');
    const [brief, setBrief] = useState<ThreatBrief | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // World brief state
    const [worldBrief, setWorldBrief] = useState<string | null>(null);
    const [worldBriefLoading, setWorldBriefLoading] = useState(false);

    const handleGenerateBrief = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/intelligence/osint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ industry, region, focusAreas: focus }),
            });
            if (!res.ok) throw new Error('Failed to generate brief');
            const data = await res.json();
            setBrief(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleWorldBrief = async () => {
        setWorldBriefLoading(true);
        try {
            const res = await fetch('/api/intelligence/brief');
            if (!res.ok) throw new Error('Failed to fetch world brief');
            const data = await res.json();
            setWorldBrief(data.brief || data.summary || 'No brief available.');
        } catch {
            setWorldBrief('Unable to generate world brief. Configure AI provider in Settings.');
        } finally {
            setWorldBriefLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* AI World Brief Banner */}
            <Card className="bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-transparent border-cyan-500/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <Sparkles className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">AI World Brief</CardTitle>
                                <CardDescription>AI-synthesized global threat summary</CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleWorldBrief}
                            disabled={worldBriefLoading}
                            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                        >
                            {worldBriefLoading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                            ) : (
                                <><BrainCircuit className="h-4 w-4 mr-2" />Generate Brief</>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                {worldBrief && (
                    <CardContent>
                        <div className="p-4 rounded-lg bg-secondary/20 border border-border/30 text-sm text-slate-300 whitespace-pre-line">
                            {worldBrief}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Industry Threat Brief */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <Card className="bg-card/40 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Globe className="h-5 w-5 text-cyan-400" />
                                Generate Threat Brief
                            </CardTitle>
                            <CardDescription>AI-powered threat landscape analysis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="brief-industry">Industry Sector</Label>
                                <select
                                    id="brief-industry"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                >
                                    {['Financial Services', 'Healthcare', 'Technology', 'Manufacturing', 'Retail', 'Government', 'Energy', 'Education', 'Telecommunications'].map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brief-region">Region</Label>
                                <select
                                    id="brief-region"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                >
                                    {['Global', 'North America', 'Europe (EMEA)', 'Asia-Pacific', 'Middle East', 'Latin America'].map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brief-focus">Focus Areas (optional)</Label>
                                <Textarea
                                    id="brief-focus"
                                    placeholder="e.g. Ransomware, supply chain attacks..."
                                    value={focus}
                                    onChange={(e) => setFocus(e.target.value)}
                                    className="min-h-[60px]"
                                />
                            </div>
                            <Button onClick={handleGenerateBrief} disabled={loading} className="w-full">
                                {loading ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                                ) : (
                                    <><BrainCircuit className="h-4 w-4 mr-2" />Generate Threat Brief</>
                                )}
                            </Button>
                            {error && <p className="text-xs text-red-400">{error}</p>}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    {!brief ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 border border-dashed border-border/30 rounded-xl bg-card/10">
                            <Globe className="h-16 w-16 mb-4 opacity-20 text-muted-foreground" />
                            <h3 className="text-xl font-semibold text-muted-foreground mb-2">Threat Intelligence Ready</h3>
                            <p className="text-center max-w-md text-muted-foreground">
                                Select your industry and region to generate an AI-powered threat landscape analysis.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[600px]">
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pr-4">
                                {/* Brief Header */}
                                <Card className="border-primary/30 bg-card/40">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <Badge variant="outline" className="mb-1 border-cyan-500/30 text-cyan-400">AI Generated</Badge>
                                                <h3 className="text-lg font-bold">Threat Landscape: {brief.industry} — {brief.region}</h3>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${brief.overallRiskLevel === 'critical' ? 'bg-red-500/10 text-red-400' : brief.overallRiskLevel === 'high' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                {brief.overallRiskLevel.toUpperCase()} RISK
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{brief.summary}</p>
                                        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                            <span>Confidence: {brief.confidence}%</span>
                                            <span>Generated: {new Date(brief.generatedAt).toLocaleString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Top Threats */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Crosshair className="h-4 w-4 text-red-400" /> Top Threats
                                    </h4>
                                    {brief.topThreats.map((threat, i) => (
                                        <Card key={i} className="bg-card/30">
                                            <CardContent className="p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${threat.severity === 'critical' ? 'bg-red-500/10 text-red-400' : threat.severity === 'high' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                        {threat.severity}
                                                    </span>
                                                    <span className="text-sm font-medium">{threat.threat}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-2">{threat.description}</p>
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                    {threat.mitreTechniques.map((t) => (
                                                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">{t}</span>
                                                    ))}
                                                </div>
                                                <div className="text-[10px] text-zinc-500">
                                                    Mitigations: {threat.mitigations.join(' • ')}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Threat Actors */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Users className="h-4 w-4 text-amber-400" /> Threat Actors
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {brief.threatActors.map((actor, i) => (
                                            <Card key={i} className="bg-card/20">
                                                <CardContent className="p-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium">{actor.name}</span>
                                                        <Badge variant="outline" className="text-[9px]">{actor.sophistication}</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-1">{actor.motivation}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {actor.targetSectors.map((s) => (
                                                            <span key={s} className="text-[9px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">{s}</span>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <Card className="bg-card/20 border-emerald-500/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-emerald-400" /> Strategic Recommendations
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {brief.recommendations.map((rec, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                                                    <span className="text-muted-foreground">{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
}
