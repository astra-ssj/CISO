import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RansomwareStats } from "@/types/ransomware";
import { Activity, Globe, ShieldAlert, Skull } from "lucide-react";

interface RansomwareStatsCardProps {
    stats: RansomwareStats;
}

export function RansomwareStatsCards({ stats }: RansomwareStatsCardProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-slate-950/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Total Victims (24h)</CardTitle>
                    <Activity className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.total_victims_24h}</div>
                    <p className="text-xs text-slate-500">+20.1% from yesterday</p>
                </CardContent>
            </Card>
            <Card className="bg-slate-950/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Victims (7 Days)</CardTitle>
                    <Skull className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.total_victims_7d}</div>
                    <p className="text-xs text-slate-500">+12% week over week</p>
                </CardContent>
            </Card>
            <Card className="bg-slate-950/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Active Groups</CardTitle>
                    <ShieldAlert className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.active_groups}</div>
                    <p className="text-xs text-slate-500">Currently monitoring</p>
                </CardContent>
            </Card>
            <Card className="bg-slate-950/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Top Target</CardTitle>
                    <Globe className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.top_target_country}</div>
                    <p className="text-xs text-slate-500">Highest volume of attacks</p>
                </CardContent>
            </Card>
        </div>
    );
}
