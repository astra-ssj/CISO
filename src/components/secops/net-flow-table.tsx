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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useState } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";

// Mock Data structure mimicking NetObserv IPFIX/Loki export
interface NetFlow {
    id: string;
    timestamp: string;
    source: string;
    destination: string;
    srcPort: number;
    dstPort: number;
    protocol: string;
    bytes: number;
    packets: number;
    action: "allow" | "drop";
    node: string;
}

const MOCK_FLOWS: NetFlow[] = [
    { id: "flow-1", timestamp: "2024-02-03 14:30:01", source: "10.244.0.15 (frontend)", destination: "10.244.0.22 (api-gateway)", srcPort: 44321, dstPort: 8080, protocol: "TCP", bytes: 1540, packets: 12, action: "allow", node: "worker-1" },
    { id: "flow-2", timestamp: "2024-02-03 14:30:02", source: "192.168.1.5 (external)", destination: "10.244.0.15 (frontend)", srcPort: 52112, dstPort: 443, protocol: "TCP", bytes: 520, packets: 4, action: "allow", node: "worker-1" },
    { id: "flow-3", timestamp: "2024-02-03 14:30:05", source: "10.244.0.22 (api-gateway)", destination: "10.244.0.45 (payment-svc)", srcPort: 38291, dstPort: 50051, protocol: "GRPC", bytes: 890, packets: 8, action: "allow", node: "worker-2" },
    { id: "flow-4", timestamp: "2024-02-03 14:30:08", source: "10.244.0.101 (malicious)", destination: "10.244.0.99 (user-db)", srcPort: 6666, dstPort: 5432, protocol: "TCP", bytes: 64, packets: 1, action: "drop", node: "worker-2" },
    { id: "flow-5", timestamp: "2024-02-03 14:30:10", source: "10.244.0.22 (api-gateway)", destination: "10.244.0.33 (audit-log)", srcPort: 49123, dstPort: 9200, protocol: "TCP", bytes: 2048, packets: 16, action: "allow", node: "worker-1" },
    { id: "flow-6", timestamp: "2024-02-03 14:30:12", source: "10.244.0.15 (frontend)", destination: "8.8.8.8 (dns)", srcPort: 53111, dstPort: 53, protocol: "UDP", bytes: 128, packets: 2, action: "allow", node: "worker-1" },
    { id: "flow-7", timestamp: "2024-02-03 14:30:15", source: "172.16.0.4 (legacy)", destination: "10.244.0.22 (api-gateway)", srcPort: 1234, dstPort: 8080, protocol: "TCP", bytes: 0, packets: 0, action: "drop", node: "worker-3" },
];

export function NetFlowTable() {
    const [filter, setFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    const filteredFlows = MOCK_FLOWS.filter(flow => {
        const matchesText =
            flow.source.toLowerCase().includes(filter.toLowerCase()) ||
            flow.destination.toLowerCase().includes(filter.toLowerCase());
        const matchesAction = actionFilter === "all" || flow.action === actionFilter;
        return matchesText && matchesAction;
    });

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Input
                    placeholder="Filter by source or destination ip/pod..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="allow">Allow</SelectItem>
                        <SelectItem value="drop">Drop</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Protocol</TableHead>
                            <TableHead className="text-right">Bytes</TableHead>
                            <TableHead className="text-right">Packets</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredFlows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No flows found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredFlows.map((flow) => (
                                <TableRow key={flow.id} className="hover:bg-muted/50">
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {flow.timestamp}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        <div className="flex flex-col">
                                            <span>{flow.source}</span>
                                            <span className="text-[10px] text-muted-foreground">Port: {flow.srcPort}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        <div className="flex flex-col">
                                            <span>{flow.destination}</span>
                                            <span className="text-[10px] text-muted-foreground">Port: {flow.dstPort}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px]">
                                            {flow.protocol}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                        {flow.bytes.toLocaleString()} B
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                        {flow.packets}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {flow.action === 'drop' ? (
                                                <Badge variant="destructive" className="flex items-center gap-1">
                                                    <ShieldAlert className="h-3 w-3" /> Drop
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">
                                                    Allow
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground text-right">
                Showing {filteredFlows.length} of {MOCK_FLOWS.length} flows captured by eBPF agent
            </div>
        </div>
    );
}
