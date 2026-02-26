"use client";

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BrainCircuit, Globe, Crosshair, Activity,
    Rss, Skull, Search, Shield,
} from "lucide-react";
import { DATA_LAYERS, type DataLayerCategory } from '@/lib/intelligence/data-layers';
import { LayerControlPanel } from '@/components/intelligence/world-monitor/LayerControlPanel';
import { ThreatBriefing } from '@/components/intelligence/ThreatBriefing';
import { CampaignsView } from '@/components/intelligence/CampaignsView';
import { IOCExplorer } from '@/components/intelligence/IOCExplorer';
import { AttackHeatmap } from '@/components/intelligence/AttackHeatmap';
import { FeedManager } from '@/components/intelligence/FeedManager';
import { EnrichmentTool } from '@/components/intelligence/EnrichmentTool';
import type { MapDataPoint, OfficePin } from '@/components/intelligence/world-monitor/WorldMonitorMap';
import { getFreshnessSummary, type FreshnessSummary } from '@/lib/intelligence/data-freshness';

// ── Static data imports ───────────────────────────────────────
import militaryBases from '@/data/intelligence/military-bases.json';
import conflictZones from '@/data/intelligence/conflict-zones.json';
import datacenters from '@/data/intelligence/datacenters.json';
import nuclearFacilities from '@/data/intelligence/nuclear-facilities.json';
import underseaCables from '@/data/intelligence/undersea-cables.json';

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

// ── Hardcoded AstraLabs office locations ──────────────────────
const OFFICE_LOCATIONS: OfficePin[] = [
    { id: 'office-de', name: 'AstraLabs DE (HQ)', lat: 54.32, lng: 10.13, country: 'DE', jurisdiction: 'EU', ciiScore: 8, ciiLevel: 'low', nearbyThreats: 0 },
    { id: 'office-gb', name: 'AstraLabs UK', lat: 51.50, lng: -0.12, country: 'GB', jurisdiction: 'UK', ciiScore: 10, ciiLevel: 'low', nearbyThreats: 0 },
    { id: 'office-th', name: 'AstraLabs TH', lat: 13.75, lng: 100.50, country: 'TH', jurisdiction: 'APAC', ciiScore: 25, ciiLevel: 'low', nearbyThreats: 0 },
    { id: 'office-au', name: 'AstraLabs AU', lat: -33.87, lng: 151.21, country: 'AU', jurisdiction: 'APAC', ciiScore: 8, ciiLevel: 'low', nearbyThreats: 0 },
    { id: 'office-nz', name: 'AstraLabs NZ', lat: -36.85, lng: 174.76, country: 'NZ', jurisdiction: 'APAC', ciiScore: 5, ciiLevel: 'low', nearbyThreats: 0 },
    { id: 'office-es', name: 'AstraLabs ES', lat: 41.39, lng: 2.17, country: 'ES', jurisdiction: 'EU', ciiScore: 12, ciiLevel: 'low', nearbyThreats: 0 },
    { id: 'office-at', name: 'AstraLabs AT', lat: 48.21, lng: 16.37, country: 'AT', jurisdiction: 'EU', ciiScore: 7, ciiLevel: 'low', nearbyThreats: 0 },
];

// ── Helper ────────────────────────────────────────────────────
function hexToRgba(hex: string): [number, number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 200];
}

// ── Build MapDataPoints from static data ──────────────────────
function buildDataPoints(): MapDataPoint[] {
    const points: MapDataPoint[] = [];
    const now = new Date().toISOString();

    for (const cz of conflictZones) {
        const centerLat = ((cz.bounds?.north ?? 0) + (cz.bounds?.south ?? 0)) / 2;
        const centerLng = ((cz.bounds?.east ?? 0) + (cz.bounds?.west ?? 0)) / 2;
        points.push({
            id: cz.id, latitude: centerLat, longitude: centerLng,
            label: cz.name, category: 'GEOPOLITICAL',
            severity: cz.severity === 'critical' ? 'critical' : cz.severity === 'high' ? 'high' : 'medium',
            details: `${cz.region} — ${(cz.parties ?? []).join(', ')}`,
            layerId: 'conflicts', color: hexToRgba('#f43f5e'), timestamp: now,
        });
    }

    for (const base of militaryBases) {
        points.push({
            id: base.id, latitude: base.lat, longitude: base.lng,
            label: base.name, category: 'MILITARY',
            severity: 'info', details: `${base.operator} — ${base.type} (${base.country})`,
            layerId: 'military_bases', color: hexToRgba('#dc2626'), timestamp: now,
        });
    }

    for (const dc of datacenters) {
        points.push({
            id: dc.id, latitude: dc.lat, longitude: dc.lng,
            label: dc.name, category: 'INFRASTRUCTURE',
            severity: 'low', details: `${dc.operator} — ${dc.type} (${dc.capacity})`,
            layerId: 'datacenters', color: hexToRgba('#8b5cf6'), timestamp: now,
        });
    }

    for (const nuc of nuclearFacilities) {
        points.push({
            id: nuc.id, latitude: nuc.lat, longitude: nuc.lng,
            label: nuc.name, category: 'INFRASTRUCTURE',
            severity: nuc.status === 'occupied' ? 'critical' : nuc.status === 'construction' ? 'medium' : 'low',
            details: `${nuc.type} — ${nuc.status} (${nuc.country})${nuc.capacity_mw ? ` ${nuc.capacity_mw} MW` : ''}`,
            layerId: 'nuclear', color: hexToRgba('#eab308'), timestamp: now,
        });
    }

    for (const cable of underseaCables) {
        for (const lp of (cable.landingPoints ?? [])) {
            points.push({
                id: `${cable.id}-${lp.name}`, latitude: lp.lat, longitude: lp.lng,
                label: `${cable.name} — ${lp.name}`, category: 'INFRASTRUCTURE',
                severity: 'low', details: `Cable: ${cable.name} | ${cable.length_km} km | Owner: ${cable.owner}`,
                layerId: 'undersea_cables', color: hexToRgba('#06b6d4'), timestamp: now,
            });
        }
    }

    return points;
}

// ── Page Component ────────────────────────────────────────────

export default function IntelligencePage() {
    const [enabledLayers, setEnabledLayers] = useState<Set<string>>(() => {
        const defaultOn = new Set(['conflicts', 'intelligence_hotspots', 'military_bases', 'datacenters', 'nuclear', 'undersea_cables', 'earthquakes']);
        return defaultOn;
    });

    const dataPoints = useMemo(() => buildDataPoints(), []);
    const [freshnessSummary] = useState<FreshnessSummary>(() => getFreshnessSummary());

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
                    Threat intelligence, geopolitical monitoring, and cyber defense awareness powered by OpenCTI &amp; MISP.
                </p>
            </div>

            {/* Tab Layout */}
            <Tabs defaultValue="briefing" className="w-full">
                <TabsList className="flex w-full overflow-x-auto lg:w-auto bg-secondary/20 p-1 rounded-lg">
                    <TabsTrigger value="briefing" className="gap-1.5 text-xs sm:text-sm">
                        <BrainCircuit className="h-4 w-4" />
                        <span className="hidden sm:inline">Threat</span> Briefing
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="gap-1.5 text-xs sm:text-sm">
                        <Crosshair className="h-4 w-4" />
                        Campaigns
                    </TabsTrigger>
                    <TabsTrigger value="ioc" className="gap-1.5 text-xs sm:text-sm">
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">IOC</span> Explorer
                    </TabsTrigger>
                    <TabsTrigger value="heatmap" className="gap-1.5 text-xs sm:text-sm">
                        <Shield className="h-4 w-4" />
                        ATT&CK <span className="hidden sm:inline">Heatmap</span>
                    </TabsTrigger>
                    <TabsTrigger value="feeds" className="gap-1.5 text-xs sm:text-sm">
                        <Rss className="h-4 w-4" />
                        <span className="hidden sm:inline">Feed</span> Manager
                    </TabsTrigger>
                    <TabsTrigger value="enrichment" className="gap-1.5 text-xs sm:text-sm">
                        <Search className="h-4 w-4" />
                        Enrichment
                    </TabsTrigger>
                    <TabsTrigger value="monitor" className="gap-1.5 text-xs sm:text-sm">
                        <Globe className="h-4 w-4" />
                        <span className="hidden sm:inline">World</span> Monitor
                    </TabsTrigger>
                    <TabsTrigger value="ransomware" className="gap-1.5 text-xs sm:text-sm">
                        <Skull className="h-4 w-4" />
                        Ransomware
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Threat Briefing */}
                <TabsContent value="briefing" className="mt-6">
                    <ThreatBriefing />
                </TabsContent>

                {/* Tab: Campaigns */}
                <TabsContent value="campaigns" className="mt-6">
                    <CampaignsView />
                </TabsContent>

                {/* Tab: IOC Explorer */}
                <TabsContent value="ioc" className="mt-6">
                    <IOCExplorer />
                </TabsContent>

                {/* Tab: ATT&CK Heatmap */}
                <TabsContent value="heatmap" className="mt-6">
                    <AttackHeatmap />
                </TabsContent>

                {/* Tab: Feed Manager */}
                <TabsContent value="feeds" className="mt-6">
                    <FeedManager />
                </TabsContent>

                {/* Tab: Enrichment */}
                <TabsContent value="enrichment" className="mt-6">
                    <EnrichmentTool />
                </TabsContent>

                {/* Tab: World Monitor */}
                <TabsContent value="monitor" className="mt-6">
                    <div className="relative">
                        <div className="flex gap-4">
                            <div className="flex-1 min-w-0">
                                <div style={{ width: '100%', height: 'calc(100vh - 280px)', position: 'relative', background: '#0a0e17', borderRadius: '0.5rem' }}>
                                    <WorldMonitorMap
                                        activeLayers={activeLayers}
                                        dataPoints={visiblePoints}
                                        officePins={OFFICE_LOCATIONS}
                                        freshnessSummary={freshnessSummary}
                                        onCreateRisk={handleCreateRisk}
                                        onCreateIncident={handleCreateIncident}
                                    />
                                </div>
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

                {/* Tab: Ransomware */}
                <TabsContent value="ransomware" className="mt-6">
                    <RansomwareDashboard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
