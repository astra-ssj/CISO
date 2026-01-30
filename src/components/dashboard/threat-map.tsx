"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ShieldAlert, Zap, Activity } from "lucide-react";

// Simplified SVG Path for World Map (Abstract representation for visual candy)
const WORLD_MAP_PATH = "M150,100 Q200,50 250,100 T350,150 T450,100 T550,150 T650,100 T750,150 V300 H150 Z";
// Note: Real world paths are huge. For "Visual Candy" abstract polygon is often enough or we assume a background image. 
// Better approach: Use a pre-defined set of dots/grid for a "Cyber" look.

const GRID_POINTS = Array.from({ length: 50 }).map((_, i) => ({
    x: Math.random() * 800,
    y: Math.random() * 400,
    id: i
}));

interface Attack {
    id: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    type: 'ddos' | 'malware' | 'phishing';
    color: string;
}

export function CyberThreatMap() {
    const [attacks, setAttacks] = useState<Attack[]>([]);
    const [stats, setStats] = useState({ blocked: 1240, active: 3, bandwidth: '450 Mbps' });

    // Generate random attacks
    useEffect(() => {
        const interval = setInterval(() => {
            const id = Date.now();
            const startX = Math.random() * 800;
            const startY = Math.random() * 400;
            // Target is roughly center (HQ)
            const endX = 400 + (Math.random() * 40 - 20);
            const endY = 200 + (Math.random() * 40 - 20);

            const types: ('ddos' | 'malware' | 'phishing')[] = ['ddos', 'malware', 'phishing'];
            const type = types[Math.floor(Math.random() * types.length)];
            const color = type === 'ddos' ? '#ef4444' : type === 'malware' ? '#eab308' : '#3b82f6';

            setAttacks(prev => [...prev.slice(-10), { id, startX, startY, endX, endY, type, color }]);

            // Randomly update stats
            if (Math.random() > 0.7) {
                setStats(s => ({
                    blocked: s.blocked + Math.floor(Math.random() * 5),
                    active: Math.max(0, s.active + (Math.random() > 0.5 ? 1 : -1)),
                    bandwidth: `${300 + Math.floor(Math.random() * 300)} Mbps`
                }));
            }
        }, 800);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="col-span-1 md:col-span-2 min-h-[400px] border-primary/20 bg-black/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />

            <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-mono flex items-center gap-2 text-primary">
                    <Globe className="h-4 w-4" />
                    GLOBAL_THREAT_INTEL
                </CardTitle>
                <div className="flex gap-2">
                    <Badge variant="outline" className="bg-black/50 border-primary/30 text-xs font-mono">
                        LIVE_FEED
                    </Badge>
                    <Badge variant="destructive" className="animate-pulse text-xs font-mono">
                        {stats.active} THREATS
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="h-[350px] relative p-0 overflow-hidden">
                {/* Map Overlay Stats */}
                <div className="absolute bottom-4 left-4 z-20 space-y-1 bg-black/60 p-2 rounded border border-white/10 backdrop-blur-sm text-xs font-mono text-muted-foreground">
                    <div className="flex justify-between gap-4"><span>BLOCKED_RQS:</span> <span className="text-emerald-500">{stats.blocked.toLocaleString()}</span></div>
                    <div className="flex justify-between gap-4"><span>NET_FLOW:</span> <span className="text-blue-400">{stats.bandwidth}</span></div>
                </div>

                {/* Visualization Area */}
                <div className="w-full h-full relative">
                    <svg viewBox="0 0 800 400" className="w-full h-full opacity-80">
                        {/* Abstract World Grid/Dots */}
                        {GRID_POINTS.map(p => (
                            <circle key={p.id} cx={p.x} cy={p.y} r={1.5} fill="#334155" opacity={0.5} />
                        ))}

                        {/* Central Hub (HQ) */}
                        <motion.circle
                            cx={400} cy={200} r={5}
                            fill="none" stroke="#6366f1" strokeWidth={2}
                            animate={{ r: [5, 15, 5], opacity: [1, 0, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        <circle cx={400} cy={200} r={3} fill="#6366f1" />

                        {/* Attacks */}
                        <AnimatePresence>
                            {attacks.map(attack => (
                                <g key={attack.id}>
                                    {/* Projectile Line */}
                                    <motion.path
                                        d={`M${attack.startX},${attack.startY} L${attack.endX},${attack.endY}`}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.5, ease: "linear" }}
                                        stroke={attack.color}
                                        strokeWidth={2}
                                        fill="none"
                                        strokeLinecap="round"
                                    />
                                    {/* Source Ripple */}
                                    <motion.circle
                                        cx={attack.startX} cy={attack.startY}
                                        initial={{ r: 0, opacity: 1 }}
                                        animate={{ r: 10, opacity: 0 }}
                                        transition={{ duration: 1 }}
                                        fill="none"
                                        stroke={attack.color}
                                        strokeWidth={1}
                                    />
                                </g>
                            ))}
                        </AnimatePresence>
                    </svg>
                </div>
            </CardContent>
        </Card>
    );
}
