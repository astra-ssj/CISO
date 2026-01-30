import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StepType = 'CHECKBOX' | 'TEXT_INPUT' | 'Manual_ACTION';

export interface PlaybookStep {
    id: string;
    instruction: string;
    type: StepType;
    isCompleted: boolean;
    evidence?: string;
}

export interface PlaybookPhase {
    id: string;
    title: string;
    steps: PlaybookStep[];
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface Playbook {
    id: string;
    title: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    phases: PlaybookPhase[];
    startTime?: number; // Timestamp when started
    endTime?: number;
    status: 'READY' | 'ACTIVE' | 'RESOLVED';
    evidenceLog: { timestamp: number; message: string }[];
}

interface PlaybookState {
    playbooks: Playbook[];
    activePlaybookId: string | null;
    startPlaybook: (id: string) => void;
    resolvePlaybook: (id: string) => void;
    toggleStep: (playbookId: string, phaseId: string, stepId: string, evidence?: string) => void;
    logEvidence: (playbookId: string, message: string) => void;
    resetPlaybook: (id: string) => void;
    createPlaybook: (playbook: Playbook) => void;
}

const MOCKED_PLAYBOOKS: Playbook[] = [
    {
        id: 'pb-ransomware',
        title: 'Ransomware Response Protocol',
        description: 'Standard operating procedure for containment and eradication of ransomware infections.',
        severity: 'CRITICAL',
        status: 'READY',
        evidenceLog: [],
        phases: [
            {
                id: 'phase-1',
                title: '1. Identification & Analysis',
                status: 'PENDING',
                steps: [
                    { id: '1.1', instruction: 'Isolate affected systems from the network immediately (Unplug/Disable NIC).', type: 'CHECKBOX', isCompleted: false },
                    { id: '1.2', instruction: 'Determine the scope of infection (identify patient zero).', type: 'TEXT_INPUT', isCompleted: false },
                    { id: '1.3', instruction: 'Capture RAM and disk images for forensics if possible before reboot.', type: 'CHECKBOX', isCompleted: false },
                    { id: '1.4', instruction: 'Identify the ransomware variant using ID Ransomware or crypto-sheriff.', type: 'TEXT_INPUT', isCompleted: false }
                ]
            },
            {
                id: 'phase-2',
                title: '2. Containment',
                status: 'PENDING',
                steps: [
                    { id: '2.1', instruction: 'Disable compromised user accounts (AD/IDP).', type: 'CHECKBOX', isCompleted: false },
                    { id: '2.2', instruction: 'Block command-and-control (C2) domains at firewall/DNS.', type: 'CHECKBOX', isCompleted: false },
                    { id: '2.3', instruction: 'Reset passwords for all privileged accounts.', type: 'CHECKBOX', isCompleted: false }
                ]
            },
            {
                id: 'phase-3',
                title: '3. Eradication & Recovery',
                status: 'PENDING',
                steps: [
                    { id: '3.1', instruction: 'Wipe and re-image infected machines from known good media.', type: 'CHECKBOX', isCompleted: false },
                    { id: '3.2', instruction: 'Restore data from offline/immutable backups.', type: 'CHECKBOX', isCompleted: false },
                    { id: '3.3', instruction: 'Patch the vulnerability (e.g., RDP, Phishing vector) used for entry.', type: 'TEXT_INPUT', isCompleted: false }
                ]
            }
        ]
    },
    {
        id: 'pb-ddos',
        title: 'DDoS Mitigation',
        description: 'Response plan for volumetric and application layer denial of service attacks.',
        severity: 'HIGH',
        status: 'READY',
        evidenceLog: [],
        phases: [
            {
                id: 'phase-1',
                title: '1. Assessment',
                status: 'PENDING',
                steps: [
                    { id: '1.1', instruction: 'Verify if traffic is attack or legitimate surge.', type: 'CHECKBOX', isCompleted: false },
                    { id: '1.2', instruction: 'Identify attack vector (Volumetric, Protocol, or App Layer).', type: 'TEXT_INPUT', isCompleted: false }
                ]
            },
            {
                id: 'phase-2',
                title: '2. Mitigation',
                status: 'PENDING',
                steps: [
                    { id: '2.1', instruction: 'Enable WAF "Under Attack" mode.', type: 'CHECKBOX', isCompleted: false },
                    { id: '2.2', instruction: 'Contact ISP/Scrubbing Center for upstream mitigation.', type: 'CHECKBOX', isCompleted: false },
                    { id: '2.3', instruction: 'Rate limit API endpoints.', type: 'CHECKBOX', isCompleted: false }
                ]
            }
        ]
    },
    {
        id: 'pb-phishing',
        title: 'Phishing Campaign Response',
        description: 'Process to identify, block, and educate users targeted by phishing.',
        severity: 'MEDIUM',
        status: 'READY',
        evidenceLog: [],
        phases: [
            {
                id: 'phase-1',
                title: '1. Analysis',
                status: 'PENDING',
                steps: [
                    { id: '1.1', instruction: 'Collect email headers and attachment samples.', type: 'CHECKBOX', isCompleted: false },
                    { id: '1.2', instruction: 'Check if any users clicked the link or opened payload.', type: 'TEXT_INPUT', isCompleted: false }
                ]
            },
            {
                id: 'phase-2',
                title: '2. Remediation',
                status: 'PENDING',
                steps: [
                    { id: '2.1', instruction: 'Purge email from all inboxes (Exchange/GSuite).', type: 'CHECKBOX', isCompleted: false },
                    { id: '2.2', instruction: 'Block sender domain and URL at gateway.', type: 'CHECKBOX', isCompleted: false },
                    { id: '2.3', instruction: 'Force password reset for compromised users.', type: 'CHECKBOX', isCompleted: false }
                ]
            }
        ]
    },
    {
        id: 'pb-insider',
        title: 'Insider Threat Protocol',
        description: 'Handling suspicious employee activity, data exfiltration, or privilege abuse.',
        severity: 'CRITICAL',
        status: 'READY',
        evidenceLog: [],
        phases: [
            {
                id: 'phase-1',
                title: '1. Detection & Monitoring',
                status: 'PENDING',
                steps: [
                    { id: '1.1', instruction: 'Preserve logs (DLP, Access, Endpoint). do NOT alert the user.', type: 'CHECKBOX', isCompleted: false },
                    { id: '1.2', instruction: 'Notify Legal and HR immediately.', type: 'CHECKBOX', isCompleted: false }
                ]
            },
            {
                id: 'phase-2',
                title: '2. Containment',
                status: 'PENDING',
                steps: [
                    { id: '2.1', instruction: 'Revoke all system access tokens.', type: 'CHECKBOX', isCompleted: false },
                    { id: '2.2', instruction: 'Seize physical assets (Laptop, Mobile).', type: 'CHECKBOX', isCompleted: false }
                ]
            }
        ]
    }
];

export const usePlaybookStore = create<PlaybookState>()(
    persist(
        (set, get) => ({
            playbooks: MOCKED_PLAYBOOKS,
            activePlaybookId: null,

            startPlaybook: (id) => set((state) => ({
                activePlaybookId: id,
                playbooks: state.playbooks.map(p =>
                    p.id === id ? { ...p, status: 'ACTIVE', startTime: Date.now() } : p
                )
            })),

            resolvePlaybook: (id) => set((state) => ({
                activePlaybookId: null,
                playbooks: state.playbooks.map(p =>
                    p.id === id ? { ...p, status: 'RESOLVED', endTime: Date.now() } : p
                )
            })),

            resetPlaybook: (id) => set((state) => ({
                playbooks: state.playbooks.map(p =>
                    p.id === id ? MOCKED_PLAYBOOKS.find(mp => mp.id === id)! : p
                )
            })),

            createPlaybook: (playbook) => set((state) => ({
                playbooks: [...state.playbooks, playbook]
            })),

            toggleStep: (playbookId, phaseId, stepId, evidence) => set((state) => ({
                playbooks: state.playbooks.map(p => {
                    if (p.id !== playbookId) return p;
                    return {
                        ...p,
                        phases: p.phases.map(phase => {
                            if (phase.id !== phaseId) return phase;

                            // Check if all steps in this phase are complete to update phase status
                            const updatedSteps = phase.steps.map(s =>
                                s.id === stepId ? { ...s, isCompleted: !s.isCompleted, evidence: evidence || s.evidence } : s
                            );

                            const allComplete = updatedSteps.every(s => s.isCompleted);

                            return {
                                ...phase,
                                steps: updatedSteps,
                                status: allComplete ? 'COMPLETED' : 'IN_PROGRESS'
                            };
                        })
                    };
                })
            })),

            logEvidence: (playbookId, message) => set((state) => ({
                playbooks: state.playbooks.map(p =>
                    p.id === playbookId ? {
                        ...p,
                        evidenceLog: [...p.evidenceLog, { timestamp: Date.now(), message }]
                    } : p
                )
            })),
        }),
        {
            name: 'astra-playbook-store'
        }
    )
);
