"use client";

import { useEffect, useState } from "react";
import { getRansomwareFeed, getThreatLevel } from "@/lib/ransomware-client";
import { RansomwareFeedData } from "@/types/ransomware";
import { ThreatTicker } from "@/components/intelligence/threat-ticker";
import { RansomwareStatsCards } from "@/components/intelligence/ransomware-stats";
import { VictimsFeed } from "@/components/intelligence/victims-feed";
import { GroupActivityChart } from "@/components/intelligence/group-activity-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertOctagon, Terminal } from "lucide-react";

export default function RansomwareIntelligencePage() {
    const [data, setData] = useState<RansomwareFeedData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const feed = await getRansomwareFeed();
                setData(feed);
            } catch (error) {
                console.error("Failed to load threat intel", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    <p className="font-mono text-sm uppercase tracking-widest animate-pulse">Establishing Secure Uplink...</p>
                </div>
            </div>
        );
    }

    if ((data as any).error) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
                <Alert className="bg-red-950/20 border-red-900/50 text-red-200 max-w-lg mb-4">
                    <AlertOctagon className="h-6 w-6 text-red-500" />
                    <AlertTitle>Feed Connection Error</AlertTitle>
                    <AlertDescription>
                        Threat intelligence feed currently unavailable — check API connection in Settings.
                        <br /><br />
                        <span className="text-xs text-slate-500">Last attempt: {(data as any).lastAttempt}</span>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const threatLevel = getThreatLevel();
    const recentVictimsTicker = data.victims.slice(0, 5).map(v => `LATEST VICTIM: ${v.post_title} [${v.group_name.toUpperCase()}]`);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Top Ticker */}
            <ThreatTicker items={recentVictimsTicker} />

            <div className="flex-1 p-6 space-y-6">

                {/* Hero Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Terminal className="w-8 h-8 text-red-500" />
                            Global Ransomware Monitor
                        </h1>
                        <p className="text-slate-400 mt-1">Real-time intelligence on active ransomware campaigns and victimology.</p>
                    </div>

                    {/* DEFCON / Threat Level Badge */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Threat Level</span>
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                        key={level}
                                        className={`w-3 h-8 rounded-sm ${level <= threatLevel ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-800'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="text-4xl font-black text-red-500 drop-shadow-lg">
                            DEF-{6 - threatLevel}
                        </div>
                    </div>
                </div>

                {/* Global Stats */}
                <RansomwareStatsCards stats={data.stats} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* Main Feed - Takes up 2 columns */}
                    <div className="lg:col-span-2 h-full">
                        <VictimsFeed victims={data.victims} />
                    </div>

                    {/* Side Column - Charts & Alerts */}
                    <div className="space-y-6 flex flex-col h-full">
                        {/* Alert Card */}
                        <Alert className="bg-red-950/20 border-red-900/50 text-red-200">
                            <AlertOctagon className="h-4 w-4 text-red-500" />
                            <AlertTitle>Critical Advisory</AlertTitle>
                            <AlertDescription>
                                LockBit 3.0 activity surge detected in North America sector. Ensure offline backups are verifiable.
                            </AlertDescription>
                        </Alert>

                        <div className="flex-1 min-h-0">
                            <GroupActivityChart groups={data.groups} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
