"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SCENARIOS, Scenario, GameStep, GameChoice } from "@/lib/wargames-data";
import { Terminal, ShieldAlert, Award, AlertTriangle, ArrowRight, RotateCcw, Timer, Skull, Plus, DollarSign, Shield, Clock, Target, FileText, TrendingDown, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from "next/link";

// MITRE ATT&CK tactic names
const MITRE_TACTICS: Record<string, string> = {
    'TA0001': 'Initial Access',
    'TA0002': 'Execution',
    'TA0003': 'Persistence',
    'TA0004': 'Privilege Escalation',
    'TA0005': 'Defense Evasion',
    'TA0006': 'Credential Access',
    'TA0007': 'Discovery',
    'TA0008': 'Lateral Movement',
    'TA0009': 'Collection',
    'TA0010': 'Exfiltration',
    'TA0011': 'Command & Control',
    'TA0040': 'Impact',
    'TA0042': 'Resource Development',
    'TA0043': 'Reconnaissance',
};

interface DecisionRecord {
    stepTitle: string;
    choiceText: string;
    risk: string;
    cost: number;
    feedback: string;
    timeRemaining: number;
    isTimeout: boolean;
}

export default function WarGamesPage() {
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [currentStepId, setCurrentStepId] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
    const [score, setScore] = useState(100);
    const [totalCost, setTotalCost] = useState(0);
    const [reputation, setReputation] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showAAR, setShowAAR] = useState(false);

    const currentStep: GameStep | undefined = selectedScenario && currentStepId ? selectedScenario.steps[currentStepId] : undefined;

    // Timer Logic
    useEffect(() => {
        if (!currentStep || currentStep.isEnding || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [currentStep, timeLeft]);

    // Timeout Handling
    useEffect(() => {
        if (timeLeft === 0 && currentStep && !currentStep.isEnding) {
            handleChoice(currentStep.choices[0].nextStepId, "PANICKED INACTION (TIMEOUT)", 0, 'HIGH', "Indecision under pressure. The worst choice is no choice.", true, 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, currentStep]);

    // Typewriter Effect
    useEffect(() => {
        if (!currentStep?.description) return;
        setDisplayedText("");
        setIsTyping(true);
        const text = currentStep.description;
        let charIndex = 0;
        const typeInterval = setInterval(() => {
            charIndex++;
            setDisplayedText(text.slice(0, charIndex));
            if (charIndex >= text.length) {
                setIsTyping(false);
                clearInterval(typeInterval);
            }
        }, 25);
        return () => clearInterval(typeInterval);
    }, [currentStep]);

    // Reset timer on new step
    useEffect(() => {
        if (currentStepId) {
            setTimeLeft(30);
        }
    }, [currentStepId]);

    const startScenario = (scenario: Scenario) => {
        setSelectedScenario(scenario);
        setCurrentStepId(scenario.initialStepId);
        setHistory([]);
        setDecisions([]);
        setScore(100);
        setTotalCost(0);
        setReputation(0);
        setTimeLeft(30);
        setShowAAR(false);
    };

    const handleChoice = (nextStepId: string, choiceText: string, cost: number, risk: string, feedback: string, isTimeout = false, reputationImpact = 0) => {
        setHistory(prev => [...prev, isTimeout ? `> !!! ${choiceText} !!!` : `> ${choiceText}`]);

        // Record decision for AAR
        setDecisions(prev => [...prev, {
            stepTitle: currentStep?.title || '',
            choiceText,
            risk,
            cost,
            feedback,
            timeRemaining: timeLeft,
            isTimeout
        }]);

        // Scoring Logic
        let penalty = 0;
        if (risk === 'HIGH') penalty = 20;
        if (risk === 'MEDIUM') penalty = 10;
        if (isTimeout) penalty += 25;

        setScore(prev => Math.max(0, prev - penalty));
        setTotalCost(prev => prev + cost);
        setReputation(prev => prev + reputationImpact);
        setCurrentStepId(nextStepId);
    };

    const resetGame = () => {
        setSelectedScenario(null);
        setCurrentStepId(null);
        setHistory([]);
        setDecisions([]);
        setShowAAR(false);
    };

    const getGrade = (finalScore: number) => {
        if (finalScore >= 90) return { letter: 'S', color: 'text-yellow-400', title: 'LEGENDARY' };
        if (finalScore >= 75) return { letter: 'A', color: 'text-emerald-400', title: 'EXEMPLARY' };
        if (finalScore >= 50) return { letter: 'B', color: 'text-blue-400', title: 'COMPETENT' };
        if (finalScore >= 30) return { letter: 'C', color: 'text-orange-400', title: 'SUBOPTIMAL' };
        return { letter: 'F', color: 'text-red-600', title: 'CATASTROPHIC FAILURE' };
    };

    const getDifficultyColor = (d: string) => {
        if (d === 'LETHAL') return 'border-red-500 text-red-500';
        if (d === 'HARD') return 'border-orange-500 text-orange-500';
        if (d === 'MEDIUM') return 'border-yellow-500 text-yellow-500';
        return 'border-emerald-500 text-emerald-500';
    };

    const getCategoryColor = (c?: string) => {
        if (c === 'TECHNICAL') return 'bg-blue-500/10 text-blue-400';
        if (c === 'GOVERNANCE') return 'bg-purple-500/10 text-purple-400';
        return 'bg-amber-500/10 text-amber-400';
    };

    // ─── Scenario Selection Screen ───
    if (!selectedScenario) {
        return (
            <div className="space-y-6 max-w-[1200px] mx-auto p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Terminal className="h-8 w-8 text-primary" />
                        War Games & Simulations
                    </h1>
                    <p className="text-muted-foreground">Select a tabletop scenario to test your incident response reflexes. <span className="text-primary font-mono">{Object.keys(SCENARIOS).length} scenarios available.</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* AI Red Team Mode */}
                    <Link href="/wargames/ai">
                        <Card className="h-full border-2 border-red-500/30 hover:border-red-500/60 hover:bg-red-500/5 transition-all cursor-pointer flex flex-col items-center justify-center p-6 space-y-4 group text-center bg-gradient-to-br from-red-950/20 to-transparent">
                            <div className="p-4 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors relative">
                                <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping opacity-30" />
                                <Skull className="h-8 w-8 text-red-500" />
                            </div>
                            <div>
                                <Badge variant="destructive" className="mb-2">AI-Powered</Badge>
                                <h3 className="font-bold text-lg group-hover:text-red-500 transition-colors">AI Red Team Mode</h3>
                                <p className="text-sm text-muted-foreground mt-2">Dynamic adversary simulation. The AI adapts to your defenses in real-time.</p>
                            </div>
                        </Card>
                    </Link>

                    {/* Custom Scenario Builder */}
                    <Link href="/wargames/builder">
                        <Card className="h-full border-dashed border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-6 space-y-4 group text-center">
                            <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Plus className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Create Custom Scenario</h3>
                                <p className="text-sm text-muted-foreground mt-2">Design your own tabletop exercises using the visual editor.</p>
                            </div>
                        </Card>
                    </Link>

                    {/* Scenario Cards */}
                    {Object.values(SCENARIOS).map((scenario) => (
                        <Card key={scenario.id} className="group hover:border-primary/50 transition-all cursor-pointer bg-card/50 backdrop-blur-sm border-primary/10">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className={getDifficultyColor(scenario.difficulty)}>
                                            {scenario.difficulty}
                                        </Badge>
                                        {scenario.category && (
                                            <Badge className={getCategoryColor(scenario.category)}>
                                                {scenario.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <ShieldAlert className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <CardTitle>{scenario.title}</CardTitle>
                                <CardDescription>{scenario.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Metadata row */}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {scenario.estimatedDuration && (
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ~{scenario.estimatedDuration} min</span>
                                    )}
                                    <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {Object.keys(scenario.steps).length} steps</span>
                                </div>
                                {scenario.realWorldReference && (
                                    <div className="text-xs text-muted-foreground/60 italic">{scenario.realWorldReference}</div>
                                )}
                                {/* MITRE tags */}
                                {scenario.mitreTactics && scenario.mitreTactics.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {scenario.mitreTactics.slice(0, 3).map(t => (
                                            <Badge key={t} variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/5">
                                                {t}
                                            </Badge>
                                        ))}
                                        {scenario.mitreTactics.length > 3 && (
                                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/5">
                                                +{scenario.mitreTactics.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                                <Button className="w-full" onClick={() => startScenario(scenario)}>
                                    Initialize Simulation
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const grade = currentStep?.isEnding ? getGrade(score) : null;

    // ─── After-Action Report ───
    if (showAAR && currentStep?.isEnding && grade) {
        const highRiskCount = decisions.filter(d => d.risk === 'HIGH').length;
        const timeoutCount = decisions.filter(d => d.isTimeout).length;
        const avgTimeRemaining = decisions.length > 0 ? Math.round(decisions.reduce((sum, d) => sum + d.timeRemaining, 0) / decisions.length) : 0;

        return (
            <div className="max-w-[1000px] mx-auto p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold font-mono flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        After-Action Report
                    </h1>
                    <Button variant="ghost" onClick={resetGame}>
                        <RotateCcw className="h.4 w-4 mr-2" /> New Exercise
                    </Button>
                </div>

                {/* Header Summary */}
                <Card className="border-primary/20 bg-black/40">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold">{selectedScenario.title}</h2>
                                <p className="text-sm text-muted-foreground">{selectedScenario.realWorldReference || `Difficulty: ${selectedScenario.difficulty}`}</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-5xl font-black ${grade.color}`}>{grade.letter}</div>
                                <div className={`text-sm font-bold ${grade.color}`}>{grade.title}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-primary/10">
                            <div className="text-center">
                                <div className="text-muted-foreground text-xs uppercase">Score</div>
                                <div className="text-xl font-bold">{score}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-muted-foreground text-xs uppercase">Total Cost</div>
                                <div className="text-xl font-bold text-red-400">${totalCost.toLocaleString()}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-muted-foreground text-xs uppercase">Decisions</div>
                                <div className="text-xl font-bold">{decisions.length}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-muted-foreground text-xs uppercase">Avg Response</div>
                                <div className="text-xl font-bold">{30 - avgTimeRemaining}s</div>
                            </div>
                            <div className="text-center">
                                <div className="text-muted-foreground text-xs uppercase">Reputation</div>
                                <div className={`text-xl font-bold ${reputation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {reputation >= 0 ? '+' : ''}{reputation}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* MITRE ATT&CK Mapping */}
                {selectedScenario.mitreTactics && selectedScenario.mitreTactics.length > 0 && (
                    <Card className="border-primary/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-mono uppercase text-muted-foreground flex items-center gap-2">
                                <Shield className="h-4 w-4" /> MITRE ATT&CK Techniques Encountered
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {selectedScenario.mitreTactics.map(t => (
                                    <Badge key={t} variant="outline" className="px-3 py-1.5 bg-primary/5 border-primary/20">
                                        <span className="font-mono text-primary mr-2">{t}</span>
                                        <span className="text-muted-foreground">{MITRE_TACTICS[t] || 'Unknown'}</span>
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Decision Timeline */}
                <Card className="border-primary/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Decision Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {decisions.map((d, i) => (
                            <div key={i} className={`p-4 rounded-lg border ${d.risk === 'LOW' ? 'border-emerald-500/20 bg-emerald-500/5' : d.risk === 'MEDIUM' ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-red-500/20 bg-red-500/5'} ${d.isTimeout ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="mt-0.5">
                                            {d.risk === 'LOW' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> :
                                                d.risk === 'MEDIUM' ? <AlertCircle className="h-5 w-5 text-yellow-500" /> :
                                                    <XCircle className="h-5 w-5 text-red-500" />}
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">Step {i + 1}: {d.stepTitle}</div>
                                            <div className="font-semibold">{d.isTimeout ? `⚠ TIMEOUT: ${d.choiceText}` : d.choiceText}</div>
                                            <div className="text-sm text-muted-foreground mt-1 italic">"{d.feedback}"</div>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs font-mono space-y-1 shrink-0">
                                        <div className={d.risk === 'HIGH' ? 'text-red-400' : d.risk === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'}>
                                            {d.risk}
                                        </div>
                                        {d.cost > 0 && <div className="text-red-400">${d.cost.toLocaleString()}</div>}
                                        <div className="text-muted-foreground">{d.timeRemaining}s left</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Performance Breakdown */}
                <Card className="border-primary/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-mono uppercase text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" /> Performance Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded-lg bg-secondary/10 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{decisions.filter(d => d.risk === 'LOW').length}</div>
                                <div className="text-xs text-muted-foreground">Low-Risk Decisions</div>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary/10 text-center">
                                <div className="text-2xl font-bold text-yellow-400">{decisions.filter(d => d.risk === 'MEDIUM').length}</div>
                                <div className="text-xs text-muted-foreground">Medium-Risk Decisions</div>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary/10 text-center">
                                <div className="text-2xl font-bold text-red-400">{highRiskCount}</div>
                                <div className="text-xs text-muted-foreground">High-Risk Decisions</div>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary/10 text-center">
                                <div className="text-2xl font-bold text-red-600">{timeoutCount}</div>
                                <div className="text-xs text-muted-foreground">Timeouts</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Outcome */}
                <Card className="border-primary/20 bg-black/30">
                    <CardContent className="p-6 text-center space-y-4">
                        <p className="text-muted-foreground italic text-lg">"{currentStep.description}"</p>
                        <div className="flex justify-center gap-4">
                            <Button onClick={resetGame} size="lg">
                                <RotateCcw className="mr-2 h-4 w-4" /> New Exercise
                            </Button>
                            <Button variant="outline" size="lg" onClick={() => startScenario(selectedScenario)}>
                                Replay This Scenario
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── Active Game Screen ───
    return (
        <div className="h-[calc(100vh-100px)] p-6 flex flex-col max-w-[1200px] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={resetGame}>
                        <ArrowRight className="h-4 w-4 rotate-180 mr-2" /> Content Library
                    </Button>
                    <h2 className="text-xl font-bold font-mono text-primary flex items-center gap-2">
                        <span className="animate-pulse">●</span> {selectedScenario.title}
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    {!currentStep?.isEnding && (
                        <div className={`font-mono text-lg flex items-center gap-2 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}>
                            <Timer className="h-5 w-5" />
                            {timeLeft}s
                        </div>
                    )}
                    <Badge variant="secondary" className="font-mono text-lg px-4 py-1">Score: {score}</Badge>
                    {totalCost > 0 && (
                        <Badge variant="outline" className="font-mono text-sm px-3 py-1 text-red-400 border-red-500/20">
                            <DollarSign className="h-3 w-3 mr-1" />{totalCost.toLocaleString()}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Main Console */}
                <Card className="lg:col-span-2 flex flex-col border-primary/20 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                    <CardHeader className="border-b border-primary/10 bg-black/20">
                        <CardTitle className="font-mono text-lg text-primary tracking-wider flex justify-between items-center">
                            <span>{currentStep?.isEnding ? "/// SIMULATION ENDED" : "/// INCOMING TRANSMISSION"}</span>
                            {isTyping && <span className="animate-pulse">_</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto relative z-10">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-foreground">{currentStep?.title}</h3>
                            <p className="text-lg text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap break-words max-w-prose">
                                {displayedText}
                            </p>
                        </div>

                        {currentStep?.isEnding && grade ? (
                            <div className="mt-8 p-8 bg-black/50 border border-primary/20 rounded-xl text-center space-y-6 animate-in zoom-in-95 duration-500">
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground uppercase tracking-widest">Mission Rating</div>
                                    <div className={`text-6xl font-black ${grade.color} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                        {grade.letter}
                                    </div>
                                    <div className={`text-xl font-bold ${grade.color}`}>{grade.title}</div>
                                </div>
                                <div className="pt-4 border-t border-primary/10">
                                    <div className="grid grid-cols-3 gap-4 text-center max-w-md mx-auto mb-6">
                                        <div>
                                            <div className="text-muted-foreground text-xs uppercase">Score</div>
                                            <div className="text-2xl font-bold">{score}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground text-xs uppercase">Cost</div>
                                            <div className="text-2xl font-bold text-red-400">${totalCost.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground text-xs uppercase">Decisions</div>
                                            <div className="text-2xl font-bold">{decisions.length}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                        <Button onClick={() => setShowAAR(true)} size="lg" className="flex-1 max-w-[200px]">
                                            <FileText className="mr-2 h-4 w-4" /> View AAR
                                        </Button>
                                        <Button variant="outline" onClick={resetGame} size="lg" className="flex-1 max-w-[200px]">
                                            <RotateCcw className="mr-2 h-4 w-4" /> New Exercise
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 mt-auto">
                                {currentStep?.choices.map(choice => (
                                    <button
                                        key={choice.id}
                                        onClick={() => handleChoice(choice.nextStepId, choice.text, choice.cost, choice.risk, choice.feedback || '', false, choice.reputationImpact || 0)}
                                        disabled={isTyping || timeLeft === 0}
                                        className="text-left p-4 rounded-lg bg-secondary/10 border border-primary/10 hover:bg-primary/10 hover:border-primary/50 transition-all group flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div>
                                            <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                                <span className="text-primary/50 group-hover:text-primary">{'>'}</span> {choice.text}
                                            </div>
                                            {choice.description && (
                                                <div className="text-sm text-muted-foreground mt-1 pl-4">{choice.description}</div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs font-mono opacity-50 group-hover:opacity-100">
                                            <span className={choice.risk === 'HIGH' ? 'text-red-400' : choice.risk === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'}>RISK: {choice.risk}</span>
                                            <span>COST: ${choice.cost.toLocaleString()}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    {/* Background Grid Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_2px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_2px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />
                </Card>

                {/* Side Panel (Log) */}
                <Card className="hidden lg:flex flex-col border-primary/10 bg-card/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-mono text-muted-foreground uppercase flex items-center gap-2">
                            Tactical Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto font-mono text-xs space-y-2 p-4">
                        <div className="text-primary/50">System Initialized...</div>
                        <div className="text-primary/50 text-[10px]">
                            Scenario: {selectedScenario.title} [{selectedScenario.difficulty}]
                        </div>
                        {history.map((entry, i) => (
                            <div key={i} className={`border-l-2 pl-2 py-1 ${entry.includes('!!!') ? 'border-red-500 text-red-400' : 'border-primary/20 text-foreground/80'}`}>
                                {entry}
                            </div>
                        ))}
                        {totalCost > 0 && (
                            <div className="border-l-2 border-red-500/30 pl-2 py-1 text-red-400/60">
                                Running cost: ${totalCost.toLocaleString()}
                            </div>
                        )}
                        {!currentStep?.isEnding && (
                            <div className="animate-pulse text-primary">Awaiting Input_</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
