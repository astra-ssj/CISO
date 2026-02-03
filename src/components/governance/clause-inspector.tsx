"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, HelpCircle, AlertTriangle, Scale, Gavel, FileText, ArrowRightLeft, Sparkles, Copy, ArrowRight, XCircle, Globe } from "lucide-react";
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useUnificationStore } from "@/lib/unification-store";
import { generateCounterDraftAction } from "@/app/actions/legal-ai";

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ClauseData {
    id: string;
    title: string;
    originalText: string;
    goldenText?: string; // Company Standard
    counterDraft?: string; // AI Suggestion
    reasoning?: string; // AI Reasoning
    riskLevel: RiskLevel;
    aiAnalysis: string;
    recommendations: string[];
}

interface ClauseInspectorProps {
    clause: ClauseData | null;
    onClose: () => void;
}

export function ClauseInspector({ clause, onClose }: ClauseInspectorProps) {
    const [activeTab, setActiveTab] = useState("analysis");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showDraft, setShowDraft] = useState(false);

    // State for generated content (overrides clause prop if regenerated)
    const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
    const [generatedReasoning, setGeneratedReasoning] = useState<string | null>(null);

    const enforceConstraint = useUnificationStore((state) => state.enforceConstraint);
    const [isEnforced, setIsEnforced] = useState(false);

    if (!clause) return null;

    const riskColor =
        clause.riskLevel === 'critical' ? 'text-red-500 border-red-500/50 bg-red-500/10' :
            clause.riskLevel === 'high' ? 'text-orange-500 border-orange-500/50 bg-orange-500/10' :
                clause.riskLevel === 'medium' ? 'text-amber-500 border-amber-500/50 bg-amber-500/10' :
                    'text-emerald-500 border-emerald-500/50 bg-emerald-500/10';

    const riskIcon =
        clause.riskLevel === 'critical' ? <AlertCircle className="w-5 h-5" /> :
            clause.riskLevel === 'high' ? <AlertTriangle className="w-5 h-5" /> :
                clause.riskLevel === 'medium' ? <HelpCircle className="w-5 h-5" /> :
                    <CheckCircle className="w-5 h-5" />;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateCounterDraftAction(
                clause.originalText,
                clause.riskLevel,
                clause.goldenText
            );

            if (result.success && result.counterDraft) {
                setGeneratedDraft(result.counterDraft);
                setGeneratedReasoning(result.reasoning || null);
                setShowDraft(true);
            } else {
                console.error("AI Generation Failed:", result.error);
                // Fallback to existing mock if server action fails hard (e.g. connectivity)
                // or just show error. For MVP we'll default to showing "Error"
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEnforce = () => {
        enforceConstraint({
            id: `policy-${clause.id}`,
            sourceClauseId: clause.id,
            name: "Data Sovereignty Enforcement",
            description: "Clause 8.4 Violation: Mandating EU-only Data Residency",
            affectedNodeIds: ['inf-1'], // Hardcoded to impact US-East-1 node
            severity: 'critical'
        });
        setIsEnforced(true);
    };

    // Use generated content or fallback to initial props
    const currentDraft = generatedDraft || clause.counterDraft;

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-0 right-0 h-full w-[450px] bg-background/95 border-l border-border shadow-2xl backdrop-blur-xl z-20 flex flex-col"
        >
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-start">
                <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg mt-1", riskColor)}>
                        {riskIcon}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{clause.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={cn("uppercase text-[10px] tracking-widest font-mono", riskColor.split(' ')[0])}>
                                {clause.riskLevel} Risk
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">ID: {clause.id}</span>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <span className="sr-only">Close</span>
                    ✕
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-6 pt-4">
                    <TabsList className="w-full">
                        <TabsTrigger value="analysis" className="flex-1 text-xs uppercase tracking-wide">Analysis</TabsTrigger>
                        <TabsTrigger value="compare" className="flex-1 text-xs uppercase tracking-wide" disabled={!clause.goldenText}>
                            Comparison
                        </TabsTrigger>
                        <TabsTrigger value="action" className="flex-1 text-xs uppercase tracking-wide">Action</TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <TabsContent value="analysis" className="mt-0 space-y-6">
                            {/* Raw Text */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                                    <FileText className="w-3 h-3" /> Vendor Clause
                                </div>
                                <div className="p-4 rounded-md bg-muted/50 border border-border text-sm font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {clause.originalText}
                                </div>
                            </div>

                            {/* AI Analysis */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
                                    <Scale className="w-3 h-3" /> Legal Analysis
                                </div>
                                <div className="text-sm leading-relaxed text-foreground">
                                    {clause.aiAnalysis}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-500 font-semibold">
                                    <Gavel className="w-3 h-3" /> Negotiation Points
                                </div>
                                <ul className="space-y-2">
                                    {clause.recommendations.map((rec, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>

                        <TabsContent value="compare" className="mt-0 space-y-6">
                            {/* Vendor vs Golden */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-red-400 font-semibold">
                                            <XCircle className="w-3 h-3" /> Vendor Text
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-md bg-red-500/5 border border-red-500/20 text-xs font-mono text-muted-foreground leading-relaxed">
                                        {clause.originalText}
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground/50 rotate-90" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                                            <CheckCircle className="w-3 h-3" /> Company Standard
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-xs font-mono text-muted-foreground leading-relaxed">
                                        {clause.goldenText}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <div className="text-xs uppercase tracking-widest text-amber-500 font-bold mb-2">Gap Analysis</div>
                                <p className="text-sm text-muted-foreground">
                                    The vendor's clause is significantly more restrictive than the standard. The primary conflict is the limitation period (1 month vs 12 months).
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="action" className="mt-0 space-y-6">
                            {!showDraft ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                    <div className="p-4 rounded-full bg-primary/10 mb-2">
                                        <Sparkles className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-lg">AI Legal Assistant</h4>
                                        <p className="text-sm text-muted-foreground max-w-[260px]">
                                            Generate a counter-proposal that aligns this clause with company standards.
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full max-w-[200px] mt-4"
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <>Generating Draft...</>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Draft Counter-Proposal
                                            </>
                                        )}
                                    </Button>

                                    {/* Grand Unification Trigger */}
                                    <div className="w-full max-w-[200px] pt-4 mt-4 border-t border-border">
                                        <p className="text-xs text-muted-foreground mb-3">Or enforce this clause continuously:</p>
                                        <Button
                                            variant="outline"
                                            className={cn("w-full border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10", isEnforced && "bg-red-500/20 border-red-500")}
                                            onClick={handleEnforce}
                                            disabled={isEnforced}
                                        >
                                            <Globe className="w-3 h-3 mr-2" />
                                            {isEnforced ? "Policy Active on Graph" : "Enforce on Nexus Graph"}
                                        </Button>
                                    </div>

                                    {isGenerating && (
                                        <div className="w-full max-w-[200px] h-1 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-primary"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1.5 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400 font-semibold">
                                            <Sparkles className="w-3 h-3" /> Generated Rebuttal
                                        </div>
                                        <Button variant="ghost" size="xs" className="h-6 gap-1 text-xs">
                                            <Copy className="w-3 h-3" /> Copy
                                        </Button>
                                    </div>

                                    <div className="p-4 rounded-md bg-purple-500/5 border border-purple-500/20 text-sm font-mono text-foreground leading-relaxed shadow-inner">
                                        {currentDraft || "Error generating draft."}
                                    </div>

                                    {generatedReasoning && (
                                        <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                                            <span className="font-bold block mb-1">AI Reasoning:</span>
                                            {generatedReasoning}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground italic">
                                            Suggested Email Context:
                                        </p>
                                        <div className="p-3 rounded bg-muted/30 text-xs text-muted-foreground">
                                            "Regarding logic clause {clause.id}, we cannot accept the current terms as they fall below our compliance baseline. Please see the attached redline which aligns with our standard MSA..."
                                        </div>
                                    </div>

                                    <Button className="w-full" variant="secondary" onClick={() => setShowDraft(false)}>
                                        Discard & Try Again
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20">
                <Button className="w-full gap-2" onClick={() => setActiveTab('action')}>
                    <ArrowRight className="w-4 h-4" />
                    {activeTab === 'action' ? 'Finalize Redline' : 'Take Action'}
                </Button>
            </div>
        </motion.div>
    );
}
