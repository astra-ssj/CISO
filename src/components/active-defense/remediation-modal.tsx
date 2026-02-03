"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ShieldCheck, Fingerprint, Lock, CheckCircle2, AlertTriangle, X, PlayCircle, BarChart3, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TwoKeyModal } from './two-key-modal';

interface RemediationModalProps {
    isOpen: boolean;
    onClose: () => void;
    threatId: string;
    threatTitle?: string;
}

type Step = 'scanning' | 'simulation' | 'supervisor' | 'proposal' | 'auth' | 'diagnostics' | 'executing' | 'complete';

const MOCK_LOGS = [
    "> Initializing Astra Defense Protocol v9.2...",
    "> Analyzing CVE-2024-9992 variance...",
    "> Target identified: AWS-US-EAST-1/checkout-api-Cluster",
    "> Calculating blast radius... [SAFE]",
    "> Awaiting simulation..."
];

const SIMULATION_LOGS = [
    "> Spawning sandbox environment (Container ID: sbx-992)...",
    "> Replicating traffic patterns (10% sample)...",
    "> Applying Hotfix-2931 in sandbox...",
    "> Monitoring latency impact... [+0.4ms]",
    "> Verifying regression suite... [PASS]",
    "> Simulation Score: 99.98% Confidence",
    "> Handing off to Supervisor Model..."
];

const SUPERVISOR_LOGS = [
    "> SUPERVISOR_AI: Auditing proposed patch vs NIST-800-53...",
    "> SUPERVISOR_AI: Analyzing code graph for backdoors...",
    "> SUPERVISOR_AI: Checking PII leakage probability...",
    "> SUPERVISOR_AI: Verifying signature integrity...",
    "> SUPERVISOR_AI: SAFETY_CHECK [PASSED] (Score: 100/100)"
];

const DIAGNOSTIC_LOGS = [
    "> PRE-FLIGHT: Pinging Ansible Tower (v3.4.1)... [OK]",
    "> PRE-FLIGHT: Verifying JIRA API Access... [OK]",
    "> PRE-FLIGHT: Checking Intune Compliance Policy... [SYNCED]",
    "> PRE-FLIGHT: All Systems Green."
];

const CANARY_LOGS = [
    "> CANARY: Deploying to Node-US-EAST-1a (1% Traffic)...",
    "> CANARY: Monitoring Error Rate (10s)... [0%]",
    "> CANARY: Health Check Passed. PROCEEDING TO ROLLOUT."
];

const EXECUTION_LOGS = [
    "> Auth verified: CISO_OVERRIDE_SIG",
    "> Orchestrating remediation via Ansible Tower...",
    "> Invoking Playbook: PB-SEC-2931-HOTFIX...",
    "> Waiting for Ansible Agent (Node-492)... [ACK]",
    "> Ansible: Service Restarted...",
    "> Validating Health Check... [OK]",
    "> JIRA-BOT: Ticket SEC-2911 updated to 'Resolved'",
    "> Defense Matrix: Threat Neutralized."
];

export function RemediationModal({ isOpen, onClose, threatId, threatTitle = "Critical Vulnerability" }: RemediationModalProps) {
    const [step, setStep] = useState<Step>('scanning');
    const [isCanary, setIsCanary] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [showDetails, setShowDetails] = useState(false);
    const [isTwoKeyOpen, setIsTwoKeyOpen] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('scanning');
            setLogs([]);
            setShowDetails(false); // Reset to summary view
            runScan();
        }
    }, [isOpen]);

    // Auto-scroll logs
    useEffect(() => {
        if (showDetails) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, showDetails]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };

    const runScan = async () => {
        // ... (Mock scan logic)
        for (const log of MOCK_LOGS) {
            await new Promise(r => setTimeout(r, 600));
            addLog(log);
        }
        setStep('simulation');
    };

    // ... (Keep other run functions same, just ensuring they exist)

    const runSimulation = async () => {
        for (const log of SIMULATION_LOGS) {
            await new Promise(r => setTimeout(r, 600));
            addLog(log);
        }
        setStep('supervisor');
        runSupervisor();
    };

    const runSupervisor = async () => {
        for (const log of SUPERVISOR_LOGS) {
            await new Promise(r => setTimeout(r, 600));
            addLog(log);
        }
        setStep('proposal');
    }

    const runExecution = async () => {
        setStep('diagnostics');
        for (const log of DIAGNOSTIC_LOGS) {
            await new Promise(r => setTimeout(r, 500));
            addLog(log);
        }

        if (isCanary) {
            for (const log of CANARY_LOGS) {
                await new Promise(r => setTimeout(r, 800));
                addLog(log);
            }
        }

        setStep('executing');
        for (const log of EXECUTION_LOGS) {
            await new Promise(r => setTimeout(r, 800));
            addLog(log);
        }
        setStep('complete');
    };

    if (!isOpen) return null;

    // SUMMARY VIEW (Default)
    if (!showDetails) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden font-sans"
                >
                    <div className="p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">{threatTitle}</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            Critical vulnerability detected in <strong>{threatId}</strong>.
                            AI Engine recommends immediate patch application.
                        </p>

                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={() => setShowDetails(true)}
                                className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <PlayCircle className="w-4 h-4" />
                                Review & Remediate
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-transparent hover:bg-zinc-900 text-zinc-400 font-medium rounded-lg transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-black border border-zinc-800 rounded-xl shadow-2xl overflow-hidden font-mono"
            >
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-zinc-400">ASTRA_ACTIVE_DEFENSE_TERM</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                {/* Content Area */}
                <div className="p-6 min-h-[500px] flex flex-col relative">

                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                    {/* Threat Info Header */}
                    <div className="flex items-start gap-4 mb-6 z-10">
                        <div className="w-10 h-10 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white">{threatTitle}</div>
                            <div className="text-xs text-zinc-500">{threatId} • CLUSTER_A • HIGH_PRIORITY</div>
                        </div>
                    </div>

                    {/* Dynamic Viewport */}
                    <div className="flex-1 bg-zinc-950/50 rounded-lg border border-zinc-900 p-4 mb-6 font-mono text-xs overflow-y-auto max-h-[220px] shadow-inner">
                        {logs.map((log, i) => (
                            <div key={i} className={cn("mb-1", log.includes("SUPERVISOR") ? "text-amber-400/90 font-bold" : "text-emerald-500/80")}>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                        {(step === 'executing' || step === 'simulation' || step === 'supervisor') && <div className="animate-pulse text-emerald-500">_</div>}
                    </div>

                    {/* Action Area */}
                    <div className="h-20 z-10 flex items-center justify-center">
                        {(step === 'scanning' || step === 'supervisor') && (
                            <div className="flex items-center gap-2 text-zinc-500 animate-pulse">
                                <Bot className="w-5 h-5" />
                                <span className="text-sm">
                                    {step === 'supervisor' ? "Supervisor AI Auditing Patch..." : "Evaluating Mitigation Strategies..."}
                                </span>
                            </div>
                        )}

                        {step === 'simulation' && (
                            <div className="flex items-center gap-4 w-full animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex-1 p-3 bg-zinc-900/50 border border-zinc-800 rounded flex flex-col justify-center">
                                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Safety Check</div>
                                    <div className="text-white text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                        Pending Sandbox Verification
                                    </div>
                                </div>
                                <button
                                    onClick={runSimulation}
                                    className="px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded flex items-center gap-2 transition-colors border border-transparent hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                >
                                    <PlayCircle className="w-4 h-4" />
                                    RUN DRY-RUN
                                </button>
                            </div>
                        )}

                        {step === 'proposal' && (
                            <div className="flex items-center gap-4 w-full animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex-1 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] text-emerald-500 uppercase mb-1">Constitutional Check</div>
                                        <div className="text-white text-sm font-bold flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            Supervisor Approved (100%)
                                        </div>
                                    </div>
                                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => { setIsCanary(true); setStep('auth'); }}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded flex items-center gap-2 transition-colors border border-zinc-700"
                                    >
                                        <Bot className="w-3 h-3" />
                                        DEPLOY CANARY (1%)
                                    </button>
                                    <button
                                        onClick={() => { setIsCanary(false); setStep('auth'); }}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center gap-2 transition-colors"
                                    >
                                        <Lock className="w-4 h-4" />
                                        APPROVE FIX
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'auth' && (
                            <div className="flex flex-col items-center gap-3 w-full animate-in fade-in zoom-in duration-300">
                                <div className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                                    Biometric Authorization Required
                                </div>
                                <button
                                    onClick={() => setIsTwoKeyOpen(true)}
                                    className="w-full max-w-xs h-12 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded flex items-center justify-center gap-3 transition-all group shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                                >
                                    <Fingerprint className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <span className="font-mono font-bold">INITIATE SEQUENCE</span>
                                </button>
                            </div>
                        )}

                        {step === 'executing' && (
                            <div className="w-full flex items-center justify-center gap-8 animate-in fade-in duration-500">
                                {/* Orchestration Hub Visualization */}
                                <div className="relative flex items-center gap-8">
                                    {/* Astra Core */}
                                    <div className="relative z-10 w-16 h-16 bg-emerald-950 border border-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                                        <Bot className="w-8 h-8 text-emerald-500" />
                                    </div>

                                    {/* Connectors */}
                                    <div className="flex gap-4">
                                        {[
                                            { name: 'Ansible', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30' },
                                            { name: 'JIRA', color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/30' },
                                            { name: 'Intune', color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30' }
                                        ].map((tool, i) => (
                                            <div key={tool.name} className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded border transition-all duration-500",
                                                logs.length > i + 1 ? "opacity-100 scale-100" : "opacity-30 scale-90",
                                                tool.bg, tool.border
                                            )}>
                                                <div className={cn("w-2 h-2 rounded-full animate-pulse", tool.color.replace('text', 'bg'))} />
                                                <span className={cn("text-xs font-bold", tool.color)}>{tool.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Connection Lines (Simulated) */}
                                    <svg className="absolute top-1/2 left-16 w-full h-1 overflow-visible -z-0">
                                        <line x1="0" y1="0" x2="100%" y2="0" stroke="currentColor" className="text-zinc-700" strokeWidth="2" strokeDasharray="4 4" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {step === 'complete' && (
                            <div className="flex flex-col items-center gap-2 text-emerald-500">
                                <CheckCircle2 className="w-8 h-8" />
                                <span className="font-bold text-lg">Threat Neutralized</span>
                            </div>
                        )}
                    </div>

                </div>
            </motion.div>

            <TwoKeyModal
                isOpen={isTwoKeyOpen}
                onClose={() => setIsTwoKeyOpen(false)}
                onConfirm={() => {
                    setIsTwoKeyOpen(false);
                    runExecution();
                }}
                actionName={isCanary ? "DEPLOY_CANARY_PATCH" : "EXECUTE_HOTFIX_2931"}
            />
        </div>
    );
}
