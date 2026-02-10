import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ComplianceStandard = 'ISO_27001' | 'NIST_CSF' | 'SOC2' | 'GDPR';

export interface DecisionRequest {
    id: string;
    title: string;
    description: string;
    requester: string;
    riskLevel: RiskLevel;
    status: 'PENDING' | 'APPROVED' | 'DENIED';
    timestamp: string;
    // Intelligence Engine Fields
    analysis?: {
        riskScore: number;
        flaggedKeywords: string[];
        complianceGaps: string[];
    };
    recommendedActions?: string[];
    generatedArtifacts?: {
        id: string;
        type: 'POLICY_DRAFT' | 'ARCHITECTURE_DIAGRAM' | 'VENDOR_ASSESSMENT';
        title: string;
        content: string; // Markdown or JSON representation
    }[];
}

import { AgentMessage, openClaw } from './openclaw-client';

export type ChatMessage = AgentMessage;

interface AstraState {
    // Global Posture
    systemStatus: 'NOMINAL' | 'DEGRADED' | 'UNDER_ATTACK';
    complianceScore: number;
    activeThreats: number;

    // Context
    activeStandards: ComplianceStandard[];
    decisionQueue: DecisionRequest[];
    chatHistory: ChatMessage[];

    // Actions
    addDecisionRequest: (request: Omit<DecisionRequest, 'id' | 'status'>) => void;
    resolveDecision: (id: string, outcome: 'APPROVED' | 'DENIED', reason: string) => void;
    updateDecisionAnalysis: (id: string, results: any) => void;
    triggerAnalysis: (id: string, request: DecisionRequest) => Promise<void>; // New Async Action
    updateComplianceScore: (score: number) => void;
    sendQuery: (query: string) => void;
    clearChat: () => void;
    // Auth
    // Auth & RBAC
    currentUser: {
        name: string;
        role: 'CISO' | 'ARCHITECT' | 'DEVOPS';
    } | null;
    isAuthenticated: boolean;
    login: (role?: 'CISO' | 'ARCHITECT' | 'DEVOPS') => void;
    logout: () => void;

    // UI State
    isChatOpen: boolean;
    setChatOpen: (isOpen: boolean) => void;

    // Signal Bus
    signals: Signal[];
    dispatchSignal: (type: string, payload: any) => void;
}

export interface Signal {
    id: string;
    type: string;
    payload: any;
    timestamp: number;
}

export const useAstraStore = create<AstraState>()(
    persist(
        (set, get) => ({
            systemStatus: 'NOMINAL',
            complianceScore: 85,
            activeThreats: 1,
            activeStandards: ['ISO_27001', 'NIST_CSF'],
            decisionQueue: [
                {
                    id: 'REQ-2024-001',
                    title: 'Open Port 22 for Vendor Access',
                    description: 'Vendor "FastFix IT" requires SSH access to the payment gateway for debugging.',
                    requester: 'DevOps Lead',
                    riskLevel: 'CRITICAL',
                    status: 'PENDING',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 'REQ-2024-002',
                    title: 'Deploy Unverified Container',
                    description: 'Urgent patch deployment using image from public Docker Hub (no signature).',
                    requester: 'SRE Team',
                    riskLevel: 'HIGH',
                    status: 'PENDING',
                    timestamp: new Date().toISOString()
                }
            ],
            chatHistory: [
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: 'I am Astra, your Virtual Assistant. I am monitoring governance, risk, and compliance active streams. How can I assist you?',
                    timestamp: Date.now()
                }
            ],

            addDecisionRequest: (request) => {
                const id = `REQ-${Date.now()}`;
                const newRequest: DecisionRequest = {
                    ...request,
                    id,
                    status: 'PENDING',
                    timestamp: new Date().toISOString()
                } as DecisionRequest;

                set((state) => ({
                    decisionQueue: [...state.decisionQueue, newRequest]
                }));

                // Trigger Async Analysis
                get().triggerAnalysis(id, newRequest as DecisionRequest);
            },

            resolveDecision: (id, outcome, reason) => set((state) => ({
                decisionQueue: state.decisionQueue.map(d =>
                    d.id === id ? { ...d, status: outcome } : d
                )
            })),

            updateDecisionAnalysis: (id, results) => set((state) => ({
                decisionQueue: state.decisionQueue.map(d =>
                    d.id === id ? {
                        ...d,
                        analysis: {
                            riskScore: results.riskScore,
                            flaggedKeywords: results.flaggedKeywords,
                            complianceGaps: results.complianceGaps
                        },
                        recommendedActions: results.recommendedActions,
                        generatedArtifacts: results.generatedArtifacts
                    } : d
                )
            })),

            triggerAnalysis: async (id, request) => {
                const { usePolicyStore } = await import('./policy-store');
                const policies = usePolicyStore.getState().policies;
                const state = get();

                try {
                    // Refactoring to BFF Pattern (R-03)
                    // Instead of running locally, we call the secure API endpoint
                    const response = await fetch('/api/agent/analyze', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            title: request.title,
                            description: request.description,
                            context: {
                                activeStandards: state.activeStandards,
                                policies: policies
                            }
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Analysis API failed: ${response.statusText}`);
                    }

                    const results = await response.json();

                    // Update State with Results from Server
                    get().updateDecisionAnalysis(id, results);

                } catch (error) {
                    console.error("Failed to trigger secure analysis:", error);
                    // Optionally handle error state in UI
                }
            },

            updateComplianceScore: (score) => set({ complianceScore: score }),

            // Integrated OpenClaw Logic
            sendQuery: async (query) => {
                const state = get();
                const userMsg: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: query,
                    timestamp: Date.now()
                };

                set(s => ({ chatHistory: [...s.chatHistory, userMsg] }));

                // Start handling the stream from OpenClaw
                const iterator = openClaw.sendMessage(query);

                let messageId: string | null = null;

                for await (const update of iterator) {
                    if (!messageId) {
                        messageId = update.id;
                        // Add the initial empty/thinking message
                        set(s => ({ chatHistory: [...s.chatHistory, update] }));
                    } else {
                        // Update the existing message in place
                        set(s => ({
                            chatHistory: s.chatHistory.map(msg =>
                                msg.id === messageId ? update : msg
                            )
                        }));
                    }
                }
            },

            clearChat: () => set({ chatHistory: [] }),

            currentUser: null,
            isAuthenticated: false,

            login: (role = 'CISO') => {
                // Set Secure Cookie for Middleware verification
                document.cookie = "astra-auth=true; path=/; max-age=86400; SameSite=Strict";
                set({
                    isAuthenticated: true,
                    currentUser: {
                        name: role === 'CISO' ? 'Chief Information Security Officer' : 'Security Architect',
                        role: role
                    }
                });
            },

            logout: () => {
                document.cookie = "astra-auth=; path=/; max-age=0";
                set({ isAuthenticated: false, currentUser: null });
            },

            isChatOpen: false,
            setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

            // Signal Bus Implementation
            signals: [],
            dispatchSignal: (type, payload) => {
                const newSignal: Signal = {
                    id: crypto.randomUUID(),
                    type,
                    payload,
                    timestamp: Date.now()
                };

                // Keep only last 50 signals to prevent memory leaks
                set(state => ({
                    signals: [newSignal, ...state.signals].slice(0, 50)
                }));

                console.log(`[SIGNAL BUS] Dispatched: ${type}`, payload);
            },
        }),
        {
            name: 'astra-main-store',
        }
    )
);
