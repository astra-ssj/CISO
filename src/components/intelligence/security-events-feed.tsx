"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, ShieldAlert, AlertTriangle, CheckCircle2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityEvent {
    id: string;
    timestamp: string;
    agent: string;
    ruleId: string;
    description: string;
    level: number; // 1-12 (Wazuh scale)
    status: 'fired' | 'mitigated';
}

const SAMPLE_EVENTS = [
    { description: "SSH brute force attempt", ruleId: "5716", level: 10, agent: "web-server-01" },
    { description: "Identify change in /etc/passwd", ruleId: "550", level: 12, agent: "db-cluster-prod" },
    { description: "Web server 400 error code", ruleId: "31101", level: 5, agent: "frontend-lb" },
    { description: "Multiple failed logins", ruleId: "5710", level: 9, agent: "auth-service" },
    { description: "Privilege escalation detected", ruleId: "5402", level: 12, agent: "worker-node-04" },
    { description: "New port open", ruleId: "2001", level: 7, agent: "dev-bastion" },
    { description: "Package installed via apt", ruleId: "2902", level: 3, agent: "ci-runner" },
];

import { useAstraStore } from "@/lib/store";

export function SecurityEventsFeed() {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { dispatchSignal } = useAstraStore();

    useEffect(() => {
        // Initial Population
        const initialEvents = Array.from({ length: 8 }).map((_, i) => createRandomEvent(i));
        setEvents(initialEvents);

        // Live Feed Simulation
        const interval = setInterval(() => {
            const newEvent = createRandomEvent(Date.now());
            setEvents(prev => [newEvent, ...prev.slice(0, 50)]); // Keep last 50

            // EMITTER LOGIC: Dispatch Signal for High Severity Events
            if (newEvent.level >= 10 && newEvent.status === 'fired') {
                dispatchSignal('THREAT_DETECTED', {
                    description: newEvent.description,
                    level: newEvent.level,
                    agent: newEvent.agent
                });
            }

        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const createRandomEvent = (seed: number): SecurityEvent => {
        const template = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)];
        const date = new Date();
        return {
            id: `evt-${seed}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            agent: template.agent,
            ruleId: template.ruleId,
            description: template.description,
            level: template.level,
            status: Math.random() > 0.8 ? 'mitigated' : 'fired' // 20% mitigated
        };
    };

    const getSeverityColor = (level: number) => {
        if (level >= 12) return "text-red-500 bg-red-500/10 border-red-500/20";
        if (level >= 8) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
        if (level >= 5) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    };

    return (
        <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-primary" />
                    SECURITY EVENTS FEED
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                    LIVE
                </Badge>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden flex-1 relative">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-[10px] font-mono text-muted-foreground border-b border-border/50 font-bold uppercase tracking-wider">
                    <div className="col-span-2">Time</div>
                    <div className="col-span-2">Agent</div>
                    <div className="col-span-1 text-center">Lvl</div>
                    <div className="col-span-6">Description</div>
                    <div className="col-span-1 text-right">Rule</div>
                </div>

                {/* Scrollable Feed */}
                <div className="h-[300px] overflow-y-auto p-0 scrollbar-hide" ref={scrollRef}>
                    <AnimatePresence initial={false}>
                        {events.map((evt) => (
                            <motion.div
                                key={evt.id}
                                initial={{ opacity: 0, x: -20, backgroundColor: "rgba(var(--primary), 0.1)" }}
                                animate={{ opacity: 1, x: 0, backgroundColor: "rgba(var(--primary), 0)" }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-12 gap-2 p-2 text-[11px] font-mono border-b border-border/50 hover:bg-muted/30 transition-colors items-center"
                            >
                                <div className="col-span-2 text-muted-foreground">{evt.timestamp}</div>
                                <div className="col-span-2 text-foreground/80 truncate" title={evt.agent}>{evt.agent}</div>
                                <div className="col-span-1 flex justify-center">
                                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", getSeverityColor(evt.level))}>
                                        {evt.level}
                                    </span>
                                </div>
                                <div className="col-span-6 flex items-center gap-2 truncate">
                                    {evt.status === 'mitigated' ? (
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                    ) : evt.level >= 10 ? (
                                        <ShieldAlert className="h-3 w-3 text-red-500 flex-shrink-0 animate-pulse" />
                                    ) : (
                                        <Terminal className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className={cn(evt.level >= 10 && "text-red-500 font-semibold", "truncate")} title={evt.description}>
                                        {evt.description}
                                    </span>
                                </div>
                                <div className="col-span-1 text-right text-muted-foreground">{evt.ruleId}</div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
