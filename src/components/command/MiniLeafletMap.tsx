'use client';

import { useState, useEffect } from 'react';
import officeLocations from '@/data/intelligence/office-locations.json';
import conflictZones from '@/data/intelligence/conflict-zones.json';

const DARK_TILES = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

export default function MiniLeafletMap() {
    const [RL, setRL] = useState<typeof import('react-leaflet') | null>(null);

    useEffect(() => {
        import('react-leaflet').then(setRL);
    }, []);

    if (!RL) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-500" />
            </div>
        );
    }

    const { MapContainer, TileLayer, CircleMarker, Rectangle } = RL;

    return (
        <MapContainer
            center={[25, 20]}
            zoom={2}
            minZoom={2}
            maxZoom={6}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            zoomControl={false}
            attributionControl={false}
            dragging={true}
            scrollWheelZoom={false}
        >
            <TileLayer url={DARK_TILES} attribution={TILE_ATTR} subdomains="abcd" />

            {/* Conflict zones as red rectangles */}
            {conflictZones.map((cz) => {
                if (!cz.bounds) return null;
                const bounds: [[number, number], [number, number]] = [
                    [cz.bounds.south, cz.bounds.west],
                    [cz.bounds.north, cz.bounds.east],
                ];
                const opacity = cz.severity === 'critical' ? 0.25 : cz.severity === 'high' ? 0.15 : 0.08;
                return (
                    <Rectangle
                        key={cz.id}
                        bounds={bounds}
                        pathOptions={{
                            fillColor: '#f43f5e',
                            fillOpacity: opacity,
                            color: '#f43f5e',
                            weight: 1,
                            opacity: 0.3,
                        }}
                    />
                );
            })}

            {/* Office pins — teal dots */}
            {officeLocations.map((o) => (
                <CircleMarker
                    key={o.id}
                    center={[o.lat, o.lng]}
                    radius={6}
                    pathOptions={{
                        fillColor: '#22d3ee',
                        fillOpacity: 0.9,
                        color: '#ffffff',
                        weight: 2,
                        opacity: 1,
                    }}
                />
            ))}
        </MapContainer>
    );
}
