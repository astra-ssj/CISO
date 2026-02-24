'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import 'maplibre-gl/dist/maplibre-gl.css';

// ── Hardcoded office locations ────────────────────────────────
const OFFICES = [
    { id: 'de', name: 'AstraLabs DE (HQ)', lat: 54.32, lng: 10.13, country: 'DE', cii: 8 },
    { id: 'gb', name: 'AstraLabs UK', lat: 51.50, lng: -0.12, country: 'GB', cii: 10 },
    { id: 'th', name: 'AstraLabs TH', lat: 13.75, lng: 100.50, country: 'TH', cii: 25 },
    { id: 'au', name: 'AstraLabs AU', lat: -33.87, lng: 151.21, country: 'AU', cii: 8 },
    { id: 'nz', name: 'AstraLabs NZ', lat: -36.85, lng: 174.76, country: 'NZ', cii: 5 },
    { id: 'es', name: 'AstraLabs ES', lat: 41.39, lng: 2.17, country: 'ES', cii: 12 },
    { id: 'at', name: 'AstraLabs AT', lat: 48.21, lng: 16.37, country: 'AT', cii: 7 },
];

// ── Conflict zones (subset for mini map) ──────────────────────
const CONFLICT_CENTERS = [
    { id: 'cz-ua', lat: 48.0, lng: 31.0, name: 'Ukraine', severity: 'critical' },
    { id: 'cz-gaza', lat: 31.4, lng: 34.4, name: 'Gaza', severity: 'critical' },
    { id: 'cz-sudan', lat: 12.75, lng: 30.0, name: 'Sudan', severity: 'critical' },
    { id: 'cz-redsea', lat: 14.5, lng: 42.0, name: 'Red Sea', severity: 'critical' },
    { id: 'cz-myanmar', lat: 19.0, lng: 96.75, name: 'Myanmar', severity: 'critical' },
    { id: 'cz-yemen', lat: 15.25, lng: 48.25, name: 'Yemen', severity: 'high' },
    { id: 'cz-syria', lat: 34.9, lng: 39.0, name: 'Syria', severity: 'high' },
    { id: 'cz-sahel', lat: 17.5, lng: 5.5, name: 'Sahel', severity: 'high' },
    { id: 'cz-drc', lat: -1.0, lng: 28.5, name: 'DR Congo', severity: 'high' },
    { id: 'cz-haiti', lat: 19.05, lng: -73.05, name: 'Haiti', severity: 'high' },
];

function ciiColor(score: number): string {
    if (score < 30) return '#22c55e';
    if (score < 60) return '#eab308';
    return '#ef4444';
}

export default function MiniWorldMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!containerRef.current || mapInstanceRef.current) return;
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
                center: [20, 25],
                zoom: 1.5,
                minZoom: 1,
                maxZoom: 6,
                attributionControl: false,
                interactive: true,
                dragRotate: false,
                pitchWithRotate: false,
            });

            map.on('load', () => {
                if (cancelled) return;
                mapInstanceRef.current = map;

                // Conflict zone points
                const conflictFeatures: GeoJSON.Feature[] = CONFLICT_CENTERS.map(cz => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [cz.lng, cz.lat] },
                    properties: { name: cz.name, severity: cz.severity },
                }));

                map.addSource('conflicts', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: conflictFeatures },
                });

                // Conflict pulse ring
                map.addLayer({
                    id: 'conflict-pulse',
                    type: 'circle',
                    source: 'conflicts',
                    paint: {
                        'circle-radius': ['match', ['get', 'severity'], 'critical', 14, 10],
                        'circle-color': 'rgba(239, 68, 68, 0.15)',
                        'circle-stroke-width': 1,
                        'circle-stroke-color': 'rgba(239, 68, 68, 0.35)',
                    },
                });

                // Conflict dots
                map.addLayer({
                    id: 'conflict-dots',
                    type: 'circle',
                    source: 'conflicts',
                    paint: {
                        'circle-radius': ['match', ['get', 'severity'], 'critical', 5, 4],
                        'circle-color': '#ef4444',
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fca5a5',
                    },
                });

                // Office pins
                const officeFeatures: GeoJSON.Feature[] = OFFICES.map(o => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [o.lng, o.lat] },
                    properties: { name: o.name, cii: o.cii },
                }));

                map.addSource('offices', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: officeFeatures },
                });

                // Office pulse ring
                map.addLayer({
                    id: 'office-pulse',
                    type: 'circle',
                    source: 'offices',
                    paint: {
                        'circle-radius': 12,
                        'circle-color': 'rgba(34, 197, 94, 0.12)',
                        'circle-stroke-width': 1,
                        'circle-stroke-color': 'rgba(34, 197, 94, 0.3)',
                    },
                });

                // Office dots
                map.addLayer({
                    id: 'office-dots',
                    type: 'circle',
                    source: 'offices',
                    paint: {
                        'circle-radius': 6,
                        'circle-color': '#22c55e',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff',
                    },
                });

                setIsLoaded(true);
            });
        })();

        return () => {
            cancelled = true;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-secondary/5">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">🌐</span> Global Threat Monitor
                </h3>
                <div className="flex items-center gap-2">
                    {isLoaded && (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </span>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="relative" style={{ height: 300, background: '#0a0e17' }}>
                <div ref={containerRef} className="absolute inset-0" />
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-500" />
                            <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest">Loading...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* CII scores row */}
            <div className="px-4 py-3 border-t border-border/30 bg-secondary/5">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                        {OFFICES.map(o => (
                            <div key={o.id} className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase">{o.country}:</span>
                                <span
                                    className="text-xs font-bold font-mono"
                                    style={{ color: ciiColor(o.cii) }}
                                >
                                    {o.cii}
                                </span>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/intelligence"
                        className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium whitespace-nowrap"
                    >
                        View Full Monitor →
                    </Link>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Offices</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Conflicts</span>
                    <span>CII = Country Instability Index</span>
                </div>
            </div>
        </div>
    );
}
