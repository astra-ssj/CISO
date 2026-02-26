'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { DataLayer } from '@/lib/intelligence/data-layers';
import { MapLegend } from './MapLegend';
import { DetailPanel } from './DetailPanel';
import { TimeFilter, type TimeRange } from './TimeFilter';
import { RegionPresets, REGION_VIEWS, type RegionPreset } from './RegionPresets';
import { DataFreshnessBar } from './DataFreshnessBar';
import type { FreshnessSummary } from '@/lib/intelligence/data-freshness';
import type { ProximityReport } from '@/lib/intelligence/proximity-analyzer';

// ── Types ─────────────────────────────────────────────────────

export interface MapDataPoint {
    id: string;
    latitude: number;
    longitude: number;
    label: string;
    category: string;
    severity?: 'low' | 'medium' | 'high' | 'critical' | 'info';
    timestamp?: string;
    details?: string;
    layerId: string;
    color: [number, number, number, number];
    radius?: number;
    source?: string;
    metadata?: Record<string, unknown>;
}

export interface OfficePin {
    id: string;
    name: string;
    lat: number;
    lng: number;
    jurisdiction: string;
    country: string;
    ciiScore?: number;
    ciiLevel?: 'low' | 'medium' | 'high' | 'critical';
    nearbyThreats?: number;
}

interface WorldMonitorMapProps {
    activeLayers: DataLayer[];
    dataPoints: MapDataPoint[];
    officePins?: OfficePin[];
    freshnessSummary?: FreshnessSummary;
    onMapClick?: (point: MapDataPoint | null) => void;
    onCreateRisk?: (point: MapDataPoint) => void;
    onCreateIncident?: (point: MapDataPoint) => void;
}

// ── Helpers ───────────────────────────────────────────────────

const SEVERITY_RADIUS: Record<string, number> = {
    critical: 9, high: 7, medium: 6, low: 4, info: 4,
};

const JURISDICTION_COLORS: Record<string, string> = {
    EU: '#3b82f6', US: '#22c55e', UK: '#ef4444',
    APAC: '#facc15', MENA: '#f97316', AFRICA: '#a855f7', LATAM: '#14b8a6',
};

function rgbaStr(rgba: [number, number, number, number], alpha?: number): string {
    return `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${(alpha ?? rgba[3]) / 255})`;
}

const DARK_TILES = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

// ── Inner map (dynamic — Leaflet is browser-only) ─────────────

function InnerMap({
    activeLayers, dataPoints, officePins = [], freshnessSummary,
    onMapClick, onCreateRisk, onCreateIncident,
    timeRange, regionPreset,
    onLoaded,
}: WorldMonitorMapProps & {
    timeRange: TimeRange;
    regionPreset: RegionPreset;
    onLoaded: () => void;
}) {
    // Lazy import react-leaflet inside a dynamic component (ssr:false ensures window exists)
    const [LeafletMap, setLeafletMap] = useState<typeof import('react-leaflet') | null>(null);
    const [selectedPoint, setSelectedPoint] = useState<MapDataPoint | null>(null);
    const [proximityReport] = useState<ProximityReport | null>(null);
    const [mapRef, setMapRef] = useState<import('leaflet').Map | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; point: MapDataPoint } | null>(null);

    useEffect(() => {
        import('react-leaflet').then(setLeafletMap);
    }, []);

    // Fly to region preset
    useEffect(() => {
        if (!mapRef) return;
        const view = REGION_VIEWS[regionPreset];
        if (!view) return;

        if (regionPreset === 'offices' && officePins.length > 0) {
            const lats = officePins.map(p => p.lat);
            const lngs = officePins.map(p => p.lng);
            const L = (window as any).L;
            if (L) {
                const bounds = L.latLngBounds(
                    officePins.map(p => [p.lat, p.lng])
                );
                mapRef.fitBounds(bounds, { padding: [60, 60], animate: true });
            }
        } else {
            mapRef.flyTo([view.lat, view.lng], view.zoom, { duration: 1.5 });
        }
    }, [regionPreset, mapRef, officePins]);

    if (!LeafletMap) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500" />
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                        Initializing World Monitor...
                    </span>
                </div>
            </div>
        );
    }

    const { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMapEvents } = LeafletMap;

    // Time filter
    const timeMs = { '1h': 3_600_000, '6h': 21_600_000, '24h': 86_400_000, '48h': 172_800_000, '7d': 604_800_000 }[timeRange];
    const cutoff = Date.now() - timeMs;
    const filteredPoints = dataPoints.filter(p => !p.timestamp || new Date(p.timestamp).getTime() > cutoff);
    const activeLayerIds = new Set(activeLayers.map(l => l.id));

    function MapEventsHandler() {
        useMapEvents({
            click: () => { setContextMenu(null); onMapClick?.(null); },
        });
        return null;
    }

    return (
        <MapContainer
            center={[20, 30]}
            zoom={3}
            minZoom={2}
            maxZoom={18}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            ref={(map) => {
                if (map && !mapRef) {
                    setMapRef(map);
                    onLoaded();
                }
            }}
            zoomControl={false}
        >
            <TileLayer
                url={DARK_TILES}
                attribution={TILE_ATTR}
                subdomains="abcd"
            />

            <LeafletMap.ZoomControl position="bottomright" />

            <MapEventsHandler />

            {/* Intel data layers */}
            {filteredPoints
                .filter(pt => activeLayerIds.has(pt.layerId))
                .map(pt => {
                    const layer = activeLayers.find(l => l.id === pt.layerId);
                    const color = layer ? layer.color : '#64748b';
                    const r = SEVERITY_RADIUS[pt.severity || 'medium'] ?? 5;
                    const isCritical = pt.severity === 'critical' || pt.severity === 'high';

                    return (
                        <CircleMarker
                            key={pt.id}
                            center={[pt.latitude, pt.longitude]}
                            radius={r}
                            pathOptions={{
                                fillColor: color,
                                fillOpacity: 0.8,
                                color: color,
                                weight: isCritical ? 2 : 1,
                                opacity: 1,
                            }}
                            eventHandlers={{
                                click: (e) => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedPoint(pt);
                                    onMapClick?.(pt);
                                },
                                contextmenu: (e) => {
                                    e.originalEvent.preventDefault();
                                    const rect = (e.originalEvent.target as HTMLElement)
                                        .closest('.leaflet-container')?.getBoundingClientRect();
                                    if (rect) {
                                        setContextMenu({
                                            x: e.originalEvent.clientX - rect.left,
                                            y: e.originalEvent.clientY - rect.top,
                                            point: pt,
                                        });
                                    }
                                },
                            }}
                        >
                            {/* Pulse ring for critical */}
                            {isCritical && (
                                <CircleMarker
                                    center={[pt.latitude, pt.longitude]}
                                    radius={r + 6}
                                    pathOptions={{
                                        fillColor: color,
                                        fillOpacity: 0.12,
                                        color: color,
                                        weight: 1,
                                        opacity: 0.35,
                                    }}
                                />
                            )}
                            <Popup>
                                <div className="text-slate-200 min-w-[180px]">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                                        <span className="font-semibold text-sm">{pt.label}</span>
                                    </div>
                                    {pt.severity && (
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${pt.severity === 'critical' ? 'bg-red-500/30 text-red-300'
                                            : pt.severity === 'high' ? 'bg-amber-500/30 text-amber-300'
                                                : 'bg-blue-500/30 text-blue-300'
                                            }`}>
                                            {pt.severity}
                                        </span>
                                    )}
                                    {pt.category && <p className="text-[11px] text-slate-400 mt-1">{pt.category}</p>}
                                    {pt.details && <p className="text-[11px] text-slate-400 mt-1 line-clamp-3">{pt.details}</p>}
                                    {pt.source && <p className="text-[10px] text-slate-500 mt-1.5">Source: {pt.source}</p>}
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })
            }

            {/* Office pins */}
            {officePins.map(pin => {
                const ciiScore = pin.ciiScore ?? 0;
                const ciiColor = ciiScore >= 60 ? '#ef4444' : ciiScore >= 30 ? '#eab308' : '#22c55e';
                const OFFICE_TEAL = '#22d3ee';

                return (
                    <CircleMarker
                        key={pin.id}
                        center={[pin.lat, pin.lng]}
                        radius={8}
                        pathOptions={{
                            fillColor: OFFICE_TEAL,
                            fillOpacity: 0.9,
                            color: '#ffffff',
                            weight: 2,
                            opacity: 1,
                            className: 'office-pin-pulse',
                        }}
                    >
                        {/* Pulse ring for office visibility */}
                        <CircleMarker
                            center={[pin.lat, pin.lng]}
                            radius={14}
                            pathOptions={{
                                fillColor: OFFICE_TEAL,
                                fillOpacity: 0.08,
                                color: OFFICE_TEAL,
                                weight: 1,
                                opacity: 0.25,
                            }}
                        />
                        <Popup>
                            <div className="text-slate-200 min-w-[200px]">
                                <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: OFFICE_TEAL }} />
                                    {pin.name}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] text-slate-400">{pin.jurisdiction} · {pin.country}</span>
                                </div>
                                {pin.ciiScore !== undefined && (
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-500">CII Score:</span>
                                        <span className="text-xs font-bold font-mono" style={{ color: ciiColor }}>
                                            {pin.ciiScore}
                                        </span>
                                    </div>
                                )}
                                {pin.nearbyThreats !== undefined && pin.nearbyThreats > 0 && (
                                    <div className="mt-1 text-[10px] text-amber-400">
                                        ⚠️ {pin.nearbyThreats} nearby threats
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}

            {/* Detail panel */}
            {selectedPoint && (
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 1000, pointerEvents: 'auto' }}>
                    <DetailPanel
                        title={selectedPoint.label}
                        description={selectedPoint.details}
                        severity={selectedPoint.severity}
                        category={selectedPoint.category}
                        latitude={selectedPoint.latitude}
                        longitude={selectedPoint.longitude}
                        proximity={proximityReport}
                        onClose={() => { setSelectedPoint(null); }}
                        onCreateRisk={() => { onCreateRisk?.(selectedPoint); }}
                        onCreateIncident={() => { onCreateIncident?.(selectedPoint); }}
                    />
                </div>
            )}

            {/* Context menu */}
            {contextMenu && (
                <div
                    style={{ position: 'absolute', left: contextMenu.x, top: contextMenu.y, zIndex: 1000 }}
                >
                    <div className="bg-slate-900/95 backdrop-blur-md border border-border/60 rounded-lg shadow-2xl py-1 min-w-[180px]">
                        <div className="px-3 py-1.5 border-b border-border/20">
                            <span className="text-[10px] text-muted-foreground truncate block">{contextMenu.point.label}</span>
                        </div>
                        <button
                            className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-500/10 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                            onClick={() => { onCreateRisk?.(contextMenu.point); setContextMenu(null); }}
                        >
                            <span className="text-cyan-400">⊕</span> Create Risk Scenario
                        </button>
                        <button
                            className="w-full text-left px-3 py-2 text-xs hover:bg-amber-500/10 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                            onClick={() => { onCreateIncident?.(contextMenu.point); setContextMenu(null); }}
                        >
                            <span className="text-amber-400">⚡</span> Create Incident
                        </button>
                        <button
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/50 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                            onClick={() => { setSelectedPoint(contextMenu.point); setContextMenu(null); }}
                        >
                            <span className="text-purple-400">◉</span> View Details
                        </button>
                    </div>
                </div>
            )}
        </MapContainer>
    );
}

// Dynamic import to avoid SSR issues with Leaflet
const InnerMapDynamic = dynamic(() => Promise.resolve(InnerMap), { ssr: false });

// ── Main exported component ───────────────────────────────────

export default function WorldMonitorMap(props: WorldMonitorMapProps) {
    const { activeLayers, dataPoints, officePins = [], freshnessSummary } = props;
    const [isLoaded, setIsLoaded] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRange>('24h');
    const [regionPreset, setRegionPreset] = useState<RegionPreset>('global');

    return (
        <div
            className="relative w-full rounded-lg overflow-hidden border border-border/40"
            style={{ height: '100%', minHeight: '500px' }}
        >
            <InnerMapDynamic
                {...props}
                timeRange={timeRange}
                regionPreset={regionPreset}
                onLoaded={() => setIsLoaded(true)}
            />

            {/* Loading overlay */}
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-[500]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500" />
                        <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                            Initializing World Monitor...
                        </span>
                    </div>
                </div>
            )}

            {/* Top controls bar */}
            {isLoaded && (
                <div className="absolute top-3 left-3 right-3 z-[400] flex items-start justify-between gap-2 flex-wrap pointer-events-none">
                    <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
                        <div className="bg-slate-900/80 backdrop-blur-sm rounded-md px-2.5 py-1.5 flex items-center gap-2 border border-border/30">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                                {activeLayers.length} layers · {dataPoints.length} pts
                            </span>
                        </div>
                        <TimeFilter value={timeRange} onChange={setTimeRange} />
                        <RegionPresets value={regionPreset} onChange={setRegionPreset} />
                    </div>
                    {freshnessSummary && (
                        <div className="max-w-[380px] pointer-events-auto">
                            <DataFreshnessBar summary={freshnessSummary} />
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            {isLoaded && (
                <div className="absolute bottom-14 right-3 z-[400]">
                    <MapLegend />
                </div>
            )}
        </div>
    );
}
