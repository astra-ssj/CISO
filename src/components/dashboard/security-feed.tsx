"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, Globe, Shield, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { analyzeThreatBatchAction } from "@/app/actions/ai-ops";
import { motion, AnimatePresence } from "framer-motion";

interface FeedItem {
    id: string;
    type: 'THREAT' | 'GOVERNANCE' | 'INTERNAL';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
    message: string;
    timestamp: string;
}

const FEED_DATA: FeedItem[] = [
    { id: '1', type: 'THREAT', severity: 'CRITICAL', message: 'CVE-2024-3094: XZ Utils Backdoor detected in upstream deps', timestamp: '2m ago' },
    { id: '2', type: 'GOVERNANCE', severity: 'MEDIUM', message: 'EU AI Act: New compliance checklist published for GenAI models', timestamp: '15m ago' },
    { id: '3', type: 'INTERNAL', severity: 'HIGH', message: 'Unusual outbound traffic detected from Finance Subnet', timestamp: '32m ago' },
    { id: '4', type: 'THREAT', severity: 'MEDIUM', message: 'New phishing campaign targeting C-Suite executives', timestamp: '1h ago' },
    { id: '5', type: 'GOVERNANCE', severity: 'INFO', message: 'Quarterly Access Review cycle starting in 2 days', timestamp: '3h ago' },
    { id: '6', type: 'INTERNAL', severity: 'INFO', message: 'Automated backup completed successfully', timestamp: '4h ago' },
];

export function SecurityFeed() {
    const [briefing, setBriefing] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleGenerateBriefing = async () => {
        setIsAnalyzing(true);
        // Simulate "reading" delay if local AI is instant, to show it's working
        const start = Date.now();

        try {
            const result = await analyzeThreatBatchAction(FEED_DATA);
            if (result.success && result.content) {
                // Ensure at least 1s loading for UX
                const elapsed = Date.now() - start;
                if (elapsed < 1000) await new Promise(r => setTimeout(r, 1000 - elapsed));
                setBriefing(result.content);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Card className="col-span-1 lg:col-span-2 min-h-[400px] border-primary/10 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ActivityIcon />
                    Live Security & Governance Feed
                </CardTitle>
                <div className="flex items-center gap-2">
                    {!briefing ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                            onClick={handleGenerateBriefing}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            {isAnalyzing ? "Analyzing..." : "Generate AI Brief"}
                        </Button>
                    ) : (
                        <Badge variant="outline" className="text-xs font-mono text-purple-400 border-purple-500/30">
                            AI ACTIVE
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-xs font-mono text-muted-foreground">LIVE</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                <AnimatePresence>
                    {briefing && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-4"
                        >
                            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-purple-100 italic relative">
                                <Sparkles className="w-4 h-4 text-purple-400 absolute top-3 left-3" />
                                <div className="pl-6">
                                    <span className="font-bold text-purple-400 not-italic block mb-1 text-xs uppercase tracking-wider">Executive Summary</span>
                                    "{briefing}"
                                </div>
                                <button
                                    onClick={() => setBriefing(null)}
                                    className="absolute top-2 right-2 text-purple-400/50 hover:text-purple-300"
                                >
                                    ×
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4 pr-4">
                        {FEED_DATA.map((item) => (
                            <div key={item.id} className="flex gap-3 items-start p-3 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
                                <div className="shrink-0 mt-0.5">
                                    <SeverityIcon type={item.type} severity={item.severity} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.type === 'THREAT' ? 'bg-red-100 text-red-700' :
                                            item.type === 'GOVERNANCE' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {item.type}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{item.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-foreground/90">{item.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function ActivityIcon() {
    return (
        <span className="relative flex h-3 w-3 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
    )
}

function SeverityIcon({ type, severity }: { type: string, severity: string }) {
    if (type === 'THREAT') return <Shield className={`h-4 w-4 ${severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`} />;
    if (type === 'GOVERNANCE') return <FileText className="h-4 w-4 text-blue-500" />;
    return <Globe className="h-4 w-4 text-gray-500" />;
}
