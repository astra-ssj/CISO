"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Server, Database, ShieldCheck, Globe, Wifi, Activity, ArrowRight, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
interface TrafficNode {
    id: string;
    label: string;
    type: 'internet' | 'security' | 'app' | 'data';
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    status: 'active' | 'idle' | 'warning';
}

const getStableRandom = (index: number, offset: number = 0) => {
    const seed = index * 49297 + offset * 9301;
    return ((seed % 233280) / 233280);
};

interface TrafficParticle {
    id: string;
    source: string;
    target: string;
    type: 'http' | 'sql' | 'secure';
    speed: number;
    delay: number;
}

// --- Configuration ---
// --- Configuration ---
// NODES moved to props or default

// --- Components ---

function NodeIcon({ type, className }: { type: TrafficNode['type'], className?: string }) {
    switch (type) {
        case 'internet': return <Globe className={className} />;
        case 'security': return <ShieldCheck className={className} />;
        case 'app': return <Server className={className} />;
        case 'data': return <Database className={className} />;
    }
}

interface TrafficFlowProps {
    data?: {
        nodes: TrafficNode[];
        paths: any[];
    };
}

const DEFAULT_NODES: TrafficNode[] = [
    { id: 'internet', label: 'Public Internet', type: 'internet', x: 10, y: 50, status: 'active' },
    { id: 'waf', label: 'WAF / CDN', type: 'security', x: 30, y: 50, status: 'active' },
    { id: 'lb', label: 'Load Balancer', type: 'security', x: 45, y: 50, status: 'active' },
    { id: 'app-1', label: 'Core API', type: 'app', x: 65, y: 30, status: 'active' },
    { id: 'app-2', label: 'Auth Svc', type: 'app', x: 65, y: 70, status: 'active' },
    { id: 'db-primary', label: 'Primary DB', type: 'data', x: 85, y: 30, status: 'active' },
    { id: 'db-cache', label: 'Redis Cache', type: 'data', x: 85, y: 70, status: 'active' }
];

const DEFAULT_PATHS = [
    { from: 'internet', to: 'waf', type: 'http' },
    { from: 'waf', to: 'lb', type: 'secure' },
    { from: 'lb', to: 'app-1', type: 'http' },
    { from: 'lb', to: 'app-2', type: 'secure' }, // Auth traffic
    { from: 'app-1', to: 'db-primary', type: 'sql' },
    { from: 'app-1', to: 'db-cache', type: 'sql' },
    { from: 'app-2', to: 'db-primary', type: 'sql' },
];

export function TrafficFlow({ data }: TrafficFlowProps) {
    const nodes = data?.nodes || DEFAULT_NODES;
    const paths = data?.paths || DEFAULT_PATHS;

    const [activeParticles, setActiveParticles] = useState<TrafficParticle[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate random traffic
    useEffect(() => {
        const interval = setInterval(() => {
            const types: TrafficParticle['type'][] = ['http', 'secure', 'sql'];
            const newParticle: TrafficParticle = {
                id: Math.random().toString(36).substr(2, 9),
                source: 'internet',
                target: 'db-primary', // Simplified flow for now
                type: types[Math.floor(Math.random() * types.length)],
                speed: 2 + Math.random() * 2,
                delay: 0,
            };
            // setActiveParticles(prev => [...prev.slice(-20), newParticle]); 
            // In a real implementation, we'd manage particle lifecycle. 
            // For Framer Motion, we can just render the paths and animate the stroke.
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Helper to get coordinates
    const getPos = (id: string) => {
        const node = nodes.find(n => n.id === id);
        return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
    };


    return (
        <div className="w-full h-[350px] bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden relative group backdrop-blur-sm" ref={containerRef}>

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none" />

            {/* Header */}
            <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-semibold text-white tracking-wide">NETWORK TELEMETRY</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
                    <span>INBOUND: <span className="text-zinc-300">1.2 GB/s</span></span>
                    <span>LATENCY: <span className="text-emerald-400">12ms</span></span>
                    <span>ERR: <span className="text-zinc-300">0.01%</span></span>
                </div>
            </div>

            {/* Legend */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 items-end">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> HTTP/S
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Secure/Auth
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> SQL/Data
                </div>
            </div>

            {/* SVG Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                {paths.map((path, i) => {
                    const start = getPos(path.from);
                    const end = getPos(path.to);

                    // Bezier curve calculation
                    const midX = (start.x + end.x) / 2;
                    const d = `M ${start.x}% ${start.y}% C ${midX}% ${start.y}%, ${midX}% ${end.y}%, ${end.x}% ${end.y}%`;

                    const color = path.type === 'http' ? '#3b82f6' : path.type === 'secure' ? '#10b981' : '#f59e0b';

                    return (
                        <g key={i}>
                            {/* Base Path */}
                            <path d={d} stroke={color} strokeWidth="1" strokeOpacity="0.2" fill="none" />

                            {/* Animated Traffic Particle */}
                            <circle r="2" fill={color}>
                                <animateMotion
                                    dur={`${1.5 + getStableRandom(i, 1)}s`}
                                    repeatCount="indefinite"
                                    path={d}
                                    keyPoints="0;1"
                                    keyTimes="0;1"
                                    calcMode="linear"
                                />
                            </circle>
                            <circle r="1" fill={color} opacity="0.5">
                                <animateMotion
                                    dur={`${2 + getStableRandom(i, 2)}s`}
                                    begin="0.5s"
                                    repeatCount="indefinite"
                                    path={d}
                                    keyPoints="0;1"
                                    keyTimes="0;1"
                                    calcMode="linear"
                                />
                            </circle>
                        </g>
                    );
                })}
            </svg>

            {/* Nodes Layer */}
            <div className="absolute inset-0 w-full h-full">
                {nodes.map((node) => (
                    <motion.div
                        key={node.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.1 }}
                    >
                        {/* Node Shape */}
                        <div className={cn(
                            "relative w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border transition-all duration-300 z-10",
                            "bg-zinc-900/80 border-zinc-800 shadow-xl",
                            "group-hover:border-zinc-700",
                            node.status === 'active' && "shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        )}>
                            <NodeIcon type={node.type} className={cn(
                                "w-5 h-5 transition-colors duration-300",
                                node.type === 'internet' ? "text-blue-400" :
                                    node.type === 'security' ? "text-emerald-400" :
                                        node.type === 'app' ? "text-purple-400" :
                                            "text-amber-400"
                            )} />

                            {/* Pulse Effect */}
                            <div className={cn(
                                "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
                                "bg-gradient-to-tr from-white/5 to-transparent",
                                "group-hover:opacity-100"
                            )} />
                        </div>

                        {/* Label beneath */}
                        <div className="mt-2 px-2 py-0.5 rounded-full bg-black/50 border border-zinc-800 backdrop-blur-sm">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block whitespace-nowrap">
                                {node.label}
                            </span>
                        </div>

                    </motion.div>
                ))}
            </div>

            {/* Decorative Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-[50%] w-full animate-scan pointer-events-none" style={{ backgroundSize: '100% 3px' }} />

        </div>
    );
}

// Add animation keyframes for scanline if needed globally or assume tailwind config has it.
// Assuming 'animate-scan' might not exist, we can use inline styles or standard pulse.

