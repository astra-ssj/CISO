"use client";

import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Scale, ShieldCheck, FileCheck, CheckCircle2, ChevronRight, PlusCircle } from "lucide-react";
import { GOLDEN_LIBRARY, VerifiedClause } from "@/lib/golden-library";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GoldenLibraryPanelProps {
    onInsert: (text: string) => void;
}

export function GoldenLibraryPanel({ onInsert }: GoldenLibraryPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = Array.from(new Set(GOLDEN_LIBRARY.map(c => c.category)));

    const filteredClauses = GOLDEN_LIBRARY.filter(clause => {
        const matchesSearch = clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clause.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? clause.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-full border-l border-border bg-card/50 w-[350px]">
            {/* Header */}
            <div className="p-4 border-b border-border bg-secondary/10">
                <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-sm uppercase tracking-wide">Golden Library</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                    Verified clauses aproved by Legal & Security.
                </p>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search clauses..."
                        className="pl-9 h-9 text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 p-2 overflow-x-auto border-b border-border no-scrollbar">
                <Button
                    variant={selectedCategory === null ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs rounded-full whitespace-nowrap"
                    onClick={() => setSelectedCategory(null)}
                >
                    All
                </Button>
                {categories.map(cat => (
                    <Button
                        key={cat}
                        variant={selectedCategory === cat ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 text-xs rounded-full whitespace-nowrap"
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {/* List */}
            <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                    {filteredClauses.map(clause => (
                        <Card key={clause.id} className="p-3 border-transparent hover:border-primary/20 hover:bg-secondary/30 transition-all group group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button
                                    size="sm"
                                    className="h-6 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                                    onClick={() => onInsert(clause.content)}
                                >
                                    <PlusCircle className="w-3 h-3" /> Insert
                                </Button>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className={cn(
                                    "text-[9px] px-1.5 py-0",
                                    clause.category === 'Legal' ? "border-blue-500/30 text-blue-400" :
                                        clause.category === 'Security' ? "border-red-500/30 text-red-400" :
                                            "border-emerald-500/30 text-emerald-400"
                                )}>
                                    {clause.category}
                                </Badge>
                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    Verified
                                </div>
                            </div>

                            <h4 className="font-bold text-xs text-foreground mb-1 group-hover:text-primary transition-colors">
                                {clause.title}
                            </h4>

                            <p className="text-[10px] text-muted-foreground line-clamp-3 mb-2 font-mono leading-relaxed bg-black/20 p-1.5 rounded">
                                {clause.content}
                            </p>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                <span className="text-[9px] text-muted-foreground">Src: {clause.source}</span>
                            </div>
                        </Card>
                    ))}
                    {filteredClauses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <FileCheck className="w-8 h-8 mb-2 opacity-20" />
                            <span className="text-xs">No clauses found.</span>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
