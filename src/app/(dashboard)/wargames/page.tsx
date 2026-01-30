"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SCENARIOS, Scenario, ScenarioType, GameStep } from "@/lib/wargames-data";
import { Terminal, ShieldAlert, Award, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';

export default function WarGamesPage() {
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [currentStepId, setCurrentStepId] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]); // Track choices made
    const [score, setScore] = useState(100);

    const currentStep: GameStep | undefined = selectedScenario && currentStepId ? selectedScenario.steps[currentStepId] : undefined;

    const startScenario = (scenario: Scenario) => {
        setSelectedScenario(scenario);
        setCurrentStepId(scenario.initialStepId);
        setHistory([]);
        setScore(100);
    };

    const handleChoice = (nextStepId: string, choiceText: string, cost: number, risk: string) => {
        setHistory(prev => [...prev, `> ${choiceText}`]);
        setCurrentStepId(nextStepId);

        // Simple scoring logic demonstration
        let penalty = 0;
        if (risk === 'HIGH') penalty = 20;
        if (risk === 'MEDIUM') penalty = 10;
        setScore(prev => Math.max(0, prev - penalty));
    };

    const resetGame = () => {
        setSelectedScenario(null);
        setCurrentStepId(null);
        setHistory([]);
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
                    <Badge variant="secondary" className="font-mono text-lg px-4 py-1">Score: {score}</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Main Console */}
                <Card className="lg:col-span-2 flex flex-col border-primary/20 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-primary/10 bg-black/20">
                        <CardTitle className="font-mono text-lg text-primary tracking-wider">
                            {currentStep?.isEnding ? "/// SIMULATION ENDED" : "/// INCOMING TRANSMISSION"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-foreground">{currentStep?.title}</h3>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {currentStep?.description}
                            </p>
                        </div>

                        {currentStep?.isEnding ? (
                            <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-xl text-center space-y-4">
                                <Award className="h-12 w-12 text-primary mx-auto" />
                                <div className="text-xl font-bold">Performance Breakdown</div>
                                <p className="text-muted-foreground">Scoring Algorithm Pending Implementation.</p>
                                <Button onClick={resetGame} size="lg" className="w-full max-w-sm mx-auto">
                                    <RotateCcw className="mr-2 h-4 w-4" /> Restart Simulation
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4 mt-auto">
                                {currentStep?.choices.map(choice => (
                                    <button
                                        key={choice.id}
                                        onClick={() => handleChoice(choice.nextStepId, choice.text, choice.cost, choice.risk)}
                                        className="text-left p-4 rounded-lg bg-secondary/10 border border-primary/10 hover:bg-primary/10 hover:border-primary/50 transition-all group flex justify-between items-center"
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
                </Card>

                {/* Side Panel (Log) */}
                <Card className="hidden lg:flex flex-col border-primary/10 bg-card/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Tactical Log</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto font-mono text-xs space-y-2 p-4">
                        <div className="text-primary/50">System Initialized...</div>
                        {history.map((entry, i) => (
                            <div key={i} className="text-foreground/80 border-l-2 border-primary/20 pl-2 py-1">
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
