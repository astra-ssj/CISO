"use client";

import { useEffect, useRef, useState } from 'react';
import { Cloud, Server, Database, ShieldCheck, Globe } from 'lucide-react';

interface Zone {
    id: string;
    label: string;
    x: number;
    y: number;
    icon: any;
    color: string;
}

const ZONES: Zone[] = [
    { id: 'internet', label: 'Internet', x: 50, y: 150, icon: Globe, color: '#3b82f6' },
    { id: 'dmz', label: 'DMZ (WAF)', x: 250, y: 150, icon: ShieldCheck, color: '#10b981' },
    { id: 'app', label: 'App Cluster', x: 450, y: 150, icon: Server, color: '#8b5cf6' },
    { id: 'db', label: 'Secure Data', x: 650, y: 150, icon: Database, color: '#f43f5e' },
];

export function TrafficFlow() {
    // We use CSS animations for the flow effect

    return (
        <div className="w-full h-[300px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative p-4">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    Network Traffic Analysis
                </h3>
                <p className="text-xs text-zinc-500">Real-time packet flow visualization</p>
            </div>

            <svg className="w-full h-full">
                <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Connecting Lines */}
                <path d="M 50 150 L 650 150" stroke="url(#line-gradient)" strokeWidth="2" fill="none" />

                {/* Animated Traffic Particles */}
                <circle r="4" fill="#3b82f6">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 50 150 L 650 150" />
                </circle>
                <circle r="4" fill="#10b981">
                    <animateMotion dur="2.5s" begin="0.5s" repeatCount="indefinite" path="M 50 150 L 650 150" />
                </circle>
                <circle r="4" fill="#8b5cf6">
                    <animateMotion dur="3s" begin="1s" repeatCount="indefinite" path="M 50 150 L 650 150" />
                </circle>

                {/* Zones */}
                {ZONES.map((zone) => {
                    const Icon = zone.icon;
                    return (
                        <g key={zone.id} transform={`translate(${zone.x}, ${zone.y})`}>
                            <circle r="25" fill="#18181b" stroke={zone.color} strokeWidth="2" />
                            <foreignObject x="-12" y="-12" width="24" height="24">
                                <Icon className="w-6 h-6" style={{ color: zone.color }} />
                            </foreignObject>
                            <text y="45" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontWeight="500">{zone.label}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
