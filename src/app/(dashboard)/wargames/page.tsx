"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SCENARIOS, Scenario, GameStep } from "@/lib/wargames-data";
import { Terminal, ShieldAlert, Award, AlertTriangle, ArrowRight, RotateCcw, Timer, Skull, Plus } from 'lucide-react';
import Link from "next/link";

export default function WarGamesPage() {
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [currentStepId, setCurrentStepId] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [score, setScore] = useState(100);
    const [timeLeft, setTimeLeft] = useState(30);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

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
            handleChoice(currentStep.choices[0].nextStepId, "PANICKED INACTION (TIMEOUT)", 0, 'HIGH', true);
        }
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
        }, 30); // Speed of typing

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
        setScore(100);
        setTimeLeft(30);
    };

    const handleChoice = (nextStepId: string, choiceText: string, cost: number, risk: string, isTimeout = false) => {
        setHistory(prev => [...prev, isTimeout ? `> !!! ${choiceText} !!!` : `> ${choiceText}`]);

        // Scoring Logic
        let penalty = 0;
        if (risk === 'HIGH') penalty = 20;
        if (risk === 'MEDIUM') penalty = 10;
        if (isTimeout) penalty += 25; // Extra penalty for timeout

        setScore(prev => Math.max(0, prev - penalty));
        setCurrentStepId(nextStepId);
    };

    const resetGame = () => {
        setSelectedScenario(null);
        setCurrentStepId(null);
        setHistory([]);
    };

    const getGrade = (finalScore: number) => {
        if (finalScore >= 90) return { letter: 'S', color: 'text-yellow-400', title: 'LEGENDARY' };
        if (finalScore >= 75) return { letter: 'A', color: 'text-emerald-400', title: 'EXEMPLARY' };
        if (finalScore >= 50) return { letter: 'B', color: 'text-blue-400', title: 'COMPETENT' };
        if (finalScore >= 30) return { letter: 'C', color: 'text-orange-400', title: 'SUBOPTIMAL' };
        return { letter: 'F', color: 'text-red-600', title: 'CATASTROPHIC FAILURE' };
    };

    if (!selectedScenario) {
        return (
            <div className="space-y-6 max-w-[1200px] mx-auto p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Terminal className="h-8 w-8 text-primary" />
                        War Games & Simulations
                    </h1>
                    <p className="text-muted-foreground">Select a tabletop scenario to test your incident response reflexes.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    {Object.values(SCENARIOS).map((scenario) => (
                        <Card key={scenario.id} className="group hover:border-primary/50 transition-all cursor-pointer bg-card/50 backdrop-blur-sm border-primary/10">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className={`
                                        ${scenario.difficulty === 'LETHAL' ? 'border-red-500 text-red-500' :
                                            scenario.difficulty === 'HARD' ? 'border-orange-500 text-orange-500' :
                                                'border-emerald-500 text-emerald-500'}
                                    `}>
                                        {scenario.difficulty}
                                    </Badge>
                                    <ShieldAlert className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <CardTitle>{scenario.title}</CardTitle>
                                <CardDescription>{scenario.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                    <div className="grid grid-cols-2 gap-4 text-center max-w-xs mx-auto mb-6">
                                        <div>
                                            <div className="text-muted-foreground text-xs uppercase">Final Score</div>
                                            <div className="text-2xl font-bold">{score}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground text-xs uppercase">Difficulty</div>
                                            <div className="text-2xl font-bold text-muted-foreground">{selectedScenario.difficulty}</div>
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground italic mb-6">"{currentStep.description}"</p>
                                    <Button onClick={resetGame} size="lg" className="w-full max-w-sm mx-auto">
                                        <RotateCcw className="mr-2 h-4 w-4" /> Restart Simulation
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 mt-auto">
                                {currentStep?.choices.map(choice => (
                                    <button
                                        key={choice.id}
                                        onClick={() => handleChoice(choice.nextStepId, choice.text, choice.cost, choice.risk)}
                                        disabled={isTyping || timeLeft === 0}
                                        className="text-left p-4 rounded-lg bg-secondary/10 border border-primary/10 hover:bg-primary/10 hover:border-primary/50 transition-all group flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div>
                                            <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                                <span className="text-primary/50 group-hover:text-primary">{'>'}</span> {choice.text}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1 pl-4">{choice.description}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs font-mono opacity-50 group-hover:opacity-100">
                                            <span className={choice.risk === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}>RISK: {choice.risk}</span>
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
                        {history.map((entry, i) => (
                            <div key={i} className={`border-l-2 pl-2 py-1 ${entry.includes('!!!') ? 'border-red-500 text-red-400' : 'border-primary/20 text-foreground/80'}`}>
                                {entry}
                            </div>
                        ))}
                        {!currentStep?.isEnding && (
                            <div className="animate-pulse text-primary">Awaiting Input_</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
