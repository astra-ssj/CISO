'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Cable, Fuel, Server, Atom, Wifi, WifiOff, RefreshCw, Loader2,
    Globe, AlertTriangle, Shield, MapPin, Building2,
} from 'lucide-react';

interface InfraItem {
    id: string;
    name: string;
    type: string;
    location: string;
    status: 'operational' | 'degraded' | 'disrupted' | 'unknown';
    details: string;
    lastUpdated: string;
}

interface OutageEvent {
    id: string;
    country: string;
    asn?: string;
    provider?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    startTime: string;
    endTime?: string;
    trafficDrop: number;
}

const INFRA_CATEGORIES = [
    {
        id: 'cables',
        name: 'Undersea Cables',
        icon: Cable,
        color: 'text-cyan-400',
        bg: 'from-cyan-500/5',
        border: 'border-cyan-500/20',
        description: 'Submarine telecommunications cable network',
    },
    {
        id: 'pipelines',
        name: 'Oil & Gas Pipelines',
        icon: Fuel,
        color: 'text-lime-400',
        bg: 'from-lime-500/5',
        border: 'border-lime-500/20',
        description: 'Major energy pipeline infrastructure',
    },
    {
        id: 'datacenters',
        name: 'AI Datacenters',
        icon: Server,
        color: 'text-violet-400',
        bg: 'from-violet-500/5',
        border: 'border-violet-500/20',
        description: 'Cloud & AI datacenter locations',
    },
    {
        id: 'nuclear',
        name: 'Nuclear Facilities',
        icon: Atom,
        color: 'text-yellow-400',
        bg: 'from-yellow-500/5',
        border: 'border-yellow-500/20',
        description: 'Nuclear power plants & research reactors',
    },
    {
        id: 'military',
        name: 'Military Bases',
        icon: Building2,
        color: 'text-orange-400',
        bg: 'from-orange-500/5',
        border: 'border-orange-500/20',
        description: '220+ global military installations',
    },
];

export function InfrastructureTab() {
    const [outages, setOutages] = useState<OutageEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('cables');

    const fetchOutages = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/intelligence/outages');
            if (res.ok) {
                const data = await res.json();
                setOutages(data.outages || []);
            }
        } catch (e) {
            console.error('Outage fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOutages();
    }, []);

    const statusColor = (status: string) => {
        switch (status) {
            case 'operational': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'degraded': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'disrupted': return 'bg-red-500/10 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Category Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {INFRA_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`text-left p-4 rounded-xl border transition-all ${isActive
                                ? `bg-gradient-to-br ${cat.bg} ${cat.border} ring-1 ring-${cat.color.replace('text-', '')}/30`
                                : 'bg-card/20 border-border/30 hover:bg-card/40'
                                }`}
                        >
                            <Icon className={`h-6 w-6 ${isActive ? cat.color : 'text-muted-foreground'} mb-2`} />
                            <div className="text-sm font-semibold">{cat.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{cat.description}</div>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Infrastructure Details */}
                <div className="lg:col-span-2">
                    <Card className="bg-card/20 border-border/30">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-cyan-400" />
                                    {INFRA_CATEGORIES.find((c) => c.id === selectedCategory)?.name} Overview
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px]">
                                    Static Data Layer
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-border/30 rounded-lg">
                                <Globe className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-sm font-medium">Enable this layer on the World Monitor map</p>
                                <p className="text-xs mt-1">
                                    Switch to the World Monitor tab and enable &quot;{INFRA_CATEGORIES.find((c) => c.id === selectedCategory)?.name}&quot; in the layer panel
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Internet Outages */}
                <div>
                    <Card className="bg-card/20 border-red-500/10">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <WifiOff className="h-4 w-4 text-red-400" />
                                    Internet Outages
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={fetchOutages} disabled={loading} className="h-7 w-7 p-0">
                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-2">
                                    {outages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <Wifi className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-xs">No active outages</p>
                                            <p className="text-[10px] mt-1">Configure Cloudflare Radar API key for live data</p>
                                        </div>
                                    ) : (
                                        outages.map((o) => (
                                            <div key={o.id} className="p-3 rounded-lg bg-card/30 border border-border/20">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3 w-3 text-red-400" />
                                                        <span className="text-sm font-medium">{o.country}</span>
                                                    </div>
                                                    <Badge variant="outline" className={`text-[9px] ${statusColor(o.severity === 'critical' ? 'disrupted' : 'degraded')}`}>
                                                        -{o.trafficDrop}%
                                                    </Badge>
                                                </div>
                                                {o.provider && <p className="text-[10px] text-muted-foreground">{o.provider}</p>}
                                                <div className="text-[10px] text-muted-foreground mt-1">
                                                    Started: {new Date(o.startTime).toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
