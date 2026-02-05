"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";

// --- Simplified World Map Polygons ---
// Coarse approximations for visual clarity
const CONTINENTS = [
    {
        id: 'na',
        name: 'North America',
        points: "50,60 180,60 220,150 120,200 80,150",
    },
    {
        id: 'sa',
        name: 'South America',
        points: "150,210 220,220 200,380 160,350",
    },
    {
        id: 'eu',
        name: 'Europe',
        points: "360,60 450,60 450,140 380,150 350,120",
    },
    {
        id: 'af',
        name: 'Africa',
        points: "360,160 460,160 480,250 420,350 350,250",
    },
    {
        id: 'as',
        name: 'Asia',
        points: "460,60 700,60 750,150 650,250 550,220 460,150",
    },
    {
        id: 'au',
        name: 'Australia',
        points: "600,280 720,280 700,380 620,360",
    }
];

// APT Origins (Adjusted for new coordinate space)
// X/Y coordinates must fall within the SVG viewBox 0 0 800 450
const APT_ZONES = [
    { id: 'apt-russia', name: 'APT29', x: 550, y: 100, color: '#dc2626' }, // Moscow (Red)
    { id: 'apt-china', name: 'APT41', x: 620, y: 160, color: '#ca8a04' }, // Beijing (Dark Yellow)
    { id: 'apt-nk', name: 'Lazarus', x: 680, y: 150, color: '#ea580c' }, // Pyongyang (Orange)
    { id: 'apt-iran', name: 'APT33', x: 500, y: 180, color: '#7e22ce' }, // Tehran (Purple)
];

interface Attack {
    id: number;
    startX: number;
    startY: number;
    controlX: number;
    controlY: number;
    endX: number;
    endY: number;
    type: 'apt' | 'ddos';
    color: string;
    label?: string;
}

export function CyberThreatMap() {
    const [attacks, setAttacks] = useState<Attack[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const id = Date.now();
            const sourceZone = APT_ZONES[Math.floor(Math.random() * APT_ZONES.length)];

            // Randomize start slightly around the zone center
            const startX = sourceZone.x + (Math.random() * 20 - 10);
            const startY = sourceZone.y + (Math.random() * 20 - 10);

            // Target: US East Coast (Approx 150, 120) or EU (400, 100)
            const targets = [{ x: 150, y: 120 }, { x: 400, y: 100 }];
            const target = targets[Math.floor(Math.random() * targets.length)];
            const endX = target.x + (Math.random() * 20 - 10);
            const endY = target.y + (Math.random() * 20 - 10);

            // Arc Control Point
            const midX = (startX + endX) / 2;
            const midY = Math.min(startY, endY) - 100;

            setAttacks(prev => [...prev.slice(-10), {
                id, startX, startY, controlX: midX, controlY: midY, endX, endY,
                type: 'apt',
                color: sourceZone.color,
                label: sourceZone.name
            }]);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="col-span-1 md:col-span-2 min-h-[500px] border-zinc-200 bg-white shadow-xl relative overflow-hidden text-zinc-900">
            {/* Header */}
            <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-800 tracking-tight">
                    <Globe className="h-5 w-5 text-blue-600" />
                    GLOBAL THREAT INTELLIGENCE
                </CardTitle>
                <div className="flex gap-2">
                    {APT_ZONES.map(zone => (
                        <div key={zone.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-bold uppercase text-zinc-600">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                            {zone.name}
                        </div>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="h-[450px] relative p-0">
                <div className="w-full h-full bg-slate-50 relative">
                    {/* SVG Map */}
                    <svg viewBox="0 0 800 450" className="w-full h-full">
                        {/* Grid Lines for style */}
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Continents */}
                        {CONTINENTS.map(c => (
                            <g key={c.id}>
                                <polygon
                                    points={c.points}
                                    fill="#cbd5e1" // slate-300
                                    stroke="#94a3b8" // slate-400
                                    strokeWidth="1"
                                    className="hover:fill-slate-400 transition-colors"
                                />
                                {/* Label (Optional) */}
                                {/* <text x={parsePoints(c.points).cx} y={parsePoints(c.points).cy} fontSize="10" fill="#64748b" textAnchor="middle">{c.name}</text> */}
                            </g>
                        ))}

                        {/* APT Origins (Pulsing Rings) */}
                        {APT_ZONES.map(zone => (
                            <g key={zone.id}>
                                <motion.circle
                                    cx={zone.x} cy={zone.y}
                                    r={15}
                                    fill={zone.color}
                                    initial={{ opacity: 0.3, scale: 0.5 }}
                                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <circle cx={zone.x} cy={zone.y} r={4} fill={zone.color} stroke="white" strokeWidth="1" />
                            </g>
                        ))}

                        {/* Attacks */}
                        <AnimatePresence>
                            {attacks.map(attack => (
                                <g key={attack.id}>
                                    <motion.path
                                        d={`M${attack.startX},${attack.startY} Q${attack.controlX},${attack.controlY} ${attack.endX},${attack.endY}`}
                                        fill="none"
                                        stroke={attack.color}
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0, opacity: 0.8 }}
                                        animate={{ pathLength: 1, opacity: 0 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                    {/* Projectile Head */}
                                    {/* Simple trick: Animation creates line, we can add a dot moving along it if needed, but path drawing is usually sufficient for 'laser' effect */}

                                    {/* Text Label Fade In/Out */}
                                    <motion.text
                                        x={(attack.startX + attack.endX) / 2}
                                        y={Math.min(attack.startY, attack.endY) - 50}
                                        fill={attack.color}
                                        fontSize="12"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        initial={{ opacity: 1, y: 0 }}
                                        animate={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 1.5 }}
                                    >
                                        {attack.label} DETECTED
                                    </motion.text>
                                </g>
                            ))}
                        </AnimatePresence>

                    </svg>
                </div>

                {/* Stats Footer */}
                <div className="absolute bottom-0 w-full bg-white/80 backdrop-blur border-t border-zinc-200 p-2 flex justify-between text-xs font-mono text-zinc-500">
                    <div>STATUS: ACTIVE MONITORING</div>
                    <div className="flex gap-4">
                        <span>THREAT LEVEL: HIGH</span>
                        <span>INTERCEPTED: {attacks.length * 42}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
