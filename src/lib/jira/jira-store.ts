import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TicketTemplate, TicketCategory } from './jira-templates';

export type TicketSyncStatus = 'LOCAL' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface Ticket {
    id: string;
    templateId: string;
    category: TicketCategory;
    summary: string;
    description: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    labels: string[];
    issueType: string;
    assignee: string;
    customFields: {
        riskLevel?: string;
        complianceFrameworks?: string[];
        estimatedEffort?: string;
        impactArea?: string;
        dueWithin?: string;
    };
    status: 'DRAFT' | 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    syncStatus: TicketSyncStatus;
    jiraKey?: string;           // e.g., SEC-123
    createdAt: string;
    updatedAt: string;
}

interface JiraStoreState {
    // Data
    tickets: Ticket[];
    jiraConfig: {
        baseUrl: string;
        projectKey: string;
        isConnected: boolean;
    };

    // Actions
    createTicketFromTemplate: (template: TicketTemplate, overrides?: Partial<Pick<Ticket, 'summary' | 'description' | 'priority' | 'assignee'>>) => string;
    updateTicket: (id: string, updates: Partial<Ticket>) => void;
    deleteTicket: (id: string) => void;
    submitTicket: (id: string) => void;
    updateSyncStatus: (id: string, status: TicketSyncStatus, jiraKey?: string) => void;
    setJiraConfig: (config: Partial<JiraStoreState['jiraConfig']>) => void;
}

export const useJiraStore = create<JiraStoreState>()(
    persist(
        (set, get) => ({
            tickets: [],
            jiraConfig: {
                baseUrl: '',
                projectKey: 'SEC',
                isConnected: false,
            },

            createTicketFromTemplate: (template, overrides) => {
                const id = `TKT-${Date.now()}`;
                const now = new Date().toISOString();

                const ticket: Ticket = {
                    id,
                    templateId: template.id,
                    category: template.category,
                    summary: overrides?.summary || template.summary,
                    description: overrides?.description || template.description,
                    priority: overrides?.priority || template.priority,
                    labels: [...template.labels],
                    issueType: template.issueType,
                    assignee: overrides?.assignee || template.suggestedAssignee || 'Unassigned',
                    customFields: { ...template.customFields },
                    status: 'DRAFT',
                    syncStatus: 'LOCAL',
                    createdAt: now,
                    updatedAt: now,
                };

                set(state => ({
                    tickets: [ticket, ...state.tickets],
                }));

                return id;
            },

            updateTicket: (id, updates) => set(state => ({
                tickets: state.tickets.map(t =>
                    t.id === id
                        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                        : t
                ),
            })),

            deleteTicket: (id) => set(state => ({
                tickets: state.tickets.filter(t => t.id !== id),
            })),

            submitTicket: (id) => set(state => ({
                tickets: state.tickets.map(t =>
                    t.id === id
                        ? { ...t, status: 'SUBMITTED' as const, updatedAt: new Date().toISOString() }
                        : t
                ),
            })),

            updateSyncStatus: (id, status, jiraKey) => set(state => ({
                tickets: state.tickets.map(t =>
                    t.id === id
                        ? { ...t, syncStatus: status, jiraKey: jiraKey || t.jiraKey, updatedAt: new Date().toISOString() }
                        : t
                ),
            })),

            setJiraConfig: (config) => set(state => ({
                jiraConfig: { ...state.jiraConfig, ...config },
            })),
        }),
        {
            name: 'astra-jira-store',
        }
    )
);
