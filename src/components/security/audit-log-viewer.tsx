"use client";

import { useEffect, useState } from 'react';
import { getAuditLogs, AuditLogEntry } from '@/lib/auth/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, User, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAstraStore } from '@/lib/store';

export function AuditLogViewer() {
    // For MVP, since getAuditLogs is server-side in our mock file but we need it client side,
    // we'll actually need an API route or server action.
    // For this demo prototype, we'll simulate fetching the local mock logs through a server action or API.
    // However, since `getAuditLogs` is in `lib/auth/audit.ts` (server-only context usually), 
    // let's create a server action wrapper or just use a simple API route for this.

    // To keep it simple and fast without adding more API routes, let's assume this component
    // fetches from a new endpoint we'll make: /api/security/audit

    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/security/audit')
            .then(res => res.json())
            .then(data => {
                setLogs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch audit logs", err);
                setLoading(false);
            });
    }, []);

    return (
        <Card className="w-full bg-black/40 border-zinc-800 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    IMMUTABLE AUDIT LEDGER
                </CardTitle>
                <div className="text-[10px] font-mono text-zinc-600">
                    {logs.length} RECORDS FOUND
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-xs text-zinc-500 text-center py-4 animate-pulse">Decrypting Ledger...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-xs text-zinc-500 text-center py-4">No records found.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="group relative pl-4 border-l border-zinc-800 hover:border-emerald-500/50 transition-colors">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700 group-hover:border-emerald-500 group-hover:bg-emerald-500/20 transition-all" />

                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-900/30 border border-transparent group-hover:border-zinc-800 group-hover:bg-zinc-900/50 transition-all">
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase",
                                            log.action === 'LOGIN' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                log.action === 'POLICY_UPDATE' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        )}>
                                            {log.action}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                            <span className="opacity-50 mx-1">|</span>
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="text-xs text-zinc-300 font-medium">
                                        {log.details}
                                    </div>

                                    <div className="flex items-center gap-3 mt-1 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                            <User className="w-3 h-3" />
                                            {log.actorName} <span className="text-zinc-600">({log.actorRole})</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                                            <Activity className="w-3 h-3" />
                                            IP: {log.ip}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
