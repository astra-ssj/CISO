"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
    targetId?: string; // ID of the element to highlight (optional for modal steps)
    title: string;
    description: string;
    position?: 'center' | 'bottom-right' | 'top-right';
}

const TOUR_STEPS: TourStep[] = [
    {
        title: "Welcome to Astra",
        description: "Your AI-powered CISO Command Center. This platform unifies Policy Governance, Risk Management, and Incident Response.",
        position: 'center'
    },
    {
        title: "Command Center",
        description: "View real-time KPIs, active threats, and pending decisions requiring your attention immediately upon login.",
        position: 'center'
    },
    {
        title: "Protocol Initiation",
        description: "Use the 'Initiate Protocol' button to trigger emergency workflows or request deep scans.",
        position: 'center'
    },
    {
        title: "New! Interactive Playbooks",
        description: "Navigate to the 'Incidents' tab to access the new War Room for managing active crises.",
        position: 'center'
    }
];

export function ProductTour() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    useEffect(() => {
        // Check if tour has been seen
        const hasSeenTour = localStorage.getItem("astra_tour_completed");
        if (!hasSeenTour) {
            // Small delay to allow UI to load
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsOpen(false);
        localStorage.setItem("astra_tour_completed", "true");
    };

    if (!isOpen) return null;

    const step = TOUR_STEPS[currentStepIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-500">
            <Card className="w-[400px] border-primary/50 shadow-[0_0_50px_rgba(var(--primary),0.2)] animate-in zoom-in-95 duration-300">
                <CardHeader className="relative pb-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={handleComplete}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="text-xs font-mono text-primary uppercase tracking-wider mb-1">
                        Onboarding Sequence {currentStepIndex + 1}/{TOUR_STEPS.length}
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                    </p>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                    <Button variant="ghost" size="sm" onClick={handleComplete} className="text-xs text-muted-foreground">
                        Skip Tour
                    </Button>
                    <Button onClick={handleNext} className="gap-2">
                        {currentStepIndex === TOUR_STEPS.length - 1 ? (
                            <>Complete <Check className="h-4 w-4" /></>
                        ) : (
                            <>Next <ChevronRight className="h-4 w-4" /></>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
