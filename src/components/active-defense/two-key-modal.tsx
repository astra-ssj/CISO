"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Fingerprint, Lock, ShieldAlert, Scan, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TwoKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    actionName: string;
}

export function TwoKeyModal({ isOpen, onClose, onConfirm, actionName }: TwoKeyModalProps) {
    const [holdProgress, setHoldProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'ARMING' | 'AUTHORIZED'>('IDLE');

    // Reset state when modal opens (defer to avoid synchronous setState in effect)
    useEffect(() => {
        if (!isOpen) return;
        const id = setTimeout(() => {
            setHoldProgress(0);
            setIsComplete(false);
            setStatus('IDLE');
        }, 0);
        return () => clearTimeout(id);
    }, [isOpen]);

    const startHold = () => {
        if (isComplete) return;
        setStatus('ARMING');
        holdIntervalRef.current = setInterval(() => {
            setHoldProgress(prev => {
                if (prev >= 100) {
                    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
                    handleComplete();
                    return 100;
                }
                return prev + 2; // Fills in ~50 ticks (approx 1-1.5s depending on interval speed)
            });
        }, 20);
    };

    const stopHold = () => {
        if (isComplete) return;
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setHoldProgress(0);
        setStatus('IDLE');
    };

    const handleComplete = () => {
        setIsComplete(true);
        setStatus('AUTHORIZED');
        setTimeout(() => {
            onConfirm();
        }, 1000); // 1s delay to show success state before closing/executing
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-red-900/50 p-0 overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                {/* Header / Security Banner */}
                <div className="bg-red-900/20 p-4 border-b border-red-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-500 font-mono text-xs tracking-widest uppercase">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Critical Authorization Required</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-red-500/30" />
                    </div>
                </div>

                <div className="p-8 flex flex-col items-center text-center space-y-6 relative">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

                    {/* Icon / Biometric Visual */}
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {status === 'AUTHORIZED' ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                >
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </motion.div>
                            ) : (
                                <div className="relative">
                                    {status === 'ARMING' && (
                                        <motion.div
                                            className="absolute inset-0 rounded-full border-2 border-red-500"
                                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                        />
                                    )}
                                    <div className={cn(
                                        "p-4 rounded-full border transition-colors duration-500 relative overflow-hidden",
                                        status === 'ARMING' ? "bg-red-500/10 border-red-500 text-red-500" : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                    )}>
                                        {/* Progress Circular Fill (Optional simulation) */}
                                        <Fingerprint className="w-12 h-12 relative z-10" />
                                        {status === 'ARMING' && (
                                            <Scan className="w-12 h-12 absolute inset-0 m-auto text-red-400 opacity-50 animate-ping" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-2 z-10">
                        <h2 className="text-xl font-bold tracking-tight text-foreground">
                            {status === 'AUTHORIZED' ? "Access Granted" : "Authenticate Action"}
                        </h2>
                        <p className="text-sm text-muted-foreground font-mono">
                            Requesting execution of: <span className="text-red-400 font-bold">{actionName}</span>
                        </p>
                    </div>

                    {/* Hold Button */}
                    <div className="w-full max-w-[240px] relative z-10">
                        {status === 'AUTHORIZED' ? (
                            <div className="h-12 flex items-center justify-center text-emerald-500 text-sm font-bold tracking-widest uppercase animate-pulse">
                                Executing Sequence...
                            </div>
                        ) : (
                            <button
                                className={cn(
                                    "w-full h-12 rounded border font-mono text-xs font-bold tracking-wider uppercase transition-all relative overflow-hidden group select-none outline-none",
                                    "bg-zinc-900 border-red-900/50 text-red-500 hover:border-red-500 hover:text-red-400 active:scale-95"
                                )}
                                onMouseDown={startHold}
                                onMouseUp={stopHold}
                                onMouseLeave={stopHold}
                                onTouchStart={startHold}
                                onTouchEnd={stopHold}
                            >
                                {/* Progress Bar Background */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-red-600/20 transition-all duration-75 ease-linear"
                                    style={{ width: `${holdProgress}%` }}
                                />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <Lock className="w-3 h-3" />
                                    Hold to Confirm
                                </span>
                            </button>
                        )}
                        <p className="text-[10px] text-zinc-600 mt-2 font-mono uppercase">
                            {holdProgress > 0 ? `Verifying Biometrics... ${holdProgress}%` : "Awaiting Authorization"}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-zinc-900/50 p-2 text-center text-[10px] text-zinc-600 font-mono uppercase border-t border-white/5">
                    Secure Enclave v4.0.2 // Active Defense Protocol
                </div>
            </DialogContent>
        </Dialog>
    );
}
