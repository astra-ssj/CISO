"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RansomwareVictim } from "@/types/ransomware";
import { ExternalLink, MonitorX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VictimsFeedProps {
    victims: RansomwareVictim[];
}

export function VictimsFeed({ victims }: VictimsFeedProps) {
    return (
        <Card className="bg-slate-950/50 border-slate-800 backdrop-blur-sm h-full">
            <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                    <MonitorX className="w-5 h-5 text-red-400" />
                    Recent Victims Feed
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-800">
                    <Table>
                        <TableHeader className="bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-slate-800">
                                <TableHead className="text-slate-400">Published</TableHead>
                                <TableHead className="text-slate-400">Victim Organization</TableHead>
                                <TableHead className="text-slate-400">Actor / Group</TableHead>
                                <TableHead className="text-slate-400">Country</TableHead>
                                <TableHead className="text-right text-slate-400">Proof</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {victims.map((victim) => (
                                <TableRow key={victim.id} className="border-slate-800 hover:bg-slate-900/50">
                                    <TableCell className="font-mono text-xs text-slate-500">
                                        {victim.published}
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-200">
                                        {victim.post_title}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-950/50">
                                            {victim.group_name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-400">{victim.country}</TableCell>
                                    <TableCell className="text-right">
                                        <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-end w-full gap-1">
                                            View <ExternalLink className="w-3 h-3" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
