"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvidenceStore, EvidenceStatus, EvidenceType } from '@/lib/evidence-store';
import {
    FileUp, FileCheck, FileWarning, FileClock, Search,
    Shield, CheckCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react';

const STATUS_CONFIG: Record<EvidenceStatus, { icon: React.ReactNode; color: string; label: string }> = {
    VERIFIED: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Verified' },
    UPLOADED: { icon: <Clock className="h-3.5 w-3.5" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Pending' },
    EXPIRED: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Expired' },
    REJECTED: { icon: <XCircle className="h-3.5 w-3.5" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Rejected' },
};

const TYPE_LABELS: Record<EvidenceType, string> = {
    POLICY: '📄 Policy', REPORT: '📊 Report', SCREENSHOT: '📸 Screenshot',
    LOG: '📋 Log', CERTIFICATE: '🏅 Certificate', ASSESSMENT: '🔍 Assessment', OTHER: '📁 Other'
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function EvidenceVault() {
    const { evidenceItems, getCoverageStats, updateEvidence, removeEvidence } = useEvidenceStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFramework, setFilterFramework] = useState('all');
    const stats = getCoverageStats();

    const filteredItems = evidenceItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.controlIds.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFramework = filterFramework === 'all' || item.framework === filterFramework;
        return matchesSearch && matchesFramework;
    });

    const frameworks = [...new Set(evidenceItems.map(e => e.framework))];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-card/30 border-primary/10">
                    <CardContent className="p-3 flex items-center gap-3">
                        <FileUp className="h-5 w-5 text-primary" />
                        <div><p className="text-xl font-bold text-white">{stats.total}</p><p className="text-[10px] text-muted-foreground">Total Evidence</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-emerald-500/10">
                    <CardContent className="p-3 flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-emerald-400" />
                        <div><p className="text-xl font-bold text-emerald-400">{stats.verified}</p><p className="text-[10px] text-muted-foreground">Verified</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-blue-500/10">
                    <CardContent className="p-3 flex items-center gap-3">
                        <FileClock className="h-5 w-5 text-blue-400" />
                        <div><p className="text-xl font-bold text-blue-400">{stats.pending}</p><p className="text-[10px] text-muted-foreground">Pending Review</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-red-500/10">
                    <CardContent className="p-3 flex items-center gap-3">
                        <FileWarning className="h-5 w-5 text-red-400" />
                        <div><p className="text-xl font-bold text-red-400">{stats.expired}</p><p className="text-[10px] text-muted-foreground">Expired</p></div>
                    </CardContent>
                </Card>
            </div>

            {/* Upload Zone */}
            <Card className="bg-card/20 border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                    <FileUp className="h-8 w-8 mx-auto mb-2 text-primary/40" />
                    <p className="text-sm text-muted-foreground">Drag & drop evidence files here, or click to browse</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Supports PDF, DOCX, XLSX, CSV, PNG, JPG — Max 10MB</p>
                </CardContent>
            </Card>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search evidence or control ID..." className="pl-10" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Select value={filterFramework} onValueChange={setFilterFramework}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Frameworks</SelectItem>
                        {frameworks.map(f => <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Evidence Table */}
            <Card className="bg-card/20 border-primary/10">
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/40">
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Evidence</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Controls</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Size</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Uploaded</th>
                                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => {
                                const statusCfg = STATUS_CONFIG[item.status];
                                return (
                                    <tr key={item.id} className="border-b border-border/20 hover:bg-white/[0.02] group">
                                        <td className="p-3">
                                            <div className="font-medium text-sm text-white">{item.name}</div>
                                            <div className="text-[10px] text-muted-foreground">{item.fileName}</div>
                                        </td>
                                        <td className="p-3 text-xs">{TYPE_LABELS[item.type]}</td>
                                        <td className="p-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {item.controlIds.map(c => (
                                                    <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">{c}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <Badge className={`${statusCfg.color} border gap-1 text-[10px]`}>
                                                {statusCfg.icon} {statusCfg.label}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-xs text-muted-foreground font-mono">{formatFileSize(item.fileSize)}</td>
                                        <td className="p-3 text-xs text-muted-foreground">{item.uploadDate}</td>
                                        <td className="p-3 text-right">
                                            {item.status === 'UPLOADED' && (
                                                <Button variant="ghost" size="sm" className="text-emerald-400 text-xs h-7 opacity-0 group-hover:opacity-100"
                                                    onClick={() => updateEvidence(item.id, { status: 'VERIFIED' })}>
                                                    Verify
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="text-red-400 text-xs h-7 opacity-0 group-hover:opacity-100"
                                                onClick={() => removeEvidence(item.id)}>
                                                Remove
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No evidence items found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
