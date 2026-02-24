"use client";

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BrainCircuit, Globe, Radio, Building2,
    Plane, Rss, Skull,
} from "lucide-react";
import { DATA_LAYERS, type DataLayerCategory } from '@/lib/intelligence/data-layers';
import { LayerControlPanel } from '@/components/intelligence/world-monitor/LayerControlPanel';
import { ThreatBriefingTab } from '@/components/intelligence/tabs/ThreatBriefingTab';
import { SignalIntelligenceTab } from '@/components/intelligence/tabs/SignalIntelligenceTab';
import { InfrastructureTab } from '@/components/intelligence/tabs/InfrastructureTab';
import { MilitaryMaritimeTab } from '@/components/intelligence/tabs/MilitaryMaritimeTab';
import { LiveFeedsTab } from '@/components/intelligence/tabs/LiveFeedsTab';
import type { MapDataPoint, OfficePin } from '@/components/intelligence/world-monitor/WorldMonitorMap';
import { getCountryCoords, jurisdictionColor } from '@/lib/intelligence/country-coords';
import { getFreshnessSummary, type FreshnessSummary } from '@/lib/intelligence/data-freshness';

// Dynamic imports (heavy dependencies)
const WorldMonitorMap = dynamic(
    () => import('@/components/intelligence/world-monitor/WorldMonitorMap'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[600px] rounded-lg bg-slate-950 flex items-center justify-center border border-border/30">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500" />
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                        Loading World Monitor...
                    </span>
                </div>
            </div>
        ),
    }
);

const RansomwareDashboard = dynamic(
    () => import('./ransomware/page'),
    {
        loading: () => (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
            </div>
        ),
    }
);

// ── Mock data points ──────────────────────────────────────────

function generateMockDataPoints(): MapDataPoint[] {
    const hexToRgba = (hex: string): [number, number, number, number] => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b, 200];
    };

    return [
        { id: 'pt-1', latitude: 48.8, longitude: 37.5, label: 'Active Conflict Zone', category: 'GEOPOLITICAL', severity: 'critical', details: 'Ongoing armed conflict — elevated cyber operations reported', layerId: 'conflicts', color: hexToRgba('#f43f5e'), timestamp: new Date().toISOString() },
        { id: 'pt-2', latitude: 15.5, longitude: 32.5, label: 'Civil War Zone', category: 'GEOPOLITICAL', severity: 'critical', details: 'Humanitarian crisis with infrastructure targeting', layerId: 'conflicts', color: hexToRgba('#f43f5e'), timestamp: new Date().toISOString() },
        { id: 'pt-3', latitude: 33.8, longitude: 35.8, label: 'Beirut — Social Unrest', category: 'GEOPOLITICAL', severity: 'high', details: 'Recurring protests linked to economic collapse', layerId: 'protests', color: hexToRgba('#fbbf24'), timestamp: new Date().toISOString() },
        { id: 'pt-4', latitude: 13.5, longitude: 44.2, label: 'Yemen Conflict', category: 'GEOPOLITICAL', severity: 'high', details: 'Continued Houthi attacks on shipping lanes', layerId: 'conflicts', color: hexToRgba('#f43f5e'), timestamp: new Date().toISOString() },
        { id: 'pt-5', latitude: 12.6, longitude: 43.1, label: 'Bab el-Mandeb Strait', category: 'GEOPOLITICAL', severity: 'critical', details: 'Critical chokepoint — active naval operations', layerId: 'intelligence_hotspots', color: hexToRgba('#ef4444'), timestamp: new Date().toISOString() },
        { id: 'pt-6', latitude: 26.0, longitude: 56.0, label: 'Strait of Hormuz', category: 'GEOPOLITICAL', severity: 'high', details: 'Oil transit chokepoint under tension', layerId: 'intelligence_hotspots', color: hexToRgba('#ef4444'), timestamp: new Date().toISOString() },
        { id: 'pt-7', latitude: 37.5, longitude: -122.4, label: 'Silicon Valley DC Cluster', category: 'INFRASTRUCTURE', severity: 'low', details: 'Major AI datacenter concentration', layerId: 'datacenters', color: hexToRgba('#8b5cf6'), timestamp: new Date().toISOString() },
        { id: 'pt-8', latitude: 60.5, longitude: 25.0, label: 'Baltic Subsea Cable', category: 'INFRASTRUCTURE', severity: 'medium', details: 'Submarine cable near military exercise zone', layerId: 'undersea_cables', color: hexToRgba('#06b6d4'), timestamp: new Date().toISOString() },
        { id: 'pt-9', latitude: 34.0, longitude: 136.0, label: 'Japan Quake Zone', category: 'ENVIRONMENTAL', severity: 'medium', details: 'Recent seismic activity near nuclear facilities', layerId: 'earthquakes', color: hexToRgba('#a3e635'), timestamp: new Date().toISOString() },
        { id: 'pt-10', latitude: 55.7, longitude: 37.6, label: 'APT28 Origin', category: 'CYBER', severity: 'high', details: 'Fancy Bear — nation-state APT targeting NATO allies', layerId: 'apt_threats', color: hexToRgba('#f43f5e'), timestamp: new Date().toISOString() },
        { id: 'pt-11', latitude: 39.9, longitude: 116.4, label: 'APT41 Origin', category: 'CYBER', severity: 'high', details: 'Double Dragon — espionage and financial crime', layerId: 'apt_threats', color: hexToRgba('#f43f5e'), timestamp: new Date().toISOString() },
        { id: 'pt-12', latitude: 35.7, longitude: 51.4, label: 'Iran Nuclear Facility', category: 'INFRASTRUCTURE', severity: 'medium', details: 'Natanz — enrichment facility', layerId: 'nuclear', color: hexToRgba('#eab308'), timestamp: new Date().toISOString() },
    ];
}

// ── Page Component ────────────────────────────────────────────

export default function IntelligencePage() {
    const [enabledLayers, setEnabledLayers] = useState<Set<string>>(() => {
        return new Set(DATA_LAYERS.filter((l) => l.enabled).map((l) => l.id));
    });

    const [dataPoints] = useState<MapDataPoint[]>(generateMockDataPoints);
    const [officePins, setOfficePins] = useState<OfficePin[]>([]);
    const [freshnessSummary] = useState<FreshnessSummary>(() => getFreshnessSummary());

    // Fetch company locations for office pins
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/companies');
                if (!res.ok) return;
                const companies = await res.json();
                const pins: OfficePin[] = companies.map((c: { id: string; name: string; country: string; jurisdiction: string }) => {
                    const coords = getCountryCoords(c.country);
                    return {
                        id: c.id,
                        name: c.name,
                        lat: coords.lat,
                        lng: coords.lng,
                        jurisdiction: c.jurisdiction,
                        country: c.country,
                        ciiScore: 0,
                        ciiLevel: 'low' as const,
                        nearbyThreats: 0,
                    };
                });
                setOfficePins(pins);
            } catch {
                // Companies API not available — skip office pins
            }
        })();
    }, []);

    const handleToggleLayer = useCallback((layerId: string) => {
        setEnabledLayers((prev) => {
            const next = new Set(prev);
            if (next.has(layerId)) next.delete(layerId);
            else next.add(layerId);
            return next;
        });
    }, []);

    const handleToggleCategory = useCallback((category: DataLayerCategory, enabled: boolean) => {
        setEnabledLayers((prev) => {
            const next = new Set(prev);
            const categoryLayers = DATA_LAYERS.filter((l) => l.category === category);
            for (const layer of categoryLayers) {
                if (enabled) next.add(layer.id);
                else next.delete(layer.id);
            }
            return next;
        });
    }, []);

    const handleCreateRisk = useCallback((point: MapDataPoint) => {
        // Navigate to risk register with pre-filled data
        const params = new URLSearchParams({
            title: point.label,
            description: point.details || '',
            severity: point.severity || 'medium',
        });
        window.open(`/risk?action=create&${params.toString()}`, '_blank');
    }, []);

    const handleCreateIncident = useCallback((point: MapDataPoint) => {
        const params = new URLSearchParams({
            title: `[INTEL] ${point.label}`,
            severity: point.severity === 'critical' ? 'P1' : point.severity === 'high' ? 'P2' : 'P3',
        });
        window.open(`/war-games?action=create&${params.toString()}`, '_blank');
    }, []);

    const activeLayers = DATA_LAYERS.filter((l) => enabledLayers.has(l.id));
    const visiblePoints = dataPoints.filter((p) => enabledLayers.has(p.layerId));

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <BrainCircuit className="h-8 w-8 text-primary" />
                    Intelligence Center
                </h1>
                <p className="text-muted-foreground text-lg">
                    Geopolitical monitoring, threat intelligence, and infrastructure awareness for CISO operations.
                </p>
            </div>

            {/* 7-Tab Layout */}
            <Tabs defaultValue="briefing" className="w-full">
                <TabsList className="flex w-full overflow-x-auto lg:w-auto bg-secondary/20 p-1 rounded-lg">
                    <TabsTrigger value="briefing" className="gap-1.5 text-xs sm:text-sm">
                        <BrainCircuit className="h-4 w-4" />
                        <span className="hidden sm:inline">Threat</span> Briefing
                    </TabsTrigger>
                    <TabsTrigger value="monitor" className="gap-1.5 text-xs sm:text-sm">
                        <Globe className="h-4 w-4" />
                        <span className="hidden sm:inline">World</span> Monitor
                    </TabsTrigger>
                    <TabsTrigger value="signals" className="gap-1.5 text-xs sm:text-sm">
                        <Radio className="h-4 w-4" />
                        <span className="hidden sm:inline">Signal</span> Intel
                    </TabsTrigger>
                    <TabsTrigger value="infra" className="gap-1.5 text-xs sm:text-sm">
                        <Building2 className="h-4 w-4" />
                        Infrastructure
                    </TabsTrigger>
                    <TabsTrigger value="military" className="gap-1.5 text-xs sm:text-sm">
                        <Plane className="h-4 w-4" />
                        Military
                    </TabsTrigger>
                    <TabsTrigger value="feeds" className="gap-1.5 text-xs sm:text-sm">
                        <Rss className="h-4 w-4" />
                        Live Feeds
                    </TabsTrigger>
                    <TabsTrigger value="ransomware" className="gap-1.5 text-xs sm:text-sm">
                        <Skull className="h-4 w-4" />
                        Ransomware
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Threat Briefing */}
                <TabsContent value="briefing" className="mt-6">
                    <ThreatBriefingTab />
                </TabsContent>

                {/* Tab: World Monitor (enhanced) */}
                <TabsContent value="monitor" className="mt-6">
                    <div className="relative">
                        <div className="flex gap-4">
                            <div className="flex-1 min-w-0">
                                <WorldMonitorMap
                                    activeLayers={activeLayers}
                                    dataPoints={visiblePoints}
                                    officePins={officePins}
                                    freshnessSummary={freshnessSummary}
                                    onCreateRisk={handleCreateRisk}
                                    onCreateIncident={handleCreateIncident}
                                />
                            </div>
                            <div className="hidden lg:block">
                                <LayerControlPanel
                                    enabledLayers={enabledLayers}
                                    onToggleLayer={handleToggleLayer}
                                    onToggleCategory={handleToggleCategory}
                                />
                            </div>
                        </div>
                        <div className="lg:hidden mt-4">
                            <LayerControlPanel
                                enabledLayers={enabledLayers}
                                onToggleLayer={handleToggleLayer}
                                onToggleCategory={handleToggleCategory}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="signals" className="mt-6">
                    <SignalIntelligenceTab />
                </TabsContent>

                <TabsContent value="infra" className="mt-6">
                    <InfrastructureTab />
                </TabsContent>

                <TabsContent value="military" className="mt-6">
                    <MilitaryMaritimeTab />
                </TabsContent>

                <TabsContent value="feeds" className="mt-6">
                    <LiveFeedsTab />
                </TabsContent>

                <TabsContent value="ransomware" className="mt-6">
                    <RansomwareDashboard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
