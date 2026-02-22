import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ComplianceStandard = 'ISO_27001' | 'NIST_CSF' | 'SOC2' | 'GDPR' | 'NIS2' | 'EU_AI_ACT';

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

export interface KeyResult {
    id: string;
    description: string;
    progress: number; // 0-100
    target: number;
    current: number;
    unit: string;
}

export interface OKR {
    id: string;
    title: string;
    description: string;
    status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';
    progress: number; // Calculated from KRs
    keyResults: KeyResult[];
}

export interface KPI {
    id: string;
    title: string;
    value: number;
    target: number;
    unit: string;
    trend: 'up' | 'down' | 'neutral';
    status: 'success' | 'warning' | 'danger';
}

// Native CISO AI Assistant — chat messages (no OpenClaw)
export type ChatMessageRole = 'user' | 'assistant' | 'system';
export interface ChatMessage {
    id: string;
    role: ChatMessageRole;
    content: string;
    timestamp: number;
}

interface AstraState {
    // Global Posture
    systemStatus: 'NOMINAL' | 'DEGRADED' | 'UNDER_ATTACK';
    complianceScore: number;
    activeThreats: number;

    // Context
    activeStandards: ComplianceStandard[];
    decisionQueue: DecisionRequest[];
    chatHistory: ChatMessage[];
    okrs: OKR[];
    kpis: KPI[];

    // Actions
    addDecisionRequest: (request: Omit<DecisionRequest, 'id' | 'status'>) => void;
    resolveDecision: (id: string, outcome: 'APPROVED' | 'DENIED', reason: string) => void;
    updateDecisionAnalysis: (id: string, results: DecisionAnalysisResults) => void;
    triggerAnalysis: (id: string, request: DecisionRequest) => Promise<void>; // New Async Action
    updateComplianceScore: (score: number) => void;
    sendQuery: (query: string) => void;
    clearChat: () => void;

    // Strategy Actions
    addOKR: (okr: Omit<OKR, 'id' | 'progress'>) => void;
    updateOKR: (id: string, updates: Partial<OKR>) => void;
    deleteOKR: (id: string) => void;
    addKeyResult: (okrId: string, kr: Omit<KeyResult, 'id'>) => void;
    updateKeyResult: (okrId: string, krId: string, updates: Partial<KeyResult>) => void;
    addKPI: (kpi: Omit<KPI, 'id'>) => void;
    updateKPI: (id: string, updates: Partial<KPI>) => void;
    deleteKPI: (id: string) => void;
    // Auth
    // Auth & RBAC (roles aligned with NextAuth / src/lib/auth/rbac)
    currentUser: {
        name: string;
        role: 'CISO' | 'SEC_ENGINEER' | 'AUDITOR' | 'VIEWER';
    } | null;
    isAuthenticated: boolean;
    login: (role?: 'CISO' | 'SEC_ENGINEER' | 'AUDITOR' | 'VIEWER', name?: string) => void;
    logout: () => void;

    // UI State
    isChatOpen: boolean;
    setChatOpen: (isOpen: boolean) => void;

    // Signal Bus
    signals: Signal[];
    dispatchSignal: (type: string, payload: unknown) => void;
}

export interface Signal {
    id: string;
    type: string;
    payload: unknown;
    timestamp: number;
}

export interface DecisionAnalysisResults {
    riskScore: number;
    flaggedKeywords: string[];
    complianceGaps: string[];
    recommendedActions?: string[];
    generatedArtifacts?: DecisionRequest['generatedArtifacts'];
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
            okrs: [
                {
                    id: 'OKR-1',
                    title: 'Achieve Zero Trust Architecture',
                    description: 'Implement full ZTA across all critical infrastructure by Q4.',
                    status: 'ON_TRACK',
                    progress: 45,
                    keyResults: [
                        { id: 'KR-1', description: 'Deploy mTLS to all microservices', progress: 60, current: 60, target: 100, unit: '%' },
                        { id: 'KR-2', description: 'Enforce device posture checks', progress: 30, current: 300, target: 1000, unit: 'users' }
                    ]
                }
            ],
            kpis: [
                { id: 'KPI-1', title: 'Mean Time to Remediation', value: 4.5, target: 4.0, unit: 'hrs', trend: 'down', status: 'warning' },
                { id: 'KPI-2', title: 'Security Training Coverage', value: 92, target: 95, unit: '%', trend: 'up', status: 'success' },
                { id: 'KPI-3', title: 'Cloud Misconfigurations', value: 12, target: 0, unit: 'count', trend: 'down', status: 'success' },
                { id: 'KPI-4', title: 'Vendor Risk Score', value: 68, target: 80, unit: '/100', trend: 'neutral', status: 'warning' },
            ],

            // OKR Actions
            addOKR: (okr) => set(state => ({
                okrs: [...state.okrs, { ...okr, id: `OKR-${Date.now()}`, progress: 0 }]
            })),

            updateOKR: (id, updates) => set(state => ({
                okrs: state.okrs.map(o => o.id === id ? { ...o, ...updates } : o)
            })),

            deleteOKR: (id) => set(state => ({
                okrs: state.okrs.filter(o => o.id !== id)
            })),

            addKeyResult: (okrId, kr) => set(state => ({
                okrs: state.okrs.map(o => {
                    if (o.id !== okrId) return o;
                    const newKR = { ...kr, id: `KR-${Date.now()}` };
                    const updatedKRs = [...o.keyResults, newKR];
                    // Recalculate progress
                    const totalProgress = updatedKRs.reduce((acc, k) => acc + k.progress, 0);
                    return {
                        ...o,
                        keyResults: updatedKRs,
                        progress: Math.round(totalProgress / updatedKRs.length)
                    };
                })
            })),

            updateKeyResult: (okrId, krId, updates) => set(state => ({
                okrs: state.okrs.map(o => {
                    if (o.id !== okrId) return o;
                    const updatedKRs = o.keyResults.map(k => k.id === krId ? { ...k, ...updates } : k);
                    const totalProgress = updatedKRs.reduce((acc, k) => acc + k.progress, 0);
                    return {
                        ...o,
                        keyResults: updatedKRs,
                        progress: Math.round(totalProgress / updatedKRs.length)
                    };
                })
            })),

            // KPI Actions
            addKPI: (kpi) => set(state => ({
                kpis: [...state.kpis, { ...kpi, id: `KPI-${Date.now()}` }]
            })),

            updateKPI: (id, updates) => set(state => ({
                kpis: state.kpis.map(k => k.id === id ? { ...k, ...updates } : k)
            })),

            deleteKPI: (id) => set(state => ({
                kpis: state.kpis.filter(k => k.id !== id)
            })),

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

            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reason is part of public API
            resolveDecision: (id, outcome, _reason) => set((state) => ({
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

            // Native CISO AI Assistant — single request/response to /api/agent/chat
            sendQuery: async (query) => {
                const state = get();
                const userMsg: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: query,
                    timestamp: Date.now()
                };

                const historyForApi = state.chatHistory.slice(-20).map(m => ({ role: m.role, content: m.content }));
                set(s => ({ chatHistory: [...s.chatHistory, userMsg] }));

                const assistantPlaceholder: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: '',
                    timestamp: Date.now()
                };
                set(s => ({ chatHistory: [...s.chatHistory, assistantPlaceholder] }));

                try {
                    const response = await fetch('/api/agent/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: query,
                            history: historyForApi,
                            context: {
                                page: typeof window !== 'undefined' ? window.location.pathname : 'Dashboard',
                                userRole: state.currentUser?.role ?? 'CISO',
                                systemStatus: state.systemStatus,
                                complianceScore: state.complianceScore,
                                activeThreats: state.activeThreats,
                                activeStandards: state.activeStandards,
                                recentRiskScores: state.decisionQueue.slice(0, 5).map(d => d.analysis?.riskScore).filter(Boolean)
                            }
                        })
                    });

                    const data = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        const errMsg = data?.error || response.statusText || 'Request failed';
                        set(s => ({
                            chatHistory: s.chatHistory.map(msg =>
                                msg.id === assistantPlaceholder.id
                                    ? { ...msg, content: errMsg }
                                    : msg
                            )
                        }));
                        return;
                    }

                    set(s => ({
                        chatHistory: s.chatHistory.map(msg =>
                            msg.id === assistantPlaceholder.id
                                ? { ...msg, content: data.content ?? '' }
                                : msg
                        )
                    }));
                } catch (err) {
                    const errMsg = err instanceof Error ? err.message : 'Network error';
                    set(s => ({
                        chatHistory: s.chatHistory.map(msg =>
                            msg.id === assistantPlaceholder.id
                                ? { ...msg, content: `Unable to reach the AI assistant. ${errMsg}` }
                                : msg
                        )
                    }));
                }
            },

            clearChat: () => set({ chatHistory: [] }),

            currentUser: null,
            isAuthenticated: false,

            // Local UI state only; actual auth is NextAuth. Sync from useSession() where needed.
            login: (role = 'CISO', name?: string) => {
                const labels: Record<string, string> = {
                    CISO: 'Chief Information Security Officer',
                    SEC_ENGINEER: 'Security Engineer',
                    AUDITOR: 'Compliance Auditor',
                    VIEWER: 'Viewer',
                };
                set({
                    isAuthenticated: true,
                    currentUser: {
                        name: name ?? labels[role] ?? role,
                        role: role as 'CISO' | 'SEC_ENGINEER' | 'AUDITOR' | 'VIEWER'
                    }
                });
            },

            logout: () => {
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
