'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DataLayer } from '@/lib/intelligence/data-layers';
import { MapLegend } from './MapLegend';
import { DetailPanel } from './DetailPanel';
import { TimeFilter, type TimeRange } from './TimeFilter';
import { RegionPresets, REGION_VIEWS, type RegionPreset } from './RegionPresets';
import { DataFreshnessBar } from './DataFreshnessBar';
import type { FreshnessSummary } from '@/lib/intelligence/data-freshness';
import type { ProximityReport } from '@/lib/intelligence/proximity-analyzer';
import 'maplibre-gl/dist/maplibre-gl.css';

// ── Map data types ────────────────────────────────────────────

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

function hexToRgba(hex: string, alpha = 200): [number, number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, alpha];
}

const JURISDICTION_COLORS: Record<string, string> = {
    EU: '#3b82f6', US: '#22c55e', UK: '#ef4444',
    APAC: '#facc15', MENA: '#f97316', AFRICA: '#a855f7', LATAM: '#14b8a6',
};

// ── Component ─────────────────────────────────────────────────

export default function WorldMonitorMap({
    activeLayers, dataPoints, officePins = [], freshnessSummary,
    onMapClick, onCreateRisk, onCreateIncident,
}: WorldMonitorMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState<MapDataPoint | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [selectedPoint, setSelectedPoint] = useState<MapDataPoint | null>(null);
    const [proximityReport, setProximityReport] = useState<ProximityReport | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; point: MapDataPoint } | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('24h');
    const [regionPreset, setRegionPreset] = useState<RegionPreset>('global');

    // ── Init MapLibre ──
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        let cancelled = false;

        (async () => {
            const maplibregl = (await import('maplibre-gl')).default;
            if (cancelled || !containerRef.current) return;

            const map = new maplibregl.Map({
                container: containerRef.current,
                style: {
                    version: 8,
                    name: 'Dark',
                    sources: {
                        'carto-dark': {
                            type: 'raster',
                            tiles: [
                                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                            ],
                            tileSize: 256,
                            attribution: '&copy; OpenStreetMap &copy; CARTO',
                        },
                    },
                    layers: [
                        { id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 19 },
                    ],
                    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
                },
                center: [30, 20],
                zoom: 2.2,
                minZoom: 1.5,
                maxZoom: 18,
                attributionControl: false,
            });

            map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
            map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

            map.on('load', () => {
                if (!cancelled) {
                    mapRef.current = map;
                    // Force canvas resize after mount to fix 0px height issue
                    // when parent uses overflow:auto scroll container
                    map.resize();
                    requestAnimationFrame(() => map.resize());
                    setIsLoaded(true);
                }
            });

            // Close context menu on click elsewhere
            map.on('click', () => setContextMenu(null));
        })();

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // ── Region preset fly-to ──
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isLoaded) return;
        const view = REGION_VIEWS[regionPreset];
        if (!view) return;

        if (regionPreset === 'offices' && officePins.length > 0) {
            // Fit to all office positions
            const maplibregl = (globalThis as Record<string, unknown>).maplibregl as typeof import('maplibre-gl');
            const bounds = officePins.reduce(
                (b, pin) => {
                    b[0] = Math.min(b[0], pin.lng);
                    b[1] = Math.min(b[1], pin.lat);
                    b[2] = Math.max(b[2], pin.lng);
                    b[3] = Math.max(b[3], pin.lat);
                    return b;
                },
                [180, 90, -180, -90]
            );
            map.fitBounds(
                [[bounds[0] - 5, bounds[1] - 5], [bounds[2] + 5, bounds[3] + 5]],
                { padding: 60, duration: 1500 }
            );
        } else {
            map.flyTo({ center: [view.lng, view.lat], zoom: view.zoom, duration: 1500 });
        }
    }, [regionPreset, isLoaded, officePins]);

    // ── Render data layers ──
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isLoaded) return;

        // Remove old intel layers/sources
        const style = map.getStyle();
        if (style?.layers) {
            for (const layer of style.layers) {
                if (layer.id.startsWith('intel-') || layer.id.startsWith('office-')) {
                    map.removeLayer(layer.id);
                }
            }
        }
        if (style?.sources) {
            for (const sourceId of Object.keys(style.sources)) {
                if (sourceId.startsWith('intel-') || sourceId.startsWith('office-')) {
                    map.removeSource(sourceId);
                }
            }
        }

        // Filter by time range
        const timeMs = { '1h': 3600_000, '6h': 21600_000, '24h': 86400_000, '48h': 172800_000, '7d': 604800_000 }[timeRange];
        const cutoff = Date.now() - timeMs;
        const filteredPoints = dataPoints.filter((p) => !p.timestamp || new Date(p.timestamp).getTime() > cutoff);

        // Group points by layer
        const pointsByLayer = new Map<string, MapDataPoint[]>();
        for (const pt of filteredPoints) {
            const existing = pointsByLayer.get(pt.layerId) || [];
            existing.push(pt);
            pointsByLayer.set(pt.layerId, existing);
        }

        const activeLayerIds = new Set(activeLayers.map((l) => l.id));

        for (const [layerId, points] of pointsByLayer.entries()) {
            if (!activeLayerIds.has(layerId)) continue;
            const layer = activeLayers.find((l) => l.id === layerId);
            if (!layer) continue;

            const rgba = hexToRgba(layer.color);
            const sourceId = `intel-${layerId}`;
            const circleLayerId = `intel-circle-${layerId}`;
            const pulseLayerId = `intel-pulse-${layerId}`;

            const geojson: GeoJSON.FeatureCollection = {
                type: 'FeatureCollection',
                features: points.map((pt) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [pt.longitude, pt.latitude] },
                    properties: {
                        id: pt.id, label: pt.label, severity: pt.severity || 'medium',
                        details: pt.details || '', category: pt.category, layerId: pt.layerId,
                        source: pt.source || '', timestamp: pt.timestamp || '',
                    },
                })),
            };

            map.addSource(sourceId, {
                type: 'geojson',
                data: geojson,
                cluster: true,
                clusterMaxZoom: 10,
                clusterRadius: 40,
            });

            // Cluster circles
            map.addLayer({
                id: `intel-cluster-${layerId}`,
                type: 'circle',
                source: sourceId,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 50, 28],
                    'circle-color': `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, 0.6)`,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, 0.9)`,
                },
            });

            // Cluster count labels
            map.addLayer({
                id: `intel-cluster-label-${layerId}`,
                type: 'symbol',
                source: sourceId,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['Open Sans Semibold'],
                    'text-size': 11,
                },
                paint: { 'text-color': '#ffffff' },
            });

            // Pulse ring for critical
            map.addLayer({
                id: pulseLayerId,
                type: 'circle',
                source: sourceId,
                filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'severity'], 'critical']],
                paint: {
                    'circle-radius': 18,
                    'circle-color': `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, 0.15)`,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, 0.4)`,
                },
            });

            // Single-point circles
            map.addLayer({
                id: circleLayerId,
                type: 'circle',
                source: sourceId,
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-radius': ['match', ['get', 'severity'], 'critical', 8, 'high', 6, 'medium', 5, 4],
                    'circle-color': `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, 0.8)`,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, 1)`,
                },
            });

            // Interactions
            map.on('mouseenter', circleLayerId, () => { map.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', circleLayerId, () => { map.getCanvas().style.cursor = ''; setHoveredPoint(null); });
            map.on('mousemove', circleLayerId, (e) => {
                if (e.features?.[0]?.properties) {
                    const p = e.features[0].properties;
                    setHoveredPoint({
                        id: p.id, label: p.label, category: p.category, severity: p.severity,
                        details: p.details, layerId: p.layerId, latitude: 0, longitude: 0, color: rgba,
                    });
                    setTooltipPos({ x: e.point.x, y: e.point.y });
                }
            });
            map.on('click', circleLayerId, (e) => {
                if (e.features?.[0]?.properties) {
                    const p = e.features[0].properties;
                    const coords = (e.features[0].geometry as GeoJSON.Point).coordinates;
                    const clicked: MapDataPoint = {
                        id: p.id, label: p.label, category: p.category, severity: p.severity,
                        details: p.details, layerId: p.layerId, source: p.source,
                        latitude: coords[1], longitude: coords[0], color: rgba, timestamp: p.timestamp,
                    };
                    setSelectedPoint(clicked);
                    onMapClick?.(clicked);
                }
            });

            // Right-click context menu
            map.on('contextmenu', circleLayerId, (e) => {
                e.preventDefault();
                if (e.features?.[0]?.properties) {
                    const p = e.features[0].properties;
                    const coords = (e.features[0].geometry as GeoJSON.Point).coordinates;
                    setContextMenu({
                        x: e.point.x,
                        y: e.point.y,
                        point: {
                            id: p.id, label: p.label, category: p.category, severity: p.severity,
                            details: p.details, layerId: p.layerId, latitude: coords[1], longitude: coords[0],
                            color: rgba,
                        },
                    });
                }
            });

            // Click cluster to zoom
            map.on('click', `intel-cluster-${layerId}`, (e) => {
                const features = map.queryRenderedFeatures(e.point, { layers: [`intel-cluster-${layerId}`] });
                const clusterId = features?.[0]?.properties?.cluster_id;
                if (clusterId != null) {
                    const src = map.getSource(sourceId);
                    if (src && 'getClusterExpansionZoom' in src) {
                        (src as maplibregl.GeoJSONSource).getClusterExpansionZoom(clusterId).then((zoom) => {
                            const coords = (features[0].geometry as GeoJSON.Point).coordinates;
                            map.easeTo({ center: [coords[0], coords[1]] as [number, number], zoom });
                        });
                    }
                }
            });
        }

        // ── Office pins ──
        if (officePins.length > 0) {
            const officeGeojson: GeoJSON.FeatureCollection = {
                type: 'FeatureCollection',
                features: officePins.map((pin) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [pin.lng, pin.lat] },
                    properties: {
                        id: pin.id, name: pin.name, jurisdiction: pin.jurisdiction,
                        ciiScore: pin.ciiScore ?? 0, ciiLevel: pin.ciiLevel ?? 'low',
                        nearbyThreats: pin.nearbyThreats ?? 0,
                        color: JURISDICTION_COLORS[pin.jurisdiction.toUpperCase()] ?? '#94a3b8',
                    },
                })),
            };

            map.addSource('office-pins', { type: 'geojson', data: officeGeojson });

            // Impact zone circle (600km ~ radius varies by lat, approximate)
            map.addLayer({
                id: 'office-radius',
                type: 'circle',
                source: 'office-pins',
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 4, 18, 6, 40, 8, 80],
                    'circle-color': ['get', 'color'],
                    'circle-opacity': 0.08,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': ['get', 'color'],
                    'circle-stroke-opacity': 0.3,
                },
            });

            // Office dot
            map.addLayer({
                id: 'office-dot',
                type: 'circle',
                source: 'office-pins',
                paint: {
                    'circle-radius': 7,
                    'circle-color': ['get', 'color'],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                },
            });

            // Office label
            map.addLayer({
                id: 'office-label',
                type: 'symbol',
                source: 'office-pins',
                layout: {
                    'text-field': ['concat', ['get', 'name'], ' — CII:', ['to-string', ['get', 'ciiScore']]],
                    'text-font': ['Open Sans Semibold'],
                    'text-size': 10,
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top',
                },
                paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#0f172a', 'text-halo-width': 1 },
            });

            map.on('mouseenter', 'office-dot', () => { map.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', 'office-dot', () => { map.getCanvas().style.cursor = ''; });
        }

    }, [dataPoints, activeLayers, isLoaded, onMapClick, officePins, timeRange]);

    // ── Resize ──
    const handleResize = useCallback(() => mapRef.current?.resize(), []);
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return (
        <div
            className="relative w-full rounded-lg overflow-hidden border border-border/40"
            style={{ height: '100%', minHeight: '500px' }}
        >
            <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

            {/* Loading */}
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
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
                <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
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
                        <div className="max-w-[380px]">
                            <DataFreshnessBar summary={freshnessSummary} />
                        </div>
                    )}
                </div>
            )}

            {/* Legend (bottom-right) */}
            {isLoaded && (
                <div className="absolute bottom-14 right-3 z-10">
                    <MapLegend />
                </div>
            )}

            {/* Hover tooltip */}
            {hoveredPoint && (
                <div className="absolute z-20 pointer-events-none" style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 12 }}>
                    <div className="bg-slate-900/95 backdrop-blur-sm border border-border/60 rounded-lg px-3 py-2 shadow-xl max-w-[240px]">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `rgba(${hoveredPoint.color.join(',')})` }} />
                            <span className="text-xs font-semibold text-white truncate">{hoveredPoint.label}</span>
                        </div>
                        {hoveredPoint.severity && (
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${hoveredPoint.severity === 'critical' ? 'bg-red-500/20 text-red-400'
                                : hoveredPoint.severity === 'high' ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                {hoveredPoint.severity}
                            </span>
                        )}
                        {hoveredPoint.details && (
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{hoveredPoint.details}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Context menu (right-click) */}
            {contextMenu && (
                <div
                    className="absolute z-30"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <div className="bg-slate-900/95 backdrop-blur-md border border-border/60 rounded-lg shadow-2xl py-1 min-w-[180px] animate-in fade-in-0 zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 border-b border-border/20">
                            <span className="text-[10px] text-muted-foreground truncate block">{contextMenu.point.label}</span>
                        </div>
                        <button
                            className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-500/10 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                            onClick={() => {
                                onCreateRisk?.(contextMenu.point);
                                setContextMenu(null);
                            }}
                        >
                            <span className="text-cyan-400">⊕</span> Create Risk Scenario
                        </button>
                        <button
                            className="w-full text-left px-3 py-2 text-xs hover:bg-amber-500/10 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                            onClick={() => {
                                onCreateIncident?.(contextMenu.point);
                                setContextMenu(null);
                            }}
                        >
                            <span className="text-amber-400">⚡</span> Create Incident
                        </button>
                        <button
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/50 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                            onClick={() => {
                                setSelectedPoint(contextMenu.point);
                                setContextMenu(null);
                            }}
                        >
                            <span className="text-purple-400">◉</span> View Details
                        </button>
                    </div>
                </div>
            )}

            {/* Detail panel (slide-in right) */}
            {selectedPoint && (
                <DetailPanel
                    title={selectedPoint.label}
                    description={selectedPoint.details}
                    severity={selectedPoint.severity}
                    category={selectedPoint.category}
                    latitude={selectedPoint.latitude}
                    longitude={selectedPoint.longitude}
                    proximity={proximityReport}
                    onClose={() => { setSelectedPoint(null); setProximityReport(null); }}
                    onCreateRisk={() => { onCreateRisk?.(selectedPoint); }}
                    onCreateIncident={() => { onCreateIncident?.(selectedPoint); }}
                />
            )}
        </div>
    );
}
