'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import {
    DATA_LAYERS,
    LAYER_CATEGORIES,
    type DataLayer,
    type DataLayerCategory,
} from '@/lib/intelligence/data-layers';

interface LayerControlPanelProps {
    enabledLayers: Set<string>;
    onToggleLayer: (layerId: string) => void;
    onToggleCategory: (category: DataLayerCategory, enabled: boolean) => void;
}

export function LayerControlPanel({
    enabledLayers,
    onToggleLayer,
    onToggleCategory,
}: LayerControlPanelProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<DataLayerCategory>>(
        new Set(['GEOPOLITICAL', 'CYBER'])
    );
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCategoryExpanded = (cat: DataLayerCategory) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) {
                next.delete(cat);
            } else {
                next.add(cat);
            }
            return next;
        });
    };

    const getLayersForCategory = (cat: DataLayerCategory): DataLayer[] =>
        DATA_LAYERS.filter((l) => l.category === cat);

    const getCategoryEnabledCount = (cat: DataLayerCategory): number =>
        getLayersForCategory(cat).filter((l) => enabledLayers.has(l.id)).length;

    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className="bg-slate-900/90 backdrop-blur-sm border border-border/40 rounded-lg p-2.5 hover:bg-slate-800/90 transition-colors"
            >
                <Layers className="h-5 w-5 text-cyan-400" />
            </button>
        );
    }

    return (
        <div className="bg-slate-900/90 backdrop-blur-sm border border-border/40 rounded-lg w-[280px] flex flex-col max-h-[calc(100vh-250px)]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                        Data Layers
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className="text-[10px] border-cyan-500/30 text-cyan-400 px-1.5"
                    >
                        {enabledLayers.size}/{DATA_LAYERS.length}
                    </Badge>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Categories */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {LAYER_CATEGORIES.map((cat) => {
                        const layers = getLayersForCategory(cat.id);
                        const enabledCount = getCategoryEnabledCount(cat.id);
                        const isExpanded = expandedCategories.has(cat.id);
                        const allEnabled = enabledCount === layers.length;

                        return (
                            <div key={cat.id} className="rounded-md overflow-hidden">
                                {/* Category header */}
                                <button
                                    onClick={() => toggleCategoryExpanded(cat.id)}
                                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-slate-800/50 transition-colors rounded-md group"
                                >
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                            <ChevronDown className="h-3 w-3 text-slate-500" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3 text-slate-500" />
                                        )}
                                        <span className="text-lg leading-none">{cat.icon}</span>
                                        <span className="text-xs font-medium text-slate-300">
                                            {cat.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500">
                                            {enabledCount}/{layers.length}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleCategory(cat.id, !allEnabled);
                                            }}
                                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium transition-colors ${allEnabled
                                                    ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                                    : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                                                }`}
                                        >
                                            {allEnabled ? 'OFF' : 'ALL'}
                                        </button>
                                    </div>
                                </button>

                                {/* Layer items */}
                                {isExpanded && (
                                    <div className="pl-4 pr-1 pb-1 space-y-0.5">
                                        {layers.map((layer) => {
                                            const isEnabled = enabledLayers.has(layer.id);
                                            return (
                                                <div
                                                    key={layer.id}
                                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${isEnabled
                                                            ? 'bg-slate-800/40'
                                                            : 'hover:bg-slate-800/20'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div
                                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                                            style={{
                                                                backgroundColor: isEnabled
                                                                    ? layer.color
                                                                    : '#475569',
                                                            }}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="text-[11px] font-medium text-slate-300 truncate">
                                                                {layer.name}
                                                            </div>
                                                            <div className="text-[9px] text-slate-500 truncate">
                                                                {layer.source}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={isEnabled}
                                                        onCheckedChange={() => onToggleLayer(layer.id)}
                                                        className="scale-75"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
