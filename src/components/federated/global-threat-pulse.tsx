"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, Radio, Trophy, TrendingUp, ShieldOff, Shield, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAstraStore } from '@/lib/store';

// Phase 4: Viral Loop Data
const LEADERBOARD = [
    { rank: 1, sector: "Finance", score: 99.2, label: "Top Immunity" },
    { rank: 2, sector: "Healthcare", score: 98.5, label: "Rising Fast" },
    { rank: 3, sector: "Energy", score: 97.8, label: "Stable" },
];

const EVENTS = [
    { id: 1, type: 'block', text: "Ransomware.Lockbit variant neutralized on Node 492 [Finance Sector]", location: "NYC-DC-01" },
    { id: 2, type: 'intel', text: "New Signature: CVE-2024-9992 added to Federated Protection List", location: "Global" },
    { id: 3, type: 'alert', text: "DDoS mitigation active: 40Gbps attack absorbed via Astra Net", location: "EU-West" },
    { id: 4, type: 'block', text: "Unauthorized Access blocked: IP 192.168.x.x matched generic threat pattern", location: "APAC-SG" },
];

export function GlobalThreatPulse() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState<'events' | 'leaderboard'>('events');
    const [privacyMode, setPrivacyMode] = useState<'dark' | 'airlock' | 'open'>('airlock');
    const { signals } = useAstraStore();

    // Rotate events & Toggle Modes
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % EVENTS.length);
        }, 4000);

        // Switch to Leaderboard every 12 seconds
        const modeTimer = setInterval(() => {
            setMode(prev => prev === 'events' ? 'leaderboard' : 'events');
        }, 12000);

        return () => {
            clearInterval(timer);
            clearInterval(modeTimer);
        };
    }, []);

    // Signal Bus Listener
    // Signal Bus Listener
    useEffect(() => {
        if (signals.length > 0) {
            const latest = signals[0];
            if (latest.type === 'THREAT_DETECTED') {
                // Flash the new threat immediately
                setMode('events');
                // You could dynamically insert this into the EVENTS array here if needed,
                // but for V1 just ensuring the mode switches back to events is a good visual indicator.
            }
        }
    }, [signals]);

    const event = EVENTS[currentIndex];
    const leader = LEADERBOARD[0];

    return (
        <div className="w-full bg-zinc-950/80 border-b border-zinc-800 h-8 flex items-center overflow-hidden relative backdrop-blur-md">
            {/* Label */}
            <div className="h-full bg-emerald-950/30 px-4 flex items-center gap-2 border-r border-emerald-500/20 z-10 shrink-0">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase hidden md:inline">Astra Network</span>
                <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase md:hidden">ASTRA</span>
            </div>

            {/* Scrolling Content */}
            <div className="flex-1 relative h-full flex items-center px-4 overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {mode === 'events' ? (
                        <motion.div
                            key={`event-${event.id}`}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                            className="flex items-center gap-3 absolute w-full"
                        >
                            {event.type === 'block' && <Shield className="w-3 h-3 text-emerald-400" />}
                            {event.type === 'intel' && <Zap className="w-3 h-3 text-amber-400" />}
                            {event.type === 'alert' && <Lock className="w-3 h-3 text-red-400" />}

                            <span className="text-xs font-mono text-zinc-300 truncate max-w-[60%] md:max-w-none">
                                {event.text}
                            </span>

                            <span className="text-[10px] text-zinc-600 font-mono uppercase border border-zinc-800 rounded px-1.5 ml-auto mr-4 hidden md:inline-block">
                                {event.location}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="leaderboard"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="flex items-center gap-6 absolute w-full"
                        >
                            <div className="flex items-center gap-2 text-amber-400">
                                <Trophy className="w-3 h-3" />
                                <span className="text-xs font-bold uppercase tracking-wide">Immunity Leaderboard</span>
                            </div>

                            {LEADERBOARD.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                                    <span className="text-zinc-600">#{item.rank}</span>
                                    <span className={cn(i === 0 ? "text-white font-bold" : "")}>{item.sector}</span>
                                    <span className="text-emerald-500">{item.score}%</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Stats / Reputation Score */}
            <div className="hidden md:flex items-center gap-4 px-4 h-full border-l border-zinc-800 bg-zinc-950/50 text-[10px] text-zinc-500 font-mono">

                {/* Privacy / Airlock Control */}
                <div
                    className="flex items-center gap-1.5 group cursor-pointer relative select-none"
                    onClick={() => setPrivacyMode(p => p === 'airlock' ? 'open' : p === 'open' ? 'dark' : 'airlock')}
                >
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-zinc-900 border border-zinc-700 p-3 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className={cn(
                            "font-bold mb-1",
                            privacyMode === 'dark' ? "text-red-500" :
                                privacyMode === 'airlock' ? "text-emerald-400" : "text-blue-400"
                        )}>
                            {privacyMode === 'dark' ? "MODE: DARK (ISOLATED)" :
                                privacyMode === 'airlock' ? "MODE: AIRLOCK (HASH ONLY)" : "MODE: OPEN (FULL SHARE)"}
                        </div>
                        <div className="text-zinc-400 leading-tight">
                            {privacyMode === 'dark' ? "Zero outbound data. No viral protection." :
                                privacyMode === 'airlock' ? "Federated Learning active. No PII shared. Legal Safe." : "Full telemetry sharing. Maximum protection."}
                        </div>
                    </div>

                    {privacyMode === 'dark' && <ShieldOff className="w-3 h-3 text-red-500" />}
                    {privacyMode === 'airlock' && <Shield className="w-3 h-3 text-emerald-500" />}
                    {privacyMode === 'open' && <Globe className="w-3 h-3 text-blue-500" />}

                    <span className={cn(
                        "group-hover:opacity-80 transition-colors font-bold",
                        privacyMode === 'dark' ? "text-red-500" :
                            privacyMode === 'airlock' ? "text-emerald-500" : "text-blue-500"
                    )}>
                        {privacyMode === 'dark' ? "AIRLOCK: SEALED" :
                            privacyMode === 'airlock' ? "DATA: SECURE" : "DATA: OPEN"}
                    </span>
                </div>

                <div className="w-px h-3 bg-zinc-800" />

                {/* Viral Loop: My Contribution */}
                <div className="flex items-center gap-1.5 text-amber-500/80">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-bold">MY_SCORE: 742</span>
                </div>

                <div className="w-px h-3 bg-zinc-800" />

                <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3" />
                    <span>NODES: 4,192</span>
                </div>
            </div>
        </div>
    );
}
