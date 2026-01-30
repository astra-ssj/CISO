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

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
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

    // Actions
    addDecisionRequest: (request: Omit<DecisionRequest, 'id' | 'status'>) => void;
    resolveDecision: (id: string, outcome: 'APPROVED' | 'DENIED', reason: string) => void;
    updateDecisionAnalysis: (id: string, results: any) => void;
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

            addDecisionRequest: (request) => set((state) => ({
                decisionQueue: [
                    ...state.decisionQueue,
                    { ...request, id: `REQ-${Date.now()}`, status: 'PENDING' }
                ]
            })),

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

            updateComplianceScore: (score) => set({ complianceScore: score }),

            // Simulated NLP Logic
            sendQuery: (query) => {
                const state = get();
                const userMsg: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: query,
                    timestamp: Date.now()
                };

                set(s => ({ chatHistory: [...s.chatHistory, userMsg] }));

                // Simulating "Thinking" delay
                setTimeout(() => {
                    let responseText = "I'm not sure I understand that command. Try asking about 'compliance', 'risks', or 'status'.";
                    const lowerQuery = query.toLowerCase();

                    if (lowerQuery.includes('status') || lowerQuery.includes('health')) {
                        responseText = `System status is currently ${state.systemStatus}. All core security services are operational.`;
                    } else if (lowerQuery.includes('compliance') || lowerQuery.includes('score')) {
                        responseText = `Current Compliance Score is ${state.complianceScore}%. We are tracking against ${state.activeStandards.join(', ')}.`;
                    } else if (lowerQuery.includes('risk') || lowerQuery.includes('threat')) {
                        responseText = `I have detected ${state.activeThreats} active threat(s). ${state.activeThreats > 0 ? 'Review the AppSec dashboard immediately.' : 'No immediate action required.'}`;
                    } else if (lowerQuery.includes('audit') || lowerQuery.includes('protocol')) {
                        responseText = "To initiate a new audit or protocol, please use the 'Initiate Protocol' button in the Command Center. I will enforce ISO 27001 checklists on the request.";
                    } else if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
                        responseText = "Greetings. I am ready to assist with security governance decisions.";
                    }

                    const aiMsg: ChatMessage = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: responseText,
                        timestamp: Date.now()
                    };

                    set(s => ({ chatHistory: [...s.chatHistory, aiMsg] }));
                }, 600);
            },

            clearChat: () => set({ chatHistory: [] }),

            currentUser: null,
            isAuthenticated: false,

            login: (role = 'CISO') => set({
                isAuthenticated: true,
                currentUser: {
                    name: role === 'CISO' ? 'Chief Information Security Officer' : 'Security Architect',
                    role: role
                }
            }),

            logout: () => set({ isAuthenticated: false, currentUser: null })
        }),
        {
            name: 'astra-main-store',
        }
    )
);
